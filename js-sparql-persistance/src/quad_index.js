// exports
exports.QuadIndex = {};
var QuadIndex = exports.QuadIndex;

// imports
var BaseTree = require("./../../js-trees/src/in_memory_b_tree").InMemoryBTree;
var Utils = require("./../../js-trees/src/utils").Utils;
var QuadIndexCommon = require("./quad_index_common").QuadIndexCommon

QuadIndex.Tree = function(params) {
    if(arguments != 0) {
        // @todo change this if using the file backed implementation
        BaseTree.Tree.call(this, params.order);
    }
}

Utils.extends(BaseTree.Tree, QuadIndex.Tree);

QuadIndex.Tree.range = function(pattern) {
    var patternKey  = pattern.key;
    var pendingNodes = [this.root];
    var collected = [];

    while(pendingNodes.length > 0) {
        var node = pendingNodes.shift();
        var idxMin = 0;
        while(idxMin < node.numberActives && node.keys[idxMin].comparator(pattern) === 1) {
            idxMin++;
        }
        var idxMax = idxMin;
        var val = null;
        while(idxMax < node.numberActives && (val=node.keys[idxMax].comparator(pattern)) === 0) {
            collected.push(node.keys[idxMax]);
            if(node.isLeaf === false) {
                pendingNodes.push(this.readNode(node.children[idxMax]));
            }
            idxMax++;
        }
        if(node.isLeaf === false && idxMax === node.numberActives) {
            pendingNodes.push(node.children[idxMax+1]);
        }
    }

    return collected;
}

/**
 * Node
 *
 * A node storing a quad.
 */
QuadIndex.Node = function(){

}
