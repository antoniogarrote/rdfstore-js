// exports
exports.Lexicon = {};
var Lexicon = exports.Lexicon;

// imports
var QuadIndexCommon = require("./quad_index_common").QuadIndexCommon;

/**
 * Temporal implementation of the lexicon
 */


Lexicon.Lexicon = function(callback){
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

Lexicon.Lexicon.prototype.registerGraph = function(oid, callback){
    if(oid != this.defaultGraphOid) {
        this.knownGraphs[oid] = true;
    }
    callback(true);
};

Lexicon.Lexicon.prototype.registeredGraphs = function(shouldReturnUris,callback) {
    var acum = [];

    for(var g in this.knownGraphs) {
        if(shouldReturnUris === true) {
            acum.push(this.OIDToUri['u'+g]);
        } else {
            acum.push(g);
        }
    }
    callback(true, acum);
};

Lexicon.Lexicon.prototype.registerUri = function(uri, callback) {
    if(uri === this.defaultGraphUri) {
        callback(this.defaultGraphOid);
    } else if(this.uriToOID[uri] == null){
        var oid = this.oidCounter
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

Lexicon.Lexicon.prototype.resolveUri = function(uri, callback) {
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

Lexicon.Lexicon.prototype.registerBlank = function(label, callback) {
    var oid = this.oidCounter;
    this.oidCounter++;
    var oidStr = ""+oid;
    this.OIDToBlank[oidStr] = true;
    callback(oidStr);
};

Lexicon.Lexicon.prototype.resolveBlank = function(label, callback) {
//    @todo
//    this is failing with unicode tests... e.g. kanji2

//    var id = label.split(":")[1];
//    callback(id);

    var oid = this.oidCounter;
    this.oidCounter++
    callback(""+oid);
};

Lexicon.Lexicon.prototype.registerLiteral = function(literal, callback) {
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

Lexicon.Lexicon.prototype.resolveLiteral = function(literal, callback) {
    var oidCounter = this.literalToOID[literal];
    if(oidCounter != null ) {
        callback(oidCounter[0]); 
    } else {
        callback(-1); 
    }
}

Lexicon.Lexicon.prototype.parseLiteral = function(literalString) {
    var parts = literalString.lastIndexOf("@");
    if(parts!=-1 && literalString[parts-1]==='"') {
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

Lexicon.Lexicon.prototype.retrieve = function(oid,callback) {
    try {
        if(oid === this.defaultGraphOid) {
            callback({ token: "uri", 
                       value:this.defaultGraphUri,
                       prefix: null,
                       suffix: null,
                       defaultGraph: true });
        } else {
          var maybeUri = this.OIDToUri['u'+oid];
          if(maybeUri) {
              callback(this.parseUri(maybeUri));
          } else {
              var maybeLiteral = this.OIDToLiteral['l'+oid];
              if(maybeLiteral) {
                  callback(this.parseLiteral(maybeLiteral));
              } else {
                  var maybeBlank = this.OIDToBlank[""+oid];
                  if(maybeBlank) {
                      callback({token:"blank", value:"_:"+oid});
                  } else {
                      throw("Null value for OID");
                  }
              }
          }
        }
    } catch(e) {
        console.log("error in lexicon retrieving OID:");
        console.log(oid);
        if(e.message) {
            console.log(e.message); 
        }
        if(e.stack) {
            console.log(e.stack);
        }
        throw new Error("Unknown retrieving OID in lexicon:"+oid);

    }
};


Lexicon.Lexicon.prototype.unregister = function(quad, key,callback) {
    try {
        this.unregisterTerm(quad.subject.token, key.subject);
        this.unregisterTerm(quad.predicate.token, key.predicate);
        this.unregisterTerm(quad.object.token, key.object);
        if(quad.graph!=null) {
            this.unregisterTerm(quad.graph.token, key.graph); 
        }
        callback(true);
    } catch(e) {
        console.log("Error unregistering quad");
        console.log(e.message);
        callback(false);
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
