this.suite_store = {};

this.suite_store.testIntegration1 = function(test){
    var rdf = new RDFJSInterface.RDFEnvironment();

    var graph = new RDFJSInterface.Graph();

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

    test.ok(parts.length==4);
    test.done();
}
