// exports
exports.WebLocalStorageLexicon = {};
var WebLocalStorageLexicon = exports.WebLocalStorageLexicon;


/**
 * Temporal implementation of the lexicon
 */

WebLocalStorageLexicon.Lexicon = function(name, callback){
    this.name = name;
    this.storage = null;

    try {
        this.storage = window.localStorage;
    } catch(e) { }

    if(this.storage == null) {
        this.storage = { //content: {},
            setItem: function(pointer, object) {
                //nop
            },
            getItem: function(pointer) {
                return null;
            },
            removeItem: function(pointer) {
                //nop
            }
        };
    }

    // these hashes will be used as cachés
    this.uriToOID = {};
    this.OIDToUri = {};

    this.literalToOID = {};
    this.OIDToLiteral = {};

    this.blankToOID = {};
    this.OIDToBlank = {};

    if((this.defaultGraphOid=this.storage.getItem(this.pointer("oidCounter"))) == null) {
        this.defaultGraphOid = 0;
    } else {
        this.defaultGraphOid = parseInt(this.defaultGraphOid);
    }

    this.defaultGraphUri = "https://github.com/antoniogarrote/rdfstore-js#default_graph";
    this.defaultGraphUriTerm = {"token": "uri", "prefix": null, "suffix": null, "value": this.defaultGraphUri, "oid": this.defaultGraphOid};
    this.oidCounter = 1;

    // create or restor the hash of known graphs
    if(this.storage.getItem(this.pointer("knownGraphs"))==null) {
        this.knownGraphs = {};
        this.storage.setItem(this.pointer("knownGraphs"), JSON.stringify(this.knownGraphs));
    } else {
        this.knownGraphs = JSON.parse(this.storage.getItem(this.pointer("knownGraphs")));
    }
    
    if(callback != null) {
        callback(this);
    }
};

WebLocalStorageLexicon.Lexicon.prototype.pointer = function(hashName,val){
    if(hashName=="uriToOID") {
        hashName = "uo";
    } else if(hashName == "OIDToUri") {
        hashName = "ou";
    } else if(hashName == "literalToOID") {
        hashName = "lo";
    } else if(hashName == "OIDToLiteral") {
        hashName = "ok";
    } else if(hashName == "blankToOID") {
        hashName = "bo";
    } else if(hashName == "OIDToBlank") {
        hashName = "ob";
    }

    if(val==null) {
        return this.name+"_l_"+hashName;
    } else {
        return this.name+"_l_"+hashName+"_"+val;
    }
}

WebLocalStorageLexicon.Lexicon.prototype.registerGraph = function(oid){
    if(oid != this.defaultGraphOid) {
        this.knownGraphs[oid] = true;
        this.storage.setItem(this.pointer("knownGraphs"),JSON.stringify(this.knownGraphs));
    }
    return true
};

WebLocalStorageLexicon.Lexicon.prototype.registeredGraphs = function(shouldReturnUris) {
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

WebLocalStorageLexicon.Lexicon.prototype.registerUri = function(uri) {
    if(uri === this.defaultGraphUri) {
        return(this.defaultGraphOid);
    } else if(this.uriToOID[uri] == null){
        var fromStorage = this.storage.getItem(this.pointer("uriToOID",uri));
        if(fromStorage == null) {
            var oid = this.oidCounter
            var oidStr = 'u'+oid;
            this.oidCounter++;

            this.uriToOID[uri] =[oid, 0];
            this.OIDToUri[oidStr] = uri;

            this.storage.setItem(this.pointer("uriToOID",uri),oid+":"+0)
            this.storage.setItem(this.pointer("OIDToUri",oidStr),uri)
            return(oid);
        } else {
            var parts = fromStorage.split(":");
            var oid = parseInt(parts[0]);
            var oidStr = 'u'+oid;
            var counter = parseInt(parts[1])+1;

            this.uriToOID[uri] = [oid, counter];
            this.OIDToUri[oidStr] = uri;
            this.storage.setItem(this.pointer("uriToOID",uri), oid+":"+0);

            return(oid);
        }
    } else {
        var oidCounter = this.uriToOID[uri];
        var oid = oidCounter[0];
        var counter = oidCounter[1] + 1;
        this.uriToOID[uri] = [oid, counter];
        this.storage.setItem(this.pointer("uriToOID",uri), oid+":"+counter);
        return(oid);
    }
};

WebLocalStorageLexicon.Lexicon.prototype.resolveUri = function(uri) {
    if(uri === this.defaultGraphUri) {
        return(this.defaultGraphOid);
    } else {
        var oidCounter = this.uriToOID[uri];
        if(oidCounter != null) {
            return(oidCounter[0]);
        } else {
            var fromStorage = this.storage.getItem(this.pointer("uriToOID",uri));
            if(fromStorage == null) {
                return(-1);
            } else {
                var parts = fromStorage.split(":");
                var oid = parseInt(parts[0]);
                var oidStr = 'u'+oid;
                var counter = parseInt(parts[1]);
                this.uriToOID[uri] = [oid,counter];
                this.OIDToUri[oidStr] = uri;
                return(oid);
            }
        }
    }
};

WebLocalStorageLexicon.Lexicon.prototype.registerBlank = function(label) {
    var oid = this.oidCounter;
    this.oidCounter++;
    var oidStr = ""+oid;
    this.storage.setItem(this.pointer("OIDToBlank",oidStr),true);
    this.OIDToBlank[oidStr] = true;
    
    return(oidStr);
};

WebLocalStorageLexicon.Lexicon.prototype.resolveBlank = function(label) {
    var oid = this.oidCounter;
    this.oidCounter++
    return(""+oid);
};

WebLocalStorageLexicon.Lexicon.prototype.registerLiteral = function(literal) {
    if(this.literalToOID[literal] == null){
        var fromStorage = this.storage.getItem(this.pointer("literalToOID",literal));
        if(fromStorage==null) {
            var oid = this.oidCounter;
            var oidStr =  'l'+ oid;
            this.oidCounter++;

            this.literalToOID[literal] = [oid, 0];
            this.OIDToLiteral[oidStr] = literal;

            this.storage.setItem(this.pointer("literalToOID",literal), oid+":"+0);
            this.storage.setItem(this.pointer("OIDToLiteral",oidStr), literal);
            return(oid);
        } else {
            var oidCounter = fromStorage.split(":");
            var oid = parseInt(oidCounter[0]);
            var counter = parseInt(oidCounter[1]) + 1;
            this.literalToOID[literal] = [oid, counter];
            this.storage.setItem(this.pointer("literalToOID",literal), oid+":"+counter);
            return(oid);
        }
    } else {
        var oidCounter = this.literalToOID[literal];
        var oid = oidCounter[0];
        var counter = oidCounter[1] + 1;
        this.storage.setItem(this.pointer("literalToOID",literal), oid+":"+counter);
        this.literalToOID[literal] = [oid, counter];
        return(oid);
    }
};

WebLocalStorageLexicon.Lexicon.prototype.resolveLiteral = function(literal) {
    var oidCounter = this.literalToOID[literal];
    if(oidCounter != null ) {
        return(oidCounter[0]); 
    } else {
        fromStorage = this.storage.getItem(this.pointer("literalToOID",literal));
        if(fromStorage!=null) {
            oidCounter = fromStorage.split(":");
            var oid = parseInt(oidCounter[0]);
            var counter = parseInt(oidCounter[1]);
            var oidStr =  'l'+ oid;
            this.literalToOID[literal] = [oid, counter];
            this.OIDToLiteral[oidStr] =  literal;
            return(oid);
        } else {
            return(-1); 
        }
    }
}

WebLocalStorageLexicon.Lexicon.prototype.parseLiteral = function(literalString) {
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

WebLocalStorageLexicon.Lexicon.prototype.parseUri = function(uriString) {
    return {token: "uri", value:uriString};
};

WebLocalStorageLexicon.Lexicon.prototype.retrieve = function(oid) {
    var fromStorage;
    try {
        if(oid === this.defaultGraphOid) {
            return({ token: "uri", 
                     value:this.defaultGraphUri,
                     prefix: null,
                     suffix: null,
                     defaultGraph: true });
        } else {
          var maybeUri = this.OIDToUri['u'+oid];
          if(maybeUri) {
              return(this.parseUri(maybeUri));
          } else {
              var maybeLiteral = this.OIDToLiteral['l'+oid];
              if(maybeLiteral) {
                  return(this.parseLiteral(maybeLiteral));
              } else {
                  var maybeBlank = this.OIDToBlank[""+oid];
                  if(maybeBlank) {
                      return({token:"blank", value:"_:"+oid});
                  } else {
                      // uri
                      maybeUri = this.storage.getItem(this.pointer("OIDToUri","u"+oid));
                      if(maybeUri != null) {
                          this.OIDToUri["u"+oid] = maybeUri;
                          fromStorage = this.storage.getItem(this.pointer("uriToOID", maybeUri));
                          var parts = fromStorage.split(":");
                          var counter = parseInt(parts[1]);
                          this.uriToOID[uri] = [oid,counter];
                          return(this.parseUri(maybeUri));
                      } else {
                          // literal
                          maybeLiteral = this.storage.getItem(this.pointer("OIDToLiteral","l"+oid));
                          if(maybeLiteral != null) {
                              this.OIDToLiteral["l"+oid] = maybeLiteral;
                              fromStorage = this.storage.getItem(this.pointer("literalToOID",maybeLiteral));
                              var oidCounter = fromStorage.split(":");
                              var oid = parseInt(oidCounter[0]);
                              var counter = parseInt(oidCounter[1]);
                              this.literalToOID[literal] = [oid, counter];
                              return(this.parseLiteral(maybeLiteral));
                          } else {
                              // blank
                              maybeBlank = this.storage.getItem(this.pointer("OIDToBlank",""+oid));
                              if(maybeBlank != null) {
                                  this.OIDToBlank[""+oid] = true;
                                  return({token:"blank", value:"_:"+oid});
                              } else {
                                  throw("Null value for OID");
                              }
                          }
                      }
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


WebLocalStorageLexicon.Lexicon.prototype.unregister = function(quad, key) {
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

WebLocalStorageLexicon.Lexicon.prototype.unregisterTerm = function(kind, oid) {
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
