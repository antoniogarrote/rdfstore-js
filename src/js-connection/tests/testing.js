onmessage = function(e) {
    postMessage({ test : 'this is a test' });
};
onclose = function() { sys.debug('Worker shuttting down.'); };
