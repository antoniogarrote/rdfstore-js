var QueryEngine = require("./../src/query_engine").QueryEngine;
var QuadBackend = require("./../../js-rdf-persistence/src/quad_backend").QuadBackend;
var Lexicon = require("./../../js-rdf-persistence/src/lexicon").Lexicon;

// basic

exports.testBasePrefix1 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            engine.execute('PREFIX ns: <http://example.org/ns#>  PREFIX x:  <http://example.org/x/> PREFIX z:  <http://example.org/x/#> INSERT DATA { x:x ns:p  "d:x ns:p" . x:x x:p   "x:x x:p" . z:x z:p   "z:x z:p" . }', function(success, result){
                console.log("\r\n\r\n");
                engine.execute('BASE <http://example.org/x/> PREFIX : <> SELECT * WHERE { :x ?p ?v }', function(success, results){
                    test.ok(success === true);
                    test.ok(results.length === 2);
                    
                    for(var i=0; i< results.length; i++) {
                        var result = results[i];
                        if(result.p.value === "http://example.org/ns#p") {
                            test.ok(result.v.value === "d:x ns:p");
                        } else if(result.p.value === "http://example.org/x/p") {
                            test.ok(result.v.value === "x:x x:p");
                        } else {
                            result.ok(false);
                        }
                    }
                    test.done();
                });
            });
        });
    });
};


exports.testBasePrefix2 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            engine.execute('PREFIX ns: <http://example.org/ns#>  PREFIX x:  <http://example.org/x/> PREFIX z:  <http://example.org/x/#> INSERT DATA { x:x ns:p  "d:x ns:p" . x:x x:p   "x:x x:p" . z:x z:p   "z:x z:p" . }', function(success, result){

                engine.execute('BASE <http://example.org/x/> PREFIX : <#> SELECT * WHERE { :x ?p ?v }', function(success, results){
                    test.ok(success === true);
                    test.ok(results.length === 1);
                    
                    test.ok(results[0].v.value === "z:x z:p");
                    test.ok(results[0].p.value === "http://example.org/x/#p");
                    test.done();
                });
            });
        });
    });
};

exports.testBasePrefix3 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            engine.execute('PREFIX ns: <http://example.org/ns#>  PREFIX x:  <http://example.org/x/> PREFIX z:  <http://example.org/x/#> INSERT DATA { x:x ns:p  "d:x ns:p" . x:x x:p   "x:x x:p" . z:x z:p   "z:x z:p" . }', function(success, result){

                engine.execute('PREFIX ns: <http://example.org/ns#> PREFIX x:  <http://example.org/x/> SELECT * WHERE { x:x ns:p ?v }', function(success, results){
                    test.ok(success === true);
                    test.ok(results.length === 1);
                    
                    test.ok(results[0].v.value === "d:x ns:p");
                    test.done();
                });
            });
        });
    });
};

exports.testBasePrefix4 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            engine.execute('PREFIX ns: <http://example.org/ns#>  PREFIX x:  <http://example.org/x/> PREFIX z:  <http://example.org/x/#> INSERT DATA { x:x ns:p  "d:x ns:p" . x:x x:p   "x:x x:p" . z:x z:p   "z:x z:p" . }', function(success, result){

                engine.execute('BASE <http://example.org/x/> SELECT * WHERE { <x> <p> ?v }', function(success, results){
                    test.ok(success === true);
                    test.ok(results.length === 1);
                    
                    test.ok(results[0].v.value === "x:x x:p");
                    test.done();
                });
            });
        });
    });
};


exports.testBasePrefix5 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            engine.execute('PREFIX ns: <http://example.org/ns#>  PREFIX x:  <http://example.org/x/> PREFIX z:  <http://example.org/x/#> INSERT DATA { x:x ns:p  "d:x ns:p" . x:x x:p   "x:x x:p" . z:x z:p   "z:x z:p" . }', function(success, result){

                engine.execute('BASE <http://example.org/x/> SELECT * WHERE { <#x> <#p> ?v }', function(success, results){
                    test.ok(success === true);
                    test.ok(results.length === 1);
                    
                    test.ok(results[0].v.value === "z:x z:p");
                    test.done();
                });
            });
        });
    });
};

exports.testList1 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            engine.execute('PREFIX : <http://example.org/ns#> PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> INSERT DATA { :x :list0 () . :x :list1 ("1"^^xsd:integer) . :x :list2 ("11"^^xsd:integer "22"^^xsd:integer) . :x :list3 ("111"^^xsd:integer "222"^^xsd:integer "333"^^xsd:integer) .}', function(success, result){

                engine.execute('PREFIX : <http://example.org/ns#>\
                                SELECT ?p\
                                WHERE {\
                                  :x ?p () .\
                                }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 1);
                                    test.ok(results[0].p.value === "http://example.org/ns#list0");
                                    test.done();
                });
            });
        });
    });
}

exports.testList2 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            engine.execute('PREFIX : <http://example.org/ns#> PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> INSERT DATA { :x :list0 () . :x :list1 ("1"^^xsd:integer) . :x :list2 ("11"^^xsd:integer "22"^^xsd:integer) . :x :list3 ("111"^^xsd:integer "222"^^xsd:integer "333"^^xsd:integer) .}', function(success, result){

                engine.execute('PREFIX : <http://example.org/ns#>\
                                SELECT ?p\
                                WHERE {\
                                  :x ?p (1) .\
                                }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 1);
                                    test.ok(results[0].p.value === "http://example.org/ns#list1");
                                    test.done();
                });
            });
        });
    });
}

exports.testList3 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            engine.execute('PREFIX : <http://example.org/ns#> PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> INSERT DATA { :x :list0 () . :x :list1 ("1"^^xsd:integer) . :x :list2 ("11"^^xsd:integer "22"^^xsd:integer) . :x :list3 ("111"^^xsd:integer "222"^^xsd:integer "333"^^xsd:integer) .}', function(success, result){

                engine.execute('PREFIX : <http://example.org/ns#>\
                                SELECT ?p ?v\
                                WHERE {\
                                  :x ?p (?v) .\
                                }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 1);
                                    test.ok(results[0].p.value === "http://example.org/ns#list1");
                                    test.ok(results[0].v.value === "1");
                                    test.done();
                });
            });
        });
    });
}

exports.testList4 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            engine.execute('PREFIX : <http://example.org/ns#> PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> INSERT DATA { :x :list0 () . :x :list1 ("1"^^xsd:integer) . :x :list2 ("11"^^xsd:integer "22"^^xsd:integer) . :x :list3 ("111"^^xsd:integer "222"^^xsd:integer "333"^^xsd:integer) .}', function(success, result){

                engine.execute('PREFIX : <http://example.org/ns#>\
                                SELECT ?p ?v ?w\
                                WHERE {\
                                  :x ?p (?v ?w) .\
                                }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 1);
                                    test.ok(results[0].p.value === "http://example.org/ns#list2");
                                    test.ok(results[0].v.value === "11");
                                    test.ok(results[0].w.value === "22");
                                    test.done();
                });
            });
        });
    });
}

exports.testQuotes1 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/ns#> INSERT DATA { :x1 :p1 "x" . :x2 :p2 """x \
y""" . :x3 :p3 """x \
y"""^^:someType .}';
            engine.execute(query, function(success, result){
                engine.execute("PREFIX : <http://example.org/ns#>\
                                SELECT ?x\
                                WHERE {\
                                  ?x ?p '''x''' .}", function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 1);
                                    test.ok(results[0].x.value === "http://example.org/ns#x1");
                                    test.done();
                });
            });
        });
    });
}

exports.testQuotes2 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/ns#> INSERT DATA { :x1 :p1 "x" . :x2 :p2 """x \
y""" . :x3 :p3 """x \
y"""^^:someType .}';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX : <http://example.org/ns#>\
                                SELECT ?x\
                                WHERE {\
                                  ?x ?p """x""" .}', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 1);
                                    test.ok(results[0].x.value === "http://example.org/ns#x1");
                                    test.done();
                });
            });
        });
    });
}

exports.testQuotes3 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/ns#> INSERT DATA { :x1 :p1 "x" . :x2 :p2 """x \
y""" . :x3 :p3 """x \
y"""^^:someType .}';
            engine.execute(query, function(success, result){
                engine.execute("PREFIX : <http://example.org/ns#>\
                                SELECT ?x\
                                WHERE {\
                                  ?x ?p '''x \
y''' .}", function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 1);
                                    test.ok(results[0].x.value === "http://example.org/ns#x2");
                                    test.done();
                });
            });
        });
    });
}

exports.testQuotes4 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/ns#> INSERT DATA { :x1 :p1 "x" . :x2 :p2 """x \
y""" . :x3 :p3 """x \
y"""^^:someType .}';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX : <http://example.org/ns#>\
                                SELECT ?x\
                                WHERE {\
                                  ?x ?p """x \
y"""^^:someType .}', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 1);
                                    test.ok(results[0].x.value === "http://example.org/ns#x3");
                                    test.done();
                });
            });
        });
    });
}


exports.testTerm1 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/ns#> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                         INSERT DATA {\
                           :x :p1 "true"^^xsd:boolean .\
                           :x :p2 "false"^^xsd:boolean .\
                           :x rdf:type :C . :x :n1  "123.0"^^xsd:decimal .\
                           :x :n2  "456."^^xsd:decimal .\
                           :x :n3 "+5"^^xsd:integer .\
                           :x :n4 "-18"^^xsd:integer . }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX :     <http://example.org/ns#>\
                                PREFIX xsd:  <http://www.w3.org/2001/XMLSchema#>\
                                SELECT * { :x ?p true . }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 1);
                                    test.ok(results[0].p.value === "http://example.org/ns#p1");
                                    test.done();
                });
            });
        });
    });
}


exports.testTerm2 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/ns#> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                         INSERT DATA {\
                           :x :p1 "true"^^xsd:boolean .\
                           :x :p2 "false"^^xsd:boolean .\
                           :x rdf:type :C . :x :n1  "123.0"^^xsd:decimal .\
                           :x :n2  "456."^^xsd:decimal .\
                           :x :n3 "+5"^^xsd:integer .\
                           :x :n4 "-18"^^xsd:integer . }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX :     <http://example.org/ns#>\
                                PREFIX xsd:  <http://www.w3.org/2001/XMLSchema#>\
                                SELECT * { :x ?p false . }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 1);
                                    test.ok(results[0].p.value === "http://example.org/ns#p2");
                                    test.done();
                });
            });
        });
    });
}

exports.testTerm3 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/ns#> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                         INSERT DATA {\
                           :x :p1 "true"^^xsd:boolean .\
                           :x :p2 "false"^^xsd:boolean .\
                           :x rdf:type :C .\
                           :x :n1  "123.0"^^xsd:decimal .\
                           :x :n2  "456."^^xsd:decimal .\
                           :x :n3 "+5"^^xsd:integer .\
                           :x :n4 "-18"^^xsd:integer . }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX :     <http://example.org/ns#>\
                                PREFIX xsd:  <http://www.w3.org/2001/XMLSchema#>\
                                SELECT * { :x a ?C . }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 1);
                                    test.ok(results[0].C.value === "http://example.org/ns#C");
                                    test.done();
                });
            });
        });
    });
}

exports.testTerm4 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/ns#> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                         INSERT DATA {\
                           :x :p1 "true"^^xsd:boolean .\
                           :x :p2 "false"^^xsd:boolean .\
                           :x rdf:type :C .\
                           :x :n1  "123.0"^^xsd:decimal .\
                           :x :n2  "456."^^xsd:decimal .\
                           :x :n3 "+5"^^xsd:integer .\
                           :x :n4 "-18"^^xsd:integer . }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX :     <http://example.org/ns#>\
                                PREFIX xsd:  <http://www.w3.org/2001/XMLSchema#>\
                                SELECT * { :x ?p 123.0 }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 1);
                                    test.ok(results[0].p.value === "http://example.org/ns#n1");
                                    test.done();
                });
            });
        });
    });
}

exports.testTerm5 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/ns#> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                         INSERT DATA {\
                           :x :p1 "true"^^xsd:boolean .\
                           :x :p2 "false"^^xsd:boolean .\
                           :x rdf:type :C .\
                           :x :n1  "123.0"^^xsd:decimal .\
                           :x :n2  "456."^^xsd:decimal .\
                           :x :n3 "+5"^^xsd:integer .\
                           :x :n4 "-18"^^xsd:integer . }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX :     <http://example.org/ns#>\
                                PREFIX xsd:  <http://www.w3.org/2001/XMLSchema#>\
                                SELECT * { :x ?p 123.0. }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 1);
                                    test.ok(results[0].p.value === "http://example.org/ns#n1");
                                    test.done();
                });
            });
        });
    });
}

exports.testTerm6 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/ns#> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                         INSERT DATA {\
                           :x :p1 "true"^^xsd:boolean .\
                           :x :p2 "false"^^xsd:boolean .\
                           :x rdf:type :C .\
                           :x :n1  "123.0"^^xsd:decimal .\
                           :x :n2  "456."^^xsd:decimal .\
                           :x :n3 "+5"^^xsd:integer .\
                           :x :n4 "-18"^^xsd:integer . }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX :     <http://example.org/ns#>\
                                PREFIX xsd:  <http://www.w3.org/2001/XMLSchema#>\
                                SELECT * { :x ?p 456. }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 1);
                                    test.ok(results[0].p.value === "http://example.org/ns#n2");
                                    test.done();
                });
            });
        });
    });
}

exports.testTerm7 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/ns#> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                         INSERT DATA {\
                           :x :p1 "true"^^xsd:boolean .\
                           :x :p2 "false"^^xsd:boolean .\
                           :x rdf:type :C .\
                           :x :n1  "123.0"^^xsd:decimal .\
                           :x :n2  "456."^^xsd:decimal .\
                           :x :n3 "+5"^^xsd:integer .\
                           :x :n4 "-18"^^xsd:integer . }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX :     <http://example.org/ns#>\
                                PREFIX xsd:  <http://www.w3.org/2001/XMLSchema#>\
                                SELECT * { :x ?p 456. . }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 1);
                                    test.ok(results[0].p.value === "http://example.org/ns#n2");
                                    test.done();
                });
            });
        });
    });
}


exports.testTerm8 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/ns#> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                         INSERT DATA {\
                           :x :p1 "true"^^xsd:boolean .\
                           :x :p2 "false"^^xsd:boolean .\
                           :x rdf:type :C .\
                           :x :n1  "123.0"^^xsd:decimal .\
                           :x :n2  "456."^^xsd:decimal .\
                           :x :n3 "+5"^^xsd:integer .\
                           :x :n4 "-18"^^xsd:integer . }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX :     <http://example.org/ns#>\
                                PREFIX xsd:  <http://www.w3.org/2001/XMLSchema#>\
                                SELECT * { :x ?p +5 . }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 1);
                                    test.ok(results[0].p.value === "http://example.org/ns#n3");
                                    test.done();
                });
            });
        });
    });
}

exports.testTerm9 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/ns#> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                         INSERT DATA {\
                           :x :p1 "true"^^xsd:boolean .\
                           :x :p2 "false"^^xsd:boolean .\
                           :x rdf:type :C .\
                           :x :n1  "123.0"^^xsd:decimal .\
                           :x :n2  "456."^^xsd:decimal .\
                           :x :n3 "+5"^^xsd:integer .\
                           :x :n4 "-18"^^xsd:integer . }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX :     <http://example.org/ns#>\
                                PREFIX xsd:  <http://www.w3.org/2001/XMLSchema#>\
                                SELECT * { :x ?p -18 . }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 1);
                                    test.ok(results[0].p.value === "http://example.org/ns#n4");
                                    test.done();
                });
            });
        });
    });
}

exports.testVar1 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/ns#> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA {\
                           :x :p1 "1"^^xsd:integer .\
                           :x :p2 "2"^^xsd:integer . }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX :     <http://example.org/ns#>\
                                PREFIX xsd:  <http://www.w3.org/2001/XMLSchema#>\
                                SELECT * { :x ?p $v . }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 2);
                                    if(results[0].p.value === "http://example.org/ns#p2") {
                                        test.ok(results[0].p.value === "http://example.org/ns#p2");
                                        test.ok(results[0].v.value === '2');
                                        test.ok(results[1].p.value === "http://example.org/ns#p1");
                                        test.ok(results[1].v.value === '1');
                                    } else {
                                        test.ok(results[0].p.value === "http://example.org/ns#p1");
                                        test.ok(results[0].v.value === '1');
                                        test.ok(results[1].p.value === "http://example.org/ns#p2");
                                        test.ok(results[1].v.value === '2');
                                    }
                                    test.done();
                });
            });
        });
    });
}

exports.testVar2 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/ns#> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA {\
                           :x :p1 "1"^^xsd:integer .\
                           :x :p2 "2"^^xsd:integer . }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX :     <http://example.org/ns#>\
                                PREFIX xsd:  <http://www.w3.org/2001/XMLSchema#>\
                                SELECT * { :x ?p $v . :x ?p ?v }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 2);
                                    if(results[0].p.value === "http://example.org/ns#p2") {
                                        test.ok(results[0].p.value === "http://example.org/ns#p2");
                                        test.ok(results[0].v.value === '2');
                                        test.ok(results[1].p.value === "http://example.org/ns#p1");
                                        test.ok(results[1].v.value === '1');
                                    } else {
                                        test.ok(results[0].p.value === "http://example.org/ns#p1");
                                        test.ok(results[0].v.value === '1');
                                        test.ok(results[1].p.value === "http://example.org/ns#p2");
                                        test.ok(results[1].v.value === '2');
                                    }
                                    test.done();
                });
            });
        });
    });
}


exports.testBaseBGPNoMatch = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            engine.execute('PREFIX : <http://example.org/> PREFIX foaf: <http://xmlns.com/foaf/0.1/> INSERT DATA { :john a foaf:Person ; foaf:name "John Smith" }', function(success, result){
                engine.execute('PREFIX : <http://example.org/>\
                                PREFIX foaf: <http://xmlns.com/foaf/0.1/>\
                                SELECT ?x\
                                WHERE {\
                                  ?x foaf:name "John Smith" ;\
                                       a foaf:Womble .\
                                }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 0);
                                    test.done();
                });
            });
        });
    });
}

exports.testSPOO = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/ns#> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA {\
                           :x :p1 "1"^^xsd:integer .\
                           :x :p1 "2"^^xsd:integer . }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX :     <http://example.org/ns#>\
                                PREFIX xsd:  <http://www.w3.org/2001/XMLSchema#>\
                                SELECT ?s WHERE { ?s :p1 1, 2 . }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 1);
                                    test.ok(results[0].s.value === "http://example.org/ns#x");
                                    test.done();
                });
            });
        });
    });
}

exports.testPrefixName1 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/ns#> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA {\
                           :x :p1 "1"^^xsd:integer .\
                           :x :p1 "2"^^xsd:integer . }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX ex:     <http://example.org/ns#x>\
                                SELECT ?p WHERE { ex: ?p 1 . }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 1);
                                    test.ok(results[0].p.value === "http://example.org/ns#p1");
                                    test.done();
                });
            });
        });
    });
}

// boolena-effective-value

exports.testDAWGBooleanLiteral = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/ns#> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA {\
                           :x1 :p    "1"^^xsd:integer .\
                           :x2 :p    "foo" .\
                           :x3 :p    "0.01"^^xsd:double .\
                           :x4 :p    "true"^^xsd:boolean .\
                           :y1 :p    "0"^^xsd:integer .\
                           :y2 :p    "0.0"^^xsd:double .\
                           :y3 :p    "" .\
                           :y4 :p    "false"^^xsd:boolean .\
                           }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX : <http://example.org/ns#>\
                                SELECT ?x WHERE {\
                                    ?x :p "foo" .\
                                    FILTER (true) .\
                                }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 1);
                                    test.ok(results[0].x.value === "http://example.org/ns#x2");
                                    test.done();
                });
            });
        });
    });
}

exports.testDAWGBEV1 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/ns#> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA {\
                           :x1 :p    "1"^^xsd:integer .\
                           :x2 :p    "foo" .\
                           :x3 :p    "0.01"^^xsd:double .\
                           :x4 :p    "true"^^xsd:boolean .\
                           :y1 :p    "0"^^xsd:integer .\
                           :y2 :p    "0.0"^^xsd:double .\
                           :y3 :p    "" .\
                           :y4 :p    "false"^^xsd:boolean .\
                           }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX  xsd: <http://www.w3.org/2001/XMLSchema#>\
                                PREFIX  : <http://example.org/ns#>\
                                SELECT  ?a\
                                WHERE\
                                    { ?a :p ?v . \
                                      FILTER (?v) .\
                                    }', function(success, results){
                                        test.ok(success === true);
                                        test.ok(results.length === 4);
                                        var acum = [];
                                        for(var i=0; i<results.length; i++) {
                                            acum.push(results[i].a.value);
                                        }

                                        acum.sort();
                                        test.ok(acum[0]==="http://example.org/ns#x1");
                                        test.ok(acum[1]==="http://example.org/ns#x2");
                                        test.ok(acum[2]==="http://example.org/ns#x3");
                                        test.ok(acum[3]==="http://example.org/ns#x4");
                                        test.done();
                });
            });
        });
    });
}

exports.testDAWGBEV2 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/ns#> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA {\
                           :x1 :p    "1"^^xsd:integer .\
                           :x2 :p    "foo" .\
                           :x3 :p    "0.01"^^xsd:double .\
                           :x4 :p    "true"^^xsd:boolean .\
                           :y1 :p    "0"^^xsd:integer .\
                           :y2 :p    "0.0"^^xsd:double .\
                           :y3 :p    "" .\
                           :y4 :p    "false"^^xsd:boolean .\
                           }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX  xsd: <http://www.w3.org/2001/XMLSchema#>\
                                PREFIX  : <http://example.org/ns#>\
                                SELECT  ?a\
                                WHERE\
                                    { ?a :p ?v . \
                                      FILTER (! ?v ) .\
                                    }', function(success, results){
                                        test.ok(success === true);
                                        test.ok(results.length === 4);
                                        var acum = [];
                                        for(var i=0; i<results.length; i++) {
                                            acum.push(results[i].a.value);
                                        }

                                        acum.sort();
                                        test.ok(acum[0]==="http://example.org/ns#y1");
                                        test.ok(acum[1]==="http://example.org/ns#y2");
                                        test.ok(acum[2]==="http://example.org/ns#y3");
                                        test.ok(acum[3]==="http://example.org/ns#y4");
                                        test.done();
                });
            });
        });
    });
}

exports.testDAWGBEV3 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/ns#> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA {\
                           :x1 :p    "1"^^xsd:integer .\
                           :x2 :p    "foo" .\
                           :x3 :p    "0.01"^^xsd:double .\
                           :x4 :p    "true"^^xsd:boolean .\
                           :y1 :p    "0"^^xsd:integer .\
                           :y2 :p    "0.0"^^xsd:double .\
                           :y3 :p    "" .\
                           :y4 :p    "false"^^xsd:boolean .\
                           }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX  xsd: <http://www.w3.org/2001/XMLSchema#>\
                                PREFIX  : <http://example.org/ns#>\
                                SELECT  ?a\
                                WHERE\
                                    { ?a :p ?v . \
                                      FILTER ("true"^^xsd:boolean && ?v) .\
                                    }', function(success, results){
                                        test.ok(success === true);
                                        test.ok(results.length === 4);
                                        var acum = [];
                                        for(var i=0; i<results.length; i++) {
                                            acum.push(results[i].a.value);
                                        }

                                        acum.sort();
                                        test.ok(acum[0]==="http://example.org/ns#x1");
                                        test.ok(acum[1]==="http://example.org/ns#x2");
                                        test.ok(acum[2]==="http://example.org/ns#x3");
                                        test.ok(acum[3]==="http://example.org/ns#x4");
                                        test.done();
                });
            });
        });
    });
}



exports.testDAWGBEV4 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/ns#> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA {\
                           :x1 :p    "1"^^xsd:integer .\
                           :x2 :p    "foo" .\
                           :x3 :p    "0.01"^^xsd:double .\
                           :x4 :p    "true"^^xsd:boolean .\
                           :y1 :p    "0"^^xsd:integer .\
                           :y2 :p    "0.0"^^xsd:double .\
                           :y3 :p    "" .\
                           :y4 :p    "false"^^xsd:boolean .\
                           }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX  xsd: <http://www.w3.org/2001/XMLSchema#>\
                                PREFIX  : <http://example.org/ns#>\
                                SELECT  ?a\
                                WHERE\
                                    { ?a :p ?v . \
                                      FILTER ("false"^^xsd:boolean || ?v) .\
                                    }', function(success, results){
                                        test.ok(success === true);
                                        test.ok(results.length === 4);
                                        var acum = [];
                                        for(var i=0; i<results.length; i++) {
                                            acum.push(results[i].a.value);
                                        }

                                        acum.sort();
                                        test.ok(acum[0]==="http://example.org/ns#x1");
                                        test.ok(acum[1]==="http://example.org/ns#x2");
                                        test.ok(acum[2]==="http://example.org/ns#x3");
                                        test.ok(acum[3]==="http://example.org/ns#x4");
                                        test.done();
                });
            });
        });
    });
}

exports.testDAWGBEV5 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/ns#> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA {\
                         :x1 :p    "1"^^xsd:integer .\
                         :x2 :p    "foo" .\
                         :x3 :p    "0.01"^^xsd:double .\
                         :x4 :p    "true"^^xsd:boolean .\
                         :y1 :p    "0"^^xsd:integer .\
                         :y2 :p    "0.0"^^xsd:double .\
                         :y3 :p    "" .\
                         :y4 :p    "false"^^xsd:boolean .\
                         :x1 :q    "true"^^xsd:boolean .\
                         :x2 :q    "false"^^xsd:boolean .\
                         :x3 :q    "foo"^^:unknown .\
                           }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX  xsd: <http://www.w3.org/2001/XMLSchema#>\
                                PREFIX  : <http://example.org/ns#>\
                                SELECT  ?a ?w\
                                WHERE\
                                    { ?a :p ?v . \
                                      OPTIONAL\
                                        { ?a :q ?w } . \
                                      FILTER (?w) .\
                                    }', function(success, results){
                                        test.ok(success === true);
                                        test.ok(results.length === 1);
                                        test.ok(results[0].a.value==="http://example.org/ns#x1");
                                        test.done();
                });
            });
        });
    });
}



exports.testDAWGBEV6 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/ns#> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA {\
                         :x1 :p    "1"^^xsd:integer .\
                         :x2 :p    "foo" .\
                         :x3 :p    "0.01"^^xsd:double .\
                         :x4 :p    "true"^^xsd:boolean .\
                         :y1 :p    "0"^^xsd:integer .\
                         :y2 :p    "0.0"^^xsd:double .\
                         :y3 :p    "" .\
                         :y4 :p    "false"^^xsd:boolean .\
                         :x1 :q    "true"^^xsd:boolean .\
                         :x2 :q    "false"^^xsd:boolean .\
                         :x3 :q    "foo"^^:unknown .\
                           }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX  xsd: <http://www.w3.org/2001/XMLSchema#>\
                                PREFIX  : <http://example.org/ns#>\
                                SELECT  ?a ?w\
                                WHERE\
                                    { ?a :p ?v . \
                                      OPTIONAL\
                                        { ?a :q ?w } . \
                                      FILTER ( ! ?w ) .\
                                    }', function(success, results){
                                        test.ok(success === true);
                                        test.ok(results.length === 1);
                                        test.ok(results[0].a.value==="http://example.org/ns#x2");
                                        test.done();
                });
            });
        });
    });
}



// Castings

exports.testCastStr = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/> \
                         INSERT DATA {\
                           :iri :p :z .\
                           :str :p "string" .\
                           :fltdbl :p "-10.2E3" .\
                           :decimal :p "+33.3300" .\
                           :int :p "13" .\
                           :dT :p "2002-10-10T17:00:00Z" .\
                           :bool :p "true" .\
                           }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX : <http://example.org/>\
                                PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                                PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                                SELECT ?s WHERE {\
                                    ?s :p ?v .\
                                    FILTER(DATATYPE(xsd:string(?v)) = xsd:string) .\
                                }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 7);
                                    test.done();
                });
            });
        });
    });
}


exports.testCastFlt = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/> \
                         INSERT DATA {\
                           :iri :p :z .\
                           :str :p "string" .\
                           :fltdbl :p "-10.2E3" .\
                           :decimal :p "+33.3300" .\
                           :int :p "13" .\
                           :dT :p "2002-10-10T17:00:00Z" .\
                           :bool :p "true" .\
                           }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX : <http://example.org/>\
                                PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                                PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                                SELECT ?s WHERE {\
                                    ?s :p ?v .\
                                    FILTER(DATATYPE(xsd:float(?v)) = xsd:float) .\
                                }', function(success, results){

                                    test.ok(success === true);
                                    var acum = [];
                                    for(var i=0; i< results.length; i++) {
                                        acum.push(results[i].s.value);
                                    }
                                    acum.sort();
                                    test.ok(acum[0]=="http://example.org/decimal");
                                    test.ok(acum[1]=="http://example.org/fltdbl");
                                    test.ok(acum[2]=="http://example.org/int");
                                    
                                    test.done();
                });
            });
        });
    });
}

exports.testCastDbl = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/> \
                         INSERT DATA {\
                           :iri :p :z .\
                           :str :p "string" .\
                           :fltdbl :p "-10.2E3" .\
                           :decimal :p "+33.3300" .\
                           :int :p "13" .\
                           :dT :p "2002-10-10T17:00:00Z" .\
                           :bool :p "true" .\
                           }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX : <http://example.org/>\
                                PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                                PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                                SELECT ?s WHERE {\
                                    ?s :p ?v .\
                                    FILTER(DATATYPE(xsd:double(?v)) = xsd:double) .\
                                }', function(success, results){

                                    test.ok(success === true);
                                    var acum = [];
                                    for(var i=0; i< results.length; i++) {
                                        acum.push(results[i].s.value);
                                    }
                                    acum.sort();
                                    test.ok(acum[0]=="http://example.org/decimal");
                                    test.ok(acum[1]=="http://example.org/fltdbl");
                                    test.ok(acum[2]=="http://example.org/int");
                                    
                                    test.done();
                });
            });
        });
    });
}

exports.testCastDec = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/> \
                         INSERT DATA {\
                           :iri :p :z .\
                           :str :p "string" .\
                           :fltdbl :p "-10.2E3" .\
                           :decimal :p "+33.3300" .\
                           :int :p "13" .\
                           :dT :p "2002-10-10T17:00:00Z" .\
                           :bool :p "true" .\
                           }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX : <http://example.org/>\
                                PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                                PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                                SELECT ?s WHERE {\
                                    ?s :p ?v .\
                                    FILTER(DATATYPE(xsd:decimal(?v)) = xsd:decimal) .\
                                }', function(success, results){

                                    test.ok(success === true);
                                    var acum = [];
                                    for(var i=0; i< results.length; i++) {
                                        acum.push(results[i].s.value);
                                    }
                                    acum.sort();
                                    test.ok(acum[0]=="http://example.org/decimal");
                                    test.ok(acum[1]=="http://example.org/int");
                                    
                                    test.done();
                });
            });
        });
    });
}

exports.testCastInt = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/> \
                         INSERT DATA {\
                           :iri :p :z .\
                           :str :p "string" .\
                           :fltdbl :p "-10.2E3" .\
                           :decimal :p "+33.3300" .\
                           :int :p "13" .\
                           :dT :p "2002-10-10T17:00:00Z" .\
                           :bool :p "true" .\
                           }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX : <http://example.org/>\
                                PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                                PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                                SELECT ?s WHERE {\
                                    ?s :p ?v .\
                                    FILTER(DATATYPE(xsd:integer(?v)) = xsd:integer) .\
                                }', function(success, results){

                                    test.ok(success === true);
                                    test.ok(results.length === 1);
                                    test.ok(results[0].s.value=="http://example.org/int");
                                    
                                    test.done();
                });
            });
        });
    });
}

exports.testCastDT = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/> \
                         INSERT DATA {\
                           :iri :p :z .\
                           :str :p "string" .\
                           :fltdbl :p "-10.2E3" .\
                           :decimal :p "+33.3300" .\
                           :int :p "13" .\
                           :dT :p "2002-10-10T17:00:00Z" .\
                           :bool :p "true" .\
                           }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX : <http://example.org/>\
                                PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                                PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                                SELECT ?s WHERE {\
                                    ?s :p ?v .\
                                    FILTER(DATATYPE(xsd:dateTime(?v)) = xsd:dateTime) .\
                                }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 1);
                                    test.ok(results[0].s.value=="http://example.org/dT");
                                    test.done();
                });
            });
        });
    });
}

exports.testCastBool = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/> \
                         INSERT DATA {\
                           :iri :p :z .\
                           :str :p "string" .\
                           :fltdbl :p "-10.2E3" .\
                           :decimal :p "+33.3300" .\
                           :int :p "13" .\
                           :dT :p "2002-10-10T17:00:00Z" .\
                           :bool :p "true" .\
                           }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX : <http://example.org/>\
                                PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                                PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                                SELECT ?s WHERE {\
                                    ?s :p ?v .\
                                    FILTER(DATATYPE(xsd:boolean(?v)) = xsd:boolean) .\
                                }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 1);
                                    test.ok(results[0].s.value=="http://example.org/bool");
                                    test.done();
                });
            });
        });
    });
}


// expr builtin

exports.testExprBuiltinIsLiteral1 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA {\
                         :x1 :p  "string" .\
                         :x2 :p  "string"^^xsd:string .\
                         :x3 :p  "string"@en .\
                         :x4 :p  "lex"^^:unknownType .\
                         :x5 :p  "1234"^^xsd:integer .\
                         :x6 :p  <http://example/iri> .\
                         :x7 :p  _:bNode .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX  xsd: <http://www.w3.org/2001/XMLSchema#>\
                                PREFIX  : <http://example/>\
                                SELECT  ?x \
                                WHERE\
                                    { ?x :p ?v . \
                                      FILTER ISLITERAL(?v) .\
                                    }', function(success, results){
                                        test.ok(success === true);
                                        acum = [];
                                        for(var i=0; i<results.length; i++) {
                                            acum.push(results[i].x.value);
                                        }

                                        acum.sort();
                                        test.ok(acum[0] === 'http://example/x1')
                                        test.ok(acum[1] === 'http://example/x2')
                                        test.ok(acum[2] === 'http://example/x3')
                                        test.ok(acum[3] === 'http://example/x4')
                                        test.ok(acum[4] === 'http://example/x5')
                                        test.done();
                });
            });
        });
    });
}




exports.testExprBuiltinStr1 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/things#> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA {\
                           :xi1 :p  "1"^^xsd:integer .\
                           :xi2 :p  "1"^^xsd:integer .\
                           :xi3 :p  "01"^^xsd:integer .\
                           :xd1 :p  "1.0e0"^^xsd:double .\
                           :xd2 :p  "1.0"^^xsd:double .\
                           :xd3 :p  "1"^^xsd:double .\
                           :xt1 :p  "zzz"^^:myType .\
                           :xp1 :p  "zzz" .\
                           :xp2 :p  "1" .\
                           :xp2 :p  "" .\
                           :xu :p  :z .\
                           :xb :p  _:a .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX  xsd: <http://www.w3.org/2001/XMLSchema#>\
                                PREFIX  : <http://example.org/things#>\
                                SELECT  ?x ?v\
                                WHERE\
                                    { ?x :p ?v . \
                                      FILTER ( STR(?v) = "1" ) .\
                                    }', function(success, results){
                                        test.ok(success === true);
                                        acum = [];
                                        for(var i=0; i<results.length; i++) {
                                            acum.push(results[i].x.value);
                                        }
 
                                        acum.sort();
                                        test.ok(acum[0] === 'http://example.org/things#xd3')
                                        test.ok(acum[1] === 'http://example.org/things#xi1')
                                        test.ok(acum[2] === 'http://example.org/things#xi2')
                                        test.ok(acum[3] === 'http://example.org/things#xp2')
                                        test.done();
                });
            });
        });
    });
}

exports.testExprBuiltinStr2 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/things#> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA {\
                           :xi1 :p  "1"^^xsd:integer .\
                           :xi2 :p  "1"^^xsd:integer .\
                           :xi3 :p  "01"^^xsd:integer .\
                           :xd1 :p  "1.0e0"^^xsd:double .\
                           :xd2 :p  "1.0"^^xsd:double .\
                           :xd3 :p  "1"^^xsd:double .\
                           :xt1 :p  "zzz"^^:myType .\
                           :xp1 :p  "zzz" .\
                           :xp2 :p  "1" .\
                           :xp2 :p  "" .\
                           :xu :p  :z .\
                           :xb :p  _:a .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX  xsd: <http://www.w3.org/2001/XMLSchema#>\
                                PREFIX  : <http://example.org/things#>\
                                SELECT  ?x ?v\
                                WHERE\
                                    { ?x :p ?v . \
                                      FILTER ( STR(?v) = "01" ) .\
                                    }', function(success, results){
                                        test.ok(success === true);
                                        test.ok(results.length === 1);
                                        test.ok(results[0].x.value === 'http://example.org/things#xi3')
                                        test.ok(results[0].v.value === '01')
                                        test.done();
                });
            });
        });
    });
}

exports.testExprBuiltinStr3 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/things#> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA {\
                           :xi1 :p  "1"^^xsd:integer .\
                           :xi2 :p  "1"^^xsd:integer .\
                           :xi3 :p  "01"^^xsd:integer .\
                           :xd1 :p  "1.0e0"^^xsd:double .\
                           :xd2 :p  "1.0"^^xsd:double .\
                           :xd3 :p  "1"^^xsd:double .\
                           :xt1 :p  "zzz"^^:myType .\
                           :xp1 :p  "zzz" .\
                           :xp2 :p  "1" .\
                           :xp2 :p  "" .\
                           :xu :p  :z .\
                           :xb :p  _:a .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX  xsd: <http://www.w3.org/2001/XMLSchema#>\
                                PREFIX  : <http://example.org/things#>\
                                SELECT  ?x ?v\
                                WHERE\
                                    { ?x :p ?v . \
                                      FILTER ( STR(?v) = "zzz" ) .\
                                    }', function(success, results){
                                        test.ok(success === true);

                                        test.ok(results.length === 2);
                                        acum = [];

                                        for(var i=0; i<results.length; i++) {
                                            acum.push(results[i].x.value);
                                        }

                                        acum.sort();
                                        test.ok(acum[0] === 'http://example.org/things#xp1')
                                        test.ok(acum[1] === 'http://example.org/things#xt1')
                                        test.done();
                });
            });
        });
    });
}


exports.testExprBuiltinStr4 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/things#> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA {\
                           :xi1 :p  "1"^^xsd:integer .\
                           :xi2 :p  "1"^^xsd:integer .\
                           :xi3 :p  "01"^^xsd:integer .\
                           :xd1 :p  "1.0e0"^^xsd:double .\
                           :xd2 :p  "1.0"^^xsd:double .\
                           :xd3 :p  "1"^^xsd:double .\
                           :xt1 :p  "zzz"^^:myType .\
                           :xp1 :p  "zzz" .\
                           :xp2 :p  "1" .\
                           :xp2 :p  "" .\
                           :xu :p  :z .\
                           :xb :p  _:a .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX  xsd: <http://www.w3.org/2001/XMLSchema#>\
                                PREFIX  : <http://example.org/things#>\
                                SELECT  ?x ?v\
                                WHERE\
                                    { ?x :p ?v . \
                                      FILTER ( STR(?v) = "" ) .\
                                    }', function(success, results){
                                        test.ok(success === true);
                                        test.ok(results.length === 1);
                                        test.ok(results[0].x.value === 'http://example.org/things#xp2')
                                        test.ok(results[0].v.value === '')
                                        test.done();
                });
            });
        });
    });
}

exports.testExprBuiltinBlank1 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/things#> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA {\
                           :xi1 :p  "1"^^xsd:integer .\
                           :xi2 :p  "1"^^xsd:integer .\
                           :xi3 :p  "01"^^xsd:integer .\
                           :xd1 :p  "1.0e0"^^xsd:double .\
                           :xd2 :p  "1.0"^^xsd:double .\
                           :xd3 :p  "1"^^xsd:double .\
                           :xt1 :p  "zzz"^^:myType .\
                           :xp1 :p  "zzz" .\
                           :xp2 :p  "1" .\
                           :xp2 :p  "" .\
                           :xu :p  :z .\
                           :xb :p  _:a .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX  xsd: <http://www.w3.org/2001/XMLSchema#>\
                                PREFIX  : <http://example.org/things#>\
                                SELECT  ?x ?v\
                                WHERE\
                                    { ?x :p ?v . \
                                      FILTER ISBLANK(?v) .\
                                    }', function(success, results){
                                        test.ok(success === true);
                                        test.ok(results.length === 1);
                                        test.ok(results[0].x.value === 'http://example.org/things#xb')
                                        test.done();
                });
            });
        });
    });
}


exports.testExprBuiltinDatatype1 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/things#> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA {\
                           :xi1 :p  "1"^^xsd:integer .\
                           :xi2 :p  "1"^^xsd:integer .\
                           :xi3 :p  "01"^^xsd:integer .\
                           :xd1 :p  "1.0e0"^^xsd:double .\
                           :xd2 :p  "1.0"^^xsd:double .\
                           :xd3 :p  "1"^^xsd:double .\
                           :xt1 :p  "zzz"^^:myType .\
                           :xp1 :p  "zzz" .\
                           :xp2 :p  "1" .\
                           :xp2 :p  "" .\
                           :xu :p  :z .\
                           :xb :p  _:a .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX  xsd: <http://www.w3.org/2001/XMLSchema#>\
                                PREFIX  : <http://example.org/things#>\
                                SELECT  ?x ?v\
                                WHERE\
                                    { ?x :p ?v . \
                                      FILTER ( DATATYPE(?v) = xsd:double ) .\
                                    }', function(success, results){
                                        test.ok(success === true);
                                        test.ok(results.length === 3);
                                        acum = [];

                                        for(var i=0; i<results.length; i++) {
                                            acum.push(results[i].x.value);
                                        }

                                        acum.sort();
                                        test.ok(acum[0] === 'http://example.org/things#xd1')
                                        test.ok(acum[1] === 'http://example.org/things#xd2')
                                        test.ok(acum[2] === 'http://example.org/things#xd3')
                                        test.done();
                });
            });
        });
    });
}

exports.testExprBuiltinDatatype2 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA {\
                         :x1 :p  "string" .\
                         :x2 :p  "string"^^xsd:string .\
                         :x3 :p  "string"@en .\
                         :x4 :p  "lex"^^:unknownType .\
                         :x5 :p  "1234"^^xsd:integer .\
                         :x6 :p  <http://example/iri> .\
                         :x7 :p  _:bNode .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX  xsd: <http://www.w3.org/2001/XMLSchema#>\
                                PREFIX  : <http://example/>\
                                SELECT  ?x\
                                WHERE\
                                    { ?x :p ?v . \
                                      FILTER( DATATYPE(?v) != <http://example/NotADataTypeIRI> ).\
                                    }', function(success, results){
                                        test.ok(success === true);
                                        test.ok(results.length === 4);
                                        acum = [];
                                        for(var i=0; i<results.length; i++) {
                                            acum.push(results[i].x.value);
                                        }

                                        acum.sort();
                                        
                                        test.ok(acum[0] === 'http://example/x1')
                                        test.ok(acum[1] === 'http://example/x2')
                                        test.ok(acum[2] === 'http://example/x4')
                                        test.ok(acum[3] === 'http://example/x5')
                                        test.done();
                });
            });
        });
    });
}

exports.testExprBuiltinDatatype3 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA {\
                         :x1 :p  "string" .\
                         :x2 :p  "string"^^xsd:string .\
                         :x3 :p  "string"@en .\
                         :x4 :p  "lex"^^:unknownType .\
                         :x5 :p  "1234"^^xsd:integer .\
                         :x6 :p  <http://example/iri> .\
                         :x7 :p  _:bNode .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX  xsd: <http://www.w3.org/2001/XMLSchema#>\
                                PREFIX  : <http://example/>\
                                SELECT  ?x\
                                WHERE\
                                    { ?x :p ?v . \
                                      FILTER( DATATYPE(?v) = xsd:string ).\
                                    }', function(success, results){
                                        test.ok(success === true);
                                        
                                        test.ok(results.length === 2);
                                        acum = [];
                                        for(var i=0; i<results.length; i++) {
                                            acum.push(results[i].x.value);
                                        }

                                        acum.sort();
                                        
                                        test.ok(acum[0] === 'http://example/x1')
                                        test.ok(acum[1] === 'http://example/x2')
                                        test.done();
                });
            });
        });
    });
}

exports.testExprBuiltinLang1 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA {\
                         :x1 :p  "string" .\
                         :x2 :p  "string"^^xsd:string .\
                         :x3 :p  "string"@en .\
                         :x4 :p  "lex"^^:unknownType .\
                         :x5 :p  "1234"^^xsd:integer .\
                         :x6 :p  <http://example/iri> .\
                         :x7 :p  _:bNode .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute("PREFIX  xsd: <http://www.w3.org/2001/XMLSchema#>\
                                PREFIX  : <http://example/>\
                                SELECT  ?x\
                                WHERE\
                                    { ?x :p ?v . \
                                      FILTER( LANG(?v) != '@NotALangTag@' ).\
                                    }", function(success, results){
                                        test.ok(success === true);
                                        
                                        test.ok(results.length === 5);
                                        acum = [];
                                        for(var i=0; i<results.length; i++) {
                                            acum.push(results[i].x.value);
                                        }

                                        acum.sort();
                                        
                                        test.ok(acum[0] === 'http://example/x1')
                                        test.ok(acum[1] === 'http://example/x2')
                                        test.ok(acum[2] === 'http://example/x3')
                                        test.ok(acum[3] === 'http://example/x4')
                                        test.ok(acum[4] === 'http://example/x5')
                                        test.done();
                });
            });
        });
    });
}


exports.testExprBuiltinLang2 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA {\
                         :x1 :p  "string" .\
                         :x2 :p  "string"^^xsd:string .\
                         :x3 :p  "string"@en .\
                         :x4 :p  "lex"^^:unknownType .\
                         :x5 :p  "1234"^^xsd:integer .\
                         :x6 :p  <http://example/iri> .\
                         :x7 :p  _:bNode .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute("PREFIX  xsd: <http://www.w3.org/2001/XMLSchema#>\
                                PREFIX  : <http://example/>\
                                SELECT  ?x\
                                WHERE\
                                    { ?x :p ?v . \
                                      FILTER( LANG(?v) = '' ).\
                                    }", function(success, results){
                                        test.ok(success === true);

                                        test.ok(results.length === 4);
                                        acum = [];
                                        for(var i=0; i<results.length; i++) {
                                            acum.push(results[i].x.value);
                                        }

                                        acum.sort();
                                        
                                        test.ok(acum[0] === 'http://example/x1')
                                        test.ok(acum[1] === 'http://example/x2')
                                        test.ok(acum[2] === 'http://example/x4')
                                        test.ok(acum[3] === 'http://example/x5')
                                        test.done();
                });
            });
        });
    });
}

exports.testExprBuiltinLang3 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA {\
                         :x1 :p  "string" .\
                         :x2 :p  "string"^^xsd:string .\
                         :x3 :p  "string"@en .\
                         :x4 :p  "lex"^^:unknownType .\
                         :x5 :p  "1234"^^xsd:integer .\
                         :x6 :p  <http://example/iri> .\
                         :x7 :p  _:bNode .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX  xsd: <http://www.w3.org/2001/XMLSchema#>\
                                PREFIX  : <http://example/>\
                                SELECT  ?x\
                                WHERE\
                                    { ?x :p "string"@EN .\
                                    }', function(success, results){
                                        test.ok(success === true);
                                        test.ok(results.length === 1);
                                        test.ok(results[0].x.value === 'http://example/x3')
                                        test.done();
                });
            });
        });
    });
}

exports.testExprBuiltinisURI1 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/things#> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA {\
                           :xi1 :p  "1"^^xsd:integer .\
                           :xi2 :p  "1"^^xsd:integer .\
                           :xi3 :p  "01"^^xsd:integer .\
                           :xd1 :p  "1.0e0"^^xsd:double .\
                           :xd2 :p  "1.0"^^xsd:double .\
                           :xd3 :p  "1"^^xsd:double .\
                           :xt1 :p  "zzz"^^:myType .\
                           :xp1 :p  "zzz" .\
                           :xp2 :p  "1" .\
                           :xp2 :p  "" .\
                           :xu :p  :z .\
                           :xb :p  _:a .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX  xsd: <http://www.w3.org/2001/XMLSchema#>\
                                PREFIX  : <http://example.org/things#>\
                                SELECT  ?x ?v\
                                WHERE\
                                    { ?x :p ?v . \
                                      FILTER ( ISURI(?v) ) .\
                                    }', function(success, results){
                                        test.ok(success === true);
                                        test.ok(results.length === 1);
                                        acum = [];

                                        for(var i=0; i<results.length; i++) {
                                            acum.push(results[i].v.value);
                                        }

                                        acum.sort();
                                        test.ok(acum[0] === 'http://example.org/things#z')
                                        test.done();
                });
            });
        });
    });
}


exports.testExprBuiltinisIRI1 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/things#> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA {\
                           :xi1 :p  "1"^^xsd:integer .\
                           :xi2 :p  "1"^^xsd:integer .\
                           :xi3 :p  "01"^^xsd:integer .\
                           :xd1 :p  "1.0e0"^^xsd:double .\
                           :xd2 :p  "1.0"^^xsd:double .\
                           :xd3 :p  "1"^^xsd:double .\
                           :xt1 :p  "zzz"^^:myType .\
                           :xp1 :p  "zzz" .\
                           :xp2 :p  "1" .\
                           :xp2 :p  "" .\
                           :xu :p  :z .\
                           :xb :p  _:a .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX  xsd: <http://www.w3.org/2001/XMLSchema#>\
                                PREFIX  : <http://example.org/things#>\
                                SELECT  ?x ?v\
                                WHERE\
                                    { ?x :p ?v . \
                                      FILTER ( ISIRI(?v) ) .\
                                    }', function(success, results){
                                        test.ok(success === true);
                                        test.ok(results.length === 1);
                                        test.ok(results[0].v.value === 'http://example.org/things#z')
                                        test.ok(results[0].x.value === 'http://example.org/things#xu')
                                        test.done();
                });
            });
        });
    });
}


exports.testExprBuiltinLangMatches1 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/#> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA {\
                            :x :p1 "abc" .\
                            :x :p2 <abc> .\
                            :x :p3 "abc"@en .\
                            :x :p4 "abc"@en-gb .\
                            :x :p5 "abc"@fr .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX  xsd: <http://www.w3.org/2001/XMLSchema#>\
                                PREFIX  : <http://example.org/#>\
                                SELECT  *\
                                WHERE\
                                    { :x ?p ?v . FILTER LANGMATCHES( LANG(?v), "en-GB") .\
                                    }', function(success, results){
                                        test.ok(success === true);
                                        test.ok(results.length === 1);
                                        test.ok(results[0].v.value === 'abc');
                                        test.ok(results[0].p.value === 'http://example.org/#p4');
                                        test.done();
                });
            });
        });
    });
}

exports.testExprBuiltinLangMatches2 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/#> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA {\
                            :x :p1 "abc" .\
                            :x :p2 <abc> .\
                            :x :p3 "abc"@en .\
                            :x :p4 "abc"@en-gb .\
                            :x :p5 "abc"@fr .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX  xsd: <http://www.w3.org/2001/XMLSchema#>\
                                PREFIX  : <http://example.org/#>\
                                SELECT  *\
                                WHERE\
                                    { :x ?p ?v . FILTER LANGMATCHES(LANG(?v), "en") . }', 
                               function(success, results){
                                   test.ok(success === true);
                                   test.ok(results.length === 2);
                                   acum = [];
                                   for(var i=0; i<results.length; i++) {
                                       acum.push(results[i].p.value);
                                   }
                                   acum.sort();
                                   test.ok(acum[0]  === 'http://example.org/#p3');
                                   test.ok(acum[1]  === 'http://example.org/#p4');
                                   test.done();
                });
            });
        });
    });
}


exports.testExprBuiltinLangMatches2 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/#> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA {\
                            :x :p1 "abc" .\
                            :x :p2 <abc> .\
                            :x :p3 "abc"@en .\
                            :x :p4 "abc"@en-gb .\
                            :x :p5 "abc"@fr .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX  xsd: <http://www.w3.org/2001/XMLSchema#>\
                                PREFIX  : <http://example.org/#>\
                                SELECT  *\
                                WHERE\
                                    { :x ?p ?v . FILTER LANGMATCHES(LANG(?v), "en") . }', 
                               function(success, results){
                                   test.ok(success === true);
                                   test.ok(results.length === 2);
                                   acum = [];
                                   for(var i=0; i<results.length; i++) {
                                       acum.push(results[i].p.value);
                                   }
                                   acum.sort();
                                   test.ok(acum[0]  === 'http://example.org/#p3');
                                   test.ok(acum[1]  === 'http://example.org/#p4');
                                   test.done();
                });
            });
        });
    });
}

exports.testExprBuiltinLangMatches3 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/#> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA {\
                            :x :p1 "abc" .\
                            :x :p2 <abc> .\
                            :x :p3 "abc"@en .\
                            :x :p4 "abc"@en-gb .\
                            :x :p5 "abc"@fr .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX  xsd: <http://www.w3.org/2001/XMLSchema#>\
                                PREFIX  : <http://example.org/#>\
                                SELECT  *\
                                WHERE\
                                    { :x ?p ?v .  FILTER LANGMATCHES(LANG(?v), "*") . }', 
                               function(success, results){

                                   test.ok(success === true);
                                   test.ok(results.length === 3);
                                   acum = [];
                                   for(var i=0; i<results.length; i++) {
                                       acum.push(results[i].p.value);
                                   }
                                   acum.sort();
                                   test.ok(acum[0]  === 'http://example.org/#p3');
                                   test.ok(acum[1]  === 'http://example.org/#p4');
                                   test.ok(acum[2]  === 'http://example.org/#p5');
                                   test.done();
                });
            });
        });
    });
}


exports.testExprBuiltinLangMatches4 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/#> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA {\
                            :x :p1 "abc" .\
                            :x :p2 <abc> .\
                            :x :p3 "abc"@en .\
                            :x :p4 "abc"@en-gb .\
                            :x :p5 "abc"@fr .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX  xsd: <http://www.w3.org/2001/XMLSchema#>\
                                PREFIX  : <http://example.org/#>\
                                SELECT  *\
                                WHERE\
                                    { :x ?p ?v .  FILTER( ! LANGMATCHES(LANG(?v), "*") ). }', 
                               function(success, results){
                                   test.ok(success === true);
                                   test.ok(results.length === 1);
                                   test.ok(results[0].p.value === "http://example.org/#p1");
                                   test.done();
                });
            });
        });
    });
}


exports.testExprBuiltinLangMatchesBasic = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/#> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA {\
                           :x :p3 "abc"@de .\
                           :x :p4 "abc"@de-de .\
                           :x :p5 "abc"@de-latn-de .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX  xsd: <http://www.w3.org/2001/XMLSchema#>\
                                PREFIX  : <http://example.org/#>\
                                SELECT  *\
                                WHERE\
                                    { :x ?p ?v .  FILTER LANGMATCHES(LANG(?v), "de-de") . }', 
                               function(success, results){
                                   test.ok(success === true);
                                   test.ok(results.length === 1);
                                   test.ok(results[0].p.value === "http://example.org/#p4");
                                   test.done();
                });
            });
        });
    });
}


exports.testExprBuiltinLangCaseInsensitiveEq = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/> \
                         INSERT DATA {\
                           :x2 :p "xyz"@en .\
                           :x3 :p "xyz"@EN .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX  : <http://example/>\
                                SELECT  * \
                                WHERE\
                                    { \
                                      ?x1 :p ?v1 .\
                                      ?x2 :p ?v2 .\
                                      FILTER ( ?v1 = ?v2 )\
                                    }', 
                               function(success, results){
                                   test.ok(success === true);
                                   test.ok(results.length === 4);
                                   test.done();
                });
            });
        });
    });
}

exports.testExprBuiltinLangCaseInsensitiveNe = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/> \
                         INSERT DATA {\
                           :x2 :p "xyz"@en .\
                           :x3 :p "xyz"@EN .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX  : <http://example/>\
                                SELECT  * \
                                WHERE\
                                    { \
                                      ?x1 :p ?v1 .\
                                      ?x2 :p ?v2 .\
                                      FILTER ( ?v1 != ?v2 )\
                                    }', 
                               function(success, results){
                                   test.ok(success === true);
                                   test.ok(results.length === 0);
                                   test.done();
                });
            });
        });
    });
}


exports.testExprBuiltinSameTermSimple = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/things#> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :xi1 :p  "1"^^xsd:integer .\
                           :xi2 :p  "1"^^xsd:integer .\
                           :xi3 :p  "01"^^xsd:integer .\
                           :xd1 :p  "1.0e0"^^xsd:double .\
                           :xd2 :p  "1.0"^^xsd:double .\
                           :xd3 :p  "1"^^xsd:double .\
                           :xt1 :p  "zzz"^^:myType .\
                           :xp1 :p  "zzz" .\
                           :xp2 :p  "1" .\
                           :xp2 :p  "" .\
                           :xu :p  :z .\
                           :xb :p  _:a .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX  : <http://example.org/things#>\
                                PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                                SELECT  * \
                                WHERE\
                                    { \
                                      ?x1 :p ?v1 .\
                                      ?x2 :p ?v2 .\
                                      FILTER ( SAMETERM(?v1, ?v2) )\
                                    }', 
                               function(success, results){
                                   test.ok(success === true);
                                   test.ok(results.length === 14);
                                   test.done();
                });
            });
        });
    });
}

exports.testExprBuiltinSameTermEq = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/things#> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :xi1 :p  "1"^^xsd:integer .\
                           :xi2 :p  "1"^^xsd:integer .\
                           :xi3 :p  "01"^^xsd:integer .\
                           :xd1 :p  "1.0e0"^^xsd:double .\
                           :xd2 :p  "1.0"^^xsd:double .\
                           :xd3 :p  "1"^^xsd:double .\
                           :xt1 :p  "zzz"^^:myType .\
                           :xp1 :p  "zzz" .\
                           :xp2 :p  "1" .\
                           :xp2 :p  "" .\
                           :xu :p  :z .\
                           :xb :p  _:a .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX  : <http://example.org/things#>\
                                PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                                SELECT  * \
                                WHERE\
                                    { \
                                      ?x1 :p ?v1 .\
                                      ?x2 :p ?v2 .\
                                      FILTER ( SAMETERM(?v1, ?v2) && ?v1 = ?v2 )\
                                    }', 
                               function(success, results){
                                   test.ok(success === true);
                                   test.ok(results.length === 14);
                                   test.done();
                });
            });
        });
    });
}


exports.testExprBuiltinSameTermNotEq = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/things#> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :xi1 :p  "1"^^xsd:integer .\
                           :xi2 :p  "1"^^xsd:integer .\
                           :xi3 :p  "01"^^xsd:integer .\
                           :xd1 :p  "1.0e0"^^xsd:double .\
                           :xd2 :p  "1.0"^^xsd:double .\
                           :xd3 :p  "1"^^xsd:double .\
                           :xt1 :p  "zzz"^^:myType .\
                           :xp1 :p  "zzz" .\
                           :xp2 :p  "1" .\
                           :xp2 :p  "" .\
                           :xu :p  :z .\
                           :xb :p  _:a .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX  : <http://example.org/things#> \
                                PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                                SELECT  * \
                                WHERE \
                                    { \
                                      ?x1 :p ?v1 . \
                                      ?x2 :p ?v2 . \
                                      FILTER ( !SAMETERM(?v1, ?v2)  && ?v1 = ?v2) \
                                    }', 
                               function(success, results){
                                   test.ok(success === true);
                                   test.ok(results.length === 28);
                                   test.done();
                });
            });
        });
    });
}

exports.testExprOpsUnplus1 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA { \
                           :x1 :p  "1"^^xsd:integer .\
                           :x2 :p  "2"^^xsd:integer .\
                           :x3 :p  "3"^^xsd:integer .\
                           :x4 :p  "4"^^xsd:integer .\
                         }';
            engine.execute(query, function(success, result){

                engine.execute('PREFIX : <http://example.org/>\
                                SELECT ?s WHERE {\
                                    ?s :p ?o .\
                                    FILTER(?o = +3) .\
                                }', 
                               function(success, results){
                                   test.ok(success === true);
                                   test.ok(results.length === 1);
                                   test.ok(results[0].s.value === "http://example.org/x3");
                                   test.done();
                });
            });
        });
    });
}

exports.testExprOpsUnminus1 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA { \
                           :x1 :p  "1"^^xsd:integer .\
                           :x2 :p  "2"^^xsd:integer .\
                           :x3 :p  "3"^^xsd:integer .\
                           :x4 :p  "4"^^xsd:integer .\
                         }';
            engine.execute(query, function(success, result){

                engine.execute('PREFIX : <http://example.org/>\
                                SELECT ?s WHERE {\
                                    ?s :p ?o .\
                                    FILTER(-?o = -2) .\
                                }', 
                               function(success, results){
                                   test.ok(success === true);
                                   test.ok(results.length === 1);
                                   test.ok(results[0].s.value === "http://example.org/x2");
                                   test.done();
                });
            });
        });
    });
}

exports.testExprOpsPlus1 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA { \
                           :x1 :p  "1"^^xsd:integer .\
                           :x2 :p  "2"^^xsd:integer .\
                           :x3 :p  "3"^^xsd:integer .\
                           :x4 :p  "4"^^xsd:integer .\
                         }';
            engine.execute(query, function(success, result){

                engine.execute('PREFIX : <http://example.org/>\
                                SELECT ?s WHERE {\
                                    ?s :p ?o .\
                                    ?s2 :p ?o2 . \
                                    FILTER(?o + ?o2 = 3) .\
                                }', 
                               function(success, results){
                                   test.ok(success === true);
                                   var acum = [];
                                   for(var i=0; i<results.length; i++) {
                                       acum.push(results[i].s.value)
                                   }
                                   acum.sort();
                                   test.ok(results.length === 2);
                                   test.ok(acum[0] === "http://example.org/x1");
                                   test.ok(acum[1] === "http://example.org/x2");
                                   test.done();
                });
            });
        });
    });
}

exports.testExprOpsMinus1 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA { \
                           :x1 :p  "1"^^xsd:integer .\
                           :x2 :p  "2"^^xsd:integer .\
                           :x3 :p  "3"^^xsd:integer .\
                           :x4 :p  "4"^^xsd:integer .\
                         }';
            engine.execute(query, function(success, result){

                engine.execute('PREFIX : <http://example.org/>\
                                SELECT ?s WHERE {\
                                    ?s :p ?o .\
                                    ?s2 :p ?o2 . \
                                    FILTER(?o - ?o2 = 3) .\
                                }', 
                               function(success, results){
                                   test.ok(success === true);
                                   var acum = [];
                                   for(var i=0; i<results.length; i++) {
                                       acum.push(results[i].s.value)
                                   }
                                   acum.sort();
                                   test.ok(results.length === 1);
                                   test.ok(acum[0] === "http://example.org/x4");
                                   test.done();
                });
            });
        });
    });
}

exports.testExprOpsMul1 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA { \
                           :x1 :p  "1"^^xsd:integer .\
                           :x2 :p  "2"^^xsd:integer .\
                           :x3 :p  "3"^^xsd:integer .\
                           :x4 :p  "4"^^xsd:integer .\
                         }';
            engine.execute(query, function(success, result){

                engine.execute('PREFIX : <http://example.org/>\
                                SELECT ?s WHERE {\
                                    ?s :p ?o .\
                                    ?s2 :p ?o2 . \
                                    FILTER(?o * ?o2 = 4) .\
                                }', 
                               function(success, results){
                                   test.ok(success === true);
                                   var acum = [];
                                   for(var i=0; i<results.length; i++) {
                                       acum.push(results[i].s.value)
                                   }
                                   acum.sort();
                                   test.ok(results.length === 3);
                                   test.ok(acum[0] === "http://example.org/x1");
                                   test.ok(acum[1] === "http://example.org/x2");
                                   test.ok(acum[2] === "http://example.org/x4");
                                   test.done();
                });
            });
        });
    });
}


exports.testExprOpsGe1 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA { \
                           :x1 :p  "1"^^xsd:integer .\
                           :x2 :p  "2"^^xsd:integer .\
                           :x3 :p  "3"^^xsd:integer .\
                           :x4 :p  "4"^^xsd:integer .\
                         }';
            engine.execute(query, function(success, result){

                engine.execute('PREFIX : <http://example.org/>\
                                SELECT ?s WHERE {\
                                    ?s :p ?o .\
                                    FILTER(?o >= 3) .\
                                }', 
                               function(success, results){
                                   test.ok(success === true);
                                   var acum = [];
                                   for(var i=0; i<results.length; i++) {
                                       acum.push(results[i].s.value)
                                   }
                                   acum.sort();
                                   test.ok(results.length === 2);
                                   test.ok(acum[0] === "http://example.org/x3");
                                   test.ok(acum[1] === "http://example.org/x4");
                                   test.done();
                });
            });
        });
    });
}

exports.testExprOpsLe1 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA { \
                           :x1 :p  "1"^^xsd:integer .\
                           :x2 :p  "2"^^xsd:integer .\
                           :x3 :p  "3"^^xsd:integer .\
                           :x4 :p  "4"^^xsd:integer .\
                         }';
            engine.execute(query, function(success, result){

                engine.execute('PREFIX : <http://example.org/>\
                                SELECT ?s WHERE {\
                                    ?s :p ?o .\
                                    FILTER(?o <= 2) .\
                                }', 
                               function(success, results){
                                   test.ok(success === true);
                                   var acum = [];
                                   for(var i=0; i<results.length; i++) {
                                       acum.push(results[i].s.value)
                                   }
                                   acum.sort();

                                   test.ok(results.length === 2);
                                   test.ok(acum[0] === "http://example.org/x1");
                                   test.ok(acum[1] === "http://example.org/x2");
                                   test.done();
                });
            });
        });
    });
}

exports.testGraphGraph01 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA { \
                           :x :p  "1"^^xsd:integer .\
                           :a :p  "9"^^xsd:integer .\
                         }';
            engine.execute(query, function(success, result){

                engine.execute('PREFIX : <http://example/>\
                                SELECT * WHERE { ?s ?p ?o }', 
                               function(success, results){
                                   test.ok(success === true);
                                   test.ok(results.length === 2);

                                   if(results[0].p.value === "http://example/p") {
                                       test.ok(results[0].s.value === "http://example/x");
                                       test.ok(results[0].p.value === "http://example/p");
                                       test.ok(results[0].o.value === "1");

                                       test.ok(results[1].s.value === "http://example/a");
                                       test.ok(results[1].p.value === "http://example/p");
                                       test.ok(results[1].o.value === "9");
                                   } else {
                                       test.ok(results[0].s.value === "http://example/a");
                                       test.ok(results[0].p.value === "http://example/p");
                                       test.ok(results[0].o.value === "9");

                                       test.ok(results[1].s.value === "http://example/x");
                                       test.ok(results[1].p.value === "http://example/p");
                                       test.ok(results[1].o.value === "1");
                                   }

                                   test.done();
                });
            });
        });
    });
}

exports.testGraphGraph02 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA { \
                           GRAPH <data-g1.ttl> {\
                             :x :p  "1"^^xsd:integer .\
                             :a :p  "9"^^xsd:integer .\
                           }\
                         }';
            engine.execute(query, function(success, result){

                engine.execute('PREFIX : <http://example/>\
                                SELECT * WHERE { ?s ?p ?o }', 
                               function(success, results){
                                   test.ok(success === true);
                                   test.ok(results.length === 0);
                                   test.done();
                });
            });
        });
    });
}


exports.testGraphGraph03 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA { \
                           GRAPH <data-g1.ttl> {\
                             :x :p  "1"^^xsd:integer .\
                             :a :p  "9"^^xsd:integer .\
                           }\
                         }';
            engine.execute(query, function(success, result){

                engine.execute('PREFIX : <http://example/>\
                                SELECT * { GRAPH ?g { ?s ?p ?o } }', 
                               function(success, results){
                                   test.ok(success === true);
                                   test.ok(results.length === 2);
                                   for(var i=0; i<results.length; i++) {
                                       test.ok(results[i].g.value === "data-g1.ttl");
                                   }
                                   test.done();
                },[], [{"token": "uri", "prefix": null, "suffix": null, "value": "data-g1.ttl"}]);
            });
        });
    });
}

exports.testGraphGraph04 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA { \
                           :x :p  "1"^^xsd:integer .\
                           :a :p  "9"^^xsd:integer .\
                         }';
            engine.execute(query, function(success, result){

                engine.execute('PREFIX : <http://example/>\
                                SELECT * { GRAPH ?g { ?s ?p ?o } }', 
                               function(success, results){
                                     test.ok(success === true);
                                   test.ok(results.length === 0);
                                   test.done();
                });
            });
        });
    });
}

exports.testGraphGraph05 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA { \
                           GRAPH <data-g1.ttl> {\
                             :x :p  "1"^^xsd:integer .\
                             :a :p  "9"^^xsd:integer .\
                           }\
                         }';
            engine.execute(query, function(success, result){

                var query = 'PREFIX : <http://example/> \
                             PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                             INSERT DATA { \
                               GRAPH <data-g2.ttl> {\
                                :x :q "2"^^xsd:integer .\
                               }\
                             }';
                engine.execute(query, function(success, result){

                    engine.execute('PREFIX : <http://example/>\
                                    SELECT * { ?s ?p ?o }', 
                                   function(success, results){
                                       test.ok(success === true);
                                       test.ok(results.length === 2);
                                       test.done();
                                   },
                                   [{"token": "uri", "prefix": null, "suffix": null, "value": "data-g1.ttl"}], 
                                   [{"token": "uri", "prefix": null, "suffix": null, "value": "data-g2.ttl"}]);
                });
            });
        });
    });
}

exports.testGraphGraph06 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA { \
                           GRAPH <data-g1.ttl> {\
                             :x :p  "1"^^xsd:integer .\
                             :a :p  "9"^^xsd:integer .\
                           }\
                         }';
            engine.execute(query, function(success, result){

                var query = 'PREFIX : <http://example/> \
                             PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                             INSERT DATA { \
                               GRAPH <data-g2.ttl> {\
                                :x :q "2"^^xsd:integer .\
                               }\
                             }';
                engine.execute(query, function(success, result){

                    engine.execute('PREFIX : <http://example/>\
                                    SELECT * { GRAPH ?g { ?s ?p ?o } }', 
                                   function(success, results){
                                       test.ok(success === true);
                                       test.ok(results.length === 1);
                                       test.done();
                                   }, [{"token": "uri", "prefix": null, "suffix": null, "value": "data-g1.ttl"}],
                                      [{"token": "uri", "prefix": null, "suffix": null, "value": "data-g2.ttl"}]);
                });
            });
        });
    });
}

exports.testGraphGraph07 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      

            var query = 'PREFIX : <http://example/> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA { \
                           GRAPH <data-g1.ttl> {\
                             :x :p  "1"^^xsd:integer .\
                             :a :p  "9"^^xsd:integer .\
                           }\
                         }';

            engine.execute(query, function(success, result){

                var query = 'PREFIX : <http://example/> \
                             PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                             INSERT DATA { \
                               GRAPH <data-g2.ttl> {\
                                :x :q "2"^^xsd:integer .\
                               }\
                             }';

                engine.execute(query, function(success, result){

                    engine.execute('PREFIX : <http://example/>\
                                    SELECT * \
                                    { \
                                       { ?s ?p ?o } \
                                      UNION \
                                       { GRAPH ?g { ?s ?p ?o } } \
                                    }', 

                                   function(success, results){
                                       test.ok(success === true);
                                       test.ok(results.length === 3);
                                       test.done();
                                   }, 

                                   [{"token": "uri", "prefix": null, "suffix": null, "value": "data-g1.ttl"}], 
                                   [{"token": "uri", "prefix": null, "suffix": null, "value": "data-g2.ttl"}]);
                });
            });
        });
    });
}


exports.testGraphGraph08 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA { \
                           GRAPH <data-g1.ttl> {\
                             :x :p  "1"^^xsd:integer .\
                             :a :p  "9"^^xsd:integer .\
                           }\
                         }';
            engine.execute(query, function(success, result){

                var query = 'PREFIX : <http://example/> \
                             PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                             INSERT DATA { \
                               GRAPH <data-g2.ttl> {\
                                :x :q "2"^^xsd:integer .\
                               }\
                             }';
                engine.execute(query, function(success, result){

                    engine.execute('PREFIX : <http://example/>\
                                    SELECT * \
                                    { \
                                       ?s ?p ?o  \
                                       GRAPH ?g { ?s ?q ?v }  \
                                    }', 
                                   function(success, results){
                                       test.ok(success === true);
                                       test.ok(results.length === 1);
                                       test.ok(results[0].s.value === "http://example/x");
                                       test.ok(results[0].p.value === "http://example/p");
                                       test.ok(results[0].o.value === "1");
                                       test.ok(results[0].q.value === "http://example/q");
                                       test.ok(results[0].v.value === "2");
                                       test.ok(results[0].g.value === "data-g2.ttl");
                                       test.done();
                                   },[{"token": "uri", "prefix": null, "suffix": null, "value": "data-g1.ttl"}],
                                     [{"token": "uri", "prefix": null, "suffix": null, "value": "data-g2.ttl"}]);
                });
            });
        });
    });
}

exports.testGraphGraph09 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA { \
                           GRAPH <data-g3.ttl> { \
                             _:x :p  "1"^^xsd:integer . \
                             _:a :p  "9"^^xsd:integer . \
                           } \
                       }';
            engine.execute(query, function(success, result){

                var query = 'PREFIX : <http://example/> \
                             PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                             INSERT DATA { \
                               GRAPH <data-g4.ttl> { \
                                _:x :q "2"^^xsd:integer . \
                               } \
                             }';
                engine.execute(query, function(success, result){

                    engine.execute('PREFIX : <http://example/>\
                                    SELECT * \
                                    { \
                                      ?s ?p ?o \
                                      GRAPH ?g { ?s ?q ?v } \
                                    }', 
                                   function(success, results){
                                       test.ok(success === true);
                                       test.ok(results.length === 0);
                                       test.done();
                                   }, [{"token": "uri", "prefix": null, "suffix": null, "value": "data-g3.ttl"}], 
                                      [{"token": "uri", "prefix": null, "suffix": null, "value": "data-g4.ttl"}]);
                });
            });
        });
    });
}

  // withdrawn
  //exports.testGraphGraph10 = function(test) {
  //    new Lexicon.Lexicon(function(lexicon){
  //        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
  //            var engine = new QueryEngine.QueryEngine({backend: backend,
  //                                                      lexicon: lexicon});      
  //            var query = 'PREFIX : <http://example/> \
  //                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
  //                         INSERT DATA { \
  //                           GRAPH <data-g3.ttl> {\
  //                             _:x :p "1"^^xsd:integer .\
  //                             _:a :p "9"^^xsd:integer .\
  //                           }\
  //                         }';
  //            engine.execute(query, function(success, result){
  // 
  //                var query = 'PREFIX : <http://example/> \
  //                             PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
  //                             INSERT DATA { \
  //                               GRAPH <data-g3.ttl> {\
  //                                 _:x :p "1"^^xsd:integer .\
  //                                 _:a :p "9"^^xsd:integer .\
  //                               }\
  //                             }';
  //                engine.execute(query, function(success, result){
  // 
  //                    engine.execute('PREFIX : <http://example/>\
  //                                    SELECT * \
  //                                    { \
  //                                      ?s ?p ?o \
  //                                      GRAPH ?g { ?s ?q ?v } \
  //                                    }', 
  //                                   function(success, results){
  //                                       test.ok(success === true);
  //                                       test.ok(results.length === 0);
  //                                       test.done();
  //                                   },
  //                                   [{"token": "uri", "prefix": null, "suffix": null, "value": "data-g3.ttl"}], 
  //                                   [{"token": "uri", "prefix": null, "suffix": null, "value": "data-g3.ttl"}]);
  //                });
  //            });
  //        });
  //    });
  //}


exports.testGraphGraph10b = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA { \
                           GRAPH <data-g3-dup.ttl> { \
                             _:x :p "1"^^xsd:integer . \
                             _:a :p "9"^^xsd:integer . \
                           } \
                         }';
            engine.execute(query, function(success, result){

                var query = 'PREFIX : <http://example/> \
                             PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                             INSERT DATA { \
                               GRAPH <data-g3-dup.ttl> {\
                                 _:x :p "1"^^xsd:integer .\
                                 _:a :p "9"^^xsd:integer .\
                               }\
                             }';
                engine.execute(query, function(success, result){

                    engine.execute('PREFIX : <http://example/>\
                                    SELECT * \
                                    { \
                                      ?s ?p ?o \
                                      GRAPH ?g { ?s ?q ?v } \
                                    }', 
                                   function(success, results){
                                       test.ok(success === true);
                                       test.ok(results.length === 0);
                                       test.done();
                                   },
                                   [{"token": "uri", "prefix": null, "suffix": null, "value": "data-g3.ttl"}], 
                                   [{"token": "uri", "prefix": null, "suffix": null, "value": "data-g3-dup.ttl"}]);
                });
            });
        });
    });
}

exports.testGraphGraph11 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      

                var query = 'PREFIX : <http://example/> \
                             PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                             INSERT DATA { \
                               GRAPH <data-g1.ttl> {\
                                 :x :p "1"^^xsd:integer .\
                                 :a :p "9"^^xsd:integer .\
                               }\
                             }';
                engine.execute(query, function(success, result){

                    var query = 'PREFIX : <http://example/> \
                                 PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                                 INSERT DATA { \
                                   GRAPH <data-g2.ttl> {\
                                     :x :q "2"^^xsd:integer .\
                                   }\
                                 }';
                    engine.execute(query, function(success, result){


                        var query = 'PREFIX : <http://example/> \
                                     PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                                     INSERT DATA { \
                                       GRAPH <data-g3.ttl> {\
                                         _:x :p "1"^^xsd:integer .\
                                         _:a :p "9"^^xsd:integer .\
                                       }\
                                     }';
                        engine.execute(query, function(success, result){


                            var query = 'PREFIX : <http://example/> \
                                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                                         INSERT DATA { \
                                           GRAPH <data-g4.ttl> {\
                                             _:x :q "2"^^xsd:integer .\
                                           }\
                                         }';
                            engine.execute(query, function(success, result){

                                engine.execute('PREFIX : <http://example/>\
                                                SELECT * \
                                                { \
                                                   { ?s ?p ?o }\
                                                  UNION\
                                                   { GRAPH ?g { ?s ?p ?o } }\
                                                }', 
                                               function(success, results){
                                                   test.ok(success === true);
                                                   test.ok(results.length === 8);
                                                   test.done();
                                               },[{"token": "uri", "prefix": null, "suffix": null, "value": "data-g1.ttl"}],
                                               [{"token": "uri", "prefix": null, "suffix": null, "value": "data-g1.ttl"},
                                                {"token": "uri", "prefix": null, "suffix": null, "value": "data-g2.ttl"},
                                                {"token": "uri", "prefix": null, "suffix": null, "value": "data-g3.ttl"},
                                                {"token": "uri", "prefix": null, "suffix": null, "value": "data-g4.ttl"}]);
                            });
                        });
                    });
                });
            });
        });
}

exports.testDataset01 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA { \
                           GRAPH <data-g1.ttl> {\
                             :x :p  "1"^^xsd:integer .\
                             :a :p  "9"^^xsd:integer .\
                           }\
                         }';
            engine.execute(query, function(success, result){

                engine.execute('PREFIX : <http://example/>\
                                SELECT * \
                                FROM <data-g1.ttl> \
                                { ?s ?p ?o }', 
                               function(success, results){
                                   test.ok(success === true);
                                   test.ok(results.length === 2);
                                   acum = [];
                                   for(var i=0; i<results.length; i++) {
                                       acum.push(results[i].o.value)
                                   }
                                   acum.sort()
                                   test.ok(acum[0]==="1")
                                   test.ok(acum[1]==="9")
                                   test.done();
                               });
            });
        });
    });
}


exports.testDataset02 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA { \
                           GRAPH <data-g1.ttl> {\
                             :x :p  "1"^^xsd:integer .\
                             :a :p  "9"^^xsd:integer .\
                           }\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX : <http://example/>\
                                SELECT * \
                                FROM NAMED <data-g1.ttl> \
                                { ?s ?p ?o }', 
                               function(success, results){
                                   test.ok(success === true);
                                   test.ok(results.length === 0);
                                   test.done();
                               });
            });
        });
    });
}

exports.testDataset03 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA { \
                           GRAPH <data-g1.ttl> {\
                             :x :p  "1"^^xsd:integer .\
                             :a :p  "9"^^xsd:integer .\
                           }\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX : <http://example/>\
                                SELECT * \
                                FROM NAMED <data-g1.ttl> \
                                { GRAPH ?g { ?s ?p ?o } }', 
                               function(success, results){
                                   test.ok(success === true);
                                   test.ok(results.length === 2);
                                   acum = [];
                                   for(var i=0; i<results.length; i++) {
                                       acum.push(results[i].o.value)
                                       test.ok(results[i].g.value === "data-g1.ttl")
                                   }
                                   acum.sort()
                                   test.ok(acum[0]==="1")
                                   test.ok(acum[1]==="9")

                                   test.done();
                               });
            });
        });
    });
}

exports.testDataset04 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA { \
                           GRAPH <data-g1.ttl> {\
                             :x :p  "1"^^xsd:integer .\
                             :a :p  "9"^^xsd:integer .\
                           }\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX : <http://example/>\
                                SELECT * \
                                FROM <data-g1.ttl> \
                                { GRAPH ?g { ?s ?p ?o } }', 
                               function(success, results){
                                   test.ok(success === true);
                                   test.ok(results.length === 0);
                                   test.done();
                               });
            });
        });
    });
}


exports.testDataset05 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA { \
                           GRAPH <data-g1.ttl> {\
                             :x :p  "1"^^xsd:integer .\
                             :a :p  "9"^^xsd:integer .\
                           }\
                         }';
            engine.execute(query, function(success, result){

                var query = 'PREFIX : <http://example/> \
                             PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                             INSERT DATA { \
                               GRAPH <data-g2.ttl> {\
                                 :x :1  "2"^^xsd:integer .\
                               }\
                             }';
                engine.execute(query, function(success, result){

                    engine.execute('PREFIX : <http://example/>\
                                    SELECT * \
                                    FROM <data-g1.ttl> \
                                    FROM NAMED <data-g2.ttl> \
                                    { ?s ?p ?o }', 
                                   function(success, results){
                                       test.ok(success === true);
                                       test.ok(results.length === 2);
                                       acum = [];
                                       for(var i=0; i<results.length; i++) {
                                           acum.push(results[i].o.value)   
                                       }
                                       acum.sort()
                                       test.ok(acum[0]==="1")
                                       test.ok(acum[1]==="9")

                                       test.done();
                                   });
                });
            });
        });
    });
}

exports.testDataset06 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA { \
                           GRAPH <data-g1.ttl> {\
                             :x :p  "1"^^xsd:integer .\
                             :a :p  "9"^^xsd:integer .\
                           }\
                         }';
            engine.execute(query, function(success, result){

                var query = 'PREFIX : <http://example/> \
                             PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                             INSERT DATA { \
                               GRAPH <data-g2.ttl> {\
                                 :x :1  "2"^^xsd:integer .\
                               }\
                             }';
                engine.execute(query, function(success, result){

                    engine.execute('PREFIX : <http://example/>\
                                    SELECT * \
                                    FROM <data-g1.ttl> \
                                    FROM NAMED <data-g2.ttl> \
                                    { GRAPH ?g { ?s ?p ?o } }', 
                                   function(success, results){
                                       test.ok(success === true);
                                       test.ok(results.length === 1);
                                       test.ok(results[0].o.value === "2");
                                       test.ok(results[0].g.value === "data-g2.ttl");
                                       test.done();
                                   });
                });
            });
        });
    });
}




exports.testDataset07 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA { \
                           GRAPH <data-g1.ttl> {\
                             :x :p  "1"^^xsd:integer .\
                             :a :p  "9"^^xsd:integer .\
                           }\
                         }';
            engine.execute(query, function(success, result){

                var query = 'PREFIX : <http://example/> \
                             PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                             INSERT DATA { \
                               GRAPH <data-g2.ttl> {\
                                 :x :1  "2"^^xsd:integer .\
                               }\
                             }';
                engine.execute(query, function(success, result){

                    engine.execute('PREFIX : <http://example/>\
                                    SELECT * \
                                    FROM <data-g1.ttl> \
                                    FROM NAMED <data-g2.ttl> \
                                    { { ?s ?p ?o } UNION { GRAPH ?g { ?s ?p ?o } } }', 
                                   function(success, results){
                                       test.ok(success === true);
                                       test.ok(results.length === 3);
                                       acum = [];
                                       for(var i=0; i<results.length; i++) {
                                           acum.push(results[i].o.value)   
                                           if(results[i].o.value === "2") {
                                               test.ok(results[i].g.value == "data-g2.ttl");
                                           } else {
                                               test.ok(results[i].g == null);
                                           }
                                       }
                                       acum.sort()
                                       test.ok(acum[0]==="1")
                                       test.ok(acum[1]==="2")
                                       test.ok(acum[2]==="9")

                                       test.done();
                                   });
                });
            });
        });
    });
}

exports.testDataset08 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA { \
                           GRAPH <data-g1.ttl> {\
                             :x :p  "1"^^xsd:integer .\
                             :a :p  "9"^^xsd:integer .\
                           }\
                         }';
            engine.execute(query, function(success, result){

                var query = 'PREFIX : <http://example/> \
                             PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                             INSERT DATA { \
                               GRAPH <data-g2.ttl> {\
                                 :x :1  "2"^^xsd:integer .\
                               }\
                             }';
                engine.execute(query, function(success, result){

                    engine.execute('PREFIX : <http://example/>\
                                    SELECT * \
                                    FROM <data-g1.ttl> \
                                    FROM NAMED <data-g2.ttl> \
                                    { ?s ?p ?o GRAPH ?g { ?s ?q ?v } }', 
                                   function(success, results){
                                       test.ok(success === true);
                                       test.ok(results.length === 1);
                                       test.ok(results[0].s.value === "http://example/x");
                                       test.ok(results[0].p.value === "http://example/p");
                                       test.ok(results[0].q.value === "http://example/1");
                                       test.ok(results[0].o.value === "1");
                                       test.ok(results[0].v.value === "2");
                                       test.ok(results[0].g.value === "data-g2.ttl");
                                       test.done();
                                   });
                });
            });
        });
    });
}



exports.testDataset09 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA { \
                           GRAPH <data-g3.ttl> {\
                             _:x :p  "1"^^xsd:integer .\
                             _:a :p  "9"^^xsd:integer .\
                           }\
                         }';
            engine.execute(query, function(success, result){

                engine.execute('PREFIX : <http://example/>\
                                 SELECT * \
                                 FROM <data-g3.ttl> \
                                 FROM NAMED <data-g3.ttl> \
                                 { ?s ?p ?o GRAPH ?g { ?s ?q ?v } }', 
                                function(success, results){
                                    test.ok(success === true);
                                    test.done();
                                });
            });
        });
    });
}



exports.testDataset09b = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA { \
                           GRAPH <data-g3.ttl> {\
                             _:x :p  "1"^^xsd:integer .\
                             _:a :p  "9"^^xsd:integer .\
                           }\
                         }';
            engine.execute(query, function(success, result){

                var query = 'PREFIX : <http://example/> \
                             PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                             INSERT DATA { \
                               GRAPH <data-g3-dup.ttl> {\
                                 _:x :p  "1"^^xsd:integer .\
                                 _:a :p  "9"^^xsd:integer .\
                               }\
                             }';
                engine.execute(query, function(success, result){

                    engine.execute('PREFIX : <http://example/>\
                                    SELECT * \
                                    FROM <data-g3-dup.ttl> \
                                    FROM NAMED <data-g3.ttl> \
                                    { ?s ?p ?o GRAPH ?g { ?s ?q ?v } }', 
                                   function(success, results){
                                       test.ok(success === true);
                                       test.ok(results.length == 0);
                                       test.done();
                                   });
                });
            });
        });
    });
}


exports.testDataset11 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA { \
                           GRAPH <data-g1.ttl> {\
                             :x :p  "1"^^xsd:integer .\
                             :a :p  "9"^^xsd:integer .\
                           }\
                         }';
            engine.execute(query, function(success, result){

                var query = 'PREFIX : <http://example/> \
                             PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                             INSERT DATA { \
                               GRAPH <data-g2.ttl> {\
                                 :x :q  "2"^^xsd:integer .\
                               }\
                             }';
                engine.execute(query, function(success, result){

                var query = 'PREFIX : <http://example/> \
                             PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                             INSERT DATA { \
                               GRAPH <data-g3.ttl> {\
                                 _:x :p  "1"^^xsd:integer .\
                                 _:a :p  "9"^^xsd:integer .\
                               }\
                             }';
                engine.execute(query, function(success, result){

                var query = 'PREFIX : <http://example/> \
                             PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                             INSERT DATA { \
                               GRAPH <data-g4.ttl> {\
                                 _:x :q  "2"^^xsd:integer .\
                               }\
                             }';
                engine.execute(query, function(success, result){

                    engine.execute('PREFIX : <http://example/>\
                                    SELECT * \
                                    FROM <data-g1.ttl>\
                                    FROM NAMED <data-g1.ttl>\
                                    FROM NAMED <data-g2.ttl>\
                                    FROM NAMED <data-g3.ttl>\
                                    FROM NAMED <data-g4.ttl>\
                                    { \
                                       { ?s ?p ?o }\
                                      UNION\
                                       { GRAPH ?g { ?s ?p ?o } }\
                                    }', 
                                   function(success, results){
                                       test.ok(success === true);
                                       test.ok(results.length===8);
                                       test.done();
                                   });
                });
                });
                });
            });
        });
    });
}


exports.testDataset12b = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA { \
                           GRAPH <data-g1.ttl> {\
                             :x :p  "1"^^xsd:integer .\
                             :a :p  "9"^^xsd:integer .\
                           }\
                         }';
            engine.execute(query, function(success, result){

                var query = 'PREFIX : <http://example/> \
                             PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                             INSERT DATA { \
                               GRAPH <data-g2.ttl> {\
                                 :x :q  "2"^^xsd:integer .\
                               }\
                             }';
                engine.execute(query, function(success, result){

                var query = 'PREFIX : <http://example/> \
                             PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                             INSERT DATA { \
                               GRAPH <data-g3.ttl> {\
                                 _:x :p  "1"^^xsd:integer .\
                                 _:a :p  "9"^^xsd:integer .\
                               }\
                             }';
                engine.execute(query, function(success, result){

                var query = 'PREFIX : <http://example/> \
                             PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                             INSERT DATA { \
                               GRAPH <data-g4.ttl> {\
                                 _:x :q  "2"^^xsd:integer .\
                               }\
                             }';
                engine.execute(query, function(success, result){


                var query = 'PREFIX : <http://example/> \
                             PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                             INSERT DATA { \
                               GRAPH <data-g1-dup.ttl> {\
                                 :x :q  "1"^^xsd:integer .\
                                 :x :q  "9"^^xsd:integer .\
                               }\
                             }';
                engine.execute(query, function(success, result){

                var query = 'PREFIX : <http://example/> \
                             PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                             INSERT DATA { \
                               GRAPH <data-g2-dup.ttl> {\
                                 :x :q  "2"^^xsd:integer .\
                               }\
                             }';
                engine.execute(query, function(success, result){

                var query = 'PREFIX : <http://example/> \
                             PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                             INSERT DATA { \
                               GRAPH <data-g3-dup.ttl> {\
                                 _:x :p  "1"^^xsd:integer .\
                                 _:x :p  "9"^^xsd:integer .\
                               }\
                             }';
                engine.execute(query, function(success, result){

                var query = 'PREFIX : <http://example/> \
                             PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                             INSERT DATA { \
                               GRAPH <data-g4-dup.ttl> {\
                                 _:x :q  "2"^^xsd:integer .\
                               }\
                             }';
                engine.execute(query, function(success, result){

                    engine.execute('PREFIX : <http://example/>\
                                    SELECT * \
                                    FROM <data-g1-dup.ttl>\
                                    FROM <data-g2-dup.ttl>\
                                    FROM <data-g3-dup.ttl>\
                                    FROM <data-g4-dup.ttl>\
                                    FROM NAMED <data-g1.ttl>\
                                    FROM NAMED <data-g2.ttl>\
                                    FROM NAMED <data-g3.ttl>\
                                    FROM NAMED <data-g4.ttl>\
                                    { \
                                       { ?s ?p ?o }\
                                      UNION\
                                       { GRAPH ?g { ?s ?p ?o } }\
                                    }', 
                                   function(success, results){
                                       test.ok(success === true);
                                       test.ok(results.length === 12);
                                       test.done();
                                   });
                });
                });
                });
                });
                });
                });
                });
            });
        });
    });
}

exports.testOpenEq01 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/ns#> \
                         PREFIX t: <http://example/t#> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :x1 :p "a"^^t:type1 .\
                           :x2 :p "b"^^t:type1 .\
                           :y1 :p "a"^^t:type2 .\
                           :y2 :p "b"^^t:type2 .\
                           :z1 :p "1"^^xsd:integer .\
                           :z2 :p "01"^^xsd:integer .\
                           :z3 :p "2"^^xsd:integer .\
                           :z4 :p "02"^^xsd:integer .}';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX :     <http://example.org/ns#>\
                                PREFIX  t:      <http://example/t#>\
                                PREFIX xsd:  <http://www.w3.org/2001/XMLSchema#>\
                                SELECT * { ?x :p "001"^^xsd:integer }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 0);
                                    test.done();
                });
            });
        });
    });
}

exports.testOpenEq01 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/ns#> \
                         PREFIX t: <http://example/t#> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :x1 :p "a"^^t:type1 .\
                           :x2 :p "b"^^t:type1 .\
                           :y1 :p "a"^^t:type2 .\
                           :y2 :p "b"^^t:type2 .\
                           :z1 :p "1"^^xsd:integer .\
                           :z2 :p "01"^^xsd:integer .\
                           :z3 :p "2"^^xsd:integer .\
                           :z4 :p "02"^^xsd:integer .}';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX :     <http://example.org/ns#>\
                                PREFIX  t:      <http://example/t#>\
                                PREFIX xsd:  <http://www.w3.org/2001/XMLSchema#>\
                                SELECT * { ?x :p "001"^^xsd:integer }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 0);
                                    test.done();
                });
            });
        });
    });
}

exports.testOpenEq02 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/ns#> \
                         PREFIX t: <http://example/t#> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :x1 :p "a"^^t:type1 .\
                           :x2 :p "b"^^t:type1 .\
                           :y1 :p "a"^^t:type2 .\
                           :y2 :p "b"^^t:type2 .\
                           :z1 :p "1"^^xsd:integer .\
                           :z2 :p "01"^^xsd:integer .\
                           :z3 :p "2"^^xsd:integer .\
                           :z4 :p "02"^^xsd:integer .}';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX :     <http://example.org/ns#>\
                                PREFIX  t:      <http://example/t#>\
                                PREFIX xsd:  <http://www.w3.org/2001/XMLSchema#>\
                                SELECT * { ?x :p "a"^^t:type1 }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 1);
                                    test.ok(results[0].x.value === "http://example.org/ns#x1");
                                    test.done();
                });
            });
        });
    });
}

exports.testOpenEq03 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/ns#> \
                         PREFIX t: <http://example/t#> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :x1 :p "a"^^t:type1 .\
                           :x2 :p "b"^^t:type1 .\
                           :y1 :p "a"^^t:type2 .\
                           :y2 :p "b"^^t:type2 .\
                           :z1 :p "1"^^xsd:integer .\
                           :z2 :p "01"^^xsd:integer .\
                           :z3 :p "2"^^xsd:integer .\
                           :z4 :p "02"^^xsd:integer .}';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX :     <http://example.org/ns#>\
                                PREFIX  t:      <http://example/t#>\
                                PREFIX xsd:  <http://www.w3.org/2001/XMLSchema#>\
                                SELECT * { ?x :p ?v \
                                FILTER ( ?v = 1 ) }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 2);
                                    var acum = [];
                                    for(var i=0; i<results.length; i++) {
                                        acum.push(results[i].v.value);
                                    }
                                    acum.sort();

                                    test.ok(acum[0]==="01");
                                    test.ok(acum[1]==="1");
                                    test.done();
                });
            });
        });
    });
}

exports.testOpenEq04 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/ns#> \
                         PREFIX t: <http://example/t#> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :x1 :p "a"^^t:type1 .\
                           :x2 :p "b"^^t:type1 .\
                           :y1 :p "a"^^t:type2 .\
                           :y2 :p "b"^^t:type2 .\
                           :z1 :p "1"^^xsd:integer .\
                           :z2 :p "01"^^xsd:integer .\
                           :z3 :p "2"^^xsd:integer .\
                           :z4 :p "02"^^xsd:integer .}';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX :     <http://example.org/ns#>\
                                PREFIX  t:      <http://example/t#>\
                                PREFIX xsd:  <http://www.w3.org/2001/XMLSchema#>\
                                SELECT * { ?x :p ?v \
                                FILTER ( ?v != 1 ) }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 2);
                                    var acum = [];
                                    for(var i=0; i<results.length; i++) {
                                        acum.push(results[i].v.value);
                                    }
                                    acum.sort();
 
                                    test.ok(acum[0]==="02");
                                    test.ok(acum[1]==="2");
                                    test.done();
                });
            });
        });
    });
}


exports.testOpenEq05 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/ns#> \
                         PREFIX t: <http://example/t#> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :x1 :p "a"^^t:type1 .\
                           :x2 :p "b"^^t:type1 .\
                           :y1 :p "a"^^t:type2 .\
                           :y2 :p "b"^^t:type2 .\
                           :z1 :p "1"^^xsd:integer .\
                           :z2 :p "01"^^xsd:integer .\
                           :z3 :p "2"^^xsd:integer .\
                           :z4 :p "02"^^xsd:integer .}';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX :     <http://example.org/ns#>\
                                PREFIX  t:      <http://example/t#>\
                                PREFIX xsd:  <http://www.w3.org/2001/XMLSchema#>\
                                SELECT * { ?x :p ?v \
                                FILTER ( ?v = "a"^^t:type1 ) }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 1);
                                    test.ok(results[0].v.value === "a");
                                    test.ok(results[0].v.type === "http://example/t#type1");
                                    test.done();
                });
            });
        });
    });
}

exports.testOpenEq06 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/ns#> \
                         PREFIX t: <http://example/t#> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :x1 :p "a"^^t:type1 .\
                           :x2 :p "b"^^t:type1 .\
                           :y1 :p "a"^^t:type2 .\
                           :y2 :p "b"^^t:type2 .\
                           :z1 :p "1"^^xsd:integer .\
                           :z2 :p "01"^^xsd:integer .\
                           :z3 :p "2"^^xsd:integer .\
                           :z4 :p "02"^^xsd:integer .}';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX :     <http://example.org/ns#>\
                                PREFIX  t:      <http://example/t#>\
                                PREFIX xsd:  <http://www.w3.org/2001/XMLSchema#>\
                                SELECT * { ?x :p ?v \
                                FILTER ( ?v != "a"^^t:type1 ) }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 0);
                                    test.done();
                });
            });
        });
    });
}

exports.testOpenEq07 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/ns#> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :x1 :p "xyz" .\
                           :x2 :p "xyz"@en .\
                           :x3 :p "xyz"@EN .\
                           :x4 :p "xyz"^^xsd:string .\
                           :x5 :p "xyz"^^xsd:integer .\
                           :x6 :p "xyz"^^:unknown .\
                           :x7 :p _:xyz .\
                           :x8 :p :xyz .\
                           :y1 :q "abc" .\
                           :y2 :q "abc"@en .\
                           :y3 :q "abc"@EN .\
                           :y4 :q "abc"^^xsd:string .\
                           :y5 :q "abc"^^xsd:integer .\
                           :y6 :q "abc"^^:unknown .\
                           :y7 :q _:abc .\
                           :y8 :q :abc .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX :     <http://example.org/ns#>\
                                PREFIX xsd:  <http://www.w3.org/2001/XMLSchema#>\
                                SELECT * { \
                                  ?x1 :p ?v1 .\
                                  ?x2 :p ?v2 .\
                                  FILTER ( ?v1 = ?v2 )\
                                }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length == 12);
                                    test.done();
                });
            });
        });
    });
}

exports.testOpenEq08 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :x1 :p "xyz" .\
                           :x2 :p "xyz"@en .\
                           :x3 :p "xyz"@EN .\
                           :x4 :p "xyz"^^xsd:string .\
                           :x5 :p "xyz"^^xsd:integer .\
                           :x6 :p "xyz"^^:unknown .\
                           :x7 :p _:xyz .\
                           :x8 :p :xyz .\
                           :y1 :q "abc" .\
                           :y2 :q "abc"@en .\
                           :y3 :q "abc"@EN .\
                           :y4 :q "abc"^^xsd:string .\
                           :y5 :q "abc"^^xsd:integer .\
                           :y6 :q "abc"^^:unknown .\
                           :y7 :q _:abc .\
                           :y8 :q :abc .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX :     <http://example.org/>\
                                PREFIX xsd:  <http://www.w3.org/2001/XMLSchema#>\
                                SELECT * { \
                                  ?x1 :p ?v1 .\
                                  ?x2 :p ?v2 .\
                                  FILTER ( ?v1 != ?v2 )\
                                }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length===42);
                                    test.done();
                });
            });
        });
    });
}


exports.testOpenEq09 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/ns#> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :x1 :p "xyz" .\
                           :x2 :p "xyz"@en .\
                           :x3 :p "xyz"@EN .\
                           :x4 :p "xyz"^^xsd:string .\
                           :x5 :p "xyz"^^xsd:integer .\
                           :x6 :p "xyz"^^:unknown .\
                           :x7 :p _:xyz .\
                           :x8 :p :xyz .\
                           :y1 :q "abc" .\
                           :y2 :q "abc"@en .\
                           :y3 :q "abc"@EN .\
                           :y4 :q "abc"^^xsd:string .\
                           :y5 :q "abc"^^xsd:integer .\
                           :y6 :q "abc"^^:unknown .\
                           :y7 :q _:abc .\
                           :y8 :q :abc .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX :     <http://example.org/ns#>\
                                PREFIX xsd:  <http://www.w3.org/2001/XMLSchema#>\
                                SELECT * { \
                                  ?x :p ?v1 .\
                                  ?y :q ?v2 .\
                                  FILTER ( ?v1 = ?v2 )\
                                }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 0);
                                    test.done();
                });
            });
        });
    });
}

exports.testOpenEq10 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/ns#> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :x1 :p "xyz" .\
                           :x2 :p "xyz"@en .\
                           :x3 :p "xyz"@EN .\
                           :x4 :p "xyz"^^xsd:string .\
                           :x5 :p "xyz"^^xsd:integer .\
                           :x6 :p "xyz"^^:unknown .\
                           :x7 :p _:xyz .\
                           :x8 :p :xyz .\
                           :y1 :q "abc" .\
                           :y2 :q "abc"@en .\
                           :y3 :q "abc"@EN .\
                           :y4 :q "abc"^^xsd:string .\
                           :y5 :q "abc"^^xsd:integer .\
                           :y6 :q "abc"^^:unknown .\
                           :y7 :q _:abc .\
                           :y8 :q :abc .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX :     <http://example.org/ns#>\
                                PREFIX xsd:  <http://www.w3.org/2001/XMLSchema#>\
                                SELECT * { \
                                  ?x :p ?v1 .\
                                  ?y :q ?v2 .\
                                  FILTER ( ?v1 != ?v2 )\
                                }', function(success, results){
                                    test.ok(success === true);
                                    results.sort(function(a,b){
                                        if(""+a.v1.value+a.v1.type+a.v1.lang === ""+b.v1.value+b.v1.type+b.v1.lang) {
                                            return 0;
                                        } else if(""+a.v1.value+a.v1.type+a.v1.lang < ""+b.v1.value+b.v1.type+b.v1.lang) {
                                            return -1;
                                        } else {
                                            return 1;
                                        }
                                    });
                                    test.ok(results.length===52);
                                    test.done();
                });
            });
        });
    });
}

exports.testOpenEq11 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/ns#> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :x1 :p "xyz" .\
                           :x2 :p "xyz"@en .\
                           :x3 :p "xyz"@EN .\
                           :x4 :p "xyz"^^xsd:string .\
                           :x5 :p "xyz"^^xsd:integer .\
                           :x6 :p "xyz"^^:unknown .\
                           :x7 :p _:xyz .\
                           :x8 :p :xyz .\
                           :y1 :q "abc" .\
                           :y2 :q "abc"@en .\
                           :y3 :q "abc"@EN .\
                           :y4 :q "abc"^^xsd:string .\
                           :y5 :q "abc"^^xsd:integer .\
                           :y6 :q "abc"^^:unknown .\
                           :y7 :q _:abc .\
                           :y8 :q :abc .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX :     <http://example.org/ns#>\
                                PREFIX xsd:  <http://www.w3.org/2001/XMLSchema#>\
                                SELECT * { \
                                  ?x :p ?v1 .\
                                  ?y :q ?v2 .\
                                  FILTER ( ?v1 != ?v2 || ?v1 = ?v2 )\
                                }', function(success, results){
                                    test.ok(success === true);
                                    results.sort(function(a,b){
                                        if(""+a.v1.value+a.v1.type+a.v1.lang === ""+b.v1.value+b.v1.type+b.v1.lang) {
                                            return 0;
                                        } else if(""+a.v1.value+a.v1.type+a.v1.lang < ""+b.v1.value+b.v1.type+b.v1.lang) {
                                            return -1;
                                        } else {
                                            return 1;
                                        }
                                    });
                                    test.ok(results.length===52);
                                    test.done();
                });
            });
        });
    });
}

exports.testOpenEq12 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/ns#> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :x1 :p "xyz" .\
                           :x2 :p "xyz"@en .\
                           :x3 :p "xyz"@EN .\
                           :x4 :p "xyz"^^xsd:string .\
                           :x5 :p "xyz"^^xsd:integer .\
                           :x6 :p "xyz"^^:unknown .\
                           :x7 :p _:xyz .\
                           :x8 :p :xyz .\
                           :y1 :q "abc" .\
                           :y2 :q "abc"@en .\
                           :y3 :q "abc"@EN .\
                           :y4 :q "abc"^^xsd:string .\
                           :y5 :q "abc"^^xsd:integer .\
                           :y6 :q "abc"^^:unknown .\
                           :y7 :q _:abc .\
                           :y8 :q :abc .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX :     <http://example.org/ns#>\
                                PREFIX xsd:  <http://www.w3.org/2001/XMLSchema#>\
                                SELECT ?x ?v1 ?y ?v2 ?v3 { \
                                  ?x :p ?v1 .\
                                  ?y :p ?v2 .\
                                  OPTIONAL { ?y :p ?v3 . FILTER( ?v1 != ?v3 || ?v1 = ?v3 )}\
                                  FILTER (!BOUND(?v3))\
                                }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length===10);
                                    for(var i=0; i<results.length; i++) {
                                        var result = results[i];
                                        test.ok(results.v3==null)
                                    }                                    
                                    test.done();
                });
            });
        });
    });
}

exports.testOpenDate1 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/ns#> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :dt1 :r "2006-08-23T09:00:00+01:00"^^xsd:dateTime .\
                           :d1 :r "2006-08-23"^^xsd:date .\
                           :d2 :r "2006-08-23Z"^^xsd:date .\
                           :d3 :r "2006-08-23+00:00"^^xsd:date .\
                           :d4 :r "2001-01-01"^^xsd:date .\
                           :d5 :r "2001-01-01Z"^^xsd:date .\
                           :d6 :s "2006-08-23"^^xsd:date .\
                           :d7 :s "2006-08-24Z"^^xsd:date .\
                           :d8 :s "2000-01-01"^^xsd:date .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX :     <http://example.org/ns#>\
                                PREFIX xsd:  <http://www.w3.org/2001/XMLSchema#>\
                                SELECT * { \
                                  ?x :r ?v .\
                                  FILTER ( ?v = "2006-08-23"^^xsd:date )\
                                }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length===1);
                                    test.ok(results[0].v.value==="2006-08-23");
                                    test.ok(results[0].x.value=="http://example.org/ns#d1")
                                    test.done();
                });
            });
        });
    });
}



exports.testOpenDate2 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :dt1 :r "2006-08-23T09:00:00+01:00"^^xsd:dateTime .\
                           :d1 :r "2006-08-23"^^xsd:date .\
                           :d2 :r "2006-08-23Z"^^xsd:date .\
                           :d3 :r "2006-08-23+00:00"^^xsd:date .\
                           :d4 :r "2001-01-01"^^xsd:date .\
                           :d5 :r "2001-01-01Z"^^xsd:date .\
                           :d6 :s "2006-08-23"^^xsd:date .\
                           :d7 :s "2006-08-24Z"^^xsd:date .\
                           :d8 :s "2000-01-01"^^xsd:date .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX :     <http://example/>\
                                PREFIX xsd:  <http://www.w3.org/2001/XMLSchema#>\
                                SELECT * { \
                                  ?x :r ?v .\
                                  FILTER ( ?v != "2006-08-23"^^xsd:date )\
                                }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length===3);
                                    acum = [];
                                    for(var i=0; i<results.length; i++) {
                                        acum.push(results[i].x.value);
                                    }
                                    acum.sort();
                                    test.ok(acum[0] === "http://example/d4");
                                    test.ok(acum[1] === "http://example/d5");
                                    test.ok(acum[2] === "http://example/dt1");
                                    test.done();
                });
            });
        });
    });
}


exports.testOpenDate3 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :dt1 :r "2006-08-23T09:00:00+01:00"^^xsd:dateTime .\
                           :d1 :r "2006-08-23"^^xsd:date .\
                           :d2 :r "2006-08-23Z"^^xsd:date .\
                           :d3 :r "2006-08-23+00:00"^^xsd:date .\
                           :d4 :r "2001-01-01"^^xsd:date .\
                           :d5 :r "2001-01-01Z"^^xsd:date .\
                           :d6 :s "2006-08-23"^^xsd:date .\
                           :d7 :s "2006-08-24Z"^^xsd:date .\
                           :d8 :s "2000-01-01"^^xsd:date .\
}';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX :     <http://example/>\
                                PREFIX xsd:  <http://www.w3.org/2001/XMLSchema#>\
                                SELECT * { \
                                  ?x :r ?v .\
                                  FILTER ( ?v > "2006-08-22"^^xsd:date )\
                                }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length===3);
                                    acum = [];
                                    for(var i=0; i<results.length; i++) {
                                        acum.push(results[i].x.value);
                                    }
                                    acum.sort();
                                    test.ok(acum[0] === "http://example/d1");
                                    test.ok(acum[1] === "http://example/d2");
                                    test.ok(acum[2] === "http://example/d3");
                                    test.done();
                });
            });
        });
    });
}

exports.testOpenDate4 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :dt1 :r "2006-08-23T09:00:00+01:00"^^xsd:dateTime .\
                           :d1 :r "2006-08-23"^^xsd:date .\
                           :d2 :r "2006-08-23Z"^^xsd:date .\
                           :d3 :r "2006-08-23+00:00"^^xsd:date .\
                           :d4 :r "2001-01-01"^^xsd:date .\
                           :d5 :r "2001-01-01Z"^^xsd:date .\
                           :d6 :s "2006-08-23"^^xsd:date .\
                           :d7 :s "2006-08-24Z"^^xsd:date .\
                           :d8 :s "2000-01-01"^^xsd:date .\
}';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX :     <http://example/>\
                                PREFIX xsd:  <http://www.w3.org/2001/XMLSchema#>\
                                SELECT ?x ?date { \
                                  ?x :s ?date .\
                                  FILTER ( DATATYPE(?date) = xsd:date  )\
                                }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length===3);
                                    acum = [];
                                    for(var i=0; i<results.length; i++) {
                                        acum.push(results[i].x.value);
                                    }
                                    acum.sort();
                                    test.ok(acum[0] === "http://example/d6");
                                    test.ok(acum[1] === "http://example/d7");
                                    test.ok(acum[2] === "http://example/d8");
                                    test.done();
                });
            });
        });
    });
}

exports.testOpenCmp01 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :x1 :p [ :v1 "v1" ; :v2 "v2" ] .\
                           :x2 :p [ :v1 "1"^^xsd:integer ; :v2 "v2" ] .\
                           :x3 :p [ :v1 "x"^^:unknown ; :v2 "x"^^:unknown ] .\
                           :x4 :p [ :v1 <test:abc> ; :v2 <test:abc> ] .\
                           :x5 :p [ :v1 "2006-08-23T09:00:00+01:00"^^xsd:dateTime ;\
                                    :v2 "2006-08-22"^^xsd:date ].\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX :     <http://example/>\
                                PREFIX xsd:  <http://www.w3.org/2001/XMLSchema#>\
                                SELECT ?x ?v1 ?v2\
                                {\
                                    ?x :p [ :v1 ?v1 ; :v2 ?v2 ] .\
                                    FILTER ( ?v1 < ?v2 || ?v1 > ?v2 )\
                                }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length===1);
                                    test.ok(results[0].x.value === "http://example/x1");
                                    test.ok(results[0].v1.value === "v1");
                                    test.ok(results[0].v2.value === "v2");
                                    test.done();
                });
            });
        });
    });
}

exports.testOpenCmp02 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :x1 :p [ :v1 "v1" ; :v2 "v2" ] .\
                           :x2 :p [ :v1 "1"^^xsd:integer ; :v2 "v2" ] .\
                           :x3 :p [ :v1 "x"^^:unknown ; :v2 "x"^^:unknown ] .\
                           :x4 :p [ :v1 <test:abc> ; :v2 <test:abc> ] .\
                           :x5 :p [ :v1 "2006-08-23T09:00:00+01:00"^^xsd:dateTime ;\
                                    :v2 "2006-08-22"^^xsd:date ].\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX :     <http://example/>\
                                PREFIX xsd:  <http://www.w3.org/2001/XMLSchema#>\
                                SELECT ?x ?v1 ?v2\
                                {\
                                    ?x :p [ :v1 ?v1 ; :v2 ?v2 ] .\
                                    FILTER ( ?v1 < ?v2 || ?v1 = ?v2 || ?v1 > ?v2 )\
                                }', function(success, results){
                                    test.ok(success === true);
                                    // @todo
                                    // add some assertions for the values
                                    test.ok(results.length===3);                                    
                                    test.done();
                });
            });
        });
    });
}

exports.testOptionalFilterFilter001 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX x: <http://example.org/ns#>\
                         PREFIX : <http://example.org/books#> \
                         PREFIX dc: <http://purl.org/dc/elements/1.1/>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :book1 dc:title "TITLE 1" .\
                           :book1 x:price  "10"^^xsd:integer .\
                           :book2 dc:title "TITLE 2" .\
                           :book2 x:price  "20"^^xsd:integer .\
                           :book3 dc:title "TITLE 3" .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX x:     <http://example.org/ns#>\
                                PREFIX dc: <http://purl.org/dc/elements/1.1/>\
                                SELECT ?title ?price         \
                                WHERE                        \
                                { ?book dc:title ?title .    \
                                  OPTIONAL                   \
                                    { ?book x:price ?price . \
                                      FILTER (?price < 15) . \
                                    } .                      \
                                }', function(success, results){
                                    test.ok(success === true);
                                    acum = [];
                                    for(var i=0; i<results.length; i++) {
                                        acum.push(results[i].title.value)
                                        if(results[i].title.value === "TITLE 2") {
                                            test.ok(results[i].price==null);
                                        } else if(results[i].title.value === "TITLE 3") {
                                            test.ok(results[i].price == null);
                                        } else {
                                            test.ok(results[i].title.value === "TITLE 1");
                                            test.ok(results[i].price.value === '10');
                                        }
                                    }

                                    acum.sort();
                                    test.ok(acum[0]==="TITLE 1");
                                    test.ok(acum[1]==="TITLE 2");
                                    test.ok(acum[2]==="TITLE 3");
                                    test.done();
                });
            });
        });
    });
}

exports.testOptionalFilterFilter002 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX x: <http://example.org/ns#>\
                         PREFIX : <http://example.org/books#> \
                         PREFIX dc: <http://purl.org/dc/elements/1.1/>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :book1 dc:title "TITLE 1" .\
                           :book1 x:price  "10"^^xsd:integer .\
                           :book2 dc:title "TITLE 2" .\
                           :book2 x:price  "20"^^xsd:integer .\
                           :book3 dc:title "TITLE 3" .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX x:     <http://example.org/ns#>\
                                PREFIX dc: <http://purl.org/dc/elements/1.1/>\
                                SELECT ?title ?price\
                                WHERE                \
                                { ?book dc:title ?title .\
                                  OPTIONAL               \
                                    { ?book x:price ?price } . \
                                  FILTER (?price < 15)  . \
                                }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 1);                                    
                                    test.ok(results[0].title.value === "TITLE 1");
                                    test.done();
                });
            });
        });
    });
}


exports.testOptionalFilterFilter003 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX x: <http://example.org/ns#>\
                         PREFIX : <http://example.org/books#> \
                         PREFIX dc: <http://purl.org/dc/elements/1.1/>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :book1 dc:title "TITLE 1" .\
                           :book1 x:price  "10"^^xsd:integer .\
                           :book2 dc:title "TITLE 2" .\
                           :book2 x:price  "20"^^xsd:integer .\
                           :book3 dc:title "TITLE 3" .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX x:     <http://example.org/ns#>\
                                PREFIX dc: <http://purl.org/dc/elements/1.1/>\
                                SELECT ?title ?price\
                                WHERE                \
                                { ?book dc:title ?title .\
                                  OPTIONAL\
                                    { ?book x:price ?price } . \
                                  FILTER ( ( ! BOUND(?price) ) || ( ?price < 15 ) ) .\
                                }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 2);
                                    acum = [];
                                    for(var i=0; i<results.length; i++) {
                                        acum.push(results[i].title.value)
                                        if(results[i].title.value === "TITLE 3") {
                                            test.ok(results[i].price == null);
                                        } else {
                                            test.ok(results[i].title.value === "TITLE 1");
                                            test.ok(results[i].price.value === '10');
                                        }
                                    }
                                    test.ok(acum[0]==="TITLE 1");
                                    test.ok(acum[1]==="TITLE 3");
                                    
                                    acum.sort();
                                    test.done();
                });
            });
        });
    });
}

exports.testOptionalFilterFilter004 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX x: <http://example.org/ns#>\
                         PREFIX : <http://example.org/books#> \
                         PREFIX dc: <http://purl.org/dc/elements/1.1/>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :book1 dc:title "TITLE 1" .\
                           :book1 x:price  "10"^^xsd:integer .\
                           :book2 dc:title "TITLE 2" .\
                           :book2 x:price  "20"^^xsd:integer .\
                           :book3 dc:title "TITLE 3" .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX x:     <http://example.org/ns#>\
                                PREFIX dc: <http://purl.org/dc/elements/1.1/>\
                                SELECT ?title ?price\
                                WHERE                \
                                { ?book dc:title ?title .\
                                  OPTIONAL\
                                    { ?book x:price ?price . \
                                      FILTER (?price < 15 && ?title = "TITLE 2") .\
                                    } .\
                                }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 3);
                                    acum = [];
                                    for(var i=0; i<results.length; i++) {
                                        acum.push(results[i].title.value)
                                        test.ok(results[i].price == null);
                                    }
                                    acum.sort();
                                    
                                    test.ok(acum[0]==="TITLE 1");
                                    test.ok(acum[1]==="TITLE 2");
                                    test.ok(acum[2]==="TITLE 3");
                                    
                                    test.done();
                });
            });
        });
    });
}


     // Not approved
     //exports.testOptionalFilterFilter005 = function(test) {
     //    new Lexicon.Lexicon(function(lexicon){
     //        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
     //            var engine = new QueryEngine.QueryEngine({backend: backend,
     //                                                      lexicon: lexicon});      
     //            var query = 'PREFIX x: <http://example.org/ns#>\
     //                         PREFIX : <http://example.org/books#> \
     //                         PREFIX dc: <http://purl.org/dc/elements/1.1/>\
     //                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
     //                         INSERT DATA {\
     //                           :book1 dc:title "TITLE 1" .\
     //                           :book1 x:price  "10"^^xsd:integer .\
     //                           :book2 dc:title "TITLE 2" .\
     //                           :book2 x:price  "20"^^xsd:integer .\
     //                           :book3 dc:title "TITLE 3" .\
     //                         }';
     //            engine.execute(query, function(success, result){
     //                // modified version to avoid problems with timezones
     //                engine.execute('PREFIX x:     <http://example.org/ns#>\
     //                                PREFIX dc: <http://purl.org/dc/elements/1.1/>\
     //                                SELECT ?title ?price\
     //                                WHERE                \
     //                                { ?book dc:title ?title .\
     //                                  OPTIONAL\
     //                                    {\
     //                                      { \
     //                                        ?book x:price ?price . \
     //                                        FILTER (?title = "TITLE 2") .\
     //                                      }\
     //                                    } .\
     //                                }', function(success, results){
     //                                    test.ok(success === true);
     //                                    test.ok(results.length === 3);
     //                                    acum = [];
     //                                    for(var i=0; i<results.length; i++) {
     //                                        acum.push(results[i].title.value)
     //                                        if(results[i].title.value === "TITLE 2") {
     //                                            test.ok(results[i].price.value === '20');
     //                                        } else {
     //                                            test.ok(results[i].price === null);
     //                                        }
     //                                    }
     //                                    acum.sort();
     //                                    
     //                                    test.ok(acum[0]==="TITLE 1");
     //                                    test.ok(acum[1]==="TITLE 2");
     //                                    test.ok(acum[2]==="TITLE 3");
     //                                    
     //                                    test.done();
     //                });
     //            });
     //        });
     //    });
     //}


exports.testRegexRegex001 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                         PREFIX ex: <http://example.com/#>\
                         INSERT DATA {\
                           ex:foo rdf:value "abcDEFghiJKL" , "ABCdefGHIjkl", "0123456789",\
                                   <http://example.com/uri>, "http://example.com/literal" .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX rdf:     <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                                PREFIX ex: <http://example.com/#>\
                                SELECT ?val\
                                WHERE                \
                                { \
                                  ex:foo rdf:value ?val .\
                                  FILTER REGEX(?val, "GHI")\
                                }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 1);
                                    test.ok(results[0].val.value === "ABCdefGHIjkl")
                                    test.done();
                });
            });
        });
    });
}

exports.testRegexRegex002 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                         PREFIX ex: <http://example.com/#>\
                         INSERT DATA {\
                           ex:foo rdf:value "abcDEFghiJKL" , "ABCdefGHIjkl", "0123456789",\
                                   <http://example.com/uri>, "http://example.com/literal" .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX rdf:     <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                                PREFIX ex: <http://example.com/#>\
                                SELECT ?val\
                                WHERE                \
                                { \
                                  ex:foo rdf:value ?val .\
                                  FILTER REGEX(?val, "DeFghI", "i")\
                                }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 2);
                                    test.ok(results[0].val.value.toLowerCase() === "ABCdefGHIjkl".toLowerCase())
                                    test.ok(results[1].val.value.toLowerCase() === "ABCdefGHIjkl".toLowerCase())
                                    test.done();
                });
            });
        });
    });
}

exports.testRegexRegex003 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                         PREFIX ex: <http://example.com/#>\
                         INSERT DATA {\
                           ex:foo rdf:value "abcDEFghiJKL" , "ABCdefGHIjkl", "0123456789",\
                                   <http://example.com/uri>, "http://example.com/literal" .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX rdf:     <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                                PREFIX ex: <http://example.com/#>\
                                SELECT ?val\
                                WHERE                \
                                { \
                                  ex:foo rdf:value ?val .\
                                  FILTER REGEX(?val, "example\.com")\
                                }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 1);
                                    test.ok(results[0].val.value.toLowerCase() === "http://example.com/literal")
                                    test.done();
                });
            });
        });
    });
}

exports.testRegexRegex004 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                         PREFIX ex: <http://example.com/#>\
                         INSERT DATA {\
                           ex:foo rdf:value "abcDEFghiJKL" , "ABCdefGHIjkl", "0123456789",\
                                   <http://example.com/uri>, "http://example.com/literal" .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX rdf:     <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                                PREFIX ex: <http://example.com/#>\
                                SELECT ?val\
                                WHERE                \
                                { \
                                  ex:foo rdf:value ?val .\
                                  FILTER REGEX(STR(?val), "example\.com")\
                                }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 2);
                                    test.done();
                });
            });
        });
    });
}

exports.testSolutionSeqLimit1 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.com/ns#>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :x :num  "1"^^xsd:integer .\
                           :x :num  "2"^^xsd:integer .\
                           :x :num  "3"^^xsd:integer .\
                           :x :num  "4"^^xsd:integer .\
                           :x :num  "1.5"^^xsd:decimal .\
                           :y :num  "1"^^xsd:integer .\
                           :y :num  "2"^^xsd:integer .\
                           :y :num  "3"^^xsd:integer .\
                           :x :str  "aaa" .\
                           :x :str  "002" .\
                           :x :str  "1" .\
                           :x :str  "AAA" .\
                           :x :str  "" .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX xsd:     <http://www.w3.org/2001/XMLSchema#>\
                                PREFIX : <http://example.com/ns#>\
                                SELECT ?v\
                                WHERE { [] :num ?v }\
                                ORDER BY ?v\
                                LIMIT 1', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 1);
                                    test.ok(results[0].v.value === "1");
                                    test.done();
                });
            });
        });
    });
}

exports.testSolutionSeqLimit2 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.com/ns#>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :x :num  "1"^^xsd:integer .\
                           :x :num  "2"^^xsd:integer .\
                           :x :num  "3"^^xsd:integer .\
                           :x :num  "4"^^xsd:integer .\
                           :x :num  "1.5"^^xsd:decimal .\
                           :y :num  "1"^^xsd:integer .\
                           :y :num  "2"^^xsd:integer .\
                           :y :num  "3"^^xsd:integer .\
                           :x :str  "aaa" .\
                           :x :str  "002" .\
                           :x :str  "1" .\
                           :x :str  "AAA" .\
                           :x :str  "" .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX xsd:     <http://www.w3.org/2001/XMLSchema#>\
                                PREFIX : <http://example.com/ns#>\
                                SELECT ?v\
                                WHERE { [] :num ?v }\
                                ORDER BY ?v\
                                LIMIT 100', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 8);
                                    test.done();
                });
            });
        });
    });
}

exports.testSolutionSeqLimit3 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.com/ns#>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :x :num  "1"^^xsd:integer .\
                           :x :num  "2"^^xsd:integer .\
                           :x :num  "3"^^xsd:integer .\
                           :x :num  "4"^^xsd:integer .\
                           :x :num  "1.5"^^xsd:decimal .\
                           :y :num  "1"^^xsd:integer .\
                           :y :num  "2"^^xsd:integer .\
                           :y :num  "3"^^xsd:integer .\
                           :x :str  "aaa" .\
                           :x :str  "002" .\
                           :x :str  "1" .\
                           :x :str  "AAA" .\
                           :x :str  "" .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX xsd:     <http://www.w3.org/2001/XMLSchema#>\
                                PREFIX : <http://example.com/ns#>\
                                SELECT ?v\
                                WHERE { [] :num ?v }\
                                ORDER BY ?v\
                                LIMIT 0', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 0);
                                    test.done();
                });
            });
        });
    });
}

exports.testSolutionSeqLimit4 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.com/ns#>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :x :num  "1"^^xsd:integer .\
                           :x :num  "2"^^xsd:integer .\
                           :x :num  "3"^^xsd:integer .\
                           :x :num  "4"^^xsd:integer .\
                           :x :num  "1.5"^^xsd:decimal .\
                           :y :num  "1"^^xsd:integer .\
                           :y :num  "2"^^xsd:integer .\
                           :y :num  "3"^^xsd:integer .\
                           :x :str  "aaa" .\
                           :x :str  "002" .\
                           :x :str  "1" .\
                           :x :str  "AAA" .\
                           :x :str  "" .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX xsd:     <http://www.w3.org/2001/XMLSchema#>\
                                PREFIX : <http://example.com/ns#>\
                                SELECT DISTINCT ?v\
                                WHERE { [] :num ?v }\
                                ORDER BY ?v\
                                LIMIT 100', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 5);
                                    test.done();
                });
            });
        });
    });
}

exports.testSolutionSeqOffset1 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.com/ns#>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :x :num  "1"^^xsd:integer .\
                           :x :num  "2"^^xsd:integer .\
                           :x :num  "3"^^xsd:integer .\
                           :x :num  "4"^^xsd:integer .\
                           :x :num  "1.5"^^xsd:decimal .\
                           :y :num  "1"^^xsd:integer .\
                           :y :num  "2"^^xsd:integer .\
                           :y :num  "3"^^xsd:integer .\
                           :x :str  "aaa" .\
                           :x :str  "002" .\
                           :x :str  "1" .\
                           :x :str  "AAA" .\
                           :x :str  "" .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX xsd:     <http://www.w3.org/2001/XMLSchema#>\
                                PREFIX : <http://example.com/ns#>\
                                SELECT ?v\
                                WHERE { [] :num ?v }\
                                ORDER BY ?v\
                                OFFSET 1', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results[0].v.value==="1");
                                    test.ok(results[1].v.value==="1.5");
                                    test.ok(results[2].v.value==="2");
                                    test.ok(results[3].v.value==="2");
                                    test.ok(results[4].v.value==="3");
                                    test.ok(results[5].v.value==="3");
                                    test.ok(results[6].v.value==="4");
                                    test.ok(results.length === 7);
                                    test.done();
                });
            });
        });
    });
}

exports.testSolutionSeqOffset2 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.com/ns#>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :x :num  "1"^^xsd:integer .\
                           :x :num  "2"^^xsd:integer .\
                           :x :num  "3"^^xsd:integer .\
                           :x :num  "4"^^xsd:integer .\
                           :x :num  "1.5"^^xsd:decimal .\
                           :y :num  "1"^^xsd:integer .\
                           :y :num  "2"^^xsd:integer .\
                           :y :num  "3"^^xsd:integer .\
                           :x :str  "aaa" .\
                           :x :str  "002" .\
                           :x :str  "1" .\
                           :x :str  "AAA" .\
                           :x :str  "" .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX xsd:     <http://www.w3.org/2001/XMLSchema#>\
                                PREFIX : <http://example.com/ns#>\
                                SELECT ?v\
                                WHERE { [] :num ?v }\
                                ORDER BY ?v\
                                OFFSET 0', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results[0].v.value==="1");
                                    test.ok(results[1].v.value==="1");
                                    test.ok(results[2].v.value==="1.5");
                                    test.ok(results[3].v.value==="2");
                                    test.ok(results[4].v.value==="2");
                                    test.ok(results[5].v.value==="3");
                                    test.ok(results[6].v.value==="3");
                                    test.ok(results[7].v.value==="4");
                                    test.ok(results.length === 8);
                                    test.done();
                });
            });
        });
    });
}

exports.testSolutionSeqOffset3 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.com/ns#>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :x :num  "1"^^xsd:integer .\
                           :x :num  "2"^^xsd:integer .\
                           :x :num  "3"^^xsd:integer .\
                           :x :num  "4"^^xsd:integer .\
                           :x :num  "1.5"^^xsd:decimal .\
                           :y :num  "1"^^xsd:integer .\
                           :y :num  "2"^^xsd:integer .\
                           :y :num  "3"^^xsd:integer .\
                           :x :str  "aaa" .\
                           :x :str  "002" .\
                           :x :str  "1" .\
                           :x :str  "AAA" .\
                           :x :str  "" .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX xsd:     <http://www.w3.org/2001/XMLSchema#>\
                                PREFIX : <http://example.com/ns#>\
                                SELECT ?v\
                                WHERE { [] :num ?v }\
                                ORDER BY ?v\
                                OFFSET 100', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 0);
                                    test.done();
                });
            });
        });
    });
}

exports.testSolutionSeqOffset4 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.com/ns#>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :x :num  "1"^^xsd:integer .\
                           :x :num  "2"^^xsd:integer .\
                           :x :num  "3"^^xsd:integer .\
                           :x :num  "4"^^xsd:integer .\
                           :x :num  "1.5"^^xsd:decimal .\
                           :y :num  "1"^^xsd:integer .\
                           :y :num  "2"^^xsd:integer .\
                           :y :num  "3"^^xsd:integer .\
                           :x :str  "aaa" .\
                           :x :str  "002" .\
                           :x :str  "1" .\
                           :x :str  "AAA" .\
                           :x :str  "" .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX xsd:     <http://www.w3.org/2001/XMLSchema#>\
                                PREFIX : <http://example.com/ns#>\
                                SELECT DISTINCT ?v\
                                WHERE { [] :num ?v }\
                                ORDER BY ?v\
                                OFFSET 2', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 3);
                                    test.ok(results[0].v.value==="2");
                                    test.ok(results[1].v.value==="3");
                                    test.ok(results[2].v.value==="4");                                    
                                    test.done();
                });
            });
        });
    });
}

exports.testSolutionSeqSlice1 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.com/ns#>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :x :num  "1"^^xsd:integer .\
                           :x :num  "2"^^xsd:integer .\
                           :x :num  "3"^^xsd:integer .\
                           :x :num  "4"^^xsd:integer .\
                           :x :num  "1.5"^^xsd:decimal .\
                           :y :num  "1"^^xsd:integer .\
                           :y :num  "2"^^xsd:integer .\
                           :y :num  "3"^^xsd:integer .\
                           :x :str  "aaa" .\
                           :x :str  "002" .\
                           :x :str  "1" .\
                           :x :str  "AAA" .\
                           :x :str  "" .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX xsd:     <http://www.w3.org/2001/XMLSchema#>\
                                PREFIX : <http://example.com/ns#>\
                                SELECT ?v\
                                WHERE { [] :num ?v }\
                                ORDER BY ?v\
                                LIMIT 1\
                                OFFSET 1', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 1);
                                    test.ok(results[0].v.value==="1");
                                    test.done();
                });
            });
        });
    });
}

exports.testSolutionSeqSlice2 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.com/ns#>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :x :num  "1"^^xsd:integer .\
                           :x :num  "2"^^xsd:integer .\
                           :x :num  "3"^^xsd:integer .\
                           :x :num  "4"^^xsd:integer .\
                           :x :num  "1.5"^^xsd:decimal .\
                           :y :num  "1"^^xsd:integer .\
                           :y :num  "2"^^xsd:integer .\
                           :y :num  "3"^^xsd:integer .\
                           :x :str  "aaa" .\
                           :x :str  "002" .\
                           :x :str  "1" .\
                           :x :str  "AAA" .\
                           :x :str  "" .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX xsd:     <http://www.w3.org/2001/XMLSchema#>\
                                PREFIX : <http://example.com/ns#>\
                                SELECT ?v\
                                WHERE { [] :num ?v }\
                                ORDER BY ?v\
                                OFFSET 1\
                                LIMIT 2', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 2);
                                    test.ok(results[0].v.value==="1");
                                    test.ok(results[1].v.value==="1.5");
                                    test.done();
                });
            });
        });
    });
}

exports.testSolutionSeqSlice3 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.com/ns#>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :x :num  "1"^^xsd:integer .\
                           :x :num  "2"^^xsd:integer .\
                           :x :num  "3"^^xsd:integer .\
                           :x :num  "4"^^xsd:integer .\
                           :x :num  "1.5"^^xsd:decimal .\
                           :y :num  "1"^^xsd:integer .\
                           :y :num  "2"^^xsd:integer .\
                           :y :num  "3"^^xsd:integer .\
                           :x :str  "aaa" .\
                           :x :str  "002" .\
                           :x :str  "1" .\
                           :x :str  "AAA" .\
                           :x :str  "" .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX xsd:     <http://www.w3.org/2001/XMLSchema#>\
                                PREFIX : <http://example.com/ns#>\
                                SELECT ?v\
                                WHERE { [] ?p ?v }\
                                ORDER BY ?v\
                                OFFSET 100\
                                LIMIT 1', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 0);
                                    test.done();
                });
            });
        });
    });
}

exports.testSolutionSeqSlice4 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.com/ns#>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :x :num  "1"^^xsd:integer .\
                           :x :num  "2"^^xsd:integer .\
                           :x :num  "3"^^xsd:integer .\
                           :x :num  "4"^^xsd:integer .\
                           :x :num  "1.5"^^xsd:decimal .\
                           :y :num  "1"^^xsd:integer .\
                           :y :num  "2"^^xsd:integer .\
                           :y :num  "3"^^xsd:integer .\
                           :x :str  "aaa" .\
                           :x :str  "002" .\
                           :x :str  "1" .\
                           :x :str  "AAA" .\
                           :x :str  "" .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX xsd:     <http://www.w3.org/2001/XMLSchema#>\
                                PREFIX : <http://example.com/ns#>\
                                SELECT ?v\
                                WHERE { [] :num ?v }\
                                ORDER BY ?v\
                                OFFSET 2\
                                LIMIT 5', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 5);
                                    test.ok(results[0].v.value==="1.5");
                                    test.ok(results[1].v.value==="2");
                                    test.ok(results[2].v.value==="2");
                                    test.ok(results[3].v.value==="3");
                                    test.ok(results[4].v.value==="3");
                                    test.done();
                });
            });
        });
    });
}

exports.testSolutionSeqSlice5 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.com/ns#>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :x :num  "1"^^xsd:integer .\
                           :x :num  "2"^^xsd:integer .\
                           :x :num  "3"^^xsd:integer .\
                           :x :num  "4"^^xsd:integer .\
                           :x :num  "1.5"^^xsd:decimal .\
                           :y :num  "1"^^xsd:integer .\
                           :y :num  "2"^^xsd:integer .\
                           :y :num  "3"^^xsd:integer .\
                           :x :str  "aaa" .\
                           :x :str  "002" .\
                           :x :str  "1" .\
                           :x :str  "AAA" .\
                           :x :str  "" .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX xsd:     <http://www.w3.org/2001/XMLSchema#>\
                                PREFIX : <http://example.com/ns#>\
                                SELECT DISTINCT ?v\
                                WHERE { [] :num ?v }\
                                ORDER BY ?v\
                                OFFSET 2\
                                LIMIT 5', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 3);
                                    test.ok(results[0].v.value==="2");
                                    test.ok(results[1].v.value==="3");
                                    test.ok(results[2].v.value==="4");
                                    test.done();
                });
            });
        });
    });
}

exports.testAlgebraJoinCombo1 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                         INSERT DATA {\
                           :x1 :p "1"^^xsd:integer .\
                           :x1 :r "4"^^xsd:integer .\
                           :x2 :p "2"^^xsd:integer .\
                           :x2 :r "10"^^xsd:integer .\
                           :x2 :x "1"^^xsd:integer .\
                           :x3 :q "3"^^xsd:integer .\
                           :x3 :q "4"^^xsd:integer .\
                           :x3 :s "1"^^xsd:integer .\
                           :x3 :t :s .\
                           :p a rdf:Property .\
                           :x1 :z :p .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX : <http://example/>\
                                SELECT ?a ?y ?d ?z\
                                {\
                                      ?a :p ?c OPTIONAL { ?a :r ?d }. \
                                      ?a ?p 1 { ?p a ?y } UNION { ?a ?z ?p } \
                                }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 2);
                                    acum = [];
                                    results.sort(function(a,b){
                                        if(a.y.value == "http://www.w3.org/1999/02/22-rdf-syntax-ns#Property") {
                                            return -1;
                                        } else {
                                            return 1;
                                        }
                                    });
                                    test.ok(results[0].a.value === "http://example/x1")
                                    test.ok(results[0].y.value === "http://www.w3.org/1999/02/22-rdf-syntax-ns#Property")
                                    test.ok(results[0].d.value === "4")
                                    test.ok(results[1].a.value === "http://example/x1")
                                    test.ok(results[1].z.value === "http://example/z")
                                    test.ok(results[1].d.value === "4")

                                    test.done();
                });
            });
        });
    });
};

exports.testAlgebraJoinCombo1 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                         INSERT DATA {\
                           :x1 :p "1"^^xsd:integer .\
                           :x1 :r "4"^^xsd:integer .\
                           :x2 :p "2"^^xsd:integer .\
                           :x2 :r "10"^^xsd:integer .\
                           :x2 :x "1"^^xsd:integer .\
                           :x3 :q "3"^^xsd:integer .\
                           :x3 :q "4"^^xsd:integer .\
                           :x3 :s "1"^^xsd:integer .\
                           :x3 :t :s .\
                           :p a rdf:Property .\
                           :x1 :z :p .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX : <http://example/> \
                                SELECT ?a ?y ?d ?z \
                                {\
                                  ?a :p ?c OPTIONAL { ?a :r ?d }.\
                                  ?a ?p 1 { ?p a ?y } UNION { ?a ?z ?p }\
                                }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 2);
                                    acum = [];
                                    results.sort(function(a,b){
                                        if(a.y.value == "http://www.w3.org/1999/02/22-rdf-syntax-ns#Property") {
                                            return -1;
                                        } else {
                                            return 1;
                                        }
                                    });
                                    test.ok(results[0].a.value === "http://example/x1")
                                    test.ok(results[0].y.value === "http://www.w3.org/1999/02/22-rdf-syntax-ns#Property")
                                    test.ok(results[0].d.value === "4")
                                    test.ok(results[1].a.value === "http://example/x1")
                                    test.ok(results[1].z.value === "http://example/z")
                                    test.ok(results[1].d.value === "4")

                                    test.done();
                });
            });
        });
    });
}

exports.testAlgebraJoinCombo2 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                         INSERT DATA {\
                           GRAPH <join-combo-graph-2.ttl> {\
                             :x1 :p "1"^^xsd:integer .\
                             :x1 :r "4"^^xsd:integer .\
                             :x2 :p "2"^^xsd:integer .\
                             :x2 :r "10"^^xsd:integer .\
                             :x2 :x "1"^^xsd:integer .\
                             :x3 :q "3"^^xsd:integer .\
                             :x3 :q "4"^^xsd:integer .\
                             :x3 :s "1"^^xsd:integer .\
                             :x3 :t :s .\
                             :p a rdf:Property .\
                             :x1 :z :p .\
                           }\
                         }';
            engine.execute(query, function(success, result){



                var query2 = 'PREFIX : <http://example/>\
                              PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                              PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                              INSERT DATA {\
                                    GRAPH <join-combo-graph-1.ttl> {\
                                       :b :p "1"^^xsd:integer .\
                                      _:a :p "9"^^xsd:integer .\
                                    }\
                                  }';
                engine.execute(query2, function(success, result){

                    engine.execute('PREFIX : <http://example/>\
                                    SELECT ?x ?y ?z \
                                    { \
                                      GRAPH ?g { ?x ?p 1 } { ?x :p ?y } UNION { ?p a ?z }\
                                    }', function(success, results){
                                        test.ok(success === true);
                                        test.ok(results.length === 1);
                                        test.ok(results[0].x.value === "http://example/b");
                                        test.ok(results[0].z.value === "http://www.w3.org/1999/02/22-rdf-syntax-ns#Property");
                                        test.done();
                                    },
                                   [{"token": "uri", "prefix": null, "suffix": null, "value": "join-combo-graph-2.ttl"}], 
                                   [{"token": "uri", "prefix": null, "suffix": null, "value": "join-combo-graph-1.ttl"}]);
                });
            });
        });
    });
};


exports.testAlgebraOpt1 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                            :x1 :p "1"^^xsd:integer .\
                            :x2 :p "2"^^xsd:integer .\
                            :x3 :q "3"^^xsd:integer .\
                            :x3 :q "4"^^xsd:integer .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX : <http://example/> \
                                SELECT * \
                                {\
                                  :x1 :p ?v .\
                                  OPTIONAL\
                                  {\
                                    :x3 :q ?w .\
                                    OPTIONAL { :x2 :p ?v }\
                                  }\
                                }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 1);
                                    test.ok(results[0].v.value === "1");
                                    test.done();
                });
            });
        });
    });
}


exports.testAlgebraOpt2 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                            :x1 :p "1"^^xsd:integer .\
                            :x2 :p "2"^^xsd:integer .\
                            :x3 :q "3"^^xsd:integer .\
                            :x3 :q "4"^^xsd:integer .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX : <http://example/> \
                                SELECT * \
                                {\
                                  :x1 :p ?v .\
                                  OPTIONAL { :x3 :q ?w }\
                                  OPTIONAL { :x3 :q ?w  . :x2 :p ?v }\
                                }', function(success, results){
                                    test.ok(success === true);
                                    results.sort(function(a,b) {
                                        if(a.w.value === "4") {
                                            return 1;
                                        } else {
                                            return -1;
                                        }
                                    });
                                    
                                    test.ok(results[0].v.value === "1");	
                                    test.ok(results[0].w.value === "3");	
                                    test.ok(results[1].v.value === "1");	
                                    test.ok(results[1].w.value === "4");	
                                    test.done();
                });
            });
        });
    });
}

exports.testAlgebraOptFilter1 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                            :x1 :p "1"^^xsd:integer .\
                            :x2 :p "2"^^xsd:integer .\
                            :x3 :q "3"^^xsd:integer .\
                            :x3 :q "4"^^xsd:integer .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX : <http://example/> \
                                SELECT * \
                                {\
                                  ?x :p ?v .\
                                  OPTIONAL\
                                  { \
                                    ?y :q ?w .\
                                    FILTER(?v=2)\
                                  }\
                                }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 3);
                                    acum = [];
                                    for(var i=0; i<results.length; i++) {
                                        if(results[i].x.value === "http://example/x1") {
                                            test.ok(results[i].v.value === "1");
                                        } else {
                                            test.ok(results[i].x.value === "http://example/x2");
                                            acum.push(results[i].w.value);
                                            test.ok(results[i].v.value === "2");
                                        }
                                    }
                                    acum.sort();

                                    test.ok(acum[0] === "3");
                                    test.ok(acum[1] === "4");
                                    test.done();
                });
            });
        });
    });
}

exports.testAlgebraOptFilter2 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                            :x1 :p "1"^^xsd:integer .\
                            :x2 :p "2"^^xsd:integer .\
                            :x3 :q "3"^^xsd:integer .\
                            :x3 :q "4"^^xsd:integer .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX : <http://example/> \
                                SELECT * \
                                {\
                                  ?x :p ?v .\
                                  OPTIONAL\
                                  { \
                                    ?y :q ?w .\
                                    FILTER(?v=2)\
                                    FILTER(?w=3)\
                                  }\
                                }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length===2);
                                    test.done();
                });
            });
        });
    });
}

exports.testAlgebraOptFilter3 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                            :x1 :p "1"^^xsd:integer .\
                            :x2 :p "2"^^xsd:integer .\
                            :x3 :q "3"^^xsd:integer .\
                            :x3 :q "4"^^xsd:integer .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX : <http://example/> \
                                SELECT * \
                                {\
                                    :x :p ?v . \
                                    { :x :q ?w \
                                      OPTIONAL {  :x :p ?v2 FILTER(?v = 1) }\
                                    } \
                                }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 0);
                                    test.done();
                });
            });
        });
    });
}

exports.testAlgebraFilterPlacement1 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :x :p "1"^^xsd:integer .\
                           :x :p "2"^^xsd:integer .\
                           :x :p "3"^^xsd:integer .\
                           :x :p "4"^^xsd:integer .\
                           :x :q "1"^^xsd:integer .\
                           :x :q "2"^^xsd:integer .\
                           :x :q "3"^^xsd:integer .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX : <http://example/> \
                                SELECT * \
                                {\
                                    ?s :p ?v . \
                                    FILTER (?v = 2)\
                                }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length===1);
                                    test.ok(results[0].v.value==="2");
                                    test.done();
                });
            });
        });
    });
}

exports.testAlgebraFilterPlacement2 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :x :p "1"^^xsd:integer .\
                           :x :p "2"^^xsd:integer .\
                           :x :p "3"^^xsd:integer .\
                           :x :p "4"^^xsd:integer .\
                           :x :q "1"^^xsd:integer .\
                           :x :q "2"^^xsd:integer .\
                           :x :q "3"^^xsd:integer .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX : <http://example/> \
                                SELECT * \
                                {\
                                    FILTER (?v = 2)\
                                    ?s :p ?v .\
                                }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length===1);
                                    test.ok(results[0].v.value==="2");
                                    test.done();
                });
            });
        });
    });
}

exports.testAlgebraFilterPlacement3 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :x :p "1"^^xsd:integer .\
                           :x :p "2"^^xsd:integer .\
                           :x :p "3"^^xsd:integer .\
                           :x :p "4"^^xsd:integer .\
                           :x :q "1"^^xsd:integer .\
                           :x :q "2"^^xsd:integer .\
                           :x :q "3"^^xsd:integer .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX : <http://example/> \
                                SELECT * \
                                {\
                                    FILTER (?v = 2)\
                                    FILTER (?w = 3)\
                                    ?s :p ?v .\
                                    ?s :q ?w .\
                                }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length===1);
                                    test.ok(results[0].v.value==="2");
                                    test.ok(results[0].w.value==="3");
                                    test.done();
                });
            });
        });
    });
}

exports.testAlgebraNested1 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :x :p "1"^^xsd:integer .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX : <http://example/> \
                                SELECT ?v \
                                {\
                                  :x :p ?v . FILTER(?v = 1)\
                                }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length===1);
                                    test.ok(results[0].v.value==="1");
                                    test.done();
                });
            });
        });
    });
}

exports.testAlgebraNested1 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :x :p "1"^^xsd:integer .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX : <http://example/> \
                                SELECT ?v \
                                {\
                                  :x :p ?v . FILTER(?v = 1)\
                                }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length===1);
                                    test.ok(results[0].v.value==="1");
                                    test.done();
                });
            });
        });
    });
}

exports.testAlgebraNested2 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :x :p "1"^^xsd:integer .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX : <http://example/> \
                                SELECT ?v \
                                {\
                                  :x :p ?v . { FILTER(?v = 1) } \
                                }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length===0);
                                    test.done();
                });
            });
        });
    });
}

exports.testAlgebraNested2 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :x :p "1"^^xsd:integer .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX : <http://example/> \
                                SELECT ?v \
                                {\
                                  :x :p ?v . { FILTER(?v = 1) } \
                                }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length===0);
                                    test.done();
                });
            });
        });
    });
}


exports.testAlgebraFilterScope1 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :x :p "1"^^xsd:integer .\
                           :x :p "2"^^xsd:integer .\
                           :x :p "3"^^xsd:integer .\
                           :x :p "4"^^xsd:integer .\
                           :x :q "1"^^xsd:integer .\
                           :x :q "2"^^xsd:integer .\
                           :x :q "3"^^xsd:integer .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX : <http://example/> \
                                SELECT * \
                                {\
                                    :x :p ?v . \
                                    { :x :q ?w \
                                      OPTIONAL {  :x :p ?v2 FILTER(?v = 1) }\
                                    }\
                                }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length===12);
                                    acum = [];
                                    for(var i=0; i<results.length; i++) {
                                        acum.push(results[i].v.value+" "+results[i].w.value);
                                    }

                                    acum.sort();

                                    test.ok(results[0]= "1 1");
                                    test.ok(results[1]= "1 2");
                                    test.ok(results[2]= "1 3");

                                    test.ok(results[3]= "2 1");
                                    test.ok(results[4]= "2 2");
                                    test.ok(results[5]= "2 3");

                                    test.ok(results[6]= "3 1");
                                    test.ok(results[7]= "3 2");
                                    test.ok(results[8]= "3 3");

                                    test.ok(results[9]= "4 1");
                                    test.ok(results[10]= "4 2");
                                    test.ok(results[11]= "4 3");

                                    test.done();
                });
            });
        });
    });
}


exports.testAlgebraFilterScope2 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           _:B1 :name "paul" .\
                           _:B1 :phone "777-3426". \
                           _:B2 :name "john" . \
                           _:B2 :email <mailto:john@acd.edu> .\
                           _:B3 :name "george". \
                           _:B3 :webPage <http://www.george.edu/> .\
                           _:B4 :name "ringo". \
                           _:B4 :email <mailto:ringo@acd.edu> .\
                           _:B4 :webPage <http://www.starr.edu/> .\
                           _:B4 :phone "888-4537".\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX : <http://example/> \
                                SELECT * \
                                {\
                                   ?X  :name "paul"\
                                   {?Y :name "george" . OPTIONAL { ?X :email ?Z } }\
                                }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length===0);
                                    test.done();
                });
            });
        });
    });
};

exports.testAlgebraAsk1 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :x :p "1"^^xsd:integer .\
                           :x :p "2"^^xsd:integer .\
                           :x :p "3"^^xsd:integer .\
                           :y :p :a .\
                           :a :q :r .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX : <http://example/> \
                                  ASK { :x :p 1 }', function(success, results){
                                      test.ok(success === true);
                                      test.ok(results === true);
                                      test.done();
                });
            });
        });
    });
};

exports.testAlgebraAsk2 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :x :p "1"^^xsd:integer .\
                           :x :p "2"^^xsd:integer .\
                           :x :p "3"^^xsd:integer .\
                           :y :p :a .\
                           :a :q :r .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX : <http://example/> \
                                  ASK { :x :p 99 }', function(success, results){
                                      test.ok(success === true);
                                      test.ok(results === false);
                                      test.done();
                });
            });
        });
    });
};

exports.testAlgebraAsk7 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :x :p "1"^^xsd:integer .\
                           :x :p "2"^^xsd:integer .\
                           :x :p "3"^^xsd:integer .\
                           :y :p :a .\
                           :a :q :r .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX : <http://example/> \
                                  ASK { :x :p ?x }', function(success, results){
                                      test.ok(success === true);
                                      test.ok(results === true);
                                      test.done();
                });
            });
        });
    });
};

exports.testAlgebraAsk8 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :x :p "1"^^xsd:integer .\
                           :x :p "2"^^xsd:integer .\
                           :x :p "3"^^xsd:integer .\
                           :y :p :a .\
                           :a :q :r .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX : <http://example/> \
                                  ASK { :x :p ?x . FILTER(?x = 99) }', function(success, results){
                                      test.ok(success === true);
                                      test.ok(results === false);
                                      test.done();
                });
            });
        });
    });
};

exports.testBnodeCoreferenceDAWGBnodeCoref001 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX foaf: <http://xmlns.com/foaf/0.1/>\
                         PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                         PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\
                         INSERT DATA {\
                           _:alice\
                               rdf:type        foaf:Person ;\
                               foaf:name       "Alice" ;\
                               foaf:mbox       <mailto:alice@work> ;\
                               foaf:knows      _:bob ;\
                               .\
                           _:bob\
                               rdf:type        foaf:Person ;\
                               foaf:name       "Bob" ; \
                               foaf:knows      _:alice ;\
                               foaf:mbox       <mailto:bob@work> ;\
                               foaf:mbox       <mailto:bob@home> ;\
                               .\
                           _:eve\
                               rdf:type      foaf:Person ;\
                               foaf:name     "Eve" ; \
                               foaf:knows    _:fred ;\
                               .\
                           _:fred\
                               rdf:type      foaf:Person ;\
                               foaf:mbox     <mailto:fred@edu> .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                                PREFIX  foaf:       <http://xmlns.com/foaf/0.1/>\
                                SELECT ?x ?y\
                                WHERE {\
                                  ?x foaf:knows ?y .\
                                }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 3);
                                    var found = false;
                                    var tmpx1 = null;
                                    var tmpy1 = null;
                                    var tmpx2 = null;
                                    var tmpy2 = null;

                                    for(var i=0; i<results.length; i++) {
                                        if(i===0) {
                                            tmpx1 = results[0].x.value;
                                            tmpy1 = results[0].y.value;
                                        } else if(i===1) {
                                            tmpx2 = results[1].x.value;
                                            tmpy2 = results[1].y.value;
                                            if(tmpx2 === tmpy1 && tmpy2 === tmpx1) {
                                                found = true;
                                            }
                                        } else if(found === false) {
                                            var tmpx3 = results[2].x.value;
                                            var tmpy3 = results[2].y.value;
                                            if(tmpx3 === tmpy1 && tmpy3 === tmpx1) {
                                                found = true;
                                            } else if(tmpx3 === tmpy2 && tmpy3 === tmpx2) {
                                                found = true;
                                            }
                                        }
                                    }

                                    test.ok(found === true);
                                    test.done();
                });
            });
        });
    });
};

exports.testBoundDAWGBoundQuery001 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/ns#>\
                         INSERT DATA {\
                           :a1 :b :c1 .\
                           :c1 :d :e .\
                           :a2 :b :c2 .\
                           :c2 :b :f .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX : <http://example.org/ns#> \
                                SELECT  ?a ?c\
                                WHERE\
                                    { ?a :b ?c . \
                                      OPTIONAL\
                                        { ?c :d ?e } . \
                                      FILTER (! BOUND(?e)) \
                                }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 2);
                                    results.sort(function(a,b){
                                        if(a.a.value === b.a.value) {
                                            return 0;
                                        } else if(a.a.value < b.a.value) {
                                            return -1;
                                        } else {
                                            return 1;
                                        }
                                    });

                                    test.ok(results[0].a.value === "http://example.org/ns#a2")
                                    test.ok(results[0].c.value === "http://example.org/ns#c2")

                                    test.ok(results[1].a.value === "http://example.org/ns#c2")
                                    test.ok(results[1].c.value === "http://example.org/ns#f")

                                    test.done();
                });
            });
        });
    });
};

exports.testConstructConstruct1 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX foaf: <http://xmlns.com/foaf/0.1/>\
                         PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                         PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\
                         INSERT DATA {\
                         _:alice\
                             rdf:type        foaf:Person ;\
                             foaf:name       "Alice" ;\
                             foaf:mbox       <mailto:alice@work> ;\
                             foaf:knows      _:bob ;\
                             .\
                         _:bob\
                             rdf:type        foaf:Person ;\
                             foaf:name       "Bob" ; \
                             foaf:knows      _:alice ;\
                             foaf:mbox       <mailto:bob@work> ;\
                             foaf:mbox       <mailto:bob@home> ;\
                             .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                                PREFIX  foaf:       <http://xmlns.com/foaf/0.1/>\
                                CONSTRUCT { ?s ?p ?o . }\
                                WHERE {\
                                  ?s ?p ?o .\
                                }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.some(function(triple){
                                        return triple.predicate.toString()=== "http://xmlns.com/foaf/0.1/name" &&
                                            triple.object.nominalValue === "Alice";
                                    }));

                                    test.ok(results.some(function(triple){
                                        return triple.predicate.toString()=== "http://www.w3.org/1999/02/22-rdf-syntax-ns#type" &&
                                            triple.object.nominalValue === "http://xmlns.com/foaf/0.1/Person";
                                    }));

                                    test.ok(results.some(function(triple){
                                        return triple.predicate.toString()=== "http://xmlns.com/foaf/0.1/name" &&
                                            triple.object.nominalValue === "Bob";
                                    }));

                                    test.ok(results.some(function(triple){
                                        return triple.predicate.toString()=== "http://xmlns.com/foaf/0.1/mbox" &&
                                            triple.object.nominalValue === "mailto:alice@work";
                                    }));

                                    test.ok(results.some(function(triple){
                                        return triple.predicate.toString()=== "http://xmlns.com/foaf/0.1/mbox" &&
                                            triple.object.nominalValue === "mailto:bob@work";
                                    }));

                                    test.ok(results.some(function(triple){
                                        return triple.predicate.toString()=== "http://xmlns.com/foaf/0.1/mbox" &&
                                            triple.object.nominalValue === "mailto:bob@home";
                                    }));
                                    
                                    test.ok(results.toArray().length===9);
                                    test.done();
                });
            });
        });
    });
};

exports.testConstructConstruct2 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX foaf: <http://xmlns.com/foaf/0.1/>\
                         PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                         PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\
                         INSERT DATA {\
                         _:alice\
                             rdf:type        foaf:Person ;\
                             foaf:name       "Alice" ;\
                             foaf:mbox       <mailto:alice@work> ;\
                             foaf:knows      _:bob ;\
                             .\
                         _:bob\
                             rdf:type        foaf:Person ;\
                             foaf:name       "Bob" ; \
                             foaf:knows      _:alice ;\
                             foaf:mbox       <mailto:bob@work> ;\
                             foaf:mbox       <mailto:bob@home> ;\
                             .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                                PREFIX  foaf:       <http://xmlns.com/foaf/0.1/>\
                                CONSTRUCT { ?s foaf:name ?o . }\
                                WHERE {\
                                  ?s foaf:name ?o .\
                                }', function(success, results){
                                    test.ok(success === true);

                                    test.ok(results.some(function(triple){
                                        return triple.predicate.toString()=== "http://xmlns.com/foaf/0.1/name" &&
                                            triple.object.nominalValue === "Alice";
                                    }));

                                    test.ok(results.some(function(triple){
                                        return triple.predicate.toString()=== "http://xmlns.com/foaf/0.1/name" &&
                                            triple.object.nominalValue === "Bob";
                                    }));

                                    test.ok(results.toArray().length===2);
                                    test.done();
                });
            });
        });
    });
};

exports.testConstructConstruct3 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX foaf: <http://xmlns.com/foaf/0.1/>\
                         PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                         PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\
                         INSERT DATA {\
                         _:alice\
                             rdf:type        foaf:Person ;\
                             foaf:name       "Alice" ;\
                             foaf:mbox       <mailto:alice@work> ;\
                             foaf:knows      _:bob ;\
                             .\
                         _:bob\
                             rdf:type        foaf:Person ;\
                             foaf:name       "Bob" ; \
                             foaf:knows      _:alice ;\
                             foaf:mbox       <mailto:bob@home> ;\
                             .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                                PREFIX  foaf:       <http://xmlns.com/foaf/0.1/>\
                                CONSTRUCT { [ rdf:subject ?s ;\
                                              rdf:predicate ?p ;\
                                              rdf:object ?o ] . }\
                                WHERE {\
                                  ?s ?p ?o .\
                                }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.toArray().length === 24);
                                    test.done();
                });
            });
        });
    });
};

exports.testConstructConstruct4 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX foaf: <http://xmlns.com/foaf/0.1/>\
                         PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                         PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\
                         INSERT DATA {\
                         _:alice\
                             rdf:type        foaf:Person ;\
                             foaf:name       "Alice" ;\
                             foaf:mbox       <mailto:alice@work> ;\
                             foaf:knows      _:bob ;\
                             .\
                         _:bob\
                             rdf:type        foaf:Person ;\
                             foaf:name       "Bob" ; \
                             foaf:knows      _:alice ;\
                             foaf:mbox       <mailto:bob@home> ;\
                             .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                                PREFIX  foaf:       <http://xmlns.com/foaf/0.1/>\
                                CONSTRUCT { _:a rdf:subject ?s ;\
                                            rdf:predicate ?p ;\
                                            rdf:object ?o  . }\
                                WHERE {\
                                  ?s ?p ?o .\
                                }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.toArray().length === 24);
                                    test.done();
                });
            });
        });
    });
};

exports.testConstructConstruct5 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :x :p :a .\
                           :x :p :b .\
                           :x :p :c .\
                           :x :p "1"^^xsd:integer .\
                           :a :q "2"^^xsd:integer .\
                           :a :r "2"^^xsd:integer .\
                           :b :q "2"^^xsd:integer .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX : <http://example/>\
                                CONSTRUCT { ?x :p2 ?v }\
                                WHERE\
                                {\
                                  ?x :p ?o .\
                                  OPTIONAL {?o :q ?v }\
                                }', function(success, results){
                                      test.ok(success === true);
                                      test.ok(results.toArray().length === 1);
                                    test.done();
                });
            });
        });
    });
};

exports.testDistinctDistinctStar1 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :x1 :p "abc" .\
                           :x1 :q "abc" .\
                           :x2 :p "abc" .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX :         <http://example/> \
                                PREFIX xsd:      <http://www.w3.org/2001/XMLSchema#> \
                                SELECT DISTINCT * \
                                WHERE { \
                                  { ?s :p ?o } UNION { ?s :q ?o }\
                                }', function(success, results){
                                    test.ok(success === true);
                                    results.sort(function(a,b) {
                                        if(a.s.value === "http://example/x1") {
                                            return -1;
                                        } else {
                                            return 1;
                                        }
                                    });

                                    test.ok(results[0].s.value === "http://example/x1");
                                    test.ok(results[0].o.value === "abc");
                                    test.ok(results[1].s.value === "http://example/x2");
                                    test.ok(results[1].o.value === "abc");
                                    test.done();
                });
            });
        });
    });
};

exports.testDistinctNoDistinct1 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :x1 :p1 "1"^^xsd:integer .\
                           :x1 :p2 "1"^^xsd:integer .\
                           :x2 :p1 "1"^^xsd:integer .\
                           :x2 :p2 "1"^^xsd:integer .\
                           :x3 :p1 "01"^^xsd:integer .\
                           :x3 :p2 "01"^^xsd:integer .\
                           :x4 :p1 "+1"^^xsd:integer .\
                           :x4 :p2 "+1"^^xsd:integer .\
                           :y1 :p1 "1.0"^^xsd:decimal .\
                           :y1 :p2 "1.0"^^xsd:decimal .\
                           :y2 :p1 "+1.0"^^xsd:decimal .\
                           :y2 :p2 "+1.0"^^xsd:decimal .\
                           :y3 :p1 "01.0"^^xsd:decimal .\
                           :y3 :p2 "01.0"^^xsd:decimal .\
                           :z1 :p1 "1.0e0"^^xsd:double .\
                           :z1 :p2 "1.0e0"^^xsd:double .\
                           :z2 :p1 "1.0e0"^^xsd:double .\
                           :z2 :p2 "1.0e0"^^xsd:double .\
                           :z3 :p1 "1.3e0"^^xsd:double .\
                           :z3 :p2 "1.3e0"^^xsd:double .\
                           :z4 :p1 "1.3e0"^^xsd:double .\
                           :z5 :p1 "1.3e0"^^xsd:float .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('SELECT ?v \
                                WHERE { \
                                  ?x ?p ?v\
                                }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 22);
                                    test.done();
                });
            });
        });
    });
};

exports.testDistinctDistinct1 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :x1 :p1 "1"^^xsd:integer .\
                           :x1 :p2 "1"^^xsd:integer .\
                           :x2 :p1 "1"^^xsd:integer .\
                           :x2 :p2 "1"^^xsd:integer .\
                           :x3 :p1 "01"^^xsd:integer .\
                           :x3 :p2 "01"^^xsd:integer .\
                           :x4 :p1 "+1"^^xsd:integer .\
                           :x4 :p2 "+1"^^xsd:integer .\
                           :y1 :p1 "1.0"^^xsd:decimal .\
                           :y1 :p2 "1.0"^^xsd:decimal .\
                           :y2 :p1 "+1.0"^^xsd:decimal .\
                           :y2 :p2 "+1.0"^^xsd:decimal .\
                           :y3 :p1 "01.0"^^xsd:decimal .\
                           :y3 :p2 "01.0"^^xsd:decimal .\
                           :z1 :p1 "1.0e0"^^xsd:double .\
                           :z1 :p2 "1.0e0"^^xsd:double .\
                           :z2 :p1 "1.0e0"^^xsd:double .\
                           :z2 :p2 "1.0e0"^^xsd:double .\
                           :z3 :p1 "1.3e0"^^xsd:double .\
                           :z3 :p2 "1.3e0"^^xsd:double .\
                           :z4 :p1 "1.3e0"^^xsd:double .\
                           :z5 :p1 "1.3e0"^^xsd:float .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX :      <http://example/> \
                                PREFIX xsd:   <http://www.w3.org/2001/XMLSchema#>\
                                SELECT DISTINCT ?v \
                                WHERE { \
                                  ?x ?p ?v\
                                }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 9);
                                    test.done();
                });
            });
        });
    });
};

exports.testDistinctNoDistinct2 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :x1 :p "abc" .\
                           :x1 :q "abc" .\
                           :x2 :p "abc"@en .\
                           :x2 :q "abc"@en .\
                           :x3 :p "ABC" .\
                           :x3 :q "ABC" .\
                           :x4 :p "ABC"@en .\
                           :x4 :q "ABC"@en .\
                           :x5 :p "abc"^^xsd:string .\
                           :x5 :q "abc"^^xsd:string .\
                           :x6 :p "ABC"^^xsd:string .\
                           :x6 :q "ABC"^^xsd:string .\
                           :x7 :p "" .\
                           :x7 :q "" .\
                           :x8 :p ""@en .\
                           :x8 :q ""@en .\
                           :x9 :p ""^^xsd:string .\
                           :x9 :q ""^^xsd:string .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('SELECT ?v \
                                WHERE { \
                                  ?x ?p ?v .\
                                }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 18);
                                    test.done();
                });
            });
        });
    });
};

exports.testDistinctDistinct2 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :x1 :p "abc" .\
                           :x1 :q "abc" .\
                           :x2 :p "abc"@en .\
                           :x2 :q "abc"@en .\
                           :x3 :p "ABC" .\
                           :x3 :q "ABC" .\
                           :x4 :p "ABC"@en .\
                           :x4 :q "ABC"@en .\
                           :x5 :p "abc"^^xsd:string .\
                           :x5 :q "abc"^^xsd:string .\
                           :x6 :p "ABC"^^xsd:string .\
                           :x6 :q "ABC"^^xsd:string .\
                           :x7 :p "" .\
                           :x7 :q "" .\
                           :x8 :p ""@en .\
                           :x8 :q ""@en .\
                           :x9 :p ""^^xsd:string .\
                           :x9 :q ""^^xsd:string .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX :      <http://example/> \
                                PREFIX xsd:   <http://www.w3.org/2001/XMLSchema#>\
                                SELECT DISTINCT ?v \
                                { \
                                  ?x ?p ?v .\
                                }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 9);
                                    test.done();
                });
            });
        });
    });
};

exports.testDistinctNoDistinct3 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :x1 :p1 :z1 .\
                           :x1 :p1 _:a .\
                           :x1 :p2 :z1 .\
                           :x1 :p2 _:a .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('SELECT ?v \
                                { \
                                  ?x ?p ?v .\
                                }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 4);
                                    test.done();
                });
            });
        });
    });
};

exports.testDistinctDistinct3 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :x1 :p1 :z1 .\
                           :x1 :p1 _:a .\
                           :x1 :p2 :z1 .\
                           :x1 :p2 _:a .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX :      <http://example/> \
                                PREFIX xsd:   <http://www.w3.org/2001/XMLSchema#>\
                                SELECT DISTINCT ?v \
                                { \
                                  ?x ?p ?v .\
                                }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 2);
                                    test.done();
                });
            });
        });
    });
};

exports.testDistinctNoDistinct4 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :x1 :p1 :z1 .\
                           :x1 :p1 :z2 .\
                           :x1 :p1 _:a .\
                           :x1 :p2 :z1 .\
                           :x1 :p2 :z2 .\
                           :x1 :p2 _:a .\
                           :z1 :q  :r .\
                           _:a :q  :s .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX :      <http://example/> \
                                PREFIX xsd:   <http://www.w3.org/2001/XMLSchema#>\
                                SELECT ?v \
                                { \
                                    :x1 ?p ?o\
                                    OPTIONAL { ?o :q ?v }\
                                }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 6);
                                    test.done();
                });
            });
        });
    });
};

exports.testDistinctDistinct4 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :x1 :p1 :z1 .\
                           :x1 :p1 :z2 .\
                           :x1 :p1 _:a .\
                           :x1 :p2 :z1 .\
                           :x1 :p2 :z2 .\
                           :x1 :p2 _:a .\
                           :z1 :q  :r .\
                           _:a :q  :s .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX :      <http://example/> \
                                PREFIX xsd:   <http://www.w3.org/2001/XMLSchema#>\
                                SELECT DISTINCT ?v \
                                { \
                                    :x1 ?p ?o\
                                    OPTIONAL { ?o :q ?v }\
                                }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 3);
                                    test.done();
                });
            });
        });
    });
};

exports.testDistinctNoDistinct9 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :x1 :p1 "1"^^xsd:integer .\
                           :x1 :p2 "1"^^xsd:integer .\
                           :x2 :p1 "1"^^xsd:integer .\
                           :x2 :p2 "1"^^xsd:integer .\
                           :x3 :p1 "01"^^xsd:integer .\
                           :x3 :p2 "01"^^xsd:integer .\
                           :x4 :p1 "+1"^^xsd:integer .\
                           :x4 :p2 "+1"^^xsd:integer .\
                           :y1 :p1 "1.0"^^xsd:decimal .\
                           :y1 :p2 "1.0"^^xsd:decimal .\
                           :y2 :p1 "+1.0"^^xsd:decimal .\
                           :y2 :p2 "+1.0"^^xsd:decimal .\
                           :y3 :p1 "01.0"^^xsd:decimal .\
                           :y3 :p2 "01.0"^^xsd:decimal .\
                           :z1 :p1 "1.0e0"^^xsd:double .\
                           :z1 :p2 "1.0e0"^^xsd:double .\
                           :z2 :p1 "1.0e0"^^xsd:double .\
                           :z2 :p2 "1.0e0"^^xsd:double .\
                           :z3 :p1 "1.3e0"^^xsd:double .\
                           :z3 :p2 "1.3e0"^^xsd:double .\
                           :z4 :p1 "1.3e0"^^xsd:double .\
                           :z5 :p1 "1.3e0"^^xsd:float .\
                           :x1 :p "abc" .\
                           :x1 :q "abc" .\
                           :x2 :p "abc"@en .\
                           :x2 :q "abc"@en .\
                           :x3 :p "ABC" .\
                           :x3 :q "ABC" .\
                           :x4 :p "ABC"@en .\
                           :x4 :q "ABC"@en .\
                           :x5 :p "abc"^^xsd:string .\
                           :x5 :q "abc"^^xsd:string .\
                           :x6 :p "ABC"^^xsd:string .\
                           :x6 :q "ABC"^^xsd:string .\
                           :x7 :p "" .\
                           :x7 :q "" .\
                           :x8 :p ""@en .\
                           :x8 :q ""@en .\
                           :x9 :p ""^^xsd:string .\
                           :x9 :q ""^^xsd:string .\
                           :x1 :p1 :z1 .\
                           :x1 :p1 _:a .\
                           :x1 :p2 :z1 .\
                           :x1 :p2 _:a .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('SELECT ?v \
                                { \
                                  ?x ?p ?v .\
                                }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 44);
                                    test.done();
                });
            });
        });
    });
};


exports.testDistinctDistinct9 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :x1 :p1 "1"^^xsd:integer .\
                           :x1 :p2 "1"^^xsd:integer .\
                           :x2 :p1 "1"^^xsd:integer .\
                           :x2 :p2 "1"^^xsd:integer .\
                           :x3 :p1 "01"^^xsd:integer .\
                           :x3 :p2 "01"^^xsd:integer .\
                           :x4 :p1 "+1"^^xsd:integer .\
                           :x4 :p2 "+1"^^xsd:integer .\
                           :y1 :p1 "1.0"^^xsd:decimal .\
                           :y1 :p2 "1.0"^^xsd:decimal .\
                           :y2 :p1 "+1.0"^^xsd:decimal .\
                           :y2 :p2 "+1.0"^^xsd:decimal .\
                           :y3 :p1 "01.0"^^xsd:decimal .\
                           :y3 :p2 "01.0"^^xsd:decimal .\
                           :z1 :p1 "1.0e0"^^xsd:double .\
                           :z1 :p2 "1.0e0"^^xsd:double .\
                           :z2 :p1 "1.0e0"^^xsd:double .\
                           :z2 :p2 "1.0e0"^^xsd:double .\
                           :z3 :p1 "1.3e0"^^xsd:double .\
                           :z3 :p2 "1.3e0"^^xsd:double .\
                           :z4 :p1 "1.3e0"^^xsd:double .\
                           :z5 :p1 "1.3e0"^^xsd:float .\
                           :x1 :p "abc" .\
                           :x1 :q "abc" .\
                           :x2 :p "abc"@en .\
                           :x2 :q "abc"@en .\
                           :x3 :p "ABC" .\
                           :x3 :q "ABC" .\
                           :x4 :p "ABC"@en .\
                           :x4 :q "ABC"@en .\
                           :x5 :p "abc"^^xsd:string .\
                           :x5 :q "abc"^^xsd:string .\
                           :x6 :p "ABC"^^xsd:string .\
                           :x6 :q "ABC"^^xsd:string .\
                           :x7 :p "" .\
                           :x7 :q "" .\
                           :x8 :p ""@en .\
                           :x8 :q ""@en .\
                           :x9 :p ""^^xsd:string .\
                           :x9 :q ""^^xsd:string .\
                           :x1 :p1 :z1 .\
                           :x1 :p1 _:a .\
                           :x1 :p2 :z1 .\
                           :x1 :p2 _:a .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('SELECT DISTINCT ?v \
                                { \
                                  ?x ?p ?v .\
                                }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 20);
                                    test.done();
                });
            });
        });
    });
};

exports.testExprEqualsEq1 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :xi1 :p  "1"^^xsd:integer .\
                           :xi2 :p  "1"^^xsd:integer .\
                           :xi3 :p  "01"^^xsd:integer .\
                           :xd1 :p  "1.0e0"^^xsd:double .\
                           :xd2 :p  "1.0"^^xsd:double .\
                           :xd3 :p  "1"^^xsd:double .\
                           :xt1 :p  "zzz"^^:myType .\
                           :xp1 :p  "zzz" .\
                           :xp2 :p  "1" .\
                           :xu :p  :z .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX  xsd: <http://www.w3.org/2001/XMLSchema#>\
                                PREFIX  : <http://example/>\
                                SELECT  ?x\
                                WHERE\
                                    { ?x :p ?v . \
                                      FILTER ( ?v = 1 ) .\
                                    }', function(success, results){
                                        test.ok(success === true);
                                        test.ok(results.length === 6);
                                        test.done();
                });
            });
        });
    });
};

exports.testExprEqualsEq2 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :xi1 :p  "1"^^xsd:integer .\
                           :xi2 :p  "1"^^xsd:integer .\
                           :xi3 :p  "01"^^xsd:integer .\
                           :xd1 :p  "1.0e0"^^xsd:double .\
                           :xd2 :p  "1.0"^^xsd:double .\
                           :xd3 :p  "1"^^xsd:double .\
                           :xt1 :p  "zzz"^^:myType .\
                           :xp1 :p  "zzz" .\
                           :xp2 :p  "1" .\
                           :xu :p  :z .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX  xsd: <http://www.w3.org/2001/XMLSchema#>\
                                PREFIX  : <http://example/>\
                                SELECT  ?x\
                                WHERE\
                                    { ?x :p ?v . \
                                      FILTER ( ?v = 1.0e0 )  .\
                                    }', function(success, results){
                                        test.ok(success === true);
                                        test.ok(results.length === 6);
                                        test.done();
                });
            });
        });
    });
};

exports.testExprEqualsEq3 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :xi1 :p  "1"^^xsd:integer .\
                           :xi2 :p  "1"^^xsd:integer .\
                           :xi3 :p  "01"^^xsd:integer .\
                           :xd1 :p  "1.0e0"^^xsd:double .\
                           :xd2 :p  "1.0"^^xsd:double .\
                           :xd3 :p  "1"^^xsd:double .\
                           :xt1 :p  "zzz"^^:myType .\
                           :xp1 :p  "zzz" .\
                           :xp2 :p  "1" .\
                           :xu :p  :z .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX  xsd: <http://www.w3.org/2001/XMLSchema#>\
                                PREFIX  : <http://example/>\
                                SELECT  ?x\
                                WHERE\
                                    { ?x :p ?v . \
                                      FILTER ( ?v = "1" )  .\
                                    }', function(success, results){
                                        test.ok(success === true);
                                        test.ok(results.length === 1);
                                        test.done();
                });
            });
        });
    });
};

exports.testExprEqualsEq4 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :xi1 :p  "1"^^xsd:integer .\
                           :xi2 :p  "1"^^xsd:integer .\
                           :xi3 :p  "01"^^xsd:integer .\
                           :xd1 :p  "1.0e0"^^xsd:double .\
                           :xd2 :p  "1.0"^^xsd:double .\
                           :xd3 :p  "1"^^xsd:double .\
                           :xt1 :p  "zzz"^^:myType .\
                           :xp1 :p  "zzz" .\
                           :xp2 :p  "1" .\
                           :xu :p  :z .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX  xsd: <http://www.w3.org/2001/XMLSchema#>\
                                PREFIX  : <http://example/>\
                                SELECT  ?x\
                                WHERE\
                                    { ?x :p ?v . \
                                      FILTER ( ?v = "zzz" )  .\
                                    }', function(success, results){
                                        test.ok(success === true);
                                        test.ok(results.length === 1);
                                        test.done();
                });
            });
        });
    });
};

exports.testExprEqualsEq5 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :xi1 :p  "1"^^xsd:integer .\
                           :xi2 :p  "1"^^xsd:integer .\
                           :xi3 :p  "01"^^xsd:integer .\
                           :xd1 :p  "1.0e0"^^xsd:double .\
                           :xd2 :p  "1.0"^^xsd:double .\
                           :xd3 :p  "1"^^xsd:double .\
                           :xt1 :p  "zzz"^^:myType .\
                           :xp1 :p  "zzz" .\
                           :xp2 :p  "1" .\
                           :xu :p  :z .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX  xsd: <http://www.w3.org/2001/XMLSchema#>\
                                PREFIX  : <http://example/>\
                                SELECT  ?x\
                                WHERE\
                                    { ?x :p ?v . \
                                      FILTER ( ?v = :z  ) .\
                                    }', function(success, results){
                                        test.ok(success === true);
                                        test.ok(results.length === 1);
                                        test.done();
                });
            });
        });
    });
};

exports.testExprEqualsEq21 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :xi1 :p  "1"^^xsd:integer .\
                           :xi2 :p  "1"^^xsd:integer .\
                           :xi3 :p  "01"^^xsd:integer .\
                           :xd1 :p  "1.0e0"^^xsd:double .\
                           :xd2 :p  "1.0"^^xsd:double .\
                           :xd3 :p  "1"^^xsd:double .\
                           :xt1 :p  "zzz"^^:myType .\
                           :xp1 :p  "zzz" .\
                           :xp2 :p  "1" .\
                           :xu :p  :z .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX  xsd: <http://www.w3.org/2001/XMLSchema#>\
                                PREFIX  : <http://example/>\
                                SELECT  ?v1 ?v2\
                                WHERE\
                                    { ?x1 :p ?v1 .\
                                      ?x2 :p ?v2 .\
                                      FILTER ( ?v1 = ?v2 ) .\
                                    }', function(success, results){
                                        test.ok(success === true);
                                        test.ok(results.length === 40);
                                        test.done();
                });
            });
        });
    });
};

exports.testExprEqualsEq22 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :xi1 :p  "1"^^xsd:integer .\
                           :xi2 :p  "1"^^xsd:integer .\
                           :xi3 :p  "01"^^xsd:integer .\
                           :xd1 :p  "1.0e0"^^xsd:double .\
                           :xd2 :p  "1.0"^^xsd:double .\
                           :xd3 :p  "1"^^xsd:double .\
                           :xt1 :p  "zzz"^^:myType .\
                           :xp1 :p  "zzz" .\
                           :xp2 :p  "1" .\
                           :xu :p  :z .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX  xsd: <http://www.w3.org/2001/XMLSchema#>\
                                PREFIX  : <http://example/>\
                                SELECT  ?v1 ?v2\
                                WHERE\
                                    { ?x1 :p ?v1 .\
                                      ?x2 :p ?v2 .\
                                      FILTER ( ?v1 != ?v2 ) .\
                                    }', function(success, results){
                                        test.ok(success === true);
                                        test.ok(results.length === 20);
                                        test.done();
                });
            });
        });
    });
};

exports.testExprEqualsEqGraph1 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :xi1 :p  "1"^^xsd:integer .\
                           :xi2 :p  "1"^^xsd:integer .\
                           :xi3 :p  "01"^^xsd:integer .\
                           :xd1 :p  "1.0e0"^^xsd:double .\
                           :xd2 :p  "1.0"^^xsd:double .\
                           :xd3 :p  "1"^^xsd:double .\
                           :xt1 :p  "zzz"^^:myType .\
                           :xp1 :p  "zzz" .\
                           :xp2 :p  "1" .\
                           :xu :p  :z .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX  xsd: <http://www.w3.org/2001/XMLSchema#>\
                                PREFIX  : <http://example/>\
                                SELECT  ?x\
                                WHERE\
                                    { ?x :p 1 . \
                                    }', function(success, results){
                                        test.ok(success === true);
                                        test.ok(results.length === 2);
                                        test.done();
                });
            });
        });
    });
};

exports.testExprEqualsEqGraph2 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :xi1 :p  "1"^^xsd:integer .\
                           :xi2 :p  "1"^^xsd:integer .\
                           :xi3 :p  "01"^^xsd:integer .\
                           :xd1 :p  "1.0e0"^^xsd:double .\
                           :xd2 :p  "1.0"^^xsd:double .\
                           :xd3 :p  "1"^^xsd:double .\
                           :xt1 :p  "zzz"^^:myType .\
                           :xp1 :p  "zzz" .\
                           :xp2 :p  "1" .\
                           :xu :p  :z .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX  xsd: <http://www.w3.org/2001/XMLSchema#>\
                                PREFIX  : <http://example/>\
                                SELECT  ?x\
                                WHERE\
                                    { ?x :p 1.0e0 . \
                                    }', function(success, results){
                                        test.ok(success === true);
                                        test.ok(results.length === 1);
                                        test.done();
                });
            });
        });
    });
};

exports.testExprEqualsEqGraph3 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :xi1 :p  "1"^^xsd:integer .\
                           :xi2 :p  "1"^^xsd:integer .\
                           :xi3 :p  "01"^^xsd:integer .\
                           :xd1 :p  "1.0e0"^^xsd:double .\
                           :xd2 :p  "1.0"^^xsd:double .\
                           :xd3 :p  "1"^^xsd:double .\
                           :xt1 :p  "zzz"^^:myType .\
                           :xp1 :p  "zzz" .\
                           :xp2 :p  "1" .\
                           :xu :p  :z .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX  xsd: <http://www.w3.org/2001/XMLSchema#>\
                                PREFIX  : <http://example/>\
                                SELECT  ?x\
                                WHERE\
                                    { ?x :p "1" . \
                                    }', function(success, results){
                                        test.ok(success === true);
                                        test.ok(results.length === 1);
                                        test.done();
                });
            });
        });
    });
};

exports.testExprEqualsEqGraph4 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :xi1 :p  "1"^^xsd:integer .\
                           :xi2 :p  "1"^^xsd:integer .\
                           :xi3 :p  "01"^^xsd:integer .\
                           :xd1 :p  "1.0e0"^^xsd:double .\
                           :xd2 :p  "1.0"^^xsd:double .\
                           :xd3 :p  "1"^^xsd:double .\
                           :xt1 :p  "zzz"^^:myType .\
                           :xp1 :p  "zzz" .\
                           :xp2 :p  "1" .\
                           :xu :p  :z .\
                         }';
            engine.execute(query, function(success, result){
                engine.execute('PREFIX  xsd: <http://www.w3.org/2001/XMLSchema#>\
                                PREFIX  : <http://example/>\
                                SELECT  ?x\
                                WHERE\
                                    { ?x :p "zzz" . \
                                    }', function(success, results){
                                        test.ok(success === true);
                                        test.ok(results.length === 1);
                                        test.done();
                });
            });
        });
    });
};

exports.testI18nKanji1 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX owl: <http://www.w3.org/2002/07/owl#>\
                         PREFIX foaf: <http://xmlns.com/foaf/0.1/>\
                         PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\
                         PREFIX 食: <http://www.w3.org/2001/sw/DataAccess/tests/data/i18n/kanji.ttl#>\
                         INSERT DATA {\
                           _:alice foaf:name "Alice" ;\
                                   食:食べる   食:納豆 .\
                           _:bob   foaf:name "Bob" ;\
                                   食:食べる   食:海老 .\
                         }';

            engine.execute(query, function(success, result){
                engine.execute('PREFIX foaf: <http://xmlns.com/foaf/0.1/>\
                                PREFIX 食: <http://www.w3.org/2001/sw/DataAccess/tests/data/i18n/kanji.ttl#>\
                                SELECT ?name ?food WHERE {\
                                  [ foaf:name ?name ;\
                                    食:食べる ?food ] . }', function(success, results){
                                        test.ok(success === true);
                                        test.ok(results.length === 2);
                                        test.done();
                });
            });
        });
    });
};

exports.testI18nKanji2 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX owl: <http://www.w3.org/2002/07/owl#>\
                         PREFIX foaf: <http://xmlns.com/foaf/0.1/>\
                         PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\
                         PREFIX 食: <http://www.w3.org/2001/sw/DataAccess/tests/data/i18n/kanji.ttl#>\
                         INSERT DATA {\
                           _:alice foaf:name "Alice" ;\
                                   食:食べる   食:納豆 .\
                           _:bob   foaf:name "Bob" ;\
                                   食:食べる   食:海老 .\
                         }';

            engine.execute(query, function(success, result){
                engine.execute('PREFIX foaf: <http://xmlns.com/foaf/0.1/>\
                                PREFIX 食: <http://www.w3.org/2001/sw/DataAccess/tests/data/i18n/kanji.ttl#>\
                                SELECT ?name WHERE {\
                                  [ foaf:name ?name ;\
                                    食:食べる 食:海老 ] . }', function(success, results){
                                        test.ok(success === true);
                                        test.ok(results.length === 1);
                                        test.done();
                });
            });
        });
    });
};

exports.testI18nNormalization1 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX owl: <http://www.w3.org/2002/07/owl#>\
                         PREFIX foaf: <http://xmlns.com/foaf/0.1/>\
                         PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\
                         PREFIX HR: <http://www.w3.org/2001/sw/DataAccess/tests/data/i18n/normalization.ttl#>\
                         INSERT DATA {\
                           [] foaf:name "Alice" ;\
                             HR:resumé "Alice\'s normalized resumé"  .\
                           [] foaf:name "Bob" ;\
                             HR:resumé "Bob\'s non-normalized resumé" .\
                           [] foaf:name "Eve" ;\
                             HR:resumé "Eve\'s normalized resumé" ;\
                             HR:resumé "Eve\'s non-normalized resumé" .\
                         }';

            engine.execute(query, function(success, result){
                engine.execute('PREFIX foaf: <http://xmlns.com/foaf/0.1/>\
                                PREFIX HR: <http://www.w3.org/2001/sw/DataAccess/tests/data/i18n/normalization.ttl#>\
                                SELECT ?name WHERE {\
                                  [ foaf:name ?name; \
                                    HR:resumé ?resume ] . }', function(success, results){
                                        test.ok(success === true);
                                        test.ok(results.length === 2);
                                        test.done();
                });
            });
        });
    });
};

exports.testI18nNormalization2 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/vocab#>\
                         INSERT DATA {\
                           :s1 :p <example://a/b/c/%7Bfoo%7D#xyz>.\
                           :s2 :p <eXAMPLE://a/./b/../b/%63/%7bfoo%7d#xyz>.\
                         }';

            engine.execute(query, function(success, result){
                engine.execute('PREFIX : <http://example/vocab#>\
                                PREFIX p1: <eXAMPLE://a/./b/../b/%63/%7bfoo%7d#>\
                                SELECT ?S WHERE { ?S :p p1:xyz }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 1);
                                    test.done();
                });
            });
        });
    });
};

exports.testI18nNormalization3 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/vocab#>\
                         INSERT DATA {\
                           :s3 :p <http://example.com:80/#abc>.\
                           :s4 :p <http://example.com/#abc>.\
                           :s5 :p <http://example.com/#abc>.\
                         }';

            engine.execute(query, function(success, result){
                engine.execute('PREFIX : <http://example/vocab#>\
                                PREFIX p2: <http://example.com:80/#>\
                                SELECT ?S WHERE { ?S :p p2:abc }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 1);
                                    test.done();
                });
            });
        });
    });
};

exports.testOptionalOptionalComplex1 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX foaf: <http://xmlns.com/foaf/0.1/>\
                         INSERT DATA {\
                          <tag:alice@example:foafUri> \
                              foaf:mbox   <mailto:alice@example.net>;\
                              foaf:name   "Alice";\
                              foaf:nick   "WhoMe?";\
                              foaf:depiction   <http://example.com/alice.png> .\
                          <tag:bert@example:foafUri> \
                              foaf:mbox   <mailto:bert@example.net> ;\
                              foaf:nick   "BigB" ;\
                              foaf:name   "Bert" .\
                          <tag:eve@example:foafUri>\
                              foaf:mbox   <mailto:eve@example.net> ;\
                              foaf:firstName   "Eve" .\
                          <tag:john@example:foafUri>\
                              foaf:mbox   <mailto:john@example.net> ;\
                              foaf:nick   "jDoe";\
                              foaf:isPrimaryTopicOf <http://example.com/people/johnDoe> .\
                         }';

            engine.execute(query, function(success, result){
                engine.execute('PREFIX  foaf:   <http://xmlns.com/foaf/0.1/>\
                                SELECT ?person ?nick ?page ?img ?name ?firstN\
                                { \
                                    ?person foaf:nick ?nick\
                                    OPTIONAL { ?person foaf:isPrimaryTopicOf ?page } \
                                    OPTIONAL { \
                                        ?person foaf:name ?name \
                                        { ?person foaf:depiction ?img } UNION \
                                        { ?person foaf:firstName ?firstN } \
                                    } FILTER ( BOUND(?page) || BOUND(?img) || BOUND(?firstN) ) \
                                }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 2);
                                    results.sort(function(a,b){
                                        if(a.person.value < b.person.value) {
                                            return -1;
                                        } else if(a.person.value > b.person.value) {
                                            return 1;
                                        } else {
                                            return 0;
                                        }
                                    });
                                    test.ok(results[0].person.value === "tag:alice@example:foafUri");
                                    test.ok(results[0].nick.value === "WhoMe?");
                                    test.ok(results[0].img.value === "http://example.com/alice.png");
                                    test.ok(results[0].name.value === "Alice");
                                    test.ok(results[0].page === null);
                                    test.ok(results[0].firstN === null);
                                    test.ok(results[1].person.value === "tag:john@example:foafUri");
                                    test.ok(results[1].nick.value === "jDoe");
                                    test.ok(results[1].img === null);
                                    test.ok(results[1].name === null);
                                    test.ok(results[1].page.value === "http://example.com/people/johnDoe");
                                    test.ok(results[1].firstN === null);
                                    test.done();
                });
            });
        });
    });
};

exports.testOptionalOptionalComplex2 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX rdf:    <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                         PREFIX foaf:       <http://xmlns.com/foaf/0.1/> \
                         PREFIX ex:        <http://example.org/things#> \
                         PREFIX xsd:        <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA {\
                           GRAPH <complex-data-2.ttl> {\
                             _:a rdf:type foaf:Person ;\
                                 foaf:name "Eve" ;\
                                 ex:empId "9"^^xsd:integer .\
                             _:b rdf:type foaf:Person ;\
                                 foaf:name "Alice" ;\
                                 ex:empId "29"^^xsd:integer ;\
                                 ex:healthplan ex:HealthPlanD .\
                             _:c rdf:type foaf:Person ;\
                                 foaf:name "Fred" ;\
                                 ex:empId "27"^^xsd:integer .\
                             _:e foaf:name "Bob" ;\
                                 ex:empId "23"^^xsd:integer ;\
                                 ex:healthplan ex:HealthPlanC .\
                             _:f foaf:name "Bob" ;\
                                 ex:empId "30"^^xsd:integer;\
                                 ex:healthplan ex:HealthPlanB .\
                             _:g rdf:type foaf:Person; \
                                 ex:ssn "000000000";\
                                 foaf:name   "Bert";\
                                 ex:department "DeptA" ;\
                                 ex:healthplan ex:HealthPlanA .\
                           }\
                         }';

            engine.execute(query, function(success, result){

            var query = 'PREFIX foaf: <http://xmlns.com/foaf/0.1/>\
                         INSERT DATA {\
                           GRAPH <complex-data-1.ttl> {\
                            <tag:alice@example:foafUri> \
                                foaf:mbox   <mailto:alice@example.net>;\
                                foaf:name   "Alice";\
                                foaf:nick   "WhoMe?";\
                                foaf:depiction   <http://example.com/alice.png> .\
                            <tag:bert@example:foafUri> \
                                foaf:mbox   <mailto:bert@example.net> ;\
                                foaf:nick   "BigB" ;\
                                foaf:name   "Bert" .\
                            <tag:eve@example:foafUri>\
                                foaf:mbox   <mailto:eve@example.net> ;\
                                foaf:firstName   "Eve" .\
                            <tag:john@example:foafUri>\
                                foaf:mbox   <mailto:john@example.net> ;\
                                foaf:nick   "jDoe";\
                                foaf:isPrimaryTopicOf <http://example.com/people/johnDoe> .\
                           }\
                         }';

            engine.execute(query, function(success, result){
                engine.execute('PREFIX  foaf:   <http://xmlns.com/foaf/0.1/>\
                                PREFIX    ex:   <http://example.org/things#>\
                                SELECT ?id ?ssn\
                                WHERE \
                                { \
                                    ?person \
                                        a foaf:Person;\
                                        foaf:name ?name . \
                                    GRAPH ?x { \
                                        [] foaf:name ?name;\
                                           foaf:nick ?nick\
                                    } \
                                    OPTIONAL { \
                                        { ?person ex:empId ?id } UNION { ?person ex:ssn ?ssn } \
                                    } \
                                }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 2);
                                    results.sort(function(a,b){
                                        if(a.id == null) {
                                            return -1;
                                        } else {
                                            return 1;
                                        }
                                    });
                                    test.ok(results[0].id == null);
                                    test.ok(results[0].ssn.value === "000000000");
                                    test.ok(results[1].id.value === "29");
                                    test.ok(results[1].ssn == null);
                                    test.done();
                },[{"token": "uri", "prefix": null, "suffix": null, "value": "complex-data-2.ttl"}], 
                  [{"token": "uri", "prefix": null, "suffix": null, "value": "complex-data-1.ttl"}]);
            });
            });
        });
    });
};

exports.testOptionalOptionalComplex3 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX rdf:    <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                         PREFIX foaf:       <http://xmlns.com/foaf/0.1/> \
                         PREFIX ex:        <http://example.org/things#> \
                         PREFIX xsd:        <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA {\
                           GRAPH <complex-data-2.ttl> {\
                             _:a rdf:type foaf:Person ;\
                                 foaf:name "Eve" ;\
                                 ex:empId "9"^^xsd:integer .\
                             _:b rdf:type foaf:Person ;\
                                 foaf:name "Alice" ;\
                                 ex:empId "29"^^xsd:integer ;\
                                 ex:healthplan ex:HealthPlanD .\
                             _:c rdf:type foaf:Person ;\
                                 foaf:name "Fred" ;\
                                 ex:empId "27"^^xsd:integer .\
                             _:e foaf:name "Bob" ;\
                                 ex:empId "23"^^xsd:integer ;\
                                 ex:healthplan ex:HealthPlanC .\
                             _:f foaf:name "Bob" ;\
                                 ex:empId "30"^^xsd:integer;\
                                 ex:healthplan ex:HealthPlanB .\
                             _:g rdf:type foaf:Person; \
                                 ex:ssn "000000000";\
                                 foaf:name   "Bert";\
                                 ex:department "DeptA" ;\
                                 ex:healthplan ex:HealthPlanA .\
                           }\
                         }';

            engine.execute(query, function(success, result){

            var query = 'PREFIX foaf: <http://xmlns.com/foaf/0.1/>\
                         INSERT DATA {\
                           GRAPH <complex-data-1.ttl> {\
                            <tag:alice@example:foafUri> \
                                foaf:mbox   <mailto:alice@example.net>;\
                                foaf:name   "Alice";\
                                foaf:nick   "WhoMe?";\
                                foaf:depiction   <http://example.com/alice.png> .\
                            <tag:bert@example:foafUri> \
                                foaf:mbox   <mailto:bert@example.net> ;\
                                foaf:nick   "BigB" ;\
                                foaf:name   "Bert" .\
                            <tag:eve@example:foafUri>\
                                foaf:mbox   <mailto:eve@example.net> ;\
                                foaf:firstName   "Eve" .\
                            <tag:john@example:foafUri>\
                                foaf:mbox   <mailto:john@example.net> ;\
                                foaf:nick   "jDoe";\
                                foaf:isPrimaryTopicOf <http://example.com/people/johnDoe> .\
                           }\
                         }';

            engine.execute(query, function(success, result){
                engine.execute('PREFIX  foaf:   <http://xmlns.com/foaf/0.1/>\
                                PREFIX    ex:   <http://example.org/things#>\
                                SELECT ?name ?nick ?plan ?dept\
                                WHERE \
                                { \
                                    ?person \
                                        a foaf:Person;\
                                        foaf:name ?name . \
                                    GRAPH ?x { \
                                        [] foaf:name ?name;\
                                           foaf:nick ?nick\
                                    } \
                                    OPTIONAL { \
                                        ?person ex:healthplan ?plan \
                                        OPTIONAL { ?person ex:department ?dept } \
                                    } \
                                }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 2);
                                    results.sort(function(a,b){
                                        if(a.name.value === b.name.value) {
                                            return 0;
                                        } else {
                                            if(a.name.value < b.name.value) {
                                                return -1;
                                            } else {
                                                return 1;
                                            }
                                        }
                                    });

                                    test.ok(results[0].name.value === "Alice");
                                    test.ok(results[0].nick.value === "WhoMe?");
                                    test.ok(results[0].plan.value === "http://example.org/things#HealthPlanD");
                                    test.ok(results[0].dept == null);
                                    test.ok(results[1].name.value === "Bert");
                                    test.ok(results[1].nick.value === "BigB");
                                    test.ok(results[1].plan.value === "http://example.org/things#HealthPlanA");
                                    test.ok(results[1].dept.value == "DeptA");
                                    test.done();
                },[{"token": "uri", "prefix": null, "suffix": null, "value": "complex-data-2.ttl"}], 
                  [{"token": "uri", "prefix": null, "suffix": null, "value": "complex-data-1.ttl"}]);
            });
            });
        });
    });
};

exports.testOptionalOptionalComplex4 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX rdf:    <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                         PREFIX foaf:       <http://xmlns.com/foaf/0.1/> \
                         PREFIX ex:        <http://example.org/things#> \
                         PREFIX xsd:        <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA {\
                           GRAPH <complex-data-2.ttl> {\
                             _:a rdf:type foaf:Person ;\
                                 foaf:name "Eve" ;\
                                 ex:empId "9"^^xsd:integer .\
                             _:b rdf:type foaf:Person ;\
                                 foaf:name "Alice" ;\
                                 ex:empId "29"^^xsd:integer ;\
                                 ex:healthplan ex:HealthPlanD .\
                             _:c rdf:type foaf:Person ;\
                                 foaf:name "Fred" ;\
                                 ex:empId "27"^^xsd:integer .\
                             _:e foaf:name "Bob" ;\
                                 ex:empId "23"^^xsd:integer ;\
                                 ex:healthplan ex:HealthPlanC .\
                             _:f foaf:name "Bob" ;\
                                 ex:empId "30"^^xsd:integer;\
                                 ex:healthplan ex:HealthPlanB .\
                             _:g rdf:type foaf:Person; \
                                 ex:ssn "000000000";\
                                 foaf:name   "Bert";\
                                 ex:department "DeptA" ;\
                                 ex:healthplan ex:HealthPlanA .\
                           }\
                         }';

            engine.execute(query, function(success, result){

            var query = 'PREFIX foaf: <http://xmlns.com/foaf/0.1/>\
                         INSERT DATA {\
                           GRAPH <complex-data-1.ttl> {\
                            <tag:alice@example:foafUri> \
                                foaf:mbox   <mailto:alice@example.net>;\
                                foaf:name   "Alice";\
                                foaf:nick   "WhoMe?";\
                                foaf:depiction   <http://example.com/alice.png> .\
                            <tag:bert@example:foafUri> \
                                foaf:mbox   <mailto:bert@example.net> ;\
                                foaf:nick   "BigB" ;\
                                foaf:name   "Bert" .\
                            <tag:eve@example:foafUri>\
                                foaf:mbox   <mailto:eve@example.net> ;\
                                foaf:firstName   "Eve" .\
                            <tag:john@example:foafUri>\
                                foaf:mbox   <mailto:john@example.net> ;\
                                foaf:nick   "jDoe";\
                                foaf:isPrimaryTopicOf <http://example.com/people/johnDoe> .\
                           }\
                         }';

            engine.execute(query, function(success, result){
                engine.execute('PREFIX  foaf:   <http://xmlns.com/foaf/0.1/>\
                                PREFIX    ex:   <http://example.org/things#>\
                                SELECT ?name ?plan ?dept ?img \
                                WHERE \
                                { \
                                    ?person foaf:name ?name  \
                                    { ?person ex:healthplan ?plan } UNION { ?person ex:department ?dept } \
                                    OPTIONAL { \
                                        ?person a foaf:Person\
                                        GRAPH ?g { \
                                            [] foaf:name ?name;\
                                               foaf:depiction ?img \
                                        } \
                                    } \
                                }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 5);
                                    test.done();
                },[{"token": "uri", "prefix": null, "suffix": null, "value": "complex-data-2.ttl"}], 
                  [{"token": "uri", "prefix": null, "suffix": null, "value": "complex-data-1.ttl"}]);
            });
            });
        });
    });
};

exports.testOptionaOptional001 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX foaf: <http://xmlns.com/foaf/0.1/>\
                         INSERT DATA {\
                           _:a foaf:mbox   <mailto:alice@example.net> .\
                           _:a foaf:name   "Alice" .\
                           _:a foaf:nick   "WhoMe?" .\
                           _:b foaf:mbox   <mailto:bert@example.net> .\
                           _:b foaf:name   "Bert" .\
                           _:e foaf:mbox   <mailto:eve@example.net> .\
                           _:e foaf:nick   "DuckSoup" .\
                         }';

            engine.execute(query, function(success, result){
                engine.execute('PREFIX  foaf:   <http://xmlns.com/foaf/0.1/>\
                                SELECT ?mbox ?name\
                                   {\
                                     { ?x foaf:mbox ?mbox }\
                                     OPTIONAL { ?x foaf:name  ?name } .\
                                   }', function(success, results){
                                       test.ok(success === true);
                                       test.ok(results.length === 3);
                                       test.done();
                });
            });
        });
    });
};

exports.testOptionaOptional002 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX foaf: <http://xmlns.com/foaf/0.1/>\
                         INSERT DATA {\
                           _:a foaf:mbox   <mailto:alice@example.net> .\
                           _:a foaf:name   "Alice" .\
                           _:a foaf:nick   "WhoMe?" .\
                           _:b foaf:mbox   <mailto:bert@example.net> .\
                           _:b foaf:name   "Bert" .\
                           _:e foaf:mbox   <mailto:eve@example.net> .\
                           _:e foaf:nick   "DuckSoup" .\
                         }';

            engine.execute(query, function(success, result){
                engine.execute('PREFIX  foaf:   <http://xmlns.com/foaf/0.1/>\
                                SELECT ?mbox ?name\
                                   {\
                                       ?x foaf:mbox ?mbox .\
                                       OPTIONAL { ?x foaf:name  ?name } .\
                                       OPTIONAL { ?x foaf:nick  ?nick } .\
                                   }', function(success, results){
                                       test.ok(success === true);
                                       test.ok(results.length === 3);
                                       test.done();
                });
            });
        });
    });
};

exports.testOptionalUnion001 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX foaf: <http://xmlns.com/foaf/0.1/>\
                         INSERT DATA {\
                           _:a foaf:mbox   <mailto:alice@example.net> .\
                           _:a foaf:name   "Alice" .\
                           _:a foaf:nick   "WhoMe?" .\
                           _:b foaf:mbox   <mailto:bert@example.net> .\
                           _:b foaf:name   "Bert" .\
                           _:e foaf:mbox   <mailto:eve@example.net> .\
                           _:e foaf:nick   "DuckSoup" .\
                         }';

            engine.execute(query, function(success, result){
                engine.execute('PREFIX  foaf:   <http://xmlns.com/foaf/0.1/>\
                                SELECT ?mbox ?name\
                                   {\
                                     { ?x foaf:mbox ?mbox }\
                                   UNION \
                                     { ?x foaf:mbox ?mbox . ?x foaf:name  ?name }\
                                   }', function(success, results){
                                       test.ok(success === true);
                                       test.ok(results.length === 5)
                                       test.done();
                });
            });
        });
    });
};

exports.testReducedReduced1 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         PREFIX : <http://example/>\
                         INSERT DATA {\
                           :x1 :p "abc" .\
                           :x1 :q "abc" .\
                           :x2 :p "abc" .\
                         }';

            engine.execute(query, function(success, result){
                engine.execute('PREFIX :         <http://example/> \
                                PREFIX xsd:      <http://www.w3.org/2001/XMLSchema#> \
                                SELECT REDUCED * \
                                WHERE { \
                                  { ?s :p ?o } UNION { ?s :q ?o }\
                                }', function(success, results){
                                    test.ok(success === true);
                                    results.sort(function(a,b){
                                        if(a.s.value === b.s.value) {
                                            return 0;
                                        } else if(a.s.value < b.s.value) {
                                            return -1;
                                        } else {
                                            return 1;
                                        }
                                    });

                                    test.ok(results[0].s.value === "http://example/x1");
                                    test.ok(results[1].s.value === "http://example/x1");
                                    test.ok(results[2].s.value === "http://example/x2");

                                    test.ok(results[0].o.value === "abc");
                                    test.ok(results[1].o.value === "abc");
                                    test.ok(results[2].o.value === "abc");
                                    test.done();
                });
            });
        });
    });
};

exports.testReducedReduced2 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         PREFIX : <http://example/>\
                         INSERT DATA {\
                           :x1 :p "abc" .\
                           :x1 :q "abc" .\
                           :x2 :p "abc"@en .\
                           :x2 :q "abc"@en .\
                           :x3 :p "ABC" .\
                           :x3 :q "ABC" .\
                           :x4 :p "ABC"@en .\
                           :x4 :q "ABC"@en .\
                           :x5 :p "abc"^^xsd:string .\
                           :x5 :q "abc"^^xsd:string .\
                           :x6 :p "ABC"^^xsd:string .\
                           :x6 :q "ABC"^^xsd:string .\
                           :x7 :p "" .\
                           :x7 :q "" .\
                           :x8 :p ""@en .\
                           :x8 :q ""@en .\
                           :x9 :p ""^^xsd:string .\
                           :x9 :q ""^^xsd:string .\
                         }';

            engine.execute(query, function(success, result){
                engine.execute('PREFIX :         <http://example/> \
                                PREFIX xsd:      <http://www.w3.org/2001/XMLSchema#> \
                                SELECT REDUCED ?v \
                                WHERE { \
                                  ?x ?p ?v .\
                                }', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 18);
                                    test.done();
                });
            });
        });
    });
};

exports.testSortSort1 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX foaf: <http://xmlns.com/foaf/0.1/>\
                         PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                         INSERT DATA {\
                           _:a foaf:name "Eve".\
                           _:b foaf:name "Alice" .\
                           _:c foaf:name "Fred" .\
                           _:e foaf:name "Bob" .\
                         }';

            engine.execute(query, function(success, result){
                engine.execute('PREFIX foaf:      <http://xmlns.com/foaf/0.1/> \
                                SELECT ?name \
                                WHERE { ?x foaf:name ?name }\
                                ORDER BY ?name', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results[0].name.value === "Alice");
                                    test.ok(results[1].name.value === "Bob");
                                    test.ok(results[2].name.value === "Eve");
                                    test.ok(results[3].name.value === "Fred");
                                    test.done();
                });
            });
        });
    });
};

exports.testSortSort2 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX foaf: <http://xmlns.com/foaf/0.1/>\
                         PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                         INSERT DATA {\
                           _:a foaf:name "Eve".\
                           _:b foaf:name "Alice" .\
                           _:c foaf:name "Fred" .\
                           _:e foaf:name "Bob" .\
                         }';

            engine.execute(query, function(success, result){
                engine.execute('PREFIX foaf:      <http://xmlns.com/foaf/0.1/> \
                                SELECT ?name \
                                WHERE { ?x foaf:name ?name }\
                                ORDER BY DESC(?name)', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results[3].name.value === "Alice");
                                    test.ok(results[2].name.value === "Bob");
                                    test.ok(results[1].name.value === "Eve");
                                    test.ok(results[0].name.value === "Fred");
                                    test.done();
                });
            });
        });
    });
};

exports.testSortSort3 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX foaf: <http://xmlns.com/foaf/0.1/>\
                         PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                         INSERT DATA {\
                           _:a rdf:type foaf:Person ;\
                               foaf:name "Eve" ;\
                               foaf:mbox <mailto:eve@work.example> .\
                           _:b rdf:type foaf:Person ;\
                               foaf:name "Alice" ;\
                               foaf:mbox <mailto:alice@work.example> .\
                           _:c rdf:type foaf:Person ;\
                               foaf:mbox <mailto:fred@work.example> ;\
                               foaf:name "Fred" .\
                           _:e foaf:name "Bob" .\
                         }';

            engine.execute(query, function(success, result){
                engine.execute('PREFIX foaf: <http://xmlns.com/foaf/0.1/> \
                                SELECT ?name ?mbox\
                                WHERE { ?x foaf:name ?name .\
                                    OPTIONAL { ?x foaf:mbox ?mbox }\
                                      }\
                                ORDER BY ASC(?mbox)', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results[0].mbox === null);
                                    test.ok(results[1].mbox.value === 'mailto:alice@work.example');
                                    test.ok(results[2].mbox.value === 'mailto:eve@work.example');
                                    test.ok(results[3].mbox.value === 'mailto:fred@work.example');
                                    test.done();
                });
            });
        });
    });
};

exports.testSortSort4 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX foaf: <http://xmlns.com/foaf/0.1/>\
                         PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                         PREFIX ex: <http://example.org/things#>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           _:a rdf:type foaf:Person ;\
                               foaf:name "Eve" ;\
                               ex:empId "9"^^xsd:integer .\
                           _:b rdf:type foaf:Person ;\
                               foaf:name "Alice" ;\
                               ex:empId "29"^^xsd:integer .\
                           _:c rdf:type foaf:Person ;\
                               foaf:name "Fred" ;\
                               ex:empId "27"^^xsd:integer .\
                           _:e foaf:name "Bob" ;\
                               ex:empId "23"^^xsd:integer .\
                           _:f foaf:name "Bob" ;\
                               ex:empId "30"^^xsd:integer .\
                         }';

            engine.execute(query, function(success, result){
                engine.execute('PREFIX foaf: <http://xmlns.com/foaf/0.1/> \
                                PREFIX ex: <http://example.org/things#>\
                                SELECT ?name ?emp\
                                WHERE { ?x foaf:name ?name ;\
                                            ex:empId ?emp\
                                      }\
                                ORDER BY ASC(?emp)', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results[0].emp.value == '9');
                                    test.ok(results[1].emp.value == '23');
                                    test.ok(results[2].emp.value == '27');
                                    test.ok(results[3].emp.value == '29');
                                    test.ok(results[4].emp.value == '30');
                                    test.done();
                });
            });
        });
    });
};

exports.testSortSort5 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX foaf: <http://xmlns.com/foaf/0.1/>\
                         PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                         PREFIX ex: <http://example.org/things#>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           _:a rdf:type foaf:Person ;\
                               foaf:name "Eve" ;\
                               ex:empId "9"^^xsd:integer .\
                           _:b rdf:type foaf:Person ;\
                               foaf:name "Alice" ;\
                               ex:empId "29"^^xsd:integer .\
                           _:c rdf:type foaf:Person ;\
                               foaf:name "Fred" ;\
                               ex:empId "27"^^xsd:integer .\
                           _:e foaf:name "Bob" ;\
                               ex:empId "23"^^xsd:integer .\
                           _:f foaf:name "Bob" ;\
                               ex:empId "30"^^xsd:integer .\
                         }';

            engine.execute(query, function(success, result){
                engine.execute('PREFIX foaf: <http://xmlns.com/foaf/0.1/> \
                                PREFIX ex: <http://example.org/things#>\
                                SELECT ?name ?emp\
                                WHERE { ?x foaf:name ?name ;\
                                            ex:empId ?emp\
                                      }\
                                ORDER BY ?name DESC(?emp)', function(success, results){
                                    test.ok(success === true);

                                    test.ok(results.length === 5);

                                    test.ok(results[0].name.value === 'Alice');
                                    test.ok(results[0].emp.value === '29');
 
                                    test.ok(results[1].name.value === 'Bob');
                                    test.ok(results[1].emp.value === '30');
 
                                    test.ok(results[2].name.value === 'Bob');
                                    test.ok(results[2].emp.value === '23');
 
                                    test.ok(results[3].name.value === 'Eve');
                                    test.ok(results[3].emp.value === '9');
 
                                    test.ok(results[4].name.value === 'Fred');
                                    test.ok(results[4].emp.value === '27');

                                    test.done();
                });
            });
        });
    });
};

exports.testSortSort6 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX foaf: <http://xmlns.com/foaf/0.1/>\
                         PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                         PREFIX ex: <http://example.org/things#>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           _:a rdf:type foaf:Person ;\
                               foaf:name "Eve" ;\
                               ex:address <http://example.org/eve> .\
                           _:b rdf:type foaf:Person ;\
                               foaf:name "Alice" ;\
                               ex:address "Fascination Street 11" .\
                           _:c rdf:type foaf:Person ;\
                               foaf:name "Fred" ;\
                               ex:address "fred@work.example" .\
                           _:e foaf:name "Bob" ;\
                               ex:address <mailto:bob@work.example> .\
                         }';

            engine.execute(query, function(success, result){
                engine.execute('PREFIX ex: <http://example.org/things#>\
                                SELECT ?address\
                                WHERE { ?x ex:address ?address }\
                                ORDER BY ASC(?address)', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results[0].address.value === "http://example.org/eve");
                                    test.ok(results[1].address.value === "mailto:bob@work.example");
                                    test.ok(results[2].address.value === "Fascination Street 11");
                                    test.ok(results[3].address.value === "fred@work.example");
                                    test.done();
                });
            });
        });
    });
};

exports.testSortSort7 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX foaf: <http://xmlns.com/foaf/0.1/>\
                         PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                         PREFIX ex: <http://example.org/things#>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           _:a rdf:type foaf:Person ;\
                               foaf:name "Eve" ;\
                               ex:empId "9"^^xsd:integer .\
                           _:b rdf:type foaf:Person ;\
                               foaf:name "Alice" ;\
                               ex:empId "29"^^xsd:integer .\
                           _:c rdf:type foaf:Person ;\
                               foaf:name "Fred" ;\
                               ex:empId "27"^^xsd:integer .\
                           _:e foaf:name "Bob" ;\
                               ex:empId "23.0"^^xsd:float .\
                         }';

            engine.execute(query, function(success, result){
                engine.execute('PREFIX ex: <http://example.org/things#>\
                                PREFIX foaf: <http://xmlns.com/foaf/0.1/>\
                                SELECT ?name ?emp\
                                WHERE { ?x foaf:name ?name ;\
                                           ex:empId ?emp\
                                      }\
                                ORDER BY ASC(?emp)', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results[0].emp.value === "9");
                                    test.ok(results[1].emp.value === "23.0");
                                    test.ok(results[2].emp.value === "27");
                                    test.ok(results[3].emp.value === "29");
                                    test.done();
                });
            });
        });
    });
};

exports.testSortSort8 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX foaf: <http://xmlns.com/foaf/0.1/>\
                         PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                         PREFIX ex: <http://example.org/things#>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           _:a foaf:name "Eve" ;\
                               ex:empId "9"^^xsd:integer .\
                           _:f foaf:name "John" ;\
                               ex:empId [ ex:number "29"^^xsd:integer ] .\
                           _:g foaf:name "Dirk" ;\
                               ex:empId <http://example.org/dirk01> .\
                         }';

            engine.execute(query, function(success, result){
                engine.execute('PREFIX ex: <http://example.org/things#>\
                                PREFIX foaf: <http://xmlns.com/foaf/0.1/>\
                                SELECT ?name ?emp\
                                WHERE { ?x foaf:name ?name ;\
                                           ex:empId ?emp\
                                      }\
                                ORDER BY ASC(?emp)', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 3);
                                    test.ok(results[0].emp.token === "blank");
                                    test.ok(results[1].emp.token === "uri");
                                    test.ok(results[2].emp.token === "literal");
                                    test.done();
                });
            });
        });
    });
};


exports.testSortSort9 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX foaf: <http://xmlns.com/foaf/0.1/>\
                         PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           _:a foaf:name "Eve"^^xsd:string .\
                           _:b foaf:name "Alice"^^xsd:string .\
                           _:c foaf:name "Fred"^^xsd:string .\
                           _:e foaf:name "Bob"^^xsd:string .\
                         }';

            engine.execute(query, function(success, result){
                engine.execute('PREFIX foaf: <http://xmlns.com/foaf/0.1/>\
                                SELECT ?name\
                                WHERE { ?x foaf:name ?name }\
                                ORDER BY ?name', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 4);
                                    test.ok(results[0].name.value === "Alice");
                                    test.ok(results[1].name.value === "Bob");
                                    test.ok(results[2].name.value === "Eve");
                                    test.ok(results[3].name.value === "Fred");
                                    test.done();
                });
            });
        });
    });
};

exports.testSortSort10 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX foaf: <http://xmlns.com/foaf/0.1/>\
                         PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           _:a foaf:name "Eve"^^xsd:string .\
                           _:b foaf:name "Alice"^^xsd:string .\
                           _:c foaf:name "Fred"^^xsd:string .\
                           _:e foaf:name "Bob"^^xsd:string .\
                         }';

            engine.execute(query, function(success, result){
                engine.execute('PREFIX foaf: <http://xmlns.com/foaf/0.1/>\
                                SELECT ?name\
                                WHERE { ?x foaf:name ?name }\
                                ORDER BY DESC(?name)', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 4);
                                    test.ok(results[3].name.value === "Alice");
                                    test.ok(results[2].name.value === "Bob");
                                    test.ok(results[1].name.value === "Eve");
                                    test.ok(results[0].name.value === "Fred");
                                    test.done();
                });
            });
        });
    });
};

exports.testSortSortNumbers = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :s1 :p "1"^^xsd:integer; :q "2"^^xsd:integer .\
                           :s2 :p "10"^^xsd:integer; :q "20"^^xsd:integer .\
                           :s3 :p "100"^^xsd:integer; :q "200"^^xsd:integer .\
                         }';

            engine.execute(query, function(success, result){
                engine.execute('PREFIX : <http://example.org/>\
                                SELECT ?s WHERE {\
                                  ?s :p ?o1 ; :q ?o2 .\
                                } ORDER BY (?o1 + ?o2)', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 3);
                                    test.ok(results[0].s.value === "http://example.org/s1");
                                    test.ok(results[1].s.value === "http://example.org/s2");
                                    test.ok(results[2].s.value === "http://example.org/s3");
                                    test.done();
                });
            });
        });
    });
};

exports.testSortSortBuiltin = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                           :s1 :p "2"^^xsd:integer .\
                           :s2 :p "300"^^xsd:integer .\
                           :s3 :p "10"^^xsd:integer .\
                         }';

            engine.execute(query, function(success, result){
                engine.execute('PREFIX : <http://example.org/>\
                                SELECT ?s WHERE {\
                                  ?s :p ?o .\
                                } ORDER BY STR(?o)', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 3);
                                    test.ok(results[0].s.value === "http://example.org/s3");
                                    test.ok(results[1].s.value === "http://example.org/s1");
                                    test.ok(results[2].s.value === "http://example.org/s2");
                                    test.done();
                });
            });
        });
    });
};

exports.testSortSortFunction = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example.org/>\
                         INSERT DATA {\
                           :s1 :p "2" .\
                           :s2 :p "300" .\
                           :s3 :p "10" .\
                         }';

            engine.execute(query, function(success, result){
                engine.execute('PREFIX : <http://example.org/>\
                                PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                                SELECT ?s WHERE {\
                                  ?s :p ?o .\
                                } ORDER BY xsd:integer(?o)', function(success, results){
                                    test.ok(success === true);
                                    test.ok(results.length === 3);
                                    test.ok(results[0].s.value === "http://example.org/s1");
                                    test.ok(results[1].s.value === "http://example.org/s3");
                                    test.ok(results[2].s.value === "http://example.org/s2");
                                    test.done();
                });
            });
        });
    });
};

exports.testTypePromotionTypePromotion01 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX t: <http://www.w3.org/2001/sw/DataAccess/tests/data/TypePromotion/tP-0#>\
                         PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                               t:decimal1		rdf:value	"1"^^xsd:decimal .\
                               t:float1		        rdf:value	"1"^^xsd:float .\
                               t:double1		rdf:value	"1"^^xsd:double .\
                               t:booleanT		rdf:value	"true"^^xsd:boolean .\
                               t:dateTime1		rdf:value	"2005-01-14T12:34:56"^^xsd:dateTime .\
                                t:integer1		rdf:value	"1"^^xsd:integer .\
                                 t:nonPositiveIntegerN1	rdf:value	"-1"^^xsd:nonPositiveInteger .\
                                  t:negativeIntegerN1	rdf:value	"-1"^^xsd:negativeInteger .\
                                 t:long1		rdf:value	"1"^^xsd:long .\
                                  t:int1		rdf:value	"1"^^xsd:int .\
                                   t:short1		rdf:value	"1"^^xsd:short .\
                                    t:byte1		rdf:value	"1"^^xsd:byte .\
                                 t:nonNegativeInteger1	rdf:value	"1"^^xsd:nonNegativeInteger .\
                                  t:unsignedLong1	rdf:value	"1"^^xsd:unsignedLong .\
                                   t:unsignedInt1	rdf:value	"1"^^xsd:unsignedInt .\
                                    t:unsignedShort1	rdf:value	"1"^^xsd:unsignedShort .\
                                     t:unsignedByte1	rdf:value	"1"^^xsd:unsignedByte .\
                                  t:positiveInteger1	rdf:value	"1"^^xsd:positiveInteger .\
                         }';

            engine.execute(query, function(success, result){
                engine.execute('PREFIX t: <http://www.w3.org/2001/sw/DataAccess/tests/data/TypePromotion/tP-0#>\
                                PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                                PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                                ASK\
                                 WHERE { t:double1 rdf:value ?l .\
                                         t:double1 rdf:value ?r .\
                                         FILTER ( DATATYPE(?l + ?r) = xsd:double ) }', function(success, results){
                                             test.ok(results);
                                             test.done();
                });
            });
        });
    });
};

exports.testTypePromotionTypePromotion02 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX t: <http://www.w3.org/2001/sw/DataAccess/tests/data/TypePromotion/tP-0#>\
                         PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                               t:decimal1		rdf:value	"1"^^xsd:decimal .\
                               t:float1		        rdf:value	"1"^^xsd:float .\
                               t:double1		rdf:value	"1"^^xsd:double .\
                               t:booleanT		rdf:value	"true"^^xsd:boolean .\
                               t:dateTime1		rdf:value	"2005-01-14T12:34:56"^^xsd:dateTime .\
                                t:integer1		rdf:value	"1"^^xsd:integer .\
                                 t:nonPositiveIntegerN1	rdf:value	"-1"^^xsd:nonPositiveInteger .\
                                  t:negativeIntegerN1	rdf:value	"-1"^^xsd:negativeInteger .\
                                 t:long1		rdf:value	"1"^^xsd:long .\
                                  t:int1		rdf:value	"1"^^xsd:int .\
                                   t:short1		rdf:value	"1"^^xsd:short .\
                                    t:byte1		rdf:value	"1"^^xsd:byte .\
                                 t:nonNegativeInteger1	rdf:value	"1"^^xsd:nonNegativeInteger .\
                                  t:unsignedLong1	rdf:value	"1"^^xsd:unsignedLong .\
                                   t:unsignedInt1	rdf:value	"1"^^xsd:unsignedInt .\
                                    t:unsignedShort1	rdf:value	"1"^^xsd:unsignedShort .\
                                     t:unsignedByte1	rdf:value	"1"^^xsd:unsignedByte .\
                                  t:positiveInteger1	rdf:value	"1"^^xsd:positiveInteger .\
                         }';

            engine.execute(query, function(success, result){
                engine.execute('PREFIX t: <http://www.w3.org/2001/sw/DataAccess/tests/data/TypePromotion/tP-0#>\
                                PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                                PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                                ASK\
                                 WHERE { \
                                     t:double1 rdf:value ?l .\
                                     t:float1 rdf:value ?r .\
                                     FILTER ( datatype(?l + ?r) = xsd:double )\
                                 }', function(success, results){
                                             test.ok(results);
                                             test.done();
                });
            });
        });
    });
};

exports.testTypePromotionTypePromotion03 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX t: <http://www.w3.org/2001/sw/DataAccess/tests/data/TypePromotion/tP-0#>\
                         PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                               t:decimal1		rdf:value	"1"^^xsd:decimal .\
                               t:float1		        rdf:value	"1"^^xsd:float .\
                               t:double1		rdf:value	"1"^^xsd:double .\
                               t:booleanT		rdf:value	"true"^^xsd:boolean .\
                               t:dateTime1		rdf:value	"2005-01-14T12:34:56"^^xsd:dateTime .\
                                t:integer1		rdf:value	"1"^^xsd:integer .\
                                 t:nonPositiveIntegerN1	rdf:value	"-1"^^xsd:nonPositiveInteger .\
                                  t:negativeIntegerN1	rdf:value	"-1"^^xsd:negativeInteger .\
                                 t:long1		rdf:value	"1"^^xsd:long .\
                                  t:int1		rdf:value	"1"^^xsd:int .\
                                   t:short1		rdf:value	"1"^^xsd:short .\
                                    t:byte1		rdf:value	"1"^^xsd:byte .\
                                 t:nonNegativeInteger1	rdf:value	"1"^^xsd:nonNegativeInteger .\
                                  t:unsignedLong1	rdf:value	"1"^^xsd:unsignedLong .\
                                   t:unsignedInt1	rdf:value	"1"^^xsd:unsignedInt .\
                                    t:unsignedShort1	rdf:value	"1"^^xsd:unsignedShort .\
                                     t:unsignedByte1	rdf:value	"1"^^xsd:unsignedByte .\
                                  t:positiveInteger1	rdf:value	"1"^^xsd:positiveInteger .\
                         }';

            engine.execute(query, function(success, result){
                engine.execute('PREFIX t: <http://www.w3.org/2001/sw/DataAccess/tests/data/TypePromotion/tP-0#>\
                                PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                                PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                                ASK\
                                 WHERE { \
                                    t:double1 rdf:value ?l .\
                                    t:decimal1 rdf:value ?r .\
                                    FILTER ( datatype(?l + ?r) = xsd:double )\
                                 }', function(success, results){
                                             test.ok(results);
                                             test.done();
                });
            });
        });
    });
};

exports.testTypePromotionTypePromotion04 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX t: <http://www.w3.org/2001/sw/DataAccess/tests/data/TypePromotion/tP-0#>\
                         PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                               t:decimal1		rdf:value	"1"^^xsd:decimal .\
                               t:float1		        rdf:value	"1"^^xsd:float .\
                               t:double1		rdf:value	"1"^^xsd:double .\
                               t:booleanT		rdf:value	"true"^^xsd:boolean .\
                               t:dateTime1		rdf:value	"2005-01-14T12:34:56"^^xsd:dateTime .\
                                t:integer1		rdf:value	"1"^^xsd:integer .\
                                 t:nonPositiveIntegerN1	rdf:value	"-1"^^xsd:nonPositiveInteger .\
                                  t:negativeIntegerN1	rdf:value	"-1"^^xsd:negativeInteger .\
                                 t:long1		rdf:value	"1"^^xsd:long .\
                                  t:int1		rdf:value	"1"^^xsd:int .\
                                   t:short1		rdf:value	"1"^^xsd:short .\
                                    t:byte1		rdf:value	"1"^^xsd:byte .\
                                 t:nonNegativeInteger1	rdf:value	"1"^^xsd:nonNegativeInteger .\
                                  t:unsignedLong1	rdf:value	"1"^^xsd:unsignedLong .\
                                   t:unsignedInt1	rdf:value	"1"^^xsd:unsignedInt .\
                                    t:unsignedShort1	rdf:value	"1"^^xsd:unsignedShort .\
                                     t:unsignedByte1	rdf:value	"1"^^xsd:unsignedByte .\
                                  t:positiveInteger1	rdf:value	"1"^^xsd:positiveInteger .\
                         }';

            engine.execute(query, function(success, result){
                engine.execute('PREFIX t: <http://www.w3.org/2001/sw/DataAccess/tests/data/TypePromotion/tP-0#>\
                                PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                                PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                                ASK\
                                 WHERE { \
                                   t:float1 rdf:value ?l .\
                                   t:float1 rdf:value ?r .\
                                   FILTER ( datatype(?l + ?r) = xsd:float )\
                                 }', function(success, results){
                                             test.ok(results);
                                             test.done();
                });
            });
        });
    });
};

exports.testTypePromotionTypePromotion05 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX t: <http://www.w3.org/2001/sw/DataAccess/tests/data/TypePromotion/tP-0#>\
                         PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                               t:decimal1		rdf:value	"1"^^xsd:decimal .\
                               t:float1		        rdf:value	"1"^^xsd:float .\
                               t:double1		rdf:value	"1"^^xsd:double .\
                               t:booleanT		rdf:value	"true"^^xsd:boolean .\
                               t:dateTime1		rdf:value	"2005-01-14T12:34:56"^^xsd:dateTime .\
                                t:integer1		rdf:value	"1"^^xsd:integer .\
                                 t:nonPositiveIntegerN1	rdf:value	"-1"^^xsd:nonPositiveInteger .\
                                  t:negativeIntegerN1	rdf:value	"-1"^^xsd:negativeInteger .\
                                 t:long1		rdf:value	"1"^^xsd:long .\
                                  t:int1		rdf:value	"1"^^xsd:int .\
                                   t:short1		rdf:value	"1"^^xsd:short .\
                                    t:byte1		rdf:value	"1"^^xsd:byte .\
                                 t:nonNegativeInteger1	rdf:value	"1"^^xsd:nonNegativeInteger .\
                                  t:unsignedLong1	rdf:value	"1"^^xsd:unsignedLong .\
                                   t:unsignedInt1	rdf:value	"1"^^xsd:unsignedInt .\
                                    t:unsignedShort1	rdf:value	"1"^^xsd:unsignedShort .\
                                     t:unsignedByte1	rdf:value	"1"^^xsd:unsignedByte .\
                                  t:positiveInteger1	rdf:value	"1"^^xsd:positiveInteger .\
                         }';

            engine.execute(query, function(success, result){
                engine.execute('PREFIX t: <http://www.w3.org/2001/sw/DataAccess/tests/data/TypePromotion/tP-0#>\
                                PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                                PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                                ASK\
                                 WHERE { \
                                   t:float1 rdf:value ?l .\
                                   t:decimal1 rdf:value ?r .\
                                   FILTER ( datatype(?l + ?r) = xsd:float ) \
                                 }', function(success, results){
                                             test.ok(results);
                                             test.done();
                });
            });
        });
    });
};

exports.testTypePromotionTypePromotion06 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX t: <http://www.w3.org/2001/sw/DataAccess/tests/data/TypePromotion/tP-0#>\
                         PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                               t:decimal1		rdf:value	"1"^^xsd:decimal .\
                               t:float1		        rdf:value	"1"^^xsd:float .\
                               t:double1		rdf:value	"1"^^xsd:double .\
                               t:booleanT		rdf:value	"true"^^xsd:boolean .\
                               t:dateTime1		rdf:value	"2005-01-14T12:34:56"^^xsd:dateTime .\
                                t:integer1		rdf:value	"1"^^xsd:integer .\
                                 t:nonPositiveIntegerN1	rdf:value	"-1"^^xsd:nonPositiveInteger .\
                                  t:negativeIntegerN1	rdf:value	"-1"^^xsd:negativeInteger .\
                                 t:long1		rdf:value	"1"^^xsd:long .\
                                  t:int1		rdf:value	"1"^^xsd:int .\
                                   t:short1		rdf:value	"1"^^xsd:short .\
                                    t:byte1		rdf:value	"1"^^xsd:byte .\
                                 t:nonNegativeInteger1	rdf:value	"1"^^xsd:nonNegativeInteger .\
                                  t:unsignedLong1	rdf:value	"1"^^xsd:unsignedLong .\
                                   t:unsignedInt1	rdf:value	"1"^^xsd:unsignedInt .\
                                    t:unsignedShort1	rdf:value	"1"^^xsd:unsignedShort .\
                                     t:unsignedByte1	rdf:value	"1"^^xsd:unsignedByte .\
                                  t:positiveInteger1	rdf:value	"1"^^xsd:positiveInteger .\
                         }';

            engine.execute(query, function(success, result){
                engine.execute('PREFIX t: <http://www.w3.org/2001/sw/DataAccess/tests/data/TypePromotion/tP-0#>\
                                PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                                PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                                ASK\
                                 WHERE { \
                                   t:decimal1 rdf:value ?l .\
                                   t:decimal1 rdf:value ?r .\
                                   FILTER ( datatype(?l + ?r) = xsd:decimal )\
                                 }', function(success, results){
                                             test.ok(results);
                                             test.done();
                });
            });
        });
    });
};

exports.testTypePromotionTypePromotion07 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX t: <http://www.w3.org/2001/sw/DataAccess/tests/data/TypePromotion/tP-0#>\
                         PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                               t:decimal1		rdf:value	"1"^^xsd:decimal .\
                               t:float1		        rdf:value	"1"^^xsd:float .\
                               t:double1		rdf:value	"1"^^xsd:double .\
                               t:booleanT		rdf:value	"true"^^xsd:boolean .\
                               t:dateTime1		rdf:value	"2005-01-14T12:34:56"^^xsd:dateTime .\
                                t:integer1		rdf:value	"1"^^xsd:integer .\
                                 t:nonPositiveIntegerN1	rdf:value	"-1"^^xsd:nonPositiveInteger .\
                                  t:negativeIntegerN1	rdf:value	"-1"^^xsd:negativeInteger .\
                                 t:long1		rdf:value	"1"^^xsd:long .\
                                  t:int1		rdf:value	"1"^^xsd:int .\
                                   t:short1		rdf:value	"1"^^xsd:short .\
                                    t:byte1		rdf:value	"1"^^xsd:byte .\
                                 t:nonNegativeInteger1	rdf:value	"1"^^xsd:nonNegativeInteger .\
                                  t:unsignedLong1	rdf:value	"1"^^xsd:unsignedLong .\
                                   t:unsignedInt1	rdf:value	"1"^^xsd:unsignedInt .\
                                    t:unsignedShort1	rdf:value	"1"^^xsd:unsignedShort .\
                                     t:unsignedByte1	rdf:value	"1"^^xsd:unsignedByte .\
                                  t:positiveInteger1	rdf:value	"1"^^xsd:positiveInteger .\
                         }';

            engine.execute(query, function(success, result){
                engine.execute('PREFIX t: <http://www.w3.org/2001/sw/DataAccess/tests/data/TypePromotion/tP-0#>\
                                PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                                PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                                ASK\
                                 WHERE { \
                                    t:nonNegativeInteger1 rdf:value ?l .\
                                    t:short1 rdf:value ?r .\
                                    FILTER ( datatype(?l + ?r) = xsd:integer )\
                                 }', function(success, results){
                                             test.ok(results);
                                             test.done();
                });
            });
        });
    });
};

exports.testTypePromotionTypePromotion08 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX t: <http://www.w3.org/2001/sw/DataAccess/tests/data/TypePromotion/tP-0#>\
                         PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                               t:decimal1		rdf:value	"1"^^xsd:decimal .\
                               t:float1		        rdf:value	"1"^^xsd:float .\
                               t:double1		rdf:value	"1"^^xsd:double .\
                               t:booleanT		rdf:value	"true"^^xsd:boolean .\
                               t:dateTime1		rdf:value	"2005-01-14T12:34:56"^^xsd:dateTime .\
                                t:integer1		rdf:value	"1"^^xsd:integer .\
                                 t:nonPositiveIntegerN1	rdf:value	"-1"^^xsd:nonPositiveInteger .\
                                  t:negativeIntegerN1	rdf:value	"-1"^^xsd:negativeInteger .\
                                 t:long1		rdf:value	"1"^^xsd:long .\
                                  t:int1		rdf:value	"1"^^xsd:int .\
                                   t:short1		rdf:value	"1"^^xsd:short .\
                                    t:byte1		rdf:value	"1"^^xsd:byte .\
                                 t:nonNegativeInteger1	rdf:value	"1"^^xsd:nonNegativeInteger .\
                                  t:unsignedLong1	rdf:value	"1"^^xsd:unsignedLong .\
                                   t:unsignedInt1	rdf:value	"1"^^xsd:unsignedInt .\
                                    t:unsignedShort1	rdf:value	"1"^^xsd:unsignedShort .\
                                     t:unsignedByte1	rdf:value	"1"^^xsd:unsignedByte .\
                                  t:positiveInteger1	rdf:value	"1"^^xsd:positiveInteger .\
                         }';

            engine.execute(query, function(success, result){
                engine.execute('PREFIX t: <http://www.w3.org/2001/sw/DataAccess/tests/data/TypePromotion/tP-0#>\
                                PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                                PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                                ASK\
                                 WHERE { \
                                   t:nonPositiveIntegerN1 rdf:value ?l .\
                                   t:short1 rdf:value ?r .\
                                   FILTER ( datatype(?l + ?r) = xsd:integer )\
                                 }', function(success, results){
                                             test.ok(results);
                                             test.done();
                });
            });
        });
    });
};

exports.testTypePromotionTypePromotion09 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX t: <http://www.w3.org/2001/sw/DataAccess/tests/data/TypePromotion/tP-0#>\
                         PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                               t:decimal1		rdf:value	"1"^^xsd:decimal .\
                               t:float1		        rdf:value	"1"^^xsd:float .\
                               t:double1		rdf:value	"1"^^xsd:double .\
                               t:booleanT		rdf:value	"true"^^xsd:boolean .\
                               t:dateTime1		rdf:value	"2005-01-14T12:34:56"^^xsd:dateTime .\
                                t:integer1		rdf:value	"1"^^xsd:integer .\
                                 t:nonPositiveIntegerN1	rdf:value	"-1"^^xsd:nonPositiveInteger .\
                                  t:negativeIntegerN1	rdf:value	"-1"^^xsd:negativeInteger .\
                                 t:long1		rdf:value	"1"^^xsd:long .\
                                  t:int1		rdf:value	"1"^^xsd:int .\
                                   t:short1		rdf:value	"1"^^xsd:short .\
                                    t:byte1		rdf:value	"1"^^xsd:byte .\
                                 t:nonNegativeInteger1	rdf:value	"1"^^xsd:nonNegativeInteger .\
                                  t:unsignedLong1	rdf:value	"1"^^xsd:unsignedLong .\
                                   t:unsignedInt1	rdf:value	"1"^^xsd:unsignedInt .\
                                    t:unsignedShort1	rdf:value	"1"^^xsd:unsignedShort .\
                                     t:unsignedByte1	rdf:value	"1"^^xsd:unsignedByte .\
                                  t:positiveInteger1	rdf:value	"1"^^xsd:positiveInteger .\
                         }';

            engine.execute(query, function(success, result){
                engine.execute('PREFIX t: <http://www.w3.org/2001/sw/DataAccess/tests/data/TypePromotion/tP-0#>\
                                PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                                PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                                ASK\
                                 WHERE { \
                                    t:negativeIntegerN1 rdf:value ?l .\
                                    t:short1 rdf:value ?r .\
                                    FILTER ( datatype(?l + ?r) = xsd:integer )\
                                 }', function(success, results){
                                             test.ok(results);
                                             test.done();
                });
            });
        });
    });
};

exports.testTypePromotionTypePromotion10 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX t: <http://www.w3.org/2001/sw/DataAccess/tests/data/TypePromotion/tP-0#>\
                         PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                               t:decimal1		rdf:value	"1"^^xsd:decimal .\
                               t:float1		        rdf:value	"1"^^xsd:float .\
                               t:double1		rdf:value	"1"^^xsd:double .\
                               t:booleanT		rdf:value	"true"^^xsd:boolean .\
                               t:dateTime1		rdf:value	"2005-01-14T12:34:56"^^xsd:dateTime .\
                                t:integer1		rdf:value	"1"^^xsd:integer .\
                                 t:nonPositiveIntegerN1	rdf:value	"-1"^^xsd:nonPositiveInteger .\
                                  t:negativeIntegerN1	rdf:value	"-1"^^xsd:negativeInteger .\
                                 t:long1		rdf:value	"1"^^xsd:long .\
                                  t:int1		rdf:value	"1"^^xsd:int .\
                                   t:short1		rdf:value	"1"^^xsd:short .\
                                    t:byte1		rdf:value	"1"^^xsd:byte .\
                                 t:nonNegativeInteger1	rdf:value	"1"^^xsd:nonNegativeInteger .\
                                  t:unsignedLong1	rdf:value	"1"^^xsd:unsignedLong .\
                                   t:unsignedInt1	rdf:value	"1"^^xsd:unsignedInt .\
                                    t:unsignedShort1	rdf:value	"1"^^xsd:unsignedShort .\
                                     t:unsignedByte1	rdf:value	"1"^^xsd:unsignedByte .\
                                  t:positiveInteger1	rdf:value	"1"^^xsd:positiveInteger .\
                         }';

            engine.execute(query, function(success, result){
                engine.execute('PREFIX t: <http://www.w3.org/2001/sw/DataAccess/tests/data/TypePromotion/tP-0#>\
                                PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                                PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                                ASK\
                                 WHERE { \
                                   t:long1 rdf:value ?l .\
                                   t:short1 rdf:value ?r .\
                                   FILTER ( datatype(?l + ?r) = xsd:integer )\
                                 }', function(success, results){
                                             test.ok(results);
                                             test.done();
                });
            });
        });
    });
};

exports.testTypePromotionTypePromotion11 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX t: <http://www.w3.org/2001/sw/DataAccess/tests/data/TypePromotion/tP-0#>\
                         PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         INSERT DATA {\
                               t:decimal1		rdf:value	"1"^^xsd:decimal .\
                               t:float1		        rdf:value	"1"^^xsd:float .\
                               t:double1		rdf:value	"1"^^xsd:double .\
                               t:booleanT		rdf:value	"true"^^xsd:boolean .\
                               t:dateTime1		rdf:value	"2005-01-14T12:34:56"^^xsd:dateTime .\
                                t:integer1		rdf:value	"1"^^xsd:integer .\
                                 t:nonPositiveIntegerN1	rdf:value	"-1"^^xsd:nonPositiveInteger .\
                                  t:negativeIntegerN1	rdf:value	"-1"^^xsd:negativeInteger .\
                                 t:long1		rdf:value	"1"^^xsd:long .\
                                  t:int1		rdf:value	"1"^^xsd:int .\
                                   t:short1		rdf:value	"1"^^xsd:short .\
                                    t:byte1		rdf:value	"1"^^xsd:byte .\
                                 t:nonNegativeInteger1	rdf:value	"1"^^xsd:nonNegativeInteger .\
                                  t:unsignedLong1	rdf:value	"1"^^xsd:unsignedLong .\
                                   t:unsignedInt1	rdf:value	"1"^^xsd:unsignedInt .\
                                    t:unsignedShort1	rdf:value	"1"^^xsd:unsignedShort .\
                                     t:unsignedByte1	rdf:value	"1"^^xsd:unsignedByte .\
                                  t:positiveInteger1	rdf:value	"1"^^xsd:positiveInteger .\
                         }';

            engine.execute(query, function(success, result){
                engine.execute('PREFIX t: <http://www.w3.org/2001/sw/DataAccess/tests/data/TypePromotion/tP-0#>\
                                PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                                PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                                ASK\
                                 WHERE { \
                                   t:int1 rdf:value ?l .\
                                   t:short1 rdf:value ?r .\
                                   FILTER ( datatype(?l + ?r) = xsd:integer )\
                                 }', function(success, results){
                                             test.ok(results);
                                             test.done();
                });
            });
        });
    });
};

exports.testGroupingGroup01 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = "PREFIX : <http://example/>\
                         INSERT DATA {\
                         :s1 :p 1 .\
                         :s1 :q 9 .\
                         :s2 :p 2 . }";

            engine.execute(query, function(success, result){
                engine.execute('PREFIX : <http://example/> SELECT ?s {  ?s :p ?v . } GROUP BY ?s', function(success, results){
                    test.ok(success);
                    test.ok(results.length === 2);

                    test.ok(results[0].s.value === "http://example/s1");
                    test.ok(results[1].s.value === "http://example/s2");
                    test.done();
                });
            });
        });
    });
};


exports.testBasicUpdateInsertDataSPO1 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = "PREFIX : <http://example.org/ns#> INSERT DATA { :s :p :o }";

            engine.execute(query, function(success, result){
                engine.execute('PREFIX : <http://example.org/ns#> SELECT * { ?s ?p ?o }', function(success, results){
                    test.ok(success);
                    test.ok(results.length === 1);
                    test.ok(results[0].s.value === "http://example.org/ns#s");
                    test.ok(results[0].p.value === "http://example.org/ns#p");
                    test.ok(results[0].o.value === "http://example.org/ns#o");
                    test.done();
                });
            });
        });
    });
};


exports.testBasicUpdateInsertDataSPONamed1 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = "PREFIX : <http://example/>\
                         INSERT DATA {\
                         :s1 :p 1 .\
                         :s1 :q 9 .\
                         :s2 :p 2 . }";

            engine.execute(query, function(success, result){
                engine.execute('PREFIX : <http://example/> SELECT ?s {  ?s :p ?v . } GROUP BY ?s', function(success, results){
                    test.ok(success);
                    test.ok(results.length === 2);
                    test.ok(results[0].s.value === "http://example/s1");
                    test.ok(results[1].s.value === "http://example/s2");
                    test.done();
                });
            });
        });
    });
};

exports.testBasicUpdateInsertDataSPONamed2 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = "PREFIX : <http://example.org/ns#> INSERT DATA { GRAPH <http://example.org/g1> { :s :p :o } }";

            engine.execute(query, function(success, result){

                var query = "PREFIX : <http://example.org/ns#> INSERT DATA { GRAPH <http://example.org/g1> { :s :p :o2 } }";

                engine.execute(query, function(success, result){

                    engine.execute('PREFIX : <http://example.org/ns#> SELECT * { ?s ?p ?o } ORDER BY ?o', function(success, results){
                        test.ok(success);
                        test.ok(results.length === 2);
                        test.ok(results[0].s.value === "http://example.org/ns#s");
                        test.ok(results[0].p.value === "http://example.org/ns#p");
                        test.ok(results[0].o.value === "http://example.org/ns#o");

                        test.ok(results[1].s.value === "http://example.org/ns#s");
                        test.ok(results[1].p.value === "http://example.org/ns#p");
                        test.ok(results[1].o.value === "http://example.org/ns#o2");

                        test.done();
                    }, [{"token": "uri", "prefix": null, "suffix": null, "value": "http://example.org/g1"}], []);
                });
            });
        });
    });
};

exports.testBasicUpdateInsertDataSPONamed3 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = "PREFIX : <http://example.org/ns#> INSERT DATA { GRAPH <http://example.org/g1> { :s :p :o } }";

            engine.execute(query, function(success, result){

                var query = "PREFIX : <http://example.org/ns#> INSERT DATA { GRAPH <http://example.org/g1> { :s :p :o } }";

                engine.execute(query, function(success, result){

                    engine.execute('PREFIX : <http://example.org/ns#> SELECT * { ?s ?p ?o } ORDER BY ?o', function(success, results){
                        test.ok(success);
                        test.ok(results.length === 1);
                        test.ok(results[0].s.value === "http://example.org/ns#s");
                        test.ok(results[0].p.value === "http://example.org/ns#p");
                        test.ok(results[0].o.value === "http://example.org/ns#o");

                        test.done();
                    }, [{"token": "uri", "prefix": null, "suffix": null, "value": "http://example.org/g1"}], []);
                });
            });
        });
    });
};

exports.testBasicUpdateInsertWhere01 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = "PREFIX : <http://example.org/> INSERT DATA { <http://example.org/s> <http://example.org/p> 'o' . }";

            engine.execute(query, function(success, result){

                var query = "PREFIX : <http://example.org/> INSERT { ?s ?p 'q' } WHERE { ?s ?p ?o }";

                engine.execute(query, function(success, result){

                    engine.execute('PREFIX : <http://example.org/> SELECT * { ?s ?p ?o } ORDER BY ?o', function(success, results){
                        test.ok(success);

                        test.ok(results.length === 2);
                        test.ok(results[0].s.value === "http://example.org/s");
                        test.ok(results[0].p.value === "http://example.org/p");
                        test.ok(results[0].o.value === "o");

                        test.ok(results[1].s.value === "http://example.org/s");
                        test.ok(results[1].p.value === "http://example.org/p");
                        test.ok(results[1].o.value === "q");

                        test.done();
                    });
                });
            });
        });
    });
};

exports.testBasicUpdateInsertWhere02 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = "PREFIX : <http://example.org/> INSERT DATA { <http://example.org/s> <http://example.org/p> 'o' . }";

            engine.execute(query, function(success, result){

                var query = "PREFIX : <http://example.org/> INSERT { GRAPH :g1 { ?s ?p 'q' } } WHERE { ?s ?p ?o }";

                engine.execute(query, function(success, result){

                    engine.execute('PREFIX : <http://example.org/> SELECT * { ?s ?p ?o } ORDER BY ?o', function(success, results){
                        test.ok(success);

                        test.ok(results.length === 1);
                        test.ok(results[0].s.value === "http://example.org/s");
                        test.ok(results[0].p.value === "http://example.org/p");
                        test.ok(results[0].o.value === "o");

                        engine.execute('PREFIX : <http://example.org/> SELECT * FROM :g1 { ?s ?p ?o } ORDER BY ?o', function(success, results){
                            test.ok(results.length === 1);
                            test.ok(results[0].s.value === "http://example.org/s");
                            test.ok(results[0].p.value === "http://example.org/p");
                            test.ok(results[0].o.value === "q");

                            test.done();
                        });
                    });
                });
            });
        });
    });
};


exports.testAggregatesAgg01 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      


            var query = 'PREFIX : <http://www.example.org/>  INSERT DATA { :s :p1 :o1 , :o2 , :o3. :s :p2 :o1 , :o2 . }';

            engine.execute(query, function(success, result){

                var query = "PREFIX : <http://www.example.org> SELECT (COUNT(?O) AS ?C) WHERE { ?S ?P ?O }";

                engine.execute(query, function(success, results){
                    test.ok(success);
                    test.ok(results[0].C.value === '5');
                    test.done();
                });
            });
        });
    });
};

exports.testAggregatesAgg02 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      


            var query = 'PREFIX : <http://www.example.org/>  INSERT DATA { :s :p1 :o1 , :o2 , :o3. :s :p2 :o1 , :o2 . }';

            engine.execute(query, function(success, result){

                var query = "PREFIX : <http://www.example.org> SELECT ?P (COUNT(?O) AS ?C) WHERE { ?S ?P ?O } GROUP BY ?P";

                engine.execute(query, function(success, results){
                    test.ok(success);

                    test.ok(results.length === 2);
                    test.ok(results[0].P.value === 'http://www.example.org/p1');
                    test.ok(results[0].C.value === '3');
                    test.ok(results[1].P.value === 'http://www.example.org/p2');
                    test.ok(results[1].C.value === '2');
                    test.done();
                });
            });
        });
    });
};

exports.testAggregatesAgg04 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      


            var query = 'PREFIX : <http://www.example.org/>  INSERT DATA { :s :p1 :o1 , :o2 , :o3. :s :p2 :o1 , :o2 . }';

            engine.execute(query, function(success, result){

                var query = "PREFIX : <http://www.example.org> SELECT (COUNT(*) AS ?C) WHERE { ?S ?P ?O }";

                engine.execute(query, function(success, results){
                    test.ok(success);

                    test.ok(results.length === 1);
                    test.ok(results[0].C.value === '5');
                    test.done();
                });
            });
        });
    });
};


exports.testAggregatesAgg05 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      


            var query = 'PREFIX : <http://www.example.org/>  INSERT DATA { :s :p1 :o1 , :o2 , :o3. :s :p2 :o1 , :o2 . }';

            engine.execute(query, function(success, result){

                var query = "PREFIX : <http://www.example.org> SELECT ?P (COUNT(*) AS ?C) WHERE { ?S ?P ?O } GROUP BY ?P";

                engine.execute(query, function(success, results){
                    test.ok(success);

                    test.ok(results.length === 2);
                    test.ok(results[0].P.value === 'http://www.example.org/p1');
                    test.ok(results[0].C.value === '3');
                    test.ok(results[1].P.value === 'http://www.example.org/p2');
                    test.ok(results[1].C.value === '2');
                    test.done();
                });
            });
        });
    });
};


//exports.testAggregatesAgg08 = function(test) {
//    new Lexicon.Lexicon(function(lexicon){
//        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
//            var engine = new QueryEngine.QueryEngine({backend: backend,
//                                                      lexicon: lexicon});      
// 
// 
//            var query = 'PREFIX : <http://www.example.org/> INSERT DATA { :s :p 0,1,2 . :s :q 0,1,2 . }';
// 
//            engine.execute(query, function(success, result){
// 
//                var query = "PREFIX : <http://www.example.org/> SELECT ((?O1 + ?O2) AS ?O12) (COUNT(?O1) AS ?C) WHERE { ?S :p ?O1; :q ?O2 } GROUP BY (?O1 + ?O2) ORDER BY ?O12";
// 
//                engine.execute(query, function(success, results){
//                    test.ok(success);
//                    console.log(results);
//                    test.ok(results.length === 0);
//                    test.done();
//                });
//            });
//        });
//    });
//}


exports.testAggregatesAgg08b = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      


            var query = 'PREFIX : <http://www.example.org/> INSERT DATA { :s :p 0,1,2 . :s :q 0,1,2 . }';

            engine.execute(query, function(success, result){

                var query = "PREFIX : <http://www.example.org/> SELECT ?O12 (COUNT(?O1) AS ?C) WHERE { ?S :p ?O1; :q ?O2 } GROUP BY ((?O1 + ?O2) AS ?O12) ORDER BY ?O12"

                engine.execute(query, function(success, results){
                    test.ok(success);

                    test.ok(results.length === 5);
                    test.ok(results[0].O12.value === '0');
                    test.ok(results[0].C.value === '1');
                    test.ok(results[1].O12.value === '1');
                    test.ok(results[1].C.value === '2');
                    test.ok(results[2].O12.value === '2');
                    test.ok(results[2].C.value === '3');
                    test.ok(results[3].O12.value === '3');
                    test.ok(results[3].C.value === '2');
                    test.ok(results[4].O12.value === '4');
                    test.ok(results[4].C.value === '1');
                    test.done();
                });
            });
        });
    });
}

exports.testAggregatesAgg09 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      


            var query = 'PREFIX : <http://www.example.org/> INSERT DATA { :s :p 0,1,2 . :s :q 0,1,2 . }';

            engine.execute(query, function(success, result){
                var query = 'PREFIX : <http://www.example.org/>\
                             SELECT ?P (COUNT(?O) AS ?C)\
                             WHERE { ?S ?P ?O } GROUP BY ?S';

                engine.execute(query, function(success, result){
                    test.ok(success === false);
                    test.done();
                });
            });
        });
    });
}

exports.testAggregatesAggSum1 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      


            var query = 'PREFIX : <http://www.example.org/> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA {                          \
                         :ints :int 1, 2, 3 .\
                         :decimals :dec 1.0, 2.2, 3.5 .\
                         :doubles :double 1.0E2, 2.0E3, 3.0E4 .\
                         :mixed1 :int 1 ; :dec 2.2 .\
                         :mixed2 :double 2E-1 ; :dec 2.2 . }';

            engine.execute(query, function(success, result){
                var query = 'PREFIX : <http://www.example.org/>\
                             SELECT (SUM(?o) AS ?sum)\
                             WHERE {\
                                     ?s :dec ?o\
                             }';

                engine.execute(query, function(success, results){
                    test.ok(results.length === 1);
                    test.ok(results[0].sum.value === '11.100000000000001');
                    test.done();
                });
            });
        });
    });
};




// Negation

exports.testsubsetByExcl01 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 15}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      

            var query = 'PREFIX ex:  <http://www.w3.org/2009/sparql/docs/tests/data-sparql11/negation#> \
                         INSERT DATA {ex:lifeForm1 a ex:Mammal, ex:Animal . ex:lifeForm2 a ex:Reptile, ex:Animal . ex:lifeForm3 a ex:Insect, ex:Animal .}';

            engine.execute(query, function(success, result){
                var query = 'PREFIX ex: <http://www.w3.org/2009/sparql/docs/tests/data-sparql11/negation#>\
                             SELECT ?animal {  ?animal a ex:Animal  FILTER NOT EXISTS { ?animal a ex:Insect } }';

                engine.execute(query, function(success, results){
                    test.ok(success);
                    test.ok(results.length === 2);
                    test.ok(results[0].animal.value === 'http://www.w3.org/2009/sparql/docs/tests/data-sparql11/negation#lifeForm1');
                    test.ok(results[1].animal.value === 'http://www.w3.org/2009/sparql/docs/tests/data-sparql11/negation#lifeForm2');
                    test.done();
                });
            });
        });
    });
};
   
exports.testTemporalProximity01 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 15}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      

            var query = 'PREFIX ex:  <http://www.w3.org/2009/sparql/docs/tests/data-sparql11/negation#> \
                         PREFIX dc:  <http://purl.org/dc/elements/1.1/>\
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA {\
                                  ex:examination1 a ex:PhysicalExamination;\
                                           dc:date "2010-01-10"^^xsd:date ;\
                                           ex:precedes ex:operation1 ;\
                                           ex:follows ex:examination2  .\
                                  ex:operation1   a ex:SurgicalProcedure;\
                                                  dc:date "2010-01-15"^^xsd:date;\
                                                  ex:follows ex:examination1, ex:examination2 .\
                                  ex:examination2 a ex:PhysicalExamination;\
                                                  dc:date "2010-01-02"^^xsd:date;\
                                                  ex:precedes ex:operation1, ex:examination1 .}';

            engine.execute(query, function(success, result){
                var query = 'PREFIX ex:  <http://www.w3.org/2009/sparql/docs/tests/data-sparql11/negation#> \
                             PREFIX dc:  <http://purl.org/dc/elements/1.1/>\
                             SELECT ?exam ?date {\
                                   ?exam a ex:PhysicalExamination;\
                                         dc:date ?date;\
                                         ex:precedes ex:operation1 .\
                                   ?op a ex:SurgicalProcedure; dc:date ?opDT .\
                                   FILTER NOT EXISTS {\
                                     ?otherExam a ex:PhysicalExamination;\
                                                ex:follows ?exam;\
                                                ex:precedes ex:operation1\
                                   }}';

                engine.execute(query, function(success, results){
                    test.ok(success);
                    test.ok(results.length === 1);
                    test.ok(results[0].exam.value === 'http://www.w3.org/2009/sparql/docs/tests/data-sparql11/negation#examination1');
                    test.done();
                });
            });
        });
    });
};

exports.testIn01 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 15}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      

            var query = 'PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         PREFIX :  <http://example.org/>\
                         INSERT DATA {\
                              :n4 :num -2 .\
                              :n1 :num -1 .\
                              :n2 :num -1.6 .\
                              :n3 :num 1.1 .\
                              :n5 :num 2.5 .\
                              :s1 :str "foo" .\
                              :s2 :str "bar"@en .\
                              :s3 :str "BAZ" .\
                              :s4 :str "é£Ÿãç‰©" .\
                              :s5 :str "100%" .\
                              :s6 :str "abc"^^xsd:string .\
                              :s7 :str "DEF"^^xsd:string .\
                              :d1 :date "2010-06-21T11:28:01Z"^^xsd:dateTime .\
                              :d2 :date "2010-12-21T15:38:02-08:00"^^xsd:dateTime .\
                              :d3 :date "2008-06-20T23:59:00Z"^^xsd:dateTime .\
                              :d4 :date "2011-02-01T01:02:03"^^xsd:dateTime .}';

            engine.execute(query, function(success, result){

                var query = 'PREFIX :  <http://example.org/> ASK {:n4 :num ?v FILTER(?v IN (-1, -2, -3))}';

                engine.execute(query, function(success, results){
                    test.ok(success);
                    test.ok(results);
                    test.done();
                });
            });
        });
    });
};


exports.testIn02 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 15}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      

            var query = 'PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         PREFIX :  <http://example.org/>\
                         INSERT DATA {\
                              :n4 :num -2 .\
                              :n1 :num -1 .\
                              :n2 :num -1.6 .\
                              :n3 :num 1.1 .\
                              :n5 :num 2.5 .\
                              :s1 :str "foo" .\
                              :s2 :str "bar"@en .\
                              :s3 :str "BAZ" .\
                              :s4 :str "é£Ÿãç‰©" .\
                              :s5 :str "100%" .\
                              :s6 :str "abc"^^xsd:string .\
                              :s7 :str "DEF"^^xsd:string .\
                              :d1 :date "2010-06-21T11:28:01Z"^^xsd:dateTime .\
                              :d2 :date "2010-12-21T15:38:02-08:00"^^xsd:dateTime .\
                              :d3 :date "2008-06-20T23:59:00Z"^^xsd:dateTime .\
                              :d4 :date "2011-02-01T01:02:03"^^xsd:dateTime .}';

            engine.execute(query, function(success, result){

                var query = 'PREFIX :  <http://example.org/> ASK {:n4 :num ?v FILTER(?v IN (1, 2, 3))}';

                engine.execute(query, function(success, results){
                    test.ok(success);
                    test.ok(!results);
                    test.done();
                });
            });
        });
    });
};

exports.testNotIn01 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 15}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      

            var query = 'PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         PREFIX :  <http://example.org/>\
                         INSERT DATA {\
                              :n4 :num -2 .\
                              :n1 :num -1 .\
                              :n2 :num -1.6 .\
                              :n3 :num 1.1 .\
                              :n5 :num 2.5 .\
                              :s1 :str "foo" .\
                              :s2 :str "bar"@en .\
                              :s3 :str "BAZ" .\
                              :s4 :str "é£Ÿãç‰©" .\
                              :s5 :str "100%" .\
                              :s6 :str "abc"^^xsd:string .\
                              :s7 :str "DEF"^^xsd:string .\
                              :d1 :date "2010-06-21T11:28:01Z"^^xsd:dateTime .\
                              :d2 :date "2010-12-21T15:38:02-08:00"^^xsd:dateTime .\
                              :d3 :date "2008-06-20T23:59:00Z"^^xsd:dateTime .\
                              :d4 :date "2011-02-01T01:02:03"^^xsd:dateTime .}';

            engine.execute(query, function(success, result){

                var query = 'PREFIX :  <http://example.org/> ASK {:n4 :num ?v FILTER(?v NOT IN (-1, -2, -3))}';

                engine.execute(query, function(success, results){
                    test.ok(success);
                    test.ok(!results);
                    test.done();
                });
            });
        });
    });
};


exports.testNotIn02 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 15}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      

            var query = 'PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                         PREFIX :  <http://example.org/>\
                         INSERT DATA {\
                              :n4 :num -2 .\
                              :n1 :num -1 .\
                              :n2 :num -1.6 .\
                              :n3 :num 1.1 .\
                              :n5 :num 2.5 .\
                              :s1 :str "foo" .\
                              :s2 :str "bar"@en .\
                              :s3 :str "BAZ" .\
                              :s4 :str "é£Ÿãç‰©" .\
                              :s5 :str "100%" .\
                              :s6 :str "abc"^^xsd:string .\
                              :s7 :str "DEF"^^xsd:string .\
                              :d1 :date "2010-06-21T11:28:01Z"^^xsd:dateTime .\
                              :d2 :date "2010-12-21T15:38:02-08:00"^^xsd:dateTime .\
                              :d3 :date "2008-06-20T23:59:00Z"^^xsd:dateTime .\
                              :d4 :date "2011-02-01T01:02:03"^^xsd:dateTime .}';

            engine.execute(query, function(success, result){

                var query = 'PREFIX :  <http://example.org/> ASK {:n4 :num ?v FILTER(?v NOT IN (1, 2, 3))}';

                engine.execute(query, function(success, results){
                    test.ok(success);
                    test.ok(results);
                    test.done();
                });
            });
        });
    });
};