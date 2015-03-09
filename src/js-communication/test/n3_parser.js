var N3Parser = require("./../src/n3_parser.js").N3Parser;


exports.testParsing1 = function(test) {

        fs = require('fs');
        fs.readFile("./data/sp2b_10k.n3", function(err, data) {
            if(err) throw err;
            var data = data.toString('utf8');
            //console.log("DATA:"+data.length);
            var result = N3Parser.parser.parse(data);
            //console.log(result);
            //console.log(result.length+" triples parsed");
            test.ok(result.length===43);
            test.done();
        });

};

exports.testParsing2 = function(test) {

        fs = require('fs');
        fs.readFile("./data/with_comments.n3", function(err, data) {
            if(err) throw err;
            var data = data.toString('utf8');
            //console.log("DATA:"+data.length);
            var result = N3Parser.parser.parse(data);
            test.ok(result.length===9);
            test.done();
        });

};

//var compare = function(compa, compb, test) {
//    if(compa == null) {
//        test.ok(compb == null);
//    } else if(compa.token && compa.token === "uri") {
//        test.ok(compa.token === compb.token);
//        test.ok(compa.value === compb.value);
//    }
//};
// 
//var compareTriple = function(ta,tb,test) {
//    console.log("TA");
//    console.log(ta);
//    console.log("TB");
//    console.log(tb);
//    compare(ta.subject,tb.subject,test);
//    compare(ta.predicate,tb.predicate,test);
//    compare(ta.object,tb.object,test);
//    compare(ta.graph,tb.graph,test);
//};
// 
//var shouldParse = function(input, output, test) {
//    var result = N3Parser.parser.parse(input);
//    console.log(input);
//    console.log(result);
//    test.ok(result.constructor === output.constructor);
//    test.ok(result.length === output.length);
//    for(var i=0; i<result.length; i++) {
//        compareTriple(result[i],output[i],test);
//    }
//    test.done();
//};
// 
//exports.testParseEmptyString = function(test) {
//    shouldParse('',[],test);
//};
// 
//exports.testWhiteSpaceString = function(test) {
//    shouldParse(' \t \n  ',[],test);
//};

//exports.testSingleTriple = function(test) {
//    shouldParse('<a> <b> <c>.',[ { subject: { token: 'uri', value: 'a', prefix: null, suffix: null },
//                                   predicate: { token: 'uri', value: 'b', prefix: null, suffix: null },
//                                   object: { token: 'uri', value: 'c', prefix: null, suffix: null },
//                                   graph: null } ],test);
//};
// 
//exports.testThreeTriples = function(test) {
//    shouldParse('<a> <b> <c>.\n<d> <e> <f>.\n<g> <h> <i>.',
//                [ { subject: { token: 'uri', value: 'a', prefix: null, suffix: null },
//                    predicate: { token: 'uri', value: 'b', prefix: null, suffix: null },
//                    object: { token: 'uri', value: 'c', prefix: null, suffix: null },
//                    graph: null },
//                  { subject: { token: 'uri', value: 'd', prefix: null, suffix: null },
//                    predicate: { token: 'uri', value: 'e', prefix: null, suffix: null },
//                    object: { token: 'uri', value: 'f', prefix: null, suffix: null },
//                    graph: null },
//                  { subject: { token: 'uri', value: 'g', prefix: null, suffix: null },
//                    predicate: { token: 'uri', value: 'h', prefix: null, suffix: null },
//                    object: { token: 'uri', value: 'i', prefix: null, suffix: null },
//                    graph: null } ],
//                test);
//};
// 
//exports.testParseLiteral = function(test) {
//    shouldParse('<a> <b> "string".',
//                [],
//                test);
//};



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
        var result = N3Parser.parser.parse(data);
        console.log("FINISHED");
        console.log(result.length+" triples parsed");
        test.ok(result.length===103030);
        test.done();
    });
    

};
*/