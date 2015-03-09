function stackLimit() {
    var n = 0;
    function recurse() { n++; recurse(); }
    try { recurse(); } catch (e) {}
    return n;
}

console.log(stackLimit());
