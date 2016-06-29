#rdfstore-js [![Build Status](https://travis-ci.org/antoniogarrote/rdfstore-js.svg?branch=master)](https://travis-ci.org/antoniogarrote/rdfstore-js) [![Join the chat at https://gitter.im/antoniogarrote/rdfstore-js](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/antoniogarrote/rdfstore-js?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

## Important Note

Many features present in versions 0.8.X have been removed in the 0.9.X. Some of them, will be added in the next versions, other like the MongoDB backend will be discarded.
Please read this README file carefully to find the current set of features.

## Table of Contents

- [Introduction](#introduction)
- [Documentation](#documentation)
- [SPARQL support](#sparql-support)
- [Installation](#installation)
- [Building](#building)
- [Tests](#tests)
- [API](#api)
	- [Store creation](#store-creation)
	- [Query execution](#query-execution)
	- [Construct queries RDF Interfaces API](#construct-queries-rdf-interfaces-api)
	- [Loading remote graphs](#loading-remote-graphs)
	- [High level interface](#high-level-interface)
	- [RDF Interface API](#rdf-interface-api)
	- [Default Prefixes](#default-prefixes)
	- [JSON-LD Support](#json-ld-support)
	- [Events API](#events-api)
	- [Custom Filter Functions](#custom-filter-functions)
	- [Persistence](#persistence)
- [Dependencies](#dependencies)
- [Frontend](#frontend)
- [Contributing](#contributing)
- [Author](#author)
- [License](#license)


## Introduction

rdfstore-js is a pure Javascript implementation of a RDF graph store with support for the SPARQL query and data manipulation language.
```javascript
var rdfstore = require('rdfstore');

rdfstore.create(function(err, store) {
  store.execute('LOAD <http://dbpedia.org/resource/Tim_Berners-Lee> INTO GRAPH <http://example.org/people>', function() {

	store.setPrefix('dbp', 'http://dbpedia.org/resource/');

	store.node(store.rdf.resolve('dbp:Tim_Berners-Lee'),  "http://example.org/people", function(err, graph) {

	  var peopleGraph = graph.filter(store.rdf.filters.type(store.rdf.resolve("foaf:Person")));

	  store.execute('PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
					 PREFIX foaf: <http://xmlns.com/foaf/0.1/>\
					 PREFIX : <http://example.org/>\
					 SELECT ?s FROM NAMED :people { GRAPH ?g { ?s rdf:type foaf:Person } }',
					 function(err, results) {

					   console.log(peopleGraph.toArray()[0].subject.valueOf() === results[0].s.value);

					 });
	});

  });
});
```

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
- Custom filter functions
- Browser persistence using IndexedDB

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
- BIND
- FILTER IN / NOT IN operators


##Installation

The library can be installed using NPM:

```bash
$ npm install rdfstore
```

The library can also be installed via bower using a global module:

```bash
$ bower install rdfstore
```

##Building

Before running the build script, you must install JavaScript dependencies with [npm](https://npmjs.org/doc/install.html) (`npm` is shipped with [node](http://nodejs.org/download/)):

```bash
$ npm install
```

The library can be built using gulp:

```bash
$ gulp
```

The browser version can be built using the 'browser' gulp target:

```bash
$ gulp browser
```

## Tests

To execute the whole test suite of the library, including the DAWG
test cases for SPARQL 1.0 and the test cases for SPARQL 1.1
implemented at the moment, a gulp target can be executed:

```bash
$ gulp specs
```

Additionally, there are some smoke tests for both browser versions that can be found ithe 'spec/browser'' directory.

## API

This is a small overview of the rdfstore-js API.

###Store creation

```javascript
//nodejs only
var rdfstore = require('rdfstore');

// in the browser the rdfstore object
// is already defined

// alt 1
rdfstore.create(function(err, store) {
  // the new store is ready
});


// alt 2
new rdfstore.Store(function(err, store) {
  // the new store is ready
});
```

###Query execution

```javascript
// simple query execution
store.execute("SELECT * { ?s ?p ?o }", function(err, results){
  if(!err) {
	// process results
	if(results[0].s.token === 'uri') {
	  console.log(results[0].s.value);
	}
  }
});

// execution with an explicit default and named graph

var defaultGraph = [{'token':'uri', 'value': graph1}, {'token':'uri', 'value': graph2}, ...];
var namedGraphs  = [{'token':'uri', 'value': graph3}, {'token':'uri', 'value': graph4}, ...];

store.executeWithEnvironment("SELECT * { ?s ?p ?o }",defaultGraph,
  namedGraphs, function(err, results) {
  if(err) {
	// process results
  }
});
```

###Construct queries RDF Interfaces API

```javascript
var query = "CONSTRUCT { <http://example.org/people/Alice> ?p ?o } \
			 WHERE { <http://example.org/people/Alice> ?p ?o  }";

store.execute(query, function(err, graph){
  if(graph.some(store.rdf.filters.p(store.rdf.resolve('foaf:name')))) {
	nameTriples = graph.match(null,
							  store.rdf.createNamedNode(rdf.resolve('foaf:name')),
							  null);

	nameTriples.forEach(function(triple) {
	  console.log(triple.object.valueOf());
	});
  }
});
```

###Loading remote graphs

rdfstore-js will try to retrieve remote RDF resources across the network when a 'LOAD' SPARQL query is executed.
The node.js build of the library will use regular TCP sockets and perform proper content negotiation. It will also follow a limited number of redirections.
The browser build, will try to perform an AJAX request to retrieve the resource using the correct HTTP headers. Nevertheless, this implementation is subjected to the limitations of the Same Domain Policy implemented in current browsers that prevents cross domain requests. Redirections, even for the same domain, may also fail due to the browser removing the 'Accept' HTTP header of the original request.
rdfstore-js relies in on the jQuery Javascript library to peform cross-browser AJAX requests. This library must be linked in order to exeucte 'LOAD' requests in the browser.

```javascript
store.execute('LOAD <http://dbpedialite.org/titles/Lisp_%28programming_language%29>\
			   INTO GRAPH <lisp>', function(err){
  if(err) {
	var query = 'PREFIX foaf:<http://xmlns.com/foaf/0.1/> SELECT ?o \
				 FROM NAMED <lisp> { GRAPH <lisp> { ?s foaf:page ?o} }';
	store.execute(query, function(err, results) {
	  // process results
	});
  }
})
```

###High level interface

The following interface is a convenience API to work with Javascript code instead of using SPARQL query strings. It is built on top of the RDF Interfaces W3C API.

```javascript
/* retrieving a whole graph as JS Interafce API graph object */

store.graph(graphUri, function(err, graph){
  // process graph
});


/* Exporting a graph to N3 (this function is not part of W3C's API)*/
store.graph(graphUri, function(err, graph){
  var serialized = graph.toNT();
});


/* retrieving a single node in the graph as a JS Interface API graph object */

store.node(subjectUri, function(err, node) {
  //process node
});

store.node(subjectUri, graphUri, function(err, node) {
  //process node
});



/* inserting a JS Interface API graph object into the store */

// inserted in the default graph
store.insert(graph, function(err) {}) ;

// inserted in graphUri
store.insert(graph, graphUri, function(err) {}) ;



/* deleting a JS Interface API graph object into the store */

// deleted from the default graph
store.delete(graph, function(err){});

// deleted from graphUri
store.delete(graph, graphUri, function(err){});



/* clearing a graph */

// clears the default graph
store.clear(function(err){});

// clears a named graph
store.clear(graphUri, function(err){});



/* Parsing and loading a graph */

// loading local data
store.load("text/turtle", turtleString, function(err, results) {});

// loading remote data
store.load('remote', remoteGraphUri, function(err, results) {});



/* Registering a parser for a new media type */

// The parser object must implement a 'parse' function
// accepting the data to parse and a callback function.

store.registerParser("application/rdf+xml", rdXmlParser);
```

###RDF Interface API

The store object includes a 'rdf' object implementing a RDF environment as described in the [RDF Interfaces 1.0](http://www.w3.org/TR/rdf-interfaces/) W3C's working draft.
This object can be used to access to the full RDF Interfaces 1.0 API.

```javascript
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
```

###Default Prefixes

Default RDF name-spaces can be specified using the *registerDefaultNamespace*. These names will be included automatically in all queries. If the same name-space is specified by the client in the query string the new prefix will shadow the default one.
A collection of common name-spaces like rdf, rdfs, foaf, etc. can be automatically registered using the *registerDefaultProfileNamespace* function.

```javascript
new Store({name:'test', overwrite:true}, function(err,store){
	store.execute('INSERT DATA {  <http://example/person1> <http://xmlns.com/foaf/0.1/name> "Celia" }', function(err){

	   store.registerDefaultProfileNamespaces();

	   store.execute('SELECT * { ?s foaf:name ?name }', function(err,results) {
		   test.ok(results.length === 1);
		   test.ok(results[0].name.value === "Celia");
	   });
	});
});
```

###JSON-LD Support

rdfstore-js implements parsers for Turtle and JSON-LD. The specification of JSON-LD is still an ongoing effort. You may expect to find some inconsistencies between this implementation and the actual specification.

```javascript
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

store.load("application/ld+json", jsonld, "ex:test", function(err,results) {
  store.node("ex:john_smith", "ex:test", function(err, graph) {
	// process graph here
  });
});
```

###Events API

rdfstore-js implements an experimental events API that allows clients to observe changes in the RDF graph and receive notifications when parts of this graph changes.
The two main event functions are *subscribe* that makes possible to set up a callback function that will be invoked each time triples matching a certain pattern passed as an argument are added or removed, and the function *startObservingNode* that will be invoked with the modified version of the node each time triples are added or removed from the node.

```javascript
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
```

The main difference between both methods is that *subscribe* receives the triples that have changed meanwhile *startObservingNode* receives alway the whole node with its updated triples. *startObservingNode* receives the node as a RDF Interface graph object.

```javascript
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
```

In the same way, there are *startObservingQuery* and *stopObservingQuery* functions that makes possible to set up callbacks for whole SPARQL queries.
The store will try to be smart and not perform unnecessary evaluations of these query after quad insertion/deletions. Nevertheless too broad queries must be used carefully with the events API.

###Custom Filter Functions

Custom filter function can be registered into the store using the *registerCustomFunction* function. This function receives two argument, the name of the custom function and the associated implementation. This functions will be available in a SPARQL query using the prefix *custom*.
You can also use a full URI to identify the function that is going to be registered.
The function implementation will receive two arguments, an object linking to the store query filters engine and a list with the actual arguments. Arguments will consist of literal or URIs objects. Results from the function must also be literal or URI objects.

The query filters engine can be used to access auxiliary function to transform literals into JavaScript types using the *effectiveTypeValue* function, boolean values using the *effectiveBooleanValue*, to build boolean literal objects (*ebvTrue*, *ebvFalse*) or return an error with the *ebvError*. Documentation and source code for the *QueryFilters* object n the 'js-query-engine' module can be consulted to find information about additional helper functions.

The following test shows a simple examples of how custom functions can be invoked:

```javascript
new Store({name:'test', overwrite:true}, function(err,store) {
	store.load(
		'text/n3',
		'@prefix test: <http://test.com/> .\
		 test:A test:prop 5.\
		 test:B test:prop 4.\
		 test:C test:prop 1.\
		 test:D test:prop 3.',
		function(err) {

			var invoked = false;
            // instead of 'my_addition_check' a full URI can be used 'http://test.com/my_fns/my_addition_check'
			store.registerCustomFunction('my_addition_check', function(engine,args) {
		// equivalent to var v1 = parseInt(args[0].value), v2 = parseInt(args[1].value);

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
				function(err) {
				   test.ok(results.length === 3);
		   for(var i=0; i<results.length; i++) {
			test.ok(parseInt(results[i].v1.value) + parseInt(results[i].v2.value) < 5 );
		}
		test.done()
		}
	);
  });
});
```

###Persistence

The store can be persisted in the browser using IndexedDB as the backend. In order to make the store persistent,
the 'persistent' flag must be set to true in the store creation options.
Additionally, a 'name' option can also be passed for the store. Different persistent instances of the store can be
opened using different names.

###Controlling the frequency of function yielding

Performance of the store can be improved by reducing the frequency the 'nexTick' mechanism is used to cancel the the calls stack.
You can reduce this frequency by invoking the `yieldFrequency` function on the Store object and passing a bigger number:

``` javascript
var rdfstore = require('rdfstore')
rdfstore.Store.yieldFrequency(200); // will only yield after 200 invocations of nextTick

```
If the number is too big a number can produce stack overflow errors during execution. If you find this problem, reduce the value provided for `yieldFrequency`.

##Dependencies

The library include dependencies to two semantic-web libraries for
parsing:

- [N3.js library](https://github.com/RubenVerborgh/N3.js/), developed
  by Ruben Verborgh and released under the MIT license.

- [jsonld](https://github.com/digitalbazaar/jsonld.js), developed by Digital Bazaar and released under the New BSD license.

##Frontend

A stand-along frontend for the store built using electron has been added in version 0.9.7.
You can build the frontend running the command:

```bash
$ gulp frontend
```

The file will be added under the releases directory.

##Contributing

rdfstore-js is still at the beginning of its development. If you take a look at the library and find a way to improve it, please ping us. We'll be very greatful for any bug report or pull-request.

## Author

Antonio Garrote, email:antoniogarrote@gmail.com, twitter:@antoniogarrote.


## License

Licensed under the [MIT License](http://opensource.org/licenses/MIT), copyright Antonio Garrote 2011-2015
