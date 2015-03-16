var QueryEngine = require("../src/query_engine").QueryEngine;
var QuadBackend = require("../src/quad_backend").QuadBackend;
var Lexicon = require("../src/lexicon").Lexicon;
var NonSupportedSparqlFeatureError = require("../src/abstract_query_tree").NonSupportedSparqlFeatureError;
var fs = require('fs');
var N3 = require('n3');
var _ = require("lodash");
var async = require("async");
var runW3CTestSpec = require("./w3c_suite_helper").runW3CTestSpec;

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
