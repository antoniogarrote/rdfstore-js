var Store = require("./../src/store").Store;

exports.testIntegration1 = function(test){
    new Store.Store(function(store){
        store.execute('INSERT DATA {  <http://example/book3> <http://example.com/vocab#title> <http://test.com/example> }', function(){
            store.execute('SELECT * { ?s ?p ?o }', function(success,results) {
                test.ok(success === true);
                test.ok(results.length === 1);
                test.ok(results[0].s.value === "http://example/book3");
                test.ok(results[0].p.value === "http://example.com/vocab#title");
                test.ok(results[0].o.value === "http://test.com/example");

                test.done();
            });
        });
    });
}

exports.testIntegration2 = function(test){
    new Store.Store({treeOrder: 50}, function(store){
        store.execute('INSERT DATA {  <http://example/book3> <http://example.com/vocab#title> <http://test.com/example> }', function(){
            store.execute('SELECT * { ?s ?p ?o }', function(success,results) {
                test.ok(success === true);
                test.ok(results.length === 1);
                test.ok(results[0].s.value === "http://example/book3");
                test.ok(results[0].p.value === "http://example.com/vocab#title");
                test.ok(results[0].o.value === "http://test.com/example");

                test.done();
            });
        });
    });
}


exports.testGraph1 = function(test) {
    new Store.Store(function(store) {
        var query = 'PREFIX foaf: <http://xmlns.com/foaf/0.1/>\
                     PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                     PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\
                     PREFIX : <http://example.org/people/>\
                     INSERT DATA {\
                     :alice\
                         rdf:type        foaf:Person ;\
                         foaf:name       "Alice" ;\
                         foaf:mbox       <mailto:alice@work> ;\
                         foaf:knows      :bob ;\
                         .\
                     :bob\
                         rdf:type        foaf:Person ;\
                         foaf:name       "Bob" ; \
                         foaf:knows      :alice ;\
                         foaf:mbox       <mailto:bob@home> ;\
                         .\
                     }';
        store.execute(query, function(success, results) {
            store.graph(function(succes, graph){
                var results = graph.filter( store.rdf.filters.describes("http://example.org/people/alice") );

                var resultsCount = results.toArray().length;

                var resultsSubject = results.filter(store.rdf.filters.s("http://example.org/people/alice"))
                var resultsObject  = results.filter(store.rdf.filters.o("http://example.org/people/alice"))
                
                test.ok(resultsObject.toArray().length === 1);
                test.ok((resultsObject.toArray().length + resultsSubject.toArray().length) === resultsCount);

                test.done();
            });
        });
    });
};

exports.testGraph2 = function(test) {
    new Store.Store(function(store) {
        var query = 'PREFIX foaf: <http://xmlns.com/foaf/0.1/>\
                     PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                     PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\
                     PREFIX : <http://example.org/people/>\
                     INSERT DATA {\
                       GRAPH :alice {\
                         :alice\
                             rdf:type        foaf:Person ;\
                             foaf:name       "Alice" ;\
                             foaf:mbox       <mailto:alice@work> ;\
                             foaf:knows      :bob ;\
                         .\
                       }\
                     }';
        store.execute(query, function(success, results) {

            var query = 'PREFIX foaf: <http://xmlns.com/foaf/0.1/>\
                         PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                         PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\
                         PREFIX : <http://example.org/people/>\
                         INSERT DATA {\
                           GRAPH :bob {\
                              :bob\
                                  rdf:type        foaf:Person ;\
                                  foaf:name       "Bob" ; \
                                  foaf:knows      :alice ;\
                                  foaf:mbox       <mailto:bob@home> ;\
                                  .\
                           }\
                         }'
        store.execute(query, function(success, results) {

            store.graph(function(succes, graph){
                test.ok(graph.toArray().length === 0);

                store.graph("http://example.org/people/alice", function(succes, results) {

                    test.ok(results.toArray().length === 4);
                    test.done();
                });
            });
        });
        });
    });
};

exports.testSubject1 = function(test) {
    new Store.Store(function(store) {
        var query = 'PREFIX foaf: <http://xmlns.com/foaf/0.1/>\
                     PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                     PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\
                     PREFIX : <http://example.org/people/>\
                     INSERT DATA {\
                     :alice\
                         rdf:type        foaf:Person ;\
                         foaf:name       "Alice" ;\
                         foaf:mbox       <mailto:alice@work> ;\
                         foaf:knows      :bob ;\
                         .\
                     :bob\
                         rdf:type        foaf:Person ;\
                         foaf:name       "Bob" ; \
                         foaf:knows      :alice ;\
                         foaf:mbox       <mailto:bob@home> ;\
                         .\
                     }';
        store.execute(query, function(success, results) {
            store.node("http://example.org/people/alice", function(succes, graph){
                test.ok(graph.toArray().length === 4);
                test.done();
            });
        });
    });
};

exports.testSubject2 = function(test) {
    new Store.Store(function(store) {
        var query = 'PREFIX foaf: <http://xmlns.com/foaf/0.1/>\
                     PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                     PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\
                     PREFIX : <http://example.org/people/>\
                     INSERT DATA {\
                       GRAPH :alice {\
                         :alice\
                             rdf:type        foaf:Person ;\
                             foaf:name       "Alice" ;\
                             foaf:mbox       <mailto:alice@work> ;\
                             foaf:knows      :bob ;\
                         .\
                       }\
                     }';
        store.execute(query, function(success, results) {

            var query = 'PREFIX foaf: <http://xmlns.com/foaf/0.1/>\
                         PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                         PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\
                         PREFIX : <http://example.org/people/>\
                         INSERT DATA {\
                           GRAPH :bob {\
                              :bob\
                                  rdf:type        foaf:Person ;\
                                  foaf:name       "Bob" ; \
                                  foaf:knows      :alice ;\
                                  foaf:mbox       <mailto:bob@home> ;\
                                  .\
                           }\
                         }'
        store.execute(query, function(success, results) {

            store.graph(function(succes, graph){
                test.ok(graph.toArray().length === 0);

                store.node("http://example.org/people/alice", "http://example.org/people/alice", function(success, results) {

                    test.ok(results.toArray().length === 4);
                    test.done();
                });
            });
        });
        });
    });
};

exports.testPrefixes = function(test) {
    new Store.Store(function(store) {
        var query = 'PREFIX foaf: <http://xmlns.com/foaf/0.1/>\
                     PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                     PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\
                     PREFIX : <http://example.org/people/>\
                     INSERT DATA {\
                       GRAPH :alice {\
                         :alice\
                             rdf:type        foaf:Person ;\
                             foaf:name       "Alice" ;\
                             foaf:mbox       <mailto:alice@work> ;\
                             foaf:knows      :bob ;\
                         .\
                       }\
                     }';
        store.execute(query, function(success, results) {

            var query = 'PREFIX foaf: <http://xmlns.com/foaf/0.1/>\
                         PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                         PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\
                         PREFIX : <http://example.org/people/>\
                         INSERT DATA {\
                           GRAPH :bob {\
                              :bob\
                                  rdf:type        foaf:Person ;\
                                  foaf:name       "Bob" ; \
                                  foaf:knows      :alice ;\
                                  foaf:mbox       <mailto:bob@home> ;\
                                  .\
                           }\
                         }'
        store.execute(query, function(success, results) {

            store.setPrefix("ex", "http://example.org/people/");
            store.graph(function(succes, graph){
                test.ok(graph.toArray().length === 0);

                store.node("ex:alice", "ex:alice", function(success, results) {

                    test.ok(results.toArray().length === 4);
                    test.done();
                });
            });
        });
        });
    });
};

exports.testDefaultPrefix = function(test) {
    new Store.Store(function(store) {
        var query = 'PREFIX foaf: <http://xmlns.com/foaf/0.1/>\
                     PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                     PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\
                     PREFIX : <http://example.org/people/>\
                     INSERT DATA {\
                       GRAPH :alice {\
                         :alice\
                             rdf:type        foaf:Person ;\
                             foaf:name       "Alice" ;\
                             foaf:mbox       <mailto:alice@work> ;\
                             foaf:knows      :bob ;\
                         .\
                       }\
                     }';
        store.execute(query, function(success, results) {

            var query = 'PREFIX foaf: <http://xmlns.com/foaf/0.1/>\
                         PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                         PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\
                         PREFIX : <http://example.org/people/>\
                         INSERT DATA {\
                           GRAPH :bob {\
                              :bob\
                                  rdf:type        foaf:Person ;\
                                  foaf:name       "Bob" ; \
                                  foaf:knows      :alice ;\
                                  foaf:mbox       <mailto:bob@home> ;\
                                  .\
                           }\
                         }'
        store.execute(query, function(success, results) {

            store.setDefaultPrefix("http://example.org/people/");
            store.graph(function(succes, graph){
                test.ok(graph.toArray().length === 0);

                store.node(":alice", ":alice", function(success, results) {

                    test.ok(results.toArray().length === 4);
                    test.done();
                });
            });
        });
        });
    });
};

exports.testInsert1 = function(test) {
    Store.create(function(store) {
        
        store.setPrefix("ex", "http://example.org/people/");

        var graph = store.rdf.createGraph();
        graph.add(store.rdf.createTriple( store.rdf.createNamedNode(store.rdf.resolve("ex:Alice")),
                                    store.rdf.createNamedNode(store.rdf.resolve("foaf:name")),
                                    store.rdf.createLiteral("alice") ));;

        graph.add(store.rdf.createTriple( store.rdf.createNamedNode(store.rdf.resolve("ex:Alice")),
                                          store.rdf.createNamedNode(store.rdf.resolve("foaf:knows")),
                                          store.rdf.createNamedNode(store.rdf.resolve("ex:Bob")) ));

        
        store.insert(graph, function(success, results){

            store.node("ex:Alice", function(success, graph) {
                test.ok(graph.toArray().length === 2);
                test.done();
            });
            
        });
    });
};

exports.testInsert2 = function(test) {
    Store.create(function(store) {
        
        store.setPrefix("ex", "http://example.org/people/");

        var graph = store.rdf.createGraph();
        graph.add(store.rdf.createTriple( store.rdf.createNamedNode(store.rdf.resolve("ex:Alice")),
                                    store.rdf.createNamedNode(store.rdf.resolve("foaf:name")),
                                    store.rdf.createLiteral("alice") ));;

        graph.add(store.rdf.createTriple( store.rdf.createNamedNode(store.rdf.resolve("ex:Alice")),
                                          store.rdf.createNamedNode(store.rdf.resolve("foaf:knows")),
                                          store.rdf.createNamedNode(store.rdf.resolve("ex:Bob")) ));

        
        store.insert(graph, "ex:alice", function(success, results){

            store.node("ex:Alice", "ex:alice", function(success, graph) {
                test.ok(graph.toArray().length === 2);
                test.done();
            });
            
        });
    });
};

exports.testDelete1 = function(test) {
    Store.create(function(store) {
        
        store.setPrefix("ex", "http://example.org/people/");

        var graph = store.rdf.createGraph();
        graph.add(store.rdf.createTriple( store.rdf.createNamedNode(store.rdf.resolve("ex:Alice")),
                                    store.rdf.createNamedNode(store.rdf.resolve("foaf:name")),
                                    store.rdf.createLiteral("alice") ));;

        graph.add(store.rdf.createTriple( store.rdf.createNamedNode(store.rdf.resolve("ex:Alice")),
                                          store.rdf.createNamedNode(store.rdf.resolve("foaf:knows")),
                                          store.rdf.createNamedNode(store.rdf.resolve("ex:Bob")) ));

        
        store.insert(graph, function(success, results){

            store.node("ex:Alice", function(success, graph) {
                test.ok(graph.toArray().length === 2);
                store.delete(graph, function(success, result) {
                    store.node("ex:Alice", function(success, graph){
                        test.ok(graph.toArray().length === 0);
                        test.done();
                    })
                });

            });
            
        });
    });
};

exports.testDelete2 = function(test) {
    Store.create(function(store) {
        
        store.setPrefix("ex", "http://example.org/people/");

        var graph = store.rdf.createGraph();
        graph.add(store.rdf.createTriple( store.rdf.createNamedNode(store.rdf.resolve("ex:Alice")),
                                    store.rdf.createNamedNode(store.rdf.resolve("foaf:name")),
                                    store.rdf.createLiteral("alice") ));;

        graph.add(store.rdf.createTriple( store.rdf.createNamedNode(store.rdf.resolve("ex:Alice")),
                                          store.rdf.createNamedNode(store.rdf.resolve("foaf:knows")),
                                          store.rdf.createNamedNode(store.rdf.resolve("ex:Bob")) ));

        
        store.insert(graph, "ex:alice", function(success, results){

            store.node("ex:Alice", "ex:alice", function(success, graph) {
                test.ok(graph.toArray().length === 2);
                store.delete(graph, "ex:alice", function(success, result) {
                    store.node("ex:Alice", function(success, graph){
                        test.ok(graph.toArray().length === 0);
                        test.done();
                    })
                });

            });
            
        });
    });
};

exports.testClear = function(test) {
    Store.create(function(store) {
        
        store.setPrefix("ex", "http://example.org/people/");

        var graph = store.rdf.createGraph();
        graph.add(store.rdf.createTriple( store.rdf.createNamedNode(store.rdf.resolve("ex:Alice")),
                                    store.rdf.createNamedNode(store.rdf.resolve("foaf:name")),
                                    store.rdf.createLiteral("alice") ));;

        graph.add(store.rdf.createTriple( store.rdf.createNamedNode(store.rdf.resolve("ex:Alice")),
                                          store.rdf.createNamedNode(store.rdf.resolve("foaf:knows")),
                                          store.rdf.createNamedNode(store.rdf.resolve("ex:Bob")) ));

        
        store.insert(graph, "ex:alice", function(success, results){

            store.node("ex:Alice", "ex:alice", function(success, graph) {
                test.ok(graph.toArray().length === 2);
                store.clear("ex:alice", function(success, result) {
                    store.node("ex:Alice", function(success, graph){
                        test.ok(graph.toArray().length === 0);
                        test.done();
                    })
                });

            });
            
        });
    });
};


exports.testLoad = function(test) {
    Store.create(function(store) {
        
        store.setPrefix("ex", "http://example.org/people/");

        var graph = store.rdf.createGraph();

        input = {
              "@context": 
              {  
                 "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
                 "xsd": "http://www.w3.org/2001/XMLSchema#",
                 "name": "http://xmlns.com/foaf/0.1/name",
                 "age": "http://xmlns.com/foaf/0.1/age",
                 "homepage": "http://xmlns.com/foaf/0.1/homepage",
                 "ex": "http://example.org/people/",
                 "@type":
                 {
                    "xsd:integer": "age",
                    "xsd:anyURI": "homepage",
                 }
              },
              "@": "ex:john_smith",
              "name": "John Smith",
              "age": "41",
              "homepage": "http://example.org/home/"
            };
        
        store.load("application/json", input, "ex:test", function(success, results){
              store.node("ex:john_smith", "ex:test", function(success, graph) {
                test.ok(graph.toArray().length === 3);
                test.done();
            });

        });
    });
};
