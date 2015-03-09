var JSONLDParser = require("./../src/jsonld_parser.js").JSONLDParser;


exports.testParsing1 = function(test) {
    var input = {  "@type": "foaf:Person",
                   "foaf:name": "Manu Sporny",
                   "foaf:homepage": "http://manu.sporny.org/",
                   "sioc:avatar": "http://twitter.com/account/profile_image/manusporny",
                   '@context': {'sioc:avatar': {'@type': '@id'},
			        'foaf:homepage': {'@type': '@id'}}
		};

    var result = JSONLDParser.parser.parse(input);
    test.ok(result.length === 4);
    for(var i=0; i<result.length; i++) {
        var triple = result[i];
        test.ok(triple.subject['blank'] != null);
        test.ok(triple.subject['blank'].indexOf("_:") === 0);
        if(triple.predicate['uri'] === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type') {
            test.ok(triple.object.uri === "http://xmlns.com/foaf/0.1/Person");
        } else if(triple.predicate.uri === 'http://xmlns.com/foaf/0.1/name') {
            test.ok(triple.object.literal === '"Manu Sporny"');
        } else if(triple.predicate.uri === 'http://xmlns.com/foaf/0.1/homepage') {
            // uri because of default context coercion
            test.ok(triple.object.uri === "http://manu.sporny.org/");
        } else if(triple.predicate.uri === 'http://rdfs.org/sioc/ns#avatar') {
            test.ok(triple.object.uri === "http://twitter.com/account/profile_image/manusporny");
        } else {
            test.ok(false);
        }
    }
    test.done();
};

exports.testParsing2 = function(test) {
    var input = { "@context": { "myvocab": "http://example.org/myvocab#",
				'sioc:avatar': {
				   '@type': '@id'
				},
				'foaf:homepage': {
				    '@type': '@id'
				} },
                  "@type": "foaf:Person",
                  "foaf:name": "Manu Sporny",
                  "foaf:homepage": "http://manu.sporny.org/",
                  "sioc:avatar": "http://twitter.com/account/profile_image/manusporny",
                  "myvocab:personality": "friendly"};

    var result = JSONLDParser.parser.parse(input);

    test.ok(result.length === 5);
    for(var i=0; i<result.length; i++) {
        var triple = result[i];
        test.ok(triple.subject.blank.indexOf("_:") === 0);
        if(triple.predicate.uri === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type') {
            test.ok(triple.object.uri === "http://xmlns.com/foaf/0.1/Person");
        } else if(triple.predicate.uri === 'http://xmlns.com/foaf/0.1/name') {
            test.ok(triple.object.literal === '"Manu Sporny"');
        } else if(triple.predicate.uri === 'http://xmlns.com/foaf/0.1/homepage') {
            // uri because of default context coercion
            test.ok(triple.object.uri === "http://manu.sporny.org/");
        } else if(triple.predicate.uri === 'http://rdfs.org/sioc/ns#avatar') {
            test.ok(triple.object.uri === "http://twitter.com/account/profile_image/manusporny");
        } else if(triple.predicate.uri === 'http://example.org/myvocab#personality') {
            test.ok(triple.object.literal === '"friendly"');
        } else {
            test.ok(false);
        }
    }

    test.done();
}

exports.testParsing3 = function(test) {
    var input = [
        {
            "@id": "_:bnode1",
            "@type": "foaf:Person",
            "foaf:homepage": "http://example.com/bob/",
            "foaf:name": "Bob"
        },
        {
            "@id": "_:bnode2",
            "@type": "foaf:Person",
            "foaf:homepage": "http://example.com/eve/",
            "foaf:name": "Eve"
        },
        {
            "@id": "_:bnode3",
            "@type": "foaf:Person",
            "foaf:homepage": "http://example.com/manu/",
            "foaf:name": "Manu"
        }
    ];

    var result = JSONLDParser.parser.parse(input);

    test.ok(result.length === 9);

    for(var i=0; i<result.length; i++) {
        var triple = result[i];
        if(triple.predicate.uri === 'http://xmlns.com/foaf/0.1/name') {
            if(triple.subject.blank === '_:bnode1') {
                test.ok(triple.object.literal === '"Bob"');
            } else if(triple.subject.blank === '_:bnode2') {
                test.ok(triple.object.literal === '"Eve"');
            } else if(triple.subject.blank === '_:bnode3') {
                test.ok(triple.object.literal === '"Manu"');
            }
        } else {
            test.ok(triple.predicate.literal == null);
        }
    }

    test.done();
}

exports.testParsing4 = function(test) {

    var input = {
        "@context": 
        {
            "vcard": "http://microformats.org/profile/hcard#vcard",
            "url": {'@id': "http://microformats.org/profile/hcard#url", '@type': '@id'},
            "fn": "http://microformats.org/profile/hcard#fn"
        },
        "@id": "_:bnode1",
        "@type": "vcard",
        "url": "http://tantek.com/",
        "fn": "Tantek Çelik"
    };

    var result = JSONLDParser.parser.parse(input);

    test.ok(result.length === 3);
 
    for(var i=0; i<result.length; i++) {
        test.ok(result[i].subject.blank[0] === "_");
        if(result[i].predicate.uri === 'http://microformats.org/profile/hcard#url') {
            test.ok(result[i].object.uri === 'http://tantek.com/');
        } else if(result[i].predicate.uri === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type') {
            test.ok(result[i].object.uri === 'http://microformats.org/profile/hcard#vcard');
        }
    }

    test.done();
}

exports.testParsing5 = function(test) {

    var input = [
                  {
                    "@id": "http://purl.oreilly.com/works/45U8QJGZSQKDH8N",
                    "@type": "http://purl.org/vocab/frbr/core#Work",
                    "http://purl.org/dc/terms/title": "Just a Geek",
                    "http://purl.org/dc/terms/creator": "Whil Wheaton",
                    "http://purl.org/vocab/frbr/core#realization": 
                      ["http://purl.oreilly.com/products/9780596007683.BOOK", "http://purl.oreilly.com/products/9780596802189.EBOOK"],
                    '@context':{"http://purl.org/vocab/frbr/core#realization": {'@type':'@id'}}
                  },
                  {
                    "@id": "http://purl.oreilly.com/products/9780596007683.BOOK",
                    "@type": "http://purl.org/vocab/frbr/core#Expression",
                    "http://purl.org/dc/terms/type": "http://purl.oreilly.com/product-types/BOOK",
                    '@context':{"http://purl.org/dc/terms/type":{'@type':'@id'}}
                  },
                  {
                    "@id": "http://purl.oreilly.com/products/9780596802189.EBOOK",
                    "@type": "http://purl.org/vocab/frbr/core#Expression",
                    "http://purl.org/dc/terms/type": "http://purl.oreilly.com/product-types/EBOOK",
                    '@context':{"http://purl.org/dc/terms/type":{'@type':'@id'}}
                  }
                ];

    var result = JSONLDParser.parser.parse(input);

    var counter = 0;
    var previous = null;

    for(var i=0; i<result.length; i++) {
        var triple = result[i];

        if(triple.predicate.uri === 'http://purl.org/vocab/frbr/core#realization') {
            counter++;
            test.ok(triple.object.uri === 'http://purl.oreilly.com/products/9780596007683.BOOK' ||
                   triple.object.uri=== 'http://purl.oreilly.com/products/9780596802189.EBOOK');
            test.ok(previous !== triple.object.uri);
            previous = triple.object.uri;
        }
    }

    test.ok(counter === 2);
    test.done();
}

exports.testParsing6 = function(test) {
    var input = {"foaf:name": "Manu Sporny"};
 
    var result = JSONLDParser.parser.parse(input);
 
    test.ok(result.length === 1);
    test.ok(result[0].predicate.uri === 'http://xmlns.com/foaf/0.1/name');
 
    input = { "foaf:homepage": { "@id": "http://manu.sporny.org" } };
 
    result = JSONLDParser.parser.parse(input);
 
    test.ok(result.length === 1);
    test.ok(result[0].object.uri === 'http://manu.sporny.org');

    input = { "@context": {"foaf:homepage": {"@type": "@id"} },
	      "foaf:homepage": "http://manu.sporny.org" };
 
    result = JSONLDParser.parser.parse(input);
    test.ok(result.length === 1);
    test.ok(result[0].object.uri === "http://manu.sporny.org");
 
 
    input = {"foaf:name": { "@literal": "花澄", "@language": "ja"  } };
 
    result = JSONLDParser.parser.parse(input);
    
    test.ok(result.length === 1);
    test.ok(result[0].object.literal === '"花澄"@ja');
 
    input = {  "@context": {   "dc:modified": {'@type': "xsd:dateTime"}	 }, "dc:modified": "2010-05-29T14:17:39+02:00"};
 
    result = JSONLDParser.parser.parse(input);
 
    test.ok(result.length === 1);
    test.ok(result[0].object.literal === '"2010-05-29T14:17:39+02:00"^^<http://www.w3.org/2001/XMLSchema#dateTime>');
 
 
    input = {
              "@context": 
              {  
                 "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
                 "xsd": "http://www.w3.org/2001/XMLSchema#",
                 "name": "http://xmlns.com/foaf/0.1/name",
                 "age": {'@id': "http://xmlns.com/foaf/0.1/age", '@type':"xsd:integer"},
                 "homepage": {'@id':"http://xmlns.com/foaf/0.1/homepage", '@type':"xsd:anyURI"}
              },
              "name": "John Smith",
              "age": "41",
              "homepage": "http://example.org/home/"
            };

    result = JSONLDParser.parser.parse(input, {uri: 'http://test.com/graph'});
    var found = false;
    for(var i=0; i<result.length; i++) {
        if(result[i].predicate.uri === 'http://xmlns.com/foaf/0.1/age') {
	    found = true;
            test.ok(result[i].object.literal === '"41"^^<http://www.w3.org/2001/XMLSchema#integer>');
            test.ok(result[i].graph.uri === 'http://test.com/graph');
        }
    }
    test.ok(found === true);

    test.done();
}