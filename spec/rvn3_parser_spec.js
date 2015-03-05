var RVN3Parser = require('../src/rvn3_parser').RVN3Parser;
var path = require('path');

// Auxiliary functions
var compare = function(compa, compb) {
    if(compa == null) {
        expect(compb == null);
    } else if(compa.token && compa.token === "uri") {
        expect(compa.token).toBe(compb.token);
        expect(compa.value).toBe(compb.value);
    } else if(compa.literal) {
        expect(compa.literal).toBe(compb.literal);
    } else if(compa.blank) {
        expect(compa.blank).toBe(compb.blank);
    } else {
        expect(false);
    }
};

var compareTriple = function(ta,tb) {
    //console.log("TA");
    //console.log(ta);
    //console.log("TB");
    //console.log(tb);
    compare(ta.subject,tb.subject);
    compare(ta.predicate,tb.predicate);
    compare(ta.object,tb.object);
    compare(ta.graph,tb.graph);
};

var shouldParse = function(input, output, done, options) {
    options = options || {};
    RVN3Parser.parser.resetBlankNodeIds();
    RVN3Parser.parser.parse(input, options, function(err, result) {
        //console.log("PARSED? "+success);
        //console.log("------------");
        //console.log(input);
        //console.log("------------");
        //console.log(result);
        //console.log("!!!!!!!!!!!!");
        expect(err != true);
        expect(result.constructor).toBe(output.constructor);
        expect(result.length).toBe(output.length);
        for(var i=0; i<result.length; i++) {
            compareTriple(result[i],output[i],done);
        }
        done();
    });
};


describe("RVN3Parser#parse", function(){

    it("Should be able to parse N3 data with a provided graph", function(done){
        fs = require('fs');
        fs.readFile(path.resolve(__dirname, "data/sp2b_10k.n3"), function(err, data) {
            if(err) throw err;
            data = data.toString('utf8');
            RVN3Parser.parser.parse(data, 'http://test.com/graph1', {}, function(err, result){
                expect(err == null);
                expect(result.length).toBe(43);

                for(var i=0; i<result.length; i++) {
                    expect(result[i].graph['value']).toBe('http://test.com/graph1');
                }
                done();
            });
        });
    });

    it("Should be able to parse N3 data with a null graph", function(done){
        fs = require('fs');
        fs.readFile(path.resolve(__dirname, "data/sp2b_10k.n3"), function(err, data) {
            if(err) throw err;
            data = data.toString('utf8');
            RVN3Parser.parser.parse(data, {}, function(err, result){
                expect(err == null);
                expect(result.length).toBe(43);

                for(var i=0; i<result.length; i++) {
                    expect(result[i].graph).toBe(null);
                }
                done();
            });
        });
    });

    it("Should parse N3 data with comments", function(done){
        fs = require('fs');
        fs.readFile(path.resolve(__dirname, "./data/with_comments.n3"), function(err, data) {
            if(err) throw err;
            data = data.toString('utf8');
            var result = RVN3Parser.parser.parse(data, {}, function(err, result) {
                expect(result.length).toBe(9);
                done();
            });
        });
    });

    it("Should parse an empty string",function(done) {
        shouldParse('',[],done);
    });

    it("Should parse spaces", function(done) {
        shouldParse(' \t \n  ',[],done);
    });


    it("Should parse single triple", function(done) {
        shouldParse('<a> <b> <c>.',[ { subject: { token: 'uri', value: 'a', prefix: null, suffix: null },
            predicate: { token: 'uri', value: 'b', prefix: null, suffix: null },
            object: { token: 'uri', value: 'c', prefix: null, suffix: null },
            graph: null } ],done);
    });

    it("Should parse document triples", function(done) {
        shouldParse('<#a> <#b> <#c>.',[ { subject: { token: 'uri', value: 'http://test.com/something#a', prefix: null, suffix: null },
                predicate: { token: 'uri', value: 'http://test.com/something#b', prefix: null, suffix: null },
                object: { token: 'uri', value: 'http://test.com/something#c', prefix: null, suffix: null },
                graph: null } ],done,
            {baseURI: 'http://test.com/something'});
    });

    it("Should parse triples",  function(done) {
        shouldParse('<a> <b> <c>.\n<d> <e> <f>.\n<g> <h> <i>.',
            [ { subject: { token: 'uri', value: 'a', prefix: null, suffix: null },
                predicate: { token: 'uri', value: 'b', prefix: null, suffix: null },
                object: { token: 'uri', value: 'c', prefix: null, suffix: null },
                graph: null },
                { subject: { token: 'uri', value: 'd', prefix: null, suffix: null },
                    predicate: { token: 'uri', value: 'e', prefix: null, suffix: null },
                    object: { token: 'uri', value: 'f', prefix: null, suffix: null },
                    graph: null },
                { subject: { token: 'uri', value: 'g', prefix: null, suffix: null },
                    predicate: { token: 'uri', value: 'h', prefix: null, suffix: null },
                    object: { token: 'uri', value: 'i', prefix: null, suffix: null },
                    graph: null } ],
            done);
    });

    it("Should parse literals",  function(done) {
        shouldParse('<a> <b> "string".',
            [ { subject: { token: 'uri', value: 'a', prefix: null, suffix: null },
                predicate: { token: 'uri', value: 'b', prefix: null, suffix: null },
                object: { literal: '"string"' },
                graph: null } ],
            done);
    });

    it("Should parse numeric literals",  function(done) {
        shouldParse('<a> <b> 3.0.',
            [ { subject: { token: 'uri', value: 'a', prefix: null, suffix: null },
                predicate: { token: 'uri', value: 'b', prefix: null, suffix: null },
                object: { literal: '"3.0"^^<http://www.w3.org/2001/XMLSchema#decimal>' },
                graph: null } ],
            done);
    });


    it("Should parse literals with lang codes",  function(done) {
        shouldParse('<a> <b> "string"@en.',
            [ { subject: { token: 'uri', value: 'a', prefix: null, suffix: null },
                predicate: { token: 'uri', value: 'b', prefix: null, suffix: null },
                object: { literal: '"string"@en' },
                graph: null } ],
            done);
    });

    it("Should parse literals with normalised lang",  function(done) {
        shouldParse('<a> <b> "string"@EN.',
            [ { subject: { token: 'uri', value: 'a', prefix: null, suffix: null },
                predicate: { token: 'uri', value: 'b', prefix: null, suffix: null },
                object: { literal: '"string"@en' },
                graph: null } ],
            done);
    });

    it("Should parse literal with URI type",  function(done) {
        shouldParse('<a> <b> "string"^^<type>.',
            [ { subject: { token: 'uri', value: 'a', prefix: null, suffix: null },
                predicate: { token: 'uri', value: 'b', prefix: null, suffix: null },
                object: { literal: '"string"^^<type>' },
                graph: null } ],
            done);
    });

    it("Should parse literal with QName type",  function(done) {
        shouldParse('@prefix x: <y#>. <a> <b> "string"^^x:z.',
            [ { subject: { token: 'uri', value: 'a', prefix: null, suffix: null },
                predicate: { token: 'uri', value: 'b', prefix: null, suffix: null },
                object: { literal: '"string"^^<y#z>' },
                graph: null } ],
            done);
    });

    it("Should parse triples with SPARQL prefixes",  function(done) {
        shouldParse('PREFIX : <#>\n' + 'PrEfIX a: <a#> ' + ':x a:a a:b.',
            [ { subject: { token: 'uri', value: '#x', prefix: null, suffix: null },
                predicate: { token: 'uri', value: 'a#a', prefix: null, suffix: null },
                object: { token: 'uri', value: 'a#b', prefix: null, suffix: null },
                graph: null } ],
            done);
    });

    it("Should parse statements with shared subjects",  function(done) {
        shouldParse('<a> <b> <c>;\n<d> <e>.',
            [ { subject: { token: 'uri', value: 'a', prefix: null, suffix: null },
                predicate: { token: 'uri', value: 'b', prefix: null, suffix: null },
                object: { token: 'uri', value: 'c', prefix: null, suffix: null },
                graph: null },
                { subject: { token: 'uri', value: 'a', prefix: null, suffix: null },
                    predicate: { token: 'uri', value: 'd', prefix: null, suffix: null },
                    object: { token: 'uri', value: 'e', prefix: null, suffix: null },
                    graph: null } ],
            done);
    });

    it("Should parse statements with shared subjects and trailing statements",  function(done) {
        shouldParse('<a> <b> <c>;\n<d> <e>;\n.',
            [ { subject: { token: 'uri', value: 'a', prefix: null, suffix: null },
                predicate: { token: 'uri', value: 'b', prefix: null, suffix: null },
                object: { token: 'uri', value: 'c', prefix: null, suffix: null },
                graph: null },
                { subject: { token: 'uri', value: 'a', prefix: null, suffix: null },
                    predicate: { token: 'uri', value: 'd', prefix: null, suffix: null },
                    object: { token: 'uri', value: 'e', prefix: null, suffix: null },
                    graph: null } ],
            done);
    });

    it("Should parse statements with shared subjects and multiple semicolons",  function(done) {
        shouldParse('<a> <b> <c>;;\n<d> <e>.',
            [ { subject: { token: 'uri', value: 'a', prefix: null, suffix: null },
                predicate: { token: 'uri', value: 'b', prefix: null, suffix: null },
                object: { token: 'uri', value: 'c', prefix: null, suffix: null },
                graph: null },
                { subject: { token: 'uri', value: 'a', prefix: null, suffix: null },
                    predicate: { token: 'uri', value: 'd', prefix: null, suffix: null },
                    object: { token: 'uri', value: 'e', prefix: null, suffix: null },
                    graph: null } ],
            done);
    });


    it("Should parse statements with shared subjects and predicates", function(done) {
        shouldParse('<a> <b> <c>, <d>.',
            [ { subject: { token: 'uri', value: 'a', prefix: null, suffix: null },
                predicate: { token: 'uri', value: 'b', prefix: null, suffix: null },
                object: { token: 'uri', value: 'c', prefix: null, suffix: null },
                graph: null },
                { subject: { token: 'uri', value: 'a', prefix: null, suffix: null },
                    predicate: { token: 'uri', value: 'b', prefix: null, suffix: null },
                    object: { token: 'uri', value: 'd', prefix: null, suffix: null },
                    graph: null } ],
            done);
    });


    it("Should parse statements with named blank nodes",  function(done) {
        shouldParse('_:a <b> _:c.',
            [ { subject: { blank: '_:0_a' },
                predicate: { token: 'uri', value: 'b', prefix: null, suffix: null },
                object: { blank: '_:0_c' },
                graph: null } ],
            done);
    });


    it("Should parse statements with empty blank nodes",  function(done) {
        shouldParse('[] <b> [].',
            [ { subject: { blank: '_:0' },
                predicate: { token: 'uri', value: 'b', prefix: null, suffix: null },
                object: { blank: '_:1' },
                graph: null } ],
            done);
    });


    it("Should parse statements with unnmaed blank nodes in subject",  function(done) {
        shouldParse('[<a> <b>] <c> <d>.',
            [ { subject: { blank: '_:0' },
                predicate: { token: 'uri', value: 'a', prefix: null, suffix: null },
                object: { token: 'uri', value: 'b', prefix: null, suffix: null },
                graph: null },
                { subject: { blank: '_:0' },
                    predicate: { token: 'uri', value: 'c', prefix: null, suffix: null },
                    object: { token: 'uri', value: 'd', prefix: null, suffix: null },
                    graph: null } ],
            done);
    });

    it("Should parse statements with unnamed blank nodes in object",  function(done) {
        shouldParse('<a> <b> [<c> <d>].',
            [ { subject: { blank: '_:0' },
                predicate: { token: 'uri', value: 'c', prefix: null, suffix: null },
                object: { token: 'uri', value: 'd', prefix: null, suffix: null },
                graph: null },
                { subject: { token: 'uri', value: 'a', prefix: null, suffix: null },
                    predicate: { token: 'uri', value: 'b', prefix: null, suffix: null },
                    object: { blank: '_:0' },
                    graph: null } ],
            done);
    });


    it("Should parse statements with unnamed blank nodes with string object",  function(done) {
        shouldParse('<a> <b> [<c> "x"].',
            [ { subject: { blank: '_:0' },
                predicate: { token: 'uri', value: 'c', prefix: null, suffix: null },
                object: { literal: '"x"' },
                graph: null },
                { subject: { token: 'uri', value: 'a', prefix: null, suffix: null },
                    predicate: { token: 'uri', value: 'b', prefix: null, suffix: null },
                    object: { blank: '_:0' },
                    graph: null } ],
            done);
    });


    it("Should parse multi statement blank node",  function(done) {
        shouldParse('<a> <b> [ <u> <v>; <w> <z> ].',
            [ { subject: { blank: '_:0' },
                predicate: { token: 'uri', value: 'u', prefix: null, suffix: null },
                object: { token: 'uri', value: 'v', prefix: null, suffix: null },
                graph: null },
                { subject: { blank: '_:0' },
                    predicate: { token: 'uri', value: 'w', prefix: null, suffix: null },
                    object: { token: 'uri', value: 'z', prefix: null, suffix: null },
                    graph: null },
                { subject: { token: 'uri', value: 'a', prefix: null, suffix: null },
                    predicate: { token: 'uri', value: 'b', prefix: null, suffix: null },
                    object: { blank: '_:0' },
                    graph: null } ],
            done);
    });


    it("Should parse multi statement blank node with trailing semicolon",  function(done) {
        shouldParse('<a> <b> [ <u> <v>; <w> <z>; ].',
            [ { subject: { blank: '_:0' },
                predicate: { token: 'uri', value: 'u', prefix: null, suffix: null },
                object: { token: 'uri', value: 'v', prefix: null, suffix: null },
                graph: null },
                { subject: { blank: '_:0' },
                    predicate: { token: 'uri', value: 'w', prefix: null, suffix: null },
                    object: { token: 'uri', value: 'z', prefix: null, suffix: null },
                    graph: null },
                { subject: { token: 'uri', value: 'a', prefix: null, suffix: null },
                    predicate: { token: 'uri', value: 'b', prefix: null, suffix: null },
                    object: { blank: '_:0' },
                    graph: null } ],
            done);
    });


    it("Should parse statement with nested blank nodes subject",  function(done) {
        shouldParse('[<a> [<x> <y>]] <c> <d>.',
            [ { subject: { blank: '_:1' },
                predicate: { token: 'uri', value: 'x', prefix: null, suffix: null },
                object: { token: 'uri', value: 'y', prefix: null, suffix: null },
                graph: null },
                { subject: { blank: '_:0' },
                    predicate: { token: 'uri', value: 'a', prefix: null, suffix: null },
                    object: { blank: '_:1' },
                    graph: null },
                { subject: { blank: '_:0' },
                    predicate: { token: 'uri', value: 'c', prefix: null, suffix: null },
                    object: { token: 'uri', value: 'd', prefix: null, suffix: null },
                    graph: null } ],
            done);
    });

    it("Should parse statements with nested blank nodes object",  function(done) {
        shouldParse('<a> <b> [<c> [<d> <e>]].',
            [ { subject: { blank: '_:1' },
                predicate: { token: 'uri', value: 'd', prefix: null, suffix: null },
                object: { token: 'uri', value: 'e', prefix: null, suffix: null },
                graph: null },
                { subject: { blank: '_:0' },
                    predicate: { token: 'uri', value: 'c', prefix: null, suffix: null },
                    object: { blank: '_:1' },
                    graph: null },
                { subject: { token: 'uri', value: 'a', prefix: null, suffix: null },
                    predicate: { token: 'uri', value: 'b', prefix: null, suffix: null },
                    object: { blank: '_:0' },
                    graph: null } ],
            done);
    });

    it("Should parse empty list subject",  function(done) {
        shouldParse('() <a> <b>.',
            [ { subject:
            { token: 'uri',
                value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#nil',
                prefix: null,
                suffix: null },
                predicate: { token: 'uri', value: 'a', prefix: null, suffix: null },
                object: { token: 'uri', value: 'b', prefix: null, suffix: null },
                graph: null } ],
            done);
    });


    it("Should parse empty list object",  function(done) {
        shouldParse('<a> <b> ().',
            [ { subject: { token: 'uri', value: 'a', prefix: null, suffix: null },
                predicate: { token: 'uri', value: 'b', prefix: null, suffix: null },
                object:
                { token: 'uri',
                    value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#nil',
                    prefix: null,
                    suffix: null },
                graph: null } ],
            done);
    });

    it("Should parse single element list object",  function(done) {
        shouldParse('<a> <b> (<x>).',
            [ { subject: { blank: '_:0' },
                predicate:
                { token: 'uri',
                    value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#first',
                    prefix: null,
                    suffix: null },
                object: { token: 'uri', value: 'x', prefix: null, suffix: null },
                graph: null },
                { subject: { blank: '_:0' },
                    predicate:
                    { token: 'uri',
                        value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#rest',
                        prefix: null,
                        suffix: null },
                    object:
                    { token: 'uri',
                        value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#nil',
                        prefix: null,
                        suffix: null },
                    graph: null },
                { subject: { token: 'uri', value: 'a', prefix: null, suffix: null },
                    predicate: { token: 'uri', value: 'b', prefix: null, suffix: null },
                    object: { blank: '_:0' },
                    graph: null } ],
            done);
    });

    it("Should parse single element list subject",  function(done) {
        shouldParse('(<x>) <a> <b>.',
            [ { subject: { blank: '_:0' },
                predicate:
                { token: 'uri',
                    value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#first',
                    prefix: null,
                    suffix: null },
                object: { token: 'uri', value: 'x', prefix: null, suffix: null },
                graph: null },
                { subject: { blank: '_:0' },
                    predicate:
                    { token: 'uri',
                        value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#rest',
                        prefix: null,
                        suffix: null },
                    object:
                    { token: 'uri',
                        value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#nil',
                        prefix: null,
                        suffix: null },
                    graph: null },
                { subject: { blank: '_:0' },
                    predicate: { token: 'uri', value: 'a', prefix: null, suffix: null },
                    object: { token: 'uri', value: 'b', prefix: null, suffix: null },
                    graph: null } ],
            done);
    });

    it("Should parse statements with multi element list subject",  function(done) {
        shouldParse('(<x> <y>) <a> <b>.',
            [ { subject: { blank: '_:0' },
                predicate:
                { token: 'uri',
                    value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#first',
                    prefix: null,
                    suffix: null },
                object: { token: 'uri', value: 'x', prefix: null, suffix: null },
                graph: null },
                { subject: { blank: '_:0' },
                    predicate:
                    { token: 'uri',
                        value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#rest',
                        prefix: null,
                        suffix: null },
                    object: { blank: '_:1' },
                    graph: null },
                { subject: { blank: '_:1' },
                    predicate:
                    { token: 'uri',
                        value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#first',
                        prefix: null,
                        suffix: null },
                    object: { token: 'uri', value: 'y', prefix: null, suffix: null },
                    graph: null },
                { subject: { blank: '_:1' },
                    predicate:
                    { token: 'uri',
                        value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#rest',
                        prefix: null,
                        suffix: null },
                    object:
                    { token: 'uri',
                        value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#nil',
                        prefix: null,
                        suffix: null },
                    graph: null },
                { subject: { blank: '_:0' },
                    predicate: { token: 'uri', value: 'a', prefix: null, suffix: null },
                    object: { token: 'uri', value: 'b', prefix: null, suffix: null },
                    graph: null } ],
            done);
    });

    it("Should parse statements with multi element list object",  function(done) {
        shouldParse('<a> <b> (<x> <y>).',
            [ { subject: { blank: '_:0' },
                predicate:
                { token: 'uri',
                    value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#first',
                    prefix: null,
                    suffix: null },
                object: { token: 'uri', value: 'x', prefix: null, suffix: null },
                graph: null },
                { subject: { blank: '_:0' },
                    predicate:
                    { token: 'uri',
                        value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#rest',
                        prefix: null,
                        suffix: null },
                    object: { blank: '_:1' },
                    graph: null },
                { subject: { blank: '_:1' },
                    predicate:
                    { token: 'uri',
                        value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#first',
                        prefix: null,
                        suffix: null },
                    object: { token: 'uri', value: 'y', prefix: null, suffix: null },
                    graph: null },
                { subject: { blank: '_:1' },
                    predicate:
                    { token: 'uri',
                        value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#rest',
                        prefix: null,
                        suffix: null },
                    object:
                    { token: 'uri',
                        value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#nil',
                        prefix: null,
                        suffix: null },
                    graph: null },
                { subject: { token: 'uri', value: 'a', prefix: null, suffix: null },
                    predicate: { token: 'uri', value: 'b', prefix: null, suffix: null },
                    object: { blank: '_:0' },
                    graph: null } ],
            done);
    });


    it("Should parse statements with multi element list object",  function(done) {
        shouldParse('("y") <a> <b>.',
            [ { subject: { blank: '_:0' },
                predicate:
                { token: 'uri',
                    value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#first',
                    prefix: null,
                    suffix: null },
                object: { literal: '"y"' },
                graph: null },
                { subject: { blank: '_:0' },
                    predicate:
                    { token: 'uri',
                        value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#rest',
                        prefix: null,
                        suffix: null },
                    object:
                    { token: 'uri',
                        value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#nil',
                        prefix: null,
                        suffix: null },
                    graph: null },
                { subject: { blank: '_:0' },
                    predicate: { token: 'uri', value: 'a', prefix: null, suffix: null },
                    object: { token: 'uri', value: 'b', prefix: null, suffix: null },
                    graph: null } ],
            done);
    });

    it("Should parse statements with nested empty list",  function(done) {
        shouldParse('<a> <b> (<x> ()).',
            [ { subject: { blank: '_:0' },
                predicate:
                { token: 'uri',
                    value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#first',
                    prefix: null,
                    suffix: null },
                object: { token: 'uri', value: 'x', prefix: null, suffix: null },
                graph: null },
                { subject: { blank: '_:0' },
                    predicate:
                    { token: 'uri',
                        value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#rest',
                        prefix: null,
                        suffix: null },
                    object: { blank: '_:1' },
                    graph: null },
                { subject: { blank: '_:1' },
                    predicate:
                    { token: 'uri',
                        value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#first',
                        prefix: null,
                        suffix: null },
                    object:
                    { token: 'uri',
                        value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#nil',
                        prefix: null,
                        suffix: null },
                    graph: null },
                { subject: { blank: '_:1' },
                    predicate:
                    { token: 'uri',
                        value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#rest',
                        prefix: null,
                        suffix: null },
                    object:
                    { token: 'uri',
                        value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#nil',
                        prefix: null,
                        suffix: null },
                    graph: null },
                { subject: { token: 'uri', value: 'a', prefix: null, suffix: null },
                    predicate: { token: 'uri', value: 'b', prefix: null, suffix: null },
                    object: { blank: '_:0' },
                    graph: null } ],
            done);
    });

    it("Should parse statements with nested non empty list",  function(done) {
        shouldParse('<a> <b> (<x> (<y>)).',
            [ { subject: { blank: '_:0' },
                predicate:
                { token: 'uri',
                    value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#first',
                    prefix: null,
                    suffix: null },
                object: { token: 'uri', value: 'x', prefix: null, suffix: null },
                graph: null },
                { subject: { blank: '_:0' },
                    predicate:
                    { token: 'uri',
                        value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#rest',
                        prefix: null,
                        suffix: null },
                    object: { blank: '_:1' },
                    graph: null },
                { subject: { blank: '_:2' },
                    predicate:
                    { token: 'uri',
                        value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#first',
                        prefix: null,
                        suffix: null },
                    object: { token: 'uri', value: 'y', prefix: null, suffix: null },
                    graph: null },
                { subject: { blank: '_:1' },
                    predicate:
                    { token: 'uri',
                        value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#first',
                        prefix: null,
                        suffix: null },
                    object: { blank: '_:2' },
                    graph: null },
                { subject: { blank: '_:2' },
                    predicate:
                    { token: 'uri',
                        value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#rest',
                        prefix: null,
                        suffix: null },
                    object:
                    { token: 'uri',
                        value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#nil',
                        prefix: null,
                        suffix: null },
                    graph: null },
                { subject: { blank: '_:1' },
                    predicate:
                    { token: 'uri',
                        value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#rest',
                        prefix: null,
                        suffix: null },
                    object:
                    { token: 'uri',
                        value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#nil',
                        prefix: null,
                        suffix: null },
                    graph: null },
                { subject: { token: 'uri', value: 'a', prefix: null, suffix: null },
                    predicate: { token: 'uri', value: 'b', prefix: null, suffix: null },
                    object: { blank: '_:0' },
                    graph: null } ],
            done);
    });

    it("Should parse statement with list containing empty node",  function(done) {
        shouldParse('([]) <a> <b>.',
            [ { subject: { blank: '_:0' },
                predicate:
                { token: 'uri',
                    value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#first',
                    prefix: null,
                    suffix: null },
                object: { blank: '_:1' },
                graph: null },
                { subject: { blank: '_:0' },
                    predicate:
                    { token: 'uri',
                        value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#rest',
                        prefix: null,
                        suffix: null },
                    object:
                    { token: 'uri',
                        value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#nil',
                        prefix: null,
                        suffix: null },
                    graph: null },
                { subject: { blank: '_:0' },
                    predicate: { token: 'uri', value: 'a', prefix: null, suffix: null },
                    object: { token: 'uri', value: 'b', prefix: null, suffix: null },
                    graph: null } ],
            done);
    });

    it("Should parse statements with list containing multiple empty node",  function(done) {
        shouldParse('([] [<x> <y>]) <a> <b>.',
            [ { subject: { blank: '_:0' },
                predicate:
                { token: 'uri',
                    value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#first',
                    prefix: null,
                    suffix: null },
                object: { blank: '_:1' },
                graph: null },
                { subject: { blank: '_:0' },
                    predicate:
                    { token: 'uri',
                        value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#rest',
                        prefix: null,
                        suffix: null },
                    object: { blank: '_:2' },
                    graph: null },
                { subject: { blank: '_:2' },
                    predicate:
                    { token: 'uri',
                        value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#first',
                        prefix: null,
                        suffix: null },
                    object: { blank: '_:3' },
                    graph: null },
                { subject: { blank: '_:3' },
                    predicate: { token: 'uri', value: 'x', prefix: null, suffix: null },
                    object: { token: 'uri', value: 'y', prefix: null, suffix: null },
                    graph: null },
                { subject: { blank: '_:2' },
                    predicate:
                    { token: 'uri',
                        value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#rest',
                        prefix: null,
                        suffix: null },
                    object:
                    { token: 'uri',
                        value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#nil',
                        prefix: null,
                        suffix: null },
                    graph: null },
                { subject: { blank: '_:0' },
                    predicate: { token: 'uri', value: 'a', prefix: null, suffix: null },
                    object: { token: 'uri', value: 'b', prefix: null, suffix: null },
                    graph: null } ],
            done);
    });


    it("Should parse statements with list containing empty node containing list",  function(done) {
        shouldParse('[<a> (<b>)] <c> <d>.',
            [ { subject: { blank: '_:1' },
                predicate:
                { token: 'uri',
                    value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#first',
                    prefix: null,
                    suffix: null },
                object: { token: 'uri', value: 'b', prefix: null, suffix: null },
                graph: null },
                { subject: { blank: '_:1' },
                    predicate:
                    { token: 'uri',
                        value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#rest',
                        prefix: null,
                        suffix: null },
                    object:
                    { token: 'uri',
                        value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#nil',
                        prefix: null,
                        suffix: null },
                    graph: null },
                { subject: { blank: '_:0' },
                    predicate: { token: 'uri', value: 'a', prefix: null, suffix: null },
                    object: { blank: '_:1' },
                    graph: null },
                { subject: { blank: '_:0' },
                    predicate: { token: 'uri', value: 'c', prefix: null, suffix: null },
                    object: { token: 'uri', value: 'd', prefix: null, suffix: null },
                    graph: null } ],
            done);
    });

});