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
        this.comparator = function(a,b) {
            for(var i=0; i< a.order.length; i++) {
                var component = a.order[i];
                var vala = a[component];
                var valb = b[component];

                if(vala < valb) {
                    return -1;
                } else if(vala > valb) {
                    return 1;
                }
            }
        }

        return 0;
    }
}

Utils.extends(BaseTree.Tree, QuadIndex.Tree);

QuadIndex.Tree.prototype.insert = function(quad) {
    BaseTree.Tree.prototype.insert.call(this, quad, null);
};

QuadIndex.Tree.prototype.range = function(pattern) {
    var patternKey  = pattern.key;
    var pendingNodes = [this.root];
    var collected = [];

    while(pendingNodes.length > 0) {
        var node = pendingNodes.shift();
        var idxMin = 0;
        while(idxMin < node.numberActives && node.keys[idxMin].key.comparator(pattern) === -1) {
            idxMin++;
        }
        if(node.isLeaf === false) {
            pendingNodes.push(this._diskRead(node.children[idxMin]));
        }
        var idxMax = idxMin;
        var val = null;
        while(idxMax < node.numberActives && (val=node.keys[idxMax].key.comparator(pattern)) === 0) {
            collected.push(node.keys[idxMax].key);
            idxMax++;
            if(node.isLeaf === false) {
                pendingNodes.push(this._diskRead(node.children[idxMax]));
            }
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
