// exports
exports.DiskManager = {};
var DiskManager = exports.DiskManager;

// imports
var fs = require('fs');
var Put = require('put');
var Binary = require('binary');
var Utils = require('./utils').Utils;

DiskManager.NodeSchema = function(keyLength, valueLength, treeOrder) {
    this.keyLength = keyLength;
    this.valueLength = valueLength;
    this.childPointerLength = 4;

    this.treeOrder = treeOrder;

    this.maxNumKeys = ((2 * this.treeOrder) - 1);
    this.maxNumChildren = 2 * this.treeOrder;

    // size of the node stored in disk in bytes
    // size =  max num keys + max num key values + max num children pointers + 1 free/use byte + 1 isLeaf + 4 numberActives + 4 level
    this.encodedSize = (this.maxNumKeys * this.keyLength) + (this.maxNumKeys * this.valueLength) + (this.maxNumChildren * this.childPointerLength) + 1 + 1 + 4 + 4;

    this.container = null;
};

/**
 * Implements the strategy to encode a node as a buffer
 *
 * @param node, a new node to be serialized as a binary buffer.
 * @returns a new Buffer with the binary representation of the node
 */
DiskManager.NodeSchema.prototype.encode = function(node) {
    var b = Put().word8(1); // node is used

    if(node.isLeaf===true) {
        b.word8(1);
    } else {
        b.word8(0);
    }

    b.word32le(node.numberActives);
    b.word32le(node.level);

    var i = 0;
    // encoding of keys
    for(i=0; i<node.numberActives; i++) {
        b = b.put(this.encodeKey(node.keys[i].key));
    }
    while(i<this.maxNumKeys) {
        b = b.pad(this.keyLength);
        i++;
    }

    // encoding of values
    for(i=0; i<node.numberActives; i++) {
        b = b.put(this.encodeValue(node.keys[i].data));
    }
    while(i<this.maxNumKeys) {
        b = b.pad(this.valueLength);
        i++;
    }


    // encoding of child pointers
    i = 0;
    if(node.isLeaf === false) {
      for(i=0; i<(node.numberActives + 1); i++) {
          if(typeof(node.children[i])==='object') {
              if(node.children[i].nodeKey==null) {
                  var nodeId = this.container.writeNode(node.children[i]);
                  b = b.word32le(nodeId);
              } else {
                  b = b.word32le(node.children[i].nodeKey);
              }
          } else {
              b = b.word32le(node.children[i]);
          }
      }
    }
    while(i<this.maxNumChildren) {
        b = b.pad(4);
        i++;
    }

    return b.buffer();
};

/**
 * Implements the strategy to decode a node from a buffer
 *
 * @param buffer, the binary buffer read from disk
 * @returns a new node with the data stored in the buffer.
 */
DiskManager.NodeSchema.prototype.decode = function(buffer) {
    var parsing = Binary.parse(buffer).word8('free_used'); // free/used byte

    // isLeaf 0/1
    parsing.word8('isLeaf');

    parsing.word32le('numberActives');
    var numberActives = parsing.vars.numberActives;
    parsing.word32le('level');

    var i = 0;
    // decoding of keys
    for(i=0; i<this.maxNumKeys; i++) {
        parsing = parsing.buffer("key"+i, this.keyLength);
    }
    // decoding key values
    for(i=0; i<this.maxNumKeys; i++) {
        parsing = parsing.buffer("value"+i, this.valueLength);
    }

    // decoding child pointers
    for(i=0; i<this.maxNumChildren; i++) {
        parsing = parsing.word32le("child"+i);
    }

    var nodeComponents = parsing.vars;

    var keys = [];
    for(i=0; i<numberActives; i++) {
        var _key = nodeComponents["key"+i];
        var _val = nodeComponents["value" + i];
        if(_key != null) {
            var key = {};
            key.key = this.decodeKey(_key);
            key.data = this.decodeValue(_val);

            keys.push(key);
        }

    }

    var children = [];
    for(i=0; i<numberActives+1; i++) {
        var _child = nodeComponents["child" + i];
        if(_child != null && _child != 0) {
            children.push(_child);
        }
    }

    return this.buildNode({level: nodeComponents.level,
                           numberActives: nodeComponents.numberActives,
                           isLeaf: nodeComponents.isLeaf,
                           children: children,
                           keys: keys});
};




DiskManager.Container = function(path, nodeSchema) {
    this.wfd = fs.openSync(path, 'a+');
    this.rfd = fs.openSync(path, 'r+');
    this.freeNodePointer = 0;
    this.keyLength = null;
    this.valueLength = null;
    this.treeOrder = null;
    this.rootNode = 0;
    this.nodeSchema = nodeSchema;
    this.nodeSchema.container = this;
    this.stats = fs.statSync(path);
    this.endPosition = this.stats.size;
    // superBlockSize = treeOrder + keyLength + valueLength + freeNodePointer
    this.superBlockSize = 4 + 4 + 4 + 4 + 4;

    this.freeBlocksManager = new DiskManager.FreeBlocksManager(this);
    this.bufferCache = new DiskManager.BufferCache(this);
};

DiskManager.Container.prototype.close = function() {
    this._writeSuperBlock();
    fs.close(this.wfd);
    fs.close(this.rfd);
};

DiskManager.Container.prototype.format = function(keyLength, valueLength, treeOrder) {
    this.keyLength = keyLength;
    this.valueLength = valueLength;
    this.treeOrder = treeOrder;
    this.endPosition = this.superBlockSize;
    this._writeSuperBlock();
    this.freeBlocksManager.init();
};

DiskManager.Container.prototype.load = function() {
    this._readSuperBlock();
    this.freeBlocksManager.init();
};

DiskManager.Container.prototype._writeSuperBlock = function() {
    var b = Put().word32le(this.treeOrder).
        word32le(this.rootNode).
        word32le(this.keyLength).
        word32le(this.valueLength).
        word32le(this.freeNodePointer).buffer();

    var written = fs.writeSync(this.wfd,b, 0, this.superBlockSize, 0);
    if(written!=this.superBlockSize) {
        throw new Error("Error writting superblock");
    }
};

DiskManager.Container.prototype._ensureNodeKey = function (nodeOrKey) {
    if (typeof(nodeOrKey) === 'object') {
        this.container.readNode(nodeOrKey.nodeKey);
    } else {
        this.container.readNode(nodeOrKey);
    }
};

DiskManager.Container.prototype._readSuperBlock = function() {
    var b = new Buffer(this.superBlockSize);
    var read = fs.readSync(this.rfd, b, 0, this.superBlockSize, 0);
    if(read === this.superBlockSize) {
        var readValues = Binary.parse(b).
            word32le('treeOrder').
            word32le('rootNode').
            word32le('keyLength').
            word32le('valueLength').
            word32le('freeNodePointer').vars;

        this.treeOrder = readValues.treeOrder;
        this.rootNode = readValues.rootNode;
        this.keyLength = readValues.keyLength;
        this.valueLength = readValues.valueLength;
        this.freeNodePointer = readValues.freeNodePointer;

        if(this.treeOrder === 0 || this.keyLength === 0 || this.valueLength === 0) {
            throw new Error("Read incorrect values for superblock");
        }
    } else {
        throw new Error("Corrupted superblock");
    }
};

DiskManager.Container.prototype._readFreeBlock = function(position) {
    var b = new Buffer(this.nodeSchema.encodedSize);
    var read = fs.readSync(this.rfd, b, 0, this.nodeSchema.encodedSize, position);
    if(read != this.nodeSchema.encodedSize) {
        throw new Error("Error reading free block from disk");
    } else {
        var parsing = Binary.parse().word8('free_used'); // free/used byte
        parsing.word32le('nextPointer');
        var vars = parsing.vars;
        vars.position = position;

        return vars;
    }
};

DiskManager.Container.prototype.writeNode = function(node) {
    var position = node.nodeKey;

    if(position == null) {
        position = this.freeBlocksManager.next();
      if(position == null) {
          position = this.endPosition;
      }
    }

    var encodedNode = this.nodeSchema.encode(node);
    var written = fs.writeSync(this.wfd, encodedNode, 0, this.nodeSchema.encodedSize, position);
    if(written === this.nodeSchema.encodedSize) {
        node.nodeKey = position;
        this.bufferCache.insert(node);
        if(position === this.endPosition) {
            this.endPosition = this.endPosition + this.nodeSchema.encodedSize;
        }
    } else {
        throw new Error("Error writing node to disk");
    }
};


DiskManager.Container.prototype.readNode = function(nodeKey) {
    var node = this.bufferCache.fetch(nodeKey);
    if(node == null) {
        var b = new Buffer(this.nodeSchema.encodedSize);
        var read = fs.readSync(this.rfd, b, 0, this.nodeSchema.encodedSize, nodeKey);
        if(read != this.nodeSchema.encodedSize) {
            throw new Error("Error reading node from disk");
        } else {
            node = this.nodeSchema.decode(b);
            node.nodeKey = nodeKey;
            this.bufferCache.insert(node);

            return node;
        }
    } else {
        return node;
    }
};

DiskManager.Container.prototype.deleteNode = function(node) {
    this.bufferCache.invalidate(node.nodeKey);
    this.freeBlocksManager.release(node);
};

DiskManager.Container.prototype.updateRoot = function (node) {
    this.rootNode = node.nodeKey;
    this._writeSuperBlock();
};

/**
 * BufferCache
 *
 * A cache for nodes.
 *
 * @param container the container where this cache
 * will be used.
 */
DiskManager.BufferCache = function (container) {
    this.cacheSize = container.cacheSize;
    this.container = container;
    this.cache = {};
    this.cacheList = [];
};

DiskManager.BufferCache.prototype.fetch = function(nodeKey) {
    return this.cache[nodeKey];
};

DiskManager.BufferCache.prototype.insert = function(node) {
    if(this.cache[node.nodeKey] == null && this.cacheList.length === this.cacheSize) {
        var key = this.cacheList.shift();
        delete this.cache[key]
    }

    if(this.cache[node.nodeKey] == null) {
        this.cacheList.push(node.nodeKey);
    }
    this.cache[node.nodeKey] = node;
};

DiskManager.BufferCache.prototype.invalidate = function(node) {
    if(this.cache[node.nodeKey] != null) {
        delete this.cache[node.nodeKey];
        var i = 0;
        while(this.cacheList[i] != node.nodeKey) {
            i++
        }

        for(var j=i; j<this.cacheList.length; j++) {
            this.cacheList[j] = this.cacheList[j+1];
        }
        this.cacheList.pop();
    }
};



/**
 * FreeBlocksManager
 *
 * Mantains the list of free blocks and manage
 * the allocation and release of blocks.
 *
 * @param container the container where this cache
 * will be used.
 */
DiskManager.FreeBlocksManager = function(container) {
    this.container = container;
    this.freeBlocksCache = [];
};

DiskManager.FreeBlocksManager.prototype.init = function() {
    var nextPointer = this.container.freeNodePointer;
    while(nextPointer != 0 && this.freeBlocksCache.length < this.container.cacheSize) {
        var freeBlock = container._readFreeBlock(nextPointer);
        var nextPointer = freeBlock.nextPointer;
        this.freeBlocksCache.push(freeBlock);
    }
};

DiskManager.FreeBlocksManager.prototype.next = function() {
    if(this.freeBlocksCache.length === 0) {
        return null;
    } else {
        var nextBlock = this.freeBlocksCache.shift();
        var toReturn = this.container.freeNodePointer;
        this.container.freeNodePointer = nextBlock.nextPointer;

        // try to load another page of free blocks
        if(this.freeBlocksCache.length===0 && this.container.freeNodePointer!=0) {
            console.log("loading more free nodes");
            this.init();
            this.container._writeSuperBlock();
        }

        return toReturn;
    }
};

DiskManager.FreeBlocksManager.prototype.release = function(node) {
    var position = node.nodeKey;
    var remainingPadding = this.container.nodeSchema.encodedSize - 5;
    var blankNodeBuffer = Put().word8(0).word32le(this.container.freeNodePointer).pad(remainingPadding).buffer();


    this.freeBlocksCache.push({nextPointer: this.container.freeNodePointer});
    this.container.freeNodePointer = position;

    var written = fs.writeSync(this.container.wfd, blankNodeBuffer, 0, this.container.nodeSchema.encodedSize, position);
    if(written === this.container.nodeSchema.encodedSize) {
        this.container._writeSuperBlock();
    } else {
        throw new Error("Error releasing free block");
    }
};


/**
 * FloatValueKeysDiskManager
 *
 * An implementation for a DiskManager
 * storing BTree nodes containing keys
 * and values consisting of float numbers
 */
DiskManager.FloatFloatNodeSchema = function(treeOrder) {
    DiskManager.NodeSchema.call(this,4,4,treeOrder);
};

Utils.extends(DiskManager.NodeSchema, DiskManager.FloatFloatNodeSchema);

DiskManager.FloatFloatNodeSchema.prototype.encodeKey = function(key) {
    return Put().word32le(key).buffer();
};

DiskManager.FloatFloatNodeSchema.prototype.encodeValue = function(value) {
    return Put().word32le(value).buffer();
};

DiskManager.FloatFloatNodeSchema.prototype.decodeKey = function(bytes) {
    return Binary.parse(bytes).word32le('key').vars.key;
};

DiskManager.FloatFloatNodeSchema.prototype.decodeValue = function(bytes) {
    return Binary.parse(bytes).word32le('value').vars.value;
};

DiskManager.FloatFloatNodeSchema.prototype.buildNode = function(nodeKeys) {
    if(nodeKeys.isLeaf===1) {
        nodeKeys.isLeaf = true;
    } else {
        nodeKeys.isLeaf = false;
    }
    return nodeKeys;
};
