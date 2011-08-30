var sys = require('sys');

// imports
var RDFJSInterface = require(__dirname+"/./../../js-query-engine/src/rdf_js_interface.js").RDFJSInterface;
var Store = require(__dirname+"/./../../js-store/src/store").Store;


//// Checks if this is a webworker
//if(onmessage != null && postMessage != null) {
    
    RDFStoreWorker = {};

    RDFStoreWorker.handleCreate = function(args, cb) {
        console.log("in handling create");
        args.push(function(result){
            console.log("created!!!");
            // Stores the store object in the worker
            RDFStoreWorker.store = result;
            console.log("posting MESSAGE!");
            console.log(cb);

            postMessage({'callback':cb, 'result':'created', 'success':true});
        });
        console.log("creating");
        Store.create.apply(Store,args)
    };

    RDFStoreWorker.receive = function(packet) {
        var msg = packet.data || packet;
        console.log("RECEIVED...");
        console.log(msg);
        if(msg.fn === 'create' && msg.args !=null) {
            console.log("handling create");
            RDFStoreWorker.handleCreate(msg.args, msg.callback);
        } else if((msg.fn === 'execute' ||
                   msg.fn === 'executeWithEnvironment' ||
                   msg.fn === 'graph'||
                   msg.fn === 'node' ||
                   msg.fn === 'clear' ||
                   msg.fn === 'load') && msg.args != null) {
            msg.args.push(function(success, result){
                console.log("CALLBACK!");
                if(msg.callback!=null) {
                    postMessage({'callback':msg.callback, 'result':result, 'success':success});
                }
            });
            console.log(msg.args);
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
                    console.log("CALLBACK!");
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
                msg.args[0] = RDFStoreWorker.store.rdf.createGraph(toWrap.triples)
                console.log("ARGS...");
                console.log(msg.args);
                
                RDFStoreWorker.store[msg.fn].apply(RDFStoreWorker.store,msg.args);
            } catch(e) {
                console.log("Error executing method through connection");
                console.log(e);
            }
        } else if(msg.fn === 'rdf/setPrefix' && msg.args != null) {
            RDFStoreWorker.store.rdf.setPrefix(msg.args[0], msg.args[1]);
        } else if(msg.fn === 'rdf/setDefaultPrefix' && msg.args != null) {
            RDFStoreWorker.store.rdf.setDefaultPrefix(msg.args[0]);
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
    // set the receiver message
    sys.debug("setting handler");
    onmessage = RDFStoreWorker.receive;
//}
