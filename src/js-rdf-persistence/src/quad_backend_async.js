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
        var that = this;
        Utils.repeat(0, this.indices.length, function (k, e) {
            var indexKey = that.indices[e._i];
            var floop = arguments.callee;
            new QuadIndex.Tree({order:that.treeOrder,
                    componentOrder:that.componentOrders[indexKey]},
                function (tree) {
                    that.indexMap[indexKey] = tree;
                    k(floop, e);
                });
        }, function (e) {
            callback(that);
        });
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
    var that = this;

    Utils.repeat(0, this.indices.length, function (k, e) {
        var indexKey = that.indices[e._i];
        var index = that.indexMap[indexKey];
        var floop = arguments.callee;

        index.insert(quad, function (result) {
            k(floop, e);
        });
    }, function (e) {
        callback(true);
    });
};

QuadBackend.QuadBackend.prototype.range = function (pattern, callback) {
    var indexKey = this._indexForPattern(pattern);
    var index = this.indexMap[indexKey];
    index.range(pattern, function (quads) {
        callback(quads);
    });
};

QuadBackend.QuadBackend.prototype.search = function (quad, callback) {
    var indexKey = this.indices[0];
    var index = this.indexMap[indexKey];

    index.search(quad, function (result) {
        callback(result != null);
    });
};


QuadBackend.QuadBackend.prototype.delete = function (quad, callback) {
    var that = this;

    Utils.repeat(0, this.indices.length, function (k, e) {
        var indexKey = that.indices[e._i];
        var index = that.indexMap[indexKey];
        var floop = arguments.callee;

        index.delete(quad, function (result) {
            k(floop, e);
        });
    }, function (e) {
        callback(that);
    });
};
