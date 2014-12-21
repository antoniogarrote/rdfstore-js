
/**
 * Temporal implementation of the lexicon
 */


Lexicon = function(callback){
    this.uriToOID = {};
    this.OIDToUri = {};

    this.literalToOID = {};
    this.OIDToLiteral = {};

    this.OIDToBlank = {};

    this.defaultGraphOid = 0;
    this.defaultGraphUri = "https://github.com/antoniogarrote/rdfstore-js#default_graph";

    this.oidCounter = 1;

    this.knownGraphs = {};

    if(callback != null) {
        callback(this);
    }
};

/**
 * Registers a new graph in the lexicon list of known graphs.
 * @param oid
 */
Lexicon.prototype.registerGraph = function(oid){
    if(oid != this.defaultGraphOid) {
        this.knownGraphs[oid] = true;
    }
};

/**
 * Returns the list of known graphs OIDs or URIs.
 * @param returnUris
 * @param callback
 */
Lexicon.prototype.registeredGraphs = function(returnUris, callback) {
    var graphs = _.map(this.knownGraphs, function(g){
        if(returnUris === true) {
            return this.OIDToUri['u'+g];
        } else {
            return g;
        }
    },this);

    callback(graphs);
};

/**
 * Registers a URI in the lexicon. It returns the allocated OID for the URI.
 * As a side effect it increases the cost counter for that URI if it is already registered.
 * @param uri
 * @param callback
 * @returns URI's OID.
 */
Lexicon.prototype.registerUri = function(uri, callback) {
    if(uri === this.defaultGraphUri) {
        callback(this.defaultGraphOid);
    } else if(this.uriToOID[uri] == null){
        var oid = this.oidCounter;
        var oidStr = 'u'+oid;
        this.oidCounter++;

        this.uriToOID[uri] =[oid, 0];
        this.OIDToUri[oidStr] = uri;

        callback(oid);
    } else {
        var oidCounter = this.uriToOID[uri];
        var oid = oidCounter[0];
        var counter = oidCounter[1] + 1;
        this.uriToOID[uri] = [oid, counter];
        callback(oid);
    }
};

/**
 * Returns the OID associated to the URI.
 * If the URI hasn't been  associated in the lexicon, -1 is returned.
 * @param uri
 * @param callback
 */
Lexicon.prototype.resolveUri = function(uri,callback) {
    if(uri === this.defaultGraphUri) {
        callback(this.defaultGraphOid);
    } else {
        var oidCounter = this.uriToOID[uri];
        if(oidCounter != null) {
            callback(oidCounter[0]);
        } else {
            callback(-1);
        }
    }
};

/**
 * Returns the cost associated to the URI.
 * If the URI hasn't been associated in the lexicon, -1 is returned.
 * @param uri
 * @returns {*}
 */
Lexicon.prototype.resolveUriCost = function(uri, callback) {
    if(uri === this.defaultGraphUri) {
        callback(this.defaultGraphOid);
    } else {
        var oidCounter = this.uriToOID[uri];
        if(oidCounter != null) {
            callback(oidCounter[1]);
        } else {
            callback(-1);
        }
    }
};

/**
 * Register a new blank node in the lexicon.
 * @param label
 * @returns {string}
 */
Lexicon.prototype.registerBlank = function(callback) {
    var oid = this.oidCounter;
    this.oidCounter++;
    var oidStr = ""+oid;
    this.OIDToBlank[oidStr] = true;
    callback(oidStr);
};

/**
 * @TODO: check this implementation. It shouldn't be possible to
 * use blank nodes by name, but it's not clear what happens when parsing.
 * @param label
 * @param callback
 */
Lexicon.prototype.resolveBlank = function(label,callback) {
    if(this.OIDToBlank[label] != null) {
        callback(this.OIDToBlank[label]);
    } else {
        var oid = this.oidCounter;
        this.oidCounter++;
        callback(""+oid);
    }
};

/**
 * Blank nodes don't have an associated cost.
 * @param label
 * @returns {number}
 */
Lexicon.prototype.resolveBlankCost = function(label, callback) {
    callback(0);
};

/**
 * Registers a new literal in the index.
 * @param literal
 * @returns {*}
 */
Lexicon.prototype.registerLiteral = function(literal, callback) {
    if(this.literalToOID[literal] == null){
        var oid = this.oidCounter;
        var oidStr =  'l'+ oid;
        this.oidCounter++;

        this.literalToOID[literal] = [oid, 0];
        this.OIDToLiteral[oidStr] = literal;

        callback(oid);
    } else {
        var oidCounter = this.literalToOID[literal];
        var oid = oidCounter[0];
        var counter = oidCounter[1] + 1;
        this.literalToOID[literal] = [oid, counter];
        callback(oid);
    }
};

Lexicon.prototype.resolveLiteral = function (literal,callback) {
    var oidCounter = this.literalToOID[literal];
    if (oidCounter != null) {
        callback(oidCounter[0]);
    } else {
        callback(-1);
    }
};

Lexicon.prototype.resolveLiteralCost = function (literal,callback) {
    var oidCounter = this.literalToOID[literal];
    if (oidCounter != null) {
        callback(oidCounter[1]);
    } else {
        callback(0);
    }
};


Lexicon.prototype.parseLiteral = function(literalString) {
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

Lexicon.prototype.parseUri = function(uriString) {
    return {token: "uri", value:uriString};
};

Lexicon.prototype.retrieve = function(oid, callback) {
    try {
        if(oid === this.defaultGraphOid) {
            callback({ token: "uri",
                value:this.defaultGraphUri,
                prefix: null,
                suffix: null,
                defaultGraph: true });
        } else {
            var maybeUri = this.OIDToUri['u'+oid];
            if(maybeUri != null) {
                callback(this.parseUri(maybeUri));
            } else {
                var maybeLiteral = this.OIDToLiteral['l'+oid];
                if(maybeLiteral != null) {
                    callback(this.parseLiteral(maybeLiteral));
                } else {
                    var maybeBlank = this.OIDToBlank[""+oid];
                    if(maybeBlank != null) {
                        return({token:"blank", value:"_:"+oid});
                    } else {
                        callback(null);
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

Lexicon.prototype.clear = function(callback) {
    this.uriToOID = {};
    this.OIDToUri = {};

    this.literalToOID = {};
    this.OIDToLiteral = {};

    this.OIDToBlank = {};
    callback();
};

Lexicon.prototype.unregister = function (quad, key, callback) {
    try {
        this._unregisterTerm(quad.subject.token, key.subject);
        this._unregisterTerm(quad.predicate.token, key.predicate);
        this._unregisterTerm(quad.object.token, key.object);
        if (quad.graph != null) {
            this._unregisterTerm(quad.graph.token, key.graph);
        }
        callback(true);
    } catch (e) {
        console.log("Error unregistering quad");
        console.log(e.message);
        callback(false);
    }
};

Lexicon.prototype._unregisterTerm = function (kind, oid, callback) {
    if (kind === 'uri') {
        if (oid != this.defaultGraphOid) {
            var oidStr = 'u' + oid;
            var uri = this.OIDToUri[oidStr];     // = uri;
            var oidCounter = this.uriToOID[uri]; // =[oid, 0];

            var counter = oidCounter[1];
            if ("" + oidCounter[0] === "" + oid) {
                if (counter === 0) {
                    delete this.OIDToUri[oidStr];
                    delete this.uriToOID[uri];
                    // delete the graph oid from known graphs
                    // in case this URI is a graph identifier
                    delete this.knownGraphs[oid];
                } else {
                    this.uriToOID[uri] = [oid, counter - 1];
                }
            } else {
                throw("Not matching OID : " + oid + " vs " + oidCounter[0]);
            }
        }
    } else if (kind === 'literal') {
        this.oidCounter++;
        var oidStr = 'l' + oid;
        var literal = this.OIDToLiteral[oidStr];  // = literal;
        var oidCounter = this.literalToOID[literal]; // = [oid, 0];

        var counter = oidCounter[1];
        if ("" + oidCounter[0] === "" + oid) {
            if (counter === 0) {
                delete this.OIDToLiteral[oidStr];
                delete this.literalToOID[literal];
            } else {
                this.literalToOID[literal] = [oid, counter - 1];
            }
        } else {
            throw("Not matching OID : " + oid + " vs " + oidCounter[0]);
        }

    } else if (kind === 'blank') {
        delete this.OIDToBlank["" + oid];
    }
    callback();
};

module.exports = {
    Lexicon: Lexicon
};