// exports
exports.RDFJSInterface = {};
var RDFJSInterface = exports.RDFJSInterface;

// imports
var Utils = require("./../../js-trees/src/utils").Utils;
var QueryFilters = require("./query_filters").QueryFilters;

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
Utils.extends(RDFJSInterface.Profile,RDFJSInterface.RDFEnvironment);

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

Utils.extends(RDFJSInterface.RDFNode,RDFJSInterface.BlankNode);

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

Utils.extends(RDFJSInterface.RDFNode,RDFJSInterface.Literal);

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

Utils.extends(RDFJSInterface.RDFNode,RDFJSInterface.NamedNode);

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
