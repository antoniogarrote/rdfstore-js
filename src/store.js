// imports
var QueryEngine = require("./query_engine").QueryEngine;
var InMemoryQuadBackend = require("./quad_backend").QuadBackend;
var PersistentBackend = require("./persistent_quad_backend").PersistentQuadBackend;
var InMemoryLexicon = require("./lexicon").Lexicon;
var PersistentLexicon = require("./persistent_lexicon").PersistentLexicon;
var RDFModel = require("./rdf_model");
var _ = require("./utils");


/**
 * Creates a new store.<br/>
 * <br/>
 * It accepts two optional arguments, a map of configuration
 * options for the store and a callback function.<br/>
 *
 * @constructor
 * @param {Function} [callback] Callback that will be invoked when the store has been created
 * @param {Object} [params]
 * <ul>
 *  <li> persistent:  should the store use persistence? </li>
 *  <li> treeOrder: in versions of the store backed by the native indexing system, the order of the BTree indices</li>
 *  <li> name: when using persistence, the name for this store. In the MongoDB backed version, name of the DB used by the store. By default <code>'rdfstore_js'</code> is used</li>
 *  <li> overwrite: clears the persistent storage </li>
 *  <li> maxCacheSize: if using persistence, maximum size of the index cache </li>
 * </ul>
 */
Store = function(arg1, arg2) {
    var callback = null;
    var params   = null;

    if(arguments.length == 0) {
		params ={};
    } else if(arguments.length == 1) {
		params   = {};
		callback = arg1;
    } else if(arguments.length > 1) {
		params   = arg1;
		callback = arg2;
    } else {
	throw("An optional argument map and a callback must be provided");
    }

    if(params['treeOrder'] == null) {
		params['treeOrder'] = 15;
    }

    var Lexicon = InMemoryLexicon;
    var QuadBackend = InMemoryQuadBackend;
    if(params['persistent'] === true){
		Lexicon = PersistentLexicon;
		QuadBackend = PersistentBackend;
    }
    this.functionMap = {};

    var that = this;
    this.customFns = {};
    new Lexicon(function(lexicon){
	var createQuadBackend = function() {
	    new QuadBackend(params, function (backend) {
		var createEngine = function() {
		    params.backend = backend;
		    params.lexicon = lexicon;
		    that.engine = new QueryEngine(params);

		    callback(null, that);
		};
		if(params['overwrite']) {
		    backend.clear(createEngine)
		} else {
		    createEngine();
		}
	    });
	};
	if(params['overwrite'] === true) {
	    // delete lexicon values
	    lexicon.clear(createQuadBackend);
	} else {
	    createQuadBackend();
	}

    },params['name']);
};


/**
 * An instance of RDF JS Interface <code>RDFEnvironment</code>
 * associated to this graph instance.
 */
Store.prototype.rdf = RDFModel.rdf;
Store.prototype.rdf.api = RDFModel;

/**
 * Registers a new function with an associated name that can
 * be invoked as 'custom:fn_name(arg1,arg2,...,argn)' inside
 * a SPARQL query.
 * <br/>
 * The registered function will receive two arguments, an
 * instance of the store's query filters engine and a list
 * with the arguments received by the function in the SPARQL query.
 * <br/>
 * The function must return a single token value that can
 * consist in a literal value or an URI.
 * <br/>
 * The following is an example literal value:
 * {token: 'literal', type:"http://www.w3.org/2001/XMLSchema#integer", value:'3'}
 * This is an example URI value:
 * {token: 'uri', value:'http://test.com/my_uri'}
 * <br/>
 * The query filters engine can be used to perform common operations
 * on the input values.
 * An error can be returne dusing the 'ebvError' function of the engine.
 * True and false values can be built directly using the 'ebvTrue' and
 * 'ebvFalse' functions.
 *
 * A complete reference of the available functions can be found in the
 * documentation or source code of the QueryFilters module.
 *
 * @arguments:
 * @param {String} [name]: name of the custom function, it will be accesible as custom:name in the query
 * @param {Function} [function]: lambda function with the code for the query custom function.
 */
Store.prototype.registerCustomFunction = function(name, fn) {
    this.customFns[name] = fn;
    this.engine.setCustomFunctions(this.customFns);
};

/**
 * Executes a query in the store.<br/>
 * <br/>
 * There are two possible ways of invoking this function,
 * providing a pair of arrays of namespaces that will be
 * used to compute the union of the default and named
 * dataset, or without them.
 * <br/>
 * <br/>
 * Both invocations receive as an optional last parameter
 * a callback function that will receive the return status
 * of the query and the results.
 * <br/>
 * <br/>
 * Results can have different formats:
 * <ul>
 *  <li> SELECT queries: array of binding maps </li>
 *  <li> CONSTRUCT queries: RDF JS Interface Graph object </li>
 *  <li> ASK queries: JS boolean value </li>
 *  <li> LOAD/INSERT... queries: Number of triples modified/inserted </li>
 * </ul>
 *
 * @arguments:
 * @param {String} query
 * @param {String} [defaultURIs] default namespaces
 * @param {String} [namespacesURIs] named namespaces
 * @param {Function} [callback]
 */
Store.prototype.execute = function() {
    if(arguments.length === 3) {
	this.executeWithEnvironment(arguments[0],
	    arguments[1],
	    arguments[2]);
    } else if(arguments.length === 4) {
	this.executeWithEnvironment(arguments[0],
	    arguments[1],
	    arguments[2],
	    arguments[3]);
    } else {

	var queryString;
	var callback;

	if(arguments.length === 1) {
	    queryString = arguments[0];
	    var callback = function(){};
	} else if(arguments.length === 2) {
	    queryString = arguments[0];
	    callback = arguments [1];
	}
	this.engine.execute(queryString, callback);
    }
};

/**
 * A variation of the execute function that expects
 * arguments containing values for the default and named
 * graphs that will be used in the query.
 *
 *
 * @arguments:
 * @param {String} query
 * @param {String} URIs default namespaces
 * @param {String} URIs named namespaces
 * @param {Function} [callback]
 */
Store.prototype.executeWithEnvironment = function() {
    var queryString, defaultGraphs, namedGraphs;

    if(arguments.length === 3) {
	queryString   = arguments[0];
	// JSDoc fails if this is pushed outside
	var callback  = function(){};
	defaultGraphs = arguments[1];
	namedGraphs   = arguments[2];
    } else if(arguments.length === 4) {
	queryString   = arguments[0];
	var callback      = arguments [3];
	defaultGraphs = arguments[1];
	namedGraphs   = arguments[2];
    }

    defaultGraphs = _.map(defaultGraphs, function(graph){
	return {'token':'uri','value':graph};
    });
    namedGraphs = _.map(namedGraphs, function(graph){
	return {'token':'uri','value':graph};
    });

    this.engine.execute(queryString, callback, defaultGraphs, namedGraphs);
};

/**
 * Retrieves all the quads belonging to a certain graph
 * in the store as a RDF JS Interface Graph object.<br/>
 * <br/>
 * The function accepts as mandatory parameter a callback
 * function that will receive the a success notification and the returned graph.<br/>
 * <br/>
 * Optionally, the URI of the graph can also be passed as
 * the first argument. If no graph is specified, the
 * default graph will be returned.<br/>
 *
 * @arguments
 * @param {String} [graphURI] If this parameter is missing, the default graph will be returned
 * @param {Functon} callback
 */
Store.prototype.graph = function() {
    var graphUri = null;
    var callback = null;
    if(arguments.length === 1) {
	callback = arguments[0] || function(){};
	graphUri = this.engine.lexicon.defaultGraphUri;
    } else if(arguments.length === 2) {
	callback = arguments[1] || function(){};
	graphUri = arguments[0];
    } else {
	throw("An optional graph URI and a callback function must be provided");
    }

    if(this.rdf.resolve(graphUri) != null) {
	graphUri = this.rdf.resolve(graphUri);
    }

    this.engine.execute("CONSTRUCT { ?s ?p ?o } WHERE { GRAPH <" + graphUri + "> { ?s ?p ?o } }", callback);
};

/**
 * Retrieves all the quads belonging to a certain node
 * in the store as a RDF JS Interface Graph object containing
 * the collection of triples whose subject is the provided
 * node URI.<br/>
 * <br/>
 * The function accepts as mandatory parameters the node URI and
 * a callback unction that will receive a success notification and the returned node.<br/>
 * <br/>
 * Optionally, the URI of the graph where the node is contained
 * can also be passed as the first argument. <br/>
 * <br/>
 * If no graph is specified, the node will be looked into the
 * default graph.<br/>
 *
 * @arguments
 * @param {String} nodeURI URI of the node to look for
 * @param {String} [graphURI] If this parameter is missing, the node will be looked into the default graph
 * @param {Functon} callback
 */
Store.prototype.node = function() {
    var graphUri = null;
    var callback = null;
    var nodeUri  = null;
    if(arguments.length === 2) {
	nodeUri = arguments[0];
	callback = arguments[1] || function(){};
	graphUri = this.engine.lexicon.defaultGraphUri;
    } else if(arguments.length === 3) {
	nodeUri = arguments[0];
	graphUri = arguments[1];
	callback = arguments[2] || function(){};
    } else {
	throw("An optional graph URI, node URI and a callback function must be provided");
    }

    if(this.rdf.resolve(graphUri) != null) {
	graphUri = this.rdf.resolve(graphUri);
    }

    if(this.rdf.resolve(nodeUri) != null) {
	nodeUri = this.rdf.resolve(nodeUri);
    }

    this.engine.execute("CONSTRUCT { <" + nodeUri + "> ?p ?o } WHERE { GRAPH <" + graphUri + "> { <" + nodeUri + "> ?p ?o } }", callback);
};

/**
 * Associates an event listener function to a node URI. Every time the collection
 * of triples whose subject is the specified node URI changes, because an
 * insertion or deletion, the provided callback function will be invoked
 * receiving as a parameter a RDF JS Interface Graph object with the new
 * collection of triples.<br/>
 * <br/>
 * The function accepts two mandatory arguments, the URI of the node to observe
 * and the function that will receive the event notifications. An optional
 * third parameter, consisting of a callback function, can be passed and will be invoked
 * once the store had correctly configured the event listener.<br/>
 *<br/>
 * LOAD queries, batch loading data into the store, do not
 * trigger events by default. If you wish to be notified
 * by changes triggered by this kind of queries, invoke
 * the *setBatchLoadEvents* function with a true argument.<br/>
 *<br/>
 * The event listener function can be removed using the stopObservingNode function.
 *
 * @arguments
 * @param {String} nodeURI URI of the node to observe
 * @param {Function} eventListener Function that will be notified with the events
 * @param {Function} [callback] Function that will be invoked, once the event listener had been correctly set up.
 */
Store.prototype.startObservingNode = function() {
    var uri, graphUri, callback;

    if(arguments.length === 2) {
	uri = arguments[0];
	callback = arguments[1];
	this.engine.callbacksBackend.observeNode(uri, callback, function(){});
    } else if(arguments.length === 3) {
	uri = arguments[0];
	graphUri = arguments[1];
	callback = arguments[2];
	this.engine.callbacksBackend.observeNode(uri, graphUri, callback, function(){});
    }
};

/**
 * Removes a callback function associated to a node.<br/>
 * The event listener function object must be passed as an argument.<br/>
 *
 * @arguments
 * @param {Function} eventListener The event listener function to remove, the same passed as an argument to startObservingNode
 */
Store.prototype.stopObservingNode = function(callback) {
    this.engine.callbacksBackend.stopObservingNode(callback);
};

/**
 * Associates an event listener function to a SPARQL SELECT or
 * CONSTRUCT query.<br/>
 * Every time an update (insert, delete...) query modified the
 * triples in the store in a way that modifies the output of the
 * query, the event listener will be invoked with an updated
 * result.<br/>
 *<br/>
 * LOAD queries, batch loading data into the store, do not
 * trigger events by default. If you wish to be notified
 * by changes triggered by this kind of queries, invoke
 * the <code>setBatchLoadEvents</code> function with a true argument.<br/>
 *<br/>
 * The event listener function can be removed invoking the
 * <code>stopObservingQuery</code> function.
 *
 * @arguments
 * @param {String} query SELECT or CONSTRUCT SPARQL query
 * @param {Function} eventListener the function that will receive the notifications
 * @param {Function} [callback] optional function that will be invoked when the stored had set up the event listener function.
 */
Store.prototype.startObservingQuery = function() {
    var query = arguments[0];
    var callback = arguments[1];
    var endCallback = arguments[2];
    if(endCallback!=null) {
	this.engine.callbacksBackend.observeQuery(query, callback, endCallback);
    } else {
	this.engine.callbacksBackend.observeQuery(query, callback, function(){});
    }
};

/**
 * Removes a callback function associated to a SPARQL query.<br/>
 * The event listener function object must be passed as an argument.
 *
 * @arguments
 * @param {Function} eventListener The event listener function to remove, the same passed as an argument to startObservingQuery
 */
Store.prototype.stopObservingQuery = function(query) {
    this.engine.callbacksBackend.stopObservingQuery(query);
};

/**
 * Associates an event listener to a pattern expressed as the
 * subject, predicate, object and graph string parameters passed
 * to the function. To match any value in that position, a <code>null</code>
 * value can be passed as an argument. e.g. <code>subscribe(null, null, null, g, cb)</code>,
 * will be notified with any change in the g graph.<br/>
 * The graph component of the pattern does not support a <code>null</code> value.<br/>
 *<br/>
 * Results will be notified as an Array of RDF JS Interface
 * <code>Triple</code> objects.<br/>
 *<br/>
 * LOAD queries, batch loading data into the store, do not
 * trigger events by default. If you wish to be notified
 * by changes triggered by this kind of queries, invoke
 * the <code>setBatchLoadEvents</code> function with a true argument.
 *
 * @arguments
 * @param {String} s subject or null for any subject
 * @param {String} p predicate or null for any predicate
 * @param {String} o object or null for any object
 * @param {String} g graph or null for any graph
 * @param {Function} event listener function that will be notified when a change occurs
 */
Store.prototype.subscribe = function(s, p, o, g, callback) {
    var that = this;
    var adapterCb = function(event,triples){
	var acum = [];
	var queryEnv = {blanks:{}, outCache:{}};
	var bindings = [];

	_.each(triples, function(triple){
	    var s = RDFModel.buildRDFResource(triple.subject,bindings,that.engine,queryEnv);
	    var p = RDFModel.buildRDFResource(triple.predicate,bindings,that.engine,queryEnv);
	    var o = RDFModel.buildRDFResource(triple.object,bindings,that.engine,queryEnv);
	    if(s!=null && p!=null && o!=null) {
		triple = new RDFModel.Triple(s,p,o);
		acum.push(triple);
	    }
	});

	callback(event,acum);
    };

    this.functionMap[callback] = adapterCb;
    this.engine.callbacksBackend.subscribe(s,p,o,g,adapterCb,function(){});
};

/**
 * Removes an event listener associated to a certain pattern.
 * The function passed as an argument to <code>subscribe</code> must be
 * passed as an argument.
 *
 * @arguments
 * @param {Function} callback The event listener to be removed
 */
Store.prototype.unsubscribe = function(callback) {
    var adapterCb = this.functionMap[callback];
    this.engine.callbacksBackend.unsubscribe(adapterCb);
    delete this.functionMap[callback];
};

/**
 * Register a combination of prefix and URI fragment in the default instance
 * of the RDF JS Interface API <code>RDFEnvironment</code> object associated
 * to the store and available through the <code>storeInstance.rdf</code> property.
 *
 * @arguments
 * @param {String} prefix The prefix to be associated
 * @param {String} URIFragment URI fragment the provided prefix will be resolved
 */
Store.prototype.setPrefix = function(prefix, uri) {
    this.rdf.setPrefix(prefix, uri);
};

/**
 * Defines the URI that will be used by default by the RDF JS Interface
 * API <code>RDFEnvironment</code> object associated to the store and available
 * through the <code>storeInstance.rdf</code> property.
 *
 * @arguments
 * @param {String} URIFragment The URI fragment will be used by default
 */
Store.prototype.setDefaultPrefix = function(uri) {
    this.rdf.setDefaultPrefix(uri);
};

/**
 * Inserts a RDF JS Interface API <code>Graph</code> object into the store.
 * The function receives a mandatory <code>Graph</code> object whose triples
 * will be inserted. Optionally, a URI string for a graph and a
 * callback function can be passed as arguments.<br/>
 * <br/>
 * If no graph URI is specified, triples will be inserted into the
 * default graph.<br/>
 * <br/>
 * If the callback function is specified, it will be invoked when all the
 * triples had been inserted into the store.<br/>
 *
 * @arguments
 * @param {RDFModel.Graph} triples a RDF JS Interface <code>Graph</code> object
 * @param {String} [graphURI] URI of the graph where the triples will be inserted. If it is missing, triples will be inserted in the default graph
 * @param {String} [callback] A callback function that will be invoked with a success notification and the number of triples inserted
 */
Store.prototype.insert = function() {
    var graph;
    var triples;
    var callback;
    if(arguments.length === 1) {
	triples = arguments[0];
	callback= function(){};
    } else if(arguments.length === 2) {
	triples = arguments[0];
	callback= arguments[1] || function(){};
    } else if(arguments.length === 3) {
	triples = arguments[0];
	graph = this.rdf.createNamedNode(arguments[1]);
	callback= arguments[2] || function(){};
    } else {
	throw("The triples to insert, an optional graph and callback must be provided");
    }

    var query = "";
    var that = this;
    triples.forEach(function(triple) {
	query = query + that._nodeToQuery(triple.subject) + that._nodeToQuery(triple.predicate) + that._nodeToQuery(triple.object) + ".";
    });

    if(graph != null) {
	query = "INSERT DATA { GRAPH " + this._nodeToQuery(graph) +" { "+ query + " } }";
    } else {
	query = "INSERT DATA { "+ query + " }";
    }

    this.engine.execute(query, callback);
};

Store.prototype._nodeToQuery = function(term) {
    if(term.interfaceName === 'NamedNode') {
	var resolvedUri = this.rdf.resolve(term.valueOf());
	if(resolvedUri != null) {
	    return "<" + resolvedUri + ">";
	} else {
	    return "<" + term.valueOf() + ">";
	}
    } else {
	return term.toString();
    }
};

/**
 * Removes the triples in a RDF JS Interface API <code>Graph</code> object from the store.
 * The function receives a mandatory <code>Graph</code> object whose triples
 * will be removed. Optionally, a URI string for a graph and a
 * callback function can be passed as arguments.<br/>
 * <br/>
 * If no graph URI is specified, triples will be removed from the
 * default graph.<br/>
 * <br/>
 * If the callback function is specified, it will be invoked when all the
 * triples had been removed from the store.
 *
 * @arguments
 * @param {RDFModel.Graph} triples a RDF JS Interface <code>Graph</code> object
 * @param {String} [graphURI] URI of the graph where the triples will be removed from. If it is missing, triples will be removed from the default graph
 * @param {String} [callback] A callback function that will be invoked with a success notification
 */
Store.prototype.delete = function() {

    var graph;
    var triples;
    var callback;
    if(arguments.length === 1) {
	triples = arguments[0];
	callback= function(){};
    } else if(arguments.length === 2) {
	triples = arguments[0];
	callback= arguments[1] || function(){};
    } else if(arguments.length === 3) {
	triples = arguments[0];
	graph = this.rdf.createNamedNode(arguments[1]);
	callback= arguments[2] || function(){};
    } else {
	throw("The triples to delete, an optional graph and callback must be provided");
    }

    var query = "";
    var that = this;
    triples.forEach(function(triple) {
	query = query + that._nodeToQuery(triple.subject) + that._nodeToQuery(triple.predicate) + that._nodeToQuery(triple.object) + ".";
    });

    if(graph != null) {
	query = "DELETE DATA { GRAPH " + this._nodeToQuery(graph) +" { "+ query + " } }";
    } else {
	query = "DELETE DATA { "+ query + " }";
    }

    this.engine.execute(query, callback);
};

/**
 * Removes all the triples stored in a graph.
 *
 * The URI of the graph and a callback function can be
 * optinally passed as parameters.<br/>
 * <br/>
 * If no graph URI is specified, all triples in the
 * default graph will be removed.
 *
 * @arguments
 * @param {String} [graph] the URI of the graph the triples must be removed from
 * @param {Function} [callback] a function that will be invoked with a success notification
 */
Store.prototype.clear = function() {
    var graph;
    var callback;

    if(arguments.length === 0) {
	graph = this.rdf.createNamedNode(this.engine.lexicon.defaultGraphUri);
	var callback= function(){};
    } else if(arguments.length === 1) {
	graph = this.rdf.createNamedNode(this.engine.lexicon.defaultGraphUri);
	callback= arguments[0] || function(){};
    } else if(arguments.length === 2) {
	graph = this.rdf.createNamedNode(arguments[0]);
	callback= arguments[1] || function(){};
    } else {
	throw("The optional graph and a callback must be provided");
    }

    var query = "CLEAR GRAPH " + this._nodeToQuery(graph);
    this.engine.execute(query, callback);
};

/**
 * Boolean value determining if loading RDF must produce
 * triple add events and fire callbacks.<br/>
 * Default value is false.
 *
 * @arguments
 * @param {boolean} mustFireEvents true/false value.
 */
Store.prototype.setBatchLoadEvents = function(mustFireEvents){
    this.engine.eventsOnBatchLoad = mustFireEvents;
};

/**
 * Registers a namespace prefix that will be automatically declared
 * in all the queries.<br/>
 * <br/>
 * The prefix will also be inserte in the default <code>RDFEnvironment</code> object
 * associated to the <code>rdf</code> property of the store instance.
 *
 * @arguments
 * @param {String} ns the name space to be regsitered
 * @param {String} prefix the URI fragment associated to the name space
 */
Store.prototype.registerDefaultNamespace = function(ns, prefix) {
    this.rdf.prefixes.set(ns,prefix);
    this.engine.registerDefaultNamespace(ns,prefix);
};

/**
 * Registers the default namespaces declared in the RDF JS Interfaces
 * specification in the default Profile.
 */
Store.prototype.registerDefaultProfileNamespaces = function() {
    var defaultNsMap = this.rdf.prefixes.values();
    for (var p in defaultNsMap) {
	this.registerDefaultNamespace(p,defaultNsMap[p]);
    }
};

/**
 * Load triples into a graph in the store. Data can be passed directly to the method
 * or a remote URI speifying where the data is located can be used.<br/>
 *<br/>
 * If the data is passed directly to the load function, the media type stating the format
 * of the data must also be passed to the function.<br/>
 *<br/>
 * If an URI is passed as a parameter, the store will attempt to perform content negotiation
 * with the remote server and get a representation for the RDF data matching one of the
 * the RDF parsers registered in the store. In this case, the media type parameter must be
 * set to the <code>'remote'</code> value.<br/>
 *<br/>
 * An additional URI for the graph where the parsed data will be loaded and a callback function
 * can be also passed as parameters. If no graph is specified, triples will be loaded in the
 * default graph.<br/>
 *<br/>
 * By default loading data will not trigger notification through the events API. If events needs to
 * be trigger, the functio <code>setBatchLoadEvents</code> must be invoked with a true parameter.
 *
 * @arguments
 * @param {String} mediaType Media type (application/json, text/n3...) of the data to be parsed or the value <code>'remote'</code> if a URI for the data is passed instead
 * @param {String} data RDF data to be parsed and loaded or an URI where the data will be retrieved after performing content negotiation
 * @param {String} [graph] Graph where the parsed triples will be inserted. If it is not specified, triples will be loaded in the default graph
 * @param {Function} callback that will be invoked with a success notification and the number of triples loaded.
 */
Store.prototype.load = function(){
    var mediaType;
    var data;
    var graph;
    var callback;
    var options = {};

    if(arguments.length === 3) {
	graph = this.rdf.createNamedNode(this.engine.lexicon.defaultGraphUri);
	mediaType = arguments[0];
	data = arguments[1];
	callback= arguments[2] || function(){};
    } else if(arguments.length === 4) {
	mediaType = arguments[0];
	data = arguments[1];
	options = arguments[2];
	if(typeof(options) === 'string') {
	    graph = this.rdf.createNamedNode(options);
	    options = {};
	} else {
	    graph = this.rdf.createNamedNode(options.graph || this.engine.lexicon.defaultGraphUri);
	    delete options['graph'];
	}
	callback= arguments[3] || function(){};
    } else if(arguments.length === 2) {
	throw("The mediaType of the parser, the data a callback and an optional graph must be provided");
    }

    if(mediaType === 'remote') {
	data = this.rdf.createNamedNode(data);
	var query = "LOAD <"+data.valueOf()+"> INTO GRAPH <"+graph.valueOf()+">";
	this.engine.execute(query, callback);
    } else {

	var that = this;

	var parser = this.engine.rdfLoader.parsers[mediaType];

	if (!parser) return callback(new Error("Cannot find parser for the provided media type:"+mediaType));

	var cb = function(err, quads) {
	    if(err) {
		callback(err, quads);
	    } else {
		that.engine.batchLoad(quads,function(success){
		    if(success != null){
			callback(null,success);
		    } else {
			callback(new Error("Erro batch-loading triples."));
		    }
		});
	    }
	};

	var args = [parser, {'token':'uri', 'value':graph.valueOf()}, data, options, cb];

	if(data && typeof(data)==='string' && data.indexOf('file://')=== 0) {
	    this.engine.rdfLoader.loadFromFile.apply(null, args);
	} else {
	    this.engine.rdfLoader.tryToParse.apply(null, args);
	}
    }
};

/**
 * Registers a new parser associated to the provided media type. If there is a parser already registered for
 * that media type, the new parser will replace the old one.<br/>
 *<br/>
 * Parsers must implement a function *parse* accepting the data to be parsed as the
 * first parameter and the destination graph URI as the second one.
 * They must return an array of objects with properties: 'subject', 'predicate', 'object'
 * and 'graph' containing lexical representations for these values:
 *<br/>
 *<ul>
 * <li><code>{literal: '"literal"'}</code></li>
 * <li><code>{literal: ''"literal"^^<datatype>'}</code></li>
 * <li><code>{literal: '"literal"@lang'}</code></li>
 * <li><code>{uri: 'uri'}</code></li>
 * <li><code>{blank: '_:label'}</code></li>
 *</ul>
 *<br/>
 * The provided media type will be used to perform content negotiation when dealing with remote
 * resources, or to select the parser in the <code>load</code> function.
 *
 * @arguments
 * @param {String} mediaType the media type for this parser
 * @param {String} parser an object containing the *parse* function with the parser logic
 */
Store.prototype.registerParser = function(mediaType, parser) {
    this.engine.rdfLoader.registerParser(mediaType,parser);
};

/**
 * Returns the URI of all the graphs currently contained
 * in the store
 *
 * @arguments:
 * @param {Function} callback function that will receive a success notification and the array of graph URIs
 */
Store.prototype.registeredGraphs = function(callback) {
    this.engine.lexicon.registeredGraphs(true, function(graphs){
	var graphNodes = _.map(graphs, function(graph){
	    return new RDFModel.NamedNode(graph);
	});

	callback(null, graphNodes);
    });
};

/**
 * Returns the current network transport being used by the
 * the store.
 *
 * The default transport uses TCP sockets in the Node.js version
 * and relies on jQuery in the browser version. This can be overriden
 * using the <code>setNetworkTransport</code> function.
 */
Store.prototype.getNetworkTransport = function() {
    return NetworkTransport;
};

/**
 * Sets the network transport used by the store.<br/>
 * <br/>
 * Network transport consist of an object implementing the <code>load</code>
 * function, receiving the URI to load, a string with the value
 * of the HTTP 'Accept' header for the store registered parsers,
 * a callback function where the retrieved data and the success notification
 * must be returned.<br/>
 *<br/>
 * Different examples with implementations of different transports can be found
 * in the source code of the store:
 *<ul>
 * <li>src/js-communication/src/tcp_transport.js</li>
 * <li>src/js-communication/src/ajax_transport.js</li>
 *</ul>
 * @arguments
 * @param networkTransportImpl object implementing the transport *load* function.
 */
Store.prototype.setNetworkTransport = function(networkTransportImpl) {
    NetworkTransport = networkTransportImpl;
};


/**
 * Clean-up function releasing all temporary resources held by the
 * store instance.
 */
Store.prototype.close = function(cb) {
    if(cb == null)
	cb = function(){};
    if(this.engine.close)
	this.engine.close(cb);
    else
	cb();
};

/**
 * Version of the store
 */
Store.VERSION = "0.9.17";

/**
 * Create a new RDFStore instance that will be
 * executed in a web worker in the browser or a new process
 * in Node.js.
 * <br/>
 * <br/>
 * The first argument to this function is the URL/FS location
 * of the store script.
 * <br/>
 * <br/>
 * This parameter is mandatory in the browser. It is safe to
 * ignore this parameter in Node.js.
 * <br/>
 * <br/>
 * If support for web workers is not present, a regular
 * store object will be initialized and returned.
 * <br/>
 * <br/>
 *
 * @param {String} [scriptPath] URL of the RDFStore script
 * @param {Object[]} [args] Arguments to be passed to the store that will be created
 * @param {Function} callback Callback function that will be invoked with an error flag and the connection/store object.
 */
var connect = function() {
    var callback;
    if(arguments.length == 1) {
		callback = arguments[0];
    } else if(arguments.length == 2) {
		callback = arguments[1];
	} else {
	callback = arguments[2];
    }
    callback(new Error("Store#connect is not supported in the 0.9.X series of the library"));
};

/**
 * Creates a new instance of the store.
 *
 * The function accepts two optional arguments.
 * <br/>
 * If only one argument is passed it must be a
 * callback function that will be invoked when the
 * store had been created.<br/>
 * <br/>
 * If two arguments are passed the first one must
 * be a map of configuration parameters for the
 * store, and the second one the callback function.<br/>
 * <br/>
 * Take a look at the Store constructor function for
 * a detailed list of possible configuration parameters.<br/>
 *
 * @param {Object[]} [args] Arguments to be passed to the store that will be created
 * @param {Function} [callback] Callback function that will be invoked with an error flag and the connection/store object.
 */
var create = function(){
    if(arguments.length == 1) {
	return new Store(arguments[0]);
    } else if(arguments.length == 2) {
	return new Store(arguments[0], arguments[1]);
    } else {
	return new Store();
    };
};

Store.yieldFrequency = function(val) {
    _.yieldFrequency(val);
};

module.exports.Store = Store;
module.exports.create = create;
module.exports.connect = connect;
