
// imports
var QuadIndex = require("./quad_index").QuadIndex;
var async = require('./utils');
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
    if (arguments !== 0) {
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
        var i = 0;

        async.eachSeries(this.indices,function(indexKey,k){
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
    }
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


QuadBackend.prototype.index = function (quad, callback) {
    var that = this;
    async.eachSeries(this.indices, function(indexKey,k){
        var index = that.indexMap[indexKey];
        index.insert(quad, function(){
            k();
        })
    },function(){
        callback(that);
    });
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

QuadBackend.prototype.clear = function(callback) {
    var that = this;
    async.eachSeries(this.indices,function(indexKey,k){
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

module.exports.QuadBackend = QuadBackend;
