//imports
var RDFJSInterface = require("./../../js-query-engine/src/rdf_js_interface.js").RDFJSInterface;

// exports
exports.RDFStoreChildClient = {};

var RDFStoreChildClient = exports.RDFStoreChildClient;
Worker = true;

RDFStoreChildClient.RDFStoreClient = function(path_to_store_script, args, cb) {
    this.connection = require('child_process').fork(path_to_store_script,["is_child"]);

    this.callbacksCounter = 1;
    var that = this;
    var creationCallback = function(success, result) {
        if(success === true) {
            cb(true, that);
        } else {
            cb(false, result);
        }
    };

    this.rdf = RDFJSInterface.rdf;
    
    this.connection.on('message',function(event){
        that.receive(event);
    });

    this.observingCallbacks = {};
    this.callbacks = {'0': {'cb':creationCallback, 'fn':'create'}};
    this.connection.send({'fn':'create', 'args':args, 'callback':'0'});
};

RDFStoreChildClient.RDFStoreClient.prototype.receive = function(packet) {
    var event = packet.data || packet;
    if(event.fn === 'workerRequest:NetworkTransport:load') {
        var that = this;
        var workerCallback = event['callback'];
        var args = event['arguments'].concat(function(success, results){
            that.connection.send({'fn':'workerRequestResponse', 'results':[success, results], 'callback':workerCallback});
        });
        NetworkTransport.load.apply(NetworkTransport,args);
    } else {
        var callbackData = this.callbacks[event.callback];
        //console.log(packet);
        //console.log(callbackData);
        if(callbackData) {
            if(callbackData.fn === 'create' || callbackData.fn === 'execute' || callbackData.fn === 'insert' || callbackData.fn == 'graph' ||
               callbackData.fn === 'node' || callbackData.fn === 'insert' || callbackData.fn === 'delete' || callbackData.fn === 'clear' ||
               callbackData.fn === 'load' || callbackData.fn === 'startObservingQueryEndCb' || callbackData.fn === 'registeredGraphs') {
                delete this.callbacks[event.callback];
                callbackData.cb(event.success, event.result);
            } else if(callbackData.fn === 'startObservingQuery') {
                callbackData.cb(event.result);                
            } else if(callbackData.fn === 'startObservingNode') {
                callbackData.cb(event.result);
            } else if(callbackData.fn === 'subscribe') {
                callbackData.cb(event.event, event.result);
            }
        }
    }
};

RDFStoreChildClient.RDFStoreClient.prototype.registerCallback = function(fn, callback) {
    var id = ''+this.callbacksCounter;
    this.callbacks[id] = {'fn':fn, 'cb':callback};
    this.callbacksCounter++;

    return id;
};

RDFStoreChildClient.RDFStoreClient.prototype.execute = function() {
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

        var queryString,callback;

        if(arguments.length === 1) {
            queryString = arguments[0];
            callback = function(){};

        } else if(arguments.length === 2) {
            queryString = arguments[0];
            callback = arguments [1];
        }

        var id = this.registerCallback('execute',callback);

        this.connection.send({'fn':'execute', 'args':[queryString], 'callback':id});
    }

};

RDFStoreChildClient.RDFStoreClient.prototype.insert = function() {
    var graph;
    var triples;
    var callback;
    if(arguments.length === 1) {
        triples = arguments[0];
        this.connection.send({'fn':'insert', 'args':[triples]})
    } else if(arguments.length === 2) {
        triples = arguments[0];
        callback= arguments[1] || function(){};
        var id = this.registerCallback('insert', callback);
        this.connection.send({'fn':'insert', 'args':[triples], 'callback':id})
    } else if(arguments.length === 3) {
        triples = arguments[0];
        graph = arguments[1];
        callback= arguments[2] || function(){};
        var id = this.registerCallback('insert', callback);
        this.connection.send({'fn':'insert', 'args':[triples,graph], 'callback':id})
    } else {
        throw("The triples to insert, an optional graph and callback must be provided");
    }
};

RDFStoreChildClient.RDFStoreClient.prototype.graph = function() {
    var graphUri = null;
    var callback = null;
    if(arguments.length === 1) {
        callback = arguments[0] || function(){};
    } else if(arguments.length === 2) {
        callback = arguments[1] || function(){};
        graphUri = arguments[0];
    } else {
        throw("An optional graph URI and a callback function must be provided");
    }

    var that = this;
    var wrapperCallback = function(success, toWrap) {
        //console.log("CALLBACK!\n\n");
        if(success) {
            var triple;
            for(var i=0; i<toWrap.triples.length; i++) {
                triple = toWrap.triples[i];
                toWrap.triples[i] = new RDFJSInterface.Triple(that.adaptJSInterface(triple.subject),
                                                              that.adaptJSInterface(triple.predicate),
                                                              that.adaptJSInterface(triple.object));
            }                
            callback(success, that.rdf.createGraph(toWrap.triples));
        } else {
            callback(success,toWrap);
        }
    };
    var id = this.registerCallback('insert', wrapperCallback);
    if(graphUri == null) {
        this.connection.send({'fn':'graph', 'args':[], 'callback':id})
    } else {
        this.connection.send({'fn':'graph', 'args':[graphUri], 'callback':id})
    }
};

RDFStoreChildClient.RDFStoreClient.prototype.node = function() {
    var graphUri = null;
    var callback = null;
    var nodeUri  = null;
    if(arguments.length === 2) {
        nodeUri = arguments[0];
        callback = arguments[1] || function(){};
    } else if(arguments.length === 3) {
        nodeUri = arguments[0];
        graphUri = arguments[1];
        callback = arguments[2] || function(){};
    } else {
        throw("An optional graph URI and a callback function must be provided");
    }

    var that = this;
    var wrapperCallback = function(success, toWrap) {
        //console.log("CALLBACK!\n\n");
        if(success) {
            var triple;
            for(var i=0; i<toWrap.triples.length; i++) {
                triple = toWrap.triples[i];
                toWrap.triples[i] = new RDFJSInterface.Triple(that.adaptJSInterface(triple.subject),
                                                              that.adaptJSInterface(triple.predicate),
                                                              that.adaptJSInterface(triple.object));
            }                
            callback(success, that.rdf.createGraph(toWrap.triples));
        } else {
            callback(success,toWrap);
        }
    };
    var id = this.registerCallback('insert', wrapperCallback);
    if(graphUri == null) {
        this.connection.send({'fn':'node', 'args':[nodeUri], 'callback':id})
    } else {
        this.connection.send({'fn':'node', 'args':[nodeUri, graphUri], 'callback':id})
    }

};

RDFStoreChildClient.RDFStoreClient.prototype.setPrefix = function(prefix, uri) {
    this.rdf.setPrefix(prefix, uri);
    this.connection.send({'fn':'rdf/setPrefix', 'args':[prefix, uri], 'callback':null})
};

RDFStoreChildClient.RDFStoreClient.prototype.setDefaultPrefix = function(uri) {
    this.rdf.setDefaultPrefix(uri);
    this.connection.send({'fn':'rdf/setDefaultPrefix', 'args':[uri], 'callback':null})
};


RDFStoreChildClient.RDFStoreClient.prototype['delete'] = function() {
    var graph;
    var triples;
    var callback;
    if(arguments.length === 1) {
        triples = arguments[0];
        this.connection.send({'fn':'delete', 'args':[triples]})
    } else if(arguments.length === 2) {
        triples = arguments[0];
        callback= arguments[1] || function(){};
        var id = this.registerCallback('delete', callback);
        this.connection.send({'fn':'delete', 'args':[triples], 'callback':id})
    } else if(arguments.length === 3) {
        triples = arguments[0];
        graph = arguments[1];
        callback= arguments[2] || function(){};
        var id = this.registerCallback('delete', callback);
        this.connection.send({'fn':'delete', 'args':[triples,graph], 'callback':id})
    } else {
        throw("The triples to delete, an optional graph and callback must be provided");
    }
};


RDFStoreChildClient.RDFStoreClient.prototype.clear = function() {
    var graph;
    var callback;
    
    if(arguments.length === 1) {
        callback= arguments[0] || function(){};
        var id = this.registerCallback('clear', callback);
        this.connection.send({'fn':'clear', 'args':[], 'callback':id})
    } else if(arguments.length === 2) {
        graph = arguments[0];
        callback= arguments[1] || function(){};
        var id = this.registerCallback('clear', callback);
        this.connection.send({'fn':'clear', 'args':[graph], 'callback':id})
    } else {
        throw("The optional graph and a callback must be provided");
    }
};


/**
 * Boolean value determining if loading RDF must produce
 * triple add events and fire callbacks.
 * Default is false.
 */
RDFStoreChildClient.RDFStoreClient.prototype.setBatchLoadEvents = function(mustFireEvents){
    this.connection.send({'fn':'setBatchLoadEvents', 'args':[mustFireEvents]});
};

/**
 * Registers a namespace prefix that will be automatically declared
 * in all the queries
 */
RDFStoreChildClient.RDFStoreClient.prototype.registerDefaultNamespace = function(ns, prefix) {
    this.connection.send({'fn':'registerDefaultNamespace', 'args':[ns,prefix]});
};

/**
 * Registers the default namespaces declared in the RDF JS Interfaces
 * specification in the default Profile.
 */
RDFStoreChildClient.RDFStoreClient.prototype.registerDefaultProfileNamespaces = function() {
    this.connection.send({'fn':'registerDefaultProfileNamespaces', 'args':[]});
};

RDFStoreChildClient.RDFStoreClient.prototype.load = function(){
    var mediaType;
    var data;
    var graph;
    var callback;
    
    if(arguments.length === 3) {
        mediaType = arguments[0];
        data = arguments[1];
        callback= arguments[2] || function(){};
        var id = this.registerCallback('load', callback);
        this.connection.send({'fn':'load', 'args':[mediaType, data], 'callback':id})
    } else if(arguments.length === 4) {
        mediaType = arguments[0];
        data = arguments[1];
        graph = arguments[2];
        callback= arguments[3] || function(){};
        var id = this.registerCallback('load', callback);
        this.connection.send({'fn':'load', 'args':[mediaType, data, graph], 'callback':id})
    } else if(arguments.length === 2) {
        throw("The mediaType of the parser, the data a callback and an optional graph must be provided");
    }
    
};

RDFStoreChildClient.RDFStoreClient.prototype.startObservingQuery = function() {
    var query = arguments[0];
    var callback = arguments[1];
    var endCallback = arguments[2];
    if(endCallback!=null) {
        var id1 = this.registerCallback('startObservingQuery', callback);
        this.observingCallbacks[query] = id1;
        var id2 = this.registerCallback('startObservingQueryEndCb', endCallback);
        this.connection.send({'fn':'startObservingQuery', 'args':[query], 'callback':[id1,id2]})
    } else {
        var id1 = this.registerCallback('startObservingQuery', callback);
        this.observingCallbacks[query] = id1;
        this.connection.send({'fn':'startObservingQuery', 'args':[query], 'callback':[id1]})
    }
};

RDFStoreChildClient.RDFStoreClient.prototype.stopObservingQuery = function(query) {
    var id = this.observingCallbacks[query];
    delete this.observingCallbacks[query];
    delete this.callbacks[id];
    this.connection.send({'fn':'stopObservingQuery', 'args':[query], 'callback':[]})
};

RDFStoreChildClient.RDFStoreClient.prototype.startObservingNode = function() {
    var uri, graphUri, callback;

    if(arguments.length === 2) {
        uri = arguments[0];
        callback = arguments[1];

        var that = this;
        var wrapperCallback = function(toWrap) {
            //console.log("CALLBACK!\n\n");
            var triple;
            for(var i=0; i<toWrap.triples.length; i++) {
                triple = toWrap.triples[i];
                toWrap.triples[i] = new RDFJSInterface.Triple(that.adaptJSInterface(triple.subject),
                                                              that.adaptJSInterface(triple.predicate),
                                                              that.adaptJSInterface(triple.object));
            }                
            callback(that.rdf.createGraph(toWrap.triples));
        };

        var id = this.registerCallback('startObservingNode', wrapperCallback);
        this.observingCallbacks[callback] = id;

        this.connection.send({'fn':'startObservingNode', 'args':[uri], 'callback':id})
    } else if(arguments.length === 3) {
        uri = arguments[0];
        graphUri = arguments[1];
        callback = arguments[2];

        var that = this;
        var wrapperCallback = function(toWrap) {
            //console.log("CALLBACK!\n\n");
            var triple;
            for(var i=0; i<toWrap.triples.length; i++) {
                triple = toWrap.triples[i];
                toWrap.triples[i] = new RDFJSInterface.Triple(that.adaptJSInterface(triple.subject),
                                                              that.adaptJSInterface(triple.predicate),
                                                              that.adaptJSInterface(triple.object));
            }                
            callback(that.rdf.createGraph(toWrap.triples));
        };

        var id = this.registerCallback('startObservingNode', wrapperCallback);
        this.observingCallbacks[callback] = id;

        this.connection.send({'fn':'startObservingNode', 'args':[uri,graphUri], 'callback':id})
    }
};

RDFStoreChildClient.RDFStoreClient.prototype.stopObservingNode = function(callback) {
    var id = this.observingCallbacks[callback];
    delete this.observingCallbacks[callback];
    delete this.callbacks[id];
    //console.log("STOP OBSERVING "+id);
    this.connection.send({'fn':'stopObservingNode', 'args':[id], 'callback':[]})
};

RDFStoreChildClient.RDFStoreClient.prototype.subscribe = function(s, p, o, g, callback) {
    var that = this;
    var wrapperCallback = function(event,triples) {
        //console.log("CALLBACK!\n\n");
        var triple;
        for(var i=0; i<triples.length; i++) {
            triple = triples[i];
            triples[i] = new RDFJSInterface.Triple(that.adaptJSInterface(triple.subject),
                                                   that.adaptJSInterface(triple.predicate),
                                                   that.adaptJSInterface(triple.object));
        }                
        callback(event,triples);
    };
    var id = this.registerCallback('subscribe', wrapperCallback);
    this.observingCallbacks[callback] = id;

    this.connection.send({'fn':'subscribe', 'args':[s,p,o,g], 'callback':id});
};

RDFStoreChildClient.RDFStoreClient.prototype.unsubscribe = function(callback) {
    var id = this.observingCallbacks[callback];
    delete this.observingCallbacks[callback];
    delete this.callbacks[id];
    //console.log("STOP OBSERVING "+id);
    this.connection.send({'fn':'unsubscribe', 'args':[id], 'callback':[]})
};

RDFStoreChildClient.RDFStoreClient.prototype.registeredGraphs = function(callback) {
    var that = this;
    var wrapperCallback = function(success, graphs) {
        //console.log("CALLBACK!\n\n");
        if(success) {
            var triple;
            for(var i=0; i<graphs.length; i++) {
                var graph = graphs[i];
                graphs[i] = that.adaptJSInterface(graph);
            }                
            callback(success, graphs);
        } else {
            callback(success,graphs);
        }
    };

    var id = this.registerCallback('registeredGraphs', wrapperCallback);
    this.connection.send({'fn':'registeredGraphs', 'args':[], 'callback':id})
};

// helper functions
RDFStoreChildClient.RDFStoreClient.prototype.adaptJSInterface = function(node) {
    if(node.interfaceName === 'BlankNode') {
        return new RDFJSInterface.BlankNode(node.bnodeId);
    } else if(node.interfaceName === 'Literal') {
        return new RDFJSInterface.Literal(node.nominalValue, node.language, node.datatype);
    } else if(node.interfaceName === 'NamedNode') {
        return new RDFJSInterface.NamedNode(node.nominalValue);
    }
};

// make possible for clients to test if this is being executed inside a connection
RDFStoreChildClient.RDFStoreClient.prototype.isWebWorkerConnection = true;

