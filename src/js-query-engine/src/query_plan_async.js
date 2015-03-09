// exports
exports.QueryPlanAsync = {};
var QueryPlanAsync = exports.QueryPlanAsync;

// imports
var Utils = require("./../../js-trees/src/utils").Utils;

QueryPlanAsync.variablesInBGP = function(bgp) {
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

QueryPlanAsync.variablesIntersectionBGP = function(bgpa, bgpb) {
    var varsa = QueryPlanAsync.variablesInBGP(bgpa).sort();
    var varsb = QueryPlanAsync.variablesInBGP(bgpb).sort();

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

QueryPlanAsync.executeAndBGPs = function(bgps, dataset, queryEngine, env, callback) {
    //for(var i=0; i<bgps.length; i++) {
    //    if(bgps[i].graph == null) {
    //        bgps[i].graph = dataset;
    //    } else if(dataset != null && dataset.length != 0) {
    //        bgps[i].graph = dataset;
    //    }
    //}
 
    var pairs = Utils.partition(bgps,2);
 
    QueryPlanAsync.buildBushyJoinTreeBase(pairs, dataset, queryEngine, env, function(success, results){
        if(success) {
            callback(true, results);
        } else {
            callback(false, results);
        }
    });
};

// @modified qp
QueryPlanAsync.intersectionSize = function(leftPlan, rightPlan) {
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

QueryPlanAsync.connected = function(leftPlan, rightPlan) {
    var varsLeft ="/"+leftPlan.vars.join("/")+"/";
    for(var i=0; i<rightPlan.vars.length; i++) {
        if(varsLeft.indexOf("/"+rightPlan.vars[i]+"/") != -1) {
            return true;
        }
    }

    return false;
};

QueryPlanAsync.createJoinTree = function(leftPlan, rightPlan) {
    var varsLeft ="/"+leftPlan.vars.join("/")+"/";
    var acumVars = leftPlan.vars.concat([]);
    var join = [];

    for(var i=0; i<rightPlan.vars.length; i++) {
        if(varsLeft.indexOf("/"+rightPlan.vars[i]+"/") != -1) {
            join.push(rightPlan.vars[i]);
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

// @modified qp
/**
 * All BGPs sharing variables are grouped together.
 */
QueryPlanAsync.executeAndBGPsGroups = function(bgps) {
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


QueryPlanAsync.executeBushyTree = function(treeNode, dataset, queryEngine, env, callback) {
    if(treeNode.left == null ) {
        QueryPlanAsync.executeEmptyJoinBGP(treeNode.right, dataset, queryEngine, env, callback);
    } else if(treeNode.right == null) {
        QueryPlanAsync.executeEmptyJoinBGP(treeNode.left, dataset, queryEngine, env, callback);
    } else {
        QueryPlanAsync.executeBushyTree(treeNode.left, dataset, queryEngine, env, function(success, resultsLeft) {
            if(success) {
                QueryPlanAsync.executeBushyTree(treeNode.right, dataset, queryEngine, env, function(success, resultsRight) {
                    if(success) {
                        var bindings = QueryPlanAsync.joinBindings2(treeNode.join, resultsLeft, resultsRight);
                        callback(true, bindings);
                    } else {
                        callback(false, null);
                    }
                });
            } else {
                callback(false, null);
            }
        });
    }
};

QueryPlanAsync.executeAndBGPsDPSize = function(allBgps, dataset, queryEngine, env, callback) {

    var groups = QueryPlanAsync.executeAndBGPsGroups(allBgps);
    var groupResults = [];

    Utils.repeat(0,groups.length,function(k,kenv) {
        // @todo
        // this lambda function should be moved to its named function

        // Build bushy tree for this group
        var bgps = groups[kenv._i];
        var floop = arguments.callee;
        var costFactor = 1;
        queryEngine.computeCosts(bgps,env,function(bgps) {
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
		
		delete bgps[i]['variables'];
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
                            if(QueryPlanAsync.intersectionSize(leftPlan, rightPlan) == 0) {
                                // condition (2)

                                if(QueryPlanAsync.connected(leftPlan,rightPlan)) {
                                    maxSize = s;
                                    var p1 = bestPlans[leftPlan.i];  //QueryPlanAsync.bestPlan(leftPlan, bestPlans);
                                    var p2 = bestPlans[rightPlan.i]; //QueryPlanAsync.bestPlan(rightPlan, bestPlans);

                                    var currPlan = QueryPlanAsync.createJoinTree(p1,p2);
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
            k(floop,kenv);
        });
    },function(kenv) {
        // now execute the Bushy trees and perform
        // cross products between groups
        var acum = null;
        Utils.repeat(0, groupResults.length, function(k, kenv) {

            var tree = groupResults[kenv._i];
            var floop = arguments.callee;

            QueryPlanAsync.executeBushyTree(tree, dataset, queryEngine, env, function(success, result) {
                if(success) {
                    if(acum == null) {
                        acum = result;
                        k(floop,kenv);
                    } else {
                        acum = QueryPlanAsync.crossProductBindings(acum, result);
                        k(floop,kenv);
                    }
                } else {
                    callback(false, null);
                }
            
            });
        },function(kenv){
            callback(true, acum);
        });
    });
};

QueryPlanAsync.buildBushyJoinTreeBase = function(pairs, dataset, queryEngine, queryEnv, callback) {
    var that = this;
    Utils.repeat(0, pairs.length, function(k, env) {
        var floop = arguments.callee;
        var pair = pairs[env._i];
        var bgpa = pair[0];
        var bgpb = pair[1];
        QueryPlanAsync.executeAndBGP(bgpa,bgpb, dataset, queryEngine, queryEnv, function(success, results){
            if(success) {
                if(env.acum == null) {
                    env.acum = [];
                }
                env.acum.push(results);

                k(floop, env);
            } else {
                callback(success,results);
            }
        });
    }, function(env){
        QueryPlanAsync.buildBushyJoinTreeBranches(env.acum, callback);
    });
};

QueryPlanAsync.buildBushyJoinTreeBranches = function(bindingsList, callback) {
    var that = this;
    if(bindingsList.length == 1){
        callback(true, bindingsList[0]);
    } else {
        var pairs = Utils.partition(bindingsList,2);
        var acum = [];
        for(var i=0; i<pairs.length; i++) {
            var pair = pairs[i];
            var bindingsa = pair[0];
            var bindingsb = pair[1];
            var result =  QueryPlanAsync.executeAndBindings(bindingsa, bindingsb);
            acum.push(result);
        }
        QueryPlanAsync.buildBushyJoinTreeBranches(acum, callback);
    }
};

QueryPlanAsync.executeAndBindings = function(bindingsa, bindingsb) {
    if(bindingsa==null) {
        return bindingsb;
    } else if(bindingsb==null) {
        return bindingsa;
    } else {
        if(bindingsa==[] || bindingsb==[]) {
            return [];
        } else {
            if(QueryPlanAsync.variablesIntersectionBindings(bindingsa[0],bindingsb[0]).length == 0) {
                return QueryPlanAsync.crossProductBindings(bindingsa,bindingsb);
            } else {
                return QueryPlanAsync.joinBindings(bindingsa,bindingsb);
            }
        }
    }
};

QueryPlanAsync.executeAndBGP = function(bgpa, bgpb, dataset, queryEngine, queryEnv, callback) {
    if(bgpa==null) {
        QueryPlanAsync.executeEmptyJoinBGP(bgpb, dataset, queryEngine, queryEnv, callback);
    } else if(bgpb==null) {
        QueryPlanAsync.executeEmptyJoinBGP(bgpa, dataset, queryEngine, queryEnv, callback);
    } else {
        var joinVars = QueryPlanAsync.variablesIntersectionBGP(bgpa,bgpb);
        if(joinVars.length === 0) {
            // range a, range b -> cartesian product
            QueryPlanAsync.executeCrossProductBGP(joinVars, bgpa, bgpb, dataset, queryEngine, queryEnv, callback);
        } else {
            // join on intersection vars
            QueryPlanAsync.executeJoinBGP(joinVars, bgpa, bgpb, dataset, queryEngine, queryEnv, callback);
        }
    }
};

QueryPlanAsync.executeEmptyJoinBGP = function(bgp, dataset, queryEngine, queryEnv, callback) {
    QueryPlanAsync.executeBGPDatasets(bgp, dataset, queryEngine, queryEnv, function(success, bindings){
        if(success == true) {
            callback(true, bindings);
        } else {
            callback(false, bindings);
        }
    });
};

QueryPlanAsync.executeJoinBGP = function(joinVars, bgpa, bgpb, dataset, queryEngine, queryEnv, callback) {
    QueryPlanAsync.executeBGPDatasets(bgpa, dataset, queryEngine, queryEnv, function(success, bindingsa){
        if(success) {
            QueryPlanAsync.executeBGPDatasets(bgpb, dataset, queryEngine, queryEnv, function(success, bindingsb){
                if(success) {
                    //queryEngine.copyDenormalizedBindings(bindingsa, queryEnv.outCache||[], function(success, denormBindingsa){
                        //var bindingsb = QueryPlanAsync.buildBindingsFromRange(resultsb, bgpb);
                        //queryEngine.copyDenormalizedBindings(bindingsb, queryEnv.outCache||[], function(success, denormBindingsb){
                            var bindings = QueryPlanAsync.joinBindings(bindingsa, bindingsb);
                            callback(true, bindings);
                        //});
                    //});
                } else {
                    callback(false, results);
                }
            });
        } else {
            callback(false, results);
        }
    });
};

QueryPlanAsync.executeBGPDatasets = function(bgp, dataset, queryEngine, queryEnv,callback) {
    // avoid duplicate queries in the same graph
    // merge of graphs is not guaranted here.
    var duplicates = {};

    if(bgp.graph == null) {
        //union through all default graph(s)
	var successAcum = true;
        Utils.repeat(0, dataset.implicit.length, function(k, env) {
            var floop = arguments.callee;
            if(duplicates[dataset.implicit[env._i].oid] == null) {
                duplicates[dataset.implicit[env._i].oid] = true;
                env.acum = env.acum || [];
                bgp.graph = dataset.implicit[env._i];//.oid
                queryEngine.rangeQuery(bgp, queryEnv, function(succes, results){
		    successAcum = successAcum && succes;
                    if(results != null) {
                        results = QueryPlanAsync.buildBindingsFromRange(results, bgp);
                        env.acum.push(results);
                        k(floop, env);
                    } else {
                        k(floop, env);              
                    }
                });
            } else {
                k(floop, env);
            }
        }, function(env){
            var acumBindings = QueryPlanAsync.unionManyBindings(env.acum||[]);
	    if(successAcum)
		callback(true, acumBindings);
	    else
		callback(false, "Error retrieving bindings from the backend layer");
        });
    } else if(bgp.graph.token === 'var') {
        var graphVar = bgp.graph.value;
        
        // union through all named datasets
        Utils.repeat(0, dataset.named.length, function(k, env) {
            var floop = arguments.callee;
            if(duplicates[dataset.named[env._i].oid] == null) {
                duplicates[dataset.named[env._i].oid] = true;
                env.acum = env.acum || [];
                bgp.graph = dataset.named[env._i];//.oid
                 
                queryEngine.rangeQuery(bgp, queryEnv, function(success, results) {
                    if(success && results != null) {
                        results = QueryPlanAsync.buildBindingsFromRange(results, bgp);
                        // add the graph bound variable to the result 
                        for(var i=0; i< results.length; i++) {
                            results[i][graphVar] = dataset.named[env._i].oid;
                        }
                        env.acum.push(results);
                        k(floop, env);
                    } else {
                        callback(false, results);
                    }
                });
            } else {
                k(floop, env);
            }
        }, function(env){
            var acumBindings = QueryPlanAsync.unionManyBindings(env.acum||[]);
            callback(true, acumBindings);
        });

    } else {
        // graph already has an active value, just match.
        // Filtering the results will still be necessary
        queryEngine.rangeQuery(bgp, queryEnv,function(success,results){
            if(success) {
                if(results!=null) {
                    results = QueryPlanAsync.buildBindingsFromRange(results, bgp);
                    callback(true,results);
                } else {
                    callback(false, results);
                }
            } else {
                callback(false, results);
            }
        });
    }
};

QueryPlanAsync.executeCrossProductBGP = function(joinVars, bgpa, bgpb, dataset, queryEngine, queryEnv, callback) {
    QueryPlanAsync.executeBGPDatasets(bgpa, dataset, queryEngine, queryEnv, function(success, bindingsa){
        if(success) {
            QueryPlanAsync.executeBGPDatasets(bgpb, dataset, queryEngine, queryEnv, function(success, bindingsb){
                if(success) {
                    var bindings = QueryPlanAsync.crossProductBindings(bindingsa, bindingsb);
                    callback(true, bindings);
                } else {
                    callback(false, results);
                }
            });
        } else {
            callback(false, results);
        }
    });
};

QueryPlanAsync.buildBindingsFromRange = function(results, bgp) {
    var variables = QueryPlanAsync.variablesInBGP(bgp);
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

QueryPlanAsync.variablesIntersectionBindings = function(bindingsa, bindingsb) {
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

QueryPlanAsync.areCompatibleBindings = function(bindingsa, bindingsb) {
    for(var variable in bindingsa) {
        if(bindingsb[variable]!=null && (bindingsb[variable] != bindingsa[variable])) {
            return false;
	}
    }

    return true;
};


QueryPlanAsync.mergeBindings = function(bindingsa, bindingsb) {
    var merged = {};
    for(var variable in bindingsa) {
        merged[variable] = bindingsa[variable];
    }

    for(var variable in bindingsb) {
        merged[variable] = bindingsb[variable];
    }

    return merged;
};


QueryPlanAsync.joinBindings = function(bindingsa, bindingsb) {
    var result = [];
 
    for(var i=0; i< bindingsa.length; i++) {
        var bindinga = bindingsa[i];
        for(var j=0; j<bindingsb.length; j++) {
            var bindingb = bindingsb[j];
            if(QueryPlanAsync.areCompatibleBindings(bindinga, bindingb)){
                result.push(QueryPlanAsync.mergeBindings(bindinga, bindingb));
            }
        }
    }
 
    return result;
};

QueryPlanAsync.joinBindings2 = function(bindingVars, bindingsa, bindingsb) {
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
                        joined.push(QueryPlanAsync.mergeBindings(tmp[variableValue][k],bindings));
                    }
                } else {
                    tmp = tmp[variableValue];
                }
            }
        }
    }

    return joined;
};


QueryPlanAsync.augmentMissingBindings = function(bindinga, bindingb) {
    for(var pb in bindingb) {
        if(bindinga[pb] == null) {
            bindinga[pb] = null;
        }
    }
    return bindinga;
};

/*
QueryPlanAsync.diff = function(bindingsa, biundingsb) {
    var result = [];

    for(var i=0; i< bindingsa.length; i++) {
        var bindinga = bindingsa[i];
        var matched = false;
        for(var j=0; j<bindingsb.length; j++) {
            var bindingb = bindingsb[j];
            if(QueryPlanAsync.areCompatibleBindings(bindinga, bindingb)){
                matched = true;
                result.push(QueryPlanAsync.mergeBindings(bindinga, bindingb));
            }
        }
        if(matched === false) {
            // missing bindings must be present for further processing
            // e.g. filtering by not present value (see DAWG tests
            // bev-6)
            QueryPlanAsync.augmentMissingBindings(bindinga, bindingb);
            result.push(bindinga);
        }
    }

    return result;    
};
*/
QueryPlanAsync.leftOuterJoinBindings = function(bindingsa, bindingsb) {
    var result = [];

    for(var i=0; i< bindingsa.length; i++) {
        var bindinga = bindingsa[i];
        var matched = false;
        for(var j=0; j<bindingsb.length; j++) {
            var bindingb = bindingsb[j];
            if(QueryPlanAsync.areCompatibleBindings(bindinga, bindingb)){
                matched = true;
                result.push(QueryPlanAsync.mergeBindings(bindinga, bindingb));
            }
        }
        if(matched === false) {
            // missing bindings must be present for further processing
            // e.g. filtering by not present value (see DAWG tests
            // bev-6)
            // augmentMissingBindings set their value to null.
            QueryPlanAsync.augmentMissingBindings(bindinga, bindingb);
            result.push(bindinga);
        }
    }

    return result;
};

QueryPlanAsync.crossProductBindings = function(bindingsa, bindingsb) {
    var result = [];

    for(var i=0; i< bindingsa.length; i++) {
        var bindinga = bindingsa[i];
        for(var j=0; j<bindingsb.length; j++) {
            var bindingb = bindingsb[j];
            result.push(QueryPlanAsync.mergeBindings(bindinga, bindingb));
         }
    }

    return result;
};

QueryPlanAsync.unionBindings = function(bindingsa, bindingsb) {
    return bindingsa.concat(bindingsb);
};

QueryPlanAsync.unionManyBindings = function (bindingLists) {
    var acum = [];
    for (var i = 0; i < bindingLists.length; i++) {
        var bindings = bindingLists[i];
        acum = QueryPlanAsync.unionBindings(acum, bindings);
    }

    return acum;
};
