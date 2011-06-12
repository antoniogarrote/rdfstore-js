var JSONLDParser = require("./../src/jsonld_parser.js").JSONLDParser;

exports.testParsing1 = function(test) {
    var input = {  "rdf:type": "foaf:Person",
                   "foaf:name": "Manu Sporny",
                   "foaf:homepage": "http://manu.sporny.org/",
                   "sioc:avatar": "http://twitter.com/account/profile_image/manusporny"};
    
    var result = JSONLDParser.parser.parse(input);

    test.ok(result.length === 4);
    for(var i=0; i<result.length; i++) {
        var triple = result[i];
        test.ok(triple.subject.token === "uri");
        test.ok(triple.subject.value.indexOf("_:") === 0);
        if(triple.predicate.value === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type') {
            test.ok(triple.object.value === "http://xmlns.com/foaf/0.1/Person");
            test.ok(triple.object.token === "uri");
        } else if(triple.predicate.value === 'http://xmlns.com/foaf/0.1/name') {
            test.ok(triple.object.value === "Manu Sporny");
            test.ok(triple.object.token === "literal");
        } else if(triple.predicate.value === 'http://xmlns.com/foaf/0.1/homepage') {
            // uri because of default context coercion
            test.ok(triple.object.value === "http://manu.sporny.org/");
            test.ok(triple.object.token === "uri");
        } else if(triple.predicate.value === 'http://rdfs.org/sioc/ns#avatar') {
            test.ok(triple.object.value === "http://twitter.com/account/profile_image/manusporny");
            test.ok(triple.object.token === "literal");
        } else {
            test.ok(false);
        }
    }

    test.done();
};

exports.testParsing2 = function(test) {
    var input = { "@context": { "myvocab": "http://example.org/myvocab#" },
                  "a": "foaf:Person",
                  "foaf:name": "Manu Sporny",
                  "foaf:homepage": "http://manu.sporny.org/",
                  "sioc:avatar": "http://twitter.com/account/profile_image/manusporny",
                  "myvocab:personality": "friendly"};

    var result = JSONLDParser.parser.parse(input);

    test.ok(result.length === 5);
    for(var i=0; i<result.length; i++) {
        var triple = result[i];
        test.ok(triple.subject.token === "uri");
        test.ok(triple.subject.value.indexOf("_:") === 0);
        if(triple.predicate.value === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type') {
            test.ok(triple.object.value === "http://xmlns.com/foaf/0.1/Person");
            test.ok(triple.object.token === "uri");
        } else if(triple.predicate.value === 'http://xmlns.com/foaf/0.1/name') {
            test.ok(triple.object.value === "Manu Sporny");
            test.ok(triple.object.token === "literal");
        } else if(triple.predicate.value === 'http://xmlns.com/foaf/0.1/homepage') {
            // uri because of default context coercion
            test.ok(triple.object.value === "http://manu.sporny.org/");
            test.ok(triple.object.token === "uri");
        } else if(triple.predicate.value === 'http://rdfs.org/sioc/ns#avatar') {
            test.ok(triple.object.value === "http://twitter.com/account/profile_image/manusporny");
            test.ok(triple.object.token === "literal");
        } else if(triple.predicate.value === 'http://example.org/myvocab#personality') {
            test.ok(triple.object.value === "friendly");
            test.ok(triple.object.token === "literal");
        } else {
            test.ok(false);
        }
    }

    test.done();
}

exports.testParsing3 = function(test) {
    var input = [
        {
            "@": "_:bnode1",
            "a": "foaf:Person",
            "foaf:homepage": "http://example.com/bob/",
            "foaf:name": "Bob"
        },
        {
            "@": "_:bnode2",
            "a": "foaf:Person",
            "foaf:homepage": "http://example.com/eve/",
            "foaf:name": "Eve"
        },
        {
            "@": "_:bnode3",
            "a": "foaf:Person",
            "foaf:homepage": "http://example.com/manu/",
            "foaf:name": "Manu"
        }
    ];

    var result = JSONLDParser.parser.parse(input);

    test.ok(result.length === 9);

    for(var i=0; i<result.length; i++) {
        var triple = result[i];
        if(triple.predicate.value === 'http://xmlns.com/foaf/0.1/name') {
            if(triple.subject.value === '_:bnode1') {
                test.ok(triple.object.value === 'Bob');
            } else if(triple.subject.value === '_:bnode2') {
                test.ok(triple.object.value === 'Eve');
            } else if(triple.subject.value === '_:bnode3') {
                test.ok(triple.object.value === 'Manu');
            }
            test.ok(triple.object.token === 'literal');
        } else {
            test.ok(triple.predicate.token === 'uri');
        }
    }

    test.done();
}


exports.testParsing4 = function(test) {

    var input = {
        "@context": 
        {
            "vcard": "http://microformats.org/profile/hcard#vcard",
            "url": "http://microformats.org/profile/hcard#url",
            "fn": "http://microformats.org/profile/hcard#fn",
            "@coerce": { "xsd:anyURI": "url" }
        },
        "@": "_:bnode1",
        "a": "vcard",
        "url": "http://tantek.com/",
        "fn": "Tantek Çelik"
    };

    var result = JSONLDParser.parser.parse(input);

    test.ok(result.length === 3);
 
    for(var i=0; i<result.length; i++) {
        test.ok(result[i].subject.value === "_:bnode1");
        test.ok(result[i].subject.token === 'uri');
        if(result[i].predicate.value === 'http://microformats.org/profile/hcard#url') {
            test.ok(result[i].object.value === 'http://tantek.com/');
            test.ok(result[i].object.token === 'uri');
        } else if(result[i].predicate.value === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type') {
            test.ok(result[i].object.value === 'http://microformats.org/profile/hcard#vcard');
        }
    }

    test.done();
}

exports.testParsing5 = function(test) {

    var input = [
                  {
                    "@": "http://purl.oreilly.com/works/45U8QJGZSQKDH8N",
                    "a": "http://purl.org/vocab/frbr/core#Work",
                    "http://purl.org/dc/terms/title": "Just a Geek",
                    "http://purl.org/dc/terms/creator": "Whil Wheaton",
                    "http://purl.org/vocab/frbr/core#realization": 
                      ["http://purl.oreilly.com/products/9780596007683.BOOK", "http://purl.oreilly.com/products/9780596802189.EBOOK"]
                  },
                  {
                    "@": "http://purl.oreilly.com/products/9780596007683.BOOK",
                    "a": "http://purl.org/vocab/frbr/core#Expression",
                    "http://purl.org/dc/terms/type": "http://purl.oreilly.com/product-types/BOOK"
                  },
                  {
                    "@": "http://purl.oreilly.com/products/9780596802189.EBOOK",
                    "a": "http://purl.org/vocab/frbr/core#Expression",
                    "http://purl.org/dc/terms/type": "http://purl.oreilly.com/product-types/EBOOK"
                  }
                ];

    var result = JSONLDParser.parser.parse(input);

    var counter = 0;
    var previous = null;

    for(var i=0; i<result.length; i++) {
        var triple = result[i];

        if(triple.predicate.value === 'http://purl.org/vocab/frbr/core#realization') {
            counter++;
            test.ok(triple.object.value === 'http://purl.oreilly.com/products/9780596007683.BOOK' ||
                   triple.object.value === 'http://purl.oreilly.com/products/9780596802189.EBOOK')
            test.ok(previous !== triple.object.value);
            previous = triple.object.value;
        }
    }

    test.ok(counter === 2);
    test.done();
}

exports.testParsing6 = function(test) {
    var input = {"foaf:name": "Manu Sporny"};

    var result = JSONLDParser.parser.parse(input);

    test.ok(result.length === 1);
    test.ok(result[0].predicate.value === 'http://xmlns.com/foaf/0.1/name');
 
    input = { "foaf:homepage": { "@iri": "http://manu.sporny.org" } };
 
    result = JSONLDParser.parser.parse(input);

    test.ok(result.length === 1);
    test.ok(result[0].object.value === 'http://manu.sporny.org');

    input = { "@context": { "@coerce":  { "xsd:anyURI": "foaf:homepage" } },
              "foaf:homepage": "http://manu.sporny.org" };
 
    result = JSONLDParser.parser.parse(input);
 
    test.ok(result.length === 1);
    test.ok(result[0].object.value === "http://manu.sporny.org");
    test.ok(result[0].object.token === "uri");


    input = {"foaf:name": { "@literal": "花澄", "@language": "ja"  } };

    result = JSONLDParser.parser.parse(input);
    
    test.ok(result.length === 1);
    test.ok(result[0].object.lang === 'ja');
    test.ok(result[0].object.value != null);

    input = {  "@context": {  "@coerce": {      "xsd:dateTime": "dc:modified"    }  }, "dc:modified": "2010-05-29T14:17:39+02:00"}

    result = JSONLDParser.parser.parse(input);

    test.ok(result.length === 1);
    test.ok(result[0].object.type === 'http://www.w3.org/2001/XMLSchema#dateTime')


    input = {
              "@context": 
              {  
                 "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
                 "xsd": "http://www.w3.org/2001/XMLSchema#",
                 "name": "http://xmlns.com/foaf/0.1/name",
                 "age": "http://xmlns.com/foaf/0.1/age",
                 "homepage": "http://xmlns.com/foaf/0.1/homepage",
                 "@type":
                 {
                    "xsd:integer": "age",
                    "xsd:anyURI": "homepage",
                 }
              },
              "name": "John Smith",
              "age": "41",
              "homepage": "http://example.org/home/"
            };

    result = JSONLDParser.parser.parse(input, {graph: 'http://test.com/graph'});

    for(var i=0; i<result.length; i++) {
        if(result[i].predicate.value === 'http://xmlns.com/foaf/0.1/age') {
            result[i].object.value === '41';
            result[i].object.type === 'http://www.w3.org/2001/XMLSchema#integer';
            result[i].graph.value === 'http://test.com/graph';
        }
    }

    test.done();
}
