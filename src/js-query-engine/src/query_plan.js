// exports
exports.QueryPlan = {};
var QueryPlan = exports.QueryPlan;

// imports
var Utils = require("./../../js-trees/src/utils").Utils;

QueryPlan.variablesInBGP = function(bgp) {
    // may be cached in the pattern
    var variables = bgp.variables;
    if(variables) {
        return variables;
    }

    var components =  bgp.value || bgp;
    var variables  = [];
    for(var comp in components) {
        if(components[comp] && components[comp].token === "var") {
            variables.push(components[comp].value);
        } else if(components[comp] && components[comp].token === "blank") {
            variables.push("blank:"+components[comp].value);
        }
    }
    bgp.variables = variables;

    return variables;
};

QueryPlan.variablesIntersectionBGP = function(bgpa, bgpb) {
    var varsa = QueryPlan.variablesInBGP(bgpa).sort();
    var varsb = QueryPlan.variablesInBGP(bgpb).sort();

    var ia = 0;
    var ib = 0;

    var intersection = [];

    while(ia<varsa.length && ib<varsb.length) {
        if(varsa[ia] === varsb[ib]) {
            intersection.push(varsa[ia]);
            ia++;
            ib++;
        } else if(varsa[ia] < varsb[ib]) {
            ia++;
        } else {
            ib++;
        }
    }

    return intersection;
};

QueryPlan.executeAndBGPs = function(bgps, dataset, queryEngine, env) {
    //for(var i=0; i<bgps.length; i++) {
    //    if(bgps[i].graph == null) {
    //        bgps[i].graph = dataset;
    //    } else if(dataset != null && dataset.length != 0) {
    //        bgps[i].graph = dataset;
    //    }
    //}
    var pairs = Utils.partition(bgps,2);
    return QueryPlan.buildBushyJoinTreeBase(pairs, dataset, queryEngine, env);
};

QueryPlan.buildBushyJoinTreeBase = function(pairs, dataset, queryEngine, queryEnv) {
    var acum = [];
    for(var i=0; i<pairs.length; i++) {
        var pair = pairs[i];
        var bgpa = pair[0];
        var bgpb = pair[1];
        var results = QueryPlan.executeAndBGP(bgpa,bgpb, dataset, queryEngine, queryEnv);
        if(results!=null) {
            acum.push(results);

        } else {
            return null;
        }
    }
    return QueryPlan.buildBushyJoinTreeBranches(acum);
};

// @todo
// remove recursion here
QueryPlan.buildBushyJoinTreeBranches = function(bindingsList) {
    if(bindingsList.length === 1){
        return bindingsList[0];
    } else {
        var pairs = Utils.partition(bindingsList,2);
        var acum = [];
        for(var i=0; i<pairs.length; i++) {
            var pair = pairs[i];
            var bindingsa = pair[0];
            var bindingsb = pair[1];
            var result =  QueryPlan.executeAndBindings(bindingsa, bindingsb);
            acum.push(result);
        }
        return QueryPlan.buildBushyJoinTreeBranches(acum);
    }
};

QueryPlan.executeAndBindings = function(bindingsa, bindingsb) {
    if(bindingsa==null) {
        return bindingsb;
    } else if(bindingsb==null) {
        return bindingsa;
    } else {
        if(bindingsa==[] || bindingsb==[]) {
            return [];
        } else {
            if(QueryPlan.variablesIntersectionBindings(bindingsa[0],bindingsb[0]).length == 0) {
                return QueryPlan.crossProductBindings(bindingsa,bindingsb);
            } else {
                return QueryPlan.joinBindings(bindingsa,bindingsb);
            }
        }
    }
};

QueryPlan.executeAndBGP = function(bgpa, bgpb, dataset, queryEngine, queryEnv) {
    if(bgpa==null) {
        return QueryPlan.executeEmptyJoinBGP(bgpb, dataset, queryEngine, queryEnv);
    } else if(bgpb==null) {
        return QueryPlan.executeEmptyJoinBGP(bgpa, dataset, queryEngine, queryEnv);
    } else {
        var joinVars = QueryPlan.variablesIntersectionBGP(bgpa,bgpb);
        if(joinVars.length === 0) {
            // range a, range b -> cartesian product
            return QueryPlan.executeCrossProductBGP(joinVars, bgpa, bgpb, dataset, queryEngine, queryEnv);
        } else {
            // join on intersection vars
            return QueryPlan.executeJoinBGP(joinVars, bgpa, bgpb, dataset, queryEngine, queryEnv);
        }
    }
};

QueryPlan.executeEmptyJoinBGP = function(bgp, dataset, queryEngine, queryEnv) {
    return QueryPlan.executeBGPDatasets(bgp, dataset, queryEngine, queryEnv);
};

QueryPlan.executeJoinBGP = function(joinVars, bgpa, bgpb, dataset, queryEngine, queryEnv) {
    var bindingsa = QueryPlan.executeBGPDatasets(bgpa, dataset, queryEngine, queryEnv);
    if(bindingsa!=null) {
        var bindingsb = QueryPlan.executeBGPDatasets(bgpb, dataset, queryEngine, queryEnv);
        if(bindingsb!=null) {
            return QueryPlan.joinBindings(bindingsa, bindingsb);
        } else {
            return null;
        }
    } else {
        return null;
    }
};

QueryPlan.executeBGPDatasets = function(bgp, dataset, queryEngine, queryEnv) {
    // avoid duplicate queries in the same graph
    // merge of graphs is not guaranted here.
    var duplicates = {};

    if(bgp.graph == null) {
        //union through all default graph(s)
        var acum = [];
        for (var i = 0; i < dataset.implicit.length; i++) {
            if (duplicates[dataset.implicit[i].oid] == null) {
                duplicates[dataset.implicit[i].oid] = true;
                bgp.graph = dataset.implicit[i];//.oid
                var results = queryEngine.rangeQuery(bgp, queryEnv);
                results = QueryPlan.buildBindingsFromRange(results, bgp);
                acum.push(results);
            }
        }
        ;
        var acumBindings = QueryPlan.unionManyBindings(acum);
        return acumBindings;
    } else if(bgp.graph.token === 'var') {
        // union through all named datasets
        var graphVar = bgp.graph.value;        
        var acum = [];

        for(var i=0; i<dataset.named.length; i++) {
            if(duplicates[dataset.named[i].oid] == null) {
                duplicates[dataset.named[i].oid] = true;
                bgp.graph = dataset.named[i];//.oid
                
                var results = queryEngine.rangeQuery(bgp, queryEnv);
                if(results != null) {
                    results = QueryPlan.buildBindingsFromRange(results, bgp);
                    // add the graph bound variable to the result 
                    for(var j=0; j< results.length; j++) {
                        results[j][graphVar] = dataset.named[i].oid;
                    }
                    acum.push(results);
                } else {
                    return null;
                }
            }
        }
        
        var acumBindings = QueryPlan.unionManyBindings(acum||[]);
        return acumBindings;

    } else {
        // graph already has an active value, just match.
        // Filtering the results will still be necessary
        var results = queryEngine.rangeQuery(bgp, queryEnv);
        if(results!=null) {
            results = QueryPlan.buildBindingsFromRange(results, bgp);
            return results;
        } else {
            return null;
        }
    }
};

QueryPlan.executeCrossProductBGP = function(joinVars, bgpa, bgpb, dataset, queryEngine, queryEnv) {
    var bindingsa = QueryPlan.executeBGPDatasets(bgpa, dataset, queryEngine, queryEnv);
    if(bindingsa!=null) {
        var bindingsb = QueryPlan.executeBGPDatasets(bgpb, dataset, queryEngine, queryEnv);
        if(bindingsb!=null) {
            return QueryPlan.crossProductBindings(bindingsa, bindingsb);
        } else {
            return null;
        }
    } else {
        return null;
    }
};

QueryPlan.buildBindingsFromRange = function(results, bgp) {
    var variables = QueryPlan.variablesInBGP(bgp);
    var bindings = {};

    var components =  bgp.value||bgp;
    var bindings = {};
    for(comp in components) {
        if(components[comp] && components[comp].token === "var") {
            bindings[comp] = components[comp].value;
        } else if(components[comp] && components[comp].token === "blank") {
            bindings[comp] = "blank:"+components[comp].value;
        }
    }

    var resultsBindings =[];

    if(results!=null) {
      for(var i=0; i<results.length; i++) {
          var binding = {};
          var result  = results[i];
	  var duplicated = false;
          for(var comp in bindings) {
              var value = result[comp];
	      if(binding[bindings[comp]] == null || bindings[bindings[comp]] === value) {
		  binding[bindings[comp]] = value;
	      } else {
		  duplicated = true;
		  break;
	      }
          }
	  if(!duplicated)
              resultsBindings.push(binding);
      }
    }

    return resultsBindings;
};

QueryPlan.variablesIntersectionBindings = function(bindingsa, bindingsb) {
    var ia = 0;
    var ib = 0;
    var varsa = [];
    var varsb = [];

    for(var variable in bindingsa) {
        varsa.push(variable);
    }

    for(var variable in bindingsb) {
        varsb.push(variable);
    }
    varsa.sort();
    varsb.sort();


    var intersection = [];

    while(ia<varsa.length && ib<varsb.length) {
        if(varsa[ia] === varsb[ib]) {
            intersection.push(varsa[ia]);
            ia++;
            ib++;
        } else if(varsa[ia] < varsb[ib]) {
            ia++;
        } else {
            ib++;
        }
    }

    return intersection;
};

QueryPlan.areCompatibleBindings = function(bindingsa, bindingsb) {
    var foundSome = false;
    for(var variable in bindingsa) {
        if(bindingsb[variable]!=null && (bindingsb[variable] != bindingsa[variable])) {
            return false;
        } else if(bindingsb[variable] == bindingsa[variable]){
	    foundSome = true;
	}
    }

    return foundSome;
};

QueryPlan.areCompatibleBindingsLeftOuterJoin = function(bindingsa, bindingsb) {
    for(var variable in bindingsa) {
        if(bindingsb[variable]!=null && (bindingsb[variable] != bindingsa[variable])) {
            return false;
        }
    }

    return true;
};

QueryPlan.mergeBindings = function(bindingsa, bindingsb) {
    var merged = {};
    for(var variable in bindingsa) {
        merged[variable] = bindingsa[variable];
    }

    for(var variable in bindingsb) {
        merged[variable] = bindingsb[variable];
    }

    return merged;
};


QueryPlan.joinBindings = function(bindingsa, bindingsb) {
    var result = [];

    for(var i=0; i< bindingsa.length; i++) {
        var bindinga = bindingsa[i];
        for(var j=0; j<bindingsb.length; j++) {
            var bindingb = bindingsb[j];
            if(QueryPlan.areCompatibleBindings(bindinga, bindingb)){
                result.push(QueryPlan.mergeBindings(bindinga, bindingb));
            }
        }
    }

    return result;
};

QueryPlan.augmentMissingBindings = function(bindinga, bindingb) {
    for(var pb in bindingb) {
        if(bindinga[pb] == null) {
            bindinga[pb] = null;
        }
    }
    return bindinga;
};

/*
  QueryPlan.diff = function(bindingsa, biundingsb) {
  var result = [];

  for(var i=0; i< bindingsa.length; i++) {
  var bindinga = bindingsa[i];
  var matched = false;
  for(var j=0; j<bindingsb.length; j++) {
  var bindingb = bindingsb[j];
  if(QueryPlan.areCompatibleBindings(bindinga, bindingb)){
  matched = true;
  result.push(QueryPlan.mergeBindings(bindinga, bindingb));
  }
  }
  if(matched === false) {
  // missing bindings must be present for further processing
  // e.g. filtering by not present value (see DAWG tests
  // bev-6)
  QueryPlan.augmentMissingBindings(bindinga, bindingb);
  result.push(bindinga);
  }
  }

  return result;    
  };
*/
QueryPlan.leftOuterJoinBindings = function(bindingsa, bindingsb) {
    var result = [];

    for(var i=0; i< bindingsa.length; i++) {
        var bindinga = bindingsa[i];
        var matched = false;
        for(var j=0; j<bindingsb.length; j++) {
            var bindingb = bindingsb[j];
            if(QueryPlan.areCompatibleBindingsLeftOuterJoin(bindinga, bindingb)){
                matched = true;
                result.push(QueryPlan.mergeBindings(bindinga, bindingb));
            }
        }
        if(matched === false) {
            // missing bindings must be present for further processing
            // e.g. filtering by not present value (see DAWG tests
            // bev-6)
            // augmentMissingBindings set their value to null.
            QueryPlan.augmentMissingBindings(bindinga, bindingb);
            result.push(bindinga);
        }
    }

    return result;
};

QueryPlan.crossProductBindings = function(bindingsa, bindingsb) {
    var result = [];

    for(var i=0; i< bindingsa.length; i++) {
        var bindinga = bindingsa[i];
        for(var j=0; j<bindingsb.length; j++) {
            var bindingb = bindingsb[j];
            result.push(QueryPlan.mergeBindings(bindinga, bindingb));
        }
    }

    return result;
};

QueryPlan.unionBindings = function(bindingsa, bindingsb) {
    return bindingsa.concat(bindingsb);
};

QueryPlan.unionManyBindings = function(bindingLists) {
    var acum = [];
    for(var i=0; i<bindingLists.length; i++) {
        var bindings = bindingLists[i];
        acum = QueryPlan.unionBindings(acum, bindings);
    }

    return acum;
};
