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
                result.push(bindings);
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


QueryEngine.QueryEngine.prototype.applySingleOrderBy = function(orderFilters, modifiedBindings, outEnv) {
    var acum = [];
    for(var i=0; i<orderFilters.length; i++) {
        var orderFilter = orderFilters[i];
        var results = QueryFilters.collect(orderFilter.expression, [modifiedBindings], outEnv, this);
        acum.push(results[0].value);
    }
    return {binding:modifiedBindings, value:acum};
};

QueryEngine.QueryEngine.prototype.applyOrderBy = function(order, modifiedBindings, outEnv) {
    var that = this;
    var acum = [];
    if(order != null && order.length > 0) {
        for(var i=0; i<modifiedBindings.length; i++) {
            var bindings = modifiedBindings[i];
            var results = that.applySingleOrderBy(order, bindings, outEnv);
            acum.push(results);
        }

        acum.sort(function(a,b){
            return that.compareFilteredBindings(a, b, order, outEnv);
        });

        var toReturn = [];
        for(var i=0; i<acum.length; i++) {
            toReturn.push(acum[i].binding);
        }

        return toReturn;
    } else {
        return modifiedBindings;
    }
};

QueryEngine.QueryEngine.prototype.compareFilteredBindings = function(a, b, order, env) {
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

QueryEngine.QueryEngine.prototype.removeDefaultGraphBindings = function(bindingsList, dataset) {
    var onlyDefaultDatasets = [];
    var namedDatasetsMap = {};
    for(var i=0; i<dataset.named.length; i++) {
        namedDatasetsMap[dataset.named[i].oid] = true;
    }
    for(i=0; i<dataset.default.length; i++) {
        if(namedDatasetsMap[dataset.default[i].oid] == null) {
            onlyDefaultDatasets.push(dataset.default[i].oid);
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


QueryEngine.QueryEngine.prototype.aggregateBindings = function(projection, bindingsGroup, env) {
    var denormBindings = this.copyDenormalizedBindings(bindingsGroup, env.outCache);
    var aggregatedBindings = {};
    for(var i=0; i<projection.length; i++) {
        var aggregatedValue = QueryFilters.runAggregator(projection[i], denormBindings, this, env);
        if(projection[i].alias) {
            aggregatedBindings[projection[i].alias.value] = aggregatedValue; 
        } else {
            aggregatedBindings[projection[i].value.value] = aggregatedValue; 
        }
    }
    return(aggregatedBindings);
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

QueryEngine.QueryEngine.prototype.resolveNsInEnvironment = function(prefix, env) {
    var namespaces = env.namespaces;
    return namespaces[prefix];
};


QueryEngine.QueryEngine.prototype.normalizeTerm = function(term, env, shouldIndex) {
    if(term.token === 'uri') {
        var uri = Utils.lexicalFormBaseUri(term, env);
        if(uri == null) {
            return(null);
        } else {
            if(shouldIndex) {
                return(this.lexicon.registerUri(uri));
            } else {
                return(this.lexicon.resolveUri(uri));
            }
        }

    } else if(term.token === 'literal') {
        var lexicalFormLiteral = Utils.lexicalFormLiteral(term, env);
        if(shouldIndex) {
           var oid = this.lexicon.registerLiteral(lexicalFormLiteral);
            return(oid);
        } else {
            var oid = this.lexicon.resolveLiteral(lexicalFormLiteral);
            return(oid);
        }
    } else if(term.token === 'blank') {
        var label = term.label;
        var oid = env.blanks[label];
        if( oid != null) {
            return(oid);
        } else {
            if(shouldIndex) {
                var oid = this.lexicon.registerBlank(label);
                env.blanks[label] = oid;
                return(oid);
            } else {
                var oid = this.lexicon.resolveBlank(label);
                env.blanks[label] = oid;
                return(oid);
            }
        }
    } else if(term.token === 'var') {
        return(term.value);
    } else {
          return(null);
    }
};

QueryEngine.QueryEngine.prototype.normalizeDatasets = function(datasets, outerEnv, callback) {
    var that = this;
    for(var i=0; i<datasets.length; i++) {
        var dataset = datasets[i];
        if(dataset.value === that.lexicon.defaultGraphUri) {
            dataset.oid = that.lexicon.defaultGraphOid;
        } else {
            var oid = that.normalizeTerm(dataset, outerEnv, false);      
            if(result != null) {
                dataset.oid = oid;
            } else {
                return(null);
            }
        }  
    }

    return true
};

QueryEngine.QueryEngine.prototype.normalizeQuad = function(quad, queryEnv, shouldIndex) {
    var subject    = null;
    var predicate  = null;
    var object     = null;
    var graph      = null;
    var oid;

    if(quad.graph == null) {
        graph = 0; // default graph
    } else {
        oid = this.normalizeTerm(quad.graph, queryEnv, shouldIndex)
        if(oid!=null) {
            graph = oid;
            if(shouldIndex === true && quad.graph.token!='var')
                this.lexicon.registerGraph(oid);
        } else {
            return null;
        }
    }

    oid = this.normalizeTerm(quad.subject, queryEnv, shouldIndex);
    if(oid!=null) {
        subject = oid;
    } else {
        return null
    }

    oid = this.normalizeTerm(quad.predicate, queryEnv, shouldIndex);
    if(oid!=null) {
        predicate = oid;
    } else {
        return null
    }

    oid = this.normalizeTerm(quad.object, queryEnv, shouldIndex);
    if(oid!=null) {
        object = oid;
    } else {
        return null
    }

    return({subject:subject, 
            predicate:predicate, 
            object:object, 
            graph:graph});
};

QueryEngine.QueryEngine.prototype.denormalizeBindingsList = function(bindingsList, envOut) {
    var results = [];

    for(var i=0; i<bindingsList.length; i++) {
        result = this.denormalizeBindings(bindingsList[i], envOut)
        results.push(result);
    }
    return(results);
};

/**
 * Receives a bindings map (var -> oid) and an out cache (oid -> value)
 * returns a bindings map (var -> value) storing in cache all the missing values for oids
 *
 * This is required just to save lookups when final results are generated.
 */
QueryEngine.QueryEngine.prototype.copyDenormalizedBindings = function(bindingsList, out, callback) {
    var denormList = [];
    for(var i=0; i<bindingsList.length; i++) {
        var denorm = {};
        var bindings = bindingsList[i];
        var variables = Utils.keys(bindings);
        for(var j=0; j<variables.length; j++) {
            var oid = bindings[variables[j]];
            if(oid == null) {
                // this can be null, e.g. union different variables (check SPARQL recommendation examples UNION)
                denorm[variables[j]] = null;
            } else if(typeof(oid) === 'object') {
                // the binding is already denormalized, this can happen for example because the value of the
                // binding is the result of the aggregation of other bindings in a GROUP clause
                denorm[variables[j]] = oid;
            } else {
                var inOut = out[oid];
                if(inOut!= null) {
                    denorm[variables[j]] = inOut;
                } else {                    
                    var val = this.lexicon.retrieve(oid);
                    out[oid] = val;
                    denorm[variables[j]] = val;
                }
            }
        }
        denormList.push(denorm);
    }
    return denormList;
};

QueryEngine.QueryEngine.prototype.denormalizeBindings = function(bindings, envOut, callback) {
    var variables = Utils.keys(bindings);

    for(var i=0; i<variables.length; i++) {
        var oid = bindings[variables[i]];
        if(oid == null) {
            // this can be null, e.g. union different variables (check SPARQL recommendation examples UNION)
            bindings[variables[i]] = null;
        } else {
            if(envOut[oid] != null) {
                bindings[variables[i]] = envOut[oid];
            } else {
                var val = this.lexicon.retrieve(oid)
                bindings[variables[i]] = val;
            }
        }
    }
    return bindings;
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
    if(aqt.kind === 'select') {
      this.executeSelect(aqt, queryEnv, defaultDataset, namedDataset, function(success, result){
          if(success) {
              if(typeof(result) === 'object' && result.denorm === true) {
                  callback(true, result['bindings']);
              } else {
                  var result = that.denormalizeBindingsList(result, queryEnv.outCache);
                  if(result != null) {                        
                      callback(true, result);
                  } else {
                      callback(false, result);
                  }
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
        that = this;
        this.executeSelect(aqt, queryEnv, defaultDataset, namedDataset, function(success, result){
            if(success) {
                if(success) {              
                    var result = that.denormalizeBindingsList(result, queryEnv.outCache);
                    if(result != null) { 
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
                                for(var p=0; p<components.length; p++) {
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

        if (that.normalizeDatasets(dataset.default.concat(dataset.named), env) != null) {
            var result = that.executeSelectUnit(projection, dataset, unit.pattern, env);
            if(result != null) {
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
                    if(that.checkGroupSemantics(unit.group,projection)) {
                        var groupedBindings = that.groupSolution(result, unit.group, env);
                             
                        var aggregatedBindings = [];
                        var foundError = false;
                            
                        for(var i=0; i<groupedBindings.length; i++) {
                            var resultingBindings = that.aggregateBindings(projection, groupedBindings[i], env)
                            aggregatedBindings.push(resultingBindings);
                        }
                        callback(true, {'bindings': aggregatedBindings, 'denorm':true});
                    } else {
                        callback(false, "Incompatible Group and Projection variables");
                    }
                } else {
                    var orderedBindings = that.applyOrderBy(order, result, env)
                    var projectedBindings = that.projectBindings(projection, orderedBindings);
                    modifiedBindings = that.applyModifier(modifier, projectedBindings);
                    var limitedBindings  = that.applyLimitOffset(offset, limit, modifiedBindings);
                    filteredBindings = that.removeDefaultGraphBindings(limitedBindings, dataset);
                    
                    callback(true, filteredBindings);
                }
                
            } else { // fail selectUnit
                console.log("ERROR selectUnit");
                callback(false, result);
            }
        } else { // fail  normalizaing datasets
            console.log("ERROR normalizing");
            callback(false,results);
        }
    } else {
        callback(false,"Cannot execute " + unit.kind + " query as a select query");
    }
};


QueryEngine.QueryEngine.prototype.groupSolution = function(bindings, group, queryEnv){
    var order = [];
    var filteredBindings = [];
    var initialized = false;
    var that = this;
    if(group === 'singleGroup') {
        return [bindings];
    } else {
        for(var i=0; i<bindings.length; i++) {
            var outFloop = arguments.callee;
            var currentBindings = bindings[i];
            var mustAddBindings = true;

            /**
             * In this loop, we iterate through all the group clauses and tranform the current bindings
             * according to the group by clauses.
             * If it is the first iteration we also save in a different array the order for the 
             * grouped variables that will be used later to build the final groups
             */
            for(var j=0; j<group.length; j++) {
                var floop = arguments.callee;
                var currentOrderClause = group[j];
                var orderVariable = null;

                if(currentOrderClause.token === 'var') {
                    orderVariable = currentOrderClause.value;

                    if(initialized == false) {
                        order.push(orderVariable);
                    }

                } else if(currentOrderClause.token === 'aliased_expression') {
                    orderVariable = currentOrderClause.alias.value;
                    if(initialized == false) {
                        order.push(orderVariable);
                    }

                    if(currentOrderClause.expression.primaryexpression === 'var') {
                        currentBindings[currentOrderClause.alias.value] = currentBindings[currentOrderClause.expression.value.value];
                    } else {
                        var denormBindings = this.copyDenormalizedBindings([currentBindings], queryEnv.outCache);
                        var filterResultEbv = QueryFilters.runFilter(currentOrderClause.expression, denormBindings[0], that, queryEnv);
                        if(!QueryFilters.isEbvError(filterResultEbv)) {
                            if(filterResultEbv.value != null) {
                                filterResultEbv.value = ""+filterResultEbv.value;
                            }
                            currentBindings[currentOrderClause.alias.value]= filterResultEbv;
                        } else {
                            mustAddBindings = false;
                        }
                    }
                } else {
                    // In this case, we create an additional variable in the binding to hold the group variable value
                    var denormBindings = that.copyDenormalizedBindings([currentBindings], queryEnv.outCache);
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
                         
                }
                
            }
            if(initialized == false) {
                initialized = true;
            } 
            if(mustAddBindings === true) {
                filteredBindings.push(currentBindings);
            }
        }
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

        return groups;
    };
};


/**
 * Here, all the constructions of the SPARQL algebra are handled
 */
QueryEngine.QueryEngine.prototype.executeSelectUnit = function(projection, dataset, pattern, env) {
    if(pattern.kind === "BGP") {
        return this.executeAndBGP(projection, dataset, pattern, env);
    } else if(pattern.kind === "UNION") {
        return this.executeUNION(projection, dataset, pattern.value, env);            
    } else if(pattern.kind === "JOIN") {
        return this.executeJOIN(projection, dataset, pattern, env);            
    } else if(pattern.kind === "LEFT_JOIN") {
        return this.executeLEFT_JOIN(projection, dataset, pattern, env);            
    } else if(pattern.kind === "FILTER") {
        // Some components may have the filter inside the unit
        var results = this.executeSelectUnit(projection, dataset, pattern.value, env);
        if(results != null) {
            results = QueryFilters.checkFilters(pattern, results, false, env, this);
            return results;
        } else {
            return [];
        }
    } else if(pattern.kind === "EMPTY_PATTERN") {
        // as an example of this case  check DAWG test case: algebra/filter-nested-2
        return [];
    } else {
        console.log("Cannot execute query pattern " + pattern.kind + ". Not implemented yet.");
        return null;
    }
};

QueryEngine.QueryEngine.prototype.executeUNION = function(projection, dataset, patterns, env) {
    var setQuery1 = patterns[0];
    var setQuery2 = patterns[1];
    var set1 = null;
    var set2 = null;

    if(patterns.length != 2) {
        throw("SPARQL algebra UNION with more than two components");
    }

    var that = this;
    var sets = [];

    set1 = that.executeSelectUnit(projection, dataset, setQuery1, env);
    if(set1==null) {
        return null;
    }
    set2 = that.executeSelectUnit(projection, dataset, setQuery2, env);
    if(set2==null) {
        return null;
    }

    var result = QueryPlan.unionBindings(set1, set2);
    result = QueryFilters.checkFilters(patterns, result, false, env, that);
    return result;
};

QueryEngine.QueryEngine.prototype.executeAndBGP = function(projection, dataset, patterns, env) {
    var that = this;
    var result = QueryPlan.executeAndBGPs(patterns.value, dataset, this, env);
    if(result!=null) {
        return QueryFilters.checkFilters(patterns, result, false, env, that);
    } else {
        return null;
    }
};

QueryEngine.QueryEngine.prototype.executeLEFT_JOIN = function(projection, dataset, patterns, env) {
    var setQuery1 = patterns.lvalue;
    var setQuery2 = patterns.rvalue;

    var set1 = null;
    var set2 = null;

    var that = this;
    var sets = [];

    set1 = that.executeSelectUnit(projection, dataset, setQuery1, env);
    if(set1==null) {
        return null;
    }
     
    set2 = that.executeSelectUnit(projection, dataset, setQuery2, env);
    if(set2==null) {
        return null;
    }

    
    var result = QueryPlan.leftOuterJoinBindings(set1, set2);
    //console.log("SETS:")
    //console.log(set1)
    //console.log(set2)
    //console.log("---")
    //console.log(result);

    var bindings = QueryFilters.checkFilters(patterns, result, true, env, that);
    //console.log("---")
    //console.log(bindings)
    //console.log("\r\n")
    
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
            
        return acum;
    } else {
        return bindings;
    }
};

QueryEngine.QueryEngine.prototype.executeJOIN = function(projection, dataset, patterns, env) {
    var setQuery1 = patterns.lvalue;
    var setQuery2 = patterns.rvalue;
    var set1 = null;
    var set2 = null;

    var that = this;
    var sets = [];


    set1 = that.executeSelectUnit(projection, dataset, setQuery1, env);
    if(set1 == null) {
        return null;
    }

    set2 = that.executeSelectUnit(projection, dataset, setQuery2, env);
    if(set2 == null) {
        return null;
    }

    var result = QueryPlan.joinBindings(set1, set2);

    result = QueryFilters.checkFilters(patterns, result, false, env, that);
    return result;
};


QueryEngine.QueryEngine.prototype.rangeQuery = function(quad, queryEnv) {
    var that = this;
    //console.log("BEFORE:");
    //console.log("QUAD:");
    //console.log(quad);
    var key = that.normalizeQuad(quad, queryEnv, false)
    if(key != null) {
        //console.log("RANGE QUERY:")
        //console.log(success);
        //console.log(key);
        //console.log(new QuadIndexCommon.Pattern(key));
        //console.log(key);
        var quads = that.backend.range(new QuadIndexCommon.Pattern(key));
        //console.log("retrieved");
        //console.log(quads)
        if(quads == null || quads.length == 0) {
            return [];
        } else {
            return quads;
        }
    } else {
        console.log("ERROR normalizing quad");
        return null;
    }
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
            for(var j=0; j<aqt.quads.length; j++) {
                var quad = aqt.quads[j];
                var result = that._executeQuadInsert(quad, queryEnv);
                if(result !== true) {
                    return callback(false, error);
                }
            }
            callback(true);
        } else if(aqt.kind === 'deletedata') {
            for(var j=0; j<aqt.quads.length; j++) {
                var quad = aqt.quads[j];
                this._executeQuadDelete(quad, queryEnv);
            }
            callback(true);
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
                    var result = that.batchLoad(result);
                    callback(result!=null, result||"error batch loading quads");
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
    var subject    = null;
    var predicate  = null;
    var object     = null;
    var graph      = null;
    var oldLimit = Utils.stackCounterLimit;
    var counter = 0;
    var success = true;

    for(var i=0; i<quads.length; i++) {

        var quad = quads[i];

            // subject
            if(quad.subject['uri'] || quad.subject.token === 'uri') {
                var oid = this.lexicon.registerUri(quad.subject.uri || quad.subject.value);
                subject = oid;
            } else if(quad.subject['literal'] || quad.subject.token === 'literal') {
                var oid = this.lexicon.registerLiteral(quad.subject.literal || quad.subject.value);
                subject = oid;                    
            } else {
                var oid = this.lexicon.registerBlank(quad.subject.blank || quad.subject.value)
                subject = oid;
            }

            // predicate
            if(quad.predicate['uri'] || quad.predicate.token === 'uri') {
                var oid = this.lexicon.registerUri(quad.predicate.uri || quad.predicate.value);
                predicate = oid;
            } else if(quad.predicate['literal'] || quad.predicate.token === 'literal') {
                var oid = this.lexicon.registerLiteral(quad.predicate.literal || quad.predicate.value);
                predicate = oid;                    
            } else {
                var oid = this.lexicon.registerBlank(quad.predicate.blank || quad.predicate.value)
                predicate = oid;
            }

            // object
            if(quad.object['uri'] || quad.object.token === 'uri') {
                var oid = this.lexicon.registerUri(quad.object.uri || quad.object.value);
                object = oid;
            } else if(quad.object['literal'] || quad.object.token === 'literal') {
                var oid = this.lexicon.registerLiteral(quad.object.literal || quad.object.value);
                object = oid;                    
            } else {
                var oid = this.lexicon.registerBlank(quad.object.blank || quad.object.value)
                object = oid;
            }

            // graph
            if(quad.graph['uri'] || quad.graph.token === 'uri') {
                var oid = this.lexicon.registerUri(quad.graph.uri || quad.graph.value);
                this.lexicon.registerGraph(oid);
                graph = oid;

            } else if(quad.graph['literal'] || quad.graph.token === 'literal') {
                var oid = this.lexicon.registerLiteral(quad.graph.literal || quad.graph.value);
                graph = oid;                    
            } else {
                var oid = this.lexicon.registerBlank(quad.graph.blank || quad.graph.value)
                graph = oid;
            }


            var quad = {subject: subject, predicate:predicate, object:object, graph: graph};
            var key = new QuadIndexCommon.NodeKey(quad);
              
            var result = this.backend.index(key)
            if(result == true){
                counter = counter + 1;
            } else {
                success = false;
                break;
            }

    }

    if(success) {
        if(callback)
            callback(true, counter);
        return counter;
    } else {
        if(callback)
            callback(false, null);

        return null;
    }
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
                    var result = that.denormalizeBindingsList(result, queryEnv.outCache);
                    if(result!=null) {
                        bindings = result;
                    } else {
                        querySuccess = false;
                    }
                    return k();
                } else {
                    querySuccess = false;
                    return k();
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

                var quad;
                for(var j=0; j<quads.length; j++) {
                    quad = quads[j];
                    that._executeQuadDelete(quad, queryEnv);
                }
                k();
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

                for(var i=0; i<quads.length; i++) {
                    var quad = quads[i];
                    that._executeQuadInsert(quad, queryEnv);
                }

                k();
            } else {
                k();
            }
        }
    )(function(){
        callback(querySuccess);
    });
};

QueryEngine.QueryEngine.prototype._executeQuadInsert = function(quad, queryEnv) {
    var that = this;
    var normalized = this.normalizeQuad(quad, queryEnv, true);
    if(normalized != null) {
        var key = new QuadIndexCommon.NodeKey(normalized);
        var result = that.backend.search(key);
        if(result){
            return(result);
        } else {
            var result = that.backend.index(key);
            if(result == true){
                that.callbacksBackend.nextGraphModification(Callbacks.added, [quad, normalized]);
                return true;
            } else {
                console.log("ERROR inserting quad");
                return false;
            }
        }
    } else {
        console.log("ERROR normalizing quad");
        return false;
    }
};

QueryEngine.QueryEngine.prototype._executeQuadDelete = function(quad, queryEnv) {
    var that = this;
    var normalized = this.normalizeQuad(quad, queryEnv, false);
    if(normalized != null) {
        var key = new QuadIndexCommon.NodeKey(normalized);
        that.backend.delete(key);
        var result = that.lexicon.unregister(quad, key);
        if(result == true){
            that.callbacksBackend.nextGraphModification(Callbacks['deleted'], [quad, normalized]);
            return true;
        } else {
            console.log("ERROR unregistering quad");
            return false;
        }
    } else {
        console.log("ERROR normalizing quad");
        return false;
    }
};

QueryEngine.QueryEngine.prototype._executeClearGraph = function(destinyGraph, queryEnv, callback) {
    if(destinyGraph === 'default') {
        this.execute("DELETE { ?s ?p ?o } WHERE { ?s ?p ?o }", callback);
    } else if(destinyGraph === 'named') {
        var that = this;
        var graphs = this.lexicon.registeredGraphs(true);
        if(graphs!=null) {
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

QueryEngine.QueryEngine.prototype.checkGroupSemantics = function(groupVars, projectionVars) {
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
