// exports
exports.JSONLDParser = {};
var JSONLDParser = exports.JSONLDParser;

// imports
var Utils = require("./../../js-trees/src/utils").Utils;

JSONLDParser.parser = {};
JSONLDParser.parser.parse = function(data, graph) {
    var state = {
        defaultContext: { "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
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
                          "ccard": "http://purl.org/commerce/creditcard#",
                          "@coerce": 
                          {
                              "http://www.w3.org/2001/XMLSchema#anyURI": ["http://xmlns.com/foaf/0.1/homepage", "http://xmlns.com/foaf/0.1/member"],
                              "http://www.w3.org/2001/XMLSchema#integer": "http://xmlns.com/foaf/0.1/age"
                          }
                        },
        defaultGraph: null,
        activeSubject: null,
        inheritedSubject: null,
        activePredicate: null,
        inheritedPredicate: null,
        activeObject: null,
        activeContext: [],
        localContext: {},
        listOfIncompleteTriples: [],
        listOfUnprocessedItems: []
    }

    var triples = [];
    var nodeId = 0;

    // 1) Push the default context onto the active context stack.
    state.activeContext = state.defaultContext;
    if(JSONLDParser.parser.isArray(data)) {
        JSONLDParser.parser.parseListOfNodes(data, state, null, null, triples, nodeId);
    } else {
        JSONLDParser.parser.parseListOfNodes([data], state, null, null, triples, nodeId);
    }

    var quads = [];
    for(var i=0; i<triples.length; i++) {
        var quad = triples[i];
        quad.graph = graph;
        quads.push(quad);
    }
    return quads;
};

JSONLDParser.parser.parseListOfNodes = function(data, state, inheritedSubject, inheritedPredicate, triples, nodeId) {

    for(var i=0; i<data.length; i++) {
        var token = data[i];

        //create a new processor state. 
        processorState = { activeSubject: null,
                           inheritedSubject: inheritedSubject,
                           activePredicate: null,
                           inheritedPredicate: inheritedPredicate,
                           activeObject: null,
                           localContext: {},
                           listOfIncompleteTriples: [],
                           listOfUnprocessedItems: []
                         };

        //Copy the current context stack to the newly created processor state. 
        //Push the active context onto the newly created processor state's active context stack. 
        processorState['activeContext'] = JSONLDParser.parser.copyContext(state.activeContext);


        //If an associative array is detected, 
        if(JSONLDParser.parser.isAssociatveArray(token)) {

            /*
              If a @context keyword is found, the processor merges each key-value pair in the local context into the active context, 
              overwriting any duplicate values in the active context. 
              If the @coerce key is found, the processor merges each key-value pair in the local context's @coerce mapping into the active context's @coerce mapping, 
              overwriting any duplicate values in the active context's @coerce mapping. 
              Process each object in the list of unprocessed items, starting at Step 2.2.
            */
            if(token['@context'] != null) {
                processorState['activeContext'] = JSONLDParser.parser.mergeContexts(processorState['activeContext'], token['@context']);
            }


            if(token['@'] != null) {
                value = token['@'];
                // If a @ key is found, the processor sets the active subject to the value after Object Processing has been performed. 

                processorState.activeSubject = JSONLDParser.parser.parseIri(value,processorState['activeContext']);
            } else {
                processorState.activeSubject = {'token':'uri', 'value':"_:"+nodeId};
                nodeId++;
            }

            // if the inherited subject and inherited predicate values are specified, 
            // generate a triple using the inherited subject for the subject, the inherited 
            // predicate for the predicate, and the active subject for the object.
            if(processorState.inheritedPredicate != null && processorState.inheritedSubject != null) {
                triples.push({subject: processorState.inheritedSubject, predicate: processorState.inheritedPredicate, object: processorState.activeSubject});
            }


            //For each key-value pair in the associative array, using the newly created processor state do the following: 
            for(var key in token) {

                var value = token[key];

                if(key !== '@context' && key !== '@') {
                    if( key === 'a') {
                        // If an 'a' key is found, set the active predicate to http://www.w3.org/1999/02/22-rdf-syntax-ns#type. 
                        processorState.activePredicate = {token: 'uri', value:'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'};

                    } else {
                        //  If a key that is not @context, @, or a, set the active predicate by performing Predicate Processing on the key. 
                        processorState.activePredicate = JSONLDParser.parser.parseIri(key, processorState['activeContext']);
                    }

                    if(typeof(value) != 'object') {
                        processorState.activeObject = JSONLDParser.parser.coerceLiteral(value, processorState.activePredicate, processorState.activeContext);
                        triples.push({subject: processorState.activeSubject, predicate:processorState.activePredicate, object:processorState.activeObject});
                    } else if(value.length != null) {
                        // process new triple per object
                        JSONLDParser.parser.parseListOfNodes(value, processorState, processorState.activeSubject, processorState.activePredicate, triples, nodeId);
                    } else {
                        if(value['@iri'] != null) {
                            triples.push({subject: processorState.activeSubject, predicate: processorState.activePredicate, object: JSONLDParser.parser.parseIri(value)});
                        } else if(value['@literal'] != null) {
                            var object = null
                            if(value['@language']) {
                                obj = {'token': 'literal', 'value': value['@literal'], 'lang': value['@language']};
                            } else {
                                obj = JSONLDParser.parser.coerceLiteral(value['@literal']);
                                obj['type'] = object['type'] || value['@datatype'];
                            }

                            triples.push({subject: processorState.activeSubject, predicate: processorState.activePredicate, object: obj});                   
                        } else {
                            JSONLDParser.parser.parseListOfNodes([value], processorState, null, null, triples);
                        }
                    }
                }
            }
        } else if(typeof(token) === 'string') {
            if(processorState.inheritedPredicate != null && processorState.inheritedSubject != null) {
                triples.push({subject: processorState.inheritedSubject, 
                              predicate: processorState.inheritedPredicate, 
                              object: JSONLDParser.parser.coerceLiteral(token, 
                                                                        processorState.inheritedPredicate, 
                                                                        processorState['activeContext'])});
            }
        }
    }
};

JSONLDParser.parser.coerceLiteral = function(value, activePredicate, activeContext) {
    var coercion = null;

    for(var ns in (activeContext || {})) {
        var uri = activeContext[ns];
        if(value.indexOf(ns) === 0) {
            return {'token': 'uri',
                    'value': uri+(value.split(ns+":")[1]||"")}
        } else {
            if(uri === value) {
                return {'token': 'uri', 'value': uri};
            }
        }
    }

    for(var type in (activeContext['@coerce']||{})) {
        var propertiesToCoerce = activeContext['@coerce'][type];

        if(typeof(propertiesToCoerce) === 'string') {
            propertiesToCoerce = [ propertiesToCoerce ];
        }

        for(var ns in activeContext) {
            for(var i=0; i<propertiesToCoerce.length; i++) {                
                var expandedCoerce = propertiesToCoerce[i];
                if(expandedCoerce.indexOf(ns) === 0) {
                    expandedCoerce = expandedCoerce.split(ns+":")[1]||"";
                    expandedCoerce = activeContext[ns] + expandedCoerce;
                } 
                if(expandedCoerce === activePredicate.value) {
                    if(type === 'http://www.w3.org/2001/XMLSchema#anyURI' || type === 'xsd:anyURI') {
                        return {'token': 'uri', 'value': value}; 
                    } else {
                        return {'token': 'literal', 'value': value, 'type': type}; 
                    }
                }
            }
        }
    }

    return {'token': 'literal', 'value': value};
};

JSONLDParser.parser.isAssociatveArray = function(token) {
    return typeof(token) === 'object' && token.length == null;
};

JSONLDParser.parser.isArray = function(token) {
    return typeof(token) === 'object' && token.length != null;
};

JSONLDParser.parser.copyContext = function(currentContext) {
    var currentContextCopy = {};
    for(var p in currentContext) {
        if(p === "@coerce") {
            var coercion = currentContext[p];
            var coercionCopy = {};
            for(var c in coercion) {
                coercionCopy[c] = coercion[c];
            }
            currentContextCopy[p] = coercionCopy;
        } else {
            currentContextCopy[p] = currentContext[p];
        }
    }
    return currentContextCopy;
};

JSONLDParser.parser.mergeContexts = function(src, dst) {
    for(var p in dst) {
        if(p !== '@coerce') {
            src[p] = dst[p];
        }
    }

    if(dst["@coerce"] != null) {
        var coercion = dst["@coerce"];
        var srcCoercion = src['@coerce'] || {};
        for(var c in coercion) {
            if(typeof(coercion[c]) === 'string') {
                srcCoercion[JSONLDParser.parser.parseIri(c,src).value] = JSONLDParser.parser.parseIri(coercion[c], src).value;
            } else {
                var tmp = [];
                for(var j=0; j<coercion[c].length; j++) {
                    tmp.push(JSONLDParser.parser.parseIri(coercion[c][j], src).value);
                }
            }
        }
        src['@coerce'] = srcCoercion;
    }
    return src;
};

JSONLDParser.parser.copyContextStack = function(contextStack) {
    var newContext = [];

    for(var i=0; i<contextStack.length; i++) {
        var currentContext = contextStack[i];
        var currentContextCopy = {};
        for(var p in currentContext) {
            if(p === "@coerce") {
                var coercion = currentContext[p];
                var coercionCopy = {};
                for(var c in coercion) {
                    if(typeof(coercion[c]) === 'object') {
                        var coercionCopyArray = [];
                        for(var j=0; j<coercion[c].length; j++) {
                            coercionCopyArray.push(coercion[c][j]);
                        }
                        coercionCopy[c] = coercionCopyArray;
                    } else {
                        coercionCopy[c] = coercion[c];
                    }
                }
                currentContextCopy[p] = coercionCopy;
            } else {
                currentContextCopy[p] = currentContext[p];
            }
        }

        newContext.push(currentContextCopy);
    }

    return newContext;
}

JSONLDParser.parser.parseIri = function(object,context) {
    if(typeof(object) === 'object') {
        if(object['@iri'] != null) {
            object = object['@iri'];
        } else {
            throw("Error processing iri");
        }
    } 

    for(var c in context) {
        if(c == '@base' && object.indexOf(":") === 0) {
            return {'token': 'uri', 'value': context[c] + (object.split(":")[1]||"")};
        } else  if(object.indexOf(c) === 0) {
            return {'token': 'uri', 'value': context[c] + (object.split(c+":")[1]||"")};
        }
    }

    if(object.indexOf(":") === -1 && context['@vocab'] != null) {
        return {'token': 'uri', 'value': context['@vocab']+object};
    } else {
        if(object.indexOf(":") != -1) {
            return {'token': 'uri', 'value': object};
        } else {
            throw("Cannot resolve URI: "+object);
        }
    }
}

JSONLDParser.parser.parseObject = function(object,context) {
    if(typeof(object) === 'object') {
        if(object['@iri'] != null) {
            return {'token': 'uri','value': object['@iri']};
        } else {
            throw("Error processing iri");
        }
    } else {
        for(var c in context) {
            if(object.indexOf(c) === 0) {
                return {'token': 'uri', 'value':context[c] + (object.split(c+":")[1]||"")};
            }
        }

        return {'token': 'uri', 'value': object};
    }
}
