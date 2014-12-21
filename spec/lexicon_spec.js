var Lexicon = require("../src/lexicon").Lexicon;
var async = require('async');

describe("Lexicon", function(){

    it("Should be possible to parse literals", function(done){
        new Lexicon(function(lexicon){
            var literal1 = '"this is a test"';
            var parsed = lexicon.parseLiteral(literal1);
            expect(parsed.value).toBe("this is a test");

            var literal2 = '"this is another test"@en';
            var parsed = lexicon.parseLiteral(literal2);
            expect(parsed.value).toBe("this is another test");
            expect(parsed.lang).toBe("en");

            var literal3 = '"this is another test"^^<http://sometypehere.org>';
            var parsed = lexicon.parseLiteral(literal3);
            expect(parsed.value).toBe("this is another test");
            expect(parsed.type).toBe("http://sometypehere.org");

            done();
        });
    });

    it("Should be possible to register tokens and retrieve them", function(done){
        new Lexicon(function(lexicon){

            var oid1,oid2;
            var uri = "http://test.com/1";
            var literal = '"this is a literal"';

            async.seq(function(k){
                lexicon.registerUri(uri,function(oid){
                    oid1 = oid;
                    k();
                });
            }, function(k){
                lexicon.registerLiteral(literal, function(oid){
                    oid2 = oid;
                    k();
                });
            }, function(k){
                lexicon.retrieve(oid1,function(token){
                    expect(uri).toBe(token.value);
                    k();
                })
            }, function(k){
                lexicon.retrieve(oid2, function(token){
                    expect('"'+token.value+'"').toBe(literal);
                    k();
                })
            }, function(k){
                lexicon.retrieve(34234234234, function(token){
                    expect(token).toBe(null);
                    k();
                })
            })(function(){
                done();
            });

        });
    });

    it("Should be possible to unregister tokens", function(done){
        new Lexicon(function(lexicon){

            var oid1;
            var uri = "http://test.com/1";
            var literal = '"this is a literal"';

            async.seq(function(k){
                lexicon.registerUri(uri,function(oid){
                    oid1 = oid;
                    k();
                });
            }, function(k){
                lexicon.retrieve(oid1,function(token){
                    expect(token.value).toBe(uri);
                    k();
                })
            }, function(k){
                lexicon._unregisterTerm('uri', oid1, function(token){
                    k();
                })
            }, function(k){
                lexicon.retrieve(oid1,function(token){
                    expect(token).toBe(null);
                    k();
                })
            })(function(){
                done();
            });

        });
    })

});
