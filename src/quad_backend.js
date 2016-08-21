
// imports
var QuadIndex = require("./quad_index").QuadIndex;
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
            if (utils.include(indexKey, indexComponents[j]) === false) {
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
    utils.eachSeries(this.indices, function (indexKey, k) {
        var index = that.indexMap[indexKey];
        index.insert(quad, function () {
            k();
        })
    }, function () {
        callback(true);
    });
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
    utils.eachSeries(this.indices, function (indexKey, k) {
        var index = that.indexMap[indexKey];
        index.delete(quad, function () {
            k();
        });
    }, function () {
        callback(true);
    });
};

QuadBackend.prototype.clear = function(callback) {
    var that = this;
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
};

module.exports.QuadBackend = QuadBackend;
