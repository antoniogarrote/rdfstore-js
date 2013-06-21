// exports
exports.MongodbQueryEngine = {};
var MongodbQueryEngine = exports.MongodbQueryEngine;

//imports
var AbstractQueryTree = require("./../../js-sparql-parser/src/abstract_query_tree").AbstractQueryTree;
var Utils = require("./../../js-trees/src/utils").Utils;
var QueryPlanAsync = require("./query_plan_async").QueryPlanAsync;
var QueryFilters = require("./query_filters").QueryFilters;
var RDFJSInterface = require("./rdf_js_interface").RDFJSInterface;
var RDFLoader = require("../../js-communication/src/rdf_loader").RDFLoader;
var Callbacks = require("./callbacks.js").Callbacks;
var mongodb = require('mongodb');

MongodbQueryEngine.mongodb = true;

MongodbQueryEngine.MongodbQueryEngine = function(params) {
    params = params || {};
    var server = params['mongoDomain'] || '127.0.0.1';
    var port = params['mongoPort'] || 27017;
    var mongoOptions = params['mongoOptions'] || {};
    var mongoDBName = params['name'] || 'rdfstore_js';

    this.lexicon = this;
    this.backend = this;

    if(server.indexOf("@") != -1)  {
	this.auth = server.split("@")[0];
	this.auth = this.auth.split(":");
	server = server.split("@")[1];
    }

    this.customFns = params.customFns || {};
    this.client = new mongodb.Db(mongoDBName, new mongodb.Server(server,port,mongoOptions));
    this.defaultGraphOid = "u:https://github.com/antoniogarrote/rdfstore-js#default_graph";
    this.defaultGraphUri = "https://github.com/antoniogarrote/rdfstore-js#default_graph";
    this.defaultGraphUriTerm = {"token": "uri", "prefix": null, "suffix": null, "value": this.defaultGraphUri, "oid": this.defaultGraphOid};

    this.configuration = null;

    // batch loads should generate events?
    this.eventsOnBatchLoad = (params.eventsOnBatchLoad || false);
    // list of namespaces that will be automatically added to every query
    this.defaultPrefixes = {};
    this.abstractQueryTree = new AbstractQueryTree.AbstractQueryTree();
    this.rdfLoader = new RDFLoader.RDFLoader(params['communication']);
    this.callbacksBackend = new Callbacks.CallbacksBackend(this);
};

MongodbQueryEngine.MongodbQueryEngine.prototype.close = function(cb) {
    var that = this;
    this.client.close(function(){
	that.client = null;
	cb();
    });
};

MongodbQueryEngine.MongodbQueryEngine.prototype.setCustomFunctions = function(customFns) {
    this.customFns = customFns;
};

// Utils
MongodbQueryEngine.MongodbQueryEngine.prototype.collection = function(collection, f) {
    var that = this;
    var _collection = function(err) {
	if(err)
	    f(true, "MongoDB connection error");
	else
            that.client.collection(collection, f);
    };
    if(this.client.state === 'notConnected' || this.client.state === 'disconnected') {
        this.client.open(function(err, p_client) {
	    if(err) {
		_collection(err);
	    } else {
		if(that.auth!=null) {
		    that.client.authenticate(that.auth[0],that.auth[1], function(err,res){
			_collection(err);		
		    });
		} else {
		    _collection(false);
		}
	    }
        });
    } else {
        _collection(false);
    }

};

MongodbQueryEngine.MongodbQueryEngine.prototype.clean = function(callback) {
    var that = this;
    this.collection('quads', function(err, coll) {
        coll.drop(function(){
            that.collection('store_configuration', function(err, coll) {
                coll.drop(function(){
                    that.readConfiguration(function(){
                        callback();
                    });
                });
            });
        });
    });
};

MongodbQueryEngine.MongodbQueryEngine.prototype.registerNsInEnvironment = function(prologue, env) {
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
    if(prologue != null && prologue.base && typeof(prologue.base) === 'object') {
        env.base = prologue.base.value;
    } else {
        env.base = null;
    }
};

MongodbQueryEngine.MongodbQueryEngine.prototype.applyModifier = function(modifier, projectedBindings) {
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

MongodbQueryEngine.MongodbQueryEngine.prototype.applyLimitOffset = function(offset, limit, bindings) {
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


MongodbQueryEngine.MongodbQueryEngine.prototype.applySingleOrderBy = function(orderFilters, modifiedBindings, dataset, outEnv) {
    var acum = [];
    for(var i=0; i<orderFilters.length; i++) {
        var orderFilter = orderFilters[i];
        var results = QueryFilters.collect(orderFilter.expression, [modifiedBindings], dataset, outEnv, this);
        acum.push(results[0].value);
    }
    return {binding:modifiedBindings, value:acum};
};

MongodbQueryEngine.MongodbQueryEngine.prototype.applyOrderBy = function(order, modifiedBindings, dataset, outEnv) {
    var that = this;
    var acum = [];
    if(order != null && order.length > 0) {
        for(var i=0; i<modifiedBindings.length; i++) {
            var bindings = modifiedBindings[i];
            var results = that.applySingleOrderBy(order, bindings, dataset, outEnv);
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

MongodbQueryEngine.MongodbQueryEngine.prototype.compareFilteredBindings = function(a, b, order, env) {
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

MongodbQueryEngine.MongodbQueryEngine.prototype.removeDefaultGraphBindings = function(bindingsList, dataset) {
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


MongodbQueryEngine.MongodbQueryEngine.prototype.aggregateBindings = function(projection, bindingsGroup, dataset, env) {
    var denormBindings = this.copyDenormalizedBindings(bindingsGroup, env.outCache);
    var aggregatedBindings = {};
    for(var i=0; i<projection.length; i++) {
        var aggregatedValue = QueryFilters.runAggregator(projection[i], denormBindings, this, dataset, env);
        if(projection[i].alias) {
            aggregatedBindings[projection[i].alias.value] = aggregatedValue; 
        } else {
            aggregatedBindings[projection[i].value.value] = aggregatedValue; 
        }
    }
    return(aggregatedBindings);
};


MongodbQueryEngine.MongodbQueryEngine.prototype.projectBindings = function(projection, results, dataset) {
    if(projection[0].kind === '*'){
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

MongodbQueryEngine.MongodbQueryEngine.prototype.resolveNsInEnvironment = function(prefix, env) {
    var namespaces = env.namespaces;
    return namespaces[prefix];
};


MongodbQueryEngine.MongodbQueryEngine.prototype.registerUri = function(uri) {
    return "u:"+uri;
};

MongodbQueryEngine.MongodbQueryEngine.prototype.registerLiteral = function(literal) {
    return "l:"+literal;
};

MongodbQueryEngine.MongodbQueryEngine.prototype.normalizeTerm = function(term, env, shouldIndex) {
    if(term.token === 'uri') {
        var uri = Utils.lexicalFormBaseUri(term, env);
        if(uri == null) {
            return(null);
        } else {
            if(shouldIndex) {
                //return(this.lexicon.registerUri(uri));
                return("u:"+uri);
            } else {
                //return(this.lexicon.resolveUri(uri));
                return("u:"+uri);
            }
        }

    } else if(term.token === 'literal') {
        var lexicalFormLiteral = Utils.lexicalFormLiteral(term, env);
        if(shouldIndex) {
            //var oid = this.lexicon.registerLiteral(lexicalFormLiteral);
            var oid = "l:"+lexicalFormLiteral;
            return(oid);
        } else {
            //var oid = this.lexicon.resolveLiteral(lexicalFormLiteral);
            var oid = "l:"+lexicalFormLiteral;
            return(oid);
        }
    } else if(term.token === 'blank') {
        var label = term.value;
        var oid = env.blanks[label];
        if( oid != null) {
            return(oid);
        } else {
            if(shouldIndex) {
                //var oid = this.lexicon.registerBlank(label);
                oid = "b:"+this.blankCounter;
                this.blankCounter++;

                env.blanks[label] = oid;
                return(oid);
            } else {
                //var oid = this.lexicon.resolveBlank(label);
                oid = "b:"+this.blankCounter;
                this.blankCounter++;

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

MongodbQueryEngine.MongodbQueryEngine.prototype.normalizeDatasets = function(datasets, outerEnv, callback) {
    var that = this;
    for(var i=0; i<datasets.length; i++) {
        var dataset = datasets[i];
        if(dataset.value === that.defaultGraphUri) {
            dataset.oid = that.defaultGraphOid;
        } else {
            var oid = that.normalizeTerm(dataset, outerEnv, false);      
            if(oid != null) {
                dataset.oid = oid;
            } else {
                return(null);
            }
        }  
    }

    return true
};

MongodbQueryEngine.MongodbQueryEngine.prototype.normalizeQuad = function(quad, queryEnv, shouldIndex) {
    var subject    = null;
    var predicate  = null;
    var object     = null;
    var graph      = null;
    var oid;

    if(quad.graph == null) {
        graph = this.defaultGraphOid;
    } else {
        oid = this.normalizeTerm(quad.graph, queryEnv, shouldIndex);
        if(oid!=null) {
            graph = oid;
            //if(shouldIndex === true)
            //    this.registerGraph(oid);
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

MongodbQueryEngine.MongodbQueryEngine.prototype.denormalizeBindingsList = function(bindingsList, env) {
    var results = [];

    for(var i=0; i<bindingsList.length; i++) {
        var result = this.denormalizeBindings(bindingsList[i], env);
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
MongodbQueryEngine.MongodbQueryEngine.prototype.copyDenormalizedBindings = function(bindingsList, out, callback) {
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
                    var val = this.retrieve(oid);
                    out[oid] = val;
                    denorm[variables[j]] = val;
                }
            }
        }
        denormList.push(denorm);
    }
    return denormList;
};

/**
 * Moved here from the Lexicon object
 */
MongodbQueryEngine.MongodbQueryEngine.prototype.parseUri = function(uriString) {
    return {token: "uri", value:uriString};
};

/**
 * Moved here from the Lexicon object
 */
MongodbQueryEngine.MongodbQueryEngine.prototype.parseLiteral = function(literalString) {
    var parts = literalString.lastIndexOf("@");
    if(parts!=-1 && literalString[parts-1]==='"' && literalString.substring(parts, literalString.length).match(/^@[a-zA-Z\-]+$/g)!=null) {
        var value = literalString.substring(1,parts-1);
        var lang = literalString.substring(parts+1, literalString.length);
        return {token: "literal", value:value, lang:lang};
    }

    var parts = literalString.lastIndexOf("^^");
    if(parts!=-1 && literalString[parts-1]==='"' && literalString[parts+2] === '<' && literalString[literalString.length-1] === '>') {
        var value = literalString.substring(1,parts-1);
        var type = literalString.substring(parts+3, literalString.length-1);

        return {token: "literal", value:value, type:type};
    }

    var value = literalString.substring(1,literalString.length-1);
    return {token:"literal", value:value};
};

/**
 * Moved here from the Lexicon object
 */
MongodbQueryEngine.MongodbQueryEngine.prototype.retrieve = function(oid) {
    try {
        if(oid === this.defaultGraphOid) {
            return({ token: "uri", 
                       value:this.defaultGraphUri,
                       prefix: null,
                       suffix: null,
                       defaultGraph: true });
        } else {

            var parts = oid.split(":");
            var tag = parts.shift();
            var oid = parts.join(":");
            
            if(tag === "u") {
                return(this.parseUri(oid));
            } else if(tag === "l") {
                return(this.parseLiteral(oid));
            } else if(tag === "b") {
                return({token:"blank", value:"_:"+oid});
            } else {
                throw("Unknown OID tag "+tag);
            }
        }
    } catch(e) {
        console.log("error in lexicon retrieving OID:");
        console.log(oid);
        if(e.message || e.stack) {
            if(e.message) {
                console.log(e.message); 
            }
            if(e.stack) {
                console.log(e.stack);
            }
        } else {
            console.log(e);
        }
        throw new Error("Unknown retrieving OID in lexicon:"+oid);

    }
};

MongodbQueryEngine.MongodbQueryEngine.prototype.denormalizeBindings = function(bindings, env, callback) {
    var envOut = env.outCache;
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
                var val = this.retrieve(oid);
                bindings[variables[i]] = val;
		if(val.token === 'blank') {
		    env.blanks[val.value] = oid;
		}
            }
        }
    }
    return bindings;
};

// Queries execution

MongodbQueryEngine.MongodbQueryEngine.prototype.execute = function(queryString, callback, defaultDataset, namedDataset){
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

MongodbQueryEngine.MongodbQueryEngine.prototype.executeQuery = function(syntaxTree, callback, defaultDataset, namedDataset) {
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
                  var result = that.denormalizeBindingsList(result, queryEnv);
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
                    var result = that.denormalizeBindingsList(result, queryEnv);
                    if(result != null) { 
                        var graph = new RDFJSInterface.Graph();
                            
                        // CONSTRUCT WHERE {} case
                        if(aqt.template == null) {
                            aqt.template = {triplesContext: aqt.pattern};
                        }
                        var blankIdCounter = 1;
			var toDelete = [];
                        for(var i=0; i<result.length; i++) {
                            var bindings = result[i];

			    // @doc
			    // -----------------------------------------
			    // valuetmp must be deleted to avoid producing
			    // different construct templates with the same 
			    // generated blankIDs. Blanks in the templates
			    // must be different between results.
			    // These blanks are different than the blank returned
			    // by variables in the select query. These blanks will
			    // be tha same across different generated templates.
			    // To avoid collisions between the gen blanks in the templates
			    // and the blanks in the result bindings, we add a _:b to the
			    // generated blank IDs.
			    for(var j=0; j<toDelete.length; j++)
				delete toDelete[j].valuetmp;

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
					    toDelete.push(tripleTemplate[component]);
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

MongodbQueryEngine.MongodbQueryEngine.prototype.executeSelect = function(unit, env, defaultDataset, namedDataset, callback) {
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
            // We add the implicit graph to the implicit merged graph
            dataset.implicit.push(this.defaultGraphUriTerm);
        }

        if (that.normalizeDatasets(dataset.implicit.concat(dataset.named), env) != null) {
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
                        if(that.checkGroupSemantics(unit.group,projection)) {
                            var groupedBindings = that.groupSolution(result, unit.group, env);
                             
                            var aggregatedBindings = [];
                            var foundError = false;
                            
                            for(var i=0; i<groupedBindings.length; i++) {
                                var resultingBindings = that.aggregateBindings(projection, groupedBindings[i], dataset, env);
                                aggregatedBindings.push(resultingBindings);
                            }
                            callback(true, {'bindings': aggregatedBindings, 'denorm':true});
                        } else {
                            callback(false, "Incompatible Group and Projection variables");
                        }
                    } else {
                        var orderedBindings = that.applyOrderBy(order, result, dataset, env);
                        var projectedBindings = that.projectBindings(projection, orderedBindings);
                        var modifiedBindings = that.applyModifier(modifier, projectedBindings);
                        var limitedBindings  = that.applyLimitOffset(offset, limit, modifiedBindings);
                        var filteredBindings = that.removeDefaultGraphBindings(limitedBindings, dataset);
                                
                        callback(true, filteredBindings);
                    }

                } else { // fail selectUnit
                    callback(false, result);
                }
            });
        } else { // fail  normalizaing datasets
            callback(false,"Error normalizing datasets");
        }
    } else {
        callback(false,"Cannot execute " + unit.kind + " query as a select query");
    }
};


MongodbQueryEngine.MongodbQueryEngine.prototype.groupSolution = function(bindings, group, queryEnv){
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
MongodbQueryEngine.MongodbQueryEngine.prototype.executeSelectUnit = function(projection, dataset, pattern, env, callback) {
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
                results = QueryFilters.checkFilters(pattern, results, false, dataset, env, that);
                callback(true, results);
            } else {
                callback(false, results);
            }
        });
    } else if(pattern.kind === "EMPTY_PATTERN") {
        // as an example of this case  check DAWG test case: algebra/filter-nested-2
        callback(true, []);
    } else if(pattern.kind === "ZERO_OR_MORE_PATH" || pattern.kind === "ONE_OR_MORE_PATH") {
	this.executeZeroOrMorePath(pattern, dataset, env, callback);
    } else {
        callback(false, "Cannot execute query pattern " + pattern.kind + ". Not implemented yet.");
    }
};

MongodbQueryEngine.MongodbQueryEngine.prototype.executeZeroOrMorePath = function(pattern, dataset, env, callback) {
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

    if(pattern.x.token === 'var' && pattern.y.token === 'var') {
	var that = this;
	this.executeAndBGP(projection, dataset, pattern.path, env, function(success, bindings) {
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
	    Utils.repeat(0, bindings.length, function(k,e) {
		var floop = arguments.callee;
	        vx = bindings[e._i][origVXName];
	        if(acum[vx] == null) {
	     	    vxDenorm = that.retrieve(vx);
	     	    pattern.x = vxDenorm;
	     	    //console.log("REPLACING");
	     	    //console.log(last);
	     	    //console.log("BY");
	     	    //console.log(vxDenorm);
	     	    //console.log(nextPath.value);
	     	    pattern.path = that.abstractQueryTree.replace(nextPath, last, vxDenorm, env);
	     	    nextPath = Utils.clone(pattern.path);
	     	    that.executeZeroOrMorePath(pattern, dataset, env, function(success, intermediate){
			//console.log("BACK EXECUTE_ZER_OR_MORE");
	     		for(var j=0; j<intermediate.length; j++) {
	     		    nextBinding = intermediate[j];
	     		    nextBinding[origVXName] = vx;
	     		    results.push(nextBinding)
	     		}
	     		last = vxDenorm;
			k(floop,e);
		    });
	        } else {
		    k(floop,e);
		}
	    }, function(e) {
		//console.log("RETURNING VAR - VAR");
		//console.log(results);
		callback(true, results);
	    });
	});
    } else if(pattern.x.token !== 'var' && pattern.y.token === 'var') {
	var that = this;
	var data = {finished:false,
		    acum: {},
		    initial: true,
		    pending: [],
		    bindings: null,
		    nextBinding: null,
		    collected: [],
		    origVx: pattern.x,
		    last: null };

	var continueFunction = function(bindings,floop,k,e) {
	    //console.log("BINDINGS!");
	    //console.log(bindings);

	    for(var i=0; i<bindings.length; i++) {
		//console.log(bindings[i][pattern.y.value])
		var value = bindings[i][pattern.y.value];
		//console.log("VALUE:"+value);
		//console.log(e.acum);
		if(e.acum[value] !== true) {
		    e.nextBinding = {};
		    e.nextBinding[pattern.y.value] = value;
		    e.collected.push(e.nextBinding);
		    e.acum[value] = true;
		    //console.log("PUSHIN!!!");
		    //console.log(value);
		    //console.log("-----------");
		    e.pending.push(value);
		}
	    }
	    //console.log("MUST CONTINUE? --> "+(e.initial == true || e.pending.length !== 0));
	    //console.log(e.initial);
	    //console.log(e.pending);
	    //console.log(e.pending.length);
	    k((e.initial == true || e.pending.length !== 0),floop,e);
	};

	Utils.meanwhile((data.initial == true || data.pending.length !== 0),
		    function(k,e) {
			var floop = arguments.callee;
			//console.log("-- Iteration");
			//console.log(e.pending);
			//console.log(pattern.path.value[0]);
			if(e.initial === true) {
			    //console.log("INITIAL");
			    //console.log(pattern.path.value[0]);
			    that.executeAndBGP(projection, dataset, pattern.path, env, function(success, bindings){
				//console.log("BINDINGS");
				//console.log(bindings);
				//console.log("SAVING LAST");
				//console.log(pattern.x);
				e.last = pattern.x;
				e.initial = false;
				continueFunction(bindings,floop,k,e);
			    });
			} else {
			    //console.log(e.pending.length);
			    var nextOid = e.pending.pop();
			    //console.log("POPPING:"+nextOid);
			    var value = that.retrieve(nextOid);
			    var path = pattern.path; //Utils.clone(pattern.path);
			    //console.log(path.value[0]);
			    //console.log("REPLACING");
			    //console.log(last);
			    //console.log("BY");
			    //console.log(value);
			    path = that.abstractQueryTree.replace(path, e.last, value, env);
			    //console.log(path.value[0]);
			    that.executeAndBGP(projection, dataset, path, env, function(success, bindings){
				e.last = value;
				continueFunction(bindings,floop,k,e);
			    });
			}
		    },
		    function(e) {
			//console.log("RETURNING TERM - VAR");
			//console.log(e.collected);
			callback(true, e.collected);
		    },
 		    data);
    } else {
     	throw "Kind of path not supported!";
    }
};

MongodbQueryEngine.MongodbQueryEngine.prototype.executeUNION = function(projection, dataset, patterns, env, callback) {
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
                return k();
            } else {
                return callback(false, results);
            }
        });
    }, function(k) {
        that.executeSelectUnit(projection, dataset, setQuery2, env, function(success, results){
            if(success) {
                set2 = results;
                return k();
            } else {
                return callback(false, results);
            }
        });
    })(function(){
        var result = QueryPlanAsync.unionBindings(set1, set2);
        result = QueryFilters.checkFilters(patterns, result, false, dataset, env, that);
        callback(true, result);
    });
};

MongodbQueryEngine.MongodbQueryEngine.prototype.executeAndBGP = function(projection, dataset, patterns, env, callback) {
    var that = this;
    // @modified qp
    //console.log(" EXECUTE AND BGP");
    //console.log(patterns.value);
    QueryPlanAsync.executeAndBGPsDPSize(patterns.value, dataset, this, env, function(success,result){
        if(success) {
	    //console.log("-- RESULTS");
	    //console.log(result);
            result = QueryFilters.checkFilters(patterns, result, false, dataset, env, that);
            callback(true, result);
        } else {
            callback(false, result);
        }
    });
};

MongodbQueryEngine.MongodbQueryEngine.prototype.executeLEFT_JOIN = function(projection, dataset, patterns, env, callback) {
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
                return k();
            } else {
                return callback(false, results);
            }
        });
    }, function(k) {
        that.executeSelectUnit(projection, dataset, setQuery2, env, function(success, results){
            if(success) {
                set2 = results;
                return k();
            } else {
                return callback(false, results);
            }
        });
    })(function(){
        var result = QueryPlanAsync.leftOuterJoinBindings(set1, set2);
        //console.log("SETS:")
        //console.log(set1)
        //console.log(set2)
        //console.log("---")
        //console.log(result);

        var bindings = QueryFilters.checkFilters(patterns, result, true, dataset, env, that);
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
            var acum = [];
            var duplicates = {};
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
            
            callback(true, acum);
        } else {
            callback(true, bindings);
        }
    });
};

MongodbQueryEngine.MongodbQueryEngine.prototype.executeJOIN = function(projection, dataset, patterns, env, callback) {
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
                return k();
            } else {
                return callback(false, results);
            }
        });
    }, function(k) {
        that.executeSelectUnit(projection, dataset, setQuery2, env, function(success, results){
            if(success) {
                set2 = results;
                return k();
            } else {
                return callback(false, results);
            }
        });
    })(function(){
           //var result = QueryPlanAsync.joinBindings(set1, set2);
	var result = null;
	if(set1.length ===0 || set2.length===0) {
	    //result = QueryPlanAsync.joinBindings(set1, set2);
	    result = [];
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
		result = QueryPlanAsync.joinBindings(set1,set2);	    
	    } else if(that.abstractQueryTree.treeWithUnion(setQuery1) || 
		      that.abstractQueryTree.treeWithUnion(setQuery2)) {
		result = QueryPlanAsync.joinBindings(set1,set2);	    	    
	    } else {
		result = QueryPlanAsync.joinBindings2(commonVars, set1, set2);
	    }
	}
        result = QueryFilters.checkFilters(patterns, result, false, dataset, env, that);
        callback(true, result);
    });
};

// @modified qp
MongodbQueryEngine.MongodbQueryEngine.prototype.computeCosts = function(quads, queryEnv, callback) {
    var that = this;
    Utils.repeat(0, quads.length, function(k,env) {
        var quad = quads[env._i];
        var key = that.normalizeQuad(quad, queryEnv, false);
        var floop = arguments.callee;
        that.count(new MongodbQueryEngine.Pattern(key), function(count) {            
            quads[env._i]['_cost'] = (count==null) ? 1 : count;
            k(floop, env);
        });
    }, function(env) {
        callback(quads);
    });
};

MongodbQueryEngine.MongodbQueryEngine.prototype.rangeQuery = function(quad, queryEnv, callback) {
    var that = this;
    //console.log("BEFORE:");
    //console.log("QUAD:");
    //console.log(quad);
    var key = that.normalizeQuad(quad, queryEnv, false);
    if(key != null) {
        //console.log("RANGE QUERY:")
        //console.log(key);
        //console.log(new QuadIndexCommon.Pattern(key));
        that.range(new MongodbQueryEngine.Pattern(key),function(quads){
            //console.log("retrieved");
            //console.log(quads)
	    if(quads == null) {
		callback(false, "Error in backend connection, range scan failed");
	    } else if (quads.length == 0) {
                callback(true, []);
            } else {
                callback(true, quads);
            }
        });
    } else {
        callback(false, "Cannot normalize quad: "+quad);
    }
};

// Update queries

MongodbQueryEngine.MongodbQueryEngine.prototype.executeUpdate = function(syntaxTree, callback) {
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

MongodbQueryEngine.MongodbQueryEngine.prototype.batchLoad = function(quads, callback) {
    var that = this;
    var subject    = null;
    var predicate  = null;
    var object     = null;
    var graph      = null;
    var oldLimit = Utils.stackCounterLimit;
    var blanks = {};
    var maybeBlankOid, oid, quad, key, originalQuad;
    Utils.stackCounter = 0;
    Utils.stackCounterLimit = 10;

    if(this.eventsOnBatchLoad)
        this.callbacksBackend.startGraphModification();


    Utils.repeat(0, quads.length, function(kk,env){
        if(env.success == null) {
            env.success = true;
            env.counter = 0;
        }
        var floop = arguments.callee;
        var quad = quads[env._i];

        if(env.success) {

            // subject
            if(quad.subject['uri'] || quad.subject.token === 'uri') {
                oid = that.registerUri(quad.subject.uri || quad.subject.value);
		if(quad.subject.uri != null) {
		    quad.subject = {'token': 'uri', 'value': quad.subject.uri};
		    delete quad.subject['uri'];
		}
                subject = oid;
            } else if(quad.subject['literal'] || quad.subject.token === 'literal') {
                oid = that.registerLiteral(quad.subject.literal || quad.subject.value);
		if(quad.subject.literal != null) {
		    quad.subject = this.lexicon.parseLiteral(quad.subject.literal);
		    delete quad.subject['literal'];
		}
                subject = oid;                    
            } else {
                maybeBlankOid = blanks[quad.subject.blank || quad.subject.value];
                if(maybeBlankOid == null) {
                    //maybeBlankOid = that.registerBlank(quad.subject.blank || quad.subject.value)
                    maybeBlankOid = "b:"+that.blankCounter;
                    that.blankCounter++;

                    blanks[(quad.subject.blank || quad.subject.value)] = maybeBlankOid;
                }
		if(quad.subject.token == null) {
		    quad.subject.token = 'blank';
		    quad.subject.value = quad.subject.blank;
		    delete quad.subject['blank'];
		}
                subject = maybeBlankOid;
            }

            // predicate
            if(quad.predicate['uri'] || quad.predicate.token === 'uri') {
                oid = that.registerUri(quad.predicate.uri || quad.predicate.value);
		if(quad.predicate.uri != null) {
		    quad.predicate = {'token': 'uri', 'value': quad.predicate.uri};
		    delete quad.subject['uri'];
		}
                predicate = oid;
            } else if(quad.predicate['literal'] || quad.predicate.token === 'literal') {
                oid = that.registerLiteral(quad.predicate.literal || quad.predicate.value);
		if(quad.predicate.literal != null) {
		    quad.predicate = this.lexicon.parseLiteral(quad.predicate.literal);
		    delete quad.predicate['literal'];
		}
                predicate = oid;                    
            } else {
                maybeBlankOid = blanks[quad.predicate.blank || quad.predicate.value];
                if(maybeBlankOid == null) {
                    //maybeBlankOid = that.registerBlank(quad.predicate.blank || quad.predicate.value)
                    maybeBlankOid = "b:"+that.blankCounter;
                    that.blankCounter++;

                    blanks[(quad.predicate.blank || quad.predicate.value)] = maybeBlankOid;
                }
		if(quad.predicate.token == null) {
		    quad.predicate.token = 'blank';
		    quad.predicate.value = quad.predicate.blank;
		    delete quad.predicate['blank'];
		}
                predicate = maybeBlankOid;
            }

            // object
            if(quad.object['uri'] || quad.object.token === 'uri') {
                oid = that.registerUri(quad.object.uri || quad.object.value);
                if(quad.object.uri != null) {
		    quad.object = {'token': 'uri', 'value': quad.object.uri};
		    delete quad.subject['uri'];
		}
		object = oid;
            } else if(quad.object['literal'] || quad.object.token === 'literal') {
		if(quad.object.token === 'literal') {
		    if(quad.object.type != null) {
			quad.object.value = '"'+quad.object.value+'"^^<'+quad.object.type+'>';
		    } else if(quad.object.lang != null) {
			quad.object.value = '"'+quad.object.value+'"@'+quad.object.lang;		    
		    } else {
			quad.object.value = '"'+quad.object.value+'"';
		    }
		}

                oid = that.registerLiteral(quad.object.literal || quad.object.value);
                if(quad.object.literal != null) {
		    quad.object = that.lexicon.parseLiteral(quad.object.literal);
		    delete quad.object['literal'];
		}
		object = oid;                    
            } else {
                maybeBlankOid = blanks[quad.object.blank || quad.object.value];
                if(maybeBlankOid == null) {
                    //maybeBlankOid = that.registerBlank(quad.object.blank || quad.object.value)
                    maybeBlankOid = "b:"+that.blankCounter;
                    that.blankCounter++;

                    blanks[(quad.object.blank || quad.object.value)] = maybeBlankOid;
                }
		if(quad.object.token == null) {
		    quad.object.token = 'blank';
		    quad.object.value = quad.object.blank;
		    delete quad.object['blank'];
		}
                object = maybeBlankOid;
            }

            // graph
            if(quad.graph['uri'] || quad.graph.token === 'uri') {
                oid = that.registerUri(quad.graph.uri || quad.graph.value);
                //that.registerGraph(oid);
                if(quad.graph.uri != null) {
		    quad.graph = {'token': 'uri', 'value': quad.graph.uri};
		    delete quad.subject['uri'];
		}
		graph = oid;
                
            } else if(quad.graph['literal'] || quad.graph.token === 'literal') {
                oid = that.registerLiteral(quad.graph.literal || quad.graph.value);
                if(quad.predicate.literal != null) {
		    quad.predicate = this.lexicon.parseLiteral(quad.predicate.literal);
		    delete quad.predicate['literal'];
		}
		graph = oid;                    
            } else {
                maybeBlankOid = blanks[quad.graph.blank || quad.graph.value];
                if(maybeBlankOid == null) {
                    //maybeBlankOid = that.registerBlank(quad.graph.blank || quad.graph.value)
                    maybeBlankOid = "b:"+that.blankCounter;
                    that.blankCounter++;

                    blanks[(quad.graph.blank || quad.graph.value)] = maybeBlankOid;
                }
		if(quad.graph.token == null) {
		    quad.graph.token = 'blank';
		    quad.graph.value = quad.graph.blank;
		    delete quad.graph['blank'];
		}
                graph = maybeBlankOid;
            }



            originalQuad = quad;
            var quad = {subject: subject, predicate:predicate, object:object, graph: graph};
              
            that.index(quad, function(result, error){
                if(result == true){
                    if(that.eventsOnBatchLoad)
                        that.callbacksBackend.nextGraphModification(Callbacks.added, [originalQuad,quad]);

                    env.counter = env.counter + 1;
                    kk(floop, env);
                } else {
                    env.success = false;
                    kk(floop, env);
                }
            });            
        } else {
            kk(floop, env);
        }
    }, function(env){
        that.updateBlankCounter(function(){
            var exitFn = function() {
                Utils.stackCounterLimit = oldLimit;
                if(env.success) {
                    callback(true, env.counter);
                } else {
                    callback(false, "error loading quads");
                }
            };
     
            if(that.eventsOnBatchLoad) {
                that.callbacksBackend.endGraphModification(function(){
                    exitFn();
                });
            } else {
                exitFn();
            }
        });
    });
};

// Low level operations for update queries

MongodbQueryEngine.MongodbQueryEngine.prototype._executeModifyQuery = function(aqt, queryEnv, callback) {
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
                    var result = that.denormalizeBindingsList(result, queryEnv);
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

                        quads.push(quad);
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

MongodbQueryEngine.MongodbQueryEngine.prototype._executeQuadInsert = function(quad, queryEnv, callback) {
    var that = this;
    var normalized = this.normalizeQuad(quad, queryEnv, true);
    if(normalized != null) {
        that.search(normalized,function(result) {
            if(result){
                callback(true, "duplicated");
            } else {
                that.index(normalized, function(result, error){
                    if(result == true){
                        that.callbacksBackend.nextGraphModification(Callbacks.added, [quad, normalized]);
                        that.updateBlankCounter(function(){
                            callback(true);
                        });
                    } else {
                        callback(false, error);
                    }
                });
            }
        });
    } else {
        callback(false, result);
    }
};

MongodbQueryEngine.MongodbQueryEngine.prototype._executeQuadDelete = function(quad, queryEnv, callback) {
    var that = this;
    var normalized = this.normalizeQuad(quad, queryEnv, false);
    if(normalized != null) {
        that.delete(normalized, function(result, error){
            that.callbacksBackend.nextGraphModification(Callbacks['deleted'], [quad, normalized]);
            callback(true);
        });
    } else {
        callback(false, result);
    }
};

MongodbQueryEngine.MongodbQueryEngine.prototype._executeClearGraph = function(destinyGraph, queryEnv, callback) {
    if(destinyGraph === 'default') {
        this.execute("DELETE { ?s ?p ?o } WHERE { ?s ?p ?o }", callback);
    } else if(destinyGraph === 'named') {
        var that = this;
        this.registeredGraphs(true, function(graphs){
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

MongodbQueryEngine.MongodbQueryEngine.prototype.checkGroupSemantics = function(groupVars, projectionVars) {
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

MongodbQueryEngine.MongodbQueryEngine.prototype.registerDefaultNamespace = function(ns, prefix) {
    this.defaultPrefixes[ns] = prefix;
};

// Moved here from quadbackend
MongodbQueryEngine.MongodbQueryEngine.prototype.range = function(pattern, callback)  {
    var doc = {};
    
    if(pattern.subject != null) {
        doc['subject'] = pattern.subject;
    }
    if(pattern.predicate != null) {
        doc['predicate'] = pattern.predicate;
    }
    if(pattern.object != null) {
        doc['object'] = pattern.object;
    }
    if(pattern.graph != null) {
        doc['graph'] = pattern.graph;
    }
    
    this.collection('quads', function(err,coll) {
	if(!err) {
            coll.find(doc).toArray(function(err,res){
		if(err) {
                    callback(null);
		} else {
                    callback(res);
		}
            });
	} else {
	    callback(null);
	}
    });
};

// @modified qp
MongodbQueryEngine.MongodbQueryEngine.prototype.count = function(pattern, callback)  {
    var doc = {};
    
    if(pattern.subject != null) {
        doc['subject'] = pattern.subject;
    }
    if(pattern.predicate != null) {
        doc['predicate'] = pattern.predicate;
    }
    if(pattern.object != null) {
        doc['object'] = pattern.object;
    }
    if(pattern.graph != null) {
        doc['graph'] = pattern.graph;
    }
    
    this.collection('quads', function(err,coll) {
        coll.find(doc).count(function(err,count){
            if(err) {
                callback(null);
            } else {
                callback(count);
            }
        });
    });
};

MongodbQueryEngine.MongodbQueryEngine.prototype.index = function(quad, callback) {
    this.collection('quads', function(err,coll) {
        if(err) {
            callback(false, 'Error retrieving MongoDB collection');
        } else {
            coll.insert(quad, function(err,res) {
                if(err) {
                    callback(false);                
                } else {
                    callback(true);
                }
            });
        }
    });
};

MongodbQueryEngine.MongodbQueryEngine.prototype.search = function(pattern, callback)  {
    var doc = {};
    
    if(pattern.subject != null) {
        doc['subject'] = pattern.subject;
    }
    if(pattern.predicate != null) {
        doc['predicate'] = pattern.predicate;
    }
    if(pattern.object != null) {
        doc['object'] = pattern.object;
    }
    if(pattern.graph != null) {
        doc['graph'] = pattern.graph;
    }

    this.collection('quads', function(err,coll) {
        coll.findOne(doc,function(err,doc){
            if(err) {
                callback(null);
            } else {
                callback(doc!=null);
            }
        });
    });
};

MongodbQueryEngine.MongodbQueryEngine.prototype.delete = function(quad, callback) {
    var doc = {};
    
    if(quad.subject != null) {
        doc['subject'] = quad.subject;
    }
    if(quad.predicate != null) {
        doc['predicate'] = quad.predicate;
    }
    if(quad.object != null) {
        doc['object'] = quad.object;
    }
    if(quad.graph != null) {
        doc['graph'] = quad.graph;
    }
    
    var that = this;
    this.collection('quads', function(err,coll) {
        coll.findAndModify(doc,[],{},{remove:true},function(err,doc){
            callback(that);
        });
    });
};

MongodbQueryEngine.MongodbQueryEngine.prototype.updateBlankCounter = function(callback) {
    var that = this;
    this.collection('store_configuration', function(err, coll) {
        that.configuration.blankCounter = that.blankCounter;
        coll.update({configuration:true}, that.configuration, {safe:true}, callback);
    });
};

MongodbQueryEngine.MongodbQueryEngine.prototype.readConfiguration = function(callback) {
    var that = this;
    this.collection('quads',function(err,coll) {
	if(err) {
	    throw coll;
	} else {
            coll.ensureIndex({subject:1, predicate:1, object:1, graph:1},{unique:1},function(){
		coll.ensureIndex({graph:1, predicate:1},function(){
                    coll.ensureIndex({object:1,graph:1,subject:1},function(){
			coll.ensureIndex({predicate:1,object:1,graph:1},function(){
                            coll.ensureIndex({graph:1,subject:1,predicate:1},function(){
				coll.ensureIndex({object:1,subject:1},function(){
                                    that.collection('store_configuration', function(err,coll) {
					coll.find({configuration:true}).toArray(function(err, res) {
                                            if(res==null || res.length === 0) {
						coll.insert({blankCounter:0, configuration:true}, function(){
                                                    that.configuration = {
							blankCounter:0
						    };
						    that.blankCounter = 0;
                                                    callback();
						});
                                            } else {
						that.configuration = res[0];
						that.blankCounter = that.configuration.blankCounter;
						callback();
                                            }
					});
                                    });
				});
                            });
			});
                    });
		});
            });
	}
    });
};

MongodbQueryEngine.MongodbQueryEngine.prototype.registerGraph = function(oid){
    //if(oid != this.defaultGraphOid) {
    //    this.knownGraphs[oid] = true;
    //}
    //return true
};

MongodbQueryEngine.MongodbQueryEngine.prototype.registeredGraphs = function(shouldReturnUris, callback) {
    var that = this;
    this.collection('quads',function(err,coll) {
        if(err) {
            callback(null);
        } else {
            coll.distinct('graph',{},function(err,knownGraphs) {
                if(err) {
                    callback(null);
                } else {
                    var acum = [];

                    for(var i=0; i<knownGraphs.length; i++) {
                        var g = knownGraphs[i];
                        if(g!==that.defaultGraphOid) {
                            if(shouldReturnUris === true) {
                                acum.push(g.split("u:")[1]);
                            } else {
                                acum.push(g);
                            }
                        }
                    }
                    callback(acum);
                }
            });
        }
    });
};


MongodbQueryEngine.Pattern = function(components) {
    var properties = ['subject','predicate','object','graph'];
    var key = {};

    for(var i=0; i<properties.length; i++) {
        var component = components[properties[i]];
        if(component.indexOf("u:")===0 ||
           component.indexOf("l:")===0) {
            key[properties[i]] = component;
        } else {
            key[properties[i]] = null;
        }
    }

    return key;
};

