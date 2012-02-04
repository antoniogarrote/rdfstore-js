// exports
exports.QuadBackend = {};
var QuadBackend = exports.QuadBackend;


// imports
var Utils = require("./../../js-trees/src/utils").Utils;
var QuadIndexCommon = require("./quad_index_common").QuadIndexCommon;
var QuadIndex = require("./quad_index").QuadIndex;


/*
 * "perfect" indices for RDF indexing
 *
 * SPOG (?, ?, ?, ?), (s, ?, ?, ?), (s, p, ?, ?), (s, p, o, ?), (s, p, o, g)
 * GP   (?, ?, ?, g), (?, p, ?, g)
 * OGS  (?, ?, o, ?), (?, ?, o, g), (s, ?, o, g)
 * POG  (?, p, ?, ?), (?, p, o, ?), (?, p, o, g)
 * GSP  (s, ?, ?, g), (s, p, ?, g)
 * OS   (s, ?, o, ?)
 */
QuadBackend.QuadBackend = function (configuration, callback) {
    if (arguments != 0) {
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

        for (var i = 0; i < this.indices.length; i++) {
            var indexKey = this.indices[i];
            this.indexMap[indexKey] = new QuadIndex.Tree({order:this.treeOrder,
                componentOrder:this.componentOrders[indexKey],
                persistent:configuration['persistent'],
                name:(configuration['name'] || "") + indexKey,
                cacheMaxSize:configuration['cacheMaxSize']});
        }

        if (callback)
            callback(this);
    }
};

QuadBackend.QuadBackend.prototype.clear = function() {
        for(var i=0; i<this.indices.length; i++) {
            var indexKey = this.indices[i];
            this.indexMap[indexKey].clear();
        }
};

QuadBackend.QuadBackend.prototype._indexForPattern = function (pattern) {
    var indexKey = pattern.indexKey;
    var matchingIndices = this.indices;

    for (var i = 0; i < matchingIndices.length; i++) {
        var index = matchingIndices[i];
        var indexComponents = this.componentOrders[index];
        for (var j = 0; j < indexComponents.length; j++) {
            if (Utils.include(indexKey, indexComponents[j]) === false) {
                break;
            }
            if (j == indexKey.length - 1) {
                return index;
            }
        }
    }

    return 'SPOG'; // If no other match, we erturn the more generic index
};


QuadBackend.QuadBackend.prototype.index = function (quad, callback) {
    for (var i = 0; i < this.indices.length; i++) {
        var indexKey = this.indices[i];
        var index = this.indexMap[indexKey];

        index.insert(quad);
    }

    if (callback)
        callback(true);

    return true;
};

QuadBackend.QuadBackend.prototype.range = function (pattern, callback) {
    var indexKey = this._indexForPattern(pattern);
    var index = this.indexMap[indexKey];
    var quads = index.range(pattern);
    if (callback)
        callback(quads);

    return quads;
};

QuadBackend.QuadBackend.prototype.search = function (quad, callback) {
    var indexKey = this.indices[0];
    var index = this.indexMap[indexKey];
    var result = index.search(quad);

    if (callback)
        callback(result != null);

    return (result != null)
};


QuadBackend.QuadBackend.prototype.delete = function (quad, callback) {
    var indexKey, index;
    for (var i = 0; i < this.indices.length; i++) {
        indexKey = this.indices[i];
        index = this.indexMap[indexKey];

        index.delete(quad);
    }

    if (callback)
        callback(true);

    return true;
};
