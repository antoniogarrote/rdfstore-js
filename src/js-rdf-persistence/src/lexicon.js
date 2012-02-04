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
        var oid = this.oidCounter;
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

Lexicon.Lexicon.prototype.resolveLiteral = function (literal) {
    var oidCounter = this.literalToOID[literal];
    if (oidCounter != null) {
        return(oidCounter[0]);
    } else {
        return(-1);
    }
};

Lexicon.Lexicon.prototype.resolveLiteralCost = function (literal) {
    var oidCounter = this.literalToOID[literal];
    if (oidCounter != null) {
        return(oidCounter[1]);
    } else {
        return(0);
    }
};


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

Lexicon.Lexicon.prototype.unregister = function (quad, key) {
    try {
        this.unregisterTerm(quad.subject.token, key.subject);
        this.unregisterTerm(quad.predicate.token, key.predicate);
        this.unregisterTerm(quad.object.token, key.object);
        if (quad.graph != null) {
            this.unregisterTerm(quad.graph.token, key.graph);
        }
        return(true);
    } catch (e) {
        console.log("Error unregistering quad");
        console.log(e.message);
        return(false);
    }
};

Lexicon.Lexicon.prototype.unregisterTerm = function (kind, oid) {
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
};
