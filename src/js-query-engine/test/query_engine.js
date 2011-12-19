var QueryEngine = require("./../src/query_engine").QueryEngine;
var QuadBackend = require("./../../js-rdf-persistence/src/quad_backend").QuadBackend;
var Lexicon = require("./../../js-rdf-persistence/src/lexicon").Lexicon;
//var Lexicon = require("./../../js-rdf-persistence/src/web_local_storage_lexicon").WebLocalStorageLexicon;

if(QueryEngine.mongodb == null) {

   exports.testInsertDataSimpleQuery = function(test){
       new Lexicon.Lexicon(function(lexicon){
           new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
               var engine = new QueryEngine.QueryEngine({backend: backend,
                                                         lexicon: lexicon});      
               engine.execute('INSERT DATA {  <http://example/book3> <http://example.com/vocab#title> <http://test.com/example> }', function(result,msg){
                 test.ok(result===true);
    
                   var s = null;
                   var p = null;
                   var o = null;
                   var captured = false;
    
                   for(var i=0; i<engine.backend.indices.length; i++) {
                       var index = engine.backend.indices[i];
                       var tree = engine.backend.indexMap[index];
    
                       var treeRoot = tree._diskRead(tree.root);
                       test.ok(treeRoot.keys.length === 1);
    
                       if(captured === false) {
                           captured = true;
    
                           s = treeRoot.keys[0].subject;
                           p = treeRoot.keys[0].predicate;
                           o = treeRoot.keys[0].object;
                       } else {
                           test.ok(s === treeRoot.keys[0].subject);
                           test.ok(p === treeRoot.keys[0].predicate);
                           test.ok(o === treeRoot.keys[0].object);
                       }
                   }
    
                   test.done();
               });
           })
       });
   };
    
   exports.testInsertDataSimpleQueryLiteral = function(test){
       new Lexicon.Lexicon(function(lexicon){
           new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
               var engine = new QueryEngine.QueryEngine({backend: backend,
                                                         lexicon: lexicon});      
               engine.execute('INSERT DATA {  <http://example/book3> <http://example.com/vocab#title> 2 }', function(result){
                   test.ok(result===true);
    
                   var s = null;
                   var p = null;
                   var o = null;
                   var captured = false;
    
                   for(var i=0; i<engine.backend.indices.length; i++) {
                       var index = engine.backend.indices[i];
                       var tree = engine.backend.indexMap[index];
    
                       var treeRoot = tree._diskRead(tree.root);
                       test.ok(treeRoot.keys.length === 1);
    
                       if(captured === false) {
                           captured = true;
    
                           s = treeRoot.keys[0].key.subject;
                           p = treeRoot.keys[0].key.predicate;
                           o = treeRoot.keys[0].key.object;
    
                           test.ok(s != null);
                           test.ok(p != null);
                           test.ok(o != null);
                       } else {
                           test.ok(s === treeRoot.keys[0].key.subject);
                           test.ok(p === treeRoot.keys[0].key.predicate);
                           test.ok(o === treeRoot.keys[0].key.object);
                       }
                   }
    
                   var result = engine.lexicon.retrieve(o);
                   test.ok(result.token === "literal");
                   test.ok(result.value === "2");
                   test.ok(result.type === "http://www.w3.org/2001/XMLSchema#integer");
                   test.done();
               });
    
           })
       });
   };
    
   exports.testInsertDataTrivialRecovery = function(test){
       new Lexicon.Lexicon(function(lexicon){
           new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
               var engine = new QueryEngine.QueryEngine({backend: backend,
                                                         lexicon: lexicon});      
               engine.execute('INSERT DATA {  <http://example/book3> <http://example.com/vocab#title> <http://test.com/example> }', function(result){
                   test.ok( result===true );
    
                   engine.execute('SELECT * { ?s ?p ?o }', function(success, result){
                       test.ok(success === true );
                       test.ok(result.length === 1);
                       test.ok(result[0]['s'].value === 'http://example/book3');
                       test.ok(result[0]['p'].value === 'http://example.com/vocab#title');
                       test.ok(result[0]['o'].value  === 'http://test.com/example');
                       test.done(); 
                   });
               });
    
           })
       });
   };
    
    
   exports.testInsertDataTrivialRecovery2 = function(test){
       new Lexicon.Lexicon(function(lexicon){
           new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
               var engine = new QueryEngine.QueryEngine({backend: backend,
                                                         lexicon: lexicon});      
               engine.execute('INSERT DATA {  <http://example/book3> <http://example.com/vocab#title> <http://test.com/example>; <http://example.com/vocab#pages> 95 }', function(success,result){
                   test.ok( success===true );
    
                   engine.execute('SELECT * { ?s ?p ?o }', function(success, result){
                       test.ok(success === true );
                       test.ok(result.length === 2);
                       test.ok(result[0]['s'].value === 'http://example/book3');
                       test.ok(result[1]['s'].value === 'http://example/book3');
    
                       if(result[0]['p'].value === 'http://example.com/vocab#title') {
                           test.ok(result[0]['o'].value === 'http://test.com/example');
                       } else if(result[0]['p'].value === 'http://example.com/vocab#pages') {
                           test.ok(result[1]['o'].value === "95");
                           test.ok(result[1]['o'].type === "http://www.w3.org/2001/XMLSchema#integer");
                       } else {
                           test.ok(false);
                       }
    
                       if(result[1]['p'].value === 'http://example.com/vocab#title') {
                           test.ok(result[1]['o'].value === 'http://test.com/example');
                       } else if(result[1]['p'].value === 'http://example.com/vocab#pages') {
                           test.ok(result[1]['o'].value === "95");
                           test.ok(result[1]['o'].type === "http://www.w3.org/2001/XMLSchema#integer");
                       } else {
                           test.ok(false);
                       }
    
                       test.done(); 
                   });
               });
    
           })
       });
   };
    
   exports.testInsertDataTrivialRecovery3 = function(test){
       new Lexicon.Lexicon(function(lexicon){
           new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
               var engine = new QueryEngine.QueryEngine({backend: backend,
                                                         lexicon: lexicon});      
               engine.execute('INSERT DATA {  <http://example/book3> <http://example.com/vocab#title> <http://test.com/example>; <http://example.com/vocab#pages> 95 }',function(success,result){
                   engine.execute('INSERT DATA { <http://example/book4> <http://example.com/vocab#title> <http://test.com/example>; <http://example.com/vocab#pages> 96 }', function(success,result){
                       test.ok( success===true );
                       engine.execute('SELECT * { <http://example/book3> ?p ?o }', function(success, result){
                           test.ok(success === true );
                           test.ok(result.length === 2);
        
                           if(result[0]['p'].value === 'http://example.com/vocab#title') {
                               test.ok(result[0]['o'].value === 'http://test.com/example');
                           } else if(result[0]['p'].value === 'http://example.com/vocab#pages') {
                               test.ok(result[0]['o'].value === "95");
                               test.ok(result[0]['o'].type === "http://www.w3.org/2001/XMLSchema#integer");
                           } else {
                               test.ok(false);
                           }
        
                           if(result[1]['p'].value === 'http://example.com/vocab#title') {
                               test.ok(result[1]['o'].value === 'http://test.com/example');
                           } else if(result[1]['p'].value === 'http://example.com/vocab#pages') {
                               test.ok(result[1]['o'].value === "95");
                               test.ok(result[1]['o'].type === "http://www.w3.org/2001/XMLSchema#integer");
                           } else {
                               test.ok(false);
                           }
        
                           test.done(); 
                       });
                   });
               });
           });
       });
   };
    
   exports.testSimpleJoin1 = function(test){
       new Lexicon.Lexicon(function(lexicon){
           new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
               var engine = new QueryEngine.QueryEngine({backend: backend,
                                                         lexicon: lexicon});      
               engine.execute('INSERT DATA {  <http://example/book3> <http://example.com/vocab#title> <http://test.com/example>; <http://example.com/vocab#pages> 95 . <http://example/book4> <http://example.com/vocab#title> <http://test.com/example>; <http://example.com/vocab#pages> 96 . }', function(success,result){
                   test.ok( success===true );
        
                   engine.execute('SELECT * { ?s <http://example.com/vocab#title> ?o . ?s <http://example.com/vocab#pages> 95 }', function(success, result){
                       test.ok(success === true );
                       test.ok(result.length === 1);
        
                       result[0]['s'].value === "http://example/book3";
                       test.done(); 
                   });
               });
           });
       });
   };
    
    
   exports.testPrefixInsertion = function(test) {
       new Lexicon.Lexicon(function(lexicon){
           new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
               var engine = new QueryEngine.QueryEngine({backend: backend,
                                                         lexicon: lexicon});      
               engine.execute('PREFIX ns: <http://example.org/ns#>  PREFIX x:  <http://example.org/x/> PREFIX z:  <http://example.org/x/#> INSERT DATA { x:x ns:p  "d:x ns:p" . x:x x:p   "x:x x:p" . z:x z:p   "z:x z:p" . }', function(success, result){
    
                   engine.execute('SELECT * { ?s ?p ?o }', function(success, results){
                       test.ok(success === true);
                       test.ok(results.length === 3);
                       
                       for(var i=0; i<results.length; i++) {
                           if(results[i].s.value === "http://example.org/x/x") {
                               if(results[i].p.value === "http://example.org/ns#p") {
                                   test.ok(results[i].o.value === "d:x ns:p");
                               } else if(results[i].p.value === "http://example.org/x/p") {
                                   test.ok(results[i].o.value === "x:x x:p");
                               } else {
                                   test.ok(false);
                               }
                           } else if(results[i].s.value === "http://example.org/x/#x") {
                               test.ok(results[i].p.value === "http://example.org/x/#p");
                               test.ok(results[i].o.value === "z:x z:p");
                           } else {
                               test.ok(false);
                           }
                       }
    
                       test.done();
                   });
               });
           });
       });
   };
    
   exports.testUnionBasic1 = function(test) {
       new Lexicon.Lexicon(function(lexicon){
           new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
               var engine = new QueryEngine.QueryEngine({backend: backend,
                                                         lexicon: lexicon});      
               engine.execute(" PREFIX dc10:  <http://purl.org/dc/elements/1.0/> PREFIX dc11:  <http://purl.org/dc/elements/1.1/> INSERT DATA { _:a  dc10:title     'SPARQL Query Language Tutorial' .\
                                _:a  dc10:creator   'Alice' .\
                                _:b  dc11:title     'SPARQL Protocol Tutorial' .\
                                _:b  dc11:creator   'Bob' .\
                                _:c  dc10:title     'SPARQL' .\
                                _:c  dc11:title     'SPARQL (updated)' .\
                                }", function(success, result) {
    
                                    engine.execute("PREFIX dc10:  <http://purl.org/dc/elements/1.0/>\
                                                    PREFIX dc11:  <http://purl.org/dc/elements/1.1/>\
                                                    SELECT ?title WHERE  { { ?book dc10:title  ?title } UNION { ?book dc11:title  ?title } }",
                                                   function(success, results) {
                                                       test.ok(results.length === 4);
    
                                                       var titles = [];
                                                       for(var i=0; i<results.length; i++) {
                                                           titles.push(results[i].title.value);
                                                       }
                                                       titles.sort();
                                                       test.ok(titles[0], 'SPARQL');
                                                       test.ok(titles[1], 'SPARQL (updated)');
                                                       test.ok(titles[2], 'SPARQL Protocol Tutorial');
                                                       test.ok(titles[3], 'SPARQL Query Language Tutorial');
                                                       test.done();
                                                   });
                                });
           });
       });
   };
    
    
   exports.testUnionBasic2 = function(test) {
       new Lexicon.Lexicon(function(lexicon){
           new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
               var engine = new QueryEngine.QueryEngine({backend: backend,
                                                         lexicon: lexicon});      
               engine.execute(" PREFIX dc10:  <http://purl.org/dc/elements/1.0/> PREFIX dc11:  <http://purl.org/dc/elements/1.1/> INSERT DATA { _:a  dc10:title     'SPARQL Query Language Tutorial' .\
                                _:a  dc10:creator   'Alice' .\
                                _:b  dc11:title     'SPARQL Protocol Tutorial' .\
                                _:b  dc11:creator   'Bob' .\
                                _:c  dc10:title     'SPARQL' .\
                                _:c  dc11:title     'SPARQL (updated)' .\
                                }", function(success, result) {
    
                                    engine.execute("PREFIX dc10:  <http://purl.org/dc/elements/1.0/>\
                                                    PREFIX dc11:  <http://purl.org/dc/elements/1.1/>\
                                                    SELECT ?x ?y\
                                                    WHERE  { { ?book dc10:title ?x } UNION { ?book dc11:title  ?y } }",
                                                   function(success, results) {
                                                       test.ok(results.length === 4);
    
                                                       var xs = [];
                                                       var ys = [];
                                                       for(var i=0; i<results.length; i++) {
                                                           if(results[i].x == null) {
                                                               ys.push(results[i].y.value);
                                                           } else {
                                                               xs.push(results[i].x.value);
                                                           }
                                                       }
    
                                                       xs.sort();
                                                       ys.sort();
    
                                                       test.ok(xs[0]=='SPARQL');
                                                       test.ok(xs[1]=='SPARQL Query Language Tutorial');
                                                       test.ok(ys[0]=='SPARQL (updated)');
                                                       test.ok(ys[1]=='SPARQL Protocol Tutorial');
                                                       test.done();
                                                   });
                                });
           });
       });
   };
    
    
   exports.testUnionBasic3 = function(test) {
       new Lexicon.Lexicon(function(lexicon){
           new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
               var engine = new QueryEngine.QueryEngine({backend: backend,
                                                         lexicon: lexicon});      
               engine.execute(" PREFIX dc10:  <http://purl.org/dc/elements/1.0/> PREFIX dc11:  <http://purl.org/dc/elements/1.1/> INSERT DATA { _:a  dc10:title     'SPARQL Query Language Tutorial' .\
                                _:a  dc10:creator   'Alice' .\
                                _:b  dc11:title     'SPARQL Protocol Tutorial' .\
                                _:b  dc11:creator   'Bob' .\
                                _:c  dc10:title     'SPARQL' .\
                                _:c  dc11:title     'SPARQL (updated)' .\
                                }", function(success, result) {
    
                                    engine.execute("PREFIX dc10:  <http://purl.org/dc/elements/1.0/>\
                                                    PREFIX dc11:  <http://purl.org/dc/elements/1.1/>\
                                                    SELECT ?title ?author\
                                                    WHERE  { { ?book dc10:title ?title .  ?book dc10:creator ?author }\
                                                    UNION\
                                                    { ?book dc11:title ?title .  ?book dc11:creator ?author } }",
                                                   function(success, results) {
                                                       test.ok(results.length === 2);
    
                                                       if(results[0].author.value == "Alice") {
                                                           test.ok(results[0].title.value == "SPARQL Query Language Tutorial");
                                                           test.ok(results[1].author.value == "Bob");
                                                           test.ok(results[1].title.value == "SPARQL Protocol Tutorial");
                                                       } else {
                                                           test.ok(results[1].author.value == "Alice");
                                                           test.ok(results[1].title.value == "SPARQL Query Language Tutorial");
                                                           test.ok(results[0].author.value == "Bob");
                                                           test.ok(results[0].title.value == "SPARQL Protocol Tutorial");
                                                       }
                                                       test.done();
                                                   });
                                });
           });
       });
   };
    
    
   exports.testUnionBasic4 = function(test) {
       new Lexicon.Lexicon(function(lexicon){
           new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
               var engine = new QueryEngine.QueryEngine({backend: backend,
                                                         lexicon: lexicon});      
               engine.execute(" PREFIX dc10:  <http://purl.org/dc/elements/1.0/> PREFIX dc11:  <http://purl.org/dc/elements/1.1/> INSERT DATA { _:a  dc10:title     'SPARQL Query Language Tutorial' .\
                                _:a  dc10:creator   'Alice' .\
                                _:b  dc11:title     'SPARQL Protocol Tutorial' .\
                                _:b  dc11:creator   'Bob' .\
                                _:c  dc10:title     'SPARQL' .\
                                _:c  dc11:title     'SPARQL (updated)' .\
                                }", function(success, result) {
    
                                    engine.execute("SELECT ?book WHERE { ?book ?p ?o }",
                                                   function(success, results) {
                                                       test.ok(results.length === 6);
                                                       for(var i=0; i<6; i++) {
                                                           test.ok(results[i].book.token == 'blank');
                                                           test.ok(results[i].book.value != null);
                                                       }
                                                       test.done();
                                                   });
                                });
           });
       });
   };
    
   exports.testOptionalBasic1 = function(test) {
       new Lexicon.Lexicon(function(lexicon){
           new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
               var engine = new QueryEngine.QueryEngine({backend: backend,
                                                         lexicon: lexicon});      
               engine.execute("PREFIX  foaf:  <http://xmlns.com/foaf/0.1/>\
                               INSERT DATA {\
                                 _:a    foaf:name   'Alice' .\
                                 _:a    foaf:knows  _:b .\
                                 _:a    foaf:knows  _:c .\
                                 _:b    foaf:name   'Bob' .\
                                 _:c    foaf:name   'Clare' .\
                                 _:c    foaf:nick   'CT' .\
                               }", function(success, result) {
    
                                   engine.execute("PREFIX foaf:    <http://xmlns.com/foaf/0.1/>\
                                                   SELECT ?nameX ?nameY ?nickY\
                                                   WHERE\
                                                   { ?x foaf:knows ?y ;\
                                                     foaf:name ?nameX .\
                                                     ?y foaf:name ?nameY .\
                                                     OPTIONAL { ?y foaf:nick ?nickY }  }",
                                                  function(success, results) {
                                                      test.ok(results.length === 2);
                                                      if(results[0].nickY === null) {
                                                          test.ok(results[0].nameX.value === 'Alice');
                                                          test.ok(results[0].nameY.value === 'Bob');                                                       
                                                          test.ok(results[1].nameX.value === 'Alice');
                                                          test.ok(results[1].nameY.value === 'Clare');                                                       
                                                          test.ok(results[1].nickY.value === 'CT');                                                       
                                                      } else {
                                                          test.ok(results[1].nameX.value === 'Alice');
                                                          test.ok(results[1].nameY.value === 'Bob');                                                       
                                                          test.ok(results[0].nameX.value === 'Alice');
                                                          test.ok(results[0].nameY.value === 'Clare');                                                       
                                                          test.ok(results[0].nickY.value === 'CT');                                                       
                                                      }
                                                      test.done();
                                                  });
                               });
           });
       });
   };
    
   exports.testOptionalDistinct1 = function(test) {
       new Lexicon.Lexicon(function(lexicon){
           new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
               var engine = new QueryEngine.QueryEngine({backend: backend,
                                                         lexicon: lexicon});      
               engine.execute("PREFIX  foaf:  <http://xmlns.com/foaf/0.1/>\
                               INSERT DATA {\
                                 _:x    foaf:name   'Alice' .\
                                 _:x    foaf:mbox   <mailto:alice@example.com> .\
                                 _:y    foaf:name   'Alice' .\
                                 _:y    foaf:mbox   <mailto:asmith@example.com> .\
                                 _:z    foaf:name   'Alice' .\
                                 _:z    foaf:mbox   <mailto:alice.smith@example.com> .\
                               }", function(success, result) {
    
                                   engine.execute("PREFIX foaf:    <http://xmlns.com/foaf/0.1/>\
                                                   SELECT DISTINCT ?name WHERE { ?x foaf:name ?name }",
                                                  function(success, results) {
                                                      test.ok(results.length === 1);
                                                      test.ok(results[0].name.value === 'Alice');
                                                      test.done();
                                                  });
                               });
           });
       });
   };
    
    
   exports.testLimit1 = function(test) {
       new Lexicon.Lexicon(function(lexicon){
           new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
               var engine = new QueryEngine.QueryEngine({backend: backend,
                                                         lexicon: lexicon});      
               engine.execute("PREFIX  foaf:  <http://xmlns.com/foaf/0.1/>\
                               INSERT DATA {\
                                 _:x    foaf:name   'Alice' .\
                                 _:x    foaf:mbox   <mailto:alice@example.com> .\
                                 _:y    foaf:name   'Alice' .\
                                 _:y    foaf:mbox   <mailto:asmith@example.com> .\
                                 _:z    foaf:name   'Alice' .\
                                 _:z    foaf:mbox   <mailto:alice.smith@example.com> .\
                               }", function(success, result) {
    
                                   engine.execute("PREFIX foaf:    <http://xmlns.com/foaf/0.1/>\
                                                   SELECT ?name WHERE { ?x foaf:name ?name } LIMIT 2",
                                                  function(success, results) {
                                                      test.ok(results.length === 2);
                                                      test.ok(results[0].name.value === 'Alice');
                                                      test.ok(results[1].name.value === 'Alice');
                                                      test.done();
                                                  });
                               });
           });
       });
   };
    
    
   exports.testOrderBy1 = function(test) {
       new Lexicon.Lexicon(function(lexicon){
           new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
               var engine = new QueryEngine.QueryEngine({backend: backend,
                                                         lexicon: lexicon});      
               engine.execute("PREFIX  foaf:  <http://xmlns.com/foaf/0.1/>\
                               INSERT DATA {\
                                 _:x    foaf:name   'Bob' .\
                                 _:x    foaf:mbox   <mailto:alice@example.com> .\
                                 _:y    foaf:name   'Alice' .\
                                 _:y    foaf:mbox   <mailto:asmith@example.com> .\
                                 _:z    foaf:name   'Marie' .\
                                 _:z    foaf:mbox   <mailto:alice.smith@example.com> .\
                               }", function(success, result) {
                                   engine.execute("PREFIX foaf:    <http://xmlns.com/foaf/0.1/>\
                                                   SELECT ?name WHERE { ?x foaf:name ?name } ORDER BY ?name",
                                                  function(success, results) {
                                                      test.ok(results.length === 3);
                                                      test.ok(results[0].name.value === 'Alice');
                                                      test.ok(results[1].name.value === 'Bob');
                                                      test.ok(results[2].name.value === 'Marie');
                                                      test.done();
                                                  });
                               });
           });
       });
   };
    
   exports.testOrderBy2 = function(test) {
       new Lexicon.Lexicon(function(lexicon){
           new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
               var engine = new QueryEngine.QueryEngine({backend: backend,
                                                         lexicon: lexicon});      
               engine.execute("PREFIX  foaf:  <http://xmlns.com/foaf/0.1/>\
                               INSERT DATA {\
                                 _:x    foaf:name   'Bob' .\
                                 _:x    foaf:mbox   <mailto:alice@example.com> .\
                                 _:y    foaf:name   'Alice' .\
                                 _:y    foaf:mbox   <mailto:asmith@example.com> .\
                                 _:z    foaf:name   'Marie' .\
                                 _:z    foaf:mbox   <mailto:alice.smith@example.com> .\
                               }", function(success, result) {
    
                                   engine.execute("PREFIX foaf:    <http://xmlns.com/foaf/0.1/>\
                                                   SELECT ?name WHERE { ?x foaf:name ?name } ORDER BY DESC(?name)",
                                                  function(success, results) {
                                                      test.ok(results.length === 3);
                                                      test.ok(results[0].name.value === 'Marie');
                                                      test.ok(results[1].name.value === 'Bob');
                                                      test.ok(results[2].name.value === 'Alice');
                                                      test.done();
                                                  });
                               });
           });
       });
   };
    
   exports.testOrderBy3 = function(test) {
       new Lexicon.Lexicon(function(lexicon){
           new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
               var engine = new QueryEngine.QueryEngine({backend: backend,
                                                         lexicon: lexicon});      
               engine.execute("PREFIX  foaf:  <http://xmlns.com/foaf/0.1/>\
                               INSERT DATA {\
                                 _:x    foaf:name   'Bob' .\
                                 _:x    foaf:mbox   <mailto:bob@example.com> .\
                                 _:y    foaf:name   'Alice' .\
                                 _:y    foaf:mbox   <mailto:alice@example.com> .\
                                 _:z    foaf:name   'Marie' .\
                                 _:z    foaf:mbox   <mailto:marie@example.com> .\
                               }", function(success, result) {
    
                                   engine.execute("PREFIX foaf:    <http://xmlns.com/foaf/0.1/>\
                                                   SELECT ?mbox WHERE { ?x foaf:mbox ?mbox } ORDER BY ASC(?mbox)",
                                                  function(success, results) {
                                                      test.ok(results.length === 3);
                                                      test.ok(results[0].mbox.value === 'mailto:alice@example.com');
                                                      test.ok(results[1].mbox.value === 'mailto:bob@example.com');
                                                      test.ok(results[2].mbox.value === 'mailto:marie@example.com');
                                                      test.done();
                                                  });
                               });
           });
       });
   };
    
    
   exports.testOrderBy3 = function(test) {
       new Lexicon.Lexicon(function(lexicon){
           new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
               var engine = new QueryEngine.QueryEngine({backend: backend,
                                                         lexicon: lexicon});      
               engine.execute("PREFIX  foaf:  <http://xmlns.com/foaf/0.1/>\
                               INSERT DATA {\
                                 _:x    foaf:name   'Bob' .\
                                 _:x    foaf:test1   'b' .\
                                 _:y    foaf:name   'Alice' .\
                                 _:y    foaf:test1   'a' .\
                                 _:z    foaf:name   'Marie' .\
                                 _:z    foaf:test1   'a' .\
                               }", function(success, result) {
    
                                   engine.execute("PREFIX foaf:    <http://xmlns.com/foaf/0.1/>\
                                                   SELECT ?name WHERE { ?x foaf:test1 ?test . ?x foaf:name ?name } ORDER BY ASC(?test) ASC(?name)",
                                                  function(success, results) {
                                                      test.ok(results.length === 3);
                                                      test.ok(results[0].name.value === 'Alice');
                                                      test.ok(results[1].name.value === 'Marie');
                                                      test.ok(results[2].name.value === 'Bob');
                                                      test.done();
                                                  });
                               });
           });
       });
   };
    
    
   exports.testInsertionDeletionTrivial1 = function(test){
       new Lexicon.Lexicon(function(lexicon){
           new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
               var engine = new QueryEngine.QueryEngine({backend: backend,
                                                         lexicon: lexicon});      
               engine.execute('INSERT DATA {  <http://example/book3> <http://example.com/vocab#title> <http://test.com/example> }', function(result){
                   test.ok( result===true );
    
                   engine.execute('SELECT * { ?s ?p ?o }', function(success, result){
                       test.ok(success === true );
                       test.ok(result.length === 1);
                       test.ok(result[0]['s'].value === 'http://example/book3');
                       test.ok(result[0]['p'].value === 'http://example.com/vocab#title');
                       test.ok(result[0]['o'].value  === 'http://test.com/example');
    
                       engine.execute('DELETE DATA { <http://example/book3> <http://example.com/vocab#title> <http://test.com/example> }', function(result) {
                           engine.execute('SELECT * { ?s ?p ?o }', function(success, result){
                               test.ok(success === true );
                               test.ok(result.length === 0);
                               var acum = 0;
                               for(var p in engine.lexicon.uriToOID) {
                                   acum++;
                               }
                               for(var p in engine.lexicon.OIDToUri) {
                                   acum++;
                               }
    
                               for(var p in engine.lexicon.literalToOID) {
                                   acum++;
                               }
    
                               for(var p in engine.lexicon.OIDToLiteral) {
                                   acum++;
                               }
                               test.ok(acum===0);
                               test.done(); 
                           });
                       });
                   });
               });
    
           })
       });
   };
    
   exports.testInsertionDeletion2 = function(test){
       new Lexicon.Lexicon(function(lexicon){
           new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
               var engine = new QueryEngine.QueryEngine({backend: backend,
                                                         lexicon: lexicon});      
               engine.execute('INSERT DATA {  GRAPH <a> { <http://example/book3> <http://example.com/vocab#title> <http://test.com/example> } }', function(result){
                   test.ok( result===true );
    
                   engine.execute('INSERT DATA {  GRAPH <b> { <http://example/book3> <http://example.com/vocab#title> <http://test.com/example> } }', function(result){
                       test.ok( result===true );
    
                       engine.execute('SELECT * FROM NAMED <a> { GRAPH <a> { ?s ?p ?o } }', function(success, result){
                           test.ok(success === true );
                           test.ok(result.length === 1);
                           test.ok(result[0]['s'].value === 'http://example/book3');
                           test.ok(result[0]['p'].value === 'http://example.com/vocab#title');
                           test.ok(result[0]['o'].value  === 'http://test.com/example');
    
                           engine.execute('SELECT * FROM NAMED <b> { GRAPH <b> { ?s ?p ?o } }', function(success, result){
    
                               test.ok(success === true );
                               test.ok(result.length === 1);
                               test.ok(result[0]['s'].value === 'http://example/book3');
                               test.ok(result[0]['p'].value === 'http://example.com/vocab#title');
                               test.ok(result[0]['o'].value  === 'http://test.com/example');
    
                               engine.execute('DELETE DATA { GRAPH <a> { <http://example/book3> <http://example.com/vocab#title> <http://test.com/example> }  }', function(result) {
    
                                   engine.execute('SELECT * FROM NAMED <a> { GRAPH <a> { ?s ?p ?o } }', function(success, result){
    
                                       test.ok(success === true );
                                       test.ok(result.length === 0);
    
                                       engine.execute('SELECT * FROM NAMED <b> { GRAPH <b> { ?s ?p ?o } }', function(success, result){
    
                                       test.ok(success === true );
                                       test.ok(result.length === 1);
                                       test.ok(result[0]['s'].value === 'http://example/book3');
                                       test.ok(result[0]['p'].value === 'http://example.com/vocab#title');
                                       test.ok(result[0]['o'].value  === 'http://test.com/example');
    
    
                                           var acum = 0;
                                           for(var p in engine.lexicon.uriToOID) {
                                               acum++;
                                           }
                                           for(var p in engine.lexicon.OIDToUri) {
                                               acum++;
                                           }
                                            
                                           for(var p in engine.lexicon.literalToOID) {
                                               acum++;
                                           }
                                            
                                           for(var p in engine.lexicon.OIDToLiteral) {
                                               acum++;
                                           }
    
                                           test.ok(acum===8);
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
   };
    
   exports.testModify1 = function(test){
       new Lexicon.Lexicon(function(lexicon){
           new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
               var engine = new QueryEngine.QueryEngine({backend: backend,
                                                         lexicon: lexicon});      
               engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                               INSERT DATA {  GRAPH <http://example/addresses> \
                                   { \
                                        <http://example/president25> foaf:givenName "Bill" .\
                                        <http://example/president25> foaf:familyName "McKinley" .\
                                        <http://example/president27> foaf:givenName "Bill" .\
                                        <http://example/president27> foaf:familyName "Taft" .\
                                        <http://example/president42> foaf:givenName "Bill" .\
                                        <http://example/president42> foaf:familyName "Clinton" .\
                                   } \
                               }', function(result){
              engine.execute("PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                              WITH <http://example/addresses>\
                              DELETE { ?person foaf:givenName 'Bill' }\
                              INSERT { ?person foaf:givenName 'William' }\
                              WHERE  { ?person foaf:givenName 'Bill' }", 
                             function(success, result){
              engine.execute("PREFIX foaf:<http://xmlns.com/foaf/0.1/>\
                              SELECT * FROM NAMED <http://example/addresses> { \
                              GRAPH <http://example/addresses> { ?s ?p ?o } }\
                              ORDER BY ?s ?p", function(success, results){
                             
                                  test.ok(success === true);
    
                                  test.ok(results[0].s.value === "http://example/president25");
                                  test.ok(results[1].s.value === "http://example/president25");
                                  test.ok(results[0].o.value === "McKinley");
                                  test.ok(results[1].o.value === "William");
    
                                  test.ok(results[2].s.value === "http://example/president27");
                                  test.ok(results[3].s.value === "http://example/president27");
                                  test.ok(results[2].o.value === "Taft");
                                  test.ok(results[3].o.value === "William");
    
                                  test.ok(results[4].s.value === "http://example/president42");
                                  test.ok(results[5].s.value === "http://example/president42");
                                  test.ok(results[4].o.value === "Clinton");
                                  test.ok(results[5].o.value === "William");
    
                                  test.done();
                                  
                       })
                   });
               });
           });
       });
   };
    
    
   exports.testModifyDefaultGraph = function(test){
       new Lexicon.Lexicon(function(lexicon){
           new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
               var engine = new QueryEngine.QueryEngine({backend: backend,
                                                         lexicon: lexicon});      
               engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                               INSERT DATA {  \
                                        <http://example/president25> foaf:givenName "Bill" .\
                                        <http://example/president25> foaf:familyName "McKinley" .\
                                        <http://example/president27> foaf:givenName "Bill" .\
                                        <http://example/president27> foaf:familyName "Taft" .\
                                        <http://example/president42> foaf:givenName "Bill" .\
                                        <http://example/president42> foaf:familyName "Clinton" .\
                               }', function(result){
              engine.execute("PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                              DELETE { ?person foaf:givenName 'Bill' }\
                              INSERT { ?person foaf:givenName 'William' }\
                              WHERE  { ?person foaf:givenName 'Bill' }", 
                             function(success, result){
              engine.execute("PREFIX foaf:<http://xmlns.com/foaf/0.1/>\
                              SELECT * { ?s ?p ?o }\
                              ORDER BY ?s ?p", function(success, results){
                             
                                  test.ok(success === true);
    
                                  test.ok(results[0].s.value === "http://example/president25");
                                  test.ok(results[1].s.value === "http://example/president25");
                                  test.ok(results[0].o.value === "McKinley");
                                  test.ok(results[1].o.value === "William");
    
                                  test.ok(results[2].s.value === "http://example/president27");
                                  test.ok(results[3].s.value === "http://example/president27");
                                  test.ok(results[2].o.value === "Taft");
                                  test.ok(results[3].o.value === "William");
    
                                  test.ok(results[4].s.value === "http://example/president42");
                                  test.ok(results[5].s.value === "http://example/president42");
                                  test.ok(results[4].o.value === "Clinton");
                                  test.ok(results[5].o.value === "William");
    
                                  test.done();
                                  
                       })
                   });
               });
           });
       });
   };
    
   exports.testModifyOnlyInsert = function(test){
       new Lexicon.Lexicon(function(lexicon){
           new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
               var engine = new QueryEngine.QueryEngine({backend: backend,
                                                         lexicon: lexicon});      
               engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                               INSERT DATA {  GRAPH <http://example/addresses> \
                                   { \
                                        <http://example/president25> foaf:givenName "Bill" .\
                                        <http://example/president25> foaf:familyName "McKinley" .\
                                        <http://example/president27> foaf:givenName "Bill" .\
                                        <http://example/president27> foaf:familyName "Taft" .\
                                        <http://example/president42> foaf:givenName "Bill" .\
                                        <http://example/president42> foaf:familyName "Clinton" .\
                                   } \
                               }', function(result){
              engine.execute("PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                              WITH <http://example/addresses_bis>\
                              INSERT { ?person foaf:givenName 'William' }\
                              USING <http://example/addresses>\
                              WHERE  { ?person foaf:givenName 'Bill' }", 
                             function(success, result){
              engine.execute("PREFIX foaf:<http://xmlns.com/foaf/0.1/>\
                              SELECT * FROM <http://example/addresses_bis> \
                              { ?s ?p ?o }\
                              ORDER BY ?s ?p", function(success, results){
                             
                                  test.ok(success === true);
                                  test.ok(results[0].s.value === "http://example/president25");
                                  test.ok(results[0].o.value === "William");
    
                                  test.ok(results[1].s.value === "http://example/president27");
                                  test.ok(results[1].o.value === "William");
    
                                  test.ok(results[2].s.value === "http://example/president42");
                                  test.ok(results[2].o.value === "William");
    
                                  test.done();
                                  
                       })
                   });
               });
           });
       });
   };
    
    
   exports.testModifyOnlyDelete = function(test){
       new Lexicon.Lexicon(function(lexicon){
           new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
               var engine = new QueryEngine.QueryEngine({backend: backend,
                                                         lexicon: lexicon});      
               engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                               INSERT DATA {  GRAPH <http://example/addresses> \
                                   { \
                                        <http://example/president25> foaf:givenName "Bill" .\
                                        <http://example/president25> foaf:familyName "McKinley" .\
                                        <http://example/president27> foaf:givenName "Bill" .\
                                        <http://example/president27> foaf:familyName "Taft" .\
                                        <http://example/president42> foaf:givenName "Bill" .\
                                        <http://example/president42> foaf:familyName "Clinton" .\
                                   } \
                               }', function(result){
              engine.execute("PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                              WITH <http://example/addresses>\
                              DELETE { ?person foaf:givenName 'Bill' }\
                              USING <http://example/addresses>\
                              WHERE  { ?person foaf:givenName 'Bill' }", 
                             function(success, result){
              engine.execute("PREFIX foaf:<http://xmlns.com/foaf/0.1/>\
                              SELECT * FROM <http://example/addresses> \
                              { ?s ?p ?o }\
                              ORDER BY ?s ?p", function(success, results){
                                  test.ok(success === true);
                                  test.ok(results.length === 3);
                                  test.done();
                                  
                       })
                   });
               });
           });
       });
   };
    
   exports.testAliasedVar = function(test) {
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
                   engine.execute('PREFIX : <http://example/> SELECT (?s AS ?t) {  ?s :p ?v . } GROUP BY ?s', function(success, results){
                       test.ok(success);
                       test.ok(results.length === 2);
                       test.ok(results[0].t.value === "http://example/s1");
                       test.ok(results[1].t.value === "http://example/s2");
                       test.done();
                   });
               });
           });
       });
   };
    
   exports.testClearGraph1 = function(test){
       new Lexicon.Lexicon(function(lexicon){
           new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
               var engine = new QueryEngine.QueryEngine({backend: backend,
                                                         lexicon: lexicon});      
               engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                               INSERT DATA {  GRAPH <http://example/president25> \
                                   { \
                                        <http://example/president25> foaf:givenName "Bill" .\
                                        <http://example/president25> foaf:familyName "McKinley" .\
                                   } \
                               }', function(result){
    
               engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                               INSERT DATA {  GRAPH <http://example/president27> \
                                   { \
                                        <http://example/president27> foaf:givenName "Bill" .\
                                        <http://example/president27> foaf:familyName "Taft" .\
                                   } \
                               }', function(result){
    
              engine.execute("CLEAR GRAPH <http://example/president27>", function(success, results){
                  engine.execute("SELECT * { GRAPH <http://example/president27> { ?s ?p ?o } }", function(success, results) {
    
                        test.ok(success);
                        test.ok(results.length === 0);
    
                      engine.execute("SELECT * { GRAPH <http://example/president25> { ?s ?p ?o } }", function(success, results) {
    
                          test.ok(results.length === 2);
                          test.done();
    
                      });
                  });
              });
              });
              });
           });
       });
   };
    
   exports.testClearGraph2 = function(test){
       new Lexicon.Lexicon(function(lexicon){
           new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
               var engine = new QueryEngine.QueryEngine({backend: backend,
                                                         lexicon: lexicon});      
    
               engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                                 INSERT DATA { \
                                      <http://example/president22> foaf:givenName "Grover" .\
                                      <http://example/president22> foaf:familyName "Cleveland" .\
                                 }', function(succes, result){
               engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                               INSERT DATA {  GRAPH <http://example/president25> \
                                   { \
                                        <http://example/president25> foaf:givenName "Bill" .\
                                        <http://example/president25> foaf:familyName "McKinley" .\
                                   } \
                               }', function(result){
    
               engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                               INSERT DATA {  GRAPH <http://example/president27> \
                                   { \
                                        <http://example/president27> foaf:givenName "Bill" .\
                                        <http://example/president27> foaf:familyName "Taft" .\
                                   } \
                               }', function(result){
    
              engine.execute("CLEAR DEFAULT", function(success, results){
                  engine.execute("SELECT *  { ?s ?p ?o } ", function(success, results) {
    
                      test.ok(success);
                      test.ok(results.length === 0);
    
                  engine.execute("SELECT * { GRAPH <http://example/president27> { ?s ?p ?o } }", function(success, results) {
    
                        test.ok(success);
                        test.ok(results.length === 2);
    
                      engine.execute("SELECT * { GRAPH <http://example/president25> { ?s ?p ?o } }", function(success, results) {
    
                          test.ok(results.length === 2);
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
   };
    
   exports.testClearGraph3 = function(test){
       new Lexicon.Lexicon(function(lexicon){
           new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
               var engine = new QueryEngine.QueryEngine({backend: backend,
                                                         lexicon: lexicon});      
    
               engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                                 INSERT DATA { \
                                      <http://example/president22> foaf:givenName "Grover" .\
                                      <http://example/president22> foaf:familyName "Cleveland" .\
                                 }', function(succes, result){
               engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                               INSERT DATA {  GRAPH <http://example/president25> \
                                   { \
                                        <http://example/president25> foaf:givenName "Bill" .\
                                        <http://example/president25> foaf:familyName "McKinley" .\
                                   } \
                               }', function(result){
    
               engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                               INSERT DATA {  GRAPH <http://example/president27> \
                                   { \
                                        <http://example/president27> foaf:givenName "Bill" .\
                                        <http://example/president27> foaf:familyName "Taft" .\
                                   } \
                               }', function(result){
    
              engine.execute("CLEAR NAMED", function(success, results){
                  test.ok(success);
                  engine.execute("SELECT *  { ?s ?p ?o } ", function(success, results) {
    
                      test.ok(results);
                      test.ok(results.length === 2);
    
                  engine.execute("SELECT * { GRAPH <http://example/president27> { ?s ?p ?o } }", function(success, results) {
    
                        test.ok(success);
                        test.ok(results.length === 0);
    
                      engine.execute("SELECT * { GRAPH <http://example/president25> { ?s ?p ?o } }", function(success, results) {
    
                          test.ok(results.length === 0);
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
   };
    
   exports.testClearGraph4 = function(test){
       new Lexicon.Lexicon(function(lexicon){
           new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
               var engine = new QueryEngine.QueryEngine({backend: backend,
                                                         lexicon: lexicon});      
    
               engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                                 INSERT DATA { \
                                      <http://example/president22> foaf:givenName "Grover" .\
                                      <http://example/president22> foaf:familyName "Cleveland" .\
                                 }', function(succes, result){
               engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                               INSERT DATA {  GRAPH <http://example/president25> \
                                   { \
                                        <http://example/president25> foaf:givenName "Bill" .\
                                        <http://example/president25> foaf:familyName "McKinley" .\
                                   } \
                               }', function(result){
    
               engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                               INSERT DATA {  GRAPH <http://example/president27> \
                                   { \
                                        <http://example/president27> foaf:givenName "Bill" .\
                                        <http://example/president27> foaf:familyName "Taft" .\
                                   } \
                               }', function(result){
    
              engine.execute("CLEAR ALL", function(success, results){
                  test.ok(success);
                  engine.execute("SELECT *  { ?s ?p ?o } ", function(success, results) {
                      test.ok(results);
                      test.ok(results.length === 0);
    
                  engine.execute("SELECT * { GRAPH <http://example/president27> { ?s ?p ?o } }", function(success, results) {
                        test.ok(success);
                        test.ok(results.length === 0);
    
                      engine.execute("SELECT * { GRAPH <http://example/president25> { ?s ?p ?o } }", function(success, results) {
                          test.ok(results.length === 0);
                          var graphs = engine.lexicon.registeredGraphs(true);
                          test.ok(success);
                          test.ok(graphs.length === 0);
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
   };
    
   exports.testCreate = function(test){
       new Lexicon.Lexicon(function(lexicon){
           new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
               var engine = new QueryEngine.QueryEngine({backend: backend,
                                                         lexicon: lexicon});      
               engine.execute('CREATE GRAPH <a>', function(result){
                   test.ok(result===true);
    
                   test.done();
               });
    
           })
       });
   };
    
   exports.testDrop1 = function(test){
       new Lexicon.Lexicon(function(lexicon){
           new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
               var engine = new QueryEngine.QueryEngine({backend: backend,
                                                         lexicon: lexicon});      
               engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                               INSERT DATA {  GRAPH <http://example/president25> \
                                   { \
                                        <http://example/president25> foaf:givenName "Bill" .\
                                        <http://example/president25> foaf:familyName "McKinley" .\
                                   } \
                               }', function(result){
    
               engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                               INSERT DATA {  GRAPH <http://example/president27> \
                                   { \
                                        <http://example/president27> foaf:givenName "Bill" .\
                                        <http://example/president27> foaf:familyName "Taft" .\
                                   } \
                               }', function(result){
    
              engine.execute("DROP GRAPH <http://example/president27>", function(success, results){
                  engine.execute("SELECT * { GRAPH <http://example/president27> { ?s ?p ?o } }", function(success, results) {
    
                        test.ok(success);
                        test.ok(results.length === 0);
    
                      engine.execute("SELECT * { GRAPH <http://example/president25> { ?s ?p ?o } }", function(success, results) {
    
                          test.ok(results.length === 2);
                          test.done();
    
                      });
                  });
              });
              });
              });
           });
       });
   };
    
   exports.testDrop2 = function(test){
       new Lexicon.Lexicon(function(lexicon){
           new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
               var engine = new QueryEngine.QueryEngine({backend: backend,
                                                         lexicon: lexicon});      
    
               engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                                 INSERT DATA { \
                                      <http://example/president22> foaf:givenName "Grover" .\
                                      <http://example/president22> foaf:familyName "Cleveland" .\
                                 }', function(succes, result){
               engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                               INSERT DATA {  GRAPH <http://example/president25> \
                                   { \
                                        <http://example/president25> foaf:givenName "Bill" .\
                                        <http://example/president25> foaf:familyName "McKinley" .\
                                   } \
                               }', function(result){
    
               engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                               INSERT DATA {  GRAPH <http://example/president27> \
                                   { \
                                        <http://example/president27> foaf:givenName "Bill" .\
                                        <http://example/president27> foaf:familyName "Taft" .\
                                   } \
                               }', function(result){
    
              engine.execute("DROP DEFAULT", function(success, results){
                  engine.execute("SELECT *  { ?s ?p ?o } ", function(success, results) {
    
                      test.ok(success);
                      test.ok(results.length === 0);
    
                  engine.execute("SELECT * { GRAPH <http://example/president27> { ?s ?p ?o } }", function(success, results) {
    
                        test.ok(success);
                        test.ok(results.length === 2);
    
                      engine.execute("SELECT * { GRAPH <http://example/president25> { ?s ?p ?o } }", function(success, results) {
    
                          test.ok(results.length === 2);
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
   };
    
   exports.testDrop3 = function(test){
       new Lexicon.Lexicon(function(lexicon){
           new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
               var engine = new QueryEngine.QueryEngine({backend: backend,
                                                         lexicon: lexicon});      
    
               engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                                 INSERT DATA { \
                                      <http://example/president22> foaf:givenName "Grover" .\
                                      <http://example/president22> foaf:familyName "Cleveland" .\
                                 }', function(succes, result){
               engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                               INSERT DATA {  GRAPH <http://example/president25> \
                                   { \
                                        <http://example/president25> foaf:givenName "Bill" .\
                                        <http://example/president25> foaf:familyName "McKinley" .\
                                   } \
                               }', function(result){
    
               engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                               INSERT DATA {  GRAPH <http://example/president27> \
                                   { \
                                        <http://example/president27> foaf:givenName "Bill" .\
                                        <http://example/president27> foaf:familyName "Taft" .\
                                   } \
                               }', function(result){
    
              engine.execute("DROP NAMED", function(success, results){
                  test.ok(success);
                  engine.execute("SELECT *  { ?s ?p ?o } ", function(success, results) {
    
                      test.ok(results);
                      test.ok(results.length === 2);
    
                  engine.execute("SELECT * { GRAPH <http://example/president27> { ?s ?p ?o } }", function(success, results) {
    
                        test.ok(success);
                        test.ok(results.length === 0);
    
                      engine.execute("SELECT * { GRAPH <http://example/president25> { ?s ?p ?o } }", function(success, results) {
    
                          test.ok(results.length === 0);
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
   };
    
   exports.testDrop4 = function(test){
       new Lexicon.Lexicon(function(lexicon){
           new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
               var engine = new QueryEngine.QueryEngine({backend: backend,
                                                         lexicon: lexicon});      
    
               engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                                 INSERT DATA { \
                                      <http://example/president22> foaf:givenName "Grover" .\
                                      <http://example/president22> foaf:familyName "Cleveland" .\
                                 }', function(succes, result){
               engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                               INSERT DATA {  GRAPH <http://example/president25> \
                                   { \
                                        <http://example/president25> foaf:givenName "Bill" .\
                                        <http://example/president25> foaf:familyName "McKinley" .\
                                   } \
                               }', function(result){
    
               engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                               INSERT DATA {  GRAPH <http://example/president27> \
                                   { \
                                        <http://example/president27> foaf:givenName "Bill" .\
                                        <http://example/president27> foaf:familyName "Taft" .\
                                   } \
                               }', function(result){
    
              engine.execute("DROP ALL", function(success, results){
                  test.ok(success);
                  engine.execute("SELECT *  { ?s ?p ?o } ", function(success, results) {
    
                      test.ok(results);
                      test.ok(results.length === 0);
    
                  engine.execute("SELECT * { GRAPH <http://example/president27> { ?s ?p ?o } }", function(success, results) {
    
                        test.ok(success);
                        test.ok(results.length === 0);
    
                      engine.execute("SELECT * { GRAPH <http://example/president25> { ?s ?p ?o } }", function(success, results) {
    
                          test.ok(results.length === 0);
                          var graphs = engine.lexicon.registeredGraphs(true);
                          test.ok(success);
                          test.ok(graphs.length === 0);
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
   };
    
   exports.testDeleteWhere1 = function(test){
       new Lexicon.Lexicon(function(lexicon){
           new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
               var engine = new QueryEngine.QueryEngine({backend: backend,
                                                         lexicon: lexicon});      
               engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                               INSERT DATA \
                                   { \
                                        <http://example/president25> foaf:givenName "Bill" .\
                                        <http://example/president25> foaf:familyName "McKinley" .\
                                        <http://example/president27> foaf:givenName "Bill" .\
                                        <http://example/president27> foaf:familyName "Taft" .\
                                        <http://example/president42> foaf:givenName "Bill" .\
                                        <http://example/president42> foaf:familyName "Clinton" .\
                                   }', function(result){
              engine.execute("PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                              DELETE WHERE  { ?person foaf:givenName 'Bill'}", function(success, result){
              engine.execute("PREFIX foaf:<http://xmlns.com/foaf/0.1/>\
                              SELECT *  \
                              { ?s ?p ?o }\
                              ORDER BY ?s ?p", function(success, results){
                                  test.ok(success === true);
                                  test.ok(results.length === 3);
                                  test.done();
                                  
                       })
                   });
               });
           });
       });
   };
    
   exports.testGroupMax1 = function(test) {
       new Lexicon.Lexicon(function(lexicon){
           new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
               var engine = new QueryEngine.QueryEngine({backend: backend,
                                                         lexicon: lexicon});      
               var query = "PREFIX : <http://example/>\
                            INSERT DATA {\
                            :s1 :p 1 .\
                            :s1 :q 9 .\
                            :s2 :p 2 .\
                            :s2 :p 0 }";
    
               engine.execute(query, function(success, result){
                   engine.execute('PREFIX : <http://example/> SELECT (MAX(?v) AS ?maxv) {  ?s ?p ?v . } GROUP BY ?s', function(success, results){
                       test.ok(success);
                       test.ok(results.length===2);
                       test.ok(results[0].maxv.value==='9')
                       test.ok(results[1].maxv.value==='2')
                       test.done();
                   });
               });
           });
       });
   };
    
    
   exports.testGroupMin1 = function(test) {
       new Lexicon.Lexicon(function(lexicon){
           new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
               var engine = new QueryEngine.QueryEngine({backend: backend,
                                                         lexicon: lexicon});      
               var query = "PREFIX : <http://example/>\
                            INSERT DATA {\
                            :s1 :p 1 .\
                            :s1 :q 9 .\
                            :s2 :p 2 .\
                            :s2 :p 0 }";
    
               engine.execute(query, function(success, result){
                   engine.execute('PREFIX : <http://example/> SELECT (MIN(?v) AS ?maxv) {  ?s ?p ?v . } GROUP BY ?s', function(success, results){
                       test.ok(success);
                       test.ok(results.length===2);
                       test.ok(results[0].maxv.value==='1')
                       test.ok(results[1].maxv.value==='0')
                       test.done();
                   });
               });
           });
       });
   };
    
   exports.testGroupCount1 = function(test) {
       new Lexicon.Lexicon(function(lexicon){
           new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
               var engine = new QueryEngine.QueryEngine({backend: backend,
                                                         lexicon: lexicon});      
               var query = "PREFIX : <http://example/>\
                            INSERT DATA {\
                            :s1 :p 1 .\
                            :s1 :q 9 .\
                            :s1 :v 9 .\
                            :s2 :p 2 .\
                            :s2 :p 0 }";
    
               engine.execute(query, function(success, result){
                   engine.execute('PREFIX : <http://example/> SELECT (COUNT(?v) AS ?count) {  ?s ?p ?v . } GROUP BY ?s', function(success, results){
                       test.ok(success);
                       test.ok(results.length===2);
                       test.ok(results[0].count.value==='3')
                       test.ok(results[1].count.value==='2')
    
                       test.done();
                   });
               });
           });
       });
   };
    
   exports.testGroupCountDistinct1 = function(test) {
       new Lexicon.Lexicon(function(lexicon){
           new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
               var engine = new QueryEngine.QueryEngine({backend: backend,
                                                         lexicon: lexicon});      
               var query = "PREFIX : <http://example/>\
                            INSERT DATA {\
                            :s1 :p 1 .\
                            :s1 :q 9 .\
                            :s1 :v 9 .\
                            :s2 :p 2 .\
                            :s2 :p 0 }";
    
               engine.execute(query, function(success, result){
                   engine.execute('PREFIX : <http://example/> SELECT (COUNT( distinct ?v) AS ?count) {  ?s ?p ?v . } GROUP BY ?s', function(success, results){
                       test.ok(success);
                       test.ok(results.length===2);
                       test.ok(results[0].count.value==='2')
                       test.ok(results[1].count.value==='2')
    
                       test.done();
                   });
               });
           });
       });
   };
    
   exports.testGroupAvg1 = function(test) {
       new Lexicon.Lexicon(function(lexicon){
           new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
               var engine = new QueryEngine.QueryEngine({backend: backend,
                                                         lexicon: lexicon});      
               var query = "PREFIX : <http://example/>\
                            INSERT DATA {\
                            :s1 :p 1 .\
                            :s1 :q 3 .\
                            :s1 :v 3 .\
                            :s2 :p 1 .\
                            :s2 :p 11 }";
    
               engine.execute(query, function(success, result){
                   engine.execute('PREFIX : <http://example/> SELECT (AVG( distinct ?v) AS ?avg) {  ?s ?p ?v . } GROUP BY ?s', function(success, results){
                       test.ok(success);
                       test.ok(results.length===2);
                       test.ok(results[0].avg.value==='2')
                       test.ok(results[1].avg.value==='6')
    
                       test.done();
                   });
               });
           });
       });
   };
    
   exports.testGroupAvg2 = function(test) {
       new Lexicon.Lexicon(function(lexicon){
           new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
               var engine = new QueryEngine.QueryEngine({backend: backend,
                                                         lexicon: lexicon});      
               var query = "PREFIX : <http://example/>\
                            INSERT DATA {\
                            :s1 :p 2 .\
                            :s1 :q 3 .\
                            :s2 :p 1 .\
                            :s2 :p 11 }";
    
               engine.execute(query, function(success, result){
                   engine.execute('PREFIX : <http://example/> SELECT (AVG(?v) AS ?avg) {  ?s ?p ?v . } GROUP BY ?s', function(success, results){
                       test.ok(success);
                       test.ok(results.length===2);
                       test.ok(results[0].avg.value==='2.5')
                       test.ok(results[1].avg.value==='6')
                       test.done();
                   });
               });
           });
       });
   };
    
   exports.testGroupSum1 = function(test) {
       new Lexicon.Lexicon(function(lexicon){
           new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
               var engine = new QueryEngine.QueryEngine({backend: backend,
                                                         lexicon: lexicon});      
               var query = "PREFIX : <http://example/>\
                            INSERT DATA {\
                            :s1 :p 1 .\
                            :s1 :q 3 .\
                            :s1 :v 3 .\
                            :s2 :p 1 .\
                            :s2 :p 11 }";
    
               engine.execute(query, function(success, result){
                   engine.execute('PREFIX : <http://example/> SELECT (SUM( distinct ?v) AS ?avg) {  ?s ?p ?v . } GROUP BY ?s', function(success, results){
                       test.ok(success);
                       test.ok(results.length===2);
                       test.ok(results[0].avg.value==='4')
                       test.ok(results[1].avg.value==='12')
    
                       test.done();
                   });
               });
           });
       });
   };
    
   exports.testGroupSum2 = function(test) {
       new Lexicon.Lexicon(function(lexicon){
           new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
               var engine = new QueryEngine.QueryEngine({backend: backend,
                                                         lexicon: lexicon});      
               var query = "PREFIX : <http://example/>\
                            INSERT DATA {\
                            :s1 :p 2 .\
                            :s1 :q 3.5 .\
                            :s2 :p 1 .\
                            :s2 :p 11 }";
    
               engine.execute(query, function(success, result){
                   engine.execute('PREFIX : <http://example/> SELECT (SUM(?v) AS ?avg) {  ?s ?p ?v . } GROUP BY ?s', function(success, results){
                       test.ok(success);
                       test.ok(results.length===2);
                       test.ok(results[0].avg.value==='5.5')
                       test.ok(results[1].avg.value==='12')
                       test.done();
                   });
               });
           });
       });
   };

}
