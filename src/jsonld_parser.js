var jsonld = require('jsonld');

var toTriples = function (input, graph, cb) {
    var rval = null;

    // normalize input
    jsonld.normalize(input, {}, function (err, normalized) {
        if (err)
            cb(err);
        else {
            var parseTerm = function (term) {
                if (term.type === 'blank node') {
                    return {'blank': term.value};
                } else if (term.type === 'IRI') {
                    return {'token': 'uri', 'value': term.value};
                } else if (term.type === 'literal') {
                    if (term.language != null) {
                        return {'literal': '"' + term.value + '"@' + term.language};
                    } else if (term.datatype !== null) {
                        return {'literal': '"' + term.value + '"^^<' + term.datatype + ">"};
                    } else {
                        return {'literal': '"' + term.value + '"'};

                    }
                }
            };

            rval = [];
            var callback = function (s, p, o) {
                rval.push({
                    'subject': parseTerm(s),
                    'predicate': parseTerm(p),
                    'object': parseTerm(o),
                    'graph': graph
                });
            };


            // generate triples
            var quit = false;
            for (var p in normalized) {
                var triples = normalized[p];
                for (var i = 0; i < triples.length; i++) {
                    var triple = triples[i];
                    callback(triple.subject, triple.predicate, triple.object);
                }
            }

            cb(null, rval);

        }
    });
};


// exports
exports.JSONLDParser = {};
var JSONLDParser = exports.JSONLDParser;

JSONLDParser.parser = {

    async: true,

    parse: function (data, graph, options, callback) {
        try {
            if (typeof(data) === 'string') {
                data = JSON.parse(data);
            }
            toTriples(data, graph, callback);
        } catch (error) {
            callback(error);
        }

    }

};

module.exports = {
    JSONLDParser: JSONLDParser
};
