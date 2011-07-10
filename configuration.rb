BUILD_CONFIGURATION = { 
  :browser =>  {
    # should include jQuery?
    :load_jquery => false,
    
    # list of mdoules to pack
    :modules => [
                 "./src/js-trees/src/utils.js",
                 "./src/js-trees/src/in_memory_async_b_tree.js",
                 "./src/js-rdf-persistence/src/quad_index_common.js",
                 "./src/js-rdf-persistence/src/quad_index.js",
                 "./src/js-rdf-persistence/src/quad_backend.js",
                 "./src/js-rdf-persistence/src/lexicon.js",
                 "./src/js-communication/src/ajax_transport.js",
                 "./src/js-communication/src/turtle_parser.js",
                 "./src/js-communication/src/jsonld_parser.js",
                 "./src/js-communication/src/rdf_loader.js",
                 "./src/js-sparql-parser/src/abstract_query_tree.js",
                 "./src/js-sparql-parser/src/sparql_parser.js",
                 "./src/js-query-engine/src/rdf_js_interface.js",
                 "./src/js-query-engine/src/query_filters.js",
                 "./src/js-query-engine/src/query_plan.js",
                 "./src/js-query-engine/src/query_engine.js",
                 "./src/js-query-engine/src/callbacks.js",
                 "./src/js-store/src/store.js"
                ]
  },
  :nodejs => {
    # list of mdoules to pack
    :modules => [
                 "./src/js-trees/src/utils.js",
                 "./src/js-trees/src/in_memory_async_b_tree.js",
                 "./src/js-rdf-persistence/src/quad_index_common.js",
                 "./src/js-rdf-persistence/src/quad_index.js",
                 "./src/js-rdf-persistence/src/quad_backend.js",
                 "./src/js-rdf-persistence/src/lexicon.js",
                 "./src/js-communication/src/tcp_transport.js",
                 "./src/js-communication/src/turtle_parser.js",
                 "./src/js-communication/src/jsonld_parser.js",
                 "./src/js-communication/src/rdf_loader.js",
                 "./src/js-sparql-parser/src/abstract_query_tree.js",
                 "./src/js-sparql-parser/src/sparql_parser.js",
                 "./src/js-query-engine/src/rdf_js_interface.js",
                 "./src/js-query-engine/src/query_filters.js",
                 "./src/js-query-engine/src/query_plan.js",
                 "./src/js-query-engine/src/query_engine.js",
                 "./src/js-query-engine/src/callbacks.js",
                 "./src/js-store/src/store.js"
                ],
    :package => {
      :name    => "rdfstore",
      :version => "0.1.7",
      :description => "RDF graph store supporting the SPARQL query language",
      :keywords => ["RDF", "SPARQL", "graph", "store"],
      :author  => {
        :name => "Antonio Garrote",
        :email => "<antoniogarrote@gmail.com>"
      },
      :engines => {:node => "0.4"},
      :repository =>  {:type => "git", :url => "https://github.com/antoniogarrote/rdfstore-js.git"},
      :dependencies => {
        "binary" => ">=0.2.1",
        "put"    => ">=0.0.5"
      }
    }
  }
}
