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

                engine.lexicon.retrieve(o, function(result){
                    test.ok(result.kind === "literal");
                    test.ok(result.value === "2");
                    test.ok(result.type === "http://www.w3.org/2001/XMLSchema#integer");
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
                    test.ok(result[0]['s'].value === 'http://example/book3');
                    test.ok(result[0]['p'].value === 'http://example.com/vocab#title');
                    test.ok(result[0]['o'].value  === 'http://test.com/example');
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
            engine.execute('INSERT DATA {  <http://example/book3> <http://example.com/vocab#title> <http://test.com/example>; <http://example.com/vocab#pages> 95 }', function(success,result){
                test.ok( success===true );

                engine.execute('SELECT * { ?s ?p ?o }', function(success, result){
                    test.ok(success === true );
                    test.ok(result.length === 2);
                    test.ok(result[0]['s'].value === 'http://example/book3');
                    test.ok(result[1]['s'].value === 'http://example/book3');

                    if(result[0]['p'].value === 'http://example.com/vocab#title') {
                        test.ok(result[0]['o'].value === 'http://test.com/example');
                    } else if(result[0]['p'].value === 'http://example.com/vocab#pages') {
                        test.ok(result[1]['o'].value === "95");
                        test.ok(result[1]['o'].type === "http://www.w3.org/2001/XMLSchema#integer");
                    } else {
                        test.ok(false);
                    }

                    if(result[1]['p'].value === 'http://example.com/vocab#title') {
                        test.ok(result[1]['o'].value === 'http://test.com/example');
                    } else if(result[1]['p'].value === 'http://example.com/vocab#pages') {
                        test.ok(result[1]['o'].value === "95");
                        test.ok(result[1]['o'].type === "http://www.w3.org/2001/XMLSchema#integer");
                    } else {
                        test.ok(false);
                    }

                    test.done(); 
                });
            });

        })
    });
};

exports.testInsertDataTrivialRecovery3 = function(test){
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            engine.execute('INSERT DATA {  <http://example/book3> <http://example.com/vocab#title> <http://test.com/example>; <http://example.com/vocab#pages> 95 }',function(success,result){
                engine.execute('INSERT DATA { <http://example/book4> <http://example.com/vocab#title> <http://test.com/example>; <http://example.com/vocab#pages> 96 }', function(success,result){
                    test.ok( success===true );
     
                    engine.execute('SELECT * { <http://example/book3> ?p ?o }', function(success, result){
                        test.ok(success === true );
                        test.ok(result.length === 2);
     
                        if(result[0]['p'].value === 'http://example.com/vocab#title') {
                            test.ok(result[0]['o'].value === 'http://test.com/example');
                        } else if(result[0]['p'].value === 'http://example.com/vocab#pages') {
                            test.ok(result[0]['o'].value === "95");
                            test.ok(result[0]['o'].type === "http://www.w3.org/2001/XMLSchema#integer");
                        } else {
                            test.ok(false);
                        }
     
                        if(result[1]['p'].value === 'http://example.com/vocab#title') {
                            test.ok(result[1]['o'].value === 'http://test.com/example');
                        } else if(result[1]['p'].value === 'http://example.com/vocab#pages') {
                            test.ok(result[1]['o'].value === "95");
                            test.ok(result[1]['o'].type === "http://www.w3.org/2001/XMLSchema#integer");
                        } else {
                            test.ok(false);
                        }
     
                        test.done(); 
                    });
                });
            });
        });
    });
};

exports.testSimpleJoin1 = function(test){
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            engine.execute('INSERT DATA {  <http://example/book3> <http://example.com/vocab#title> <http://test.com/example>; <http://example.com/vocab#pages> 95 . <http://example/book4> <http://example.com/vocab#title> <http://test.com/example>; <http://example.com/vocab#pages> 96 . }', function(success,result){
                test.ok( success===true );
     
                engine.execute('SELECT * { ?s <http://example.com/vocab#title> ?o . ?s <http://example.com/vocab#pages> 95 }', function(success, result){
                    test.ok(success === true );
                    test.ok(result.length === 1);
     
                    result[0]['s'].value === "http://example/book3";
                    test.done(); 
                });
            });
        });
    });
};


exports.testPrefixInsertion = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            engine.execute('PREFIX ns: <http://example.org/ns#>  PREFIX x:  <http://example.org/x/> PREFIX z:  <http://example.org/x/#> INSERT DATA { x:x ns:p  "d:x ns:p" . x:x x:p   "x:x x:p" . z:x z:p   "z:x z:p" . }', function(success, result){

                engine.execute('SELECT * { ?s ?p ?o }', function(success, results){
                    test.ok(success === true);
                    test.ok(results.length === 3);
                    
                    for(var i=0; i<results.length; i++) {
                        if(results[i].s.value === "http://example.org/x/x") {
                            if(results[i].p.value === "http://example.org/ns#p") {
                                test.ok(results[i].o.value === "d:x ns:p");
                            } else if(results[i].p.value === "http://example.org/x/p") {
                                test.ok(results[i].o.value === "x:x x:p");
                            } else {
                                test.ok(false);
                            }
                        } else if(results[i].s.value === "http://example.org/x/#x") {
                            test.ok(results[i].p.value === "http://example.org/x/#p");
                            test.ok(results[i].o.value === "z:x z:p");
                        } else {
                            test.ok(false);
                        }
                    }

                    test.done();
                });
            });
        });
    });
};

exports.testUnionBasic1 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            engine.execute(" PREFIX dc10:  <http://purl.org/dc/elements/1.0/> PREFIX dc11:  <http://purl.org/dc/elements/1.1/> INSERT DATA { _:a  dc10:title     'SPARQL Query Language Tutorial' .\
                             _:a  dc10:creator   'Alice' .\
                             _:b  dc11:title     'SPARQL Protocol Tutorial' .\
                             _:b  dc11:creator   'Bob' .\
                             _:c  dc10:title     'SPARQL' .\
                             _:c  dc11:title     'SPARQL (updated)' .\
                             }", function(success, result) {

                                 engine.execute("PREFIX dc10:  <http://purl.org/dc/elements/1.0/>\
                                                 PREFIX dc11:  <http://purl.org/dc/elements/1.1/>\
                                                 SELECT ?title WHERE  { { ?book dc10:title  ?title } UNION { ?book dc11:title  ?title } }",
                                                function(success, results) {
                                                    test.ok(results.length === 4);

                                                    var titles = [];
                                                    for(var i=0; i<results.length; i++) {
                                                        titles.push(results[i].title.value);
                                                    }
                                                    titles.sort();
                                                    test.ok(titles[0], 'SPARQL');
                                                    test.ok(titles[1], 'SPARQL (updated)');
                                                    test.ok(titles[2], 'SPARQL Protocol Tutorial');
                                                    test.ok(titles[3], 'SPARQL Query Language Tutorial');
                                                    test.done();
                                                });
                             });
        });
    });
};


exports.testUnionBasic2 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            engine.execute(" PREFIX dc10:  <http://purl.org/dc/elements/1.0/> PREFIX dc11:  <http://purl.org/dc/elements/1.1/> INSERT DATA { _:a  dc10:title     'SPARQL Query Language Tutorial' .\
                             _:a  dc10:creator   'Alice' .\
                             _:b  dc11:title     'SPARQL Protocol Tutorial' .\
                             _:b  dc11:creator   'Bob' .\
                             _:c  dc10:title     'SPARQL' .\
                             _:c  dc11:title     'SPARQL (updated)' .\
                             }", function(success, result) {

                                 engine.execute("PREFIX dc10:  <http://purl.org/dc/elements/1.0/>\
                                                 PREFIX dc11:  <http://purl.org/dc/elements/1.1/>\
                                                 SELECT ?x ?y\
                                                 WHERE  { { ?book dc10:title ?x } UNION { ?book dc11:title  ?y } }",
                                                function(success, results) {
                                                    test.ok(results.length === 4);

                                                    var xs = [];
                                                    var ys = [];
                                                    for(var i=0; i<results.length; i++) {
                                                        if(results[i].x == null) {
                                                            ys.push(results[i].y.value);
                                                        } else {
                                                            xs.push(results[i].x.value);
                                                        }
                                                    }

                                                    xs.sort();
                                                    ys.sort();

                                                    test.ok(xs[0]=='SPARQL');
                                                    test.ok(xs[1]=='SPARQL Query Language Tutorial');
                                                    test.ok(ys[0]=='SPARQL (updated)');
                                                    test.ok(ys[1]=='SPARQL Protocol Tutorial');
                                                    test.done();
                                                });
                             });
        });
    });
};


exports.testUnionBasic3 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            engine.execute(" PREFIX dc10:  <http://purl.org/dc/elements/1.0/> PREFIX dc11:  <http://purl.org/dc/elements/1.1/> INSERT DATA { _:a  dc10:title     'SPARQL Query Language Tutorial' .\
                             _:a  dc10:creator   'Alice' .\
                             _:b  dc11:title     'SPARQL Protocol Tutorial' .\
                             _:b  dc11:creator   'Bob' .\
                             _:c  dc10:title     'SPARQL' .\
                             _:c  dc11:title     'SPARQL (updated)' .\
                             }", function(success, result) {

                                 engine.execute("PREFIX dc10:  <http://purl.org/dc/elements/1.0/>\
                                                 PREFIX dc11:  <http://purl.org/dc/elements/1.1/>\
                                                 SELECT ?title ?author\
                                                 WHERE  { { ?book dc10:title ?title .  ?book dc10:creator ?author }\
                                                 UNION\
                                                 { ?book dc11:title ?title .  ?book dc11:creator ?author } }",
                                                function(success, results) {
                                                    test.ok(results.length === 2);

                                                    if(results[0].author.value == "Alice") {
                                                        test.ok(results[0].title.value == "SPARQL Query Language Tutorial");
                                                        test.ok(results[1].author.value == "Bob");
                                                        test.ok(results[1].title.value == "SPARQL Protocol Tutorial");
                                                    } else {
                                                        test.ok(results[1].author.value == "Alice");
                                                        test.ok(results[1].title.value == "SPARQL Query Language Tutorial");
                                                        test.ok(results[0].author.value == "Bob");
                                                        test.ok(results[0].title.value == "SPARQL Protocol Tutorial");
                                                    }
                                                    test.done();
                                                });
                             });
        });
    });
};


exports.testUnionBasic4 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            engine.execute(" PREFIX dc10:  <http://purl.org/dc/elements/1.0/> PREFIX dc11:  <http://purl.org/dc/elements/1.1/> INSERT DATA { _:a  dc10:title     'SPARQL Query Language Tutorial' .\
                             _:a  dc10:creator   'Alice' .\
                             _:b  dc11:title     'SPARQL Protocol Tutorial' .\
                             _:b  dc11:creator   'Bob' .\
                             _:c  dc10:title     'SPARQL' .\
                             _:c  dc11:title     'SPARQL (updated)' .\
                             }", function(success, result) {

                                 engine.execute("SELECT ?book WHERE { ?book ?p ?o }",
                                                function(success, results) {
                                                    test.ok(results.length === 6);
                                                    for(var i=0; i<6; i++) {
                                                        test.ok(results[i].book.kind == 'blank');
                                                        test.ok(results[i].book.value != null);
                                                    }
                                                    test.done();
                                                });
                             });
        });
    });
};
