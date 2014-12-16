var nextTick = (function () {

    var global = null;
    if(typeof window !== 'undefined')
        global = window;
    else if(typeof process !== 'undefined')
        global = process;


    var canSetImmediate = typeof global !== 'undefined' && global.setImmediate;
    var canPost = typeof global !== 'undefined' && global.postMessage && global.addEventListener;

    // setImmediate
    if (canSetImmediate)
        return function (f) { return global.setImmediate(f) };

    // Node.js specific
    if(global !== 'undefined' && global.nextTick && typeof require === 'function') {
        if(require('timers') && require('timers').setImmediate)
            return require('timers').setImmediate;
        else
            return global.nextTick;
    }

    // postMessage
    if (canPost) {
        var queue = [];
        global.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === global || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);
        return function nextTick(fn) {
            queue.push(fn);
            global.postMessage('process-tick', '*');
        };
    }


    // setTimeout
    return function nextTick(fn) {
        setTimeout(fn, 0);
    };

})();

module.exports = {
    nextTick: nextTick
};