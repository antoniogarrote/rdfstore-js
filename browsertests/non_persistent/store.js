this.suite_store = {};

this.suite_store.testIntegration1 = function(test){
    new rdfstore.Store({name:'test', overwrite:true}, function(store){
        store.execute('INSERT DATA {  <http://example/book3> <http://example.com/vocab#title> <http://test.com/example> }', function(result, msg){
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

this.suite_store.testIntegration2 = function(test){
    new rdfstore.Store({treeOrder: 50, name:'test', overwrite:true}, function(store){
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


this.suite_store.testGraph1 = function(test) {
    new rdfstore.Store({name:'test', overwrite:true}, function(store) {
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

this.suite_store.testGraph2 = function(test) {
    new rdfstore.Store({name:'test', overwrite:true}, function(store) {
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

this.suite_store.testSubject1 = function(test) {
    new rdfstore.Store({name:'test', overwrite:true}, function(store) {
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

this.suite_store.testSubject2 = function(test) {
    new rdfstore.Store({name:'test', overwrite:true}, function(store) {
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

this.suite_store.testPrefixes = function(test) {
    new rdfstore.Store({name:'test', overwrite:true}, function(store) {
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

this.suite_store.testDefaultPrefix = function(test) {
    new rdfstore.Store({name:'test', overwrite:true}, function(store) {
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

this.suite_store.testInsert1 = function(test) {
    rdfstore.create({name:'test', overwrite:true}, function(store) {
        
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

this.suite_store.testInsert2 = function(test) {
    rdfstore.create({name:'test', overwrite:true}, function(store) {
        
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

this.suite_store.testDelete1 = function(test) {
    rdfstore.create({name:'test', overwrite:true}, function(store) {
        
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
                store['delete'](graph, function(success, result) {
                    store.node("ex:Alice", function(success, graph){
                        test.ok(graph.toArray().length === 0);
                        test.done();
                    })
                });

            });
            
        });
    });
};

this.suite_store.testDelete2 = function(test) {
    rdfstore.create({name:'test', overwrite:true}, function(store) {
        
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
                store['delete'](graph, "ex:alice", function(success, result) {
                    store.node("ex:Alice", function(success, graph){
                        test.ok(graph.toArray().length === 0);
                        test.done();
                    })
                });

            });
            
        });
    });
};

this.suite_store.testClear = function(test) {
    rdfstore.create({name:'test', overwrite:true}, function(store) {
        
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


this.suite_store.testLoad1 = function(test) {
    rdfstore.create({name:'test', overwrite:true}, function(store) {
        
        store.setPrefix("ex", "http://example.org/people/");

        var graph = store.rdf.createGraph();

        input = {
              "@context": 
              {  
                 "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
                 "xsd": "http://www.w3.org/2001/XMLSchema#",
                 "name": "http://xmlns.com/foaf/0.1/name",
                 "ex": "http://example.org/people/",
                 "age": {'@id': "http://xmlns.com/foaf/0.1/age", '@type':"xsd:integer"},
                 "homepage": {'@id':"http://xmlns.com/foaf/0.1/homepage", '@type':"xsd:anyURI"}
              },
              "@id": "ex:john_smith",
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

this.suite_store.testLoad3 = function(test) {
    rdfstore.create({name:'test', overwrite:true}, function(store) {
        
        store.setPrefix("ex", "http://example.org/examples/");

        var graph = store.rdf.createGraph();

        input = '_:a <http://test.com/p1> "test". _:a <http://test.com/p2> "test2". _:b <http://test.com/p1> "test" .';
        store.load("text/n3", input, "ex:test", function(success, results){
            store.execute("select ?s { GRAPH <http://example.org/examples/test> { ?s ?p ?o } }", function(success, results) {
                test.ok(success);

                var blankIds = {};

                for(var i=0; i<results.length; i++) {
                     var blankId = results[i].s.value;
                    blankIds[blankId] = true;
                }
                var counter = 0;
                for(var p in blankIds) {
                    counter++;
                }

                test.ok(counter === 2);
                test.done();
            });
        });
    });
};

this.suite_store.testLoadRDFXML = function(test) {
    rdfstore.create({name:'test', overwrite:true}, function(store) {
        
		var input = '<?xml version="1.0" encoding="UTF-8"?>\n\
<rdf:RDF\n\
	xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">\n\
<rdf:Description rdf:about="http://purl.bioontology.org/ontology/RXNORM/309054">\n\
	<rdf:type rdf:resource="http://smartplatforms.org/terms#Code"/>\n\
	<rdf:type rdf:resource="http://smartplatforms.org/terms/codes/RxNorm_Semantic"/>\n\
	<title xmlns="http://purl.org/dc/terms/">Cefdinir 25 MG/ML Oral Suspension</title>\n\
</rdf:Description>\n\
</rdf:RDF>';

        store.load("application/rdf+xml", input, function(success, results){
              store.node("http://purl.bioontology.org/ontology/RXNORM/309054",  function(success, graph) {
                test.ok(graph.toArray().length === 3);
                test.done();
            });

        });
    });
};

this.suite_store.testEventsAPI1 = function(test){
    var counter = 0;
    new rdfstore.Store({name:'test', overwrite:true}, function(store){
        store.execute('INSERT DATA {  <http://example/book> <http://example.com/vocab#title> <http://test.com/example> }', function(result, msg){
            store.startObservingNode("http://example/book",function(graph){
                var observerFn = arguments.callee;
                if(counter === 0) {
                    counter++;
                    test.ok(graph.toArray().length === 1);
                    store.execute('INSERT DATA {  <http://example/book> <http://example.com/vocab#title2> <http://test.com/example2> }');
                } else if(counter === 1) {
                    counter++;
                    test.ok(graph.toArray().length === 2);
                    store.execute('DELETE DATA {  <http://example/book> <http://example.com/vocab#title2> <http://test.com/example2> }');
                } else if(counter === 2) {
                    counter++;
                    test.ok(graph.toArray().length === 1);
                    store.stopObservingNode(observerFn);
                    store.execute('INSERT DATA {  <http://example/book> <http://example.com/vocab#title2> <http://test.com/example3> }');                    
                    test.done();
                } else if(counter === 3) {
                    test.ok(false);
                }
            });
        });
    });
};

this.suite_store.testEventsAPI2 = function(test){
    var counter = 0;
    new rdfstore.Store({name:'test', overwrite:true}, function(store){
        store.execute('INSERT DATA { GRAPH <http://example/graph> { <http://example/book> <http://example.com/vocab#title> <http://test.com/example> } }', function(result, msg){
            store.startObservingNode("http://example/book", "http://example/graph", function(graph){
                var observerFn = arguments.callee;
                if(counter === 0) {
                    counter++;
                    test.ok(graph.toArray().length === 1);
                    store.execute('INSERT DATA { GRAPH <http://example/graph> { <http://example/book> <http://example.com/vocab#title2> <http://test.com/example2> } }');
                } else if(counter === 1) {
                    counter++;
                    test.ok(graph.toArray().length === 2);
                    store.execute('DELETE DATA { GRAPH <http://example/graph> { <http://example/book> <http://example.com/vocab#title2> <http://test.com/example2> } }');
                } else if(counter === 2) {
                    counter++;
                    test.ok(graph.toArray().length === 1);
                    store.stopObservingNode(observerFn);
                    store.execute('INSERT DATA { GRAPH <http://example/graph> { <http://example/book> <http://example.com/vocab#title2> <http://test.com/example3> } }');                    
                    test.done();
                } else if(counter === 3) {
                    test.ok(false);
                }
            });
        });
    });
};


this.suite_store.testEventsAPI3 = function(test){
    var counter = 0;
    new rdfstore.Store({name:'test', overwrite:true}, function(store){
        store.subscribe("http://example/book",null,null,null,function(event, triples){
            var observerFn = arguments.callee;
            if(counter === 0) {
                counter++;
                test.ok(event === 'added');
                test.ok(triples.length === 1);

                test.ok(triples[0].subject.valueOf() === 'http://example/book');
                test.ok(triples[0].object.valueOf() === 'http://test.com/example');
            } else if(counter === 1) {
                counter++;
                test.ok(event === 'added');
                test.ok(triples.length === 2);
            } else if(counter === 2) {
                counter++;
                test.ok(event === 'deleted');
                test.ok(triples.length === 1);
                store.unsubscribe(observerFn);
            } else if(counter === 3) {
                test.ok(false);
            }
        });
        
        store.execute('INSERT DATA {  <http://example/book> <http://example.com/vocab#title> <http://test.com/example> }', function(){
            store.execute('INSERT DATA {  <http://example/book> <http://example.com/vocab#title2> <http://test.com/example2>.\
                                          <http://example/book> <http://example.com/vocab#title3> <http://test.com/example3> }', function(){
                store.execute('DELETE DATA {  <http://example/book> <http://example.com/vocab#title2> <http://test.com/example2> }',function(){
                    store.execute('INSERT DATA {  <http://example/book> <http://example.com/vocab#title2> <http://test.com/example3> }', function(){
                        test.done();
                    });                    
                });
            });
        });
    });
}

this.suite_store.testRegisteredGraph = function(test) {
    new rdfstore.Store({name:'test', overwrite:true}, function(store) {
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

            store.registeredGraphs(function(results,graphs) {
                test.ok(graphs.length === 2);
                var values = [];
                for(var i=0; i<graphs.length; i++) {
                    values.push(graphs[i].valueOf());
                }
                values.sort();
                test.ok(values[0] === 'http://example.org/people/alice');
                test.ok(values[1] === 'http://example.org/people/bob');
                test.done();
            });
        });
        });
    });
};



this.suite_store.testDefaultPrefixes = function(test){
    new rdfstore.Store({name:'test', overwrite:true}, function(store){
        store.execute('INSERT DATA {  <http://example/person1> <http://xmlns.com/foaf/0.1/name> "Celia" }', function(result, msg){
            store.execute('SELECT * { ?s foaf:name ?name }', function(success,results) {
                test.ok(success === true);
                test.ok(results.length === 0);

                store.registerDefaultProfileNamespaces();

                store.execute('SELECT * { ?s foaf:name ?name }', function(success,results) {
                    test.ok(success === true);
                    test.ok(results.length === 1);
                    test.ok(results[0].name.value === "Celia");
                    store.close(function(){ test.done() });
                });
            });
        });
    });
};

this.suite_store.testDuplicatedInsert = function(test) {
    new rdfstore.Store({name:'test', overwrite:true}, function(store){
        store.execute('INSERT DATA {  <http://example/book3> <http://example.com/vocab#title> <http://test.com/example> }', function(result, msg){
            store.execute('INSERT DATA {  <http://example/book3> <http://example.com/vocab#title> <http://test.com/example> }', function(result, msg){
                store.execute('SELECT * { ?s ?p ?o }', function(success,results) {
                    test.ok(success === true);
                    test.ok(results.length === 1);
                    test.ok(results[0].s.value === "http://example/book3");
                    test.ok(results[0].p.value === "http://example.com/vocab#title");
                    test.ok(results[0].o.value === "http://test.com/example");
                    
                    store.close(function(){ test.done() });
                });
            });
        });
    });
};


this.suite_store.testDuplicatedParsing = function(test) {
    new rdfstore.Store({name:'test', overwrite:true}, function(store){
        var data = {'@id': 'http://test.com/me', 'http://somproperty.org/prop': 'data'};
        store.load('application/json',data, function(result, msg){
            store.load('application/json',data, function(result, msg){
                store.execute('SELECT * { ?s ?p ?o }', function(success,results) {
                    test.ok(success === true);
                    test.ok(results.length === 1);
                    test.ok(results[0].s.value === 'http://test.com/me');
                    store.close(function(){ test.done() });
                });
            });
        });
    });
};

this.suite_store.testConstructBlankNodes = function(test) {
    new rdfstore.Store({name:'test', overwrite:true}, function(store){
        var uriGraph   = 'http://www.example.com/data.ttl';
        var triplesTTL = "@prefix foaf: <http://xmlns.com/foaf/0.1/> . <http://www.example.com/resource/12645> a foaf:Person . ";
            
        store.load( 'text/turtle', triplesTTL, uriGraph, function( success, results){

            var query = "PREFIX foaf: <http://xmlns.com/foaf/0.1/>\
                         PREFIX test: <http://vocab.netlabs.org/test#>\
                         CONSTRUCT {\
                            ?s test:item [\
                              a test:Item;\
                              test:prop1 \"Value of property 1\";\
                              test:prop2 \"Value of property 2\"\
                            ] .\
                         }\
                         FROM <"+uriGraph+">\
                         WHERE {\
                           ?s a foaf:Person .\
                         }";

            store.execute(query, function(success, graph){
                test.ok(success);
                var numBlankSubjects = 0;
                var distinctBlankSubjects = {};
                var foundUris = false;
                var triples = graph.toArray();
                var triple;
                test.ok(triples.length===4);
                for(var i=0; i<triples.length; i++) {
                    triple = triples[i];
                    if(triple.subject.interfaceName === 'BlankNode') {
                        numBlankSubjects++;
                        distinctBlankSubjects[triple.subject.bnodeId] = true;
                    } else {
                        test.ok(triple.subject.valueOf() === 'http://www.example.com/resource/12645');
                        test.ok(triple.object.interfaceName === 'BlankNode');
                        distinctBlankSubjects[triple.object.bnodeId] = true;
                    }
                }

                var numDistinctBlankSujects = 0;
                for(var p in distinctBlankSubjects) {
                    numDistinctBlankSujects++;
                }

                test.ok(numDistinctBlankSujects === 1);
                store.close(function(){ test.done() });
            });
        });
    });
};

this.suite_store.testRedundantVars1 = function(test) {
    new rdfstore.Store({name:'test', overwrite:true}, function(store) {
	store.load(
            'text/n3',
            '<http://A> <http://B> <http://C>.',
            function(success) {
                store.execute(
                    'SELECT *  WHERE { ?x ?p ?x }',
                    function(success, results) {
			test.ok(results.length === 0);
			test.done()
                    }
                );
            });
    });

};

this.suite_store.testRedundantVars2 = function(test) {
    new rdfstore.Store({name:'test', overwrite:true}, function(store) {
	store.load(
            'text/n3',
            '<http://C> <http://B> <http://C>.\
             <http://D> <http://E> <http://F>.',
            function(success) {
                store.execute(
                    'SELECT *  WHERE { ?x ?p ?x }',
                    function(success, results) {
			test.ok(results.length === 1);
			test.done()
                    }
                );
            });
    });

};

this.suite_store.testRedundantVars3 = function(test) {
    new rdfstore.Store({name:'test', overwrite:true}, function(store) {
	store.load(
            'text/n3',
            '<http://A> <http://B> <http://C>.',
            function(success) {
                store.execute(
                    'CONSTRUCT { ?x ?p ?x }  WHERE { ?x ?p ?x }',
                    function(success, results) {
			var counter = 0;
                        results.triples.forEach(function(result){
			    counter++;
                        });

			test.ok(counter === 0);
			test.done()
                    }
                );
            });
    });

};

this.suite_store.testRedundantVars4 = function(test) {
    new rdfstore.Store({name:'test', overwrite:true}, function(store) {
	store.load(
            'text/n3',
            '<http://C> <http://B> <http://C>.\
             <http://D> <http://E> <http://F>.',
            function(success) {
                store.execute(
                    'CONSTRUCT { ?x ?p ?x }  WHERE { ?x ?p ?x }',
                    function(success, results) {
			var counter = 0;
                        results.triples.forEach(function(result){
			    counter++;
                        });

			test.ok(counter === 1);
			test.done()
                    }
                );
            });
    });

};

this.suite_store.testShouldLoadJSONLDWithAllMediaTypes = function(test) {
    var input = {  "@type": "foaf:Person",
                   "foaf:name": "Manu Sporny",
                   "foaf:homepage": "http://manu.sporny.org/",
                   "sioc:avatar": "http://twitter.com/account/profile_image/manusporny",
                   '@context': {'sioc:avatar': {'@type': '@id'},
			        'foaf:homepage': {'@type': '@id'}}
		};

    var jsonmedia=0, jsonldmedia=0;
    new rdfstore.Store({name:'test', overwrite:true}, function(store) {
	store.load(
            'application/ld+json',
	    input,
            function(success) {
                store.execute(
                    'SELECT * { ?s ?p ?o }',
                    function(success, results) {
			jsonmedia = results.length;
			test.ok(jsonmedia > 0);

			new rdfstore.Store({name:'test', overwrite:true}, function(store) {
			    store.load(
				'application/json',
				input,
				function(success) {
				    store.execute(
					'SELECT * { ?s ?p ?o }',
					function(success, results) {
					    jsonldmedia = results.length;
					    test.ok(jsonldmedia > 0);
					    
					    test.ok(jsonldmedia === jsonmedia);
					    test.done();
					});
				});
			});
                    }
                );
            });
    });
    
};

this.suite_store.testRegisterCustomFunction = function(test) {
    new rdfstore.Store({name:'test', overwrite:true}, function(store) {
	store.load(
            'text/n3',
            '@prefix test: <http://test.com/> .\
             test:A test:prop 5.\
	     test:B test:prop 4.\
	     test:C test:prop 1.\
	     test:D test:prop 3.',
            function(success) {

		var invoked = false;
		store.registerCustomFunction('my_addition', function(engine,args) {
		    var v1 = engine.effectiveTypeValue(args[0]);
		    var v2 = engine.effectiveTypeValue(args[1]);

		    return engine.ebvBoolean(v1+v2<5);
		});

                store.execute(
                    'PREFIX test: <http://test.com/> SELECT * { ?x test:prop ?v1 . ?y test:prop ?v2 . filter(custom:my_addition(?v1,?v2)) }',
                    function(success, results) {
			test.ok(results.length === 3);
			for(var i=0; i<results.length; i++) {
			    test.ok(parseInt(results[i].v1.value) + parseInt(results[i].v2.value) < 5 );
			}
			test.done()
                    }
                );
            });
    });
    
};
