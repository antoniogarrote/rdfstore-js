
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
 * @param configuration['dbName'] Name for the IndexedDB
 * @return The newly created backend.
 */
QuadBackend = function (configuration, callback) {
    var that = this;

    if (arguments !== 0) {

        if(typeof(window) === 'undefined') {
            var sqlite3 = require('sqlite3')
            var indexeddbjs = require("indexeddb-js");
            var engine    = new sqlite3.Database(':memory:');
            var scope     = indexeddbjs.makeScope('sqlite3', engine);
            that.indexedDB = scope.indexedDB;
            that.IDBKeyRange = scope.IDBKeyRange;
        } else {
            // In the following line, you should include the prefixes of implementations you want to test.
            window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
            window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
            // DON'T use "var indexedDB = ..." if you're not in a function.
            // Moreover, you may need references to some window.IDB* objects:
            if (!window.indexedDB) {
                callback(null,new Error("The browser does not support IndexDB."));
            } else {
                that.indexedDB = window.indexedDB;
                that.IDBKeyRange = window.IDBKeyRange;
            }
        }

        this.indexMap = {};
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
            var objectStore = db.createObjectStore(that.dbName, { keyPath: 'SPOG'});
            _.each(that.indices, function(index){
                if(index !== 'SPOG') {
                    objectStore.createIndex(index,index,{unique: false});
                }
            });
        };
    }
};


QuadBackend.prototype.index = function (quad, callback) {
    var that = this;
    _.each(this.indices, function(index){
        quad[index] = that._genMinIndexKey(quad, index);
    });

    var transaction = that.db.transaction([that.dbName],"readwrite");
    transaction.oncomplete = function(event) {
        //callback(true)
    };
    transaction.onerror = function(event) {
        callback(null, new Error(event.target.statusCode));
    };
    var objectStore = transaction.objectStore(that.dbName);
    var request = objectStore.add(quad);
    request.onsuccess = function(event) {
        // event.target.result == customerData[i].ssn;
        callback(true)
    };
};

QuadBackend.prototype.range = function (pattern, callback) {
    var that = this;
    var objectStore = that.db.transaction([that.dbName]).objectStore(that.dbName);
    var indexKey = this._indexForPattern(pattern);
    var minIndexKeyValue = this._genMinIndexKey(pattern,indexKey);
    var maxIndexKeyValue = this._genMaxIndexKey(pattern,indexKey);
    var keyRange = that.IDBKeyRange.bound(minIndexKeyValue, maxIndexKeyValue, false, false);
    var quads = [];
    var cursorSource;

    if(indexKey === 'SPOG') {
        cursorSource = objectStore;
    } else {
        cursorSource = objectStore.index(indexKey);
    }

    cursorSource.openCursor(keyRange).onsuccess = function(event) {
        var cursor = event.target.result;
        if (cursor) {
            quads.push(cursor.value);
            cursor.continue();
        } else {
            callback(quads);
        }
    }
};

QuadBackend.prototype.search = function (quad, callback) {
    var objectStore = that.db.transaction([this.dbName]).objectStore(that.dbName);
    var indexKey = that._genMinIndexKey(quad, 'SPOG');
    var request = objectStore.get(indexKey);
    request.onerror = function(event) {
        callback(null, new Error(event.target.statusCode));
    };
    request.onsuccess = function(event) {
        callback(event.target.result != null);
    };
};


QuadBackend.prototype.delete = function (quad, callback) {
    var that = this;
    var indexKey = that._genMinIndexKey(quad, 'SPOG');
    var request = that.db.transaction([that.dbName], "readwrite")
        .objectStore(that.dbName)
        .delete(indexKey);
    request.onsuccess = function() {
        callback(true);
    };
    request.onerror = function(event) {
        callback(null, new Error(event.target.statusCode));
    };
};

QuadBackend.prototype._genMinIndexKey = function(quad,index) {
    var indexComponents = this.componentOrders[index];
    return _.map(indexComponents, function(component){
        if(typeof(quad[component]) === 'string' || quad[component] == null) {
            return "-1";
        } else {
            return ""+quad[component];
        }
    }).join('.');
};

QuadBackend.prototype._genMaxIndexKey = function(quad,index) {
    var indexComponents = this.componentOrders[index];
    var acum = [];
    var foundFirstMissing = false;
    for(var i=0; i<indexComponents.length; i++){
        var component = indexComponents[i];
        var componentValue= quad[component];
        if(typeof(componentValue) === 'string') {
            if (foundFirstMissing === false) {
                    foundFirstMissing = true;
                if (i - 1 >= 0) {
                    acum[i - 1] = acum[i - 1] + 1
                }
            }
            acum[i] = -1;
        } else {
            acum[i] = componentValue;
        }
    }
    return _.map(acum, function(componentValue){
        return ""+componentValue
    }).join('.');
};


QuadBackend.prototype._indexForPattern = function (pattern) {
    var indexKey = pattern.indexKey;

    for (var i = 0; i < this.indices.length; i++) {
        var index = this.indices[i];
        var indexComponents = this.componentOrders[index];
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


module.exports.QuadBackend = QuadBackend;