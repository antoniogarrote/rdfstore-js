var QueryEngine = require("./../src/query_engine").QueryEngine;
var QuadBackend = require("./../../js-rdf-persistence/src/quad_backend").QuadBackend;
var Lexicon = require("./../../js-rdf-persistence/src/lexicon").Lexicon;
var Callbacks = require("./../src/callbacks").Callbacks;

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

                                           engine.normalizeQuad(quad, queryEnv, true, function(success, normalized){
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

                                           engine.normalizeQuad(quad2, queryEnv, true, function(success, normalized2){
                                               engine.normalizeQuad(quad, queryEnv, true, function(success, normalized){
                                                   callbacksBackend.sendNotification('added', [[quad2, normalized2]]);
                                                   callbacksBackend.sendNotification('added', [[quad, normalized]]);
                                               });
                                           });
                                       });
        });
    })
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

                                           engine.normalizeQuad(quad, queryEnv, true, function(success, normalized){
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

                                           engine.normalizeQuad(quad2, queryEnv, true, function(success, normalized2){
                                               engine.normalizeQuad(quad, queryEnv, true, function(success, normalized){
                                                   callbacksBackend.sendNotification('added', [[quad, normalized]]);
                                               });
                                           });
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
            engine.callbacksBackend.observeNode("http://example/book", null, function(graph) {
                count++;
                numTriples = graph.toArray().length;
            }, function() {
                engine.execute('INSERT DATA {  <http://example/book> <http://example.com/vocab#title> <http://test.com/example> }', function(){
                    engine.execute('INSERT DATA {  <http://example/book> <http://example.com/vocab#other> <http://test.com/example2> }', function(){
                        // this shoulg not trigger the callback
                        engine.execute('INSERT DATA {  <http://example/book2> <http://example.com/vocab#other> <http://test.com/example3> }', function(){
                            engine.execute('DELETE DATA {  <http://example/book> <http://example.com/vocab#other> <http://test.com/example2> }', function(){
                                test.ok(count === 4);
                                test.ok(numTriples = 1);

                                test.done();
                            });
                        });
                    });
                });
            });
        });
    });
};

