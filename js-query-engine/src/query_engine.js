// exports
exports.QueryEngine = {};
var QueryEngine = exports.QueryEngine;

//imports
var AbstractQueryTree = require("./../../js-sparql-parser/src/abstract_query_tree").AbstractQueryTree;
var Utils = require("./../../js-trees/src/utils").Utils;
var QuadIndexCommon = require("./../../js-rdf-persistence/src/quad_index_common").QuadIndexCommon;

QueryEngine.QueryEngine = function(params) {
    if(arguments.length != 0) {
        this.backend = params.backend;
        this.lexicon = params.lexicon;
        this.abstractQueryTree = new AbstractQueryTree.AbstractQueryTree();
    }
};

// Utils

QueryEngine.QueryEngine.prototype.resolveNsInEnvironment = function(prefix, env) {
    var namespaces = env.namespaces;
    return namespaces[prefix];
};

QueryEngine.QueryEngine.prototype.normalizeTerm = function(term, env, callback) {
    if(term.token === 'uri') {
        if(term.value == null) {
            var prefix = term.prefix;
            var suffix = term.suffix;
            var resolvedPrefix = this.resolveNsInEnvironment(prefix, env);
            if(resolvedPrefix == null) {
                callback(false, "The prefix "+prefix+" cannot be resolved in the current environment");
            } else {
                this.lexicon.registerUri(resolvedPrefix+suffix, function(oid){
                    callback(true, oid);
                });
            }
        } else {
            this.lexicon.registerUri(term.value, function(oid){
               callback(true, oid);
            });
        }
    } else if(term.token === 'literal') {
        this.normalizeLiteral(term, env, function(result, data){
            callback(result, data);
        })
    } else {
        //@todo handle here variables and blank nodes
        callback(false, 'Token of kind '+term.token+' cannot be normalized');
    }
};

QueryEngine.QueryEngine.prototype.normalizeQuad = function(quad, queryEnv, callback) {
    var subject    = null;
    var predicate  = null;
    var object     = null;
    var graph      = null;
    var that       = this;
    var errorFound = false;

    Utils.seq(function(k){
        if(quad.graph == null) {
            graph = 0; // default graph
            k();
        } else {

            that.normalizeTerm(quad.graph, queryEnv, function(result, oid){    
                if(errorFound === false){
                    if(result===true) {
                        graph = oid;
                    } else {
                        errorFound = true;
                    }
                }
                k();
            });
        }
    }, function(k){
        that.normalizeTerm(quad.subject, queryEnv, function(result, oid){    
            if(errorFound === false){
                if(result===true) {
                    subject = oid;
                } else {
                    errorFound = true;
                }
            }
            k();
        });
    }, function(k){
        that.normalizeTerm(quad.predicate, queryEnv, function(result, oid){    
            if(errorFound === false){
                if(result===true) {
                    predicate = oid;
                } else {
                    errorFound = true;
                }
            }
            k();
        });
    }, function(k){
        that.normalizeTerm(quad.object, queryEnv, function(result, oid){    
            if(errorFound === false){
                if(result===true) {
                    object = oid;
                } else {
                    errorFound = true;
                }
            }
            k();
        });
    })(function(){
        if(errorFound) {
            callback(false, "Error normalizing quad");
        } else {
            callback(true,{subject:subject, 
                           predicate:predicate, 
                           object:object, 
                           graph:graph});
        }
    });
};

QueryEngine.QueryEngine.prototype.normalizeLiteral = function(term, env, callback) {
    var value = term.value;
    var lang = term.value;
    var type = term.type;

    var indexedValue = null;

    if(value != null && type != null && typeof(type) != 'string') {
        var typeValue = type.value;

        if(typeValue != null) {
            indexedValue = '"' + value + '"^^<' + typeValue + '>';
        } else {
            var typePrefix = type.prefix;
            var typeSuffix = type.suffix;

            var resolvedPrefix = this.resolveNsInEnvironment(typePrefix, env);
            indexedValue = '"' + value + '"^^<' + resolvedPrefix + typeSuffix + '>';
        }
    } else {
        if(lang == null && type == null) {
            indexedValue = value;
        } else if(type == null) {
            indexedValue = value + "@" + lang;        
        } else {
            indexedValue = '"' + value + '"^^<'+type+'>';
        }
    }

    this.lexicon.registerLiteral(indexedValue, function(oid){
        callback(true, oid);
    });
};

// Queries execution

QueryEngine.QueryEngine.prototype.execute = function(queryString, callback){
    var syntaxTree = this.abstractQueryTree.parseQueryString(queryString);
    if(syntaxTree.token === 'query' && syntaxTree.kind == 'update')  {
        this.executeUpdate(syntaxTree, callback);
    } else if(syntaxTree.token === 'query' && syntaxTree.kind == 'query') {
        this.executeQuery(syntaxTree, callback);
    }
};

// Retrieval queries

QueryEngine.QueryEngine.prototype.executeQuery = function(syntaxTree, callback) {
    var prologue = syntaxTree.prologue;
    var units = syntaxTree.units;
    var that = this;

    // environment for the operation -> base ns, declared ns, etc.
    // @todo register base, and declared namespaces
    var queryEnv = {namespaces: {}};

    // retrieval queries only can have 1 executable unit
    var aqt = that.abstractQueryTree.parseExecutableUnit(units[0]);

    // @todo process query here
    // can be anything else but a select???
    this.sparqlAlgebra.executeSelect(aqt,function(success, result){
        // @todo handle result here
    });

    throw new Error("Execution of retrieval queries not implemented yet");
};


// Select queries

QueryEngine.QueryEngine.prototype.executeSelect = function(unit, callback) {
    if(unit.kind === "select") {
        var projection = unit.projection;
        var dataset    = unit.dataset[0]; // more than one? why array?
        if(unit.pattern.kind === "BGP") {
            this.executeAndBGP(projection, dataset, unit.pattern, callback);
        } else {
            callback(false, "Cannot execute query pattern " + unit.pattern.kind + ". Not implemented yet.");
        }
    } else {
        callback(false,"Cannot execute " + unit.kind + " query as a select query");
    }
}

QueryEngine.QueryEngine.prototype.executeAndBGP = function(projection, dataset, pattern, callback) {
    var patterns = pattern.value;
    var that = this;

    // (AND BGP1, BGP2 ... BGPN)
    Utils.repeat(0,patterns.length, function(k,e){
        var floop = arguments.callee;
        var quad = patterns[e._i];
        quad.graph = dataset;
        
        that.normalizeQuad(quad, {}, function(success, key){
            if(result == true) {
                that.backend.range(key,function(quads){
                    var results = e.results || [];
                    if(quads == null || quads.length == 0) {
                        callback(true, []);
                    } else {
                        e.results = results.concat(quads);
                        k(floop, e);
                    }
                });
            } else {
                callback(false, "Cannot normalize quad: "+quad);
            }
        });
    }, function(e){
        //@todo projection
        callback(true, []);
    });
};

// Update queries

QueryEngine.QueryEngine.prototype.executeUpdate = function(syntaxTree, callback) {
    var prologue = syntaxTree.prologue;
    var units = syntaxTree.units;
    var that = this;

    // environment for the operation -> base ns, declared ns, etc.
    // @todo register base, and declared namespaces
    var queryEnv = {namespaces: {}};

    for(var i=0; i<units.length; i++) {

        var aqt = that.abstractQueryTree.parseExecutableUnit(units[i]);

        if(aqt.kind === 'insertdata') {
            Utils.repeat(0, aqt.quads.length, function(k,env) {                
                var quad = aqt.quads[env._i];
                that._executeQuadInsert(quad, queryEnv, function(result, error) {
                    if(result === true) {
                        k(arguments.callee, env);
                    } else {
                        callback(false, error);
                    }
                });
            }, function(env) {
                callback(true);
            });
        } else {
            throw new Error("not supported execution unit");
        }
    }
};

// Low level operations for update queries

QueryEngine.QueryEngine.prototype._executeQuadInsert = function(quad, queryEnv, callback) {
    var that = this;
    this.normalizeQuad(quad, queryEnv, function(success,result) {
        if(success === true) {
            var key = new QuadIndexCommon.NodeKey(result);
            that.backend.index(key, function(result, error){
                if(result == true){
                    callback(true);
                } else {
                    callback(false, error);
                }
            });
        } else {
            callback(false, error);
        }
    });
};


