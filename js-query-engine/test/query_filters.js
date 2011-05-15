var QueryFilters = require("./../src/query_filters").QueryFilters;
var QueryEngine = require("./../src/query_engine").QueryEngine;
var QuadBackend = require("./../../js-rdf-persistence/src/quad_backend").QuadBackend;
var Lexicon = require("./../../js-rdf-persistence/src/lexicon").Lexicon;

var filter1 = {
    "token": "filter",
    "value": {
        "token": "expression",
        "expressionType": "additiveexpression",
        "summand": {
            "token": "expression",
            "expressionType": "atomic",
            "primaryexpression": "var",
            "value": {
                "token": "var",
                "value": "x"
            }
        },
        "summands": [
            {
                "operator": "+",
                "expression": {
                    "token": "expression",
                    "expressionType": "multiplicativeexpression",
                    "factor": {
                        "token": "expression",
                        "expressionType": "atomic",
                        "primaryexpression": "numericliteral",
                        "value": {
                            "token": "literal",
                            "lang": null,
                            "type": "http://www.w3.org/2001/XMLSchema#integer",
                            "value": "3"
                        }
                    },
                    "factors": [
                        {
                            "operator": "*",
                            "expression": {
                                "token": "expression",
                                "expressionType": "atomic",
                                "primaryexpression": "var",
                                "value": {
                                    "token": "var",
                                    "value": "y"
                                }
                            }
                        },
                        {
                            "operator": "/",
                            "expression": {
                                "token": "expression",
                                "expressionType": "atomic",
                                "primaryexpression": "numericliteral",
                                "value": {
                                    "token": "literal",
                                    "lang": null,
                                    "type": "http://www.w3.org/2001/XMLSchema#integer",
                                    "value": "3"
                                }
                            }
                        }
                    ]
                }
            }
        ]
    }
};



exports.checkBoundVariables = function(test){
    var vars = QueryFilters.boundVars(filter1.value);

    test.ok(vars.length === 2);
    var acum = [];
    for(var i=0; i<vars.length; i++) {
        acum.push(vars[i].value);
    }
    acum.sort();

    test.ok(acum[0] === 'x');
    test.ok(acum[1] === 'y');
    test.done();
}

exports.filterTest1 = function(test){
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            engine.execute('INSERT DATA {  <http://example/book1> <http://example.com/vocab#pages> 256 .\
                                           <http://example/book2> <http://example.com/vocab#pages> 100 }', function(result){
                                               
                                               engine.execute('SELECT ?title { ?title <http://example.com/vocab#pages> ?pages . FILTER(?pages>150) }', function(success, result){
                                                   test.ok(result[0].title.value === "http://example/book1")
                                                   test.done();
                                               });

            });
        });
    });
 }


exports.filterTest2 = function(test){
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            engine.execute('INSERT DATA {  <http://example/book1> <http://example.com/vocab#pages> 256 .\
                                           <http://example/book2> <http://example.com/vocab#pages> 100 }', function(result){
                                               
                                               engine.execute('SELECT ?title { ?title <http://example.com/vocab#pages> ?pages . FILTER(?pages<150) }', function(success, result){
                                                   test.ok(result[0].title.value === "http://example/book2")
                                                   test.done();
                                               });

            });
        });
    });
 }

exports.filterTest3 = function(test){
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            engine.execute('INSERT DATA {  <http://example/book1> <http://example.com/vocab#pages> 150 .\
                                           <http://example/book2> <http://example.com/vocab#pages> 100 }', function(result){
                                               
                                               engine.execute('SELECT ?title { ?title <http://example.com/vocab#pages> ?pages . FILTER(?pages>=150) }', function(success, result){
                                                   test.ok(result[0].title.value === "http://example/book1")
                                                   test.done();
                                               });

            });
        });
    });
 }


exports.filterTest4 = function(test){
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            engine.execute('INSERT DATA {  <http://example/book1> <http://example.com/vocab#pages> 256 .\
                                           <http://example/book2> <http://example.com/vocab#pages> 150 }', function(result){
                                               
                                               engine.execute('SELECT ?title { ?title <http://example.com/vocab#pages> ?pages . FILTER(?pages<=150) }', function(success, result){
                                                   test.ok(result[0].title.value === "http://example/book2")
                                                   test.done();
                                               });

            });
        });
    });
 }

exports.filterTest5 = function(test){
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            engine.execute('INSERT DATA {  <http://example/book1> <http://example.com/vocab#pages> 256 .\
                                           <http://example/book2> <http://example.com/vocab#pages> 150 }', function(result){
                                               
                                               engine.execute('SELECT ?title { ?title <http://example.com/vocab#pages> ?pages . FILTER(?pages=150) }', function(success, result){
                                                   test.ok(result[0].title.value === "http://example/book2")
                                                   test.done();
                                               });

            });
        });
    });
 }


exports.filterTest6 = function(test){
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            engine.execute('INSERT DATA {  <http://example/book1> <http://example.com/vocab#pages> 10 .\
                                           <http://example/book2> <http://example.com/vocab#pages> 20 .\
                                           <http://example/book3> <http://example.com/vocab#pages> 30 }', function(result){
                                               
                                               engine.execute('SELECT ?title { ?title <http://example.com/vocab#pages> ?pages . FILTER(?pages<15 || ?pages>25) }', function(success, results){
                                                   test.ok(results.length === 2);
                                                   var acum = [];
                                                   for(var i=0; i<results.length; i++) {
                                                       acum.push(results[i].title.value)
                                                   }
                                                   acum.sort();

                                                   test.ok(acum[0]=="http://example/book1");
                                                   test.ok(acum[1]=="http://example/book3");
                                                   test.done();
                                               });

            });
        });
    });
 }


exports.filterTest7 = function(test){
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            engine.execute('INSERT DATA {  <http://example/book1> <http://example.com/vocab#pages> 10 .\
                                           <http://example/book2> <http://example.com/vocab#pages> 20 .\
                                           <http://example/book3> <http://example.com/vocab#pages> 30 }', function(result){
                                               
                                               engine.execute('SELECT ?title { ?title <http://example.com/vocab#pages> ?pages . FILTER(?pages>15 && ?pages<25) }', function(success, results){
                                                   test.ok(results.length === 1);
                                                   test.ok(results[0].title.value=="http://example/book2");
                                                   test.done();
                                               });
            });
        });
    });
 }

exports.filterTest8 = function(test){
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            engine.execute('INSERT DATA {  <http://example/book1> <http://example.com/vocab#pages> 10 .\
                                           <http://example/book2> <http://example.com/vocab#pages> 20 .\
                                           <http://example/book3> <http://example.com/vocab#pages> 30 }', function(result){
                                               
                                               engine.execute('SELECT ?title { ?title <http://example.com/vocab#pages> ?pages . FILTER(?pages=10 || ?pages=20 || ?pages=30) }', function(success, results){
                                                   test.ok(results.length === 3);
                                                   var acum = [];
                                                   for(var i=0; i<results.length; i++) {
                                                       acum.push(results[i].title.value)
                                                   }
                                                   acum.sort();

                                                   test.ok(acum[0]=="http://example/book1");
                                                   test.ok(acum[1]=="http://example/book2");
                                                   test.ok(acum[2]=="http://example/book3");
                                                   test.done();
                                               });

            });
        });
    });
 }

exports.filterTest9 = function(test){
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            engine.execute('INSERT DATA {  <http://example/book1> <http://example.com/vocab#pages> 10 .\
                                           <http://example/book2> <http://example.com/vocab#pages> 20 .\
                                           <http://example/book3> <http://example.com/vocab#pages> 30 }', function(result){
                                               
                                               engine.execute('SELECT ?title { ?title <http://example.com/vocab#pages> ?pages . FILTER(?pages=(6+4)) }', function(success, results){
                                                   test.ok(results.length === 1);
                                                   test.ok(results[0].title.value =="http://example/book1");
                                                   test.done();
                                               });

            });
        });
    });
 }


exports.filterTest10 = function(test){
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            engine.execute('INSERT DATA {  <http://example/book1> <http://example.com/vocab#pages> 10 .\
                                           <http://example/book2> <http://example.com/vocab#pages> 20 .\
                                           <http://example/book3> <http://example.com/vocab#pages> 30 }', function(result){
                                               
                                               engine.execute('SELECT ?title { ?title <http://example.com/vocab#pages> ?pages . FILTER(14=(?pages+4)) }', function(success, results){
                                                   test.ok(results.length === 1);
                                                   test.ok(results[0].title.value =="http://example/book1");
                                                   test.done();
                                               });

            });
        });
    });
 }


exports.filterTest11 = function(test){
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            engine.execute('INSERT DATA {  <http://example/book1> <http://example.com/vocab#pages> 10 .\
                                           <http://example/book2> <http://example.com/vocab#pages> 20 .\
                                           <http://example/book3> <http://example.com/vocab#pages> 30 }', function(result){
                                               
                                               engine.execute('SELECT ?title { ?title <http://example.com/vocab#pages> ?pages . FILTER(?pages=14-6+2) }', function(success, results){
                                                   test.ok(results.length === 1);
                                                   test.ok(results[0].title.value =="http://example/book1");
                                                   test.done();
                                               });

            });
        });
    });
 }


exports.filterTest12 = function(test){
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            engine.execute('INSERT DATA {  <http://example/book1> <http://example.com/vocab#pages> 10 .\
                                           <http://example/book2> <http://example.com/vocab#pages> 20 .\
                                           <http://example/book3> <http://example.com/vocab#pages> 30 }', function(result){
                                               
                                               engine.execute('SELECT ?title { ?title <http://example.com/vocab#pages> ?pages . FILTER(?pages=5*2) }', function(success, results){
                                                   test.ok(results.length === 1);
                                                   test.ok(results[0].title.value =="http://example/book1");
                                                   test.done();
                                               });

            });
        });
    });
 }

exports.filterTest13 = function(test){
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            engine.execute('INSERT DATA {  <http://example/book1> <http://example.com/vocab#pages> 10 .\
                                           <http://example/book2> <http://example.com/vocab#pages> 20 .\
                                           <http://example/book3> <http://example.com/vocab#pages> 30 }', function(result){
                                               
                                               engine.execute('SELECT ?title { ?title <http://example.com/vocab#pages> ?pages . FILTER(?pages=20/2) }', function(success, results){
                                                   test.ok(results.length === 1);
                                                   test.ok(results[0].title.value =="http://example/book1");
                                                   test.done();
                                               });

            });
        });
    });
 }

exports.filterTest14 = function(test){
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            engine.execute('INSERT DATA {  <http://example/book1> <http://example.com/vocab#title> "titulo"@es .\
                                           <http://example/book2> <http://example.com/vocab#title> "title"@en .\
                                           <http://example/book3> <http://example.com/vocab#title> "titre"@fr }', function(result){
                                               engine.execute('SELECT ?book { ?book <http://example.com/vocab#title> ?title . FILTER(LANG(?title)="en") }', function(success, results){
                                                   test.ok(results.length === 1);
                                                   test.ok(results[0].book.value =="http://example/book2");
                                                   test.done();
                                               });

            });
        });
    });
 }

