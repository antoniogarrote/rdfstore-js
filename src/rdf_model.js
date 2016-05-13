// imports
var _ = require("./utils");
var QueryFilters = require("./query_filters").QueryFilters;

RDFModel = {};

/**
 * Implementation of <http://www.w3.org/TR/rdf-interfaces/>
 */

// Uris map

RDFModel.defaultContext = {
    "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
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
    "ccard": "http://purl.org/commerce/creditcard#",
    "ldp": "http://www.w3.org/ns/ldp#"
};

RDFModel.UrisMap = function() {
    this.defaultNs = "";
    this.interfaceProperties = ['get', 'remove', 'set', 'setDefault', 'addAll', 'resolve', 'shrink'];
};

RDFModel.UrisMap.prototype.values = function() {
    var collected = {};
    for(var p in this) {
	if(!_.include(this.interfaceProperties,p) &&
	    typeof(this[p])!=='function' &&
	    p!=='defaultNs' &&
	    p!=='interfaceProperties') {
	    collected[p] = this[p];
	}
    }

    return collected;
};

RDFModel.UrisMap.prototype.get = function(prefix) {
    if(prefix.indexOf(" ") != -1) {
	throw "Prefix must not contain any whitespaces";
    }
    return this[prefix];
};

RDFModel.UrisMap.prototype.remove = function(prefix) {
    if(prefix.indexOf(" ") != -1) {
	throw "Prefix must not contain any whitespaces";
    }

    delete this[prefix];

    return null;
};

RDFModel.UrisMap.prototype.set = function(prefix, iri) {
    if(prefix.indexOf(" ") != -1) {
	throw "Prefix must not contain any whitespaces";
    }

    this[prefix] = iri;
};


RDFModel.UrisMap.prototype.setDefault = function(iri) {
    this.defaultNs =iri;
};

RDFModel.UrisMap.prototype.addAll = function(prefixMap, override) {
    for(var prefix in prefixMap) {
	if(!_.include(this.interfaceProperties, prefix)) {
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

RDFModel.UrisMap.prototype.resolve = function(curie) {
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

RDFModel.UrisMap.prototype.shrink = function(iri) {
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

RDFModel.Profile = function() {
    this.prefixes = new RDFModel.UrisMap();
    this.terms = new RDFModel.UrisMap();
};

RDFModel.Profile.prototype.importProfile = function(profile, override) {
    this.prefixes.addAll(profile.prefixes, override);
    this.terms.addAll(profile.terms, override);
};


RDFModel.Profile.prototype.resolve = function(toResolve) {
    if(toResolve.indexOf(":") != -1) {
	return this.prefixes.resolve(toResolve);
    } else if(this.terms[toResolve] != null) {
	return this.terms.resolve(toResolve);
    } else {
	return null;
    }
};

RDFModel.Profile.prototype.setDefaultPrefix = function(iri) {
    this.prefixes.setDefault(iri);
};

RDFModel.Profile.prototype.setDefaultVocabulary = function(iri) {
    this.terms.setDefault(iri);
};

RDFModel.Profile.prototype.setPrefix = function(prefix, iri) {
    this.prefixes.set(prefix, iri);
};

RDFModel.Profile.prototype.setTerm = function(term, iri) {
    this.terms.set(term, iri);
};

// RDF environemnt
RDFModel.RDFEnvironment = function () {
    RDFModel.Profile.call(this);
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

    for (var p in RDFModel.defaultContext) {
	this.prefixes.set(p, RDFModel.defaultContext[p]);
    }
};
RDFModel.RDFEnvironment.prototype = _.create(RDFModel.Profile.prototype,{'constructor': RDFModel.RDFEnvironment});

RDFModel.RDFEnvironment.prototype.createBlankNode = function() {
    var bnode =  new RDFModel.BlankNode(this.blankNodeCounter);
    this.blankNodeCounter++;
    return bnode;
};

RDFModel.RDFEnvironment.prototype.createNamedNode = function(value) {
    var resolvedValue = this.resolve(value);
    if(resolvedValue != null) {
	return new RDFModel.NamedNode(resolvedValue);
    } else {
	return new RDFModel.NamedNode(value);
    }
};

RDFModel.RDFEnvironment.prototype.createLiteral = function(value, language, datatype) {
    if(datatype != null) {
	return new RDFModel.Literal(value, language, datatype.toString());
    } else {
	return new RDFModel.Literal(value, language, datatype);
    }
};

RDFModel.RDFEnvironment.prototype.createTriple = function(subject, predicate, object) {
    return new RDFModel.Triple(subject, predicate, object);
};

RDFModel.RDFEnvironment.prototype.createGraph = function(triples) {
    var graph = new RDFModel.Graph();
    if(triples != null) {
	for(var i=0; i<triples.length; i++) {
	    graph.add(triples[i]);
	}
    }
    return graph;
};

RDFModel.RDFEnvironment.prototype.createAction = function(test, action) {
    return function(triple) {
	if(test(triple)) {
	    return action(triple);
	} else {
	    return triple;
	}
    }
};

RDFModel.RDFEnvironment.prototype.createProfile = function(empty) {
    // empty (opt);
    if(empty === true) {
	return new RDFModel.RDFEnvironment.Profile();
    } else {
	var profile = new RDFModel.RDFEnvironment.Profile();
	profile.importProfile(this);

	return profile;
    }
};

RDFModel.RDFEnvironment.prototype.createTermMap = function(empty) {
    if(empty === true) {
	return new RDFModel.UrisMap();
    } else {
	var cloned = this.terms.values();
	var termMap = new RDFModel.UrisMap();

	for(var p in cloned) {
	    termMap[p] = cloned[p];
	}

	return termMap;
    }
};

RDFModel.RDFEnvironment.prototype.createPrefixMap = function(empty) {
    if(empty === true) {
	return new RDFModel.UrisMap();
    } else {
	var cloned = this.prefixes.values();
	var prefixMap = new RDFModel.UrisMap();

	for(var p in cloned) {
	    prefixMap[p] = cloned[p];
	}

	return prefixMap;
    }
};

// Common RDFNode interface

RDFModel.RDFNode = function(interfaceName){
    this.interfaceName = interfaceName;
    this.attributes  = ["interfaceName", "nominalValue"]
};

RDFModel.RDFNode.prototype.equals = function(otherNode) {
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

RDFModel.BlankNode = function(bnodeId) {
    RDFModel.RDFNode.call(this, "BlankNode");
    this.nominalValue = "_:"+bnodeId;
    this.bnodeId = bnodeId;
};

RDFModel.BlankNode.prototype = _.create(RDFModel.RDFNode.prototype, {'constructor':RDFModel.BlankNode});

RDFModel.BlankNode.prototype.toString = function(){
    return this.nominalValue;
};

RDFModel.BlankNode.prototype.toNT = function() {
    return this.nominalValue;
};

RDFModel.BlankNode.prototype.valueOf = function() {
    return this.nominalValue;
};

// Literal node

RDFModel.Literal = function(value, language, datatype) {
    RDFModel.RDFNode.call(this, "Literal");
    this.nominalValue = value;
    if(language != null) {
	this.language = language;
    } else if(datatype != null) {
	this.datatype = datatype;
    }
};

RDFModel.Literal.prototype = _.create(RDFModel.RDFNode.prototype,{'constructor':RDFModel.Literal});

RDFModel.Literal.prototype.toString = function(){
    var tmp = '"'+this.nominalValue+'"';
    if(this.language != null) {
	tmp = tmp + "@" + this.language;
    } else if(this.datatype != null || this.type) {
	tmp = tmp + "^^<" + (this.datatype||this.type) + ">";
    }

    return tmp;
};

RDFModel.Literal.prototype.toNT = function() {
    return this.toString();
};

RDFModel.Literal.prototype.valueOf = function() {
    return QueryFilters.effectiveTypeValue({
	token: 'literal',
	type: (this.type || this.datatype),
	value: this.nominalValue,
	language: this.language
    });
};

// NamedNode node

RDFModel.NamedNode = function(val) {
    RDFModel.RDFNode.call(this, "NamedNode");
    if(val.value != null) {
	this.nominalValue = val.value;
    } else {
	this.nominalValue = val;
    }
};

RDFModel.NamedNode.prototype = _.create(RDFModel.RDFNode.prototype, {'constructor':RDFModel.NamedNode});

RDFModel.NamedNode.prototype.toString = function(){
    return this.nominalValue;
};

RDFModel.NamedNode.prototype.toNT = function() {
    return "<"+this.toString()+">";
};

RDFModel.NamedNode.prototype.valueOf = function() {
    return this.nominalValue;
};

// Triple interface
RDFModel.Triple = function(subject, predicate, object){
    this.subject = subject;
    this.predicate = predicate;
    this.object = object;
};

RDFModel.Triple.prototype.equals = function(otherTriple) {
    return this.subject.equals(otherTriple.subject) &&
	this.predicate.equals(otherTriple.predicate) &&
	this.object.equals(otherTriple.object);
};

RDFModel.Triple.prototype.toString = function() {
    return this.subject.toNT()+" "+this.predicate.toNT()+" "+this.object.toNT()+" . \r\n";
};

// Graph interface

RDFModel.Graph = function() {
    this.triples = [];
    this.duplicates = {};
    this.actions = [];
    this.length = 0;
};

RDFModel.Graph.prototype.add = function(triple) {
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

RDFModel.Graph.prototype.addAction = function (tripleAction, run) {
    this.actions.push(tripleAction);
    if (run == true) {
	for (var i = 0; i < this.triples.length; i++) {
	    this.triples[i] = tripleAction(this.triples[i]);
	}
    }

    return this;
};

RDFModel.Graph.prototype.addAll = function (graph) {
    var newTriples = graph.toArray();
    for (var i = 0; i < newTriples.length; i++) {
	this.add(newTriples[i]);
    }

    this.length = this.triples.length;
    return this;
};

RDFModel.Graph.prototype.remove = function(triple) {
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

RDFModel.Graph.prototype.toArray = function() {
    return this.triples;
};

RDFModel.Graph.prototype.some = function(p) {
    for(var i=0; i<this.triples.length; i++) {
	if(p(this.triples[i],this) === true) {
	    return true;
	}
    }

    return false;
};

RDFModel.Graph.prototype.every = function(p) {
    for(var i=0; i<this.triples.length; i++) {
	if(p(this.triples[i],this) === false) {
	    return false;
	}
    }

    return true;
};

RDFModel.Graph.prototype.filter = function(f) {
    var tmp = new RDFModel.Graph();

    for(var i=0; i<this.triples.length; i++) {
	if(f(this.triples[i],this) === true) {
	    tmp.add(this.triples[i]);
	}
    }

    return tmp;
};

RDFModel.Graph.prototype.forEach = function(f) {
    for(var i=0; i<this.triples.length; i++) {
	f(this.triples[i],this);
    }
};

RDFModel.Graph.prototype.merge = function(g) {
    var newGraph = new RDFModel.Graph();
    for(var i=0; i<this.triples.length; i++)
	newGraph.add(this.triples[i]);

    return newGraph;
};

RDFModel.Graph.prototype.match = function(subject, predicate, object, limit) {
    var graph = new RDFModel.Graph();

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

RDFModel.Graph.prototype.removeMatches = function(subject, predicate, object) {
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

RDFModel.Graph.prototype.toNT = function() {
    var n3 = "";

    this.forEach(function(triple) {
	n3 = n3 + triple.toString();
    });

    return n3;
};

// Builders for the query engine

RDFModel.buildRDFResource = function(value, bindings, engine, env) {
    if(value.token === 'blank') {
	return RDFModel.buildBlankNode(value, bindings, engine, env);
    } else if(value.token === 'literal') {
	return RDFModel.buildLiteral(value, bindings, engine, env);
    } else if(value.token === 'uri') {
	return RDFModel.buildNamedNode(value, bindings, engine, env);
    } else if(value.token === 'var') {
	var result = bindings[value.value];
	if(result != null) {
	    return RDFModel.buildRDFResource(result, bindings, engine, env);
	} else {
	    return null;
	}
    } else {
	return null;
    }
};

RDFModel.buildBlankNode = function(value, bindings, engine, env) {
    if(value.valuetmp != null) {
	value.value = value.valuetmp;
    }
    if(value.value.indexOf("_:") === 0) {
	value.value = value.value.split("_:")[1];
    }
    return new RDFModel.BlankNode(value.value);
};

RDFModel.buildLiteral = function(value, bindings, engine, env) {
    return new RDFModel.Literal(value.value, value.lang, value.type);
};

RDFModel.buildNamedNode = function(value, bindings, engine, env) {
    if(value.value != null) {
	return new RDFModel.NamedNode(value);
    } else {
	if(value.prefix != null) {
	    var prefix = engine.resolveNsInEnvironment(value.prefix, env);
	    value.value = prefix+value.suffix;
	    return new RDFModel.NamedNode(value);
	} else {
	    return new RDFModel.NamedNode(value);
	}
    }
};

RDFModel.rdf = new RDFModel.RDFEnvironment();

module.exports = RDFModel;
