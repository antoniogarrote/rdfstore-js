// exports
exports.AbstractQueryTree = {};
var AbstractQueryTree = exports.AbstractQueryTree;

// imports
var SparqlParser = require("./sparql_parser").SparqlParser;
var Utils = require("./../../js-trees/src/utils").Utils;

/**
 * @doc
 *
 * Based on <http://www.w3.org/2001/sw/DataAccess/rq23/rq24-algebra.html>
 * W3C's note
 */
AbstractQueryTree.AbstractQueryTree = function(params) {
};

AbstractQueryTree.AbstractQueryTree.prototype.parseQueryString = function(query_string) {
    var syntaxTree  = SparqlParser.parser.parse(query_string);
    return syntaxTree;
};

AbstractQueryTree.AbstractQueryTree.prototype.parseExecutableUnit = function(executableUnit) {
    if(executableUnit.kind === 'select') {
        return this.parseSelect(executableUnit);
    } else if(executableUnit.kind === 'ask') {
        return this.parseSelect(executableUnit);        
    } else if(executableUnit.kind === 'modify') {
        return this.parseSelect(executableUnit);
    } else if(executableUnit.kind === 'construct') {
        return this.parseSelect(executableUnit);        
    } else if(executableUnit.kind === 'insertdata') {
        return this.parseInsertData(executableUnit);        
    } else if(executableUnit.kind === 'deletedata') {
        return this.parseInsertData(executableUnit);        
    } else if(executableUnit.kind === 'load') {
        return executableUnit;
    } else if(executableUnit.kind === 'clear') {
        return executableUnit;
    } else if(executableUnit.kind === 'drop') {
        return executableUnit;
    } else if(executableUnit.kind === 'create') {
        return executableUnit;
    } else {
        throw new Error('unknown executable unit: ' + executableUnit.kind);
    }
};

AbstractQueryTree.AbstractQueryTree.prototype.parseSelect = function(syntaxTree){

    if(syntaxTree == null) {
        console.log("error parsing query");
        return null;
    } else {
        var env = { freshCounter: 0 };
        syntaxTree.pattern = this.build(syntaxTree.pattern, env);
        return syntaxTree;
    }
};

AbstractQueryTree.AbstractQueryTree.prototype.parseInsertData = function(syntaxTree){
    if(syntaxTree == null) {
        console.log("error parsing query");
        return null;
    } else {
        return syntaxTree;
    }
};

AbstractQueryTree.AbstractQueryTree.prototype.build = function(node, env) {
    if(node.token === 'groupgraphpattern') {
        return this._buildGroupGraphPattern(node, env);
    } else if (node.token === 'basicgraphpattern') {
        var bgp = { kind: 'BGP',
                    value: node.triplesContext };
	//console.log("pre1");
	bgp = AbstractQueryTree.translatePathExpressionsInBGP(bgp, env);
	//console.log("translation");
	//console.log(sys.inspect(bgp,true,20));	
	return bgp;
    } else if (node.token === 'graphunionpattern') {
        var a = this.build(node.value[0],env);
        var b = this.build(node.value[1],env);

        return { kind: 'UNION',
                 value: [a,b] };
    } else if(node.token === 'graphgraphpattern') {
        var c = this.build(node.value, env);
        return { kind: 'GRAPH',
                 value: c,
                 graph: node.graph };
    } else {
        throw new Error("not supported token in query:"+node.token);
    }
};

AbstractQueryTree.translatePathExpressionsInBGP = function(bgp, env) {
    var pathExpression,nextTriple,beforeToLink;
    var before = [], rest, bottomJoin;
    for(var i=0; i<bgp.value.length; i++) {
	if(bgp.value[i].predicate && bgp.value[i].predicate.token === 'path') {
	    //console.log("FOUND A PATH");
	    pathExpression = bgp.value[i];
	    rest = bgp.value.slice(i+1);
	    var bgpTransformed = AbstractQueryTree.translatePathExpression(pathExpression, env);
	    var optionalPattern = null;
	    //console.log("BACK FROM TRANSFORMED");
	    if(bgpTransformed.kind === 'BGP') {
		before = before.concat(bgpTransformed.value);
	    } else if(bgpTransformed.kind === 'ZERO_OR_MORE_PATH' || bgpTransformed.kind === 'ONE_OR_MORE_PATH'){
		//console.log("BEFORE");
		//console.log(bgpTransformed);
		    

		if(before.length > 0) {
		    bottomJoin =  {kind: 'JOIN',
				   lvalue: {kind: 'BGP', value:before},
				   rvalue: bgpTransformed};
		} else {
		    bottomJoin = bgpTransformed;
		}

		
		if(bgpTransformed.kind === 'ZERO_OR_MORE_PATH') {
		    if(bgpTransformed.y.token === 'var' && bgpTransformed.y.value.indexOf("fresh:")===0 &&
		       bgpTransformed.x.token === 'var' && bgpTransformed.x.value.indexOf("fresh:")===0) {
			//console.log("ADDING EXTRA PATTERN 1)");
			for(var j=0; j<bgp.value.length; j++) {
		   	    //console.log(bgp.value[j]);
		   	    if(bgp.value[j].object && bgp.value[j].object.token === 'var' && bgp.value[j].object.value === bgpTransformed.x.value) {
		   		//console.log(" YES 1)");
		   		optionalPattern = Utils.clone(bgp.value[j]);
		   		optionalPattern.object = bgpTransformed.y;
		   	    }
			}
		    } else if(bgpTransformed.y.token === 'var' && bgpTransformed.y.value.indexOf("fresh:")===0) {
			//console.log("ADDING EXTRA PATTERN 2)");
			var from, to;
			for(var j=0; j<bgp.value.length; j++) {
		   	    //console.log(bgp.value[j]);
		   	    if(bgp.value[j].subject && bgp.value[j].subject.token === 'var' && bgp.value[j].subject.value === bgpTransformed.y.value) {
		   		//console.log(" YES 2)");
		   		optionalPattern = Utils.clone(bgp.value[j]);
		   		optionalPattern.subject = bgpTransformed.x;
		   	    }
			}
		    }
		}

		if(rest.length >0) {
		    //console.log("(2a)")
		    var rvalueJoin = AbstractQueryTree.translatePathExpressionsInBGP({kind: 'BGP', value: rest}, env);
		    //console.log("got rvalue");
		    if(optionalPattern != null) {
			var optionals = before.concat([optionalPattern]).concat(rest);
			return { kind: 'UNION',
				 value: [{ kind: 'JOIN',
					   lvalue: bottomJoin,
					   rvalue: rvalueJoin },
					 {kind: 'BGP',
					  value: optionals}] };
		    } else {
			return { kind: 'JOIN',
				 lvalue: bottomJoin,
				 rvalue: rvalueJoin };
		    }
		} else {
		    //console.log("(2b)")
		    return bottomJoin;
		}

	    } else {
		// @todo ????
		return bgpTransformed;
	    }
	} else {
	    before.push(bgp.value[i]);
	}
    }

    //console.log("returning");
    bgp.value = before;
    return bgp;
};


AbstractQueryTree.translatePathExpression  = function(pathExpression, env) {
    // add support for different path patterns
    if(pathExpression.predicate.kind === 'element') {
	// simple paths, maybe modified
	if(pathExpression.predicate.modifier === '+') {
	    pathExpression.predicate.modifier = null;
	    var expandedPath = AbstractQueryTree.translatePathExpression(pathExpression, env);
	    return {kind: 'ONE_OR_MORE_PATH',
		    path: expandedPath,
		    x: pathExpression.subject,
		    y: pathExpression.object};
	} else if(pathExpression.predicate.modifier === '*') {
	    pathExpression.predicate.modifier = null;
	    var expandedPath = AbstractQueryTree.translatePathExpression(pathExpression, env);
	    return {kind: 'ZERO_OR_MORE_PATH',
	     	    path: expandedPath,
                    x: pathExpression.subject,
		    y: pathExpression.object};
	} else {
	    pathExpression.predicate = pathExpression.predicate.value;
	    return {kind: 'BGP', value: [pathExpression]};
	}
    } else if(pathExpression.predicate.kind === 'sequence') {
	var currentSubject = pathExpression.subject;
	var lastObject = pathExpression.object;
	var currentGraph = pathExpression.graph;
	var nextObject, chain;
	var restTriples = [];
	for(var i=0; i< pathExpression.predicate.value.length; i++) {
	    if(i!=pathExpression.predicate.value.length-1) {
		nextObject = {
		    token: "var",
		    value: "fresh:"+env.freshCounter
		};
		env.freshCounter++;
	    } else {
		nextObject = lastObject;
	    }

	    // @todo
	    // what if the predicate is a path with
	    // '*'? same fresh va in subject and object??
	    chain = {
		subject: currentSubject,
		predicate: pathExpression.predicate.value[i],
		object: nextObject
	    };
	
	    if(currentGraph != null)
		chain.graph = Utils.clone(currentGraph);
	    
	    restTriples.push(chain);

	    if(i!=pathExpression.predicate.value.length-1)
		currentSubject = Utils.clone(nextObject);;
	}
	var bgp = {kind: 'BGP', value: restTriples};
	//console.log("BEFORE (1):");
	//console.log(bgp);
	//console.log("--------------");
	return AbstractQueryTree.translatePathExpressionsInBGP(bgp, env);
    }
};

AbstractQueryTree.AbstractQueryTree.prototype._buildGroupGraphPattern = function(node, env) {
    var f = (node.filters || []);
    var g = {kind: "EMPTY_PATTERN"};

    for(var i=0; i<node.patterns.length; i++) {
        var pattern = node.patterns[i];
        if(pattern.token === 'optionalgraphpattern') {
            var parsedPattern = this.build(pattern.value,env);
            if(parsedPattern.kind === 'FILTER') {
                g =  { kind:'LEFT_JOIN',
                       lvalue: g,
                       rvalue: parsedPattern.value,
                       filter: parsedPattern.filter };
            } else {
                g = { kind:'LEFT_JOIN',
                      lvalue: g,
                      rvalue: parsedPattern,
                      filter: true };
            }
        } else {
            var parsedPattern = this.build(pattern,env);
            if(g.kind == "EMPTY_PATTERN") {
                g = parsedPattern;
            } else {
                g = { kind: 'JOIN',
                      lvalue: g,
                      rvalue: parsedPattern };
            }
        }
    }

    if(f.length != 0) {
        if(g.kind === 'EMPTY_PATTERN') {
            return { kind: 'FILTER',
                     filter: f,
                     value: g};
        } else if(g.kind === 'LEFT_JOIN' && g.filter === true) {
            return { kind: 'FILTER',
                     filter: f,
                     value: g};

//            g.filter = f;
//            return g;
        } else if(g.kind === 'LEFT_JOIN') {
            return { kind: 'FILTER',
                     filter: f,
                     value: g};
        } else if(g.kind === 'JOIN') {
            return { kind: 'FILTER',
                     filter: f,
                     value: g};
        } else if(g.kind === 'UNION') {
            return { kind: 'FILTER',
                     filter: f,
                     value: g};
        } else if(g.kind === 'GRAPH') {
            return { kind: 'FILTER',
                     filter: f,
                     value: g};
        } else if(g.kind === 'BGP') {
            return { kind: 'FILTER',
                     filter: f,
                     value: g};
        } else {
            throw new Error("Unknow kind of algebra expression: "+ g.kind);
        }
    } else {
        return g;
    }
};

/**
 * Collects basic triple pattern in a complex SPARQL AQT
 */
AbstractQueryTree.AbstractQueryTree.prototype.collectBasicTriples = function(aqt, acum) {
    if(acum == null) {
        acum = [];
    }

    if(aqt.kind === 'select') {
        acum = this.collectBasicTriples(aqt.pattern,acum);
    } else if(aqt.kind === 'BGP') {
        acum = acum.concat(aqt.value);
    } else if(aqt.kind === 'ZERO_OR_MORE_PATH') {
	acum = this.collectBasicTriples(aqt.path);
    } else if(aqt.kind === 'UNION') {
        acum = this.collectBasicTriples(aqt.value[0],acum);
        acum = this.collectBasicTriples(aqt.value[1],acum);
    } else if(aqt.kind === 'GRAPH') {
        acum = this.collectBasicTriples(aqt.value,acum);
    } else if(aqt.kind === 'LEFT_JOIN' || aqt.kind === 'JOIN') {
        acum = this.collectBasicTriples(aqt.lvalue, acum);
        acum = this.collectBasicTriples(aqt.rvalue, acum);
    } else if(aqt.kind === 'FILTER') {
        acum = this.collectBasicTriples(aqt.value, acum);
    } else if(aqt.kind === 'construct') {
        acum = this.collectBasicTriples(aqt.pattern,acum);
    } else if(aqt.kind === 'EMPTY_PATTERN') {
        // nothing
    } else {
        throw "Unknown pattern: "+aqt.kind;
    }

    return acum;
};

/**
 * Replaces bindings in an AQT
 */
AbstractQueryTree.AbstractQueryTree.prototype.bind = function(aqt, bindings) {
    if(aqt.graph != null && aqt.graph.token && aqt.graph.token === 'var' &&
       bindings[aqt.graph.value] != null) {
        aqt.graph = bindings[aqt.graph.value];
    }
    if(aqt.filter != null) {
        var acum = [];
        for(var i=0; i< aqt.filter.length; i++) {
            aqt.filter[i].value = this._bindFilter(aqt.filter[i].value, bindings);
            acum.push(aqt.filter[i]);
        }
        aqt.filter = acum;
    }
    if(aqt.kind === 'select') {
        aqt.pattern = this.bind(aqt.pattern, bindings);
        //acum = this.collectBasicTriples(aqt.pattern,acum);
    } else if(aqt.kind === 'BGP') {
        aqt.value = this._bindTripleContext(aqt.value, bindings);
        //acum = acum.concat(aqt.value);
    } else if(aqt.kind === 'ZERO_OR_MORE_PATH') {
        aqt.path = this._bindTripleContext(aqt.path, bindings);
	if(aqt.x && aqt.x.token === 'var' && bindings[aqt.x.value] != null) {
	    aqt.x = bindings[aqt.x.value];
	}
	if(aqt.y && aqt.y.token === 'var' && bindings[aqt.y.value] != null) {
	    aqt.y = bindings[aqt.y.value];
	}
    } else if(aqt.kind === 'UNION') {
        aqt.value[0] = this.bind(aqt.value[0],bindings);
        aqt.value[1] = this.bind(aqt.value[1],bindings);
    } else if(aqt.kind === 'GRAPH') {
        aqt.value = this.bind(aqt.value,bindings);
    } else if(aqt.kind === 'LEFT_JOIN' || aqt.kind === 'JOIN') {
        aqt.lvalue = this.bind(aqt.lvalue, bindings);
        aqt.rvalue = this.bind(aqt.rvalue, bindings);
    } else if(aqt.kind === 'FILTER') {
	aqt.filter = this._bindFilter(aqt.filter[i].value, bindings);
    } else if(aqt.kind === 'EMPTY_PATTERN') {
        // nothing
    } else {
        throw "Unknown pattern: "+aqt.kind;
    }

    return aqt;
};

AbstractQueryTree.AbstractQueryTree.prototype._bindTripleContext = function(triples, bindings) {
    for(var i=0; i<triples.length; i++) {
        delete triples[i]['graph'];
        delete triples[i]['variables'];
        for(var p in triples[i]) {
            var comp = triples[i][p];
            if(comp.token === 'var' && bindings[comp.value] != null) {
                triples[i][p] = bindings[comp.value];
            }
        }
    }

    return triples;
};


AbstractQueryTree.AbstractQueryTree.prototype._bindFilter = function(filterExpr, bindings) {
    if(filterExpr.expressionType != null) {
        var expressionType = filterExpr.expressionType;
        if(expressionType == 'relationalexpression') {
            filterExpr.op1 = this._bindFilter(filterExpr.op1, bindings);
            filterExpr.op2 = this._bindFilter(filterExpr.op2, bindings);
        } else if(expressionType == 'conditionalor' || expressionType == 'conditionaland') {
            for(var i=0; i< filterExpr.operands.length; i++) {
                filterExpr.operands[i] = this._bindFilter(filterExpr.operands[i], bindings);
            }
        } else if(expressionType == 'additiveexpression') {
            filterExpr.summand = this._bindFilter(filterExpr.summand, bindings);
            for(var i=0; i<filterExpr.summands.length; i++) {
                filterExpr.summands[i].expression = this._bindFilter(filterExpr.summands[i].expression, bindings);            
            }
        } else if(expressionType == 'builtincall') {
            for(var i=0; i<filterExpr.args.length; i++) {
                filterExpr.args[i] = this._bindFilter(filterExpr.args[i], bindings);
            }
        } else if(expressionType == 'multiplicativeexpression') {
            filterExpr.factor = this._bindFilter(filterExpr.factor, bindings);
            for(var i=0; i<filterExpr.factors.length; i++) {
                filterExpr.factors[i].expression = this._bindFilter(filterExpr.factors[i].expression, bindings);            
            }
        } else if(expressionType == 'unaryexpression') {
            filterExpr.expression = this._bindFilter(filterExpr.expression, bindings);
        } else if(expressionType == 'irireforfunction') {
            for(var i=0; i<filterExpr.factors.args; i++) {
                filterExpr.args[i] = this._bindFilter(filterExpr.args[i], bindings);            
            }
        } else if(expressionType == 'atomic') {        
            if(filterExpr.primaryexpression == 'var') {
                // lookup the var in the bindings
                if(bindings[filterExpr.value.value] != null) {
                    var val = bindings[filterExpr.value.value];
                    if(val.token === 'uri') {
                        filterExpr.primaryexpression = 'iri';
                    } else {
                        filterExpr.primaryexpression = 'literal';
                    }
                    filterExpr.value = val;
                }
            }
        }
    }

    return filterExpr;
};

/**
 * Replaces terms in an AQT
 */
AbstractQueryTree.AbstractQueryTree.prototype.replace = function(aqt, from, to, ns) {
    if(aqt.graph != null && aqt.graph.token && aqt.graph.token === from.token && 
       aqt.graph.value == from.value) {
        aqt.graph = Utils.clone(to);
    }
    if(aqt.filter != null) {
        var acum = [];
        for(var i=0; i< aqt.filter.length; i++) {
            aqt.filter[i].value = this._replaceFilter(aqt.filter[i].value, from, to, ns);
            acum.push(aqt.filter[i]);
        }
        aqt.filter = acum;
    }
    if(aqt.kind === 'select') {
        aqt.pattern = this.replace(aqt.pattern, from, to, ns);
    } else if(aqt.kind === 'BGP') {
        aqt.value = this._replaceTripleContext(aqt.value, from, to, ns);
    } else if(aqt.kind === 'ZERO_OR_MORE_PATH') {
        aqt.path = this._replaceTripleContext(aqt.path, from,to, ns);
	if(aqt.x && aqt.x.token === from.token && aqt.value === from.value) {
	    aqt.x = Utils.clone(to);
	}
	if(aqt.y && aqt.y.token === from.token && aqt.value === from.value) {
	    aqt.y = Utils.clone(to);
	}
    } else if(aqt.kind === 'UNION') {
        aqt.value[0] = this.replace(aqt.value[0],from,to, ns);
        aqt.value[1] = this.replace(aqt.value[1],from,to, ns);
    } else if(aqt.kind === 'GRAPH') {
        aqt.value = this.replace(aqt.value,from,to);
    } else if(aqt.kind === 'LEFT_JOIN' || aqt.kind === 'JOIN') {
        aqt.lvalue = this.replace(aqt.lvalue, from, to, ns);
        aqt.rvalue = this.replace(aqt.rvalue, from, to, ns);
    } else if(aqt.kind === 'FILTER') {
        aqt.value = this._replaceFilter(aqt.value, from,to, ns);
    } else if(aqt.kind === 'EMPTY_PATTERN') {
        // nothing
    } else {
        throw "Unknown pattern: "+aqt.kind;
    }

    return aqt;
};

AbstractQueryTree.AbstractQueryTree.prototype._replaceTripleContext = function(triples, from, to, ns) {
    for(var i=0; i<triples.length; i++) {
        for(var p in triples[i]) {
            var comp = triples[i][p];
	    if(comp.token === 'var' && from.token === 'var' && comp.value === from.value) {
		triples[i][p] = to;
	    } else if(comp.token === 'blank' && from.token === 'blank' && comp.value === from.value) {
		triples[i][p] = to;
	    } else {
		if((comp.token === 'literal' || comp.token ==='uri') && 
		   (from.token === 'literal' || from.token ==='uri') && 
		   comp.token === from.token && Utils.lexicalFormTerm(comp,ns)[comp.token] === Utils.lexicalFormTerm(from,ns)[comp.token]) {
                    triples[i][p] = to;
		}
	    }
        }
    }

    return triples;
};


AbstractQueryTree.AbstractQueryTree.prototype._replaceFilter = function(filterExpr, from, to, ns) {
    if(filterExpr.expressionType != null) {
        var expressionType = filterExpr.expressionType;
        if(expressionType == 'relationalexpression') {
            filterExpr.op1 = this._replaceFilter(filterExpr.op1, from, to, ns);
            filterExpr.op2 = this._replaceFilter(filterExpr.op2, from, to, ns);
        } else if(expressionType == 'conditionalor' || expressionType == 'conditionaland') {
            for(var i=0; i< filterExpr.operands.length; i++) {
                filterExpr.operands[i] = this._replaceFilter(filterExpr.operands[i], from, to, ns);
            }
        } else if(expressionType == 'additiveexpression') {
            filterExpr.summand = this._replaceFilter(filterExpr.summand, from, to, ns);
            for(var i=0; i<filterExpr.summands.length; i++) {
                filterExpr.summands[i].expression = this._replaceFilter(filterExpr.summands[i].expression, from, to, ns);            
            }
        } else if(expressionType == 'builtincall') {
            for(var i=0; i<filterExpr.args.length; i++) {
                filterExpr.args[i] = this._replaceFilter(filterExpr.args[i], from, to, ns);
            }
        } else if(expressionType == 'multiplicativeexpression') {
            filterExpr.factor = this._replaceFilter(filterExpr.factor, from, to, ns);
            for(var i=0; i<filterExpr.factors.length; i++) {
                filterExpr.factors[i].expression = this._replaceFilter(filterExpr.factors[i].expression, from, to, ns);
            }
        } else if(expressionType == 'unaryexpression') {
            filterExpr.expression = this._replaceFilter(filterExpr.expression, from, to, ns);
        } else if(expressionType == 'irireforfunction') {
            for(var i=0; i<filterExpr.factors.args; i++) {
                filterExpr.args[i] = this._replaceFilter(filterExpr.args[i], from, to, ns);
            }
        } else if(expressionType == 'atomic') {        
	    var val = null;
            if(filterExpr.primaryexpression == from.token && filterExpr.value == from.value) {
                    val = to.value;                
            } else if(filterExpr.primaryexpression == 'iri' && from.token == 'uri' && filterExpr.value == from.value) {
                val = to.value;                
	    }

	
	    if(val != null) {
                if(to.token === 'uri') {
                    filterExpr.primaryexpression = 'iri';
                } else {
                    filterExpr.primaryexpression = to.token;
                }
                filterExpr.value = val;
	    }
        }
    }

    return filterExpr;
};

AbstractQueryTree.AbstractQueryTree.prototype.treeWithUnion = function(aqt) {
    if(aqt == null)
	return false;
    if(aqt.kind == null)
	return false;
    if(aqt.kind === 'select') {
        return this.treeWithUnion(aqt.pattern);
    } else if(aqt.kind === 'BGP') {
        return this.treeWithUnion(aqt.value);
    } else if(aqt.kind === 'ZERO_OR_MORE_PATH') {
	return false;
    } else if(aqt.kind === 'UNION') {
	console.log("UNION!!");
	if(aqt.value[0].value != null && aqt.value[0].value.variables != null &&
	   aqt.value[1].value != null && aqt.value[1].value.variables != null) {
	    console.log("COMPARING:"+aqt.value[0].variables.join("/"));
	    console.log("VS "+aqt.values[1].variables.join("/"));
	    if(aqt.value[0].variables.join("/") === aqt.values[1].variables.join("/")) {
		if(this.treeWithUnion(aqt.value[0]))
		    return true;
		else
		    return this.treeWithUnion(aqt.value[1]);
	    }
	} else {
	    return true;	    
	}
    } else if(aqt.kind === 'GRAPH') {
	return false;
    } else if(aqt.kind === 'LEFT_JOIN' || aqt.kind === 'JOIN') {
        var leftUnion  = this.treeWithUnion(aqt.lvalue);
	if(leftUnion)
	    return true;
	else
            this.treeWithUnion(aqt.rvalue);
    } else if(aqt.kind === 'FILTER') {
	return false;
    } else if(aqt.kind === 'EMPTY_PATTERN') {
	return false;
    } else {
	return false;
    }
};
