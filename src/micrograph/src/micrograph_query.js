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
exports.MicrographQuery = function(pattern) {
    this.query = pattern.query;
    this.varsMap = pattern.varsMap;
    this.topLevel = pattern.topLevel;
    this.subject = pattern.subject;
    this.inverseMap = pattern.inverseMap;
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
	this.store.execute(this.query, function(success, results) {
	    console.log(results.length);
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
			    if(idp != that.varsMap[idp]) {
				// the URI was given in the query, not retrieved in results
				id = that.varsMap[idp]
				node = acum[id] || {};
				node['$id'] = id.split(MicrographQL.base_uri)[1];
			    } else {
				// the subject was a variable in the query, retrieve it from the query results
				id = result[idp].value;
				node = acum[id] || {};
			    }

			    if(idp === p) {
				isIDProperty = true;
			    }

			    if(idp === that.topLevel) {
				isTopLevel = true;
			    }
			}


			acum[id] = node;

			// check inverse links here
			// Check if the object is an inverse linked object
			if(that.inverseMap[idp] != null) {
			    for(var invProp in that.inverseMap[idp]) {
				var invLinkedTo = that.inverseMap[idp][invProp];
				if(results[i][invLinkedTo] != null) {
				    invLinkedTo = results[i][invLinkedTo];
				}

				var invLinkedNode = acum[invLinkedTo] || {};
				invLinkedNode['$id'] = invLinkedTo;
				acum[invLinkedTo] = invLinkedNode;
				if(node[invProp] == null) {
				    node[invProp] = invLinkedNode;
				} else if(node[invProp].constructor === Array) {
				    node[invProp].push(invLinkedNode);
				} else {
				    node[invProp] = [node[invProp], invLinkedNode];
				}
			    }
			    var predProp = predicate.split(MicrographQL.base_uri)[1];
			    if(that.inverseMap[object['$id']][predProp])
				object[predProp+'$in'] = node;
			}


			if(isTopLevel && addedToTopLevel[id] == null) {
			    topLevel.push(node);
			    addedToTopLevel[id] = true;
			}

			if(isIDProperty) {
			    // this is subject
			    node['$id'] = id.split(MicrographQL.base_uri)[1];
			} else {
			    object = result[idp+"o"];
			    var related;
			    if(object.token === "uri") {
				related = acum[object.value] || {};
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
		    that.callback(null);
		}
	    }
	});
    }
};

