//imports
var AbstractQueryTree = require("./abstract_query_tree").AbstractQueryTree;
var NonSupportedSparqlFeatureError = require("./abstract_query_tree").NonSupportedSparqlFeatureError;
var Utils = require("./utils");
var QuadIndex = require("./quad_index");
var QueryPlan = require("./query_plan").QueryPlan;
var QueryFilters = require("./query_filters").QueryFilters;
var RDFModel = require("./rdf_model");
var RDFLoader = require("./rdf_loader").RDFLoader;
var Callbacks = require("./graph_callbacks").CallbacksBackend;
var async = require('./utils');
var _ = require('./utils');

function BindExpressionError(message, bind, error) {
    this.name = "BindExpressionError";
    this.bind = bind;
    this.error = error;
    this.message = message;
}
BindExpressionError.prototype = new Error();
BindExpressionError.constructor = BindExpressionError;

QueryEngine = function(params) {
    if(arguments.length != 0) {
        this.backend = params.backend;
        this.lexicon = params.lexicon;
        // batch loads should generate events?
        this.eventsOnBatchLoad = (params.eventsOnBatchLoad || false);
        // list of namespaces that will be automatically added to every query
        this.defaultPrefixes = {};
        this.abstractQueryTree = new AbstractQueryTree();
        this.rdfLoader = new RDFLoader(params['communication']);
        this.callbacksBackend = new Callbacks(this);
        this.customFns = params.customFns || {};
    }
};

QueryEngine.prototype.setCustomFunctions = function(customFns) {
    this.customFns = customFns;
};

// Utils
QueryEngine.prototype.registerNsInEnvironment = function(prologue, env) {
    var prefixes = [];
    if(prologue != null && prologue.prefixes != null) {
        prefixes =prologue.prefixes;
    }
    var toSave = {};

    // adding default prefixes;
    for(var p in this.defaultPrefixes) {
        toSave[p] = this.defaultPrefixes[p];
    }

    for(var i=0; i<prefixes.length; i++) {
        var prefix = prefixes[i];
        if(prefix.token === "prefix") {
            toSave[prefix.prefix] = prefix.local;
        }
    }

    env.namespaces = toSave;
    if(prologue!=null && prologue.base && typeof(prologue.base) === 'object') {
        env.base = prologue.base.value;
    } else {
        env.base = null;
    }
};

QueryEngine.prototype.applyModifier = function(modifier, projectedBindings) {
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
                result.push(bindings);
                map[key] = true;
            }
        }
        return result;
    } else {
        return projectedBindings;
    }
};

QueryEngine.prototype.applyLimitOffset = function(offset, limit, bindings) {
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


QueryEngine.prototype.applySingleOrderBy = function(orderFilters, modifiedBindings, dataset, outEnv, callback) {
    var acum = [];
    var that = this;
    async.eachSeries(orderFilters, function(orderFilter,k){
        QueryFilters.collect(orderFilter.expression, [modifiedBindings], dataset, outEnv, that, function(results) {
            acum.push(results[0].value);
            k()
        });
    }, function(){
        callback({binding:modifiedBindings, value:acum})
    });
};

QueryEngine.prototype.applyOrderBy = function(order, modifiedBindings, dataset, outEnv, callback) {
    var that = this;
    var acum = [];
    if(order != null && order.length > 0) {
        async.eachSeries(modifiedBindings, function(bindings,k){
            that.applySingleOrderBy(order, bindings, dataset, outEnv, function(results){
                acum.push(results);
                k();
            });
        }, function(){
            acum.sort(function(a,b){
                return that.compareFilteredBindings(a, b, order, outEnv);
            });

            var toReturn = [];
            for(var i=0; i<acum.length; i++) {
                toReturn.push(acum[i].binding);
            }

            callback(toReturn);
        });

    } else {
        callback(modifiedBindings);
    }
};

QueryEngine.prototype.compareFilteredBindings = function(a, b, order, env) {
    var found = false;
    var i = 0;
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

QueryEngine.prototype.removeDefaultGraphBindings = function(bindingsList, dataset) {
    var onlyDefaultDatasets = [];
    var namedDatasetsMap = {};
    for(var i=0; i<dataset.named.length; i++) {
        namedDatasetsMap[dataset.named[i].oid] = true;
    }
    for(i=0; i<dataset.implicit.length; i++) {
        if(namedDatasetsMap[dataset.implicit[i].oid] == null) {
            onlyDefaultDatasets.push(dataset.implicit[i].oid);
        }
    }
    var acum = [];
    for(i=0; i<bindingsList.length; i++) {
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
};


QueryEngine.prototype.aggregateBindings = function(projection, bindingsGroup, dataset, env, callback) {
    this.copyDenormalizedBindings(bindingsGroup, env.outCache, function(denormBindings){
        var aggregatedBindings = {};
        for(var i=0; i<projection.length; i++) {
            var aggregatedValue = QueryFilters.runAggregator(projection[i], denormBindings, this, dataset, env);
            if(projection[i].alias) {
                aggregatedBindings[projection[i].alias.value] = aggregatedValue;
            } else {
                aggregatedBindings[projection[i].value.value] = aggregatedValue;
            }
        }
        callback(aggregatedBindings);
    });
};


QueryEngine.prototype.projectBindings = function(projection, results, dataset) {
    if(projection[0].kind === '*') {
        return results;
    } else {
        var projectedResults = [];

        for(var i=0; i<results.length; i++) {
            var currentResult = results[i];
            var currentProjected = {};
            var shouldAdd = true;

            for(var j=0; j< projection.length; j++) {
                if(projection[j].token == 'variable' && projection[j].kind != 'aliased') {
                    currentProjected[projection[j].value.value] = currentResult[projection[j].value.value];
                } else if(projection[j].token == 'variable' && projection[j].kind == 'aliased') {
                    var ebv = QueryFilters.runFilter(projection[j].expression, currentResult, this, dataset, {blanks:{}, outCache:{}});
                    if(QueryFilters.isEbvError(ebv)) {
                        shouldAdd = false;
                        break;
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

QueryEngine.prototype.resolveNsInEnvironment = function(prefix, env) {
    var namespaces = env.namespaces;
    return namespaces[prefix];
};

QueryEngine.prototype.normalizeTerm = function(term, env, shouldIndex, callback) {
    if(term.token === 'uri') {
        var uri = Utils.lexicalFormBaseUri(term, env);
        if(uri == null) {
            callback(null);
        } else {
            if(shouldIndex) {
                this.lexicon.registerUri(uri,callback);
            } else {
                this.lexicon.resolveUri(uri,callback);
            }
        }

    } else if(term.token === 'literal') {
        var lexicalFormLiteral = Utils.lexicalFormLiteral(term, env);
        if(shouldIndex) {
            this.lexicon.registerLiteral(lexicalFormLiteral,callback);
        } else {
            this.lexicon.resolveLiteral(lexicalFormLiteral,callback);
        }
    } else if(term.token === 'blank') {
        var label = term.value;
        var oid = env.blanks[label];
        if( oid != null) {
            callback(oid);
        } else {
            if(shouldIndex) {
                this.lexicon.registerBlank(function(oid){
                    env.blanks[label] = oid;
                    callback(oid);
                });
            } else {
                // should never get here...
                // is resolveBlank useful?
                this.lexicon.resolveBlank(function(oid) {
                    env.blanks[label] = oid;
                    callback(oid);
                });
            }
        }
    } else if(term.token === 'var') {
        callback(term.value);
    } else {
        callback(null);
    }
};

QueryEngine.prototype.normalizeDatasets = function(datasets, outerEnv, callback) {
    var that = this;
    async.eachSeries(datasets, function(dataset, k){
        if(dataset.value === that.lexicon.defaultGraphUri) {
            dataset.oid = that.lexicon.defaultGraphOid;
            k();
        } else {
            that.normalizeTerm(dataset, outerEnv, false, function(oid){
                if(oid != null) {
                    dataset.oid = oid;
                }
                k();
            });
        }
    }, function(){
        callback(true);
    });
};

QueryEngine.prototype.normalizeQuad = function(quad, queryEnv, shouldIndex, callback) {
    var subject    = null;
    var predicate  = null;
    var object     = null;
    var graph      = null;
    var that = this;
    var error = false;

    async.seq(function(k){
        if(quad.graph == null || quad.graph.value === that.lexicon.defaultGraphUri) {
            graph = 0; // default graph
            k();
        } else {
            var graphUriValue = Utils.lexicalFormBaseUri(quad.graph, queryEnv);
            that.normalizeTerm(quad.graph, queryEnv, shouldIndex, function(oid){
                if(oid != null) {
                    graph = oid;
                    if(shouldIndex === true && quad.graph.token!='var') {
                        that.lexicon.registerGraph(oid, graphUriValue, function(){
                            k();
                        });
                    } else {
                        k();
                    }
                } else {
                    error = true;
                    k();
                }
            });
        }

    }, function(k){
        if(error === false) {
            that.normalizeTerm(quad.subject, queryEnv, shouldIndex, function(oid){
                if(oid!=null) {
                    subject = oid;
                    k();
                } else {
                    error = true;
                    k();
                }
            });
        } else {
            k();
        }
    },function(k){
        if(error === false) {
            that.normalizeTerm(quad.predicate, queryEnv, shouldIndex, function(oid){
                if(oid!=null) {
                    predicate = oid;
                    k();
                } else {
                    error = true;
                    k();
                }
            });
        } else {
            k();
        }
    },function(k){
        if(error === false) {
            that.normalizeTerm(quad.object, queryEnv, shouldIndex, function(oid){
                if(oid!=null) {
                    object = oid;
                    k();
                } else {
                    error = true;
                    k();
                }
            });
        } else {
            k();
        }
    })(function(){
        if(error === true){
            callback(null);
        } else {
            callback({
                subject:subject,
                predicate:predicate,
                object:object,
                graph:graph
            });
        }
    });
};

QueryEngine.prototype.denormalizeBindingsList = function(bindingsList, env, callback) {
    var that = this;
    var denormList = [];

    async.eachSeries(bindingsList, function(bindings, k){
        that.denormalizeBindings(bindings, env, function(denorm){
            denormList.push(denorm);
            k();
        });
    },function(){
        callback(denormList);
    });
};

/**
 * Receives a bindings map (var -> oid) and an out cache (oid -> value)
 * returns a bindings map (var -> value) storing in cache all the missing values for oids
 *
 * This is required just to save lookups when final results are generated.
 */
QueryEngine.prototype.copyDenormalizedBindings = function(bindingsList, out, callback) {
    var that = this;
    var denormList = [];
    async.eachSeries(bindingsList, function(bindings, k){
        var denorm = {};
        var variables = _.keys(bindings);
        async.eachSeries(variables, function(variable, kk){
            var oid = bindings[variable];
            if(oid == null) {
                // this can be null, e.g. union different variables (check SPARQL recommendation examples UNION)
                denorm[variable] = null;
                kk();
            } else if(typeof(oid) === 'object') {
                // the binding is already denormalized, this can happen for example because the value of the
                // binding is the result of the aggregation of other bindings in a GROUP clause
                denorm[variable] = oid;
                kk();
            } else {
                var inOut = out[oid];
                if(inOut!= null) {
                    denorm[variable] = inOut;
                    kk();
                } else {
                    that.lexicon.retrieve(oid, function(val){
                        out[oid] = val;
                        denorm[variable] = val;
                        kk();
                    });
                }
            }
        },function(){
            denormList.push(denorm);
            k();
        });
    }, function(){
        callback(denormList);
    });
};

QueryEngine.prototype.denormalizeBindings = function(bindings, env, callback) {
    var variables = _.keys(bindings);
    var envOut = env.outCache;
    var that = this;
    async.eachSeries(variables, function(variable, k){
        var oid = bindings[variable];
        if(oid == null) {
            // this can be null, e.g. union different variables (check SPARQL recommendation examples UNION)
            bindings[variable] = null;
            k();
        } else if(typeof(oid) === 'object') {
            // the binding is already denormalized, this can happen for example because the value of the
            // binding is the result a BIND(expression AS ?new_var) binding.
            k();
        } else {
            if(envOut[oid] != null) {
                bindings[variable] = envOut[oid];
                k();
            } else {
                that.lexicon.retrieve(oid, function(val){
                    bindings[variable] = val;
                    if(val.token === 'blank')
                        env.blanks[val.value] = oid;
                    k();
                });
            }
        }
    }, function(){
        callback(bindings);
    });
};

// Queries execution

QueryEngine.prototype.execute = function(queryString, callback, defaultDataset, namedDataset){
    //try{
        queryString = Utils.normalizeUnicodeLiterals(queryString);
        var syntaxTree = this.abstractQueryTree.parseQueryString(queryString);
        if(syntaxTree == null) {
            callback(false,"Error parsing query string");
        } else {
            if(syntaxTree.token === 'query' && syntaxTree.kind == 'update')  {
                this.callbacksBackend.startGraphModification();
                var that = this;
                this.executeUpdate(syntaxTree, function(err, result){
                    if(that.lexicon.updateAfterWrite)
                        that.lexicon.updateAfterWrite();

                    if(err) {
                        that.callbacksBackend.cancelGraphModification();
                        callback(err, result);
                    } else {
                        that.callbacksBackend.endGraphModification(function(){
                            callback(err, result);
                        });
                    }
                });
            } else if(syntaxTree.token === 'query' && syntaxTree.kind == 'query') {
                this.executeQuery(syntaxTree, callback, defaultDataset, namedDataset);
            }
        }
    //} catch(e) {
    //    callback(e);
    //}
};

// Retrieval queries

QueryEngine.prototype.executeQuery = function(syntaxTree, callback, defaultDataset, namedDataset) {
    var prologue = syntaxTree.prologue;
    var units = syntaxTree.units;
    var that = this;

    // environment for the operation -> base ns, declared ns, etc.
    var queryEnv = {blanks:{}, outCache:{}};
    this.registerNsInEnvironment(prologue, queryEnv);

    // retrieval queries can only have 1 executable unit
    var aqt = that.abstractQueryTree.parseExecutableUnit(units[0]);

    // can be anything else but a select???
    if(aqt.kind === 'select') {
        this.executeSelect(aqt, queryEnv, defaultDataset, namedDataset, function(err, result){
            if(err == null) {
                if(typeof(result) === 'object' && result.denorm === true) {
                    callback(null, result['bindings']);
                } else {
                    that.denormalizeBindingsList(result, queryEnv, function(result){
                        callback(null, result);
                    });
                }
            } else {
                callback(err);
            }
        });
    } else if(aqt.kind === 'ask') {
        aqt.projection = [{"token": "variable", "kind": "*"}];
        this.executeSelect(aqt, queryEnv, defaultDataset, namedDataset, function(err, result){
            if(err == null) {
                if(result.length>0) {
                    callback(null, true);
                } else {
                    callback(null, false);
                }
            } else {
                callback(err);
            }
        });
    } else if(aqt.kind === 'construct') {
        aqt.projection = [{"token": "variable", "kind": "*"}];
        that = this;
        this.executeSelect(aqt, queryEnv, defaultDataset, namedDataset, function(err, result){
            if(err == null) {

                that.denormalizeBindingsList(result, queryEnv, function(result){
                    if(result != null) {
                        var graph = new RDFModel.Graph();

                        // CONSTRUCT WHERE {} case
                        if(aqt.template == null) {
                            aqt.template = {triplesContext: aqt.pattern};
                        }
                        var blankIdCounter = 1;
                        var toClear = [];
                        for(var i=0; i<result.length; i++) {
                            var bindings = result[i];
                            for(var j=0; j<toClear.length; j++)
                                delete toClear[j].valuetmp;

                            for(var j=0; j<aqt.template.triplesContext.length; j++) {
                                // fresh IDs for blank nodes in the construct template
                                var components = ['subject', 'predicate', 'object'];
                                var tripleTemplate = aqt.template.triplesContext[j];
                                for(var p=0; p<components.length; p++) {
                                    var component = components[p];
                                    if(tripleTemplate[component].token === 'blank') {
                                        if(tripleTemplate[component].valuetmp && tripleTemplate[component].valuetmp != null) {
                                        } else {
                                            var blankId = "_:b"+blankIdCounter;
                                            blankIdCounter++;
                                            tripleTemplate[component].valuetmp = blankId;
                                            toClear.push(tripleTemplate[component]);
                                        }
                                    }
                                }
                                var s = RDFModel.buildRDFResource(tripleTemplate.subject,bindings,that,queryEnv);
                                var p = RDFModel.buildRDFResource(tripleTemplate.predicate,bindings,that,queryEnv);
                                var o = RDFModel.buildRDFResource(tripleTemplate.object,bindings,that,queryEnv);
                                if(s!=null && p!=null && o!=null) {
                                    var triple = new RDFModel.Triple(s,p,o);
                                    graph.add(triple);
                                    //} else {
                                    //    return callback(false, "Error creating output graph")
                                }
                            }
                            }
                        callback(null,graph);
                    } else {
                        callback(new Error("Error denormalizing bindings."));
                    }
                });
            } else {
                callback(err);
            }
        });
    }
};


// Select queries

QueryEngine.prototype.executeSelect = function(unit, env, defaultDataset, namedDataset, callback) {
    if(unit.kind === "select" || unit.kind === "ask" || unit.kind === "construct" || unit.kind === "modify") {
        var projection = unit.projection;
        var dataset    = unit.dataset;
        var modifier   = unit.modifier;
        var limit      = unit.limit;
        var offset     = unit.offset;
        var order      = unit.order;
        var that = this;

        if(defaultDataset != null || namedDataset != null) {
            dataset.implicit = defaultDataset || [];
            dataset.named   = namedDataset || [];
        }

        if(dataset.implicit != null && dataset.implicit.length === 0 && dataset.named !=null && dataset.named.length === 0) {
            // We add the default graph to the default merged graph
            dataset.implicit.push(this.lexicon.defaultGraphUriTerm);
        }


        that.normalizeDatasets(dataset.implicit.concat(dataset.named), env, function(){
            try {
                that.executeSelectUnit(projection, dataset, unit.pattern, env, function (result) {
                    if (result != null) {
                        // detect single group
                        if (unit.group != null && unit.group === "") {
                            var foundUniqueGroup = false;
                            for (var i = 0; i < unit.projection.length; i++) {
                                if (unit.projection[i].expression != null && unit.projection[i].expression.expressionType === 'aggregate') {
                                    foundUniqueGroup = true;
                                    break;
                                }
                            }
                            if (foundUniqueGroup === true) {
                                unit.group = 'singleGroup';
                            }
                        }
                        if (unit.group && unit.group != "") {
                            if (that.checkGroupSemantics(unit.group, projection)) {
                                that.groupSolution(result, unit.group, dataset, env, function(groupedBindings){
                                    var aggregatedBindings = [];
                                    async.eachSeries(groupedBindings, function(groupedBindingsGroup, k){
                                        that.aggregateBindings(projection, groupedBindingsGroup, dataset, env, function(resultingBindings){
                                            aggregatedBindings.push(resultingBindings);
                                            k();
                                        });
                                    }, function(){
                                        callback(null, {'bindings': aggregatedBindings, 'denorm': true});
                                    });
                                });
                            } else {
                                callback(new Error("Incompatible Group and Projection variables"));
                            }
                        } else {
                            that.applyOrderBy(order, result, dataset, env, function(orderedBindings){
                                var projectedBindings = that.projectBindings(projection, orderedBindings, dataset);
                                var modifiedBindings = that.applyModifier(modifier, projectedBindings);
                                var limitedBindings = that.applyLimitOffset(offset, limit, modifiedBindings);
                                var filteredBindings = that.removeDefaultGraphBindings(limitedBindings, dataset);

                                callback(null, filteredBindings);
                            });
                        }

                    } else { // fail selectUnit
                        callback(new Error("Error executing SELECT query."));
                    }
                });
            } catch(e) {
                callback(e);
            }
        });
    } else {
        callback(new Error("Cannot execute " + unit.kind + " query as a select query"));
    }
};


QueryEngine.prototype.groupSolution = function(bindings, group, dataset, queryEnv, callback){
    var order = [];
    var filteredBindings = [];
    var initialized = false;
    var that = this;
    if(group === 'singleGroup') {
        callback([bindings]);
    } else {
        async.eachSeries(bindings, function(currentBindings,k){
            var mustAddBindings = true;

            /**
             * In this loop, we iterate through all the group clauses and transform the current bindings
             * according to the group by clauses.
             * If it is the first iteration we also save in a different array the order for the
             * grouped variables that will be used later to build the final groups
             */
            async.eachSeries(group, function(currentOrderClause, kk){
                var orderVariable = null;

                if(currentOrderClause.token === 'var') {
                    orderVariable = currentOrderClause.value;

                    if(initialized == false) {
                        order.push(orderVariable);
                    }
                    kk();
                } else if(currentOrderClause.token === 'aliased_expression') {
                    orderVariable = currentOrderClause.alias.value;
                    if(initialized == false) {
                        order.push(orderVariable);
                    }

                    if(currentOrderClause.expression.primaryexpression === 'var') {
                        currentBindings[currentOrderClause.alias.value] = currentBindings[currentOrderClause.expression.value.value];
                    } else {
                        var denormBindings = that.copyDenormalizedBindings([currentBindings], queryEnv.outCache);
                        var filterResultEbv = QueryFilters.runFilter(currentOrderClause.expression, denormBindings[0], that, dataset, queryEnv);
                        if(!QueryFilters.isEbvError(filterResultEbv)) {
                            if(filterResultEbv.value != null) {
                                filterResultEbv.value = ""+filterResultEbv.value;
                            }
                            currentBindings[currentOrderClause.alias.value]= filterResultEbv;
                        } else {
                            mustAddBindings = false;
                        }
                    }
                    kk();
                } else {
                    // In this case, we create an additional variable in the binding to hold the group variable value
                    that.copyDenormalizedBindings([currentBindings], queryEnv.outCache, function(denormBindings){
                        var filterResultEbv = QueryFilters.runFilter(currentOrderClause, denormBindings[0], that, queryEnv);
                        if(!QueryFilters.isEbvError(filterResultEbv)) {
                            currentBindings["groupCondition"+env._i] = filterResultEbv;
                            orderVariable = "groupCondition"+env._i;
                            if(initialized == false) {
                                order.push(orderVariable);
                            }

                        } else {
                            mustAddBindings = false;
                        }
                        kk();
                    });
                }
            }, function(){
                if(initialized == false) {
                    initialized = true;
                }
                if(mustAddBindings === true) {
                    filteredBindings.push(currentBindings);
                }
                k();
            });
        }, function(){
            /**
             * After processing all the bindings, we build the group using the
             * information stored about the order of the group variables.
             */
            var dups = {};
            var groupMap = {};
            var groupCounter = 0;
            for(var i=0; i<filteredBindings.length; i++) {
                var currentTransformedBinding = filteredBindings[i];
                var key = "";
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

            callback(groups);
        });
    }
};


/**
 * Here, all the constructions of the SPARQL algebra are handled
 */
QueryEngine.prototype.executeSelectUnit = function(projection, dataset, pattern, env, callback) {
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
        this.executeSelectUnit(projection, dataset, pattern.value, env, function (results) {
            if (results != null) {
                QueryFilters.checkFilters(pattern, results, false, dataset, env, that, callback);
            } else {
                callback([]);
            }
        });
    } else if(pattern.kind === "EMPTY_PATTERN") {
        // as an example of this case  check DAWG test case: algebra/filter-nested-2
        callback([]);
    //} else if(pattern.kind === "ZERO_OR_MORE_PATH" || pattern.kind === 'ONE_OR_MORE_PATH') {
    //    return this.executeZeroOrMorePath(pattern, dataset, env);
    } else {
        throw(new NonSupportedSparqlFeatureError(pattern.kind));
    }
};

/*
QueryEngine.prototype.executeZeroOrMorePath = function(pattern, dataset, env) {
    //console.log("EXECUTING ZERO OR MORE PATH");
    //console.log("X");
    //console.log(pattern.x);
    //console.log("Y");
    //console.log(pattern.y);
    var projection = [];
    var starProjection = false;
    if(pattern.x.token === 'var') {
        projection.push({token: 'variable',
            kind: 'var',
            value: pattern.x.value});
    }
    if(pattern.y.token === 'var') {
        projection.push({token: 'variable',
            kind: 'var',
            value: pattern.y.value});
    }

    if(projection.length === 0) {
        projection.push({"token": "variable", "kind": "*"});
        starProjection = true;
    }

    //console.log("COMPUTED PROJECTION");
    //console.log(projection);


    if(pattern.x.token === 'var' && pattern.y.token === 'var') {
        var bindings = this.executeAndBGP(projection, dataset, pattern.path, env);
        //console.log("BINDINGS "+bindings.length);
        //console.log(bindings);
        var acum = {};
        var results = [];
        var vx, intermediate, nextBinding, vxDenorm;
        var origVXName = pattern.x.value;
        var last = pattern.x;
        var nextPath = pattern.path;
        //console.log("VAR - VAR PATTERN");
        //console.log(nextPath.value);
        for(var i=0; i<bindings.length; i++) {
            vx = bindings[i][origVXName];
            if(acum[vx] == null) {
                vxDenorm = this.lexicon.retrieve(vx);
                pattern.x = vxDenorm;
                //console.log("REPLACING");
                //console.log(last);
                //console.log("BY");
                //console.log(vxDenorm);
                //console.log(nextPath.value);
                pattern.path = this.abstractQueryTree.replace(nextPath, last, vxDenorm, env);
                nextPath = Utils.clone(pattern.path);
                intermediate = this.executeZeroOrMorePath(pattern, dataset, env);
                for(var j=0; j<intermediate.length; j++) {
                    nextBinding = intermediate[j];
                    nextBinding[origVXName] = vx;
                    results.push(nextBinding)
                }
                last = vxDenorm;
            }
        }

        //console.log("RETURNING VAR - VAR");
        return results;
    } else if(pattern.x.token !== 'var' && pattern.y.token === 'var') {
        var finished;
        var acum = {};
        var initial = true;
        var pending = [];
        var bindings,nextBinding;
        var collected = [];
        var origVx = pattern.x;
        var last;

        while(initial == true || pending.length !== 0) {
            //console.log("-- Iteration");
            //console.log(pattern.path.value[0]);
            if(initial === true) {
                bindings = this.executeAndBGP(projection, dataset, pattern.path, env);
                //console.log("SAVING LAST");
                //console.log(pattern.x);
                last = pattern.x;
                initial = false;
            } else {
                var nextOid = pending.pop();
                //console.log("POPPING:"+nextOid);
                var value = this.lexicon.retrieve(nextOid);
                var path = pattern.path; //Utils.clone(pattern.path);
                //console.log(path.value[0]);
                //console.log("REPLACING");
                //console.log(last);
                //console.log("BY");
                //console.log(value);
                path = this.abstractQueryTree.replace(path, last, value, env);
                //console.log(path.value[0]);
                bindings = this.executeAndBGP(projection, dataset, path, env);
                last = value;
            }


            //console.log("BINDINGS!");
            //console.log(bindings);

            for(var i=0; i<bindings.length; i++) {
                //console.log(bindings[i][pattern.y.value])
                var value = bindings[i][pattern.y.value];
                //console.log("VALUE:"+value);
                if(acum[value] !== true) {
                    nextBinding = {};
                    nextBinding[pattern.y.value] = value;
                    collected.push(nextBinding);
                    acum[value] = true;
                    pending.push(value);
                }
            }
        }
        //console.log("RETURNING TERM - VAR");
        //console.log(collected);
        return collected;
    } else {
        throw "Kind of path not supported!";
    }
};
*/

QueryEngine.prototype.executeUNION = function(projection, dataset, patterns, env, callback) {
    var setQuery1 = patterns[0];
    var setQuery2 = patterns[1];
    var error = null;
    var set1,set2;


    if(patterns.length != 2) {
        throw("SPARQL algebra UNION with more than two components");
    }

    var that = this;
    async.seq(
        function(k){
            try {
                that.executeSelectUnit(projection, dataset, setQuery1, env, function (result) {
                    set1 = result;
                    k();
                });
            } catch(e) {
                error = e;
                k();
            }
        },
    function(k){
        if(error == null) {
            try {
                that.executeSelectUnit(projection, dataset, setQuery2, env, function (result) {
                    set2 = result;
                    k();
                });
            } catch(e) {
                error = e;
                k();
            }
        } else {
            k();
        }
    })(function(){
        if(error != null) {
            callback(error);
        } else {
            var result = QueryPlan.unionBindings(set1, set2);
            that.runBinds(patterns.binds, result, dataset, env, function(err, bindings){
                if(err != null) {
                    throw(new BindExpressionError("Error processing bind expressions", patterns.binds, err));
                } else {
                    QueryFilters.checkFilters(patterns, bindings, false, dataset, env, that, callback);
                }
            });
        }
    });
};

QueryEngine.prototype.executeAndBGP = function(projection, dataset, pattern, env, callback) {
    var that = this;
    QueryPlan.executeAndBGPsDPSize(pattern.value, dataset, this, env, function(result){
        if(result!=null) {
            that.runBinds(pattern.binds, result, dataset, env, function(err, bindings){
                if(err != null) {
                    throw(new BindExpressionError("Error processing bind expressions", pattern.binds, err));
                } else {
                    QueryFilters.checkFilters(pattern, bindings, false, dataset, env, that, callback);
                }
            });
        } else {
            callback(null);
        }
    });
};

QueryEngine.prototype.executeLEFT_JOIN = function(projection, dataset, patterns, env, callback) {
    var setQuery1 = patterns.lvalue;
    var setQuery2 = patterns.rvalue;
    if(setQuery1.kind === "EMPTY_PATTERN") {
        // LEFT JOIN ( Z | X) => X
        this.executeSelectUnit(projection, dataset, setQuery2, env, callback);
    } else {
        var set1 = null;
        var set2 = null;
        var error = null;

        var that = this;
        var acum, duplicates;

        async.seq(
            function(k){
                try {
                    that.executeSelectUnit(projection, dataset, setQuery1, env, function (result) {
                        set1 = result;
                        k();
                    });
                } catch(e) {
                    error = e;
                    k();
                }
            },
            function(k){
                if(error != null) {
                    k();
                } else {
                    try {
                        that.executeSelectUnit(projection, dataset, setQuery2, env, function (result) {
                            set2 = result;
                            k();
                        });
                    } catch(e) {
                        error = e;
                        k();
                    }
                }
            })(
            function(){
                if(error != null) {
                    callback(error);
                } else {
                    var result = QueryPlan.leftOuterJoinBindings(set1, set2);
                    that.runBinds(patterns.binds, result, dataset, env, function(err, bindings){
                        if(err != null) {
                            throw(new BindExpressionError("Error processing bind expressions", patterns.binds, err));
                        } else {
                            QueryFilters.checkFilters(patterns, result, true, dataset, env, that, function(bindings){
                                if(set1.length>1 && set2.length>1) {
                                    var vars = [];
                                    var vars1 = {};
                                    for(var p in set1[0]) {
                                        vars1[p] = true;
                                    }
                                    for(p in set2[0]) {
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
                                            var idxColl = [];
                                            for(var p in bindings[i]["bindings"]) {
                                                if(bindings[i]["bindings"][p] != null) {
                                                    idx.push(p+bindings[i]["bindings"][p]);
                                                    idx.sort();
                                                    idxColl.push(idx.join(""));
                                                }
                                            }
                                            // reject duplicates -> (set union)
                                            if(duplicates[idx.join("")]==null) {
                                                for(j=0; j<idxColl.length; j++) {
                                                    //console.log(" - "+idxColl[j])
                                                    duplicates[idxColl[j]] = true;
                                                }
                                                ////duplicates[idx.join("")]= true
                                                acum.push(bindings[i]["bindings"]);
                                            }
                                        } else {
                                            acum.push(bindings[i]);
                                            var idx = [];
                                            var idxColl = [];
                                            for(var p in bindings[i]) {
                                                idx.push(p+bindings[i][p]);
                                                idx.sort();
                                                //console.log(idx.join("") + " -> ok");
                                                duplicates[idx.join("")] = true;
                                            }

                                        }
                                    }

                                    callback(acum);
                                } else {
                                    callback(bindings);
                                }
                            });
                        }
                    });
                }
            });
    }
};

QueryEngine.prototype.executeJOIN = function(projection, dataset, patterns, env, callback) {
    var setQuery1 = patterns.lvalue;
    var setQuery2 = patterns.rvalue;
    var set1 = null;
    var set2 = null;
    var error = null;

    var that = this;

    async.seq(
        function(k){
            try {
                that.executeSelectUnit(projection, dataset, setQuery1, env, function (result) {
                    set1 = result;
                    k();
                });
            } catch(e) {
                error = e;
                k();
            }
        },
        function(k){
            if(error != null) {
                k();
            } else {
                try {
                    that.executeSelectUnit(projection, dataset, setQuery2, env, function (result) {
                        set2 = result;
                        k();
                    });
                } catch(e) {
                    error = e;
                    k();
                }
            }
        })(
        function(){
            var result = null;
            if(error != null) {
                callback(error);
            } else if(set1.length ===0 || set2.length===0) {
                callback([]);
            } else {
                var commonVarsTmp = {};
                var commonVars = [];

                for(var p in set1[0])
                    commonVarsTmp[p] = false;
                for(var p  in set2[0]) {
                    if(commonVarsTmp[p] === false)
                        commonVars.push(p);
                }

                if(commonVars.length == 0) {
                    result = QueryPlan.joinBindings(set1,set2);
                } else if(that.abstractQueryTree.treeWithUnion(setQuery1) ||
                    that.abstractQueryTree.treeWithUnion(setQuery2)) {
                    result = QueryPlan.joinBindings(set1,set2);
                } else {
                    result = QueryPlan.joinBindings2(commonVars, set1, set2);
                }
                that.runBinds(patterns.binds, result, dataset, env, function(err, bindings){
                    if(err != null) {
                        throw(new BindExpressionError("Error processing bind expressions", patterns.binds, err));
                    } else {
                        QueryFilters.checkFilters(patterns, bindings, false, dataset, env, that, callback);
                    }
                });
            }
        });
};


QueryEngine.prototype.rangeQuery = function(quad, queryEnv, callback) {
    var that = this;
    that.normalizeQuad(quad, queryEnv, false, function(key){
        if(key != null) {
            that.backend.range(new QuadIndex.Pattern(key), function(quads) {
                if(quads == null || quads.length == 0) {
                    callback([]);
                } else {
                    callback(quads);
                }
            });
        } else {
            callback(null);
        }
    });
};

// Update queries

QueryEngine.prototype.executeUpdate = function(syntaxTree, callback) {
    var prologue = syntaxTree.prologue;
    var units = syntaxTree.units;
    var that = this;

    // environment for the operation -> base ns, declared ns, etc.
    var queryEnv = {blanks:{}, outCache:{}};
    this.registerNsInEnvironment(prologue, queryEnv);
    for(var i=0; i<units.length; i++) {

        var aqt = that.abstractQueryTree.parseExecutableUnit(units[i]);
        if(aqt.kind === 'insertdata') {
            var error = null;
            async.eachSeries(aqt.quads, function(quad, k){
                if(error === null) {
                    that._executeQuadInsert(quad, queryEnv, function(err) {
                        if(err != null)
                            error = err;
                        k();
                    });
                } else {
                    k();
                }
            }, function(){
                if(error === null)
                    callback(null, true);
                else
                    callback(error);
            });
        } else if(aqt.kind === 'deletedata') {
            var error = null;
            async.eachSeries(aqt.quads, function(quad, k){
                if(error === null) {
                    that._executeQuadDelete(quad, queryEnv, function(err) {
                        if(err != null)
                            error = err;
                        k();
                    });
                } else {
                    k();
                }
            }, function(){
                if(error === null)
                    callback(null, true);
                else
                    callback(error);
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
            this.rdfLoader.load(aqt.sourceGraph.value, graph, function(err, result){
                if(err) {
                    callback(new Error("error batch loading quads"));
                } else {
                    that.batchLoad(result,function(result){
                        if(result !== null) {
                            callback(null, result);
                        } else {
                            callback(new Error("Error batch loading quads"));
                        }
                    });
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

QueryEngine.prototype.batchLoad = function(quads, callback) {
    var counter = 0;
    var blanks = {};
    var that = this;

    if(this.eventsOnBatchLoad)
        this.callbacksBackend.startGraphModification();

    // subject
    var registerComponent = function(quad, component, newQuad, k) {
        var maybeBlankOid, oid, quad;

        if (quad[component]['uri'] || quad[component].token === 'uri') {
            var uriValue = (quad[component].uri || quad[component].value);
            that.lexicon.registerUri(uriValue, function(oid){
                var returnUriComponent = function(){
                    if (quad[component].uri != null) {
                        quad[component] = {'token': 'uri', 'value': quad[component].uri};
                        delete quad[component]['uri'];
                    }
                    newQuad[component] = oid;
                    k();
                };

                if(component === 'graph') {
                    that.lexicon.registerGraph(oid, uriValue, function(){
                        returnUriComponent();
                    });
                } else {
                    returnUriComponent();
                }
            });
        } else if (quad[component]['literal'] || quad[component].token === 'literal') {
            that.lexicon.registerLiteral(quad[component].literal || quad[component].value, function(oid){
                if (quad[component].literal != null) {
                    quad[component] = that.lexicon.parseLiteral(quad[component].literal);
                    delete quad[component]['literal'];
                }
                newQuad[component] = oid;
                k();
            });
        } else {
            maybeBlankOid = blanks[quad[component].blank || quad[component].value];
            if (maybeBlankOid == null) {
                that.lexicon.registerBlank(function(maybeBlankOid){
                    blanks[(quad[component].blank || quad[component].value)] = maybeBlankOid;

                    if (quad[component].token == null) {
                        quad[component].token = 'blank';
                        quad[component].value = quad[component].blank;
                        delete quad[component]['blank'];
                    }
                    newQuad[component] = maybeBlankOid;
                    k();
                });

            } else {
                if (quad[component].token == null) {
                    quad[component].token = 'blank';
                    quad[component].value = quad[component].blank;
                    delete quad[component]['blank'];
                }
                newQuad[component] = maybeBlankOid;
                k();
            }
        }

    };


    async.eachSeries(quads, function(quad,k){
        var newQuad = {};
        async.eachSeries(['subject','predicate','object','graph'], function(component,kk){
            registerComponent(quad, component, newQuad, kk)
        }, function(){
            var originalQuad = quad;
            quad = newQuad;
            var key = new QuadIndex.NodeKey(quad);

            that.backend.search(key, function(result){
                if(!result) {
                    that.backend.index(key, function(result){
                        if(result){
                            if(that.eventsOnBatchLoad)
                                that.callbacksBackend.nextGraphModification(Callbacks.added, [originalQuad,quad]);
                            counter = counter + 1;
                        }
                        k();
                    });
                } else {
                    k();
                }
            });

        });
    }, function(){
        if(that.lexicon.updateAfterWrite != null)
            that.lexicon.updateAfterWrite();

        var exitFn = function(){
            callback(counter);
        };

        if(that.eventsOnBatchLoad) {
            that.callbacksBackend.endGraphModification(exitFn());
        } else {
            exitFn();
        }
    });
};

// Low level operations for update queries

QueryEngine.prototype._executeModifyQuery = function(aqt, queryEnv, callback) {
    var that = this;
    var querySuccess = true;
    var error = new Error("Error executing modify query");
    var bindings = null;
    var components = ['subject', 'predicate', 'object', 'graph'];

    aqt.insert = aqt.insert == null ? [] : aqt.insert;
    aqt.delete = aqt.delete == null ? [] : aqt.delete;

    async.seq(
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

            that.executeSelect(aqt, queryEnv, defaultGraph, namedGraph, function(err, result) {
                if(err) {
                    error = err
                    querySuccess = false;
                    return k();
                } else {
                    that.denormalizeBindingsList(result, queryEnv, function(result){
                        if(result!=null) {
                            bindings = result;
                        } else {
                            error = new Error("Error denormalizing bindings list");
                            querySuccess = false;
                        }
                        k();
                    });
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

                        quads.push(quad);
                    }
                }

                async.eachSeries(quads, function(quad,kk) {
                    that._executeQuadDelete(quad, queryEnv, function(){
                        kk();
                    });
                },function(){ k(); });
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

                        quads.push(quad);
                    }
                }

                async.eachSeries(quads, function(quad,kk) {
                    that._executeQuadInsert(quad, queryEnv, function(){
                        kk();
                    });
                },function(){ k(); });
            } else {
                k();
            }
        }
    )(function(){
        if(querySuccess)
            callback(null);
        else
            callback(error);
    });
};

QueryEngine.prototype._executeQuadInsert = function(quad, queryEnv, callback) {
    var that = this;
    var normalized;
    var error = false;
    var errorMessage = null;
    async.seq(
        function(k){
            that.normalizeQuad(quad, queryEnv, true, function(result){
                if(result != null){
                    normalized = result;
                } else {
                    error = true;
                    errorMessage = "Error normalizing quad.";
                }
                k();
            });
        },
        function(k){
            if(error === false) {
                var key = new QuadIndex.NodeKey(normalized);
                that.backend.search(key, function(found){
                    if(found === true){
                        k();
                    } else {
                        that.backend.index(key, function(){
                            that.callbacksBackend.nextGraphModification(Callbacks.added, [quad, normalized]);
                            k();
                        });
                    }
                });
            } else {
                k();
            }
        })(
        function(){
            if(error) {
                callback(new Error(errorMessage));
            } else {
                callback(null, true);
            }
        });
};

QueryEngine.prototype._executeQuadDelete = function(quad, queryEnv, callback) {
    var that = this;
    var normalized;
    var error = false;
    var errorMessage, key;
    async.seq(
        function(k){
            that.normalizeQuad(quad, queryEnv, true, function(result){
                if(result != null){
                    normalized = result;
                } else {
                    error = true;
                    errorMessage = "Error normalizing quad.";
                }
                k();
            });
        },
        function(k){
            if(error === false) {
                key = new QuadIndex.NodeKey(normalized);
                that.backend.delete(key, function(){
                        k();
                });
            } else {
                k();
            }
        },
        function(k){
            if(error === false) {
                that.lexicon.unregister(quad, key, function(){
                    that.callbacksBackend.nextGraphModification(Callbacks['deleted'], [quad, normalized]);
                    k();
                });
            } else {
                k();
            }
        })(
        function(){
            if(error) {
                callback(new Error(errorMessage));
            } else {
                callback(null, true);
            }
        });
};

QueryEngine.prototype._executeClearGraph = function(destinyGraph, queryEnv, callback) {
    var that = this;
    if(destinyGraph === 'default') {
        this.execute("DELETE { ?s ?p ?o } WHERE { ?s ?p ?o }", callback);
    } else if(destinyGraph === 'named') {
        that.lexicon.registeredGraphs(true, function(graphs){
            if(graphs!=null) {
                var foundErrorDeleting = false;
                async.eachSeries(graphs, function(graph,k){
                    if(!foundErrorDeleting) {
                        that.execute("DELETE { GRAPH <"+graph+"> { ?s ?p ?o } } WHERE { GRAPH <"+graph+"> { ?s ?p ?o } }", function(err, results){
                            if(!err) {
                                that.lexicon.resolveUri(graph, function(oid){
                                    if(oid != -1) {
                                        that.lexicon.knownGraphs.delete(oid, function(){
                                            k();
                                        });
                                    } else {
                                        foundErrorDeleting = "Cannot find graph "+graph+" to clear it";
                                        k();
                                    }
                                });
                            } else {
                                foundErrorDeleting = err;
                                k();
                            }
                        });
                    } else {
                        k();
                    }
                }, function(){
                    callback(!foundErrorDeleting);
                });
            } else {
                callback(false, "Error deleting named graphs");
            }
        });
    } else if(destinyGraph === 'all') {
        var that = this;
        this.execute("CLEAR DEFAULT", function(err, result) {
            if(!err) {
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
                this.callbacksBackend.ongoingModification = true;
                this.execute("DELETE { GRAPH <"+graphUri+"> { ?s ?p ?o } } WHERE { GRAPH <"+graphUri+"> { ?s ?p ?o } }", function(res){
                    that.callbacksBackend.ongoingModification = false;
                    callback(res);
                });
            } else {
                callback(false, "wrong graph URI");
            }
        } else {
            callback(false, "wrong graph URI");
        }
    }
};

QueryEngine.prototype.checkGroupSemantics = function(groupVars, projectionVars) {
    if(groupVars === 'singleGroup') {
        return true;
    }

    var projection = {};

    for(var i=0; i<groupVars.length; i++) {
        var groupVar = groupVars[i];
        if(groupVar.token === 'var') {
            projection[groupVar.value] = true;
        } else if(groupVar.token === 'aliased_expression') {
            projection[groupVar.alias.value] = true;
        }
    }

    for(i=0; i<projectionVars.length; i++) {
        var projectionVar = projectionVars[i];
        if(projectionVar.kind === 'var') {
            if(projection[projectionVar.value.value] == null) {
                return false;
            }
        } else if(projectionVar.kind === 'aliased' &&
            projectionVar.expression &&
            projectionVar.expression.primaryexpression === 'var') {
            if(projection[projectionVar.expression.value.value] == null) {
                return false;
            }
        }
    }

    return true;
};

QueryEngine.prototype.runBinds = function(binds, bindings, dataset, env, callback) {
    var that = this;
    var originalBindings = bindings;
    if(binds != null && binds.length > 0) {
        that.copyDenormalizedBindings(bindings, env.outCache, function(denormBindings){
            for(var i=0; i<bindings.length; i++) {
                for(var j=0; j<binds.length; j++) {
                    var bind = binds[j];
                    var thisDenormBindings = denormBindings[i];
                    var ebv = QueryFilters.runFilter(bind.expression, thisDenormBindings, that, dataset, env);
                    if(QueryFilters.isEbvError(ebv)) {
                        callback(ebv);
                    } else {
                        // we set the value for the new binding
                        originalBindings[i][bind.as.value] = ebv;
                    }
                }
            }
            callback(null, bindings);
        });
    } else {
        callback(null, bindings);
    }
};

QueryEngine.prototype.computeCosts = function (quads, env, callback) {
    for (var i = 0; i < quads.length; i++) {
        quads[i]['_cost'] = this.quadCost(quads[i], env);
    }

    callback(quads);
};

QueryEngine.prototype.quadCost = function(quad, env) {
    return 1;
};

QueryEngine.prototype.registerDefaultNamespace = function(ns, prefix) {
    this.defaultPrefixes[ns] = prefix;
};


module.exports = {
    QueryEngine: QueryEngine
};
