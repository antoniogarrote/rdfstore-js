var Lexicon = require("./../src/lexicon").Lexicon;

exports.testLexiconInterface = function(test) {
    var lexicon = new Lexicon.Lexicon();

    var oid1 = null;
    var oid2 = null;

    var uri = "http://test.com/1";
    var literal = "this is a literal";

    lexicon.registerUri(uri, function(oid){
        oid1 = oid;
    });

    lexicon.registerLiteral(literal, function(oid){
        oid2 = oid;
    });

    lexicon.retrieve(oid1,function(result){
        test.ok(result===uri);
    });

    lexicon.retrieve(oid2,function(result){
        test.ok(result===literal);
    });

    lexicon.retrieve("l34234234234",function(result){
        test.ok(result==null);
    });

    lexicon.retrieve("u34234234234",function(result){
        test.ok(result==null);
    });

    test.done();
}
