var N3Parser = require('n3').Parser;
//var N3Parser = require('../node_modules/n3/lib/N3Parser');

// Add a wrapper around the N3.js parser
var RVN3Parser = {};
RVN3Parser.parser = {
    async: true,
    parse: function (data, graph, options, callback) {
        // Shift arguments if necessary
        if (!callback) {
            callback = options;
            options = graph;
            graph = null;
        }

        // Make sure graph is an object
        if (graph && typeof(graph) === 'string')
            graph = { token: 'uri', value: graph, prefix: null, suffix: null };
        // Convert options
        if (options && options.baseURI)
            options.documentIRI = options.baseURI;

        // Parse triples into array
        var triples = [];
        new N3Parser(options).parse(data, function (error, triple) {
            if (error)
                callback(error);
            else if (!triple)
                callback(false, triples);
            else
                triples.push({
                    subject:   convertEntity(triple.subject),
                    predicate: convertEntity(triple.predicate),
                    object:    convertEntity(triple.object),
                    graph:     graph
                });
        });
    },

    resetBlankNodeIds: function() {
        N3Parser._resetBlankNodeIds();
    }

};

// Converts an entity in N3.js representation to this library's representation
function convertEntity(entity) {
    switch (entity[0]) {
        case '"': {
            if(entity.indexOf("^^") > 0) {
                var parts = entity.split("^^");
                return {literal: parts[0] + "^^<" + parts[1] + ">" };
            } else {
                return { literal: entity };
            }
        }
        case '_': return { blank: entity.replace('b', '') };
        default:  return { token: 'uri', value: entity, prefix: null, suffix: null };
    }
}

module.exports = {
    RVN3Parser: RVN3Parser
};