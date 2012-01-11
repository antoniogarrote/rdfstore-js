var QueryEngine = require("./../src/query_engine").QueryEngine;
var QuadBackend = require("./../../js-rdf-persistence/src/quad_backend").QuadBackend;
var Lexicon = require("./../../js-rdf-persistence/src/lexicon").Lexicon;
var Callbacks = require("./../src/callbacks").Callbacks;
var RDFJSInterface = require("./../src/rdf_js_interface").RDFJSInterface;

exports.simpleCallback = function(test){
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      

            var callbacksBackend = new Callbacks.CallbacksBackend(engine);

            var callbackasCounter = 0;
            callbacksBackend.subscribe(null,null,null,"http://test.com/g",
                                       function(event, triples) {
                                           callbackasCounter++;

                                           callbacksBackend.unsubscribe(arguments.callee);

                                           var quad = {subject:   {token:'uri', value:'http://test.com/a'},
                                                       predicate: {token:'uri', value:'http://test.com/b'},
                                                       object:    {token:'uri', value:'http://test.com/c'},
                                                       graph:     {token:'uri', value:'http://test.com/g'}};

                                           var queryEnv = {blanks:{}, outCache:{}};

                                           var normalized = engine.normalizeQuad(quad, queryEnv, true);
                                           callbacksBackend.sendNotification('added', [[quad, normalized]], function(){
                                               var counter = 0;
                                               for(var p in callbacksBackend.callbacksMap) {
                                                   counter++;
                                               }
                                               for(var p in callbacksBackend.callbacksInverseMap) {
                                                   counter++
                                               }
                                               test.ok(counter === 0);
                                               test.ok(callbackasCounter === 1);
                                               test.done();
                                           });
                                       },
                                       function() {
                                           var quad = {subject:   {token:'uri', value:'http://test.com/a'},
                                                       predicate: {token:'uri', value:'http://test.com/b'},
                                                       object:    {token:'uri', value:'http://test.com/c'},
                                                       graph:     {token:'uri', value:'http://test.com/g'}};

                                           var quad2 = {subject:   {token:'uri', value:'http://test.com/a'},
                                                        predicate: {token:'uri', value:'http://test.com/b'},
                                                        object:    {token:'uri', value:'http://test.com/c'},
                                                        graph:     {token:'uri', value:'http://test.com/g2'}};

                                           var queryEnv = {blanks:{}, outCache:{}};

                                           var normalized2 = engine.normalizeQuad(quad2, queryEnv, true);
                                           var normalized = engine.normalizeQuad(quad, queryEnv, true);
                                           callbacksBackend.sendNotification('added', [[quad2, normalized2]]);
                                           callbacksBackend.sendNotification('added', [[quad, normalized]]);
                                       });
        });
    });
};

exports.simpleCallback2 = function(test){
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      

            var callbacksBackend = new Callbacks.CallbacksBackend(engine);

            var callbackasCounter = 0;
            callbacksBackend.subscribe("http://test.com/a","http://test.com/b","http://test.com/c","http://test.com/g",
                                       function(event, triples) {
                                           callbackasCounter++;
                                           callbacksBackend.unsubscribe(arguments.callee);

                                           var quad = {subject:   {token:'uri', value:'http://test.com/a'},
                                                       predicate: {token:'uri', value:'http://test.com/b'},
                                                       object:    {token:'uri', value:'http://test.com/c'},
                                                       graph:     {token:'uri', value:'http://test.com/g'}};

                                           var queryEnv = {blanks:{}, outCache:{}};

                                           var normalized = engine.normalizeQuad(quad, queryEnv, true);
                                           callbacksBackend.sendNotification('added', [[quad, normalized]], function(){
                                               var counter = 0;
                                               for(var p in callbacksBackend.callbacksMap) {
                                                   counter++;
                                               }
                                               for(var p in callbacksBackend.callbacksInverseMap) {
                                                   counter++
                                               }
                                               test.ok(counter === 0);
                                               test.ok(callbackasCounter === 1);
                                               test.done();
                                           });
                                           
                                       },
                                       function() {
                                           var quad = {subject:   {token:'uri', value:'http://test.com/a'},
                                                       predicate: {token:'uri', value:'http://test.com/b'},
                                                       object:    {token:'uri', value:'http://test.com/c'},
                                                       graph:     {token:'uri', value:'http://test.com/g'}};

                                           var quad2 = {subject:   {token:'uri', value:'http://test.com/a'},
                                                        predicate: {token:'uri', value:'http://test.com/b'},
                                                        object:    {token:'uri', value:'http://test.com/c'},
                                                        graph:     {token:'uri', value:'http://test.com/g2'}};

                                           var queryEnv = {blanks:{}, outCache:{}};

                                           var normalized2 = engine.normalizeQuad(quad2, queryEnv, true);
                                           var normalized = engine.normalizeQuad(quad, queryEnv, true);
                                           callbacksBackend.sendNotification('added', [[quad, normalized]]);
                                       });
        });
    })
};

exports.simpleObserve1 = function(test){
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            
            var count = 0;
            var numTriples = 0;
            var observerCallback = function(graph) {
                count++;
                numTriples = graph.toArray().length;
                if(count ===4) {
                    engine.callbacksBackend.stopObservingNode(observerCallback);
                }
            };

            engine.callbacksBackend.observeNode("http://example/book", null, observerCallback, function() {
                engine.execute('INSERT DATA {  <http://example/book> <http://example.com/vocab#title> <http://test.com/example> }', function(){
                    engine.execute('INSERT DATA {  <http://example/book> <http://example.com/vocab#other> <http://test.com/example2> }', function(){
                        // this should not trigger the callback
                        engine.execute('INSERT DATA {  <http://example/book2> <http://example.com/vocab#other> <http://test.com/example3> }', function(){
                            engine.execute('DELETE DATA {  <http://example/book> <http://example.com/vocab#other> <http://test.com/example2> }', function(){
                                test.ok(count === 4);
                                test.ok(numTriples === 1);
                                test.ok(engine.callbacksBackend.emptyNotificationsMap[Callbacks['eventsFlushed']].length === 0);
                                test.done();
                            });
                        });
                    });
                });
            });
        });
    });
};

exports.simpleObserve2 = function(test){
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            
            var count = 0;
            var numTriples = 0;
            var triples = [];
            var observerCallback = function(graph) {
                count++;
                numTriples = graph.toArray().length;
                triples = graph.toArray();
                if(count ===2) {
                    engine.callbacksBackend.stopObservingNode(observerCallback);
                }
            };

            engine.execute('INSERT DATA {  <http://example/book> <http://example.com/vocab#title> <http://test.com/example> }', function(){
                engine.callbacksBackend.observeNode("http://example/book", null, observerCallback, function() {
                    engine.execute('DELETE {  <http://example/book> <http://example.com/vocab#title> <http://test.com/example> } INSERT { <http://example/book> <http://example.com/vocab#title> <http://test.com/example2> } WHERE { <http://example/book> <http://example.com/vocab#title> <http://test.com/example> }', function(){
                        test.ok(count === 2);
                        test.ok(numTriples === 1);    
                        test.ok(triples.length === 1);
                        test.ok(triples[0]['object'].valueOf() === "http://test.com/example2");
                        test.ok(engine.callbacksBackend.emptyNotificationsMap[Callbacks['eventsFlushed']].length === 0);
                        test.done();
                    });
                });
            });
        });
    });
};


exports.simpleCallbackQuery1 = function(test){
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      

            var callbacksBackend = engine.callbacksBackend;

            var callbacksCounter = 0;

            callbacksBackend.observeQuery("select * where { ?s ?p ?o }",
                                          function(bindings) {
                                              if(callbacksCounter == 0) {
                                                  callbacksCounter++;
                                                  test.ok(bindings.length === 0);
                                              } else if(callbacksCounter === 1) {
                                                  callbacksCounter++;
                                                  test.ok(bindings.length === 1);
                                                  test.ok(bindings[0].o.value === "http://test.com/example1");
                                                  callbacksBackend.stopObservingQuery("select * where { ?s ?p ?o }");
                                                  setTimeout(function(){
                                                      test.done();
                                                  }, 2000);
                                              } else {
                                                  test.ok(false);
                                                  test.done();
                                              }
                                          });
  
            engine.execute('INSERT DATA {  <http://example/book> <http://example.com/vocab#title> <http://test.com/example1> }', function(){
                engine.execute('INSERT DATA {  <http://example/book> <http://example.com/vocab#title> <http://test.com/example2> }', function(){
                    // callbacks should have been fired
                });
            });
        });
    })
};


exports.simpleCallbackQuery2 = function(test){
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      

            var callbacksBackend = engine.callbacksBackend;

            var callbacksCounter = 0;

            callbacksBackend.observeQuery("select * where { <http://test.com/vocab#a> ?p ?o }",
                                          function(bindings) {
                                              if(callbacksCounter == 0) {
                                                  callbacksCounter++;
                                                  test.ok(bindings.length === 0);
                                              } else if(callbacksCounter === 1) {
                                                  callbacksCounter++;
                                                  test.ok(bindings.length === 1);
                                                  test.ok(bindings[0].o.value === "http://test.com/example1");                       
                                              } else if(callbacksCounter === 2) {
                                                  callbacksCounter++;
                                                  test.ok(bindings.length === 2);
                                                  test.ok(bindings[0].o.value === "http://test.com/example1");                       
                                                  test.ok(bindings[1].o.value === "http://test.com/example3");                       
                                              } else if(callbacksCounter === 3) {
                                                  callbacksCounter++;
                                                  test.ok(bindings.length === 1);
                                                  test.ok(bindings[0].o.value === "http://test.com/example1");                       
                                                  setTimeout(function(){
                                                      test.done();
                                                  }, 2000);
                                              } else {
                                                  test.ok(false);
                                                  test.done();
                                              }
                                          });
  
            engine.execute('INSERT DATA {  <http://test.com/vocab#a> <http://example.com/vocab#title> <http://test.com/example1> }', function(){
                engine.execute('INSERT DATA {  <http://example/book> <http://example.com/vocab#title> <http://test.com/example2> }', function(){
                    engine.execute('INSERT DATA {  <http://test.com/vocab#a> <http://example.com/vocab#title> <http://test.com/example3> }', function(){
                        engine.execute('DELETE DATA {  <http://test.com/vocab#a> <http://example.com/vocab#title> <http://test.com/example3> }', function(){
                            // callbacks should have been fired
                        });
                    });
                });
            });
        });
    })
};


exports.simpleCallbackQuery3 = function(test){
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      

            var callbacksBackend = engine.callbacksBackend;

            var callbacksCounter = 0;

            callbacksBackend.observeQuery("select ?subject where { ?subject <http://test.com/named> ?o }",
                                          function(bindings) {
                                              if(callbacksCounter == 0) {
                                                  callbacksCounter++;
                                                  test.ok(bindings.length === 0);
                                              } else if(callbacksCounter === 1) {
                                                  callbacksCounter++;
                                                  test.ok(bindings.length === 1);
                                                  setTimeout(function(){
                                                      test.done();
                                                  }, 2000);
                                              } else {
                                                  test.ok(false);
                                                  test.done();
                                              }
                                          });
  
            engine.execute('INSERT DATA {  <http://test.com/subject> <http://test.com/named> "value" }', function(){
                            // callbacks should have been fired
            });
        });
    })
};

exports.callbacksBatchLoad = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var callbackCounter = 0;

            engine.callbacksBackend.observeQuery("select ?subject where { ?subject <http://test.com/named> ?o; <http://test.com/named2> ?o2 }",function(){
                callbackCounter++;
            });

            var jsonld = {
                '@id':"http://test.com/1",
                'http://test.com/named': 'hello'
            };

            var graph = RDFJSInterface.rdf.createNamedNode(engine.lexicon.defaultGraphUri);
            var parser = engine.rdfLoader.parsers['application/json'];

            engine.rdfLoader.tryToParse(parser, {'token':'uri', 'value':graph.valueOf()}, jsonld, function(success, quads) {
                if(success) {
                    engine.batchLoad(quads,function(){
                        engine.eventsOnBatchLoad = true;

                        jsonld = {
                            '@id':"http://test.com/2",
                            'http://test.com/named2': 'hello'
                        };
                        engine.rdfLoader.tryToParse(parser, {'token':'uri', 'value':graph.valueOf()}, jsonld, function(success, quads) {
                            if(success) {
                                engine.batchLoad(quads,function(){
                                    test.ok(callbackCounter===2);
                                    setTimeout(function(){
                                        test.done();
                                    }, 2000);
                                });
                            } else {
                                test.ok(false);
                                test.done();
                            }
                        });
                    });
                } else {
                    test.ok(false);
                    test.done();
                }
            });

        });
    });
};
