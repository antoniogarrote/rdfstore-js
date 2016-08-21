
// imports
var QuadIndex = require("./quad_index").QuadIndex;
var utils = require('./utils');
var _ = require('./utils');

/*
 * "perfect" indices for RDF indexing
 *
 * SPOG (?, ?, ?, ?), (s, ?, ?, ?), (s, p, ?, ?), (s, p, o, ?), (s, p, o, g)
 * GP   (?, ?, ?, g), (?, p, ?, g)
 * OGS  (?, ?, o, ?), (?, ?, o, g), (s, ?, o, g)
 * POG  (?, p, ?, ?), (?, p, o, ?), (?, p, o, g)
 * GSP  (s, ?, ?, g), (s, p, ?, g)
 * OS   (s, ?, o, ?)
 *
 * @param configuration['treeOrder'] Tree order for the indices that are going to be created
 * @return The newly created backend.
 */
QuadBackend = function (configuration, callback) {
    this.indexMap = {};
    this.treeOrder = configuration['treeOrder'];
    this.indices = (configuration["index"] || QuadBackend.allIndices);
    this.componentOrders = QuadBackend.componentOrders;
    var that = this;

    utils.eachSeries(this.indices,function(indexKey, k){
        new QuadIndex({
            order:that.treeOrder,
            componentOrder:that.componentOrders[indexKey]
        },function (tree) {
            that.indexMap[indexKey] = tree;
            k();
        });
    },function(){
        callback(that);
    });
};

QuadBackend.allIndices = ['SPOG', 'GP', 'OGS', 'POG', 'GSP', 'OS'];
QuadBackend.componentOrders = {
    SPOG:['subject', 'predicate', 'object', 'graph'],
    GP:['graph', 'predicate', 'subject', 'object'],
    OGS:['object', 'graph', 'subject', 'predicate'],
    POG:['predicate', 'object', 'graph', 'subject'],
    GSP:['graph', 'subject', 'predicate', 'object'],
    OS:['object', 'subject', 'predicate', 'graph']
};


QuadBackend.prototype._indexForPattern = function (pattern) {
    var indexKey = pattern.indexKey;

    for (var i = 0; i < QuadBackend.allIndices.length; i++) {
        var index = QuadBackend.allIndices[i];
        var indexComponents = QuadBackend.componentOrders[index];
        for (var j = 0; j < indexComponents.length; j++) {
            if (_.include(indexKey, indexComponents[j]) === false) {
                break;
            }
            if (j == indexKey.length - 1) {
                return index;
            }
        }
    }

    return 'SPOG'; // If no other match, we return the more generic index
};


QuadBackend.prototype.index = function (quad, callback) {
    var that = this;
    if(this.indices.length === 1) {
        var indexKey = this.indices[0];
        var index = that.indexMap[indexKey];
        index.insert(quad, function () {
          callback(true);
        })
    } else {
        utils.eachSeries(this.indices, function (indexKey, k) {
            var index = that.indexMap[indexKey];
            index.insert(quad, function () {
                k();
            })
        }, function () {
            callback(true);
        });
    }
};

QuadBackend.prototype.range = function (pattern, callback) {
    var indexKey = this._indexForPattern(pattern);
    var index = this.indexMap[indexKey];
    if(index != null) {
        index.range(pattern, function (quads) {
            callback(quads);
        });
    }
};

QuadBackend.prototype.search = function (quad, callback) {
    var index = this.indexMap['SPOG'];
    if(index != null) {
        index.search(quad, function (result) {
            callback(result != null);
        });
    }
};


QuadBackend.prototype.delete = function (quad, callback) {
    var that = this;
    if(this.indices.length === 1) {
        var indexKey = this.indices[0];
        var index = this.indexMap[indexKey];
        index.delete(quad, function () {
            callback(true);
        });
    } else {
        utils.eachSeries(this.indices, function (indexKey, k) {
            var index = that.indexMap[indexKey];
            index.delete(quad, function () {
                k();
            });
        }, function () {
            callback(true);
        });
    }
};

QuadBackend.prototype.clear = function(callback) {
    var that = this;
    if(this.indices.length === 1) {
        var indexKey = this.indices[0];
        new QuadIndex({
            order: that.treeOrder,
            componentOrder: that.componentOrders[indexKey]
        }, function (tree) {
            that.indexMap[indexKey] = tree;
            callback(true);
        });
    } else {
        utils.eachSeries(this.indices, function (indexKey, k) {
            new QuadIndex({
                order: that.treeOrder,
                componentOrder: that.componentOrders[indexKey]
            }, function (tree) {
                that.indexMap[indexKey] = tree;
                k();
            });
        }, function () {
            callback(true);
        });
    }
};


QuadBackendWorker = function (configuration, callback) {
    var that = this;
    if(utils.isWorker()) {
        // register
        onmessage = function(request){
            try {
                var message = request.data;
                var id = message.id;
                var name = message.function;
                var args = message.args;
                if(name === 'init') {
                    new QuadBackend(args, function(backend){
                        that.backend = backend;
                        postMessage({"id": id, "result": true});
                    });
                } else {
                    args.push(function (res) {
                        postMessage({"id": id, "result": res});
                    });
                    that.backend[name].apply(that.backend, args);
                }
            } catch(e) {
                postMessage({"error": e.toString()});
            }
        };
    } else {
        if(typeof("window") !== "undefined" && window.Worker && configuration["workers"] === true) {
            // WebWorkers supported
            var rdfstoreFile = (configuration["worker_file"] || "rdfstore.js");
            this.requestId = 0;
            this.indices = ['SPOG', 'GP', 'OGS', 'POG', 'GSP', 'OS'];
            this.workers = {};
            this.mailbox = {};
            utils.eachParallel(this.indices, function(index, k){
                that.workers[index] = new Worker(rdfstoreFile);
                that.workers[index].onmessage = function(response){
                    var message = response.data;
                    if(typeof(message) === "string") {
                        throw(new Error(message));
                    }
                    if(message.error != null) {
                        throw new Error(message.error);
                    }
                    if(message.id != null && message.id == 0) {
                        k();
                    } else {
                        var cb = that.mailbox[message.id];
                        delete that.mailbox[message.id];
                        if (message.id != null && cb != null) {
                            cb(message.result);
                        } else {
                            throw(new Error("Cannot find callback for message with id:"+message.id));
                        }
                    }
                };
                configuration["index"] = [index];
                that.workers[index].postMessage({"id": 0, "function":"init", "args":configuration});
            }, function(){
                callback(that);
            })
        } else {
            new QuadBackend(configuration, function(backend){
                callback(backend);
            });
        }
    }
};

QuadBackendWorker.prototype.postMessage = function(index, name, args, cb) {
    if(this.requestId < (Number.MAX_SAFE_INTEGER || 1000000)) {
        this.requestId++;
    } else {
        this.requestId = 0;
    }
    var id = this.requestId;
    var message = {"id":id, "function":name, "args":args};
    this.mailbox[id] = cb;
    this.workers[index].postMessage(message);
};

QuadBackendWorker.prototype._indexForPattern = function (pattern) {
    return QuadBackend.prototype._indexForPattern(pattern);
};


QuadBackendWorker.prototype.index = function (quad, callback) {
    var that = this;
    if(utils.isWorker()) {
        this.backend(quad,callback);
    } else {
        if(typeof(window) !== "undefined" && window.Worker) {
            utils.eachParallel(this.indices, function(index, k){
                that.postMessage(index, "index", [quad], k);
            }, function(){
                callback(that);
            });
        } else {
            throw new Error("Invoking method of worker proxy in no supported env")
        }
    }
};

QuadBackendWorker.prototype.range = function (pattern, callback) {
    if(utils.isWorker()) {
        this.backend(quad,callback);
    } else {
        if(typeof(window) !== "undefined" && window.Worker) {
            var indexKey = this._indexForPattern(pattern);
            this.postMessage(indexKey, "range", [pattern], callback);
        } else {
            throw new Error("Invoking method of worker proxy in no supported env")
        }
    }
};

QuadBackendWorker.prototype.search = function (quad, callback) {
    if(utils.isWorker()) {
        this.backend(quad,callback);
    } else {
        if(typeof(window) !== "undefined" && window.Worker) {
            this.postMessage('SPOG', "search", [quad], callback);
        } else {
            throw new Error("Invoking method of worker proxy in no supported env")
        }
    }
};


QuadBackendWorker.prototype.delete = function (quad, callback) {
    var that = this;
    if(utils.isWorker()) {
        this.backend(quad,callback);
    } else {
        if(typeof(window) !== "undefined" && window.Worker) {
            utils.eachParallel(this.indices, function(index, k){
                that.postMessage(index, "delete", [quad], k);
            }, function(){
                callback(that);
            });
        } else {
            throw new Error("Invoking method of worker proxy in no supported env")
        }
    }
};

QuadBackendWorker.prototype.clear = function(callback) {
    var that = this;
    if(utils.isWorker()) {
        this.backend(quad,callback);
    } else {
        if(typeof(window) !== "undefined" && window.Worker) {
            utils.eachParallel(this.indices, function(index, k){
                that.postMessage(index, "clear", [], k);
            }, function(){
                callback(that);
            });
        } else {
            throw new Error("Invoking method of worker proxy in no supported env")
        }
    }
};

var BackendToExport;

if(utils.isWorker()) {
    BackendToExport = QuadBackendWorker;
} else {
    if(typeof(window) !== "undefined" && window.Worker) {
        BackendToExport = QuadBackendWorker;
    } else {
        BackendToExport = QuadBackend;
    }
}


module.exports.QuadBackend = BackendToExport;
