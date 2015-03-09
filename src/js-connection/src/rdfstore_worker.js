// imports
var RDFJSInterface = require(__dirname+"/./../../js-query-engine/src/rdf_js_interface.js").RDFJSInterface;
var Store = require(__dirname+"/./../../js-store/src/store").Store;
    RDFStoreWorker = {};

    RDFStoreWorker.observingCallbacks = {};
    
    RDFStoreWorker.workerCallbacksCounter = 0;
    RDFStoreWorker.workerCallbacks = {};
    RDFStoreWorker.registerCallback = function(cb) {
        var nextId = ""+RDFStoreWorker.workerCallbacksCounter;
        RDFStoreWorker.workerCallbacksCounter++;
        RDFStoreWorker.workerCallbacks[nextId] = cb;
        return nextId;
    };

    RDFStoreWorker.handleCreate = function(argsObject, cb) {
        // redefine NetworkTransport

        if(typeof(NetworkTransport) != 'undefined'  && NetworkTransport != null) {
            NetworkTransport = {
                load: function(uri, graph, callback) {
                    var cbId = RDFStoreWorker.registerCallback(function(results){
                        callback.apply(callback,results);
                    });
                    postMessage({'fn':'workerRequest:NetworkTransport:load','callback':cbId, 'arguments':[uri,graph]});
                },

                loadFromFile: function(parser, graph, uri, callback) {

                }
            }
        }

        var args = [argsObject];
        //console.log("in handling create");
        args.push(function(result){
            //console.log("created!!!");
            // Stores the store object in the worker
            RDFStoreWorker.store = result;
            //console.log("posting MESSAGE!");

            postMessage({'callback':cb, 'result':'created', 'success':true});
        });
        //console.log("creating");
        Store.create.apply(Store,args)
    };

    RDFStoreWorker.receive = function(packet) {
        var msg = packet.data || packet;
        //console.log("RECEIVED...");
        if(msg.fn === 'workerRequestResponse') {
            var cbId = msg.callback;
            var callback = RDFStoreWorker.workerCallbacks[cbId];
            if(callback != null) {
                delete RDFStoreWorker.workerCallbacks[cbId];
                callback(msg.results);
            }
        } else if(msg.fn === 'create' && msg.args !=null) {
            //console.log("handling create");
            RDFStoreWorker.handleCreate(msg.args, msg.callback);
        } else if(msg.fn === 'setBatchLoadEvents') {
            RDFStoreWorker.store[msg.fn].apply(RDFStoreWorker.store, msg.args);
        } else if(msg.fn === 'registerDefaultNamespace') {
            RDFStoreWorker.store[msg.fn].apply(RDFStoreWorker.store, msg.args);
        } else if(msg.fn === 'registerDefaultProfileNamespaces') {
            RDFStoreWorker.store[msg.fn].apply(RDFStoreWorker.store, msg.args);
        } else if((msg.fn === 'execute' ||
                   msg.fn === 'executeWithEnvironment' ||
                   msg.fn === 'graph'||
                   msg.fn === 'node' ||
                   msg.fn === 'clear' ||
                   msg.fn === 'load') && msg.args != null) {
            msg.args.push(function(success, result){
                //console.log("CALLBACK!");
                if(msg.callback!=null) {
                    postMessage({'callback':msg.callback, 'result':result, 'success':success});
                }
            });
            try {
                RDFStoreWorker.store[msg.fn].apply(RDFStoreWorker.store,msg.args);
            } catch(e) {
                console.log("Error executing method through connection");
                console.log(e);
            }
        } else if((msg.fn === 'insert'||
                   msg.fn === 'delete') && msg.args != null) {
            try {
                msg.args.push(function(success, result){
                    //console.log("CALLBACK!");
                    if(msg.callback!=null) {
                        postMessage({'callback':msg.callback, 'result':result, 'success':success});
                    }
                });
                var triple;
                var toWrap = msg.args[0];
                for(var i=0; i<toWrap.triples.length; i++) {
                    triple = toWrap.triples[i];
                    toWrap.triples[i] = new RDFJSInterface.Triple(RDFStoreWorker.adaptJSInterface(triple.subject),
                                                                  RDFStoreWorker.adaptJSInterface(triple.predicate),
                                                                  RDFStoreWorker.adaptJSInterface(triple.object));
                }                

                if(msg.args[1].interfaceName != null) {
                    msg.args[1] = RDFStoreWorker.adaptJSInterface(msg.args[1]);
                }
                msg.args[0] = RDFStoreWorker.store.rdf.createGraph(toWrap.triples);
                //console.log("ARGS...");
                
                RDFStoreWorker.store[msg.fn].apply(RDFStoreWorker.store,msg.args);
            } catch(e) {
                console.log("Error executing method through connection");
                console.log(e);
            }
        } else if(msg.fn === 'rdf/setPrefix' && msg.args != null) {
            RDFStoreWorker.store.rdf.setPrefix(msg.args[0], msg.args[1]);
        } else if(msg.fn === 'rdf/setDefaultPrefix' && msg.args != null) {
            RDFStoreWorker.store.rdf.setDefaultPrefix(msg.args[0]);
        } else if(msg.fn === 'startObservingQuery' && msg.args != null) {
            // regular callback
            var cb = function(success, result){
                postMessage({'callback':msg.callback[0], 'result':result, 'success':success});
            };

            RDFStoreWorker.observingCallbacks[msg.args[0]] = cb;
            msg.args.push(cb);


            // end register callback
            msg.args.push(function(success, result) {
                //console.log("CALLBACK END REGISTER OBSERVING QUERY!");
                if(msg.callback && msg.callback[1] !=null) {
                    postMessage({'callback':msg.callback[1], 'result':result, 'success':success});                    
                }
            });

            RDFStoreWorker.store[msg.fn].apply(RDFStoreWorker.store,msg.args);

        } else if(msg.fn === 'stopObservingQuery') {
            var cb = RDFStoreWorker.observingCallbacks[msg.args[0]];
            if(cb) {
                RDFStoreWorker.store[msg.fn].apply(RDFStoreWorker.store,[cb]);
            }

            delete RDFStoreWorker.observingCallbacks[msg.args[0]];
        } else if(msg.fn === 'startObservingNode' && msg.args != null) {
            // regular callback
            var cb = function(result){
                //console.log("CALLBACK OBSERVING NODE!");
                postMessage({'callback':msg.callback, 'result':result});
            };

            RDFStoreWorker.observingCallbacks[msg.callback] = cb;
            msg.args.push(cb);

            RDFStoreWorker.store[msg.fn].apply(RDFStoreWorker.store,msg.args);
        } else if(msg.fn === 'stopObservingNode' && msg.args != null) {
            var cb = RDFStoreWorker.observingCallbacks[msg.args[0]];
            if(cb) {
                //console.log("WORKER STOP OBSERVING");
                //console.log(cb);
                RDFStoreWorker.store[msg.fn].apply(RDFStoreWorker.store,[cb]);
            }

            delete RDFStoreWorker.observingCallbacks[msg.args[0]];
        } else if(msg.fn === 'subscribe' && msg.args != null) {
            // regular callback
            var cb = function(event,result){
                //console.log("CALLBACK OBSERVING NODE!");
                postMessage({'callback':msg.callback, 'event':event, 'result':result});
            };

            RDFStoreWorker.observingCallbacks[msg.callback] = cb;
            msg.args.push(cb);

            RDFStoreWorker.store[msg.fn].apply(RDFStoreWorker.store,msg.args);
        } else if(msg.fn === 'stopObservingNode' && msg.args != null) {
            var cb = RDFStoreWorker.observingCallbacks[msg.args[0]];
            if(cb) {
                //console.log("WORKER UNSUBSCRIBE");
                //console.log(cb);
                RDFStoreWorker.store[msg.fn].apply(RDFStoreWorker.store,[cb]);
            }

            delete RDFStoreWorker.observingCallbacks[msg.args[0]];
        } else if(msg.fn === 'registeredGraphs' && msg.args != null) {
            var cb = function(success, result){
                //console.log("CALLBACK!");
                if(msg.callback!=null) {
                    postMessage({'callback':msg.callback, 'result':result, 'success':success});
                }
            };
            RDFStoreWorker.store[msg.fn].apply(RDFStoreWorker.store,[cb]);
        }
    };

    // helper functions
    RDFStoreWorker.adaptJSInterface = function(node) {
        if(node.interfaceName === 'BlankNode') {
            return new RDFJSInterface.BlankNode(node.bnodeId);
        } else if(node.interfaceName === 'Literal') {
            return new RDFJSInterface.Literal(node.nominalValue, node.language, node.datatype);
        } else if(node.interfaceName === 'NamedNode') {
            return new RDFJSInterface.NamedNode(node.nominalValue);
        }
    };

    // @todo
    // I'm setting a global var if this is not a worker
    // FIXME!

    // set the receiver message
    onmessage = RDFStoreWorker.receive;
