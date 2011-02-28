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


QueryEngine.QueryEngine.prototype.execute = function(queryString, callback){
    var syntaxTree = this.abstractQueryTree.parseQueryString(queryString);
    if(syntaxTree.token === 'query' && syntaxTree.kind == 'update')  {
        this.executeUpdate(syntaxTree, callback);
    } else if(syntaxTree.token === 'query' && syntaxTree.kind == 'query') {
        this.executeQuery(syntaxTree, callback);
    }
};

QueryEngine.QueryEngine.prototype.executeQuery = function(syntaxTree, callback) {
    throw new Error("Execution of retrieval queries not implemented yet");
};

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
                that._executeQuadInsert(quad, queryEnv, function(result, error){
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

// Low level operations

QueryEngine.QueryEngine.prototype._executeQuadInsert = function(quad, queryEnv, callback) {
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

            that.normalizeTerm(quad.graph, function(result, oid){    
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
        that.normalizeTerm(quad.subject, function(result, oid){    
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
        that.normalizeTerm(quad.predicate, function(result, oid){    
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
        that.normalizeTerm(quad.object, function(result, oid){    
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
        var key = new QuadIndexCommon.NodeKey({subject:1, predicate:2, object:3, graph:4})                                    
        // indexation
        that.backend.index(key, function(result, error){
            if(result == true){
                callback(true);
            } else {
                callback(false, error);
            }
        });
    });
};

QueryEngine.QueryEngine.prototype.resolveNsInEnvironment = function(prefix, env) {
    var namespaces = env.namespaces;
    return namespaces[prefix];
};

QueryEngine.QueryEngine.prototype.normalizeTerm = function(term, env, callback) {
    if(term.token === 'uri') {
        if(token.value == null) {
            console.log(token);
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
    } else {
        callback(false, 'Token of kind '+token.token+' cannot be normalized');
    }
};
