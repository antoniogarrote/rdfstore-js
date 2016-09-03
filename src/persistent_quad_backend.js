
// imports
var utils = require('./utils');

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
PersistentQuadBackend = function (configuration, callback) {
    var that = this;

    if (arguments !== 0) {

        utils.registerIndexedDB(that);

        this.indexMap = {};
        this.indices = ['S','P','O','G','SP','SO','SG','PO','PG','OG','SPO','SPG','SOG','POG','SPOG']
        this.componentOrders = {
            S: ['subject','predicate','object','graph'],
            P: ['predicate','subject','object','graph'],
            O: ['object','subject','predicate','graph'],
            G: ['graph','subject','predicate','object'],
            SP: ['subject','predicate','object','graph'],
            SO: ['subject', 'object','predicate','graph'],
            SG: ['subject', 'graph','predicate','object'],
            PO: ['predicate','object','subject','graph'],
            PG: ['predicate', 'graph','subject','object'],
            OG: ['object','graph','subject','predicate'],
            SPO: ['subject','predicate','object','graph'],
            SPG: ['subject', 'predicate', 'graph','object'],
            SOG: ['subject', 'object', 'graph','predicate'],
            POG: ['predicate', 'object', 'graph','subject'],
            SPOG: ['subject', 'predicate', 'object', 'graph']
        };
        this.componentOrdersMap  = {};
        for(var index in this.componentOrders) {
            var indexComponents = this.componentOrders[index];
            var key = indexComponents.slice(0,index.length).sort().join(".");
            this.componentOrdersMap[key] = index;
        }

        that.dbName = configuration['name'] || "rdfstorejs";
        var request = that.indexedDB.open(this.dbName+"_db", 1);
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
            utils.each(that.indices, function(index){
                if(index !== 'SPOG') {
                    objectStore.createIndex(index,index,{unique: false});
                }
            });
        };
    }
};


PersistentQuadBackend.prototype.index = function (quad, callback) {
    var that = this;
    utils.each(this.indices, function(index){
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
        callback(true)
    };
};

PersistentQuadBackend.prototype.range = function (pattern, callback) {
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

PersistentQuadBackend.prototype.search = function (quad, callback) {
    var that = this;
    var objectStore = that.db.transaction([that.dbName]).objectStore(that.dbName);
    var indexKey = this._genMinIndexKey(quad, 'SPOG');
    var request = objectStore.get(indexKey);
    request.onerror = function(event) {
        callback(null, new Error(event.target.statusCode));
    };
    request.onsuccess = function(event) {
        callback(event.target.result != null);
    };
};


PersistentQuadBackend.prototype.delete = function (quad, callback) {
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

PersistentQuadBackend.prototype._genMinIndexKey = function(quad,index) {
    var indexComponents = this.componentOrders[index];
    return utils.map(indexComponents, function(component){
        if(typeof(quad[component]) === 'string' || quad[component] == null) {
            return "0";
        } else {
            return quad[component];
        }
    }).join('.');
};

PersistentQuadBackend.prototype._genMaxIndexKey = function(quad,index) {
    var indexComponents = this.componentOrders[index];
    var acum = [];
    var foundFirstMissing = false;
    for(var i=0; i<indexComponents.length; i++){
        var component = indexComponents[i];
        var componentValue = quad[component];
        if(typeof(componentValue) === 'string') {
            acum[i] = 'z';
        } else {
            acum[i] = componentValue;
        }
    }
    return utils.map(acum, function(componentValue){
        return ""+componentValue
    }).join('.');
};


PersistentQuadBackend.prototype._indexForPattern = function (pattern) {
    var that = this;
    var indexKey = pattern.indexKey;
    var indexKeyString = indexKey.sort().join(".");
    var index = that.componentOrdersMap[indexKeyString];
    if(index == null) {
        throw new Error("Error, cannot find index for indexKey "+indexKeyString);
    } else {
        return index;
    }
};


PersistentQuadBackend.prototype.clear = function(callback) {
    var that = this;
    var transaction = that.db.transaction([that.dbName],"readwrite"), request;
    request = transaction.objectStore(that.dbName).clear();
    request.onsuccess = function(){ callback(); };
    request.onerror = function(){ callback(); };
};

module.exports.PersistentQuadBackend = PersistentQuadBackend;
