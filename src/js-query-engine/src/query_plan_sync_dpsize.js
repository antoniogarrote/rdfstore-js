// exports
exports.QueryPlanDPSize = {};
var QueryPlanDPSize = exports.QueryPlanDPSize;

QueryPlanDPSize.variablesInBGP = function(bgp) {
    // may be cached in the pattern
    var variables = bgp.variables;
    if(variables) {
        return variables;
    }

    var components =  bgp.value || bgp;
    variables  = [];
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

QueryPlanDPSize.connected = function(leftPlan, rightPlan) {
    var varsLeft ="/"+leftPlan.vars.join("/")+"/";
    for(var i=0; i<rightPlan.vars.length; i++) {
        if(varsLeft.indexOf("/"+rightPlan.vars[i]+"/") != -1) {
            return true;
        }
    }

    return false;
};

QueryPlanDPSize.variablesIntersectionBGP = function(bgpa, bgpb) {
    var varsa = QueryPlanDPSize.variablesInBGP(bgpa).sort();
    var varsb = QueryPlanDPSize.variablesInBGP(bgpb).sort();
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

/**
 * All BGPs sharing variables are grouped together.
 */
QueryPlanDPSize.executeAndBGPsGroups = function(bgps) {
    var groups = {};
    var groupVars = {};
    var groupId = 0;

    for(var i=0; i<bgps.length; i++) {
        var bgp = bgps[i];
	var newGroups = {};
	var newGroupVars = {};

        var vars = [];
        for(var comp in bgp) {
            if(comp != '_cost') {
                if(bgp[comp].token === 'var') {
                    vars.push(bgp[comp].value);
                } else if(bgp[comp].token === 'blank') {
                    vars.push(bgp[comp].value);
                }
            }
        }

	
        var foundGroup = false;
	var currentGroupId = null;
	var toDelete = [];
	var toJoin = {};

        for(var nextGroupId in groupVars) {
            var groupVar = groupVars[nextGroupId];
	    foundGroup = false;
            for(var j=0; j<vars.length; j++) {
                var thisVar = "/"+vars[j]+"/";
                if(groupVar.indexOf(thisVar) != -1) {
		    foundGroup = true;
		    break;
                }
            }

	    if(foundGroup) {
		toJoin[nextGroupId] = true;
	    } else {
		newGroups[nextGroupId] = groups[nextGroupId];
		newGroupVars[nextGroupId] = groupVars[nextGroupId];
	    }
        }

        if(!foundGroup) {
            newGroups[groupId] = [bgp];
            newGroupVars[groupId] = "/"+(vars.join("/"))+"/";
            groupId++;
        } else {
	    var acumGroups = [];
	    var acumId = "";
	    var acumVars = "";
	    for(var gid in toJoin) {
		acumId = acumId+gid;
		acumGroups = acumGroups.concat(groups[gid]);
		acumVars = groupVars[gid];
	    }

	    acumVars = acumVars + vars.join("/") + "/";
	    acumGroups.push(bgp);

	    newGroups[acumId] = acumGroups;
	    newGroupVars[acumId] = acumVars;
	}

	groups = newGroups;
	groupVars = newGroupVars;
    }

    var acum = [];
    for(var groupId in groups) {
        acum.push(groups[groupId]);
    }

    return acum;
};

QueryPlanDPSize.intersectionSize = function(leftPlan, rightPlan) {
    var idsRight = rightPlan.i.split("_");
    for(var i=0; i<idsRight.length; i++) {
        if(idsRight[i]=="")
            continue;
        if(leftPlan.i.indexOf('_'+idsRight[i]+'_') != -1) {
            return 1; // we just need to know if this value is >0
        }
    }
    return 0;
};

QueryPlanDPSize.createJoinTree = function(leftPlan, rightPlan) {
    var varsLeft ="/"+leftPlan.vars.join("/")+"/";
    var acumVars = leftPlan.vars.concat([]);
    var join = [];

    for(var i=0; i<rightPlan.vars.length; i++) {
        if(varsLeft.indexOf("/"+rightPlan.vars[i]+"/") != -1) {
            if(rightPlan.vars[i].indexOf("_:") == 0) {
                join.push("blank:"+rightPlan.vars[i]);
            } else {
                join.push(rightPlan.vars[i]);
            }
        } else {
            acumVars.push(rightPlan.vars[i]);
        }
    }

    var rightIds = rightPlan.i.split("_");
    var leftIds = leftPlan.i.split("_");
    var distinct = {};
    for(var i=0; i<rightIds.length; i++) {
        if(rightIds[i] != "") {
            distinct[rightIds[i]] = true;
        }
    }
    for(var i=0; i<leftIds.length; i++) {
        if(leftIds[i] != "") {
            distinct[leftIds[i]] = true;
        }
    }
    var ids = [];
    for(var id in distinct) {
        ids.push(id);
    }

    // new join tree
    return {
        left: leftPlan,
        right: rightPlan,
        cost: leftPlan.cost+rightPlan.cost,
        i: "_"+(ids.sort().join("_"))+"_",
        vars: acumVars,
        join: join
    };
};

QueryPlanDPSize.executeBushyTree = function(treeNode, dataset, queryEngine, env) {
    if(treeNode.left == null ) {
        return QueryPlanDPSize.executeEmptyJoinBGP(treeNode.right, dataset, queryEngine, env);
    } else if(treeNode.right == null) {
        return QueryPlanDPSize.executeEmptyJoinBGP(treeNode.left, dataset, queryEngine, env);
    } else {
        var resultsLeft = QueryPlanDPSize.executeBushyTree(treeNode.left, dataset, queryEngine, env);

        if(resultsLeft!=null) {
            var resultsRight = QueryPlanDPSize.executeBushyTree(treeNode.right, dataset, queryEngine, env);
            if(resultsRight!=null) {
                return QueryPlanDPSize.joinBindings2(treeNode.join, resultsLeft, resultsRight);
            } else {
                return null;
            }
        }
    }
};


QueryPlanDPSize.executeAndBGPsDPSize = function(allBgps, dataset, queryEngine, env) {
    var groups = QueryPlanDPSize.executeAndBGPsGroups(allBgps);
    var groupResults = [];
    for(var g=0; g<groups.length; g++) {

        // Build bushy tree for this group
        var bgps = groups[g];
        var costFactor = 1;

	var bgpas = queryEngine.computeCosts(bgps,env);

        var bestPlans = {};
        var plans = {};
        var sizes = {};

        var maxSize = 1;
        var maxPlan = null;

        var cache = {};
        
        sizes['1'] = [];

        // Building plans of size 1
        for(var i=0; i<bgps.length; i++) {
            var vars = [];
            for(var comp in bgps[i]) {
                if(comp != '_cost') {
                    if(bgps[i][comp].token === 'var') {
                        vars.push(bgps[i][comp].value);
                    } else if(bgps[i][comp].token === 'blank') {
                        vars.push(bgps[i][comp].value);
                    }
                }
            }

            plans["_"+i+"_"] = {left: bgps[i], right:null, cost:bgps[i]._cost, i:('_'+i+'_'), vars:vars};
            var plan = {left: bgps[i], right:null, cost:bgps[i]._cost, i:('_'+i+'_'), vars:vars};
            bestPlans["_"+i+"_"] = plan;
            delete bgps[i]['_cost'];
            cache["_"+i+"_"] = true;
            sizes['1'].push("_"+i+"_");
            if(maxPlan == null || maxPlan.cost>plan.cost) {
                maxPlan = plan;
            }
        }

        // dynamic programming -> build plans of increasing size
        for(var s=2; s<=bgps.length; s++) { // size
            for(var sl=1; sl<s; sl++) { // size left plan
                var sr = s - sl; // size right plan
                var leftPlans = sizes[''+sl] || [];
                var rightPlans = sizes[''+sr] || [];

                for(var i=0; i<leftPlans.length; i++) {
                    for(var j=0; j<rightPlans.length; j++) {
                        if(leftPlans[i]===rightPlans[j])
                            continue;
                        var leftPlan = plans[leftPlans[i]];
                        var rightPlan = plans[rightPlans[j]];

                        // condition (1)
                        if(QueryPlanDPSize.intersectionSize(leftPlan, rightPlan) == 0) {
                            // condition (2)

                            if(QueryPlanDPSize.connected(leftPlan,rightPlan)) {
                                maxSize = s;
                                var p1 = bestPlans[leftPlan.i];  //QueryPlanDPSize.bestPlan(leftPlan, bestPlans);
                                var p2 = bestPlans[rightPlan.i]; //QueryPlanDPSize.bestPlan(rightPlan, bestPlans);

                                var currPlan = QueryPlanDPSize.createJoinTree(p1,p2);
                                if(!cache[currPlan.i]) {
                                    cache[currPlan.i] = true;

                                    var costUnion = currPlan.cost+1;
                                    if(bestPlans[currPlan.i] != null) {
                                        costUnion = bestPlans[currPlan.i].cost;
                                    }
                                    
                                    var acum = sizes[s] || [];
                                    acum.push(currPlan.i);
                                    plans[currPlan.i] = currPlan;
                                    sizes[s] = acum;
                                    
                                    if(costUnion > currPlan.cost) {
                                        if(maxSize === s) {
                                            maxPlan = currPlan;
                                        }
                                        bestPlans[currPlan.i] = currPlan;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        groupResults.push(maxPlan);
    }


    // now execute the Bushy trees and perform
    // cross products between groups
    var acum = null;

    for(var g=0; g<groupResults.length; g++) {
        var tree = groupResults[g];

        var result = QueryPlanDPSize.executeBushyTree(tree, dataset, queryEngine, env);
        if(acum == null) {
            acum = result;
        } else {
            acum = QueryPlanDPSize.crossProductBindings(acum, result);
        }
    };

    return acum;
};

QueryPlanDPSize.executeEmptyJoinBGP = function(bgp, dataset, queryEngine, queryEnv) {
    return QueryPlanDPSize.executeBGPDatasets(bgp, dataset, queryEngine, queryEnv);
};


QueryPlanDPSize.executeBGPDatasets = function(bgp, dataset, queryEngine, queryEnv) {
    // avoid duplicate queries in the same graph
    // merge of graphs is not guaranted here.
    var duplicates = {};

    if(bgp.graph == null) {
        //union through all default graph(s)
        var acum = [];
        for(var i=0; i<dataset.implicit.length; i++) {
            if(duplicates[dataset.implicit[i].oid] == null) {
                duplicates[dataset.implicit[i].oid] = true;
                bgp.graph = dataset.implicit[i];//.oid
                var results = queryEngine.rangeQuery(bgp, queryEnv);
                results = QueryPlanDPSize.buildBindingsFromRange(results, bgp);
                acum.push(results);
            }
        }
        var acumBindings = QueryPlanDPSize.unionManyBindings(acum);
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
                    results = QueryPlanDPSize.buildBindingsFromRange(results, bgp);
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
        
        var acumBindings = QueryPlanDPSize.unionManyBindings(acum||[]);
        return acumBindings;

    } else {
        // graph already has an active value, just match.
        // Filtering the results will still be necessary
        var results = queryEngine.rangeQuery(bgp, queryEnv);
        if(results!=null) {
            results = QueryPlanDPSize.buildBindingsFromRange(results, bgp);
            return results;
        } else {
            return null;
        }
    }
};

QueryPlanDPSize.buildBindingsFromRange = function(results, bgp) {
    var variables = QueryPlanDPSize.variablesInBGP(bgp);
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
	      if(binding[bindings[comp]] == null || binding[bindings[comp]] === value) {
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


// @used
QueryPlanDPSize.areCompatibleBindings = function(bindingsa, bindingsb) {
    for(var variable in bindingsa) {
        if(bindingsb[variable]!=null && (bindingsb[variable] != bindingsa[variable])) {
            return false;
        }
    }

    return true;
};

//QueryPlanDPSize.areCompatibleBindingsStrict = function(bindingsa, bindingsb) {
//    var foundSome = false;
//    for(var variable in bindingsa) {
// 	if(bindingsb[variable]!=null && (bindingsb[variable] != bindingsa[variable])) {
// 	    return false;
// 	} else if(bindingsb[variable] == bindingsa[variable]){
// 	    foundSome = true;
// 	}
//    }
//     
//    return foundSome;
//};



QueryPlanDPSize.mergeBindings = function(bindingsa, bindingsb) {
    var merged = {};
    for(var variable in bindingsa) {
        merged[variable] = bindingsa[variable];
    }

    for(var variable in bindingsb) {
        merged[variable] = bindingsb[variable];
    }

    return merged;
};

QueryPlanDPSize.joinBindings2 = function(bindingVars, bindingsa, bindingsb) {
    var acum = {};
    var bindings, variable, variableValue, values, tmp;
    var joined = [];

    for(var i=0; i<bindingsa.length; i++) {
        bindings = bindingsa[i];
        tmp = acum;
        for(var j=0; j<bindingVars.length; j++) {
            variable = bindingVars[j];
            variableValue = bindings[variable];
            if(j == bindingVars.length-1) {
                values = tmp[variableValue] || [];
                values.push(bindings);
                tmp[variableValue] = values;
            } else {
                values = tmp[variableValue] || {};
                tmp[variableValue] = values;
                tmp = values;
            }
        }
    }

    for(var i=0; i<bindingsb.length; i++) {
        bindings = bindingsb[i];
        tmp = acum;
        for(var j=0; j<bindingVars.length; j++) {
            variable = bindingVars[j];
            variableValue = bindings[variable];

            if(tmp[variableValue] != null) {
                if(j == bindingVars.length-1) {
                    for(var k=0; k<tmp[variableValue].length; k++) {
                        joined.push(QueryPlanDPSize.mergeBindings(tmp[variableValue][k],bindings));
                    }
                } else {
                    tmp = tmp[variableValue];
                }
            }
        }
    }

    return joined;
};

QueryPlanDPSize.joinBindings = function(bindingsa, bindingsb) {
    var result = [];

    for(var i=0; i< bindingsa.length; i++) {
        var bindinga = bindingsa[i];
        for(var j=0; j<bindingsb.length; j++) {
            var bindingb = bindingsb[j];
            if(QueryPlanDPSize.areCompatibleBindings(bindinga, bindingb)){
                result.push(QueryPlanDPSize.mergeBindings(bindinga, bindingb));
            }
        }
    }
    return result;
};

QueryPlanDPSize.augmentMissingBindings = function(bindinga, bindingb) {
    for(var pb in bindingb) {
        if(bindinga[pb] == null) {
            bindinga[pb] = null;
        }
    }
    return bindinga;
};

/*
  QueryPlanDPSize.diff = function(bindingsa, biundingsb) {
  var result = [];

  for(var i=0; i< bindingsa.length; i++) {
  var bindinga = bindingsa[i];
  var matched = false;
  for(var j=0; j<bindingsb.length; j++) {
  var bindingb = bindingsb[j];
  if(QueryPlanDPSize.areCompatibleBindings(bindinga, bindingb)){
  matched = true;
  result.push(QueryPlanDPSize.mergeBindings(bindinga, bindingb));
  }
  }
  if(matched === false) {
  // missing bindings must be present for further processing
  // e.g. filtering by not present value (see DAWG tests
  // bev-6)
  QueryPlanDPSize.augmentMissingBindings(bindinga, bindingb);
  result.push(bindinga);
  }
  }

  return result;    
  };
*/

QueryPlanDPSize.leftOuterJoinBindings = function(bindingsa, bindingsb) {
    var result = [];
    // strict was being passes ad an argument
    //var compatibleFunction = QueryPlanDPSize.areCompatibleBindings;
    //if(strict === true)
    // 	compatibleFunction = QueryPlanDPSize.areCompatibleBindingsStrict;

    for(var i=0; i< bindingsa.length; i++) {
        var bindinga = bindingsa[i];
        var matched = false;
        for(var j=0; j<bindingsb.length; j++) {
            var bindingb = bindingsb[j];
            if(QueryPlanDPSize.areCompatibleBindings(bindinga, bindingb)){
                matched = true;
                result.push(QueryPlanDPSize.mergeBindings(bindinga, bindingb));
            }
        }
        if(matched === false) {
            // missing bindings must be present for further processing
            // e.g. filtering by not present value (see DAWG tests
            // bev-6)
            // augmentMissingBindings set their value to null.
            QueryPlanDPSize.augmentMissingBindings(bindinga, bindingb);
            result.push(bindinga);
        }
    }
    return result;
};

QueryPlanDPSize.crossProductBindings = function(bindingsa, bindingsb) {
    var result = [];

    for(var i=0; i< bindingsa.length; i++) {
        var bindinga = bindingsa[i];
        for(var j=0; j<bindingsb.length; j++) {
            var bindingb = bindingsb[j];
            result.push(QueryPlanDPSize.mergeBindings(bindinga, bindingb));
        }
    }

    return result;
};

QueryPlanDPSize.unionBindings = function(bindingsa, bindingsb) {
    return bindingsa.concat(bindingsb);
};

QueryPlanDPSize.unionManyBindings = function(bindingLists) {
    var acum = [];
    for(var i=0; i<bindingLists.length; i++) {
        var bindings = bindingLists[i];
        acum = QueryPlanDPSize.unionBindings(acum, bindings);
    }

    return acum;
};
