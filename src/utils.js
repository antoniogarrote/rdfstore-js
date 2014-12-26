var moment = require('moment');

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
    return moment(str).toDate();
};

iso8601 = function(date) {
    return moment(date).toISOString();
};

compareDateComponents = function(stra,strb) {
    var dateA = moment(stra);
    var dateB = moment(strb);

    if(dateA.isSame(dateB)) {
        return 0;
    } else if(dateA.isBefore(dateB)) {
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




module.exports = {
    nextTick: nextTick,
    hasTerm: hashTerm,
    lexicalFormBaseUri: lexicalFormBaseUri,
    parseISO8601: parseISO8601,
    compareDateComponents: compareDateComponents,
    iso8601: iso8601,
    normalizeUnicodeLiterals: normalizeUnicodeLiterals,
    lexicalFormLiteral: lexicalFormLiteral
};