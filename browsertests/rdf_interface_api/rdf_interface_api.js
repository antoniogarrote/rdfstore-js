(function() {

var Utils = {};



Utils['extends'] = function(supertype, descendant) {
    descendant.prototype = new supertype();
};


Utils.stackCounterLimit = 1000;
Utils.stackCounter = 0;

Utils.recur = function(c){
    if(Utils.stackCounter === Utils.stackCounterLimit) {
        Utils.stackCounter = 0;
        setTimeout(c, 0);
    } else {
        Utils.stackCounter++;
        c();
    } 
};

Utils.clone = function(o) {
    return JSON.parse(JSON.stringify(o));
};

Utils.shuffle = function(o){ //v1.0
    for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x){};
    return o;
};

Utils.include = function(a,v) {
    var cmp = arguments[2];

    for(var i=(a.length-1); i>=0; i--) {
        var res = false;
        if(cmp == null) {
            res = (a[i] === v);
        } else {
            res = (cmp(a[i],v) === 0);
        }

        if(res === true) {
            return true;
        }
    }

    return false;
};

Utils.remove = function(a,v) {
    var acum = [];
    for(var i=0; i<a.length; i++) {
        if(a[i] !== v) {
            acum.push(a[i]);
        }
    }

    return acum;
};

Utils.repeat = function(c,max,floop,fend,env) {
    if(arguments.length===4) { env = {}; }
    if(c<max) {
        env._i = c;
        floop(function(floop,env){
            // avoid stack overflow
            // deadly hack
            Utils.recur(function(){ Utils.repeat(c+1, max, floop, fend, env); });
        },env);
    } else {
        fend(env);
    }
};


Utils.meanwhile = function(c,floop,fend,env) {
    if(arguments.length===3) { env = {}; }

    if(env['_stack_counter'] == null) {
        env['_stack_counter'] = 0;
    }

    if(c===true) {
        floop(function(c,floop,env){
            if(env['_stack_counter'] % 40 == 39) {
                env['_stack_counter'] = env['_stack_counter'] + 1;
                setTimeout(function(){ Utils.neanwhile(c, floop, fend, env); }, 0);
            } else {
                env['_stack_counter'] = env['_stack_counter'] + 1;
                Utils.meanwhile(c, floop, fend, env);
            }
        },env);
    } else {
        fend(env);
    }
};

Utils.seq = function() {
    var fs = arguments;
    return function(callback) {
        Utils.repeat(0, fs.length, function(k,env){
            var floop = arguments.callee;
            fs[env._i](function(){
                k(floop, env);
            });
        }, function(){
            callback();
        });
    };
};


Utils.partition = function(c, n) {
    var rem = c.length % n;
    var currentGroup = [];
    for(var i=0; i<rem; i++) {
        currentGroup.push(null);
    }
    
    var groups = [];
    for(var i=0; i<c.length; i++) {
        currentGroup.push(c[i]);
        if(currentGroup.length % n == 0) {
            groups.push(currentGroup);
            currentGroup = [];
        }
    }
    return groups;
};

Utils.keys = function(obj) {
    var variables = [];
    for(var variable in obj) {
        variables.push(variable);
    }

    return variables;
};

Utils.iso8601 = function(date) {
    function pad(n){
        return n<10 ? '0'+n : n;
    }    
    return date.getUTCFullYear()+'-'
        + pad(date.getUTCMonth()+1)+'-'
        + pad(date.getUTCDate())+'T'
        + pad(date.getUTCHours())+':'
        + pad(date.getUTCMinutes())+':'
        + pad(date.getUTCSeconds())+'Z';
};


Utils.parseStrictISO8601 = function (str) {
    var regexp = "([0-9]{4})(-([0-9]{2})(-([0-9]{2})" +
        "(T([0-9]{2}):([0-9]{2})(:([0-9]{2})(\.([0-9]+))?)?" +
        "(Z|(([-+])([0-9]{2}):([0-9]{2})))?)?)?)?";
    var d = str.match(new RegExp(regexp));

    var offset = 0;
    var date = new Date(d[1], 0, 1);

    if (d[3]) {
        date.setMonth(d[3] - 1);
    } else {
        throw "missing ISO8061 component"
    }
    if (d[5]) {
        date.setDate(d[5]);
    } else {
        throw "missing ISO8061 component"
    }
    if (d[7]) {
        date.setHours(d[7]);
    } else {
        throw "missing ISO8061 component"
    }
    if (d[8]) {
        date.setMinutes(d[8]);
    } else {
        throw "missing ISO8061 component"
    }
    if (d[10]) {
        date.setSeconds(d[10]);
    } else {
        throw "missing ISO8061 component"
    }
    if (d[12]) {
        date.setMilliseconds(Number("0." + d[12]) * 1000);
    }
    if (d[14]) {
        offset = (Number(d[16]) * 60) + Number(d[17]);
        offset *= ((d[15] == '-') ? 1 : -1);
    }

    offset -= date.getTimezoneOffset();
    var time = (Number(date) + (offset * 60 * 1000));
    var toReturn = new Date();
    toReturn.setTime(Number(time));
    return toReturn;
};


Utils.parseISO8601 = function (str) {
    var regexp = "([0-9]{4})(-([0-9]{2})(-([0-9]{2})" +
        "(T([0-9]{2}):([0-9]{2})(:([0-9]{2})(\.([0-9]+))?)?" +
        "(Z|(([-+])([0-9]{2}):([0-9]{2})))?)?)?)?";
    var d = str.match(new RegExp(regexp));

    var offset = 0;
    var date = new Date(d[1], 0, 1);

    if (d[3]) { date.setMonth(d[3] - 1); }
    if (d[5]) { date.setDate(d[5]);  }
    if (d[7]) { date.setHours(d[7]);  }
    if (d[8]) { date.setMinutes(d[8]);  }
    if (d[10]) { date.setSeconds(d[10]);  }
    if (d[12]) { date.setMilliseconds(Number("0." + d[12]) * 1000); }
    if (d[14]) {
        offset = (Number(d[16]) * 60) + Number(d[17]);
        offset *= ((d[15] == '-') ? 1 : -1);
    }

    offset -= date.getTimezoneOffset();
    var time = (Number(date) + (offset * 60 * 1000));
    var toReturn = new Date();
    toReturn.setTime(Number(time));
    return toReturn;
};

Utils.parseISO8601Components = function (str) {
    var regexp = "([0-9]{4})(-([0-9]{2}))(-([0-9]{2}))(T([0-9]{2}):([0-9]{2})(:([0-9]{2}))?(\.([0-9]+))?)?(Z|([-+])([0-9]{2})(:([0-9]{2}))?)?";
    var d = str.match(new RegExp(regexp));
    var year, month, date, hours, minutes, seconds, millisecs, timezone;
    year = Number(d[1]);
    month = d[3] - 1;
    date  = Number(d[5]);
    hours = Number(d[7]);
    minutes = Number(d[8]);
    seconds = Number(d[10]);

    if(d[12]) { millisecs = Number("0." + d[12]) * 1000; }

    if(d[13]==="Z") {
        timezone = 0;
    } else if (d[14]) {
        timezone = 0;
        if(d[17]) {
            timezone = Number(d[17]);
        }
        timezone = timezone+(Number(d[15]) * 60);
        timezone *= ((d[14] == '-') ? -1 : +1);
    } else if(d[14]==null && d[11]) {
        timezone = Number(d[12])*60;
    }    

    return {'year': isNaN(year) ? null : year,
            'month': isNaN(month) ? null : month,
            'date': isNaN(date) ? null : date,
            'hours': isNaN(hours) ? null : hours,
            'minutes': isNaN(minutes) ? null : minutes,
            'seconds': isNaN(seconds) ? null : seconds,
            'millisecs':isNaN(millisecs) ? null : millisecs,
            'timezone': isNaN(timezone) ? null : timezone};
};

Utils.compareDateComponents = function(stra,strb) {
    var a = Utils.parseISO8601Components(stra);
    var b = Utils.parseISO8601Components(strb);

    if((a.timezone == null && b.timezone == null) ||
       (a.timezone != null && b.timezone != null)) {        
        var da = Utils.parseISO8601(stra);
        var db = Utils.parseISO8601(strb);
        
        if(da.getTime() == db.getTime()) {
            return 0;
        } else if(da.getTime() < db.getTime()){
            return -1;
        } else {
            return 1;
        }
    } else if (a.timezone != null && b.timezone == null){
        da = Utils.parseISO8601(stra);
        db = Utils.parseISO8601(strb);
        var ta = da.getTime();
        var tb = db.getTime();

        var offset = 14*60*60;

        if(ta < tb && ta < (tb + offset)) {
            return -1;
        } else if(ta > tb && ta > (tb - offset)) {
            return 1;
        } else {
        return null;
        }
    } else {
        da = Utils.parseISO8601(stra);
        db = Utils.parseISO8601(strb);
        ta = da.getTime();
        tb = db.getTime();

        var offset = 14*60*60;
        if(ta < tb && (ta + offset)  < tb) {
            return -1;
        } else if(ta > tb && (ta + offset) > tb) {
            return 1;
        } else {
        return null;
        }
    }
};

// RDF utils
Utils.lexicalFormLiteral = function(term, env) {
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

Utils.lexicalFormBaseUri = function(term, env) {
    var uri = null;
    env = env || {};
    //console.log("*** normalizing URI token:");
    //console.log(term);
    if(term.value == null) {
        //console.log(" - URI has prefix and suffix");
        //console.log(" - prefix:"+term.prefix);
        //console.log(" - suffixx:"+term.suffix);
        var prefix = term.prefix;
        var suffix = term.suffix;
        var resolvedPrefix = env.namespaces[prefix];
        if(resolvedPrefix != null) {            
            uri = resolvedPrefix+suffix;
        } else {
            uri = prefix+":"+suffix;
        }
    } else {
        //console.log(" - URI is not prefixed");
        uri = term.value;
    }

    if(uri===null) {
        return null;
    } else {
        //console.log(" - resolved URI is "+uri);
        if(uri.indexOf(":") == -1) {
            //console.log(" - URI is partial");
            uri = (env.base||"") + uri; // applyBaseUri
        } else {
            //console.log(" - URI is complete");
        }
        //console.log(" -> FINAL URI: "+uri);
    }

    return uri;
};


Utils.lexicalFormTerm = function(term, ns) {
    if(term.token === 'uri') {
        return {'uri': Utils.lexicalFormBaseUri(term, ns)};
    } else if(term.token === 'literal') {
        return {'literal': Utils.lexicalFormLiteral(term, ns)};
    } else if(term.token === 'blank') {
        var label = '_:'+term.value;
        return {'blank': label};
    } else {
	throw "Error, cannot get lexical form of unknown token: "+term.token;
    }
};

Utils.normalizeUnicodeLiterals = function (string) {
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

Utils.hashTerm = function(term) {
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

// end of ./src/js-trees/src/utils.js 
// exports
var RDFJSInterface = {};

// imports

/**
 * Implementation of <http://www.w3.org/TR/rdf-interfaces/>
 */

// Uris map

RDFJSInterface.defaultContext = { "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
                                  "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
                                  "owl": "http://www.w3.org/2002/07/owl#",
                                  "xsd": "http://www.w3.org/2001/XMLSchema#",
                                  "dcterms": "http://purl.org/dc/terms/",
                                  "foaf": "http://xmlns.com/foaf/0.1/",
                                  "cal": "http://www.w3.org/2002/12/cal/ical#",
                                  "vcard": "http://www.w3.org/2006/vcard/ns# ",
                                  "geo": "http://www.w3.org/2003/01/geo/wgs84_pos#",
                                  "cc": "http://creativecommons.org/ns#",
                                  "sioc": "http://rdfs.org/sioc/ns#",
                                  "doap": "http://usefulinc.com/ns/doap#",
                                  "com": "http://purl.org/commerce#",
                                  "ps": "http://purl.org/payswarm#",
                                  "gr": "http://purl.org/goodrelations/v1#",
                                  "sig": "http://purl.org/signature#",
                                  "ccard": "http://purl.org/commerce/creditcard#"
                                };

RDFJSInterface.UrisMap = function() {
    this.defaultNs = "";
    this.interfaceProperties = ['get', 'remove', 'set', 'setDefault',
                                'addAll', 'resolve', 'shrink'];
};

RDFJSInterface.UrisMap.prototype.values = function() {
    var collected = {};
    for(var p in this) {
        if(!Utils.include(this.interfaceProperties,p) && 
           typeof(this[p])!=='function' &&
           p!=='defaultNs' &&
           p!=='interfaceProperties') {
            collected[p] = this[p];
        }
    }

    return collected;
};

RDFJSInterface.UrisMap.prototype.get = function(prefix) {
    if(prefix.indexOf(" ") != -1) {
        throw "Prefix must not contain any whitespaces";
    }
    return this[prefix];
};

RDFJSInterface.UrisMap.prototype.remove = function(prefix) {
    if(prefix.indexOf(" ") != -1) {
        throw "Prefix must not contain any whitespaces";
    }

    delete this[prefix];

    return null;
};

RDFJSInterface.UrisMap.prototype.set = function(prefix, iri) {
    if(prefix.indexOf(" ") != -1) {
        throw "Prefix must not contain any whitespaces";
    }

    this[prefix] = iri;
};


RDFJSInterface.UrisMap.prototype.setDefault = function(iri) {
    this.defaultNs =iri;
};

RDFJSInterface.UrisMap.prototype.addAll = function(prefixMap, override) {
    for(var prefix in prefixMap) {
        if(!Utils.include(this.interfaceProperties, prefix)) {
            if(this[prefix] != null) {
                if(override === true) {
                    this[prefix] = prefixMap[prefix];
                }
            } else {
                this[prefix] = prefixMap[prefix];
            }
        }
    }

    return this;
};

RDFJSInterface.UrisMap.prototype.resolve = function(curie) {
    var parts = curie.split(":");
    var ns = parts[0];
    var suffix = parts[1];
    if(ns === '') {
        if(this.defaultNs == null) {
            return null;
        } else {
            return this.defaultNs + suffix;
        }
    } else if(this[ns] != null) {
        return this[ns] + suffix;
    } else {
        return null;
    }
};

RDFJSInterface.UrisMap.prototype.shrink = function(iri) {
    for(var ns in this) {
        var prefix = this[ns];
        if(iri.indexOf(prefix) === 0) {
            if(prefix !== '' && ns != 'defaultNs') {
                var suffix = iri.split(prefix)[1];
                return ns + ":" + suffix;
            }
        }
    }

    return iri;
};

// Profile

RDFJSInterface.Profile = function() {
    this.prefixes = new RDFJSInterface.UrisMap();
    this.terms = new RDFJSInterface.UrisMap();
};

RDFJSInterface.Profile.prototype.importProfile = function(profile, override) {    
    this.prefixes.addAll(profile.prefixes, override);
    this.terms.addAll(profile.terms, override);
};


RDFJSInterface.Profile.prototype.resolve = function(toResolve) {
    if(toResolve.indexOf(":") != -1) {
        return this.prefixes.resolve(toResolve);
    } else if(this.terms[toResolve] != null) {
        return this.terms.resolve(toResolve);
    } else {
        return null;
    }
};

RDFJSInterface.Profile.prototype.setDefaultPrefix = function(iri) {
    this.prefixes.setDefault(iri);
};

RDFJSInterface.Profile.prototype.setDefaultVocabulary = function(iri) {
    this.terms.setDefault(iri);
};

RDFJSInterface.Profile.prototype.setPrefix = function(prefix, iri) {
    this.prefixes.set(prefix, iri);
};

RDFJSInterface.Profile.prototype.setTerm = function(term, iri) {
    this.terms.set(term, iri);
};

// RDF environemnt
RDFJSInterface.RDFEnvironment = function () {
    this.blankNodeCounter = 0;
    var that = this;
    this.filters = {
        s:function (s) {
            return function (t) {
                return t.subject.equals(s);
            };
        },
        p:function (p) {
            return function (t) {
                return t.predicate.equals(p);
            };
        },
        o:function (o) {
            return function (t) {
                return t.object.equals(o);
            };
        },
        sp:function (s, p) {
            return function (t) {
                return t.subject.equals(s) && t.predicate.equals(p);
            };
        },
        so:function (s, o) {
            return function (t) {
                return t.subject.equals(s) && t.object.equals(o);
            };
        },
        po:function (p, o) {
            return function (t) {
                return t.predicate.equals(p) && t.object.equals(o);
            };
        },
        spo:function (s, p, o) {
            return function (t) {
                return t.subject.equals(s) && t.predicate.equals(p) && t.object.equals(o);
            };
        },
        describes:function (v) {
            return function (t) {
                return t.subject.equals(v) || t.object.equals(v);
            };
        },
        type:function (o) {
            var type = that.resolve("rdf:type");
            return function (t) {
                return t.predicate.equals(type) && t.object.equals(o);
            };
        }
    };

    for (var p in RDFJSInterface.defaultContext) {
        this.prefixes.set(p, RDFJSInterface.defaultContext[p]);
    }
};
Utils['extends'](RDFJSInterface.Profile,RDFJSInterface.RDFEnvironment);

RDFJSInterface.RDFEnvironment.prototype.createBlankNode = function() {
     var bnode =  new RDFJSInterface.BlankNode(this.blankNodeCounter);
    this.blankNodeCounter++;
    return bnode;
};

RDFJSInterface.RDFEnvironment.prototype.createNamedNode = function(value) {
    var resolvedValue = this.resolve(value);
    if(resolvedValue != null) {
        return new RDFJSInterface.NamedNode(resolvedValue);
    } else {
        return new RDFJSInterface.NamedNode(value);
    }
};

RDFJSInterface.RDFEnvironment.prototype.createLiteral = function(value, language, datatype) {
    if(datatype != null) {
        return new RDFJSInterface.Literal(value, language, datatype.toString());
    } else {
        return new RDFJSInterface.Literal(value, language, datatype);
    }
};

RDFJSInterface.RDFEnvironment.prototype.createTriple = function(subject, predicate, object) {
    return new RDFJSInterface.Triple(subject, predicate, object);
};

RDFJSInterface.RDFEnvironment.prototype.createGraph = function(triples) {
    var graph = new RDFJSInterface.Graph();
    if(triples != null) {
        for(var i=0; i<triples.length; i++) {
            graph.add(triples[i]);
        }
    }
    return graph;
};

RDFJSInterface.RDFEnvironment.prototype.createAction = function(test, action) {
    return function(triple) {
        if(test(triple)) {
            return action(triple);
        } else {
            return triple;
        }
    }
};

RDFJSInterface.RDFEnvironment.prototype.createProfile = function(empty) {
    // empty (opt);
    if(empty === true) {
        return new RDFJSInterface.RDFEnvironment.Profile();
    } else {
        var profile = new RDFJSInterface.RDFEnvironment.Profile();
        profile.importProfile(this);

        return profile;
    }
};

RDFJSInterface.RDFEnvironment.prototype.createTermMap = function(empty) {
    if(empty === true) {
        return new RDFJSInterface.UrisMap();
    } else {
      var cloned = this.terms.values();
      var termMap = new RDFJSInterface.UrisMap();
   
      for(var p in cloned) {
          termMap[p] = cloned[p];
      }
   
      return termMap;
    }
};

RDFJSInterface.RDFEnvironment.prototype.createPrefixMap = function(empty) {
    if(empty === true) {
        return new RDFJSInterface.UrisMap();
    } else {
      var cloned = this.prefixes.values();
      var prefixMap = new RDFJSInterface.UrisMap();
   
      for(var p in cloned) {
          prefixMap[p] = cloned[p];
      }
   
      return prefixMap;
    }    
};

// Common RDFNode interface

RDFJSInterface.RDFNode = function(interfaceName){
    this.interfaceName = interfaceName;
    this.attributes  = ["interfaceName", "nominalValue"]
};

RDFJSInterface.RDFNode.prototype.equals = function(otherNode) {
    if(otherNode.interfaceName == null) {
        return this.valueOf() == otherNode;

    } else {
        for(var i in this.attributes) {
            var attribute = this.attributes[i];
            if(this[attribute] != otherNode[attribute]) {
                return false;
            }
        }
      
        return true;
    }
};


// Blank node

RDFJSInterface.BlankNode = function(bnodeId) {
    RDFJSInterface.RDFNode.call(this, "BlankNode");
    this.nominalValue = "_:"+bnodeId;
    this.bnodeId = bnodeId;
};

Utils['extends'](RDFJSInterface.RDFNode,RDFJSInterface.BlankNode);

RDFJSInterface.BlankNode.prototype.toString = function(){
    return this.nominalValue;
};

RDFJSInterface.BlankNode.prototype.toNT = function() {
    return this.nominalValue;
};

RDFJSInterface.BlankNode.prototype.valueOf = function() {
    return this.nominalValue;
};

// Literal node

RDFJSInterface.Literal = function(value, language, datatype) {
    RDFJSInterface.RDFNode.call(this, "Literal");
    this.nominalValue = value;
    if(language != null) {
        this.language = language;
    } else if(datatype != null) {
        this.datatype = datatype;
    }
};

Utils['extends'](RDFJSInterface.RDFNode,RDFJSInterface.Literal);

RDFJSInterface.Literal.prototype.toString = function(){
    var tmp = '"'+this.nominalValue+'"';
    if(this.language != null) {
        tmp = tmp + "@" + this.language;
    } else if(this.datatype != null || this.type) {
        tmp = tmp + "^^<" + (this.datatype||this.type) + ">";
    }

    return tmp;
};

RDFJSInterface.Literal.prototype.toNT = function() {
    return this.toString();
};

RDFJSInterface.Literal.prototype.valueOf = function() {
    return QueryFilters.effectiveTypeValue({token: 'literal', 
                                            type: (this.type || this.datatype), 
                                            value: this.nominalValue, 
                                            language: this.language});
};

// NamedNode node

RDFJSInterface.NamedNode = function(val) {
    RDFJSInterface.RDFNode.call(this, "NamedNode");
    if(val.value != null) {
        this.nominalValue = val.value;
    } else {
        this.nominalValue = val;
    }
};

Utils['extends'](RDFJSInterface.RDFNode,RDFJSInterface.NamedNode);

RDFJSInterface.NamedNode.prototype.toString = function(){
    return this.nominalValue;
};

RDFJSInterface.NamedNode.prototype.toNT = function() {
    return "<"+this.toString()+">";
};

RDFJSInterface.NamedNode.prototype.valueOf = function() {
    return this.nominalValue;
};

// Triple interface
RDFJSInterface.Triple = function(subject, predicate, object){
    this.subject = subject;
    this.predicate = predicate;
    this.object = object;
};

RDFJSInterface.Triple.prototype.equals = function(otherTriple) {
    return this.subject.equals(otherTriple.subject) &&
           this.predicate.equals(otherTriple.predicate) &&
           this.object.equals(otherTriple.object);
};

RDFJSInterface.Triple.prototype.toString = function() {
    return this.subject.toNT()+" "+this.predicate.toNT()+" "+this.object.toNT()+" . \r\n";
};

// Graph interface

RDFJSInterface.Graph = function() {
    this.triples = [];
    this.duplicates = {};
    this.actions = [];
    this.length = 0;
};

RDFJSInterface.Graph.prototype.add = function(triple) {
    for(var i=0; i<this.actions.length; i++) {
        triple = this.actions[i](triple);
    }
    
    var id = triple.subject.toString()+triple.predicate.toString()+triple.object.toString();
    if(!this.duplicates[id]) {
        this.duplicates[id] = true;
        this.triples.push(triple);
    }

    this.length = this.triples.length;
    return this;
};

RDFJSInterface.Graph.prototype.addAction = function (tripleAction, run) {
    this.actions.push(tripleAction);
    if (run == true) {
        for (var i = 0; i < this.triples.length; i++) {
            this.triples[i] = tripleAction(this.triples[i]);
        }
    }

    return this;
};

RDFJSInterface.Graph.prototype.addAll = function (graph) {
    var newTriples = graph.toArray();
    for (var i = 0; i < newTriples.length; i++) {
        this.add(newTriples[i]);
    }

    this.length = this.triples.length;
    return this;
};

RDFJSInterface.Graph.prototype.remove = function(triple) {
    var toRemove = null;
    for(var i=0; i<this.triples.length; i++) {
        if(this.triples[i].equals(triple)) {
            var id = triple.subject.toString()+triple.predicate.toString()+triple.object.toString();
            delete this.duplicates[id];
            toRemove = i;
            break;
        }
    }

    if(toRemove!=null) {
        this.triples.splice(toRemove,1);
    }

    this.length = this.triples.length;
    return this;
};

RDFJSInterface.Graph.prototype.toArray = function() {
    return this.triples;
};

RDFJSInterface.Graph.prototype.some = function(p) {
    for(var i=0; i<this.triples.length; i++) {
        if(p(this.triples[i],this) === true) {
            return true;
        }
    }

    return false;
};

RDFJSInterface.Graph.prototype.every = function(p) {
    for(var i=0; i<this.triples.length; i++) {
        if(p(this.triples[i],this) === false) {
            return false;
        }
    }

    return true;
};

RDFJSInterface.Graph.prototype.filter = function(f) {
    var tmp = new RDFJSInterface.Graph();

    for(var i=0; i<this.triples.length; i++) {
        if(f(this.triples[i],this) === true) {
            tmp.add(this.triples[i]);
        }
    }

    return tmp;
};

RDFJSInterface.Graph.prototype.forEach = function(f) {
    for(var i=0; i<this.triples.length; i++) {
        f(this.triples[i],this);
    }
};

RDFJSInterface.Graph.prototype.merge = function(g) {
    var newGraph = new RDFJSInterface.Graph();
    for(var i=0; i<this.triples.length; i++)
        newGraph.add(this.triples[i]);
    
    return newGraph;
};

RDFJSInterface.Graph.prototype.match = function(subject, predicate, object, limit) {
    var graph = new RDFJSInterface.Graph();

    var matched = 0;
    for(var i=0; i<this.triples.length; i++) {
        var triple = this.triples[i];
        if(subject == null || (triple.subject.equals(subject))) {
            if(predicate == null || (triple.predicate.equals(predicate))) {
                if(object == null || (triple.object.equals(object))) {
                    if(limit==null || matched < limit) {
                        matched++;
                        graph.add(triple);
                    } else {
                        return graph;
                    }
                }
            }
        }
    }

    return graph;
};

RDFJSInterface.Graph.prototype.removeMatches = function(subject, predicate, object) {
    var toRemove = [];
    for(var i=0; i<this.triples.length; i++) {
        var triple = this.triples[i];
        if(subject == null || (triple.subject.equals(subject))) {
            if(predicate == null || (triple.predicate.equals(predicate))) {
                if(object == null || (triple.object.equals(object))) {
                    toRemove.push(triple);
                }
            }
        }
    }

    for(var i=0; i<toRemove.length; i++) {
        this.remove(toRemove[i]);
    }

    return this;
};

RDFJSInterface.Graph.prototype.toNT = function() {
    var n3 = "";

    this.forEach(function(triple) {
        n3 = n3 + triple.toString();
    });

    return n3;
};

// Builders for the query engine

RDFJSInterface.buildRDFResource = function(value, bindings, engine, env) {
    if(value.token === 'blank') {
        return RDFJSInterface.buildBlankNode(value, bindings, engine, env);
    } else if(value.token === 'literal') {
        return RDFJSInterface.buildLiteral(value, bindings, engine, env);
    } else if(value.token === 'uri') {
        return RDFJSInterface.buildNamedNode(value, bindings, engine, env);
    } else if(value.token === 'var') {
        var result = bindings[value.value];
        if(result != null) {
            return RDFJSInterface.buildRDFResource(result, bindings, engine, env);
        } else {
            return null;
        }
    } else {
        return null;
    }
};

RDFJSInterface.buildBlankNode = function(value, bindings, engine, env) {
    if(value.valuetmp != null) {
        value.value = value.valuetmp;
    }
    if(value.value.indexOf("_:") === 0) {
        value.value = value.value.split("_:")[1];
    }
    return new RDFJSInterface.BlankNode(value.value);
};

RDFJSInterface.buildLiteral = function(value, bindings, engine, env) {
    return new RDFJSInterface.Literal(value.value, value.lang, value.type);
};

RDFJSInterface.buildNamedNode = function(value, bindings, engine, env) {
    if(value.value != null) {
        return new RDFJSInterface.NamedNode(value);
    } else {
        if(value.prefix != null) {
            var prefix = engine.resolveNsInEnvironment(value.prefix, env);
            value.value = prefix+value.suffix;
            return new RDFJSInterface.NamedNode(value);
        } else {
            return new RDFJSInterface.NamedNode(value);
        }
    }
};

RDFJSInterface.rdf = new RDFJSInterface.RDFEnvironment();

// end of ./src/js-query-engine/src/rdf_js_interface.js 
// exports
var QueryFilters = {};

// imports

QueryFilters.checkFilters = function(pattern, bindings, nullifyErrors, dataset, queryEnv, queryEngine) {
    var filters = pattern.filter;
    var nullified = [];
    if(filters==null || pattern.length != null) {
        return bindings;
    }

    for(var i=0; i<filters.length; i++) {
        var filter = filters[i];
        var filteredBindings = QueryFilters.run(filter.value, bindings, nullifyErrors, dataset, queryEnv, queryEngine);
        var acum = [];
        for(var j=0; j<filteredBindings.length; j++) {
            if(filteredBindings[j]["__nullify__"]!=null) {
                nullified.push(filteredBindings[j]);
            } else {
                acum.push(filteredBindings[j]);
            }
        }

        bindings = acum;
    }

    return bindings.concat(nullified);
};

QueryFilters.boundVars = function(filterExpr) {
    if(filterExpr.expressionType != null) {
        var expressionType = filterExpr.expressionType;
        if(expressionType == 'relationalexpression') {
            var op1 = filterExpr.op1;
            var op2 = filterExpr.op2;
            return QueryFilters.boundVars(op1)+QueryFilters.boundVars(op2);
        } else if(expressionType == 'conditionalor' || expressionType == 'conditionaland') {
            var vars = [];
            for(var i=0; i< filterExpr.operands; i++) {
                vars = vars.concat(QueryFilters.boundVars(filterExpr.operands[i]));
            }
            return vars;
        } else if(expressionType == 'builtincall') {
            if(filterExpr.args == null) {
                return [];
            } else {
                var acum = [];
                for(var i=0; i< filterExpr.args.length; i++) {
                    acum = acum.concat(QueryFilters.boundVars(filterExpr.args[i]));
                }
                return acum;
            }
        } else if(expressionType == 'multiplicativeexpression') {
            var acum = QueryFilters.boundVars(filterExpr.factor);
            for(var i=0; i<filterExpr.factors.length; i++) {
                acum = acum.concat(QueryFilters.boundVars(filterExpr.factors[i].expression))
            }
            return acum;
        } else if(expressionType == 'additiveexpression') {
            var acum = QueryFilters.boundVars(filterExpr.summand);
            for(var i=0; i<filterExpr.summands.length; i++) {
                acum = acum.concat(QueryFilters.boundVars(filterExpr.summands[i].expression));
            }

            return acum;
        } else if(expressionType == 'regex') {
            var acum = QueryFilters.boundVars(filterExpr.expression1);
            return acum.concat(QueryFilters.boundVars(filterExpr.expression2));
        } else if(expressionType == 'unaryexpression') {
            return QueryFilters.boundVars(filterExpr.expression);
        } else if(expressionType == 'atomic') {           
            if(filterExpr.primaryexpression == 'var') {
                return [filterExpr.value];
            } else {
                // numeric, literal, etc...
                return [];
            }
        }
    } else {
        console.log("ERROR");
        console.log(filterExpr);
        throw("Cannot find bound expressions in a no expression token");
    }
};

QueryFilters.run = function(filterExpr, bindings, nullifyFilters, dataset, env, queryEngine) {    
    var denormBindings = queryEngine.copyDenormalizedBindings(bindings, env.outCache);
    var filteredBindings = [];
    for(var i=0; i<bindings.length; i++) {
        var thisDenormBindings = denormBindings[i];
        var ebv = QueryFilters.runFilter(filterExpr, thisDenormBindings, queryEngine, dataset, env);
        // ebv can be directly a RDFTerm (e.g. atomic expression in filter)
        // this additional call to ebv will return -> true/false/error
        var ebv = QueryFilters.ebv(ebv);
        //console.log("EBV:")
        //console.log(ebv)
        //console.log("FOR:")
        //console.log(thisDenormBindings)
        if(QueryFilters.isEbvError(ebv)) {
            // error
            if(nullifyFilters) {
                var thisBindings = {"__nullify__": true, "bindings": bindings[i]};
                filteredBindings.push(thisBindings);
            }
        } else if(ebv === true) {
            // true
            filteredBindings.push(bindings[i]);
        } else {
            // false
            if(nullifyFilters) {
                var thisBindings = {"__nullify__": true, "bindings": bindings[i]};
                filteredBindings.push(thisBindings);
            }
        }
    }
    return filteredBindings;
};

QueryFilters.collect = function(filterExpr, bindings, dataset, env, queryEngine, callback) {
    var denormBindings = queryEngine.copyDenormalizedBindings(bindings, env.outCache);
    var filteredBindings = [];
    for(var i=0; i<denormBindings.length; i++) {
        var thisDenormBindings = denormBindings[i];
        var ebv = QueryFilters.runFilter(filterExpr, thisDenormBindings, queryEngine, dataset, env);
        filteredBindings.push({binding:bindings[i], value:ebv});
    }
    return(filteredBindings);
};

QueryFilters.runDistinct = function(projectedBindings, projectionVariables) {
};

// @todo add more aggregation functions here
QueryFilters.runAggregator = function(aggregator, bindingsGroup, queryEngine, dataset, env) {
    if(bindingsGroup == null || bindingsGroup.length === 0) {
        return QueryFilters.ebvError();
    } else if(aggregator.token === 'variable' && aggregator.kind == 'var') {
        return bindingsGroup[0][aggregator.value.value];
    } else if(aggregator.token === 'variable' && aggregator.kind === 'aliased') {
        if(aggregator.expression.expressionType === 'atomic' && aggregator.expression.primaryexpression === 'var') {
            return bindingsGroup[0][aggregator.expression.value.value];
        } else if(aggregator.expression.expressionType === 'aggregate') {
            if(aggregator.expression.aggregateType === 'max') {
                var max = null;
                for(var i=0; i< bindingsGroup.length; i++) {
                    var bindings = bindingsGroup[i];
                    var ebv = QueryFilters.runFilter(aggregator.expression.expression, bindings, queryEngine, dataset, env);                    
                    if(!QueryFilters.isEbvError(ebv)) {
                        if(max === null) {
                            max = ebv;
                        } else {
                            if(QueryFilters.runLtFunction(max, ebv).value === true) {
                                max = ebv;
                            }
                        }
                    }
                }

                if(max===null) {
                    return QueryFilters.ebvError();
                } else {
                    return max;
                }
            } else if(aggregator.expression.aggregateType === 'min') {
                var min = null;
                for(var i=0; i< bindingsGroup.length; i++) {
                    var bindings = bindingsGroup[i];
                    var ebv = QueryFilters.runFilter(aggregator.expression.expression, bindings, queryEngine, dataset, env);                    
                    if(!QueryFilters.isEbvError(ebv)) {
                        if(min === null) {
                            min = ebv;
                        } else {
                            if(QueryFilters.runGtFunction(min, ebv).value === true) {
                                min = ebv;
                            }
                        }
                    }
                }

                if(min===null) {
                    return QueryFilters.ebvError();
                } else {
                    return min;
                }
            } else if(aggregator.expression.aggregateType === 'count') {
                var distinct = {};
                var count = 0;
                if(aggregator.expression.expression === '*') {
                    if(aggregator.expression.distinct != null && aggregator.expression.distinct != '') {
                        for(var i=0; i< bindingsGroup.length; i++) {
                            var bindings = bindingsGroup[i];
                            var key = Utils.hashTerm(bindings);
                            if(distinct[key] == null) {
                                distinct[key] = true;
                                count++;
                            }
                        } 
                    } else {
                        count = bindingsGroup.length;
                    }                   
                } else {
                  for(var i=0; i< bindingsGroup.length; i++) {
                      var bindings = bindingsGroup[i];
                      var ebv = QueryFilters.runFilter(aggregator.expression.expression, bindings, queryEngine, dataset, env);                    
                      if(!QueryFilters.isEbvError(ebv)) {
                          if(aggregator.expression.distinct != null && aggregator.expression.distinct != '') {
                              var key = Utils.hashTerm(ebv);
                              if(distinct[key] == null) {
                                  distinct[key] = true;
                                  count++;
                              }
                          } else {
                              count++;
                          }
                      }
                  }
                }

                return {token: 'literal', type:"http://www.w3.org/2001/XMLSchema#integer", value:''+count};
            } else if(aggregator.expression.aggregateType === 'avg') {
                var distinct = {};
                var aggregated = {token: 'literal', type:"http://www.w3.org/2001/XMLSchema#integer", value:'0'};
                var count = 0;
                for(var i=0; i< bindingsGroup.length; i++) {
                    var bindings = bindingsGroup[i];
                    var ebv = QueryFilters.runFilter(aggregator.expression.expression, bindings, queryEngine, dataset, env);                    
                    if(!QueryFilters.isEbvError(ebv)) {
                        if(aggregator.expression.distinct != null && aggregator.expression.distinct != '') {
                            var key = Utils.hashTerm(ebv);
                            if(distinct[key] == null) {
                                distinct[key] = true;
                                if(QueryFilters.isNumeric(ebv)) {
                                    aggregated = QueryFilters.runSumFunction(aggregated, ebv);
                                    count++;
                                }
                            }
                        } else {
                            if(QueryFilters.isNumeric(ebv)) {
                                aggregated = QueryFilters.runSumFunction(aggregated, ebv);
                                count++;
                            }
                        }
                    }
                }

                var result = QueryFilters.runDivFunction(aggregated, {token: 'literal', type:"http://www.w3.org/2001/XMLSchema#integer", value:''+count});
                result.value = ''+result.value;
                return result;
            } else if(aggregator.expression.aggregateType === 'sum') {
                var distinct = {};
                var aggregated = {token: 'literal', type:"http://www.w3.org/2001/XMLSchema#integer", value:'0'};
                for(var i=0; i< bindingsGroup.length; i++) {
                    var bindings = bindingsGroup[i];
                    var ebv = QueryFilters.runFilter(aggregator.expression.expression, bindings, queryEngine, dataset, env);                    
                    if(!QueryFilters.isEbvError(ebv)) {
                        if(aggregator.expression.distinct != null && aggregator.expression.distinct != '') {
                            var key = Utils.hashTerm(ebv);
                            if(distinct[key] == null) {
                                distinct[key] = true;
                                if(QueryFilters.isNumeric(ebv)) {
                                    aggregated = QueryFilters.runSumFunction(aggregated, ebv);
                                }
                            }
                        } else {
                            if(QueryFilters.isNumeric(ebv)) {
                                aggregated = QueryFilters.runSumFunction(aggregated, ebv);
                            }
                        }
                    }
                }
                
                aggregated.value =''+aggregated.value;
                return aggregated;
            } else {
                var ebv = QueryFilters.runFilter(aggregate.expression, bindingsGroup[0], dataset, {blanks:{}, outCache:{}});
                return ebv;
            }
        }
    }
};

QueryFilters.runFilter = function(filterExpr, bindings, queryEngine, dataset, env) {
    if(filterExpr.expressionType != null) {
        var expressionType = filterExpr.expressionType;
        if(expressionType == 'relationalexpression') {
            var op1 = QueryFilters.runFilter(filterExpr.op1, bindings,queryEngine, dataset, env);
            var op2 = QueryFilters.runFilter(filterExpr.op2, bindings,queryEngine, dataset, env);
            return QueryFilters.runRelationalFilter(filterExpr, op1, op2, bindings, queryEngine, dataset, env);
        } else if(expressionType == 'conditionalor') {
            return QueryFilters.runOrFunction(filterExpr, bindings, queryEngine, dataset, env);
        } else if (expressionType == 'conditionaland') {
            return QueryFilters.runAndFunction(filterExpr, bindings, queryEngine, dataset, env);
        } else if(expressionType == 'additiveexpression') {
            return QueryFilters.runAddition(filterExpr.summand, filterExpr.summands, bindings, queryEngine, dataset, env);
        } else if(expressionType == 'builtincall') {
            return QueryFilters.runBuiltInCall(filterExpr.builtincall, filterExpr.args, bindings, queryEngine, dataset, env);
        } else if(expressionType == 'multiplicativeexpression') {
            return QueryFilters.runMultiplication(filterExpr.factor, filterExpr.factors, bindings, queryEngine, dataset, env);
        } else if(expressionType == 'unaryexpression') {
            return QueryFilters.runUnaryExpression(filterExpr.unaryexpression, filterExpr.expression, bindings, queryEngine, dataset, env);
        } else if(expressionType == 'irireforfunction') {
            return QueryFilters.runIriRefOrFunction(filterExpr.iriref, filterExpr.args, bindings, queryEngine, dataset, env);
        } else if(expressionType == 'regex') {
            return QueryFilters.runRegex(filterExpr.text, filterExpr.pattern, filterExpr.flags, bindings, queryEngine, dataset, env)
        } else if(expressionType == 'custom') {
            return QueryFilters.runBuiltInCall(filterExpr.name, filterExpr.args, bindings, queryEngine, dataset, env);
        } else if(expressionType == 'atomic') {        
            if(filterExpr.primaryexpression == 'var') {
                // lookup the var in the bindings
                var val = bindings[filterExpr.value.value];
                return val;
            } else {
                // numeric, literal, etc...
                //return queryEngine.filterExpr.value;
                if(typeof(filterExpr.value) != 'object') {
                    return filterExpr.value
                } else {
                    if(filterExpr.value.type == null || typeof(filterExpr.value.type) != 'object') {
                        return filterExpr.value
                    } else {
                        // type can be parsed as a hash using namespaces

                        filterExpr.value.type =  Utils.lexicalFormBaseUri(filterExpr.value.type, env);
                        return filterExpr.value
                    }
                }
            }
        } else {
            throw("Unknown filter expression type");
        }
    } else {
        throw("Cannot find bound expressions in a no expression token");
    }
};

QueryFilters.isRDFTerm = function(val) {
    if(val==null) {
        return false;
    } if((val.token && val.token == 'literal') ||
       (val.token && val.token == 'uri') ||
       (val.token && val.token == 'blank')) {
        return true;
    } else {
        return false;
    }
};


/*
17.4.1.7 RDFterm-equal

 xsd:boolean   RDF term term1 = RDF term term2

Returns TRUE if term1 and term2 are the same RDF term as defined in Resource Description Framework (RDF): 
Concepts and Abstract Syntax [CONCEPTS]; produces a type error if the arguments are both literal but are not 
the same RDF term *; returns FALSE otherwise. term1 and term2 are the same if any of the following is true:

    term1 and term2 are equivalent IRIs as defined in 6.4 RDF URI References of [CONCEPTS].
    term1 and term2 are equivalent literals as defined in 6.5.1 Literal Equality of [CONCEPTS].
    term1 and term2 are the same blank node as described in 6.6 Blank Nodes of [CONCEPTS].
*/
QueryFilters.RDFTermEquality = function(v1, v2, queryEngine, env) {
    if(v1.token === 'literal' && v2.token === 'literal') {
        if(v1.lang == v2.lang && v1.type == v2.type && v1.value == v2.value) {

            return true;
        } else {


            if(v1.type != null && v2.type != null) {
                return  QueryFilters.ebvError();
            } else if(QueryFilters.isSimpleLiteral(v1) && v2.type!=null){
                return QueryFilters.ebvError();
            } else if(QueryFilters.isSimpleLiteral(v2) && v1.type!=null){
                return QueryFilters.ebvError();
            } else {
                return false;
            }

//            if(v1.value != v2.value) {
//                return QueryFilters.ebvError();                                
//            } else if(v1.type && v2.type && v1.type!=v2.type) {
//                return QueryFilters.ebvError();                
//            } else if(QueryFilters.isSimpleLiteral(v1) && v2.type!=null){
//                return QueryFilters.ebvError();
//            } else if(QueryFilters.isSimpleLiteral(v2) && v1.type!=null){
//                return QueryFilters.ebvError();
//            } else {
//                return false;
//            }

        }
    } else if(v1.token === 'uri' && v2.token === 'uri') {
        return Utils.lexicalFormBaseUri(v1, env) == Utils.lexicalFormBaseUri(v2, env);
    } else if(v1.token === 'blank' && v2.token === 'blank') {
        return v1.value == v2.value;
    } else {
        return false;
    }
};


QueryFilters.isInteger = function(val) {
    if(val == null) {
        return false;
    }
    if(val.token === 'literal') {
        if(val.type == "http://www.w3.org/2001/XMLSchema#integer" ||
           val.type == "http://www.w3.org/2001/XMLSchema#decimal" ||
           val.type == "http://www.w3.org/2001/XMLSchema#double" ||
           val.type == "http://www.w3.org/2001/XMLSchema#nonPositiveInteger" ||
           val.type == "http://www.w3.org/2001/XMLSchema#negativeInteger" ||
           val.type == "http://www.w3.org/2001/XMLSchema#long" ||
           val.type == "http://www.w3.org/2001/XMLSchema#int" ||
           val.type == "http://www.w3.org/2001/XMLSchema#short" ||
           val.type == "http://www.w3.org/2001/XMLSchema#byte" ||
           val.type == "http://www.w3.org/2001/XMLSchema#nonNegativeInteger" ||
           val.type == "http://www.w3.org/2001/XMLSchema#unsignedLong" ||
           val.type == "http://www.w3.org/2001/XMLSchema#unsignedInt" ||
           val.type == "http://www.w3.org/2001/XMLSchema#unsignedShort" ||
           val.type == "http://www.w3.org/2001/XMLSchema#unsignedByte" ||
           val.type == "http://www.w3.org/2001/XMLSchema#positiveInteger" ) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
};

QueryFilters.isFloat = function(val) {
    if(val == null) {
        return false;
    }
    if(val.token === 'literal') {
        if(val.type == "http://www.w3.org/2001/XMLSchema#float") {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
};

QueryFilters.isDecimal = function(val) {
    if(val == null) {
        return false;
    }
    if(val.token === 'literal') {
        if(val.type == "http://www.w3.org/2001/XMLSchema#decimal") {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
};

QueryFilters.isDouble = function(val) {
    if(val == null) {
        return false;
    }
    if(val.token === 'literal') {
        if(val.type == "http://www.w3.org/2001/XMLSchema#double") {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
};


QueryFilters.isNumeric = function(val) {
    if(val == null) {
        return false;
    }
    if(val.token === 'literal') {
        if(val.type == "http://www.w3.org/2001/XMLSchema#integer" ||
           val.type == "http://www.w3.org/2001/XMLSchema#decimal" ||
           val.type == "http://www.w3.org/2001/XMLSchema#float" ||
           val.type == "http://www.w3.org/2001/XMLSchema#double" ||
           val.type == "http://www.w3.org/2001/XMLSchema#nonPositiveInteger" ||
           val.type == "http://www.w3.org/2001/XMLSchema#negativeInteger" ||
           val.type == "http://www.w3.org/2001/XMLSchema#long" ||
           val.type == "http://www.w3.org/2001/XMLSchema#int" ||
           val.type == "http://www.w3.org/2001/XMLSchema#short" ||
           val.type == "http://www.w3.org/2001/XMLSchema#byte" ||
           val.type == "http://www.w3.org/2001/XMLSchema#nonNegativeInteger" ||
           val.type == "http://www.w3.org/2001/XMLSchema#unsignedLong" ||
           val.type == "http://www.w3.org/2001/XMLSchema#unsignedInt" ||
           val.type == "http://www.w3.org/2001/XMLSchema#unsignedShort" ||
           val.type == "http://www.w3.org/2001/XMLSchema#unsignedByte" ||
           val.type == "http://www.w3.org/2001/XMLSchema#positiveInteger" ) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
};

QueryFilters.isSimpleLiteral = function(val) {
    if(val && val.token == 'literal') {
        if(val.type == null && val.lang == null) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
};

QueryFilters.isXsdType = function(type, val) {
    if(val && val.token == 'literal') {
        return val.type == "http://www.w3.org/2001/XMLSchema#"+type;
    } else {
        return false;
    }
};

QueryFilters.ebv = function (term) {
    if (term == null || QueryFilters.isEbvError(term)) {
        return QueryFilters.ebvError();
    } else {
        if (term.token && term.token === 'literal') {
            if (term.type == "http://www.w3.org/2001/XMLSchema#integer" ||
                term.type == "http://www.w3.org/2001/XMLSchema#decimal" ||
                term.type == "http://www.w3.org/2001/XMLSchema#double" ||
                term.type == "http://www.w3.org/2001/XMLSchema#nonPositiveInteger" ||
                term.type == "http://www.w3.org/2001/XMLSchema#negativeInteger" ||
                term.type == "http://www.w3.org/2001/XMLSchema#long" ||
                term.type == "http://www.w3.org/2001/XMLSchema#int" ||
                term.type == "http://www.w3.org/2001/XMLSchema#short" ||
                term.type == "http://www.w3.org/2001/XMLSchema#byte" ||
                term.type == "http://www.w3.org/2001/XMLSchema#nonNegativeInteger" ||
                term.type == "http://www.w3.org/2001/XMLSchema#unsignedLong" ||
                term.type == "http://www.w3.org/2001/XMLSchema#unsignedInt" ||
                term.type == "http://www.w3.org/2001/XMLSchema#unsignedShort" ||
                term.type == "http://www.w3.org/2001/XMLSchema#unsignedByte" ||
                term.type == "http://www.w3.org/2001/XMLSchema#positiveInteger") {
                var tmp = parseFloat(term.value);
                if (isNaN(tmp)) {
                    return false;
                } else {
                    return parseFloat(term.value) != 0;
                }
            } else if (term.type === "http://www.w3.org/2001/XMLSchema#boolean") {
                return (term.value === 'true' || term.value === true || term.value === 'True');
            } else if (term.type === "http://www.w3.org/2001/XMLSchema#string") {
                return term.value != "";
            } else if (term.type === "http://www.w3.org/2001/XMLSchema#dateTime") {
                return (new Date(term.value)) != null;
            } else if (QueryFilters.isEbvError(term)) {
                return term;
            } else if (term.type == null) {
                if (term.value != "") {
                    return true;
                } else {
                    return false;
                }
            } else {
                return QueryFilters.ebvError();
            }
        } else {
            return term.value === true;
        }
    }
};

QueryFilters.effectiveBooleanValue = QueryFilters.ebv;

QueryFilters.ebvTrue = function() {
    var val = {token: 'literal', type:"http://www.w3.org/2001/XMLSchema#boolean", value:true};
    return val;
};

QueryFilters.ebvFalse = function() {
    var val = {token: 'literal', type:"http://www.w3.org/2001/XMLSchema#boolean", value:false};
    return val;
};

QueryFilters.ebvError = function() {
    var val = {token: 'literal', type:"https://github.com/antoniogarrote/js-tools/types#error", value:null};
    return val;
};

QueryFilters.isEbvError = function(term) {
    if(typeof(term) == 'object' && term != null) {
        return term.type === "https://github.com/antoniogarrote/js-tools/types#error";
//    } else if(term == null) {
//        return true;
    } else {
        return false;
    }
};

QueryFilters.ebvBoolean = function (bool) {
    if (QueryFilters.isEbvError(bool)) {
        return bool;
    } else {
        if (bool === true) {
            return QueryFilters.ebvTrue();
        } else {
            return QueryFilters.ebvFalse();
        }
    }
};


QueryFilters.runRelationalFilter = function(filterExpr, op1, op2, bindings, queryEngine, dataset, env) {
    var operator = filterExpr.operator;
    if(operator === '=') {
        return QueryFilters.runEqualityFunction(op1, op2, bindings, queryEngine, dataset, env);
    } else if(operator === '!=') {
        var res = QueryFilters.runEqualityFunction(op1, op2, bindings, queryEngine, dataset, env);
        if(QueryFilters.isEbvError(res)) {
            return res;
        } else {
            res.value = !res.value;
            return res;
        }
    } else if(operator === '<') {
        return QueryFilters.runLtFunction(op1, op2, bindings);
    } else if(operator === '>') {
        return QueryFilters.runGtFunction(op1, op2, bindings);
    } else if(operator === '<=') {
        return QueryFilters.runLtEqFunction(op1, op2, bindings);
    } else if(operator === '>=') {
        return QueryFilters.runGtEqFunction(op1, op2, bindings);
    } else {
        throw("Error applying relational filter, unknown operator");
    }
};

/**
 * Transforms a JS object representing a [typed] literal in a javascript
 * value that can be used in javascript operations and functions
 */
QueryFilters.effectiveTypeValue = function(val){
    if(val.token == 'literal') {
        if(val.type == "http://www.w3.org/2001/XMLSchema#integer") {
            var tmp = parseInt(val.value);
            //if(isNaN(tmp)) {
            //    return false;
            //} else {
              return tmp;
            //}
        } else if(val.type == "http://www.w3.org/2001/XMLSchema#decimal") {
            var tmp = parseFloat(val.value);
            //if(isNaN(tmp)) {
            //    return false;
            //} else {
                return tmp;
            //}
        } else if (val.type == "http://www.w3.org/2001/XMLSchema#float") {
            var tmp = parseFloat(val.value);
            //if(isNaN(tmp)) {
            //    return false;
            //} else {
                return tmp;
            //}
        } else if (val.type == "http://www.w3.org/2001/XMLSchema#double") {
            var tmp = parseFloat(val.value);
            //if(isNaN(tmp)) {
            //    return false;
            //} else {
                return tmp;
            //}
        } else if (val.type == "http://www.w3.org/2001/XMLSchema#nonPositiveInteger") {
            var tmp = parseFloat(val.value);
            //if(isNaN(tmp)) {
            //    return false;
            //} else {
                return tmp;
            //}
        } else if (val.type == "http://www.w3.org/2001/XMLSchema#negativeInteger") {
            var tmp = parseInt(val.value);
            //if(isNaN(tmp)) {
            //    return false;
            //} else {
                return tmp;
            //}
        } else if (val.type == "http://www.w3.org/2001/XMLSchema#long") {
            var tmp = parseInt(val.value);
            //if(isNaN(tmp)) {
            //    return false;
            //} else {
                return tmp;
            //}
        } else if (val.type == "http://www.w3.org/2001/XMLSchema#int") {
            var tmp = parseInt(val.value);
            //if(isNaN(tmp)) {
            //    return false;
            //} else {
                return tmp;
            //}
        } else if (val.type == "http://www.w3.org/2001/XMLSchema#short") {
            var tmp = parseInt(val.value);
            //if(isNaN(tmp)) {
            //    return false;
            //} else {
                return tmp;
            //}
        } else if (val.type == "http://www.w3.org/2001/XMLSchema#byte") {
            var tmp = parseInt(val.value);
            //if(isNaN(tmp)) {
            //    return false;
            //} else {
                return tmp;
            //}
        } else if (val.type == "http://www.w3.org/2001/XMLSchema#nonNegativeInteger") {
            var tmp = parseInt(val.value);
            //if(isNaN(tmp)) {
            //    return false;
            //} else {
                return tmp;
            //}
        } else if (val.type == "http://www.w3.org/2001/XMLSchema#unsignedLong") {
            var tmp = parseInt(val.value);
            //if(isNaN(tmp)) {
            //    return false;
            //} else {
                return tmp;
            //}
        } else if (val.type == "http://www.w3.org/2001/XMLSchema#unsignedInt") {
            var tmp = parseInt(val.value);
            //if(isNaN(tmp)) {
            //    return false;
            //} else {
                return tmp;
            //}
        } else if (val.type == "http://www.w3.org/2001/XMLSchema#unsignedShort") {
            var tmp = parseInt(val.value);
            //if(isNaN(tmp)) {
            //    return false;
            //} else {
                return tmp;
            //}
        } else if (val.type == "http://www.w3.org/2001/XMLSchema#unsignedByte") {
            var tmp = parseInt(val.value);
            //if(isNaN(tmp)) {
            //    return false;
            //} else {
                return tmp;
            //}
        } else if (val.type == "http://www.w3.org/2001/XMLSchema#positiveInteger" ) {
            var tmp = parseInt(val.value);
            //if(isNaN(tmp)) {
            //    return false;
            //} else {
                return tmp;
            //}
        } else if (val.type == "http://www.w3.org/2001/XMLSchema#date" || 
                   val.type == "http://www.w3.org/2001/XMLSchema#dateTime" ) {
            try {
                var d = Utils.parseISO8601(val.value);            
                return(d);
            } catch(e) {
                return null;
            }
        } else if (val.type == "http://www.w3.org/2001/XMLSchema#boolean" ) {
            return val.value === true || val.value === 'true' || val.value === '1' || val.value === 1 || val.value === true ? true :
                val.value === false || val.value === 'false' || val.value === '0' || val.value === 0 || val.value === false ? false :
                undefined;
        } else if (val.type == "http://www.w3.org/2001/XMLSchema#string" ) {
            return val.value === null || val.value === undefined ? undefined : ''+val.value;
        } else if (val.type == null) {
            // plain literal -> just manipulate the string
            return val.value;
        } else {
            return val.value
        }
    } else {
        // @todo
        console.log("not implemented yet");
        console.log(val);
        throw("value not supported in operations yet");
    }
};

/*
  A logical-or that encounters an error on only one branch will return TRUE if the other branch is TRUE and an error if the other branch is FALSE.
  A logical-or or logical-and that encounters errors on both branches will produce either of the errors.
*/
QueryFilters.runOrFunction = function(filterExpr, bindings, queryEngine, dataset, env) {

    var acum = null;

    for(var i=0; i< filterExpr.operands.length; i++) {
        var ebv = QueryFilters.runFilter(filterExpr.operands[i], bindings, queryEngine, dataset, env);
        if(QueryFilters.isEbvError(ebv) == false) {
            ebv = QueryFilters.ebv(ebv);
        }

        if(acum == null) {
            acum = ebv;
        } else if(QueryFilters.isEbvError(ebv)) {
            if(QueryFilters.isEbvError(acum)) {
                acum = QueryFilters.ebvError();
            } else if(acum === true) {
                acum = true;
            } else {
                acum = QueryFilters.ebvError();
            }
        } else if(ebv === true) {
            acum = true;
        } else {
            if(QueryFilters.isEbvError(acum)) {
                acum = QueryFilters.ebvError();
            }
        }
    }

    return QueryFilters.ebvBoolean(acum);
};

/*
  A logical-and that encounters an error on only one branch will return an error if the other branch is TRUE and FALSE if the other branch is FALSE.
  A logical-or or logical-and that encounters errors on both branches will produce either of the errors.
*/
QueryFilters.runAndFunction = function(filterExpr, bindings, queryEngine, dataset, env) {

    var acum = null;

    for(var i=0; i< filterExpr.operands.length; i++) {

        var ebv = QueryFilters.runFilter(filterExpr.operands[i], bindings, queryEngine, dataset, env);

        if(QueryFilters.isEbvError(ebv) == false) {
            ebv = QueryFilters.ebv(ebv);
        }

        if(acum == null) {
            acum = ebv;
        } else if(QueryFilters.isEbvError(ebv)) {
            if(QueryFilters.isEbvError(acum)) {
                acum = QueryFilters.ebvError();
            } else if(acum === true) {
                acum = QueryFilters.ebvError();
            } else {
                acum = false;
            }
        } else if(ebv === true) {
            if(QueryFilters.isEbvError(acum)) {
                acum = QueryFilters.ebvError();
            }
        } else {
            acum = false;
        }
    }

    return QueryFilters.ebvBoolean(acum);
};


QueryFilters.runEqualityFunction = function(op1, op2, bindings, queryEngine, dataset, env) {
    if(QueryFilters.isEbvError(op1) || QueryFilters.isEbvError(op2)) {
        return QueryFilters.ebvError();
    }
    if(QueryFilters.isNumeric(op1) && QueryFilters.isNumeric(op2)) {
        var eop1 = QueryFilters.effectiveTypeValue(op1);
        var eop2 = QueryFilters.effectiveTypeValue(op2);
        if(isNaN(eop1) || isNaN(eop2)) {
            return QueryFilters.ebvBoolean(QueryFilters.RDFTermEquality(op1, op2, queryEngine, env));
        } else {
            return QueryFilters.ebvBoolean(eop1 == eop2);
        }
    } else if((QueryFilters.isSimpleLiteral(op1) || QueryFilters.isXsdType("string", op1)) && 
              (QueryFilters.isSimpleLiteral(op2) || QueryFilters.isXsdType("string", op2))) {
        return QueryFilters.ebvBoolean(QueryFilters.effectiveTypeValue(op1) == QueryFilters.effectiveTypeValue(op2));       
    } else if(QueryFilters.isXsdType("boolean", op1) && QueryFilters.isXsdType("boolean", op2)) {
        return QueryFilters.ebvBoolean(QueryFilters.effectiveTypeValue(op1) == QueryFilters.effectiveTypeValue(op2));
    } else if((QueryFilters.isXsdType("dateTime", op1)||QueryFilters.isXsdType("date", op1)) && (QueryFilters.isXsdType("dateTime", op2)||QueryFilters.isXsdType("date", op2))) {
        if(QueryFilters.isXsdType("dateTime", op1) && QueryFilters.isXsdType("date", op2)) {
            return QueryFilters.ebvFalse();
        }
        if(QueryFilters.isXsdType("date", op1) && QueryFilters.isXsdType("dateTime", op2)) {
            return QueryFilters.ebvFalse();
        }

        var comp = Utils.compareDateComponents(op1.value, op2.value);
        if(comp != null) {
            if(comp == 0) {
                return QueryFilters.ebvTrue();
            } else {
                return QueryFilters.ebvFalse();
            }
        } else {
                return QueryFilters.ebvError();
        }
    } else if(QueryFilters.isRDFTerm(op1) && QueryFilters.isRDFTerm(op2)) {
        return QueryFilters.ebvBoolean(QueryFilters.RDFTermEquality(op1, op2, queryEngine, env));
    } else {
        return QueryFilters.ebvFalse();
    }
};

QueryFilters.runGtFunction = function(op1, op2, bindings) {
    if(QueryFilters.isEbvError(op1) || QueryFilters.isEbvError(op2)) {
        return QueryFilters.ebvError();
    }

    if(QueryFilters.isNumeric(op1) && QueryFilters.isNumeric(op2)) {
        return QueryFilters.ebvBoolean(QueryFilters.effectiveTypeValue(op1) > QueryFilters.effectiveTypeValue(op2));
    } else if(QueryFilters.isSimpleLiteral(op1) && QueryFilters.isSimpleLiteral(op2)) {
        return QueryFilters.ebvBoolean(QueryFilters.effectiveTypeValue(op1) > QueryFilters.effectiveTypeValue(op2));       
    } else if(QueryFilters.isXsdType("string", op1) && QueryFilters.isXsdType("string", op2)) {
        return QueryFilters.ebvBoolean(QueryFilters.effectiveTypeValue(op1) > QueryFilters.effectiveTypeValue(op2));       
    } else if(QueryFilters.isXsdType("boolean", op1) && QueryFilters.isXsdType("boolean", op2)) {
        return QueryFilters.ebvBoolean(QueryFilters.effectiveTypeValue(op1) > QueryFilters.effectiveTypeValue(op2));
    } else if((QueryFilters.isXsdType("dateTime", op1) || QueryFilters.isXsdType("date", op1)) && 
              (QueryFilters.isXsdType("dateTime", op2) || QueryFilters.isXsdType("date", op2))) {
        if(QueryFilters.isXsdType("dateTime", op1) && QueryFilters.isXsdType("date", op2)) {
            return QueryFilters.ebvFalse();
        }
        if(QueryFilters.isXsdType("date", op1) && QueryFilters.isXsdType("dateTime", op2)) {
            return QueryFilters.ebvFalse();
        }

        var comp = Utils.compareDateComponents(op1.value, op2.value);
        if(comp != null) {
            if(comp == 1) {
                return QueryFilters.ebvTrue();
            } else {
                return QueryFilters.ebvFalse();
            }
        } else {
                return QueryFilters.ebvError();
        }
    } else {
        return QueryFilters.ebvFalse();
    }
};

/**
 * Total gt function used when sorting bindings in the SORT BY clause.
 *
 * @todo
 * Some criteria are not clear
 */
QueryFilters.runTotalGtFunction = function(op1,op2) {
    if(QueryFilters.isEbvError(op1) || QueryFilters.isEbvError(op2)) {
        return QueryFilters.ebvError();
    }

    if((QueryFilters.isNumeric(op1) && QueryFilters.isNumeric(op2)) ||
       (QueryFilters.isSimpleLiteral(op1) && QueryFilters.isSimpleLiteral(op2)) ||
       (QueryFilters.isXsdType("string",op1) && QueryFilters.isSimpleLiteral("string",op2)) ||
       (QueryFilters.isXsdType("boolean",op1) && QueryFilters.isSimpleLiteral("boolean",op2)) ||
       (QueryFilters.isXsdType("dateTime",op1) && QueryFilters.isSimpleLiteral("dateTime",op2))) {
        return QueryFilters.runGtFunction(op1, op2, []);
    } else if(op1.token && op1.token === 'uri' && op2.token && op2.token === 'uri') {
        return QueryFilters.ebvBoolean(op1.value > op2.value);
    } else if(op1.token && op1.token === 'literal' && op2.token && op2.token === 'literal') {
        // one of the literals must have type/lang and the othe may not have them
        return QueryFilters.ebvBoolean(""+op1.value+op1.type+op1.lang > ""+op2.value+op2.type+op2.lang);
    } else if(op1.token && op1.token === 'blank' && op2.token && op2.token === 'blank') {    
        return QueryFilters.ebvBoolean(op1.value > op2.value);
    } else if(op1.value && op2.value) {
        return QueryFilters.ebvBoolean(op1.value > op2.value);
    } else {
        return QueryFilters.ebvTrue();
    }
};


QueryFilters.runLtFunction = function(op1, op2, bindings) {
    if(QueryFilters.isEbvError(op1) || QueryFilters.isEbvError(op2)) {
        return QueryFilters.ebvError();
    }

    if(QueryFilters.isNumeric(op1) && QueryFilters.isNumeric(op2)) {
        return QueryFilters.ebvBoolean(QueryFilters.effectiveTypeValue(op1) < QueryFilters.effectiveTypeValue(op2));
    } else if(QueryFilters.isSimpleLiteral(op1) && QueryFilters.isSimpleLiteral(op2)) {
        return QueryFilters.ebvBoolean(QueryFilters.effectiveTypeValue(op1) < QueryFilters.effectiveTypeValue(op2));       
    } else if(QueryFilters.isXsdType("string", op1) && QueryFilters.isXsdType("string", op2)) {
        return QueryFilters.ebvBoolean(QueryFilters.effectiveTypeValue(op1) < QueryFilters.effectiveTypeValue(op2));       
    } else if(QueryFilters.isXsdType("boolean", op1) && QueryFilters.isXsdType("boolean", op2)) {
        return QueryFilters.ebvBoolean(QueryFilters.effectiveTypeValue(op1) < QueryFilters.effectiveTypeValue(op2));
    } else if((QueryFilters.isXsdType("dateTime", op1) || QueryFilters.isXsdType("date", op1)) && 
              (QueryFilters.isXsdType("dateTime", op2) || QueryFilters.isXsdType("date", op2))) {
        if(QueryFilters.isXsdType("dateTime", op1) && QueryFilters.isXsdType("date", op2)) {
            return QueryFilters.ebvFalse();
        }
        if(QueryFilters.isXsdType("date", op1) && QueryFilters.isXsdType("dateTime", op2)) {
            return QueryFilters.ebvFalse();
        }

        var comp = Utils.compareDateComponents(op1.value, op2.value);
        if(comp != null) {
            if(comp == -1) {
                return QueryFilters.ebvTrue();
            } else {
                return QueryFilters.ebvFalse();
            }
        } else {
                return QueryFilters.ebvError();
        }
    } else {
        return QueryFilters.ebvFalse();
    }
};


QueryFilters.runGtEqFunction = function(op1, op2, bindings) {
    if(QueryFilters.isEbvError(op1) || QueryFilters.isEbvError(op2)) {
        return QueryFilters.ebvError();
    }

    if(QueryFilters.isNumeric(op1) && QueryFilters.isNumeric(op2)) {
        return QueryFilters.ebvBoolean(QueryFilters.effectiveTypeValue(op1) >= QueryFilters.effectiveTypeValue(op2));
    } else if(QueryFilters.isSimpleLiteral(op1) && QueryFilters.isSimpleLiteral(op2)) {
        return QueryFilters.ebvBoolean(QueryFilters.effectiveTypeValue(op1) >= QueryFilters.effectiveTypeValue(op2));       
    } else if(QueryFilters.isXsdType("string", op1) && QueryFilters.isXsdType("string", op2)) {
        return QueryFilters.ebvBoolean(QueryFilters.effectiveTypeValue(op1) >= QueryFilters.effectiveTypeValue(op2));       
    } else if(QueryFilters.isXsdType("boolean", op1) && QueryFilters.isXsdType("boolean", op2)) {
        return QueryFilters.ebvBoolean(QueryFilters.effectiveTypeValue(op1) >= QueryFilters.effectiveTypeValue(op2));
    } else if((QueryFilters.isXsdType("dateTime", op1) || QueryFilters.isXsdType("date", op1)) && 
              (QueryFilters.isXsdType("dateTime", op2) || QueryFilters.isXsdType("date", op2))) {
        if(QueryFilters.isXsdType("dateTime", op1) && QueryFilters.isXsdType("date", op2)) {
            return QueryFilters.ebvFalse();
        }
        if(QueryFilters.isXsdType("date", op1) && QueryFilters.isXsdType("dateTime", op2)) {
            return QueryFilters.ebvFalse();
        }

        var comp = Utils.compareDateComponents(op1.value, op2.value);
        if(comp != null) {
            if(comp != -1) {
                return QueryFilters.ebvTrue();
            } else {
                return QueryFilters.ebvFalse();
            }
        } else {
                return QueryFilters.ebvError();
        }

    } else {
        return QueryFilters.ebvFalse();
    }
};


QueryFilters.runLtEqFunction = function(op1, op2, bindings) {
    if(QueryFilters.isEbvError(op1) || QueryFilters.isEbvError(op2)) {
        return QueryFilters.ebvError();
    }

    if(QueryFilters.isNumeric(op1) && QueryFilters.isNumeric(op2)) {
        return QueryFilters.ebvBoolean(QueryFilters.effectiveTypeValue(op1) <= QueryFilters.effectiveTypeValue(op2));
    } else if(QueryFilters.isSimpleLiteral(op1) && QueryFilters.isSimpleLiteral(op2)) {
        return QueryFilters.ebvBoolean(QueryFilters.effectiveTypeValue(op1) <= QueryFilters.effectiveTypeValue(op2));       
    } else if(QueryFilters.isXsdType("string", op1) && QueryFilters.isXsdType("string", op2)) {
        return QueryFilters.ebvBoolean(QueryFilters.effectiveTypeValue(op1) <= QueryFilters.effectiveTypeValue(op2));       
    } else if(QueryFilters.isXsdType("boolean", op1) && QueryFilters.isXsdType("boolean", op2)) {
        return QueryFilters.ebvBoolean(QueryFilters.effectiveTypeValue(op1) <= QueryFilters.effectiveTypeValue(op2));
    } else if((QueryFilters.isXsdType("dateTime", op1) || QueryFilters.isXsdType("date", op1)) && 
              (QueryFilters.isXsdType("dateTime", op2) || QueryFilters.isXsdType("date", op2))) {
        if(QueryFilters.isXsdType("dateTime", op1) && QueryFilters.isXsdType("date", op2)) {
            return QueryFilters.ebvFalse();
        }
        if(QueryFilters.isXsdType("date", op1) && QueryFilters.isXsdType("dateTime", op2)) {
            return QueryFilters.ebvFalse();
        }

        var comp = Utils.compareDateComponents(op1.value, op2.value);
        if(comp != null) {
            if(comp != 1) {
                return QueryFilters.ebvTrue();
            } else {
                return QueryFilters.ebvFalse();
            }
        } else {
                return QueryFilters.ebvError();
        }
    } else {
        return QueryFilters.ebvFalse();
    }
};

QueryFilters.runAddition = function(summand, summands, bindings, queryEngine, dataset, env) {
    var summandOp = QueryFilters.runFilter(summand,bindings,queryEngine, dataset, env);
    if(QueryFilters.isEbvError(summandOp)) {
        return QueryFilters.ebvError();
    }

    var acum = summandOp;
    if(QueryFilters.isNumeric(summandOp)) {
        for(var i=0; i<summands.length; i++) {
            var nextSummandOp = QueryFilters.runFilter(summands[i].expression, bindings,queryEngine, dataset, env);
            if(QueryFilters.isNumeric(nextSummandOp)) {
                if(summands[i].operator === '+') {
                    acum = QueryFilters.runSumFunction(acum, nextSummandOp);
                } else if(summands[i].operator === '-') {
                    acum = QueryFilters.runSubFunction(acum, nextSummandOp);
                }
            } else {
                return QueryFilters.ebvFalse();
            }
        }
        return acum;
    } else {
        return QueryFilters.ebvFalse();
    }
};

QueryFilters.runSumFunction = function(suma, sumb) {
    if(QueryFilters.isEbvError(suma) || QueryFilters.isEbvError(sumb)) {
        return QueryFilters.ebvError();
    }
    var val = QueryFilters.effectiveTypeValue(suma) + QueryFilters.effectiveTypeValue(sumb);
    
    if(QueryFilters.isDouble(suma) || QueryFilters.isDouble(sumb)) {
        return {token: 'literal', type:"http://www.w3.org/2001/XMLSchema#double", value:val};        
    } else if(QueryFilters.isFloat(suma) || QueryFilters.isFloat(sumb)) {
        return {token: 'literal', type:"http://www.w3.org/2001/XMLSchema#float", value:val};        
    } else if(QueryFilters.isDecimal(suma) || QueryFilters.isDecimal(sumb)) {
        return {token: 'literal', type:"http://www.w3.org/2001/XMLSchema#decimal", value:val};        
    } else {
        return {token: 'literal', type:"http://www.w3.org/2001/XMLSchema#integer", value:val};        
    }
};

QueryFilters.runSubFunction = function(suma, sumb) {
    if(QueryFilters.isEbvError(suma) || QueryFilters.isEbvError(sumb)) {
        return QueryFilters.ebvError();
    }
    var val = QueryFilters.effectiveTypeValue(suma) - QueryFilters.effectiveTypeValue(sumb);

    if(QueryFilters.isDouble(suma) || QueryFilters.isDouble(sumb)) {
        return {token: 'literal', type:"http://www.w3.org/2001/XMLSchema#double", value:val};        
    } else if(QueryFilters.isFloat(suma) || QueryFilters.isFloat(sumb)) {
        return {token: 'literal', type:"http://www.w3.org/2001/XMLSchema#float", value:val};        
    } else if(QueryFilters.isDecimal(suma) || QueryFilters.isDecimal(sumb)) {
        return {token: 'literal', type:"http://www.w3.org/2001/XMLSchema#decimal", value:val};        
    } else {
        return {token: 'literal', type:"http://www.w3.org/2001/XMLSchema#integer", value:val};        
    }
};

QueryFilters.runMultiplication = function(factor, factors, bindings, queryEngine, dataset, env) {
    var factorOp = QueryFilters.runFilter(factor,bindings,queryEngine, dataset, env);
    if(QueryFilters.isEbvError(factorOp)) {
        return factorOp;
    }

    var acum = factorOp;
    if(QueryFilters.isNumeric(factorOp)) {
        for(var i=0; i<factors.length; i++) {
            var nextFactorOp = QueryFilters.runFilter(factors[i].expression, bindings,queryEngine, dataset, env);
            if(QueryFilters.isEbvError(nextFactorOp)) {
                return factorOp;
            }
            if(QueryFilters.isNumeric(nextFactorOp)) {
                if(factors[i].operator === '*') {
                    acum = QueryFilters.runMulFunction(acum, nextFactorOp);
                } else if(factors[i].operator === '/') {
                    acum = QueryFilters.runDivFunction(acum, nextFactorOp);
                }
            } else {
                return QueryFilters.ebvFalse();
            }
        }
        return acum;
    } else {
        return QueryFilters.ebvFalse();
    }
};

QueryFilters.runMulFunction = function(faca, facb) {
    if(QueryFilters.isEbvError(faca) || QueryFilters.isEbvError(facb)) {
        return QueryFilters.ebvError();
    }
    var val = QueryFilters.effectiveTypeValue(faca) * QueryFilters.effectiveTypeValue(facb);

    if(QueryFilters.isDouble(faca) || QueryFilters.isDouble(facb)) {
        return {token: 'literal', type:"http://www.w3.org/2001/XMLSchema#double", value:val};        
    } else if(QueryFilters.isFloat(faca) || QueryFilters.isFloat(facb)) {
        return {token: 'literal', type:"http://www.w3.org/2001/XMLSchema#float", value:val};        
    } else if(QueryFilters.isDecimal(faca) || QueryFilters.isDecimal(facb)) {
        return {token: 'literal', type:"http://www.w3.org/2001/XMLSchema#decimal", value:val};        
    } else {
        return {token: 'literal', type:"http://www.w3.org/2001/XMLSchema#integer", value:val};        
    }
};

QueryFilters.runDivFunction = function(faca, facb) {
    if(QueryFilters.isEbvError(faca) || QueryFilters.isEbvError(facb)) {
        return QueryFilters.ebvError();
    }
    var val = QueryFilters.effectiveTypeValue(faca) / QueryFilters.effectiveTypeValue(facb);

    if(QueryFilters.isDouble(faca) || QueryFilters.isDouble(facb)) {
        return {token: 'literal', type:"http://www.w3.org/2001/XMLSchema#double", value:val};        
    } else if(QueryFilters.isFloat(faca) || QueryFilters.isFloat(facb)) {
        return {token: 'literal', type:"http://www.w3.org/2001/XMLSchema#float", value:val};        
    } else if(QueryFilters.isDecimal(faca) || QueryFilters.isDecimal(facb)) {
        return {token: 'literal', type:"http://www.w3.org/2001/XMLSchema#decimal", value:val};        
    } else {
        return {token: 'literal', type:"http://www.w3.org/2001/XMLSchema#integer", value:val};        
    }
};

QueryFilters.runBuiltInCall = function(builtincall, args, bindings, queryEngine, dataset, env) {
    if(builtincall === 'notexists' || builtincall === 'exists') {
        // Run the query in the filter applying bindings

        var cloned = JSON.parse(JSON.stringify(args[0])); // @todo CHANGE THIS!!
        var ast = queryEngine.abstractQueryTree.parseSelect({pattern:cloned}, bindings);
        ast = queryEngine.abstractQueryTree.bind(ast.pattern, bindings);

        var result = queryEngine.executeSelectUnit([ {kind:'*'} ], 
                                                   dataset,
                                                   ast,
                                                   env);

        if(builtincall === 'exists') {
            return QueryFilters.ebvBoolean(result.length!==0);            
        } else {
            return QueryFilters.ebvBoolean(result.length===0);            
        }

    }  else {

        var ops = [];
        for(var i=0; i<args.length; i++) {
            if(args[i].token === 'var') {
                ops.push(args[i]);
            } else {
                var op = QueryFilters.runFilter(args[i], bindings, queryEngine, dataset, env);
                if(QueryFilters.isEbvError(op)) {
                    return op;
                }
                ops.push(op);
            }
        }

        if(builtincall === 'str') {
            if(ops[0].token === 'literal') {
                // lexical form literals
                return {token: 'literal', type:null, value:""+ops[0].value}; // type null? or "http://www.w3.org/2001/XMLSchema#string"
            } else if(ops[0].token === 'uri'){
                // codepoint URIs
                return {token: 'literal', type:null, value:ops[0].value}; // idem
            } else {
                return QueryFilters.ebvFalse();
            }
        } else if(builtincall === 'lang') {
            if(ops[0].token === 'literal'){
                if(ops[0].lang != null) {
                    return {token: 'literal', value:""+ops[0].lang};
                } else {
                    return {token: 'literal', value:""};
                }
            } else {
                return QueryFilters.ebvError();
            }
        } else if(builtincall === 'datatype') {
            if(ops[0].token === 'literal'){
                var lit = ops[0];
                if(lit.type != null) {
                    if(typeof(lit.type) === 'string') {
                        return {token: 'uri', value:lit.type, prefix:null, suffix:null};
                    } else {
                        return lit.type;
                    }
                } else if(lit.lang == null) {
                    return {token: 'uri', value:'http://www.w3.org/2001/XMLSchema#string', prefix:null, suffix:null};
                } else {
                    return QueryFilters.ebvError();
                }
            } else {
                return QueryFilters.ebvError();
            }
        } else if(builtincall === 'isliteral') {
            if(ops[0].token === 'literal'){
                return QueryFilters.ebvTrue();
            } else {
                return QueryFilters.ebvFalse();
            }        
        } else if(builtincall === 'isblank') {
            if(ops[0].token === 'blank'){
                return QueryFilters.ebvTrue();
            } else {
                return QueryFilters.ebvFalse();
            }        
        } else if(builtincall === 'isuri' || builtincall === 'isiri') {
            if(ops[0].token === 'uri'){
                return QueryFilters.ebvTrue();
            } else {
                return QueryFilters.ebvFalse();
            }        
        } else if(builtincall === 'sameterm') {
            var op1 = ops[0];
            var op2 = ops[1];
            var res = QueryFilters.RDFTermEquality(op1, op2, queryEngine, env);
            if(QueryFilters.isEbvError(res)) {
                res = false;
            }
            return QueryFilters.ebvBoolean(res);
        } else if(builtincall === 'langmatches') {
            var lang = ops[0];
            var langRange = ops[1];

            if(lang.token === 'literal' && langRange.token === 'literal'){
                if(langRange.value === '*' && lang.value != '') {
                    return QueryFilters.ebvTrue();
                } else {
                    return QueryFilters.ebvBoolean(lang.value.toLowerCase().indexOf(langRange.value.toLowerCase()) === 0)
                }
            } else {
                return QueryFilters.ebvError();
            }        
        } else if(builtincall === 'bound') {
            var boundVar = ops[0].value;
            var acum = [];
            if(boundVar == null) {
                return QueryFilters.ebvError();
            } else  if(bindings[boundVar] != null) {
                return QueryFilters.ebvTrue();
            } else {
                return QueryFilters.ebvFalse();
            }
	} else if(queryEngine.customFns[builtincall] != null) {
	    return queryEngine.customFns[builtincall](QueryFilters, ops);
        } else {
            throw ("Builtin call "+builtincall+" not implemented yet");
        }
    }
};

QueryFilters.runUnaryExpression = function(unaryexpression, expression, bindings, queryEngine, dataset, env) {
    var op = QueryFilters.runFilter(expression, bindings,queryEngine, dataset, env);
    if(QueryFilters.isEbvError(op)) {
        return op;
    }

    if(unaryexpression === '!') {
        var res = QueryFilters.ebv(op);
        //console.log("** Unary ! ");
        //console.log(op)
        if(QueryFilters.isEbvError(res)) {
            //console.log("--- ERROR")
            //console.log(QueryFilters.ebvFalse())
            //console.log("\r\n")

            // ??
            return QueryFilters.ebvFalse();
        } else {
            res = !res;
            //console.log("--- BOOL")
            //console.log(QueryFilters.ebvBoolean(res))
            //console.log("\r\n")

            return QueryFilters.ebvBoolean(res);
        }
    } else if(unaryexpression === '+') {
        if(QueryFilters.isNumeric(op)) {
            return op;
        } else {
            return QueryFilters.ebvError();
        }
    } else if(unaryexpression === '-') {
        if(QueryFilters.isNumeric(op)) {
            var clone = {};
            for(var p in op) {
                clone[p] = op[p];
            }
            clone.value = -clone.value;
            return clone;
        } else {
            return QueryFilters.ebvError();
        }
    }
};

QueryFilters.runRegex = function(text, pattern, flags, bindings, queryEngine, dataset, env) {

    if(text != null) {
        text = QueryFilters.runFilter(text, bindings, queryEngine, dataset, env);
    } else {
        return QueryFilters.ebvError();
    }

    if(pattern != null) {
        pattern = QueryFilters.runFilter(pattern, bindings, queryEngine, dataset, env);
    } else {
        return QueryFilters.ebvError();
    }

    if(flags != null) {
        flags = QueryFilters.runFilter(flags, bindings, queryEngine, dataset, env);
    }


    if(pattern != null && pattern.token === 'literal' && (flags == null || flags.token === 'literal')) {
        pattern = pattern.value;
        flags = (flags == null) ? null : flags.value;
    } else {
        return QueryFilters.ebvError();
    }

    if(text!= null && text.token == 'var') {
        if(bindings[text.value] != null) {
            text = bindings[text.value];
        } else {
            return QueryFilters.ebvError();
        }
    } else if(text!=null && text.token === 'literal') {
        if(text.type == null || QueryFilters.isXsdType("string",text)) {
            text = text.value
        } else {
            return QueryFilters.ebvError();
        }
    } else {
        return QueryFilters.ebvError();
    }

    var regex;
    if(flags == null) {
        regex = new RegExp(pattern);                    
    } else {
        regex = new RegExp(pattern,flags.toLowerCase());
    }
    if(regex.exec(text)) {
        return QueryFilters.ebvTrue();
    } else {
        return QueryFilters.ebvFalse();
    }    
};

QueryFilters.normalizeLiteralDatatype = function(literal, queryEngine, env) {
    if(literal.value.type == null || typeof(literal.value.type) != 'object') {
        return literal;
    } else {
        // type can be parsed as a hash using namespaces
        literal.value.type =  Utils.lexicalFormBaseUri(literal.value.type, env);
        return literal;
    }
};

QueryFilters.runIriRefOrFunction = function(iriref, args, bindings,queryEngine, dataset, env) {
    if(args == null) {
        return iriref;
    } else {
        var ops = [];
        for(var i=0; i<args.length; i++) {
            ops.push(QueryFilters.runFilter(args[i], bindings, queryEngine, dataset, env))
        }

        var fun = Utils.lexicalFormBaseUri(iriref, env);

        if(fun == "http://www.w3.org/2001/XMLSchema#integer" ||
           fun == "http://www.w3.org/2001/XMLSchema#decimal" ||
           fun == "http://www.w3.org/2001/XMLSchema#double" ||
           fun == "http://www.w3.org/2001/XMLSchema#nonPositiveInteger" ||
           fun == "http://www.w3.org/2001/XMLSchema#negativeInteger" ||
           fun == "http://www.w3.org/2001/XMLSchema#long" ||
           fun == "http://www.w3.org/2001/XMLSchema#int" ||
           fun == "http://www.w3.org/2001/XMLSchema#short" ||
           fun == "http://www.w3.org/2001/XMLSchema#byte" ||
           fun == "http://www.w3.org/2001/XMLSchema#nonNegativeInteger" ||
           fun == "http://www.w3.org/2001/XMLSchema#unsignedLong" ||
           fun == "http://www.w3.org/2001/XMLSchema#unsignedInt" ||
           fun == "http://www.w3.org/2001/XMLSchema#unsignedShort" ||
           fun == "http://www.w3.org/2001/XMLSchema#unsignedByte" ||
           fun == "http://www.w3.org/2001/XMLSchema#positiveInteger") {
            var from = ops[0];
            if(from.token === 'literal') {
                from = QueryFilters.normalizeLiteralDatatype(from, queryEngine, env);
                if(from.type == "http://www.w3.org/2001/XMLSchema#integer" ||
                   from.type == "http://www.w3.org/2001/XMLSchema#decimal" ||
                   from.type == "http://www.w3.org/2001/XMLSchema#double" ||
                   from.type == "http://www.w3.org/2001/XMLSchema#nonPositiveInteger" ||
                   from.type == "http://www.w3.org/2001/XMLSchema#negativeInteger" ||
                   from.type == "http://www.w3.org/2001/XMLSchema#long" ||
                   from.type == "http://www.w3.org/2001/XMLSchema#int" ||
                   from.type == "http://www.w3.org/2001/XMLSchema#short" ||
                   from.type == "http://www.w3.org/2001/XMLSchema#byte" ||
                   from.type == "http://www.w3.org/2001/XMLSchema#nonNegativeInteger" ||
                   from.type == "http://www.w3.org/2001/XMLSchema#unsignedLong" ||
                   from.type == "http://www.w3.org/2001/XMLSchema#unsignedInt" ||
                   from.type == "http://www.w3.org/2001/XMLSchema#unsignedShort" ||
                   from.type == "http://www.w3.org/2001/XMLSchema#unsignedByte" ||
                   from.type == "http://www.w3.org/2001/XMLSchema#positiveInteger") {
                    from.type = fun;
                    return from;
                } else if(from.type == 'http://www.w3.org/2001/XMLSchema#boolean') {
                    if(QueryFilters.ebv(from) == true) {
                        from.type = fun;
                        from.value = 1;
                    } else {
                        from.type = fun;
                        from.value = 0;
                    }
                    return from;
                } else if(from.type == 'http://www.w3.org/2001/XMLSchema#float' || 
                          from.type == 'http://www.w3.org/2001/XMLSchema#double') {
                    from.type = fun;
                    from.value = parseInt(from.value);
                    return from;
                } else if(from.type == 'http://www.w3.org/2001/XMLSchema#string' || from.type == null) {
                    if(from.value.split(".").length > 2) {
                        return QueryFilters.ebvError();
                    } else if (from.value.split("-").length > 2) {
                        return QueryFilters.ebvError();                            
                    } else if (from.value.split("/").length > 2) {
                        return QueryFilters.ebvError();                            
                    } else if (from.value.split("+").length > 2) {
                        return QueryFilters.ebvError();                            
                    }

                    // @todo improve this with regular expressions for each lexical representation
                    if(fun == "http://www.w3.org/2001/XMLSchema#decimal") {
                        if(from.value.indexOf("e") != -1 || from.value.indexOf("E") != -1) {
                            return QueryFilters.ebvError();
                        }
                    }

                    // @todo improve this with regular expressions for each lexical representation
                    if(fun == "http://www.w3.org/2001/XMLSchema#int" || fun == "http://www.w3.org/2001/XMLSchema#integer") {
                        if(from.value.indexOf("e") != -1 || from.value.indexOf("E") != -1 || from.value.indexOf(".") != -1) {
                            return QueryFilters.ebvError();
                        }
                    }

                    try {
                        from.value = parseInt(parseFloat(from.value));
                        if(isNaN(from.value)) {
                            return QueryFilters.ebvError();
                        } else {
                            from.type = fun;
                            return from;
                        }
                    } catch(e) {
                        return QueryFilters.ebvError();                        
                    }
                } else {
                    return QueryFilters.ebvError();
                }
            } else {
                return QueryFilters.ebvError();
            }
        } else if(fun == "http://www.w3.org/2001/XMLSchema#boolean") { 
            var from = ops[0];
            if(from.token === "literal" && from.type == null) {
                if(from.value === "true" || from.value === "1") {
                    return QueryFilters.ebvTrue();
                } else if(from.value === "false" || from.value === "0" ) {
                    return QueryFilters.ebvFalse();
                } else {
                    return QueryFilters.ebvError();
                }
            } else if(from.token === "literal") {
              if(QueryFilters.isEbvError(from)) {
                  return from;
              } else {
                  return QueryFilters.ebvBoolean(from);
              }
            } else {
                return QueryFilters.ebvError();
            }
        } else if(fun == "http://www.w3.org/2001/XMLSchema#string") { 
            var from = ops[0];
            if(from.token === 'literal') {
                from = QueryFilters.normalizeLiteralDatatype(from, queryEngine, env);
                if(from.type == "http://www.w3.org/2001/XMLSchema#integer" ||
                   from.type == "http://www.w3.org/2001/XMLSchema#decimal" ||
                   from.type == "http://www.w3.org/2001/XMLSchema#double" ||
                   from.type == "http://www.w3.org/2001/XMLSchema#nonPositiveInteger" ||
                   from.type == "http://www.w3.org/2001/XMLSchema#negativeInteger" ||
                   from.type == "http://www.w3.org/2001/XMLSchema#long" ||
                   from.type == "http://www.w3.org/2001/XMLSchema#int" ||
                   from.type == "http://www.w3.org/2001/XMLSchema#short" ||
                   from.type == "http://www.w3.org/2001/XMLSchema#byte" ||
                   from.type == "http://www.w3.org/2001/XMLSchema#nonNegativeInteger" ||
                   from.type == "http://www.w3.org/2001/XMLSchema#unsignedLong" ||
                   from.type == "http://www.w3.org/2001/XMLSchema#unsignedInt" ||
                   from.type == "http://www.w3.org/2001/XMLSchema#unsignedShort" ||
                   from.type == "http://www.w3.org/2001/XMLSchema#unsignedByte" ||
                   from.type == "http://www.w3.org/2001/XMLSchema#positiveInteger" ||
                   from.type == "http://www.w3.org/2001/XMLSchema#float") {
                    from.type = fun;
                    from.value = ""+from.value;
                    return from;
                } else if(from.type == "http://www.w3.org/2001/XMLSchema#string") {
                    return from;
                } else if(from.type == "http://www.w3.org/2001/XMLSchema#boolean") {
                    if(QueryFilters.ebv(from)) {
                        from.type = fun;
                        from.value = 'true';
                    } else {
                        from.type = fun;
                        from.value = 'false';
                    }
                    return from;
                } else if(from.type == "http://www.w3.org/2001/XMLSchema#dateTime" ||
                          from.type == "http://www.w3.org/2001/XMLSchema#date") {
                    from.type = fun;
                    if(typeof(from.value) != 'string') {
                        from.value = Utils.iso8601(from.value);
                    }
                    return from;
                } else if(from.type == null) {
                    from.value = ""+from.value;
                    from.type = fun;
                    return from;
                } else {
                    return QueryFilters.ebvError();
                }
            } else if(from.token === 'uri') {
                return {token: 'literal',
                        value: Utils.lexicalFormBaseUri(from, env),
                        type: fun,
                        lang: null};
            } else {
                return QueryFilters.ebvError();
            }            
        } else if(fun == "http://www.w3.org/2001/XMLSchema#dateTime" || fun == "http://www.w3.org/2001/XMLSchema#date") { 
            from = ops[0];
            if(from.type == "http://www.w3.org/2001/XMLSchema#dateTime" || from.type == "http://www.w3.org/2001/XMLSchema#date") {
                return from;
            } else if(from.type == "http://www.w3.org/2001/XMLSchema#string" || from.type == null) {
                try {
                    from.value = Utils.iso8601(Utils.parseStrictISO8601(from.value));
                    from.type = fun;
                    return from;
                } catch(e) {
                    return QueryFilters.ebvError();
                }
            } else {
                return QueryFilters.ebvError();
            }
        } else if(fun == "http://www.w3.org/2001/XMLSchema#float") { 
            var from = ops[0];
            if(from.token === 'literal') {
                from = QueryFilters.normalizeLiteralDatatype(from, queryEngine, env);
                if(from.type == 'http://www.w3.org/2001/XMLSchema#decimal' || 
                   from.type == 'http://www.w3.org/2001/XMLSchema#int') {
                    from.type = fun;
                    from.value = parseFloat(from.value);
                    return from;
                } else if(from.type == 'http://www.w3.org/2001/XMLSchema#boolean') {
                    if(QueryFilters.ebv(from) == true) {
                        from.type = fun;
                        from.value = 1.0;
                    } else {
                        from.type = fun;
                        from.value = 0.0;
                    }
                    return from;
                } else if(from.type == 'http://www.w3.org/2001/XMLSchema#float' || 
                          from.type == 'http://www.w3.org/2001/XMLSchema#double') {
                    from.type = fun;
                    from.value = parseFloat(from.value);
                    return from;
                } else if(from.type == 'http://www.w3.org/2001/XMLSchema#string') {
                    try {
                        from.value = parseFloat(from.value);
                        if(isNaN(from.value)) {
                            return QueryFilters.ebvError();
                        } else {
                            from.type = fun;
                            return from;
                        }
                    } catch(e) {
                        return QueryFilters.ebvError();                        
                    }
                } else if(from.type == null) {
                    // checking some exceptions that are parsed as Floats by JS
                    if(from.value.split(".").length > 2) {
                        return QueryFilters.ebvError();
                    } else if (from.value.split("-").length > 2) {
                        return QueryFilters.ebvError();                            
                    } else if (from.value.split("/").length > 2) {
                        return QueryFilters.ebvError();                            
                    } else if (from.value.split("+").length > 2) {
                        return QueryFilters.ebvError();                            
                    }

                    try {
                        from.value = parseFloat(from.value);
                        if(isNaN(from.value)) {
                            return QueryFilters.ebvError();
                        } else {
                            from.type = fun;
                            return from;
                        }
                    } catch(e) {
                        return QueryFilters.ebvError();                        
                    }
                } else {
                    return QueryFilters.ebvError();
                }
            } else {
                return QueryFilters.ebvError();
            }
        } else {
            // unknown function
            return QueryFilters.ebvError();
        }
    }
};

// end of ./src/js-query-engine/src/query_filters.js 
try{
  if(typeof(module)==="undefined") {
    window['RDFJSInterface'] = RDFJSInterface;

    /* For ADVANCED optimisations */

    //window['RDFJSInterface']['UrisMap'] = RDFJSInterface.UrisMap;
    //window['RDFJSInterface']['UrisMap']['prototype']['get'] = RDFJSInterface.UrisMap.prototype.get;
    //window['RDFJSInterface']['UrisMap']['prototype']['values'] = RDFJSInterface.UrisMap.prototype.values;
    //window['RDFJSInterface']['UrisMap']['prototype']['remove'] = RDFJSInterface.UrisMap.prototype.remove;
    //window['RDFJSInterface']['UrisMap']['prototype']['set'] = RDFJSInterface.UrisMap.prototype.set;
    //window['RDFJSInterface']['UrisMap']['prototype']['setDefault'] = RDFJSInterface.UrisMap.prototype.setDefault;
    //window['RDFJSInterface']['UrisMap']['prototype']['addAll'] = RDFJSInterface.UrisMap.prototype.addAll;
    //window['RDFJSInterface']['UrisMap']['prototype']['resolve'] = RDFJSInterface.UrisMap.prototype.resolve;
    //window['RDFJSInterface']['UrisMap']['prototype']['shrink'] = RDFJSInterface.UrisMap.prototype.shrink;

    //window['RDFJSInterface']['Profile'] = RDFJSInterface.Profile;
    //window['RDFJSInterface']['Profile']['prototype']['importProfile'] = RDFJSInterface.Profile.prototype.importProfile;
    //window['RDFJSInterface']['Profile']['prototype']['resolve'] = RDFJSInterface.Profile.prototype.resolve;
    //window['RDFJSInterface']['Profile']['prototype']['setDefaultPrefix'] = RDFJSInterface.Profile.prototype.setDefaultPrefix;
    //window['RDFJSInterface']['Profile']['prototype']['setDefaultVocabulary'] = RDFJSInterface.Profile.prototype.setDefaultVocabulary;
    //window['RDFJSInterface']['Profile']['prototype']['setPrefix'] = RDFJSInterface.Profile.prototype.setPrefix;
    //window['RDFJSInterface']['Profile']['prototype']['setTerm'] = RDFJSInterface.Profile.prototype.setTerm;

    //window['RDFJSInterface']['RDFEnvironment'] = RDFJSInterface.RDFEnvironment;
    //window['RDFJSInterface']['RDFEnvironment']['prototype']['createBlankNode'] = RDFJSInterface.RDFEnvironment.prototype.createBlankNode;
    //window['RDFJSInterface']['RDFEnvironment']['prototype']['createNamedNode'] = RDFJSInterface.RDFEnvironment.prototype.createNamedNode;
    //window['RDFJSInterface']['RDFEnvironment']['prototype']['createLiteral'] = RDFJSInterface.RDFEnvironment.prototype.createLiteral;
    //window['RDFJSInterface']['RDFEnvironment']['prototype']['createTriple'] = RDFJSInterface.RDFEnvironment.prototype.createTriple;
    //window['RDFJSInterface']['RDFEnvironment']['prototype']['createGraph'] = RDFJSInterface.RDFEnvironment.prototype.createGraph;
    //window['RDFJSInterface']['RDFEnvironment']['prototype']['createAction'] = RDFJSInterface.RDFEnvironment.prototype.createAction;
    //window['RDFJSInterface']['RDFEnvironment']['prototype']['createProfile'] = RDFJSInterface.RDFEnvironment.prototype.createProfile;
    //window['RDFJSInterface']['RDFEnvironment']['prototype']['createTermMap'] = RDFJSInterface.RDFEnvironment.prototype.createTermMap;
    //window['RDFJSInterface']['RDFEnvironment']['prototype']['createPrefixMap'] = RDFJSInterface.RDFEnvironment.prototype.createPrefixMap;

    //window['RDFJSInterface']['RDFNode'] = RDFJSInterface.RDFNode;
    //window['RDFJSInterface']['RDFNode']['prototype']['equals'] = RDFJSInterface.RDFNode.prototype.equals;

    //window['RDFJSInterface']['BlankNode'] = RDFJSInterface.BlankNode;
    //window['RDFJSInterface']['BlankNode']['prototype']['toString'] = RDFJSInterface.BlankNode.prototype.toString;
    //window['RDFJSInterface']['BlankNode']['prototype']['toNT'] = RDFJSInterface.BlankNode.prototype.toNT;
    //window['RDFJSInterface']['BlankNode']['prototype']['valueOf'] = RDFJSInterface.BlankNode.prototype.valueOf;

    //window['RDFJSInterface']['Literal'] = RDFJSInterface.Literal;
    //window['RDFJSInterface']['Literal']['prototype']['toString'] = RDFJSInterface.Literal.prototype.toString;
    //window['RDFJSInterface']['Literal']['prototype']['toNT'] = RDFJSInterface.Literal.prototype.toNT;
    //window['RDFJSInterface']['Literal']['prototype']['valueOf'] = RDFJSInterface.Literal.prototype.valueOf;

    //window['RDFJSInterface']['NamedNode'] = RDFJSInterface.NamedNode;
    //window['RDFJSInterface']['NamedNode']['prototype']['toString'] = RDFJSInterface.NamedNode.prototype.toString;
    //window['RDFJSInterface']['NamedNode']['prototype']['toNT'] = RDFJSInterface.NamedNode.prototype.toNT;
    //window['RDFJSInterface']['NamedNode']['prototype']['valueOf'] = RDFJSInterface.NamedNode.prototype.valueOf;

    //window['RDFJSInterface']['Triple'] = RDFJSInterface.Triple;
    //window['RDFJSInterface']['Triple']['prototype']['equals'] = RDFJSInterface.Triple.prototype.equals;
    //window['RDFJSInterface']['Triple']['prototype']['toString'] = RDFJSInterface.Triple.prototype.toString;

    //window['RDFJSInterface']['Graph'] = RDFJSInterface.Graph;
    //window['RDFJSInterface']['Graph']['prototype']['add'] = RDFJSInterface.Graph.prototype.add;
    //window['RDFJSInterface']['Graph']['prototype']['addAction'] = RDFJSInterface.Graph.prototype.addAction;
    //window['RDFJSInterface']['Graph']['prototype']['addAll'] = RDFJSInterface.Graph.prototype.addAll;
    //window['RDFJSInterface']['Graph']['prototype']['remove'] = RDFJSInterface.Graph.prototype.remove;
    //window['RDFJSInterface']['Graph']['prototype']['toArray'] = RDFJSInterface.Graph.prototype.toArray;
    //window['RDFJSInterface']['Graph']['prototype']['some'] = RDFJSInterface.Graph.prototype.some;
    //window['RDFJSInterface']['Graph']['prototype']['every'] = RDFJSInterface.Graph.prototype.every;
    //window['RDFJSInterface']['Graph']['prototype']['filter'] = RDFJSInterface.Graph.prototype.filter;
    //window['RDFJSInterface']['Graph']['prototype']['forEach'] = RDFJSInterface.Graph.prototype.forEach;
    //window['RDFJSInterface']['Graph']['prototype']['merge'] = RDFJSInterface.Graph.prototype.merge;
    //window['RDFJSInterface']['Graph']['prototype']['match'] = RDFJSInterface.Graph.prototype.match;
    //window['RDFJSInterface']['Graph']['prototype']['removeMatches'] = RDFJSInterface.Graph.prototype.removeMatches;
    //window['RDFJSInterface']['Graph']['prototype']['toNT'] = RDFJSInterface.Graph.prototype.toNT;

    //window['RDFJSInterface']['rdf'] = RDFJSInterface.rdf;
  } else {
    module.exports = RDFJSInterface;
  }
}catch(e){}
})();
