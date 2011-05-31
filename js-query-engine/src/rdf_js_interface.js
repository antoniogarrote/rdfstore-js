// exports
exports.RDFJSInterface = {};
var RDFJSInterface = exports.RDFJSInterface;

// imports
var Utils = require("./../../js-trees/src/utils").Utils;
var QueryFilters = require("./query_filters").QueryFilters;


// Common RDFNode interface
RDFJSInterface.RDFNode = function(interfaceName){
    this.interfaceName = interfaceName;
    this.attributes  = ["interfaceName", "nominalValue"]
};

RDFJSInterface.RDFNode.prototype.equals = function(otherNode) {
    for(var a in attributes) {
        if(this[a] !== otherNode[b]) {
            return false;
        }
    }

    return true;
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
        this.nominalValue = this.nominalValue
    } else if(datatype != null) {
        this.datatype = datatype;
    }
};

Utils.extends(RDFJSInterface.RDFNode,RDFJSInterface.Literal);

RDFJSInterface.Literal.prototype.toString = function(){
    var tmp = "\""+this.nominalValue+"\"";
    if(this.language != null) {
        tmp = tmp + "@" + this.language;
    } else if(this.type != null) {
        tmp = tmp + "^^" + this.datatype;
    }

    return tmp;
};

RDFJSInterface.Literal.prototype.toNT = function() {
    return this.toString();
};

RDFJSInterface.Literal.prototype.valueOf = function() {
    return QueryFilters.ebv({token: 'literal', 
                             type: this.type, 
                             value: this.nominalValue, 
                             language: this.language});
};

// NamedNode node
RDFJSInterface.NamedNode = function(val) {
    RDFJSInterface.RDFNode.call(this, "NamedNode");
    if(val.value != null) {
        this.nominalValue = val.value;
    } else {
        this.nominalValue = val.prefix+":"+val.suffix;
    }
};

Utils.extends(RDFJSInterface.RDFNode,RDFJSInterface.NamedNode);

RDFJSInterface.NamedNode.prototype.toString = function(){
    return this.nominalValue;
};

RDFJSInterface.NamedNode.prototype.toNT = function() {
    return this.toString();
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
    return this.subject.toNT()+", "+this.predicate.toNT()+", "+this.object.toNT()+"\r\n";
};

// Graph interface
RDFJSInterface.Graph = function() {
    this.triples = [];
    this.duplicates = {};
};

RDFJSInterface.Graph.prototype.add = function(triple) {
    var id = triple.subject.toString()+triple.predicate.toString()+triple.object.toString();
    if(!this.duplicates[id]) {
        this.duplicates[id] = true;
        this.triples.push(triple);
    //} else {
    //    console.log("DUPLICATED:"+id);
    }

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
};

RDFJSInterface.Graph.prototype.toArray = function() {
    return this.triples;
};

RDFJSInterface.Graph.prototype.some = function(p) {
    for(var i=0; i<this.triples.length; i++) {
        if(p(this.triples[i]) === true) {
            return true;
        }
    }

    return false;
};

RDFJSInterface.Graph.prototype.every = function(p) {
    for(var i=0; i<this.triples.length; i++) {
        if(p(this.triples[i]) === false) {
            return false;
        }
    }

    return true;
};

RDFJSInterface.Graph.prototype.filter = function(f) {
    var tmp = new RDFJSInterface.Graph();

    for(var i=0; i<this.triples.length; i++) {
        if(f(this.triples[i]) === true) {
            tmp.add(this.triples[i]);
        }
    }

    return tmp;
};

RDFJSInterface.Graph.prototype.forEach = function(f) {
    for(var i=0; i<this.triples.length; i++) {
        f(this.triples[i]);
    }
};


// Builders
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
    if(value.value == null && value.label) {
        value.value = value.label;
    }
    if(value.value.indexOf("_:") === 0) {
        value.value = value.value.split("_:")[1];
    }
    return new RDFJSInterface.BlankNode(value.value);
};

RDFJSInterface.buildLiteral = function(value, bindings, engine, env) {
    return new RDFJSInterface.Literal(value.value, value.language, value.type);
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
