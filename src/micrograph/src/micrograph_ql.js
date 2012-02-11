// exports
exports.MicrographQL = {};
var MicrographQL = exports.MicrographQL;

// imports
var AbstractQueryTree = require("./../../js-sparql-parser/src/abstract_query_tree").AbstractQueryTree;
var Utils = require("./../../js-trees/src/utils").Utils;

// Redefinitions
Utils.oldNormalizeUnicodeLiterals = Utils.normalizeUnicodeLiterals;
Utils.normalizeUnicodeLiterals = function(toNormalize) {
    if(typeof(toNormalize) === "string") {
	return Utils.oldNormalizeUnicodeLiterals(toNormalize);
    } else {
	return toNormalize;
    }
};


// QL
MicrographQL.base_uri = "http://rdfstore-js.org/micrographql/graph#";
MicrographQL.prefix = "mql";

MicrographQL.counter = 0;

MicrographQL.newContext = function(isQuery) {
    return {variables: [], isQuery:isQuery, quads:[], varsMap: {}, 
	    filtersMap: {}, inverseMap:{}};
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
		'op2': MicrographQL.parseFilter(predicate, filterVariable, value)};
    } else if(operator === '$lt') {
	return {'token': 'expression',
		'expressionType': 'relationalexpression',
		'operator': '<',
		'op1': variableExpression,
		'op2': MicrographQL.parseFilter(predicate, filterVariable, value)};
    } else if(operator === '$gt') {
	return {'token': 'expression',
		'expressionType': 'relationalexpression',
		'operator': '>',
		'op1': variableExpression,
		'op2': MicrographQL.parseFilter(predicate, filterVariable, value)};
    } else if(operator === '$neq') {
	return {'token': 'expression',
		'expressionType': 'relationalexpression',
		'operator': '!=',
		'op1': variableExpression,
		'op2': MicrographQL.parseFilter(predicate, filterVariable, value)};
    } else if(operator === '$lteq') {
	return {'token': 'expression',
		'expressionType': 'relationalexpression',
		'operator': '<=',
		'op1': variableExpression,
		'op2': MicrographQL.parseFilter(predicate, filterVariable, value)};
    } else if(operator === '$gteq') {
	return {'token': 'expression',
		'expressionType': 'relationalexpression',
		'operator': '>=',
		'op1': variableExpression,
		'op2': MicrographQL.parseFilter(predicate, filterVariable, value)};
    } else if(operator === '$not') {
	return {'token': 'expression',
		'expressionType': 'unaryexpression',
		'unaryexpression': '!',
		'expression': MicrographQL.parseFilter(predicate, filterVariable, value)};
    } else if(operator === '$like') {
	return {'token': 'expression',
		'expressionType': 'regex',
		'text': variableExpression,
		'pattern': (typeof(value) === 'object' && value.constructor === RegExp) ? 
		MicrographQL.parseFilter(predicate, filterVariable, value.source) : 
		MicrographQL.parseFilter(predicate, filterVariable, value)};
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
	return {'token':'uri', 'value':value, 'suffix': null, 'prefix': null};
    } else {
	if(value == null) {
	    value = MicrographQL.base_uri+"object"+MicrographQL.counter;
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
    var result = MicrographQL.parseBGP(object, context, true, graph);
    var quads = context.quads.concat(result[1]);
    return quads;
};


MicrographQL.parseBGP = function(expression, context, topLevel, graph) {
    var subject = null;
    var quads = [];
    var nextVariable = MicrographQL.nextVariable();
    var filterCounter = 0;
    if(expression['$id'] != null || !context.isQuery) {
	if(expression['$id'] == null) {
	    subject = MicrographQL.parseURI(null) // generates URI with next ID
	    if(expression['$id'] == null) 
		expression['$id'] = "object"+(MicrographQL.counter-1); // the previous ID

	} else {
	    if(expression['$id']['token'] ==='var') {
		// this node is an inverse relationship
		subject = expression['$id'];
	    } else {
		subject = MicrographQL.parseURI(MicrographQL.base_uri+expression['$id']);
	    }
	}

	context.varsMap[nextVariable] = subject.value;
    } else {
	subject = {'token':'var', 'value':nextVariable};
	context.variables.push(subject);
	context.varsMap[nextVariable] = nextVariable;
    }

    if(topLevel)
	context.topLevel = nextVariable;

    
    var predicate, object, result, linked, linkedId, inverseLinks, linkedProp;
    for(var p in expression) {
	if(expression[p] != null) {
	    if(p!=='$id') {
		if(p.indexOf("$in") == (p.length-3) && p.indexOf("$in") !== -1) {

		    // rewrite inverse properties
		    linked = expression[p];
		    linkedProp = p.split("$in")[0];

		    // this could also be $this eventually
		    if(typeof(expression[p]) === "string")
			linked = {'$id': expression[p]};
		    expression[p] = linked

		    var idInverseMap;
		    if(subject.token === 'uri') {
			invLinkedId = expression['$id'];
			idInverseMap = linkedId
		    } else {
			// unknown ID for this node, it is a variables
			invLinkedId = subject;			
			idInverseMap = invLinkedId.value
		    }

		    linked[linkedProp] = {'$id':invLinkedId};
		    result = MicrographQL.parseBGP(linked, context, false, graph);

		    inverseLinks = context.inverseMap[invLinkedId.value] || {};
		    context.inverseMap[invLinkedId.value] = inverseLinks;

		    if(result[0].token === 'uri') {
			inverseLinks[linkedProp] = result[0].value.split(MicrographQL.base_uri)[1];
		    } else {
			inverseLinks[linkedProp] = result[0].value;
		    }

		    context.quads = context.quads.concat(result[1]);
		} else {

		    var predicateUri = p;
		    if(p === '$type') {
			predicateUri = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";
		    }

		    predicate = MicrographQL.parseURI(predicateUri);

		    // check if the object is a filter
		    var isFilter = false;
		    var propsCounter = 0;
		    if(typeof(expression[p]) === 'object' && 
		       expression[p].constructor !== Array &&
		       expression[p]['$id'] == null) {
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
				var quad = {'subject':subject, 'predicate':predicate, 'object':object};
				if(graph != null)
				    quad['graph'] = graph;
				quads.push(quad);
			    }
			} else {
			    if(expression[p]['token'] === 'var') {
				var quad = {'subject':subject, 'predicate':predicate, 'object':expression[p]};
				if(graph != null)
				    quad['graph'] = graph;
				quads.push(quad);
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
	}
    }

    if(context.isQuery) {
	// @todo What to do if we don't wan to recover all the properties?
	// how can we retrieve the objects with value and associate them to
	// the results?
	// (maybe saving a copy of the property before executing the query?)
	predicate = {'token':'var', 'value':nextVariable+'p'};
	object = {'token':'var', 'value':nextVariable+'o'};
	context.variables.push(predicate);
	context.variables.push(object);
	context.varsMap[predicate.value] = nextVariable;
	context.varsMap[object.value] = nextVariable;
	var quad = {'subject':subject, 'predicate':predicate, 'object':object};
	if(graph != null)
	    quad['graph'] = graph;
	quads.push(quad);
    }

    return [subject, quads];
};