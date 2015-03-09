
// imports
var async = require('async');
var _ = require('lodash');

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
    var that = this;

    if (arguments !== 0) {

        if(typeof(window) === 'undefined') {
            var indexeddbjs = require("indexeddb-js");
            var indexEngine    = new sqlite3.Database(':memory:');
            that.indexedDB = new indexeddbjs.indexedDB('sqlite3', indexEngine);
        } else {
            // In the following line, you should include the prefixes of implementations you want to test.
            window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
            // DON'T use "var indexedDB = ..." if you're not in a function.
            // Moreover, you may need references to some window.IDB* objects:
            if (!window.indexedDB) {
                callback(null,new Error("The browser does not support IndexDB."));
            } else {
                that.indexedDB = window.indexedDB;
            }
        }

        this.indexMap = {};
        this.treeOrder = configuration['treeOrder'];
        this.indices = ['SPOG', 'GP', 'OGS', 'POG', 'GSP', 'OS'];
        this.componentOrders = {
            SPOG:['subject', 'predicate', 'object', 'graph'],
            GP:['graph', 'predicate', 'subject', 'object'],
            OGS:['object', 'graph', 'subject', 'predicate'],
            POG:['predicate', 'object', 'graph', 'subject'],
            GSP:['graph', 'subject', 'predicate', 'object'],
            OS:['object', 'subject', 'predicate', 'graph']
        };

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
            db.createObjectStore(index, { keyPath: 'SPOG'});
            _.each(that.indices, function(index){
                if(index !== 'SPOG') {
                    db.createIndex(index,index,{unique: false});
                }
            });
        };
    }
};

QuadBackend.prototype._genIndexKey = function(quad,index) {
    return _.map(indexComponents, function(component){
        return ""+(quad[component] || -1);
    }).join('.');
};

QuadBackend.prototype.index = function (quad, callback) {
    var that = this;
    _.each(this.indices, function(index){
        quad[index] = that._genIndexKey(quad, that.componentOrders[index]);
    });

    var transaction = that.db.transaction([that.dbName],"write");
    transaction.oncomplete = function(event) {
        callback(true)
    };
    transaction.onerror = function(event) {
        callback(null, new Error(event.target.statusCode));
    };
    var objectStore = transaction.objectStore(that.dbName);
    objectStore.add(quad);
};

QuadBackend.prototype.range = function (pattern, callback) {
    var indexKey = this._indexForPattern(pattern);
    var index = this.indexMap[indexKey];
    index.range(pattern, function (quads) {
        callback(quads);
    });
};

QuadBackend.prototype.search = function (quad, callback) {
    var index = this.indexMap['SPOG'];

    index.search(quad, function (result) {
        callback(result != null);
    });
};


QuadBackend.prototype.delete = function (quad, callback) {
    var that = this;

    async.eachSeries(this.indices, function(indexKey,k){
        var index = that.indexMap[indexKey];
        index.delete(quad, function(){
            k();
        })
    },function(){
        callback(that);
    });
};

module.exports.QuadBackend = QuadBackend;