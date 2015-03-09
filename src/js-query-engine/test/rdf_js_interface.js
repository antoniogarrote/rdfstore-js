var RDFJSInterface = require("./../src/rdf_js_interface").RDFJSInterface;
var QueryEngine = require("./../src/query_engine").QueryEngine;
var QuadBackend = require("./../../js-rdf-persistence/src/quad_backend").QuadBackend;
var Lexicon = require("./../../js-rdf-persistence/src/lexicon").Lexicon;

exports.testFilters = function(test) {

    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
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
                             foaf:mbox       <mailto:bob@work> ;\
                             foaf:mbox       <mailto:bob@home> ;\
                             .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                                PREFIX  foaf:       <http://xmlns.com/foaf/0.1/>\
                                CONSTRUCT { ?s ?p ?o . }\
                                WHERE {\
                                  ?s ?p ?o .\
                                }', function(success, graph){
                                    test.ok(success === true);
				    test.ok(graph.length === 9);

                                    var rdf = RDFJSInterface.rdf;

                                    var results = graph.filter( rdf.filters.describes("http://example.org/people/alice") );

                                    var resultsCount = results.toArray().length;

                                    var resultsSubject = results.filter(rdf.filters.s("http://example.org/people/alice"))
                                    var resultsObject  = results.filter(rdf.filters.o("http://example.org/people/alice"))

                                    test.ok(resultsObject.toArray().length === 1);
                                    test.ok((resultsObject.toArray().length + resultsSubject.toArray().length) === resultsCount);


                                    // filter the graph to find all subjects with an "rdf:type" of "foaf:Person"
                                    var filter = rdf.filters.type(rdf.resolve("foaf:Person"));
                                    results = graph.filter( filter );
                                    var people = [];
                                    results.forEach( function(t) {
                                        // iterate over the results, creating a filtered graph for each subject found
                                        // and pass that graph to a display function
                                        people.push(graph.filter( rdf.filters.s(t.subject) ) );
                                    });

                                    test.ok(people.length === 2);
                                    test.done();
               });
            });
        });
    });
};


exports.testActions = function(test) {
    var rdf = RDFJSInterface.rdf;    
    var graph = rdf.createGraph();
    graph.addAction(rdf.createAction(rdf.filters.p(rdf.resolve("foaf:name")),
                                     function(triple){ var name = triple.object.valueOf();
                                                       var name = name.slice(0,1).toUpperCase() 
                                                       + name.slice(1, name.length);
                                                       triple.object = rdf.createNamedNode(name);
                                                       return triple;}));

    rdf.setPrefix("ex", "http://example.org/people/");
    graph.add(rdf.createTriple( rdf.createNamedNode(rdf.resolve("ex:Alice")),
                                rdf.createNamedNode(rdf.resolve("foaf:name")),
                                rdf.createLiteral("alice") ));

    graph.add(rdf.createTriple( rdf.createNamedNode(rdf.resolve("ex:Alice")),
                                rdf.createNamedNode(rdf.resolve("foaf:knows")),
                                rdf.createNamedNode(rdf.resolve("ex:Bob")) ));;

    test.ok(graph.length === 2);
    var triples = graph.match(null, rdf.createNamedNode(rdf.resolve("foaf:name")), null).toArray();
    test.ok(triples.length === 1);
    test.ok(triples[0].object.valueOf() === "Alice");

    var triples = graph.match(null, rdf.createNamedNode(rdf.resolve("foaf:knows")), null).toArray();
 
    test.ok(triples.length === 1);
    test.ok(triples[0].object.valueOf() === "http://example.org/people/Bob");
    
    test.done();
};

exports.testSerialization1 = function(test) {
    var rdf = RDFJSInterface.rdf;    
    var graph = new rdf.createGraph();

    rdf.setPrefix("earl", "http://www.w3.org/ns/earl#");
    rdf.setDefaultPrefix("http://www.w3.org/ns/earl#")
    rdf.setPrefix("rdf", "http://www.w3.org/1999/02/22-rdf-syntax-ns#");

    graph.add(rdf.createTriple( rdf.createBlankNode(),
                                      rdf.createNamedNode("rdf:type"),
                                      rdf.createNamedNode("http://test.com/MyClass") ));

    graph.add(rdf.createTriple( rdf.createNamedNode("earl:test"),
                                rdf.createNamedNode("rdf:type"),
                                rdf.createNamedNode("http://test.com/MyClass") ));

    graph.add(rdf.createTriple( rdf.createNamedNode("earl:test"),
                                rdf.createNamedNode(":test"),
                                rdf.createLiteral("alice") ));


    var parts = graph.toNT().split("\r\n");

    test.ok(parts[0]==='_:0 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://test.com/MyClass> . ')
    test.ok(parts[1]==='<http://www.w3.org/ns/earl#test> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://test.com/MyClass> . ');
    test.ok(parts[2]==='<http://www.w3.org/ns/earl#test> <http://www.w3.org/ns/earl#test> "alice" . ');
    test.ok(parts[3]==='');
    test.done();
};

exports.testLiteralSerialization = function(test) {
    var rdf = RDFJSInterface.rdf;    
    var literal = rdf.createLiteral("alice", null, "http://www.w3.org/2001/XMLSchema#string");
    test.ok(literal.toString()==="\"alice\"^^<http://www.w3.org/2001/XMLSchema#string>");
    test.done();
};


exports.testBlankDefaultNS = function(test) {
    var rdf = RDFJSInterface.rdf; 
    rdf.prefixes.defaultNs = undefined;
    test.ok(rdf.prefixes.defaultNs==null);
    test.ok(rdf.prefixes.resolve(":test")==null);
    test.ok(rdf.prefixes.shrink("http://something.com/vocab/test")==="http://something.com/vocab/test");
    rdf.prefixes.setDefault("http://something.com/vocab/");
    test.ok(rdf.prefixes.shrink("http://something.com/vocab/test")==="http://something.com/vocab/test");
    test.ok(rdf.prefixes.resolve(":test")==="http://something.com/vocab/test");
    test.done();
};

exports.testToString = function(test) {
    var node = RDFJSInterface.rdf.createNamedNode("http://www.w3.org/People/Berners-Lee/card#i");
    console.log("DAS TEST");
    console.log(node.toString());

    test.done();
};