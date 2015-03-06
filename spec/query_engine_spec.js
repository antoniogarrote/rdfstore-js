var QueryEngine = require("../src/query_engine").QueryEngine;
var QuadBackend = require("../src/quad_backend").QuadBackend;
var Lexicon = require("../src/lexicon").Lexicon;
var NonSupportedSparqlFeatureError = require("../src/abstract_query_tree").NonSupportedSparqlFeatureError;
var fs = require('fs');
var N3 = require('n3');
var _ = require("lodash");
var async = require("async");
var runW3CTestSpec = require("./w3c_suite_helper").runW3CTestSpec;

// basic

describe("test prefix 1", function(){


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

});

describe("W3C > syntax-query test cases", function(){

    it("Should pass all the tests ", function(done){
        runW3CTestSpec("./spec/w3c/syntax-query/manifest.ttl", done);
    },60000);

});

describe("W3C > syntax-update-1 test cases", function(){

    it("Should pass all the tests", function(done){
        runW3CTestSpec("./spec/w3c/syntax-update-1/manifest.ttl", done);
    },60000);

});

describe("W3C > syntax-update-2 test cases", function(){

    it("Should pass all the tests", function(done){
        runW3CTestSpec("./spec/w3c/syntax-update-2/manifest.ttl", done);
    },60000);

});
