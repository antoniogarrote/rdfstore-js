// imports
var RDFJSInterface = require(__dirname+"/./../../js-query-engine/src/rdf_js_interface.js").RDFJSInterface;
var Store = require(__dirname+"/./../../js-store/src/store").Store;
RDFStoreChild = {};

RDFStoreChild.observingCallbacks = {};

RDFStoreChild.workerCallbacksCounter = 0;
RDFStoreChild.workerCallbacks = {};
RDFStoreChild.registerCallback = function(cb) {
    var nextId = ""+RDFStoreChild.workerCallbacksCounter;
    RDFStoreChild.workerCallbacksCounter++;
    RDFStoreChild.workerCallbacks[nextId] = cb;
    return nextId;
};

RDFStoreChild.handleCreate = function(argsObject, cb) {
    // redefine NetworkTransport

    if(typeof(NetworkTransport) != 'undefined'  && NetworkTransport != null) {
        NetworkTransport = {
            load: function(uri, graph, callback) {
                var cbId = RDFStoreChild.registerCallback(function(results){
                    callback.apply(callback,results);
                });
                process.send({'fn':'workerRequest:NetworkTransport:load','callback':cbId, 'arguments':[uri,graph]});
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
        RDFStoreChild.store = result;
        //console.log("posting MESSAGE!");

        process.send({'callback':cb, 'result':'created', 'success':true});
    });
    //console.log("creating");
    Store.create.apply(Store,args)
};

RDFStoreChild.receive = function(packet) {
    var msg = packet.data || packet;
    //console.log("RECEIVED...");
    if(msg.fn === 'workerRequestResponse') {
        var cbId = msg.callback;
        var callback = RDFStoreChild.workerCallbacks[cbId];
        if(callback != null) {
            delete RDFStoreChild.workerCallbacks[cbId];
            callback(msg.results);
        }
    } else if(msg.fn === 'create' && msg.args !=null) {
        //console.log("handling create");
        RDFStoreChild.handleCreate(msg.args, msg.callback);
    } else if(msg.fn === 'setBatchLoadEvents') {
        RDFStoreChild.store[msg.fn].apply(RDFStoreChild.store, msg.args);
    } else if(msg.fn === 'registerDefaultNamespace') {
        RDFStoreChild.store[msg.fn].apply(RDFStoreChild.store, msg.args);
    } else if(msg.fn === 'registerDefaultProfileNamespaces') {
        RDFStoreChild.store[msg.fn].apply(RDFStoreChild.store, msg.args);
    } else if((msg.fn === 'execute' ||
               msg.fn === 'executeWithEnvironment' ||
               msg.fn === 'graph'||
               msg.fn === 'node' ||
               msg.fn === 'clear' ||
               msg.fn === 'load') && msg.args != null) {
        msg.args.push(function(success, result){
            //console.log("CALLBACK!");
            if(msg.callback!=null) {
                process.send({'callback':msg.callback, 'result':result, 'success':success});
            }
        });
        try {
            RDFStoreChild.store[msg.fn].apply(RDFStoreChild.store,msg.args);
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
                    process.send({'callback':msg.callback, 'result':result, 'success':success});
                }
            });
            var triple;
            var toWrap = msg.args[0];
            for(var i=0; i<toWrap.triples.length; i++) {
                triple = toWrap.triples[i];
                toWrap.triples[i] = new RDFJSInterface.Triple(RDFStoreChild.adaptJSInterface(triple.subject),
                                                              RDFStoreChild.adaptJSInterface(triple.predicate),
                                                              RDFStoreChild.adaptJSInterface(triple.object));
            }                

            if(msg.args[1].interfaceName != null) {
                msg.args[1] = RDFStoreChild.adaptJSInterface(msg.args[1]);
            }
            msg.args[0] = RDFStoreChild.store.rdf.createGraph(toWrap.triples);
            //console.log("ARGS...");
            
            RDFStoreChild.store[msg.fn].apply(RDFStoreChild.store,msg.args);
        } catch(e) {
            console.log("Error executing method through connection");
            console.log(e);
        }
    } else if(msg.fn === 'rdf/setPrefix' && msg.args != null) {
        RDFStoreChild.store.rdf.setPrefix(msg.args[0], msg.args[1]);
    } else if(msg.fn === 'rdf/setDefaultPrefix' && msg.args != null) {
        RDFStoreChild.store.rdf.setDefaultPrefix(msg.args[0]);
    } else if(msg.fn === 'startObservingQuery' && msg.args != null) {
        // regular callback
        var cb = function(success, result){
            process.send({'callback':msg.callback[0], 'result':result, 'success':success});
        };

        RDFStoreChild.observingCallbacks[msg.args[0]] = cb;
        msg.args.push(cb);


        // end register callback
        msg.args.push(function(success, result) {
            //console.log("CALLBACK END REGISTER OBSERVING QUERY!");
            if(msg.callback && msg.callback[1] !=null) {
                process.send({'callback':msg.callback[1], 'result':result, 'success':success});                    
            }
        });

        RDFStoreChild.store[msg.fn].apply(RDFStoreChild.store,msg.args);

    } else if(msg.fn === 'stopObservingQuery') {
        var cb = RDFStoreChild.observingCallbacks[msg.args[0]];
        if(cb) {
            RDFStoreChild.store[msg.fn].apply(RDFStoreChild.store,[cb]);
        }

        delete RDFStoreChild.observingCallbacks[msg.args[0]];
    } else if(msg.fn === 'startObservingNode' && msg.args != null) {
        // regular callback
        var cb = function(result){
            //console.log("CALLBACK OBSERVING NODE!");
            process.send({'callback':msg.callback, 'result':result});
        };

        RDFStoreChild.observingCallbacks[msg.callback] = cb;
        msg.args.push(cb);

        RDFStoreChild.store[msg.fn].apply(RDFStoreChild.store,msg.args);
    } else if(msg.fn === 'stopObservingNode' && msg.args != null) {
        var cb = RDFStoreChild.observingCallbacks[msg.args[0]];
        if(cb) {
            //console.log("WORKER STOP OBSERVING");
            //console.log(cb);
            RDFStoreChild.store[msg.fn].apply(RDFStoreChild.store,[cb]);
        }

        delete RDFStoreChild.observingCallbacks[msg.args[0]];
    } else if(msg.fn === 'subscribe' && msg.args != null) {
        // regular callback
        var cb = function(event,result){
            //console.log("CALLBACK OBSERVING NODE!");
            process.send({'callback':msg.callback, 'event':event, 'result':result});
        };

        RDFStoreChild.observingCallbacks[msg.callback] = cb;
        msg.args.push(cb);

        RDFStoreChild.store[msg.fn].apply(RDFStoreChild.store,msg.args);
    } else if(msg.fn === 'stopObservingNode' && msg.args != null) {
        var cb = RDFStoreChild.observingCallbacks[msg.args[0]];
        if(cb) {
            //console.log("WORKER UNSUBSCRIBE");
            //console.log(cb);
            RDFStoreChild.store[msg.fn].apply(RDFStoreChild.store,[cb]);
        }

        delete RDFStoreChild.observingCallbacks[msg.args[0]];
    } else if(msg.fn === 'registeredGraphs' && msg.args != null) {
        var cb = function(success, result){
            //console.log("CALLBACK!");
            if(msg.callback!=null) {
                process.send({'callback':msg.callback, 'result':result, 'success':success});
            }
        };
        RDFStoreChild.store[msg.fn].apply(RDFStoreChild.store,[cb]);
    }
};

// helper functions
RDFStoreChild.adaptJSInterface = function(node) {
    if(node.interfaceName === 'BlankNode') {
        return new RDFJSInterface.BlankNode(node.bnodeId);
    } else if(node.interfaceName === 'Literal') {
        return new RDFJSInterface.Literal(node.nominalValue, node.language, node.datatype);
    } else if(node.interfaceName === 'NamedNode') {
        return new RDFJSInterface.NamedNode(node.nominalValue);
    }
};

if(process.argv[2] === 'is_child') {
  // set the receiver message
  process.on('message',function(msg) {
      RDFStoreChild.receive(msg);
  });
}

