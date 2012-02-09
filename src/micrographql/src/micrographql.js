// exports
exports.MicrographQL = {};
var MicrographQL = exports.MicrographQL;

// imports
var AbstractQueryTree = require("./../../js-sparql-parser/src/abstract_query_tree").AbstractQueryTree;
var Utils = require("./../../js-trees/src/utils").Utils;
var QueryEngine = require("./../../js-query-engine/src/query_engine").QueryEngine;
var QuadBackend = require("./../../js-rdf-persistence/src/quad_backend").QuadBackend;
var Lexicon = require("./../../js-rdf-persistence/src/lexicon").Lexicon;
var sys = null;
try {
    sys = require("util");
} catch(e) {
    sys = require("sys");
}


// Redefinitions
Utils.oldNormalizeUnicodeLiterals = Utils.normalizeUnicodeLiterals;
Utils.normalizeUnicodeLiterals = function(toNormalize) {
    if(typeof(toNormalize) === "string") {
	return Utils.oldNormalizeUnicodeLiterals(toNormalize);
    } else {
	return toNormalize;
    }
};

// Query object
exports.MicrographQuery = function(pattern) {
    this.query = pattern.query;
    this.varsMap = pattern.varsMap;
    this.topLevel = pattern.topLevel;
    this.subject = pattern.subject;
    this.filter = null;
};
var MicrographQuery = exports.MicrographQuery;

MicrographQuery.prototype.setKind = function(kind) {
    this.kind = "all";
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

//MicrographQuery.each

MicrographQuery.prototype.execute = function(callback) {

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
	this.store.execute(this.query, function(success, results) {
	    if(success) {
		var acum = {};
		var toExpand = {};
		var topLevel = [];
		var addedToTopLevel = {};
		var result, id, node, object, idp, isIDProperty, predicate, isTopLevel;
		for(var i=0; i<results.length; i++) {
		    result = results[i];
		    for(var p in result) {
			isTopLevel = false;
			isIDProperty = false;
			idp = that.varsMap[p];
			if(MicrographQL.isUri(idp)) {
			    id = idp;
			    isIDProperty = true;
			    if(p === that.topLevel) {
				isTopLevel = true;
			    }
			} else {
			    id = result[idp].value;
			    if(idp === p)
				isIDProperty = true;

			    if(idp === that.topLevel) {
				isTopLevel = true;
			    }
			}

			node = acum[id] || {};
			acum[id] = node;

			if(isTopLevel && addedToTopLevel[id] == null) {
			    topLevel.push(node);
			    addedToTopLevel[id] = true;
			}

			if(isIDProperty) {
			    // this is subject
			    node['$id'] = id.split(MicrographQL.base_uri)[1];
			} else {
			    object = result[idp+"o"];
			    if(object.token === "uri") {
				var related = acum[object.value] || {};
				acum[object.value] = related;
				related['$id'] = object.value.split(MicrographQL.base_uri)[1];
				object = related;
			    } else {
				if(object.type === "http://www.w3.org/2001/XMLSchema#float") {
				    object = parseFloat(object.value)
				} else if(object.type === "http://www.w3.org/2001/XMLSchema#boolean") {
				    object = (object.value === "true") ? true : false;
				} else if(object.type === "http://www.w3.org/2001/XMLSchema#dateTime") {
				    object = Utils.parseISO8601(object.value);
				} else {
				    object = object.value;
				}
			    }
			    predicate = result[idp+"p"].value;
			    if(predicate === "http://www.w3.org/1999/02/22-rdf-syntax-ns#type") {
				predicate = "$type";
			    }

			    if(node[predicate] == null) {
				node[predicate] = object;
			    } else {
				var map = node[predicate];
				if(typeof(map) === "object" && map['$id'] == null) {
				    // there is already a  map and is not a URI ref
				    if(typeof(object) == "object") {
					map[object['$id']] = object;
				    } else {
					map[object] = object;
				    }
				    toExpand[id] = true;
				} else if(typeof(map) === "object") {
				    if(typeof(object) != "object" || map['$id'] != object['$id']) { 
					node[predicate] = {};
					node[predicate][map['$id']] = map;
					// the value is a object with URI ref
					if(typeof(object) == "object") {
					    node[predicate][object['$id']] = object;
					} else {
					    node[predicate][object] = object;
					}
					toExpand[id] = true;
				    }
				} else {
				    if(map != object) {
					node[predicate] = {};
					node[predicate][map] = map;
					if(typeof(object) == "object") {
					    node[predicate][object['$id']] = object;
					} else {
					    node[predicate][object] = object;
					}
					toExpand[id] = true;				    
				    }
				}
			    }
			}
		    }
		}


		// expand collections
		for(var p in toExpand) {
		    var nodeToExpand = acum[p];
		    for(var p2 in nodeToExpand) {
			if(typeof(nodeToExpand[p2]) === "object" && nodeToExpand[p2]['$id'] == null) {
			    var collection = [];
			    for(var p3 in nodeToExpand[p2]) {
				collection.push(nodeToExpand[p2][p3]);
			    }
			    nodeToExpand[p2] = collection;
			}
		    }
		}
		
		// return top level results
		var toReturn = [];
		if(that.filter != null) {
		    Utils.repeat(0,topLevel.length, function(k,env) {
			var floop = arguments.callee;
			var result = topLevel[env._i];
			toReturn.push(that.filter(result));
			k(floop,env);
		    }, function(env) {
			callback(toReturn); 
		    });
		} else {	
		    callback(topLevel);
		}
	    } else {
		if(that.onErrorCallback) {
		    that.onError(results);
		} else {
		    taht.callback(null);
		}
	    }
    });
    }
}

// QL
MicrographQL.base_uri = "http://rdfstore-js.org/micrographql/graph#";
MicrographQL.prefix = "mql";

MicrographQL.counter = 0;

MicrographQL.newContext = function(isQuery) {
    return {variables: [], isQuery:isQuery, quads:[], varsMap: {}, filtersMap: {}};
};

MicrographQL.parseFilter = function(predicate, filterVariable, expression) {
    var operator, value;
    var variableExpression = {'token':'expression', 'expressionType':'atomic', 'primaryexpression':'var', 'value': filterVariable};
    if(typeof(expression) === 'object' && expression.constructor !== Date) {
	for(var p in expression) {
	    operator = p;
	    value = expression[p];
	    break;
	}
    }

    if(operator === '$eq') {
	return {'token': 'expression',
		'expressionType': 'relationalexpression',
		'operator': '=',
		'op1': variableExpression,
		'op2': MicrographQL.parseFilter(predicate, filterVariable, value)}
    } else if(operator === '$lt') {
	return {'token': 'expression',
		'expressionType': 'relationalexpression',
		'operator': '<',
		'op1': variableExpression,
		'op2': MicrographQL.parseFilter(predicate, filterVariable, value)}
    } else if(operator === '$gt') {
	return {'token': 'expression',
		'expressionType': 'relationalexpression',
		'operator': '>',
		'op1': variableExpression,
		'op2': MicrographQL.parseFilter(predicate, filterVariable, value)}
    } else if(operator === '$neq') {
	return {'token': 'expression',
		'expressionType': 'relationalexpression',
		'operator': '!=',
		'op1': variableExpression,
		'op2': MicrographQL.parseFilter(predicate, filterVariable, value)}
    } else if(operator === '$lteq') {
	return {'token': 'expression',
		'expressionType': 'relationalexpression',
		'operator': '<=',
		'op1': variableExpression,
		'op2': MicrographQL.parseFilter(predicate, filterVariable, value)}
    } else if(operator === '$gteq') {
	return {'token': 'expression',
		'expressionType': 'relationalexpression',
		'operator': '>=',
		'op1': variableExpression,
		'op2': MicrographQL.parseFilter(predicate, filterVariable, value)}
    } else if(operator === '$not') {
	return {'token': 'expression',
		'expressionType': 'unaryexpression',
		'unaryexpression': '!',
		'expression': MicrographQL.parseFilter(predicate, filterVariable, value)}
    } else if(operator === '$like') {
	return {'token': 'expression',
		'expressionType': 'regex',
		'text': variableExpression,
		'pattern': (typeof(value) === 'object' && value.constructor === RegExp) ? 
		MicrographQL.parseFilter(predicate, filterVariable, value.source) : 
		MicrographQL.parseFilter(predicate, filterVariable, value)}
    } else if(operator === '$and') {
	if(typeof(value) !== 'object' || value.constructor !== Array) {
	    value = [value];
	}
	var acum = [];
	for(var i=0; i<value.length; i++) {
	    acum.push(MicrographQL.parseFilter(predicate, filterVariable, value[i]));
	}
	return {"token": "expression",
                "expressionType": "conditionaland",
	        'operands': acum };
    } else if(operator === '$or') {
	if(typeof(value) !== 'object' || value.constructor !== Array) {
	    value = [value];
	}
	var acum = [];
	for(var i=0; i<value.length; i++) {
	    acum.push(MicrographQL.parseFilter(predicate, filterVariable, value[i]));
	}
	return {"token": "expression",
                "expressionType": "conditionalor",
	        'operands': acum };
    } else {
	if(typeof(expression) === "object" && expression['$id'] != null) {
	     return {
                 "token": "expression",
                 "expressionType": "irireforfunction",
                 "iriref": MicrographQL.parseURI(MicrographQL.base_uri+expression['$id'])
	     };
	} else {
	    var literal =  MicrographQL.parseLiteral(expression);
	    if(literal.type && literal.type === "http://www.w3.org/2001/XMLSchema#float") {
		return {"token": "expression",
			"expressionType": "atomic",
			"primaryexpression": "numericliteral",
			'value': literal};
	    } else 	if(literal.type && literal.type === "http://www.w3.org/2001/XMLSchema#boolean") {
		return {"token": "expression",
			"expressionType": "atomic",
			"primaryexpression": "booleanliteral",
			'value': literal};
	    } else {
		return {"token": "expression",
			"expressionType": "atomic",
			"primaryexpression": "rdfliteral",
			'value': literal};
	    }
	}
    }
};

MicrographQL.nextVariable = function() {
    var variable = "id"+MicrographQL.counter;
    MicrographQL.counter++;
    return variable;
};

MicrographQL.isUri = function(value) {
    return value && value.match(/[a-z]+:\//);
}

MicrographQL.parseURI = function(value) {
    if(MicrographQL.isUri(value)) {
	return {'token':'uri', 'value':value, 'suffix': null, 'prefix': null}
    } else {
	if(value == null) {
	    var value = MicrographQL.base_uri+"object"+MicrographQL.counter;
	    MicrographQL.counter++;
	}
	
	return {'token':'uri', 'value': value, 'suffix': null, 'prefix': null};
    }
};

MicrographQL.parseLiteral = function(value) {
    if(typeof(value) === 'string') {
	return {'token': 'literal', 'value': value, 'lang':null, 'type':null };
    } else if(typeof(value) === 'boolean') {
	return {'token': 'literal', 'value': ""+value, 'type':'http://www.w3.org/2001/XMLSchema#boolean', 'lang':null};
    } else if(typeof(value) === 'number') {
	return {'token': 'literal', 'value': ""+value, 'type':'http://www.w3.org/2001/XMLSchema#float', 'lang':null};
    } else if(typeof(value) === 'object' && value.constructor === Date) {
	return {'token': 'literal', 'value': Utils.iso8601(value), 'type':'http://www.w3.org/2001/XMLSchema#dateTime', 'lang':null};
    } else {
	throw "Error parsing object value: "+value;
    }
};

MicrographQL.parseJSON = function(object, graph) {
    var context = MicrographQL.newContext(false);
    result = MicrographQL.parseBGP(object, context, true, graph);
    quads = context.quads.concat(result[1]);
    return quads;
};

MicrographQL.parseQuery = function(object) {
    var context = MicrographQL.newContext(true);
    result = MicrographQL.parseBGP(object, context, true);
    var subject = result[0];

    var filters = [{'token': 'filter',
		    'value':{'token':'expression',
			     'expressionType': 'conditionaland',
			     'operands':[]}}]

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

    var dataset = {'named':[], 'implicit':[{suffix: null, prefix: null, 'token':'uri', 'value':'https://github.com/antoniogarrote/rdfstore-js#default_graph'}]}
    
    unit['projection'] = projection;
    unit['dataset'] = dataset;


    return new MicrographQuery({'query':{ 'prologue': prologue,
					  'kind': 'query',
					  'token': 'query',
					  'units':[unit]},
				'varsMap': context.varsMap,
			        'topLevel': context.topLevel,
			        'subject': subject});
		 
};

MicrographQL.parseBGP = function(expression, context, topLevel, graph) {
    var subject = null;
    var quads = [];
    var nextVariable = MicrographQL.nextVariable();
    var filterCounter = 0;
    if(expression['$id'] != null || !context.isQuery) {
	if(expression['$id'] != null)
	    expression['$id'] = MicrographQL.base_uri+expression['$id'] ;
	subject = MicrographQL.parseURI(expression['$id']);
	context.varsMap[nextVariable] = subject.value;
    } else {
	subject = {'token':'var', 'value':nextVariable};
	context.variables.push(subject);
	context.varsMap[nextVariable] = nextVariable;
    }

    if(topLevel)
	context.topLevel = nextVariable;

    
    var predicate, object, result;
    for(var p in expression) {
	if(expression[p] != null) {
	    if(p!=='$id') {
		var predicateUri = p;
		if(p === '$type') {
		    predicateUri = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";
		}

		predicate = MicrographQL.parseURI(predicateUri);

		// check if the object is a filter
		var isFilter = false;
		propsCounter = 0;
		if(typeof(expression[p]) === 'object' && expression[p].constructor !== Array) {
		    for(var prop in expression[p]) {
			propsCounter++;
			isFilter = (prop[0] === '$' && prop[0] !== '$id');
		    }
		    isFilter = isFilter && propsCounter === 1;
		} else {
		    isFilter = false;
		}

		// process the object
		if(isFilter) {
		    var filterVariable = nextVariable+'f'+filterCounter;
		    filterCounter++;
		    var variableToken = {'token':'var', 'value': filterVariable};
		    var filterString = MicrographQL.parseFilter(predicate,variableToken, expression[p]);
		    context.variables.push(variableToken);
		    context.varsMap[filterVariable] = nextVariable;
		    context.filtersMap[filterVariable] = filterString;
		    var quad = {'subject':subject, 'predicate':predicate, 'object':variableToken};
		    if(graph != null)
			quad['graph'] = graph;
		    quads.push(quad);
		} else if(typeof(expression[p]) === 'string' || 
			  (typeof(expression[p]) === 'object' && expression[p].constructor === Date) || 
			  typeof(expression[p]) === 'number' ||
			  typeof(expression[p]) === 'boolean') {
		    object = MicrographQL.parseLiteral(expression[p]);
		    var quad = {'subject':subject, 'predicate':predicate, 'object':object};
		    if(graph != null)
			quad['graph'] = graph;
		    quads.push(quad);
		} else {
		    if(expression[p].constructor == Array) {
			for(var i=0; i<expression[p].length; i++) {
			    // @todo check if this is a literal instead of an object
			    result = MicrographQL.parseBGP(expression[p][i], context, false, graph);
			    object = result[0];
			    context.quads = context.quads.concat(result[1]);
			    quad = {'subject':subject, 'predicate':predicate, 'object':object};
			    if(graph != null)
				quad['graph'] = graph;
			    quads.push(quad);
			}
		    } else {
			result = MicrographQL.parseBGP(expression[p], context, false, graph);
			object = result[0];
			context.quads = context.quads.concat(result[1]);
			var quad = {'subject':subject, 'predicate':predicate, 'object':object};
			if(graph != null)
			    quad['graph'] = graph;
			quads.push(quad);
		    }
		}
	    }
	}
    }

    if(context.isQuery) {
	predicate = {'token':'var', 'value':nextVariable+'p'};
	object = {'token':'var', 'value':nextVariable+'o'};
	context.variables.push(predicate);
	context.variables.push(object);
	context.varsMap[predicate.value] = nextVariable;
	context.varsMap[object.value] = nextVariable;
	quad = {'subject':subject, 'predicate':predicate, 'object':object};
	if(graph != null)
	    quad['graph'] = graph;
	quads.push(quad);
    }

    return [subject, quads];
};

// Store
exports.Micrograph = function(options, callback) {
    if(options['treeOrder'] == null) {
        options['treeOrder'] = 15;
    }

    var that = this;
    new Lexicon.Lexicon(function(lexicon){
        if(options['overwrite'] === true) {
            // delete lexicon values
            lexicon.clear();
        }
        new QuadBackend.QuadBackend(options, function(backend){
            if(options['overwrite'] === true) {
                // delete index values
                backend.clear();
            }
            options.backend = backend;
            options.lexicon =lexicon;
            that.engine = new QueryEngine.QueryEngine(options);      

	    that.engine.abstractQueryTree.oldParseQueryString = that.engine.abstractQueryTree.parseQueryString
	    that.engine.abstractQueryTree.parseQueryString = function(toParse) {
		//console.log(sys.inspect(toParse, true, 20));
		if(typeof(toParse) === 'string') {
		    return this.oldParseQueryString(toParse);
		} else {
		    return toParse;
		}
	    }

            if(callback) {
                callback(that);
            }
        });
    },options['name']);
};
var Micrograph = exports.Micrograph;

Micrograph.create = function() {
    var callback, options;

    if(arguments.length == 0) {
	throw "A callback function and an optional options map must be provided";
    } else if(arguments.length == 1) {
	options = {'treeOrder': 15, 'name': 'micrograph_instance', 'overwrite':false};
	callback = arguments[0];
    } else {
	options = arguments[0];
	callback = arguments[1];
    }
    
    new Micrograph(options, callback);
};


Micrograph.prototype.execute = function(query, callback) {
    this.engine.execute(query,callback);

};

Micrograph.prototype.where = function(query) {
    var queryObj = new MicrographQL.parseQuery(query);
    queryObj.setStore(this);
    queryObj.setKind('all');
    return queryObj;
};

Micrograph.prototype.load = function() {
    var mediaType;
    var data;
    var graph;
    var callback;

    if(arguments.length == 2) {
	if(MicrographQL.isUri(typeof(arguments[0]) === "string" && arguments[0])) {
	    mediaType = "remote";
	} else {
	    mediaType = "application/json";
	}

        graph = {'token':'uri', 'value': this.engine.lexicon.defaultGraphUri};

	data = arguments[0];
	callback = arguments[1];
    } else {
	throw "The data or URI to load and a callback must be provided";
    }

    if(mediaType === 'remote') {
        data = this.rdf.createNamedNode(data);
        var query = "LOAD <"+data.valueOf()+"> INTO GRAPH <"+graph.valueOf()+">";

        this.engine.execute(query, callback);
    } else {
	if(typeof(data) === "object") {
	    if(data.constructor !== Array) {
		data = [data];
	    }
	    var quads;
	    var that = this;
	    Utils.repeat(0,data.length, function(k,env) {
		var floop = arguments.callee;
		quads = MicrographQL.parseJSON(data[env._i],graph);
		that.engine.batchLoad(quads,function(){ 
		    k(floop,env); 
		});
	    }, function() {
		callback();;
	    });
	} else {

            var parser = this.engine.rdfLoader.parsers[mediaType];

            var that = this;

            this.engine.rdfLoader.tryToParse(parser, {'token':'uri', 'value':graph.valueOf()}, data, function(success, quads) {
		if(success) {
                    that.engine.batchLoad(quads,callback);
		} else {
                    callback(success, quads);
		}
            });
	}
    }

}