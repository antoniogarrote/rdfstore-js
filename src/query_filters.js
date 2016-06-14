var Utils = require('./utils');
var     _ = Utils;
var async = require('./utils');

QueryFilters = {};

var xmlSchema = "http://www.w3.org/2001/XMLSchema#";

QueryFilters.checkFilters = function(pattern, bindings, nullifyErrors, dataset, queryEnv, queryEngine, callback) {
    var filters = [];
    if (pattern.filter && typeof(pattern.filter) !== 'function')
        filters = pattern.filter;
    var nullified = [];
    if(filters==null || filters.length === 0 || pattern.length != null) {
        return callback(bindings);
    }

    async.eachSeries(filters, function(filter,k){
        QueryFilters.run(filter.value, bindings, nullifyErrors, dataset, queryEnv, queryEngine, function(filteredBindings){
            var acum = [];
            async.eachSeries(filteredBindings, function(filteredBinding,kk) {
                if(filteredBinding["__nullify__"]!=null) {
                    nullified.push(filteredBinding);
                } else {
                    acum.push(filteredBinding);
                }
                kk();
            },function(){
                bindings = acum;
                k();
            })
        });
    },function(){
        callback(bindings.concat(nullified))
    });
};

QueryFilters.boundVars = function(filterExpr) {
    if(filterExpr.expressionType != null) {
        var expressionType = filterExpr.expressionType;
        if(expressionType == 'relationalexpression') {
            var op1 = filterExpr.op1;
            var op2 = filterExpr.op2;
            return QueryFilters.boundVars(op1)+QueryFilters.boundVars(op2);
        } else if(expressionType == 'conditionalor' || expressionType == 'conditionaland') {
            var vars = [];
            for(var i=0; i< filterExpr.operands; i++) {
                vars = vars.concat(QueryFilters.boundVars(filterExpr.operands[i]));
            }
            return vars;
        } else if(expressionType == 'builtincall') {
            if(filterExpr.args == null) {
                return [];
            } else {
                var acum = [];
                for(var i=0; i< filterExpr.args.length; i++) {
                    acum = acum.concat(QueryFilters.boundVars(filterExpr.args[i]));
                }
                return acum;
            }
        } else if(expressionType == 'multiplicativeexpression') {
            var acum = QueryFilters.boundVars(filterExpr.factor);
            for(var i=0; i<filterExpr.factors.length; i++) {
                acum = acum.concat(QueryFilters.boundVars(filterExpr.factors[i].expression))
            }
            return acum;
        } else if(expressionType == 'additiveexpression') {
            var acum = QueryFilters.boundVars(filterExpr.summand);
            for(var i=0; i<filterExpr.summands.length; i++) {
                acum = acum.concat(QueryFilters.boundVars(filterExpr.summands[i].expression));
            }

            return acum;
        } else if(expressionType == 'regex') {
            var acum = QueryFilters.boundVars(filterExpr.expression1);
            return acum.concat(QueryFilters.boundVars(filterExpr.expression2));
        } else if(expressionType == 'unaryexpression') {
            return QueryFilters.boundVars(filterExpr.expression);
        } else if(expressionType == 'atomic') {
            if(filterExpr.primaryexpression == 'var') {
                return [filterExpr.value];
            } else {
                // numeric, literal, etc...
                return [];
            }
        }
    } else {
        console.log("ERROR");
        console.log(filterExpr);
        throw("Cannot find bound expressions in a no expression token");
    }
};

QueryFilters.run = function(filterExpr, bindings, nullifyFilters, dataset, env, queryEngine, callback) {
    queryEngine.copyDenormalizedBindings(bindings, env.outCache, function(denormBindings){
        var filteredBindings = [];
        _.eachSeries(_.range(bindings.length), function(i, k) {
            var thisDenormBindings = denormBindings[i];
            QueryFilters.runFilter(filterExpr, thisDenormBindings, queryEngine, dataset, env, function(ebv) {
                ebv = QueryFilters.ebv(ebv);
                if(QueryFilters.isEbvError(ebv)) {
                    if(nullifyFilters) {
                        var thisBindings = { __nullify__: true, bindings: bindings[i] };
                        filteredBindings.push(thisBindings);
                    }
                }
                else if(ebv === true) {
                    filteredBindings.push(bindings[i]);
                }
                else {
                    if(nullifyFilters) {
                        var thisBindings = { __nullify__: true, bindings: bindings[i] };
                        filteredBindings.push(bindings[i]);
                    }
                }
                k();
            })
        }, function() {
            callback(filteredBindings);
        })
    });
};

QueryFilters.collect = function(filterExpr, bindings, dataset, env, queryEngine, callback) {
    queryEngine.copyDenormalizedBindings(bindings, env.outCache, function(denormBindings) {
        var filteredBindings = [];
        _.eachSeries(_.range(denormBindings.length), function(i, k) {
            var thisDenormBindings = denormBindings[i];
            QueryFilters.runFilter(filterExpr, thisDenormBindings, queryEngine, dataset, env, function(ebv) {
                filteredBindings.push({ binding: bindings[i] });
                k();
            })
        }, function() {
            callback(filteredBindings);
        })
    });
};

QueryFilters.runDistinct = function(projectedBindings, projectionVariables) {
};

// @todo add more aggregation functions here
QueryFilters.runAggregator = function(aggregator, bindingsGroup, queryEngine, dataset, env, callback) {
    if(bindingsGroup == null || bindingsGroup.length === 0) {
        callback(QueryFilters.ebvError());
        return;
    } else if(aggregator.token === 'variable' && aggregator.kind == 'var') {
        callback(bindingsGroup[0][aggregator.value.value]);
        return;
    } else if(aggregator.token === 'variable' && aggregator.kind === 'aliased') {
        if(aggregator.expression.expressionType === 'atomic' && aggregator.expression.primaryexpression === 'var') {
            callback(bindingsGroup[0][aggregator.expression.value.value]);
            return;
        } else if(aggregator.expression.expressionType === 'aggregate') {
            if(aggregator.expression.aggregateType === 'max') {
                var max = null;
                _.eachSeries(bindingsGroup, function(bindings, k) {
                    QueryFilters.runFilter(aggregator.expression.expression, bindings, queryEngine, dataset, env, function(ebv) {
                        if(!QueryFilters.isEbvError(ebv)) {
                            if(max === null) {
                                max = ebv; k();
                            }
                            else {
                                QueryFilters.runLtFunction(max, ebv, undefined, function(result) {
                                  if(result === true) max = ebv;
                                  k();
                                })
                            }
                        }
                    })
                }, function() {
                  if(max === null) {
                      callback(QueryFilters.ebvError());
                      return;
                  }
                  else {
                      callback(max);
                      return;
                  }
                })
                /*for(var i=0; i< bindingsGroup.length; i++) {
                    var bindings = bindingsGroup[i];
                    var ebv = QueryFilters.runFilter(aggregator.expression.expression, bindings, queryEngine, dataset, env);
                    if(!QueryFilters.isEbvError(ebv)) {
                        if(max === null) {
                            max = ebv;
                        } else {
                            if(QueryFilters.runLtFunction(max, ebv).value === true) {
                                max = ebv;
                            }
                        }
                    }
                }

                if(max===null) {
                    return QueryFilters.ebvError();
                } else {
                    return max;
                }*/
            } else if(aggregator.expression.aggregateType === 'min') {
                var min = null;
                _.eachSeries(bindingsGroup, function(bindings, k) {
                    QueryFilters.runFilter(aggregator.expression.expression, bindings, queryEngine, dataset, env, function(ebv) {
                        if(!QueryFilters.isEbvError(ebv)) {
                            if(min === null) {
                                min = ebv; k();
                            }
                            else {
                                QueryFilters.runGtFunction(min, ebv, undefined, function(result) {
                                  if(result === true) min = ebv;
                                  k();
                                })
                            }
                        }
                    })
                }, function() {
                  if(min === null) {
                      callback(QueryFilters.ebvError());
                      return;
                  }
                  else {
                      callback(min);
                      return;
                  }
                })
                /*var min = null;
                for(var i=0; i< bindingsGroup.length; i++) {
                    var bindings = bindingsGroup[i];
                    var ebv = QueryFilters.runFilter(aggregator.expression.expression, bindings, queryEngine, dataset, env);
                    if(!QueryFilters.isEbvError(ebv)) {
                        if(min === null) {
                            min = ebv;
                        } else {
                            if(QueryFilters.runGtFunction(min, ebv).value === true) {
                                min = ebv;
                            }
                        }
                    }
                }

                if(min===null) {
                    return QueryFilters.ebvError();
                } else {
                    return min;
                }*/
            } else if(aggregator.expression.aggregateType === 'count') {
                var distinct = {};
                var count = 0;
                if(aggregator.expression.expression === '*') {
                    if(aggregator.expression.distinct != null && aggregator.expression.distinct != '') {
                        for(var i=0; i< bindingsGroup.length; i++) {
                            var bindings = bindingsGroup[i];
                            var key = Utils.hashTerm(bindings);
                            if(distinct[key] == null) {
                                distinct[key] = true;
                                count++;
                            }
                        }
                    } else {
                        count = bindingsGroup.length;
                    }
                    callback({ token: 'literal', type: xmlSchema+'integer', value:''+count });
                } else {
                    _.eachSeries(bindingsGroup, function(bindings, k) {
                        QueryFilters.runFilter(aggregator.expression.expression, bindings, queryEngine, dataset, env, function(ebv) {
                            if(!QueryFilters.isEbvError(ebv)) {
                                if(aggregator.expression.distinct != null && aggregator.expression.distinct != '') {
                                    var key = Utils.hashTerm(ebv);
                                    if(distinct[key] == null) {
                                        distinct[key] = true;
                                        count++;
                                    }
                                }
                                else count++;
                            }
                            k();
                        })
                    }, function() {
                        callback({ token: 'literal', type: xmlSchema+'integer', value: ''+count });
                    })
                }
                return;
            } else if(aggregator.expression.aggregateType === 'avg') {
                var distinct = {};
                var aggregated = {token: 'literal', type:xmlSchema+"integer", value:'0'};
                var count = 0;
                _.eachSeries(bindingsGroup, function(bindings, k) {
                    QueryFilters.runFilter(aggregator.expression.expression, bindings, queryEngine, dataset, env, function(ebv) {
                        if(!QueryFilters.isEbvError(ebv)) {
                            if(aggregator.expression.distinct != null && aggregator.expression.distinct != '') {
                                var key = Utils.hashTerm(ebv);
                                if(distinct[key] == null) {
                                    distinct[key] = true;
                                    if(QueryFilters.isNumeric(ebv)) {
                                        aggregated = QueryFilters.runSumFunction(aggregated, ebv);
                                        count++;
                                    }
                                }
                            } else {
                                if(QueryFilters.isNumeric(ebv)) {
                                    aggregated = QueryFilters.runSumFunction(aggregated, ebv);
                                    count++;
                                }
                            }
                        }
                        k();
                    })
                }, function() {
                    var result = QueryFilters.runDivFunction(aggregated, { token: 'literal', type: xmlSchema+'integer', value: ''+count });
                    result.value = ''+result.value;
                    callback(result);
                })
                return;
            } else if(aggregator.expression.aggregateType === 'sum') {
                var distinct = {};
                var aggregated = {token: 'literal', type:xmlSchema+"integer", value:'0'};
                _.eachSeries(bindingsGroup, function(bindings, k) {
                    QueryFilters.runFilter(aggregator.expression.expression, bindings, queryEngine, dataset, env, function(ebv) {
                        if(!QueryFilters.isEbvError(ebv)) {
                            if(aggregator.expression.distinct != null && aggregator.expression.distinct != '') {
                                var key = Utils.hashTerm(ebv);
                                if(distinct[key] == null) {
                                    distinct[key] = true;
                                    if(QueryFilters.isNumeric(ebv)) {
                                        aggregated = QueryFilters.runSumFunction(aggregated, ebv);
                                    }
                                }
                            } else {
                                if(QueryFilters.isNumeric(ebv)) {
                                    aggregated = QueryFilters.runSumFunction(aggregated, ebv);
                                }
                            }
                        }
                        k();
                    })
                }, function() {
                    aggregated.value = ''+aggregated.value;
                    callback(aggregated);
                })
                return;
            } else {
                QueryFilters.runFilter(aggregate.expression, bindingsGroup[0], dataset, {blanks:{}, outCache:{}}, callback);
                return;
            }
        }
    }
};

QueryFilters.runFilter = function(filterExpr, bindings, queryEngine, dataset, env, callback) {
    /** @todo make completely async */
    if(filterExpr.expressionType != null) {
        var expressionType = filterExpr.expressionType;
        if(expressionType == 'relationalexpression') {
            var op1, op2;
            QueryFilters.runFilters([filterExpr.op1, filterExpr.op2], bindings, queryEngine, dataset, env, function(res) {
                QueryFilters.runRelationalFilter(filterExpr, res[0], res[1], bindings, queryEngine, dataset, env, callback);
            })
            return;
        } else if(expressionType == 'conditionalor') {
            return QueryFilters.runOrFunction(filterExpr, bindings, queryEngine, dataset, env, callback);
        } else if (expressionType == 'conditionaland') {
            return QueryFilters.runAndFunction(filterExpr, bindings, queryEngine, dataset, env, callback);
        } else if(expressionType == 'additiveexpression') {
            return QueryFilters.runAddition(filterExpr.summand, filterExpr.summands, bindings, queryEngine, dataset, env, callback);
        } else if(expressionType == 'builtincall') {
            QueryFilters.runBuiltInCall(filterExpr.builtincall, filterExpr.args, bindings, queryEngine, dataset, env, callback);
        } else if(expressionType == 'multiplicativeexpression') {
            QueryFilters.runMultiplication(filterExpr.factor, filterExpr.factors, bindings, queryEngine, dataset, env, callback);
        } else if(expressionType == 'unaryexpression') {
            return QueryFilters.runUnaryExpression(filterExpr.unaryexpression, filterExpr.expression, bindings, queryEngine, dataset, env);
        } else if(expressionType == 'irireforfunction') {
            return QueryFilters.runIriRefOrFunction(filterExpr.iriref, filterExpr.args, bindings, queryEngine, dataset, env);
        } else if(expressionType == 'regex') {
            QueryFilters.runRegex(filterExpr.text, filterExpr.pattern, filterExpr.flags, bindings, queryEngine, dataset, env, callback)
        } else if(expressionType == 'custom') {
            QueryFilters.runBuiltInCall(filterExpr.name, filterExpr.args, bindings, queryEngine, dataset, env, callback);
        } else if(expressionType == 'atomic') {
            /** @todo might lead to big stacks without using setTimeout when doing eachSeries */
            if(filterExpr.primaryexpression == 'var') {
                // lookup the var in the bindings
                callback(bindings[filterExpr.value.value]);
                return;
            } else {
                // numeric, literal, etc...
                //return queryEngine.filterExpr.value;
                if(typeof(filterExpr.value) != 'object') {
                    callback(filterExpr.value);
                    return;
                } else {
                    if(filterExpr.value.type == null || typeof(filterExpr.value.type) != 'object') {
                        callback(filterExpr.value);
                        return;
                    } else {
                        // type can be parsed as a hash using namespaces

                        filterExpr.value.type =  Utils.lexicalFormBaseUri(filterExpr.value.type, env);
                        callback(filterExpr.value);
                        return;
                    }
                }
            }
        } else {
            throw("Unknown filter expression type"); /** @todo how to make async? */
        }
    } else {
        throw("Cannot find bound expressions in a no expression token");
    }
};

QueryFilters.runFilters = function(filters, bindings, queryEngine, dataset, env, callback) {
    var results = [];
    /** @todo parallel computing */
    _.eachSeries(filters, function(f, k) {
      QueryFilters.runFilter(f, bindings, queryEngine, dataset, env, function(res) {
          results.push(res);
          k();
      })
    }, function() {
      callback(results);
    })
}

QueryFilters.isRDFTerm = function(val) {
    if(val==null) {
        return false;
    } if((val.token && val.token == 'literal') ||
        (val.token && val.token == 'uri') ||
        (val.token && val.token == 'blank')) {
        return true;
    } else {
        return false;
    }
};


/*
 17.4.1.7 RDFterm-equal

 xsd:boolean   RDF term term1 = RDF term term2

 Returns TRUE if term1 and term2 are the same RDF term as defined in Resource Description Framework (RDF):
 Concepts and Abstract Syntax [CONCEPTS]; produces a type error if the arguments are both literal but are not
 the same RDF term *; returns FALSE otherwise. term1 and term2 are the same if any of the following is true:

 term1 and term2 are equivalent IRIs as defined in 6.4 RDF URI References of [CONCEPTS].
 term1 and term2 are equivalent literals as defined in 6.5.1 Literal Equality of [CONCEPTS].
 term1 and term2 are the same blank node as described in 6.6 Blank Nodes of [CONCEPTS].
 */
QueryFilters.RDFTermEquality = function(v1, v2, queryEngine, env) {
    if(v1.token === 'literal' && v2.token === 'literal') {
        if(v1.lang == v2.lang && v1.type == v2.type && v1.value == v2.value) {

            return true;
        } else {


            if(v1.type != null && v2.type != null) {
                return  QueryFilters.ebvError();
            } else if(QueryFilters.isSimpleLiteral(v1) && v2.type!=null){
                return QueryFilters.ebvError();
            } else if(QueryFilters.isSimpleLiteral(v2) && v1.type!=null){
                return QueryFilters.ebvError();
            } else {
                return false;
            }

//            if(v1.value != v2.value) {
//                return QueryFilters.ebvError();
//            } else if(v1.type && v2.type && v1.type!=v2.type) {
//                return QueryFilters.ebvError();
//            } else if(QueryFilters.isSimpleLiteral(v1) && v2.type!=null){
//                return QueryFilters.ebvError();
//            } else if(QueryFilters.isSimpleLiteral(v2) && v1.type!=null){
//                return QueryFilters.ebvError();
//            } else {
//                return false;
//            }

        }
    } else if(v1.token === 'uri' && v2.token === 'uri') {
        return Utils.lexicalFormBaseUri(v1, env) == Utils.lexicalFormBaseUri(v2, env);
    } else if(v1.token === 'blank' && v2.token === 'blank') {
        return v1.value == v2.value;
    } else {
        return false;
    }
};


QueryFilters.isInteger = function(val) {
    if(val == null) {
        return false;
    }
    if(val.token === 'literal') {
        if(val.type == xmlSchema+"integer" ||
            val.type == xmlSchema+"decimal" ||
            val.type == xmlSchema+"double" ||
            val.type == xmlSchema+"nonPositiveInteger" ||
            val.type == xmlSchema+"negativeInteger" ||
            val.type == xmlSchema+"long" ||
            val.type == xmlSchema+"int" ||
            val.type == xmlSchema+"short" ||
            val.type == xmlSchema+"byte" ||
            val.type == xmlSchema+"nonNegativeInteger" ||
            val.type == xmlSchema+"unsignedLong" ||
            val.type == xmlSchema+"unsignedInt" ||
            val.type == xmlSchema+"unsignedShort" ||
            val.type == xmlSchema+"unsignedByte" ||
            val.type == xmlSchema+"positiveInteger" ) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
};

QueryFilters.isFloat = function(val) {
    if(val == null) {
        return false;
    }
    if(val.token === 'literal') {
        if(val.type == xmlSchema+"float") {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
};

QueryFilters.isDecimal = function(val) {
    if(val == null) {
        return false;
    }
    if(val.token === 'literal') {
        if(val.type == xmlSchema+"decimal") {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
};

QueryFilters.isDouble = function(val) {
    if(val == null) {
        return false;
    }
    if(val.token === 'literal') {
        if(val.type == xmlSchema+"double") {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
};


QueryFilters.isNumeric = function(val) {
    if(val == null) {
        return false;
    }
    if(val.token === 'literal') {
        if(val.type == xmlSchema+"integer" ||
            val.type == xmlSchema+"decimal" ||
            val.type == xmlSchema+"float" ||
            val.type == xmlSchema+"double" ||
            val.type == xmlSchema+"nonPositiveInteger" ||
            val.type == xmlSchema+"negativeInteger" ||
            val.type == xmlSchema+"long" ||
            val.type == xmlSchema+"int" ||
            val.type == xmlSchema+"short" ||
            val.type == xmlSchema+"byte" ||
            val.type == xmlSchema+"nonNegativeInteger" ||
            val.type == xmlSchema+"unsignedLong" ||
            val.type == xmlSchema+"unsignedInt" ||
            val.type == xmlSchema+"unsignedShort" ||
            val.type == xmlSchema+"unsignedByte" ||
            val.type == xmlSchema+"positiveInteger" ) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
};

QueryFilters.isSimpleLiteral = function(val) {
    if(val && val.token == 'literal') {
        if(val.type == null && val.lang == null) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
};

QueryFilters.isXsdType = function(type, val) {
    if(val && val.token == 'literal') {
        return val.type == xmlSchema+""+type;
    } else {
        return false;
    }
};

QueryFilters.ebv = function (term) {
    if (term == null || QueryFilters.isEbvError(term)) {
        return QueryFilters.ebvError();
    } else {
        if (term.token && term.token === 'literal') {
            if (term.type == xmlSchema+"integer" ||
                term.type == xmlSchema+"decimal" ||
                term.type == xmlSchema+"double" ||
                term.type == xmlSchema+"nonPositiveInteger" ||
                term.type == xmlSchema+"negativeInteger" ||
                term.type == xmlSchema+"long" ||
                term.type == xmlSchema+"int" ||
                term.type == xmlSchema+"short" ||
                term.type == xmlSchema+"byte" ||
                term.type == xmlSchema+"nonNegativeInteger" ||
                term.type == xmlSchema+"unsignedLong" ||
                term.type == xmlSchema+"unsignedInt" ||
                term.type == xmlSchema+"unsignedShort" ||
                term.type == xmlSchema+"unsignedByte" ||
                term.type == xmlSchema+"positiveInteger") {
                var tmp = parseFloat(term.value);
                if (isNaN(tmp)) {
                    return false;
                } else {
                    return parseFloat(term.value) != 0;
                }
            } else if (term.type === xmlSchema+"boolean") {
                return (term.value === 'true' || term.value === true || term.value === 'True');
            } else if (term.type === xmlSchema+"string") {
                return term.value != "";
            } else if (term.type === xmlSchema+"dateTime") {
                return (new Date(term.value)) != null;
            } else if (QueryFilters.isEbvError(term)) {
                return term;
            } else if (term.type == null) {
                if (term.value != "") {
                    return true;
                } else {
                    return false;
                }
            } else {
                return QueryFilters.ebvError();
            }
        } else {
            return term.value === true;
        }
    }
};

QueryFilters.effectiveBooleanValue = QueryFilters.ebv;

QueryFilters.ebvTrue = function() {
    var val = {token: 'literal', type:xmlSchema+"boolean", value:true};
    return val;
};

QueryFilters.ebvFalse = function() {
    var val = {token: 'literal', type:xmlSchema+"boolean", value:false};
    return val;
};

QueryFilters.ebvError = function() {
    var val = {token: 'literal', type:"https://github.com/antoniogarrote/js-tools/types#error", value:null};
    return val;
};

QueryFilters.isEbvError = function(term) {
    if(typeof(term) == 'object' && term != null) {
        return term.type === "https://github.com/antoniogarrote/js-tools/types#error";
//    } else if(term == null) {
//        return true;
    } else {
        return false;
    }
};

QueryFilters.ebvBoolean = function (bool) {
    if (QueryFilters.isEbvError(bool)) {
        return bool;
    } else {
        if (bool === true) {
            return QueryFilters.ebvTrue();
        } else {
            return QueryFilters.ebvFalse();
        }
    }
};


QueryFilters.runRelationalFilter = function(filterExpr, op1, op2, bindings, queryEngine, dataset, env, callback) {
    var operator = filterExpr.operator;
    if(operator === '=') {
        QueryFilters.runEqualityFunction(op1, op2, bindings, queryEngine, dataset, env, callback);
        return;
    } else if(operator === '!=') {
        var res = QueryFilters.runEqualityFunction(op1, op2, bindings, queryEngine, dataset, env, function(res) {
            if(QueryFilters.isEbvError(res)) {
                callback(res);
            }
            else {
                res.value = !res.value;
                callback(res);
            }
        });
        return;
    } else if(operator === '<') {
        QueryFilters.runLtFunction(op1, op2, bindings, callback);
        return;
    } else if(operator === '>') {
        QueryFilters.runGtFunction(op1, op2, bindings, callback);
        return;
    } else if(operator === '<=') {
        QueryFilters.runLtEqFunction(op1, op2, bindings, callback);
        return;
    } else if(operator === '>=') {
        QueryFilters.runGtEqFunction(op1, op2, bindings, callback);
        return;
    } else {
        throw("Error applying relational filter, unknown operator");
    }
};

/**
 * Transforms a JS object representing a [typed] literal in a javascript
 * value that can be used in javascript operations and functions
 */
QueryFilters.effectiveTypeValue = function(val){
    if(val.token == 'literal') {
        if(val.type == xmlSchema+"integer") {
            var tmp = parseInt(val.value);
            //if(isNaN(tmp)) {
            //    return false;
            //} else {
            return tmp;
            //}
        } else if(val.type == xmlSchema+"decimal") {
            var tmp = parseFloat(val.value);
            //if(isNaN(tmp)) {
            //    return false;
            //} else {
            return tmp;
            //}
        } else if (val.type == xmlSchema+"float") {
            var tmp = parseFloat(val.value);
            //if(isNaN(tmp)) {
            //    return false;
            //} else {
            return tmp;
            //}
        } else if (val.type == xmlSchema+"double") {
            var tmp = parseFloat(val.value);
            //if(isNaN(tmp)) {
            //    return false;
            //} else {
            return tmp;
            //}
        } else if (val.type == xmlSchema+"nonPositiveInteger") {
            var tmp = parseFloat(val.value);
            //if(isNaN(tmp)) {
            //    return false;
            //} else {
            return tmp;
            //}
        } else if (val.type == xmlSchema+"negativeInteger") {
            var tmp = parseInt(val.value);
            //if(isNaN(tmp)) {
            //    return false;
            //} else {
            return tmp;
            //}
        } else if (val.type == xmlSchema+"long") {
            var tmp = parseInt(val.value);
            //if(isNaN(tmp)) {
            //    return false;
            //} else {
            return tmp;
            //}
        } else if (val.type == xmlSchema+"int") {
            var tmp = parseInt(val.value);
            //if(isNaN(tmp)) {
            //    return false;
            //} else {
            return tmp;
            //}
        } else if (val.type == xmlSchema+"short") {
            var tmp = parseInt(val.value);
            //if(isNaN(tmp)) {
            //    return false;
            //} else {
            return tmp;
            //}
        } else if (val.type == xmlSchema+"byte") {
            var tmp = parseInt(val.value);
            //if(isNaN(tmp)) {
            //    return false;
            //} else {
            return tmp;
            //}
        } else if (val.type == xmlSchema+"nonNegativeInteger") {
            var tmp = parseInt(val.value);
            //if(isNaN(tmp)) {
            //    return false;
            //} else {
            return tmp;
            //}
        } else if (val.type == xmlSchema+"unsignedLong") {
            var tmp = parseInt(val.value);
            //if(isNaN(tmp)) {
            //    return false;
            //} else {
            return tmp;
            //}
        } else if (val.type == xmlSchema+"unsignedInt") {
            var tmp = parseInt(val.value);
            //if(isNaN(tmp)) {
            //    return false;
            //} else {
            return tmp;
            //}
        } else if (val.type == xmlSchema+"unsignedShort") {
            var tmp = parseInt(val.value);
            //if(isNaN(tmp)) {
            //    return false;
            //} else {
            return tmp;
            //}
        } else if (val.type == xmlSchema+"unsignedByte") {
            var tmp = parseInt(val.value);
            //if(isNaN(tmp)) {
            //    return false;
            //} else {
            return tmp;
            //}
        } else if (val.type == xmlSchema+"positiveInteger" ) {
            var tmp = parseInt(val.value);
            //if(isNaN(tmp)) {
            //    return false;
            //} else {
            return tmp;
            //}
        } else if (val.type == xmlSchema+"date" ||
            val.type == xmlSchema+"dateTime" ) {
            try {
                var d = Utils.parseISO8601(val.value);
                return(d);
            } catch(e) {
                return null;
            }
        } else if (val.type == xmlSchema+"boolean" ) {
            return val.value === true || val.value === 'true' || val.value === '1' || val.value === 1 || val.value === true ? true :
                val.value === false || val.value === 'false' || val.value === '0' || val.value === 0 || val.value === false ? false :
                    undefined;
        } else if (val.type == xmlSchema+"string" ) {
            return val.value === null || val.value === undefined ? undefined : ''+val.value;
        } else if (val.type == null) {
            // plain literal -> just manipulate the string
            return val.value;
        } else {
            return val.value
        }
    } else {
        // @todo
        console.log("not implemented yet");
        console.log(val);
        throw("value not supported in operations yet");
    }
};

/*
 A logical-or that encounters an error on only one branch will return TRUE if the other branch is TRUE and an error if the other branch is FALSE.
 A logical-or or logical-and that encounters errors on both branches will produce either of the errors.
 */
/** @todo how about lazy evaluation? */
QueryFilters.runOrFunction = function(filterExpr, bindings, queryEngine, dataset, env, callback) {

    var acum = null;

    QueryFilters.runFilters(filterExpr.operands, bindings, queryEngine, dataset, env, function(results) {
        for(var i=0; i < results.length; ++i) {
          var ebv = results[i];
          if(QueryFilters.isEbvError(ebv) == false) ebv = QueryFilters.ebv(ebv);

          if(acum == null) acum = ebv;
          else if(QueryFilters.isEbvError(ebv)) {
              if(QueryFilters.isEbvError(acum) || acum !== true) {
                acum = QueryFilters.ebvError();
              }
          }
          else if(ebv === true) {
            acum = true;
          }
          else if(QueryFilters.isEbvError(acum)) {
            acum = QueryFilters.ebvError();
          }
        }
        callback(QueryFilters.ebvBoolean(acum));
    })
};

/*
 A logical-and that encounters an error on only one branch will return an error if the other branch is TRUE and FALSE if the other branch is FALSE.
 A logical-or or logical-and that encounters errors on both branches will produce either of the errors.
 */
QueryFilters.runAndFunction = function(filterExpr, bindings, queryEngine, dataset, env, callback) {

    var acum = null;

    QueryFilters.runFilters(filterExpr.operands, bindings, queryEngine, dataset, env, function(results) {
        for(var i=0; i < results.length; ++i) {
            var ebv = results[i];
            if(QueryFilters.isEbvError(ebv) == false) ebv = QueryFilters.ebv(ebv);

            if(acum == null) acum = ebv;
            else if(QueryFilters.isEbvError(ebv)) {
              if(QueryFilters.isEbvError(acum)) {
                acum = QueryFilters.ebvError();
              }
              else if(acum === true) {
                acum = QueryFilters.ebvError();
              }
              else {
                acum = false;
              }
            }
            else if(ebv === true) {
              if(QueryFilters.isEbvError(acum)) {
                acum = QueryFilters.ebvError();
              }
            }
            else acum = false;
        }
        callback(QueryFilters.ebvBoolean(acum));
    })

    /*for(var i=0; i< filterExpr.operands.length; i++) {

        var ebv = QueryFilters.runFilter(filterExpr.operands[i], bindings, queryEngine, dataset, env);

        if(QueryFilters.isEbvError(ebv) == false) {
            ebv = QueryFilters.ebv(ebv);
        }

        if(acum == null) {
            acum = ebv;
        } else if(QueryFilters.isEbvError(ebv)) {
            if(QueryFilters.isEbvError(acum)) {
                acum = QueryFilters.ebvError();
            } else if(acum === true) {
                acum = QueryFilters.ebvError();
            } else {
                acum = false;
            }
        } else if(ebv === true) {
            if(QueryFilters.isEbvError(acum)) {
                acum = QueryFilters.ebvError();
            }
        } else {
            acum = false;
        }
    }

    return QueryFilters.ebvBoolean(acum);*/
};


QueryFilters.runEqualityFunction = function(op1, op2, bindings, queryEngine, dataset, env, callback) {
    if(QueryFilters.isEbvError(op1) || QueryFilters.isEbvError(op2)) {
        callback(QueryFilters.ebvError());
        return;
    }
    if(QueryFilters.isNumeric(op1) && QueryFilters.isNumeric(op2)) {
        var eop1 = QueryFilters.effectiveTypeValue(op1);
        var eop2 = QueryFilters.effectiveTypeValue(op2);
        if(isNaN(eop1) || isNaN(eop2)) {
            callback(QueryFilters.ebvBoolean(QueryFilters.RDFTermEquality(op1, op2, queryEngine, env)));
        } else {
            callback(QueryFilters.ebvBoolean(eop1 == eop2));
        }
        return;
    } else if((QueryFilters.isSimpleLiteral(op1) || QueryFilters.isXsdType("string", op1)) &&
        (QueryFilters.isSimpleLiteral(op2) || QueryFilters.isXsdType("string", op2))) {
        callback(QueryFilters.ebvBoolean(QueryFilters.effectiveTypeValue(op1) == QueryFilters.effectiveTypeValue(op2)));
        return;
    } else if(QueryFilters.isXsdType("boolean", op1) && QueryFilters.isXsdType("boolean", op2)) {
        callback(QueryFilters.ebvBoolean(QueryFilters.effectiveTypeValue(op1) == QueryFilters.effectiveTypeValue(op2)));
        return;
    } else if((QueryFilters.isXsdType("dateTime", op1)||QueryFilters.isXsdType("date", op1)) && (QueryFilters.isXsdType("dateTime", op2)||QueryFilters.isXsdType("date", op2))) {
        if(QueryFilters.isXsdType("dateTime", op1) && QueryFilters.isXsdType("date", op2)) {
            callback(QueryFilters.ebvFalse());
            return;
        }
        if(QueryFilters.isXsdType("date", op1) && QueryFilters.isXsdType("dateTime", op2)) {
            callback(QueryFilters.ebvFalse());
            return;
        }

        var comp = Utils.compareDateComponents(op1.value, op2.value);
        if(comp != null) {
            if(comp == 0) {
                callback(QueryFilters.ebvTrue());
                return;
            } else {
                callback(QueryFilters.ebvFalse());
                return;
            }
        } else {
            callback(QueryFilters.ebvError());
            return;
        }
    } else if(QueryFilters.isRDFTerm(op1) && QueryFilters.isRDFTerm(op2)) {
        callback(QueryFilters.ebvBoolean(QueryFilters.RDFTermEquality(op1, op2, queryEngine, env)));
        return;
    } else {
        callback(QueryFilters.ebvFalse());
        return;
    }
};

/**
 * Total gt function used when sorting bindings in the SORT BY clause.
 *
 * @todo
 * Some criteria are not clear
 * @todo make it async
 */
QueryFilters.runTotalGtFunction = function(op1, op2) {
    if(QueryFilters.isEbvError(op1) || QueryFilters.isEbvError(op2)) {
        return QueryFilters.ebvError();
    }

    if((QueryFilters.isNumeric(op1) && QueryFilters.isNumeric(op2)) ||
        (QueryFilters.isSimpleLiteral(op1) && QueryFilters.isSimpleLiteral(op2)) ||
        (QueryFilters.isXsdType("string",op1) && QueryFilters.isSimpleLiteral("string",op2)) ||
        (QueryFilters.isXsdType("boolean",op1) && QueryFilters.isSimpleLiteral("boolean",op2)) ||
        (QueryFilters.isXsdType("dateTime",op1) && QueryFilters.isSimpleLiteral("dateTime",op2))) {
        return QueryFilters.runGtFunction(op1, op2, []);
    } else if(op1.token && op1.token === 'uri' && op2.token && op2.token === 'uri') {
        return QueryFilters.ebvBoolean(op1.value > op2.value);
    } else if(op1.token && op1.token === 'literal' && op2.token && op2.token === 'literal') {
        // one of the literals must have type/lang and the othe may not have them
        return QueryFilters.ebvBoolean(""+op1.value+op1.type+op1.lang > ""+op2.value+op2.type+op2.lang);
    } else if(op1.token && op1.token === 'blank' && op2.token && op2.token === 'blank') {
        return QueryFilters.ebvBoolean(op1.value > op2.value);
    } else if(op1.value && op2.value) {
        return QueryFilters.ebvBoolean(op1.value > op2.value);
    } else {
        return QueryFilters.ebvTrue();
    }
};

QueryFilters.runComparisonFunction = function(op1, op2, compareFn, dateCompareFn, bindings, callback) {
    if(QueryFilters.isEbvError(op1) || QueryFilters.isEbvError(op2)) {
        callback(QueryFilters.ebvError());
        return;
    }

    if(QueryFilters.isNumeric(op1) && QueryFilters.isNumeric(op2)) {
        callback(QueryFilters.ebvBoolean(compareFn(QueryFilters.effectiveTypeValue(op1), QueryFilters.effectiveTypeValue(op2))));
        return;
    } else if(QueryFilters.isSimpleLiteral(op1) && QueryFilters.isSimpleLiteral(op2)) {
        callback(QueryFilters.ebvBoolean(compareFn(QueryFilters.effectiveTypeValue(op1), QueryFilters.effectiveTypeValue(op2))));
        return;
    } else if(QueryFilters.isXsdType("string", op1) && QueryFilters.isXsdType("string", op2)) {
        callback(QueryFilters.ebvBoolean(compareFn(QueryFilters.effectiveTypeValue(op1), QueryFilters.effectiveTypeValue(op2))));
        return;
    } else if(QueryFilters.isXsdType("boolean", op1) && QueryFilters.isXsdType("boolean", op2)) {
        callback(QueryFilters.ebvBoolean(compareFn(QueryFilters.effectiveTypeValue(op1), QueryFilters.effectiveTypeValue(op2))));
        return;
    } else if((QueryFilters.isXsdType("dateTime", op1) || QueryFilters.isXsdType("date", op1)) &&
        (QueryFilters.isXsdType("dateTime", op2) || QueryFilters.isXsdType("date", op2))) {
        if(QueryFilters.isXsdType("dateTime", op1) && QueryFilters.isXsdType("date", op2)) {
            callback(QueryFilters.ebvFalse());
            return;
        }
        if(QueryFilters.isXsdType("date", op1) && QueryFilters.isXsdType("dateTime", op2)) {
            callback(QueryFilters.ebvFalse());
            return;
        }

        var comp = Utils.compareDateComponents(op1.value, op2.value);
        if(comp != null) {
            callback(QueryFilters.ebvBoolean(dateCompareFn(comp)));
            return;
        } else {
            callback(QueryFilters.ebvError());
            return;
        }
    } else {
        callback(QueryFilters.ebvFalse());
        return;
    }
};

QueryFilters.runLtFunction = function(op1, op2, bindings, callback) {
    QueryFilters.runComparisonFunction(op1, op2, function(v1, v2) {
        return v1 < v2;
    }, function(compReslt) {
        return compResult == -1;
    }, bindings, callback);
};

QueryFilters.runGtEqFunction = function(op1, op2, bindings, callback) {
    QueryFilters.runComparisonFunction(op1, op2, function(v1, v2) {
        return v1 >= v2;
    }, function(compResult) {
        return compResult != -1;
    }, bindings, callback);
};

QueryFilters.runLtEqFunction = function(op1, op2, bindings, callback) {
    QueryFilters.runComparisonFunction(op1, op2, function(v1, v2) {
        return v1 <= v2;
    }, function(compResult) {
        return compResult != 1;
    }, bindings, callback);
};

QueryFilters.runGtFunction = function(op1, op2, bindings, callback) {
    QueryFilters.runComparisonFunction(op1, op2, function(v1, v2) {
        return v1 > v2;
    }, function(compResult) {
        return compResult == 1;
    }, bindings, callback);
};

QueryFilters.runLtEqFunction = function(op1, op2, bindings) {
    if(QueryFilters.isEbvError(op1) || QueryFilters.isEbvError(op2)) {
        return QueryFilters.ebvError();
    }

    if(QueryFilters.isNumeric(op1) && QueryFilters.isNumeric(op2)) {
        return QueryFilters.ebvBoolean(QueryFilters.effectiveTypeValue(op1) <= QueryFilters.effectiveTypeValue(op2));
    } else if(QueryFilters.isSimpleLiteral(op1) && QueryFilters.isSimpleLiteral(op2)) {
        return QueryFilters.ebvBoolean(QueryFilters.effectiveTypeValue(op1) <= QueryFilters.effectiveTypeValue(op2));
    } else if(QueryFilters.isXsdType("string", op1) && QueryFilters.isXsdType("string", op2)) {
        return QueryFilters.ebvBoolean(QueryFilters.effectiveTypeValue(op1) <= QueryFilters.effectiveTypeValue(op2));
    } else if(QueryFilters.isXsdType("boolean", op1) && QueryFilters.isXsdType("boolean", op2)) {
        return QueryFilters.ebvBoolean(QueryFilters.effectiveTypeValue(op1) <= QueryFilters.effectiveTypeValue(op2));
    } else if((QueryFilters.isXsdType("dateTime", op1) || QueryFilters.isXsdType("date", op1)) &&
        (QueryFilters.isXsdType("dateTime", op2) || QueryFilters.isXsdType("date", op2))) {
        if(QueryFilters.isXsdType("dateTime", op1) && QueryFilters.isXsdType("date", op2)) {
            return QueryFilters.ebvFalse();
        }
        if(QueryFilters.isXsdType("date", op1) && QueryFilters.isXsdType("dateTime", op2)) {
            return QueryFilters.ebvFalse();
        }

        var comp = Utils.compareDateComponents(op1.value, op2.value);
        if(comp != null) {
            if(comp != 1) {
                return QueryFilters.ebvTrue();
            } else {
                return QueryFilters.ebvFalse();
            }
        } else {
            return QueryFilters.ebvError();
        }
    } else {
        return QueryFilters.ebvFalse();
    }
};

QueryFilters.runAddition = function(summand, summands, bindings, queryEngine, dataset, env, callback) {
    var summandOp = QueryFilters.runFilter(summand,bindings,queryEngine, dataset, env, function(summandOp) {
        if(QueryFilters.isEbvError(summandOp)) {
            callback(QueryFilters.ebvError()); return;
        }
        if(!QueryFilters.isNumeric(summandOp)) {
            console.log(summandOp)
            callback(QueryFilters.ebvFalse()); return;
        }
        QueryFilters.runFilters(summands.map(function(s) { return s.expression }), bindings, queryEngine, dataset, env, function(summandOps) {
          var acum = summandOp;
          for(var i=0; i < summands.length; ++i) {
            var nextSummandOp = summandOps[i];
            /** @todo test isNumeric */
            if(summands[i].operator === '+') {
              acum = QueryFilters.runSumFunction(acum, nextSummandOp);
            }
            else if(summands[i].operator === '-') {
              acum = QueryFilters.runSubFunction(acum, nextSummandOp);
            }
          }
          callback(acum);
        })
    });
};

QueryFilters.runSumFunction = function(suma, sumb) {
    if(QueryFilters.isEbvError(suma) || QueryFilters.isEbvError(sumb)) {
        return QueryFilters.ebvError();
    }
    var val = QueryFilters.effectiveTypeValue(suma) + QueryFilters.effectiveTypeValue(sumb);

    if(QueryFilters.isDouble(suma) || QueryFilters.isDouble(sumb)) {
        return {token: 'literal', type:xmlSchema+"double", value:val};
    } else if(QueryFilters.isFloat(suma) || QueryFilters.isFloat(sumb)) {
        return {token: 'literal', type:xmlSchema+"float", value:val};
    } else if(QueryFilters.isDecimal(suma) || QueryFilters.isDecimal(sumb)) {
        return {token: 'literal', type:xmlSchema+"decimal", value:val};
    } else {
        return {token: 'literal', type:xmlSchema+"integer", value:val};
    }
};

QueryFilters.runSubFunction = function(suma, sumb) {
    if(QueryFilters.isEbvError(suma) || QueryFilters.isEbvError(sumb)) {
        return QueryFilters.ebvError();
    }
    var val = QueryFilters.effectiveTypeValue(suma) - QueryFilters.effectiveTypeValue(sumb);

    if(QueryFilters.isDouble(suma) || QueryFilters.isDouble(sumb)) {
        return {token: 'literal', type:xmlSchema+"double", value:val};
    } else if(QueryFilters.isFloat(suma) || QueryFilters.isFloat(sumb)) {
        return {token: 'literal', type:xmlSchema+"float", value:val};
    } else if(QueryFilters.isDecimal(suma) || QueryFilters.isDecimal(sumb)) {
        return {token: 'literal', type:xmlSchema+"decimal", value:val};
    } else {
        return {token: 'literal', type:xmlSchema+"integer", value:val};
    }
};

QueryFilters.runMultiplication = function(factor, factors, bindings, queryEngine, dataset, env, callback) {
    QueryFilters.runFilter(factor,bindings,queryEngine, dataset, env, function(factorOp) {
        if(QueryFilters.isEbvError(factorOp)) {
            callback(factorOp);
            return;
        }
        if(!QueryFilters.isNumeric(factorOp)) {
            callback(QueryFilters.ebvFalse());
        }
        QueryFilters.runFilters(factors.map(function(f) { return f.expression }), bindings, queryEngine, dataset, env, function(results) {
            var acum = factorOp;
            for(var i=0; i<results.length; ++i) {
                if(QueryFilters.isEbvError(results[i])) {
                    callback(factorOp);
                    return;
                }
                else if(QueryFilters.isNumeric(results[i])) {
                    if(factors[i].operator === '*') {
                        acum = QueryFilters.runMulFunction(acum, results[i]);
                    }
                    else if(factors[i].operator === '/') {
                        acum = QueryFilters.runDivFunction(acum, results[i]);
                    }
                }
                else {
                    callback(QueryFilters.ebvFalse());
                    return;
                }
            }
            callback(acum);
        })
    });
};

QueryFilters.runMulFunction = function(faca, facb) {
    if(QueryFilters.isEbvError(faca) || QueryFilters.isEbvError(facb)) {
        return QueryFilters.ebvError();
    }
    var val = QueryFilters.effectiveTypeValue(faca) * QueryFilters.effectiveTypeValue(facb);

    if(QueryFilters.isDouble(faca) || QueryFilters.isDouble(facb)) {
        return {token: 'literal', type:xmlSchema+"double", value:val};
    } else if(QueryFilters.isFloat(faca) || QueryFilters.isFloat(facb)) {
        return {token: 'literal', type:xmlSchema+"float", value:val};
    } else if(QueryFilters.isDecimal(faca) || QueryFilters.isDecimal(facb)) {
        return {token: 'literal', type:xmlSchema+"decimal", value:val};
    } else {
        return {token: 'literal', type:xmlSchema+"integer", value:val};
    }
};

QueryFilters.runDivFunction = function(faca, facb) {
    if(QueryFilters.isEbvError(faca) || QueryFilters.isEbvError(facb)) {
        return QueryFilters.ebvError();
    }
    var val = QueryFilters.effectiveTypeValue(faca) / QueryFilters.effectiveTypeValue(facb);

    if(QueryFilters.isDouble(faca) || QueryFilters.isDouble(facb)) {
        return {token: 'literal', type:xmlSchema+"double", value:val};
    } else if(QueryFilters.isFloat(faca) || QueryFilters.isFloat(facb)) {
        return {token: 'literal', type:xmlSchema+"float", value:val};
    } else if(QueryFilters.isDecimal(faca) || QueryFilters.isDecimal(facb)) {
        return {token: 'literal', type:xmlSchema+"decimal", value:val};
    } else {
        return {token: 'literal', type:xmlSchema+"integer", value:val};
    }
};

QueryFilters.runBuiltInCall = function(builtincall, args, bindings, queryEngine, dataset, env, callback) {
    if(builtincall === 'notexists' || builtincall === 'exists') {
        // Run the query in the filter applying bindings

        var cloned = _.clone(args[0],true);
        var ast = queryEngine.abstractQueryTree.parseSelect({pattern:cloned}, bindings);
        ast = queryEngine.abstractQueryTree.bind(ast.pattern, bindings);

        queryEngine.executeSelectUnit([ {kind:'*'} ],
            dataset,
            ast,
            env,
            function(result) {
              if(builtincall === 'exists') {
                callback(QueryFilters.ebvBoolean(result.length !== 0));
              }
              else {
                callback(QueryFilters.ebvBoolean(result.length === 0));
              }
            });

    }  else {
        var ops = [];
        _.eachSeries(args, function(arg, k) {
            if(arg.token === 'var') {
                ops.push(arg);
                k();
            }
            else QueryFilters.runFilter(arg, bindings, queryEngine, dataset, env, function(op) {
                if(QueryFilters.isEbvError(op)) {
                    callback(op);
                }
                else {
                    ops.push(op);
                    k();
                }
            })
        }, function() {

            if(builtincall === 'str') {
                if(ops[0].token === 'literal') {
                    // lexical form literals
                    callback({token: 'literal', type:null, value:""+ops[0].value}); // type null? or xmlSchema+"string"
                } else if(ops[0].token === 'uri'){
                    // codepoint URIs
                    callback({token: 'literal', type:null, value:ops[0].value}); // idem
                } else {
                    callback(QueryFilters.ebvFalse());
                }
            } else if(builtincall === 'lang') {
                if(ops[0].token === 'literal'){
                    if(ops[0].lang != null) {
                        callback({token: 'literal', value:""+ops[0].lang});
                    } else {
                        callback({token: 'literal', value:""});
                    }
                } else {
                    callback(QueryFilters.ebvError());
                }
            } else if(builtincall === 'datatype') {
                if(ops[0].token === 'literal'){
                    var lit = ops[0];
                    if(lit.type != null) {
                        if(typeof(lit.type) === 'string') {
                            callback({token: 'uri', value:lit.type, prefix:null, suffix:null});
                        } else {
                            callback(lit.type);
                        }
                    } else if(lit.lang == null) {
                        callback({token: 'uri', value:'http://www.w3.org/2001/XMLSchema#string', prefix:null, suffix:null});
                    } else {
                        callback(QueryFilters.ebvError());
                    }
                } else {
                    callback(QueryFilters.ebvError());
                }
            } else if(builtincall === 'isliteral') {
                if(ops[0].token === 'literal'){
                    callback(QueryFilters.ebvTrue());
                } else {
                    callback(QueryFilters.ebvFalse());
                }
            } else if(builtincall === 'isblank') {
                if(ops[0].token === 'blank'){
                    callback(QueryFilters.ebvTrue());
                } else {
                    callback(QueryFilters.ebvFalse());
                }
            } else if(builtincall === 'isuri' || builtincall === 'isiri') {
                if(ops[0].token === 'uri'){
                    callback(QueryFilters.ebvTrue());
                } else {
                    callback(QueryFilters.ebvFalse());
                }
            } else if(builtincall === 'sameterm') {
                var op1 = ops[0];
                var op2 = ops[1];
                var res = QueryFilters.RDFTermEquality(op1, op2, queryEngine, env);
                if(QueryFilters.isEbvError(res)) {
                    res = false;
                }
                callback(QueryFilters.ebvBoolean(res));
            } else if(builtincall === 'langmatches') {
                var lang = ops[0];
                var langRange = ops[1];

                if(lang.token === 'literal' && langRange.token === 'literal'){
                    if(langRange.value === '*' && lang.value != '') {
                        callback(QueryFilters.ebvTrue());
                    } else {
                        callback(QueryFilters.ebvBoolean(lang.value.toLowerCase().indexOf(langRange.value.toLowerCase()) === 0));
                    }
                } else {
                    callback(QueryFilters.ebvError());
                }
            } else if(builtincall === 'bound') {
                var boundVar = ops[0].value;
                var acum = [];
                if(boundVar == null) {
                    callback(QueryFilters.ebvError());
                } else  if(bindings[boundVar] != null) {
                    callback(QueryFilters.ebvTrue());
                } else {
                    callback(QueryFilters.ebvFalse());
                }
            } else if(queryEngine.customFns[builtincall] != null) {
                callback(queryEngine.customFns[builtincall](QueryFilters, ops));
            } else {
                throw ("Builtin call "+builtincall+" not implemented yet");
            }
        })
    }
};

QueryFilters.runUnaryExpression = function(unaryexpression, expression, bindings, queryEngine, dataset, env) {
    var op = QueryFilters.runFilter(expression, bindings,queryEngine, dataset, env);
    if(QueryFilters.isEbvError(op)) {
        return op;
    }

    if(unaryexpression === '!') {
        var res = QueryFilters.ebv(op);
        //console.log("** Unary ! ");
        //console.log(op)
        if(QueryFilters.isEbvError(res)) {
            //console.log("--- ERROR")
            //console.log(QueryFilters.ebvFalse())
            //console.log("\r\n")

            // ??
            return QueryFilters.ebvFalse();
        } else {
            res = !res;
            //console.log("--- BOOL")
            //console.log(QueryFilters.ebvBoolean(res))
            //console.log("\r\n")

            return QueryFilters.ebvBoolean(res);
        }
    } else if(unaryexpression === '+') {
        if(QueryFilters.isNumeric(op)) {
            return op;
        } else {
            return QueryFilters.ebvError();
        }
    } else if(unaryexpression === '-') {
        if(QueryFilters.isNumeric(op)) {
            var clone = {};
            for(var p in op) {
                clone[p] = op[p];
            }
            clone.value = -clone.value;
            return clone;
        } else {
            return QueryFilters.ebvError();
        }
    }
};

QueryFilters.runRegex = function(text, pattern, flags, bindings, queryEngine, dataset, env, callback) {
    var regex;
    _.seq(
    function(k) {
      if(text != null) {
        QueryFilters.runFilter(text, bindings, queryEngine, dataset, env, function(result) {
          text = result; k();
        });
      }
      else {
        callback(QueryFilters.ebvError());
      }
    },
    function(k) {
      if(pattern != null) {
        QueryFilters.runFilter(pattern, bindings, queryEngine, dataset, env, function(result) {
          pattern = result; k();
        });
      }
      else {
        callback(QueryFilters.ebvError());
      }
    },
    function(k) {
      if(flags != null) {
        QueryFilters.runFilter(flags, bindings, queryEngine, dataset, env, function(result) {
          flags = result; k();
        })
      }
      else k();
    },
    function(k) {
      if(pattern != null && pattern.token === 'literal' && (flags == null || flags.token === 'literal')) {
        pattern = pattern.value;
        flags = (flags == null) ? null : flags.value;
        k();
      }
      else {
        callback(QueryFilters.ebvError());
      }
    },
    function(k) {
      if(text != null && text.token == 'var') {
        if(bindings[text.value] != null) {
          text = bindings[text.value]; k();
        } else {
          callback(QueryFilters.ebvError());
        }
      }
      else if(text != null && text.token === 'literal') {
        if(text.type == null || QueryFilters.isXsdType('string', text)) {
          text = text.value; k();
        }
        else {
          callback(QueryFilters.ebvError());
        }
      }
      else {
        callback(QueryFilters.ebvError());
      }
    },
    function(k) {
      if(flags == null) {
        regex = new RegExp(pattern);
      }
      else {
        regex = new RegExp(pattern, flags.toLowerCase());
      }
      if(regex.exec(text)) {
        callback(QueryFilters.ebvTrue());
      }
      else {
        callback(QueryFilters.ebvFalse());
      }
    })();
};

QueryFilters.normalizeLiteralDatatype = function(literal, queryEngine, env) {
    if(literal.value.type == null || typeof(literal.value.type) != 'object') {
        return literal;
    } else {
        // type can be parsed as a hash using namespaces
        literal.value.type =  Utils.lexicalFormBaseUri(literal.value.type, env);
        return literal;
    }
};

QueryFilters.runIriRefOrFunction = function(iriref, args, bindings,queryEngine, dataset, env) {
    if(args == null) {
        return iriref;
    } else {
        var ops = [];
        for(var i=0; i<args.length; i++) {
            ops.push(QueryFilters.runFilter(args[i], bindings, queryEngine, dataset, env))
        }

        var fun = Utils.lexicalFormBaseUri(iriref, env);

        if(fun == xmlSchema+"integer" ||
            fun == xmlSchema+"decimal" ||
            fun == xmlSchema+"double" ||
            fun == xmlSchema+"nonPositiveInteger" ||
            fun == xmlSchema+"negativeInteger" ||
            fun == xmlSchema+"long" ||
            fun == xmlSchema+"int" ||
            fun == xmlSchema+"short" ||
            fun == xmlSchema+"byte" ||
            fun == xmlSchema+"nonNegativeInteger" ||
            fun == xmlSchema+"unsignedLong" ||
            fun == xmlSchema+"unsignedInt" ||
            fun == xmlSchema+"unsignedShort" ||
            fun == xmlSchema+"unsignedByte" ||
            fun == xmlSchema+"positiveInteger") {
            var from = ops[0];
            if(from.token === 'literal') {
                from = QueryFilters.normalizeLiteralDatatype(from, queryEngine, env);
                if(from.type == xmlSchema+"integer" ||
                    from.type == xmlSchema+"decimal" ||
                    from.type == xmlSchema+"double" ||
                    from.type == xmlSchema+"nonPositiveInteger" ||
                    from.type == xmlSchema+"negativeInteger" ||
                    from.type == xmlSchema+"long" ||
                    from.type == xmlSchema+"int" ||
                    from.type == xmlSchema+"short" ||
                    from.type == xmlSchema+"byte" ||
                    from.type == xmlSchema+"nonNegativeInteger" ||
                    from.type == xmlSchema+"unsignedLong" ||
                    from.type == xmlSchema+"unsignedInt" ||
                    from.type == xmlSchema+"unsignedShort" ||
                    from.type == xmlSchema+"unsignedByte" ||
                    from.type == xmlSchema+"positiveInteger") {
                    from.type = fun;
                    return from;
                } else if(from.type == 'http://www.w3.org/2001/XMLSchema#boolean') {
                    if(QueryFilters.ebv(from) == true) {
                        from.type = fun;
                        from.value = 1;
                    } else {
                        from.type = fun;
                        from.value = 0;
                    }
                    return from;
                } else if(from.type == 'http://www.w3.org/2001/XMLSchema#float' ||
                    from.type == 'http://www.w3.org/2001/XMLSchema#double') {
                    from.type = fun;
                    from.value = parseInt(from.value);
                    return from;
                } else if(from.type == 'http://www.w3.org/2001/XMLSchema#string' || from.type == null) {
                    if(from.value.split(".").length > 2) {
                        return QueryFilters.ebvError();
                    } else if (from.value.split("-").length > 2) {
                        return QueryFilters.ebvError();
                    } else if (from.value.split("/").length > 2) {
                        return QueryFilters.ebvError();
                    } else if (from.value.split("+").length > 2) {
                        return QueryFilters.ebvError();
                    }

                    // @todo improve this with regular expressions for each lexical representation
                    if(fun == xmlSchema+"decimal") {
                        if(from.value.indexOf("e") != -1 || from.value.indexOf("E") != -1) {
                            return QueryFilters.ebvError();
                        }
                    }

                    // @todo improve this with regular expressions for each lexical representation
                    if(fun == xmlSchema+"int" || fun == xmlSchema+"integer") {
                        if(from.value.indexOf("e") != -1 || from.value.indexOf("E") != -1 || from.value.indexOf(".") != -1) {
                            return QueryFilters.ebvError();
                        }
                    }

                    try {
                        from.value = parseInt(parseFloat(from.value));
                        if(isNaN(from.value)) {
                            return QueryFilters.ebvError();
                        } else {
                            from.type = fun;
                            return from;
                        }
                    } catch(e) {
                        return QueryFilters.ebvError();
                    }
                } else {
                    return QueryFilters.ebvError();
                }
            } else {
                return QueryFilters.ebvError();
            }
        } else if(fun == xmlSchema+"boolean") {
            var from = ops[0];
            if(from.token === "literal" && from.type == null) {
                if(from.value === "true" || from.value === "1") {
                    return QueryFilters.ebvTrue();
                } else if(from.value === "false" || from.value === "0" ) {
                    return QueryFilters.ebvFalse();
                } else {
                    return QueryFilters.ebvError();
                }
            } else if(from.token === "literal") {
                if(QueryFilters.isEbvError(from)) {
                    return from;
                } else {
                    return QueryFilters.ebvBoolean(from);
                }
            } else {
                return QueryFilters.ebvError();
            }
        } else if(fun == xmlSchema+"string") {
            var from = ops[0];
            if(from.token === 'literal') {
                from = QueryFilters.normalizeLiteralDatatype(from, queryEngine, env);
                if(from.type == xmlSchema+"integer" ||
                    from.type == xmlSchema+"decimal" ||
                    from.type == xmlSchema+"double" ||
                    from.type == xmlSchema+"nonPositiveInteger" ||
                    from.type == xmlSchema+"negativeInteger" ||
                    from.type == xmlSchema+"long" ||
                    from.type == xmlSchema+"int" ||
                    from.type == xmlSchema+"short" ||
                    from.type == xmlSchema+"byte" ||
                    from.type == xmlSchema+"nonNegativeInteger" ||
                    from.type == xmlSchema+"unsignedLong" ||
                    from.type == xmlSchema+"unsignedInt" ||
                    from.type == xmlSchema+"unsignedShort" ||
                    from.type == xmlSchema+"unsignedByte" ||
                    from.type == xmlSchema+"positiveInteger" ||
                    from.type == xmlSchema+"float") {
                    from.type = fun;
                    from.value = ""+from.value;
                    return from;
                } else if(from.type == xmlSchema+"string") {
                    return from;
                } else if(from.type == xmlSchema+"boolean") {
                    if(QueryFilters.ebv(from)) {
                        from.type = fun;
                        from.value = 'true';
                    } else {
                        from.type = fun;
                        from.value = 'false';
                    }
                    return from;
                } else if(from.type == xmlSchema+"dateTime" ||
                    from.type == xmlSchema+"date") {
                    from.type = fun;
                    if(typeof(from.value) != 'string') {
                        from.value = Utils.iso8601(from.value);
                    }
                    return from;
                } else if(from.type == null) {
                    from.value = ""+from.value;
                    from.type = fun;
                    return from;
                } else {
                    return QueryFilters.ebvError();
                }
            } else if(from.token === 'uri') {
                return {token: 'literal',
                    value: Utils.lexicalFormBaseUri(from, env),
                    type: fun,
                    lang: null};
            } else {
                return QueryFilters.ebvError();
            }
        } else if(fun == xmlSchema+"dateTime" || fun == xmlSchema+"date") {
            from = ops[0];
            if(from.type == xmlSchema+"dateTime" || from.type == xmlSchema+"date") {
                return from;
            } else if(from.type == xmlSchema+"string" || from.type == null) {
                try {
                    from.value = Utils.iso8601(Utils.parseISO8601(from.value));
                    from.type = fun;
                    return from;
                } catch(e) {
                    return QueryFilters.ebvError();
                }
            } else {
                return QueryFilters.ebvError();
            }
        } else if(fun == xmlSchema+"float") {
            var from = ops[0];
            if(from.token === 'literal') {
                from = QueryFilters.normalizeLiteralDatatype(from, queryEngine, env);
                if(from.type == 'http://www.w3.org/2001/XMLSchema#decimal' ||
                    from.type == 'http://www.w3.org/2001/XMLSchema#int') {
                    from.type = fun;
                    from.value = parseFloat(from.value);
                    return from;
                } else if(from.type == 'http://www.w3.org/2001/XMLSchema#boolean') {
                    if(QueryFilters.ebv(from) == true) {
                        from.type = fun;
                        from.value = 1.0;
                    } else {
                        from.type = fun;
                        from.value = 0.0;
                    }
                    return from;
                } else if(from.type == 'http://www.w3.org/2001/XMLSchema#float' ||
                    from.type == 'http://www.w3.org/2001/XMLSchema#double') {
                    from.type = fun;
                    from.value = parseFloat(from.value);
                    return from;
                } else if(from.type == 'http://www.w3.org/2001/XMLSchema#string') {
                    try {
                        from.value = parseFloat(from.value);
                        if(isNaN(from.value)) {
                            return QueryFilters.ebvError();
                        } else {
                            from.type = fun;
                            return from;
                        }
                    } catch(e) {
                        return QueryFilters.ebvError();
                    }
                } else if(from.type == null) {
                    // checking some exceptions that are parsed as Floats by JS
                    if(from.value.split(".").length > 2) {
                        return QueryFilters.ebvError();
                    } else if (from.value.split("-").length > 2) {
                        return QueryFilters.ebvError();
                    } else if (from.value.split("/").length > 2) {
                        return QueryFilters.ebvError();
                    } else if (from.value.split("+").length > 2) {
                        return QueryFilters.ebvError();
                    }

                    try {
                        from.value = parseFloat(from.value);
                        if(isNaN(from.value)) {
                            return QueryFilters.ebvError();
                        } else {
                            from.type = fun;
                            return from;
                        }
                    } catch(e) {
                        return QueryFilters.ebvError();
                    }
                } else {
                    return QueryFilters.ebvError();
                }
            } else {
                return QueryFilters.ebvError();
            }
        } else {
            // unknown function
            return QueryFilters.ebvError();
        }
    }
};


module.exports = {
    QueryFilters: QueryFilters
};
