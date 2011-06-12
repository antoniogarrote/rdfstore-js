var QueryEngine = require("./../src/query_engine").QueryEngine;
var QuadBackend = require("./../../js-rdf-persistence/src/quad_backend").QuadBackend;
var Lexicon = require("./../../js-rdf-persistence/src/lexicon").Lexicon;

exports.testLoadGraph = function(test){
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            engine.execute('LOAD <http://dbpedialite.org/titles/Lisp_%28programming_language%29> INTO GRAPH <test>', function(result){
                test.ok(result===true);

                engine.execute('PREFIX foaf:<http://xmlns.com/foaf/0.1/> SELECT ?o FROM NAMED <test> { GRAPH <test> { ?s foaf:page ?o} }', function(success,results){
                    test.ok(success);
                    test.ok(results.length > 0);
                    test.done();
                });
            });

        })
    });
};
