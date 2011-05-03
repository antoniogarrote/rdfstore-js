var Lexicon = require("./../src/lexicon").Lexicon;

exports.testParsingLiterals = function(test){
    new Lexicon.Lexicon(function(lexicon){
            var literal1 = '"this is a test"';
            var parsed = lexicon.parseLiteral(literal1);
            test.ok(parsed.value==="this is a test");

            var literal2 = '"this is another test"@en';
            var parsed = lexicon.parseLiteral(literal2);
            test.ok(parsed.value==="this is another test");
            test.ok(parsed.lang==="en");

            var literal3 = '"this is another test"^^<http://sometypehere.org>';
            var parsed = lexicon.parseLiteral(literal3);
            test.ok(parsed.value==="this is another test");
            test.ok(parsed.type==="http://sometypehere.org");

            test.done();
    });
};

exports.testLexiconInterface = function(test) {
    var lexicon = new Lexicon.Lexicon();

    var oid1 = null;
    var oid2 = null;

    var uri = "http://test.com/1";
    var literal = '"this is a literal"';

    lexicon.registerUri(uri, function(oid){
        oid1 = oid;
    });

    lexicon.registerLiteral(literal, function(oid){
        oid2 = oid;
    });

    lexicon.retrieve(oid1,function(result){
        test.ok(result.value===uri);
    });

    lexicon.retrieve(oid2,function(result){
        test.ok('"'+result.value+'"'===literal);
    });
    
    try {
        lexicon.retrieve(34234234234,function(result){
            test.ok(false);
        });
    } catch (e) {
        test.ok(true);
    }

    try {
        lexicon.retrieve(34234234234,function(result){
            test.ok(false);
        });
    } catch (e) {
        test.ok(true);
    }

    test.done();
}
