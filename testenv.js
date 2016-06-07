var $rdf = require('./src/store')
var _ = require('./src/utils');

var store;
var result;

$rdf.create(function(err, st) {
  store = st;
  _.eachSeries([
    storeSeed,
    executeQuery,
  ], callCallback, function() {
    console.log('ready');
  })
})

function storeSeed(cb) {
  store.rdf.setPrefix('rdf', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#');
  store.rdf.setPrefix('rdfs', 'http://www.w3.org/2000/01/rdf-schema#');
  store.rdf.setPrefix('disco', 'http://disco-network.org/resource/');

  var graph = store.rdf.createGraph();
  graph.add(store.rdf.createTriple(
    store.rdf.createNamedNode(store.rdf.resolve('disco:post1')),
    store.rdf.createNamedNode(store.rdf.resolve('rdf:type')),
    store.rdf.createNamedNode(store.rdf.resolve('disco:Post'))
  ));
  graph.add(store.rdf.createTriple(
    store.rdf.createNamedNode(store.rdf.resolve('disco:post1')),
    store.rdf.createNamedNode(store.rdf.resolve('disco:id')),
    store.rdf.createLiteral('1') //TODO: TYPE
  ));
  graph.add(store.rdf.createTriple(
    store.rdf.createNamedNode(store.rdf.resolve('disco:post1')),
    store.rdf.createNamedNode(store.rdf.resolve('disco:content')),
    store.rdf.createNamedNode(store.rdf.resolve('disco:post1')) //TODO: TYPE
  ));
  graph.add(store.rdf.createTriple(
    store.rdf.createNamedNode(store.rdf.resolve('disco:post1')),
    store.rdf.createNamedNode(store.rdf.resolve('disco:parent')),
    store.rdf.createLiteral('null') //TODO: MAKE OPTIONAL
  ));

  store.insert(graph, cb);
}

function executeQuery(cb) {
  var triplePatterns = [
    [ '?post', 'disco:content', '?x1' ],
    [ '?x1', 'disco:content', '?x2' ],
    [ '?x2', 'disco:content', '?x3' ],
    [ '?post', 'disco:id', '?y0' ],
    [ '?x1', 'disco:id', '?y1' ],
    [ '?x2', 'disco:id', '?y2' ],
  ];
  var query =
      'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> '
    + 'PREFIX disco: <http://disco-network.org/resource/> '
    + 'SELECT ' + '*' + ' WHERE { ' + triplePatterns.map(function(p) { return p.join(' ') }).join(" . ") + ' }';
  var query = "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> PREFIX disco: <http://disco-network.org/resource/> SELECT * WHERE {?x0 disco:id ?x1 . ?x0 disco:content ?x2 . ?x2 disco:id ?x3 . ?x0 disco:content ?x2 . ?x2 disco:id ?x6 . ?x2 disco:content ?x7 . ?x7 disco:id ?x8 . ?x2 disco:id ?x6 . ?x2 disco:content ?x7 . ?x7 disco:id ?x8 . ?x2 disco:content ?x7 . ?x7 disco:id ?x11 . ?x7 disco:content ?x12 . ?x12 disco:id ?x13 . ?x7 disco:content ?x12 . ?x12 disco:id ?x13}";

  store.execute(query, function(err, results) {
    console.log(results);
    cb();
  });
}

function callCallback(fn, cb) {
  fn(cb);
}
