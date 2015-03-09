// exports
exports.PriorityQueue = {};
var PriorityQueue = exports.PriorityQueue;

/**
 * @constructor
 * @class PriorityQueue manages a queue of elements with priorities. Default
 * is highest priority first.
 *
 * @param [options] If low is set to true returns lowest first.
 */
PriorityQueue.PriorityQueue = function(options) {
    var contents = [];
    var store = {};
    var sorted = false;
    var sortStyle;
    var maxSize = options.maxSize || 10;

    //noinspection UnnecessaryLocalVariableJS
    sortStyle = function(a, b) {
        return store[b].priority - store[a].priority;
    };


    /**
     * @private
     */
    var sort = function() {
        contents.sort(sortStyle);
        sorted = true;
    };

    var self = {
        debugContents: contents,
        debugStore: store,
        debugSort: sort,

        push: function(pointer, object) {
            if(contents.length === maxSize) {
                if(!sorted) {
                    sort();
                }
                if(store[pointer] == null) {
                    delete store[contents[0]];
                    contents[0] = pointer;
                    var priority = (store[contents[contents.length - 1]].priority) - 1;
                    store[pointer] = {object: object, priority: priority};
                    sorted = false;
                } else {
                    priority = (store[contents[contents.length - 1]].priority) - 1;
                    store[pointer].priority = priority;
                    sorted = false;
                }
            } else if(contents.length === 0){
                contents.push(pointer);
                store[pointer] = {object: object, priority: 1000};
            } else  {
                priority = (store[contents[contents.length - 1]].priority) - 1;
                if(store[pointer] == null) {
                    store[pointer] = {object: object, priority: priority};
                    contents.push(pointer);
                } else {
                    store[pointer].priority = priority;
                    sorted = false;
                }
            }
        },

        remove: function(pointer) {
            if(store[pointer] != null) {
                delete store[pointer];
                var pos = null;
                for(var i=0; i<contents.length; i++) {
                    if(contents[i] === pointer) {
                        pos = i;
                        break;
                    }
                }

                if(pos != null) {
                    contents.splice(pos,1);
                }
            }
        },

        fetch: function(pointer) {
            var obj = store[pointer];
            if(store[pointer] != null) {
                if(!sorted) {
                    sort();
                }
                var priority = (store[contents[contents.length - 1]].priority) - 1;
                store[pointer].priority = priority;
                sorted = false;
                return obj.object;
            } else {
                return null;
            }
        }

    };

    return self;
};
