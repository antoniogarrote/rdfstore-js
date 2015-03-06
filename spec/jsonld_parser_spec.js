var JSONLDParser = require('../src/jsonld_parser').JSONLDParser;

describe("JSONLDParser#parse", function(){

    it("Should parse JSON-LD json objects - 1", function(done){
        var input = {  "@type": "foaf:Person",
            "foaf:name": "Manu Sporny",
            "foaf:homepage": "http://manu.sporny.org/",
            "sioc:avatar": "http://twitter.com/account/profile_image/manusporny",
            "@context": {
                "sioc:avatar" : {"@type": "@id"},
                "foaf:homepage": {"@type": "@id"}}
        };

        JSONLDParser.parser.parse(input,null,{},function(err, result){
            expect(err == null);
            expect(result.length).toBe(4);
            for(var i=0; i<result.length; i++) {
                var triple = result[i];
                expect(triple.subject['blank'] != null);
                expect(triple.subject['blank'].indexOf("_:")).toBe(0);
                if(triple.predicate['uri'] === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type') {
                    expect(triple.object.uri).toBe("http://xmlns.com/foaf/0.1/Person");
                } else if(triple.predicate.uri === 'http://xmlns.com/foaf/0.1/name') {
                    expect(triple.object.literal).toBe('"Manu Sporny"');
                } else if(triple.predicate.uri === 'http://xmlns.com/foaf/0.1/homepage') {
                    // uri because of default context coercion
                    expect(triple.object.uri).toBe("http://manu.sporny.org/");
                } else if(triple.predicate.uri === 'http://rdfs.org/sioc/ns#avatar') {
                    expect(triple.object.uri).toBe("http://twitter.com/account/profile_image/manusporny");
                } else {
                    expect(false);
                }
            }
            done();

        });
    });

    it("Should parse JSON-LD json objects - 2", function(done){
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

        JSONLDParser.parser.parse(input,null, {}, function(err, result){

            expect(err==null);
            expect(result.length).toBe(5);
            for(var i=0; i<result.length; i++) {
                var triple = result[i];
                expect(triple.subject.blank.indexOf("_:")).toBe(0);
                if(triple.predicate.uri === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type') {
                    expect(triple.object.uri === "http://xmlns.com/foaf/0.1/Person");
                } else if(triple.predicate.uri === 'http://xmlns.com/foaf/0.1/name') {
                    expect(triple.object.literal === '"Manu Sporny"');
                } else if(triple.predicate.uri === 'http://xmlns.com/foaf/0.1/homepage') {
                    // uri because of default context coercion
                    expect(triple.object.uri === "http://manu.sporny.org/");
                } else if(triple.predicate.uri === 'http://rdfs.org/sioc/ns#avatar') {
                    expect(triple.object.uri === "http://twitter.com/account/profile_image/manusporny");
                } else if(triple.predicate.uri === 'http://example.org/myvocab#personality') {
                    expect(triple.object.literal === '"friendly"');
                } else {
                    expect(false);
                }
            }

            done();
        });
    });

    it("Should parse JSON-LD json objects -3 ", function(done){
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

        JSONLDParser.parser.parse(input, null, {}, function(err,result){

            expect(result.length === 9);

            for(var i=0; i<result.length; i++) {
                var triple = result[i];
                if(triple.predicate.uri === 'http://xmlns.com/foaf/0.1/name') {
                    if(triple.subject.blank === '_:bnode1') {
                        expect(triple.object.literal === '"Bob"');
                    } else if(triple.subject.blank === '_:bnode2') {
                        expect(triple.object.literal === '"Eve"');
                    } else if(triple.subject.blank === '_:bnode3') {
                        expect(triple.object.literal === '"Manu"');
                    }
                } else {
                    expect(triple.predicate.literal == null);
                }
            }

            done();
        });
    });

    it("Should parse JSON-LD json objects - 4", function(done){
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

        JSONLDParser.parser.parse(input, null, {}, function(err, result){
            expect(result.length === 3);

            for(var i=0; i<result.length; i++) {
                expect(result[i].subject.blank[0] === "_");
                if(result[i].predicate.uri === 'http://microformats.org/profile/hcard#url') {
                    expect(result[i].object.uri === 'http://tantek.com/');
                } else if(result[i].predicate.uri === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type') {
                    expect(result[i].object.uri === 'http://microformats.org/profile/hcard#vcard');
                }
            }

            done();
        });
    });

    it("Should parse JSON-LD json sobjects - 5", function(done){
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

        JSONLDParser.parser.parse(input, null, {}, function(err, result){

            var counter = 0;
            var previous = null;

            for(var i=0; i<result.length; i++) {
                var triple = result[i];

                if(triple.predicate.uri === 'http://purl.org/vocab/frbr/core#realization') {
                    counter++;
                    expect(triple.object.uri === 'http://purl.oreilly.com/products/9780596007683.BOOK' ||
                    triple.object.uri=== 'http://purl.oreilly.com/products/9780596802189.EBOOK');
                    expect(previous !== triple.object.uri);
                    previous = triple.object.uri;
                }
            }

            expect(counter === 2);
            done();

        });

    });

    it("Should parse JSON-LD json objects - 6", function(done){
        var input = {"foaf:name": "Manu Sporny"};
        JSONLDParser.parser.parse(input, null, {}, function(err, result){
            expect(result.length === 1);
            expect(result[0].predicate.uri === 'http://xmlns.com/foaf/0.1/name');


            input = { "foaf:homepage": { "@id": "http://manu.sporny.org" } };
            JSONLDParser.parser.parse(input, null, {}, function(err,result){
                expect(result.length === 1);
                expect(result[0].object.uri === 'http://manu.sporny.org');

                input = { "@context": {"foaf:homepage": {"@type": "@id"} },
                          "foaf:homepage": "http://manu.sporny.org" };

                JSONLDParser.parser.parse(input, null, {}, function(err,result){
                    expect(result.length === 1);
                    expect(result[0].object.uri === "http://manu.sporny.org");

                    input = {"foaf:name": { "@value": "花澄", "@language": "ja"  } };
                    JSONLDParser.parser.parse(input, null, {}, function(err, result){
                        expect(result.length === 1);
                        expect(result[0].object.literal === '"花澄"@ja');

                        input = {  "@context": {   "dc:modified": {'@type': "xsd:dateTime"}	 }, "dc:modified": "2010-05-29T14:17:39+02:00"};

                        JSONLDParser.parser.parse(input, null, {}, function(err, result){
                            expect(result.length === 1);
                            expect(result[0].object.literal === '"2010-05-29T14:17:39+02:00"^^<http://www.w3.org/2001/XMLSchema#dateTime>');

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

                            JSONLDParser.parser.parse(input, {uri: 'http://test.com/graph'}, {}, function(err, result){
                                var found = false;
                                for(var i=0; i<result.length; i++) {
                                    if(result[i].predicate.uri === 'http://xmlns.com/foaf/0.1/age') {
                                        found = true;
                                        expect(result[i].object.literal === '"41"^^<http://www.w3.org/2001/XMLSchema#integer>');
                                        expect(result[i].graph.uri === 'http://test.com/graph');
                                    }
                                }
                                expect(found === true);
                                done();
                            });

                        });
                    });
                });


            });


        });
        
    })
});
