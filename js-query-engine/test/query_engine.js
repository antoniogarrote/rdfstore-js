var QueryEngine = require("./../src/query_engine").QueryEngine;
var QuadBackend = require("./../../js-rdf-persistence/src/quad_backend").QuadBackend;
var Lexicon = require("./../../js-rdf-persistence/src/lexicon").Lexicon;

exports.testInsertDataSimpleQuery = function(test){
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            engine.execute('INSERT DATA {  <http://example/book3> <http://example.com/vocab#title> <http://test.com/example> }', function(result){
                test.ok(result===true);

                var s = null;
                var p = null;
                var o = null;
                var captured = false;

                for(var i=0; i<engine.backend.indices.length; i++) {
                    var index = engine.backend.indices[i];
                    var tree = engine.backend.indexMap[index];

                    test.ok(tree.root.keys.length === 1);

                    if(captured === false) {
                        captured = true;

                        s = tree.root.keys[0].subject;
                        p = tree.root.keys[0].predicate;
                        o = tree.root.keys[0].object;
                    } else {
                        test.ok(s === tree.root.keys[0].subject);
                        test.ok(p === tree.root.keys[0].predicate);
                        test.ok(o === tree.root.keys[0].object);
                    }
                }

                test.done();
            });

        })
    });
};

exports.testInsertDataSimpleQueryLiteral = function(test){
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            engine.execute('INSERT DATA {  <http://example/book3> <http://example.com/vocab#title> 2 }', function(result){
                test.ok(result===true);

                var s = null;
                var p = null;
                var o = null;
                var captured = false;

                for(var i=0; i<engine.backend.indices.length; i++) {
                    var index = engine.backend.indices[i];
                    var tree = engine.backend.indexMap[index];

                    test.ok(tree.root.keys.length === 1);

                    if(captured === false) {
                        captured = true;

                        s = tree.root.keys[0].key.subject;
                        p = tree.root.keys[0].key.predicate;
                        o = tree.root.keys[0].key.object;

                        test.ok(s != null);
                        test.ok(p != null);
                        test.ok(o != null);
                    } else {
                        test.ok(s === tree.root.keys[0].key.subject);
                        test.ok(p === tree.root.keys[0].key.predicate);
                        test.ok(o === tree.root.keys[0].key.object);
                    }
                }

                test.ok(o[0]==='l');
                engine.lexicon.retrieve(o, function(result){
                    test.ok(result == '"2"^^<http://www.w3.org/2001/XMLSchema#integer>');
                    test.done();
                });
            });

        })
    });
};

exports.testInsertDataTrivialRecovery = function(test){
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            engine.execute('INSERT DATA {  <http://example/book3> <http://example.com/vocab#title> <http://test.com/example> }', function(result){
                test.ok( result===true );

                engine.execute('SELECT * { ?s ?p ?o }', function(success, result){
                    test.ok(success === true );
                    test.ok(result.length === 1);
                    test.ok(result[0]['s'] === 'http://example/book3');
                    test.ok(result[0]['p'] === 'http://example.com/vocab#title');
                    test.ok(result[0]['o'] === 'http://test.com/example');
                    test.done(); 
                });
            });

        })
    });
};


exports.testInsertDataTrivialRecovery2 = function(test){
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            engine.execute('INSERT DATA {  <http://example/book3> <http://example.com/vocab#title> <http://test.com/example>; <http://example.com/vocab#pages> 95. }', function(success,result){
                test.ok( success===true );

                engine.execute('SELECT * { ?s ?p ?o }', function(success, result){
                    test.ok(success === true );
                    test.ok(result.length === 2);
                    test.ok(result[0]['s'] === 'http://example/book3');
                    test.ok(result[1]['s'] === 'http://example/book3');

                    if(result[0]['p'] === 'http://example.com/vocab#title') {
                        test.ok(result[0]['o'] === 'http://test.com/example');
                    } else if(result[0]['p'] === 'http://example.com/vocab#pages') {
                        test.ok(result[0]['o'] === '"95"^^<http://www.w3.org/2001/XMLSchema#decimal>');
                    } else {
                        test.ok(false);
                    }

                    if(result[1]['p'] === 'http://example.com/vocab#title') {
                        test.ok(result[1]['o'] === 'http://test.com/example');
                    } else if(result[1]['p'] === 'http://example.com/vocab#pages') {
                        test.ok(result[1]['o'] === '"95"^^<http://www.w3.org/2001/XMLSchema#decimal>');
                    } else {
                        test.ok(false);
                    }

                    test.done(); 
                });
            });

        })
    });
};

