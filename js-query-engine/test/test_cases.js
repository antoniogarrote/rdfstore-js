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

                engine.execute('BASE <http://example.org/x/> PREFIX : <> SELECT * WHERE { :x ?p ?v }', function(success, results){
                    test.ok(success === true);
                    test.ok(results.length === 2);
                    
                    for(var i=0; i< results.length; i++) {
                        var result = results[i];
                        if(result.p.value === "http://example.org/ns#p") {
                            result.v.value === "d:x ns:p";
                        } else if(result.p.value === "http://example.org/x/p") {
                            result.v.value === "x:x x:p";
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
                                SELECT  ?a\
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
                engine.execute('PREFIX  : <http://example.org/things#>\
                                PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
                                SELECT  * \
                                WHERE\
                                    { \
                                      ?x1 :p ?v1 .\
                                      ?x2 :p ?v2 .\
                                      FILTER ( !SAMETERM(?v1, ?v2) && ?v1 = ?v2 )\
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

exports.testExprOpsGraph01 = function(test) {
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

exports.testExprOpsGraph02 = function(test) {
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


exports.testExprOpsGraph03 = function(test) {
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
                });
            });
        });
    });
}

exports.testExprOpsGraph04 = function(test) {
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

exports.testExprOpsGraph05 = function(test) {
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

                var query = 'PREFIX : <http://example/> \
                             PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                             INSERT DATA { \
                               GRAPH <data-g1.ttl> {\
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
                                   });
                });
            });
        });
    });
}

exports.testExprOpsGraph06 = function(test) {
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

                var query = 'PREFIX : <http://example/> \
                             PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                             INSERT DATA { \
                               GRAPH <data-g1.ttl> {\
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
                                   });
                });
            });
        });
    });
}

exports.testExprOpsGraph07 = function(test) {
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

                var query = 'PREFIX : <http://example/> \
                             PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                             INSERT DATA { \
                               GRAPH <data-g1.ttl> {\
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
                                   });
                });
            });
        });
    });
}

exports.testExprOpsGraph08 = function(test) {
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
                                   });
                });
            });
        });
    });
}

exports.testExprOpsGraph09 = function(test) {
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

                var query = 'PREFIX : <http://example/> \
                             PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                             INSERT DATA { \
                               GRAPH <data-g1.ttl> {\
                                :x :q "2"^^xsd:integer .\
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
                                       test.ok(results.length === 1);
                                       test.ok(results[0].s.value === "http://example/x");
                                       test.ok(results[0].p.value === "http://example/p");
                                       test.ok(results[0].o.value === "1");
                                       test.ok(results[0].q.value === "http://example/q");
                                       test.ok(results[0].v.value === "2");
                                       test.ok(results[0].g.value === "data-g1.ttl");
                                       test.done();
                                   });
                });
            });
        });
    });
}

exports.testExprOpsGraph10 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA { \
                           _:x :p "1"^^xsd:integer .\
                           _:a :p "9"^^xsd:integer .\
                         }';
            engine.execute(query, function(success, result){

                var query = 'PREFIX : <http://example/> \
                             PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                             INSERT DATA { \
                               GRAPH <data-g4.ttl> {\
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
                                   });
                });
            });
        });
    });
}


exports.testExprOpsGraph10b = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA { \
                           _:x :p "1"^^xsd:integer .\
                           _:a :p "9"^^xsd:integer .\
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
                                   });
                });
            });
        });
    });
}

exports.testExprOpsGraph10b = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA { \
                           _:x :p "1"^^xsd:integer .\
                           _:a :p "9"^^xsd:integer .\
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
                                   });
                });
            });
        });
    });
}

exports.testExprOpsGraph11 = function(test) {
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
            var engine = new QueryEngine.QueryEngine({backend: backend,
                                                      lexicon: lexicon});      
            var query = 'PREFIX : <http://example/> \
                         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                         INSERT DATA { \
                           :x :p "1"^^xsd:integer .\
                           :a :p "9"^^xsd:integer .\
                         }';
            engine.execute(query, function(success, result){

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
                                                   test.done();}
                                               );
                            });
                        });
                    });
                });
            });
        });
    });
}
