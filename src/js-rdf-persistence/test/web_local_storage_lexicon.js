var Lexicon = require("./../src/web_local_storage_lexicon").WebLocalStorageLexicon;

exports.testParsingLiterals = function(test){
    new Lexicon.Lexicon(function(lexicon){
            var literal1 = '"this is a test"';
            var parsed = lexicon.parseLiteral(literal1);
            test.ok(parsed.value==="this is a test");
            var literal2 = '"this is another test"@en';
	    parsed = lexicon.parseLiteral(literal2);
            test.ok(parsed.value==="this is another test");
            test.ok(parsed.lang==="en");
            var literal3 = '"this is another test"^^<http://sometypehere.org>';
            parsed = lexicon.parseLiteral(literal3);
            test.ok(parsed.value==="this is another test");
            test.ok(parsed.type==="http://sometypehere.org");
            test.done();
    }, "test");
};

exports.testLexiconInterface = function(test) {
    var lexicon = new Lexicon.Lexicon(function(){},"test");

    var oid1 = null;
    var oid2 = null;

    var uri = "http://test.com/1";
    var literal = '"this is a literal"';

    oid1= lexicon.registerUri(uri);

    oid2 = lexicon.registerLiteral(literal);

    test.ok(uri===lexicon.retrieve(oid1).value);

    test.ok('"'+lexicon.retrieve(oid2).value+'"'===literal);
    
    try {
        lexicon.retrieve(34234234234);
        test.ok(false);
    } catch (e) {
        test.ok(true);
    }

    try {
        lexicon.retrieve(34234234234);
        test.ok(false)
    } catch (e) {
        test.ok(true);
    }

    test.done();
}
