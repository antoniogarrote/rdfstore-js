// exports
exports.QueryFilters = {};
var QueryFilters = exports.QueryFilters;

// imports
var Utils = require("./../../js-trees/src/utils").Utils;

QueryFilters.checkFilters = function(pattern, bindings, queryEnv, queryEngine, callback) {
    var filters = pattern.filter;
    if(filters && filters[0]) {
        QueryFilters.run(filters[0].value, bindings, queryEnv, queryEngine, callback);
    } else {
        callback(true, bindings);
    }
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
                acum = acum.concat(QueryFilters.boundVars(filterExpr.summands[i].expression))
            }

            return acum;
        } else if(expressionType == 'regex') {
            var acum = QueryFilters.boundVars(filterExpr.expression1);
            return acum.concat(QueryFilters.boundVars(filterExpr.expression2));
        } else if(expressionType == 'unaryexpression') {
            return QueryFilters.boundVars(filterExpr.expression);
        } else if(expressionType == 'atomic') {           
            if(filterExpr.primaryexpression == 'var') {
                //console.log("ATOMIC VAR:")
                //console.log([filterExpr.value]);
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

QueryFilters.run = function(filterExpr, bindings, env, queryEngine, callback) {    
    queryEngine.copyDenormalizedBindings(bindings, env.outCache, function(success, denormBindings){
        if(success === true) {
            var filteredBindings = [];
            for(var i=0; i<bindings.length; i++) {
                var thisDenormBindings = denormBindings[i];
                var ebv = QueryFilters.runFilter(filterExpr, thisDenormBindings, queryEngine, env);
                
                // ebv can be directly a RDFTerm (e.g. atomic expression in filter)
                // this additional call to ebv will return -> true/false/error
                var ebv = QueryFilters.ebv(ebv);

                if(QueryFilters.isEbvError(ebv)) {
                    // error
                } else if(ebv === true) {
                    // true
                    filteredBindings.push(bindings[i]);
                } else {
                    // false
                }
            }
            callback(true, filteredBindings);
        } else {
            callback(success, denormBindings);
        }
    });
};

QueryFilters.collect = function(filterExpr, bindings, env, queryEngine, callback) {
    queryEngine.copyDenormalizedBindings(bindings, env.outCache, function(success, denormBindings){
        if(success === true) {
            var filteredBindings = [];
            for(var i=0; i<bindings.length; i++) {
                var thisDenormBindings = denormBindings[i];
                var ebv = QueryFilters.runFilter(filterExpr, thisDenormBindings, queryEngine, env);
                filteredBindings.push({binding:bindings[i], value:ebv});
            }
            callback(true, filteredBindings);
        } else {
            callback(success, denormBindings);
        }
    });
};


QueryFilters.runFilter = function(filterExpr, bindings, queryEngine, env) {
    if(filterExpr.expressionType != null) {
        var expressionType = filterExpr.expressionType;
        if(expressionType == 'relationalexpression') {
            var op1 = QueryFilters.runFilter(filterExpr.op1, bindings,queryEngine, env);
            var op2 = QueryFilters.runFilter(filterExpr.op2, bindings,queryEngine, env);
            return QueryFilters.runRelationalFilter(filterExpr, op1, op2, bindings, queryEngine, env);
        } else if(expressionType == 'conditionalor') {
            return QueryFilters.runOrFunction(filterExpr, bindings, queryEngine, env);
        } else if (expressionType == 'conditionaland') {
            return QueryFilters.runAndFunction(filterExpr, bindings, queryEngine, env);
        } else if(expressionType == 'additiveexpression') {
            return QueryFilters.runAddition(filterExpr.summand, filterExpr.summands, bindings, queryEngine, env);
        } else if(expressionType == 'builtincall') {
            return QueryFilters.runBuiltInCall(filterExpr.builtincall, filterExpr.args, bindings, queryEngine, env);
        } else if(expressionType == 'multiplicativeexpression') {
            return QueryFilters.runMultiplication(filterExpr.factor, filterExpr.factors, bindings, queryEngine, env);
        } else if(expressionType == 'unaryexpression') {
            return QueryFilters.runUnaryExpression(filterExpr.unaryexpression, filterExpr.expression, bindings);
        } else if(expressionType == 'irireforfunction') {
            return QueryFilters.runIriRefOrFunction(filterExpr.iriref, filterExpr.args, bindings, queryEngine, env);
        } else if(expressionType == 'atomic') {        
            if(filterExpr.primaryexpression == 'var') {
                // lookup the var in the bindings
                var val = bindings[filterExpr.value.value];
                return val;
            } else {
                // numeric, literal, etc...
                //return queryEngine.filterExpr.value;
                if(typeof(filterExpr.value) != 'object') {
                    return filterExpr.value
                } else {
                    if(filterExpr.value.type == null || typeof(filterExpr.value.type) != 'object') {
                        return filterExpr.value
                    } else {
                        // type can be parsed as a hash using namespaces
                        filterExpr.value.type =  queryEngine.normalizeBaseUri(filterExpr.value.type, env);
                        return filterExpr.value
                    }
                }
            }
        } else {
            throw("Unknown filter expression type");
        }
    } else {
        throw("Cannot find bound expressions in a no expression token");
    }
};

QueryFilters.isRDFTerm = function(val) {
    if((val.token && val.token == 'literal') ||
       (val.token && val.token == 'uri') ||
       (val.token && val.token == 'blank')) {
        return true;
    } else {
        return false;
    }
};


QueryFilters.RDFTermEquality = function(v1, v2, queryEngine, env) {
    if(v1.token === 'literal' && v2.token === 'literal') {
        //console.log("RDF TERM EQUALITY");
        //console.log(v1.value);
        //console.log(v2.value);
        if(v1.lang == v2.lang && v1.type == v2.type && v1.value == v2.value) {
            return true;
        } else {
            return false;
        }
    } else if(v1.token === 'uri' && v2.token === 'uri') {
        return queryEngine.normalizeBaseUri(v1, env) == queryEngine.normalizeBaseUri(v2, env);
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
        if(val.type == "http://www.w3.org/2001/XMLSchema#integer" ||
           val.type == "http://www.w3.org/2001/XMLSchema#decimal" ||
           val.type == "http://www.w3.org/2001/XMLSchema#double" ||
           val.type == "http://www.w3.org/2001/XMLSchema#nonPositiveInteger" ||
           val.type == "http://www.w3.org/2001/XMLSchema#negativeInteger" ||
           val.type == "http://www.w3.org/2001/XMLSchema#long" ||
           val.type == "http://www.w3.org/2001/XMLSchema#int" ||
           val.type == "http://www.w3.org/2001/XMLSchema#short" ||
           val.type == "http://www.w3.org/2001/XMLSchema#byte" ||
           val.type == "http://www.w3.org/2001/XMLSchema#nonNegativeInteger" ||
           val.type == "http://www.w3.org/2001/XMLSchema#unsignedLong" ||
           val.type == "http://www.w3.org/2001/XMLSchema#unsignedInt" ||
           val.type == "http://www.w3.org/2001/XMLSchema#unsignedShort" ||
           val.type == "http://www.w3.org/2001/XMLSchema#unsignedByte" ||
           val.type == "http://www.w3.org/2001/XMLSchema#positiveInteger" ) {
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
        if(val.type == "http://www.w3.org/2001/XMLSchema#float") {
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
        if(val.type == "http://www.w3.org/2001/XMLSchema#integer" ||
           val.type == "http://www.w3.org/2001/XMLSchema#decimal" ||
           val.type == "http://www.w3.org/2001/XMLSchema#float" ||
           val.type == "http://www.w3.org/2001/XMLSchema#double" ||
           val.type == "http://www.w3.org/2001/XMLSchema#nonPositiveInteger" ||
           val.type == "http://www.w3.org/2001/XMLSchema#negativeInteger" ||
           val.type == "http://www.w3.org/2001/XMLSchema#long" ||
           val.type == "http://www.w3.org/2001/XMLSchema#int" ||
           val.type == "http://www.w3.org/2001/XMLSchema#short" ||
           val.type == "http://www.w3.org/2001/XMLSchema#byte" ||
           val.type == "http://www.w3.org/2001/XMLSchema#nonNegativeInteger" ||
           val.type == "http://www.w3.org/2001/XMLSchema#unsignedLong" ||
           val.type == "http://www.w3.org/2001/XMLSchema#unsignedInt" ||
           val.type == "http://www.w3.org/2001/XMLSchema#unsignedShort" ||
           val.type == "http://www.w3.org/2001/XMLSchema#unsignedByte" ||
           val.type == "http://www.w3.org/2001/XMLSchema#positiveInteger" ) {
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
        return val.type == "http://www.w3.org/2001/XMLSchema#"+val;
    } else {
        return false;
    }
};

QueryFilters.ebv = function(term) {
    if(term == null) {
        return QueryFilters.ebvError();
    } else {
        if(term.token && term.token === 'literal') {
          if(term.type == "http://www.w3.org/2001/XMLSchema#integer" ||
             term.type == "http://www.w3.org/2001/XMLSchema#decimal" ||
             term.type == "http://www.w3.org/2001/XMLSchema#double" ||
             term.type == "http://www.w3.org/2001/XMLSchema#nonPositiveInteger" ||
             term.type == "http://www.w3.org/2001/XMLSchema#negativeInteger" ||
             term.type == "http://www.w3.org/2001/XMLSchema#long" ||
             term.type == "http://www.w3.org/2001/XMLSchema#int" ||
             term.type == "http://www.w3.org/2001/XMLSchema#short" ||
             term.type == "http://www.w3.org/2001/XMLSchema#byte" ||
             term.type == "http://www.w3.org/2001/XMLSchema#nonNegativeInteger" ||
             term.type == "http://www.w3.org/2001/XMLSchema#unsignedLong" ||
             term.type == "http://www.w3.org/2001/XMLSchema#unsignedInt" ||
             term.type == "http://www.w3.org/2001/XMLSchema#unsignedShort" ||
             term.type == "http://www.w3.org/2001/XMLSchema#unsignedByte" ||
             term.type == "http://www.w3.org/2001/XMLSchema#positiveInteger" ) {
              return parseFloat(term.value) != 0;
          } else if(term.type === "http://www.w3.org/2001/XMLSchema#boolean"){
              return (term.value === 'true' || term.value === true || term.value === 'True');
          } else if(term.type === "http://www.w3.org/2001/XMLSchema#string"){
              return term.value != "";
          } else if(term.type === "http://www.w3.org/2001/XMLSchema#dateTime"){
              return (new Date(term.value)) != null;
          } else if(QueryFilters.isEbvError(term)) {
              return term;
          } else if(term.type == null) {
              if( term.value != "") {
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
}


QueryFilters.ebvTrue = function() {
    val = {token: 'literal', type:"http://www.w3.org/2001/XMLSchema#boolean", value:true};
    return val;
};

QueryFilters.ebvFalse = function() {
    val = {token: 'literal', type:"http://www.w3.org/2001/XMLSchema#boolean", value:false};
    return val;
};

QueryFilters.ebvError = function() {
    val = {token: 'literal', type:"https://github.com/antoniogarrote/js-tools/types#error", value:null};
    return val;
};

QueryFilters.isEbvError = function(term) {
    if(typeof(term) == 'object' && term != null) {
        return term.type === "https://github.com/antoniogarrote/js-tools/types#error";
    } else {
        return false;
    }
};

QueryFilters.ebvBoolean = function(bool) {    
    if(bool === true) {
        return QueryFilters.ebvTrue();
    } else {
        return QueryFilters.ebvFalse();
    }
}


QueryFilters.runRelationalFilter = function(filterExpr, op1, op2, bindings, queryEngine, env) {
    var operator = filterExpr.operator;
    if(operator === '=') {
        return QueryFilters.runEqualityFunction(op1, op2, bindings, queryEngine, env);
    } else if(operator === '!=') {
        var res = QueryFilters.runEqualityFunction(op1, op2, bindings, queryEngine, env);
        if(QueryFilters.isEbvError(res)) {
            return res;
        } else {
            res.value = !res.value;
            return res;
        }
    } else if(operator === '<') {
        return QueryFilters.runLtFunction(op1, op2, bindings);
    } else if(operator === '>') {
        return QueryFilters.runGtFunction(op1, op2, bindings);
    } else if(operator === '<=') {
        return QueryFilters.runLtEqFunction(op1, op2, bindings);
    } else if(operator === '>=') {
        return QueryFilters.runGtEqFunction(op1, op2, bindings);
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
        if(val.type == "http://www.w3.org/2001/XMLSchema#integer") {
            return parseInt(val.value);
        } else if(val.type == "http://www.w3.org/2001/XMLSchema#decimal") {
            return parseFloat(val.value);
        } else if (val.type == "http://www.w3.org/2001/XMLSchema#float") {
            return parseFloat(val.value);
        } else if (val.type == "http://www.w3.org/2001/XMLSchema#double") {
            return parseFloat(val.value);
        } else if (val.type == "http://www.w3.org/2001/XMLSchema#nonPositiveInteger") {
            return parseInt(val.value);
        } else if (val.type == "http://www.w3.org/2001/XMLSchema#negativeInteger") {
            return parseInt(val.value);
        } else if (val.type == "http://www.w3.org/2001/XMLSchema#long") {
            return parseInt(val.value);
        } else if (val.type == "http://www.w3.org/2001/XMLSchema#int") {
            return parseInt(val.value);
        } else if (val.type == "http://www.w3.org/2001/XMLSchema#short") {
            return parseInt(val.value);
        } else if (val.type == "http://www.w3.org/2001/XMLSchema#byte") {
            return parseInt(val.value);
        } else if (val.type == "http://www.w3.org/2001/XMLSchema#nonNegativeInteger") {
            return parseInt(val.value);
        } else if (val.type == "http://www.w3.org/2001/XMLSchema#unsignedLong") {
            return parseInt(val.value);
        } else if (val.type == "http://www.w3.org/2001/XMLSchema#unsignedInt") {
            return parseInt(val.value);
        } else if (val.type == "http://www.w3.org/2001/XMLSchema#unsignedShort") {
            return parseInt(val.value);
        } else if (val.type == "http://www.w3.org/2001/XMLSchema#unsignedByte") {
            return parseInt(val.value);
        } else if (val.type == "http://www.w3.org/2001/XMLSchema#positiveInteger" ) {
            return parseInt(val.value);
        } else if (val.type == "http://www.w3.org/2001/XMLSchema#dateTime" ) {
            return new Date(val.value);
        } else if (val.type == "http://www.w3.org/2001/XMLSchema#boolean" ) {
            return val.value === true || val.value === 'true' || val.value === '1' || val.value === 1 || val.value === true ? true :
                val.value === false || val.value === 'false' || val.value === '0' || val.value === 0 || val.value === false ? false :
                undefined;
        } else if (val.type == "http://www.w3.org/2001/XMLSchema#string" ) {
            return val.value === null || val.value === undefined ? undefined : ''+val.value;
        } else if (val.type == null) {
            // plain literal -> just manipulate the string
            return val.value;
        } else {
            val.value
        }
    } else {
        // @todo
        console.log("not implemented yet");
        throw("value not supported in operations yet");
    }
};

QueryFilters.runOrFunction = function(filterExpr, bindings, queryEngine, env) {
    for(var i=0; i< filterExpr.operands.length; i++) {
        var ebv = QueryFilters.runFilter(filterExpr.operands[i], bindings, queryEngine, env);
        if(QueryFilters.ebv(ebv) === true) {
            return ebv;
        }
    }

    return QueryFilters.ebvBoolean(false);
};

QueryFilters.runAndFunction = function(filterExpr, bindings, queryEngine, env) {
    for(var i=0; i< filterExpr.operands.length; i++) {
        var ebv = QueryFilters.runFilter(filterExpr.operands[i], bindings,queryEngine, env);
        if(QueryFilters.ebv(ebv) === false) {
            return ebv;
        }
    }

    return QueryFilters.ebvBoolean(true);
};


QueryFilters.runEqualityFunction = function(op1, op2, bindings, queryEngine, env) {
    //console.log("Equality Function");
    //console.log(op1)
    //console.log(op2)
    if(QueryFilters.isEbvError(op1) || QueryFilters.isEbvError(op2)) {
        return QueryFilters.ebvError();
    }
    if(QueryFilters.isNumeric(op1) && QueryFilters.isNumeric(op2)) {
        return QueryFilters.ebvBoolean(QueryFilters.effectiveTypeValue(op1) == QueryFilters.effectiveTypeValue(op2));
    } else if(QueryFilters.isSimpleLiteral(op1) && QueryFilters.isSimpleLiteral(op2)) {
        //console.log("BOTH SIMPLE LITERALS")
        //console.log(QueryFilters.effectiveTypeValue(op1))
        //console.log(QueryFilters.effectiveTypeValue(op2))
        return QueryFilters.ebvBoolean(QueryFilters.effectiveTypeValue(op1) == QueryFilters.effectiveTypeValue(op2));       
    } else if(QueryFilters.isXsdType("string", op1) && QueryFilters.isXsdType("string", op2)) {
        return QueryFilters.ebvBoolean(QueryFilters.effectiveTypeValue(op1) == QueryFilters.effectiveTypeValue(op2));       
    } else if(QueryFilters.isXsdType("boolean", op1) && QueryFilters.isXsdType("boolean", op2)) {
        return QueryFilters.ebvBoolean(QueryFilters.effectiveTypeValue(op1) == QueryFilters.effectiveTypeValue(op2));
    } else if(QueryFilters.isXsdType("dateTime", op1) && QueryFilters.isXsdType("dateTime", op2)) {
        return QueryFilters.ebvBoolean(QueryFilters.effectiveTypeValue(op1).getTime() == QueryFilters.effectiveTypeValue(op2).getTime());
    } else if(QueryFilters.isRDFTerm(op1) && QueryFilters.isRDFTerm(op2)) {
        //console.log("BOTH RDF TERMS")
        return QueryFilters.ebvBoolean(QueryFilters.RDFTermEquality(op1, op2, queryEngine, env));
    } else {
        return QueryFilters.ebvFalse();
    }
};

QueryFilters.runGtFunction = function(op1, op2, bindings) {
    if(QueryFilters.isEbvError(op1) || QueryFilters.isEbvError(op2)) {
        return QueryFilters.ebvError();
    }

    if(QueryFilters.isNumeric(op1) && QueryFilters.isNumeric(op2)) {
        return QueryFilters.ebvBoolean(QueryFilters.effectiveTypeValue(op1) > QueryFilters.effectiveTypeValue(op2));
    } else if(QueryFilters.isSimpleLiteral(op1) && QueryFilters.isSimpleLiteral(op2)) {
        return QueryFilters.ebvBoolean(QueryFilters.effectiveTypeValue(op1) > QueryFilters.effectiveTypeValue(op2));       
    } else if(QueryFilters.isXsdType("string", op1) && QueryFilters.isXsdType("string", op2)) {
        return QueryFilters.ebvBoolean(QueryFilters.effectiveTypeValue(op1) > QueryFilters.effectiveTypeValue(op2));       
    } else if(QueryFilters.isXsdType("boolean", op1) && QueryFilters.isXsdType("boolean", op2)) {
        return QueryFilters.ebvBoolean(QueryFilters.effectiveTypeValue(op1) > QueryFilters.effectiveTypeValue(op2));
    } else if(QueryFilters.isXsdType("dateTime", op1) && QueryFilters.isXsdType("dateTime", op2)) {
        return QueryFilters.ebvBoolean(QueryFilters.effectiveTypeValue(op1).getTime() > QueryFilters.effectiveTypeValue(op2).getTime());
    } else {
        return QueryFilters.ebvFalse();
    }
};

/**
 * Total gt function used when sorting bindings in the SORT BY clause.
 *
 * @todo
 * Some criteria are not clear
 */
QueryFilters.runTotalGtFunction = function(op1,op2) {
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


QueryFilters.runLtFunction = function(op1, op2, bindings) {
    if(QueryFilters.isEbvError(op1) || QueryFilters.isEbvError(op2)) {
        return QueryFilters.ebvError();
    }

    if(QueryFilters.isNumeric(op1) && QueryFilters.isNumeric(op2)) {
        return QueryFilters.ebvBoolean(QueryFilters.effectiveTypeValue(op1) < QueryFilters.effectiveTypeValue(op2));
    } else if(QueryFilters.isSimpleLiteral(op1) && QueryFilters.isSimpleLiteral(op2)) {
        return QueryFilters.ebvBoolean(QueryFilters.effectiveTypeValue(op1) < QueryFilters.effectiveTypeValue(op2));       
    } else if(QueryFilters.isXsdType("string", op1) && QueryFilters.isXsdType("string", op2)) {
        return QueryFilters.ebvBoolean(QueryFilters.effectiveTypeValue(op1) < QueryFilters.effectiveTypeValue(op2));       
    } else if(QueryFilters.isXsdType("boolean", op1) && QueryFilters.isXsdType("boolean", op2)) {
        return QueryFilters.ebvBoolean(QueryFilters.effectiveTypeValue(op1) < QueryFilters.effectiveTypeValue(op2));
    } else if(QueryFilters.isXsdType("dateTime", op1) && QueryFilters.isXsdType("dateTime", op2)) {
        return QueryFilters.ebvBoolean(QueryFilters.effectiveTypeValue(op1).getTime() < QueryFilters.effectiveTypeValue(op2).getTime());
    } else {
        return QueryFilters.ebvFalse();
    }
};


QueryFilters.runGtEqFunction = function(op1, op2, bindings) {
    if(QueryFilters.isEbvError(op1) || QueryFilters.isEbvError(op2)) {
        return QueryFilters.ebvError();
    }

    if(QueryFilters.isNumeric(op1) && QueryFilters.isNumeric(op2)) {
        return QueryFilters.ebvBoolean(QueryFilters.effectiveTypeValue(op1) >= QueryFilters.effectiveTypeValue(op2));
    } else if(QueryFilters.isSimpleLiteral(op1) && QueryFilters.isSimpleLiteral(op2)) {
        return QueryFilters.ebvBoolean(QueryFilters.effectiveTypeValue(op1) >= QueryFilters.effectiveTypeValue(op2));       
    } else if(QueryFilters.isXsdType("string", op1) && QueryFilters.isXsdType("string", op2)) {
        return QueryFilters.ebvBoolean(QueryFilters.effectiveTypeValue(op1) >= QueryFilters.effectiveTypeValue(op2));       
    } else if(QueryFilters.isXsdType("boolean", op1) && QueryFilters.isXsdType("boolean", op2)) {
        return QueryFilters.ebvBoolean(QueryFilters.effectiveTypeValue(op1) >= QueryFilters.effectiveTypeValue(op2));
    } else if(QueryFilters.isXsdType("dateTime", op1) && QueryFilters.isXsdType("dateTime", op2)) {
        return QueryFilters.ebvBoolean(QueryFilters.effectiveTypeValue(op1).getTime() >= QueryFilters.effectiveTypeValue(op2).getTime());
    } else {
        return QueryFilters.ebvFalse();
    }
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
    } else if(QueryFilters.isXsdType("dateTime", op1) && QueryFilters.isXsdType("dateTime", op2)) {
        return QueryFilters.ebvBoolean(QueryFilters.effectiveTypeValue(op1).getTime() <= QueryFilters.effectiveTypeValue(op2).getTime());
    } else {
        return QueryFilters.ebvFalse();
    }
};

QueryFilters.runAddition = function(summand, summands, bindings, queryEngine, env) {
    var summandOp = QueryFilters.runFilter(summand,bindings,queryEngine, env);
    if(QueryFilters.isEbvError(summandOp)) {
        return QueryFilters.ebvError();
    }

    var acum = summandOp;
    if(QueryFilters.isNumeric(summandOp)) {
        for(var i=0; i<summands.length; i++) {
            var nextSummandOp = QueryFilters.runFilter(summands[i].expression, bindings,queryEngine, env);
            if(QueryFilters.isNumeric(nextSummandOp)) {
                if(summands[i].operator === '+') {
                    acum = QueryFilters.runSumFunction(acum, nextSummandOp);
                } else if(summands[i].operator === '-') {
                    acum = QueryFilters.runSubFunction(acum, nextSummandOp);
                }
            } else {
                return QueryFilters.ebvFalse();
            }
        }
        return acum;
    } else {
        return QueryFilters.ebvFalse();
    }
};

QueryFilters.runSumFunction = function(suma, sumb) {
    if(QueryFilters.isEbvError(suma) || QueryFilters.isEbvError(sumb)) {
        return QueryFilters.ebvError();
    }

    if(QueryFilters.isFloat(suma) || QueryFilters.isFloat(sumb)) {
        var val = QueryFilters.effectiveTypeValue(suma) + QueryFilters.effectiveTypeValue(sumb);
        return {token: 'literal', type:"http://www.w3.org/2001/XMLSchema#float", value:val};        
    } else {
        var val = QueryFilters.effectiveTypeValue(suma) + QueryFilters.effectiveTypeValue(sumb);
        return {token: 'literal', type:"http://www.w3.org/2001/XMLSchema#integer", value:val};        
    }
};

QueryFilters.runSubFunction = function(suma, sumb) {
    if(QueryFilters.isEbvError(suma) || QueryFilters.isEbvError(sumb)) {
        return QueryFilters.ebvError();
    }

    if(QueryFilters.isFloat(suma) || QueryFilters.isFloat(sumb)) {
        var val = QueryFilters.effectiveTypeValue(suma) - QueryFilters.effectiveTypeValue(sumb);
        return {token: 'literal', type:"http://www.w3.org/2001/XMLSchema#float", value:val};        
    } else {
        var val = QueryFilters.effectiveTypeValue(suma) - QueryFilters.effectiveTypeValue(sumb);
        return {token: 'literal', type:"http://www.w3.org/2001/XMLSchema#integer", value:val};        
    }
};

QueryFilters.runMultiplication = function(factor, factors, bindings, queryEngine, env) {
    var factorOp = QueryFilters.runFilter(factor,bindings,queryEngine, env);
    if(QueryFilters.isEbvError(factorOp)) {
        return factorOp;
    }

    var acum = factorOp;
    if(QueryFilters.isNumeric(factorOp)) {
        for(var i=0; i<factors.length; i++) {
            var nextFactorOp = QueryFilters.runFilter(factors[i].expression, bindings,queryEngine, env);
            if(QueryFilters.isEbvError(nextFactorOp)) {
                return factorOp;
            }
            if(QueryFilters.isNumeric(nextFactorOp)) {
                if(factors[i].operator === '*') {
                    acum = QueryFilters.runMulFunction(acum, nextFactorOp);
                } else if(factors[i].operator === '/') {
                    acum = QueryFilters.runDivFunction(acum, nextFactorOp);
                }
            } else {
                return QueryFilters.ebvFalse();
            }
        }
        return acum;
    } else {
        return QueryFilters.ebvFalse();
    }
};

QueryFilters.runMulFunction = function(faca, facb) {
    if(QueryFilters.isEbvError(faca) || QueryFilters.isEbvError(facb)) {
        return QueryFilters.ebvError();
    }

    if(QueryFilters.isFloat(faca) || QueryFilters.isFloat(facb)) {
        var val = QueryFilters.effectiveTypeValue(faca) * QueryFilters.effectiveTypeValue(facb);
        return {token: 'literal', type:"http://www.w3.org/2001/XMLSchema#float", value:val};        
    } else {
        var val = QueryFilters.effectiveTypeValue(faca) * QueryFilters.effectiveTypeValue(facb);
        return {token: 'literal', type:"http://www.w3.org/2001/XMLSchema#integer", value:val};        
    }
};

QueryFilters.runDivFunction = function(faca, facb) {
    if(QueryFilters.isEbvError(faca) || QueryFilters.isEbvError(facb)) {
        return QueryFilters.ebvError();
    }

    if(QueryFilters.isFloat(faca) || QueryFilters.isFloat(facb)) {
        var val = QueryFilters.effectiveTypeValue(faca) / QueryFilters.effectiveTypeValue(facb);
        return {token: 'literal', type:"http://www.w3.org/2001/XMLSchema#float", value:val};        
    } else {
        var val = QueryFilters.effectiveTypeValue(faca) / QueryFilters.effectiveTypeValue(facb);
        return {token: 'literal', type:"http://www.w3.org/2001/XMLSchema#integer", value:val};        
    }
};

QueryFilters.runBuiltInCall = function(builtincall, args, bindings, queryEngine, env) {
    var ops = [];
    for(var i=0; i<args.length; i++) {
        var op = QueryFilters.runFilter(args[i], bindings, queryEngine, env);
        if(QueryFilters.isEbvError(op)) {
            return op;
        }
        ops.push(op);
    }

    if(builtincall === 'str') {
        //console.log("STR")
        //console.log(ops[0])
        if(ops[0].token === 'literal') {
            // lexical form literals
            return {token: 'literal', type:null, value:""+ops[0].value}; // type null? or "http://www.w3.org/2001/XMLSchema#string"
        } else if(ops[0].token === 'uri'){
            // codepoint URIs
            return {token: 'literal', type:null, value:ops[0].value}; // idem
        } else {
            return QueryFilters.ebvFalse();
        }
    } else if(builtincall === 'lang') {
        if(ops[0].token === 'literal'){
            if(ops[0].lang != null) {
                return {token: 'literal', value:""+ops[0].lang};
            } else {
                return {token: 'literal', value:""};
            }
        } else {
            return QueryFilters.ebvError();
        }
    } else if(builtincall === 'datatype') {
        if(ops[0].token === 'literal'){
            var lit = ops[0];
            if(lit.type != null) {
                if(typeof(lit.type) === 'string') {
                    return {token: 'uri', value:lit.type, prefix:null, suffix:null};
                } else {
                    return lit.type;
                }
            } else if(lit.lang == null) {
                return {token: 'uri', value:'http://www.w3.org/2001/XMLSchema#string', prefix:null, suffix:null};
            } else {
                return QueryFilters.ebvError();
            }
        } else {
            return QueryFilters.ebvError();
        }
    } else if(builtincall === 'isliteral') {
        if(ops[0].token === 'literal'){
            return QueryFilters.ebvTrue();
        } else {
            return QueryFilters.ebvFalse();
        }        
    } else if(builtincall === 'isblank') {
        if(ops[0].token === 'blank'){
            return QueryFilters.ebvTrue();
        } else {
            return QueryFilters.ebvFalse();
        }        
    } else {
        throw ("Builtin call "+builtincall+" not implemented yet");
    }
};

QueryFilters.runUnaryExpression = function(unaryexpression, expression, bindings, queryEngine, env) {
    var op = QueryFilters.runFilter(expression, bindings,queryEngine, env);
    if(QueryFilters.isEbvError(op)) {
        return factorOp;
    }

    if(unaryexpression === '!') {
        var res = QueryFilters.ebv(op);
        if(QueryFilters.isEbvError(res)) {
            return res;
        } else {
            res = !res;
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
            op.value = -op.value;
            return op;
        } else {
            return QueryFilters.ebvError();
        }
    }
};

QueryFilters.normalizeLiteralDatatype = function(literal, queryEngine, env) {
    if(literal.value.type == null || typeof(literal.value.type) != 'object') {
        return literal;
    } else {
        // type can be parsed as a hash using namespaces
        literal.value.type =  queryEngine.normalizeBaseUri(literal.value.type, env);
        return literal;
    }
};

QueryFilters.runIriRefOrFunction = function(iriref, args, bindings,queryEngine, env) {
    if(args == null) {
        return iriref;
    } else {
        var ops = [];
        for(var i=0; i<args.length; i++) {
            ops.push(QueryFilters.runFilter(args[i], bindings, queryEngine, env))
        }

        var fun = queryEngine.normalizeBaseUri(iriref, env);

        if(fun == "http://www.w3.org/2001/XMLSchema#integer" ||
           fun == "http://www.w3.org/2001/XMLSchema#decimal" ||
           fun == "http://www.w3.org/2001/XMLSchema#double" ||
           fun == "http://www.w3.org/2001/XMLSchema#nonPositiveInteger" ||
           fun == "http://www.w3.org/2001/XMLSchema#negativeInteger" ||
           fun == "http://www.w3.org/2001/XMLSchema#long" ||
           fun == "http://www.w3.org/2001/XMLSchema#int" ||
           fun == "http://www.w3.org/2001/XMLSchema#short" ||
           fun == "http://www.w3.org/2001/XMLSchema#byte" ||
           fun == "http://www.w3.org/2001/XMLSchema#nonNegativeInteger" ||
           fun == "http://www.w3.org/2001/XMLSchema#unsignedLong" ||
           fun == "http://www.w3.org/2001/XMLSchema#unsignedInt" ||
           fun == "http://www.w3.org/2001/XMLSchema#unsignedShort" ||
           fun == "http://www.w3.org/2001/XMLSchema#unsignedByte" ||
           fun == "http://www.w3.org/2001/XMLSchema#positiveInteger") {
            var from = ops[0];
            if(from.token === 'literal') {
                from = QueryFilters.normalizeLiteralDatatype(from, queryEngine, env);
                if(from.type == "http://www.w3.org/2001/XMLSchema#integer" ||
                   from.type == "http://www.w3.org/2001/XMLSchema#decimal" ||
                   from.type == "http://www.w3.org/2001/XMLSchema#double" ||
                   from.type == "http://www.w3.org/2001/XMLSchema#nonPositiveInteger" ||
                   from.type == "http://www.w3.org/2001/XMLSchema#negativeInteger" ||
                   from.type == "http://www.w3.org/2001/XMLSchema#long" ||
                   from.type == "http://www.w3.org/2001/XMLSchema#int" ||
                   from.type == "http://www.w3.org/2001/XMLSchema#short" ||
                   from.type == "http://www.w3.org/2001/XMLSchema#byte" ||
                   from.type == "http://www.w3.org/2001/XMLSchema#nonNegativeInteger" ||
                   from.type == "http://www.w3.org/2001/XMLSchema#unsignedLong" ||
                   from.type == "http://www.w3.org/2001/XMLSchema#unsignedInt" ||
                   from.type == "http://www.w3.org/2001/XMLSchema#unsignedShort" ||
                   from.type == "http://www.w3.org/2001/XMLSchema#unsignedByte" ||
                   from.type == "http://www.w3.org/2001/XMLSchema#positiveInteger") {
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
                    if(fun == "http://www.w3.org/2001/XMLSchema#decimal") {
                        if(from.value.indexOf("e") != -1 || from.value.indexOf("E") != -1) {
                            return QueryFilters.ebvError();
                        }
                    }

                    // @todo improve this with regular expressions for each lexical representation
                    if(fun == "http://www.w3.org/2001/XMLSchema#int" || fun == "http://www.w3.org/2001/XMLSchema#integer") {
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
        } else if(fun == "http://www.w3.org/2001/XMLSchema#boolean") { 
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
        } else if(fun == "http://www.w3.org/2001/XMLSchema#string") { 
            var from = ops[0];
            if(from.token === 'literal') {
                from = QueryFilters.normalizeLiteralDatatype(from, queryEngine, env);
                if(from.type == "http://www.w3.org/2001/XMLSchema#integer" ||
                   from.type == "http://www.w3.org/2001/XMLSchema#decimal" ||
                   from.type == "http://www.w3.org/2001/XMLSchema#double" ||
                   from.type == "http://www.w3.org/2001/XMLSchema#nonPositiveInteger" ||
                   from.type == "http://www.w3.org/2001/XMLSchema#negativeInteger" ||
                   from.type == "http://www.w3.org/2001/XMLSchema#long" ||
                   from.type == "http://www.w3.org/2001/XMLSchema#int" ||
                   from.type == "http://www.w3.org/2001/XMLSchema#short" ||
                   from.type == "http://www.w3.org/2001/XMLSchema#byte" ||
                   from.type == "http://www.w3.org/2001/XMLSchema#nonNegativeInteger" ||
                   from.type == "http://www.w3.org/2001/XMLSchema#unsignedLong" ||
                   from.type == "http://www.w3.org/2001/XMLSchema#unsignedInt" ||
                   from.type == "http://www.w3.org/2001/XMLSchema#unsignedShort" ||
                   from.type == "http://www.w3.org/2001/XMLSchema#unsignedByte" ||
                   from.type == "http://www.w3.org/2001/XMLSchema#positiveInteger" ||
                   from.type == "http://www.w3.org/2001/XMLSchema#float") {
                    from.type = fun;
                    from.value = ""+from.value;
                    return from;
                } else if(from.type == "http://www.w3.org/2001/XMLSchema#string") {
                    return from;
                } else if(from.type == "http://www.w3.org/2001/XMLSchema#boolean") {
                    if(QueryFilters.ebv(from)) {
                        from.type = fun;
                        from.value = 'true';
                    } else {
                        from.type = fun;
                        from.value = 'false';
                    }
                    return from;
                } else if(from.type == "http://www.w3.org/2001/XMLSchema#dateTime") {
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
                        value: queryEngine.normalizeBaseUri(from, env),
                        type: fun,
                        lang: null};
            } else {
                return QueryFilters.ebvError();
            }            
        } else if(fun == "http://www.w3.org/2001/XMLSchema#dateTime") { 
            from = ops[0];
            if(from.type == "http://www.w3.org/2001/XMLSchema#dateTime") {
                return from;
            } else if(from.type == "http://www.w3.org/2001/XMLSchema#string" || from.type == null) {
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
        } else if(fun == "http://www.w3.org/2001/XMLSchema#float") { 
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
