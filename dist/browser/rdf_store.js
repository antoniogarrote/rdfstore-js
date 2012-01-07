(function() {


try {
  console = console || {};
} catch(e) {
  console = {};
  console.log = function(e){};
}
var Utils = {};



Utils['extends'] = function(supertype, descendant) {
    descendant.prototype = new supertype();
};


Utils.stackCounterLimit = 1000;
Utils.stackCounter = 0;

Utils.recur = function(c){
    if(Utils.stackCounter === Utils.stackCounterLimit) {
        Utils.stackCounter = 0;
        setTimeout(c, 0);
    } else {
        Utils.stackCounter++;
        c();
    } 
};

Utils.clone = function(o) {
    return JSON.parse(JSON.stringify(o));
};

Utils.shuffle = function(o){ //v1.0
    for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x){};
    return o;
};

Utils.include = function(a,v) {
    var cmp = arguments[2];

    for(var i=(a.length-1); i>=0; i--) {
        var res = false;
        if(cmp == null) {
            res = (a[i] === v);
        } else {
            res = (cmp(a[i],v) === 0);
        }

        if(res === true) {
            return true;
        }
    }

    return false;
};

Utils.remove = function(a,v) {
    var acum = [];
    for(var i=0; i<a.length; i++) {
        if(a[i] !== v) {
            acum.push(a[i]);
        }
    }

    return acum;
};

Utils.repeat = function(c,max,floop,fend,env) {
    if(arguments.length===4) { env = {}; }
    if(c<max) {
        env._i = c;
        floop(function(floop,env){
            // avoid stack overflow
            // deadly hack
            Utils.recur(function(){ Utils.repeat(c+1, max, floop, fend, env); });
        },env);
    } else {
        fend(env);
    }
};


Utilsmeanwhile = function(c,floop,fend,env) {
    if(arguments.length===3) { env = {}; }

    if(env['_stack_counter'] == null) {
        env['_stack_counter'] = 0;
    }

    if(c===true) {
        floop(function(c,floop,env){
            if(env['_stack_counter'] % 40 == 39) {
                env['_stack_counter'] = env['_stack_counter'] + 1;
                setTimeout(function(){ Utilsmeanwhile(c, floop, fend, env); }, 0);
            } else {
                env['_stack_counter'] = env['_stack_counter'] + 1;
                Utilsmeanwhile(c, floop, fend, env);
            }
        },env);
    } else {
        fend(env);
    }
};

Utils.seq = function() {
    var fs = arguments;
    return function(callback) {
        Utils.repeat(0, fs.length, function(k,env){
            var floop = arguments.callee;
            fs[env._i](function(){
                k(floop, env);
            });
        }, function(){
            callback();
        });
    };
};


Utils.partition = function(c, n) {
    var rem = c.length % n;
    var currentGroup = [];
    for(var i=0; i<rem; i++) {
        currentGroup.push(null);
    }
    
    var groups = [];
    var groupCounter = rem;
    for(var i=0; i<c.length; i++) {
        currentGroup.push(c[i]);
        if(currentGroup.length % n == 0) {
            groups.push(currentGroup);
            currentGroup = [];
        }
    }
    return groups;
};

Utils.keys = function(obj) {
    var variables = [];
    for(var variable in obj) {
        variables.push(variable);
    }

    return variables;
};

Utils.iso8601 = function(date) {
    function pad(n){
        return n<10 ? '0'+n : n;
    }    
    return date.getUTCFullYear()+'-'
        + pad(date.getUTCMonth()+1)+'-'
        + pad(date.getUTCDate())+'T'
        + pad(date.getUTCHours())+':'
        + pad(date.getUTCMinutes())+':'
        + pad(date.getUTCSeconds())+'Z';
};


Utils.parseStrictISO8601 = function (str) {
    var regexp = "([0-9]{4})(-([0-9]{2})(-([0-9]{2})" +
        "(T([0-9]{2}):([0-9]{2})(:([0-9]{2})(\.([0-9]+))?)?" +
        "(Z|(([-+])([0-9]{2}):([0-9]{2})))?)?)?)?";
    var d = str.match(new RegExp(regexp));

    var offset = 0;
    var date = new Date(d[1], 0, 1);

    if (d[3]) { date.setMonth(d[3] - 1); } else { throw "missing ISO8061 component" }
    if (d[5]) { date.setDate(d[5]);  } else { throw "missing ISO8061 component" }
    if (d[7]) { date.setHours(d[7]);  } else { throw "missing ISO8061 component" }
    if (d[8]) { date.setMinutes(d[8]);  } else { throw "missing ISO8061 component" }
    if (d[10]) { date.setSeconds(d[10]);  } else { throw "missing ISO8061 component" }
    if (d[12]) { date.setMilliseconds(Number("0." + d[12]) * 1000); }
    if (d[14]) {
        offset = (Number(d[16]) * 60) + Number(d[17]);
        offset *= ((d[15] == '-') ? 1 : -1);
    }

    offset -= date.getTimezoneOffset();
    time = (Number(date) + (offset * 60 * 1000));
    var toReturn = new Date();
    toReturn.setTime(Number(time));
    return toReturn;
}


Utils.parseISO8601 = function (str) {
    var regexp = "([0-9]{4})(-([0-9]{2})(-([0-9]{2})" +
        "(T([0-9]{2}):([0-9]{2})(:([0-9]{2})(\.([0-9]+))?)?" +
        "(Z|(([-+])([0-9]{2}):([0-9]{2})))?)?)?)?";
    var d = str.match(new RegExp(regexp));

    var offset = 0;
    var date = new Date(d[1], 0, 1);

    if (d[3]) { date.setMonth(d[3] - 1); }
    if (d[5]) { date.setDate(d[5]);  }
    if (d[7]) { date.setHours(d[7]);  }
    if (d[8]) { date.setMinutes(d[8]);  }
    if (d[10]) { date.setSeconds(d[10]);  }
    if (d[12]) { date.setMilliseconds(Number("0." + d[12]) * 1000); }
    if (d[14]) {
        offset = (Number(d[16]) * 60) + Number(d[17]);
        offset *= ((d[15] == '-') ? 1 : -1);
    }

    offset -= date.getTimezoneOffset();
    time = (Number(date) + (offset * 60 * 1000));
    var toReturn = new Date();
    toReturn.setTime(Number(time));
    return toReturn;
};

Utils.parseISO8601Components = function (str) {
    var regexp = "([0-9]{4})(-([0-9]{2}))(-([0-9]{2}))(T([0-9]{2}):([0-9]{2})(:([0-9]{2}))?(\.([0-9]+))?)?(Z|([-+])([0-9]{2})(:([0-9]{2}))?)?";
    var d = str.match(new RegExp(regexp));
    var year, month, date, hours, minutes, seconds, millisecs, timezone;
    year = Number(d[1]);
    month = d[3] - 1;
    date  = Number(d[5]);
    hours = Number(d[7]);
    minutes = Number(d[8]);
    seconds = Number(d[10]);

    if(d[12]) { millisecs = Number("0." + d[12]) * 1000; }

    if(d[13]==="Z") {
        timezone = 0;
    } else if (d[14]) {
        timezone = 0;
        if(d[17]) {
            timezone = Number(d[17]);
        }
        timezone = timezone+(Number(d[15]) * 60);
        timezone *= ((d[14] == '-') ? -1 : +1);
    } else if(d[14]==null && d[11]) {
        timezone = Number(d[12])*60;
    }    

    return {'year': isNaN(year) ? null : year,
            'month': isNaN(month) ? null : month,
            'date': isNaN(date) ? null : date,
            'hours': isNaN(hours) ? null : hours,
            'minutes': isNaN(minutes) ? null : minutes,
            'seconds': isNaN(seconds) ? null : seconds,
            'millisecs':isNaN(millisecs) ? null : millisecs,
            'timezone': isNaN(timezone) ? null : timezone};
};

Utils.compareDateComponents = function(stra,strb) {
    var a = Utils.parseISO8601Components(stra);
    var b = Utils.parseISO8601Components(strb);

    if((a.timezone == null && b.timezone == null) ||
       (a.timezone != null && b.timezone != null)) {        
        da = Utils.parseISO8601(stra);
        db = Utils.parseISO8601(strb);
        
        if(da.getTime() == db.getTime()) {
            return 0;
        } else if(da.getTime() < db.getTime()){
            return -1;
        } else {
            return 1;
        }
    } else if (a.timezone != null && b.timezone == null){
        da = Utils.parseISO8601(stra);
        db = Utils.parseISO8601(strb);
        ta = da.getTime();
        tb = db.getTime();

        var offset = 14*60*60;

        if(ta < tb && ta < (tb + offset)) {
            return -1;
        } else if(ta > tb && ta > (tb - offset)) {
            return 1;
        } else {
        return null;
        }
    } else {
        da = Utils.parseISO8601(stra);
        db = Utils.parseISO8601(strb);
        ta = da.getTime();
        tb = db.getTime();

        var offset = 14*60*60;
        if(ta < tb && (ta + offset)  < tb) {
            return -1;
        } else if(ta > tb && (ta + offset) > tb) {
            return 1;
        } else {
        return null;
        }
    }
};

// RDF utils
Utils.lexicalFormLiteral = function(term, env) {
    var value = term.value;
    var lang = term.lang;
    var type = term.type;

    var indexedValue = null;
    if(value != null && type != null && typeof(type) != 'string') {
        var typeValue = type.value;

        if(typeValue == null) {
            var typePrefix = type.prefix;
            var typeSuffix = type.suffix;

            var resolvedPrefix = env.namespaces[typePrefix];
            term.type = resolvedPrefix+typeSuffix;
	    typeValue = resolvedPrefix+typeSuffix;
        }
	// normalization
	if(typeValue.indexOf('hexBinary') != -1) {
            indexedValue = '"' + term.value.toLowerCase() + '"^^<' + typeValue + '>';
	} else {
            indexedValue = '"' + term.value + '"^^<' + typeValue + '>';
	}
    } else {
        if(lang == null && type == null) {
            indexedValue = '"' + value + '"';
        } else if(type == null) {
            indexedValue = '"' + value + '"' + "@" + lang;        
        } else {
	    // normalization
	    if(type.indexOf('hexBinary') != -1) {
		indexedValue = '"' + term.value.toLowerCase() + '"^^<'+type+'>';
	    } else {
		indexedValue = '"' + term.value + '"^^<'+type+'>';
	    }
        }
    }
    return indexedValue;
};

Utils.lexicalFormBaseUri = function(term, env) {
    var uri = null;
    //console.log("*** normalizing URI token:");
    //console.log(term);
    if(term.value == null) {
        //console.log(" - URI has prefix and suffix");
        //console.log(" - prefix:"+term.prefix);
        //console.log(" - suffixx:"+term.suffix);
        var prefix = term.prefix;
        var suffix = term.suffix;
        var resolvedPrefix = env.namespaces[prefix];
        if(resolvedPrefix != null) {            
            uri = resolvedPrefix+suffix;
        } else {
            uri = prefix+":"+suffix;
        }
    } else {
        //console.log(" - URI is not prefixed");
        uri = term.value;
    }

    if(uri===null) {
        return null;
    } else {
        //console.log(" - resolved URI is "+uri);
        if(uri.indexOf(":") == -1) {
            //console.log(" - URI is partial");
            uri = (env.base||"") + uri; // applyBaseUri
        } else {
            //console.log(" - URI is complete");
        }
        //console.log(" -> FINAL URI: "+uri);
    }

    return uri;
};


Utils.lexicalFormTerm = function(term, ns) {
    if(term.token === 'uri') {
        return {'uri': Utils.lexicalFormBaseUri(term, ns)};
    } else if(term.token === 'literal') {
        return {'literal': Utils.lexicalFormLiteral(term, ns)};
    } else if(term.token === 'blank') {
        var label = '_:'+term.value;
        return {'blank': label};
    } else {
	throw "Error, cannot get lexical form of unknown token: "+term.token;
    }
};

Utils.normalizeUnicodeLiterals = function(string) {
    var escapedUnicode = string.match(/\\u[0-9abcdefABCDEF]{4,4}/g) || [];
    var dups = {};
    for(var i=0; i<escapedUnicode.length; i++) {
        if(dups[escapedUnicode[i]] == null) {
            dups[escapedUnicode[i]] = true;
            string = string.replace(new RegExp("\\"+escapedUnicode[i],"g"), eval("'"+escapedUnicode[i]+"'"));
        }
    }

    return string;
}

Utils.hashTerm = function(term) {
    try {
      if(term == null) {
          return "";
      } if(term.token==='uri') {
          return "u"+term.value;
      } else if(term.token === 'blank') {
          return "b"+term.value;
      } else if(term.token === 'literal') {
          l = "l"+term.value;
          l = l + (term.type || "");
          l = l + (term.lang || "");        
   
          return l;
      }
    } catch(e) {
        if(typeof(term) === 'object') {
            var key = "";
            for(p in term) {
                key = key + p + term[p];
            }

            return key;
        }
        return term;
    }
};

// end of ./src/js-trees/src/utils.js 
// exports
var InMemoryBTree = {};

var left = -1;
var right = 1;


/**
 * @doc
 * Implementation based on <http://www.gossamer-threads.com/lists/linux/kernel/667935>
 *
 */

/**
 * Tree
 *
 * Implements the interface of BinarySearchTree.Tree
 *
 * An implementation of an in memory B-Tree.
 */

InMemoryBTree.Tree = function(order) {
    if(arguments.length != 0) {
        this.order = order;
        this.root = this._allocateNode();
        this.root.isLeaf = true;
        this.root.level = 0;
        this._diskWrite(this.root);
        this._updateRootNode(this.root);

        this.comparator = function(a,b) {
            if(a < b) {
                return -1;
            } else if(a > b){
                return 1;
            } else {
                return 0;
            }
        };
        this.merger = null;
    }
};

/**
 * Creates the new node.
 *
 * This class can be overwritten by different versions of
 * the tree t select the right kind of node to be used
 *
 * @returns the new alloacted node
 */
InMemoryBTree.Tree.prototype._allocateNode = function() {
    return new InMemoryBTree.Node();
}

/**
 * _diskWrite
 *
 * Persists the node to secondary memory.
 */
InMemoryBTree.Tree.prototype._diskWrite= function(node) {
    // dummy implementation;
    // no-op
};


/**
 * _diskRead
 *
 * Retrieves a node from secondary memory using the provided
 * pointer
 */
InMemoryBTree.Tree.prototype._diskRead = function(pointer) {
    // dummy implementation;
    // no-op
    return pointer;
};


InMemoryBTree.Tree.prototype._diskDelete= function(node) {
    // dummy implmentation
    // no-op
};

/**
 * _updateRootNode
 *
 * Updates the pointer to the root node stored in disk.
 */
InMemoryBTree.Tree.prototype._updateRootNode = function(node) {
    // dummy implementation;
    // no-op
    return node;
};

InMemoryBTree.Tree.prototype.clear = function() {
        this.root = this._allocateNode();
        this.root.isLeaf = true;
        this.root.level = 0;
        this._updateRootNode(this.root);
};

/**
 * search
 *
 * Retrieves the node matching the given value.
 * If no node is found, null is returned.
 */
InMemoryBTree.Tree.prototype.search = function(key, checkExists) {
    var searching = true;
    var node = this.root;

    while(searching) {
        var idx = 0;
        while(idx < node.numberActives && this.comparator(key, node.keys[idx].key) === 1) {
            idx++;
        }

        if(idx < node.numberActives && this.comparator(node.keys[idx].key,key) === 0) {
            if(checkExists != null && checkExists == true) {
                return true;
            } else {
                return node.keys[idx].data;
            }
        } else {
            if(node.isLeaf === true) {
                searching = false;
            } else {
                node = this._diskRead(node.children[idx]);
            }
        }
    }

    return null;
};


/**
 * walk
 * Applies a function to all the nodes key and data in the the
 * tree in key order.
 */
InMemoryBTree.Tree.prototype.walk = function(f) {
    this._walk(f,this.root);
};

InMemoryBTree.Tree.prototype._walk = function(f,node) {
    if(node.isLeaf) {
        for(var i=0; i<node.numberActives; i++) {
            f(node.keys[i]);
        }
    } else {
        for(var i=0; i<node.numberActives; i++) {
            this._walk(f,this._diskRead(node.children[i]));
            f(node.keys[i]);
        }
        this._walk(f,this._diskRead(node.children[node.numberActives]));
    }
};

/**
 * walkNodes
 * Applies a function to all the nodes in the the
 * tree in key order.
 */
InMemoryBTree.Tree.prototype.walkNodes = function(f) {
    this._walkNodes(f,this.root);
};

InMemoryBTree.Tree.prototype._walkNodes = function(f,node) {
    if(node.isLeaf) {
        f(node);
    } else {
        f(node);
        for(var i=0; i<node.numberActives; i++) {
            this._walkNodes(f,this._diskRead(node.children[i]));
        }
        this._walkNodes(f,this._diskRead(node.children[node.numberActives]));
    }
};

/**
 * _splitChild
 *
 * Split the child node and adjusts the parent.
 */
InMemoryBTree.Tree.prototype._splitChild = function(parent, index, child) {
    var newChild = this._allocateNode();
    newChild.isLeaf = child.isLeaf;
    newChild.level = child.level;
    newChild.numberActives = this.order - 1;

    // Copy the higher order keys to the new child
    var newParentChild = child.keys[this.order-1];
    child.keys[this.order-1] = null;

    for(var i=0; i< this.order-1; i++) {
	newChild.keys[i]=child.keys[i+this.order];
	child.keys[i+this.order] = null;
	if(!child.isLeaf) {
	    newChild.children[i] = child.children[i+this.order];
            child.children[i+this.order] = null;
	}
    }

    // Copy the last child pointer
    if(!child.isLeaf) {
	newChild.children[i] = child.children[i+this.order];
        child.children[i+this.order] = null;
    }

    child.numberActives = this.order - 1;


    for(i = parent.numberActives + 1; i>index+1; i--) {
	parent.children[i] = parent.children[i-1];
    }

    parent.children[index+1] = newChild;

    for(i = parent.numberActives; i>index; i--) {
	parent.keys[i] = parent.keys[i-1];
    }

    parent.keys[index] = newParentChild;
    parent.numberActives++;

    this._diskWrite(newChild);
    this._diskWrite(parent);
    this._diskWrite(child);
};

/**
 * insert
 *
 * Creates a new node with value key and data and inserts it
 * into the tree.
 */
InMemoryBTree.Tree.prototype.insert = function(key,data) {
    if(this.root.numberActives === (2 * this.order - 1)) {
        var newRoot = this._allocateNode();
        newRoot.isLeaf = false;
        newRoot.level = this.root.level + 1;
        newRoot.numberActives = 0;
        newRoot.children[0] = this.root;

        this._splitChild(newRoot, 0, this.root);
        this.root = newRoot;
        this._updateRootNode(this.root);
        this._insertNonFull(newRoot, key, data);
    } else {
        this._insertNonFull(this.root, key, data);
    }
};

/**
 * _insertNonFull
 *
 * Recursive function that tries to insert the new key in
 * in the prvided node, or splits it and go deeper
 * in the BTree hierarchy.
 */
InMemoryBTree.Tree.prototype._insertNonFull = function(node,key,data) {
    var idx = node.numberActives - 1;

    while(!node.isLeaf) {
        while(idx>=0 && this.comparator(key,node.keys[idx].key) === -1) {
            idx--;
        }
        idx++;
        var child = this._diskRead(node.children[idx]);

        if(child.numberActives === 2*this.order -1) {
            this._splitChild(node,idx,child);
            if(this.comparator(key, node.keys[idx].key)===1) {
                idx++;
            }
        }
        node = this._diskRead(node.children[idx]);
        idx = node.numberActives -1;
    }

    while(idx>=0 && this.comparator(key,node.keys[idx].key) === -1) {
        node.keys[idx+1] = node.keys[idx];
        idx--;
    }

    node.keys[idx+1] = {key: key, data:data}
    node.numberActives++;
    this._diskWrite(node);
};

/**
 * delete
 *
 * Deletes the key from the BTree.
 * If the key is not found, an exception is thrown.
 *
 * @param key the key to be deleted
 * @returns true if the key is deleted false otherwise
 */
InMemoryBTree.Tree.prototype['delete'] = function(key) {
    var node = this.root;
    var parent = null;
    var searching = true;
    var idx = null;
    var lsibling = null;
    var rsibling = null;
    var shouldContinue = true;

    while(shouldContinue === true) {
        shouldContinue = false;

        while(searching === true) {
            i = 0;

            if(node.numberActives === 0) {
                return false;
            }

            while(i<node.numberActives && this.comparator(key, node.keys[i].key) === 1) {
                i++;
            }

            idx = i;

            if(i<node.numberActives && this.comparator(key, node.keys[i].key) === 0) {
                searching = false;
            }

            if(searching === true) {

                if(node.isLeaf === true) {
                    return false;
                }

                parent = node;
                node = this._diskRead(node.children[i]);

                if(node===null) {
                    return false;
                }

                if(idx === parent.numberActives) {
                    lsibling = this._diskRead(parent.children[idx-1]);
                    rsibling = null;
                } else if(idx === 0) {
                    lsibling = null;
                    rsibling = this._diskRead(parent.children[1]);
                } else {
                    lsibling = this._diskRead(parent.children[idx-1]);
                    rsibling = this._diskRead(parent.children[idx+1]);
                }


                if(node.numberActives === (this.order-1) && parent != null) {
                    if(rsibling != null && rsibling.numberActives > (this.order-1)) {
                        // The current node has (t - 1) keys but the right sibling has > (t - 1) keys
                        this._moveKey(parent,i,left);
                    } else if(lsibling != null && lsibling.numberActives > (this.order-1)) {
                        // The current node has (t - 1) keys but the left sibling has > (t - 1) keys
                        this._moveKey(parent,i,right);
                    } else if(lsibling != null && lsibling.numberActives === (this.order-1)) {
                        // The current node has (t - 1) keys but the left sibling has (t - 1) keys
                        node = this._mergeSiblings(parent,i,left);
                    } else if(rsibling != null && rsibling.numberActives === (this.order-1)){
                        // The current node has (t - 1) keys but the left sibling has (t - 1) keys
                        node = this._mergeSiblings(parent,i,right);
                    }
                }
            }
        }


        //Case 1 : The node containing the key is found and is the leaf node.
        //Also the leaf node has keys greater than the minimum required.
        //Simply remove the key
        if(node.isLeaf && (node.numberActives > (this.order-1))) {
            this._deleteKeyFromNode(node,idx);
            return true;
        }


        //If the leaf node is the root permit deletion even if the number of keys is
        //less than (t - 1)
        if(node.isLeaf && (node === this.root)) {
            this._deleteKeyFromNode(node,idx);
            return true;
        }


        //Case 2: The node containing the key is found and is an internal node
        if(node.isLeaf === false) {
            var tmpNode = null;
            var tmpNode2 = null;
            if((tmpNode=this._diskRead(node.children[idx])).numberActives > (this.order-1)) {
                var subNodeIdx = this._getMaxKeyPos(tmpNode);
                key = subNodeIdx.node.keys[subNodeIdx.index];

                node.keys[idx] = key;

                //this._delete(node.children[idx],key.key);
                this._diskWrite(node);
                node = tmpNode;
                key = key.key;
                shouldContinue = true;
                searching = true;
            } else if ((tmpNode = this._diskRead(node.children[idx+1])).numberActives >(this.order-1)) {
                var subNodeIdx = this._getMinKeyPos(tmpNode);
                key = subNodeIdx.node.keys[subNodeIdx.index];

                node.keys[idx] = key;

                //this._delete(node.children[idx+1],key.key);
                this._diskWrite(node);
                node = tmpNode;
                key = key.key;
                shouldContinue = true;
                searching = true;
            } else if((tmpNode = this._diskRead(node.children[idx])).numberActives === (this.order-1) &&
                      (tmpNode2 = this._diskRead(node.children[idx+1])).numberActives === (this.order-1)) {

                var combNode = this._mergeNodes(tmpNode, node.keys[idx], tmpNode2);
                node.children[idx] = combNode;

                idx++;
                for(var i=idx; i<node.numberActives; i++) {
          	    node.children[i] = node.children[i+1];
          	    node.keys[i-1] = node.keys[i];
                }
                // freeing unused references
                node.children[i] = null;
                node.keys[i-1] = null;

                node.numberActives--;
                if (node.numberActives === 0 && this.root === node) {
                    this.root = combNode;
                }

                this._diskWrite(node);

                node = combNode;
                shouldContinue = true;
                searching = true;
            }
        }


        // Case 3:
	// In this case start from the top of the tree and continue
	// moving to the leaf node making sure that each node that
	// we encounter on the way has atleast 't' (order of the tree)
	// keys
	if(node.isLeaf && (node.numberActives > this.order - 1) && searching===false) {
            this._deleteKeyFromNode(node,idx);
	}

        if(shouldContinue === false) {
            return true;
        }
    }
};

/**
 * _moveKey
 *
 * Move key situated at position i of the parent node
 * to the left or right child at positions i-1 and i+1
 * according to the provided position
 *
 * @param parent the node whose is going to be moved to a child
 * @param i Index of the key in the parent
 * @param position left, or right
 */
InMemoryBTree.Tree.prototype._moveKey = function(parent,i,position) {

    if(position===right) {
        i--;
    }

    //var lchild = parent.children[i-1];
    var lchild = this._diskRead(parent.children[i]);
    var rchild = this._diskRead(parent.children[i+1]);


    if(position == left) {
        lchild.keys[lchild.numberActives] = parent.keys[i];
        lchild.children[lchild.numberActives+1] = rchild.children[0];
        rchild.children[0] = null;
        lchild.numberActives++;

        parent.keys[i] = rchild.keys[0];

        for(var _i=1; _i<rchild.numberActives; _i++) {
            rchild.keys[_i-1] = rchild.keys[_i];
            rchild.children[_i-1] = rchild.children[_i];
        }
        rchild.children[rchild.numberActives-1] = rchild.children[rchild.numberActives];
        rchild.numberActives--;
    } else {
        rchild.children[rchild.numberActives+1] = rchild.children[rchild.numberActives];
        for(var _i=rchild.numberActives; _i>0; _i--) {
            rchild.children[_i] = rchild.children[_i-1];
            rchild.keys[_i] = rchild.keys[_i-1];
        }
        rchild.keys[0] = null;
        rchild.children[0] = null;

        rchild.children[0] = lchild.children[lchild.numberActives];
        rchild.keys[0] = parent.keys[i];
        rchild.numberActives++;

        lchild.children[lchild.numberActives] = null;
        parent.keys[i] = lchild.keys[lchild.numberActives-1];
        lchild.keys[lchild.numberActives-1] = null;
        lchild.numberActives--;
    }

    this._diskWrite(lchild);
    this._diskWrite(rchild);
    this._diskWrite(parent);
}

/**
 * _mergeSiblings
 *
 * Merges two nodes at the left and right of the provided
 * index in the parent node.
 *
 * @param parent the node whose children will be merged
 * @param i Index of the key in the parent pointing to the nodes to merge
 */
InMemoryBTree.Tree.prototype._mergeSiblings = function(parent,index,pos) {
    var i,j;
    var n1, n2;

    if (index === (parent.numberActives)) {
        index--;
	n1 = this._diskRead(parent.children[parent.numberActives - 1]);
	n2 = this._diskRead(parent.children[parent.numberActives]);
    } else {
        n1 = this._diskRead(parent.children[index]);
	n2 = this._diskRead(parent.children[index + 1]);
    }

    //Merge the current node with the left node
    var newNode = this._allocateNode();
    newNode.isLeaf = n1.isLeaf;
    newNode.level = n1.level;

    for(j=0; j<this.order-1; j++) {
	newNode.keys[j] = n1.keys[j];
	newNode.children[j] = n1.children[j];
    }

    newNode.keys[this.order-1] = parent.keys[index];
    newNode.children[this.order-1] = n1.children[this.order-1];

    for(j=0; j<this.order-1; j++) {
	newNode.keys[j+this.order] = n2.keys[j];
	newNode.children[j+this.order] = n2.children[j];
    }
    newNode.children[2*this.order-1] = n2.children[this.order-1];

    parent.children[index] = newNode;

    for(j=index; j<parent.numberActives;j++) {
	parent.keys[j] = parent.keys[j+1];
	parent.children[j+1] = parent.children[j+2];
    }

    newNode.numberActives = n1.numberActives + n2.numberActives+1;
    parent.numberActives--;

    for(i=parent.numberActives; i<2*this.order-1; i++) {
	parent.keys[i] = null;
    }

    if (parent.numberActives === 0 && this.root === parent) {
	this.root = newNode;
	if(newNode.level) {
	    newNode.isLeaf = false;
	} else {
	    newNode.isLeaf = true;
        }
    }

    this._diskWrite(newNode);
    if(this.root === newNode) {
        this._updateRootNode(this.root);
    }
    this._diskWrite(parent);
    this._diskDelete(n1);
    this._diskDelete(n2);

    return newNode;
}

/**
 * _deleteKeyFromNode
 *
 * Deletes the key at position index from the provided node.
 *
 * @param node The node where the key will be deleted.
 * @param index The index of the key that will be deletd.
 * @return true if the key can be deleted, false otherwise
 */
InMemoryBTree.Tree.prototype._deleteKeyFromNode = function(node,index) {
    var keysMax = (2*this.order)-1;
    if(node.numberActives < keysMax) {
        keysMax = node.numberActives;
    };

    var i;

    if(node.isLeaf === false) {
	return false;
    }

    var key = node.keys[index];

    for(i=index; i<keysMax-1; i++) {
	node.keys[i] = node.keys[i+1];
    }

    // cleaning invalid reference
    node.keys.pop();

    node.numberActives--;

    this._diskWrite(node);

    return true;
}

InMemoryBTree.Tree.prototype._mergeNodes = function(n1, key, n2) {
    var newNode;
    var i;

    newNode = this._allocateNode();
    newNode.isLeaf = true;

    for(i=0; i<n1.numberActives; i++) {
	newNode.keys[i]   = n1.keys[i];
        newNode.children[i]   = n1.children[i];
    }
    newNode.children[n1.numberActives] = n1.children[n1.numberActives];
    newNode.keys[n1.numberActives] = key;

    for(i=0; i<n2.numberActives; i++) {
	newNode.keys[i+n1.numberActives+1] = n2.keys[i];
        newNode.children[i+n1.numberActives+1] = n2.children[i];
    }
    newNode.children[(2*this.order)-1] = n2.children[n2.numberActives];

    newNode.numberActives = n1.numberActives + n2.numberActives + 1;
    newNode.isLeaf = n1.isLeaf;
    newNode.level = n1.level;


    this._diskWrite(newNode);
    // @todo
    // delte old nodes from disk
    return newNode;
}

/**
 * audit
 *
 * Checks that the tree data structure is
 * valid.
 */
InMemoryBTree.Tree.prototype.audit = function(showOutput) {
    var errors = [];
    var alreadySeen = [];
    var that = this;

    var foundInArray = function(data) {
        for(var i=0; i<alreadySeen.length; i++) {
            if(that.comparator(alreadySeen[i],data)===0) {
                var error = " !!! duplicated key " + data;
                if(showOutput===true) {
                    console.log(error);
                }
                errors.push(error);
            }
        }
    };

    var length = null;
    var that = this;
    this.walkNodes(function(n) {
        if(showOutput === true) {
          console.log("--- Node at "+ n.level + " level");
          console.log(" - leaf? " + n.isLeaf);
          console.log(" - num actives? " + n.numberActives);
          console.log(" - keys: ");
        }
        for(var i = n.numberActives ; i<n.keys.length; i++) {
            if(n.keys[i] != null) {
                if(showOutput===true) {
                    console.log(" * warning : redundant key data");
                    errors.push(" * warning : redundant key data");
                }
            }
        }

        for(var i = n.numberActives+1 ; i<n.children.length; i++) {
            if(n.children[i] != null) {
                if(showOutput===true) {
                    console.log(" * warning : redundant children data");
                    errors.push(" * warning : redundant key data");
                }
            }
        }


        if(n.isLeaf === false) {
          for(var i=0; i<n.numberActives; i++) {
              var maxLeft = that._diskRead(n.children[i]).keys[that._diskRead(n.children[i]).numberActives -1 ].key
              var minRight = that._diskRead(n.children[i+1]).keys[0].key
              if(showOutput===true) {
                  console.log("   "+n.keys[i].key + "(" + maxLeft + "," + minRight+ ")");
              }
              if(that.comparator(n.keys[i].key,maxLeft)===-1) {
                  var error = " !!! value max left " + maxLeft + " > key " + n.keys[i].key;
                  if(showOutput===true) {
                      console.log(error);
                  }
                  errors.push(error);
              }
              if(that.comparator(n.keys[i].key,minRight)===1) {
                  var error = " !!! value min right " + minRight + " < key " + n.keys[i].key;
                  if(showOutput===true) {
                      console.log(error);
                  }
                  errors.push(error);
              }

              foundInArray(n.keys[i].key);
              alreadySeen.push(n.keys[i].key);
          }
        } else {
            if(length === null) {
                length = n.level;
            } else {
                if(length != n.level) {
                    var error = " !!! Leaf node with wrong level value";
                    if(showOutput===true) {
                        console.log(error);
                    }
                    errors.push(error);
                }
            }
            for(var i=0 ; i<n.numberActives; i++) {
                if(showOutput===true) {
                    console.log(" "+n.keys[i].key);
                }
                foundInArray(n.keys[i].key);
                alreadySeen.push(n.keys[i].key);

            }
        }

        if(n != that.root) {
            if(n.numberActives > ((2*that.order) -1)) {
                if(showOutput===true) {
                    var error = " !!!! MAX num keys restriction violated ";
                }
                console.log(error);
                errors.push(error);
            }
            if(n.numberActives < (that.order -1)) {
                if(showOutput===true) {
                    var error = " !!!! MIN num keys restriction violated ";
                }
                console.log(error);
                errors.push(error);
            }

        }
    });

    return errors;
}

/**
 *  _getMaxKeyPos
 *
 *  Used to get the position of the MAX key within the subtree
 *  @return An object containing the key and position of the key
 */
InMemoryBTree.Tree.prototype._getMaxKeyPos = function(node) {
    var node_pos = {};

    while(true) {
	if(node === null) {
	    break;
	}

	if(node.isLeaf === true) {
	    node_pos.node  = node;
	    node_pos.index = node.numberActives - 1;
	    return node_pos;
	} else {
	    node_pos.node  = node;
	    node_pos.index = node.numberActives - 1;
	    node = this._diskRead(node.children[node.numberActives]);
	}
    }

    return node_pos;
}

/**
 *  _getMinKeyPos
 *
 *  Used to get the position of the MAX key within the subtree
 *  @return An object containing the key and position of the key
 */
InMemoryBTree.Tree.prototype._getMinKeyPos = function(node) {
    var node_pos = {};

    while(true) {
	if(node === null) {
	    break;
	}

	if(node.isLeaf === true) {
	    node_pos.node  = node;
	    node_pos.index = 0;
	    return node_pos;
	} else {
	    node_pos.node  = node;
	    node_pos.index = 0;
	    node = this._diskRead(node.children[0]);
	}
    }

    return node_pos;
}


/**
 * Node
 *
 * Implements the interface of BinarySearchTree.Node
 *
 * A Tree node augmented with BTree
 * node structures
 */
InMemoryBTree.Node = function() {
    this.numberActives = 0;
    this.isLeaf = null;
    this.keys = [];
    this.children = [];
    this.level = 0;
};

// end of ./src/js-trees/src/in_memory_b_tree.js 
// exports
var QuadIndexCommon = {};

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
QuadIndexCommon.Pattern = function(components) {
    this.subject = components.subject;
    this.predicate = components.predicate;
    this.object = components.object;
    this.graph = components.graph;
    this.indexKey = [];

    this.keyComponents = {}

    var ks,ko,kp;
    var order = [];
    var indif = [];
    var components = ['subject', 'predicate', 'object', 'graph'];

    // components must have been already normalized and
    // inserted in the lexicon.
    // OIDs retrieved from the lexicon *are* numbers so
    // they can be told apart from variables (strings)
    for(var i=0; i<components.length; i++) {
        if(typeof(this[components[i]]) === 'string') {
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
}

// end of ./src/js-rdf-persistence/src/quad_index_common.js 
// exports
var QuadIndex = {};

// imports
var BaseTree = InMemoryBTree;

QuadIndex.Tree = function(params,callback) {
    if(arguments != 0) {
        this.componentOrder = params.componentOrder;


        // @todo change this if using the file backed implementation
        BaseTree.Tree.call(this, params.order, params['name'], params['persistent'], params['cacheMaxSize']);

        this.comparator = function(a,b) {
            for(var i=0; i< this.componentOrder.length; i++) {
                var component = this.componentOrder[i];
                var vala = a[component];
                var valb = b[component];
                if(vala < valb) {
                    return -1;
                } else if(vala > valb) {
                    return 1;
                }
            }
            return 0;
        }

        this.rangeComparator = function(a,b) {
            for(var i=0; i<this.componentOrder.length; i++) {
                var component = this.componentOrder[i];
                if(b[component] == null || a[component]==null) {
                    return 0;
                } else {
                    if(a[component] < b[component] ) {
                        return -1
                    } else if(a[component] > b[component]) {
                        return 1
                    }
                }
            }
            
            return 0;
        }

        if(callback!=null) {
            callback(this);
        }
    }
};

Utils['extends'](BaseTree.Tree, QuadIndex.Tree);

QuadIndex.Tree.prototype.insert = function(quad, callback) {
    BaseTree.Tree.prototype.insert.call(this, quad, null);
    if(callback)
        callback(true);

    return true
};

QuadIndex.Tree.prototype.search = function(quad, callback) {
    var result = BaseTree.Tree.prototype.search.call(this, quad, true); // true -> check exists : not present in all the b-tree implementations, check first.
    if(callback)
        callback(result)

    return result;
};

QuadIndex.Tree.prototype.range = function(pattern, callback) {
    var result = null;
    if(typeof(this.root)==='string') {
        result = this._rangeTraverse(this,this._diskRead(this.root), pattern);        
    } else {
        result = this._rangeTraverse(this,this.root, pattern);
    }

    if(callback)
        callback(result);

    return result;
}

QuadIndex.Tree.prototype._rangeTraverse = function(tree,node, pattern) {
    var patternKey  = pattern.key;
    var acum = [];
    var pendingNodes = [node];
    var node, idxMin, idxMax;
    while(pendingNodes.length > 0) {
        node = pendingNodes.shift();
        idxMin = 0;

        while(idxMin < node.numberActives && tree.rangeComparator(node.keys[idxMin].key,patternKey) === -1) {
            idxMin++;
        }
        if(node.isLeaf === true) {
            idxMax = idxMin;

            while(idxMax < node.numberActives && tree.rangeComparator(node.keys[idxMax].key,patternKey) === 0) {
                acum.push(node.keys[idxMax].key);
                idxMax++;
            }

        } else {
            var pointer = node.children[idxMin]
            var childNode = tree._diskRead(pointer);
            pendingNodes.push(childNode);

            var idxMax = idxMin;
            while(true) {
                if(idxMax < node.numberActives && tree.rangeComparator(node.keys[idxMax].key,patternKey) === 0) {
                    acum.push(node.keys[idxMax].key);
                    idxMax++;
                    childNode = tree._diskRead(node.children[idxMax]);
                    pendingNodes.push(childNode);
                } else {
                    break;
                }
            }
        }
    }
    return acum;
};

// end of ./src/js-rdf-persistence/src/quad_index.js 
// exports
var QuadBackend = {};


// imports


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

        for(var i=0; i<this.indices.length; i++) {
            var indexKey = this.indices[i];
            var tree = new QuadIndex.Tree({order: this.treeOrder,
                                           componentOrder: this.componentOrders[indexKey],
                                           persistent: configuration['persistent'],
                                           name: (configuration['name']||"")+indexKey,
                                           cacheMaxSize: configuration['cacheMaxSize']});
            this.indexMap[indexKey] = tree;
        }
        
        if(callback)
            callback(this);        
    }
}

QuadBackend.QuadBackend.prototype.clear = function() {
        for(var i=0; i<this.indices.length; i++) {
            var indexKey = this.indices[i];
            this.indexMap[indexKey].clear();
        }
};

QuadBackend.QuadBackend.prototype._indexForPattern = function(pattern) {
    var indexKey = pattern.indexKey;
    var matchingIndices = this.indices;

    for(var i=0; i<matchingIndices.length; i++) {
        var index = matchingIndices[i];
        var indexComponents = this.componentOrders[index]
        for(var j=0; j<indexComponents.length; j++) {
            if(Utils.include(indexKey, indexComponents[j])===false) {
                break;
            }
            if(j==indexKey.length-1) {
                return index;
            }
        }
    }
    
    return 'SPOG' // If no other match, we erturn the more generic index
}


QuadBackend.QuadBackend.prototype.index = function(quad, callback) {
    for(var i=0; i<this.indices.length; i++) {
        var indexKey = this.indices[i];
        var index= this.indexMap[indexKey];

        index.insert(quad);
    }

    if(callback)
        callback(true);

    return true;
}

QuadBackend.QuadBackend.prototype.range = function(pattern, callback)  {
    var indexKey = this._indexForPattern(pattern);
    var index = this.indexMap[indexKey];
    var quads = index.range(pattern);
    if(callback) 
        callback(quads);

    return quads;
}

QuadBackend.QuadBackend.prototype.search = function(quad, callback)  {
    var indexKey = this.indices[0];
    var index= this.indexMap[indexKey];
    var result = index.search(quad);

    if(callback)
        callback(result!=null);

    return (result!=null)
}


QuadBackend.QuadBackend.prototype['delete'] = function(quad, callback) {
    var indexKey, index;
    for(var i=0; i<this.indices.length; i++) {
        indexKey = this.indices[i];
        index= this.indexMap[indexKey];

        index['delete'](quad);
    }

    if(callback)
        callback(true);

    return true;
}

// end of ./src/js-rdf-persistence/src/quad_backend.js 
// exports
var Lexicon = {};

// imports

/**
 * Temporal implementation of the lexicon
 */


Lexicon.Lexicon = function(callback, _name){
    this.uriToOID = {};
    this.OIDToUri = {};

    this.literalToOID = {};
    this.OIDToLiteral = {};

    this.blankToOID = {};
    this.OIDToBlank = {};

    this.defaultGraphOid = 0;

    this.defaultGraphUri = "https://github.com/antoniogarrote/rdfstore-js#default_graph";
    this.defaultGraphUriTerm = {"token": "uri", "prefix": null, "suffix": null, "value": this.defaultGraphUri, "oid": this.defaultGraphOid};
    this.oidCounter = 1;

    this.knownGraphs = {};
    
    if(callback != null) {
        callback(this);
    }
};

Lexicon.Lexicon.prototype.registerGraph = function(oid){
    if(oid != this.defaultGraphOid) {
        this.knownGraphs[oid] = true;
    }
    return true
};

Lexicon.Lexicon.prototype.registeredGraphs = function(shouldReturnUris) {
    var acum = [];

    for(var g in this.knownGraphs) {
        if(shouldReturnUris === true) {
            acum.push(this.OIDToUri['u'+g]);
        } else {
            acum.push(g);
        }
    }
    return acum;
};

Lexicon.Lexicon.prototype.registerUri = function(uri) {
    if(uri === this.defaultGraphUri) {
        return(this.defaultGraphOid);
    } else if(this.uriToOID[uri] == null){
        var oid = this.oidCounter
        var oidStr = 'u'+oid;
        this.oidCounter++;

        this.uriToOID[uri] =[oid, 0];
        this.OIDToUri[oidStr] = uri;

        return(oid);
    } else {
        var oidCounter = this.uriToOID[uri];
        var oid = oidCounter[0];
        var counter = oidCounter[1] + 1;
        this.uriToOID[uri] = [oid, counter];
        return(oid);
    }
};

Lexicon.Lexicon.prototype.resolveUri = function(uri) {
    if(uri === this.defaultGraphUri) {
        return(this.defaultGraphOid);
    } else {
        var oidCounter = this.uriToOID[uri];
        if(oidCounter != null) {
            return(oidCounter[0]);
        } else {
            return(-1);
        }
    }
};

Lexicon.Lexicon.prototype.resolveUriCost = function(uri) {
    if(uri === this.defaultGraphUri) {
        return(this.defaultGraphOid);
    } else {
        var oidCounter = this.uriToOID[uri];
        if(oidCounter != null) {
            return(oidCounter[1]);
        } else {
            return(-1);
        }
    }
};

Lexicon.Lexicon.prototype.registerBlank = function(label) {
    var oid = this.oidCounter;
    this.oidCounter++;
    var oidStr = ""+oid;
    this.OIDToBlank[oidStr] = true;
    return(oidStr);
};

Lexicon.Lexicon.prototype.resolveBlank = function(label) {
//    @todo
//    this is failing with unicode tests... e.g. kanji2

//    var id = label.split(":")[1];
//    callback(id);

    var oid = this.oidCounter;
    this.oidCounter++;
    return(""+oid);
};

Lexicon.Lexicon.prototype.resolveBlankCost = function(label) {
    return 0;
};

Lexicon.Lexicon.prototype.registerLiteral = function(literal) {
    if(this.literalToOID[literal] == null){
        var oid = this.oidCounter;
        var oidStr =  'l'+ oid;
        this.oidCounter++;

        this.literalToOID[literal] = [oid, 0];
        this.OIDToLiteral[oidStr] = literal;

        return(oid);
    } else {
        var oidCounter = this.literalToOID[literal];
        var oid = oidCounter[0];
        var counter = oidCounter[1] + 1;
        this.literalToOID[literal] = [oid, counter];
        return(oid);
    }
};

Lexicon.Lexicon.prototype.resolveLiteral = function(literal) {
    var oidCounter = this.literalToOID[literal];
    if(oidCounter != null ) {
        return(oidCounter[0]); 
    } else {
        return(-1); 
    }
}

Lexicon.Lexicon.prototype.resolveLiteralCost = function(literal) {
    var oidCounter = this.literalToOID[literal];
    if(oidCounter != null ) {
        return(oidCounter[1]); 
    } else {
        return(0); 
    }
}


Lexicon.Lexicon.prototype.parseLiteral = function(literalString) {
    var parts = literalString.lastIndexOf("@");
    if(parts!=-1 && literalString[parts-1]==='"' && literalString.substring(parts, literalString.length).match(/^@[a-zA-Z\-]+$/g)!=null) {
        var value = literalString.substring(1,parts-1);
        var lang = literalString.substring(parts+1, literalString.length);
        return {token: "literal", value:value, lang:lang};
    }

    var parts = literalString.lastIndexOf("^^");
    if(parts!=-1 && literalString[parts-1]==='"' && literalString[parts+2] === '<' && literalString[literalString.length-1] === '>') {
        var value = literalString.substring(1,parts-1);
        var type = literalString.substring(parts+3, literalString.length-1);

        return {token: "literal", value:value, type:type};
    }

    var value = literalString.substring(1,literalString.length-1);
    return {token:"literal", value:value};
};

Lexicon.Lexicon.prototype.parseUri = function(uriString) {
    return {token: "uri", value:uriString};
};

Lexicon.Lexicon.prototype.retrieve = function(oid) {
    try {
        if(oid === this.defaultGraphOid) {
            return({ token: "uri", 
                       value:this.defaultGraphUri,
                       prefix: null,
                       suffix: null,
                       defaultGraph: true });
        } else {
          var maybeUri = this.OIDToUri['u'+oid];
          if(maybeUri != null) {
              return(this.parseUri(maybeUri));
          } else {
              var maybeLiteral = this.OIDToLiteral['l'+oid];
              if(maybeLiteral != null) {
                  return(this.parseLiteral(maybeLiteral));
              } else {
                  var maybeBlank = this.OIDToBlank[""+oid];
                  if(maybeBlank != null) {
                      return({token:"blank", value:"_:"+oid});
                  } else {
                      throw("Null value for OID");
                  }
              }
          }
        }
    } catch(e) {
        console.log("error in lexicon retrieving OID:");
        console.log(oid);
        if(e.message || e.stack) {
            if(e.message) {
                console.log(e.message); 
            }
            if(e.stack) {
                console.log(e.stack);
            }
        } else {
            console.log(e);
        }
        throw new Error("Unknown retrieving OID in lexicon:"+oid);

    }
};

Lexicon.Lexicon.prototype.clear = function() {
    this.uriToOID = {};
    this.OIDToUri = {};

    this.literalToOID = {};
    this.OIDToLiteral = {};

    this.blankToOID = {};
    this.OIDToBlank = {};
};

Lexicon.Lexicon.prototype.unregister = function(quad, key) {
    try {
        this.unregisterTerm(quad.subject.token, key.subject);
        this.unregisterTerm(quad.predicate.token, key.predicate);
        this.unregisterTerm(quad.object.token, key.object);
        if(quad.graph!=null) {
            this.unregisterTerm(quad.graph.token, key.graph); 
        }
        return(true);
    } catch(e) {
        console.log("Error unregistering quad");
        console.log(e.message);
        return(false);
    }
}

Lexicon.Lexicon.prototype.unregisterTerm = function(kind, oid) {
    if(kind === 'uri') {
        if(oid != this.defaultGraphOid) {
            var oidStr = 'u'+oid;
            var uri = this.OIDToUri[oidStr];     // = uri;
            var oidCounter = this.uriToOID[uri]; // =[oid, 0];
            
            var counter = oidCounter[1];
            if(""+oidCounter[0] === ""+oid) {
                if(counter === 0) {
                    delete this.OIDToUri[oidStr];
                    delete this.uriToOID[uri];
                    // delete the graph oid from known graphs
                    // in case this URI is a graph identifier
                    delete this.knownGraphs[oid];
                } else {
                    this.uriToOID[uri] = [oid, counter-1];
                }
            } else {
                throw("Not matching OID : "+oid+" vs "+ oidCounter[0]);
            }
        }
    } else if(kind === 'literal') {
        this.oidCounter++;
        var oidStr     =  'l'+ oid;
        var literal    = this.OIDToLiteral[oidStr];  // = literal;
        var oidCounter = this.literalToOID[literal]; // = [oid, 0];
        
        var counter = oidCounter[1];
        if(""+oidCounter[0] === ""+oid) {
            if(counter === 0) {
                delete this.OIDToLiteral[oidStr];
                delete this.literalToOID[literal];
            } else {
                this.literalToOID[literal] = [oid, counter-1];
            }
        } else {
            throw("Not matching OID : "+oid+" vs "+ oidCounter[0]);
        }

    } else if(kind === 'blank') {
        delete this.OIDToBlank[""+oid];
    }
}

// end of ./src/js-rdf-persistence/src/lexicon.js 
// exports
var NetworkTransport = {};

NetworkTransport.load = function(uri, accept, callback, redirect) {
    var transport = jQuery;

    transport.ajax({
        url: uri,
        headers: {"Accept": accept},

        success: function(data, status, xhr){
            if((""+xhr.status)[0] == '2') {
                var headers = xhr.getAllResponseHeaders().split("\n");
                var acum = {};
                for(var i=0; i<headers.length; i++) {
                    var header = headers[i].split(":");
                    acum[header[0]] = header[1];
                }

                callback(true, {headers: acum, 
                                data: data});
            }
        },

        error: function(xhr, textStatus, ex){
            if((""+xhr.status)[0] == '3'){                            
                if(redirection == 0) {
                    callback(false, 500);
                } else {
                    var location = (xhr.getAllResponseHeaders()["Location"] || xhr.getAllResponseHeaders()["location"])
                    if(location != null) {
                        NetworkTransport.load(location, accept, callback, (redirection -1));
                    } else {
                        callback(false, 500);
                    }
                } 
            } else {
                callback(false, xhr.statusCode());
            }
        }
    });
}

// end of ./src/js-communication/src/ajax_transport.js 

/**
 * Javascript implementation of JSON-LD.
 *
 * @author Dave Longley
 *
 * Copyright (c) 2011 Digital Bazaar, Inc. All rights reserved.
 */
var jsonldParser = null;

(function()
{

// used by Exception
var _setMembers = function(self, obj)
{
   self.stack = '';
   for(var key in obj)
   {
      self[key] = obj[key];
   }
};

// define node.js module
if(typeof(module) !== 'undefined' && module.exports)
{
   var jsonld = {};
   Exception = function(obj)
   {
      _setMembers(this, obj);
      this.stack = new Error().stack;
   };
}
// define jsonld
else if(typeof(window) !== 'undefined')
{
   var jsonld = window.jsonld = window.jsonld || {};
   Exception = function(obj)
   {
      _setMembers(this, obj);
   }
}
// Web worker running in the browser
else 
{
    window = {};
    var jsonld = window.jsonld = {};
   Exception = function(obj)
   {
      _setMembers(this, obj);
   }
}

jsonldParser = jsonld;

var defaultContext = { "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
                       "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
                       "owl": "http://www.w3.org/2002/07/owl#",
                       "xsd": "http://www.w3.org/2001/XMLSchema#",
                       "dcterms": "http://purl.org/dc/terms/",
                       "foaf": "http://xmlns.com/foaf/0.1/",
                       "cal": "http://www.w3.org/2002/12/cal/ical#",
                       "vcard": "http://www.w3.org/2006/vcard/ns# ",
                       "geo": "http://www.w3.org/2003/01/geo/wgs84_pos#",
                       "cc": "http://creativecommons.org/ns#",
                       "sioc": "http://rdfs.org/sioc/ns#",
                       "doap": "http://usefulinc.com/ns/doap#",
                       "com": "http://purl.org/commerce#",
                       "ps": "http://purl.org/payswarm#",
                       "gr": "http://purl.org/goodrelations/v1#",
                       "sig": "http://purl.org/signature#",
                       "ccard": "http://purl.org/commerce/creditcard#"
                     };
/*
 * Globals and helper functions.
 */
var ns =
{
    'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    'xsd': 'http://www.w3.org/2001/XMLSchema#'
};

var xsd =
{
   'boolean': ns.xsd + 'boolean',
   'double': ns.xsd + 'double',
   'integer': ns.xsd + 'integer'
};

/**
 * Sets a subject's property to the given object value. If a value already
 * exists, it will be appended to an array.
 *
 * @param s the subject.
 * @param p the property.
 * @param o the object.
 */
var _setProperty = function(s, p, o)
{
   if(p in s)
   {
      if(s[p].constructor === Array)
      {
         s[p].push(o);
      }
      else
      {
         s[p] = [s[p], o];
      }
   }
   else
   {
      s[p] = o;
   }
};

/**
 * Clones an object, array, or string/number. If cloning an object, the keys
 * will be sorted.
 * 
 * @param value the value to clone.
 * 
 * @return the cloned value.
 */
var _clone = function(value)
{
   var rval;
   
   if(value.constructor === Object)
   {
      rval = {};
      var keys = Utils.keys(value).sort();
      for(var i in keys)
      {
         var key = keys[i];
         rval[key] = _clone(value[key]);
      }
   }
   else if(value.constructor === Array)
   {
      rval = [];
      for(var i in value)
      {
         rval[i] = _clone(value[i]);
      }
   }
   else
   {
      rval = value;
   }
   
   return rval;
};

/**
 * Gets the keywords from a context.
 * 
 * @param ctx the context.
 * 
 * @return the keywords.
 */
var _getKeywords = function(ctx)
{
   // TODO: reduce calls to this function by caching keywords in processor
   // state
   
   var rval =
   {
      '@datatype': '@datatype',
      '@iri': '@iri',
      '@language': '@language',
      '@literal': '@literal',
      '@subject': '@subject',
      '@type': '@type'
   };
   
   if(ctx)
   {
      // gather keyword aliases from context
      var keywords = {};
      for(var key in ctx)
      {
         if(ctx[key].constructor === String &&
            ctx[key] in rval)
         {
            keywords[ctx[key]] = key;
         }
      }
      
      // overwrite keywords
      for(var key in keywords)
      {
         rval[key] = keywords[key];
      }
   }
   
   return rval;
};

/**
 * Compacts an IRI into a term or CURIE if it can be. IRIs will not be
 * compacted to relative IRIs if they match the given context's default
 * vocabulary.
 *
 * @param ctx the context to use.
 * @param iri the IRI to compact.
 * @param usedCtx a context to update if a value was used from "ctx".
 *
 * @return the compacted IRI as a term or CURIE or the original IRI.
 */
var _compactIri = function(ctx, iri, usedCtx)
{
   var rval = null;
   
   // check the context for a term that could shorten the IRI
   // (give preference to terms over CURIEs)
   for(var key in ctx)
   {
      // skip special context keys (start with '@')
      if(key.length > 0 && key[0] !== '@')
      {
         // compact to a term
         if(iri === ctx[key])
         {
            rval = key;
            if(usedCtx !== null)
            {
               usedCtx[key] = ctx[key];
            }
            break;
         }
      }
   }
   
   // term not found, if term is rdf type, use @type keyword
   if(rval === null && iri === ns.rdf + 'type')
   {
      rval = _getKeywords(ctx)['@type'];
   }
   
   // term not found, check the context for a CURIE prefix
   if(rval === null)
   {
      for(var key in ctx)
      {
         // skip special context keys (start with '@')
         if(key.length > 0 && key[0] !== '@')
         {
            // see if IRI begins with the next IRI from the context
            var ctxIri = ctx[key];
            var idx = iri.indexOf(ctxIri);
            
            // compact to a CURIE
            if(idx === 0 && iri.length > ctxIri.length)
            {
               rval = key + ':' + iri.substr(ctxIri.length);
               if(usedCtx !== null)
               {
                  usedCtx[key] = ctxIri;
               }
               break;
            }
         }
      }
   }

   // could not compact IRI
   if(rval === null)
   {
      rval = iri;
   }

   return rval;
};

/**
 * Expands a term into an absolute IRI. The term may be a regular term, a
 * CURIE, a relative IRI, or an absolute IRI. In any case, the associated
 * absolute IRI will be returned.
 *
 * @param ctx the context to use.
 * @param term the term to expand.
 * @param usedCtx a context to update if a value was used from "ctx".
 *
 * @return the expanded term as an absolute IRI.
 */
var _expandTerm = function(ctx, term, usedCtx)
{
   var rval;
   
   // get JSON-LD keywords
   var keywords = _getKeywords(ctx);
   
   // 1. If the property has a colon, then it is a CURIE or an absolute IRI:
   var idx = term.indexOf(':');
   if(idx != -1)
   {
      // get the potential CURIE prefix
      var prefix = term.substr(0, idx);

      // 1.1. See if the prefix is in the context:
      if(prefix in ctx)
      {
         // prefix found, expand property to absolute IRI
         rval = ctx[prefix] + term.substr(idx + 1);
         if(usedCtx !== null)
         {
            usedCtx[prefix] = ctx[prefix];
         }
      }
      // 1.2. Prefix is not in context, property is already an absolute IRI:
      else
      {
         rval = term;
      }
   }
   // 2. If the property is in the context, then it's a term.
   else if(term in ctx)
   {
      rval = ctx[term];
      if(usedCtx !== null)
      {
         usedCtx[term] = rval;
      }
   }
   // 3. The property is the special-case subject.
   else if(term === keywords['@subject'])
   {
      rval = keywords['@subject'];
   }
   // 4. The property is the special-case rdf type.
   else if(term === keywords['@type'])
   {
      rval = ns.rdf + 'type';
   }
   // 5. The property is a relative IRI, prepend the default vocab.
   else
   {
      rval = term;
      if('@vocab' in ctx)
      {
         rval = ctx['@vocab'] + rval;
         if(usedCtx !== null)
         {
            usedCtx['@vocab'] = ctx['@vocab'];
         }
      }
   }

   return rval;
};

/*
 * JSON-LD API.
 */

/**
 * Normalizes a JSON-LD object.
 *
 * @param input the JSON-LD object to normalize.
 * 
 * @return the normalized JSON-LD object.
 */
jsonld.normalize = function(input)
{
   return new Processor().normalize(input);
};

/**
 * Removes the context from a JSON-LD object, expanding it to full-form.
 *
 * @param input the JSON-LD object to remove the context from.
 * 
 * @return the context-neutral JSON-LD object.
 */
jsonld.expand = function(input)
{
   return new Processor().expand({}, null, input, false);
};

/**
 * Expands the given JSON-LD object and then compacts it using the
 * given context.
 *
 * @param ctx the new context to use.
 * @param input the input JSON-LD object.
 * 
 * @return the output JSON-LD object.
 */
jsonld.compact = function(ctx, input)
{
   var rval = null;
   
   // TODO: should context simplification be optional? (ie: remove context
   // entries that are not used in the output)

   if(input !== null)
   {
      // fully expand input
      input = jsonld.expand(input);
      
      var tmp;
      if(input.constructor === Array)
      {
         rval = [];
         tmp = input;
      }
      else
      {
         tmp = [input];
      }
      
      for(var i in tmp)
      {
         // setup output context
         var ctxOut = {};
         
         // compact
         var out = new Processor().compact(_clone(ctx), null, tmp[i], ctxOut);
         
         // add context if used
         if(Utils.keys(ctxOut).length > 0)
         {
            out['@context'] = ctxOut;
         }
         
         if(rval === null)
         {
            rval = out;
         }
         else
         {
            rval.push(out);
         }
      }
   }

   return rval;
};

/**
 * Merges one context with another.
 *
 * @param ctx1 the context to overwrite/append to.
 * @param ctx2 the new context to merge onto ctx1.
 *
 * @return the merged context.
 */
jsonld.mergeContexts = function(ctx1, ctx2)
{
   // copy contexts
   var merged = _clone(ctx1);
   var copy = _clone(ctx2);

   // if the new context contains any IRIs that are in the merged context,
   // remove them from the merged context, they will be overwritten
   for(var key in copy)
   {
      // ignore special keys starting with '@'
      if(key.indexOf('@') !== 0)
      {
         for(var mkey in merged)
         {
            if(merged[mkey] === copy[key])
            {
               delete merged[mkey];
               break;
            }
         }
      }
   }

   // @coerce must be specially-merged, remove from contexts
   var coerceExists = ('@coerce' in merged) || ('@coerce' in copy);
   if(coerceExists)
   {
      var c1 = ('@coerce' in merged) ? merged['@coerce'] : {};
      var c2 = ('@coerce' in copy) ? copy['@coerce'] : {};
      delete merged['@coerce'];
      delete copy['@coerce'];
   }

   // merge contexts
   for(var key in copy)
   {
      merged[key] = copy[key];
   }
   
   // special-merge @coerce
   if(coerceExists)
   {
      for(var type in c1)
      {
         // append existing-type properties that don't already exist
         if(type in c2)
         {
            var p1 = c1[type];
            var p2 = c2[type];
            
            // normalize props in c2 to array for single-code-path iterating
            if(p2.constructor !== Array)
            {
               p2 = [p2];
            }
            
            // add unique properties from p2 to p1
            for(var i in p2)
            {
               var p = p2[i];
               if((p1.constructor !== Array && p1 !== p) ||
                  (p1.constructor === Array && p1.indexOf(p) == -1))
               {
                  if(p1.constructor === Array)
                  {
                     p1.push(p);
                  }
                  else
                  {
                     p1 = c1[type] = [p1, p];
                  }
               }
            }
         }
      }
      
      // add new types from new @coerce
      for(var type in c2)
      {
         if(!(type in c1))
         {
            c1[type] = c2[type]; 
         }
      }
      
      // ensure there are no property duplicates in @coerce
      var unique = {};
      var dups = [];
      for(var type in c1)
      {
         var p = c1[type];
         if(p.constructor === String)
         {
            p = [p];
         }
         for(var i in p)
         {
            if(!(p[i] in unique))
            {
               unique[p[i]] = true;
            }
            else if(dups.indexOf(p[i]) == -1)
            {
               dups.push(p[i]);
            }
         }
      }

      if(dups.length > 0)
      {
         throw {
            message: 'Invalid type coercion specification. More than one ' +
               'type specified for at least one property.',
            duplicates: dups
         };
      }
      
      merged['@coerce'] = c1;
   }

   return merged;
};

/**
 * Expands a term into an absolute IRI. The term may be a regular term, a
 * CURIE, a relative IRI, or an absolute IRI. In any case, the associated
 * absolute IRI will be returned.
 *
 * @param ctx the context to use.
 * @param term the term to expand.
 *
 * @return the expanded term as an absolute IRI.
 */
jsonld.expandTerm = _expandTerm;

/**
 * Compacts an IRI into a term or CURIE if it can be. IRIs will not be
 * compacted to relative IRIs if they match the given context's default
 * vocabulary.
 *
 * @param ctx the context to use.
 * @param iri the IRI to compact.
 *
 * @return the compacted IRI as a term or CURIE or the original IRI.
 */
jsonld.compactIri = function(ctx, iri)
{
   return _compactIri(ctx, iri, null);
};

/**
 * Frames JSON-LD input.
 * 
 * @param input the JSON-LD input.
 * @param frame the frame to use.
 * @param options framing options to use.
 * 
 * @return the framed output.
 */
jsonld.frame = function(input, frame, options)
{
   return new Processor().frame(input, frame, options);
};

/**
 * Generates triples given a JSON-LD input. Each triple that is generated
 * results in a call to the given callback. The callback takes 3 parameters:
 * subject, property, and object. If the callback returns false then this
 * method will stop generating triples and return. If the callback is null,
 * then an array with triple objects containing "s", "p", "o" properties will
 * be returned.
 * 
 * The object or "o" property will be a JSON-LD formatted object.
 * 
 * @param input the JSON-LD input.
 * @param callback the triple callback.
 * 
 * @return an array of triple objects if callback is null, null otherwise.
 */
jsonld.toTriples = function(input, graph, callback)
{
   var rval = null;
   
   // normalize input
   normalized = jsonld.normalize(input);
   
   // setup default callback
   callback = callback || null;
   if(callback === null)
   {
      rval = [];
      callback = function(s, p, o)
      {
         rval.push({'subject': Utils.lexicalFormTerm(s), 
                    'predicate': Utils.lexicalFormTerm(p), 
                    'object': Utils.lexicalFormTerm(o), 
                    'graph': graph});
      };
   }
   
   // generate triples
   var quit = false;
   for(var i1 in normalized)
   {
      var e = normalized[i1];
      var s = {'token': 'uri', 'value': e['@subject']['@iri']};
       if(s['value'][0] === "_") {
           s['token'] = 'blank';
           s['label'] = s['value'].split(":")[1]
       }
      for(var p in e)
      {
         if(p !== '@subject')
         {
            var obj = e[p];
            if(obj.constructor !== Array)
            {
               obj = [obj];
            }
            for(var i2 in obj)
            {
                var obji2 = obj[i2]
                if(typeof(obji2) === 'string') {
                    obji2 = {'token': 'literal', 'value':obji2};
                } else if(obji2['@iri'] != null) {
                    if(obji2['@iri'][0] == "_") {
                        obji2 = {'token':'blank', 'label':obji2['@iri'].split(":")[1]}
                    } else {
                        obji2 = {'token':'uri', 'value':obji2['@iri']}
                    }
                } else if(obji2['@datatype'] != null) {
                    obji2 = {'token':'literal', 'value':obji2['@literal'], 'type':obji2['@datatype']}                    
                } else if(obji2['@language'] != null) {
                    obji2 = {'token':'literal', 'value':obji2['@literal'], 'lang':obji2['@language']}
                }
               quit = (callback(s, 
                                {'token':'uri', 'value':p}, 
                                obji2) === false);
               if(quit)
               {
                  break;
               }
            }
            if(quit)
            {
               break;
            }
         }
      }
      if(quit)
      {
         break;
      }
   }
   
   return rval;
};

// TODO: organizational rewrite

/**
 * Constructs a new JSON-LD processor.
 */
var Processor = function()
{
};

/**
 * Recursively compacts a value. This method will compact IRIs to CURIEs or
 * terms and do reverse type coercion to compact a value.
 *
 * @param ctx the context to use.
 * @param property the property that points to the value, NULL for none.
 * @param value the value to compact.
 * @param usedCtx a context to update if a value was used from "ctx".
 *
 * @return the compacted value.
 */
Processor.prototype.compact = function(ctx, property, value, usedCtx)
{
   var rval;
   
   // get JSON-LD keywords
   var keywords = _getKeywords(ctx);
   
   if(value === null)
   {
      // return null, but check coerce type to add to usedCtx
      rval = null;
      this.getCoerceType(ctx, property, usedCtx);
   }
   else if(value.constructor === Array)
   {
      // recursively add compacted values to array
      rval = [];
      for(var i in value)
      {
         rval.push(this.compact(ctx, property, value[i], usedCtx));
      }
   }
   // graph literal/disjoint graph
   else if(
      value.constructor === Object &&
      '@subject' in value && value['@subject'].constructor === Array)
   {
      rval = {};
      rval[keywords['@subject']] = this.compact(
         ctx, property, value['@subject'], usedCtx);
   }
   // value has sub-properties if it doesn't define a literal or IRI value
   else if(
      value.constructor === Object &&
      !('@literal' in value) && !('@iri' in value))
   {
      // recursively handle sub-properties that aren't a sub-context
      rval = {};
      for(var key in value)
      {
         if(value[key] !== '@context')
         {
            // set object to compacted property, only overwrite existing
            // properties if the property actually compacted
            var p = _compactIri(ctx, key, usedCtx);
            if(p !== key || !(p in rval))
            {
               // FIXME: clean old values from the usedCtx here ... or just
               // change usedCtx to be built at the end of processing? 
               rval[p] = this.compact(ctx, key, value[key], usedCtx);
            }
         }
      }
   }
   else
   {
      // get coerce type
      var coerce = this.getCoerceType(ctx, property, usedCtx);

      // get type from value, to ensure coercion is valid
      var type = null;
      if(value.constructor === Object)
      {
         // type coercion can only occur if language is not specified
         if(!('@language' in value))
         {
            // datatype must match coerce type if specified
            if('@datatype' in value)
            {
               type = value['@datatype'];
            }
            // datatype is IRI
            else if('@iri' in value)
            {
               type = '@iri';
            }
            // can be coerced to any type
            else
            {
               type = coerce;
            }
         }
      }
      // type can be coerced to anything
      else if(value.constructor === String)
      {
         type = coerce;
      }

      // types that can be auto-coerced from a JSON-builtin
      if(coerce === null &&
         (type === xsd['boolean'] || type === xsd['integer'] || type === xsd['double']))
      {
         coerce = type;
      }

      // do reverse type-coercion
      if(coerce !== null)
      {
         // type is only null if a language was specified, which is an error
         // if type coercion is specified
         if(type === null)
         {
            throw {
               message: 'Cannot coerce type when a language is specified. ' +
                  'The language information would be lost.'
            };
         }
         // if the value type does not match the coerce type, it is an error
         else if(type !== coerce)
         {
            throw new Exception({
               message: 'Cannot coerce type because the datatype does ' +
                  'not match.',
               type: type,
               expected: coerce
            });
         }
         // do reverse type-coercion
         else
         {
            if(value.constructor === Object)
            {
               if('@iri' in value)
               {
                  rval = value['@iri'];
               }
               else if('@literal' in value)
               {
                  rval = value['@literal'];
               }
            }
            else
            {
               rval = value;
            }

            // do basic JSON types conversion
            if(coerce === xsd['boolean'])
            {
               rval = (rval === 'true' || rval != 0);
            }
            else if(coerce === xsd['double'])
            {
               rval = parseFloat(rval);
            }
            else if(coerce === xsd['integer'])
            {
               rval = parseInt(rval);
            }
         }
      }
      // no type-coercion, just change keywords/copy value
      else if(value.constructor === Object)
      {
         rval = {};
         for(var key in value)
         {
            rval[keywords[key]] = value[key];
         }
      }
      else
      {
         rval = _clone(value);
      }

      // compact IRI
      if(type === '@iri')
      {
         if(rval.constructor === Object)
         {
            rval[keywords['@iri']] = _compactIri(
               ctx, rval[keywords['@iri']], usedCtx);
         }
         else
         {
            rval = _compactIri(ctx, rval, usedCtx);
         }
      }
   }

   return rval;
};

/**
 * Recursively expands a value using the given context. Any context in
 * the value will be removed.
 *
 * @param ctx the context.
 * @param property the property that points to the value, NULL for none.
 * @param value the value to expand.
 * @param expandSubjects true to expand subjects (normalize), false not to.
 *
 * @return the expanded value.
 */
Processor.prototype.expand = function(ctx, property, value, expandSubjects)
{
   var rval;
   
   // TODO: add data format error detection?
   
   // value is null, nothing to expand
   if(value === null)
   {
      rval = null;
   }
   // if no property is specified and the value is a string (this means the
   // value is a property itself), expand to an IRI
   else if(property === null && value.constructor === String)
   {
      rval = _expandTerm(ctx, value, null);
   }
   else if(value.constructor === Array)
   {
      // recursively add expanded values to array
      rval = [];
      for(var i in value)
      {
         rval.push(this.expand(ctx, property, value[i], expandSubjects));
      }
   }
   else if(value.constructor === Object)
   {
      // if value has a context, use it
      if('@context' in value)
      {
         ctx = jsonld.mergeContexts(ctx, value['@context']);
      }
      
      // get JSON-LD keywords
      var keywords = _getKeywords(ctx);
      
      // value has sub-properties if it doesn't define a literal or IRI value
      if(!(keywords['@literal'] in value || keywords['@iri'] in value))
      {
         // recursively handle sub-properties that aren't a sub-context
         rval = {};
         for(var key in value)
         {
            // preserve frame keywords
            if(key === '@embed' || key === '@explicit' ||
               key === '@default' || key === '@omitDefault')
            {
               _setProperty(rval, key, _clone(value[key]));
            }
            else if(key !== '@context')
            {
               // set object to expanded property
               _setProperty(
                  rval, _expandTerm(ctx, key, null),
                  this.expand(ctx, key, value[key], expandSubjects));
            }
         }
      }
      // only need to expand keywords
      else
      {
         rval = {};
         if(keywords['@iri'] in value)
         {
            rval['@iri'] = value[keywords['@iri']];
         }
         else
         {
            rval['@literal'] = value[keywords['@literal']];
            if(keywords['@language'] in value)
            {
               rval['@language'] = value[keywords['@language']];
            }
            else if(keywords['@datatype'] in value)
            {
               rval['@datatype'] = value[keywords['@datatype']];
            }
         }
      }
   }
   else
   {
      // do type coercion
      var coerce = this.getCoerceType(ctx, property, null);

      // get JSON-LD keywords
      var keywords = _getKeywords(ctx);

      // automatic coercion for basic JSON types
      if(coerce === null &&
         (value.constructor === Number || value.constructor === Boolean))
      {
         if(value.constructor === Boolean)
         {
            coerce = xsd['boolean'];
         }
         else if(('' + value).indexOf('.') == -1)
         {
            coerce = xsd['integer'];
         }
         else
         {
            coerce = xsd['double'];
         }
      }

      // coerce to appropriate datatype, only expand subjects if requested
      if(coerce !== null &&
         (property !== keywords['@subject'] || expandSubjects))
      {
         rval = {};
         
         // expand IRI
         if(coerce === '@iri')
         {
            rval['@iri'] = _expandTerm(ctx, value, null);
         }
         // other datatype
         else
         {
            rval['@datatype'] = coerce;
            if(coerce === xsd['double'])
            {
               // do special JSON-LD double format
               value = value.toExponential(6).replace(
                  /(e(?:\+|-))([0-9])$/, '$10$2');
            }
            rval['@literal'] = '' + value;
         }
      }
      // nothing to coerce
      else
      {
         rval = '' + value;
      }
   }
   
   return rval;
};

/**
 * Normalizes a JSON-LD object.
 *
 * @param input the JSON-LD object to normalize.
 * 
 * @return the normalized JSON-LD object.
 */
Processor.prototype.normalize = function(input)
{
   var rval = [];

   // TODO: validate context
   
   if(input !== null)
   {
      // create name generator state
      this.ng =
      {
         tmp: null,
         c14n: null
      };
      
      // expand input
      var expanded = this.expand(defaultContext, null, input, true);
      
      // assign names to unnamed bnodes
      this.nameBlankNodes(expanded);

      // flatten
      var subjects = {};
      _flatten(null, null, expanded, subjects);

      // append subjects with sorted properties to array
      for(var key in subjects)
      {
         var s = subjects[key];
         var sorted = {};
         var keys = Utils.keys(s).sort();
         for(var i in keys)
         {
            var k = keys[i];
            sorted[k] = s[k];
         }
         rval.push(sorted);
      }

      // canonicalize blank nodes
      this.canonicalizeBlankNodes(rval);

      // sort output
      rval.sort(function(a, b)
      {
         return _compare(a['@subject']['@iri'], b['@subject']['@iri']);
      });
   }

   return rval;
};

/**
 * Gets the coerce type for the given property.
 *
 * @param ctx the context to use.
 * @param property the property to get the coerced type for.
 * @param usedCtx a context to update if a value was used from "ctx".
 *
 * @return the coerce type, null for none.
 */
Processor.prototype.getCoerceType = function(ctx, property, usedCtx)
{
   var rval = null;

   // get expanded property
   var p = _expandTerm(ctx, property, null);
   
   // built-in type coercion JSON-LD-isms
   if(p === '@subject' || p === ns.rdf + 'type')
   {
      rval = '@iri';
   }
   // check type coercion for property
   else if('@coerce' in ctx)
   {
      // force compacted property
      p = _compactIri(ctx, p, null);
      
      for(var type in ctx['@coerce'])
      {
         // get coerced properties (normalize to an array)
         var props = ctx['@coerce'][type];
         if(props.constructor !== Array)
         {
            props = [props];
         }
         
         // look for the property in the array
         for(var i in props)
         {
            // property found
            if(props[i] === p)
            {
               rval = _expandTerm(ctx, type, usedCtx);
               if(usedCtx !== null)
               {
                  if(!('@coerce' in usedCtx))
                  {
                     usedCtx['@coerce'] = {};
                  }
                  
                  if(!(type in usedCtx['@coerce']))
                  {
                     usedCtx['@coerce'][type] = p;
                  }
                  else
                  {
                     var c = usedCtx['@coerce'][type];
                     if((c.constructor === Array && c.indexOf(p) == -1) ||
                        (c.constructor === String && c !== p))
                     {
                        _setProperty(usedCtx['@coerce'], type, p);
                     }
                  }
               }
               break;
            }
         }
      }
   }
   
   return rval;
};

var _isBlankNodeIri = function(v)
{
   return v.indexOf('_:') === 0;
};

var _isNamedBlankNode = function(v)
{
   // look for "_:" at the beginning of the subject
   return (
      v.constructor === Object && '@subject' in v &&
      '@iri' in v['@subject'] && _isBlankNodeIri(v['@subject']['@iri']));
};

var _isBlankNode = function(v)
{
   // look for no subject or named blank node
   return (
      v.constructor === Object &&
      !('@iri' in v || '@literal' in v) &&
      (!('@subject' in v) || _isNamedBlankNode(v)));
};

/**
 * Compares two values.
 * 
 * @param v1 the first value.
 * @param v2 the second value.
 * 
 * @return -1 if v1 < v2, 0 if v1 == v2, 1 if v1 > v2.
 */
var _compare = function(v1, v2)
{
   var rval = 0;
   
   if(v1.constructor === Array && v2.constructor === Array)
   {
      for(var i = 0; i < v1.length && rval === 0; ++i)
      {
         rval = _compare(v1[i], v2[i]);
      }
   }
   else
   {
      rval = (v1 < v2 ? -1 : (v1 > v2 ? 1 : 0));
   }
   
   return rval;
};

/**
 * Compares two keys in an object. If the key exists in one object
 * and not the other, the object with the key is less. If the key exists in
 * both objects, then the one with the lesser value is less.
 * 
 * @param o1 the first object.
 * @param o2 the second object.
 * @param key the key.
 * 
 * @return -1 if o1 < o2, 0 if o1 == o2, 1 if o1 > o2.
 */
var _compareObjectKeys = function(o1, o2, key)
{
   var rval = 0;
   if(key in o1)
   {
      if(key in o2)
      {
         rval = _compare(o1[key], o2[key]);
      }
      else
      {
         rval = -1;
      }
   }
   else if(key in o2)
   {
      rval = 1;
   }
   return rval;
};

/**
 * Compares two object values.
 * 
 * @param o1 the first object.
 * @param o2 the second object.
 * 
 * @return -1 if o1 < o2, 0 if o1 == o2, 1 if o1 > o2.
 */
var _compareObjects = function(o1, o2)
{
   var rval = 0;
   
   if(o1.constructor === String)
   {
      if(o2.constructor !== String)
      {
         rval = -1;
      }
      else
      {
         rval = _compare(o1, o2);
      }
   }
   else if(o2.constructor === String)
   {
      rval = 1;
   }
   else
   {
      rval = _compareObjectKeys(o1, o2, '@literal');
      if(rval === 0)
      {
         if('@literal' in o1)
         {
            rval = _compareObjectKeys(o1, o2, '@datatype');
            if(rval === 0)
            {
               rval = _compareObjectKeys(o1, o2, '@language');
            }
         }
         // both are '@iri' objects
         else
         {
            rval = _compare(o1['@iri'], o2['@iri']);
         }
      }
   }
   
   return rval;
};

/**
 * Compares the object values between two bnodes.
 * 
 * @param a the first bnode.
 * @param b the second bnode.
 * 
 * @return -1 if a < b, 0 if a == b, 1 if a > b.
 */
var _compareBlankNodeObjects = function(a, b)
{
   var rval = 0;
   
   /*
   3. For each property, compare sorted object values.
   3.1. The bnode with fewer objects is first.
   3.2. For each object value, compare only literals and non-bnodes.
   3.2.1. The bnode with fewer non-bnodes is first.
   3.2.2. The bnode with a string object is first.
   3.2.3. The bnode with the alphabetically-first string is first.
   3.2.4. The bnode with a @literal is first.
   3.2.5. The bnode with the alphabetically-first @literal is first.
   3.2.6. The bnode with the alphabetically-first @datatype is first.
   3.2.7. The bnode with a @language is first.
   3.2.8. The bnode with the alphabetically-first @language is first.
   3.2.9. The bnode with the alphabetically-first @iri is first.
   */
   
   for(var p in a)
   {
      // step #3.1
      var lenA = (a[p].constructor === Array) ? a[p].length : 1;
      var lenB = (b[p].constructor === Array) ? b[p].length : 1;
      rval = _compare(lenA, lenB);
      
      // step #3.2.1
      if(rval === 0)
      {
         // normalize objects to an array
         var objsA = a[p];
         var objsB = b[p];
         if(objsA.constructor !== Array)
         {
            objsA = [objsA];
            objsB = [objsB];
         }
         
         // filter non-bnodes (remove bnodes from comparison)
         objsA = objsA.filter(function(e) {
            return (e.constructor === String ||
               !('@iri' in e && _isBlankNodeIri(e['@iri'])));
         });
         objsB = objsB.filter(function(e) {
            return (e.constructor === String ||
               !('@iri' in e && _isBlankNodeIri(e['@iri'])));
         });
         
         rval = _compare(objsA.length, objsB.length);
      }
      
      // steps #3.2.2-3.2.9
      if(rval === 0)
      {
         objsA.sort(_compareObjects);
         objsB.sort(_compareObjects);
         for(var i = 0; i < objsA.length && rval === 0; ++i)
         {
            rval = _compareObjects(objsA[i], objsB[i]);
         }
      }
      
      if(rval !== 0)
      {
         break;
      }
   }
   
   return rval;
};

/**
 * Creates a blank node name generator using the given prefix for the
 * blank nodes. 
 * 
 * @param prefix the prefix to use.
 * 
 * @return the blank node name generator.
 */
var _createNameGenerator = function(prefix)
{
   var count = -1;
   var ng = {
      next: function()
      {
         ++count;
         return ng.current();
      },
      current: function()
      {
         return '_:' + prefix + count;
      },
      inNamespace: function(iri)
      {
         return iri.indexOf('_:' + prefix) === 0;
      }
   };
   return ng;
};

/**
 * Populates a map of all named subjects from the given input and an array
 * of all unnamed bnodes (includes embedded ones).
 * 
 * @param input the input (must be expanded, no context).
 * @param subjects the subjects map to populate.
 * @param bnodes the bnodes array to populate.
 */
var _collectSubjects = function(input, subjects, bnodes)
{
   if(input === null)
   {
      // nothing to collect
   }
   else if(input.constructor === Array)
   {
      for(var i in input)
      {
         _collectSubjects(input[i], subjects, bnodes);
      }
   }
   else if(input.constructor === Object)
   {
      if('@subject' in input)
      {
         // graph literal
         if(input['@subject'].constructor == Array)
         {
            _collectSubjects(input['@subject'], subjects, bnodes);
         }
         // named subject
         else
         {
            subjects[input['@subject']['@iri']] = input;
         }
      }
      // unnamed blank node
      else if(_isBlankNode(input))
      {
         bnodes.push(input);
      }
      
      // recurse through subject properties
      for(var key in input)
      {
         _collectSubjects(input[key], subjects, bnodes);
      }
   }
};

/**
 * Flattens the given value into a map of unique subjects. It is assumed that
 * all blank nodes have been uniquely named before this call. Array values for
 * properties will be sorted.
 *
 * @param parent the value's parent, NULL for none.
 * @param parentProperty the property relating the value to the parent.
 * @param value the value to flatten.
 * @param subjects the map of subjects to write to.
 */
var _flatten = function(parent, parentProperty, value, subjects)
{
   var flattened = null;
   
   if(value === null)
   {
      // drop null values
   }
   else if(value.constructor === Array)
   {
      // list of objects or a disjoint graph
      for(var i in value)
      {
         _flatten(parent, parentProperty, value[i], subjects);
      }
   }
   else if(value.constructor === Object)
   {
      // graph literal/disjoint graph
      if('@subject' in value && value['@subject'].constructor === Array)
      {
         // cannot flatten embedded graph literals
         if(parent !== null)
         {
            throw {
               message: 'Embedded graph literals cannot be flattened.'
            };
         }
         
         // top-level graph literal
         for(var key in value['@subject'])
         {
            _flatten(parent, parentProperty, value['@subject'][key], subjects);
         }
      }
      // already-expanded value
      else if('@literal' in value || '@iri' in value)
      {
         flattened = _clone(value);
      }
      // subject
      else
      {
         // create or fetch existing subject
         var subject;
         if(value['@subject']['@iri'] in subjects)
         {
            // FIXME: '@subject' might be a graph literal (as {})
            subject = subjects[value['@subject']['@iri']];
         }
         else
         {
            subject = {};
            if('@subject' in value)
            {
               // FIXME: '@subject' might be a graph literal (as {})
               subjects[value['@subject']['@iri']] = subject;
            }
         }
         flattened = subject;

         // flatten embeds
         for(var key in value)
         {
            var v = value[key];
            
            // drop null values
            if(v !== null)
            {
               if(key in subject)
               {
                  if(subject[key].constructor !== Array)
                  {
                     subject[key] = [subject[key]];
                  }
               }
               else
               {
                  subject[key] = [];
               }
               
               _flatten(subject[key], null, v, subjects);
               if(subject[key].length === 1)
               {
                  // convert subject[key] to object if it has only 1
                  subject[key] = subject[key][0];
               }
            }
         }
      }
   }
   // string value
   else
   {
      flattened = value;
   }

   // add flattened value to parent
   if(flattened !== null && parent !== null)
   {
      // remove top-level '@subject' for subjects
      // 'http://mypredicate': {'@subject': {'@iri': 'http://mysubject'}}
      // becomes
      // 'http://mypredicate': {'@iri': 'http://mysubject'}
      if(flattened.constructor === Object && '@subject' in flattened)
      {
         flattened = flattened['@subject'];
      }

      if(parent.constructor === Array)
      {
         // do not add duplicate IRIs for the same property
         var duplicate = false;
         if(flattened.constructor === Object && '@iri' in flattened)
         {
            duplicate = (parent.filter(function(e)
            {
               return (e.constructor === Object && '@iri' in e &&
                  e['@iri'] === flattened['@iri']);
            }).length > 0);
         }
         if(!duplicate)
         {
            parent.push(flattened);
         }
      }
      else
      {
         parent[parentProperty] = flattened;
      }
   }
};


/**
 * Assigns unique names to blank nodes that are unnamed in the given input.
 * 
 * @param input the input to assign names to.
 */
Processor.prototype.nameBlankNodes = function(input)
{
   // create temporary blank node name generator
   var ng = this.ng.tmp = _createNameGenerator('tmp');
   
   // collect subjects and unnamed bnodes
   var subjects = {};
   var bnodes = [];
   _collectSubjects(input, subjects, bnodes);
   
   // uniquely name all unnamed bnodes
   for(var i in bnodes)
   {
      var bnode = bnodes[i];
      if(!('@subject' in bnode))
      {
         // generate names until one is unique
         while(ng.next() in subjects){};
         bnode['@subject'] =
         {
            '@iri': ng.current()
         };
         subjects[ng.current()] = bnode;
      }
   }
};

/**
 * Renames a blank node, changing its references, etc. The method assumes
 * that the given name is unique.
 * 
 * @param b the blank node to rename.
 * @param id the new name to use.
 */
Processor.prototype.renameBlankNode = function(b, id)
{
   var old = b['@subject']['@iri'];
   
   // update bnode IRI
   b['@subject']['@iri'] = id;
   
   // update subjects map
   var subjects = this.subjects;
   subjects[id] = subjects[old];
   delete subjects[old];
   
   // update reference and property lists
   this.edges.refs[id] = this.edges.refs[old];
   this.edges.props[id] = this.edges.props[old];
   delete this.edges.refs[old];
   delete this.edges.props[old];
   
   // update references to this bnode
   var refs = this.edges.refs[id].all;
   for(var i in refs)
   {
      var iri = refs[i].s;
      if(iri === old)
      {
         iri = id;
      }
      var ref = subjects[iri];
      var props = this.edges.props[iri].all;
      for(var i2 in props)
      {
         if(props[i2].s === old)
         {
            props[i2].s = id;
            
            // normalize property to array for single code-path
            var p = props[i2].p;
            var tmp = (ref[p].constructor === Object) ? [ref[p]] :
               (ref[p].constructor === Array) ? ref[p] : [];
            for(var n in tmp)
            {
               if(tmp[n].constructor === Object &&
                  '@iri' in tmp[n] && tmp[n]['@iri'] === old)
               {
                  tmp[n]['@iri'] = id;
               }
            }
         }
      }
   }
   
   // update references from this bnode 
   var props = this.edges.props[id].all;
   for(var i in props)
   {
      var iri = props[i].s;
      refs = this.edges.refs[iri].all;
      for(var r in refs)
      {
         if(refs[r].s === old)
         {
            refs[r].s = id;
         }
      }
   }
};

/**
 * Canonically names blank nodes in the given input.
 * 
 * @param input the flat input graph to assign names to.
 */
Processor.prototype.canonicalizeBlankNodes = function(input)
{
   // create serialization state
   this.renamed = {};
   this.mappings = {};
   this.serializations = {};
   
   // collect subjects and bnodes from flat input graph
   var edges = this.edges =
   {
      refs: {},
      props: {}
   };
   var subjects = this.subjects = {};
   var bnodes = [];
   for(var i in input)
   {
      var iri = input[i]['@subject']['@iri'];
      subjects[iri] = input[i];
      edges.refs[iri] =
      {
         all: [],
         bnodes: []
      };
      edges.props[iri] =
      {
         all: [],
         bnodes: []
      };
      if(_isBlankNodeIri(iri))
      {
         bnodes.push(input[i]);
      }
   }
   
   // collect edges in the graph
   this.collectEdges();
   
   // create canonical blank node name generator
   var c14n = this.ng.c14n = _createNameGenerator('c14n');
   var ngTmp = this.ng.tmp;
   
   // rename all bnodes that happen to be in the c14n namespace
   // and initialize serializations
   for(var i in bnodes)
   {
      var bnode = bnodes[i];
      var iri = bnode['@subject']['@iri'];
      if(c14n.inNamespace(iri))
      {
         // generate names until one is unique
         while(ngTmp.next() in subjects){};
         this.renameBlankNode(bnode, ngTmp.current());
         iri = bnode['@subject']['@iri'];
      }
      this.serializations[iri] =
      {
         'props': null,
         'refs': null
      };
   }
   
   // keep sorting and naming blank nodes until they are all named
   var self = this;
   while(bnodes.length > 0)
   {
      bnodes.sort(function(a, b)
      {
         return self.deepCompareBlankNodes(a, b);
      });
      
      // name all bnodes according to the first bnode's relation mappings
      var bnode = bnodes.shift();
      var iri = bnode['@subject']['@iri'];
      var dirs = ['props', 'refs'];
      for(var d in dirs)
      {
         var dir = dirs[d];
         
         // if no serialization has been computed, name only the first node
         if(this.serializations[iri][dir] === null)
         {
            var mapping = {};
            mapping[iri] = 's1';
         }
         else
         {
            mapping = this.serializations[iri][dir].m;
         }
         
         // sort keys by value to name them in order
         var keys = Utils.keys(mapping);
         keys.sort(function(a, b)
         {
            return _compare(mapping[a], mapping[b]);
         });
         
         // name bnodes in mapping
         var renamed = [];
         for(var i in keys)
         {
            var iriK = keys[i];
            if(!c14n.inNamespace(iri) && iriK in subjects)
            {
               this.renameBlankNode(subjects[iriK], c14n.next());
               renamed.push(iriK);
            }
         }
         
         // only keep non-canonically named bnodes
         var tmp = bnodes;
         bnodes = [];
         for(var i in tmp)
         {
            var b = tmp[i];
            var iriB = b['@subject']['@iri'];
            if(!c14n.inNamespace(iriB))
            {
               // mark serializations related to the named bnodes as dirty
               for(var i2 in renamed)
               {
                  this.markSerializationDirty(iriB, renamed[i2], dir);
               }
               bnodes.push(b);
            }
         }
      }
   }
   
   // sort property lists that now have canonically-named bnodes
   for(var key in edges.props)
   {
      if(edges.props[key].bnodes.length > 0)
      {
         var bnode = subjects[key];
         for(var p in bnode)
         {
            if(p.indexOf('@') !== 0 && bnode[p].constructor === Array)
            {
               bnode[p].sort(_compareObjects);
            }
         }
      }
   }
};

/**
 * A MappingBuilder is used to build a mapping of existing blank node names
 * to a form for serialization. The serialization is used to compare blank
 * nodes against one another to determine a sort order.
 */
MappingBuilder = function()
{
   this.count = 1;
   this.processed = {};
   this.mapping = {};
   this.adj = {};
   this.keyStack = [{ keys: ['s1'], idx: 0 }];
   this.done = {};
   this.s = '';
};

/**
 * Copies this MappingBuilder.
 * 
 * @return the MappingBuilder copy.
 */
MappingBuilder.prototype.copy = function()
{
   var rval = new MappingBuilder();
   rval.count = this.count;
   rval.processed = _clone(this.processed);
   rval.mapping = _clone(this.mapping);
   rval.adj = _clone(this.adj);
   rval.keyStack = _clone(this.keyStack);
   rval.done = _clone(this.done);
   rval.s = this.s;
   return rval;
};

/**
 * Maps the next name to the given bnode IRI if the bnode IRI isn't already in
 * the mapping. If the given bnode IRI is canonical, then it will be given
 * a shortened form of the same name.
 * 
 * @param iri the blank node IRI to map the next name to.
 * 
 * @return the mapped name.
 */
MappingBuilder.prototype.mapNode = function(iri)
{
   if(!(iri in this.mapping))
   {
      if(iri.indexOf('_:c14n') === 0)
      {
         this.mapping[iri] = 'c' + iri.substr(6);
      }
      else
      {
         this.mapping[iri] = 's' + this.count++;
      }
   }
   return this.mapping[iri];
};

/**
 * Serializes the properties of the given bnode for its relation serialization.
 * 
 * @param b the blank node.
 * 
 * @return the serialized properties.
 */
var _serializeProperties = function(b)
{
   var rval = '';
   
   var first = true;
   for(var p in b)
   {
      if(p !== '@subject')
      {
         if(first)
         {
            first = false;
         }
         else
         {
            rval += '|';
         }
         
         // property
         rval += '<' + p + '>';
         
         // object(s)
         var objs = (b[p].constructor === Array) ? b[p] : [b[p]];
         for(var oi in objs)
         {
            var o = objs[oi];
            if(o.constructor === Object)
            {
               // iri
               if('@iri' in o)
               {
                  if(_isBlankNodeIri(o['@iri']))
                  {
                     rval += '_:';
                  }
                  else
                  {
                     rval += '<' + o['@iri'] + '>';
                  }
               }
               // literal
               else
               {
                  rval += '"' + o['@literal'] + '"';
                  
                  // datatype literal
                  if('@datatype' in o)
                  {
                     rval += '^^<' + o['@datatype'] + '>';
                  }
                  // language literal
                  else if('@language' in o)
                  {
                     rval += '@' + o['@language'];
                  }
               }
            }
            // plain literal
            else
            {
               rval += '"' + o + '"';
            }
         }
      }
   }
   
   return rval;
};

/**
 * Recursively increments the relation serialization for a mapping.
 * 
 * @param subjects the subjects in the graph.
 * @param edges the edges in the graph.
 */
MappingBuilder.prototype.serialize = function(subjects, edges)
{
   if(this.keyStack.length > 0)
   {
      // continue from top of key stack
      var next = this.keyStack.pop();
      for(; next.idx < next.keys.length; ++next.idx)
      {
         var k = next.keys[next.idx];
         if(!(k in this.adj))
         {
            this.keyStack.push(next);
            break;
         }
         
         if(k in this.done)
         {
            // mark cycle
            this.s += '_' + k;
         }
         else
         {
            // mark key as serialized
            this.done[k] = true;
            
            // serialize top-level key and its details
            var s = k;
            var adj = this.adj[k];
            var iri = adj.i;
            if(iri in subjects)
            {
               var b = subjects[iri];
               
               // serialize properties
               s += '[' + _serializeProperties(b) + ']';
               
               // serialize references
               var first = true;
               s += '[';
               var refs = edges.refs[iri].all;
               for(var r in refs)
               {
                  if(first)
                  {
                     first = false;
                  }
                  else
                  {
                     s += '|';
                  }
                  s += '<' + refs[r].p + '>';
                  s += _isBlankNodeIri(refs[r].s) ?
                     '_:' : ('<' + refs[r].s + '>');
               }
               s += ']';
            }
            
            // serialize adjacent node keys
            s += adj.k.join('');
            this.s += s;
            this.keyStack.push({ keys: adj.k, idx: 0 });
            this.serialize(subjects, edges);
         }
      }
   }
};

/**
 * Marks a relation serialization as dirty if necessary.
 * 
 * @param iri the IRI of the bnode to check.
 * @param changed the old IRI of the bnode that changed.
 * @param dir the direction to check ('props' or 'refs').
 */
Processor.prototype.markSerializationDirty = function(iri, changed, dir)
{
   var s = this.serializations[iri];
   if(s[dir] !== null && changed in s[dir].m)
   {
      s[dir] = null;
   }
};

/**
 * Rotates the elements in an array one position.
 * 
 * @param a the array.
 */
var _rotate = function(a)
{
   a.unshift.apply(a, a.splice(1, a.length));
};

/**
 * Compares two serializations for the same blank node. If the two
 * serializations aren't complete enough to determine if they are equal (or if
 * they are actually equal), 0 is returned.
 * 
 * @param s1 the first serialization.
 * @param s2 the second serialization.
 * 
 * @return -1 if s1 < s2, 0 if s1 == s2 (or indeterminate), 1 if s1 > v2.
 */
var _compareSerializations = function(s1, s2)
{
   var rval = 0;
   
   if(s1.length == s2.length)
   {
      rval = _compare(s1, s2);
   }
   else if(s1.length > s2.length)
   {
      rval = _compare(s1.substr(0, s2.length), s2);
   }
   else
   {
      rval = _compare(s1, s2.substr(0, s1.length));
   }
   
   return rval;
};

/**
 * Recursively serializes adjacent bnode combinations for a bnode.
 * 
 * @param s the serialization to update.
 * @param iri the IRI of the bnode being serialized.
 * @param siri the serialization name for the bnode IRI.
 * @param mb the MappingBuilder to use.
 * @param dir the edge direction to use ('props' or 'refs').
 * @param mapped all of the already-mapped adjacent bnodes.
 * @param notMapped all of the not-yet mapped adjacent bnodes.
 */
Processor.prototype.serializeCombos = function(
   s, iri, siri, mb, dir, mapped, notMapped)
{
   // handle recursion
   if(notMapped.length > 0)
   {
      // copy mapped nodes
      mapped = _clone(mapped);
      
      // map first bnode in list
      mapped[mb.mapNode(notMapped[0].s)] = notMapped[0].s;
      
      // recurse into remaining possible combinations
      var original = mb.copy();
      notMapped = notMapped.slice(1);
      var rotations = Math.max(1, notMapped.length);
      for(var r = 0; r < rotations; ++r)
      {
         var m = (r === 0) ? mb : original.copy();
         this.serializeCombos(s, iri, siri, m, dir, mapped, notMapped);
         
         // rotate not-mapped for next combination
         _rotate(notMapped);
      }
   }
   // no more adjacent bnodes to map, update serialization
   else
   {
      var keys = Utils.keys(mapped).sort();
      mb.adj[siri] = { i: iri, k: keys, m: mapped };
      mb.serialize(this.subjects, this.edges);
      
      // optimize away mappings that are already too large
      if(s[dir] === null || _compareSerializations(mb.s, s[dir].s) <= 0)
      {
         // recurse into adjacent values
         for(var i in keys)
         {
            var k = keys[i];
            this.serializeBlankNode(s, mapped[k], mb, dir);
         }
         
         // update least serialization if new one has been found
         mb.serialize(this.subjects, this.edges);
         if(s[dir] === null ||
            (_compareSerializations(mb.s, s[dir].s) <= 0 &&
            mb.s.length >= s[dir].s.length))
         {
            s[dir] = { s: mb.s, m: mb.mapping };
         }
      }
   }
};

/**
 * Computes the relation serialization for the given blank node IRI.
 * 
 * @param s the serialization to update.
 * @param iri the current bnode IRI to be mapped.
 * @param mb the MappingBuilder to use.
 * @param dir the edge direction to use ('props' or 'refs').
 */
Processor.prototype.serializeBlankNode = function(s, iri, mb, dir)
{
   // only do mapping if iri not already processed
   if(!(iri in mb.processed))
   {
      // iri now processed
      mb.processed[iri] = true;
      var siri = mb.mapNode(iri);
      
      // copy original mapping builder
      var original = mb.copy();
      
      // split adjacent bnodes on mapped and not-mapped
      var adj = this.edges[dir][iri].bnodes;
      var mapped = {};
      var notMapped = [];
      for(var i in adj)
      {
         if(adj[i].s in mb.mapping)
         {
            mapped[mb.mapping[adj[i].s]] = adj[i].s;
         }
         else
         {
            notMapped.push(adj[i]);
         }
      }
      
      /*
      // TODO: sort notMapped using ShallowCompare
      var self = this;
      notMapped.sort(function(a, b)
      {
         var rval = self.shallowCompareBlankNodes(
            self.subjects[a.s], self.subjects[b.s]);
         return rval;
      });
      
      var same = false;
      var prev = null;
      for(var i in notMapped)
      {
         var curr = this.subjects[notMapped[i].s];
         if(prev !== null)
         {
            if(this.shallowCompareBlankNodes(prev, curr) === 0)
            {
               same = true;
            }
            else
            {
               if(!same)
               {
                  mapped[mb.mapNode(prev['@subject'])] = prev['@subject'];
                  delete notMapped[i - 1];
               }
               if(i === notMapped.length - 1)
               {
                  mapped[mb.mapNode(curr['@subject'])];
                  delete notMapped[i];
               }
               same = false;
            }
         }
         prev = curr;
      }*/
      
      // TODO: ensure this optimization does not alter canonical order
      
      // if the current bnode already has a serialization, reuse it
      /*var hint = (iri in this.serializations) ?
         this.serializations[iri][dir] : null;
      if(hint !== null)
      {
         var hm = hint.m;
         notMapped.sort(function(a, b)
         {
            return _compare(hm[a.s], hm[b.s]);
         });
         for(var i in notMapped)
         {
            mapped[mb.mapNode(notMapped[i].s)] = notMapped[i].s;
         }
         notMapped = [];
      }*/
      
      // loop over possible combinations
      var combos = Math.max(1, notMapped.length);
      for(var i = 0; i < combos; ++i)
      {
         var m = (i === 0) ? mb : original.copy();
         this.serializeCombos(s, iri, siri, m, dir, mapped, notMapped);         
      }
   }
};

/**
 * Compares two blank nodes for equivalence.
 * 
 * @param a the first blank node.
 * @param b the second blank node.
 * 
 * @return -1 if a < b, 0 if a == b, 1 if a > b.
 */
Processor.prototype.deepCompareBlankNodes = function(a, b)
{
   var rval = 0;
   
   // compare IRIs
   var iriA = a['@subject']['@iri'];
   var iriB = b['@subject']['@iri'];
   if(iriA === iriB)
   {
      rval = 0;
   }
   else
   {
      // do shallow compare first
      rval = this.shallowCompareBlankNodes(a, b);
      
      // deep comparison is necessary
      if(rval === 0)
      {
         // compare property edges and then reference edges
         var dirs = ['props', 'refs'];
         for(var i = 0; rval === 0 && i < dirs.length; ++i)
         {
            // recompute 'a' and 'b' serializations as necessary
            var dir = dirs[i];
            var sA = this.serializations[iriA];
            var sB = this.serializations[iriB];
            if(sA[dir] === null)
            {
               var mb = new MappingBuilder();
               if(dir === 'refs')
               {
                  // keep same mapping and count from 'props' serialization
                  mb.mapping = _clone(sA['props'].m);
                  mb.count = Utils.keys(mb.mapping).length + 1;
               }
               this.serializeBlankNode(sA, iriA, mb, dir);
            }
            if(sB[dir] === null)
            {
               var mb = new MappingBuilder();
               if(dir === 'refs')
               {
                  // keep same mapping and count from 'props' serialization
                  mb.mapping = _clone(sB['props'].m);
                  mb.count = Utils.keys(mb.mapping).length + 1;
               }
               this.serializeBlankNode(sB, iriB, mb, dir);
            }
            
            // compare serializations
            rval = _compare(sA[dir].s, sB[dir].s);
         }
      }
   }
   
   return rval;
};

/**
 * Performs a shallow sort comparison on the given bnodes.
 * 
 * @param a the first bnode.
 * @param b the second bnode.
 * 
 * @return -1 if a < b, 0 if a == b, 1 if a > b.
 */
Processor.prototype.shallowCompareBlankNodes = function(a, b)
{
   var rval = 0;
   
   /* ShallowSort Algorithm (when comparing two bnodes):
      1. Compare the number of properties.
      1.1. The bnode with fewer properties is first.
      2. Compare alphabetically sorted-properties.
      2.1. The bnode with the alphabetically-first property is first.
      3. For each property, compare object values.
      4. Compare the number of references.
      4.1. The bnode with fewer references is first.
      5. Compare sorted references.
      5.1. The bnode with the reference iri (vs. bnode) is first.
      5.2. The bnode with the alphabetically-first reference iri is first.
      5.3. The bnode with the alphabetically-first reference property is first.
    */
   var pA = Utils.keys(a);
   var pB = Utils.keys(b);
   
   // step #1
   rval = _compare(pA.length, pB.length);
   
   // step #2
   if(rval === 0)
   {
      rval = _compare(pA.sort(), pB.sort());
   }
   
   // step #3
   if(rval === 0)
   {
      rval = _compareBlankNodeObjects(a, b);
   }
   
   // step #4
   if(rval === 0)
   {
      var edgesA = this.edges.refs[a['@subject']['@iri']].all;
      var edgesB = this.edges.refs[b['@subject']['@iri']].all;
      rval = _compare(edgesA.length, edgesB.length);
   }
   
   // step #5
   if(rval === 0)
   {
      for(var i = 0; i < edgesA.length && rval === 0; ++i)
      {
         rval = this.compareEdges(edgesA[i], edgesB[i]);
      }
   }
   
   return rval;
};

/**
 * Compares two edges. Edges with an IRI (vs. a bnode ID) come first, then
 * alphabetically-first IRIs, then alphabetically-first properties. If a blank
 * node has been canonically named, then blank nodes will be compared after
 * properties (with a preference for canonically named over non-canonically
 * named), otherwise they won't be.
 * 
 * @param a the first edge.
 * @param b the second edge.
 * 
 * @return -1 if a < b, 0 if a == b, 1 if a > b.
 */
Processor.prototype.compareEdges = function(a, b)
{
   var rval = 0;
   
   var bnodeA = _isBlankNodeIri(a.s);
   var bnodeB = _isBlankNodeIri(b.s);
   var c14n = this.ng.c14n;
   
   // if not both bnodes, one that is a bnode is greater
   if(bnodeA != bnodeB)
   {
      rval = bnodeA ? 1 : -1;
   }
   else
   {
      if(!bnodeA)
      {
         rval = _compare(a.s, b.s);
      }
      if(rval === 0)
      {
         rval = _compare(a.p, b.p);
      }
      
      // do bnode IRI comparison if canonical naming has begun
      if(rval === 0 && c14n !== null)
      {
         var c14nA = c14n.inNamespace(a.s);
         var c14nB = c14n.inNamespace(b.s);
         if(c14nA != c14nB)
         {
            rval = c14nA ? 1 : -1;
         }
         else if(c14nA)
         {
            rval = _compare(a.s, b.s);
         }
      }
   }
   
   return rval;
};

/**
 * Populates the given reference map with all of the subject edges in the
 * graph. The references will be categorized by the direction of the edges,
 * where 'props' is for properties and 'refs' is for references to a subject as
 * an object. The edge direction categories for each IRI will be sorted into
 * groups 'all' and 'bnodes'.
 */
Processor.prototype.collectEdges = function()
{
   var refs = this.edges.refs;
   var props = this.edges.props;
   
   // collect all references and properties
   for(var iri in this.subjects)
   {
      var subject = this.subjects[iri];
      for(var key in subject)
      {
         if(key !== '@subject')
         {
            // normalize to array for single codepath
            var object = subject[key];
            var tmp = (object.constructor !== Array) ? [object] : object;
            for(var i in tmp)
            {
               var o = tmp[i];
               if(o.constructor === Object && '@iri' in o &&
                  o['@iri'] in this.subjects)
               {
                  var objIri = o['@iri'];
                  
                  // map object to this subject
                  refs[objIri].all.push({ s: iri, p: key });
                  
                  // map this subject to object
                  props[iri].all.push({ s: objIri, p: key });
               }
            }
         }
      }
   }
   
   // create sorted categories
   var self = this;
   for(var iri in refs)
   {
      refs[iri].all.sort(function(a, b) { return self.compareEdges(a, b); });
      refs[iri].bnodes = refs[iri].all.filter(function(edge) {
         return _isBlankNodeIri(edge.s)
      });
   }
   for(var iri in props)
   {
      props[iri].all.sort(function(a, b) { return self.compareEdges(a, b); });
      props[iri].bnodes = props[iri].all.filter(function(edge) {
         return _isBlankNodeIri(edge.s);
      });
   }
};

/**
 * Returns true if the given input is a subject and has one of the given types
 * in the given frame.
 * 
 * @param input the input.
 * @param frame the frame with types to look for.
 * 
 * @return true if the input has one of the given types.
 */
var _isType = function(input, frame)
{
   var rval = false;
   
   // check if type(s) are specified in frame and input
   var type = ns.rdf + 'type';
   if(type in frame &&
      input.constructor === Object && '@subject' in input && type in input)
   {
      var tmp = (input[type].constructor === Array) ?
         input[type] : [input[type]];
      var types = (frame[type].constructor === Array) ?
         frame[type] : [frame[type]];
      for(var t = 0; t < types.length && !rval; ++t)
      {
         type = types[t]['@iri'];
         for(var i in tmp)
         {
            if(tmp[i]['@iri'] === type)
            {
               rval = true;
               break;
            }
         }
      }
   }
   
   return rval;
};

/**
 * Returns true if the given input matches the given frame via duck-typing.
 * 
 * @param input the input.
 * @param frame the frame to check against.
 * 
 * @return true if the input matches the frame.
 */
var _isDuckType = function(input, frame)
{
   var rval = false;
   
   // frame must not have a specific type
   var type = ns.rdf + 'type';
   if(!(type in frame))
   {
      // get frame properties that must exist on input
      var props = Utils.keys(frame).filter(function(e)
      {
         // filter non-keywords
         return e.indexOf('@') !== 0;
      });
      if(props.length === 0)
      {
         // input always matches if there are no properties
         rval = true;
      }
      // input must be a subject with all the given properties
      else if(input.constructor === Object && '@subject' in input)
      {
         rval = true;
         for(var i in props)
         {
            if(!(props[i] in input))
            {
               rval = false;
               break;
            }
         }
      }
   }
   
   return rval;
};

/**
 * Subframes a value.
 * 
 * @param subjects a map of subjects in the graph.
 * @param value the value to subframe.
 * @param frame the frame to use.
 * @param embeds a map of previously embedded subjects, used to prevent cycles.
 * @param autoembed true if auto-embed is on, false if not.
 * @param parent the parent object.
 * @param parentKey the parent key.
 * @param options the framing options.
 * 
 * @return the framed input.
 */
var _subframe = function(
   subjects, value, frame, embeds, autoembed, parent, parentKey, options)
{
   // get existing embed entry
   var iri = value['@subject']['@iri'];
   var embed = (iri in embeds) ? embeds[iri] : null;
   
   // determine if value should be embedded or referenced,
   // embed is ON if:
   // 1. The frame OR default option specifies @embed as ON, AND
   // 2. There is no existing embed OR it is an autoembed, AND
   //    autoembed mode is off.
   var embedOn =
      (frame['@embed'] === true || options.defaults.embedOn) &&
      (embed === null || (embed.autoembed && !autoembed));
   
   if(!embedOn)
   {
      // not embedding, so only use subject IRI as reference
      value = value['@subject'];
   }
   else
   {
      // create new embed entry
      if(embed === null)
      {
         embed = {};
         embeds[iri] = embed;
      }
      // replace the existing embed with a reference
      else if(embed.parent !== null)
      {
         embed.parent[embed.key] = value['@subject'];
      }
      
      // update embed entry
      embed.autoembed = autoembed;
      embed.parent = parent;
      embed.key = parentKey;
      
      // check explicit flag
      var explicitOn =
         frame['@explicit'] === true || options.defaults.explicitOn;
      if(explicitOn)
      {
         // remove keys from the value that aren't in the frame
         for(key in value)
         {
            // do not remove @subject or any frame key
            if(key !== '@subject' && !(key in frame))
            {
               delete value[key];
            }
         }
      }
      
      // iterate over keys in value
      for(key in value)
      {
         // skip keywords and type
         if(key.indexOf('@') !== 0 && key !== ns.rdf + 'type')
         {
            // get the subframe if available
            if(key in frame)
            {
               var f = frame[key];
               var _autoembed = false;
            }
            // use a catch-all subframe to preserve data from graph
            else
            {
               var f = (value[key].constructor === Array) ? [] : {};
               var _autoembed = true;
            }
            
            // build input and do recursion
            var v = value[key];
            var input = (v.constructor === Array) ? v : [v];
            for(var n in input)
            {
               // replace reference to subject w/subject
               if(input[n].constructor === Object &&
                  '@iri' in input[n] &&
                  input[n]['@iri'] in subjects)
               {
                  input[n] = subjects[input[n]['@iri']];
               }
            }
            value[key] = _frame(
               subjects, input, f, embeds, _autoembed, value, key, options);
         }
      }
      
      // iterate over frame keys to add any missing values
      for(key in frame)
      {
         // skip keywords, type query, and keys in value
         if(key.indexOf('@') !== 0 && key !== ns.rdf + 'type' &&
            !(key in value))
         {
            var f = frame[key];
            
            // add empty array to value
            if(f.constructor === Array)
            {
               value[key] = [];
            }
            // add default value to value
            else
            {
               // use first subframe if frame is an array
               if(f.constructor === Array)
               {
                  f = (f.length > 0) ? f[0] : {};
               }
               
               // determine if omit default is on
               var omitOn =
                  f['@omitDefault'] === true || options.defaults.omitDefaultOn;
               if(!omitOn)
               {
                  if('@default' in f)
                  {
                     // use specified default value
                     value[key] = f['@default'];
                  }
                  else
                  {
                     // built-in default value is: null
                     value[key] = null;
                  }
               }
            }
         }
      }
   }
   
   return value;
}

/**
 * Recursively frames the given input according to the given frame.
 * 
 * @param subjects a map of subjects in the graph.
 * @param input the input to frame.
 * @param frame the frame to use.
 * @param embeds a map of previously embedded subjects, used to prevent cycles.
 * @param autoembed true if auto-embed is on, false if not.
 * @param parent the parent object (for subframing), null for none.
 * @param parentKey the parent key (for subframing), null for none.
 * @param options the framing options.
 * 
 * @return the framed input.
 */
var _frame = function(
   subjects, input, frame, embeds, autoembed, parent, parentKey, options)
{
   var rval = null;
   
   // prepare output, set limit, get array of frames
   var limit = -1;
   var frames;
   if(frame.constructor === Array)
   {
      rval = [];
      frames = frame;
      if(frames.length === 0)
      {
         frames.push({});
      }
   }
   else
   {
      frames = [frame];
      limit = 1;
   }
   
   // iterate over frames adding input matches to list
   var values = [];
   for(var i = 0; i < frames.length && limit !== 0; ++i)
   {
      // get next frame
      frame = frames[i];
      if(frame.constructor !== Object)
      {
         throw {
            message: 'Invalid JSON-LD frame. ' +
               'Frame must be an object or an array.',
            frame: frame
         };
      }
      
      // create array of values for each frame
      values[i] = [];
      for(var n = 0; n < input.length && limit !== 0; ++n)
      {
         // add input to list if it matches frame specific type or duck-type
         var next = input[n];
         if(_isType(next, frame) || _isDuckType(next, frame))
         {
            values[i].push(next);
            --limit;
         }
      }
   }
   
   // for each matching value, add it to the output
   for(var i1 in values)
   {
      for(var i2 in values[i1])
      {
         frame = frames[i1];
         var value = values[i1][i2];
         
         // if value is a subject, do subframing
         if(value.constructor === Object && '@subject' in value)
         {
            value = _subframe(
               subjects, value, frame, embeds, autoembed,
               parent, parentKey, options);
         }
         
         // add value to output
         if(rval === null)
         {
            rval = value;
         }
         else
         {
            rval.push(value);
         }
      }
   }
   
   return rval;
};

/**
 * Frames JSON-LD input.
 * 
 * @param input the JSON-LD input.
 * @param frame the frame to use.
 * @param options framing options to use.
 * 
 * @return the framed output.
 */
Processor.prototype.frame = function(input, frame, options)
{
   var rval;
   
   // normalize input
   input = jsonld.normalize(input);
   
   // save frame context
   var ctx = null;
   if('@context' in frame)
   {
      ctx = _clone(frame['@context']);
   }
   
   // remove context from frame
   frame = jsonld.expand(frame);
   
   // create framing options
   // TODO: merge in options from function parameter
   options =
   {
      defaults:
      {
         embedOn: true,
         explicitOn: false,
         omitDefaultOn: false
      }
   };
   
   // build map of all subjects
   var subjects = {};
   for(var i in input)
   {
      subjects[input[i]['@subject']['@iri']] = input[i];
   }
   
   // frame input
   rval = _frame(subjects, input, frame, {}, false, null, null, options);
   
   // apply context
   if(ctx !== null && rval !== null)
   {
      rval = jsonld.compact(ctx, rval);
   }
   
   return rval;
};

})();


// exports
var JSONLDParser = {};

JSONLDParser.parser = {};
JSONLDParser.parser.parse = function(data, graph) {
    if(typeof(data) === 'string') {
        data = JSON.parse(data);
    }
    return jsonldParser.toTriples(data, graph);
};

// end of ./src/js-communication/src/jsonld_parser.js 
// exports
var RDFLoader = {};

// imports

RDFLoader.RDFLoader = function(params) {
    this.precedences = ["text/turtle", "text/n3", "application/json"];
    this.parsers = {"text/turtle": TurtleParser.parser, "text/n3":TurtleParser.parser, "application/json":JSONLDParser.parser};
    if(params != null) {
      for(var mime in params["parsers"]) {
          this.parsers[mime] = params["parsers"][mime];
      }
    }

    if(params && params["precedences"] != null) {
        this.precedences = params["precedences"];
        for(var mime in params["parsers"]) {
            if(!Utils.include(this.precedences, mime)) {
                this.precedences.push(mime);
            }
        }
    }

    this.acceptHeaderValue = "";
    for(var i=0; i<this.precedences.length; i++) {
        if(i!=0) {
            this.acceptHeaderValue = this.acceptHeaderValue + "," + this.precedences[i];
        } else {
            this.acceptHeaderValue = this.acceptHeaderValue + this.precedences[i];
        }
    }
}

RDFLoader.RDFLoader.prototype.registerParser = function(mediaType, parser) {
    this.parsers[mediaType] = parser;
    this.precedences.push(mediaType);
};

RDFLoader.RDFLoader.prototype.unregisterParser = function(mediaType) {
    delete this.parsers[mediaType];
    var mediaTypes = [];
    for(var i=0; i<this.precedences.length; i++) {
        if(this.precedences[i] != mediaType) {
            mediaTypes.push(this.precedences[i]);
        }
    }

    this.precedences = mediaTypes;
};

RDFLoader.RDFLoader.prototype.setAcceptHeaderPrecedence = function(mediaTypes) {
    this.precedences = mediaTypes;
};

RDFLoader.RDFLoader.prototype.load = function(uri, graph, callback) {
    var that = this;
    NetworkTransport.load(uri, this.acceptHeaderValue, function(success, results){
        if(success == true) {
            var mime = results["headers"]["Content-Type"] || results["headers"]["content-type"];
            var data = results['data'];
            if(mime != null) {
                mime = mime.split(";")[0]
                for(var m in that.parsers) {
                    if(m.indexOf("/")!=-1) {
                        var mimeParts = m.split("/");
                        if(mimeParts[1] === '*') {
                            if(mime.indexOf(mimeParts[0])!=-1) {
                                return that.tryToParse(that.parsers[m], graph, data, callback);
                            }
                        } else {
                            if(mime.indexOf(m)!=-1) {
                                return that.tryToParse(that.parsers[m], graph, data, callback);
                            } else if(mime.indexOf(mimeParts[1])!=-1) {
                                return that.tryToParse(that.parsers[m], graph, data, callback);
                            }
                        }
                    } else {
                        if(mime.indexOf(m)!=-1) {
                            return that.tryToParse(that.parsers[m], uri, graph, callback);
                        }
                    }
                }
                callback(false, "Unknown media type : "+mime);
            } else {
                console.log("Unknown media type");
                console.log(results["headers"]);
                callback(false, "Uknown media type");
            }
        } else {
            callback(false, "Network error: "+results);
        }});
};

RDFLoader.RDFLoader.prototype.loadFromFile = function(parser, graph, uri, callback) {
    try {
        var that = this;
        fs = require('fs');
        fs.readFile(uri.split("file:/")[1], function(err, data) {
            if(err) throw err;
            var data = data.toString('utf8');
            that.tryToParse(parser, graph, data, callback);
        });
    } catch(e) {
        callback(false, e);
    }
};

RDFLoader.RDFLoader.prototype.tryToParse = function(parser, graph, input, callback) {
    try {
        if(typeof(input) === 'string') {
            input = Utils.normalizeUnicodeLiterals(input);
        }
        var parsed = parser.parse(input, graph);

        if(parsed != null) {
            callback(true, parsed);
        } else {
            callback(false, "parsing error");
        }
    } catch(e) {
        console.log(e.message);
        console.log(e.stack);
        callback(false, "parsing error with mime type : " + e);
    }
};



// var loader = require("./js-communication/src/rdf_loader").RDFLoader; loader = new loader.RDFLoader(); loader.load('http://dbpedialite.org/titles/Lisp_%28programming_language%29', function(success, results){console.log("hey"); console.log(success); console.log(results)})

// end of ./src/js-communication/src/rdf_loader.js 
// exports
var AbstractQueryTree = {};

// imports

/**
 * @doc
 *
 * Based on <http://www.w3.org/2001/sw/DataAccess/rq23/rq24-algebra.html>
 * W3C's note
 */
AbstractQueryTree.AbstractQueryTree = function(params) {
};

AbstractQueryTree.AbstractQueryTree.prototype.parseQueryString = function(query_string) {
    var syntaxTree  = SparqlParser.parser.parse(query_string);
    return syntaxTree;
};

AbstractQueryTree.AbstractQueryTree.prototype.parseExecutableUnit = function(executableUnit) {
    if(executableUnit.kind === 'select') {
        return this.parseSelect(executableUnit);
    } else if(executableUnit.kind === 'ask') {
        return this.parseSelect(executableUnit);        
    } else if(executableUnit.kind === 'modify') {
        return this.parseSelect(executableUnit);
    } else if(executableUnit.kind === 'construct') {
        return this.parseSelect(executableUnit);        
    } else if(executableUnit.kind === 'insertdata') {
        return this.parseInsertData(executableUnit);        
    } else if(executableUnit.kind === 'deletedata') {
        return this.parseInsertData(executableUnit);        
    } else if(executableUnit.kind === 'load') {
        return executableUnit;
    } else if(executableUnit.kind === 'clear') {
        return executableUnit;
    } else if(executableUnit.kind === 'drop') {
        return executableUnit;
    } else if(executableUnit.kind === 'create') {
        return executableUnit;
    } else {
        throw new Error('unknown executable unit: ' + executableUnit.kind);
    }
};

AbstractQueryTree.AbstractQueryTree.prototype.parseSelect = function(syntaxTree){

    if(syntaxTree == null) {
        console.log("error parsing query");
        return null;
    } else {
        var env = { freshCounter: 0 };
        syntaxTree.pattern = this.build(syntaxTree.pattern, env);
        return syntaxTree;
    }
};

AbstractQueryTree.AbstractQueryTree.prototype.parseInsertData = function(syntaxTree){
    if(syntaxTree == null) {
        console.log("error parsing query");
        return null;
    } else {
        return syntaxTree;
    }
};

AbstractQueryTree.AbstractQueryTree.prototype.build = function(node, env) {
    if(node.token === 'groupgraphpattern') {
        return this._buildGroupGraphPattern(node, env);
    } else if (node.token === 'basicgraphpattern') {
        var bgp = { kind: 'BGP',
                    value: node.triplesContext };
	//console.log("pre1");
	bgp = AbstractQueryTree.translatePathExpressionsInBGP(bgp, env);
	//console.log("translation");
	//console.log(sys.inspect(bgp,true,20));	
	return bgp;
    } else if (node.token === 'graphunionpattern') {
        var a = this.build(node.value[0],env);
        var b = this.build(node.value[1],env);

        return { kind: 'UNION',
                 value: [a,b] };
    } else if(node.token === 'graphgraphpattern') {
        var c = this.build(node.value, env);
        return { kind: 'GRAPH',
                 value: c,
                 graph: node.graph };
    } else {
        throw new Error("not supported token in query:"+node.token);
    }
};

AbstractQueryTree.translatePathExpressionsInBGP = function(bgp, env) {
    var pathExpression,nextTriple,beforeToLink;
    var before = [];
    for(var i=0; i<bgp.value.length; i++) {
	if(bgp.value[i].predicate && bgp.value[i].predicate.token === 'path') {
	    //console.log("FOUND A PATH");
	    pathExpression = bgp.value[i];
	    rest = bgp.value.slice(i+1);
	    var bgpTransformed = AbstractQueryTree.translatePathExpression(pathExpression, env);
	    var optionalPattern = null;
	    //console.log("BACK FROM TRANSFORMED");
	    if(bgpTransformed.kind === 'BGP') {
		before = before.concat(bgpTransformed.value);
	    } else if(bgpTransformed.kind === 'ZERO_OR_MORE_PATH'){
		//console.log("BEFORE");
		//console.log(bgpTransformed);
		    

		if(before.length > 0) {
		    //if(bgpTransformed.y.token === 'var' && bgpTransformed.y.value.indexOf("fresh:")===0) {
		    // 	console.log("ADDING EXTRA PATTERN");
		    // 	for(var j=0; j<bgp.value.length; j++) {
		    // 	    if(bgp.value[j].object && bgp.value[j].object.token === 'var' && bgp.value[j].object.value === bgpTransformed.x.value) {
		    // 		optionalPattern = Utils.clone(bgp.value[j]);
		    // 		optionalPattern.object = bgpTransformed.y;
		    // 	    }
		    // 	}
		    //}

		    bottomJoin =  {kind: 'JOIN',
				   lvalue: {kind: 'BGP', value:before},
				   rvalue: bgpTransformed};
		} else {
		    bottomJoin = bgpTransformed;
		}

		if(bgpTransformed.y.token === 'var' && bgpTransformed.y.value.indexOf("fresh:")===0 &&
		   bgpTransformed.x.token === 'var' && bgpTransformed.x.value.indexOf("fresh:")===0) {
		    //console.log("ADDING EXTRA PATTERN 1)");
		    for(var j=0; j<bgp.value.length; j++) {
			//console.log(bgp.value[j]);
			if(bgp.value[j].object && bgp.value[j].object.token === 'var' && bgp.value[j].object.value === bgpTransformed.x.value) {
			    //console.log(" YES 1)");
			    optionalPattern = Utils.clone(bgp.value[j]);
			    optionalPattern.object = bgpTransformed.y;
			}
		    }
		} else if(bgpTransformed.y.token === 'var' && bgpTransformed.y.value.indexOf("fresh:")===0) {
		    //console.log("ADDING EXTRA PATTERN 2)");
		    var from, to;
		    for(var j=0; j<bgp.value.length; j++) {
			//console.log(bgp.value[j]);
			if(bgp.value[j].subject && bgp.value[j].subject.token === 'var' && bgp.value[j].subject.value === bgpTransformed.y.value) {
			    //console.log(" YES 2)");
			    optionalPattern = Utils.clone(bgp.value[j]);
			    optionalPattern.subject = bgpTransformed.x;
			}
		    }
		}

		if(rest.length >0) {
		    //console.log("(2a)")
		    var rvalueJoin = AbstractQueryTree.translatePathExpressionsInBGP({kind: 'BGP', value: rest}, env);
		    //console.log("got rvalue");
		    if(optionalPattern != null) {
			var optionals = before.concat([optionalPattern]).concat(rest);
			return { kind: 'UNION',
				 value: [{ kind: 'JOIN',
					   lvalue: bottomJoin,
					   rvalue: rvalueJoin },
					 {kind: 'BGP',
					  value: optionals}] };
		    } else {
			return { kind: 'JOIN',
				 lvalue: bottomJoin,
				 rvalue: rvalueJoin };
		    }
		} else {
		    //console.log("(2b)")
		    return bottomJoin;
		}

	    } else {
		// @todo ????
		return bgpTransformed;
	    }
	} else {
	    before.push(bgp.value[i]);
	}
    }

    //console.log("returning");
    bgp.value = before;
    return bgp;
};


AbstractQueryTree.translatePathExpression  = function(pathExpression, env) {
    // add support for different path patterns
    if(pathExpression.predicate.kind === 'element') {
	// simple paths, maybe modified
	if(pathExpression.predicate.modifier === '+') {
	    pathExpression.predicate.modifier = null;
	    var expandedPath = AbstractQueryTree.translatePathExpression(pathExpression, env);
	    return {kind: 'ONE_OR_MORE_PATH',
		    path: expandedPath,
		    x: pathExpression.subject,
		    y: pathExpression.object};
	} else if(pathExpression.predicate.modifier === '*') {
	    pathExpression.predicate.modifier = null;
	    var expandedPath = AbstractQueryTree.translatePathExpression(pathExpression, env);
	    return {kind: 'ZERO_OR_MORE_PATH',
	     	    path: expandedPath,
                    x: pathExpression.subject,
		    y: pathExpression.object};
	} else {
	    pathExpression.predicate = pathExpression.predicate.value;
	    return {kind: 'BGP', value: [pathExpression]}
	}
    } else if(pathExpression.predicate.kind === 'sequence') {
	var currentSubject = pathExpression.subject;
	var lastObject = pathExpression.object;
	var currentGraph = pathExpression.graph;
	var nextObject, chain;
	var restTriples = [];
	for(var i=0; i< pathExpression.predicate.value.length; i++) {
	    if(i!=pathExpression.predicate.value.length-1) {
		nextObject = {
		    token: "var",
		    value: "fresh:"+env.freshCounter
		};
		env.freshCounter++;
	    } else {
		nextObject = lastObject;
	    }

	    // @todo
	    // what if the predicate is a path with
	    // '*'? same fresh va in subject and object??
	    chain = {
		subject: currentSubject,
		predicate: pathExpression.predicate.value[i],
		object: nextObject
	    };
	
	    if(currentGraph != null)
		chain.graph = Utils.clone(currentGraph);
	    
	    restTriples.push(chain);

	    if(i!=pathExpression.predicate.value.length-1)
		currentSubject = Utils.clone(nextObject);;
	}
	bgp = {kind: 'BGP', value: restTriples};
	//console.log("BEFORE (1):");
	//console.log(bgp);
	//console.log("--------------");
	return AbstractQueryTree.translatePathExpressionsInBGP(bgp, env);
    }
};

AbstractQueryTree.AbstractQueryTree.prototype._buildGroupGraphPattern = function(node, env) {
    var f = (node.filters || []);
    var g = {kind: "EMPTY_PATTERN"};

    for(var i=0; i<node.patterns.length; i++) {
        var pattern = node.patterns[i];
        if(pattern.token === 'optionalgraphpattern') {
            var parsedPattern = this.build(pattern.value,env);
            if(parsedPattern.kind === 'FILTER') {
                g =  { kind:'LEFT_JOIN',
                       lvalue: g,
                       rvalue: parsedPattern.value,
                       filter: parsedPattern.filter };
            } else {
                g = { kind:'LEFT_JOIN',
                      lvalue: g,
                      rvalue: parsedPattern,
                      filter: true };
            }
        } else {
            var parsedPattern = this.build(pattern,env);
            if(g.kind == "EMPTY_PATTERN") {
                g = parsedPattern;
            } else {
                g = { kind: 'JOIN',
                      lvalue: g,
                      rvalue: parsedPattern };
            }
        }
    }

    if(f.length != 0) {
        if(g.kind === 'EMPTY_PATTERN') {
            return { kind: 'FILTER',
                     filter: f,
                     value: g};
        } else if(g.kind === 'LEFT_JOIN' && g.filter === true) {
            return { kind: 'FILTER',
                     filter: f,
                     value: g};

//            g.filter = f;
//            return g;
        } else if(g.kind === 'LEFT_JOIN') {
            return { kind: 'FILTER',
                     filter: f,
                     value: g};
        } else if(g.kind === 'JOIN') {
            return { kind: 'FILTER',
                     filter: f,
                     value: g};
        } else if(g.kind === 'UNION') {
            return { kind: 'FILTER',
                     filter: f,
                     value: g};
        } else if(g.kind === 'GRAPH') {
            return { kind: 'FILTER',
                     filter: f,
                     value: g};
        } else if(g.kind === 'BGP') {
            return { kind: 'FILTER',
                     filter: f,
                     value: g};
        } else {
            throw new Error("Unknow kind of algebra expression: "+ g.kind);
        }
    } else {
        return g;
    }
};

/**
 * Collects basic triple pattern in a complex SPARQL AQT
 */
AbstractQueryTree.AbstractQueryTree.prototype.collectBasicTriples = function(aqt, acum) {
    if(acum == null) {
        acum = [];
    }

    if(aqt.kind === 'select') {
        acum = this.collectBasicTriples(aqt.pattern,acum);
    } else if(aqt.kind === 'BGP') {
        acum = acum.concat(aqt.value);
    } else if(aqt.kind === 'ZERO_OR_MORE_PATH') {
	acum = this.collectBasicTriples(aqt.path);
    } else if(aqt.kind === 'UNION') {
        acum = this.collectBasicTriples(aqt.value[0],acum);
        acum = this.collectBasicTriples(aqt.value[1],acum);
    } else if(aqt.kind === 'GRAPH') {
        acum = this.collectBasicTriples(aqt.value,acum);
    } else if(aqt.kind === 'LEFT_JOIN' || aqt.kind === 'JOIN') {
        acum = this.collectBasicTriples(aqt.lvalue, acum);
        acum = this.collectBasicTriples(aqt.rvalue, acum);
    } else if(aqt.kind === 'FILTER') {
        acum = this.collectBasicTriples(aqt.value, acum);
    } else if(aqt.kind === 'construct') {
        acum = this.collectBasicTriples(aqt.pattern,acum);
    } else if(aqt.kind === 'EMPTY_PATTERN') {
        // nothing
    } else {
        throw "Unknown pattern: "+aqt.kind;
    }

    return acum;
};

/**
 * Replaces bindings in an AQT
 */
AbstractQueryTree.AbstractQueryTree.prototype.bind = function(aqt, bindings) {
    if(aqt.graph != null && aqt.graph.token && aqt.graph.token === 'var' &&
       bindings[aqt.graph.value] != null) {
        aqt.graph = bindings[aqt.graph.value];
    }
    if(aqt.filter != null) {
        var acum = [];
        for(var i=0; i< aqt.filter.length; i++) {
            aqt.filter[i].value = this._bindFilter(aqt.filter[i].value, bindings);
            acum.push(aqt.filter[i]);
        }
        aqt.filter = acum;
    }
    if(aqt.kind === 'select') {
        aqt.pattern = this.bind(aqt.pattern, bindings);
        //acum = this.collectBasicTriples(aqt.pattern,acum);
    } else if(aqt.kind === 'BGP') {
        aqt.value = this._bindTripleContext(aqt.value, bindings);
        //acum = acum.concat(aqt.value);
    } else if(aqt.kind === 'ZERO_OR_MORE_PATH') {
        aqt.path = this._bindTripleContext(aqt.path, bindings);
	if(aqt.x && aqt.x.token === 'var' && bindings[aqt.x.value] != null) {
	    aqt.x = bindings[aqt.x.value];
	}
	if(aqt.y && aqt.y.token === 'var' && bindings[aqt.y.value] != null) {
	    aqt.y = bindings[aqt.y.value];
	}
    } else if(aqt.kind === 'UNION') {
        aqt.value[0] = this.bind(aqt.value[0],bindings);
        aqt.value[1] = this.bind(aqt.value[1],bindings);
    } else if(aqt.kind === 'GRAPH') {
        aqt.value = this.bind(aqt.value,bindings);
    } else if(aqt.kind === 'LEFT_JOIN' || aqt.kind === 'JOIN') {
        aqt.lvalue = this.bind(aqt.lvalue, bindings);
        aqt.rvalue = this.bind(aqt.rvalue, bindings);
    } else if(aqt.kind === 'FILTER') {
	aqt.filter = this._bindFilter(aqt.filter[i].value, bindings);
    } else if(aqt.kind === 'EMPTY_PATTERN') {
        // nothing
    } else {
        throw "Unknown pattern: "+aqt.kind;
    }

    return aqt;
};

AbstractQueryTree.AbstractQueryTree.prototype._bindTripleContext = function(triples, bindings) {
    for(var i=0; i<triples.length; i++) {
        delete triples[i]['graph'];
        delete triples[i]['variables'];
        for(var p in triples[i]) {
            var comp = triples[i][p];
            if(comp.token === 'var' && bindings[comp.value] != null) {
                triples[i][p] = bindings[comp.value];
            }
        }
    }

    return triples;
};


AbstractQueryTree.AbstractQueryTree.prototype._bindFilter = function(filterExpr, bindings) {
    if(filterExpr.expressionType != null) {
        var expressionType = filterExpr.expressionType;
        if(expressionType == 'relationalexpression') {
            filterExpr.op1 = this._bindFilter(filterExpr.op1, bindings);
            filterExpr.op2 = this._bindFilter(filterExpr.op2, bindings);
        } else if(expressionType == 'conditionalor' || expressionType == 'conditionaland') {
            for(var i=0; i< filterExpr.operands.length; i++) {
                filterExpr.operands[i] = this._bindFilter(filterExpr.operands[i], bindings);
            }
        } else if(expressionType == 'additiveexpression') {
            filterExpr.summand = this._bindFilter(filterExpr.summand, bindings);
            for(var i=0; i<filterExpr.summands.length; i++) {
                filterExpr.summands[i].expression = this._bindFilter(filterExpr.summands[i].expression, bindings);            
            }
        } else if(expressionType == 'builtincall') {
            for(var i=0; i<filterExpr.args.length; i++) {
                filterExpr.args[i] = this._bindFilter(filterExpr.args[i], bindings);
            }
        } else if(expressionType == 'multiplicativeexpression') {
            filterExpr.factor = this._bindFilter(filterExpr.factor, bindings);
            for(var i=0; i<filterExpr.factors.length; i++) {
                filterExpr.factors[i].expression = this._bindFilter(filterExpr.factors[i].expression, bindings);            
            }
        } else if(expressionType == 'unaryexpression') {
            filterExpr.expression = this._bindFilter(filterExpr.expression, bindings);
        } else if(expressionType == 'irireforfunction') {
            for(var i=0; i<filterExpr.factors.args; i++) {
                filterExpr.args[i] = this._bindFilter(filterExpr.args[i], bindings);            
            }
        } else if(expressionType == 'atomic') {        
            if(filterExpr.primaryexpression == 'var') {
                // lookup the var in the bindings
                if(bindings[filterExpr.value.value] != null) {
                    var val = bindings[filterExpr.value.value];
                    if(val.token === 'uri') {
                        filterExpr.primaryexpression = 'iri';
                    } else {
                        filterExpr.primaryexpression = 'literal';
                    }
                    filterExpr.value = val;
                }
            }
        }
    }

    return filterExpr;
};

/**
 * Replaces terms in an AQT
 */
AbstractQueryTree.AbstractQueryTree.prototype.replace = function(aqt, from, to, ns) {
    if(aqt.graph != null && aqt.graph.token && aqt.graph.token === from.token && 
       aqt.graph.value == from.value) {
        aqt.graph = Utils.clone(to);
    }
    if(aqt.filter != null) {
        var acum = [];
        for(var i=0; i< aqt.filter.length; i++) {
            aqt.filter[i].value = this._replaceFilter(aqt.filter[i].value, from, to, ns);
            acum.push(aqt.filter[i]);
        }
        aqt.filter = acum;
    }
    if(aqt.kind === 'select') {
        aqt.pattern = this.replace(aqt.pattern, from, to, ns);
    } else if(aqt.kind === 'BGP') {
        aqt.value = this._replaceTripleContext(aqt.value, from, to, ns);
    } else if(aqt.kind === 'ZERO_OR_MORE_PATH') {
        aqt.path = this._replaceTripleContext(aqt.path, from,to, ns);
	if(aqt.x && aqt.x.token === from.token && aqt.value === from.value) {
	    aqt.x = Utils.clone(to);
	}
	if(aqt.y && aqt.y.token === from.token && aqt.value === from.value) {
	    aqt.y = Utils.clone(to);
	}
    } else if(aqt.kind === 'UNION') {
        aqt.value[0] = this.replace(aqt.value[0],from,to, ns);
        aqt.value[1] = this.replace(aqt.value[1],from,to, ns);
    } else if(aqt.kind === 'GRAPH') {
        aqt.value = this.replace(aqt.value,from,to);
    } else if(aqt.kind === 'LEFT_JOIN' || aqt.kind === 'JOIN') {
        aqt.lvalue = this.replace(aqt.lvalue, from, to, ns);
        aqt.rvalue = this.replace(aqt.rvalue, from, to, ns);
    } else if(aqt.kind === 'FILTER') {
        aqt.value = this._replaceFilter(aqt.value, from,to, ns);
    } else if(aqt.kind === 'EMPTY_PATTERN') {
        // nothing
    } else {
        throw "Unknown pattern: "+aqt.kind;
    }

    return aqt;
};

AbstractQueryTree.AbstractQueryTree.prototype._replaceTripleContext = function(triples, from, to, ns) {
    for(var i=0; i<triples.length; i++) {
        for(var p in triples[i]) {
            var comp = triples[i][p];
	    if(comp.token === 'var' && from.token === 'var' && comp.value === from.value) {
		triples[i][p] = to;
	    } else if(comp.token === 'blank' && from.token === 'blank' && comp.value === from.value) {
		triples[i][p] = to;
	    } else {
		if((comp.token === 'literal' || comp.token ==='uri') && 
		   (from.token === 'literal' || from.token ==='uri') && 
		   comp.token === from.token && Utils.lexicalFormTerm(comp,ns)[comp.token] === Utils.lexicalFormTerm(from,ns)[comp.token]) {
                    triples[i][p] = to;
		}
	    }
        }
    }

    return triples;
};


AbstractQueryTree.AbstractQueryTree.prototype._replaceFilter = function(filterExpr, from, to, ns) {
    if(filterExpr.expressionType != null) {
        var expressionType = filterExpr.expressionType;
        if(expressionType == 'relationalexpression') {
            filterExpr.op1 = this._replaceFilter(filterExpr.op1, from, to, ns);
            filterExpr.op2 = this._replaceFilter(filterExpr.op2, from, to, ns);
        } else if(expressionType == 'conditionalor' || expressionType == 'conditionaland') {
            for(var i=0; i< filterExpr.operands.length; i++) {
                filterExpr.operands[i] = this._replaceFilter(filterExpr.operands[i], from, to, ns);
            }
        } else if(expressionType == 'additiveexpression') {
            filterExpr.summand = this._replaceFilter(filterExpr.summand, from, to, ns);
            for(var i=0; i<filterExpr.summands.length; i++) {
                filterExpr.summands[i].expression = this._replaceFilter(filterExpr.summands[i].expression, from, to, ns);            
            }
        } else if(expressionType == 'builtincall') {
            for(var i=0; i<filterExpr.args.length; i++) {
                filterExpr.args[i] = this._replaceFilter(filterExpr.args[i], from, to, ns);
            }
        } else if(expressionType == 'multiplicativeexpression') {
            filterExpr.factor = this._replaceFilter(filterExpr.factor, from, to, ns);
            for(var i=0; i<filterExpr.factors.length; i++) {
                filterExpr.factors[i].expression = this._replaceFilter(filterExpr.factors[i].expression, from, to, ns);
            }
        } else if(expressionType == 'unaryexpression') {
            filterExpr.expression = this._replaceFilter(filterExpr.expression, from, to, ns);
        } else if(expressionType == 'irireforfunction') {
            for(var i=0; i<filterExpr.factors.args; i++) {
                filterExpr.args[i] = this._replaceFilter(filterExpr.args[i], from, to, ns);
            }
        } else if(expressionType == 'atomic') {        
	    var val = null;
            if(filterExpr.primaryexpression == from.token && filterExpr.value == from.value) {
                    val = to.value;                
            } else if(filterExpr.primaryexpression == 'iri' && from.token == 'uri' && filterExpr.value == from.value) {
                val = to.value;                
	    }

	
	    if(val != null) {
                if(to.token === 'uri') {
                    filterExpr.primaryexpression = 'iri';
                } else {
                    filterExpr.primaryexpression = to.token;
                }
                filterExpr.value = val;
	    }
        }
    }

    return filterExpr;
};

// end of ./src/js-sparql-parser/src/abstract_query_tree.js 
// exports
var SparqlParser = {};

SparqlParser.parser = (function(){
  /* Generated by PEG.js 0.6.2 (http://pegjs.majda.cz/). */
  
  var result = {
    /*
     * Parses the input with a generated parser. If the parsing is successfull,
     * returns a value explicitly or implicitly specified by the grammar from
     * which the parser was generated (see |PEG.buildParser|). If the parsing is
     * unsuccessful, throws |PEG.parser.SyntaxError| describing the error.
     */
    parse: function(input, startRule) {
      var parseFunctions = {
        "ANON": parse_ANON,
        "AdditiveExpression": parse_AdditiveExpression,
        "Aggregate": parse_Aggregate,
        "ArgList": parse_ArgList,
        "AskQuery": parse_AskQuery,
        "BLANK_NODE_LABEL": parse_BLANK_NODE_LABEL,
        "BaseDecl": parse_BaseDecl,
        "BindingValue": parse_BindingValue,
        "BindingsClause": parse_BindingsClause,
        "BlankNode": parse_BlankNode,
        "BlankNodePropertyList": parse_BlankNodePropertyList,
        "BooleanLiteral": parse_BooleanLiteral,
        "BrackettedExpression": parse_BrackettedExpression,
        "BuiltInCall": parse_BuiltInCall,
        "COMMENT": parse_COMMENT,
        "Clear": parse_Clear,
        "Collection": parse_Collection,
        "ConditionalAndExpression": parse_ConditionalAndExpression,
        "ConditionalOrExpression": parse_ConditionalOrExpression,
        "Constraint": parse_Constraint,
        "ConstructQuery": parse_ConstructQuery,
        "ConstructTemplate": parse_ConstructTemplate,
        "ConstructTriples": parse_ConstructTriples,
        "Create": parse_Create,
        "DECIMAL": parse_DECIMAL,
        "DECIMAL_NEGATIVE": parse_DECIMAL_NEGATIVE,
        "DECIMAL_POSITIVE": parse_DECIMAL_POSITIVE,
        "DOCUMENT": parse_DOCUMENT,
        "DOUBLE": parse_DOUBLE,
        "DOUBLE_NEGATIVE": parse_DOUBLE_NEGATIVE,
        "DOUBLE_POSITIVE": parse_DOUBLE_POSITIVE,
        "DatasetClause": parse_DatasetClause,
        "DefaultGraphClause": parse_DefaultGraphClause,
        "DeleteClause": parse_DeleteClause,
        "DeleteData": parse_DeleteData,
        "DeleteWhere": parse_DeleteWhere,
        "DescribeQuery": parse_DescribeQuery,
        "Drop": parse_Drop,
        "ECHAR": parse_ECHAR,
        "EXPONENT": parse_EXPONENT,
        "ExistsFunc": parse_ExistsFunc,
        "ExpressionList": parse_ExpressionList,
        "Filter": parse_Filter,
        "FunctionCall": parse_FunctionCall,
        "GraphGraphPattern": parse_GraphGraphPattern,
        "GraphNode": parse_GraphNode,
        "GraphPatternNotTriples": parse_GraphPatternNotTriples,
        "GraphRef": parse_GraphRef,
        "GraphRefAll": parse_GraphRefAll,
        "GraphTerm": parse_GraphTerm,
        "GroupClause": parse_GroupClause,
        "GroupCondition": parse_GroupCondition,
        "GroupGraphPattern": parse_GroupGraphPattern,
        "GroupGraphPatternSub": parse_GroupGraphPatternSub,
        "GroupOrUnionGraphPattern": parse_GroupOrUnionGraphPattern,
        "HavingClause": parse_HavingClause,
        "INTEGER": parse_INTEGER,
        "INTEGER_NEGATIVE": parse_INTEGER_NEGATIVE,
        "INTEGER_POSITIVE": parse_INTEGER_POSITIVE,
        "IRI_REF": parse_IRI_REF,
        "IRIref": parse_IRIref,
        "IRIrefOrFunction": parse_IRIrefOrFunction,
        "InsertClause": parse_InsertClause,
        "InsertData": parse_InsertData,
        "LANGTAG": parse_LANGTAG,
        "LimitClause": parse_LimitClause,
        "LimitOffsetClauses": parse_LimitOffsetClauses,
        "Load": parse_Load,
        "MinusGraphPattern": parse_MinusGraphPattern,
        "Modify": parse_Modify,
        "MultiplicativeExpression": parse_MultiplicativeExpression,
        "NIL": parse_NIL,
        "NamedGraphClause": parse_NamedGraphClause,
        "NotExistsFunc": parse_NotExistsFunc,
        "NumericLiteral": parse_NumericLiteral,
        "NumericLiteralNegative": parse_NumericLiteralNegative,
        "NumericLiteralPositive": parse_NumericLiteralPositive,
        "NumericLiteralUnsigned": parse_NumericLiteralUnsigned,
        "ObjectList": parse_ObjectList,
        "OffsetClause": parse_OffsetClause,
        "OptionalGraphPattern": parse_OptionalGraphPattern,
        "OrderClause": parse_OrderClause,
        "OrderCondition": parse_OrderCondition,
        "PNAME_LN": parse_PNAME_LN,
        "PNAME_NS": parse_PNAME_NS,
        "PN_CHARS": parse_PN_CHARS,
        "PN_CHARS_BASE": parse_PN_CHARS_BASE,
        "PN_CHARS_U": parse_PN_CHARS_U,
        "PN_LOCAL": parse_PN_LOCAL,
        "PN_PREFIX": parse_PN_PREFIX,
        "PathAlternative": parse_PathAlternative,
        "PathElt": parse_PathElt,
        "PathEltOrInverse": parse_PathEltOrInverse,
        "PathMod": parse_PathMod,
        "PathNegatedPropertySet": parse_PathNegatedPropertySet,
        "PathOneInPropertySet": parse_PathOneInPropertySet,
        "PathPrimary": parse_PathPrimary,
        "PathSequence": parse_PathSequence,
        "PrefixDecl": parse_PrefixDecl,
        "PrefixedName": parse_PrefixedName,
        "PrimaryExpression": parse_PrimaryExpression,
        "Prologue": parse_Prologue,
        "PropertyList": parse_PropertyList,
        "PropertyListNotEmpty": parse_PropertyListNotEmpty,
        "PropertyListNotEmptyPath": parse_PropertyListNotEmptyPath,
        "PropertyListPath": parse_PropertyListPath,
        "QuadData": parse_QuadData,
        "QuadPattern": parse_QuadPattern,
        "Quads": parse_Quads,
        "QuadsNotTriples": parse_QuadsNotTriples,
        "Query": parse_Query,
        "RDFLiteral": parse_RDFLiteral,
        "RegexExpression": parse_RegexExpression,
        "RelationalExpression": parse_RelationalExpression,
        "SPARQL": parse_SPARQL,
        "STRING_LITERAL1": parse_STRING_LITERAL1,
        "STRING_LITERAL2": parse_STRING_LITERAL2,
        "STRING_LITERAL_LONG1": parse_STRING_LITERAL_LONG1,
        "STRING_LITERAL_LONG2": parse_STRING_LITERAL_LONG2,
        "SelectClause": parse_SelectClause,
        "SelectQuery": parse_SelectQuery,
        "ServiceGraphPattern": parse_ServiceGraphPattern,
        "SolutionModifier": parse_SolutionModifier,
        "String": parse_String,
        "SubSelect": parse_SubSelect,
        "TURTLE": parse_TURTLE,
        "TriplesBlock": parse_TriplesBlock,
        "TriplesNode": parse_TriplesNode,
        "TriplesSameSubject": parse_TriplesSameSubject,
        "TriplesSameSubjectPath": parse_TriplesSameSubjectPath,
        "TriplesTemplate": parse_TriplesTemplate,
        "UnaryExpression": parse_UnaryExpression,
        "Update": parse_Update,
        "Update1": parse_Update1,
        "UsingClause": parse_UsingClause,
        "VAR1": parse_VAR1,
        "VAR2": parse_VAR2,
        "VARNAME": parse_VARNAME,
        "Var": parse_Var,
        "VarOrIRIref": parse_VarOrIRIref,
        "VarOrTerm": parse_VarOrTerm,
        "Verb": parse_Verb,
        "VerbPath": parse_VerbPath,
        "WS": parse_WS,
        "WhereClause": parse_WhereClause,
        "base": parse_base,
        "directive": parse_directive,
        "prefixID": parse_prefixID,
        "statement": parse_statement
      };
      
      if (startRule !== undefined) {
        if (parseFunctions[startRule] === undefined) {
          throw new Error("Invalid rule name: " + quote(startRule) + ".");
        }
      } else {
        startRule = "DOCUMENT";
      }
      
      var pos = 0;
      var reportMatchFailures = true;
      var rightmostMatchFailuresPos = 0;
      var rightmostMatchFailuresExpected = [];
      var cache = {};
      
      function padLeft(input, padding, length) {
        var result = input;
        
        var padLength = length - input.length;
        for (var i = 0; i < padLength; i++) {
          result = padding + result;
        }
        
        return result;
      }
      
      function escape(ch) {
        var charCode = ch.charCodeAt(0);
        
        if (charCode <= 0xFF) {
          var escapeChar = 'x';
          var length = 2;
        } else {
          var escapeChar = 'u';
          var length = 4;
        }
        
        return '\\' + escapeChar + padLeft(charCode.toString(16).toUpperCase(), '0', length);
      }
      
      function quote(s) {
        /*
         * ECMA-262, 5th ed., 7.8.4: All characters may appear literally in a
         * string literal except for the closing quote character, backslash,
         * carriage return, line separator, paragraph separator, and line feed.
         * Any character may appear in the form of an escape sequence.
         */
        return '"' + s
          .replace(/\\/g, '\\\\')            // backslash
          .replace(/"/g, '\\"')              // closing quote character
          .replace(/\r/g, '\\r')             // carriage return
          .replace(/\n/g, '\\n')             // line feed
          .replace(/[\x80-\uFFFF]/g, escape) // non-ASCII characters
          + '"';
      }
      
      function matchFailed(failure) {
        if (pos < rightmostMatchFailuresPos) {
          return;
        }
        
        if (pos > rightmostMatchFailuresPos) {
          rightmostMatchFailuresPos = pos;
          rightmostMatchFailuresExpected = [];
        }
        
        rightmostMatchFailuresExpected.push(failure);
      }
      
      function parse_DOCUMENT() {
        var cacheKey = 'DOCUMENT@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var result2 = parse_SPARQL();
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result1 = parse_TURTLE();
          if (result1 !== null) {
            var result0 = result1;
          } else {
            var result0 = null;;
          };
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_SPARQL() {
        var cacheKey = 'SPARQL@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var result2 = parse_Query();
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result1 = parse_Update();
          if (result1 !== null) {
            var result0 = result1;
          } else {
            var result0 = null;;
          };
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_Query() {
        var cacheKey = 'Query@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        var savedReportMatchFailures = reportMatchFailures;
        reportMatchFailures = false;
        var savedPos0 = pos;
        var savedPos1 = pos;
        var result3 = parse_Prologue();
        if (result3 !== null) {
          var result8 = parse_SelectQuery();
          if (result8 !== null) {
            var result4 = result8;
          } else {
            var result7 = parse_ConstructQuery();
            if (result7 !== null) {
              var result4 = result7;
            } else {
              var result6 = parse_DescribeQuery();
              if (result6 !== null) {
                var result4 = result6;
              } else {
                var result5 = parse_AskQuery();
                if (result5 !== null) {
                  var result4 = result5;
                } else {
                  var result4 = null;;
                };
              };
            };
          }
          if (result4 !== null) {
            var result1 = [result3, result4];
          } else {
            var result1 = null;
            pos = savedPos1;
          }
        } else {
          var result1 = null;
          pos = savedPos1;
        }
        var result2 = result1 !== null
          ? (function(p, q) {
                return {token: 'query',
                        kind: 'query',
                        prologue: p,
                        units: [q]};
          })(result1[0], result1[1])
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        reportMatchFailures = savedReportMatchFailures;
        if (reportMatchFailures && result0 === null) {
          matchFailed("[2] Query");
        }
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_Prologue() {
        var cacheKey = 'Prologue@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        var savedReportMatchFailures = reportMatchFailures;
        reportMatchFailures = false;
        var savedPos0 = pos;
        var savedPos1 = pos;
        var result8 = parse_BaseDecl();
        var result3 = result8 !== null ? result8 : '';
        if (result3 !== null) {
          var result4 = [];
          var result7 = parse_WS();
          while (result7 !== null) {
            result4.push(result7);
            var result7 = parse_WS();
          }
          if (result4 !== null) {
            var result5 = [];
            var result6 = parse_PrefixDecl();
            while (result6 !== null) {
              result5.push(result6);
              var result6 = parse_PrefixDecl();
            }
            if (result5 !== null) {
              var result1 = [result3, result4, result5];
            } else {
              var result1 = null;
              pos = savedPos1;
            }
          } else {
            var result1 = null;
            pos = savedPos1;
          }
        } else {
          var result1 = null;
          pos = savedPos1;
        }
        var result2 = result1 !== null
          ? (function(b, pfx) {
                return { token: 'prologue',
                         base: b,
                         prefixes: pfx }
          })(result1[0], result1[2])
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        reportMatchFailures = savedReportMatchFailures;
        if (reportMatchFailures && result0 === null) {
          matchFailed("[3] Prologue");
        }
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_BaseDecl() {
        var cacheKey = 'BaseDecl@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        var savedReportMatchFailures = reportMatchFailures;
        reportMatchFailures = false;
        var savedPos0 = pos;
        var savedPos1 = pos;
        var result3 = [];
        var result19 = parse_WS();
        while (result19 !== null) {
          result3.push(result19);
          var result19 = parse_WS();
        }
        if (result3 !== null) {
          if (input.substr(pos, 1) === "B") {
            var result18 = "B";
            pos += 1;
          } else {
            var result18 = null;
            if (reportMatchFailures) {
              matchFailed("\"B\"");
            }
          }
          if (result18 !== null) {
            var result4 = result18;
          } else {
            if (input.substr(pos, 1) === "b") {
              var result17 = "b";
              pos += 1;
            } else {
              var result17 = null;
              if (reportMatchFailures) {
                matchFailed("\"b\"");
              }
            }
            if (result17 !== null) {
              var result4 = result17;
            } else {
              var result4 = null;;
            };
          }
          if (result4 !== null) {
            if (input.substr(pos, 1) === "A") {
              var result16 = "A";
              pos += 1;
            } else {
              var result16 = null;
              if (reportMatchFailures) {
                matchFailed("\"A\"");
              }
            }
            if (result16 !== null) {
              var result5 = result16;
            } else {
              if (input.substr(pos, 1) === "a") {
                var result15 = "a";
                pos += 1;
              } else {
                var result15 = null;
                if (reportMatchFailures) {
                  matchFailed("\"a\"");
                }
              }
              if (result15 !== null) {
                var result5 = result15;
              } else {
                var result5 = null;;
              };
            }
            if (result5 !== null) {
              if (input.substr(pos, 1) === "S") {
                var result14 = "S";
                pos += 1;
              } else {
                var result14 = null;
                if (reportMatchFailures) {
                  matchFailed("\"S\"");
                }
              }
              if (result14 !== null) {
                var result6 = result14;
              } else {
                if (input.substr(pos, 1) === "s") {
                  var result13 = "s";
                  pos += 1;
                } else {
                  var result13 = null;
                  if (reportMatchFailures) {
                    matchFailed("\"s\"");
                  }
                }
                if (result13 !== null) {
                  var result6 = result13;
                } else {
                  var result6 = null;;
                };
              }
              if (result6 !== null) {
                if (input.substr(pos, 1) === "E") {
                  var result12 = "E";
                  pos += 1;
                } else {
                  var result12 = null;
                  if (reportMatchFailures) {
                    matchFailed("\"E\"");
                  }
                }
                if (result12 !== null) {
                  var result7 = result12;
                } else {
                  if (input.substr(pos, 1) === "e") {
                    var result11 = "e";
                    pos += 1;
                  } else {
                    var result11 = null;
                    if (reportMatchFailures) {
                      matchFailed("\"e\"");
                    }
                  }
                  if (result11 !== null) {
                    var result7 = result11;
                  } else {
                    var result7 = null;;
                  };
                }
                if (result7 !== null) {
                  var result8 = [];
                  var result10 = parse_WS();
                  while (result10 !== null) {
                    result8.push(result10);
                    var result10 = parse_WS();
                  }
                  if (result8 !== null) {
                    var result9 = parse_IRI_REF();
                    if (result9 !== null) {
                      var result1 = [result3, result4, result5, result6, result7, result8, result9];
                    } else {
                      var result1 = null;
                      pos = savedPos1;
                    }
                  } else {
                    var result1 = null;
                    pos = savedPos1;
                  }
                } else {
                  var result1 = null;
                  pos = savedPos1;
                }
              } else {
                var result1 = null;
                pos = savedPos1;
              }
            } else {
              var result1 = null;
              pos = savedPos1;
            }
          } else {
            var result1 = null;
            pos = savedPos1;
          }
        } else {
          var result1 = null;
          pos = savedPos1;
        }
        var result2 = result1 !== null
          ? (function(i) {
                registerDefaultPrefix(i);
          
                base = {};
                base.token = 'base';
                base.value = i;
          
                return base;
          })(result1[6])
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        reportMatchFailures = savedReportMatchFailures;
        if (reportMatchFailures && result0 === null) {
          matchFailed("[4] BaseDecl");
        }
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_PrefixDecl() {
        var cacheKey = 'PrefixDecl@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        var savedReportMatchFailures = reportMatchFailures;
        reportMatchFailures = false;
        var savedPos0 = pos;
        var savedPos1 = pos;
        var result3 = [];
        var result28 = parse_WS();
        while (result28 !== null) {
          result3.push(result28);
          var result28 = parse_WS();
        }
        if (result3 !== null) {
          if (input.substr(pos, 1) === "P") {
            var result27 = "P";
            pos += 1;
          } else {
            var result27 = null;
            if (reportMatchFailures) {
              matchFailed("\"P\"");
            }
          }
          if (result27 !== null) {
            var result4 = result27;
          } else {
            if (input.substr(pos, 1) === "p") {
              var result26 = "p";
              pos += 1;
            } else {
              var result26 = null;
              if (reportMatchFailures) {
                matchFailed("\"p\"");
              }
            }
            if (result26 !== null) {
              var result4 = result26;
            } else {
              var result4 = null;;
            };
          }
          if (result4 !== null) {
            if (input.substr(pos, 1) === "R") {
              var result25 = "R";
              pos += 1;
            } else {
              var result25 = null;
              if (reportMatchFailures) {
                matchFailed("\"R\"");
              }
            }
            if (result25 !== null) {
              var result5 = result25;
            } else {
              if (input.substr(pos, 1) === "r") {
                var result24 = "r";
                pos += 1;
              } else {
                var result24 = null;
                if (reportMatchFailures) {
                  matchFailed("\"r\"");
                }
              }
              if (result24 !== null) {
                var result5 = result24;
              } else {
                var result5 = null;;
              };
            }
            if (result5 !== null) {
              if (input.substr(pos, 1) === "E") {
                var result23 = "E";
                pos += 1;
              } else {
                var result23 = null;
                if (reportMatchFailures) {
                  matchFailed("\"E\"");
                }
              }
              if (result23 !== null) {
                var result6 = result23;
              } else {
                if (input.substr(pos, 1) === "e") {
                  var result22 = "e";
                  pos += 1;
                } else {
                  var result22 = null;
                  if (reportMatchFailures) {
                    matchFailed("\"e\"");
                  }
                }
                if (result22 !== null) {
                  var result6 = result22;
                } else {
                  var result6 = null;;
                };
              }
              if (result6 !== null) {
                if (input.substr(pos, 1) === "F") {
                  var result21 = "F";
                  pos += 1;
                } else {
                  var result21 = null;
                  if (reportMatchFailures) {
                    matchFailed("\"F\"");
                  }
                }
                if (result21 !== null) {
                  var result7 = result21;
                } else {
                  if (input.substr(pos, 1) === "f") {
                    var result20 = "f";
                    pos += 1;
                  } else {
                    var result20 = null;
                    if (reportMatchFailures) {
                      matchFailed("\"f\"");
                    }
                  }
                  if (result20 !== null) {
                    var result7 = result20;
                  } else {
                    var result7 = null;;
                  };
                }
                if (result7 !== null) {
                  if (input.substr(pos, 1) === "I") {
                    var result19 = "I";
                    pos += 1;
                  } else {
                    var result19 = null;
                    if (reportMatchFailures) {
                      matchFailed("\"I\"");
                    }
                  }
                  if (result19 !== null) {
                    var result8 = result19;
                  } else {
                    if (input.substr(pos, 1) === "i") {
                      var result18 = "i";
                      pos += 1;
                    } else {
                      var result18 = null;
                      if (reportMatchFailures) {
                        matchFailed("\"i\"");
                      }
                    }
                    if (result18 !== null) {
                      var result8 = result18;
                    } else {
                      var result8 = null;;
                    };
                  }
                  if (result8 !== null) {
                    if (input.substr(pos, 1) === "X") {
                      var result17 = "X";
                      pos += 1;
                    } else {
                      var result17 = null;
                      if (reportMatchFailures) {
                        matchFailed("\"X\"");
                      }
                    }
                    if (result17 !== null) {
                      var result9 = result17;
                    } else {
                      if (input.substr(pos, 1) === "x") {
                        var result16 = "x";
                        pos += 1;
                      } else {
                        var result16 = null;
                        if (reportMatchFailures) {
                          matchFailed("\"x\"");
                        }
                      }
                      if (result16 !== null) {
                        var result9 = result16;
                      } else {
                        var result9 = null;;
                      };
                    }
                    if (result9 !== null) {
                      var result10 = [];
                      var result15 = parse_WS();
                      while (result15 !== null) {
                        result10.push(result15);
                        var result15 = parse_WS();
                      }
                      if (result10 !== null) {
                        var result11 = parse_PNAME_NS();
                        if (result11 !== null) {
                          var result12 = [];
                          var result14 = parse_WS();
                          while (result14 !== null) {
                            result12.push(result14);
                            var result14 = parse_WS();
                          }
                          if (result12 !== null) {
                            var result13 = parse_IRI_REF();
                            if (result13 !== null) {
                              var result1 = [result3, result4, result5, result6, result7, result8, result9, result10, result11, result12, result13];
                            } else {
                              var result1 = null;
                              pos = savedPos1;
                            }
                          } else {
                            var result1 = null;
                            pos = savedPos1;
                          }
                        } else {
                          var result1 = null;
                          pos = savedPos1;
                        }
                      } else {
                        var result1 = null;
                        pos = savedPos1;
                      }
                    } else {
                      var result1 = null;
                      pos = savedPos1;
                    }
                  } else {
                    var result1 = null;
                    pos = savedPos1;
                  }
                } else {
                  var result1 = null;
                  pos = savedPos1;
                }
              } else {
                var result1 = null;
                pos = savedPos1;
              }
            } else {
              var result1 = null;
              pos = savedPos1;
            }
          } else {
            var result1 = null;
            pos = savedPos1;
          }
        } else {
          var result1 = null;
          pos = savedPos1;
        }
        var result2 = result1 !== null
          ? (function(p, l) {
          
                registerPrefix(p,l);
          
                prefix = {};
                prefix.token = 'prefix';
                prefix.prefix = p;
                prefix.local = l;
          
                return prefix;
          })(result1[8], result1[10])
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        reportMatchFailures = savedReportMatchFailures;
        if (reportMatchFailures && result0 === null) {
          matchFailed("[5] PrefixDecl");
        }
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_TURTLE() {
        var cacheKey = 'TURTLE@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var savedPos0 = pos;
        var result1 = [];
        var result3 = parse_statement();
        while (result3 !== null) {
          result1.push(result3);
          var result3 = parse_statement();
        }
        var result2 = result1 !== null
          ? (function(sts) {
                  return sts;
              })(result1)
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_statement() {
        var cacheKey = 'statement@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var savedPos2 = pos;
        var savedPos3 = pos;
        var result14 = [];
        var result21 = parse_WS();
        while (result21 !== null) {
          result14.push(result21);
          var result21 = parse_WS();
        }
        if (result14 !== null) {
          var result15 = parse_directive();
          if (result15 !== null) {
            var result16 = [];
            var result20 = parse_WS();
            while (result20 !== null) {
              result16.push(result20);
              var result20 = parse_WS();
            }
            if (result16 !== null) {
              if (input.substr(pos, 1) === ".") {
                var result17 = ".";
                pos += 1;
              } else {
                var result17 = null;
                if (reportMatchFailures) {
                  matchFailed("\".\"");
                }
              }
              if (result17 !== null) {
                var result18 = [];
                var result19 = parse_WS();
                while (result19 !== null) {
                  result18.push(result19);
                  var result19 = parse_WS();
                }
                if (result18 !== null) {
                  var result12 = [result14, result15, result16, result17, result18];
                } else {
                  var result12 = null;
                  pos = savedPos3;
                }
              } else {
                var result12 = null;
                pos = savedPos3;
              }
            } else {
              var result12 = null;
              pos = savedPos3;
            }
          } else {
            var result12 = null;
            pos = savedPos3;
          }
        } else {
          var result12 = null;
          pos = savedPos3;
        }
        var result13 = result12 !== null
          ? (function(d) {
                  return d;
              })(result12[1])
          : null;
        if (result13 !== null) {
          var result11 = result13;
        } else {
          var result11 = null;
          pos = savedPos2;
        }
        if (result11 !== null) {
          var result0 = result11;
        } else {
          var savedPos0 = pos;
          var savedPos1 = pos;
          var result6 = [];
          var result10 = parse_WS();
          while (result10 !== null) {
            result6.push(result10);
            var result10 = parse_WS();
          }
          if (result6 !== null) {
            var result7 = parse_TriplesBlock();
            if (result7 !== null) {
              var result8 = [];
              var result9 = parse_WS();
              while (result9 !== null) {
                result8.push(result9);
                var result9 = parse_WS();
              }
              if (result8 !== null) {
                var result4 = [result6, result7, result8];
              } else {
                var result4 = null;
                pos = savedPos1;
              }
            } else {
              var result4 = null;
              pos = savedPos1;
            }
          } else {
            var result4 = null;
            pos = savedPos1;
          }
          var result5 = result4 !== null
            ? (function(ts) {
                    return ts;
                })(result4[1])
            : null;
          if (result5 !== null) {
            var result3 = result5;
          } else {
            var result3 = null;
            pos = savedPos0;
          }
          if (result3 !== null) {
            var result0 = result3;
          } else {
            var result2 = parse_WS();
            if (result2 !== null) {
              var result1 = [];
              while (result2 !== null) {
                result1.push(result2);
                var result2 = parse_WS();
              }
            } else {
              var result1 = null;
            }
            if (result1 !== null) {
              var result0 = result1;
            } else {
              var result0 = null;;
            };
          };
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_directive() {
        var cacheKey = 'directive@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var result2 = parse_prefixID();
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result1 = parse_base();
          if (result1 !== null) {
            var result0 = result1;
          } else {
            var result0 = null;;
          };
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_base() {
        var cacheKey = 'base@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var savedPos0 = pos;
        var savedPos1 = pos;
        var result3 = [];
        var result8 = parse_WS();
        while (result8 !== null) {
          result3.push(result8);
          var result8 = parse_WS();
        }
        if (result3 !== null) {
          if (input.substr(pos, 5) === "@base") {
            var result4 = "@base";
            pos += 5;
          } else {
            var result4 = null;
            if (reportMatchFailures) {
              matchFailed("\"@base\"");
            }
          }
          if (result4 !== null) {
            var result7 = parse_WS();
            if (result7 !== null) {
              var result5 = [];
              while (result7 !== null) {
                result5.push(result7);
                var result7 = parse_WS();
              }
            } else {
              var result5 = null;
            }
            if (result5 !== null) {
              var result6 = parse_IRI_REF();
              if (result6 !== null) {
                var result1 = [result3, result4, result5, result6];
              } else {
                var result1 = null;
                pos = savedPos1;
              }
            } else {
              var result1 = null;
              pos = savedPos1;
            }
          } else {
            var result1 = null;
            pos = savedPos1;
          }
        } else {
          var result1 = null;
          pos = savedPos1;
        }
        var result2 = result1 !== null
          ? (function(i) {
                registerDefaultPrefix(i);
          
                base = {};
                base.token = 'base';
                base.value = i;
          
                return base;
          })(result1[3])
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_prefixID() {
        var cacheKey = 'prefixID@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var savedPos0 = pos;
        var savedPos1 = pos;
        var result3 = [];
        var result13 = parse_WS();
        while (result13 !== null) {
          result3.push(result13);
          var result13 = parse_WS();
        }
        if (result3 !== null) {
          if (input.substr(pos, 7) === "@prefix") {
            var result4 = "@prefix";
            pos += 7;
          } else {
            var result4 = null;
            if (reportMatchFailures) {
              matchFailed("\"@prefix\"");
            }
          }
          if (result4 !== null) {
            var result12 = parse_WS();
            if (result12 !== null) {
              var result5 = [];
              while (result12 !== null) {
                result5.push(result12);
                var result12 = parse_WS();
              }
            } else {
              var result5 = null;
            }
            if (result5 !== null) {
              var result11 = parse_PN_PREFIX();
              var result6 = result11 !== null ? result11 : '';
              if (result6 !== null) {
                if (input.substr(pos, 1) === ":") {
                  var result7 = ":";
                  pos += 1;
                } else {
                  var result7 = null;
                  if (reportMatchFailures) {
                    matchFailed("\":\"");
                  }
                }
                if (result7 !== null) {
                  var result8 = [];
                  var result10 = parse_WS();
                  while (result10 !== null) {
                    result8.push(result10);
                    var result10 = parse_WS();
                  }
                  if (result8 !== null) {
                    var result9 = parse_IRI_REF();
                    if (result9 !== null) {
                      var result1 = [result3, result4, result5, result6, result7, result8, result9];
                    } else {
                      var result1 = null;
                      pos = savedPos1;
                    }
                  } else {
                    var result1 = null;
                    pos = savedPos1;
                  }
                } else {
                  var result1 = null;
                  pos = savedPos1;
                }
              } else {
                var result1 = null;
                pos = savedPos1;
              }
            } else {
              var result1 = null;
              pos = savedPos1;
            }
          } else {
            var result1 = null;
            pos = savedPos1;
          }
        } else {
          var result1 = null;
          pos = savedPos1;
        }
        var result2 = result1 !== null
          ? (function(p, l) {
          
                registerPrefix(p,l);
          
                prefix = {};
                prefix.token = 'prefix';
                prefix.prefix = p;
                prefix.local = l;
          
                return prefix;
          })(result1[3], result1[6])
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_SelectQuery() {
        var cacheKey = 'SelectQuery@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        var savedReportMatchFailures = reportMatchFailures;
        reportMatchFailures = false;
        var savedPos0 = pos;
        var savedPos1 = pos;
        var result3 = parse_SelectClause();
        if (result3 !== null) {
          var result4 = [];
          var result16 = parse_WS();
          while (result16 !== null) {
            result4.push(result16);
            var result16 = parse_WS();
          }
          if (result4 !== null) {
            var result5 = [];
            var result15 = parse_DatasetClause();
            while (result15 !== null) {
              result5.push(result15);
              var result15 = parse_DatasetClause();
            }
            if (result5 !== null) {
              var result6 = [];
              var result14 = parse_WS();
              while (result14 !== null) {
                result6.push(result14);
                var result14 = parse_WS();
              }
              if (result6 !== null) {
                var result7 = parse_WhereClause();
                if (result7 !== null) {
                  var result8 = [];
                  var result13 = parse_WS();
                  while (result13 !== null) {
                    result8.push(result13);
                    var result13 = parse_WS();
                  }
                  if (result8 !== null) {
                    var result9 = parse_SolutionModifier();
                    if (result9 !== null) {
                      var result10 = [];
                      var result12 = parse_WS();
                      while (result12 !== null) {
                        result10.push(result12);
                        var result12 = parse_WS();
                      }
                      if (result10 !== null) {
                        var result11 = parse_BindingsClause();
                        if (result11 !== null) {
                          var result1 = [result3, result4, result5, result6, result7, result8, result9, result10, result11];
                        } else {
                          var result1 = null;
                          pos = savedPos1;
                        }
                      } else {
                        var result1 = null;
                        pos = savedPos1;
                      }
                    } else {
                      var result1 = null;
                      pos = savedPos1;
                    }
                  } else {
                    var result1 = null;
                    pos = savedPos1;
                  }
                } else {
                  var result1 = null;
                  pos = savedPos1;
                }
              } else {
                var result1 = null;
                pos = savedPos1;
              }
            } else {
              var result1 = null;
              pos = savedPos1;
            }
          } else {
            var result1 = null;
            pos = savedPos1;
          }
        } else {
          var result1 = null;
          pos = savedPos1;
        }
        var result2 = result1 !== null
          ? (function(s, gs, w, sm) {
          
                var dataset = {'named':[], 'default':[]};
                for(var i=0; i<gs.length; i++) {
                    var g = gs[i];
                    if(g.kind === 'default') {
                        dataset['default'].push(g.graph);
                    } else {
                        dataset['named'].push(g.graph)
                    }
                }
          
          
                if(dataset['named'].length === 0 && dataset['default'].length === 0) {
                    dataset['default'].push({token:'uri', 
                                             prefix:null, 
                                             suffix:null, 
                                             value:'https://github.com/antoniogarrote/rdfstore-js#default_graph'});
                }
          
                var query = {};
                query.kind = 'select';
                query.token = 'executableunit'
                query.dataset = dataset;
                query.projection = s.vars;
                query.modifier = s.modifier;
                query.pattern = w
                
                if(sm!=null && sm.limit!=null) {
                    query.limit = sm.limit;
                }
                if(sm!=null && sm.offset!=null) {
                    query.offset = sm.offset;
                }
                if(sm!=null && (sm.order!=null && sm.order!="")) {
                    query.order = sm.order;
                }
                if(sm!=null && sm.group!=null) {
                    query.group = sm.group;
                }
          
                return query
          })(result1[0], result1[2], result1[4], result1[6])
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        reportMatchFailures = savedReportMatchFailures;
        if (reportMatchFailures && result0 === null) {
          matchFailed("[6] SelectQuery");
        }
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_SubSelect() {
        var cacheKey = 'SubSelect@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        var savedReportMatchFailures = reportMatchFailures;
        reportMatchFailures = false;
        var savedPos0 = pos;
        var result1 = parse_SelectClause();
        if (result1 !== null) {
          var result2 = parse_WhereClause();
          if (result2 !== null) {
            var result3 = parse_SolutionModifier();
            if (result3 !== null) {
              var result0 = [result1, result2, result3];
            } else {
              var result0 = null;
              pos = savedPos0;
            }
          } else {
            var result0 = null;
            pos = savedPos0;
          }
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        reportMatchFailures = savedReportMatchFailures;
        if (reportMatchFailures && result0 === null) {
          matchFailed("[7] SubSelect");
        }
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_SelectClause() {
        var cacheKey = 'SelectClause@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        var savedReportMatchFailures = reportMatchFailures;
        reportMatchFailures = false;
        var savedPos0 = pos;
        var savedPos1 = pos;
        var result3 = [];
        var result113 = parse_WS();
        while (result113 !== null) {
          result3.push(result113);
          var result113 = parse_WS();
        }
        if (result3 !== null) {
          if (input.substr(pos, 1) === "S") {
            var result112 = "S";
            pos += 1;
          } else {
            var result112 = null;
            if (reportMatchFailures) {
              matchFailed("\"S\"");
            }
          }
          if (result112 !== null) {
            var result4 = result112;
          } else {
            if (input.substr(pos, 1) === "s") {
              var result111 = "s";
              pos += 1;
            } else {
              var result111 = null;
              if (reportMatchFailures) {
                matchFailed("\"s\"");
              }
            }
            if (result111 !== null) {
              var result4 = result111;
            } else {
              var result4 = null;;
            };
          }
          if (result4 !== null) {
            if (input.substr(pos, 1) === "E") {
              var result110 = "E";
              pos += 1;
            } else {
              var result110 = null;
              if (reportMatchFailures) {
                matchFailed("\"E\"");
              }
            }
            if (result110 !== null) {
              var result5 = result110;
            } else {
              if (input.substr(pos, 1) === "e") {
                var result109 = "e";
                pos += 1;
              } else {
                var result109 = null;
                if (reportMatchFailures) {
                  matchFailed("\"e\"");
                }
              }
              if (result109 !== null) {
                var result5 = result109;
              } else {
                var result5 = null;;
              };
            }
            if (result5 !== null) {
              if (input.substr(pos, 1) === "L") {
                var result108 = "L";
                pos += 1;
              } else {
                var result108 = null;
                if (reportMatchFailures) {
                  matchFailed("\"L\"");
                }
              }
              if (result108 !== null) {
                var result6 = result108;
              } else {
                if (input.substr(pos, 1) === "l") {
                  var result107 = "l";
                  pos += 1;
                } else {
                  var result107 = null;
                  if (reportMatchFailures) {
                    matchFailed("\"l\"");
                  }
                }
                if (result107 !== null) {
                  var result6 = result107;
                } else {
                  var result6 = null;;
                };
              }
              if (result6 !== null) {
                if (input.substr(pos, 1) === "E") {
                  var result106 = "E";
                  pos += 1;
                } else {
                  var result106 = null;
                  if (reportMatchFailures) {
                    matchFailed("\"E\"");
                  }
                }
                if (result106 !== null) {
                  var result7 = result106;
                } else {
                  if (input.substr(pos, 1) === "e") {
                    var result105 = "e";
                    pos += 1;
                  } else {
                    var result105 = null;
                    if (reportMatchFailures) {
                      matchFailed("\"e\"");
                    }
                  }
                  if (result105 !== null) {
                    var result7 = result105;
                  } else {
                    var result7 = null;;
                  };
                }
                if (result7 !== null) {
                  if (input.substr(pos, 1) === "C") {
                    var result104 = "C";
                    pos += 1;
                  } else {
                    var result104 = null;
                    if (reportMatchFailures) {
                      matchFailed("\"C\"");
                    }
                  }
                  if (result104 !== null) {
                    var result8 = result104;
                  } else {
                    if (input.substr(pos, 1) === "c") {
                      var result103 = "c";
                      pos += 1;
                    } else {
                      var result103 = null;
                      if (reportMatchFailures) {
                        matchFailed("\"c\"");
                      }
                    }
                    if (result103 !== null) {
                      var result8 = result103;
                    } else {
                      var result8 = null;;
                    };
                  }
                  if (result8 !== null) {
                    if (input.substr(pos, 1) === "T") {
                      var result102 = "T";
                      pos += 1;
                    } else {
                      var result102 = null;
                      if (reportMatchFailures) {
                        matchFailed("\"T\"");
                      }
                    }
                    if (result102 !== null) {
                      var result9 = result102;
                    } else {
                      if (input.substr(pos, 1) === "t") {
                        var result101 = "t";
                        pos += 1;
                      } else {
                        var result101 = null;
                        if (reportMatchFailures) {
                          matchFailed("\"t\"");
                        }
                      }
                      if (result101 !== null) {
                        var result9 = result101;
                      } else {
                        var result9 = null;;
                      };
                    }
                    if (result9 !== null) {
                      var result10 = [];
                      var result100 = parse_WS();
                      while (result100 !== null) {
                        result10.push(result100);
                        var result100 = parse_WS();
                      }
                      if (result10 !== null) {
                        var savedPos6 = pos;
                        if (input.substr(pos, 1) === "D") {
                          var result99 = "D";
                          pos += 1;
                        } else {
                          var result99 = null;
                          if (reportMatchFailures) {
                            matchFailed("\"D\"");
                          }
                        }
                        if (result99 !== null) {
                          var result76 = result99;
                        } else {
                          if (input.substr(pos, 1) === "d") {
                            var result98 = "d";
                            pos += 1;
                          } else {
                            var result98 = null;
                            if (reportMatchFailures) {
                              matchFailed("\"d\"");
                            }
                          }
                          if (result98 !== null) {
                            var result76 = result98;
                          } else {
                            var result76 = null;;
                          };
                        }
                        if (result76 !== null) {
                          if (input.substr(pos, 1) === "I") {
                            var result97 = "I";
                            pos += 1;
                          } else {
                            var result97 = null;
                            if (reportMatchFailures) {
                              matchFailed("\"I\"");
                            }
                          }
                          if (result97 !== null) {
                            var result77 = result97;
                          } else {
                            if (input.substr(pos, 1) === "i") {
                              var result96 = "i";
                              pos += 1;
                            } else {
                              var result96 = null;
                              if (reportMatchFailures) {
                                matchFailed("\"i\"");
                              }
                            }
                            if (result96 !== null) {
                              var result77 = result96;
                            } else {
                              var result77 = null;;
                            };
                          }
                          if (result77 !== null) {
                            if (input.substr(pos, 1) === "S") {
                              var result95 = "S";
                              pos += 1;
                            } else {
                              var result95 = null;
                              if (reportMatchFailures) {
                                matchFailed("\"S\"");
                              }
                            }
                            if (result95 !== null) {
                              var result78 = result95;
                            } else {
                              if (input.substr(pos, 1) === "s") {
                                var result94 = "s";
                                pos += 1;
                              } else {
                                var result94 = null;
                                if (reportMatchFailures) {
                                  matchFailed("\"s\"");
                                }
                              }
                              if (result94 !== null) {
                                var result78 = result94;
                              } else {
                                var result78 = null;;
                              };
                            }
                            if (result78 !== null) {
                              if (input.substr(pos, 1) === "T") {
                                var result93 = "T";
                                pos += 1;
                              } else {
                                var result93 = null;
                                if (reportMatchFailures) {
                                  matchFailed("\"T\"");
                                }
                              }
                              if (result93 !== null) {
                                var result79 = result93;
                              } else {
                                if (input.substr(pos, 1) === "t") {
                                  var result92 = "t";
                                  pos += 1;
                                } else {
                                  var result92 = null;
                                  if (reportMatchFailures) {
                                    matchFailed("\"t\"");
                                  }
                                }
                                if (result92 !== null) {
                                  var result79 = result92;
                                } else {
                                  var result79 = null;;
                                };
                              }
                              if (result79 !== null) {
                                if (input.substr(pos, 1) === "I") {
                                  var result91 = "I";
                                  pos += 1;
                                } else {
                                  var result91 = null;
                                  if (reportMatchFailures) {
                                    matchFailed("\"I\"");
                                  }
                                }
                                if (result91 !== null) {
                                  var result80 = result91;
                                } else {
                                  if (input.substr(pos, 1) === "i") {
                                    var result90 = "i";
                                    pos += 1;
                                  } else {
                                    var result90 = null;
                                    if (reportMatchFailures) {
                                      matchFailed("\"i\"");
                                    }
                                  }
                                  if (result90 !== null) {
                                    var result80 = result90;
                                  } else {
                                    var result80 = null;;
                                  };
                                }
                                if (result80 !== null) {
                                  if (input.substr(pos, 1) === "N") {
                                    var result89 = "N";
                                    pos += 1;
                                  } else {
                                    var result89 = null;
                                    if (reportMatchFailures) {
                                      matchFailed("\"N\"");
                                    }
                                  }
                                  if (result89 !== null) {
                                    var result81 = result89;
                                  } else {
                                    if (input.substr(pos, 1) === "n") {
                                      var result88 = "n";
                                      pos += 1;
                                    } else {
                                      var result88 = null;
                                      if (reportMatchFailures) {
                                        matchFailed("\"n\"");
                                      }
                                    }
                                    if (result88 !== null) {
                                      var result81 = result88;
                                    } else {
                                      var result81 = null;;
                                    };
                                  }
                                  if (result81 !== null) {
                                    if (input.substr(pos, 1) === "C") {
                                      var result87 = "C";
                                      pos += 1;
                                    } else {
                                      var result87 = null;
                                      if (reportMatchFailures) {
                                        matchFailed("\"C\"");
                                      }
                                    }
                                    if (result87 !== null) {
                                      var result82 = result87;
                                    } else {
                                      if (input.substr(pos, 1) === "c") {
                                        var result86 = "c";
                                        pos += 1;
                                      } else {
                                        var result86 = null;
                                        if (reportMatchFailures) {
                                          matchFailed("\"c\"");
                                        }
                                      }
                                      if (result86 !== null) {
                                        var result82 = result86;
                                      } else {
                                        var result82 = null;;
                                      };
                                    }
                                    if (result82 !== null) {
                                      if (input.substr(pos, 1) === "T") {
                                        var result85 = "T";
                                        pos += 1;
                                      } else {
                                        var result85 = null;
                                        if (reportMatchFailures) {
                                          matchFailed("\"T\"");
                                        }
                                      }
                                      if (result85 !== null) {
                                        var result83 = result85;
                                      } else {
                                        if (input.substr(pos, 1) === "t") {
                                          var result84 = "t";
                                          pos += 1;
                                        } else {
                                          var result84 = null;
                                          if (reportMatchFailures) {
                                            matchFailed("\"t\"");
                                          }
                                        }
                                        if (result84 !== null) {
                                          var result83 = result84;
                                        } else {
                                          var result83 = null;;
                                        };
                                      }
                                      if (result83 !== null) {
                                        var result75 = [result76, result77, result78, result79, result80, result81, result82, result83];
                                      } else {
                                        var result75 = null;
                                        pos = savedPos6;
                                      }
                                    } else {
                                      var result75 = null;
                                      pos = savedPos6;
                                    }
                                  } else {
                                    var result75 = null;
                                    pos = savedPos6;
                                  }
                                } else {
                                  var result75 = null;
                                  pos = savedPos6;
                                }
                              } else {
                                var result75 = null;
                                pos = savedPos6;
                              }
                            } else {
                              var result75 = null;
                              pos = savedPos6;
                            }
                          } else {
                            var result75 = null;
                            pos = savedPos6;
                          }
                        } else {
                          var result75 = null;
                          pos = savedPos6;
                        }
                        if (result75 !== null) {
                          var result52 = result75;
                        } else {
                          var savedPos5 = pos;
                          if (input.substr(pos, 1) === "R") {
                            var result74 = "R";
                            pos += 1;
                          } else {
                            var result74 = null;
                            if (reportMatchFailures) {
                              matchFailed("\"R\"");
                            }
                          }
                          if (result74 !== null) {
                            var result54 = result74;
                          } else {
                            if (input.substr(pos, 1) === "r") {
                              var result73 = "r";
                              pos += 1;
                            } else {
                              var result73 = null;
                              if (reportMatchFailures) {
                                matchFailed("\"r\"");
                              }
                            }
                            if (result73 !== null) {
                              var result54 = result73;
                            } else {
                              var result54 = null;;
                            };
                          }
                          if (result54 !== null) {
                            if (input.substr(pos, 1) === "E") {
                              var result72 = "E";
                              pos += 1;
                            } else {
                              var result72 = null;
                              if (reportMatchFailures) {
                                matchFailed("\"E\"");
                              }
                            }
                            if (result72 !== null) {
                              var result55 = result72;
                            } else {
                              if (input.substr(pos, 1) === "e") {
                                var result71 = "e";
                                pos += 1;
                              } else {
                                var result71 = null;
                                if (reportMatchFailures) {
                                  matchFailed("\"e\"");
                                }
                              }
                              if (result71 !== null) {
                                var result55 = result71;
                              } else {
                                var result55 = null;;
                              };
                            }
                            if (result55 !== null) {
                              if (input.substr(pos, 1) === "D") {
                                var result70 = "D";
                                pos += 1;
                              } else {
                                var result70 = null;
                                if (reportMatchFailures) {
                                  matchFailed("\"D\"");
                                }
                              }
                              if (result70 !== null) {
                                var result56 = result70;
                              } else {
                                if (input.substr(pos, 1) === "d") {
                                  var result69 = "d";
                                  pos += 1;
                                } else {
                                  var result69 = null;
                                  if (reportMatchFailures) {
                                    matchFailed("\"d\"");
                                  }
                                }
                                if (result69 !== null) {
                                  var result56 = result69;
                                } else {
                                  var result56 = null;;
                                };
                              }
                              if (result56 !== null) {
                                if (input.substr(pos, 1) === "U") {
                                  var result68 = "U";
                                  pos += 1;
                                } else {
                                  var result68 = null;
                                  if (reportMatchFailures) {
                                    matchFailed("\"U\"");
                                  }
                                }
                                if (result68 !== null) {
                                  var result57 = result68;
                                } else {
                                  if (input.substr(pos, 1) === "u") {
                                    var result67 = "u";
                                    pos += 1;
                                  } else {
                                    var result67 = null;
                                    if (reportMatchFailures) {
                                      matchFailed("\"u\"");
                                    }
                                  }
                                  if (result67 !== null) {
                                    var result57 = result67;
                                  } else {
                                    var result57 = null;;
                                  };
                                }
                                if (result57 !== null) {
                                  if (input.substr(pos, 1) === "C") {
                                    var result66 = "C";
                                    pos += 1;
                                  } else {
                                    var result66 = null;
                                    if (reportMatchFailures) {
                                      matchFailed("\"C\"");
                                    }
                                  }
                                  if (result66 !== null) {
                                    var result58 = result66;
                                  } else {
                                    if (input.substr(pos, 1) === "c") {
                                      var result65 = "c";
                                      pos += 1;
                                    } else {
                                      var result65 = null;
                                      if (reportMatchFailures) {
                                        matchFailed("\"c\"");
                                      }
                                    }
                                    if (result65 !== null) {
                                      var result58 = result65;
                                    } else {
                                      var result58 = null;;
                                    };
                                  }
                                  if (result58 !== null) {
                                    if (input.substr(pos, 1) === "E") {
                                      var result64 = "E";
                                      pos += 1;
                                    } else {
                                      var result64 = null;
                                      if (reportMatchFailures) {
                                        matchFailed("\"E\"");
                                      }
                                    }
                                    if (result64 !== null) {
                                      var result59 = result64;
                                    } else {
                                      if (input.substr(pos, 1) === "e") {
                                        var result63 = "e";
                                        pos += 1;
                                      } else {
                                        var result63 = null;
                                        if (reportMatchFailures) {
                                          matchFailed("\"e\"");
                                        }
                                      }
                                      if (result63 !== null) {
                                        var result59 = result63;
                                      } else {
                                        var result59 = null;;
                                      };
                                    }
                                    if (result59 !== null) {
                                      if (input.substr(pos, 1) === "D") {
                                        var result62 = "D";
                                        pos += 1;
                                      } else {
                                        var result62 = null;
                                        if (reportMatchFailures) {
                                          matchFailed("\"D\"");
                                        }
                                      }
                                      if (result62 !== null) {
                                        var result60 = result62;
                                      } else {
                                        if (input.substr(pos, 1) === "d") {
                                          var result61 = "d";
                                          pos += 1;
                                        } else {
                                          var result61 = null;
                                          if (reportMatchFailures) {
                                            matchFailed("\"d\"");
                                          }
                                        }
                                        if (result61 !== null) {
                                          var result60 = result61;
                                        } else {
                                          var result60 = null;;
                                        };
                                      }
                                      if (result60 !== null) {
                                        var result53 = [result54, result55, result56, result57, result58, result59, result60];
                                      } else {
                                        var result53 = null;
                                        pos = savedPos5;
                                      }
                                    } else {
                                      var result53 = null;
                                      pos = savedPos5;
                                    }
                                  } else {
                                    var result53 = null;
                                    pos = savedPos5;
                                  }
                                } else {
                                  var result53 = null;
                                  pos = savedPos5;
                                }
                              } else {
                                var result53 = null;
                                pos = savedPos5;
                              }
                            } else {
                              var result53 = null;
                              pos = savedPos5;
                            }
                          } else {
                            var result53 = null;
                            pos = savedPos5;
                          }
                          if (result53 !== null) {
                            var result52 = result53;
                          } else {
                            var result52 = null;;
                          };
                        }
                        var result11 = result52 !== null ? result52 : '';
                        if (result11 !== null) {
                          var result12 = [];
                          var result51 = parse_WS();
                          while (result51 !== null) {
                            result12.push(result51);
                            var result51 = parse_WS();
                          }
                          if (result12 !== null) {
                            var savedPos4 = pos;
                            var result46 = [];
                            var result50 = parse_WS();
                            while (result50 !== null) {
                              result46.push(result50);
                              var result50 = parse_WS();
                            }
                            if (result46 !== null) {
                              var result47 = parse_Var();
                              if (result47 !== null) {
                                var result48 = [];
                                var result49 = parse_WS();
                                while (result49 !== null) {
                                  result48.push(result49);
                                  var result49 = parse_WS();
                                }
                                if (result48 !== null) {
                                  var result45 = [result46, result47, result48];
                                } else {
                                  var result45 = null;
                                  pos = savedPos4;
                                }
                              } else {
                                var result45 = null;
                                pos = savedPos4;
                              }
                            } else {
                              var result45 = null;
                              pos = savedPos4;
                            }
                            if (result45 !== null) {
                              var result21 = result45;
                            } else {
                              var savedPos3 = pos;
                              var result23 = [];
                              var result44 = parse_WS();
                              while (result44 !== null) {
                                result23.push(result44);
                                var result44 = parse_WS();
                              }
                              if (result23 !== null) {
                                if (input.substr(pos, 1) === "(") {
                                  var result24 = "(";
                                  pos += 1;
                                } else {
                                  var result24 = null;
                                  if (reportMatchFailures) {
                                    matchFailed("\"(\"");
                                  }
                                }
                                if (result24 !== null) {
                                  var result25 = [];
                                  var result43 = parse_WS();
                                  while (result43 !== null) {
                                    result25.push(result43);
                                    var result43 = parse_WS();
                                  }
                                  if (result25 !== null) {
                                    var result26 = parse_ConditionalOrExpression();
                                    if (result26 !== null) {
                                      var result27 = [];
                                      var result42 = parse_WS();
                                      while (result42 !== null) {
                                        result27.push(result42);
                                        var result42 = parse_WS();
                                      }
                                      if (result27 !== null) {
                                        if (input.substr(pos, 1) === "A") {
                                          var result41 = "A";
                                          pos += 1;
                                        } else {
                                          var result41 = null;
                                          if (reportMatchFailures) {
                                            matchFailed("\"A\"");
                                          }
                                        }
                                        if (result41 !== null) {
                                          var result28 = result41;
                                        } else {
                                          if (input.substr(pos, 1) === "a") {
                                            var result40 = "a";
                                            pos += 1;
                                          } else {
                                            var result40 = null;
                                            if (reportMatchFailures) {
                                              matchFailed("\"a\"");
                                            }
                                          }
                                          if (result40 !== null) {
                                            var result28 = result40;
                                          } else {
                                            var result28 = null;;
                                          };
                                        }
                                        if (result28 !== null) {
                                          if (input.substr(pos, 1) === "S") {
                                            var result39 = "S";
                                            pos += 1;
                                          } else {
                                            var result39 = null;
                                            if (reportMatchFailures) {
                                              matchFailed("\"S\"");
                                            }
                                          }
                                          if (result39 !== null) {
                                            var result29 = result39;
                                          } else {
                                            if (input.substr(pos, 1) === "s") {
                                              var result38 = "s";
                                              pos += 1;
                                            } else {
                                              var result38 = null;
                                              if (reportMatchFailures) {
                                                matchFailed("\"s\"");
                                              }
                                            }
                                            if (result38 !== null) {
                                              var result29 = result38;
                                            } else {
                                              var result29 = null;;
                                            };
                                          }
                                          if (result29 !== null) {
                                            var result30 = [];
                                            var result37 = parse_WS();
                                            while (result37 !== null) {
                                              result30.push(result37);
                                              var result37 = parse_WS();
                                            }
                                            if (result30 !== null) {
                                              var result31 = parse_Var();
                                              if (result31 !== null) {
                                                var result32 = [];
                                                var result36 = parse_WS();
                                                while (result36 !== null) {
                                                  result32.push(result36);
                                                  var result36 = parse_WS();
                                                }
                                                if (result32 !== null) {
                                                  if (input.substr(pos, 1) === ")") {
                                                    var result33 = ")";
                                                    pos += 1;
                                                  } else {
                                                    var result33 = null;
                                                    if (reportMatchFailures) {
                                                      matchFailed("\")\"");
                                                    }
                                                  }
                                                  if (result33 !== null) {
                                                    var result34 = [];
                                                    var result35 = parse_WS();
                                                    while (result35 !== null) {
                                                      result34.push(result35);
                                                      var result35 = parse_WS();
                                                    }
                                                    if (result34 !== null) {
                                                      var result22 = [result23, result24, result25, result26, result27, result28, result29, result30, result31, result32, result33, result34];
                                                    } else {
                                                      var result22 = null;
                                                      pos = savedPos3;
                                                    }
                                                  } else {
                                                    var result22 = null;
                                                    pos = savedPos3;
                                                  }
                                                } else {
                                                  var result22 = null;
                                                  pos = savedPos3;
                                                }
                                              } else {
                                                var result22 = null;
                                                pos = savedPos3;
                                              }
                                            } else {
                                              var result22 = null;
                                              pos = savedPos3;
                                            }
                                          } else {
                                            var result22 = null;
                                            pos = savedPos3;
                                          }
                                        } else {
                                          var result22 = null;
                                          pos = savedPos3;
                                        }
                                      } else {
                                        var result22 = null;
                                        pos = savedPos3;
                                      }
                                    } else {
                                      var result22 = null;
                                      pos = savedPos3;
                                    }
                                  } else {
                                    var result22 = null;
                                    pos = savedPos3;
                                  }
                                } else {
                                  var result22 = null;
                                  pos = savedPos3;
                                }
                              } else {
                                var result22 = null;
                                pos = savedPos3;
                              }
                              if (result22 !== null) {
                                var result21 = result22;
                              } else {
                                var result21 = null;;
                              };
                            }
                            if (result21 !== null) {
                              var result20 = [];
                              while (result21 !== null) {
                                result20.push(result21);
                                var savedPos4 = pos;
                                var result46 = [];
                                var result50 = parse_WS();
                                while (result50 !== null) {
                                  result46.push(result50);
                                  var result50 = parse_WS();
                                }
                                if (result46 !== null) {
                                  var result47 = parse_Var();
                                  if (result47 !== null) {
                                    var result48 = [];
                                    var result49 = parse_WS();
                                    while (result49 !== null) {
                                      result48.push(result49);
                                      var result49 = parse_WS();
                                    }
                                    if (result48 !== null) {
                                      var result45 = [result46, result47, result48];
                                    } else {
                                      var result45 = null;
                                      pos = savedPos4;
                                    }
                                  } else {
                                    var result45 = null;
                                    pos = savedPos4;
                                  }
                                } else {
                                  var result45 = null;
                                  pos = savedPos4;
                                }
                                if (result45 !== null) {
                                  var result21 = result45;
                                } else {
                                  var savedPos3 = pos;
                                  var result23 = [];
                                  var result44 = parse_WS();
                                  while (result44 !== null) {
                                    result23.push(result44);
                                    var result44 = parse_WS();
                                  }
                                  if (result23 !== null) {
                                    if (input.substr(pos, 1) === "(") {
                                      var result24 = "(";
                                      pos += 1;
                                    } else {
                                      var result24 = null;
                                      if (reportMatchFailures) {
                                        matchFailed("\"(\"");
                                      }
                                    }
                                    if (result24 !== null) {
                                      var result25 = [];
                                      var result43 = parse_WS();
                                      while (result43 !== null) {
                                        result25.push(result43);
                                        var result43 = parse_WS();
                                      }
                                      if (result25 !== null) {
                                        var result26 = parse_ConditionalOrExpression();
                                        if (result26 !== null) {
                                          var result27 = [];
                                          var result42 = parse_WS();
                                          while (result42 !== null) {
                                            result27.push(result42);
                                            var result42 = parse_WS();
                                          }
                                          if (result27 !== null) {
                                            if (input.substr(pos, 1) === "A") {
                                              var result41 = "A";
                                              pos += 1;
                                            } else {
                                              var result41 = null;
                                              if (reportMatchFailures) {
                                                matchFailed("\"A\"");
                                              }
                                            }
                                            if (result41 !== null) {
                                              var result28 = result41;
                                            } else {
                                              if (input.substr(pos, 1) === "a") {
                                                var result40 = "a";
                                                pos += 1;
                                              } else {
                                                var result40 = null;
                                                if (reportMatchFailures) {
                                                  matchFailed("\"a\"");
                                                }
                                              }
                                              if (result40 !== null) {
                                                var result28 = result40;
                                              } else {
                                                var result28 = null;;
                                              };
                                            }
                                            if (result28 !== null) {
                                              if (input.substr(pos, 1) === "S") {
                                                var result39 = "S";
                                                pos += 1;
                                              } else {
                                                var result39 = null;
                                                if (reportMatchFailures) {
                                                  matchFailed("\"S\"");
                                                }
                                              }
                                              if (result39 !== null) {
                                                var result29 = result39;
                                              } else {
                                                if (input.substr(pos, 1) === "s") {
                                                  var result38 = "s";
                                                  pos += 1;
                                                } else {
                                                  var result38 = null;
                                                  if (reportMatchFailures) {
                                                    matchFailed("\"s\"");
                                                  }
                                                }
                                                if (result38 !== null) {
                                                  var result29 = result38;
                                                } else {
                                                  var result29 = null;;
                                                };
                                              }
                                              if (result29 !== null) {
                                                var result30 = [];
                                                var result37 = parse_WS();
                                                while (result37 !== null) {
                                                  result30.push(result37);
                                                  var result37 = parse_WS();
                                                }
                                                if (result30 !== null) {
                                                  var result31 = parse_Var();
                                                  if (result31 !== null) {
                                                    var result32 = [];
                                                    var result36 = parse_WS();
                                                    while (result36 !== null) {
                                                      result32.push(result36);
                                                      var result36 = parse_WS();
                                                    }
                                                    if (result32 !== null) {
                                                      if (input.substr(pos, 1) === ")") {
                                                        var result33 = ")";
                                                        pos += 1;
                                                      } else {
                                                        var result33 = null;
                                                        if (reportMatchFailures) {
                                                          matchFailed("\")\"");
                                                        }
                                                      }
                                                      if (result33 !== null) {
                                                        var result34 = [];
                                                        var result35 = parse_WS();
                                                        while (result35 !== null) {
                                                          result34.push(result35);
                                                          var result35 = parse_WS();
                                                        }
                                                        if (result34 !== null) {
                                                          var result22 = [result23, result24, result25, result26, result27, result28, result29, result30, result31, result32, result33, result34];
                                                        } else {
                                                          var result22 = null;
                                                          pos = savedPos3;
                                                        }
                                                      } else {
                                                        var result22 = null;
                                                        pos = savedPos3;
                                                      }
                                                    } else {
                                                      var result22 = null;
                                                      pos = savedPos3;
                                                    }
                                                  } else {
                                                    var result22 = null;
                                                    pos = savedPos3;
                                                  }
                                                } else {
                                                  var result22 = null;
                                                  pos = savedPos3;
                                                }
                                              } else {
                                                var result22 = null;
                                                pos = savedPos3;
                                              }
                                            } else {
                                              var result22 = null;
                                              pos = savedPos3;
                                            }
                                          } else {
                                            var result22 = null;
                                            pos = savedPos3;
                                          }
                                        } else {
                                          var result22 = null;
                                          pos = savedPos3;
                                        }
                                      } else {
                                        var result22 = null;
                                        pos = savedPos3;
                                      }
                                    } else {
                                      var result22 = null;
                                      pos = savedPos3;
                                    }
                                  } else {
                                    var result22 = null;
                                    pos = savedPos3;
                                  }
                                  if (result22 !== null) {
                                    var result21 = result22;
                                  } else {
                                    var result21 = null;;
                                  };
                                }
                              }
                            } else {
                              var result20 = null;
                            }
                            if (result20 !== null) {
                              var result13 = result20;
                            } else {
                              var savedPos2 = pos;
                              var result15 = [];
                              var result19 = parse_WS();
                              while (result19 !== null) {
                                result15.push(result19);
                                var result19 = parse_WS();
                              }
                              if (result15 !== null) {
                                if (input.substr(pos, 1) === "*") {
                                  var result16 = "*";
                                  pos += 1;
                                } else {
                                  var result16 = null;
                                  if (reportMatchFailures) {
                                    matchFailed("\"*\"");
                                  }
                                }
                                if (result16 !== null) {
                                  var result17 = [];
                                  var result18 = parse_WS();
                                  while (result18 !== null) {
                                    result17.push(result18);
                                    var result18 = parse_WS();
                                  }
                                  if (result17 !== null) {
                                    var result14 = [result15, result16, result17];
                                  } else {
                                    var result14 = null;
                                    pos = savedPos2;
                                  }
                                } else {
                                  var result14 = null;
                                  pos = savedPos2;
                                }
                              } else {
                                var result14 = null;
                                pos = savedPos2;
                              }
                              if (result14 !== null) {
                                var result13 = result14;
                              } else {
                                var result13 = null;;
                              };
                            }
                            if (result13 !== null) {
                              var result1 = [result3, result4, result5, result6, result7, result8, result9, result10, result11, result12, result13];
                            } else {
                              var result1 = null;
                              pos = savedPos1;
                            }
                          } else {
                            var result1 = null;
                            pos = savedPos1;
                          }
                        } else {
                          var result1 = null;
                          pos = savedPos1;
                        }
                      } else {
                        var result1 = null;
                        pos = savedPos1;
                      }
                    } else {
                      var result1 = null;
                      pos = savedPos1;
                    }
                  } else {
                    var result1 = null;
                    pos = savedPos1;
                  }
                } else {
                  var result1 = null;
                  pos = savedPos1;
                }
              } else {
                var result1 = null;
                pos = savedPos1;
              }
            } else {
              var result1 = null;
              pos = savedPos1;
            }
          } else {
            var result1 = null;
            pos = savedPos1;
          }
        } else {
          var result1 = null;
          pos = savedPos1;
        }
        var result2 = result1 !== null
          ? (function(mod, proj) {
               var vars = [];
                if(proj.length === 3 && proj[1]==="*") {
                    return {vars: [{token: 'variable', kind:'*'}], modifier:arrayToString(mod)};
                }
          
                for(var i=0; i< proj.length; i++) {
                    var aVar = proj[i];
          
                    if(aVar.length === 3) {
                        vars.push({token: 'variable', kind:'var', value:aVar[1]});
                    } else {
                        vars.push({token: 'variable', kind:'aliased', expression: aVar[3], alias:aVar[8]})
                    }
                }
          
                return {vars: vars, modifier:arrayToString(mod)};
          })(result1[8], result1[10])
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        reportMatchFailures = savedReportMatchFailures;
        if (reportMatchFailures && result0 === null) {
          matchFailed("[8] SelectClause");
        }
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_ConstructQuery() {
        var cacheKey = 'ConstructQuery@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        var savedReportMatchFailures = reportMatchFailures;
        reportMatchFailures = false;
        var savedPos0 = pos;
        var savedPos1 = pos;
        var result3 = [];
        var result44 = parse_WS();
        while (result44 !== null) {
          result3.push(result44);
          var result44 = parse_WS();
        }
        if (result3 !== null) {
          if (input.substr(pos, 1) === "C") {
            var result43 = "C";
            pos += 1;
          } else {
            var result43 = null;
            if (reportMatchFailures) {
              matchFailed("\"C\"");
            }
          }
          if (result43 !== null) {
            var result4 = result43;
          } else {
            if (input.substr(pos, 1) === "c") {
              var result42 = "c";
              pos += 1;
            } else {
              var result42 = null;
              if (reportMatchFailures) {
                matchFailed("\"c\"");
              }
            }
            if (result42 !== null) {
              var result4 = result42;
            } else {
              var result4 = null;;
            };
          }
          if (result4 !== null) {
            if (input.substr(pos, 1) === "O") {
              var result41 = "O";
              pos += 1;
            } else {
              var result41 = null;
              if (reportMatchFailures) {
                matchFailed("\"O\"");
              }
            }
            if (result41 !== null) {
              var result5 = result41;
            } else {
              if (input.substr(pos, 1) === "o") {
                var result40 = "o";
                pos += 1;
              } else {
                var result40 = null;
                if (reportMatchFailures) {
                  matchFailed("\"o\"");
                }
              }
              if (result40 !== null) {
                var result5 = result40;
              } else {
                var result5 = null;;
              };
            }
            if (result5 !== null) {
              if (input.substr(pos, 1) === "N") {
                var result39 = "N";
                pos += 1;
              } else {
                var result39 = null;
                if (reportMatchFailures) {
                  matchFailed("\"N\"");
                }
              }
              if (result39 !== null) {
                var result6 = result39;
              } else {
                if (input.substr(pos, 1) === "n") {
                  var result38 = "n";
                  pos += 1;
                } else {
                  var result38 = null;
                  if (reportMatchFailures) {
                    matchFailed("\"n\"");
                  }
                }
                if (result38 !== null) {
                  var result6 = result38;
                } else {
                  var result6 = null;;
                };
              }
              if (result6 !== null) {
                if (input.substr(pos, 1) === "S") {
                  var result37 = "S";
                  pos += 1;
                } else {
                  var result37 = null;
                  if (reportMatchFailures) {
                    matchFailed("\"S\"");
                  }
                }
                if (result37 !== null) {
                  var result7 = result37;
                } else {
                  if (input.substr(pos, 1) === "s") {
                    var result36 = "s";
                    pos += 1;
                  } else {
                    var result36 = null;
                    if (reportMatchFailures) {
                      matchFailed("\"s\"");
                    }
                  }
                  if (result36 !== null) {
                    var result7 = result36;
                  } else {
                    var result7 = null;;
                  };
                }
                if (result7 !== null) {
                  if (input.substr(pos, 1) === "T") {
                    var result35 = "T";
                    pos += 1;
                  } else {
                    var result35 = null;
                    if (reportMatchFailures) {
                      matchFailed("\"T\"");
                    }
                  }
                  if (result35 !== null) {
                    var result8 = result35;
                  } else {
                    if (input.substr(pos, 1) === "t") {
                      var result34 = "t";
                      pos += 1;
                    } else {
                      var result34 = null;
                      if (reportMatchFailures) {
                        matchFailed("\"t\"");
                      }
                    }
                    if (result34 !== null) {
                      var result8 = result34;
                    } else {
                      var result8 = null;;
                    };
                  }
                  if (result8 !== null) {
                    if (input.substr(pos, 1) === "R") {
                      var result33 = "R";
                      pos += 1;
                    } else {
                      var result33 = null;
                      if (reportMatchFailures) {
                        matchFailed("\"R\"");
                      }
                    }
                    if (result33 !== null) {
                      var result9 = result33;
                    } else {
                      if (input.substr(pos, 1) === "r") {
                        var result32 = "r";
                        pos += 1;
                      } else {
                        var result32 = null;
                        if (reportMatchFailures) {
                          matchFailed("\"r\"");
                        }
                      }
                      if (result32 !== null) {
                        var result9 = result32;
                      } else {
                        var result9 = null;;
                      };
                    }
                    if (result9 !== null) {
                      if (input.substr(pos, 1) === "U") {
                        var result31 = "U";
                        pos += 1;
                      } else {
                        var result31 = null;
                        if (reportMatchFailures) {
                          matchFailed("\"U\"");
                        }
                      }
                      if (result31 !== null) {
                        var result10 = result31;
                      } else {
                        if (input.substr(pos, 1) === "u") {
                          var result30 = "u";
                          pos += 1;
                        } else {
                          var result30 = null;
                          if (reportMatchFailures) {
                            matchFailed("\"u\"");
                          }
                        }
                        if (result30 !== null) {
                          var result10 = result30;
                        } else {
                          var result10 = null;;
                        };
                      }
                      if (result10 !== null) {
                        if (input.substr(pos, 1) === "C") {
                          var result29 = "C";
                          pos += 1;
                        } else {
                          var result29 = null;
                          if (reportMatchFailures) {
                            matchFailed("\"C\"");
                          }
                        }
                        if (result29 !== null) {
                          var result11 = result29;
                        } else {
                          if (input.substr(pos, 1) === "c") {
                            var result28 = "c";
                            pos += 1;
                          } else {
                            var result28 = null;
                            if (reportMatchFailures) {
                              matchFailed("\"c\"");
                            }
                          }
                          if (result28 !== null) {
                            var result11 = result28;
                          } else {
                            var result11 = null;;
                          };
                        }
                        if (result11 !== null) {
                          if (input.substr(pos, 1) === "T") {
                            var result27 = "T";
                            pos += 1;
                          } else {
                            var result27 = null;
                            if (reportMatchFailures) {
                              matchFailed("\"T\"");
                            }
                          }
                          if (result27 !== null) {
                            var result12 = result27;
                          } else {
                            if (input.substr(pos, 1) === "t") {
                              var result26 = "t";
                              pos += 1;
                            } else {
                              var result26 = null;
                              if (reportMatchFailures) {
                                matchFailed("\"t\"");
                              }
                            }
                            if (result26 !== null) {
                              var result12 = result26;
                            } else {
                              var result12 = null;;
                            };
                          }
                          if (result12 !== null) {
                            var result13 = [];
                            var result25 = parse_WS();
                            while (result25 !== null) {
                              result13.push(result25);
                              var result25 = parse_WS();
                            }
                            if (result13 !== null) {
                              var result14 = parse_ConstructTemplate();
                              if (result14 !== null) {
                                var result15 = [];
                                var result24 = parse_WS();
                                while (result24 !== null) {
                                  result15.push(result24);
                                  var result24 = parse_WS();
                                }
                                if (result15 !== null) {
                                  var result16 = [];
                                  var result23 = parse_DatasetClause();
                                  while (result23 !== null) {
                                    result16.push(result23);
                                    var result23 = parse_DatasetClause();
                                  }
                                  if (result16 !== null) {
                                    var result17 = [];
                                    var result22 = parse_WS();
                                    while (result22 !== null) {
                                      result17.push(result22);
                                      var result22 = parse_WS();
                                    }
                                    if (result17 !== null) {
                                      var result18 = parse_WhereClause();
                                      if (result18 !== null) {
                                        var result19 = [];
                                        var result21 = parse_WS();
                                        while (result21 !== null) {
                                          result19.push(result21);
                                          var result21 = parse_WS();
                                        }
                                        if (result19 !== null) {
                                          var result20 = parse_SolutionModifier();
                                          if (result20 !== null) {
                                            var result1 = [result3, result4, result5, result6, result7, result8, result9, result10, result11, result12, result13, result14, result15, result16, result17, result18, result19, result20];
                                          } else {
                                            var result1 = null;
                                            pos = savedPos1;
                                          }
                                        } else {
                                          var result1 = null;
                                          pos = savedPos1;
                                        }
                                      } else {
                                        var result1 = null;
                                        pos = savedPos1;
                                      }
                                    } else {
                                      var result1 = null;
                                      pos = savedPos1;
                                    }
                                  } else {
                                    var result1 = null;
                                    pos = savedPos1;
                                  }
                                } else {
                                  var result1 = null;
                                  pos = savedPos1;
                                }
                              } else {
                                var result1 = null;
                                pos = savedPos1;
                              }
                            } else {
                              var result1 = null;
                              pos = savedPos1;
                            }
                          } else {
                            var result1 = null;
                            pos = savedPos1;
                          }
                        } else {
                          var result1 = null;
                          pos = savedPos1;
                        }
                      } else {
                        var result1 = null;
                        pos = savedPos1;
                      }
                    } else {
                      var result1 = null;
                      pos = savedPos1;
                    }
                  } else {
                    var result1 = null;
                    pos = savedPos1;
                  }
                } else {
                  var result1 = null;
                  pos = savedPos1;
                }
              } else {
                var result1 = null;
                pos = savedPos1;
              }
            } else {
              var result1 = null;
              pos = savedPos1;
            }
          } else {
            var result1 = null;
            pos = savedPos1;
          }
        } else {
          var result1 = null;
          pos = savedPos1;
        }
        var result2 = result1 !== null
          ? (function(t, gs, w, sm) {
                var dataset = {'named':[], 'default':[]};
                for(var i=0; i<gs.length; i++) {
                    var g = gs[i];
                    if(g.kind === 'default') {
                        dataset['default'].push(g.graph);
                    } else {
                        dataset['named'].push(g.graph)
                    }
                }
          
          
                if(dataset['named'].length === 0 && dataset['default'].length === 0) {
                    dataset['default'].push({token:'uri', 
                                             prefix:null, 
                                             suffix:null, 
                                             value:'https://github.com/antoniogarrote/rdfstore-js#default_graph'});
                }
          
                var query = {};
                query.kind = 'construct';
                query.token = 'executableunit'
                query.dataset = dataset;
                query.template = t;
                query.pattern = w
                
                if(sm!=null && sm.limit!=null) {
                    query.limit = sm.limit;
                }
                if(sm!=null && sm.offset!=null) {
                    query.offset = sm.offset;
                }
                if(sm!=null && (sm.order!=null && sm.order!="")) {
                    query.order = sm.order;
                }
                return query
          
          })(result1[11], result1[13], result1[15], result1[17])
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        reportMatchFailures = savedReportMatchFailures;
        if (reportMatchFailures && result0 === null) {
          matchFailed("[9] ConstructQuery");
        }
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_DescribeQuery() {
        var cacheKey = 'DescribeQuery@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        var savedReportMatchFailures = reportMatchFailures;
        reportMatchFailures = false;
        var savedPos0 = pos;
        if (input.substr(pos, 8) === "DESCRIBE") {
          var result1 = "DESCRIBE";
          pos += 8;
        } else {
          var result1 = null;
          if (reportMatchFailures) {
            matchFailed("\"DESCRIBE\"");
          }
        }
        if (result1 !== null) {
          var result10 = parse_VarOrIRIref();
          if (result10 !== null) {
            var result9 = [];
            while (result10 !== null) {
              result9.push(result10);
              var result10 = parse_VarOrIRIref();
            }
          } else {
            var result9 = null;
          }
          if (result9 !== null) {
            var result2 = result9;
          } else {
            if (input.substr(pos, 1) === "*") {
              var result8 = "*";
              pos += 1;
            } else {
              var result8 = null;
              if (reportMatchFailures) {
                matchFailed("\"*\"");
              }
            }
            if (result8 !== null) {
              var result2 = result8;
            } else {
              var result2 = null;;
            };
          }
          if (result2 !== null) {
            var result3 = [];
            var result7 = parse_DatasetClause();
            while (result7 !== null) {
              result3.push(result7);
              var result7 = parse_DatasetClause();
            }
            if (result3 !== null) {
              var result6 = parse_WhereClause();
              var result4 = result6 !== null ? result6 : '';
              if (result4 !== null) {
                var result5 = parse_SolutionModifier();
                if (result5 !== null) {
                  var result0 = [result1, result2, result3, result4, result5];
                } else {
                  var result0 = null;
                  pos = savedPos0;
                }
              } else {
                var result0 = null;
                pos = savedPos0;
              }
            } else {
              var result0 = null;
              pos = savedPos0;
            }
          } else {
            var result0 = null;
            pos = savedPos0;
          }
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        reportMatchFailures = savedReportMatchFailures;
        if (reportMatchFailures && result0 === null) {
          matchFailed("[10] DescribeQuery");
        }
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_AskQuery() {
        var cacheKey = 'AskQuery@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        var savedReportMatchFailures = reportMatchFailures;
        reportMatchFailures = false;
        var savedPos0 = pos;
        var savedPos1 = pos;
        var result3 = [];
        var result20 = parse_WS();
        while (result20 !== null) {
          result3.push(result20);
          var result20 = parse_WS();
        }
        if (result3 !== null) {
          if (input.substr(pos, 1) === "A") {
            var result19 = "A";
            pos += 1;
          } else {
            var result19 = null;
            if (reportMatchFailures) {
              matchFailed("\"A\"");
            }
          }
          if (result19 !== null) {
            var result4 = result19;
          } else {
            if (input.substr(pos, 1) === "a") {
              var result18 = "a";
              pos += 1;
            } else {
              var result18 = null;
              if (reportMatchFailures) {
                matchFailed("\"a\"");
              }
            }
            if (result18 !== null) {
              var result4 = result18;
            } else {
              var result4 = null;;
            };
          }
          if (result4 !== null) {
            if (input.substr(pos, 1) === "S") {
              var result17 = "S";
              pos += 1;
            } else {
              var result17 = null;
              if (reportMatchFailures) {
                matchFailed("\"S\"");
              }
            }
            if (result17 !== null) {
              var result5 = result17;
            } else {
              if (input.substr(pos, 1) === "s") {
                var result16 = "s";
                pos += 1;
              } else {
                var result16 = null;
                if (reportMatchFailures) {
                  matchFailed("\"s\"");
                }
              }
              if (result16 !== null) {
                var result5 = result16;
              } else {
                var result5 = null;;
              };
            }
            if (result5 !== null) {
              if (input.substr(pos, 1) === "K") {
                var result15 = "K";
                pos += 1;
              } else {
                var result15 = null;
                if (reportMatchFailures) {
                  matchFailed("\"K\"");
                }
              }
              if (result15 !== null) {
                var result6 = result15;
              } else {
                if (input.substr(pos, 1) === "k") {
                  var result14 = "k";
                  pos += 1;
                } else {
                  var result14 = null;
                  if (reportMatchFailures) {
                    matchFailed("\"k\"");
                  }
                }
                if (result14 !== null) {
                  var result6 = result14;
                } else {
                  var result6 = null;;
                };
              }
              if (result6 !== null) {
                var result7 = [];
                var result13 = parse_WS();
                while (result13 !== null) {
                  result7.push(result13);
                  var result13 = parse_WS();
                }
                if (result7 !== null) {
                  var result8 = [];
                  var result12 = parse_DatasetClause();
                  while (result12 !== null) {
                    result8.push(result12);
                    var result12 = parse_DatasetClause();
                  }
                  if (result8 !== null) {
                    var result9 = [];
                    var result11 = parse_WS();
                    while (result11 !== null) {
                      result9.push(result11);
                      var result11 = parse_WS();
                    }
                    if (result9 !== null) {
                      var result10 = parse_WhereClause();
                      if (result10 !== null) {
                        var result1 = [result3, result4, result5, result6, result7, result8, result9, result10];
                      } else {
                        var result1 = null;
                        pos = savedPos1;
                      }
                    } else {
                      var result1 = null;
                      pos = savedPos1;
                    }
                  } else {
                    var result1 = null;
                    pos = savedPos1;
                  }
                } else {
                  var result1 = null;
                  pos = savedPos1;
                }
              } else {
                var result1 = null;
                pos = savedPos1;
              }
            } else {
              var result1 = null;
              pos = savedPos1;
            }
          } else {
            var result1 = null;
            pos = savedPos1;
          }
        } else {
          var result1 = null;
          pos = savedPos1;
        }
        var result2 = result1 !== null
          ? (function(gs, w) {
                var dataset = {'named':[], 'default':[]};
                for(var i=0; i<gs.length; i++) {
                    var g = gs[i];
                    if(g.kind === 'default') {
                        dataset['default'].push(g.graph);
                    } else {
                        dataset['named'].push(g.graph)
                    }
                }
          
          
                if(dataset['named'].length === 0 && dataset['default'].length === 0) {
                    dataset['default'].push({token:'uri', 
                                             prefix:null, 
                                             suffix:null, 
                                             value:'https://github.com/antoniogarrote/rdfstore-js#default_graph'});
                }
          
                var query = {};
                query.kind = 'ask';
                query.token = 'executableunit'
                query.dataset = dataset;
                query.pattern = w
          
                return query
          })(result1[5], result1[7])
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        reportMatchFailures = savedReportMatchFailures;
        if (reportMatchFailures && result0 === null) {
          matchFailed("[11] AskQuery");
        }
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_DatasetClause() {
        var cacheKey = 'DatasetClause@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        var savedReportMatchFailures = reportMatchFailures;
        reportMatchFailures = false;
        var savedPos0 = pos;
        var savedPos1 = pos;
        if (input.substr(pos, 1) === "F") {
          var result21 = "F";
          pos += 1;
        } else {
          var result21 = null;
          if (reportMatchFailures) {
            matchFailed("\"F\"");
          }
        }
        if (result21 !== null) {
          var result3 = result21;
        } else {
          if (input.substr(pos, 1) === "f") {
            var result20 = "f";
            pos += 1;
          } else {
            var result20 = null;
            if (reportMatchFailures) {
              matchFailed("\"f\"");
            }
          }
          if (result20 !== null) {
            var result3 = result20;
          } else {
            var result3 = null;;
          };
        }
        if (result3 !== null) {
          if (input.substr(pos, 1) === "R") {
            var result19 = "R";
            pos += 1;
          } else {
            var result19 = null;
            if (reportMatchFailures) {
              matchFailed("\"R\"");
            }
          }
          if (result19 !== null) {
            var result4 = result19;
          } else {
            if (input.substr(pos, 1) === "r") {
              var result18 = "r";
              pos += 1;
            } else {
              var result18 = null;
              if (reportMatchFailures) {
                matchFailed("\"r\"");
              }
            }
            if (result18 !== null) {
              var result4 = result18;
            } else {
              var result4 = null;;
            };
          }
          if (result4 !== null) {
            if (input.substr(pos, 1) === "O") {
              var result17 = "O";
              pos += 1;
            } else {
              var result17 = null;
              if (reportMatchFailures) {
                matchFailed("\"O\"");
              }
            }
            if (result17 !== null) {
              var result5 = result17;
            } else {
              if (input.substr(pos, 1) === "o") {
                var result16 = "o";
                pos += 1;
              } else {
                var result16 = null;
                if (reportMatchFailures) {
                  matchFailed("\"o\"");
                }
              }
              if (result16 !== null) {
                var result5 = result16;
              } else {
                var result5 = null;;
              };
            }
            if (result5 !== null) {
              if (input.substr(pos, 1) === "M") {
                var result15 = "M";
                pos += 1;
              } else {
                var result15 = null;
                if (reportMatchFailures) {
                  matchFailed("\"M\"");
                }
              }
              if (result15 !== null) {
                var result6 = result15;
              } else {
                if (input.substr(pos, 1) === "m") {
                  var result14 = "m";
                  pos += 1;
                } else {
                  var result14 = null;
                  if (reportMatchFailures) {
                    matchFailed("\"m\"");
                  }
                }
                if (result14 !== null) {
                  var result6 = result14;
                } else {
                  var result6 = null;;
                };
              }
              if (result6 !== null) {
                var result7 = [];
                var result13 = parse_WS();
                while (result13 !== null) {
                  result7.push(result13);
                  var result13 = parse_WS();
                }
                if (result7 !== null) {
                  var result12 = parse_DefaultGraphClause();
                  if (result12 !== null) {
                    var result8 = result12;
                  } else {
                    var result11 = parse_NamedGraphClause();
                    if (result11 !== null) {
                      var result8 = result11;
                    } else {
                      var result8 = null;;
                    };
                  }
                  if (result8 !== null) {
                    var result9 = [];
                    var result10 = parse_WS();
                    while (result10 !== null) {
                      result9.push(result10);
                      var result10 = parse_WS();
                    }
                    if (result9 !== null) {
                      var result1 = [result3, result4, result5, result6, result7, result8, result9];
                    } else {
                      var result1 = null;
                      pos = savedPos1;
                    }
                  } else {
                    var result1 = null;
                    pos = savedPos1;
                  }
                } else {
                  var result1 = null;
                  pos = savedPos1;
                }
              } else {
                var result1 = null;
                pos = savedPos1;
              }
            } else {
              var result1 = null;
              pos = savedPos1;
            }
          } else {
            var result1 = null;
            pos = savedPos1;
          }
        } else {
          var result1 = null;
          pos = savedPos1;
        }
        var result2 = result1 !== null
          ? (function(gs) {
                return gs;
          })(result1[5])
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        reportMatchFailures = savedReportMatchFailures;
        if (reportMatchFailures && result0 === null) {
          matchFailed("[12] DatasetClause");
        }
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_DefaultGraphClause() {
        var cacheKey = 'DefaultGraphClause@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        var savedReportMatchFailures = reportMatchFailures;
        reportMatchFailures = false;
        var savedPos0 = pos;
        var savedPos1 = pos;
        var result3 = [];
        var result5 = parse_WS();
        while (result5 !== null) {
          result3.push(result5);
          var result5 = parse_WS();
        }
        if (result3 !== null) {
          var result4 = parse_IRIref();
          if (result4 !== null) {
            var result1 = [result3, result4];
          } else {
            var result1 = null;
            pos = savedPos1;
          }
        } else {
          var result1 = null;
          pos = savedPos1;
        }
        var result2 = result1 !== null
          ? (function(s) {
              return {graph:s , kind:'default', token:'graphClause'}
          })(result1[1])
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        reportMatchFailures = savedReportMatchFailures;
        if (reportMatchFailures && result0 === null) {
          matchFailed("[13] DefaultGraphClause");
        }
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_NamedGraphClause() {
        var cacheKey = 'NamedGraphClause@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        var savedReportMatchFailures = reportMatchFailures;
        reportMatchFailures = false;
        var savedPos0 = pos;
        var savedPos1 = pos;
        if (input.substr(pos, 1) === "N") {
          var result20 = "N";
          pos += 1;
        } else {
          var result20 = null;
          if (reportMatchFailures) {
            matchFailed("\"N\"");
          }
        }
        if (result20 !== null) {
          var result3 = result20;
        } else {
          if (input.substr(pos, 1) === "n") {
            var result19 = "n";
            pos += 1;
          } else {
            var result19 = null;
            if (reportMatchFailures) {
              matchFailed("\"n\"");
            }
          }
          if (result19 !== null) {
            var result3 = result19;
          } else {
            var result3 = null;;
          };
        }
        if (result3 !== null) {
          if (input.substr(pos, 1) === "A") {
            var result18 = "A";
            pos += 1;
          } else {
            var result18 = null;
            if (reportMatchFailures) {
              matchFailed("\"A\"");
            }
          }
          if (result18 !== null) {
            var result4 = result18;
          } else {
            if (input.substr(pos, 1) === "a") {
              var result17 = "a";
              pos += 1;
            } else {
              var result17 = null;
              if (reportMatchFailures) {
                matchFailed("\"a\"");
              }
            }
            if (result17 !== null) {
              var result4 = result17;
            } else {
              var result4 = null;;
            };
          }
          if (result4 !== null) {
            if (input.substr(pos, 1) === "M") {
              var result16 = "M";
              pos += 1;
            } else {
              var result16 = null;
              if (reportMatchFailures) {
                matchFailed("\"M\"");
              }
            }
            if (result16 !== null) {
              var result5 = result16;
            } else {
              if (input.substr(pos, 1) === "m") {
                var result15 = "m";
                pos += 1;
              } else {
                var result15 = null;
                if (reportMatchFailures) {
                  matchFailed("\"m\"");
                }
              }
              if (result15 !== null) {
                var result5 = result15;
              } else {
                var result5 = null;;
              };
            }
            if (result5 !== null) {
              if (input.substr(pos, 1) === "E") {
                var result14 = "E";
                pos += 1;
              } else {
                var result14 = null;
                if (reportMatchFailures) {
                  matchFailed("\"E\"");
                }
              }
              if (result14 !== null) {
                var result6 = result14;
              } else {
                if (input.substr(pos, 1) === "e") {
                  var result13 = "e";
                  pos += 1;
                } else {
                  var result13 = null;
                  if (reportMatchFailures) {
                    matchFailed("\"e\"");
                  }
                }
                if (result13 !== null) {
                  var result6 = result13;
                } else {
                  var result6 = null;;
                };
              }
              if (result6 !== null) {
                if (input.substr(pos, 1) === "D") {
                  var result12 = "D";
                  pos += 1;
                } else {
                  var result12 = null;
                  if (reportMatchFailures) {
                    matchFailed("\"D\"");
                  }
                }
                if (result12 !== null) {
                  var result7 = result12;
                } else {
                  if (input.substr(pos, 1) === "d") {
                    var result11 = "d";
                    pos += 1;
                  } else {
                    var result11 = null;
                    if (reportMatchFailures) {
                      matchFailed("\"d\"");
                    }
                  }
                  if (result11 !== null) {
                    var result7 = result11;
                  } else {
                    var result7 = null;;
                  };
                }
                if (result7 !== null) {
                  var result8 = [];
                  var result10 = parse_WS();
                  while (result10 !== null) {
                    result8.push(result10);
                    var result10 = parse_WS();
                  }
                  if (result8 !== null) {
                    var result9 = parse_IRIref();
                    if (result9 !== null) {
                      var result1 = [result3, result4, result5, result6, result7, result8, result9];
                    } else {
                      var result1 = null;
                      pos = savedPos1;
                    }
                  } else {
                    var result1 = null;
                    pos = savedPos1;
                  }
                } else {
                  var result1 = null;
                  pos = savedPos1;
                }
              } else {
                var result1 = null;
                pos = savedPos1;
              }
            } else {
              var result1 = null;
              pos = savedPos1;
            }
          } else {
            var result1 = null;
            pos = savedPos1;
          }
        } else {
          var result1 = null;
          pos = savedPos1;
        }
        var result2 = result1 !== null
          ? (function(s) {      
                return {graph:s, kind:'named', token:'graphCluase'};
          })(result1[6])
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        reportMatchFailures = savedReportMatchFailures;
        if (reportMatchFailures && result0 === null) {
          matchFailed("[14] NamedGraphClause");
        }
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_WhereClause() {
        var cacheKey = 'WhereClause@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        var savedReportMatchFailures = reportMatchFailures;
        reportMatchFailures = false;
        var savedPos0 = pos;
        var savedPos1 = pos;
        var savedPos2 = pos;
        if (input.substr(pos, 1) === "W") {
          var result24 = "W";
          pos += 1;
        } else {
          var result24 = null;
          if (reportMatchFailures) {
            matchFailed("\"W\"");
          }
        }
        if (result24 !== null) {
          var result10 = result24;
        } else {
          if (input.substr(pos, 1) === "w") {
            var result23 = "w";
            pos += 1;
          } else {
            var result23 = null;
            if (reportMatchFailures) {
              matchFailed("\"w\"");
            }
          }
          if (result23 !== null) {
            var result10 = result23;
          } else {
            var result10 = null;;
          };
        }
        if (result10 !== null) {
          if (input.substr(pos, 1) === "H") {
            var result22 = "H";
            pos += 1;
          } else {
            var result22 = null;
            if (reportMatchFailures) {
              matchFailed("\"H\"");
            }
          }
          if (result22 !== null) {
            var result11 = result22;
          } else {
            if (input.substr(pos, 1) === "h") {
              var result21 = "h";
              pos += 1;
            } else {
              var result21 = null;
              if (reportMatchFailures) {
                matchFailed("\"h\"");
              }
            }
            if (result21 !== null) {
              var result11 = result21;
            } else {
              var result11 = null;;
            };
          }
          if (result11 !== null) {
            if (input.substr(pos, 1) === "E") {
              var result20 = "E";
              pos += 1;
            } else {
              var result20 = null;
              if (reportMatchFailures) {
                matchFailed("\"E\"");
              }
            }
            if (result20 !== null) {
              var result12 = result20;
            } else {
              if (input.substr(pos, 1) === "e") {
                var result19 = "e";
                pos += 1;
              } else {
                var result19 = null;
                if (reportMatchFailures) {
                  matchFailed("\"e\"");
                }
              }
              if (result19 !== null) {
                var result12 = result19;
              } else {
                var result12 = null;;
              };
            }
            if (result12 !== null) {
              if (input.substr(pos, 1) === "R") {
                var result18 = "R";
                pos += 1;
              } else {
                var result18 = null;
                if (reportMatchFailures) {
                  matchFailed("\"R\"");
                }
              }
              if (result18 !== null) {
                var result13 = result18;
              } else {
                if (input.substr(pos, 1) === "r") {
                  var result17 = "r";
                  pos += 1;
                } else {
                  var result17 = null;
                  if (reportMatchFailures) {
                    matchFailed("\"r\"");
                  }
                }
                if (result17 !== null) {
                  var result13 = result17;
                } else {
                  var result13 = null;;
                };
              }
              if (result13 !== null) {
                if (input.substr(pos, 1) === "E") {
                  var result16 = "E";
                  pos += 1;
                } else {
                  var result16 = null;
                  if (reportMatchFailures) {
                    matchFailed("\"E\"");
                  }
                }
                if (result16 !== null) {
                  var result14 = result16;
                } else {
                  if (input.substr(pos, 1) === "e") {
                    var result15 = "e";
                    pos += 1;
                  } else {
                    var result15 = null;
                    if (reportMatchFailures) {
                      matchFailed("\"e\"");
                    }
                  }
                  if (result15 !== null) {
                    var result14 = result15;
                  } else {
                    var result14 = null;;
                  };
                }
                if (result14 !== null) {
                  var result9 = [result10, result11, result12, result13, result14];
                } else {
                  var result9 = null;
                  pos = savedPos2;
                }
              } else {
                var result9 = null;
                pos = savedPos2;
              }
            } else {
              var result9 = null;
              pos = savedPos2;
            }
          } else {
            var result9 = null;
            pos = savedPos2;
          }
        } else {
          var result9 = null;
          pos = savedPos2;
        }
        var result3 = result9 !== null ? result9 : '';
        if (result3 !== null) {
          var result4 = [];
          var result8 = parse_WS();
          while (result8 !== null) {
            result4.push(result8);
            var result8 = parse_WS();
          }
          if (result4 !== null) {
            var result5 = parse_GroupGraphPattern();
            if (result5 !== null) {
              var result6 = [];
              var result7 = parse_WS();
              while (result7 !== null) {
                result6.push(result7);
                var result7 = parse_WS();
              }
              if (result6 !== null) {
                var result1 = [result3, result4, result5, result6];
              } else {
                var result1 = null;
                pos = savedPos1;
              }
            } else {
              var result1 = null;
              pos = savedPos1;
            }
          } else {
            var result1 = null;
            pos = savedPos1;
          }
        } else {
          var result1 = null;
          pos = savedPos1;
        }
        var result2 = result1 !== null
          ? (function(g) {
                return g;
          })(result1[2])
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        reportMatchFailures = savedReportMatchFailures;
        if (reportMatchFailures && result0 === null) {
          matchFailed("[16] WhereClause");
        }
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_SolutionModifier() {
        var cacheKey = 'SolutionModifier@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        var savedReportMatchFailures = reportMatchFailures;
        reportMatchFailures = false;
        var savedPos0 = pos;
        var savedPos1 = pos;
        var result10 = parse_GroupClause();
        var result3 = result10 !== null ? result10 : '';
        if (result3 !== null) {
          var result9 = parse_HavingClause();
          var result4 = result9 !== null ? result9 : '';
          if (result4 !== null) {
            var result8 = parse_OrderClause();
            var result5 = result8 !== null ? result8 : '';
            if (result5 !== null) {
              var result7 = parse_LimitOffsetClauses();
              var result6 = result7 !== null ? result7 : '';
              if (result6 !== null) {
                var result1 = [result3, result4, result5, result6];
              } else {
                var result1 = null;
                pos = savedPos1;
              }
            } else {
              var result1 = null;
              pos = savedPos1;
            }
          } else {
            var result1 = null;
            pos = savedPos1;
          }
        } else {
          var result1 = null;
          pos = savedPos1;
        }
        var result2 = result1 !== null
          ? (function(gc, oc, lo) {
                var acum = {};
                if(lo != null) {
                    if(lo.limit != null) {
                        acum.limit = lo.limit;
                    } 
                    if(lo.offset != null) {
                        acum.offset = lo.offset;
                    }
                }
          
                if(gc != null) {
                    acum.group = gc;
                }
          
                acum.order = oc;
          
                return acum
          })(result1[0], result1[2], result1[3])
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        reportMatchFailures = savedReportMatchFailures;
        if (reportMatchFailures && result0 === null) {
          matchFailed("[17] SolutionModifier");
        }
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_GroupClause() {
        var cacheKey = 'GroupClause@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        var savedReportMatchFailures = reportMatchFailures;
        reportMatchFailures = false;
        var savedPos0 = pos;
        var savedPos1 = pos;
        if (input.substr(pos, 1) === "G") {
          var result29 = "G";
          pos += 1;
        } else {
          var result29 = null;
          if (reportMatchFailures) {
            matchFailed("\"G\"");
          }
        }
        if (result29 !== null) {
          var result3 = result29;
        } else {
          if (input.substr(pos, 1) === "g") {
            var result28 = "g";
            pos += 1;
          } else {
            var result28 = null;
            if (reportMatchFailures) {
              matchFailed("\"g\"");
            }
          }
          if (result28 !== null) {
            var result3 = result28;
          } else {
            var result3 = null;;
          };
        }
        if (result3 !== null) {
          if (input.substr(pos, 1) === "R") {
            var result27 = "R";
            pos += 1;
          } else {
            var result27 = null;
            if (reportMatchFailures) {
              matchFailed("\"R\"");
            }
          }
          if (result27 !== null) {
            var result4 = result27;
          } else {
            if (input.substr(pos, 1) === "r") {
              var result26 = "r";
              pos += 1;
            } else {
              var result26 = null;
              if (reportMatchFailures) {
                matchFailed("\"r\"");
              }
            }
            if (result26 !== null) {
              var result4 = result26;
            } else {
              var result4 = null;;
            };
          }
          if (result4 !== null) {
            if (input.substr(pos, 1) === "O") {
              var result25 = "O";
              pos += 1;
            } else {
              var result25 = null;
              if (reportMatchFailures) {
                matchFailed("\"O\"");
              }
            }
            if (result25 !== null) {
              var result5 = result25;
            } else {
              if (input.substr(pos, 1) === "o") {
                var result24 = "o";
                pos += 1;
              } else {
                var result24 = null;
                if (reportMatchFailures) {
                  matchFailed("\"o\"");
                }
              }
              if (result24 !== null) {
                var result5 = result24;
              } else {
                var result5 = null;;
              };
            }
            if (result5 !== null) {
              if (input.substr(pos, 1) === "U") {
                var result23 = "U";
                pos += 1;
              } else {
                var result23 = null;
                if (reportMatchFailures) {
                  matchFailed("\"U\"");
                }
              }
              if (result23 !== null) {
                var result6 = result23;
              } else {
                if (input.substr(pos, 1) === "u") {
                  var result22 = "u";
                  pos += 1;
                } else {
                  var result22 = null;
                  if (reportMatchFailures) {
                    matchFailed("\"u\"");
                  }
                }
                if (result22 !== null) {
                  var result6 = result22;
                } else {
                  var result6 = null;;
                };
              }
              if (result6 !== null) {
                if (input.substr(pos, 1) === "P") {
                  var result21 = "P";
                  pos += 1;
                } else {
                  var result21 = null;
                  if (reportMatchFailures) {
                    matchFailed("\"P\"");
                  }
                }
                if (result21 !== null) {
                  var result7 = result21;
                } else {
                  if (input.substr(pos, 1) === "p") {
                    var result20 = "p";
                    pos += 1;
                  } else {
                    var result20 = null;
                    if (reportMatchFailures) {
                      matchFailed("\"p\"");
                    }
                  }
                  if (result20 !== null) {
                    var result7 = result20;
                  } else {
                    var result7 = null;;
                  };
                }
                if (result7 !== null) {
                  var result8 = [];
                  var result19 = parse_WS();
                  while (result19 !== null) {
                    result8.push(result19);
                    var result19 = parse_WS();
                  }
                  if (result8 !== null) {
                    if (input.substr(pos, 1) === "B") {
                      var result18 = "B";
                      pos += 1;
                    } else {
                      var result18 = null;
                      if (reportMatchFailures) {
                        matchFailed("\"B\"");
                      }
                    }
                    if (result18 !== null) {
                      var result9 = result18;
                    } else {
                      if (input.substr(pos, 1) === "b") {
                        var result17 = "b";
                        pos += 1;
                      } else {
                        var result17 = null;
                        if (reportMatchFailures) {
                          matchFailed("\"b\"");
                        }
                      }
                      if (result17 !== null) {
                        var result9 = result17;
                      } else {
                        var result9 = null;;
                      };
                    }
                    if (result9 !== null) {
                      if (input.substr(pos, 1) === "Y") {
                        var result16 = "Y";
                        pos += 1;
                      } else {
                        var result16 = null;
                        if (reportMatchFailures) {
                          matchFailed("\"Y\"");
                        }
                      }
                      if (result16 !== null) {
                        var result10 = result16;
                      } else {
                        if (input.substr(pos, 1) === "y") {
                          var result15 = "y";
                          pos += 1;
                        } else {
                          var result15 = null;
                          if (reportMatchFailures) {
                            matchFailed("\"y\"");
                          }
                        }
                        if (result15 !== null) {
                          var result10 = result15;
                        } else {
                          var result10 = null;;
                        };
                      }
                      if (result10 !== null) {
                        var result11 = [];
                        var result14 = parse_WS();
                        while (result14 !== null) {
                          result11.push(result14);
                          var result14 = parse_WS();
                        }
                        if (result11 !== null) {
                          var result13 = parse_GroupCondition();
                          if (result13 !== null) {
                            var result12 = [];
                            while (result13 !== null) {
                              result12.push(result13);
                              var result13 = parse_GroupCondition();
                            }
                          } else {
                            var result12 = null;
                          }
                          if (result12 !== null) {
                            var result1 = [result3, result4, result5, result6, result7, result8, result9, result10, result11, result12];
                          } else {
                            var result1 = null;
                            pos = savedPos1;
                          }
                        } else {
                          var result1 = null;
                          pos = savedPos1;
                        }
                      } else {
                        var result1 = null;
                        pos = savedPos1;
                      }
                    } else {
                      var result1 = null;
                      pos = savedPos1;
                    }
                  } else {
                    var result1 = null;
                    pos = savedPos1;
                  }
                } else {
                  var result1 = null;
                  pos = savedPos1;
                }
              } else {
                var result1 = null;
                pos = savedPos1;
              }
            } else {
              var result1 = null;
              pos = savedPos1;
            }
          } else {
            var result1 = null;
            pos = savedPos1;
          }
        } else {
          var result1 = null;
          pos = savedPos1;
        }
        var result2 = result1 !== null
          ? (function(conds) {
                return conds;
          })(result1[9])
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        reportMatchFailures = savedReportMatchFailures;
        if (reportMatchFailures && result0 === null) {
          matchFailed("[18] GroupClause");
        }
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_GroupCondition() {
        var cacheKey = 'GroupCondition@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        var savedReportMatchFailures = reportMatchFailures;
        reportMatchFailures = false;
        var savedPos7 = pos;
        var savedPos8 = pos;
        var result47 = [];
        var result51 = parse_WS();
        while (result51 !== null) {
          result47.push(result51);
          var result51 = parse_WS();
        }
        if (result47 !== null) {
          var result48 = parse_BuiltInCall();
          if (result48 !== null) {
            var result49 = [];
            var result50 = parse_WS();
            while (result50 !== null) {
              result49.push(result50);
              var result50 = parse_WS();
            }
            if (result49 !== null) {
              var result45 = [result47, result48, result49];
            } else {
              var result45 = null;
              pos = savedPos8;
            }
          } else {
            var result45 = null;
            pos = savedPos8;
          }
        } else {
          var result45 = null;
          pos = savedPos8;
        }
        var result46 = result45 !== null
          ? (function(b) {
                return b;
          })(result45[1])
          : null;
        if (result46 !== null) {
          var result44 = result46;
        } else {
          var result44 = null;
          pos = savedPos7;
        }
        if (result44 !== null) {
          var result0 = result44;
        } else {
          var savedPos5 = pos;
          var savedPos6 = pos;
          var result39 = [];
          var result43 = parse_WS();
          while (result43 !== null) {
            result39.push(result43);
            var result43 = parse_WS();
          }
          if (result39 !== null) {
            var result40 = parse_FunctionCall();
            if (result40 !== null) {
              var result41 = [];
              var result42 = parse_WS();
              while (result42 !== null) {
                result41.push(result42);
                var result42 = parse_WS();
              }
              if (result41 !== null) {
                var result37 = [result39, result40, result41];
              } else {
                var result37 = null;
                pos = savedPos6;
              }
            } else {
              var result37 = null;
              pos = savedPos6;
            }
          } else {
            var result37 = null;
            pos = savedPos6;
          }
          var result38 = result37 !== null
            ? (function(f) {
                  return f;
            })(result37[1])
            : null;
          if (result38 !== null) {
            var result36 = result38;
          } else {
            var result36 = null;
            pos = savedPos5;
          }
          if (result36 !== null) {
            var result0 = result36;
          } else {
            var savedPos2 = pos;
            var savedPos3 = pos;
            var result12 = [];
            var result35 = parse_WS();
            while (result35 !== null) {
              result12.push(result35);
              var result35 = parse_WS();
            }
            if (result12 !== null) {
              if (input.substr(pos, 1) === "(") {
                var result13 = "(";
                pos += 1;
              } else {
                var result13 = null;
                if (reportMatchFailures) {
                  matchFailed("\"(\"");
                }
              }
              if (result13 !== null) {
                var result14 = [];
                var result34 = parse_WS();
                while (result34 !== null) {
                  result14.push(result34);
                  var result34 = parse_WS();
                }
                if (result14 !== null) {
                  var result15 = parse_ConditionalOrExpression();
                  if (result15 !== null) {
                    var result16 = [];
                    var result33 = parse_WS();
                    while (result33 !== null) {
                      result16.push(result33);
                      var result33 = parse_WS();
                    }
                    if (result16 !== null) {
                      var savedPos4 = pos;
                      if (input.substr(pos, 1) === "A") {
                        var result32 = "A";
                        pos += 1;
                      } else {
                        var result32 = null;
                        if (reportMatchFailures) {
                          matchFailed("\"A\"");
                        }
                      }
                      if (result32 !== null) {
                        var result24 = result32;
                      } else {
                        if (input.substr(pos, 1) === "a") {
                          var result31 = "a";
                          pos += 1;
                        } else {
                          var result31 = null;
                          if (reportMatchFailures) {
                            matchFailed("\"a\"");
                          }
                        }
                        if (result31 !== null) {
                          var result24 = result31;
                        } else {
                          var result24 = null;;
                        };
                      }
                      if (result24 !== null) {
                        if (input.substr(pos, 1) === "S") {
                          var result30 = "S";
                          pos += 1;
                        } else {
                          var result30 = null;
                          if (reportMatchFailures) {
                            matchFailed("\"S\"");
                          }
                        }
                        if (result30 !== null) {
                          var result25 = result30;
                        } else {
                          if (input.substr(pos, 1) === "s") {
                            var result29 = "s";
                            pos += 1;
                          } else {
                            var result29 = null;
                            if (reportMatchFailures) {
                              matchFailed("\"s\"");
                            }
                          }
                          if (result29 !== null) {
                            var result25 = result29;
                          } else {
                            var result25 = null;;
                          };
                        }
                        if (result25 !== null) {
                          var result26 = [];
                          var result28 = parse_WS();
                          while (result28 !== null) {
                            result26.push(result28);
                            var result28 = parse_WS();
                          }
                          if (result26 !== null) {
                            var result27 = parse_Var();
                            if (result27 !== null) {
                              var result23 = [result24, result25, result26, result27];
                            } else {
                              var result23 = null;
                              pos = savedPos4;
                            }
                          } else {
                            var result23 = null;
                            pos = savedPos4;
                          }
                        } else {
                          var result23 = null;
                          pos = savedPos4;
                        }
                      } else {
                        var result23 = null;
                        pos = savedPos4;
                      }
                      var result17 = result23 !== null ? result23 : '';
                      if (result17 !== null) {
                        var result18 = [];
                        var result22 = parse_WS();
                        while (result22 !== null) {
                          result18.push(result22);
                          var result22 = parse_WS();
                        }
                        if (result18 !== null) {
                          if (input.substr(pos, 1) === ")") {
                            var result19 = ")";
                            pos += 1;
                          } else {
                            var result19 = null;
                            if (reportMatchFailures) {
                              matchFailed("\")\"");
                            }
                          }
                          if (result19 !== null) {
                            var result20 = [];
                            var result21 = parse_WS();
                            while (result21 !== null) {
                              result20.push(result21);
                              var result21 = parse_WS();
                            }
                            if (result20 !== null) {
                              var result10 = [result12, result13, result14, result15, result16, result17, result18, result19, result20];
                            } else {
                              var result10 = null;
                              pos = savedPos3;
                            }
                          } else {
                            var result10 = null;
                            pos = savedPos3;
                          }
                        } else {
                          var result10 = null;
                          pos = savedPos3;
                        }
                      } else {
                        var result10 = null;
                        pos = savedPos3;
                      }
                    } else {
                      var result10 = null;
                      pos = savedPos3;
                    }
                  } else {
                    var result10 = null;
                    pos = savedPos3;
                  }
                } else {
                  var result10 = null;
                  pos = savedPos3;
                }
              } else {
                var result10 = null;
                pos = savedPos3;
              }
            } else {
              var result10 = null;
              pos = savedPos3;
            }
            var result11 = result10 !== null
              ? (function(e, alias) {
                    if(alias.length != 0) {
                        return {token: 'aliased_expression',
                                expression: e,
                                alias: alias[3] };
                    } else {
                        return e;
                    }
              })(result10[3], result10[5])
              : null;
            if (result11 !== null) {
              var result9 = result11;
            } else {
              var result9 = null;
              pos = savedPos2;
            }
            if (result9 !== null) {
              var result0 = result9;
            } else {
              var savedPos0 = pos;
              var savedPos1 = pos;
              var result4 = [];
              var result8 = parse_WS();
              while (result8 !== null) {
                result4.push(result8);
                var result8 = parse_WS();
              }
              if (result4 !== null) {
                var result5 = parse_Var();
                if (result5 !== null) {
                  var result6 = [];
                  var result7 = parse_WS();
                  while (result7 !== null) {
                    result6.push(result7);
                    var result7 = parse_WS();
                  }
                  if (result6 !== null) {
                    var result2 = [result4, result5, result6];
                  } else {
                    var result2 = null;
                    pos = savedPos1;
                  }
                } else {
                  var result2 = null;
                  pos = savedPos1;
                }
              } else {
                var result2 = null;
                pos = savedPos1;
              }
              var result3 = result2 !== null
                ? (function(v) {
                      return v;
                })(result2[1])
                : null;
              if (result3 !== null) {
                var result1 = result3;
              } else {
                var result1 = null;
                pos = savedPos0;
              }
              if (result1 !== null) {
                var result0 = result1;
              } else {
                var result0 = null;;
              };
            };
          };
        }
        reportMatchFailures = savedReportMatchFailures;
        if (reportMatchFailures && result0 === null) {
          matchFailed("[19] GroupCondition");
        }
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_HavingClause() {
        var cacheKey = 'HavingClause@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        var savedReportMatchFailures = reportMatchFailures;
        reportMatchFailures = false;
        var savedPos0 = pos;
        if (input.substr(pos, 6) === "HAVING") {
          var result1 = "HAVING";
          pos += 6;
        } else {
          var result1 = null;
          if (reportMatchFailures) {
            matchFailed("\"HAVING\"");
          }
        }
        if (result1 !== null) {
          var result3 = parse_Constraint();
          if (result3 !== null) {
            var result2 = [];
            while (result3 !== null) {
              result2.push(result3);
              var result3 = parse_Constraint();
            }
          } else {
            var result2 = null;
          }
          if (result2 !== null) {
            var result0 = [result1, result2];
          } else {
            var result0 = null;
            pos = savedPos0;
          }
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        reportMatchFailures = savedReportMatchFailures;
        if (reportMatchFailures && result0 === null) {
          matchFailed("[20] HavingClause");
        }
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_OrderClause() {
        var cacheKey = 'OrderClause@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        var savedReportMatchFailures = reportMatchFailures;
        reportMatchFailures = false;
        var savedPos0 = pos;
        var savedPos1 = pos;
        if (input.substr(pos, 1) === "O") {
          var result31 = "O";
          pos += 1;
        } else {
          var result31 = null;
          if (reportMatchFailures) {
            matchFailed("\"O\"");
          }
        }
        if (result31 !== null) {
          var result3 = result31;
        } else {
          if (input.substr(pos, 1) === "o") {
            var result30 = "o";
            pos += 1;
          } else {
            var result30 = null;
            if (reportMatchFailures) {
              matchFailed("\"o\"");
            }
          }
          if (result30 !== null) {
            var result3 = result30;
          } else {
            var result3 = null;;
          };
        }
        if (result3 !== null) {
          if (input.substr(pos, 1) === "R") {
            var result29 = "R";
            pos += 1;
          } else {
            var result29 = null;
            if (reportMatchFailures) {
              matchFailed("\"R\"");
            }
          }
          if (result29 !== null) {
            var result4 = result29;
          } else {
            if (input.substr(pos, 1) === "r") {
              var result28 = "r";
              pos += 1;
            } else {
              var result28 = null;
              if (reportMatchFailures) {
                matchFailed("\"r\"");
              }
            }
            if (result28 !== null) {
              var result4 = result28;
            } else {
              var result4 = null;;
            };
          }
          if (result4 !== null) {
            if (input.substr(pos, 1) === "D") {
              var result27 = "D";
              pos += 1;
            } else {
              var result27 = null;
              if (reportMatchFailures) {
                matchFailed("\"D\"");
              }
            }
            if (result27 !== null) {
              var result5 = result27;
            } else {
              if (input.substr(pos, 1) === "d") {
                var result26 = "d";
                pos += 1;
              } else {
                var result26 = null;
                if (reportMatchFailures) {
                  matchFailed("\"d\"");
                }
              }
              if (result26 !== null) {
                var result5 = result26;
              } else {
                var result5 = null;;
              };
            }
            if (result5 !== null) {
              if (input.substr(pos, 1) === "E") {
                var result25 = "E";
                pos += 1;
              } else {
                var result25 = null;
                if (reportMatchFailures) {
                  matchFailed("\"E\"");
                }
              }
              if (result25 !== null) {
                var result6 = result25;
              } else {
                if (input.substr(pos, 1) === "e") {
                  var result24 = "e";
                  pos += 1;
                } else {
                  var result24 = null;
                  if (reportMatchFailures) {
                    matchFailed("\"e\"");
                  }
                }
                if (result24 !== null) {
                  var result6 = result24;
                } else {
                  var result6 = null;;
                };
              }
              if (result6 !== null) {
                if (input.substr(pos, 1) === "R") {
                  var result23 = "R";
                  pos += 1;
                } else {
                  var result23 = null;
                  if (reportMatchFailures) {
                    matchFailed("\"R\"");
                  }
                }
                if (result23 !== null) {
                  var result7 = result23;
                } else {
                  if (input.substr(pos, 1) === "r") {
                    var result22 = "r";
                    pos += 1;
                  } else {
                    var result22 = null;
                    if (reportMatchFailures) {
                      matchFailed("\"r\"");
                    }
                  }
                  if (result22 !== null) {
                    var result7 = result22;
                  } else {
                    var result7 = null;;
                  };
                }
                if (result7 !== null) {
                  var result8 = [];
                  var result21 = parse_WS();
                  while (result21 !== null) {
                    result8.push(result21);
                    var result21 = parse_WS();
                  }
                  if (result8 !== null) {
                    if (input.substr(pos, 1) === "B") {
                      var result20 = "B";
                      pos += 1;
                    } else {
                      var result20 = null;
                      if (reportMatchFailures) {
                        matchFailed("\"B\"");
                      }
                    }
                    if (result20 !== null) {
                      var result9 = result20;
                    } else {
                      if (input.substr(pos, 1) === "b") {
                        var result19 = "b";
                        pos += 1;
                      } else {
                        var result19 = null;
                        if (reportMatchFailures) {
                          matchFailed("\"b\"");
                        }
                      }
                      if (result19 !== null) {
                        var result9 = result19;
                      } else {
                        var result9 = null;;
                      };
                    }
                    if (result9 !== null) {
                      if (input.substr(pos, 1) === "Y") {
                        var result18 = "Y";
                        pos += 1;
                      } else {
                        var result18 = null;
                        if (reportMatchFailures) {
                          matchFailed("\"Y\"");
                        }
                      }
                      if (result18 !== null) {
                        var result10 = result18;
                      } else {
                        if (input.substr(pos, 1) === "y") {
                          var result17 = "y";
                          pos += 1;
                        } else {
                          var result17 = null;
                          if (reportMatchFailures) {
                            matchFailed("\"y\"");
                          }
                        }
                        if (result17 !== null) {
                          var result10 = result17;
                        } else {
                          var result10 = null;;
                        };
                      }
                      if (result10 !== null) {
                        var result11 = [];
                        var result16 = parse_WS();
                        while (result16 !== null) {
                          result11.push(result16);
                          var result16 = parse_WS();
                        }
                        if (result11 !== null) {
                          var result15 = parse_OrderCondition();
                          if (result15 !== null) {
                            var result12 = [];
                            while (result15 !== null) {
                              result12.push(result15);
                              var result15 = parse_OrderCondition();
                            }
                          } else {
                            var result12 = null;
                          }
                          if (result12 !== null) {
                            var result13 = [];
                            var result14 = parse_WS();
                            while (result14 !== null) {
                              result13.push(result14);
                              var result14 = parse_WS();
                            }
                            if (result13 !== null) {
                              var result1 = [result3, result4, result5, result6, result7, result8, result9, result10, result11, result12, result13];
                            } else {
                              var result1 = null;
                              pos = savedPos1;
                            }
                          } else {
                            var result1 = null;
                            pos = savedPos1;
                          }
                        } else {
                          var result1 = null;
                          pos = savedPos1;
                        }
                      } else {
                        var result1 = null;
                        pos = savedPos1;
                      }
                    } else {
                      var result1 = null;
                      pos = savedPos1;
                    }
                  } else {
                    var result1 = null;
                    pos = savedPos1;
                  }
                } else {
                  var result1 = null;
                  pos = savedPos1;
                }
              } else {
                var result1 = null;
                pos = savedPos1;
              }
            } else {
              var result1 = null;
              pos = savedPos1;
            }
          } else {
            var result1 = null;
            pos = savedPos1;
          }
        } else {
          var result1 = null;
          pos = savedPos1;
        }
        var result2 = result1 !== null
          ? (function(os) {
                return os;
          })(result1[9])
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        reportMatchFailures = savedReportMatchFailures;
        if (reportMatchFailures && result0 === null) {
          matchFailed("[22] OrderClause");
        }
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_OrderCondition() {
        var cacheKey = 'OrderCondition@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        var savedReportMatchFailures = reportMatchFailures;
        reportMatchFailures = false;
        var savedPos2 = pos;
        var savedPos3 = pos;
        if (input.substr(pos, 3) === "ASC") {
          var result19 = "ASC";
          pos += 3;
        } else {
          var result19 = null;
          if (reportMatchFailures) {
            matchFailed("\"ASC\"");
          }
        }
        if (result19 !== null) {
          var result12 = result19;
        } else {
          if (input.substr(pos, 4) === "DESC") {
            var result18 = "DESC";
            pos += 4;
          } else {
            var result18 = null;
            if (reportMatchFailures) {
              matchFailed("\"DESC\"");
            }
          }
          if (result18 !== null) {
            var result12 = result18;
          } else {
            var result12 = null;;
          };
        }
        if (result12 !== null) {
          var result13 = [];
          var result17 = parse_WS();
          while (result17 !== null) {
            result13.push(result17);
            var result17 = parse_WS();
          }
          if (result13 !== null) {
            var result14 = parse_BrackettedExpression();
            if (result14 !== null) {
              var result15 = [];
              var result16 = parse_WS();
              while (result16 !== null) {
                result15.push(result16);
                var result16 = parse_WS();
              }
              if (result15 !== null) {
                var result10 = [result12, result13, result14, result15];
              } else {
                var result10 = null;
                pos = savedPos3;
              }
            } else {
              var result10 = null;
              pos = savedPos3;
            }
          } else {
            var result10 = null;
            pos = savedPos3;
          }
        } else {
          var result10 = null;
          pos = savedPos3;
        }
        var result11 = result10 !== null
          ? (function(direction, e) {
                return { direction: direction, expression:e };
          })(result10[0], result10[2])
          : null;
        if (result11 !== null) {
          var result9 = result11;
        } else {
          var result9 = null;
          pos = savedPos2;
        }
        if (result9 !== null) {
          var result0 = result9;
        } else {
          var savedPos0 = pos;
          var savedPos1 = pos;
          var result8 = parse_Constraint();
          if (result8 !== null) {
            var result4 = result8;
          } else {
            var result7 = parse_Var();
            if (result7 !== null) {
              var result4 = result7;
            } else {
              var result4 = null;;
            };
          }
          if (result4 !== null) {
            var result5 = [];
            var result6 = parse_WS();
            while (result6 !== null) {
              result5.push(result6);
              var result6 = parse_WS();
            }
            if (result5 !== null) {
              var result2 = [result4, result5];
            } else {
              var result2 = null;
              pos = savedPos1;
            }
          } else {
            var result2 = null;
            pos = savedPos1;
          }
          var result3 = result2 !== null
            ? (function(e) {
                if(e.token === 'var') {
                    e = { token:'expression', 
                          expressionType:'atomic',
                          primaryexpression: 'var',
                          value: e };
                }
                return { direction: 'ASC', expression:e };
            })(result2[0])
            : null;
          if (result3 !== null) {
            var result1 = result3;
          } else {
            var result1 = null;
            pos = savedPos0;
          }
          if (result1 !== null) {
            var result0 = result1;
          } else {
            var result0 = null;;
          };
        }
        reportMatchFailures = savedReportMatchFailures;
        if (reportMatchFailures && result0 === null) {
          matchFailed("[23] OrderCondition");
        }
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_LimitOffsetClauses() {
        var cacheKey = 'LimitOffsetClauses@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        var savedReportMatchFailures = reportMatchFailures;
        reportMatchFailures = false;
        var savedPos0 = pos;
        var savedPos2 = pos;
        var result8 = parse_LimitClause();
        if (result8 !== null) {
          var result10 = parse_OffsetClause();
          var result9 = result10 !== null ? result10 : '';
          if (result9 !== null) {
            var result7 = [result8, result9];
          } else {
            var result7 = null;
            pos = savedPos2;
          }
        } else {
          var result7 = null;
          pos = savedPos2;
        }
        if (result7 !== null) {
          var result1 = result7;
        } else {
          var savedPos1 = pos;
          var result4 = parse_OffsetClause();
          if (result4 !== null) {
            var result6 = parse_LimitClause();
            var result5 = result6 !== null ? result6 : '';
            if (result5 !== null) {
              var result3 = [result4, result5];
            } else {
              var result3 = null;
              pos = savedPos1;
            }
          } else {
            var result3 = null;
            pos = savedPos1;
          }
          if (result3 !== null) {
            var result1 = result3;
          } else {
            var result1 = null;;
          };
        }
        var result2 = result1 !== null
          ? (function(cls) {
                var acum = {};
                for(var i=0; i<cls.length; i++) {
                    var cl = cls[i];
                    if(cl.limit != null) {
                        acum['limit'] = cl.limit;
                    } else if(cl.offset != null){
                        acum['offset'] = cl.offset;
                    }
                }
          
                return acum;
          })(result1)
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        reportMatchFailures = savedReportMatchFailures;
        if (reportMatchFailures && result0 === null) {
          matchFailed("[24] LimitOffsetClauses");
        }
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_LimitClause() {
        var cacheKey = 'LimitClause@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        var savedReportMatchFailures = reportMatchFailures;
        reportMatchFailures = false;
        var savedPos0 = pos;
        var savedPos1 = pos;
        if (input.substr(pos, 1) === "L") {
          var result22 = "L";
          pos += 1;
        } else {
          var result22 = null;
          if (reportMatchFailures) {
            matchFailed("\"L\"");
          }
        }
        if (result22 !== null) {
          var result3 = result22;
        } else {
          if (input.substr(pos, 1) === "l") {
            var result21 = "l";
            pos += 1;
          } else {
            var result21 = null;
            if (reportMatchFailures) {
              matchFailed("\"l\"");
            }
          }
          if (result21 !== null) {
            var result3 = result21;
          } else {
            var result3 = null;;
          };
        }
        if (result3 !== null) {
          if (input.substr(pos, 1) === "I") {
            var result20 = "I";
            pos += 1;
          } else {
            var result20 = null;
            if (reportMatchFailures) {
              matchFailed("\"I\"");
            }
          }
          if (result20 !== null) {
            var result4 = result20;
          } else {
            if (input.substr(pos, 1) === "i") {
              var result19 = "i";
              pos += 1;
            } else {
              var result19 = null;
              if (reportMatchFailures) {
                matchFailed("\"i\"");
              }
            }
            if (result19 !== null) {
              var result4 = result19;
            } else {
              var result4 = null;;
            };
          }
          if (result4 !== null) {
            if (input.substr(pos, 1) === "M") {
              var result18 = "M";
              pos += 1;
            } else {
              var result18 = null;
              if (reportMatchFailures) {
                matchFailed("\"M\"");
              }
            }
            if (result18 !== null) {
              var result5 = result18;
            } else {
              if (input.substr(pos, 1) === "m") {
                var result17 = "m";
                pos += 1;
              } else {
                var result17 = null;
                if (reportMatchFailures) {
                  matchFailed("\"m\"");
                }
              }
              if (result17 !== null) {
                var result5 = result17;
              } else {
                var result5 = null;;
              };
            }
            if (result5 !== null) {
              if (input.substr(pos, 1) === "I") {
                var result16 = "I";
                pos += 1;
              } else {
                var result16 = null;
                if (reportMatchFailures) {
                  matchFailed("\"I\"");
                }
              }
              if (result16 !== null) {
                var result6 = result16;
              } else {
                if (input.substr(pos, 1) === "i") {
                  var result15 = "i";
                  pos += 1;
                } else {
                  var result15 = null;
                  if (reportMatchFailures) {
                    matchFailed("\"i\"");
                  }
                }
                if (result15 !== null) {
                  var result6 = result15;
                } else {
                  var result6 = null;;
                };
              }
              if (result6 !== null) {
                if (input.substr(pos, 1) === "T") {
                  var result14 = "T";
                  pos += 1;
                } else {
                  var result14 = null;
                  if (reportMatchFailures) {
                    matchFailed("\"T\"");
                  }
                }
                if (result14 !== null) {
                  var result7 = result14;
                } else {
                  if (input.substr(pos, 1) === "t") {
                    var result13 = "t";
                    pos += 1;
                  } else {
                    var result13 = null;
                    if (reportMatchFailures) {
                      matchFailed("\"t\"");
                    }
                  }
                  if (result13 !== null) {
                    var result7 = result13;
                  } else {
                    var result7 = null;;
                  };
                }
                if (result7 !== null) {
                  var result8 = [];
                  var result12 = parse_WS();
                  while (result12 !== null) {
                    result8.push(result12);
                    var result12 = parse_WS();
                  }
                  if (result8 !== null) {
                    var result9 = parse_INTEGER();
                    if (result9 !== null) {
                      var result10 = [];
                      var result11 = parse_WS();
                      while (result11 !== null) {
                        result10.push(result11);
                        var result11 = parse_WS();
                      }
                      if (result10 !== null) {
                        var result1 = [result3, result4, result5, result6, result7, result8, result9, result10];
                      } else {
                        var result1 = null;
                        pos = savedPos1;
                      }
                    } else {
                      var result1 = null;
                      pos = savedPos1;
                    }
                  } else {
                    var result1 = null;
                    pos = savedPos1;
                  }
                } else {
                  var result1 = null;
                  pos = savedPos1;
                }
              } else {
                var result1 = null;
                pos = savedPos1;
              }
            } else {
              var result1 = null;
              pos = savedPos1;
            }
          } else {
            var result1 = null;
            pos = savedPos1;
          }
        } else {
          var result1 = null;
          pos = savedPos1;
        }
        var result2 = result1 !== null
          ? (function(i) {
            return { limit:parseInt(i.value) };
          })(result1[6])
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        reportMatchFailures = savedReportMatchFailures;
        if (reportMatchFailures && result0 === null) {
          matchFailed("[25] LimitClause");
        }
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_OffsetClause() {
        var cacheKey = 'OffsetClause@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        var savedReportMatchFailures = reportMatchFailures;
        reportMatchFailures = false;
        var savedPos0 = pos;
        var savedPos1 = pos;
        if (input.substr(pos, 1) === "O") {
          var result25 = "O";
          pos += 1;
        } else {
          var result25 = null;
          if (reportMatchFailures) {
            matchFailed("\"O\"");
          }
        }
        if (result25 !== null) {
          var result3 = result25;
        } else {
          if (input.substr(pos, 1) === "o") {
            var result24 = "o";
            pos += 1;
          } else {
            var result24 = null;
            if (reportMatchFailures) {
              matchFailed("\"o\"");
            }
          }
          if (result24 !== null) {
            var result3 = result24;
          } else {
            var result3 = null;;
          };
        }
        if (result3 !== null) {
          if (input.substr(pos, 1) === "F") {
            var result23 = "F";
            pos += 1;
          } else {
            var result23 = null;
            if (reportMatchFailures) {
              matchFailed("\"F\"");
            }
          }
          if (result23 !== null) {
            var result4 = result23;
          } else {
            if (input.substr(pos, 1) === "f") {
              var result22 = "f";
              pos += 1;
            } else {
              var result22 = null;
              if (reportMatchFailures) {
                matchFailed("\"f\"");
              }
            }
            if (result22 !== null) {
              var result4 = result22;
            } else {
              var result4 = null;;
            };
          }
          if (result4 !== null) {
            if (input.substr(pos, 1) === "F") {
              var result21 = "F";
              pos += 1;
            } else {
              var result21 = null;
              if (reportMatchFailures) {
                matchFailed("\"F\"");
              }
            }
            if (result21 !== null) {
              var result5 = result21;
            } else {
              if (input.substr(pos, 1) === "f") {
                var result20 = "f";
                pos += 1;
              } else {
                var result20 = null;
                if (reportMatchFailures) {
                  matchFailed("\"f\"");
                }
              }
              if (result20 !== null) {
                var result5 = result20;
              } else {
                var result5 = null;;
              };
            }
            if (result5 !== null) {
              if (input.substr(pos, 1) === "S") {
                var result19 = "S";
                pos += 1;
              } else {
                var result19 = null;
                if (reportMatchFailures) {
                  matchFailed("\"S\"");
                }
              }
              if (result19 !== null) {
                var result6 = result19;
              } else {
                if (input.substr(pos, 1) === "s") {
                  var result18 = "s";
                  pos += 1;
                } else {
                  var result18 = null;
                  if (reportMatchFailures) {
                    matchFailed("\"s\"");
                  }
                }
                if (result18 !== null) {
                  var result6 = result18;
                } else {
                  var result6 = null;;
                };
              }
              if (result6 !== null) {
                if (input.substr(pos, 1) === "E") {
                  var result17 = "E";
                  pos += 1;
                } else {
                  var result17 = null;
                  if (reportMatchFailures) {
                    matchFailed("\"E\"");
                  }
                }
                if (result17 !== null) {
                  var result7 = result17;
                } else {
                  if (input.substr(pos, 1) === "e") {
                    var result16 = "e";
                    pos += 1;
                  } else {
                    var result16 = null;
                    if (reportMatchFailures) {
                      matchFailed("\"e\"");
                    }
                  }
                  if (result16 !== null) {
                    var result7 = result16;
                  } else {
                    var result7 = null;;
                  };
                }
                if (result7 !== null) {
                  if (input.substr(pos, 1) === "T") {
                    var result15 = "T";
                    pos += 1;
                  } else {
                    var result15 = null;
                    if (reportMatchFailures) {
                      matchFailed("\"T\"");
                    }
                  }
                  if (result15 !== null) {
                    var result8 = result15;
                  } else {
                    if (input.substr(pos, 1) === "t") {
                      var result14 = "t";
                      pos += 1;
                    } else {
                      var result14 = null;
                      if (reportMatchFailures) {
                        matchFailed("\"t\"");
                      }
                    }
                    if (result14 !== null) {
                      var result8 = result14;
                    } else {
                      var result8 = null;;
                    };
                  }
                  if (result8 !== null) {
                    var result9 = [];
                    var result13 = parse_WS();
                    while (result13 !== null) {
                      result9.push(result13);
                      var result13 = parse_WS();
                    }
                    if (result9 !== null) {
                      var result10 = parse_INTEGER();
                      if (result10 !== null) {
                        var result11 = [];
                        var result12 = parse_WS();
                        while (result12 !== null) {
                          result11.push(result12);
                          var result12 = parse_WS();
                        }
                        if (result11 !== null) {
                          var result1 = [result3, result4, result5, result6, result7, result8, result9, result10, result11];
                        } else {
                          var result1 = null;
                          pos = savedPos1;
                        }
                      } else {
                        var result1 = null;
                        pos = savedPos1;
                      }
                    } else {
                      var result1 = null;
                      pos = savedPos1;
                    }
                  } else {
                    var result1 = null;
                    pos = savedPos1;
                  }
                } else {
                  var result1 = null;
                  pos = savedPos1;
                }
              } else {
                var result1 = null;
                pos = savedPos1;
              }
            } else {
              var result1 = null;
              pos = savedPos1;
            }
          } else {
            var result1 = null;
            pos = savedPos1;
          }
        } else {
          var result1 = null;
          pos = savedPos1;
        }
        var result2 = result1 !== null
          ? (function(i) {
            return { offset:parseInt(i.value) };
          })(result1[7])
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        reportMatchFailures = savedReportMatchFailures;
        if (reportMatchFailures && result0 === null) {
          matchFailed("[26] OffsetClause");
        }
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_BindingsClause() {
        var cacheKey = 'BindingsClause@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        var savedReportMatchFailures = reportMatchFailures;
        reportMatchFailures = false;
        var savedPos0 = pos;
        if (input.substr(pos, 8) === "BINDINGS") {
          var result2 = "BINDINGS";
          pos += 8;
        } else {
          var result2 = null;
          if (reportMatchFailures) {
            matchFailed("\"BINDINGS\"");
          }
        }
        if (result2 !== null) {
          var result3 = [];
          var result14 = parse_Var();
          while (result14 !== null) {
            result3.push(result14);
            var result14 = parse_Var();
          }
          if (result3 !== null) {
            if (input.substr(pos, 1) === "{") {
              var result4 = "{";
              pos += 1;
            } else {
              var result4 = null;
              if (reportMatchFailures) {
                matchFailed("\"{\"");
              }
            }
            if (result4 !== null) {
              var result5 = [];
              var savedPos1 = pos;
              if (input.substr(pos, 1) === "(") {
                var result10 = "(";
                pos += 1;
              } else {
                var result10 = null;
                if (reportMatchFailures) {
                  matchFailed("\"(\"");
                }
              }
              if (result10 !== null) {
                var result13 = parse_BindingValue();
                if (result13 !== null) {
                  var result11 = [];
                  while (result13 !== null) {
                    result11.push(result13);
                    var result13 = parse_BindingValue();
                  }
                } else {
                  var result11 = null;
                }
                if (result11 !== null) {
                  if (input.substr(pos, 1) === ")") {
                    var result12 = ")";
                    pos += 1;
                  } else {
                    var result12 = null;
                    if (reportMatchFailures) {
                      matchFailed("\")\"");
                    }
                  }
                  if (result12 !== null) {
                    var result9 = [result10, result11, result12];
                  } else {
                    var result9 = null;
                    pos = savedPos1;
                  }
                } else {
                  var result9 = null;
                  pos = savedPos1;
                }
              } else {
                var result9 = null;
                pos = savedPos1;
              }
              if (result9 !== null) {
                var result7 = result9;
              } else {
                var result8 = parse_NIL();
                if (result8 !== null) {
                  var result7 = result8;
                } else {
                  var result7 = null;;
                };
              }
              while (result7 !== null) {
                result5.push(result7);
                var savedPos1 = pos;
                if (input.substr(pos, 1) === "(") {
                  var result10 = "(";
                  pos += 1;
                } else {
                  var result10 = null;
                  if (reportMatchFailures) {
                    matchFailed("\"(\"");
                  }
                }
                if (result10 !== null) {
                  var result13 = parse_BindingValue();
                  if (result13 !== null) {
                    var result11 = [];
                    while (result13 !== null) {
                      result11.push(result13);
                      var result13 = parse_BindingValue();
                    }
                  } else {
                    var result11 = null;
                  }
                  if (result11 !== null) {
                    if (input.substr(pos, 1) === ")") {
                      var result12 = ")";
                      pos += 1;
                    } else {
                      var result12 = null;
                      if (reportMatchFailures) {
                        matchFailed("\")\"");
                      }
                    }
                    if (result12 !== null) {
                      var result9 = [result10, result11, result12];
                    } else {
                      var result9 = null;
                      pos = savedPos1;
                    }
                  } else {
                    var result9 = null;
                    pos = savedPos1;
                  }
                } else {
                  var result9 = null;
                  pos = savedPos1;
                }
                if (result9 !== null) {
                  var result7 = result9;
                } else {
                  var result8 = parse_NIL();
                  if (result8 !== null) {
                    var result7 = result8;
                  } else {
                    var result7 = null;;
                  };
                }
              }
              if (result5 !== null) {
                if (input.substr(pos, 1) === "}") {
                  var result6 = "}";
                  pos += 1;
                } else {
                  var result6 = null;
                  if (reportMatchFailures) {
                    matchFailed("\"}\"");
                  }
                }
                if (result6 !== null) {
                  var result1 = [result2, result3, result4, result5, result6];
                } else {
                  var result1 = null;
                  pos = savedPos0;
                }
              } else {
                var result1 = null;
                pos = savedPos0;
              }
            } else {
              var result1 = null;
              pos = savedPos0;
            }
          } else {
            var result1 = null;
            pos = savedPos0;
          }
        } else {
          var result1 = null;
          pos = savedPos0;
        }
        var result0 = result1 !== null ? result1 : '';
        reportMatchFailures = savedReportMatchFailures;
        if (reportMatchFailures && result0 === null) {
          matchFailed("[27] BindingsClause");
        }
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_BindingValue() {
        var cacheKey = 'BindingValue@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        var savedReportMatchFailures = reportMatchFailures;
        reportMatchFailures = false;
        var result5 = parse_IRIref();
        if (result5 !== null) {
          var result0 = result5;
        } else {
          var result4 = parse_RDFLiteral();
          if (result4 !== null) {
            var result0 = result4;
          } else {
            var result3 = parse_NumericLiteral();
            if (result3 !== null) {
              var result0 = result3;
            } else {
              var result2 = parse_BooleanLiteral();
              if (result2 !== null) {
                var result0 = result2;
              } else {
                if (input.substr(pos, 5) === "UNDEF") {
                  var result1 = "UNDEF";
                  pos += 5;
                } else {
                  var result1 = null;
                  if (reportMatchFailures) {
                    matchFailed("\"UNDEF\"");
                  }
                }
                if (result1 !== null) {
                  var result0 = result1;
                } else {
                  var result0 = null;;
                };
              };
            };
          };
        }
        reportMatchFailures = savedReportMatchFailures;
        if (reportMatchFailures && result0 === null) {
          matchFailed("[28] BindingValue");
        }
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_Update() {
        var cacheKey = 'Update@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        var savedReportMatchFailures = reportMatchFailures;
        reportMatchFailures = false;
        var savedPos0 = pos;
        var savedPos1 = pos;
        var result3 = parse_Prologue();
        if (result3 !== null) {
          var result4 = [];
          var result15 = parse_WS();
          while (result15 !== null) {
            result4.push(result15);
            var result15 = parse_WS();
          }
          if (result4 !== null) {
            var result5 = parse_Update1();
            if (result5 !== null) {
              var savedPos2 = pos;
              var result8 = [];
              var result14 = parse_WS();
              while (result14 !== null) {
                result8.push(result14);
                var result14 = parse_WS();
              }
              if (result8 !== null) {
                if (input.substr(pos, 1) === ";") {
                  var result9 = ";";
                  pos += 1;
                } else {
                  var result9 = null;
                  if (reportMatchFailures) {
                    matchFailed("\";\"");
                  }
                }
                if (result9 !== null) {
                  var result10 = [];
                  var result13 = parse_WS();
                  while (result13 !== null) {
                    result10.push(result13);
                    var result13 = parse_WS();
                  }
                  if (result10 !== null) {
                    var result12 = parse_Update();
                    var result11 = result12 !== null ? result12 : '';
                    if (result11 !== null) {
                      var result7 = [result8, result9, result10, result11];
                    } else {
                      var result7 = null;
                      pos = savedPos2;
                    }
                  } else {
                    var result7 = null;
                    pos = savedPos2;
                  }
                } else {
                  var result7 = null;
                  pos = savedPos2;
                }
              } else {
                var result7 = null;
                pos = savedPos2;
              }
              var result6 = result7 !== null ? result7 : '';
              if (result6 !== null) {
                var result1 = [result3, result4, result5, result6];
              } else {
                var result1 = null;
                pos = savedPos1;
              }
            } else {
              var result1 = null;
              pos = savedPos1;
            }
          } else {
            var result1 = null;
            pos = savedPos1;
          }
        } else {
          var result1 = null;
          pos = savedPos1;
        }
        var result2 = result1 !== null
          ? (function(p, u, us) {
          
                var query = {};
                query.token = 'query';
                query.kind = 'update'
                query.prologue = p;
          
               var units = [u];
          
               if(us.length != null && us[3] != null && us[3].units != null) {
                   units = units.concat(us[3].units);
               }
          
               query.units = units;
               return query;
          })(result1[0], result1[2], result1[3])
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        reportMatchFailures = savedReportMatchFailures;
        if (reportMatchFailures && result0 === null) {
          matchFailed("[30] Update");
        }
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_Update1() {
        var cacheKey = 'Update1@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        var savedReportMatchFailures = reportMatchFailures;
        reportMatchFailures = false;
        var result8 = parse_Load();
        if (result8 !== null) {
          var result0 = result8;
        } else {
          var result7 = parse_Clear();
          if (result7 !== null) {
            var result0 = result7;
          } else {
            var result6 = parse_Drop();
            if (result6 !== null) {
              var result0 = result6;
            } else {
              var result5 = parse_Create();
              if (result5 !== null) {
                var result0 = result5;
              } else {
                var result4 = parse_InsertData();
                if (result4 !== null) {
                  var result0 = result4;
                } else {
                  var result3 = parse_DeleteData();
                  if (result3 !== null) {
                    var result0 = result3;
                  } else {
                    var result2 = parse_DeleteWhere();
                    if (result2 !== null) {
                      var result0 = result2;
                    } else {
                      var result1 = parse_Modify();
                      if (result1 !== null) {
                        var result0 = result1;
                      } else {
                        var result0 = null;;
                      };
                    };
                  };
                };
              };
            };
          };
        }
        reportMatchFailures = savedReportMatchFailures;
        if (reportMatchFailures && result0 === null) {
          matchFailed("[31] Update1");
        }
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_Load() {
        var cacheKey = 'Load@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        var savedReportMatchFailures = reportMatchFailures;
        reportMatchFailures = false;
        var savedPos0 = pos;
        var savedPos1 = pos;
        if (input.substr(pos, 1) === "L") {
          var result36 = "L";
          pos += 1;
        } else {
          var result36 = null;
          if (reportMatchFailures) {
            matchFailed("\"L\"");
          }
        }
        if (result36 !== null) {
          var result3 = result36;
        } else {
          if (input.substr(pos, 1) === "l") {
            var result35 = "l";
            pos += 1;
          } else {
            var result35 = null;
            if (reportMatchFailures) {
              matchFailed("\"l\"");
            }
          }
          if (result35 !== null) {
            var result3 = result35;
          } else {
            var result3 = null;;
          };
        }
