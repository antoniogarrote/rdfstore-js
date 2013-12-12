#rdfstore-js


rdfstore-js is a pure Javascript implementation of a RDF graph store with support for the SPARQL query and data manipulation language.

    var rdfstore = require('rdfstore');
    
    rdfstore.create(function(store) {
      store.execute('LOAD <http://dbpedia.org/resource/Tim_Berners-Lee> INTO GRAPH <http://example.org/people>', function() {

        store.setPrefix('dbp', 'http://dbpedia.org/resource/');
        
        store.node(store.rdf.resolve('dbp:Tim_Berners-Lee'), "http://example.org/people", function(success, graph) {

          var peopleGraph = graph.filter(store.rdf.filters.type(store.rdf.resolve("foaf:Person")));
          
          store.execute('PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                         PREFIX foaf: <http://xmlns.com/foaf/0.1/>\
                         PREFIX : <http://example.org/>\
                         SELECT ?s FROM NAMED :people { GRAPH ?g { ?s rdf:type foaf:Person } }',
                         function(success, results) {

                           console.log(peopleGraph.toArray()[0].subject.valueOf() === results[0].s.value);

                         });

        });

      });
    })

rdfstore-js can be executed in a web browser or can be included as a library in a node.js application. It can also be executed as a stand-alone SPARQL end-point accepting SPARQL RDF Protocol HTTP requests. Go to the bottom of this page to find some application examples using the library.

The current implementation is far from complete but it already passes all the test cases for the SPARQL 1.0 query language and supports data manipulation operations from the SPARQL 1.1/Update version of the language.

Some other features included in the library are the following:

- SPARQL 1.0 support
- SPARQL 1.1/Update support
- Partial SPARQL 1.1 query support
- JSON-LD parser
- Turtle/N3 parser
- W3C RDF Interfaces API
- RDF graph events API
- Partial support for property paths in queries
- Custom filter functions
- Parallel execution where WebWorkers are available
- Persistent storage using HTML5 LocalStorage in the browser version
- Persistent storage using MongoDB in the Node.js version
- Node.js HTTP server implementating the [SPARQL Protocol for RDF](http://www.w3.org/TR/rdf-sparql-protocol/) recommendation

## Documentation

Documentation for the store can be found [here](http://antoniogarrote.github.com/rdfstore-js/doc/index.html).

## SPARQL support

rdfstore-js supports at the moment SPARQL 1.0 and most of SPARQL 1.1/Update.
Only some parts of SPARQL 1.1 query have been implemented yet.

This is a list of the different kind of queries currently implemented:
  
- SELECT queries
- UNION, OPTIONAL clauses
- NAMED GRAPH identifiers
- LIMIT, OFFSET
- ORDER BY clauses
- SPARQL 1.0 filters and builtin functions
- variable aliases
- variable aggregation: MAX, MIN, COUNT, AVG, SUM functions
- GROUP BY clauses
- DISTINCT query modifier
- CONSTRUCT queries
- ASK queries
- INSERT DATA queries
- DELETE DATA queries
- DELETE WHERE queries
- WITH/DELETE/INSERT/WHERE queries
- LOAD queries
- CREATE GRAPH clauses
- DROP DEFAULT/NAMED/ALL/GRAPH clauses
- CLEAR DEFAULT/NAMED/ALL/Graph clauses
- FILTER EXISTS / NOT EXISTS operators
- FILTER IN / NOT IN operators

These are supported components in property path expressions:

- Sequence: elt1/elt2/elt3
- Zero or more occurrences: elt*
- One or more occurrences: elt+

##Installation

To use the library in a node.js application, there is available a [package](http://search.npmjs.org/#/rdfstore) that can be installed using the NPM package manager:

    $npm install rdfstore

The library can be used as a persistent RDF store using MongoDB as the backend. An instance of MongoDB must be running in order to use this version of the store.

It is also possible to use rdfstore-js in a web application being executed in a browser. There is [minimized version](https://raw.github.com/antoniogarrote/rdfstore-js/master/dist/browser/rdf_store_min.js) of the library in a single Javascript file that can be linked from a HTML document. There is also a [minimized and gunzipped version](https://raw.github.com/antoniogarrote/rdfstore-js/master/dist/browser/rdf_store_min.js) available. Both versions have been compiled using Google's Closure Javascript compiler.
The persistent versions can be found [here (min)](https://raw.github.com/antoniogarrote/rdfstore-js/master/dist/browser_persistent/rdf_store_min.js).


##Building

The library can be built for different environments using the included Ruby script and configuration file. The JSON 1.5 Ruby gem is required by the build script.

To build the library for node.js execute the following command from the root directory of the project:

    $./make.rb nodejs

To build the library for the browser configuration, execute the following command:

    $./make.rb browser

To build the library for the browser, including support for persistent
storage execute this command:

    $./make.rb browser_persistent

The output of each configuration will be created in the dist subdirectory at the root path of the project.


## Tests

To execute the whole test suite of the library, including the DAWG test cases for SPARQL 1.0 and the test cases for SPARQL 1.1 implemented at the moment, the build script can be used:

    $./make.rb tests

The tests depend on [nodeunit](http://search.npmjs.org/#/nodeunit). That node.js library must be installed in order to run the tests.

You can also run the tests on the minimized version of the library with the command:

    $./make.rb test_min

Additionally, there are some smoke tests for both browser versions that can be found ithe 'browsertests' directory.
These tests are now also available online at these adresses:

- [non persistent version](http://antoniogarrote.github.com/rdfstore-js/browsertests/non_persistent/index.html)
- [persistent version](http://antoniogarrote.github.com/rdfstore-js/browsertests/persistent/index.html)

## Stand-alone SPARQL end-point

The Node.js version of the store can be used as a stand-alone SPARQL end-point. In the library distribution there is an executable script that can be used in UNIX platforms to invoke the store as an application.

    $npm install rdfstore
    $./node_modules/rdfstore/bin/rdfstorejs webserver --store-name test --store-engine mongodb

The previous shell command starts the execution of an instance of the store that uses a persistent instance of MongoDB as the backend and can accept HTTP SPARQL protocol requests.

The *rdfstorejs* script can also be used to some administrative tasks. For example it can be used to load RDF data into a graph in the store:

    $./bin/rdfstorejs load http://dbpedia.org/resource/Tim_Berners-Lee http://test.com/graph1 --store-name test --store-engine mongodb

When dealing with a remote resource, the store will perform automatically content negotiation. When loading data from a local file or standard input, the media type must be passed to the store with the *--media-type* flag.

The previous command loads the graph for a DBPedia article in the store graph passed as second argument. This graph can be retrieved using a HTTP requests according to the SPARQL RDF Protocol:

    $./node_modules/rdfstore/bin/rdfstorejs webserver --store-name test --store-engine mongodb &
    $ curl -v -d "default-graph-uri=http://test.com/graph1" --data-urlencode "query=select * { ?s ?p ?o } limit 3" -H "Accept: application/rdf+xml" http://localhost:8080/sparql

    * About to connect() to localhost port 8080 (#0)
    *   Trying ::1... Connection refused
    *   Trying fe80::1... Connection refused
    *   Trying 127.0.0.1... connected
    * Connected to localhost (127.0.0.1) port 8080 (#0)
    > POST /sparql HTTP/1.1
    > User-Agent: curl/7.19.7 (universal-apple-darwin10.0) libcurl/7.19.7 OpenSSL/0.9.8l zlib/1.2.3
    > Host: localhost:8080
    > Accept: application/rdf+xml
    > Content-Length: 104
    > Content-Type: application/x-www-form-urlencoded
    > 
    < HTTP/1.1 200 OK
    < Content-Type: application/sparql-results+xml
    < Access-Control-Allow-Origin: *
    < Access-Control-Allow-Methods: POST, GET, OPTIONS
    < Access-Control-Allow-Headers: Content-Type, Depth, User-Agent, X-File-Size, X-Requested-With, If-Modified-Since, X-File-Name, Cache-Control
    < Connection: keep-alive
    < Transfer-Encoding: chunked
    < 
    * Connection #0 to host localhost left intact
    * Closing connection #0
    <?xml version="1.0" encoding="UTF-8"?><sparql xmlns="http://www.w3.org/2005/sparql-results#"><head><variable name="s"/>...</sparql>

The store supports these formats in the response of *CONSTRUCT* SPARQL queries: rdf/xml, turtle, json-ld. When responding to *SELECT* and *ASK* queries results can be retrieved in the normative rdf/xml serialization, but they can also be retrieved as JSON passing an application/ld+json media type in the HTTP Accept header.

Data can be removed from an instance of the store using a persistent backend with the *clear* command:

    $./bin/rdfstorejs clear --store-name test --store-engine mongodb

Several aspects of the server execution can be configured passing arguments to the *rdfstorejs* script. A list of these flags, as well as a list of the available commands can be obtained invoking the script without arguments:

    $./bin/rdfstorejs

    Usage: rdfstorejs Command [Args] [Options]

    Commands:
    * webserver: starts the HTTP frontend for the store
    * load URI|stdin [dstGraphURI]: load the graph pointed by the URI argument into the store. The graph will be loaded in the 'dstGraphURI' graph or the default graph if none specified
    * clear: removes all data from the store
     
    Options:
    -p: server port [8080]
    --webserver-port: server port [8080]
    -prot: protocol to use http | https [http]
    --webserver-protocol: protocol to use http | https [http]
    --webserver-path: Path where the SPARQL endpoint will be accessible [/sparql]
    --webserver-ssl-key: Path to the SSL private key file [./ssl/privatekye.pem]
    --webserver-ssl-cert: Path to the SSL certfiviate file [./ssl/certificate.pem]
    -cors: Should the server accept CORS requests [true]
    --webserver-cors-enabled: Should the server accept CORS requests [true]
    --store-tree-order: BTree index tree order used in the in memory backend [15]
    --store-engine: What backend should the store use: 'memory' and 'mongodb' are possible values [memory]
    --store-name: Name to be used to store the quad data in the persistent backend [rdfstore_js]
    --store-overwrite: If set to 'true' previous data in the persistent storage will be removed at startup [false]
    --store-mongo-domain: If store-engine is set to 'mongodb', location of the MongoDB server [localhost]
    --store-mongo-port: If store-engine is set to 'mongodb', port where the MongoDB server is running [27017]
    -mime: When loading a local RDF file or loading from input stream, media type of the data to load [application/rdf+xml]
    --media-type: When loading a local RDF file or loading from input stream, media type of the data to load [application/rdf+xml]

## Benchmarking

The following table shows the execution times obtained running the [LUBM benchmark](http://swat.cse.lehigh.edu/projects/lubm/) in different browsers. The data has been generated using the LUBM data generator for a single university. Text for some queries have been adapted, since the store does not support inference yet. The text of all the queries [can be found here](http://antoniogarrote.github.com/rdfstore-js/queries.txt).
All the queries have been executed on a desktop system runnin OSX 10.6 with the exception of the Internet Explorer tests that have been execute in a virtualized image of Windows7.

The amount of data loaded is 100545 triples, around 11MB of data. Times are measured in seconds.

<table>
<thead><tr><th>&nbsp;</th><th>Chrome 16</th><th>Safari 5</th><th>Firefox Aurora 11</th><th>Internet Explorer 9</th></tr></thead>
<tbody>
  <tr><td>query 0</td><td>0.552</td><td>1.176</td><td>0.834</td><td>0.771</td></tr> 
  <tr><td>query 1</td><td>0.005</td><td>0.033</td><td>0.043</td><td>0.016</td></tr> 
  <tr><td>query 2</td><td>0.018</td><td>0.149</td><td>0.046</td><td>0.111</td></tr> 
  <tr><td>query 3</td><td>0.005</td><td>0.022</td><td>0.026</td><td>0.023</td></tr> 
  <tr><td>query 4</td><td>0.155</td><td>0.502</td><td>0.311</td><td>0.603</td></tr> 
  <tr><td>query 5</td><td>0.043</td><td>0.091</td><td>0.109</td><td>0.131</td></tr> 
  <tr><td>query 6</td><td>0.023</td><td>0.039</td><td>0.045</td><td>0.057</td></tr> 
  <tr><td>query 7</td><td>0.324</td><td>0.573</td><td>0.73</td><td>1.678</td></tr> 
  <tr><td>query 8</td><td>0.828</td><td>1.581</td><td>1.789</td><td>2.548</td></tr> 
  <tr><td>query 10</td><td>0.008</td><td>0.022</td><td>0.024</td><td>0.027</td></tr> 
  <tr><td>query 11</td><td>0.001</td><td>0.003</td><td>0.006</td><td>0.003</td></tr> 
  <tr><td>query 12</td><td>0.003</td><td>0.007</td><td>0.011</td><td>0.006</td></tr> 
  <tr><td>query 13</td><td>0.042</td><td>0.103</td><td>0.098</td><td>0.119</td></tr> 
  <tr><td>query 14</td><td>0.009</td><td>0.028</td><td>0.024</td><td>0.035</td></tr> 
</tbody>
</table>

The following list shows the insertion time of the 100K triples into the store:

- Chrome 16: 9.559 secs
- Safari 5: 6.661 secs
- Firefox Aurora 11: 16.523 secs
- Internet Explorer 9: 17.042 secs.

## API

This is a small overview of the rdfstore-js API.

###Store creation

    //nodejs only
    var rdfstore = require('rdfstore');

    // in the browser the rdfstore object
    // is already defined

    // alt 1
    rdfstore.create(function(store) {
      // the new store is ready
    });

    // alt 2
    var store = rdfstore.create()

    // alt 3
    new rdfstore.Store(function(store) {
      // the new store is ready
    });

    // alt 4
    store = new rdfstore.Store();

###Persistent store creation (Browser)

In order to use persistent storage in the browser, an option named 'persitent' must be passed with value 'true' in the options for the store. An additional flag 'overwrite' indicates if the data for this store can be used to drop old data or read previously stored data. Optionally, a name for the store can also be passed as an argument. This name can be used to manipulate several persistent stores in the same browser.

At the moment, webworkers cannot be used with the persistent version of the store.

    new rdfstore.Store({persistent:true, name:'myappstore', overwrite:true}, function(store){
      // Passing overwrite:true to the options will make the store to drop all previous data.
      // Several stores can be used, providing different names for the stores
    }

###Persistent store creation (Node.js)

The Node.js version of the library uses [MongoDB](http://www.mongodb.org/) as the persistent backend and [Node.js MongoDB driver](https://github.com/christkv/node-mongodb-native) to establish a connection between the store engine and the backend. The options 'persistent' and 'engine' with value 'mongodb' must be passed as parameters. The 'overwrite' parameter can also be used to clean the data stored in the persistent storage. Configuration of the MongoDB instance to be used can be passed using the parameters 'mongoDomain' and 'mongoPort'. Finally the parameter 'mongoOptions' can be used to pass configuration options to the Node.js MongoDB driver (check the driver documentation for more information).

    new rdfstore.Store({persistent:true, 
                        engine:'mongodb', 
                        name:'myappstore', // quads in MongoDB will be stored in a DB named myappstore
                        overwrite:true,    // delete all the data already present in the MongoDB server
                        mongoDomain:'dbserver', // location of the MongoDB instance, localhost by default
                        mongoPort:27017 // port where the MongoDB server is running, 27017 by default
                       }, function(store){
          ...
    }

###Query execution

    // simple query execution
    store.execute("SELECT * { ?s ?p ?o }", function(success, results){
      if(success) {
        // process results        
        if(results[0].s.token === 'uri') {
          console.log(results[0].s.value);
        }       
      }
    });

    // execution with an explicit default and named graph

    var defaultGraph = [{'token':'uri', 'vaue': graph1}, {'token':'uri', 'value': graph2}, ...];
    var namedGraphs  = [{'token':'uri', 'vaue': graph3}, {'token':'uri', 'value': graph4}, ...];

    store.executionWithEnvironment("SELECT * { ?s ?p ?o }",defaultGraph,
      namedGraphs, function(success, results) {
      if(success) {
        // process results
      }
    });
    
###Construct queries RDF Interfaces API

    var query = "CONSTRUCT { <http://example.org/people/Alice> ?p ?o } \
                 WHERE { <http://example.org/people/Alice> ?p ?o  }";

    store.execute(query, function(success, graph){
      if(graph.some(store.rdf.filters.p(store.rdf.resolve('foaf:name)))) {
        nameTriples = graph.match(null, 
                                  store.rdf.createNamedNode(rdf.resolve('foaf:name')),
                                  null);

        nameTriples.forEach(function(triple) {
          console.log(triple.object.valueOf());
        });                                  
      }
    });


###Loading remote graphs

rdfstore-js will try to retrieve remote RDF resources across the network when a 'LOAD' SPARQL query is executed.
The node.js build of the library will use regular TCP sockets and perform proper content negotiation. It will also follow a limited number of redirections.
The browser build, will try to perform an AJAX request to retrieve the resource using the correct HTTP headers. Nevertheless, this implementation is subjected to the limitations of the Same Domain Policy implemented in current browsers that prevents cross domain requests. Redirections, even for the same domain, may also fail due to the browser removing the 'Accept' HTTP header of the original request.
rdfstore-js relies in on the jQuery Javascript library to peform cross-browser AJAX requests. This library must be linked in order to exeucte 'LOAD' requests in the browser.  

    store.execute('LOAD <http://dbpedialite.org/titles/Lisp_%28programming_language%29>\
                   INTO GRAPH <lisp>', function(success){
      if(success) {
        var query = 'PREFIX foaf:<http://xmlns.com/foaf/0.1/> SELECT ?o \
                     FROM NAMED <lisp> { GRAPH <lisp> { ?s foaf:page ?o} }';
        store.execute(query, function(success, results) {
          // process results
        });
      }
    })

###High level interface

The following interface is a convenience API to work with Javascript code instead of using SPARQL query strings. It is built on top of the RDF Interfaces W3C API.

    /* retrieving a whole graph as JS Interafce API graph object */

    store.graph(graphUri, function(graph){
      // process graph
    });


    /* Exporting a graph to N3 (this function is not part of W3C's API)*/
    store.graph(graphUri, function(graph){
      var serialized = graph.toNT();
    });

     
    /* retrieving a single node in the graph as a JS Interface API graph object */

    store.node(subjectUri, function(graph) {
      //process node
    });
     
    store.node(subjectUri, graphUri, function(graph) {
      //process node
    });


     
    /* inserting a JS Interface API graph object into the store */

    // inserted in the default graph
    store.insert(graph, function(success) {}) ;

    // inserted in graphUri
    store.insert(graph, graphUri, function(success) {}) ;



    /* deleting a JS Interface API graph object into the store */

    // deleted from the default graph
    store.delete(graph, function(success){});

    // deleted from graphUri
    store.delete(graph, graphUri, function(success){});



    /* clearing a graph */
    
    // clears the default graph
    store.clear(function(success){});

    // clears a named graph
    store.clear(graphUri, function(success){});



    /* Parsing and loading a graph */

    // loading local data
    store.load("text/turtle", turtleString, function(success, results) {});

    // loading remote data
    store.load('remote', remoteGraphUri, function(success, results) {});



    /* Registering a parser for a new media type */

    // The parser object must implement a 'parse' function
    // accepting the data to parse and a callback function.

    store.registerParser("application/rdf+xml", rdXmlParser);

###RDF Interface API

The store object includes a 'rdf' object implementing a RDF environment as described in the [RDF Interfaces 1.0](http://www.w3.org/TR/rdf-interfaces/) W3C's working draft.
This object can be used to access to the full RDF Interfaces 1.0 API.

    var graph = store.rdf.createGraph();
    graph.addAction(rdf.createAction(store.rdf.filters.p(store.rdf.resolve("foaf:name")),
                                     function(triple){ var name = triple.object.valueOf();
                                                       var name = name.slice(0,1).toUpperCase() 
                                                       + name.slice(1, name.length);
                                                       triple.object = store.rdf.createNamedNode(name);
                                                       return triple;}));

    store.rdf.setPrefix("ex", "http://example.org/people/");
    graph.add(store.rdf.createTriple( store.rdf.createNamedNode(store.rdf.resolve("ex:Alice")),
                                      store.rdf.createNamedNode(store.rdf.resolve("foaf:name")),
                                      store.rdf.createLiteral("alice") ));

    var triples = graph.match(null, store.rdf.createNamedNode(store.rdf.resolve("foaf:name")), null).toArray();

    console.log("worked? "+(triples[0].object.valueOf() === 'Alice'));

###Default Prefixes

Default RDF name-spaces can be specified using the *registerDefaultNamespace*. These names will be included automatically in all queries. If the same name-space is specified by the client in the query string the new prefix will shadow the default one.
A collection of common name-spaces like rdf, rdfs, foaf, etc. can be automatically registered using the *registerDefaultProfileNamespace* function.

    new Store.Store({name:'test', overwrite:true}, function(store){
        store.execute('INSERT DATA {  <http://example/person1> <http://xmlns.com/foaf/0.1/name> "Celia" }', function(result, msg){

           store.registerDefaultProfileNamespaces();

           store.execute('SELECT * { ?s foaf:name ?name }', function(success,results) {
               test.ok(success === true);
               test.ok(results.length === 1);
               test.ok(results[0].name.value === "Celia");
           });
        });
    });


###JSON-LD Support

rdfstore-js implements parsers for Turtle and JSON-LD. The specification of JSON-LD is still an ongoing effort. You may expect to find some inconsistencies between this implementation and the actual specification.

            jsonld = {
              "@context": 
              {  
                 "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
                 "xsd": "http://www.w3.org/2001/XMLSchema#",
                 "name": "http://xmlns.com/foaf/0.1/name",
                 "age": {"@id": "http://xmlns.com/foaf/0.1/age", "@type": "xsd:integer" },
                 "homepage": {"@id": "http://xmlns.com/foaf/0.1/homepage", "@type": "xsd:anyURI" },
                 "ex": "http://example.org/people/"
              },
              "@id": "ex:john_smith",
              "name": "John Smith",
              "age": "41",
              "homepage": "http://example.org/home/"
            };    

    store.setPrefix("ex", "http://example.org/people/");

    store.load("application/ld+json", jsonld, "ex:test", function(success, results) {
      store.node("ex:john_smith", "ex:test", function(success, graph) {
        // process graph here
      });
    });

###Events API

rdfstore-js implements an experimental events API that allows clients to observe changes in the RDF graph and receive notifications when parts of this graph changes.
The two main event functions are *subscribe* that makes possible to set up a callback function that will be invoked each time triples matching a certain pattern passed as an argument are added or removed, and the function *startObservingNode* that will be invoked with the modified version of the node each time triples are added or removed from the node.

    var cb = function(event, triples){ 
      // it will receive a notifications where a triple matching
      // the pattern s:http://example/boogk, p:*, o:*, g:*
      // is inserted or removed.
      if(event === 'added') {
        console.log(triples.length+" triples have been added");  
      } else if(event === 'deleted') {
        console.log(triples.length+" triples have been deleted");  
      } 
    }
     
    store.subscribe("http://example/book",null,null,null,cb);
     
     
    // .. do something;
     
    // stop receiving notifications
    store.unsubscribe(cb);

The main difference between both methods is that *subscribe* receives the triples that have changed meanwhile *startObservingNode* receives alway the whole node with its updated triples. *startObservingNode* receives the node as a RDF Interface graph object.

    var cb = function(node){ 
      // it will receive the updated version of the node each
      // time it is modified.
      // If the node does not exist, the graph received will
      // not contain triples.
      console.log("The node has now "+node.toArray().length+" nodes");
    }
     
    // if only tow arguments are passed, the default graph will be used.
    // A graph uri can be passed as an optional second argument.
    store.startObservingNode("http://example/book",cb);
     
     
    // .. do something;
     
    // stop receiving notifications
    store.stopObservingNode(cb);

In the same way, there are *startObservingQuery* and *stopObservingQuery* functions that makes possible to set up callbacks for whole SPARQL queries. 
The store will try to be smart and not perform unnecessary evaluations of these query after quad insertion/deletions. Nevertheless too broad queries must be used carefully with the events API.

###Custom Filter Functions

Custom filter function can be registered into the store using the *registerCustomFunction* function. This function receives two argument, the name of the custom function and the associated implementation. This functions will be available in a SPARQL query using the prefix *custom*.
The function implementation will receive two arguments, an object linking to the store query filters engine and a list with the actual arguments. Arguments will consist of literal or URIs objects. Results from the function must also be literal or URI objects.

The query filters engine can be used to access auxiliary function to transform literals into JavaScript types using the *effectiveTypeValue* function, boolean values using the *effectiveBooleanValue*, to build boolean litearl objects (*ebvTrue*, *ebvFalse*) or return an error with the *ebvError*. Documentation and source code for the *QueryFilters* object n the 'js-query-engine' module can be consulted to find information about additional helper functions.

The following test shows a simple examples of how custom functions can be invoked:

    new Store.Store({name:'test', overwrite:true}, function(store) {
	store.load(
            'text/n3',
            '@prefix test: <http://test.com/> .\
             test:A test:prop 5.\
	     test:B test:prop 4.\
	     test:C test:prop 1.\
	     test:D test:prop 3.',
            function(success) {

		var invoked = false;
		store.registerCustomFunction('my_addition_check', function(engine,args) {
		    // equivalent to var v1 = parseInt(args[0].value), v2 = parseInt(args[1]);

		    var v1 = engine.effectiveTypeValue(args[0]);
		    var v2 = engine.effectiveTypeValue(args[1]);

		    // equivalent to return {token: 'literal', type:"http://www.w3.org/2001/XMLSchema#boolean", value:(v1+v2<5)};

		    return engine.ebvBoolean(v1+v2<5);
		});

                store.execute(
                    'PREFIX test: <http://test.com/> \
                     SELECT * { ?x test:prop ?v1 .\
                                ?y test:prop ?v2 .\
                                filter(custom:my_addition_check(?v1,?v2)) }',
                    function(success, results) {
			test.ok(results.length === 3);
			for(var i=0; i<results.length; i++) {
			    test.ok(parseInt(results[i].v1.value) + parseInt(results[i].v2.value) < 5 );
			}
			test.done()
                    }
                );
            });
    });


###WebWorkers

RDFStore includes experimental support for [webworkers](http://www.w3.org/TR/workers/) since version 0.4.0 in both browser and node.js versions.
The store can be initialized in a new thread using the *connect* method of the *Store* object.

The library will try to create a worker and will return a *connection* object providing the same interface of the *store* object.
If the creation of the worker fails, because webworkers support is not enabled in the platform/browser, a regular *store* object will be returned instead. Since both objects implement the same interface, client code can be wrote without taking into consideration the actual implementation of the store interface.

    Store.connect("/js/rdfstore_min.js", {}, function(success,store) {
        if(success) {
          // store is a connection to the worker
          console.log(store.isWebWorkerConnection === true);
        } else {
          // connection was not possible. A store object has been returned instead
        }       
        store.execute('INSERT DATA {  <http://example/book3> <http://example.com/vocab#title> <http://test.com/example> }', function(result, msg){
            store.execute('SELECT * { ?s ?p ?o }', function(success,results) {
              console.log(results.length === 1);
            });
        });
    });

The *connect* function can receive three arguments, the URL/Path where the script of the store is located, so the webworkers layer can load it, a hash with the aguments for the *Store.create* function that will be used in the actual creation of the store object and a callback that will be invoked with a success notification and the store implementation. In the Node.js version, it is not required to provide the path to the store script, the location of the store module will be provided by default.

At the moment, the usability of this feature is limited to those browsers where the web workers framework is enabled. It has been tested with the current version of Chrome and Firefox Aurora 8.0a2. 
Support in the Node.js version is provided by the webworkers module. Webworkers are simulated in the Node.js version as forked child processes being executed in the background. A version of node >= 0.6.1 is required.

Web worker threads execute in the browser in a very restrictive environment due to security reasons. WebWorkers for example, cannot access the local storage API. As a consequence, workers cannot be used with the persistent version of the store. These restrictions are not present in the Node.js version.

##Standalone RDF-JS Interface API

Now it is also possible to use the [RDF JS Interface API](http://www.w3.org/TR/2011/WD-rdf-interfaces-20110510/) without as a standolone module.

The code is distributed for Node.js as the 'rdf_js_interface' module.
It can be installed directly from NPM:

    $npm install rdf_js_interface

After installing the module it can be required in the code of a Node.js application:

    var RDFJSInterface = require('rdf_js_interface');

    var graph = new RDFJSInterface.Graph();

    graph.add(rdf.createTriple( rdf.createBlankNode(),
                                rdf.createNamedNode("rdf:type"),
                                rdf.createNamedNode("http://test.com/MyClass") ));
    ...

The module has also been compiled for the browser. The original and minimised versions can be found here:

- https://raw.github.com/antoniogarrote/rdfstore-js/master/dist/rdf_interface_api/browser/rdf_interface_api.js
- https://raw.github.com/antoniogarrote/rdfstore-js/master/dist/rdf_interface_api/browser/rdf_interface_api_min.js

The module declares a new property 'RDFJSInterface' in the 'window' object pointing to the API object:

    var graph = new RDFJSInterface.Graph();

    graph.add(rdf.createTriple( rdf.createBlankNode(),
                                rdf.createNamedNode("rdf:type"),
                                rdf.createNamedNode("http://test.com/MyClass") ));
    ...

##Related libraries and examples

There are some other libraries we have developed and that can be used with rdfstore-js to make it easier to build JS applicatons using RDF and linked data:

 - [SemanticKO](https://github.com/antoniogarrote/semantic-ko) and extension for [Knockoutjs](http://knockoutjs.com/) that make possible to establish bidirectional bindings between the DOM tree and the RDF graph. It also includes some other utilities for building single page JS applications on top of the RDF graph stored by rdfstore-js.
 - [JSON-LD Macros](https://github.com/antoniogarrote/json-ld-macros) a library for describing transformations of JSON APIs into JSON-LD so it can be imported into rdfstore-js.

We have also built some demo applications used to test the store:

 - [Geek Talk](http://antoniogarrote.com/geektalk/) a web client aggregating information for a Github's project from different data APIs like Twitter, HackerNews or StackOverflow ([github](https://github.com/antoniogarrote/geektalk).)
 - [social.rdf](http://antoniogarrote.com/social/stream) a personal linked data server collecting one user's information from different social web sites ([github](https://github.com/antoniogarrote/social.rdf)).
 - [social.rdf vis](http://antoniogarrote.com/vis/) an example of how to use rdfstore-js with a data visualization library like [d3.js](http://mbostock.github.com/d3/).
 - [SemanticKO examples](http://antoniogarrote.github.com/semantic-ko/index.html) a collection of interactive examples of SemanticKO
 - [JSON-LD Macros example](http://antoniogarrote.github.com/json-ld-macros/) a small interactive example of how to use JSON-LD Macros to build data transformations.
 - [Node.js WebID demo](https://github.com/antoniogarrote/NodeJS-WebID-demo).
##Reusable modules. 

rdfstore-js is built from a collection of general purpose modules. Some of these modules can be easily extracted from the library and used on their own.

This is a listing of the main modules that can be re-used:

- src/js-trees: in-memory and persistent tree data structures: binary trees, red-black trees, b-trees, etc.
- src/js-sparql-parser: a SPARQL and a Turtle parsers built using the [PEG.js](http://pegjs.majda.cz/) parsing expression grammars library.
- src/js-trees/src/utils: a continuation passing style inspired library for different code flow constructions
- src/js-communication/src/json_ld_parser: JSON-LD parser implementation.
- src/js-query-enginesrc/rdf_js_interface: Javascript Interface 1.0 API implementation.

##Contributing

rdfstore-js is still at the beginning of its development. If you take a look at the library and find a way to improve it, please ping us. We'll be very greatful for any bug report or pull-request.

## Author

Antonio Garrote, email:antoniogarrote@gmail.com, twitter:@antoniogarrote.

This code includes a modified version of the JSON-LD parser built by Digital Bazaar (see LICENSE file at https://github.com/digitalbazaar/jsonld.js/blob/master/LICENSE).

It also includes the Turtle parser of the [N3.js library](https://github.com/RubenVerborgh/N3.js/), developed by Ruben Verborgh and released under the MIT license.

## Contributors

Christian Langanke

## License

Licensed under the [GNU Lesser General Public License Version 3 (LGPLV3)](http://www.gnu.org/licenses/lgpl.html), copyright Antonio Garrote 2011-2012.