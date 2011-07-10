// exports
exports.QueryEngine = {};
var QueryEngine = exports.QueryEngine;

//imports
var AbstractQueryTree = require("./../../js-sparql-parser/src/abstract_query_tree").AbstractQueryTree;
var Utils = require("./../../js-trees/src/utils").Utils;
var QuadIndexCommon = require("./../../js-rdf-persistence/src/quad_index_common").QuadIndexCommon;
var QueryPlan = require("./query_plan").QueryPlan;
var QueryFilters = require("./query_filters").QueryFilters;
var RDFJSInterface = require("./rdf_js_interface").RDFJSInterface;
var RDFLoader = require("../../js-communication/src/rdf_loader").RDFLoader;
var Callbacks = require("./callbacks.js").Callbacks;

QueryEngine.QueryEngine = function(params) {
    if(arguments.length != 0) {
        this.backend = params.backend;
        this.lexicon = params.lexicon;
        this.abstractQueryTree = new AbstractQueryTree.AbstractQueryTree();
        this.rdfLoader = new RDFLoader.RDFLoader(params['communication']);
        this.callbacksBackend = new Callbacks.CallbacksBackend(this);
    }
};

// Utils

QueryEngine.QueryEngine.prototype.registerNsInEnvironment = function(prologue, env) {
    var prefixes = prologue.prefixes;
    var toSave = {};
    for(var i=0; i<prefixes.length; i++) {
        var prefix = prefixes[i];
        if(prefix.token === "prefix") {
            toSave[prefix.prefix] = prefix.local;
        }
    }

    env.namespaces = toSave;
    if(prologue.base && typeof(prologue.base) === 'object') {
        env.base = prologue.base.value;
    } else {
        env.base = null;
    }
};

QueryEngine.QueryEngine.prototype.applyModifier = function(modifier, projectedBindings) {
    if(modifier == "DISTINCT") {
        var map = {};
        var result = [];
        for(var i=0; i<projectedBindings.length; i++) {
            var bindings = projectedBindings[i];
            var key = "";
         
            // if no projection variables hash is passed, all the bound
            // variable in the current bindings will be used.
            for(var p in (bindings)) {
                // hashing the object
                var obj = bindings[p];
                if(obj == null) {
                    key = key+p+'null';
                } else if(obj.token == 'literal') {
                    if(obj.value != null) {
                        key = key + obj.value;
                    }
                    if(obj.lang != null) {
                        key = key + obj.lang;
                    }
                    if(obj.type != null) {
                        key = key + obj.type;
                    }
                } else if(obj.value) {
                    key  = key + p + obj.value;
                } else {
                    key = key + p + obj;
                }
            }
         
            if(map[key] == null) {
                // this will preserve the order in projectedBindings
                result.push(bindings) 
                map[key] = true;
            }
        }
        return result; 
    } else {
        return projectedBindings;
    }
};

QueryEngine.QueryEngine.prototype.applyLimitOffset = function(offset, limit, bindings) {
    if(limit == null && offset == null) {
        return bindings;
    }

    if (offset == null) {
        offset = 0;
    }

    if(limit == null) {
        limit = bindings.length;
    } else {
        limit = offset + limit;
    }

    return bindings.slice(offset, limit);
};


QueryEngine.QueryEngine.prototype.applySingleOrderBy = function(orderFilters, modifiedBindings, outEnv, callback) {
    var that = this;
    Utils.repeat(0, orderFilters.length, function(k,env){
        var floop = arguments.callee;
        var orderFilter = orderFilters[env._i];
        QueryFilters.collect(orderFilter.expression, [modifiedBindings], outEnv, that, function(success, results){
            if(success) {
                env.acum = env.acum || [];
                env.acum.push(results[0].value);
                k(floop, env);
            } else {
                callback(false, results);
            }
        });
    }, function(env) {
        callback(true, {binding:modifiedBindings, value:env.acum});
    });
};

QueryEngine.QueryEngine.prototype.applyOrderBy = function(order, modifiedBindings, outEnv, callback) {
    var that = this;
    if(order != null && order.length > 0) {
        Utils.repeat(0, modifiedBindings.length, function(k,env) {
            var floop = arguments.callee;
            var bindings = modifiedBindings[env._i];
            that.applySingleOrderBy(order, bindings, outEnv, function(success, results){
                if(success) {
                    env.acum = env.acum || [];
                    env.acum.push(results);
                    k(floop, env);
                } else {
                    callback(false, results);
                }
            });
        }, function(env) {
            var results = env.acum || [];
            results.sort(function(a,b){
                return that.compareFilteredBindings(a, b, order, outEnv);
            });
            var toReturn = [];
            for(var i=0; i<results.length; i++) {
                toReturn.push(results[i].binding);
            }

            callback(true,toReturn);
        });
    } else {
        callback(true,modifiedBindings);
    }
};

QueryEngine.QueryEngine.prototype.compareFilteredBindings = function(a, b, order, env) {
    var found = false;
    var i = 0
    while(!found) {
        if(i==a.value.length) {
            return 0;
        }
        var direction = order[i].direction;
        var filterResult;

        // unbound first
        if(a.value[i] == null && b.value[i] == null) {
            i++;
            continue;
        }else if(a.value[i] == null) {
            filterResult = {value: false};
        } else if(b.value[i] == null) {
            filterResult = {value: true};
        } else 

        // blanks
        if(a.value[i].token === 'blank' && b.value[i].token === 'blank') {
            i++;
            continue;
        } else if(a.value[i].token === 'blank') { 
            filterResult = {value: false};            
        } else if(b.value[i].token === 'blank') {
            filterResult = {value: true};        
        } else 

        // uris
        if(a.value[i].token === 'uri' && b.value[i].token === 'uri') {
            if(QueryFilters.runEqualityFunction(a.value[i], b.value[i], [], this, env).value == true) {
                i++;
                continue;
            } else {
                filterResult = QueryFilters.runTotalGtFunction(a.value[i], b.value[i], []);
            }
        } else if(a.value[i].token === 'uri') { 
            filterResult = {value: false};            
        } else if(b.value[i].token === 'uri') {
            filterResult = {value: true};        
        } else 

        // simple literals
        if(a.value[i].token === 'literal' && b.value[i].token === 'literal' && a.value[i].type == null && b.value[i].type == null) {
            if(QueryFilters.runEqualityFunction(a.value[i], b.value[i], [], this, env).value == true) {
                i++;
                continue;
            } else {
                filterResult = QueryFilters.runTotalGtFunction(a.value[i], b.value[i], []);
            }
        } else if(a.value[i].token === 'literal' && a.value[i].type == null) { 
            filterResult = {value: false};            
        } else if(b.value[i].token === 'literal' && b.value[i].type == null) {
            filterResult = {value: true};        
        } else 

        // literals
        if(QueryFilters.runEqualityFunction(a.value[i], b.value[i], [], this, env).value == true) {
            i++;
            continue;
        } else {
            filterResult = QueryFilters.runTotalGtFunction(a.value[i], b.value[i], []);
        }     


        // choose value for comparison based on the direction
        if(filterResult.value == true) {
            if(direction === "ASC") {
                return 1;
            } else {
                return -1;
            }
        } else {
            if(direction === "ASC") {
                return -1;
            } else {
                return 1;
            }
        }       
    }
};

QueryEngine.QueryEngine.prototype.removeDefaultGraphBindings = function(bindingsList, dataset) {
    var onlyDefaultDatasets = [];
    var namedDatasetsMap = {}
    for(var i=0; i<dataset.named.length; i++) {
        namedDatasetsMap[dataset.named[i].oid] = true;
    }
    for(var i=0; i<dataset.default.length; i++) {
        if(namedDatasetsMap[dataset.default[i].oid] == null) {
            onlyDefaultDatasets.push(dataset.default[i].oid);
        }
    }
    var acum = [];
    for(var i=0; i<bindingsList.length; i++) {
        var bindings = bindingsList[i];
        var foundDefaultGraph = false;
        for(var p in bindings) {
            for(var j=0; j<namedDatasetsMap.length; j++) {
                if(bindings[p] === namedDatasetsMap[j]) {
                    foundDefaultGraph = true;
                    break;
                }
            }
            if(foundDefaultGraph) {
                break;
            }
        }
        if(!foundDefaultGraph) {
            acum.push(bindings);
        }
    }

    return acum;
}


QueryEngine.QueryEngine.prototype.aggregateBindings = function(projection, bindingsGroup, env, callback) {
    this.copyDenormalizedBindings(bindingsGroup, env.outCache, function(result, denormBindings) {
        if(result===true) {
            var aggregatedBindings = {};
            for(var i=0; i<projection.length; i++) {
                var aggregatedValue = QueryFilters.runAggregator(projection[i], denormBindings, this, env);
                if(projection[i].alias) {
                    aggregatedBindings[projection[i].alias.value] = aggregatedValue; 
                } else {
                    aggregatedBindings[projection[i].value.value] = aggregatedValue; 
                }
            }

            callback(true,aggregatedBindings);
        } else {
            callback(result, denormBindings);
        }
    });
};


QueryEngine.QueryEngine.prototype.projectBindings = function(projection, results) {
    if(projection[0].kind === '*') {
        return results;
    } else {
        var toProject = [];
        var projectedResults = [];

        for(var i=0; i<results.length; i++) {
            var currentResult = results[i];
            var currentProjected = {};
            var shouldAdd = true;

            for(var j=0; j< projection.length; j++) {
                if(projection[j].token == 'variable' && projection[j].kind != 'aliased') {
                    currentProjected[projection[j].value.value] = currentResult[projection[j].value.value];
                } else if(projection[j].token == 'variable' && projection[j].kind == 'aliased') {
                    var ebv = QueryFilters.runFilter(projection[j].expression, currentResult, this, {blanks:{}, outCache:{}});
                    if(QueryFilters.isEbvError(ebv)) {
                        shouldAdd = false;
                        break
                    } else {
                        currentProjected[projection[j].alias.value] = ebv;
                    }
                }
            }

            if(shouldAdd === true) {
                projectedResults.push(currentProjected);
            }
            
        }

        return projectedResults;
    }
};

QueryEngine.QueryEngine.prototype.resolveNsInEnvironment = function(prefix, env) {
    var namespaces = env.namespaces;
    return namespaces[prefix];
};


QueryEngine.QueryEngine.prototype.normalizeTerm = function(term, env, shouldIndex, callback) {
    if(term.token === 'uri') {
        var uri = Utils.lexicalFormBaseUri(term, env);
        if(uri == null) {
            callback(false, "The prefix "+prefix+" cannot be resolved in the current environment");
        } else {
            if(shouldIndex) {
                this.lexicon.registerUri(uri, function(oid){
                    callback(true, oid);
                });
            } else {
                this.lexicon.resolveUri(uri, function(oid){
                    callback(true, oid);
                });
            }
        }

    } else if(term.token === 'literal') {
        var lexicalFormLiteral = Utils.lexicalFormLiteral(term, env);
        if(shouldIndex) {
            this.lexicon.registerLiteral(lexicalFormLiteral, function(oid){
                callback(true, oid);
            });
        } else {
            this.lexicon.resolveLiteral(lexicalFormLiteral, function(oid){
                callback(true, oid);
            });
        }
        //this.normalizeLiteral(term, env, function(success, result){
        //    callback(success, result);
        //})
    } else if(term.token === 'blank') {
        var label = term.label;
        var oid = env.blanks[label];
        if( oid != null) {
            callback(true,oid);
        } else {
            if(shouldIndex) {
                this.lexicon.registerBlank(label, function(oid) {
                    env.blanks[label] = oid;
                    callback(true,oid);
                });
            } else {
                this.lexicon.resolveBlank(label, function(oid) {
                    env.blanks[label] = oid;
                    callback(true,oid);
                });
            }
        }
    } else if(term.token === 'var') {
        callback(true, term.value);
    } else {
          callback(false, 'Token of kind '+term.token+' cannot be normalized');
    }
};

QueryEngine.QueryEngine.prototype.normalizeDatasets = function(datasets, outerEnv, callback) {
    var that = this;
    Utils.repeat(0, datasets.length, function(k,env) {
        var floop = arguments.callee;
        var dataset = datasets[env._i];
        if(dataset.value === that.lexicon.defaultGraphUri) {
            dataset.oid = that.lexicon.defaultGraphOid;
            k(floop, env);
        } else {
            that.normalizeTerm(dataset, outerEnv, false, function(success, result){
                if(success) {
                    dataset.oid = result;
                    k(floop, env);
                } else {
                    callback(success, result);
                }
            })      
        }  
    }, function(env) {
        callback(true, "ok");
    });
}

QueryEngine.QueryEngine.prototype.normalizeQuad = function(quad, queryEnv, shouldIndex, callback) {
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
          that.normalizeTerm(quad.graph, queryEnv, shouldIndex, function(result, oid){    
              if(errorFound === false){
                  if(result===true) {
                      graph = oid;
                  } else {
                      errorFound = true;
                  }
              }
              if(shouldIndex === true && !errorFound) {
                  that.lexicon.registerGraph(oid, function(succes){
                      if(succes === false) {
                          errorFound = true;
                      }
                      k();
                  });
              } else {
                  k();
              }
          });
        }
    }, function(k){
        that.normalizeTerm(quad.subject, queryEnv, shouldIndex, function(result, oid){    
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
        that.normalizeTerm(quad.predicate, queryEnv, shouldIndex, function(result, oid){    
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
        that.normalizeTerm(quad.object, queryEnv, shouldIndex, function(result, oid){    
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

QueryEngine.QueryEngine.prototype.denormalizeBindingsList = function(bindingsList, envOut, callback) {
    var results = [];
    var that = this;

    Utils.repeat(0, bindingsList.length, function(k,env){
        var floop = arguments.callee;
        that.denormalizeBindings(bindingsList[env._i], envOut, function(success, result){
            if(success) {
                results.push(result);
                k(floop, env);
            } else {
                callback(false, result);
            }
        });
    }, function(env) {
        callback(true, results);
    })
};

/**
 * Receives a bindings map (var -> oid) and an out cache (oid -> value)
 * returns a bindings map (var -> value) storing in cache all the missing values for oids
 *
 * This is required just to save lookups when final results are generated.
 */
QueryEngine.QueryEngine.prototype.copyDenormalizedBindings = function(bindingsList, out, callback) {

    var that = this;
    var denormList = [];
    Utils.repeat(0, bindingsList.length, function(klist,listEnv){
        var denorm = {};
        var floopList = arguments.callee;
        var bindings = bindingsList[listEnv._i];
        var variables = Utils.keys(bindings);
        Utils.repeat(0, variables.length, function(k, env) {
            var floop = arguments.callee;
            var oid = bindings[variables[env._i]];
            if(oid == null) {
                // this can be null, e.g. union different variables (check SPARQL recommendation examples UNION)
                denorm[variables[env._i]] = null;
                k(floop, env);
            } else {
                var inOut = out[oid];
                if(inOut!= null) {
                    denorm[variables[env._i]] = inOut;
                    k(floop, env);
                } else {                    
                    that.lexicon.retrieve(oid, function(val){
                        out[oid] = val;
                        denorm[variables[env._i]] = val;
                        k(floop, env);
                    });
                }
            }
        }, function(env){
            denormList.push(denorm);
            klist(floopList, listEnv);
        })
    }, function(){
        callback(true, denormList);
    });
};

QueryEngine.QueryEngine.prototype.denormalizeBindings = function(bindings, envOut, callback) {
    var variables = Utils.keys(bindings);
    var that = this;
    Utils.repeat(0, variables.length, function(k, env) {
        var floop = arguments.callee;
        var oid = bindings[variables[env._i]];
        if(oid == null) {
            // this can be null, e.g. union different variables (check SPARQL recommendation examples UNION)
            bindings[variables[env._i]] = null;
            k(floop, env);
        } else {
            if(envOut[oid] != null) {
                bindings[variables[env._i]] = envOut[oid];
                k(floop, env);
            } else {
                that.lexicon.retrieve(oid, function(val){
                    bindings[variables[env._i]] = val;
                    k(floop, env);
                });
            }
        }
    }, function(env){
        callback(true, bindings);
    })
};

// Queries execution

QueryEngine.QueryEngine.prototype.execute = function(queryString, callback, defaultDataset, namedDataset){
    try{
        queryString = Utils.normalizeUnicodeLiterals(queryString);

        var syntaxTree = this.abstractQueryTree.parseQueryString(queryString);
        if(syntaxTree == null) {
            callback(false,"Error parsing query string");
        } else {
            if(syntaxTree.token === 'query' && syntaxTree.kind == 'update')  {
                this.callbacksBackend.startGraphModification();
                var that = this;
                this.executeUpdate(syntaxTree, function(success, result){
                    if(success) {
                        that.callbacksBackend.endGraphModification(function(){
                            callback(success, result);
                        });
                    } else {
                        that.callbacksBackend.cancelGraphModification();
                        callback(success, result);
                    }
                });
            } else if(syntaxTree.token === 'query' && syntaxTree.kind == 'query') {
                this.executeQuery(syntaxTree, callback, defaultDataset, namedDataset);
            }
        }
    } catch(e) {
        console.log(e);
        console.log(e.stack);
        if(e.name && e.name==='SyntaxError') {
            callback(false, "Syntax error: \nmessage:"+e.message+"\nline "+e.line+", column:"+e.column);
        } else {
            callback(false, "Query execution error");
        }
    }
};

// Retrieval queries

QueryEngine.QueryEngine.prototype.executeQuery = function(syntaxTree, callback, defaultDataset, namedDataset) {
    var prologue = syntaxTree.prologue;
    var units = syntaxTree.units;
    var that = this;

    // environment for the operation -> base ns, declared ns, etc.
    var queryEnv = {blanks:{}, outCache:{}};
    this.registerNsInEnvironment(prologue, queryEnv);

    // retrieval queries can only have 1 executable unit
    var aqt = that.abstractQueryTree.parseExecutableUnit(units[0]);

    // can be anything else but a select???
    var that = this;
    if(aqt.kind === 'select') {
      this.executeSelect(aqt, queryEnv, defaultDataset, namedDataset, function(success, result){
          if(success) {
              if(typeof(result) === 'object' && result.denorm === true) {
                  callback(true, result['bindings']);
              } else {
                  that.denormalizeBindingsList(result, queryEnv.outCache, function(success, result){
                      if(success) {                        
                          callback(true, result);
                      } else {
                          callback(false, result);
                      }
                  });
              }
          } else {
              callback(false, result);
          }
      });
    } else if(aqt.kind === 'ask') {
        aqt.projection = [{"token": "variable", "kind": "*"}];
        this.executeSelect(aqt, queryEnv, defaultDataset, namedDataset, function(success, result){
            if(success) {
                if(success) {              
                    if(result.length>0) {
                        callback(true, true);
                    } else {
                        callback(true, false);
                    }
                } else {
                    callback(false, result);
                }
            } else {
                callback(false, result);
            }
        });
    } else if(aqt.kind === 'construct') {
        aqt.projection = [{"token": "variable", "kind": "*"}];
        var that = this;
        this.executeSelect(aqt, queryEnv, defaultDataset, namedDataset, function(success, result){
            if(success) {
                if(success) {              
                    that.denormalizeBindingsList(result, queryEnv.outCache, function(success, result){
                        if(success) { 
                            var graph = new RDFJSInterface.Graph();
                            
                            // CONSTRUCT WHERE {} case
                            if(aqt.template == null) {
                                aqt.template = {triplesContext: aqt.pattern};
                            }

                            var blankIdCounter = 1;
                            for(var i=0; i<result.length; i++) {
                                var bindings = result[i];
                                var blankMap = {};
                                for(var j=0; j<aqt.template.triplesContext.length; j++) {
                                    // fresh IDs for blank nodes in the construct template
                                    var components = ['subject', 'predicate', 'object'];
                                    var tripleTemplate = aqt.template.triplesContext[j];                                    
                                    for( var p=0; p<components.length; p++) {
                                        var component = components[p];
                                        if(tripleTemplate[component].token === 'blank') {
                                            if(blankMap[tripleTemplate[component].value] != null) {
                                                tripleTemplate[component].value = blankMap[tripleTemplate[component].value];
                                            } else {
                                                var blankId = "_:b"+blankIdCounter;
                                                blankIdCounter++;
                                                blankMap[tripleTemplate[component].value] = blankId;
                                                tripleTemplate[component].value = blankId;
                                            }
                                        }
                                    }
                                    var s = RDFJSInterface.buildRDFResource(tripleTemplate.subject,bindings,that,queryEnv);
                                    var p = RDFJSInterface.buildRDFResource(tripleTemplate.predicate,bindings,that,queryEnv);
                                    var o = RDFJSInterface.buildRDFResource(tripleTemplate.object,bindings,that,queryEnv);
                                    if(s!=null && p!=null && o!=null) {
                                        var triple = new RDFJSInterface.Triple(s,p,o);
                                        graph.add(triple);
                                    //} else {
                                    //    return callback(false, "Error creating output graph")
                                    }
                                }
                            }
                            callback(true,graph);
                        } else {
                            callback(false, result);
                        }
                    });
                } else {
                    callback(false, result);
                }
            } else {
                callback(false, result);
            }
        });
    }
};


// Select queries

QueryEngine.QueryEngine.prototype.executeSelect = function(unit, env, defaultDataset, namedDataset, callback) {
    if(unit.kind === "select" || unit.kind === "ask" || unit.kind === "construct" || unit.kind === "modify") {
        var projection = unit.projection;
        var dataset    = unit.dataset;
        var modifier   = unit.modifier;
        var limit      = unit.limit;
        var offset     = unit.offset;
        var order      = unit.order;
        var that = this;

        if(defaultDataset != null || namedDataset != null) {
            dataset.default = defaultDataset || [];
            dataset.named   = namedDataset || [];
        } 

        if(dataset.default != null && dataset.default.length === 0 && dataset.named !=null && dataset.named.length === 0) {
            // We add the default graph to the default merged graph
            dataset.default.push(this.lexicon.defaultGraphUriTerm);
        }

        that.normalizeDatasets(dataset.default.concat(dataset.named), env, function(success, results){
            if(success) {
                that.executeSelectUnit(projection, dataset, unit.pattern, env, function(success, result){
                  if(success) {
                      // detect single group
                      if(unit.group!=null && unit.group === "") {
                          var foundUniqueGroup = false;
                          for(var i=0; i<unit.projection.length; i++) {
                              if(unit.projection[i].expression!=null && unit.projection[i].expression.expressionType === 'aggregate') {
                                  foundUniqueGroup = true;
                                  break;
                              }
                          }
                          if(foundUniqueGroup === true) {
                              unit.group = 'singleGroup';
                          }
                      }
                      if(unit.group && unit.group != "") {
                          that.groupSolution(result, unit.group, env, function(success, groupedBindings){

                              var aggregatedBindings = [];
                              var foundError = false;

                              Utils.repeat(0, groupedBindings.length, function(k,loopEnv) {
                                  var floop = arguments.callee;
                                  if(!foundError) {
                                      that.aggregateBindings(projection, groupedBindings[loopEnv._i], env, function(result, resultingBindings){
                                          if(result) {
                                              aggregatedBindings.push(resultingBindings);
                                              k(floop, loopEnv);
                                          } else {
                                              foundError = true;
                                              k(floop, loopEnv);
                                          }
                                      });
                                  } else {
                                      k(floop, loopEnv);
                                  }
                              },function(env){
                                  callback(!foundError, {'bindings': aggregatedBindings, 'denorm':true});
                              });
                          });
                      } else {
                          that.applyOrderBy(order, result, env, function(success, orderedBindings){
                              if(success) {
                                  var projectedBindings = that.projectBindings(projection, orderedBindings);
                                  modifiedBindings = that.applyModifier(modifier, projectedBindings);
                                  var limitedBindings  = that.applyLimitOffset(offset, limit, modifiedBindings);
                                  filteredBindings = that.removeDefaultGraphBindings(limitedBindings, dataset);
                                      
                                  callback(true, filteredBindings);

                              } else {
                                  callback(false, orderedBindings);
                              }
                          });
                      }

                  } else { // fail selectUnit
                    callback(false, result);
                  }
                });
            } else { // fail  normalizaing datasets
                callback(false,results);
            }
        }); // end normalize datasets
    } else {
        callback(false,"Cannot execute " + unit.kind + " query as a select query");
    }
};


QueryEngine.QueryEngine.prototype.groupSolution = function(bindings, group, queryEnv, callback){
    var order = [];
    var filteredBindings = [];
    var initialized = false;
    if(group === 'singleGroup') {
        callback(true, [bindings]);

    } else {
        Utils.repeat(0, bindings.length, function(kk, outEnv) {
            var outFloop = arguments.callee;
            var currentBindings = bindings[outEnv._i];
            var mustAddBindings = true;

            /**
             * In this loop, we iterate through all the group clauses and tranform the current bindings
             * according to the group by clauses.
             * If it is the first iteration we also save in a different array the order for the 
             * grouped variables that will be used later to build the final groups
             */
            Utils.repeat(0, group.length, function(k, env) {
                var floop = arguments.callee;
                var currentOrderClause = group[env._i];
                var orderVariable = null;

                if(currentOrderClause.token === 'var') {
                    orderVariable = currentOrderClause.value;
                } else if(currentOrderClause.token === 'aliased_expression') {
                    if(currentOrderClause.expression.primaryexpression === 'var') {
                        orderVariable = currentOrderClause.alias.value;
                        currentBindings[currentOrderClause.alias.value] = currentBindings[currentOrderClause.expression.value.value];
                    } else {
                        var filterResultEbv = QueryFilters.runFilter(currentOrderClause.expression, currentBindings, that, queryEnv);
                        if(!QueryFilters.isEbvError(filterResultEbv)) {
                            currentBindings[currentOrderClause.alias.value]= filterResultEbv;
                        } else {
                            mustAddBindings = false;
                        }
                    }
                } else {
                    // In this case, we create an additional variable in the binding to hold the group variable value
                    var filterResultEbv = QueryFilters.runFilter(currentOrderClause, currentBindings, that, queryEnv);
                    if(!QueryFilters.isEbvError(filterResultEbv)) {
                        currentBindings["groupCondition"+env._i] = filterResultEbv;
                        orderVariable = "groupCondition"+env._i;
                    } else {
                        mustAddBindings = false;
                    }
                }

                if(initialized == false) {
                    order.push(orderVariable);
                }

                k(floop, env);
                
            }, function(env){
                if(initialized == false) {
                    initialized = true;
                } 
                if(mustAddBindings === true) {
                    filteredBindings.push(currentBindings);
                }
                kk(outFloop, outEnv);
            });

        }, function(outEnv) {
            /**
             * After processing all the bindings, we build the group using the
             * information stored about the order of the group variables.
             */
            var dups = {};
            var groupMap = {};
            var groupCounter = 0;
            for(var i=0; i<filteredBindings.length; i++) {
                var currentTransformedBinding = filteredBindings[i];
                var key = ""
                for(var j=0; j<order.length; j++) {
                    var maybeObject = currentTransformedBinding[order[j]];
                    if(typeof(maybeObject) === 'object') {
                        key = key + maybeObject.value;
                    } else {
                        key = key + maybeObject;
                    }
                }

                if(dups[key] == null) {
                    //currentTransformedBinding["__group__"] = groupCounter; 
                    groupMap[key] = groupCounter;
                    dups[key] = [currentTransformedBinding];
                    //groupCounter++
                } else {
                    //currentTransformedBinding["__group__"] = dups[key][0]["__group__"]; 
                    dups[key].push(currentTransformedBinding);
                }
            }

            // The final result is an array of arrays with all the groups
            var groups = [];
            
            for(var k in dups) {
                groups.push(dups[k]);
            }

            callback(true, groups);
        });
    }
}


/**
 * Here, all the constructions of the SPARQL algebra are handled
 */
QueryEngine.QueryEngine.prototype.executeSelectUnit = function(projection, dataset, pattern, env, callback) {
    if(pattern.kind === "BGP") {
        this.executeAndBGP(projection, dataset, pattern, env, callback);
    } else if(pattern.kind === "UNION") {
        this.executeUNION(projection, dataset, pattern.value, env, callback);            
    } else if(pattern.kind === "JOIN") {
        this.executeJOIN(projection, dataset, pattern, env, callback);            
    } else if(pattern.kind === "LEFT_JOIN") {
        this.executeLEFT_JOIN(projection, dataset, pattern, env, callback);            
    } else if(pattern.kind === "FILTER") {
        // Some components may have the filter inside the unit
        var that = this;
        this.executeSelectUnit(projection, dataset, pattern.value, env, function(success, results){
            if(success) {
                QueryFilters.checkFilters(pattern, results, false, env, that, callback);
            } else {
                callback(false, results);
            }
        });
    } else if(pattern.kind === "EMPTY_PATTERN") {
        // as an example of this case  check DAWG test case: algebra/filter-nested-2
        callback(true, []);
    } else {
        callback(false, "Cannot execute query pattern " + pattern.kind + ". Not implemented yet.");
    }
};

QueryEngine.QueryEngine.prototype.executeUNION = function(projection, dataset, patterns, env, callback) {
    var setQuery1 = patterns[0];
    var setQuery2 = patterns[1];
    var set1 = null;
    var set2 = null;

    if(patterns.length != 2) {
        throw("SPARQL algebra UNION with more than two components");
    }

    var that = this;
    var sets = [];

    Utils.seq(function(k){
        that.executeSelectUnit(projection, dataset, setQuery1, env, function(success, results){
            if(success) {
                set1 = results;
                k();
            } else {
                return callback(false, results);
            }
        });
    }, function(k) {
        that.executeSelectUnit(projection, dataset, setQuery2, env, function(success, results){
            if(success) {
                set2 = results;
                k();
            } else {
                return callback(false, results);
            }
        });
    })(function(){
        var result = QueryPlan.unionBindings(set1, set2);
        QueryFilters.checkFilters(patterns, result, false, env, that, callback);
    });
};

QueryEngine.QueryEngine.prototype.executeAndBGP = function(projection, dataset, patterns, env, callback) {
    var that = this;

    QueryPlan.executeAndBGPs(patterns.value, dataset, this, env, function(success,result){
        if(success) {
            QueryFilters.checkFilters(patterns, result, false, env, that, callback);
        } else {
            callback(false, result);
        }
    });
};

QueryEngine.QueryEngine.prototype.executeLEFT_JOIN = function(projection, dataset, patterns, env, callback) {
    var setQuery1 = patterns.lvalue;
    var setQuery2 = patterns.rvalue;

    var set1 = null;
    var set2 = null;

    var that = this;
    var sets = [];

    Utils.seq(function(k){
        that.executeSelectUnit(projection, dataset, setQuery1, env, function(success, results){
            if(success) {
                set1 = results;
                k();
            } else {
                return callback(false, results);
            }
        });
    }, function(k) {
        that.executeSelectUnit(projection, dataset, setQuery2, env, function(success, results){
            if(success) {
                set2 = results;
                k();
            } else {
                return callback(false, results);
            }
        });
    })(function(){
        var result = QueryPlan.leftOuterJoinBindings(set1, set2);
        //console.log("SETS:")
        //console.log(set1)
        //console.log(set2)
        //console.log("---")
        //console.log(result);

        QueryFilters.checkFilters(patterns, result, true, env, that, function(success, bindings){
            //console.log("---")
            //console.log(bindings)
            //console.log("\r\n")
            if(success) {
                if(set1.length>1 && set2.length>1) {
                    var vars = [];
                    var vars1 = {}
                    for(var p in set1[0]) {
                        vars1[p] = true;
                    }
                    for(var p in set2[0]) {
                        if(vars1[p] != true) {
                            vars.push(p);
                        }
                    }
                    acum = [];
                    duplicates = {};
                    for(var i=0; i<bindings.length; i++) {
                        if(bindings[i]["__nullify__"] === true) {
                            for(var j=0; j<vars.length; j++) {
                                bindings[i]["bindings"][vars[j]] = null;
                            }                            
                            var idx = [];
                            var idxColl = []
                            for(var p in bindings[i]["bindings"]) {
                                if(bindings[i]["bindings"][p] != null) {
                                    idx.push(p+bindings[i]["bindings"][p]);
                                    idx.sort();
                                    idxColl.push(idx.join(""))
                                }
                            }
                            // reject duplicates -> (set union)
                            if(duplicates[idx.join("")]==null) {
                                for(var j=0; j<idxColl.length; j++) {
                                    //console.log(" - "+idxColl[j])
                                    duplicates[idxColl[j]] = true;
                                }
                                ////duplicates[idx.join("")]= true
                                acum.push(bindings[i]["bindings"]);
                            }
                        } else {
                            acum.push(bindings[i]);
                            var idx = [];
                            var idxColl = []
                            for(var p in bindings[i]) {
                                idx.push(p+bindings[i][p]);
                                idx.sort();
                                //console.log(idx.join("") + " -> ok");
                                duplicates[idx.join("")] = true
                            }

                        }
                    }
                
                    callback(true, acum);
                } else {
                    callback(true, bindings);
                }
            } else {
                callback(false, bindings);
            }
        });
    });
};

QueryEngine.QueryEngine.prototype.executeJOIN = function(projection, dataset, patterns, env, callback) {
    var setQuery1 = patterns.lvalue;
    var setQuery2 = patterns.rvalue;
    var set1 = null;
    var set2 = null;

    var that = this;
    var sets = [];

    Utils.seq(function(k){
        that.executeSelectUnit(projection, dataset, setQuery1, env, function(success, results){
            if(success) {
                set1 = results;
                k();
            } else {
                return callback(false, results);
            }
        });
    }, function(k) {
        that.executeSelectUnit(projection, dataset, setQuery2, env, function(success, results){
            if(success) {
                set2 = results;
                k();
            } else {
                return callback(false, results);
            }
        });
    })(function(){
        var result = QueryPlan.joinBindings(set1, set2);

        QueryFilters.checkFilters(patterns, result, false, env, that, callback);
    });
};


QueryEngine.QueryEngine.prototype.rangeQuery = function(quad, queryEnv, callback) {
    var that = this;
    //console.log("BEFORE:");
    //console.log("QUAD:");
    //console.log(quad);
    that.normalizeQuad(quad, queryEnv, false, function(success, key){
        if(success == true) {
            //console.log("RANGE QUERY:")
            //console.log(success);
            //console.log(key);
            //console.log(new QuadIndexCommon.Pattern(key));
            //console.log(key);
            that.backend.range(new QuadIndexCommon.Pattern(key),function(quads){
                //console.log("retrieved");
                //console.log(quads)
                if(quads == null || quads.length == 0) {
                    callback(true, []);
                } else {
                    callback(true, quads);
                }
            });
        } else {
            callback(false, "Cannot normalize quad: "+quad);
        }
    });
};

// Update queries

QueryEngine.QueryEngine.prototype.executeUpdate = function(syntaxTree, callback) {
    var prologue = syntaxTree.prologue;
    var units = syntaxTree.units;
    var that = this;

    // environment for the operation -> base ns, declared ns, etc.
    var queryEnv = {blanks:{}, outCache:{}};
    this.registerNsInEnvironment(prologue, queryEnv);
    for(var i=0; i<units.length; i++) {

        var aqt = that.abstractQueryTree.parseExecutableUnit(units[i]);
        if(aqt.kind === 'insertdata') {
            Utils.repeat(0, aqt.quads.length, function(k,env) {                
                var quad = aqt.quads[env._i];
                var floop = arguments.callee;
                that._executeQuadInsert(quad, queryEnv, function(result, error) {
                    if(result === true) {
                        k(floop, env);
                    } else {
                        callback(false, error);
                    }
                });
            }, function(env) {
                callback(true);
            });
        } else if(aqt.kind === 'deletedata') {
            Utils.repeat(0, aqt.quads.length, function(k,env) {                
                var quad = aqt.quads[env._i];
                var floop = arguments.callee;
                that._executeQuadDelete(quad, queryEnv, function(result, error) {
                    if(result === true) {
                        k(floop, env);
                    } else {
                        callback(false, error);
                    }
                });
            }, function(env) {
                callback(true);
            });
        } else if(aqt.kind === 'modify') {
            this._executeModifyQuery(aqt, queryEnv, callback);
        } else if(aqt.kind === 'create') {
            callback(true);
        } else if(aqt.kind === 'load') {
            var graph = {'uri': Utils.lexicalFormBaseUri(aqt.sourceGraph, queryEnv)};
            if(aqt.destinyGraph != null) {
                graph = {'uri': Utils.lexicalFormBaseUri(aqt.destinyGraph, queryEnv)};
            }
            var that = this;
            this.rdfLoader.load(aqt.sourceGraph.value, graph, function(success, result){
                if(success == false) {
                    console.log("Error loading graph");
                    console.log(result);
                } else {
                    that.batchLoad(result, callback);
                }
            });
        } else if(aqt.kind === 'drop') {
            this._executeClearGraph(aqt.destinyGraph, queryEnv, callback);
        } else if(aqt.kind === 'clear') {
            this._executeClearGraph(aqt.destinyGraph, queryEnv, callback);
        } else {
            throw new Error("not supported execution unit");
        }
    }
};

QueryEngine.QueryEngine.prototype.batchLoad = function(quads, callback) {
    var that = this;
    var subject    = null;
    var predicate  = null;
    var object     = null;
    var graph      = null;

    Utils.repeat(0, quads.length, function(kk,env){
        if(env.success == null) {
            env.success = true;
            env.counter = 0;
        }
        var floop = arguments.callee;
        var quad = quads[env._i];

        if(env.success) {
          Utils.seq(function(k) {
              // subject
              if(quad.subject['uri'] || quad.subject.token === 'uri') {
                  that.lexicon.registerUri(quad.subject.uri || quad.subject.value, function(oid){
                      subject = oid;
                      k();
                  });

              } else if(quad.subject['literal'] || quad.subject.token === 'literal') {
                  that.lexicon.registerLiteral(quad.subject.literal || quad.subject.value, function(oid){
                      subject = oid;                    
                      k();
                  });
              } else {
                  that.lexicon.registerBlank(quad.subject.blank || quad.subject.value, function(oid){
                      subject = oid;
                      k();
                  });
              }
          }, function(k) {
              // predicate
              if(quad.predicate['uri'] || quad.predicate.token === 'uri') {
                  that.lexicon.registerUri(quad.predicate.uri || quad.predicate.value, function(oid){
                      predicate = oid;
                      k();
                  });
              } else if(quad.predicate['literal'] || quad.predicate.token === 'literal') {
                  that.lexicon.registerLiteral(quad.predicate.literal || quad.predicate.value, function(oid){
                      predicate = oid;                    
                      k();
                  });
              } else {
                  that.lexicon.registerBlank(quad.predicate.blank || quad.predicate.value, function(oid){
                      predicate = oid;
                      k();
                  });
              }
          }, function(k) {
              // object
              if(quad.object['uri'] || quad.object.token === 'uri') {
                  that.lexicon.registerUri(quad.object.uri || quad.object.value, function(oid){
                      object = oid;
                      k();
                  });
              } else if(quad.object['literal'] || quad.object.token === 'literal') {
                  that.lexicon.registerLiteral(quad.object.literal || quad.object.value, function(oid){
                      object = oid;                    
                      k();
                  });
              } else {
                  that.lexicon.registerBlank(quad.object.blank || quad.object.value, function(oid){
                      object = oid;
                      k();
                  });
              }
          }, function(k) {
              // graph
              if(quad.graph['uri'] || quad.graph.token === 'uri') {
                  that.lexicon.registerUri(quad.graph.uri || quad.graph.value, function(oid){
                      graph = oid;
                      k();
                  });
              } else if(quad.graph['literal'] || quad.graph.token === 'literal') {
                  that.lexicon.registerLiteral(quad.graph.literal || quad.graph.value, function(oid){
                      graph = oid;                    
                      k();
                  });
              } else {
                  that.lexicon.registerBlank(quad.graph.blank || quad.graph.value, function(oid){
                      graph = oid;
                      k();
                  });
              }
          })(function(result){
              var quad = {subject: subject, predicate:predicate, object:object, graph: graph};
              var key = new QuadIndexCommon.NodeKey(quad);

              that.backend.index(key, function(result, error){
                  if(result == true){
                      env.counter = env.counter + 1;
                      kk(floop, env);
                  } else {
                      env.success = false;
                      kk(floop, env);
                  }
              });            
          });
        } else {
            kk(floop, env);
        }
    }, function(env){
        if(env.success) {
            callback(true, env.counter);
        } else {
            callback(false, "error loading quads");
        }
    });
};

// Low level operations for update queries

QueryEngine.QueryEngine.prototype._executeModifyQuery = function(aqt, queryEnv, callback) {
    var that = this;
    var querySuccess = true;
    var error = null;
    var bindings = null;
    var components = ['subject', 'predicate', 'object', 'graph'];

    aqt.insert = aqt.insert == null ? [] : aqt.insert;
    aqt.delete = aqt.delete == null ? [] : aqt.delete;

    Utils.seq(
        function(k) {
            // select query

            var defaultGraph = [];
            var namedGraph = [];

            if(aqt.with != null) {
                defaultGraph.push(aqt.with);
            }

            if(aqt.using != null) {
                namedGraph = [];
                for(var i=0; i<aqt.using.length; i++) {
                    var usingGraph = aqt.using[i];
                    if(usingGraph.kind === 'named') {
                        namedGraph.push(usingGraph.uri);
                    } else {
                        defaultGraph.push(usingGraph.uri);
                    }
                }
            }

            aqt.dataset = {};
            aqt.projection = [{"token": "variable", "kind": "*"}];

            that.executeSelect(aqt, queryEnv, defaultGraph, namedGraph, function(success, result) {                

                if(success) {
                    that.denormalizeBindingsList(result, queryEnv.outCache, function(success, result){
                        if(success) {
                            bindings = result;
                        } else {
                            querySuccess = false;
                        }
                        k();
                    }) 
                } else {
                    querySuccess = false;
                    k();
                }
            });

        },function(k) {
            // delete query

            var defaultGraph = aqt.with;
            if(querySuccess) {
                var quads = [];
                for(var i=0; i<aqt.delete.length; i++) {
                    var src = aqt.delete[i];

                    for(var j=0; j<bindings.length; j++) {
                        var quad = {};
                        var binding = bindings[j];

                        for(var c=0; c<components.length; c++) {
                            var component = components[c];
                            if(component == 'graph' && src[component] == null) {
                                quad['graph'] = defaultGraph;
                            } else if(src[component].token === 'var') {
                                quad[component] = binding[src[component].value];
                            } else {
                                quad[component] = src[component];
                            }
                        }

                        quads.push(quad)
                    }
                }

                Utils.repeat(0, quads.length, function(kk,env) {                
                    var quad = quads[env._i];
                    var floop = arguments.callee;
                    that._executeQuadDelete(quad, queryEnv, function(result, error) {
                        kk(floop, env);
                    });
                }, function(env) {
                    k();
                });
            } else {
                k();
            }
        },function(k) {
            // insert query
            var defaultGraph = aqt.with;

            if(querySuccess) {
                var quads = [];
                for(var i=0; i<aqt.insert.length; i++) {
                    var src = aqt.insert[i];

                    for(var j=0; j<bindings.length; j++) {
                        var quad = {};
                        var binding = bindings[j];

                        for(var c=0; c<components.length; c++) {
                            var component = components[c];
                            if(component == 'graph' && src[component] == null) {
                                quad['graph'] = defaultGraph;
                            } else if(src[component].token === 'var') {
                                quad[component] = binding[src[component].value];
                            } else {
                                quad[component] = src[component];
                            }
                        }

                        quads.push(quad)
                    }
                }

                Utils.repeat(0, quads.length, function(kk,env) {                
                    var quad = quads[env._i];
                    var floop = arguments.callee;
                    that._executeQuadInsert(quad, queryEnv, function(result, error) {
                        kk(floop, env);
                    });
                }, function(env) {
                    k();
                });
            } else {
                k();
            }
        }
    )(function(){
        callback(querySuccess);
    });
};

QueryEngine.QueryEngine.prototype._executeQuadInsert = function(quad, queryEnv, callback) {
    var that = this;
    this.normalizeQuad(quad, queryEnv, true, function(success,normalized) {
        if(success === true) {
            var key = new QuadIndexCommon.NodeKey(normalized);
            that.backend.search(key,function(result) {
                if(result){
                    callback(true, "duplicated");
                } else {
                    that.backend.index(key, function(result, error){
                        if(result == true){
                            that.callbacksBackend.nextGraphModification(Callbacks.added, [quad, normalized]);
                            callback(true);
                        } else {
                            callback(false, error);
                        }
                    });
                }
            });
        } else {
            callback(false, result);
        }
    });
};

QueryEngine.QueryEngine.prototype._executeQuadDelete = function(quad, queryEnv, callback) {
    var that = this;
    this.normalizeQuad(quad, queryEnv, false, function(success,normalized) {
        if(success === true) {
            var key = new QuadIndexCommon.NodeKey(normalized);
            that.backend.delete(key, function(result, error){
                that.lexicon.unregister(quad, key, function(result, error){
                    if(result == true){
                        that.callbacksBackend.nextGraphModification(Callbacks['deleted'], [quad, normalized]);
                        callback(true);
                    } else {
                        callback(false, error);
                    }
                })
            });
        } else {
            callback(false, result);
        }
    });
};

QueryEngine.QueryEngine.prototype._executeClearGraph = function(destinyGraph, queryEnv, callback) {
    if(destinyGraph === 'default') {
        this.execute("DELETE { ?s ?p ?o } WHERE { ?s ?p ?o }", callback);
    } else if(destinyGraph === 'named') {
        var that = this;
        this.lexicon.registeredGraphs(true,function(success, graphs){
            if(success === true) {
                var foundErrorDeleting = false;
                Utils.repeat(0, graphs.length,function(k,env) {
                    var graph = graphs[env._i];
                    var floop = arguments.callee;
                    if(!foundErrorDeleting) {
                        that.execute("DELETE { GRAPH <"+graph+"> { ?s ?p ?o } } WHERE { GRAPH <"+graph+"> { ?s ?p ?o } }", function(success, results){
                            foundErrorDeleting = !success;
                            k(floop, env);
                        });
                    } else {
                        k(floop, env);
                    }
                }, function(env) {
                    callback(!foundErrorDeleting);
                });
            } else {
                callback(false, "Error deleting named graphs");
            }
        });
    } else if(destinyGraph === 'all') {
        var that = this;
        this.execute("CLEAR DEFAULT", function(success, result) {
            if(success) {
                that.execute("CLEAR NAMED", callback);
            } else {
                callback(false,result);
            }
        });
    } else {
        // destinyGraph is an URI
        if(destinyGraph.token == 'uri') {
            var graphUri = Utils.lexicalFormBaseUri(destinyGraph,queryEnv);
            if(graphUri != null) {
                this.execute("DELETE { GRAPH <"+graphUri+"> { ?s ?p ?o } } WHERE { GRAPH <"+graphUri+"> { ?s ?p ?o } }", callback);
            } else {
                callback(false, "wrong graph URI");
            }
        } else {
            callback(false, "wrong graph URI");
        }
    }
};
