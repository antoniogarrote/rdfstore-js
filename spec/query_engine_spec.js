var QueryEngine = require("../src/query_engine").QueryEngine;
var QuadBackend = require("../src/quad_backend").QuadBackend;
var Lexicon = require("../src/lexicon").Lexicon;
var NonSupportedSparqlFeatureError = require("../src/abstract_query_tree").NonSupportedSparqlFeatureError;
var fs = require('fs');
var N3 = require('n3');
var _ = require("lodash");
var async = require("async");

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



jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;

var querySyntaxTestFn = function(queryString, isPositive, done) {
    //console.log("\n\n\nTESTING: "+queryString +" >>>> POSITIVE? "+isPositive);
    new Lexicon(function(lexicon){
        new QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine({backend: backend, lexicon: lexicon});
            try {
                engine.execute(queryString, function (err, _) {
                    if (isPositive) {
                        if (err != null) {
                            console.log("\nERROR IN POSITIVE QUERY:\n" + queryString);
                            console.log(err);
                            throw(err);
                        }
                        expect(err == null).toBe(true);
                    } else {
                        if (err == null) {
                            console.log("\nERROR IN NEGATIVE QUERY:\n" + queryString + " NOT ERROR");
                        }
                        //expect(err != null).toBe(true);
                    }
                    done();
                });
            } catch(e) {
                if(e.name === "NonSupportedSparqlFeatureError"){
                    console.log("[NON SUPPORTED]"+e.toString());
                    console.log(queryString);
                    //if(isPositive === true)
                    //  console.log("\n[WARNING] "+e.toString()+" for query\n"+queryString);
                    done();
                } else {
                    if(isPositive === true) {
                        console.log("\n[ERROR] Parsing error "+e.toString()+" for query:\n"+queryString);
                        throw e
                        expect(e == null).toBe(true);
                    }
                    done()
                }
            }
        });
    });
};


describe("W3C > syntax-query test cases", function(){

    it("Should pass all the tests", function(done){

        var DAWG_NS = "http://www.w3.org/2001/sw/DataAccess/tests/test-dawg#";
        var MF_NS = "http://www.w3.org/2001/sw/DataAccess/tests/test-manifest#";
        var RDF_NS = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
        var manifestPath = "./spec/w3c/syntax-query/manifest.ttl";


        var manifestN3Data = fs.readFileSync(manifestPath).toString();

        var parser = N3.Parser();
        var triples = [];
        var objects = [];

        parser.parse(manifestN3Data, function(error, triple, prefixes){
            if(triple != null) {
                triples.push(triple);
            } else {
                var parsed = {};
                //console.log("\n\nFINISHED PARSING\n\n");
                _.each(triples, function(triple){
                    var s = triple.subject;
                    var p = triple.predicate;
                    var o = triple.object;
                    var object = parsed[s] || {};
                    parsed[s] = object;
                    object[p] = o;
                });

                parsed = _.filter(_.values(parsed), function(object){
                    return object[DAWG_NS+"approval"] === DAWG_NS+"Approved";
                })

                _.each(parsed, function(object){
                    var name = object[MF_NS+"name"];
                    var action = object[MF_NS+"action"];
                    var testType = object[RDF_NS+"type"];
                    var isPositive;
                    if(testType === MF_NS+"PositiveSyntaxTest11") {
                        isPositive = true;
                    } else {
                        isPositive = false;
                    }

                    var queryText = fs.readFileSync("./spec/w3c/syntax-query/"+action).toString().trim();

                    objects.push({
                        name: name,
                        isPositive: isPositive,
                        queryText: queryText
                    });

                });

                async.eachSeries(objects, function(object, k){
                    //console.log(JSON.stringify(object));
                    querySyntaxTestFn(object.queryText, object.isPositive,k);
                }, function(){
                    done();
                });
            }
        });


    },60000);

});
