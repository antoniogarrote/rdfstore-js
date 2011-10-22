BUILD_CONFIGURATION = { 
  :browser =>  {
    # should include jQuery?
    :load_jquery => false,
    
    # list of mdoules to pack
    :modules => [
                 "./src/js-trees/src/utils.js",
                 "./src/js-trees/src/in_memory_b_tree.js",
                 "./src/js-rdf-persistence/src/quad_index_common.js",
                 "./src/js-rdf-persistence/src/quad_index.js",
                 "./src/js-rdf-persistence/src/quad_backend.js",
                 "./src/js-rdf-persistence/src/lexicon.js",
                 "./src/js-communication/src/ajax_transport.js",
                 "./src/js-communication/src/jsonld_parser.js",
                 "./src/js-communication/src/rdf_loader.js",
                 "./src/js-sparql-parser/src/abstract_query_tree.js",
                 "./src/js-sparql-parser/src/sparql_parser.js",
                 "./src/js-communication/src/turtle_parser.js",
                 "./src/js-query-engine/src/rdf_js_interface.js",
                 "./src/js-query-engine/src/query_filters.js",
                 "./src/js-query-engine/src/query_plan.js",
                 "./src/js-query-engine/src/query_engine.js",
                 "./src/js-query-engine/src/callbacks.js",
                 "./src/js-connection/src/rdfstore_client.js",
                 "./src/js-store/src/store.js",
                 "./src/js-connection/src/rdfstore_worker.js"                 
                ]
  },
  
  :browser_persistent =>  {
    # should include jQuery?
    :load_jquery => false,
    
    # list of mdoules to pack
    :modules => [
                 "./src/js-trees/src/utils.js",
                 "./src/js-trees/src/priority_queue.js",
                 "./src/js-trees/src/web_local_storage_b_tree.js",
                 "./src/js-rdf-persistence/src/quad_index_common.js",
                 "./src/js-rdf-persistence/src/quad_index.js",
                 "./src/js-rdf-persistence/src/quad_backend.js",
                 "./src/js-rdf-persistence/src/web_local_storage_lexicon.js",
                 "./src/js-communication/src/ajax_transport.js",
                 "./src/js-communication/src/jsonld_parser.js",
                 "./src/js-communication/src/rdf_loader.js",
                 "./src/js-sparql-parser/src/abstract_query_tree.js",
                 "./src/js-sparql-parser/src/sparql_parser.js",
                 "./src/js-communication/src/turtle_parser.js",
                 "./src/js-query-engine/src/rdf_js_interface.js",
                 "./src/js-query-engine/src/query_filters.js",
                 "./src/js-query-engine/src/query_plan.js",
                 "./src/js-query-engine/src/query_engine.js",
                 "./src/js-query-engine/src/callbacks.js",
                 "./src/js-connection/src/rdfstore_client.js",
                 "./src/js-store/src/store.js",
                 "./src/js-connection/src/rdfstore_worker.js"                 
                ]
  },
  
  :nodejs => {
    # list of mdoules to pack
    :modules => [
                 "./src/js-trees/src/utils.js",
                 "./src/js-trees/src/in_memory_b_tree.js",
                 "./src/js-rdf-persistence/src/quad_index_common.js",
                 "./src/js-rdf-persistence/src/quad_index.js",
                 "./src/js-rdf-persistence/src/quad_backend.js",
                 "./src/js-rdf-persistence/src/lexicon.js",
                 "./src/js-communication/src/tcp_transport.js",
                 "./src/js-communication/src/jsonld_parser.js",
                 "./src/js-communication/src/rdf_loader.js",
                 "./src/js-sparql-parser/src/abstract_query_tree.js",
                 "./src/js-sparql-parser/src/sparql_parser.js",
                 "./src/js-communication/src/turtle_parser.js",
                 "./src/js-query-engine/src/rdf_js_interface.js",
                 "./src/js-query-engine/src/query_filters.js",
                 "./src/js-query-engine/src/query_plan.js",
                 "./src/js-query-engine/src/query_engine.js",
                 "./src/js-query-engine/src/callbacks.js",
                 "./src/js-connection/src/rdfstore_client.js",
                 "./src/js-store/src/store.js",
                 "./src/js-connection/src/rdfstore_worker.js"
                ],
    :package => {
      :name    => "rdfstore",
      :version => "0.4.5",
      :description => "RDF graph store supporting the SPARQL query language",
      :keywords => ["RDF", "SPARQL", "graph", "store"],
      :author  => {
        :name => "Antonio Garrote",
        :email => "<antoniogarrote@gmail.com>"
      },
      :engines => {:node => ">=0.4.3"},
      :repository =>  {:type => "git", :url => "https://github.com/antoniogarrote/rdfstore-js.git"},
      :licenses => [
                    { :type =>  "LGPL V3",
                      :url  =>  "http://www.gnu.org/licenses/lgpl.html"
                    }
                   ],
      :dependencies => {
        "binary"    => ">=0.2.2",
        "put"       => ">=0.0.5",
        "webworker" => ">=0.8.4"
      }
    }
  }
}
