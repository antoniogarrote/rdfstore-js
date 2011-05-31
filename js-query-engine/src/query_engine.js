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

QueryEngine.QueryEngine = function(params) {
    if(arguments.length != 0) {
        this.backend = params.backend;
        this.lexicon = params.lexicon;
        this.abstractQueryTree = new AbstractQueryTree.AbstractQueryTree();
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
            for(var p in bindings) {
                // hashing the object
                var obj = bindings[p];
                if(obj.token == 'literal') {
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
                return that.compareFilteredBindings(a, b, order);
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

QueryEngine.QueryEngine.prototype.compareFilteredBindings = function(a, b, order) {
    var found = false;
    var i = 0
    while(!found) {
        if(i==a.value.length) {
            return 0;
        }
        var direction = order[i].direction;

        if(QueryFilters.runEqualityFunction(a.value[i], b.value[i], []).value == true) {
            i++;
        } else {
            var filterResult = QueryFilters.runTotalGtFunction(a.value[i], b.value[i], []);
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
    }
};

QueryEngine.QueryEngine.prototype.applyGroupBy = function(key, direction, bindings) {
    // @todo
    return bindings;
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
QueryEngine.QueryEngine.prototype.projectBindings = function(projection, results) {
    if(projection[0].kind === '*') {
        return results;
    } else {
        var toProject = [];
        var result = [];
        for(var i=0; i< projection.length; i++) {
            toProject.push(projection[i].value.value);
        }

        for(var i=0; i< results.length; i++) {
            var bindings = results[i];
            var projected = {};
            for(var j=0; j<toProject.length; j++) {
                projected[toProject[j]] = bindings[toProject[j]];
            }
            result.push(projected);
        }
    }
    return result;
};

QueryEngine.QueryEngine.prototype.applyBaseUri = function(uriFragment, env) {
    return (env.base||"") + uriFragment;
};

QueryEngine.QueryEngine.prototype.resolveNsInEnvironment = function(prefix, env) {
    var namespaces = env.namespaces;
    return namespaces[prefix];
};

QueryEngine.QueryEngine.prototype.hasScheme = function(uri) {
    return uri.indexOf(":") != -1;
};

QueryEngine.QueryEngine.prototype.normalizeBaseUri = function(term, env) {
    var uri = null;
    //console.log("*** normalizing URI token:");
    //console.log(term);
    if(term.value == null) {
        //console.log(" - URI has prefix and suffix");
        //console.log(" - prefix:"+term.prefix);
        //console.log(" - suffixx:"+term.suffix);
        var prefix = term.prefix;
        var suffix = term.suffix;
        var resolvedPrefix = this.resolveNsInEnvironment(prefix, env);
        if(resolvedPrefix != null) {            
            uri = resolvedPrefix+suffix;
        }
    } else {
        //console.log(" - URI is not prefixed");
        uri = term.value
    }

    if(uri===null) {
        return null;
    } else {
        //console.log(" - resolved URI is "+uri);
        if(!this.hasScheme(uri)) {
            //console.log(" - URI is partial");
            uri = this.applyBaseUri(uri, env);
        } else {
            //console.log(" - URI is complete");
        }

        //console.log(" -> FINAL URI: "+uri);
        // 1. resolve ns prefix if prefixed
        // 2. check if fragment or full uri
        // 3. apply base if fragment
    }

    return uri;
}

QueryEngine.QueryEngine.prototype.normalizeTerm = function(term, env, callback) {
    if(term.token === 'uri') {
        var uri = this.normalizeBaseUri(term, env);
        if(uri == null) {
            callback(false, "The prefix "+prefix+" cannot be resolved in the current environment");
        } else {
            this.lexicon.registerUri(uri, function(oid){
                callback(true, oid);
            });
        }

    } else if(term.token === 'literal') {
        this.normalizeLiteral(term, env, function(success, result){
            callback(success, result);
        })
    } else if(term.token === 'blank') {
        var label = term.label;
        var oid = env.blanks[label];
        if( oid != null) {
            callback(true,oid);
        } else {
            this.lexicon.registerBlank(label, function(oid) {
                env.blanks[label] = oid;
                callback(true,oid);
            });
        }
    } else if(term.token === 'var') {
        callback(true, term.value);
    } else {
        //@todo handle here variables and blank nodes
        callback(false, 'Token of kind '+term.token+' cannot be normalized');
    }
};

QueryEngine.QueryEngine.prototype.normalizeDatasets = function(datasets, env, callback) {
    var that = this;
    Utils.repeat(0, datasets.length, function(k,env) {
        var floop = arguments.callee;
        var dataset = datasets[env._i];
        if(dataset.value === that.lexicon.defaultGraphUri) {
            dataset.oid = that.lexicon.defaultGraphOid;
            k(floop, env);
        } else {
            that.normalizeTerm(dataset, env, function(success, result){
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

QueryEngine.QueryEngine.prototype.baseValueLiteral = function(term, env) {
    var value = term.value;
    var lang = term.lang;
    var type = term.type;

    var indexedValue = null;
    if(value != null && type != null && typeof(type) != 'string') {
        var typeValue = type.value;

        if(typeValue != null) {
            indexedValue = '"' + term.value + '"^^<' + typeValue + '>';
        } else {
            var typePrefix = type.prefix;
            var typeSuffix = type.suffix;

            var resolvedPrefix = this.resolveNsInEnvironment(typePrefix, env);
            term.type = resolvedPrefix+typeSuffix;
            indexedValue = '"' + term.value + '"^^<' + resolvedPrefix + typeSuffix + '>';
        }
    } else {
        if(lang == null && type == null) {
            indexedValue = '"' + value + '"';
        } else if(type == null) {
            indexedValue = '"' + value + '"' + "@" + lang;        
        } else {
            indexedValue = '"' + term.value + '"^^<'+type+'>';
        }
    }
    return indexedValue;
};

QueryEngine.QueryEngine.prototype.normalizeLiteral = function(term, env, callback) {
    var indexedValue = this.baseValueLiteral(term, env);

    this.lexicon.registerLiteral(indexedValue, function(oid){
        callback(true, oid);
    });
};

QueryEngine.QueryEngine.prototype.denormalizeBindingsList = function(bindingsList, callback) {
    var results = [];
    var that = this;

    Utils.repeat(0, bindingsList.length, function(k,env){
        var floop = arguments.callee;
        that.denormalizeBindings(bindingsList[env._i], function(success, result){
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

QueryEngine.QueryEngine.prototype.denormalizeBindings = function(bindings, callback) {
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
            that.lexicon.retrieve(oid, function(val){
                bindings[variables[env._i]] = val;
                k(floop, env);
          });
        }
    }, function(env){
        callback(true, bindings);
    })
};

// Queries execution

QueryEngine.QueryEngine.prototype.execute = function(queryString, callback, defaultDataset, namedDataset){
    var syntaxTree = this.abstractQueryTree.parseQueryString(queryString);
    if(syntaxTree == null) {
        throw("Error parsing query string");
    } else {
        if(syntaxTree.token === 'query' && syntaxTree.kind == 'update')  {
            this.executeUpdate(syntaxTree, callback);
        } else if(syntaxTree.token === 'query' && syntaxTree.kind == 'query') {
            //console.log(JSON.stringify(syntaxTree));
            this.executeQuery(syntaxTree, callback, defaultDataset, namedDataset);
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
              that.denormalizeBindingsList(result, function(success, result){
                  if(success) {                        
                      callback(true, result);
                  } else {
                      callback(false, result);
                  }
              });
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
                    that.denormalizeBindingsList(result, function(success, result){
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
                                    //console.log(tripleTemplate);
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
    if(unit.kind === "select" || unit.kind === "ask" || unit.kind === "construct") {
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
        } else if(dataset.default.length === 0 && dataset.named.length === 0) {
            // We add the default graph to the default merged graph
            dataset.default.push(this.lexicon.defaultGraphUriTerm);
        }

        that.normalizeDatasets(dataset.default.concat(dataset.named), env, function(success, results){
            if(success) {
                that.executeSelectUnit(projection, dataset, unit.pattern, env, function(success, result){
                  if(success) {
                          that.applyOrderBy(order, result, env, function(success, orderedBindings){
                              if(success) {
                                  // @todo group here!
                                  var projectedBindings = that.projectBindings(projection, orderedBindings);
                                  modifiedBindings = that.applyModifier(modifier, projectedBindings);
                                  var limitedBindings  = that.applyLimitOffset(offset, limit, modifiedBindings);
                                  filteredBindings = that.removeDefaultGraphBindings(limitedBindings, dataset);

                                  callback(true,filteredBindings);                  
                              } else {
                                  callback(false, orderedBindings);
                              }
                          });
                      } else {
                          callback(false, result);
                      }
                  });
            } else {
                callback(false,results);
            }
        })
    } else {
        callback(false,"Cannot execute " + unit.kind + " query as a select query");
    }
};

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
    that.normalizeQuad(quad, queryEnv, function(success, key){
        if(success == true) {
            that.backend.range(new QuadIndexCommon.Pattern(key),function(quads){
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
            callback(false, result);
        }
    });
};
