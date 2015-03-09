var QueryPlan = require("./../src/query_plan_async").QueryPlan;
var QueryEngine = require("./../src/mongodb_query_engine").QueryEngine;
var Utils = require("./../../js-trees/src/utils").Utils;
var AbstractQueryTree = require("./../../js-sparql-parser/src/abstract_query_tree").AbstractQueryTree;

/**
 * only for development, this functionality is tested in MongodbQueryEngine
 *

exports.testInsertDataTrivialRecovery = function(test){
    var query = "SELECT * { ?a :p1 :o1 . ?a :p2 :o2 . ?a :p3 ?c . ?d ?e ?c . ?m :d ?n . :a :b ?n}";
    var aqt = new AbstractQueryTree.AbstractQueryTree();
    console.log(1);
    console.log(query);
    var syntaxTree = aqt.parseQueryString(query);
    console.log(syntaxTree);
    var unit = aqt.parseExecutableUnit(syntaxTree.units[0]);
    var pattern = unit.pattern;
    console.log(pattern);
    console.log(pattern.value);

    var engine = new QueryEngine.QueryEngine();
    engine.readConfiguration(function() {
        engine.clean(function(){
            QueryPlan.executeAndBGPsDPSize(pattern.value, unit.dataset, engine, {namespaces:{}}, function(success, res){
                console.log("RESULT");
                console.log(success);
                console.log(res);
                test.done();
            });
        });
    });
};

*/
