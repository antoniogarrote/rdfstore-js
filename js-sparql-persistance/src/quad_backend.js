// exports
exports.QuadBackend = {};
var QuadBackend = exports.QuadBackend;


// imports
var Utils = require("./../../js-trees/src/utils").Utils;
var QuadIndexCommon = require("./quad_index_common").QuadIndexCommon;
var QuadIndex = require("./quad_index").QuadIndex;
var BaseTree = require("./../../js-trees/src/in_memory_async_b_tree").InMemoryAsyncBTree;

/*
 * "perfect" indeces for RDF indexing
 * 
 * SPOG (?, ?, ?, ?), (s, ?, ?, ?), (s, p, ?, ?), (s, p, o, ?), (s, p, o, g)
 * GP   (?, ?, ?, g), (?, p, ?, g)
 * OGS  (?, ?, o, ?), (?, ?, o, g), (s, ?, o, g)
 * POG  (?, p, ?, ?), (?, p, o, ?), (?, p, o, g)
 * GSP  (s, ?, ?, g), (s, p, ?, g)
 * OS   (s, ?, o, ?)
*/
QuadBackend.QuadBackend = function(configuration, callback) {
    if(arguments!=0) {
        this.indexMap = {};
        this.treeOrder = configuration['treeOrder']
        this.indices = ['SPOG', 'GP', 'OGS', 'POG', 'GSP', 'OS'];
        this.componentOrders = {
            SPOG: ['subject', 'predicate', 'object', 'graph'],
            GP: ['graph', 'predicate', 'subject', 'object'],
            OGS: ['object', 'graph', 'subject', 'predicate'],
            POG: ['predicate', 'object', 'graph', 'subject'],
            GSP: ['graph', 'subject', 'predicate', 'object'],
            OS: ['object', 'subject', 'predicate', 'graph']
        }
        var that = this;
        Utils.repeat(0, this.indices.length,function(k,e) {
            var indexKey = that.indices[e._i];
            var floop = arguments.callee;
            new BaseTree.Tree({order: that.treeOrder,
                               componentOrder: that.componentOrders[indexKey]},
                              function(tree){
                                  that.indexMap[indexKey] = tree;
                                  k(floop,e);
                              });
        }, function(e) {
            callback(that);
        });
    }
}

QuadBackend.QuadBackend.prototype._indexForPattern = function(pattern) {
    var indexKey = pattern.indexKey;

    var matchingIndices = this.indices;
    var nextMatchingIndices = []

    for(var i=0; i<matchingIndices.length; i++) {
        var remainingLetters = indexKey.length;
        var index = matchingIndices[i];
        for(var j=0; j<indexKey.length; j++) {
            if(Utils.include?(index, indexKey[j]) {
                
            } else {

            }
        }
    }
//    for(var i=0; i< indexKey.length; i++) {
//        for(var j=0; j<matchingIndices.length; j++) {
//            var remainingIndex = matchingIndices[j];
//            
//            var found = false;
//            var k=0;
//            while(found === false && k<remainingIndex.length) {
//                found = (remainingIndex[k]===indexKey[i]);
//                k++;
//            }
// 
//            if(found === true) {
//                nextMatchingIndices.push(matchingIndices[j]);
//            }
//        }
//        nextMatchingIndices = matchingIndices;
//    }

    if(matchingIndices.length === 0) {
        throw new Error("Pattern not matching any quad index order");
    } else {
        return matchingIndices[0];
    }
}
