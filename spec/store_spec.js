var Store = require("../src/store");
var N3Parser = require("../src/rvn3_parser").RVN3Parser;

describe("Store", function () {

    it("Should pass integration test #1", function (done) {
        new Store.Store({name: 'test', overwrite: true}, function (err, store) {
            expect(err == null);
            store.execute('INSERT DATA {  <http://example/book3> <http://example.com/vocab#title> <http://test.com/example> }', function (err, result) {
                expect(err).toBe(null);
                store.execute('SELECT * { ?s ?p ?o }', function (err, results) {
                    expect(err).toBe(null);
                    expect(results.length).toBe(1);
                    expect(results[0].s.value).toBe("http://example/book3");
                    expect(results[0].p.value).toBe("http://example.com/vocab#title");
                    expect(results[0].o.value).toBe("http://test.com/example");
                    store.close(function () {
                        done();
                    });
                });
            });
        });
    });

    it("Should pass integration test #2", function (done) {
        new Store.Store({treeOrder: 50, name: 'test', overwrite: true}, function (err, store) {
            expect(err).toBe(null);
            store.execute('INSERT DATA {  <http://example/book3> <http://example.com/vocab#title> <http://test.com/example> }', function (err) {
                expect(err).toBe(null);
                store.execute('SELECT * { ?s ?p ?o }', function (err, results) {
                    expect(err).toBe(null);
                    expect(results.length).toBe(1);
                    expect(results[0].s.value).toBe("http://example/book3");
                    expect(results[0].p.value).toBe("http://example.com/vocab#title");
                    expect(results[0].o.value).toBe("http://test.com/example");

                    store.close(function () {
                        done();
                    });
                });
            });
        });
    });

    it("Should pass integration test graph #1", function (done) {
        new Store.Store({name: 'test', overwrite: true}, function (err, store) {
            expect(err).toBe(null);
            var query = 'PREFIX foaf: <http://xmlns.com/foaf/0.1/>\
                     PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                     PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\
                     PREFIX : <http://example.org/people/>\
                     INSERT DATA {\
                     :alice\
                         rdf:type        foaf:Person ;\
                         foaf:name       "Alice" ;\
                         foaf:mbox       <mailto:alice@work> ;\
                         foaf:knows      :bob \
                         .\
                     :bob\
                         rdf:type        foaf:Person ;\
                         foaf:name       "Bob" ; \
                         foaf:knows      :alice ;\
                         foaf:mbox       <mailto:bob@home> \
                         .\
                     }';
            store.execute(query, function (err) {
                expect(err).toBe(null);
                store.graph(function (err, graph) {
                    expect(err).toBe(null);
                    var results = graph.filter(store.rdf.filters.describes("http://example.org/people/alice"));

                    var resultsCount = results.toArray().length;

                    var resultsSubject = results.filter(store.rdf.filters.s("http://example.org/people/alice"))
                    var resultsObject = results.filter(store.rdf.filters.o("http://example.org/people/alice"))

                    expect(resultsObject.toArray().length).toBe(1);
                    expect((resultsObject.toArray().length + resultsSubject.toArray().length)).toBe(resultsCount);

                    store.close(function () {
                        done();
                    });
                });
            });
        });
    });

    it("Should pass integration test graph #2", function (done) {
        new Store.Store({name: 'test', overwrite: true}, function (err, store) {
            expect(err).toBe(null);
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
                             foaf:knows      :bob \
                         .\
                       }\
                     }';
            store.execute(query, function (err) {
                expect(err).toBe(null);
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
                                  foaf:mbox       <mailto:bob@home> \
                                  .\
                           }\
                         }'
                store.execute(query, function (err, results) {
                    expect(err).toBe(null);
                    store.graph(function (succes, graph) {
                        expect(graph.toArray().length).toBe(0);

                        store.graph("http://example.org/people/alice", function (succes, results) {

                            expect(results.toArray().length).toBe(4);
                            store.close(function () {
                                done();
                            });
                        });
                    });
                });
            });
        });
    });

    it("Should pass integration test subject #1", function (done) {
        new Store.Store({name: 'test', overwrite: true}, function (err, store) {
            expect(err).toBe(null);
            var query = 'PREFIX foaf: <http://xmlns.com/foaf/0.1/>\
                     PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                     PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\
                     PREFIX : <http://example.org/people/>\
                     INSERT DATA {\
                     :alice\
                         rdf:type        foaf:Person ;\
                         foaf:name       "Alice" ;\
                         foaf:mbox       <mailto:alice@work> ;\
                         foaf:knows      :bob \
                         .\
                     :bob\
                         rdf:type        foaf:Person ;\
                         foaf:name       "Bob" ; \
                         foaf:knows      :alice ;\
                         foaf:mbox       <mailto:bob@home> \
                         .\
                     }';
            store.execute(query, function (err, results) {
                expect(err).toBe(null);
                store.node("http://example.org/people/alice", function (err, graph) {
                    expect(err).toBe(null);
                    expect(graph.toArray().length).toBe(4);
                    store.close(function () {
                        done();
                    });
                });
            });
        });
    });

    it("Should pass integration test subject #2", function (done) {
        new Store.Store({name: 'test', overwrite: true}, function (err, store) {
            expect(err).toBe(null);
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
                             foaf:knows      :bob \
                         .\
                       }\
                     }';
            store.execute(query, function (err) {
                expect(err).toBe(null);
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
                                  foaf:mbox       <mailto:bob@home> \
                                  .\
                           }\
                         }'
                store.execute(query, function (err) {
                    expect(err).toBe(null);
                    store.graph(function (err, graph) {
                        expect(err).toBe(null);
                        expect(graph.toArray().length).toBe(0);

                        store.node("http://example.org/people/alice", "http://example.org/people/alice", function (err, results) {

                            expect(results.toArray().length).toBe(4);
                            store.close(function () {
                                done();
                            });
                        });
                    });
                });
            });
        });
    });

    it("Should pass integration test prefixes", function (done) {
        new Store.Store({name: 'test', overwrite: true}, function (err, store) {
            expect(err).toBe(null);
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
                             foaf:knows      :bob \
                         .\
                       }\
                     }';
            store.execute(query, function (err) {
                expect(err).toBe(null);
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
                                  foaf:mbox       <mailto:bob@home> \
                                  .\
                           }\
                         }';
                store.execute(query, function (err) {
                    expect(err).toBe(null);
                    store.setPrefix("ex", "http://example.org/people/");
                    store.graph(function (err, graph) {
                        expect(err).toBe(null);
                        expect(graph.toArray().length).toBe(0);

                        store.node("ex:alice", "ex:alice", function (err, results) {
                            expect(err).toBe(null);
                            expect(results.toArray().length).toBe(4);
                            store.close(function () {
                                done();
                            });
                        });
                    });
                });
            });
        });
    });

    it("Should pass integration test default prefixes", function (done) {
        new Store.Store({name: 'test', overwrite: true}, function (err, store) {
            expect(err).toBe(null);
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
                             foaf:knows      :bob \
                         .\
                       }\
                     }';
            store.execute(query, function (err) {
                expect(err).toBe(null);
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
                                  foaf:mbox       <mailto:bob@home> \
                                  .\
                           }\
                         }';
                store.execute(query, function (err, results) {
                    expect(err).toBe(null);
                    store.setDefaultPrefix("http://example.org/people/");
                    store.graph(function (err, graph) {
                        expect(err).toBe(null);
                        expect(graph.toArray().length).toBe(0);

                        store.node(":alice", ":alice", function (err, results) {
                            expect(err).toBe(null);
                            expect(results.toArray().length).toBe(4);
                            store.close(function () {
                                done();
                            });
                        });
                    });
                });
            });
        });
    });


    it("Should pass integration test Insert1", function (done) {
        Store.create({name: 'test', overwrite: true}, function (err, store) {

            store.setPrefix("ex", "http://example.org/people/");

            var graph = store.rdf.createGraph();
            graph.add(store.rdf.createTriple(store.rdf.createNamedNode(store.rdf.resolve("ex:Alice")),
                store.rdf.createNamedNode(store.rdf.resolve("foaf:name")),
                store.rdf.createLiteral("alice")));

            graph.add(store.rdf.createTriple(store.rdf.createNamedNode(store.rdf.resolve("ex:Alice")),
                store.rdf.createNamedNode(store.rdf.resolve("foaf:knows")),
                store.rdf.createNamedNode(store.rdf.resolve("ex:Bob"))));


            store.insert(graph, function (err, results) {

                store.node("ex:Alice", function (err, graph) {
                    expect(graph.toArray().length).toBe(2);
                    store.close(function () {
                        done();
                    });
                });

            });
        });
    });

    it("Should pass integration test Insert2", function (done) {
        Store.create({name: 'test', overwrite: true}, function (err, store) {

            store.setPrefix("ex", "http://example.org/people/");

            var graph = store.rdf.createGraph();
            graph.add(store.rdf.createTriple(store.rdf.createNamedNode(store.rdf.resolve("ex:Alice")),
                store.rdf.createNamedNode(store.rdf.resolve("foaf:name")),
                store.rdf.createLiteral("alice")));


            graph.add(store.rdf.createTriple(store.rdf.createNamedNode(store.rdf.resolve("ex:Alice")),
                store.rdf.createNamedNode(store.rdf.resolve("foaf:knows")),
                store.rdf.createNamedNode(store.rdf.resolve("ex:Bob"))));


            store.insert(graph, "ex:alice", function (err, results) {

                store.node("ex:Alice", "ex:alice", function (err, graph) {
                    expect(graph.toArray().length).toBe(2);
                    store.close(function () {
                        done();
                    });
                });

            });
        });
    });

    it("Should pass integration test Delete1", function (done) {
        Store.create({name: 'test', overwrite: true}, function (err, store) {

            store.setPrefix("ex", "http://example.org/people/");

            var graph = store.rdf.createGraph();
            graph.add(store.rdf.createTriple(store.rdf.createNamedNode(store.rdf.resolve("ex:Alice")),
                store.rdf.createNamedNode(store.rdf.resolve("foaf:name")),
                store.rdf.createLiteral("alice")));

            graph.add(store.rdf.createTriple(store.rdf.createNamedNode(store.rdf.resolve("ex:Alice")),
                store.rdf.createNamedNode(store.rdf.resolve("foaf:knows")),
                store.rdf.createNamedNode(store.rdf.resolve("ex:Bob"))));


            store.insert(graph, function (err, results) {

                store.node("ex:Alice", function (err, graph) {
                    expect(graph.toArray().length).toBe(2);
                    store.delete(graph, function (err, result) {
                        store.node("ex:Alice", function (err, graph) {
                            expect(graph.toArray().length).toBe(0);
                            store.close(function () {
                                done();
                            });
                        })
                    });

                });

            });
        });
    });

    it("Should pass integration test Delete2", function (done) {
        Store.create({name: 'test', overwrite: true}, function (err, store) {

            store.setPrefix("ex", "http://example.org/people/");

            var graph = store.rdf.createGraph();
            graph.add(store.rdf.createTriple(store.rdf.createNamedNode(store.rdf.resolve("ex:Alice")),
                store.rdf.createNamedNode(store.rdf.resolve("foaf:name")),
                store.rdf.createLiteral("alice")));

            graph.add(store.rdf.createTriple(store.rdf.createNamedNode(store.rdf.resolve("ex:Alice")),
                store.rdf.createNamedNode(store.rdf.resolve("foaf:knows")),
                store.rdf.createNamedNode(store.rdf.resolve("ex:Bob"))));


            store.insert(graph, "ex:alice", function (err, results) {
                store.node("ex:Alice", "ex:alice", function (err, graph) {
                    expect(graph.toArray().length).toBe(2);
                    store.delete(graph, "ex:alice", function (err, result) {
                        store.node("ex:Alice", function (err, graph) {
                            expect(graph.toArray().length).toBe(0);
                            store.close(function () {
                                done();
                            });
                        })
                    });

                });

            });
        });
    });

    it("Should pass integration test Clear", function (done) {
        Store.create({name: 'test', overwrite: true}, function (err, store) {

            store.setPrefix("ex", "http://example.org/people/");

            var graph = store.rdf.createGraph();
            graph.add(store.rdf.createTriple(store.rdf.createNamedNode(store.rdf.resolve("ex:Alice")),
                store.rdf.createNamedNode(store.rdf.resolve("foaf:name")),
                store.rdf.createLiteral("alice")));

            graph.add(store.rdf.createTriple(store.rdf.createNamedNode(store.rdf.resolve("ex:Alice")),
                store.rdf.createNamedNode(store.rdf.resolve("foaf:knows")),
                store.rdf.createNamedNode(store.rdf.resolve("ex:Bob"))));

            store.insert(graph, "ex:alice", function (err, results) {
                store.node("ex:Alice", "ex:alice", function (err, graph) {
                    expect(graph.toArray().length).toBe(2);
                    store.clear("ex:alice", function (err, result) {
                        store.node("ex:Alice", function (err, graph) {
                            expect(graph.toArray().length).toBe(0);
                            store.close(function () {
                                done();
                            });
                        });
                    });

                });

            });
        });
    });


    it("Should pass integration test Load1", function (done) {
        Store.create({name: 'test', overwrite: true}, function (err, store) {

            store.setPrefix("ex", "http://example.org/people/");

            var graph = store.rdf.createGraph();
            var input = {
                "@context": {
                    "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
                    "xsd": "http://www.w3.org/2001/XMLSchema#",
                    "name": "http://xmlns.com/foaf/0.1/name",
                    "age": {"@id": "http://xmlns.com/foaf/0.1/age", "@type": "xsd:integer"},
                    "homepage": {"@id": "http://xmlns.com/foaf/0.1/homepage", "@ype": "@id"},
                    "ex": "http://example.org/people/"
                },
                "@id": "ex:john_smith",
                "name": "John Smith",
                "age": "41",
                "homepage": "http://example.org/home/"
            };
            store.load("application/json", input, "ex:test", function (err, results) {
                store.node("ex:john_smith", "ex:test", function (err, graph) {
                    expect(graph.toArray().length).toBe(3);
                    store.close(function () {
                        done();
                    });
                });

            });
        });
    });

/*
    it("Should pass integration test Load2", function (done) {
        Store.create(function (err, store) {
            store.load('remote', 'http://dbpedia.org/resource/Tim_Berners-Lee', function (err, result) {
                store.execute("SELECT ?o WHERE { ?s <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> ?o }", function (err, results) {
                    expect(err);
                    expect(results.length > 0);
                    done();
                });
                //store.node('http://dbpedia.org/resource/Tim_Berners-Lee', function(err, graph){
                //    expect(err);
                //    var tmp = graph.toArray();
                //    var results = graph.filter(store.rdf.filters.type(store.rdf.resolve("foaf:Person")));
                //    expect(results.toArray().length).toBe(1);
                //    store.close(function(){ done() });
                //});
            });
        });
    });
*/
    it("Should pass integration test Load3", function (done) {
        Store.create({name: 'test', overwrite: true}, function (err, store) {

            store.setPrefix("ex", "http://example.org/examples/");

            var graph = store.rdf.createGraph();

            input = '_:a <http://test.com/p1> "test". _:a <http://test.com/p2> "test2". _:b <http://test.com/p1> "test" .';
            store.load("text/n3", input, "ex:test", function (err, results) {
                store.execute("select ?s { GRAPH <http://example.org/examples/test> { ?s ?p ?o } }", function (err, results) {
                    expect(err);

                    var blankIds = {};

                    for (var i = 0; i < results.length; i++) {
                        var blankId = results[i].s.value;
                        blankIds[blankId] = true;
                    }
                    var counter = 0;
                    for (var p in blankIds) {
                        counter++;
                    }

                    expect(counter).toBe(2);
                    store.close(function () {
                        done();
                    });
                });
            });
        });
    });


    it("Should pass integration test Load5", function (done) {
        Store.create({name: 'test', overwrite: true}, function (err, store) {

            store.setPrefix("ex", "http://example.org/examples/");

            var graph = store.rdf.createGraph();

            input = '_:a <http://test.com/p1> "test". _:a <http://test.com/p2> "test2". _:b <http://test.com/p1> "test" .';
            store.load("text/n3", input, {graph: "ex:test"}, function (err, results) {
                store.execute("select ?s { GRAPH <http://example.org/examples/test> { ?s ?p ?o } }", function (err, results) {
                    expect(err).toBe(null);

                    var blankIds = {};

                    for (var i = 0; i < results.length; i++) {
                        var blankId = results[i].s.value;
                        blankIds[blankId] = true;
                    }
                    var counter = 0;
                    for (var p in blankIds) {
                        counter++;
                    }

                    expect(counter).toBe(2);
                    store.close(function () {
                        done();
                    });
                });
            });
        });
    });

    it("Should pass integration test Load5b", function (done) {
        Store.create({name: 'test', overwrite: true}, function (err, store) {

            store.setPrefix("ex", "http://example.org/examples/");

            var graph = store.rdf.createGraph();

            input = '<#me> <http://test.com/p1> "test". <http://test.com/something#me> <http://test.com/p2> "test2". _:b <http://test.com/p1> "test" .';
            store.load("text/n3", input, {baseURI: "http://test.com/something"}, function (err, results) {
                store.execute("select ?s { ?s ?p ?o }", function (err, results) {
                    expect(err).toBe(null);
                    var blankIds = {};

                    for (var i = 0; i < results.length; i++) {
                        var blankId = results[i].s.value;
                        blankIds[blankId] = true;
                    }
                    var counter = 0;
                    for (var p in blankIds) {
                        counter++;
                    }

                    expect(counter).toBe(2);
                    store.close(function () {
                        done();
                    });
                });
            });
        });
    });

    it("Should pass integration test Load5c", function (done) {
        Store.create({name: 'test', overwrite: true}, function (err, store) {

            store.setPrefix("ex", "http://example.org/examples/");

            var graph = store.rdf.createGraph();

            input = '<#me> <http://test.com/p1> "test". <http://test.com/something#me> <http://test.com/p2> "test2". _:b <http://test.com/p1> "test" .';
            store.load("text/n3", input, {
                baseURI: "http://test.com/something",
                graph: "ex:test"
            }, function (err, results) {
                store.execute("select ?s { GRAPH <http://example.org/examples/test> { ?s ?p ?o }  }", function (err, results) {
                    expect(err).toBe(null);

                    var blankIds = {};

                    for (var i = 0; i < results.length; i++) {
                        var blankId = results[i].s.value;
                        blankIds[blankId] = true;
                    }
                    var counter = 0;
                    for (var p in blankIds) {
                        counter++;
                    }

                    expect(counter).toBe(2);
                    store.close(function () {
                        done();
                    });
                });
            });
        });
    });

    it("Should pass integration test EventsAPI1", function (done) {
        var counter = 0;
        new Store.Store({name: 'test', overwrite: true}, function (err, store) {
            store.execute('INSERT DATA {  <http://example/book> <http://example.com/vocab#title> <http://test.com/example> }', function (result, msg) {
                store.startObservingNode("http://example/book", function (graph) {
                    var observerFn = arguments.callee;
                    if (counter === 0) {
                        counter++;
                        expect(graph.toArray().length).toBe(1);
                        store.execute('INSERT DATA {  <http://example/book> <http://example.com/vocab#title2> <http://test.com/example2> }');
                    } else if (counter === 1) {
                        counter++;
                        expect(graph.toArray().length).toBe(2);
                        store.execute('DELETE DATA {  <http://example/book> <http://example.com/vocab#title2> <http://test.com/example2> }');
                    } else if (counter === 2) {
                        counter++;
                        expect(graph.toArray().length).toBe(1);
                        store.stopObservingNode(observerFn);
                        store.execute('INSERT DATA {  <http://example/book> <http://example.com/vocab#title2> <http://test.com/example3> }');
                        store.close(function () {
                            done();
                        });
                    } else if (counter === 3) {
                        expect(false).toBe(true);
                    }
                });
            });
        });
    });

    it("Should pass integration test EventsAPI2", function (done) {
        var counter = 0;
        new Store.Store({name: 'test', overwrite: true}, function (err, store) {
            store.execute('INSERT DATA { GRAPH <http://example/graph> { <http://example/book> <http://example.com/vocab#title> <http://test.com/example> } }', function (result, msg) {
                store.startObservingNode("http://example/book", "http://example/graph", function (graph) {
                    var observerFn = arguments.callee;
                    if (counter === 0) {
                        counter++;
                        expect(graph.toArray().length).toBe(1);
                        store.execute('INSERT DATA { GRAPH <http://example/graph> { <http://example/book> <http://example.com/vocab#title2> <http://test.com/example2> } }');
                    } else if (counter === 1) {
                        counter++;
                        expect(graph.toArray().length).toBe(2);
                        store.execute('DELETE DATA { GRAPH <http://example/graph> { <http://example/book> <http://example.com/vocab#title2> <http://test.com/example2> } }');
                    } else if (counter === 2) {
                        counter++;
                        expect(graph.toArray().length).toBe(1);
                        store.stopObservingNode(observerFn);
                        store.execute('INSERT DATA { GRAPH <http://example/graph> { <http://example/book> <http://example.com/vocab#title2> <http://test.com/example3> } }');
                        store.close(function () {
                            done();
                        });
                    } else if (counter === 3) {
                        expect(false).toBe(true);
                    }
                });
            });
        });
    });


    it("Should pass integration test EventsAPI3", function (done) {
        var counter = 0;
        new Store.Store({name: 'test', overwrite: true}, function (err, store) {
            store.subscribe("http://example/book", null, null, null, function (event, triples) {
                var observerFn = arguments.callee;
                if (counter === 0) {
                    counter++;
                    expect(event).toBe('added');
                    expect(triples.length).toBe(1);

                    expect(triples[0].subject.valueOf()).toBe('http://example/book');
                    expect(triples[0].object.valueOf()).toBe('http://test.com/example');
                } else if (counter === 1) {
                    counter++;
                    expect(event).toBe('added');
                    expect(triples.length).toBe(2);
                } else if (counter === 2) {
                    counter++;
                    expect(event).toBe('deleted');
                    expect(triples.length).toBe(1);
                    store.unsubscribe(observerFn);
                } else if (counter === 3) {
                    expect(false).toBe(true);
                }
            });

            store.execute('INSERT DATA {  <http://example/book> <http://example.com/vocab#title> <http://test.com/example> }', function () {
                store.execute('INSERT DATA {  <http://example/book> <http://example.com/vocab#title2> <http://test.com/example2>.\
                                          <http://example/book> <http://example.com/vocab#title3> <http://test.com/example3> }', function () {
                    store.execute('DELETE DATA {  <http://example/book> <http://example.com/vocab#title2> <http://test.com/example2> }', function () {
                        store.execute('INSERT DATA {  <http://example/book> <http://example.com/vocab#title2> <http://test.com/example3> }', function () {
                            store.close(function () {
                                done();
                            });
                        });
                    });
                });
            });
        });
    });

    it("Should pass integration test RegisteredGraph", function (done) {
        new Store.Store({name: 'test', overwrite: true}, function (err, store) {
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
                             foaf:knows      :bob \
                         .\
                       }\
                     }';
            store.execute(query, function (err, results) {

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
                                  foaf:mbox       <mailto:bob@home> \
                                  .\
                           }\
                         }'
                store.execute(query, function (err, results) {

                    store.registeredGraphs(function (results, graphs) {
                        expect(graphs.length).toBe(2);
                        var values = [];
                        for (var i = 0; i < graphs.length; i++) {
                            values.push(graphs[i].valueOf());
                        }
                        values.sort();
                        expect(values[0]).toBe('http://example.org/people/alice');
                        expect(values[1]).toBe('http://example.org/people/bob');
                        store.close(function () {
                            done();
                        });
                    });
                });
            });
        });
    });

//it("Should pass integration test Export1", function(done) {
//    Store.create(function(err,store) {
//        store.load('remote', 'http://dbpedia.org/resource/Tim_Berners-Lee', 'http://test.com/graph-to-export', function(err, result) {
//            var graph = store.graph('http://test.com/graph-to-export', function(err, graph){
//                var n3 = "";
//
//                graph.forEach(function(triple) {
//                    n3 = n3 + triple.toString();
//                });
//
//                N3Parser.parser.parse(n3, function(err, result) {
//                    expect(err);
//                    expect(result.length > 0);
//
//                    // an easier way
//                    expect(graph.toNT() == n3);
//
//                    store.close(function(){ done(); });
//                });
//            });
//        });
//    });
//};


    it("Should pass integration test DefaultPrefixes", function (done) {
        new Store.Store({name: 'test', overwrite: true}, function (err, store) {
            store.execute('INSERT DATA {  <http://example/person1> <http://xmlns.com/foaf/0.1/name> "Celia" }', function (result, msg) {
                store.execute('SELECT * { ?s foaf:name ?name }', function (err, results) {
                    expect(err).toBe(null);
                    expect(results.length).toBe(0);

                    store.registerDefaultProfileNamespaces();

                    store.execute('SELECT * { ?s foaf:name ?name }', function (err, results) {
                        expect(err).toBe(null);
                        expect(results.length).toBe(1);
                        expect(results[0].name.value).toBe("Celia");
                        store.close(function () {
                            done();
                        });
                    });
                });
            });
        });
    });

    it("Should pass integration test DuplicatedInsert", function (done) {
        new Store.Store({name: 'test', overwrite: true}, function (err, store) {
            store.execute('INSERT DATA {  <http://example/book3> <http://example.com/vocab#title> <http://test.com/example> }', function (result, msg) {
                store.execute('INSERT DATA {  <http://example/book3> <http://example.com/vocab#title> <http://test.com/example> }', function (result, msg) {
                    store.execute('SELECT * { ?s ?p ?o }', function (err, results) {
                        expect(err).toBe(null);
                        expect(results.length).toBe(1);
                        expect(results[0].s.value).toBe("http://example/book3");
                        expect(results[0].p.value).toBe("http://example.com/vocab#title");
                        expect(results[0].o.value).toBe("http://test.com/example");

                        store.close(function () {
                            done();
                        });
                    });
                });
            });
        });
    });


    it("Should pass integration test DuplicatedParsing", function (done) {
        new Store.Store({name: 'test', overwrite: true}, function (err, store) {
            var data = {'@id': 'http://test.com/me', 'http://somproperty.org/prop': 'data'};
            store.load('application/json', data, function (result, msg) {
                store.load('application/json', data, function (result, msg) {
                    store.execute('SELECT * { ?s ?p ?o }', function (err, results) {
                        expect(err).toBe(null);
                        expect(results.length).toBe(1);
                        expect(results[0].s.value).toBe('http://test.com/me');
                        store.close(function () {
                            done();
                        });
                    });
                });
            });
        });
    });

    it("Should pass integration test ConstructBlankNodes", function (done) {
        new Store.Store({name: 'test', overwrite: true}, function (err, store) {
            var uriGraph = 'http://www.example.com/data.ttl';
            var triplesTTL = "@prefix foaf: <http://xmlns.com/foaf/0.1/> . <http://www.example.com/resource/12645> a foaf:Person . ";

            store.load('text/turtle', triplesTTL, uriGraph, function (err, results) {

                var query = "PREFIX foaf: <http://xmlns.com/foaf/0.1/>\
                         PREFIX test: <http://vocab.netlabs.org/test#>\
                         CONSTRUCT {\
                            ?s test:item [\
                              a test:Item;\
                              test:prop1 \"Value of property 1\";\
                              test:prop2 \"Value of property 2\"\
                            ] .\
                         }\
                         FROM <" + uriGraph + ">\
                         WHERE {\
                           ?s a foaf:Person .\
                         }";

                store.execute(query, function (err, graph) {
                    expect(err);
                    var numBlankSubjects = 0;
                    var distinctBlankSubjects = {};
                    var foundUris = false;
                    var triples = graph.toArray();
                    var triple;
                    expect(triples.length).toBe(4);
                    for (var i = 0; i < triples.length; i++) {
                        triple = triples[i];
                        if (triple.subject.interfaceName === 'BlankNode') {
                            numBlankSubjects++;
                            distinctBlankSubjects[triple.subject.bnodeId] = true;
                        } else {
                            expect(triple.subject.valueOf()).toBe('http://www.example.com/resource/12645');
                            expect(triple.object.interfaceName).toBe('BlankNode');
                            distinctBlankSubjects[triple.object.bnodeId] = true;
                        }
                    }

                    var numDistinctBlankSujects = 0;
                    for (var p in distinctBlankSubjects) {
                        numDistinctBlankSujects++;
                    }

                    expect(numDistinctBlankSujects).toBe(1);
                    store.close(function () {
                        done();
                    });
                });
            });
        });
    });

    it("Should pass integration test RedundantVars1", function (done) {
        new Store.Store({name: 'test', overwrite: true}, function (err, store) {
            store.load(
                'text/n3',
                '<http://A> <http://B> <http://C>.',
                function (err) {
                    store.execute(
                        'SELECT *  WHERE { ?x ?p ?x }',
                        function (err, results) {
                            expect(results.length).toBe(0);
                            done();
                        }
                    );
                });
        });

    });

    it("Should pass integration test RedundantVars2", function (done) {
        new Store.Store({name: 'test', overwrite: true}, function (err, store) {
            store.load(
                'text/n3',
                '<http://C> <http://B> <http://C>.\
                 <http://D> <http://E> <http://F>.',
                function (err) {
                    store.execute(
                        'SELECT *  WHERE { ?x ?p ?x }',
                        function (err, results) {
                            expect(results.length).toBe(1);
                            done();
                        }
                    );
                });
        });

    });

    it("Should pass integration test RedundantVars3", function (done) {
        new Store.Store({name: 'test', overwrite: true}, function (err, store) {
            store.load(
                'text/n3',
                '<http://A> <http://B> <http://C>.',
                function (err) {
                    store.execute(
                        'CONSTRUCT { ?x ?p ?x }  WHERE { ?x ?p ?x }',
                        function (err, results) {
                            var counter = 0;
                            results.triples.forEach(function (result) {
                                counter++;
                            });

                            expect(counter).toBe(0);
                            done();
                        }
                    );
                });
        });

    });

    it("Should pass integration test RedundantVars4", function (done) {
        new Store.Store({name: 'test', overwrite: true}, function (err, store) {
            store.load(
                'text/n3',
                '<http://C> <http://B> <http://C>.\
                 <http://D> <http://E> <http://F>.',
                function (err) {
                    store.execute(
                        'CONSTRUCT { ?x ?p ?x }  WHERE { ?x ?p ?x }',
                        function (err, results) {
                            var counter = 0;
                            results.triples.forEach(function (result) {
                                counter++;
                            });

                            expect(counter).toBe(1);
                            done();
                        }
                    );
                });
        });

    });

    it("Should pass integration test ShouldLoadJSONLDWithAllMediaTypes", function (done) {
        var input = {
            "@type": "foaf:Person",
            "foaf:name": "Manu Sporny",
            "foaf:homepage": "http://manu.sporny.org/",
            "sioc:avatar": "http://twitter.com/account/profile_image/manusporny",
            '@context': {
                'sioc:avatar': {'@type': '@id'},
                'foaf:homepage': {'@type': '@id'}
            }
        };

        var jsonmedia = 0, jsonldmedia = 0;
        new Store.Store({name: 'test', overwrite: true}, function (err, store) {
            store.load(
                'application/ld+json',
                input,
                function (err) {
                    store.execute(
                        'SELECT * { ?s ?p ?o }',
                        function (err, results) {
                            jsonmedia = results.length;
                            expect(jsonmedia > 0);

                            new Store.Store({name: 'test', overwrite: true}, function (err, store) {
                                store.load(
                                    'application/json',
                                    input,
                                    function (err) {
                                        store.execute(
                                            'SELECT * { ?s ?p ?o }',
                                            function (err, results) {
                                                jsonldmedia = results.length;
                                                expect(jsonldmedia > 0);

                                                expect(jsonldmedia).toBe(jsonmedia);
                                                done();
                                            });
                                    });
                            });
                        }
                    );
                });
        });

    });

    it("Should pass integration test RegisterCustomFunction", function (done) {
        new Store.Store({name: 'test', overwrite: true}, function (err, store) {
            store.load(
                'text/n3',
                '@prefix test: <http://test.com/> .\
                 test:A test:prop 5.\
                 test:B test:prop 4.\
                 test:C test:prop 1.\
                 test:D test:prop 3.',
                function (err) {

                    var invoked = false;
                    store.registerCustomFunction('my_addition', function (engine, args) {
                        var v1 = engine.effectiveTypeValue(args[0]);
                        var v2 = engine.effectiveTypeValue(args[1]);
                        return engine.ebvBoolean(v1 + v2 < 5);
                    });
                    store.execute(
                        'PREFIX test: <http://test.com/> SELECT * { ?x test:prop ?v1 . ?y test:prop ?v2 . filter(custom:my_addition(?v1,?v2)) }',
                        function (err, results) {
                            expect(results.length).toBe(3);
                            for (var i = 0; i < results.length; i++) {
                                expect(parseInt(results[i].v1.value) + parseInt(results[i].v2.value) < 5);
                            }
                            done();
                        }
                    );

                });
        });

    });

    it("Should pass integration test RegisterCustomFunction with a URI for the function", function (done) {
        new Store.Store({name: 'test', overwrite: true}, function (err, store) {
            store.load(
                'text/n3',
                '@prefix test: <http://test.com/> .\
                 test:A test:prop 5.\
                 test:B test:prop 4.\
                 test:C test:prop 1.\
                 test:D test:prop 3.',
                function (err) {

                    var invoked = false;
                    store.registerCustomFunction('http://test.com/my_addition', function (engine, args) {
                        var v1 = engine.effectiveTypeValue(args[0]);
                        var v2 = engine.effectiveTypeValue(args[1]);
                        return engine.ebvBoolean(v1 + v2 < 5);
                    });
                    store.execute(
                        'PREFIX test: <http://test.com/> SELECT * { ?x test:prop ?v1 . ?y test:prop ?v2 . filter(<http://test.com/my_addition>(?v1,?v2)) }',
                        function (err, results) {
                            expect(results.length).toBe(3);
                            for (var i = 0; i < results.length; i++) {
                                expect(parseInt(results[i].v1.value) + parseInt(results[i].v2.value) < 5);
                            }
                            done();
                        }
                    );

                });
        });

    });

    it("Should pass integration test RegisterCustomFunction with a CURIE for the function", function (done) {
        new Store.Store({name: 'test', overwrite: true}, function (err, store) {
            store.load(
                'text/n3',
                '@prefix test: <http://test.com/> .\
                 test:A test:prop 5.\
                 test:B test:prop 4.\
                 test:C test:prop 1.\
                 test:D test:prop 3.',
                function (err) {

                    var invoked = false;
                    store.registerCustomFunction('http://test.com/my_addition2', function (engine, args) {
                        var v1 = engine.effectiveTypeValue(args[0]);
                        var v2 = engine.effectiveTypeValue(args[1]);
                        return engine.ebvBoolean(v1 + v2 < 5);
                    });
                    store.execute(
                        'PREFIX test: <http://test.com/> SELECT * { ?x test:prop ?v1 . ?y test:prop ?v2 . filter(test:my_addition2(?v1,?v2)) }',
                        function (err, results) {
                            expect(results.length).toBe(3);
                            for (var i = 0; i < results.length; i++) {
                                expect(parseInt(results[i].v1.value) + parseInt(results[i].v2.value) < 5);
                            }
                            done();
                        }
                    );

                });
        });

    });

    it("Should be able to use GRAPH variables", function (done) {
        new Store.Store({name: 'test', overwrite: true}, function (err, store) {
            store.load(
                'text/n3',
                '@prefix dc: <http://purl.org/dc/elements/1.1/> .\
                 <http://example.org/bob>    dc:publisher  "Bob Hacker" .\
                <http://example.org/alice>  dc:publisher  "Alice Hacker" .',
                function (err) {

                    store.load(
                        'text/n3',
                        '@prefix foaf: <http://xmlns.com/foaf/0.1/> .\
                            _:a foaf:name "Bob" .\
                        _:a foaf:mbox <mailto:bob@oldcorp.example.org> .',
                        'http://example.org/bob',
                        function (err) {


                            store.load(
                                'text/n3',
                                '@prefix foaf: <http://xmlns.com/foaf/0.1/> .\
                                _:a foaf:name "Alice" .\
                                _:a foaf:mbox <mailto:alice@work.example.org> .',
                                'http://example.org/alice',
                                function (err) {

                                    store.execute(
                                        'PREFIX foaf: <http://xmlns.com/foaf/0.1/>\
                                            PREFIX dc: <http://purl.org/dc/elements/1.1/>\
                                            SELECT ?who ?g ?mbox\
                                        FROM <http://example.org/dft.ttl>\
                                            FROM NAMED <http://example.org/alice>\
                                            FROM NAMED <http://example.org/bob>\
                                            WHERE\
                                        {\
                                            ?g dc:publisher ?who .\
                                            GRAPH ?g { ?x foaf:mbox ?mbox }\
                                    }',
                                        ["https://github.com/antoniogarrote/rdfstore-js#default_graph"],
                                        ["http://example.org/alice","http://example.org/bob"],
                                        function (err, results) {
                                            expect(results.length).toBe(2);
                                            expect(results[0].who.value).toBe('Alice Hacker');
                                            expect(results[0].g.value).toBe('http://example.org/alice');
                                            expect(results[0].mbox.value).toBe('mailto:alice@work.example.org');

                                            expect(results[1].who.value).toBe('Bob Hacker');
                                            expect(results[1].g.value).toBe('http://example.org/bob');
                                            expect(results[1].mbox.value).toBe('mailto:bob@oldcorp.example.org');

                                            done();
                                        });
                                });
                        });
                });
        });
    });

    it("Should process EXISTS/NOT EXISTS filters", function(done){
        var query="SELECT ?s WHERE { \
                     FILTER NOT EXISTS {\
                       ?s <c> ?c\
                     }\
                     { ?s <b> ?a }\
                     UNION\
                     {\
                      ?s <d> ?a\
                     }\
                   }";

        new Store.Store({name: 'test', overwrite: true}, function (err, store) {
            expect(err).toBe(null);
            store.execute('INSERT DATA {  <a> <b> <b1> . \
                                          <a> <c> <c1> . \
                                          <a2> <b> <b2> . \
                                          <a3> <d> <d1> . \
                                          <a4> <d> <d3> . \
                                          <a4> <b> <b> . \
                                          <a4> <c> <c1> }', function(){
                store.execute(query, function(err, results) {
                    expect(err).toBe(null);
                    expect(results.length).toBe(2);
                    var vars = {};
                    for(var i=0; i<results.length; i++) {
                        vars[results[i]['s'].value] = true;
                    }
                    expect(vars['a2']).toBe(true);
                    expect(vars['a3']).toBe(true);
                    done();
                });
            });
        });
    });

    it("Should process regex filters", function(done){
        var query="SELECT ?s { \
                     ?s ?p ?o .\
                     FILTER regex(?o, \"test\")\
                   }";

        new Store.Store({name: 'test', overwrite: true}, function (err, store) {
            expect(err).toBe(null);
            store.execute('INSERT DATA {  <a1> <b> "atestofsomething" . \
                                          <a11> <c> "test" . \
                                          <a2> <b> "other" . \
                                          <a3> <d> "someother" . \
                                          <a4> <d> 1 . \
                                          <a4> <b> 2 . \
                                          <a4> <c> 3 }', function(){
                store.execute(query, function(err, results) {
                    expect(err).toBe(null);
                    expect(results.length).toBe(2);
                    var vars = {};
                    for(var i=0; i<results.length; i++) {
                        vars[results[i]['s'].value] = true;
                    }
                    expect(vars['a1']).toBe(true);
                    expect(vars['a11']).toBe(true);
                    done();
                });
            });
        });
    });

    it("Should process numeric filters", function(done){
        var query="PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                   SELECT ?s { \
                     ?s ?p ?o .\
                     FILTER (xsd:double(?o) > \"10.0\"^^<http://www.w3.org/2001/XMLSchema#double>)\
                   }";

        new Store.Store({name: 'test', overwrite: true}, function (err, store) {
            expect(err).toBe(null);
            store.execute('INSERT DATA {  <a1> <b> 16.0 . \
                                          <a2> <b> 3.0 . \
                                          <a3> <d> "11.4"^^<http://www.w3.org/2001/XMLSchema#double> . \
                                          <a4> <d> "0.3"^^<http://www.w3.org/2001/XMLSchema#double> . \
                                          <a5> <c> 13 .\
                                          <a6> <c> "3"^^<http://www.w3.org/2001/XMLSchema#integer> }', function(){
                store.execute(query, function(err, results) {
                    expect(err).toBe(null);
                    expect(results.length).toBe(3);
                    var vars = {};
                    for(var i=0; i<results.length; i++) {
                        vars[results[i]['s'].value] = true;
                    }
                    expect(vars['a1']).toBe(true);
                    expect(vars['a3']).toBe(true);
                    expect(vars['a5']).toBe(true);
                    done();
                });
            });
        });
    });

    it("Should process filters on variables and URIs", function(done){
        new Store.Store({name: 'test', overwrite: true}, function(err,store){
            var rdf = '@prefix test: <http://test.com/> .\
                       test:A test:prop 5.\
                       test:B test:prop 4.\
                       test:A test:prop 1.\
                       test:D test:prop 3.';

            store.load('text/turtle', rdf, function(s,d){

                var query = `SELECT ?s ?p ?o WHERE {
                    ?s ?p ?o.
             FILTER (?s=<http://test.com/A>)
             } `;

                store.execute(query, function(success, results){
                    expect(results.length).toBe(2);
                    done();
                });
            });
        });

    });

    it("Should process functions in BIND expressions", function(done){
        new Store.Store({name: 'test', overwrite: false}, function (err, store) {
            store.load(
                'text/n3',
                '@prefix test: <http://test.com/> .\
                 test:A test:prop 5.\
                 test:B test:prop 4.\
                 test:C test:prop 1.\
                 test:D test:prop 3.',
                function (err) {

                    var invoked = false;
                    store.registerCustomFunction('http://test.com/my_default_value', function (engine, args) {
                        var v1 = engine.effectiveTypeValue(args[0]);
                        return {"token":"literal", "value":"test_value", "type":"http://www.w3.org/2001/XMLSchema#string"};
                    });
                    store.execute(
                        'PREFIX test: <http://test.com/> SELECT * { OPTIONAL { ?x test:prop ?v1 . BIND(test:my_default_value(?v1) AS ?default_value) } }',
                        function (err, results) {
                            expect(results.length).toBe(4);
                            for (var i = 0; i < results.length; i++) {
                                expect(results[i].default_value.value).toBe("test_value");
                            }
                            done();
                        }
                    );

                });
        });
    });

});

/*
 it("Should pass integration test Load5", function(done) {
 Store.create({name:'test', overwrite:true},function(err,store) {

 store.setPrefix("ex", "http://example.org/people/");

 var graph = store.rdf.createGraph();
 var input = '<?xml version="1.0" encoding="UTF-8"?>\n\
 <rdf:RDF\n\
 xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">\n\
 <rdf:Description rdf:about="http://purl.bioontology.org/ontology/RXNORM/309054">\n\
 <rdf:type rdf:resource="http://smartplatforms.org/terms#Code"/>\n\
 <rdf:type rdf:resource="http://smartplatforms.org/terms/codes/RxNorm_Semantic"/>\n\
 <title xmlns="http://purl.org/dc/terms/">Cefdinir 25 MG/ML Oral Suspension</title>\n\
 </rdf:Description>\n\
 </rdf:RDF>';

 store.load("application/rdf+xml", input, function(err, results){
 console.log("RESULTS...")
 console.log(results);

 store.execute("SELECT * { ?s  ?p  ?o }", function(err, results){
 console.log(results);
 done();
 });

 //  store.node("http://purl.bioontology.org/ontology/RXNORM/309054",  function(err, graph) {
 //      console.log(graph);
 //      console.log(graph.toArray());
 //      expect(graph.toArray().length).toBe(3);
 //      done();
 //  });

 });
 });
 });

 */
