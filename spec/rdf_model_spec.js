var RDFModel = require('../src/rdf_model');

describe("RDFModel", function(){

    it("Should be possible to add actions to a model.", function(){
        var rdf = RDFModel.rdf;
        var graph = rdf.createGraph();
        graph.addAction(rdf.createAction(rdf.filters.p(rdf.resolve("foaf:name")),
            function(triple){
                var name = triple.object.valueOf();
                var name = name.slice(0,1).toUpperCase() + name.slice(1, name.length);
                triple.object = rdf.createNamedNode(name);
                return triple;
            }));

        rdf.setPrefix("ex", "http://example.org/people/");
        graph.add(rdf.createTriple(
            rdf.createNamedNode(rdf.resolve("ex:Alice")),
            rdf.createNamedNode(rdf.resolve("foaf:name")),
            rdf.createLiteral("alice")
        ));

        graph.add(rdf.createTriple(
            rdf.createNamedNode(rdf.resolve("ex:Alice")),
            rdf.createNamedNode(rdf.resolve("foaf:knows")),
            rdf.createNamedNode(rdf.resolve("ex:Bob"))
        ));

        expect(graph.length).toBe(2);
        var triples = graph.match(null, rdf.createNamedNode(rdf.resolve("foaf:name")), null).toArray();
        expect(triples.length).toBe(1);
        expect(triples[0].object.valueOf()).toBe("Alice");

        var triples = graph.match(null, rdf.createNamedNode(rdf.resolve("foaf:knows")), null).toArray();

        expect(triples.length).toBe(1);
        expect(triples[0].object.valueOf()).toBe("http://example.org/people/Bob");
    });

    it("Should be possible to serialize a graph to NT.", function(){
        var rdf = RDFModel.rdf;
        var graph = new rdf.createGraph();

        rdf.setPrefix("earl", "http://www.w3.org/ns/earl#");
        rdf.setDefaultPrefix("http://www.w3.org/ns/earl#");
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

        expect(parts[0]==='_:0 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://test.com/MyClass> . ')
        expect(parts[1]==='<http://www.w3.org/ns/earl#test> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://test.com/MyClass> . ');
        expect(parts[2]==='<http://www.w3.org/ns/earl#test> <http://www.w3.org/ns/earl#test> "alice" . ');
        expect(parts[3]==='');
    });

    it("Should be possible to serialize a literal.", function(){
        var rdf = RDFModel.rdf;
        var literal = rdf.createLiteral("alice", null, "http://www.w3.org/2001/XMLSchema#string");
        expect(literal.toString()==="\"alice\"^^<http://www.w3.org/2001/XMLSchema#string>");
    });


    it("Should be possible to resolve URIs using the default name space", function(){
        var rdf = RDFModel.rdf;
        rdf.prefixes.defaultNs = undefined;
        expect(rdf.prefixes.defaultNs==null);
        expect(rdf.prefixes.resolve(":test")==null);
        expect(rdf.prefixes.shrink("http://something.com/vocab/test")==="http://something.com/vocab/test");
        rdf.prefixes.setDefault("http://something.com/vocab/");
        expect(rdf.prefixes.shrink("http://something.com/vocab/test")==="http://something.com/vocab/test");
        expect(rdf.prefixes.resolve(":test")==="http://something.com/vocab/test");
    });

    it("Should be possible to serialize a named node", function(){
        var node = RDFModel.rdf.createNamedNode("http://www.w3.org/People/Berners-Lee/card#i");
        expect(node.toString()).toBe("http://www.w3.org/People/Berners-Lee/card#i");
    });

});