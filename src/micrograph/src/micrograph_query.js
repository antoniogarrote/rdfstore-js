// imports
var MicrographQL = require('./micrograph_ql.js').MicrographQL;
var Utils = require("./../../js-trees/src/utils").Utils;
var sys = null;
try {
    sys = require("util");
} catch(e) {
    sys = require("sys");
}

// Query object
exports.MicrographQuery = function(template) {
    this.template = template;
    this.filter = null;
};
var MicrographQuery = exports.MicrographQuery;

MicrographQuery.prototype.setKind = function(kind) {
    this.kind = kind;
    return this;
};

MicrographQuery.prototype.setStore = function(store) {
    this.store = store;
    return this;
};

MicrographQuery.prototype.setCallback = function(callback) {
    this.callback = callback;
    return this;
};

MicrographQuery.prototype.each = function(callback) {
    this.filter = callback;
    return this;
};

MicrographQuery.prototype.onError = function(callback) {
    this.onErrorCallback =  callback;
    return this;
};

MicrographQuery.prototype.limit = function(limit) {
    this.limitValue = limit;
    return this;
};

MicrographQuery.prototype.offset = function(offset) {
    this.offsetValue = offset;
    return this;
};

MicrographQuery.prototype.order = function(order) {
    this.sortValue = order;
    return this;
}

MicrographQuery.prototype.all = function(callback) {
    this.kind = 'all';
    this._executeQuery(callback);
    return this.store;
};

MicrographQuery.prototype.remove = function(callback) {
    this.kind = 'remove';
    this._executeUpdate(callback);
    return this.store;
};

// protected inner methods

MicrographQuery.prototype._executeUpdate = function(callback) {
    console.log(sys.inspect(this.query, true, 20));
    var pattern = this._parseModify(this.template);
    this.query = pattern.query;
    this.varsMap = pattern.varsMap;
    this.topLevel = pattern.topLevel;
    this.subject = pattern.subject;
    this.inverseMap = pattern.inverseMap;
    console.log(sys.inspect(this.query, true, 20));
    this.store.execute(this.query,function(success, results){
	console.log("RESULT");
	console.log(success);
	console.log(results);
	callback(success);
    });
}

MicrographQuery.prototype._executeQuery = function(callback) {
    var pattern = this._parseQuery(this.template);
    this.query = pattern.query;
    this.varsMap = pattern.varsMap;
    this.topLevel = pattern.topLevel;
    this.subject = pattern.subject;
    this.inverseMap = pattern.inverseMap;

    // Final processing of query
    var quads = this.query.units[0].pattern.patterns[0].triplesContext;
    var unit = this.query.units[0];
    // sort by
    var  sortAcum = [];
    if(this.sortValue) {
	var nextVariable = MicrographQL.nextVariable();
	var sortCounter = 0;
	for(var i=0; i<this.sortValue.length; i++) {
	    var sortPredicate;
	    var direction = 1;

	    if(typeof(this.sortValue[i]) === 'object') {
		for(var p in sortValue[i]) {
		    sortPredicate = p;
		    direction == sortValue[i][p];
		    break;
		}
	    } else {
		sortPredicate = this.sortValue[i];
	    }
	    
	    var predicate, object;
	    if(sortPredicate === '$type') {
		predicate = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";
	    }
	    predicate = MicrographQL.parseURI(sortPredicate);
	    var sortVariable = nextVariable+'s'+sortCounter;
	    sortCounter++;
	    var variableToken = {'token':'var', 'value': sortVariable};
	    quads.push({'subject':this.subject, 'predicate':predicate, 'object':variableToken});
	    sortAcum.push({
		"direction": (direction === 1) ? "ASC" : "DESC",
		"expression": {
		    "token": "expression",
		    "expressionType": "atomic",
		    "primaryexpression": "var",
		    "value": variableToken
		}
	    });
	}
    }

    if(this.limitValue != null)
	unit.limit = this.limitValue;

    if(this.offsetValue != null) 
	unit.offset = this.offsetValue;

    if(sortAcum.length > 0)
	unit.order = sortAcum;


    if(callback != null )
	this.callback = callback;

    var that = this;
    if(this.kind === "all") {
	//console.log(sys.inspect(this.query, true, 20));
	var counter = 0;
	this.store.execute(this.query, function(success, results) {
	    //console.log("results : "+results.length);
	    if(MicrographQL.isUri(that.varsMap[that.topLevel]) && results.length>0) {
		// if the top level is a URI, not retrieved in the results,
		// and there are results, we add the node to one result
		// bindings to force retrieval of data
		results[0][that.topLevel] = that.varsMap[that.topLevel];
	    }

	    var pushed = {};
	    var processed = {};
	    var ignore = {};

	    if(success) {
		var nodes = {};
		var disambiguations = {};
		var toReturn = [];
		var result, isTopLevel, nodeDisambiguations;
		
		for(var i=0; i<results.length; i++) {
		    result = results[i];
		    for(var p in result) {
			isTopLevel = false;
			var idp = that.varsMap[p];

			if(idp == p)
			    idp = results[i][p].value;


			if(p === that.topLevel)
			    isTopLevel = true;

			var id = idp.split(MicrographQL.base_uri)[1];
			if(processed[id] == null) {
			    var node = nodes[id];
			    node = node || {'$id': id};
			    nodes[id] = node;
			    
			    toIgnore = ignore[id] || {};
			    ignore[id] = toIgnore;

			    var invLinks = that.inverseMap[id] || that.inverseMap[p];
			    if(invLinks) {
				for(var linkedProp in invLinks) {
				    if(invLinks[linkedProp].length === 1) {
					var linkedObjId = results[i][that.varsMap[invLinks[linkedProp][0]]];
					if(linkedObjId != null) {
					    // this is a variable resolved to a URI in the bindings results
					    linkedObjId = linkedObjId.value.split(MicrographQL.base_uri)[1];
					} else {
					    linkedObjId = invLinks[linkedProp][0];
					}

					var linkedNode = nodes[linkedObjId] || {'$id': linkedObjId};
					var toIgnore = ignore[linkedObjId] || {};
					ignore[linkedObjId] = toIgnore;
					toIgnore[linkedProp] = true;
					delete linkedNode[linkedProp];

					nodes[linkedObjId] = linkedNode;
					node[linkedProp+"$in"] = linkedNode;
				    } else {
					node[linkedProp+"$in"] = [];
					for(var i=0; i< invLinks[linkedProp].length; i++) {

					    var linkedNode = nodes[linkedObjId] || {'$id': linkedObjId};
					    var toIgnore = ignore[linkedObjId] || {};					  
					    ignore[linkedObjId] = toIgnore;
					    toIgnore[linkedProp] = true;
					    delete linkedNode[linkedProp];

					    var linkedObjId = that.varsMap[invLinks[linkedProp][0]] || invLinks[linkedProp][0];
					    var linkedNode = nodes[linkedObjId] || {'$id': linkedObjId};
					    nodes[linkedObjId].push(linkedNode);
					}
				    }
				}
			    }

			    if(MicrographQL.isUri(idp)) {
				//console.log(sys.inspect(MicrographQL.singleNodeQuery(idp, 'p', 'o'), true,20));
				that.store.execute(MicrographQL.singleNodeQuery(idp, 'p', 'o'), function(success, resultsNode){
				    processed[id] = true;
				    counter++;

				    nodeDisambiguations = disambiguations[id] || {};
				    disambiguations[id] = nodeDisambiguations;

				    var obj = null;
				    for(var i=0; i<resultsNode.length; i++) {
					var obj = resultsNode[i]['o'];
					if(obj.token === 'uri') {
					    var oid = obj.value.split(MicrographQL.base_uri)[1];
					    var linked  = nodes[oid] || {};
					    linked['$id'] = oid;
					    nodes[oid] = linked;
					    obj = linked;
					} else {
					    obj = MicrographQL.literalToJS(obj);
					}

					var pred = resultsNode[i]['p'].value;
					if(pred === "http://www.w3.org/1999/02/22-rdf-syntax-ns#type")
					    pred = '$type';

					if(toIgnore[pred])
					    continue;

					if(node[pred] && node[pred].constructor === Array) {
					    if(typeof(obj) === 'object' && obj['$id'] && nodeDisambiguations[pred][obj['$id']] == null) {
						nodeDisambiguations[pred][obj['$id']] = true;
						node[pred].push(obj);
					    } else if(typeof(obj) !== 'object' && obj.constructor === Date && nodeDisambiguations[pred]['date:'+obj.getTime()] == null) {
						nodeDisambiguations[pred]['date:'+obj.getTime()] = true;
						node[pred].push(obj);
					    } else if(nodeDisambiguations[pred][obj] == null) {
						nodeDisambiguations[pred][obj] = true;
						node[pred].push(obj);
					    }
					} else if(node[pred]) {
					    if(typeof(node[pred]) === 'object' && node[pred]['$id'] != null) {
						if(typeof(obj) === 'object' && obj['$id'] != null) {
						    if(node[pred]['$id'] != obj['$id']) {
							node[pred] = [node[pred],obj];
							nodeDisambiguations[pred] = {};
							nodeDisambiguations[pred][node[pred][0]['$id']] = true;
							nodeDisambiguations[pred][node[pred][1]['$id']] = true;
						    }
						} else {
						    nodeDisambiguations[pred] = {};
						    nodeDisambiguations[pred][node[pred]['$id']] = true;
						    if(typeof(obj) === 'object') {
							nodeDisambiguations[pred]['date:'+obj.getTime()] = true;
						    } else {
							nodeDisambiguations[pred][obj] = true;
						    }
						    node[pred] = [node[pred],obj];
						}
					    } else if(typeof(node[pred]) === 'object') {
						if(typeof(obj) === 'object' && obj['$id'] == null) {
						    if(node[pred].getTime() !== obj.getTime()) {
							node[pred] = [node[pred],obj];
							nodeDisambiguations[pred] = {};
							nodeDisambiguations[pred]['date:'+node[pred][0].getTime()] = true;
							nodeDisambiguations[pred]['date:'+node[pred][1].getTime()] = true;
						    }
						} else {
						    nodeDisambiguations[pred] = {};
						    nodeDisambiguations[pred]['date:'+node[pred].getTime()] = true;
						    if(typeof(obj) === 'object') {
							nodeDisambiguations[pred][obj['$id']] = true;
						    } else {
							nodeDisambiguations[pred][obj] = true;
						    }
						    node[pred] = [node[pred],obj];
						}
					    } else {
						if(typeof(obj) !== 'object') {
						    if(obj != node[pred]) {
							nodeDisambiguations[pred] = {};
							nodeDisambiguations[pred][obj] = true;
							nodeDisambiguations[pred][node[pred]] = true;
							node[pred] = [node[pred],obj];
						    }
						} else {
						    nodeDisambiguations[pred] = {};
						    nodeDisambiguations[pred][node[pred]] = true;

						    if(obj['$id'] == null) {
							nodeDisambiguations[pred][obj['$id']] = true;						    
						    } else {
							nodeDisambiguations[pred]['date:'+obj.getTime()] = true;						    
						    }
						    node[pred] = [node[pred],obj];
						}
					    }
					} else {
					    node[pred] = obj;
					}
				    }

				    if(isTopLevel && pushed[node['$id']] == null) {
					toReturn.push(node);
					pushed[node['$id']] = true;
				    }
				});
			    }
			}
		    }
		}

		if(that.filter != null) {
		    var filtered = [];
		    var filteredResult;
		    Utils.repeat(0,toReturn.length, function(k,env) {
			var floop = arguments.callee;
			var result = toReturn[env._i];
			filteredResult = that.filter(result) || result;
			if(filtered !== false)
			    filtered.push(filteredResult);
			k(floop,env);
		    }, function(env) {
			callback(filtered); 
		    });
		} else {	
		    callback(toReturn);
		}
	    } else {
		if(that.onErrorCallback) {
		    that.onError(results);
		} else {
		    that.callback(null);
		}
	    }
	});
    }
}

MicrographQuery.prototype._parseQuery = function(object) {
    var context = MicrographQL.newContext(true);
    var result = MicrographQL.parseBGP(object, context, true);
    var subject = result[0];

    var filters = [{'token': 'filter',
		    'value':{'token':'expression',
			     'expressionType': 'conditionaland',
			     'operands':[]}}];

    for(var v in context.filtersMap)
	filters[0].value.operands.push(context.filtersMap[v]);


    var quads = context.quads.concat(result[1]);


    var unit =  {'kind':'select',
		 'modifier':'',
		 'group': '',
		 'token':'executableunit',
		 'pattern':{'filters':[],
			    'token':'groupgraphpattern',
			    'patterns':
			    [{'token':'basicgraphpattern',
			      'triplesContext': quads}]}};

    if(filters[0].value.operands.length > 0)
	unit.pattern.filters = filters;
   
    var prologue =  { base: '', prefixes: [], token: 'prologue' };

    var projection = [];
    for(var i=0; i<context.variables.length; i++)
	projection.push({'kind':'var', 'token':'variable', 'value':context.variables[i]});

    var dataset = {'named':[], 'implicit':[{suffix: null, prefix: null, 'token':'uri', 'value':'https://github.com/antoniogarrote/rdfstore-js#default_graph'}]};
    
    unit['projection'] = projection;
    unit['dataset'] = dataset;


    return {'query':{ 'prologue': prologue,
		      'kind': 'query',
		      'token': 'query',
		      'units':[unit]},
	    'varsMap': context.varsMap,
	    'topLevel': context.topLevel,
	    'subject': subject,
	    'inverseMap': context.inverseMap};
		 
};


MicrographQuery.prototype._parseModify = function(object) {
    var context = MicrographQL.newContext(true);
    console.log("BGP VALUE");
    console.log(object);
    var result = MicrographQL.parseBGP(object, context, true);
    console.log("PARSED");
    console.log(result);
    console.log("-------");
    var subject = result[0];

    var filters = [{'token': 'filter',
		    'value':{'token':'expression',
			     'expressionType': 'conditionaland',
			     'operands':[]}}];

    for(var v in context.filtersMap)
	filters[0].value.operands.push(context.filtersMap[v]);


    var quads = context.quads.concat(result[1]);


    var unit =  {'kind':'modify',
		 'with': null,
		 'using': null,
		 'pattern':{'filters':[],
			    'token':'groupgraphpattern',
			    'patterns':
			    [{'token':'basicgraphpattern',
			      'triplesContext': quads}]},
		 'delete': quads};

    if(filters[0].value.operands.length > 0)
	unit.pattern.filters = filters;
   
    var prologue =  { base: '', prefixes: [], token: 'prologue' };

    var projection = [];
    for(var i=0; i<context.variables.length; i++)
	projection.push({'kind':'var', 'token':'variable', 'value':context.variables[i]});

    //var dataset = {'named':[], 'implicit':[{suffix: null, prefix: null, 'token':'uri', 'value':'https://github.com/antoniogarrote/rdfstore-js#default_graph'}]};
    //unit['dataset'] = dataset;


    return {'query':{ 'prologue': prologue,
		      'kind': 'update',
		      'token': 'query',
		      'units':[unit]},
	    'varsMap': context.varsMap,
	    'topLevel': context.topLevel,
	    'subject': subject,
	    'inverseMap': context.inverseMap};		 
};