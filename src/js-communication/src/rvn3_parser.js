var N3Parser = require('n3').Parser;

// Add a wrapper around the N3.js parser
exports.RVN3Parser = {};
var RVN3Parser = exports.RVN3Parser;
RVN3Parser.parser = {
  async: true,

  parse: function (data, graph, options, callback) {
    // Shift arguments if necessary
    if (!callback)
        callback = options, options = graph, graph = null;
    // Make sure graph is an object
    if (graph && typeof(graph) === 'string')
      graph = { token: 'uri', value: graph, prefix: null, suffix: null };
    // Convert options
    if (options && options.baseURI)
      options.documentURI = options.baseURI;

    // Parse triples into array
    var triples = [];
    new N3Parser(options).parse(data, function (error, triple) {
      if (error)
        callback(false, error);
      else if (!triple)
        callback(true, triples);
      else
        triples.push({
          subject:   convertEntity(triple.subject),
          predicate: convertEntity(triple.predicate),
          object:    convertEntity(triple.object),
          graph:     graph,
        });
    });
  }
};

// Converts an entity in N3.js representation to this library's representation
function convertEntity(entity) {
  switch (entity[0]) {
    case '"': return { literal: entity };
    case '_': return { blank: entity.replace('b', '') };
    default:  return { token: 'uri', value: entity, prefix: null, suffix: null };
  };
}
