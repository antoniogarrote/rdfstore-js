var async = require('async');
var Tree = require('./btree').Tree;
var utils = require('./utils');

/**
 * Temporal implementation of the lexicon
 */


Lexicon = function(callback){
    var that = this;

    utils.registerIndexedDB(that);

    this.defaultGraphOid = 0;
    this.defaultGraphUri = "https://github.com/antoniogarrote/rdfstore-js#default_graph";
    this.defaultGraphUriTerm = {"token":"uri","prefix":null,"suffix":null,"value":this.defaultGraphUri};
    this.oidCounter = 1;

    that.dbName = configuration['dbName'] || "rdfstorejs";
    var request = that.indexedDB.open(this.dbName, 1);
    request.onerror = function(event) {
        callback(null,new Error("Error opening IndexedDB: " + event.target.errorCode));
    };
    request.onsuccess = function(event) {
        that.db = event.target.result;
        callback(that);
    };
    request.onupgradeneeded = function(event) {
        var db = event.target.result;
        // graphs
        db.createObjectStore('knownGraphs', { keyPath: 'oid'});
        // uris mapping
        var urisStore = db.createObjectStore('uris', { autoIncrement : true });
        urisStore.createIndex("uri","uri",{unique: true});
        // blanks mapping
        var urisStore = db.createObjectStore('balnks', { autoIncrement : true });
        urisStore.createIndex("label","label",{unique: true});


        db.createObjectStore('literals', { keyPath: 'SPOG'});
        db.createObjectStore('oidLiterals', { keyPath: 'SPOG'});
        db.createObjectStore('oidBlanks', { keyPath: 'SPOG'});
        callback(that);
    };

};

/**
 * Registers a new graph in the lexicon list of known graphs.
 * @param oid
 * @param uriToken
 * @param callback
 */
Lexicon.prototype.registerGraph = function(oid, uriToken, callback){

    if(oid != this.defaultGraphOid) {
        that.db.transaction(['knownGraphs'], 'readwrite');
        transaction.oncomplete = function (event) {
            callback();
        };
        transaction.onerror = function (event) {
            callback(null, new Error(event.target.statusCode));
        };
        var objectStore = transaction.objectStore('knownGraphs');
        var request = objectStore.add({oid: oid, utiToken: uriToken});
        request.onsuccess = function (event) {
            callback(true);
        };
    } else {
        callback();
    }
};

/**
 * Returns the list of known graphs OIDs or URIs.
 * @param returnUris
 * @param callback
 */
Lexicon.prototype.registeredGraphs = function(returnUris, callback) {
    var graphs = [];
    var objectStore = that.db.transaction(['knownGraphs'],'readwrite').objectStore("customers");

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
        callback(null,new Error("Error retrieving adta from the cursor: " + event.target.errorCode));
    };
};

/**
 * Registers a URI in the lexicon. It returns the allocated OID for the URI.
 * As a side effect it increases the cost counter for that URI if it is already registered.
 * @param uri
 * @param callback
 * @returns URI's OID.
 */
Lexicon.prototype.registerUri = function(uri, callback) {
    var that = this;
    if(uri === this.defaultGraphUri) {
        callback(this.defaultGraphOid);
    } else{
        var objectStore = that.db.transaction(["uris"],"readwrite").objectStore("uris");
        var request = objectStore.index("uri").get(uri);
        request.onsuccess = function(event) {
            var uriData = event.target.result;
            if(uriData) {
                // found in index -> update
                uriData.counter++;
                var oid = "u" + uriData.id;
                var requestUpdate = objectStore.put(uriData);
                requestUpdate.onsuccess(function (event) {
                    callback(oid);
                });
                requestUpdate.onerror(function (event) {
                    callback(null, new Error("Error updating the URI data" + event.targe.errorCode));
                });
            } else {
                // not found -> create
                var requestAdd = objectStore.add({uri: uri, counter:0});
                requestAdd.onsuccess((function(event){
                    callback("u"+event.target.result);
                }));
                requestAdd.onerror(function(event){
                    callback(null, new Error("Error inserting the URI data"+event.targe.errorCode));
                });
            }
        };
        request.onerror = function(event) {
            callback(null, new Error("Error retrieving the URI data"+event.targe.errorCode));
        };
    }
};

/**
 * Returns the OID associated to the URI.
 * If the URI hasn't been  associated in the lexicon, -1 is returned.
 * @param uri
 * @param callback
 */
Lexicon.prototype.resolveUri = function(uri,callback) {
    if(uri === this.defaultGraphUri) {
        callback(this.defaultGraphOid);
    } else {
        var objectStore = that.db.transaction(["uris"]).objectStore("uris");
        var request = objectStore.index("uri").get(uri);
        request.onsuccess = function(event) {
            if(event.target.result != null)
                callback("u"+event.target.result.id);
            else
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
Lexicon.prototype.resolveUriCost = function(uri, callback) {
    if(uri === this.defaultGraphUri) {
        callback(0);
    } else {
        var objectStore = that.db.transaction(["uris"]).objectStore("uris");
        var request = objectStore.index("uri").get(uri);
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
Lexicon.prototype.registerBlank = function(callback) {
    var oidStr = guid();
    var that = this;

    var objectStore = that.db.transaction(["blanks"],"readwrite").objectStore("blanks");
    var requestAdd = objectStore.add({label: oidStr, counter:0});
    requestAdd.onsuccess((function(event){
        callback(event.target.result);
    }));
    requestAdd.onerror(function(event){
        callback(null, new Error("Error inserting the URI data"+event.targe.errorCode));
    });
    request.onerror = function(event) {
        callback(null, new Error("Error retrieving the URI data"+event.targe.errorCode));
    };
};

/**
 * Resolves a blank node OID
 * @param oid
 * @param callback
 */
//Lexicon.prototype.resolveBlank = function(oid,callback) {
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
Lexicon.prototype.resolveBlankCost = function(label, callback) {
    callback(0);
};

/**
 * Registers a new literal in the index.
 * @param literal
 * @param callback
 * @returns the OID of the newly registered literal
 */
Lexicon.prototype.registerLiteral = function(literal, callback) {
    var that = this;

        this.literals.search(literal, function(oidData){
            if(oidData == null){
                var oid = that.oidCounter;
                var oidStr = 'l'+oid;
                that.oidCounter++;

                async.seq(function(k){
                    that.literals.insert(literal, [oid,0], function(){
                        k();
                    })
                }, function(k){
                    that.oidLiterals.insert(oidStr, literal, function(){
                        k();
                    })
                })(function(){
                    callback(oid);
                });

            } else {
                var oid = oidData[0];
                var counter = oidData[1] + 1;
                that.literals.insert(literal, [oid,counter], function(){
                    callback(oid);
                });
            }
        });
};

/**
 * Returns the OID of the resolved literal or -1 if no literal is found.
 * @param literal
 * @param callback
 */
Lexicon.prototype.resolveLiteral = function (literal,callback) {
    this.literals.search(literal, function(oidData){
        if(oidData != null) {
            callback(oidData[0]);
        } else {
            callback(-1);
        }
    });
};

/**
 * Returns the cost associated to the literal or -1 if no literal is found.
 * @param literal
 * @param callback
 */
Lexicon.prototype.resolveLiteralCost = function (literal,callback) {
    this.literals.search(literal, function(oidData){
        if(oidData != null) {
            callback(oidData[1]);
        } else {
            callback(-1);
        }
    });
};


/**
 * Transforms a literal string into a token object.
 * @param literalString
 * @returns A token object with the parsed literal.
 */
Lexicon.prototype.parseLiteral = function(literalString) {
    var parts = literalString.lastIndexOf("@");
    if(parts!=-1 && literalString[parts-1]==='"' && literalString.substring(parts, literalString.length).match(/^@[a-zA-Z\-]+$/g)!=null) {
        var value = literalString.substring(1,parts-1);
        var lang = literalString.substring(parts+1, literalString.length);
        return {token: "literal", value:value, lang:lang};
    }

    var parts = literalString.lastIndexOf("^^");
    if(parts!=-1 && literalString[parts-1]==='"' && literalString[parts+2] === '<' && literalString[literalString.length-1] === '>') {
        var value = literalString.substring(1,parts-1);
        var type = literalString.substring(parts+3, literalString.length-1);

        return {token: "literal", value:value, type:type};
    }

    var value = literalString.substring(1,literalString.length-1);
    return {token:"literal", value:value};
};

/**
 * Parses a literal URI string into a token object
 * @param uriString
 * @returns A token object with the parsed URI.
 */
Lexicon.prototype.parseUri = function(uriString) {
    return {token: "uri", value:uriString};
};

/**
 * Retrieves a token containing the URI, literal or blank node associated
 * to the provided OID.
 * If no value is found, null is returned.
 * @param oid
 * @param callback
 * @returns parsed token or null if not found.
 */
Lexicon.prototype.retrieve = function(oid, callback) {
    var that = this;

    if(oid === this.defaultGraphOid) {
        callback({
            token: "uri",
            value:this.defaultGraphUri,
            prefix: null,
            suffix: null,
            defaultGraph: true
        });
    } else {

        async.seq(function(found,k){
            that.oidUris.search('u'+oid, function(maybeUri) {
                if(maybeUri != null) {
                    k(null,that.parseUri(maybeUri));
                } else {
                    k(null,null);
                }
            })
        }, function(found,k){
            if(found == null) {
                that.oidLiterals.search('l'+oid, function(maybeLiteral) {
                    if (maybeLiteral != null) {
                        k(null,that.parseLiteral(maybeLiteral));
                    } else {
                        k(null,null);
                    }
                });
            } else {
                k(null,found);
            }
        }, function(found,k){
            if(found == null) {
                that.oidBlanks.search(''+oid, function(maybeBlank) {
                    if (maybeBlank != null) {
                        k(null,{token:"blank", value:"_:"+oid});
                    } else {
                        k(null,null);
                    }
                });
            } else {
                k(null,found);
            }
        })(null,function(_,found){
            callback(found);
        });
    }
};

/**
 * Empties the lexicon and restarts the counters.
 * @param callback
 */
Lexicon.prototype.clear = function(callback) {
    var that = this;
    this.defaultGraphOid = 0;
    this.defaultGraphUri = "https://github.com/antoniogarrote/rdfstore-js#default_graph";
    this.defaultGraphUriTerm = {"token":"uri","prefix":null,"suffix":null,"value":this.defaultGraphUri};
    this.oidCounter = 1;

    async.seq(function(k){
        new Tree(2,function(tree){
            that.uris = tree;
            k();
        })
    }, function(k){
        new Tree(2, function(tree){
            that.literals = tree;
            k();
        })
    }, function(k){
        new Tree(2, function(tree){
            that.knownGraphs = tree;
            k();
        })
    },function(k){
        new Tree(2,function(tree){
            that.oidUris = tree;
            k();
        })
    }, function(k){
        new Tree(2, function(tree){
            that.oidLiterals = tree;
            k();
        })
    }, function(k){
        new Tree(2, function(tree){
            that.oidBlanks = tree;
            k();
        })
    })(function(){
        if(callback != null)
            callback();

    });
};

/**
 * Removes the values associated to the subject, predicate, object and graph
 * values of the provided quad.
 * @param quad
 * @param key
 * @param callback
 */
Lexicon.prototype.unregister = function (quad, key, callback) {
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
Lexicon.prototype._unregisterTerm = function (kind, oid, callback) {
    var that = this;
    if (kind === 'uri') {
        if (oid != this.defaultGraphOid) {
            var oidStr = 'u' + oid;
            that.oidUris.search(oidStr, function(uri) {
                that.uris.search(uri, function(oidData){
                    var counter = oidData[1];
                    if ("" + oidData[0] === "" + oid) {
                        if (counter === 0) {
                            async.seq(function(k) {
                                that.oidUris.delete(oidStr, function () {
                                    k();
                                });
                            }, function(k){
                                that.uris.delete(uri, function(){
                                    k();
                                });
                            }, function(k){
                                // delete the graph oid from known graphs
                                // in case this URI is a graph identifier
                                that.knownGraphs.delete(oid, function(){
                                   k();
                                }) ;
                            })(function(){
                                callback();
                            })
                        } else {
                            that.uris.insert(uri,[oid, counter - 1], function(){
                                callback();
                            });
                        }
                    } else {
                        callback();
                    }
                });
            });

        } else {
            callback();
        }
    } else if (kind === 'literal') {
        this.oidCounter++;
        var oidStr = 'l' + oid;

        that.oidLiterals.search(oidStr, function(literal) {
            that.literals.search(literal, function(oidData){
                var counter = oidData[1];
                if ("" + oidData[0] === "" + oid) {
                    if (counter === 0) {
                        async.seq(function(k) {
                            that.oidLiterals.delete(oidStr, function () {
                                k();
                            });
                        }, function(k){
                            that.literals.delete(literal, function(){
                                k();
                            });
                        })(function(){
                            callback();
                        })
                    } else {
                        that.literals.insert(literal,[oid, counter - 1], function(){
                            callback();
                        });
                    }
                } else {
                    callback();
                }
            });
        });

    } else if (kind === 'blank') {
        that.oidBlanks.delete("" + oid, function(){
            callback();
        })
    } else {
        callback();
    }
};

module.exports = {
    Lexicon: Lexicon
};