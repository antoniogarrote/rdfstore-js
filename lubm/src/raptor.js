var events = require('events');
var raptorTarget = require(__dirname + '/raptor.node');


function inherits(target, source) {
    for (var k in source.prototype)
        target[k] = source.prototype[k];
}


exports.newParser = function(mimeType, cb) {
    if(cb==null) {
        var parser = raptorTarget.newParser(mimeType);
        inherits(parser, events.EventEmitter);
        return parser;
    } else {
        var res = raptorTarget.newParser(mimeType, function(parser) {
            inherits(parser, events.EventEmitter)
            cb(parser);
        });
    }
}


exports.newSerializer = function(mimeType) {
    var serializer = null;

    if(mimeType == null) {
        serializer = raptorTarget.newSerializer();
    } else {
        serializer = raptorTarget.newSerializer(mimeType);
    }

    inherits(serializer, events.EventEmitter)

    return serializer
}
