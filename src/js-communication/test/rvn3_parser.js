var N3Parser = require("./../src/rvn3_parser.js").RVN3Parser;


exports.testParsing1 = function(test) {

        fs = require('fs');
        fs.readFile("./data/sp2b_10k.n3", function(err, data) {
            if(err) throw err;
            var data = data.toString('utf8');
            console.log("DATA:"+data.length);
            N3Parser.parser.parse(data, 'http://test.com/graph1', function(success, result){
                test.ok(success);
                test.ok(result.length===43);
                for(var i=0; i<result.length; i++) {
                    test.ok(result[i].graph['value'] === 'http://test.com/graph1');
                }
                test.done();
            });
        });
};


exports.testParsing1b = function(test) {

        fs = require('fs');
        fs.readFile("./data/sp2b_10k.n3", function(err, data) {
            if(err) throw err;
            var data = data.toString('utf8');
            console.log("DATA:"+data.length);
            N3Parser.parser.parse(data, function(success, result){
                test.ok(success);
                test.ok(result.length===43);
                for(var i=0; i<result.length; i++) {
                    test.ok(result[i].graph === null);
                }
                test.done();
            });
        });
};

exports.testParsing2 = function(test) {

        fs = require('fs');
        fs.readFile("./data/with_comments.n3", function(err, data) {
            if(err) throw err;
            var data = data.toString('utf8');
            console.log("DATA:"+data.length);
            var result = N3Parser.parser.parse(data, function(err, result) {
                test.ok(result.length===9);
                test.done();
            });
        });

};


var compare = function(compa, compb, test) {
    if(compa == null) {
        test.ok(compb == null);
    } else if(compa.token && compa.token === "uri") {
        test.ok(compa.token === compb.token);
        test.ok(compa.value === compb.value);
    } else if(compa.literal) {
        test.ok(compa.literal === compb.literal);
    } else if(compa.blank) {
        test.ok(compa.blank === compb.blank);
    } else {
        test.ok(false);
    }
};

var compareTriple = function(ta,tb,test) {
    //console.log("TA");
    //console.log(ta);
    //console.log("TB");
    //console.log(tb);
    compare(ta.subject,tb.subject,test);
    compare(ta.predicate,tb.predicate,test);
    compare(ta.object,tb.object,test);
    compare(ta.graph,tb.graph,test);
};

var shouldParse = function(input, output, test) {
    var result = N3Parser.parser.parse(input, function(success, result) {
        //console.log("PARSED? "+success);
        //console.log("------------");
        //console.log(input);
        //console.log("------------");
        //console.log(result);
        //console.log("!!!!!!!!!!!!");
        test.ok(success);
        test.ok(result.constructor === output.constructor);
        test.ok(result.length === output.length);
        for(var i=0; i<result.length; i++) {
            compareTriple(result[i],output[i],test);
        }
        test.done();
    });
};

exports.testParseEmptyString = function(test) {
    shouldParse('',[],test);
};

exports.testWhiteSpaceString = function(test) {
    shouldParse(' \t \n  ',[],test);
};

exports.testSingleTriple = function(test) {
    shouldParse('<a> <b> <c>.',[ { subject: { token: 'uri', value: 'a', prefix: null, suffix: null },
                                   predicate: { token: 'uri', value: 'b', prefix: null, suffix: null },
                                   object: { token: 'uri', value: 'c', prefix: null, suffix: null },
                                   graph: null } ],test);
};

exports.testThreeTriples = function(test) {
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
                test);
};

exports.testParseLiteral = function(test) {
    shouldParse('<a> <b> "string".',
                [ { subject: { token: 'uri', value: 'a', prefix: null, suffix: null },
                    predicate: { token: 'uri', value: 'b', prefix: null, suffix: null },
                    object: { literal: '"string"' },
                    graph: null } ],
                test);
};

exports.testParseNumericLiteral = function(test) {
    shouldParse('<a> <b> 3.0.',
                [ { subject: { token: 'uri', value: 'a', prefix: null, suffix: null },
                    predicate: { token: 'uri', value: 'b', prefix: null, suffix: null },
                    object: { literal: '"3.0"^^<http://www.w3.org/2001/XMLSchema#decimal>' },
                    graph: null } ],
                test);
};


exports.testParseLiteralAndLangCode = function(test) {
    shouldParse('<a> <b> "string"@en.',
                [ { subject: { token: 'uri', value: 'a', prefix: null, suffix: null },
                    predicate: { token: 'uri', value: 'b', prefix: null, suffix: null },
                    object: { literal: '"string"@en' },
                    graph: null } ],
                test);
};

exports.testParseLiteralAndLangCodeNormalizeLang = function(test) {
    shouldParse('<a> <b> "string"@EN.',
                [ { subject: { token: 'uri', value: 'a', prefix: null, suffix: null },
                    predicate: { token: 'uri', value: 'b', prefix: null, suffix: null },
                    object: { literal: '"string"@en' },
                    graph: null } ],
                test);
};

exports.testParseLiteralAndURIType = function(test) {
    shouldParse('<a> <b> "string"^^<type>.',
                [ { subject: { token: 'uri', value: 'a', prefix: null, suffix: null },
                    predicate: { token: 'uri', value: 'b', prefix: null, suffix: null },
                    object: { literal: '"string"^^<type>' },
                    graph: null } ],
                test);
};

exports.testParseLiteralAndQNameType = function(test) {
    shouldParse('@prefix x: <y#>. <a> <b> "string"^^x:z.',
                [ { subject: { token: 'uri', value: 'a', prefix: null, suffix: null },
                    predicate: { token: 'uri', value: 'b', prefix: null, suffix: null },
                    object: { literal: '"string"^^<y#z>' },
                    graph: null } ],
                test);
};

exports.testParseTriplesWithSPARQLPrefixes = function(test) {
    shouldParse('PREFIX : <#>\n' + 'PrEfIX a: <a#> ' + ':x a:a a:b.',
                [ { subject: { token: 'uri', value: '#x', prefix: null, suffix: null },
                    predicate: { token: 'uri', value: 'a#a', prefix: null, suffix: null },
                    object: { token: 'uri', value: 'a#b', prefix: null, suffix: null },
                    graph: null } ],
                test);
};

exports.testParseStatementsWithSharedSubjects = function(test) {
    shouldParse('<a> <b> <c>;\n<d> <e>.',
                [ { subject: { token: 'uri', value: 'a', prefix: null, suffix: null },
                    predicate: { token: 'uri', value: 'b', prefix: null, suffix: null },
                    object: { token: 'uri', value: 'c', prefix: null, suffix: null },
                    graph: null },
                  { subject: { token: 'uri', value: 'a', prefix: null, suffix: null },
                    predicate: { token: 'uri', value: 'd', prefix: null, suffix: null },
                    object: { token: 'uri', value: 'e', prefix: null, suffix: null },
                    graph: null } ],
                test);
};

exports.testParseStatementsWithSharedSubjectsAndTrailingSemicolon = function(test) {
    shouldParse('<a> <b> <c>;\n<d> <e>;\n.',
                [ { subject: { token: 'uri', value: 'a', prefix: null, suffix: null },
                    predicate: { token: 'uri', value: 'b', prefix: null, suffix: null },
                    object: { token: 'uri', value: 'c', prefix: null, suffix: null },
                    graph: null },
                  { subject: { token: 'uri', value: 'a', prefix: null, suffix: null },
                    predicate: { token: 'uri', value: 'd', prefix: null, suffix: null },
                    object: { token: 'uri', value: 'e', prefix: null, suffix: null },
                    graph: null } ],
                test);
};

exports.testParseStatementsWithSharedSubjectsAndMultipleSemicolons = function(test) {
    shouldParse('<a> <b> <c>;;\n<d> <e>.',
                [ { subject: { token: 'uri', value: 'a', prefix: null, suffix: null },
                    predicate: { token: 'uri', value: 'b', prefix: null, suffix: null },
                    object: { token: 'uri', value: 'c', prefix: null, suffix: null },
                    graph: null },
                  { subject: { token: 'uri', value: 'a', prefix: null, suffix: null },
                    predicate: { token: 'uri', value: 'd', prefix: null, suffix: null },
                    object: { token: 'uri', value: 'e', prefix: null, suffix: null },
                    graph: null } ],
                test);
};


exports.testParseStatementsWithSharedSubjectsAndPredicates= function(test) {
    shouldParse('<a> <b> <c>, <d>.',
                [ { subject: { token: 'uri', value: 'a', prefix: null, suffix: null },
                    predicate: { token: 'uri', value: 'b', prefix: null, suffix: null },
                    object: { token: 'uri', value: 'c', prefix: null, suffix: null },
                    graph: null },
                  { subject: { token: 'uri', value: 'a', prefix: null, suffix: null },
                    predicate: { token: 'uri', value: 'b', prefix: null, suffix: null },
                    object: { token: 'uri', value: 'd', prefix: null, suffix: null },
                    graph: null } ],
                test);
};


exports.testParseStatementsWithNamedBlankNodes = function(test) {
    shouldParse('_:a <b> _:c.',
                [ { subject: { blank: '_:0' },
                    predicate: { token: 'uri', value: 'b', prefix: null, suffix: null },
                    object: { blank: '_:1' },
                    graph: null } ],
                test);
};


exports.testParseStatementsWithEmptyBlankNodes = function(test) {
    shouldParse('[] <b> [].',
                [ { subject: { blank: '_:0' },
                    predicate: { token: 'uri', value: 'b', prefix: null, suffix: null },
                    object: { blank: '_:1' },
                    graph: null } ],
                test);
};


exports.testParseStatementsWithUnnamedBlankNodesInSubject = function(test) {
    shouldParse('[<a> <b>] <c> <d>.',
                [ { subject: { blank: '_:0' },
                    predicate: { token: 'uri', value: 'a', prefix: null, suffix: null },
                    object: { token: 'uri', value: 'b', prefix: null, suffix: null },
                    graph: null },
                  { subject: { blank: '_:0' },
                    predicate: { token: 'uri', value: 'c', prefix: null, suffix: null },
                    object: { token: 'uri', value: 'd', prefix: null, suffix: null },
                    graph: null } ],
                test);
};

exports.testParseStatementsWithUnnamedBlankNodesInObject = function(test) {
    shouldParse('<a> <b> [<c> <d>].',
                [ { subject: { blank: '_:0' },
                    predicate: { token: 'uri', value: 'c', prefix: null, suffix: null },
                    object: { token: 'uri', value: 'd', prefix: null, suffix: null },
                    graph: null },
                  { subject: { token: 'uri', value: 'a', prefix: null, suffix: null },
                    predicate: { token: 'uri', value: 'b', prefix: null, suffix: null },
                    object: { blank: '_:0' },
                    graph: null } ],
                test);
};


exports.testParseStatementsWithUnnamedBlankNodesWithStringObject = function(test) {
    shouldParse('<a> <b> [<c> "x"].',
                [ { subject: { blank: '_:0' },
                    predicate: { token: 'uri', value: 'c', prefix: null, suffix: null },
                    object: { literal: '"x"' },
                    graph: null },
                  { subject: { token: 'uri', value: 'a', prefix: null, suffix: null },
                    predicate: { token: 'uri', value: 'b', prefix: null, suffix: null },
                    object: { blank: '_:0' },
                    graph: null } ],
                test);
};


exports.testParseMultiStatementBlankNode = function(test) {
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
                test);
};


exports.testParseMultiStatementBlankNodeWithTrailingSemicolon = function(test) {
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
                test);
};


exports.testParseStatementWithNestedBlankNodesSubject = function(test) {
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
                test);
};

exports.testParseStatementsWithNestedBlankNodesObject = function(test) {
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
                test);
};

exports.testParseEmptyListSubject = function(test) {
    shouldParse('() <a> <b>.',
                [ { subject: 
                    { token: 'uri',
                      value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#nil',
                      prefix: null,
                      suffix: null },
                    predicate: { token: 'uri', value: 'a', prefix: null, suffix: null },
                    object: { token: 'uri', value: 'b', prefix: null, suffix: null },
                    graph: null } ],
                test);
};


exports.testParseEmptyListObject = function(test) {
    shouldParse('<a> <b> ().',
                [ { subject: { token: 'uri', value: 'a', prefix: null, suffix: null },
                    predicate: { token: 'uri', value: 'b', prefix: null, suffix: null },
                    object: 
                    { token: 'uri',
                      value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#nil',
                      prefix: null,
                      suffix: null },
                    graph: null } ],
                test);
};

exports.testParseSingleElementListObject = function(test) {
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
                test);
};

exports.testParseSingleElementListSubject = function(test) {
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
                test);
};

exports.testParseStatementsWithMultiElementListSubject = function(test) {
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
                test);
};

exports.testParseStatementsWithMultiElementListObject = function(test) {
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
                test);
};


exports.testParseStatementsWithMultiElementListObject = function(test) {
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
                test);
};

exports.testParseStatementsWithNestedEmptyList = function(test) {
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
                test);
};

exports.testParseStatementsWithNestedNonEmptyList = function(test) {
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
                test);
};

exports.testParseStatementsWithListContainingEmptyNode = function(test) {
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
                test);
};

exports.testParseStatementsWithListContainingMultipleEmptyNode = function(test) {
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
                test);
};


exports.testParseStatementsWithListContainingEmptyNodeContainingList = function(test) {
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
                test);
};


// 10 MB Test

/*
exports.testParsing3 = function(test) {

        fs = require('fs');

    var inp = fs.createReadStream("/Users/antonio/Desktop/sp2b_10k.n3");
    inp.setEncoding('utf8');
    var inptext = '';

    inp.on('data', function (data) {
	inptext += data;
    });
    inp.on('end', function (close) {
	data = inptext;
        N3Parser.parser.parse(data, function(err, result){
            console.log("FINISHED");
            console.log(result.length+" triples parsed");
            test.ok(result.length===103030);
            test.done();
        });
    });
    

};
*/