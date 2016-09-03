var Tree = require('./btree').Tree;
var utils = require('./utils');
var async = utils;
var InMemoryLexicon = require('./lexicon').Lexicon;

/**
 * Temporal implementation of the lexicon
 */


PersistentLexicon = function(callback, dbName){
    var that = this;

    utils.registerIndexedDB(that);

    this.defaultGraphOid = 0;
    this.defaultGraphUri = "https://github.com/antoniogarrote/rdfstore-js#default_graph";
    this.defaultGraphUriTerm = {"token":"uri","prefix":null,"suffix":null,"value":this.defaultGraphUri};
    this.oidCounter = 1;

    that.dbName = dbName || "rdfstorejs";
    var request = that.indexedDB.open(this.dbName+"_lexicon", 1);
    request.onerror = function(event) {
        callback(null,new Error("Error opening IndexedDB: " + event.target.errorCode));
    };
    request.onsuccess = function(event) {
        that.db = event.target.result;
        callback(that);
    };
    request.onupgradeneeded = function(event) {
        that.db = event.target.result;

        // graphs
        var graphStore = that.db.createObjectStore('knownGraphs', { keyPath: 'oid'});
        graphStore.createIndex("uriToken","uriToken",{unique: true});
        // uris,literal,blanks mapping
        var uriStore = that.db.createObjectStore('components', { keyPath: 'id', autoIncrement : true });
        uriStore.createIndex("value","value",{unique: true});

        //setTimeout(function(){ callback(that); },0);
    };

};

/**
 * Registers a new graph in the lexicon list of known graphs.
 * @param oid
 * @param uriToken
 * @param callback
 */
PersistentLexicon.prototype.registerGraph = function(oid, uriToken, callback){
    if(oid != this.defaultGraphOid) {
        var transaction = this.db.transaction(['knownGraphs'], 'readwrite');
        transaction.onerror = function (event) {
            callback(null, new Error(event.target.statusCode));
        };
        var objectStore = transaction.objectStore('knownGraphs');
        var request = objectStore.get(uriToken)
        request.onsuccess = function(event) {
            var graphData = event.target.result;
            if(graphData) {
                // found graph -> return
                callback(true)
            } else {
                var request = objectStore.add({oid: oid, uriToken: uriToken});
                request.onsuccess = function (_) {
                    callback(true);
                };
            }
        }
    } else {
        callback();
    }
};

/**
 * Returns the list of known graphs OIDs or URIs.
 * @param returnUris
 * @param callback
 */
PersistentLexicon.prototype.registeredGraphs = function(returnUris, callback) {
    var graphs = [];
    var objectStore = this.db.transaction(['knownGraphs'],'readwrite').objectStore("knownGraphs");

    var request = objectStore.openCursor();
    request.onsuccess = function(event) {
        var cursor = event.target.result;
        if(cursor) {
            if(returnUris === true) {
                graphs.push(cursor.value.uriToken);
            } else {
                graphs.push(cursor.value.oid);
            }
            cursor.continue();
        } else {
            callback(graphs);
        }
    };
    request.onerror = function(event) {
        callback(null,new Error("Error retrieving data from the cursor: " + event.target.errorCode));
    };
};

/**
 * Registers a URI in the lexicon. It returns the allocated OID for the URI.
 * As a side effect it increases the cost counter for that URI if it is already registered.
 * @param uri
 * @param callback
 * @returns URI's OID.
 */
PersistentLexicon.prototype.registerUri = function(uri, callback) {
    var that = this;
    if(uri === this.defaultGraphUri) {
        callback(this.defaultGraphOid);
    } else{
        var objectStore = that.db.transaction(["components"],"readwrite").objectStore("components");
        var request = objectStore.index("value").get("_u:"+uri);
        request.onsuccess = function(event) {
            var uriData = event.target.result;
            if(uriData) {
                // found in index -> update
                uriData.counter++;
                var oid = uriData.id;
                var requestUpdate = objectStore.put(uriData);
                requestUpdate.onsuccess =function (_) {
                    callback(oid);
                };
                requestUpdate.onerror = function (event) {
                    callback(null, new Error("Error updating the URI data" + event.target.errorCode));
                };
            } else {
                // not found -> create
                var requestAdd = objectStore.add({value: "_u:"+uri, counter:0, uri:true});
                requestAdd.onsuccess = function(event){
                    callback(event.target.result);
                };
                requestAdd.onerror = function(event){
                    callback(null, new Error("Error inserting the URI data"+event.target.errorCode));
                };
            }
        };
        request.onerror = function(event) {
            callback(null, new Error("Error retrieving the URI data"+event.target.errorCode));
        };
    }
};

/**
 * Returns the OID associated to the URI.
 * If the URI hasn't been  associated in the lexicon, -1 is returned.
 * @param uri
 * @param callback
 */
PersistentLexicon.prototype.resolveUri = function(uri,callback) {
    if(uri === this.defaultGraphUri) {
        callback(this.defaultGraphOid);
    } else {
        var objectStore = this.db.transaction(["components"]).objectStore("components");
        var request = objectStore.index("value").get("_u:"+uri);
        request.onsuccess = function(event) {
            if(event.target.result != null) {
                callback(event.target.result.id);
            } else
                callback(-1);
        };
        request.onerror = function(event) {
            callback(null, new Error("Error retrieving uri data "+event.target.errorCode));
        }
    }
};

/**
 * Returns the cost associated to the URI.
 * If the URI hasn't been associated in the lexicon, -1 is returned.
 * @param uri
 * @returns {*}
 */
PersistentLexicon.prototype.resolveUriCost = function(uri, callback) {
    if(uri === this.defaultGraphUri) {
        callback(0);
    } else {
        var objectStore = that.db.transaction(["components"]).objectStore("components");
        var request = objectStore.index("value").get("_u:"+uri);
        request.onsuccess = function(event) {
            if(event.target.result != null)
                callback(event.target.result.cost);
            else
                callback(-1);
        };
        request.onerror = function(event) {
            callback(null, new Error("Error retrieving uri data "+event.target.errorCode));
        };
    }
};

/**
 * Register a new blank node in the lexicon.
 * @param label
 * @returns {string}
 */
PersistentLexicon.prototype.registerBlank = function(callback) {
    var oidStr = guid();
    var that = this;

    var objectStore = that.db.transaction(["components"],"readwrite").objectStore("components");
    var requestAdd = objectStore.add({value: "_b:"+oidStr, counter:0, label:true});
    requestAdd.onsuccess = function(event){
        callback(event.target.result);
    };
    requestAdd.onerror = function(event){
        callback(null, new Error("Error inserting the URI data"+event.target.errorCode));
    };
};

/**
 * Resolves a blank node OID
 * @param oid
 * @param callback
 */
//PersistentLexicon.prototype.resolveBlank = function(oid,callback) {
//    var that = this;
//    var objectStore = that.db.transaction(["blanks"]).objectStore("blanks");
//    var request = objectStore.get(oid);
//    request.onsuccess = function(event) {
//        if(event.target.result != null)
//            callback(event.target.result.id);
//        else {
//            // we register it if it doesn't exist
//        }
//    };
//    request.onerror = function(event) {
//        callback(null, new Error("Error retrieving blank data "+event.target.errorCode));
//    }
//
//    this.oidBlanks.search(label, function(oidData){
//        if(oidData != null) {
//            callback(oidData);
//        } else {
//            // ??
//            var oid = that.oidCounter;
//            this.oidCounter++;
//            callback(""+oid);
//            //
//        }
//    });
//};

/**
 * Blank nodes don't have an associated cost.
 * @param label
 * @param callback
 * @returns {number}
 */
PersistentLexicon.prototype.resolveBlankCost = function(label, callback) {
    callback(0);
};

/**
 * Registers a new literal in the index.
 * @param literal
 * @param callback
 * @returns the OID of the newly registered literal
 */
PersistentLexicon.prototype.registerLiteral = function(literal, callback) {
    var that = this;

    var objectStore = that.db.transaction(["components"],"readwrite").objectStore("components");
    var request = objectStore.index("value").get("_l:"+literal);
    request.onsuccess = function(event) {
        var literalData = event.target.result;
        if(literalData) {
            // found in index -> update
            literalData.counter++;
            var oid = literalData.id;
            var requestUpdate = objectStore.put(literalData);
            requestUpdate.onsuccess =function (event) {
                callback(oid);
            };
            requestUpdate.onerror = function (event) {
                callback(null, new Error("Error updating the literal data" + event.target.errorCode));
            };
        } else {
            // not found -> create
            var requestAdd = objectStore.add({value: "_l:"+literal, counter:0, literal:true});
            requestAdd.onsuccess = function(event){
                callback(event.target.result);
            };
            requestAdd.onerror =function(event){
                callback(null, new Error("Error inserting the literal data"+event.target.errorCode));
            };
        }
    };
    request.onerror = function(event) {
        callback(null, new Error("Error retrieving the literal data"+event.target.errorCode));
    };
};

/**
 * Returns the OID of the resolved literal or -1 if no literal is found.
 * @param literal
 * @param callback
 */
PersistentLexicon.prototype.resolveLiteral = function (literal,callback) {
    var objectStore = that.db.transaction(["components"]).objectStore("components");
    var request = objectStore.index("value").get("_l:"+literal);
    request.onsuccess = function(event) {
        if(event.target.result != null) {
            callback(event.target.result.id);
        } else
            callback(-1);
    };
    request.onerror = function(event) {
        callback(null, new Error("Error retrieving literal data "+event.target.errorCode));
    }
};

/**
 * Returns the cost associated to the literal or -1 if no literal is found.
 * @param literal
 * @param callback
 */
PersistentLexicon.prototype.resolveLiteralCost = function (literal,callback) {
    var objectStore = that.db.transaction(["components"]).objectStore("components");
    var request = objectStore.index("components").get(literal);
    request.onsuccess = function(event) {
        if(event.target.result != null)
            callback(event.target.result.cost);
        else
            callback(-1);
    };
    request.onerror = function(event) {
        callback(null, new Error("Error retrieving literal data "+event.target.errorCode));
    };
};


/**
 * Transforms a literal string into a token object.
 * @param literalString
 * @returns A token object with the parsed literal.
 */
PersistentLexicon.prototype.parseLiteral = function(literalString) {
    return InMemoryLexicon.prototype.parseLiteral(literalString);
};

/**
 * Parses a literal URI string into a token object
 * @param uriString
 * @returns A token object with the parsed URI.
 */
PersistentLexicon.prototype.parseUri = function(uriString) {
    return InMemoryLexicon.prototype.parseUri(uriString);
};

/**
 * Retrieves a token containing the URI, literal or blank node associated
 * to the provided OID.
 * If no value is found, null is returned.
 * @param oid
 * @param callback
 * @returns parsed token or null if not found.
 */
PersistentLexicon.prototype.retrieve = function(oid, callback) {
    var that = this, transaction, request;

    if(oid === this.defaultGraphOid) {
        callback({
            token: "uri",
            value:this.defaultGraphUri,
            prefix: null,
            suffix: null,
            defaultGraph: true
        });
    } else {
        transaction = that.db.transaction(["components"]);
        request = transaction.objectStore("components").get(oid);
        request.onsuccess = function(event) {
            if(event.target.result != null) {
                if(event.target.result.label != null) {
                    var label = "_:" + event.target.result.id;
                    callback({token: "blank", value: label});
                } else if(event.target.result.uri != null) {
                    callback(that.parseUri(event.target.result.value.slice(3,event.target.result.value.length)));
                } else if(event.target.result.literal != null) {
                    callback(that.parseLiteral(event.target.result.value.slice(3,event.target.result.value.length)));
                } else {
                    console.log(event.target.result);
                    callback(null,new Error("Unknown type of component "+event.target.result));
                }
            } else {
                callback(null,null);
            }
        };
        request.onerror = function(event) {
            callback(null, new Error("Error searching in blanks data "+event.target.errorCode));
        };
    }
};

/**
 * Empties the PersistentLexicon and restarts the counters.
 * @param callback
 */
PersistentLexicon.prototype.clear = function(callback) {
    var that = this;
    this.defaultGraphOid = 0;
    this.defaultGraphUri = "https://github.com/antoniogarrote/rdfstore-js#default_graph";
    this.defaultGraphUriTerm = {"token":"uri","prefix":null,"suffix":null,"value":this.defaultGraphUri};

    var transaction = that.db.transaction(["components"],"readwrite"), request;
    var components = transaction.objectStore("components");

    var k = function() {
        if(callback != null)
            callback();
    };

    request = components.clear();
    request.onsuccess = k;
    request.onerror = k;
};

/**
 * Removes the values associated to the subject, predicate, object and graph
 * values of the provided quad.
 * @param quad
 * @param key
 * @param callback
 */
PersistentLexicon.prototype.unregister = function (quad, key, callback) {
    var that = this;
    async.seq(function(k){
        that._unregisterTerm(quad.subject.token, key.subject,k);
    }, function(k){
        that._unregisterTerm(quad.predicate.token, key.predicate,k);
    }, function(k){
        that._unregisterTerm(quad.object.token, key.object, k);
    }, function(k){
        if (quad.graph != null) {
            that._unregisterTerm(quad.graph.token, key.graph, k);
        } else {
            k();
        }
    })(function(){
        callback(true);
    });
};

/**
 * Unregisters a value, either URI, literal or blank.
 * @param kind
 * @param oid
 * @param callback
 * @private
 */
PersistentLexicon.prototype._unregisterTerm = function (kind, oid, callback) {
    var that = this, request;
    var transaction = that.db.transaction(["components", "knownGraphs"],"readwrite");
    if (kind === 'uri') {
        if (oid != this.defaultGraphOid) {
            var removeKnownGraphs = function() {
                var request = transaction.objectStore("knownGraphs").delete(oid);
                request.onsuccess = function() { callback(); };
            };
            request = transaction.objectStore("components").delete(oid);
            request.onsuccess = removeKnownGraphs();
        } else {
            callback();
        }
    } else {
        request = transaction.objectStore("components").delete(oid);
        request.onsuccess = function() { callback(); };
    }
};

module.exports = {
    PersistentLexicon: PersistentLexicon
};
