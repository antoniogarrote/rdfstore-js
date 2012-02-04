// exports
exports.QuadIndexCommon = {};
var QuadIndexCommon = exports.QuadIndexCommon;

/**
 * NodeKey
 *
 * Implements the interface of BinarySearchTree.Node
 *
 * A Tree node augmented with BPlusTree
 * node structures
 */
QuadIndexCommon.NodeKey = function(components, order) {
    this.subject = components.subject;
    this.predicate = components.predicate;
    this.object = components.object;
    this.graph = components.graph;
    this.order = order;
};

QuadIndexCommon.NodeKey.prototype.comparator = function(keyPattern) {
    for(var i=0; i<this.order.length; i++) {
        var component = this.order[i];
        if(keyPattern[component] == null) {
            return 0;
        } else {
            if(this[component] < keyPattern[component] ) {
                return -1
            } else if(this[component] > keyPattern[component]) {
                return 1
            }
        }
    }

    return 0;
};

/**
 * Pattern
 *
 * A pattern with some variable components
 */
QuadIndexCommon.Pattern = function (components) {
    this.subject = components.subject;
    this.predicate = components.predicate;
    this.object = components.object;
    this.graph = components.graph;
    this.indexKey = [];

    this.keyComponents = {};

    var order = [];
    var indif = [];
    var components = ['subject', 'predicate', 'object', 'graph'];

    // components must have been already normalized and
    // inserted in the lexicon.
    // OIDs retrieved from the lexicon *are* numbers so
    // they can be told apart from variables (strings)
    for (var i = 0; i < components.length; i++) {
        if (typeof(this[components[i]]) === 'string') {
            indif.push(components[i]);
            this.keyComponents[components[i]] = null;
        } else {
            order.push(components[i]);
            this.keyComponents[components[i]] = this[components[i]];
            this.indexKey.push(components[i]);
        }
    }

    this.order = order.concat(indif);
    this.key = new QuadIndexCommon.NodeKey(this.keyComponents, this.order);
};
