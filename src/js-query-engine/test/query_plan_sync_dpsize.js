var QueryPlan = require("./../src/query_plan_sync_dpsize").QueryPlanDPSize;
var QueryEngine = require("./../src/mongodb_query_engine").QueryEngine;
var Utils = require("./../../js-trees/src/utils").Utils;
var AbstractQueryTree = require("./../../js-sparql-parser/src/abstract_query_tree").AbstractQueryTree;


var makeVar = function(n) {
    return { token: 'var', value: n }
}

var pred = { token: 'uri',
	     prefix: null,
	     suffix: null,
	     value: 'http://test.com/named' };


exports.testGroupingOfPatterns = function(test){
    var dataIn = [ { subject: makeVar('s'),
		     predicate: pred,
		     object: makeVar('o') },
		   { subject: makeVar('s'),
		     predicate: pred,
		     object: makeVar('o2') } ];

    var solution = QueryPlan.executeAndBGPsGroups(dataIn);
    test.ok(solution.length == 1);
    test.ok(solution[0].length == 2);


    var dataIn = [ { subject: makeVar('s'),
		     predicate: pred,
		     object: makeVar('o') },
		   { subject: makeVar('s'),
		     predicate: pred,
		     object: makeVar('o2') },
		   {subject: makeVar('p'),
		     predicate: pred,
		     object: makeVar('p2')}];

    var solution = QueryPlan.executeAndBGPsGroups(dataIn);
    test.ok(solution.length == 2);
    test.ok(solution[0].length == 2);
    test.ok(solution[1].length == 1);


    var dataIn = [ { subject: makeVar('s'),
		     predicate: pred,
		     object: makeVar('o') },
		   { subject: makeVar('s'),
		     predicate: pred,
		     object: makeVar('o2') },
		   {subject: makeVar('p'),
		     predicate: pred,
		    object: makeVar('p2')},
		 {subject: makeVar('m'),
		  predicate: pred,
		  object: makeVar('n2')}];

    var solution = QueryPlan.executeAndBGPsGroups(dataIn);
    test.ok(solution.length == 3);
    test.ok(solution[0].length == 2);
    test.ok(solution[1].length == 1);
    test.ok(solution[2].length == 1);

    var dataIn = [ 

	{ subject: makeVar('s'),
		     predicate: pred,
		     object: makeVar('o') },
		   { subject: makeVar('s'),
		     predicate: pred,
		     object: makeVar('o2') },
		   {subject: makeVar('p'),
		     predicate: pred,
		    object: makeVar('p2')},
		   {subject: makeVar('m'),
		    predicate: pred,
		    object: makeVar('n2')},
		   {subject: makeVar('p'),
		    predicate: pred,
		    object: makeVar('n2')}];
    
    var solution = QueryPlan.executeAndBGPsGroups(dataIn);
    test.ok(solution.length == 2);
    test.ok(solution[0].length == 2);
    test.ok(solution[1].length == 3);

    test.done();

}
