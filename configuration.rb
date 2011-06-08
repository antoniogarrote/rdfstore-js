BUILD_CONFIGURATION = { 
  :browser =>  {
    # should include jQuery?
    :load_jquery => true,
    
    # list of mdoules to pack
    :modules => [
                 "./js-trees/src/utils.js",
                 "./js-trees/src/in_memory_async_b_tree.js",
                 "./js-rdf-persistence/src/quad_index_common.js",
                 "./js-rdf-persistence/src/quad_index.js",
                 "./js-rdf-persistence/src/quad_backend.js",
                 "./js-rdf-persistence/src/lexicon.js",
                 "./js-communication/src/ajax_transport.js",
                 "./js-communication/src/turtle_parser.js",
                 "./js-communication/src/jsonld_parser.js",
                 "./js-communication/src/rdf_loader.js",
                 "./js-sparql-parser/src/abstract_query_tree.js",
                 "./js-sparql-parser/src/sparql_parser.js",
                 "./js-query-engine/src/rdf_js_interface.js",
                 "./js-query-engine/src/query_filters.js",
                 "./js-query-engine/src/query_plan.js",
                 "./js-query-engine/src/query_engine.js",
                 "./js-store/src/store.js"
                ]
  },
  :nodejs => {
    # list of mdoules to pack
    :modules => [
                 "./js-trees/src/utils.js",
                 "./js-trees/src/in_memory_async_b_tree.js",
                 "./js-rdf-persistence/src/quad_index_common.js",
                 "./js-rdf-persistence/src/quad_index.js",
                 "./js-rdf-persistence/src/quad_backend.js",
                 "./js-rdf-persistence/src/lexicon.js",
                 "./js-communication/src/tcp_transport.js",
                 "./js-communication/src/turtle_parser.js",
                 "./js-communication/src/jsonld_parser.js",
                 "./js-communication/src/rdf_loader.js",
                 "./js-sparql-parser/src/abstract_query_tree.js",
                 "./js-sparql-parser/src/sparql_parser.js",
                 "./js-query-engine/src/rdf_js_interface.js",
                 "./js-query-engine/src/query_filters.js",
                 "./js-query-engine/src/query_plan.js",
                 "./js-query-engine/src/query_engine.js",
                 "./js-store/src/store.js"
                ]
  }
}
