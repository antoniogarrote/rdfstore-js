var nextTick = (function () {

    var global = null;
    if(typeof window !== 'undefined')
        global = window;
    else if(typeof process !== 'undefined')
        global = process;


    var canSetImmediate = typeof global !== 'undefined' && global.setImmediate;
    var canPost = typeof global !== 'undefined' && global.postMessage && global.addEventListener;

    // setImmediate
    if (canSetImmediate)
        return function (f) { return global.setImmediate(f) };

    // Node.js specific
    if(global !== 'undefined' && global.nextTick && typeof require === 'function') {
        if(require('timers') && require('timers').setImmediate)
            return require('timers').setImmediate;
        else
            return global.nextTick;
    }

    // postMessage
    if (canPost) {
        var queue = [];
        global.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === global || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);
        return function nextTick(fn) {
            queue.push(fn);
            global.postMessage('process-tick', '*');
        };
    }


    // setTimeout
    return function nextTick(fn) {
        setTimeout(fn, 0);
    };

})();

/**
 * Function that generates a hash key for a bound term.
 * @param term
 * @returns {*}
 */
var hashTerm = function(term) {
    try {
        if(term == null) {
            return "";
        } if(term.token==='uri') {
            return "u"+term.value;
        } else if(term.token === 'blank') {
            return "b"+term.value;
        } else if(term.token === 'literal') {
            var l = "l"+term.value;
            l = l + (term.type || "");
            l = l + (term.lang || "");

            return l;
        }
    } catch(e) {
        if(typeof(term) === 'object') {
            var key = "";
            for(p in term) {
                key = key + p + term[p];
            }

            return key;
        }
        return term;
    }
};

/**
 * Returns a String with the lexical representation of a URI term.
 * @param term the URI term to be transformed into a String representation.
 * @param env Repository of the prefixes where th prefix of the URI will be resolved.
 * @returns the lexical representation of the URI term.
 */
var lexicalFormBaseUri = function(term, env) {
    var uri = null;
    env = env || {};
    if(term.value == null) {
        // URI has prefix and suffix, we'll try to resolve it.
        var prefix = term.prefix;
        var suffix = term.suffix;
        var resolvedPrefix = env.namespaces[prefix];
        if(resolvedPrefix != null) {
            uri = resolvedPrefix+suffix;
        } else {
            uri = prefix+":"+suffix;
        }
    } else {
        // URI is not prefixed
        uri = term.value;
    }

    if(uri===null) {
        return null;
    } else {
        // Should we apply the base URI namespace?
        if(uri.indexOf(":") == -1) {
            uri = (env.base||"") + uri; // applyBaseUri
        }
    }

    return uri;
};


parseISO8601 = function (str) {
    return Date.parse(str);
};

if (!Date.prototype.toISOString) {
    (function() {

        function pad(number) {
            if (number < 10) {
                return '0' + number;
            }
            return number;
        }

        Date.prototype.toISOString = function() {
            return this.getUTCFullYear() +
                '-' + pad(this.getUTCMonth() + 1) +
                '-' + pad(this.getUTCDate()) +
                'T' + pad(this.getUTCHours()) +
                ':' + pad(this.getUTCMinutes()) +
                ':' + pad(this.getUTCSeconds()) +
                '.' + (this.getUTCMilliseconds() / 1000).toFixed(3).slice(2, 5) +
                'Z';
        };

    }());
}

iso8601 = function(date) {
    return date.toISOString();
};

compareDateComponents = function(stra,strb) {
    var dateA = parseISO8601(stra);
    var dateB = parseISO8601(strb);

    if(dateA == dateB) {
        return 0;
    } else if(dateA < dateB) {
        return -1;
    } else {
        return 1;
    }
};

lexicalFormLiteral = function(term, env) {
    var value = term.value;
    var lang = term.lang;
    var type = term.type;

    var indexedValue = null;
    if(value != null && type != null && typeof(type) != 'string') {
        var typeValue = type.value;

        if(typeValue == null) {
            var typePrefix = type.prefix;
            var typeSuffix = type.suffix;

            var resolvedPrefix = env.namespaces[typePrefix];
            term.type = resolvedPrefix+typeSuffix;
            typeValue = resolvedPrefix+typeSuffix;
        }
        // normalization
        if(typeValue.indexOf('hexBinary') != -1) {
            indexedValue = '"' + term.value.toLowerCase() + '"^^<' + typeValue + '>';
        } else {
            indexedValue = '"' + term.value + '"^^<' + typeValue + '>';
        }
    } else {
        if(lang == null && type == null) {
            indexedValue = '"' + value + '"';
        } else if(type == null) {
            indexedValue = '"' + value + '"' + "@" + lang;
        } else {
            // normalization
            if(type.indexOf('hexBinary') != -1) {
                indexedValue = '"' + term.value.toLowerCase() + '"^^<'+type+'>';
            } else {
                indexedValue = '"' + term.value + '"^^<'+type+'>';
            }
        }
    }
    return indexedValue;
};

normalizeUnicodeLiterals = function (string) {
    var escapedUnicode = string.match(/\\u[0-9abcdefABCDEF]{4,4}/g) || [];
    var dups = {};
    for (var i = 0; i < escapedUnicode.length; i++) {
        if (dups[escapedUnicode[i]] == null) {
            dups[escapedUnicode[i]] = true;
            string = string.replace(new RegExp("\\" + escapedUnicode[i], "g"), eval("'" + escapedUnicode[i] + "'"));
        }
    }

    return string;
};

registerIndexedDB = function(that) {
    if(typeof(window) === 'undefined') {
        var sqlite3 = require('sqlite3')
        var indexeddbjs = require("indexeddb-js");
        var engine    = new sqlite3.Database(':memory:');
        var scope     = indexeddbjs.makeScope('sqlite3', engine);
        that.indexedDB = scope.indexedDB;
        that.IDBKeyRange = scope.IDBKeyRange;
    } else {
        // In the following line, you should include the prefixes of implementations you want to test.
        window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
        window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
        // DON'T use "var indexedDB = ..." if you're not in a function.
        // Moreover, you may need references to some window.IDB* objects:
        if (!window.indexedDB) {
            callback(null,new Error("The browser does not support IndexDB."));
        } else {
            that.indexedDB = window.indexedDB;
            that.IDBKeyRange = window.IDBKeyRange;
        }
    }
};

function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}

hashTerm = function(term) {
    try {
        if(term == null) {
            return "";
        } if(term.token==='uri') {
            return "u"+term.value;
        } else if(term.token === 'blank') {
            return "b"+term.value;
        } else if(term.token === 'literal') {
            var l = "l"+term.value;
            l = l + (term.type || "");
            l = l + (term.lang || "");

            return l;
        }
    } catch(e) {
        if(typeof(term) === 'object') {
            var key = "";
            for(p in term) {
                key = key + p + term[p];
            }

            return key;
        }
        return term;
    }
};

var reject = function(xs,p) {
    var acc = [];
    for(var i=0; i<xs.length; i++) {
        if(p(xs[i])) {
            acc.push(xs[i]);
        }
    }

    return acc;
};

var include = function(xs,p) {
    for(var i=0; i<xs.length; i++){
        if(xs[i] === p)
            return true;
    }

    return false;
};

var each = function(xs,f) {
    if(xs.forEach) {
        xs.forEach(f);
    } else {
        for (var i = 0; i < xs.length; i++)
            f(xs[i]);
    }
};

var map = function(xs,f) {
    if(xs.map) {
        return xs.map(f);
    } else {
        var acc = [];
        for (var i = 0; i < xs.length; i++)
            acc[i] = f(xs[i]);

        return acc;
    }
};

var keys = function(xs) {
    var acc = [];
    for(var p in xs)
        acc.push(p);
    return acc;
};

var values = function(xs) {
    var acc = [];
    for(var p in xs)
        acc.push(xs[p]);
    return acc;
};

var size = function(xs) {
    if(xs.length) {
        return xs.length;
    } else {
        var acc = 0;
        for(var p in xs)
            acc++;
        return acc;
    }
};

clone = function(value) {
    return JSON.parse(JSON.stringify(value));
};

var isObject = function(value) {
    // Avoid a V8 JIT bug in Chrome 19-20.
    // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
    var type = typeof value;
    return type == 'function' || (value && type == 'object') || false;
};


var create = (function() {
    function Object() {}
    return function(prototype) {
        if (isObject(prototype)) {
            Object.prototype = prototype;
            var result = new Object;
            Object.prototype = null;
        }
        return result || Object();
    };
}());

var whilst = function (test, iterator, callback) {
    if (test()) {
        iterator(function (err) {
            if (err) {
                return callback(err);
            }
            whilst(test, iterator, callback);
        });
    }
    else {
        callback();
    }
};


var eachSeries = function (arr, iterator, callback) {
    callback = callback || function () {};
    if (!arr.length) {
        return callback();
    }
    var completed = 0;
    var iterate = function () {
        iterator(arr[completed], function (err) {
            if (err) {
                callback(err);
                callback = function () {};
            }
            else {
                completed += 1;
                if (completed >= arr.length) {
                    callback();
                }
                else {
                    iterate();
                }
            }
        });
    };
    iterate();
};


var reduce = function (arr, memo, iterator, callback) {
    eachSeries(arr, function (x, callback) {
        iterator(memo, x, function (err, v) {
            memo = v;
            callback(err);
        });
    }, function (err) {
        callback(err, memo);
    });
};

var seq = function (/* functions... */) {
    var fns = arguments;
    return function () {
        var that = this;
        var args = Array.prototype.slice.call(arguments);
        var callback = args.pop();
        reduce(fns, args, function (newargs, fn, cb) {
                fn.apply(that, newargs.concat([function () {
                    var err = arguments[0];
                    var nextargs = Array.prototype.slice.call(arguments, 1);
                    cb(err, nextargs);
                }]))
            },
            function (err, results) {
                callback.apply(that, [err].concat(results));
            });
    };
};



module.exports = {
    nextTick: nextTick,
    hasTerm: hashTerm,
    lexicalFormBaseUri: lexicalFormBaseUri,
    parseISO8601: parseISO8601,
    compareDateComponents: compareDateComponents,
    iso8601: iso8601,
    normalizeUnicodeLiterals: normalizeUnicodeLiterals,
    lexicalFormLiteral: lexicalFormLiteral,
    registerIndexedDB: registerIndexedDB,
    guid: guid,
    hashTerm: hashTerm,
    keys: keys,
    values: values,
    size: size,
    map: map,
    each: each,
    forEach: each,
    include: include,
    reject: reject,
    remove: reject,
    clone: clone,
    create: create,
    whilst: whilst,
    eachSeries: eachSeries,
    seq: seq
};
