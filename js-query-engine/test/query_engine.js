var QueryEngine = require("./../src/query_engine").QueryEngine;
var QuadBackend = require("./../../js-rdf-persistence/src/quad_backend").QuadBackend;
var Lexicon = require("./../../js-rdf-persistence/src/lexicon").Lexicon;

exports.testInsertDataSimpleQuery = function(test){
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});
            console.log(1);
            engine.execute('INSERT DATA {  <http://example/book3> <http://example.com/vocab#title> <http://test.com/example> }', function(result){
                console.log(2);
                test.ok(result===true);
                test.done();
            });

        })
    });
};
