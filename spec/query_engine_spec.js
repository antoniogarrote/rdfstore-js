var QueryEngine = require("../src/query_engine").QueryEngine;
var QuadBackend = require("../src/quad_backend").QuadBackend;
var Lexicon = require("../src/lexicon").Lexicon;
var NonSupportedSparqlFeatureError = require("../src/abstract_query_tree").NonSupportedSparqlFeatureError;
var fs = require('fs');
var _ = require("lodash");
var async = require("async");

// basic

describe("QueryEngine", function(){

    it("Should be able to parse a query.", function(done){
        new Lexicon(function(lexicon){
            new QuadBackend({treeOrder: 2}, function(backend){
                var engine = new QueryEngine({backend: backend,
                    lexicon: lexicon});
                engine.execute('PREFIX ns: <http://example.org/ns#>  PREFIX x:  <http://example.org/x/> PREFIX z:  <http://example.org/x/#> INSERT DATA { x:x ns:p  "d:x ns:p" . x:x x:p   "x:x x:p" . z:x z:p   "z:x z:p" . }', function(err, result){
                    if(err !== null)
                        throw err;
                    engine.execute('BASE <http://example.org/x/> PREFIX : <> SELECT * WHERE { :x ?p ?v }', function(err, results){

                        if(err !== null)
                            throw err;
                        expect(results.length).toBe(2);

                        for(var i=0; i< results.length; i++) {
                            var result = results[i];
                            if(result.p.value === "http://example.org/ns#p") {
                                expect(result.v.value).toBe("d:x ns:p");
                            } else if(result.p.value === "http://example.org/x/p") {
                                expect(result.v.value).toBe("x:x x:p");
                            } else {
                                result.ok(false);
                            }
                        }
                        done();
                    });
                });
            });
        });
    });

    it("Test InsertDataTrivialRecovery", function(done){
        new Lexicon(function(lexicon){
            new QuadBackend({treeOrder: 2}, function(backend){
                var engine = new QueryEngine({backend: backend,
                    lexicon: lexicon});
                engine.execute('INSERT DATA {  <http://example/book3> <http://example.com/vocab#title> <http://test.com/example> }', function(result){
                    engine.execute('SELECT * { ?s ?p ?o }', function(err, result){
                        expect(err).toBe(null);
                        expect(result.length).toBe(1);
                        expect(result[0]['s'].value).toBe('http://example/book3');
                        expect(result[0]['p'].value).toBe('http://example.com/vocab#title');
                        expect(result[0]['o'].value ).toBe('http://test.com/example');
                        done();
                    });
                });

            })
        });
    });


    it("Test InsertDataTrivialRecovery2", function(done){
        new Lexicon(function(lexicon){
            new QuadBackend({treeOrder: 2}, function(backend){
                var engine = new QueryEngine({backend: backend,
                    lexicon: lexicon});
                engine.execute('INSERT DATA {  <http://example/book3> <http://example.com/vocab#title> <http://test.com/example>; <http://example.com/vocab#pages> 95 }', function(err,result){
                    expect( err ).toBe(null);

                    engine.execute('SELECT * { ?s ?p ?o }', function(err, result){
                        expect(result.length).toBe(2);
                        expect(result[0]['s'].value).toBe('http://example/book3');
                        expect(result[1]['s'].value).toBe('http://example/book3');

                        if(result[0]['p'].value === 'http://example.com/vocab#title') {
                            expect(result[0]['o'].value).toBe('http://test.com/example');
                        } else if(result[0]['p'].value === 'http://example.com/vocab#pages') {
                            expect(result[1]['o'].value).toBe("95");
                            expect(result[1]['o'].type).toBe("http://www.w3.org/2001/XMLSchema#integer");
                        } else {
                            expect(false);
                        }

                        if(result[1]['p'].value === 'http://example.com/vocab#title') {
                            expect(result[1]['o'].value).toBe('http://test.com/example');
                        } else if(result[1]['p'].value === 'http://example.com/vocab#pages') {
                            expect(result[1]['o'].value).toBe("95");
                            expect(result[1]['o'].type).toBe("http://www.w3.org/2001/XMLSchema#integer");
                        } else {
                            expect(false);
                        }

                        done();
                    });
                });

            })
        });
    });

    it("Test InsertDataTrivialRecovery3", function(done){
        new Lexicon(function(lexicon){
            new QuadBackend({treeOrder: 2}, function(backend){
                var engine = new QueryEngine({backend: backend,
                    lexicon: lexicon});
                engine.execute('INSERT DATA {  <http://example/book3> <http://example.com/vocab#title> <http://test.com/example>; <http://example.com/vocab#pages> 95 }',function(err,result){
                    engine.execute('INSERT DATA { <http://example/book4> <http://example.com/vocab#title> <http://test.com/example>; <http://example.com/vocab#pages> 96 }', function(err,result){
                        expect( err ).toBe(null);
                        engine.execute('SELECT * { <http://example/book3> ?p ?o }', function(err, result){
                            expect(err).toBe(null);
                            expect(result.length).toBe(2);

                            if(result[0]['p'].value === 'http://example.com/vocab#title') {
                                expect(result[0]['o'].value).toBe('http://test.com/example');
                            } else if(result[0]['p'].value === 'http://example.com/vocab#pages') {
                                expect(result[0]['o'].value).toBe("95");
                                expect(result[0]['o'].type).toBe("http://www.w3.org/2001/XMLSchema#integer");
                            } else {
                                expect(false);
                            }

                            if(result[1]['p'].value === 'http://example.com/vocab#title') {
                                expect(result[1]['o'].value).toBe('http://test.com/example');
                            } else if(result[1]['p'].value === 'http://example.com/vocab#pages') {
                                expect(result[1]['o'].value).toBe("95");
                                expect(result[1]['o'].type).toBe("http://www.w3.org/2001/XMLSchema#integer");
                            } else {
                                expect(false);
                            }

                            done();
                        });
                    });
                });
            });
        });
    });

    it("Test SimpleJoin1", function(done){
        new Lexicon(function(lexicon){
            new QuadBackend({treeOrder: 2}, function(backend){
                var engine = new QueryEngine({backend: backend,
                    lexicon: lexicon});
                engine.execute('INSERT DATA {  <http://example/book3> <http://example.com/vocab#title> <http://test.com/example>; <http://example.com/vocab#pages> 95 . <http://example/book4> <http://example.com/vocab#title> <http://test.com/example>; <http://example.com/vocab#pages> 96 . }', function(err,result){
                    expect( err ).toBe(null);

                    engine.execute('SELECT * { ?s <http://example.com/vocab#title> ?o . ?s <http://example.com/vocab#pages> 95 }', function(err, result){
                        expect(err).toBe(null);
                        expect(result.length).toBe(1);

                        expect(result[0]['s'].value).toBe("http://example/book3");
                        done();
                    });
                });
            });
        });
    });

    it("Test PrefixInsertion", function(done) {
        new Lexicon(function(lexicon){
            new QuadBackend({treeOrder: 2}, function(backend){
                var engine = new QueryEngine({backend: backend,
                    lexicon: lexicon});
                engine.execute('PREFIX ns: <http://example.org/ns#>  PREFIX x:  <http://example.org/x/> PREFIX z:  <http://example.org/x/#> INSERT DATA { x:x ns:p  "d:x ns:p" . x:x x:p   "x:x x:p" . z:x z:p   "z:x z:p" . }', function(err, result){

                    engine.execute('SELECT * { ?s ?p ?o }', function(err, results){
                        expect(results.length).toBe(3);

                        for(var i=0; i<results.length; i++) {
                            if(results[i].s.value === "http://example.org/x/x") {
                                if(results[i].p.value === "http://example.org/ns#p") {
                                    expect(results[i].o.value).toBe("d:x ns:p");
                                } else if(results[i].p.value === "http://example.org/x/p") {
                                    expect(results[i].o.value).toBe("x:x x:p");
                                } else {
                                    expect(false);
                                }
                            } else if(results[i].s.value === "http://example.org/x/#x") {
                                expect(results[i].p.value).toBe("http://example.org/x/#p");
                                expect(results[i].o.value).toBe("z:x z:p");
                            } else {
                                expect(false);
                            }
                        }

                        done();
                    });
                });
            });
        });
    });

    it("Test UnionBasic1", function(done) {
        new Lexicon(function(lexicon){
            new QuadBackend({treeOrder: 2}, function(backend){
                var engine = new QueryEngine({backend: backend,
                    lexicon: lexicon});
                engine.execute(" PREFIX dc10:  <http://purl.org/dc/elements/1.0/> PREFIX dc11:  <http://purl.org/dc/elements/1.1/> INSERT DATA { _:a  dc10:title     'SPARQL Query Language Tutorial' .\
                                _:a  dc10:creator   'Alice' .\
                                _:b  dc11:title     'SPARQL Protocol Tutorial' .\
                                _:b  dc11:creator   'Bob' .\
                                _:c  dc10:title     'SPARQL' .\
                                _:c  dc11:title     'SPARQL (updated)' .\
                                }", function(err, result) {

                    engine.execute("PREFIX dc10:  <http://purl.org/dc/elements/1.0/>\
                                    PREFIX dc11:  <http://purl.org/dc/elements/1.1/>\
                                    SELECT ?title WHERE  { { ?book dc10:title  ?title } UNION { ?book dc11:title  ?title } }",
                        function(err, results) {
                            expect(results.length).toBe(4);

                            var titles = [];
                            for(var i=0; i<results.length; i++) {
                                titles.push(results[i].title.value);
                            }
                            titles.sort();
                            expect(titles[0], 'SPARQL');
                            expect(titles[1], 'SPARQL (updated)');
                            expect(titles[2], 'SPARQL Protocol Tutorial');
                            expect(titles[3], 'SPARQL Query Language Tutorial');
                            done();
                        });
                });
            });
        });
    });


    it("Test UnionBasic2", function(done) {
        new Lexicon(function(lexicon){
            new QuadBackend({treeOrder: 2}, function(backend){
                var engine = new QueryEngine({backend: backend,
                    lexicon: lexicon});
                engine.execute(" PREFIX dc10:  <http://purl.org/dc/elements/1.0/> PREFIX dc11:  <http://purl.org/dc/elements/1.1/> INSERT DATA { \
                                _:a  dc10:title     'SPARQL Query Language Tutorial' .\
                                _:a  dc10:creator   'Alice' .\
                                _:b  dc11:title     'SPARQL Protocol Tutorial' .\
                                _:b  dc11:creator   'Bob' .\
                                _:c  dc10:title     'SPARQL' .\
                                _:c  dc11:title     'SPARQL (updated)' .\
                                }", function(err, result) {

                    engine.execute("PREFIX dc10:  <http://purl.org/dc/elements/1.0/>\
                                                    PREFIX dc11:  <http://purl.org/dc/elements/1.1/>\
                                                    SELECT ?x ?y\
                                                    WHERE  { { ?book dc10:title ?x } UNION { ?book dc11:title  ?y } }",
                        function(err, results) {
                            expect(results.length).toBe(4);

                            var xs = [];
                            var ys = [];
                            for(var i=0; i<results.length; i++) {
                                if(results[i].x == null) {
                                    ys.push(results[i].y.value);
                                } else {
                                    xs.push(results[i].x.value);
                                }
                            }

                            xs.sort();
                            ys.sort();

                            expect(xs[0]=='SPARQL');
                            expect(xs[1]=='SPARQL Query Language Tutorial');
                            expect(ys[0]=='SPARQL (updated)');
                            expect(ys[1]=='SPARQL Protocol Tutorial');
                            done();
                        });
                });
            });
        });
    });


    it("Test UnionBasic3", function(done) {
        new Lexicon(function(lexicon){
            new QuadBackend({treeOrder: 2}, function(backend){
                var engine = new QueryEngine({backend: backend,
                    lexicon: lexicon});
                engine.execute(" PREFIX dc10:  <http://purl.org/dc/elements/1.0/> PREFIX dc11:  <http://purl.org/dc/elements/1.1/> INSERT DATA { \
                                _:a  dc10:title     'SPARQL Query Language Tutorial' .\
                                _:a  dc10:creator   'Alice' .\
                                _:b  dc11:title     'SPARQL Protocol Tutorial' .\
                                _:b  dc11:creator   'Bob' .\
                                _:c  dc10:title     'SPARQL' .\
                                _:c  dc11:title     'SPARQL (updated)' .\
                                }", function(err, result) {

                    engine.execute("PREFIX dc10:  <http://purl.org/dc/elements/1.0/>\
                                                    PREFIX dc11:  <http://purl.org/dc/elements/1.1/>\
                                                    SELECT ?title ?author\
                                                    WHERE  { { ?book dc10:title ?title .  ?book dc10:creator ?author }\
                                                    UNION\
                                                    { ?book dc11:title ?title .  ?book dc11:creator ?author } }",
                        function(err, results) {
                            expect(results.length).toBe(2);

                            if(results[0].author.value == "Alice") {
                                expect(results[0].title.value == "SPARQL Query Language Tutorial");
                                expect(results[1].author.value == "Bob");
                                expect(results[1].title.value == "SPARQL Protocol Tutorial");
                            } else {
                                expect(results[1].author.value == "Alice");
                                expect(results[1].title.value == "SPARQL Query Language Tutorial");
                                expect(results[0].author.value == "Bob");
                                expect(results[0].title.value == "SPARQL Protocol Tutorial");
                            }
                            done();
                        });
                });
            });
        });
    });


    it("Test UnionBasic4", function(done) {
        new Lexicon(function(lexicon){
            new QuadBackend({treeOrder: 2}, function(backend){
                var engine = new QueryEngine({backend: backend,
                    lexicon: lexicon});
                engine.execute(" PREFIX dc10:  <http://purl.org/dc/elements/1.0/> PREFIX dc11:  <http://purl.org/dc/elements/1.1/> INSERT DATA { _:a  dc10:title     'SPARQL Query Language Tutorial' .\
                                _:a  dc10:creator   'Alice' .\
                                _:b  dc11:title     'SPARQL Protocol Tutorial' .\
                                _:b  dc11:creator   'Bob' .\
                                _:c  dc10:title     'SPARQL' .\
                                _:c  dc11:title     'SPARQL (updated)' .\
                                }", function(err, result) {

                    engine.execute("SELECT ?book WHERE { ?book ?p ?o }",
                        function(err, results) {
                            expect(results.length).toBe(6);
                            for(var i=0; i<6; i++) {
                                expect(results[i].book.token == 'blank');
                                expect(results[i].book.value != null);
                            }
                            done();
                        });
                });
            });
        });
    });

    it("Test OptionalBasic1", function(done) {
        new Lexicon(function(lexicon){
            new QuadBackend({treeOrder: 2}, function(backend){
                var engine = new QueryEngine({backend: backend,
                    lexicon: lexicon});
                engine.execute("PREFIX  foaf:  <http://xmlns.com/foaf/0.1/>\
                               INSERT DATA {\
                                 _:a    foaf:name   'Alice' .\
                                 _:a    foaf:knows  _:b .\
                                 _:a    foaf:knows  _:c .\
                                 _:b    foaf:name   'Bob' .\
                                 _:c    foaf:name   'Clare' .\
                                 _:c    foaf:nick   'CT' .\
                               }", function(err, result) {

                    engine.execute("PREFIX foaf:    <http://xmlns.com/foaf/0.1/>\
                                                   SELECT ?nameX ?nameY ?nickY\
                                                   WHERE\
                                                   { ?x foaf:knows ?y ;\
                                                     foaf:name ?nameX .\
                                                     ?y foaf:name ?nameY .\
                                                     OPTIONAL { ?y foaf:nick ?nickY }  }",
                        function(err, results) {
                            expect(results.length).toBe(2);
                            if(results[0].nickY === null) {
                                expect(results[0].nameX.value).toBe('Alice');
                                expect(results[0].nameY.value).toBe('Bob');
                                expect(results[1].nameX.value).toBe('Alice');
                                expect(results[1].nameY.value).toBe('Clare');
                                expect(results[1].nickY.value).toBe('CT');
                            } else {
                                expect(results[1].nameX.value).toBe('Alice');
                                expect(results[1].nameY.value).toBe('Bob');
                                expect(results[0].nameX.value).toBe('Alice');
                                expect(results[0].nameY.value).toBe('Clare');
                                expect(results[0].nickY.value).toBe('CT');
                            }
                            done();
                        });
                });
            });
        });
    });

    it("Test OptionalBasic2", function(done) {
        new Lexicon(function(lexicon){
            new QuadBackend({treeOrder: 2}, function(backend){
                var engine = new QueryEngine({backend: backend,
                    lexicon: lexicon});
                engine.execute("PREFIX  foaf:  <http://xmlns.com/foaf/0.1/>\
                               INSERT DATA {\
                                 _:a    foaf:name   'Alice' .\
                                 _:a    foaf:knows  _:b .\
                                 _:a    foaf:knows  _:c .\
                                 _:b    foaf:name   'Bob' .\
                                 _:c    foaf:name   'Clare' .\
                                 _:c    foaf:nick   'CT' .\
                               }", function(err, result) {

                    engine.execute("PREFIX foaf:    <http://xmlns.com/foaf/0.1/>\
                                                   SELECT *\
                                                   { OPTIONAL { ?x foaf:knows ?y }\
                                                     OPTIONAL { ?y foaf:nick ?nickY }\
                                                   }",
                        function(err, results) {

                            var result = results.length > 0;
                            expect(results.length === 2).toBe(true);
                            done();
                        });
                });
            });
        });
    });

    it("Test OptionalDistinct1", function(done) {
        new Lexicon(function(lexicon){
            new QuadBackend({treeOrder: 2}, function(backend){
                var engine = new QueryEngine({backend: backend,
                    lexicon: lexicon});
                engine.execute("PREFIX  foaf:  <http://xmlns.com/foaf/0.1/>\
                               INSERT DATA {\
                                 _:x    foaf:name   'Alice' .\
                                 _:x    foaf:mbox   <mailto:alice@example.com> .\
                                 _:y    foaf:name   'Alice' .\
                                 _:y    foaf:mbox   <mailto:asmith@example.com> .\
                                 _:z    foaf:name   'Alice' .\
                                 _:z    foaf:mbox   <mailto:alice.smith@example.com> .\
                               }", function(err, result) {

                    engine.execute("PREFIX foaf:    <http://xmlns.com/foaf/0.1/>\
                                                   SELECT DISTINCT ?name WHERE { ?x foaf:name ?name }",
                        function(err, results) {
                            expect(results.length).toBe(1);
                            expect(results[0].name.value).toBe('Alice');
                            done();
                        });
                });
            });
        });
    });


    it("Test Limit1", function(done) {
        new Lexicon(function(lexicon){
            new QuadBackend({treeOrder: 2}, function(backend){
                var engine = new QueryEngine({backend: backend,
                    lexicon: lexicon});
                engine.execute("PREFIX  foaf:  <http://xmlns.com/foaf/0.1/>\
                               INSERT DATA {\
                                 _:x    foaf:name   'Alice' .\
                                 _:x    foaf:mbox   <mailto:alice@example.com> .\
                                 _:y    foaf:name   'Alice' .\
                                 _:y    foaf:mbox   <mailto:asmith@example.com> .\
                                 _:z    foaf:name   'Alice' .\
                                 _:z    foaf:mbox   <mailto:alice.smith@example.com> .\
                               }", function(err, result) {

                    engine.execute("PREFIX foaf:    <http://xmlns.com/foaf/0.1/>\
                                    SELECT ?name WHERE { ?x foaf:name ?name } LIMIT 2",
                        function(err, results) {
                            expect(results.length).toBe(2);
                            expect(results[0].name.value).toBe('Alice');
                            expect(results[1].name.value).toBe('Alice');
                            done();
                        });
                });
            });
        });
    });


    it("Test OrderBy1", function(done) {
        new Lexicon(function(lexicon){
            new QuadBackend({treeOrder: 2}, function(backend){
                var engine = new QueryEngine({backend: backend,
                    lexicon: lexicon});
                engine.execute("PREFIX  foaf:  <http://xmlns.com/foaf/0.1/>\
                               INSERT DATA {\
                                 _:x    foaf:name   'Bob' .\
                                 _:x    foaf:mbox   <mailto:alice@example.com> .\
                                 _:y    foaf:name   'Alice' .\
                                 _:y    foaf:mbox   <mailto:asmith@example.com> .\
                                 _:z    foaf:name   'Marie' .\
                                 _:z    foaf:mbox   <mailto:alice.smith@example.com> .\
                               }", function(err, result) {
                    engine.execute("PREFIX foaf:    <http://xmlns.com/foaf/0.1/>\
                                                   SELECT ?name WHERE { ?x foaf:name ?name } ORDER BY ?name",
                        function(err, results) {
                            expect(results.length).toBe(3);
                            expect(results[0].name.value).toBe('Alice');
                            expect(results[1].name.value).toBe('Bob');
                            expect(results[2].name.value).toBe('Marie');
                            done();
                        });
                });
            });
        });
    });

    it("Test OrderBy2", function(done) {
        new Lexicon(function(lexicon){
            new QuadBackend({treeOrder: 2}, function(backend){
                var engine = new QueryEngine({backend: backend,
                    lexicon: lexicon});
                engine.execute("PREFIX  foaf:  <http://xmlns.com/foaf/0.1/>\
                               INSERT DATA {\
                                 _:x    foaf:name   'Bob' .\
                                 _:x    foaf:mbox   <mailto:alice@example.com> .\
                                 _:y    foaf:name   'Alice' .\
                                 _:y    foaf:mbox   <mailto:asmith@example.com> .\
                                 _:z    foaf:name   'Marie' .\
                                 _:z    foaf:mbox   <mailto:alice.smith@example.com> .\
                               }", function(err, result) {

                    engine.execute("PREFIX foaf:    <http://xmlns.com/foaf/0.1/>\
                                                   SELECT ?name WHERE { ?x foaf:name ?name } ORDER BY DESC(?name)",
                        function(err, results) {
                            expect(results.length).toBe(3);
                            expect(results[0].name.value).toBe('Marie');
                            expect(results[1].name.value).toBe('Bob');
                            expect(results[2].name.value).toBe('Alice');
                            done();
                        });
                });
            });
        });
    });

    it("Test OrderBy3", function(done) {
        new Lexicon(function(lexicon){
            new QuadBackend({treeOrder: 2}, function(backend){
                var engine = new QueryEngine({backend: backend,
                    lexicon: lexicon});
                engine.execute("PREFIX  foaf:  <http://xmlns.com/foaf/0.1/>\
                               INSERT DATA {\
                                 _:x    foaf:name   'Bob' .\
                                 _:x    foaf:mbox   <mailto:bob@example.com> .\
                                 _:y    foaf:name   'Alice' .\
                                 _:y    foaf:mbox   <mailto:alice@example.com> .\
                                 _:z    foaf:name   'Marie' .\
                                 _:z    foaf:mbox   <mailto:marie@example.com> .\
                               }", function(err, result) {

                    engine.execute("PREFIX foaf:    <http://xmlns.com/foaf/0.1/>\
                                                   SELECT ?mbox WHERE { ?x foaf:mbox ?mbox } ORDER BY ASC(?mbox)",
                        function(err, results) {
                            expect(results.length).toBe(3);
                            expect(results[0].mbox.value).toBe('mailto:alice@example.com');
                            expect(results[1].mbox.value).toBe('mailto:bob@example.com');
                            expect(results[2].mbox.value).toBe('mailto:marie@example.com');
                            done();
                        });
                });
            });
        });
    });


    it("Test OrderBy4", function(done) {
        new Lexicon(function(lexicon){
            new QuadBackend({treeOrder: 2}, function(backend){
                var engine = new QueryEngine({backend: backend,
                    lexicon: lexicon});
                engine.execute("PREFIX  foaf:  <http://xmlns.com/foaf/0.1/>\
                               INSERT DATA {\
                                 _:x    foaf:name   'Bob' .\
                                 _:x    foaf:test1   'b' .\
                                 _:y    foaf:name   'Alice' .\
                                 _:y    foaf:test1   'a' .\
                                 _:z    foaf:name   'Marie' .\
                                 _:z    foaf:test1   'a' .\
                               }", function(err, result) {

                    engine.execute("PREFIX foaf:    <http://xmlns.com/foaf/0.1/>\
                                                   SELECT ?name WHERE { ?x foaf:test1 ?test . ?x foaf:name ?name } ORDER BY ASC(?test) ASC(?name)",
                        function(err, results) {
                            expect(results.length).toBe(3);
                            expect(results[0].name.value).toBe('Alice');
                            expect(results[1].name.value).toBe('Marie');
                            expect(results[2].name.value).toBe('Bob');
                            done();
                        });
                });
            });
        });
    });


    it("Test InsertionDeletionTrivial1", function(done){
        new Lexicon(function(lexicon){
            new QuadBackend({treeOrder: 2}, function(backend){
                var engine = new QueryEngine({backend: backend,
                    lexicon: lexicon});
                engine.execute('INSERT DATA {  <http://example/book3> <http://example.com/vocab#title> <http://test.com/example> }', function(result){
                    engine.execute('SELECT * { ?s ?p ?o }', function(err, result){
                        expect(result.length).toBe(1);
                        expect(result[0]['s'].value).toBe('http://example/book3');
                        expect(result[0]['p'].value).toBe('http://example.com/vocab#title');
                        expect(result[0]['o'].value ).toBe('http://test.com/example');

                        engine.execute('DELETE DATA { <http://example/book3> <http://example.com/vocab#title> <http://test.com/example> }', function(result) {
                            engine.execute('SELECT * { ?s ?p ?o }', function(err, result){
                                expect(result.length).toBe(0);
                                var acum = 0;
                                for(var p in engine.lexicon.uriToOID) {
                                    acum++;
                                }
                                for(var p in engine.lexicon.OIDToUri) {
                                    acum++;
                                }

                                for(var p in engine.lexicon.literalToOID) {
                                    acum++;
                                }

                                for(var p in engine.lexicon.OIDToLiteral) {
                                    acum++;
                                }
                                expect(acum).toBe(0);
                                done();
                            });
                        });
                    });
                });

            })
        });
    });

    it("Test InsertionDeletion2", function(done){
        new Lexicon(function(lexicon){
            new QuadBackend({treeOrder: 2}, function(backend){
                var engine = new QueryEngine({backend: backend,
                    lexicon: lexicon});
                engine.execute('INSERT DATA {  GRAPH <a> { <http://example/book3> <http://example.com/vocab#title> <http://test.com/example> } }', function(err){
                    expect(err).toBe(null);

                    engine.execute('INSERT DATA {  GRAPH <b> { <http://example/book3> <http://example.com/vocab#title> <http://test.com/example> } }', function(err){
                        expect(err).toBe(null);
                        engine.execute('SELECT * FROM NAMED <a> { GRAPH <a> { ?s ?p ?o } }', function(err, result){
                            expect(result.length).toBe(1);
                            expect(result[0]['s'].value).toBe('http://example/book3');
                            expect(result[0]['p'].value).toBe('http://example.com/vocab#title');
                            expect(result[0]['o'].value ).toBe('http://test.com/example');

                            engine.execute('SELECT * FROM NAMED <b> { GRAPH <b> { ?s ?p ?o } }', function(err, result){

                                expect(result.length).toBe(1);
                                expect(result[0]['s'].value).toBe('http://example/book3');
                                expect(result[0]['p'].value).toBe('http://example.com/vocab#title');
                                expect(result[0]['o'].value ).toBe('http://test.com/example');

                                engine.execute('DELETE DATA { GRAPH <a> { <http://example/book3> <http://example.com/vocab#title> <http://test.com/example> }  }', function(result) {
                                    engine.execute('SELECT * FROM NAMED <a> { GRAPH <a> { ?s ?p ?o } }', function(err, result){

                                        expect(result.length).toBe(0);

                                        engine.execute('SELECT * FROM NAMED <b> { GRAPH <b> { ?s ?p ?o } }', function(err, result){

                                            expect(result.length).toBe(1);
                                            expect(result[0]['s'].value).toBe('http://example/book3');
                                            expect(result[0]['p'].value).toBe('http://example.com/vocab#title');
                                            expect(result[0]['o'].value ).toBe('http://test.com/example');


                                            var acum = 0;
                                            for(var p in engine.lexicon.uriToOID) {
                                                acum++;
                                            }
                                            for(var p in engine.lexicon.OIDToUri) {
                                                acum++;
                                            }

                                            for(var p in engine.lexicon.literalToOID) {
                                                acum++;
                                            }

                                            for(var p in engine.lexicon.OIDToLiteral) {
                                                acum++;
                                            }

                                            expect(acum===8);
                                            done();
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });

    it("Test Modify1", function(done){
        new Lexicon(function(lexicon){
            new QuadBackend({treeOrder: 2}, function(backend){
                var engine = new QueryEngine({backend: backend,
                    lexicon: lexicon});
                engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                               INSERT DATA {  GRAPH <http://example/addresses> \
                                   { \
                                        <http://example/president25> foaf:givenName "Bill" .\
                                        <http://example/president25> foaf:familyName "McKinley" .\
                                        <http://example/president27> foaf:givenName "Bill" .\
                                        <http://example/president27> foaf:familyName "Taft" .\
                                        <http://example/president42> foaf:givenName "Bill" .\
                                        <http://example/president42> foaf:familyName "Clinton" .\
                                   } \
                               }', function(result){
                    engine.execute("PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                              WITH <http://example/addresses>\
                              DELETE { ?person foaf:givenName 'Bill' }\
                              INSERT { ?person foaf:givenName 'William' }\
                              WHERE  { ?person foaf:givenName 'Bill' }",
                        function(err, result){
                            engine.execute("PREFIX foaf:<http://xmlns.com/foaf/0.1/>\
                              SELECT * FROM NAMED <http://example/addresses> { \
                              GRAPH <http://example/addresses> { ?s ?p ?o } }\
                              ORDER BY ?s ?p", function(err, results){


                                expect(results[0].s.value).toBe("http://example/president25");
                                expect(results[1].s.value).toBe("http://example/president25");
                                expect(results[0].o.value).toBe("McKinley");
                                expect(results[1].o.value).toBe("William");

                                expect(results[2].s.value).toBe("http://example/president27");
                                expect(results[3].s.value).toBe("http://example/president27");
                                expect(results[2].o.value).toBe("Taft");
                                expect(results[3].o.value).toBe("William");

                                expect(results[4].s.value).toBe("http://example/president42");
                                expect(results[5].s.value).toBe("http://example/president42");
                                expect(results[4].o.value).toBe("Clinton");
                                expect(results[5].o.value).toBe("William");

                                done();

                            })
                        });
                });
            });
        });
    });


    it("Test ModifyDefaultGraph", function(done){
        new Lexicon(function(lexicon){
            new QuadBackend({treeOrder: 2}, function(backend){
                var engine = new QueryEngine({backend: backend,
                    lexicon: lexicon});
                engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                               INSERT DATA {  \
                                        <http://example/president25> foaf:givenName "Bill" .\
                                        <http://example/president25> foaf:familyName "McKinley" .\
                                        <http://example/president27> foaf:givenName "Bill" .\
                                        <http://example/president27> foaf:familyName "Taft" .\
                                        <http://example/president42> foaf:givenName "Bill" .\
                                        <http://example/president42> foaf:familyName "Clinton" .\
                               }', function(){
                    engine.execute("PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                              DELETE { ?person foaf:givenName 'Bill' }\
                              INSERT { ?person foaf:givenName 'William' }\
                              WHERE  { ?person foaf:givenName 'Bill' }",
                        function(err){
                            engine.execute("PREFIX foaf:<http://xmlns.com/foaf/0.1/>\
                              SELECT * { ?s ?p ?o }\
                              ORDER BY ?s ?p", function(err, results){


                                expect(results[0].s.value).toBe("http://example/president25");
                                expect(results[1].s.value).toBe("http://example/president25");
                                expect(results[0].o.value).toBe("McKinley");
                                expect(results[1].o.value).toBe("William");

                                expect(results[2].s.value).toBe("http://example/president27");
                                expect(results[3].s.value).toBe("http://example/president27");
                                expect(results[2].o.value).toBe("Taft");
                                expect(results[3].o.value).toBe("William");

                                expect(results[4].s.value).toBe("http://example/president42");
                                expect(results[5].s.value).toBe("http://example/president42");
                                expect(results[4].o.value).toBe("Clinton");
                                expect(results[5].o.value).toBe("William");

                                done();

                            })
                        });
                });
            });
        });
    });

    it("Test ModifyOnlyInsert", function(done){
        new Lexicon(function(lexicon){
            new QuadBackend({treeOrder: 2}, function(backend){
                var engine = new QueryEngine({backend: backend,
                    lexicon: lexicon});
                engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                               INSERT DATA {  GRAPH <http://example/addresses> \
                                   { \
                                        <http://example/president25> foaf:givenName "Bill" .\
                                        <http://example/president25> foaf:familyName "McKinley" .\
                                        <http://example/president27> foaf:givenName "Bill" .\
                                        <http://example/president27> foaf:familyName "Taft" .\
                                        <http://example/president42> foaf:givenName "Bill" .\
                                        <http://example/president42> foaf:familyName "Clinton" .\
                                   } \
                               }', function(){
                    engine.execute("PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                              WITH <http://example/addresses_bis>\
                              INSERT { ?person foaf:givenName 'William' }\
                              USING <http://example/addresses>\
                              WHERE  { ?person foaf:givenName 'Bill' }",
                        function(err, result){
                            engine.execute("PREFIX foaf:<http://xmlns.com/foaf/0.1/>\
                              SELECT * FROM <http://example/addresses_bis> \
                              { ?s ?p ?o }\
                              ORDER BY ?s ?p", function(err, results){
                                expect(results[0].s.value).toBe("http://example/president25");
                                expect(results[0].o.value).toBe("William");

                                expect(results[1].s.value).toBe("http://example/president27");
                                expect(results[1].o.value).toBe("William");

                                expect(results[2].s.value).toBe("http://example/president42");
                                expect(results[2].o.value).toBe("William");

                                done();

                            })
                        });
                });
            });
        });
    });



    it("Test ModifyOnlyDelete", function(done){
        new Lexicon(function(lexicon){
            new QuadBackend({treeOrder: 2}, function(backend){
                var engine = new QueryEngine({backend: backend,
                    lexicon: lexicon});
                engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                               INSERT DATA {  GRAPH <http://example/addresses> \
                                   { \
                                        <http://example/president25> foaf:givenName "Bill" .\
                                        <http://example/president25> foaf:familyName "McKinley" .\
                                        <http://example/president27> foaf:givenName "Bill" .\
                                        <http://example/president27> foaf:familyName "Taft" .\
                                        <http://example/president42> foaf:givenName "Bill" .\
                                        <http://example/president42> foaf:familyName "Clinton" .\
                                   } \
                               }', function(result){
                    engine.execute("PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                              WITH <http://example/addresses>\
                              DELETE { ?person foaf:givenName 'Bill' }\
                              USING <http://example/addresses>\
                              WHERE  { ?person foaf:givenName 'Bill' }",
                        function(err, result){
                            engine.execute("PREFIX foaf:<http://xmlns.com/foaf/0.1/>\
                              SELECT * FROM <http://example/addresses> \
                              { ?s ?p ?o }\
                              ORDER BY ?s ?p", function(err, results){
                                expect(results.length).toBe(3);
                                done();

                            })
                        });
                });
            });
        });
    });

    it("Test AliasedVar", function(done) {
        new Lexicon(function(lexicon){
            new QuadBackend({treeOrder: 2}, function(backend){
                var engine = new QueryEngine({backend: backend,
                    lexicon: lexicon});
                var query = "PREFIX : <http://example/>\
                            INSERT DATA {\
                            :s1 :p 1 .\
                            :s1 :q 9 .\
                            :s2 :p 2 . }";

                engine.execute(query, function(err, result){
                    engine.execute('PREFIX : <http://example/> SELECT (?s AS ?t) {  ?s :p ?v . } GROUP BY ?s', function(err, results){
                        expect(results.length).toBe(2);
                        expect(results[0].t.value).toBe("http://example/s1");
                        expect(results[1].t.value).toBe("http://example/s2");
                        done();
                    });
                });
            });
        });
    });

    it("Test ClearGraph1", function(done){
        new Lexicon(function(lexicon){
            new QuadBackend({treeOrder: 2}, function(backend){
                var engine = new QueryEngine({backend: backend,
                    lexicon: lexicon});
                engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                               INSERT DATA {  GRAPH <http://example/president25> \
                                   { \
                                        <http://example/president25> foaf:givenName "Bill" .\
                                        <http://example/president25> foaf:familyName "McKinley" .\
                                   } \
                               }', function(result){

                    engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                               INSERT DATA {  GRAPH <http://example/president27> \
                                   { \
                                        <http://example/president27> foaf:givenName "Bill" .\
                                        <http://example/president27> foaf:familyName "Taft" .\
                                   } \
                               }', function(result){

                        engine.execute("CLEAR GRAPH <http://example/president27>", function(err, results){
                            engine.execute("SELECT * { GRAPH <http://example/president27> { ?s ?p ?o } }", function(err, results) {

                                expect(results.length).toBe(0);

                                engine.execute("SELECT * { GRAPH <http://example/president25> { ?s ?p ?o } }", function(err, results) {

                                    expect(results.length).toBe(2);
                                    done();

                                });
                            });
                        });
                    });
                });
            });
        });
    });

    it("Test ClearGraph2", function(done){
        new Lexicon(function(lexicon){
            new QuadBackend({treeOrder: 2}, function(backend){
                var engine = new QueryEngine({backend: backend,
                    lexicon: lexicon});

                engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                                 INSERT DATA { \
                                      <http://example/president22> foaf:givenName "Grover" .\
                                      <http://example/president22> foaf:familyName "Cleveland" .\
                                 }', function(err, result){
                    engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                               INSERT DATA {  GRAPH <http://example/president25> \
                                   { \
                                        <http://example/president25> foaf:givenName "Bill" .\
                                        <http://example/president25> foaf:familyName "McKinley" .\
                                   } \
                               }', function(result){

                        engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                               INSERT DATA {  GRAPH <http://example/president27> \
                                   { \
                                        <http://example/president27> foaf:givenName "Bill" .\
                                        <http://example/president27> foaf:familyName "Taft" .\
                                   } \
                               }', function(result){

                            engine.execute("CLEAR DEFAULT", function(err, results){
                                engine.execute("SELECT *  { ?s ?p ?o } ", function(err, results) {

                                    expect(results.length).toBe(0);

                                    engine.execute("SELECT * { GRAPH <http://example/president27> { ?s ?p ?o } }", function(err, results) {

                                        expect(results.length).toBe(2);

                                        engine.execute("SELECT * { GRAPH <http://example/president25> { ?s ?p ?o } }", function(err, results) {

                                            expect(results.length).toBe(2);
                                            done();

                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });

    it("Test ClearGraph3", function(done){
        new Lexicon(function(lexicon){
            new QuadBackend({treeOrder: 2}, function(backend){
                var engine = new QueryEngine({backend: backend,
                    lexicon: lexicon});

                engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                                 INSERT DATA { \
                                      <http://example/president22> foaf:givenName "Grover" .\
                                      <http://example/president22> foaf:familyName "Cleveland" .\
                                 }', function(err, result){
                    engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                               INSERT DATA {  GRAPH <http://example/president25> \
                                   { \
                                        <http://example/president25> foaf:givenName "Bill" .\
                                        <http://example/president25> foaf:familyName "McKinley" .\
                                   } \
                               }', function(result){

                        engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                               INSERT DATA {  GRAPH <http://example/president27> \
                                   { \
                                        <http://example/president27> foaf:givenName "Bill" .\
                                        <http://example/president27> foaf:familyName "Taft" .\
                                   } \
                               }', function(result){

                            engine.execute("CLEAR NAMED", function(err, results){
                                engine.execute("SELECT *  { ?s ?p ?o } ", function(err, results) {

                                    expect(results);
                                    expect(results.length).toBe(2);

                                    engine.execute("SELECT * { GRAPH <http://example/president27> { ?s ?p ?o } }", function(err, results) {

                                        expect(results.length).toBe(0);

                                        engine.execute("SELECT * { GRAPH <http://example/president25> { ?s ?p ?o } }", function(err, results) {

                                            expect(results.length).toBe(0);
                                            done();

                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });

    it("Test ClearGraph4", function(done){
        new Lexicon(function(lexicon){
            new QuadBackend({treeOrder: 2}, function(backend){
                var engine = new QueryEngine({backend: backend,
                    lexicon: lexicon});

                engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                                 INSERT DATA { \
                                      <http://example/president22> foaf:givenName "Grover" .\
                                      <http://example/president22> foaf:familyName "Cleveland" .\
                                 }', function(err, result){
                    engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                               INSERT DATA {  GRAPH <http://example/president25> \
                                   { \
                                        <http://example/president25> foaf:givenName "Bill" .\
                                        <http://example/president25> foaf:familyName "McKinley" .\
                                   } \
                               }', function(result){

                        engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                               INSERT DATA {  GRAPH <http://example/president27> \
                                   { \
                                        <http://example/president27> foaf:givenName "Bill" .\
                                        <http://example/president27> foaf:familyName "Taft" .\
                                   } \
                               }', function(result){

                            engine.execute("CLEAR ALL", function(err, results){
                                engine.execute("SELECT *  { ?s ?p ?o } ", function(err, results) {
                                    expect(results);
                                    expect(results.length).toBe(0);

                                    engine.execute("SELECT * { GRAPH <http://example/president27> { ?s ?p ?o } }", function(err, results) {
                                        expect(results.length).toBe(0);

                                        engine.execute("SELECT * { GRAPH <http://example/president25> { ?s ?p ?o } }", function(err, results) {
                                            expect(results.length).toBe(0);
                                            engine.lexicon.registeredGraphs(true,function(graphs){
                                                expect(graphs.length).toBe(0);
                                                done();
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });


    it("Test Create", function(done){
        new Lexicon(function(lexicon){
            new QuadBackend({treeOrder: 2}, function(backend){
                var engine = new QueryEngine({backend: backend,
                    lexicon: lexicon});
                engine.execute('CREATE GRAPH <a>', function(result){
                    expect(result).toBe(true);

                    done();
                });

            })
        });
    });

    it("Test Drop1", function(done){
        new Lexicon(function(lexicon){
            new QuadBackend({treeOrder: 2}, function(backend){
                var engine = new QueryEngine({backend: backend,
                    lexicon: lexicon});
                engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                               INSERT DATA {  GRAPH <http://example/president25> \
                                   { \
                                        <http://example/president25> foaf:givenName "Bill" .\
                                        <http://example/president25> foaf:familyName "McKinley" .\
                                   } \
                               }', function(result){

                    engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                               INSERT DATA {  GRAPH <http://example/president27> \
                                   { \
                                        <http://example/president27> foaf:givenName "Bill" .\
                                        <http://example/president27> foaf:familyName "Taft" .\
                                   } \
                               }', function(result){

                        engine.execute("DROP GRAPH <http://example/president27>", function(err, results){
                            engine.execute("SELECT * { GRAPH <http://example/president27> { ?s ?p ?o } }", function(err, results) {

                                expect(results.length).toBe(0);

                                engine.execute("SELECT * { GRAPH <http://example/president25> { ?s ?p ?o } }", function(err, results) {

                                    expect(results.length).toBe(2);
                                    done();

                                });
                            });
                        });
                    });
                });
            });
        });
    });

    it("Test Drop2", function(done){
        new Lexicon(function(lexicon){
            new QuadBackend({treeOrder: 2}, function(backend){
                var engine = new QueryEngine({backend: backend,
                    lexicon: lexicon});

                engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                                 INSERT DATA { \
                                      <http://example/president22> foaf:givenName "Grover" .\
                                      <http://example/president22> foaf:familyName "Cleveland" .\
                                 }', function(err, result){
                    engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                               INSERT DATA {  GRAPH <http://example/president25> \
                                   { \
                                        <http://example/president25> foaf:givenName "Bill" .\
                                        <http://example/president25> foaf:familyName "McKinley" .\
                                   } \
                               }', function(result){

                        engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                               INSERT DATA {  GRAPH <http://example/president27> \
                                   { \
                                        <http://example/president27> foaf:givenName "Bill" .\
                                        <http://example/president27> foaf:familyName "Taft" .\
                                   } \
                               }', function(result){

                            engine.execute("DROP DEFAULT", function(err, results){
                                engine.execute("SELECT *  { ?s ?p ?o } ", function(err, results) {

                                    expect(results.length).toBe(0);

                                    engine.execute("SELECT * { GRAPH <http://example/president27> { ?s ?p ?o } }", function(err, results) {

                                        expect(results.length).toBe(2);

                                        engine.execute("SELECT * { GRAPH <http://example/president25> { ?s ?p ?o } }", function(err, results) {

                                            expect(results.length).toBe(2);
                                            done();

                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });

    it("Test Drop3", function(done){
        new Lexicon(function(lexicon){
            new QuadBackend({treeOrder: 2}, function(backend){
                var engine = new QueryEngine({backend: backend,
                    lexicon: lexicon});

                engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                                 INSERT DATA { \
                                      <http://example/president22> foaf:givenName "Grover" .\
                                      <http://example/president22> foaf:familyName "Cleveland" .\
                                 }', function(err, result){
                    engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                               INSERT DATA {  GRAPH <http://example/president25> \
                                   { \
                                        <http://example/president25> foaf:givenName "Bill" .\
                                        <http://example/president25> foaf:familyName "McKinley" .\
                                   } \
                               }', function(result){

                        engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                               INSERT DATA {  GRAPH <http://example/president27> \
                                   { \
                                        <http://example/president27> foaf:givenName "Bill" .\
                                        <http://example/president27> foaf:familyName "Taft" .\
                                   } \
                               }', function(result){

                            engine.execute("DROP NAMED", function(err, results){
                                engine.execute("SELECT *  { ?s ?p ?o } ", function(err, results) {

                                    expect(results);
                                    expect(results.length).toBe(2);

                                    engine.execute("SELECT * { GRAPH <http://example/president27> { ?s ?p ?o } }", function(err, results) {

                                        expect(results.length).toBe(0);

                                        engine.execute("SELECT * { GRAPH <http://example/president25> { ?s ?p ?o } }", function(err, results) {

                                            expect(results.length).toBe(0);
                                            done();

                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });

    it("Test Drop4", function(done){
        new Lexicon(function(lexicon){
            new QuadBackend({treeOrder: 2}, function(backend){
                var engine = new QueryEngine({backend: backend,
                    lexicon: lexicon});

                engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                                 INSERT DATA { \
                                      <http://example/president22> foaf:givenName "Grover" .\
                                      <http://example/president22> foaf:familyName "Cleveland" .\
                                 }', function(err, result){
                    engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                               INSERT DATA {  GRAPH <http://example/president25> \
                                   { \
                                        <http://example/president25> foaf:givenName "Bill" .\
                                        <http://example/president25> foaf:familyName "McKinley" .\
                                   } \
                               }', function(result){

                        engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                               INSERT DATA {  GRAPH <http://example/president27> \
                                   { \
                                        <http://example/president27> foaf:givenName "Bill" .\
                                        <http://example/president27> foaf:familyName "Taft" .\
                                   } \
                               }', function(result){

                            engine.execute("DROP ALL", function(err, results){
                                engine.execute("SELECT *  { ?s ?p ?o } ", function(err, results) {

                                    expect(results);
                                    expect(results.length).toBe(0);

                                    engine.execute("SELECT * { GRAPH <http://example/president27> { ?s ?p ?o } }", function(err, results) {

                                        expect(results.length).toBe(0);

                                        engine.execute("SELECT * { GRAPH <http://example/president25> { ?s ?p ?o } }", function(err, results) {

                                            expect(results.length).toBe(0);
                                            engine.lexicon.registeredGraphs(true, function(graphs){
                                                expect(graphs.length).toBe(0);
                                                done();
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });

    it("Test DeleteWhere1", function(done){
        new Lexicon(function(lexicon){
            new QuadBackend({treeOrder: 2}, function(backend){
                var engine = new QueryEngine({backend: backend,
                    lexicon: lexicon});
                engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                               INSERT DATA \
                                   { \
                                        <http://example/president25> foaf:givenName "Bill" .\
                                        <http://example/president25> foaf:familyName "McKinley" .\
                                        <http://example/president27> foaf:givenName "Bill" .\
                                        <http://example/president27> foaf:familyName "Taft" .\
                                        <http://example/president42> foaf:givenName "Bill" .\
                                        <http://example/president42> foaf:familyName "Clinton" .\
                                   }', function(result){
                    engine.execute("PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                              DELETE WHERE  { ?person foaf:givenName 'Bill'}", function(err, result){
                        engine.execute("PREFIX foaf:<http://xmlns.com/foaf/0.1/>\
                              SELECT *  \
                              { ?s ?p ?o }\
                              ORDER BY ?s ?p", function(err, results){
                            expect(results.length).toBe(3);
                            done();

                        });
                    });
                });
            });
        });
    });

    it("Test GroupMax1", function(done) {
        new Lexicon(function(lexicon){
            new QuadBackend({treeOrder: 2}, function(backend){
                var engine = new QueryEngine({backend: backend,
                    lexicon: lexicon});
                var query = "PREFIX : <http://example/>\
                            INSERT DATA {\
                            :s1 :p 1 .\
                            :s1 :q 9 .\
                            :s2 :p 2 .\
                            :s2 :p 0 }";

                engine.execute(query, function(err, result){
                    engine.execute('PREFIX : <http://example/> SELECT (MAX(?v) AS ?maxv) {  ?s ?p ?v . } GROUP BY ?s', function(err, results){
                        expect(results.length).toBe(2);
                        expect(results[0].maxv.value).toBe('9');
                        expect(results[1].maxv.value).toBe('2');
                        done();
                    });
                });
            });
        });
    });


    it("Test GroupMin1", function(done) {
        new Lexicon(function(lexicon){
            new QuadBackend({treeOrder: 2}, function(backend){
                var engine = new QueryEngine({backend: backend,
                    lexicon: lexicon});
                var query = "PREFIX : <http://example/>\
                            INSERT DATA {\
                            :s1 :p 1 .\
                            :s1 :q 9 .\
                            :s2 :p 2 .\
                            :s2 :p 0 }";

                engine.execute(query, function(err, result){
                    engine.execute('PREFIX : <http://example/> SELECT (MIN(?v) AS ?maxv) {  ?s ?p ?v . } GROUP BY ?s', function(err, results){
                        expect(results.length).toBe(2);
                        expect(results[0].maxv.value).toBe('1');
                        expect(results[1].maxv.value).toBe('0');
                        done();
                    });
                });
            });
        });
    });

    it("Test GroupCount1", function(done) {
        new Lexicon(function(lexicon){
            new QuadBackend({treeOrder: 2}, function(backend){
                var engine = new QueryEngine({backend: backend,
                    lexicon: lexicon});
                var query = "PREFIX : <http://example/>\
                            INSERT DATA {\
                            :s1 :p 1 .\
                            :s1 :q 9 .\
                            :s1 :v 9 .\
                            :s2 :p 2 .\
                            :s2 :p 0 }";

                engine.execute(query, function(err, result){
                    engine.execute('PREFIX : <http://example/> SELECT (COUNT(?v) AS ?count) {  ?s ?p ?v . } GROUP BY ?s', function(err, results){
                        expect(results.length).toBe(2);
                        expect(results[0].count.value).toBe('3');
                        expect(results[1].count.value).toBe('2');

                        done();
                    });
                });
            });
        });
    });

    it("Test GroupCountDistinct1", function(done) {
        new Lexicon(function(lexicon){
            new QuadBackend({treeOrder: 2}, function(backend){
                var engine = new QueryEngine({backend: backend,
                    lexicon: lexicon});
                var query = "PREFIX : <http://example/>\
                            INSERT DATA {\
                            :s1 :p 1 .\
                            :s1 :q 9 .\
                            :s1 :v 9 .\
                            :s2 :p 2 .\
                            :s2 :p 0 }";

                engine.execute(query, function(err, result){
                    engine.execute('PREFIX : <http://example/> SELECT (COUNT( distinct ?v) AS ?count) {  ?s ?p ?v . } GROUP BY ?s', function(err, results){
                        expect(results.length).toBe(2);
                        expect(results[0].count.value).toBe('2')
                        expect(results[1].count.value).toBe('2')

                        done();
                    });
                });
            });
        });
    });

    it("Test GroupAvg1", function(done) {
        new Lexicon(function(lexicon){
            new QuadBackend({treeOrder: 2}, function(backend){
                var engine = new QueryEngine({backend: backend,
                    lexicon: lexicon});
                var query = "PREFIX : <http://example/>\
                            INSERT DATA {\
                            :s1 :p 1 .\
                            :s1 :q 3 .\
                            :s1 :v 3 .\
                            :s2 :p 1 .\
                            :s2 :p 11 }";

                engine.execute(query, function(err, result){
                    engine.execute('PREFIX : <http://example/> SELECT (AVG( distinct ?v) AS ?avg) {  ?s ?p ?v . } GROUP BY ?s', function(err, results){
                        expect(results.length).toBe(2);
                        expect(results[0].avg.value).toBe('2');
                        expect(results[1].avg.value).toBe('6');

                        done();
                    });
                });
            });
        });
    });

    it("Test GroupAvg2", function(done) {
        new Lexicon(function(lexicon){
            new QuadBackend({treeOrder: 2}, function(backend){
                var engine = new QueryEngine({backend: backend,
                    lexicon: lexicon});
                var query = "PREFIX : <http://example/>\
                            INSERT DATA {\
                            :s1 :p 2 .\
                            :s1 :q 3 .\
                            :s2 :p 1 .\
                            :s2 :p 11 }";

                engine.execute(query, function(err, result){
                    engine.execute('PREFIX : <http://example/> SELECT (AVG(?v) AS ?avg) {  ?s ?p ?v . } GROUP BY ?s', function(err, results){
                        expect(results.length).toBe(2);
                        expect(results[0].avg.value).toBe('2.5');
                        expect(results[1].avg.value).toBe('6');
                        done();
                    });
                });
            });
        });
    });

    it("Test GroupSum1", function(done) {
        new Lexicon(function(lexicon){
            new QuadBackend({treeOrder: 2}, function(backend){
                var engine = new QueryEngine({backend: backend,
                    lexicon: lexicon});
                var query = "PREFIX : <http://example/>\
                            INSERT DATA {\
                            :s1 :p 1 .\
                            :s1 :q 3 .\
                            :s1 :v 3 .\
                            :s2 :p 1 .\
                            :s2 :p 11 }";

                engine.execute(query, function(err, result){
                    engine.execute('PREFIX : <http://example/> SELECT (SUM( distinct ?v) AS ?avg) {  ?s ?p ?v . } GROUP BY ?s', function(err, results){
                        expect(results.length).toBe(2);
                        expect(results[0].avg.value).toBe('4');
                        expect(results[1].avg.value).toBe('12');

                        done();
                    });
                });
            });
        });
    });

    it("Test GroupSum2", function(done) {
        new Lexicon(function(lexicon){
            new QuadBackend({treeOrder: 2}, function(backend){
                var engine = new QueryEngine({backend: backend,
                    lexicon: lexicon});
                var query = "PREFIX : <http://example/>\
                            INSERT DATA {\
                            :s1 :p 2 .\
                            :s1 :q 3.5 .\
                            :s2 :p 1 .\
                            :s2 :p 11 }";

                engine.execute(query, function(err, result){
                    engine.execute('PREFIX : <http://example/> SELECT (SUM(?v) AS ?avg) {  ?s ?p ?v . } GROUP BY ?s', function(err, results){
                        expect(results.length).toBe(2);
                        expect(results[0].avg.value).toBe('5.5');
                        expect(results[1].avg.value).toBe('12');
                        done();
                    });
                });
            });
        });
    });

    it("Test DisjointUnion", function(done) {
        new Lexicon(function(lexicon){
            new QuadBackend({treeOrder: 15}, function(backend){
                var engine = new QueryEngine({backend: backend,
                    lexicon: lexicon});

                var query = 'PREFIX ex:  <http://www.w3.org/2009/sparql/docs/tests/data-sparql11/negation#> \
                            PREFIX dc:  <http://purl.org/dc/elements/1.1/>\
                            PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                            INSERT DATA { ex:a ex:p ex:o . ex:d ex:q ex:o2 . }';

                engine.execute(query, function(err, result){
                    var query = 'PREFIX ex:  <http://www.w3.org/2009/sparql/docs/tests/data-sparql11/negation#> \
                                PREFIX dc:  <http://purl.org/dc/elements/1.1/>\
                                SELECT ?a ?b { { ?a ex:p ?o1 } UNION { ?b ex:q ?o2 } }';

                    engine.execute(query, function(err, results){
                        expect(results.length).toBe(2);
                        if(results[0].a == null) {
                            expect(results[0].b.value).toBe('http://www.w3.org/2009/sparql/docs/tests/data-sparql11/negation#d')
                            expect(results[1].a.value).toBe('http://www.w3.org/2009/sparql/docs/tests/data-sparql11/negation#a')
                            expect(results[1].b == null);
                        } else if(results[0].b == null) {
                            expect(results[0].a.value).toBe('http://www.w3.org/2009/sparql/docs/tests/data-sparql11/negation#a')
                            expect(results[1].b.value).toBe('http://www.w3.org/2009/sparql/docs/tests/data-sparql11/negation#d')
                            expect(results[1].a == null);
                        } else {
                            expect(false);
                        }
                        done();
                    });
                });
            });
        });
    });


    it("Test BIND", function(done){
        new Lexicon(function(lexicon){
            new QuadBackend({treeOrder: 15}, function(backend){
                var engine = new QueryEngine({backend: backend,
                    lexicon: lexicon});
                  var query = 'BASE <http://example.org/book/>\
                               PREFIX dc:  <http://purl.org/dc/elements/1.1/> \
                               PREFIX ns:  <http://example.org/ns#>\
                               INSERT DATA {\
                                 <book1>  dc:title     "SPARQL Tutorial" .\
                                 <book1>  ns:price     42 .\
                                 <book1>  ns:discount  0.2 .\
                                 <book2>  dc:title     "The Semantic Web" .\
                                 <book2>  ns:price     23 .\
                                 <book2>  ns:discount  0.25 .\
                               }';

                engine.execute(query, function(err, result){
                    var query = 'PREFIX  dc:  <http://purl.org/dc/elements/1.1/>\
                                 PREFIX  ns:  <http://example.org/ns#>\
                                 SELECT  ?title ?price\
                                 {  ?x ns:price ?p .\
                                    ?x ns:discount ?discount .\
                                    FILTER(?price < 20)\
                                    BIND (?p*(1-?discount) AS ?price)\
                                    ?x dc:title ?title .\
                                 }';

                    engine.execute(query, function(err, results){
                        expect(results.length == 1);
                        expect(results[0].price.value).toBe(17.25);
                        expect(results[0].title.value).toBe("The Semantic Web");
                        done();
                    });
                });
            });
        });
    });
    it('Test FILTER EXISTS', function(done) {
        new Lexicon(function(lexicon){
            new QuadBackend({treeOrder: 15}, function(backend){
                var engine = new QueryEngine({backend: backend,
                    lexicon: lexicon});
                var query = 'BASE <http://example.org/book/>\
                             PREFIX dc:  <http://purl.org/dc/elements/1.1/> \
                             PREFIX ns:  <http://example.org/ns#>\
                             INSERT DATA {\
                               <book1>  dc:title     "SPARQL Tutorial" .\
                               <book1>  ns:price     42 .\
                               <book1>  ns:discount  0.2 .\
                               <book1>  ns:relatedTo <book2> .\
                               <book2>  dc:title     "The Semantic Web" .\
                               <book2>  ns:price     23 .\
                               <book2>  ns:discount  0.25 .\
                             }';
                engine.execute(query, function(success, result) {
                    var query = 'PREFIX  dc:  <http://purl.org/dc/elements/1.1/>\
                                 PREFIX  ns:  <http://example.org/ns#>\
                                 SELECT  * \
                                 { ?x ns:discount ?discount .\
                                   ?x dc:title ?title .\
                                    FILTER EXISTS { ?x ns:price ?p FILTER (?p = 23) } .\
                                 }';
                    engine.execute(query, function(success, result) {
                        expect(success);
                        expect(result.length).toEqual(1);
                        expect(result[0].title.value).toEqual('The Semantic Web');
                        done();
                    });
                });
            });
        });
    });

    it('Test FILTER EXISTS composition', function(done) {
        new Lexicon(function(lexicon){
            new QuadBackend({treeOrder: 15}, function(backend){
                var engine = new QueryEngine({backend: backend,
                                              lexicon: lexicon});
                var query = 'BASE <http://example.org/book/>\
                          PREFIX dc:  <http://purl.org/dc/elements/1.1/> \
                          PREFIX ns:  <http://example.org/ns#>\
                          INSERT DATA {\
                            <book1>  dc:title     "SPARQL Tutorial" .\
                            <book1>  ns:price     42 .\
                            <book1>  ns:discount  0.2 .\
                            <book1>  ns:relatedTo <book2> .\
                            <book2>  dc:title     "The Semantic Web" .\
                            <book2>  ns:price     23 .\
                            <book2>  ns:discount  0.25 .\
                          }';
                engine.execute(query, function(success, result) {
                    var query = 'PREFIX  dc:  <http://purl.org/dc/elements/1.1/>\
                              PREFIX  ns:  <http://example.org/ns#>\
                              SELECT  * \
                              {  ?x ns:price ?p .\
                                 FILTER (?p = 23 || EXISTS { ?x ns:price 42 })  .\
                              }';
                    engine.execute(query, function(success, result) {
                        expect(success);
                        expect(result.length).toEqual(2);
                        done();
                    });
                });
            });
        });
    });

});
