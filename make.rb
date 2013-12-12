#!/usr/bin/env ruby

require 'rubygems'
require 'fileutils'
require 'json'

NODEUNIT = "./node_modules/nodeunit/bin/nodeunit"

def load_configuration
  puts "*** loading configuration"
  require(File.dirname(__FILE__)+"/configuration")
end

def build_distribution_directory(system);
  begin
    puts "*** building distribution directory"
    Dir.mkdir "./dist"
    Dir.mkdir "./dist/browser"
    Dir.mkdir "./dist/browser_persistent"    
    Dir.mkdir "./dist/nodejs"
    Dir.mkdir "./dist/rdf_interface_api"    
  rescue 
    puts "(!) dist directory already exits"
    FileUtils.rm_r("./dist/browser/") if system == 'browser' && File.exists?("./dist/browser")
    FileUtils.rm_r("./dist/browser_persistent/")  if system == 'browser_persistent' && File.exists?("./dist/browser_persistent")        
    FileUtils.rm_r("./dist/nodejs/")  if system == 'nodejs' && File.exists?("./dist/nodejs")
    FileUtils.rm_r("./dist/rdf_interface_api/")  if system == 'rdf_interface_api' && File.exists?("./dist/rdf_interface_api")    
    Dir.mkdir "./dist/browser"            if system == 'browser'
    Dir.mkdir "./dist/browser_persistent" if system == 'browser_persistent'
    Dir.mkdir "./dist/nodejs"             if system == 'nodejs'
    Dir.mkdir "./dist/nodejs/bin"         if system == 'nodejs'
    Dir.mkdir "./dist/rdf_interface_api"  if system == 'rdf_interface_api'
  end
end

def minimize_output_browser_yui
  puts "*** minimizing output"
  `cp ./yuicompressor-2.4.6.jar ./dist/browser/`
  `cd ./dist/browser && java -jar yuicompressor-2.4.6.jar rdf_store.js > rdf_store_min.js`
  `cp ./dist/browser/rdf_store_min.js ./dist/browser/rdf_store_min.js.bak`  
  `cd ./dist/browser && gzip -9 rdf_store_min.js`
  `mv ./dist/browser/rdf_store_min.js.bak ./dist/browser/rdf_store_min.js`
  `rm ./dist/browser/yuicompressor-2.4.6.jar`
end

def minimize_output_rdf_interface_api
  puts "*** minimizing output"
  `cp ./closure-compiler.jar ./dist/rdf_interface_api/`
  `cd ./dist/rdf_interface_api && java -jar closure-compiler.jar --compilation_level=SIMPLE_OPTIMIZATIONS --js=index.js > rdf_interface_api_min.js`  
  `cp ./dist/rdf_interface_api/index.js ./dist/rdf_interface_api/rdf_interface_api.js`
  `rm ./dist/rdf_interface_api/closure-compiler.jar`
end

def minimize_output_browser
  puts "*** minimizing output"
  `cp ./closure-compiler.jar ./dist/browser/`
#  `cd ./dist/browser && java -jar closure-compiler.jar --compilation_level=ADVANCED_OPTIMIZATIONS --js=rdf_store.js > rdf_store_min.js`
  `cd ./dist/browser && java -jar closure-compiler.jar --compilation_level=SIMPLE_OPTIMIZATIONS --js=rdf_store.js > rdf_store_min.js`
  `cp ./dist/browser/rdf_store_min.js ./dist/browser/rdf_store_min.js.bak`
  `cd ./dist/browser && gzip -9 rdf_store_min.js`
  `mv ./dist/browser/rdf_store_min.js.bak ./dist/browser/rdf_store_min.js`
  `rm ./dist/browser/closure-compiler.jar`
  `cp ./dist/browser/rdf_store*.js ./browsertests/non_persistent/`
  `cp ./dist/browser/rdf_store*.js ./browsertests/workers/resources/public/`
end

def minimize_output_browser_persistent
  puts "*** minimizing output"
  `cp ./closure-compiler.jar ./dist/browser_persistent/`
#  `cd ./dist/browser && java -jar closure-compiler.jar --compilation_level=ADVANCED_OPTIMIZATIONS --js=rdf_store.js > rdf_store_min.js`
  `cd ./dist/browser_persistent && java -jar closure-compiler.jar --compilation_level=SIMPLE_OPTIMIZATIONS --js=rdf_store.js > rdf_store_min.js`
  `cp ./dist/browser_persistent/rdf_store_min.js ./dist/browser_persistent/rdf_store_min.js.bak`
  `cd ./dist/browser_persistent && gzip -9 rdf_store_min.js`
  `mv ./dist/browser_persistent/rdf_store_min.js.bak ./dist/browser_persistent/rdf_store_min.js`
  `rm ./dist/browser_persistent/closure-compiler.jar`
  `cp ./dist/browser_persistent/rdf_store*.js ./browsertests/persistent/`
end

def minimize_output_nodejs
  puts "*** minimizing output"
  `cp ./closure-compiler.jar ./dist/nodejs/`
  `cd ./dist/nodejs && java -jar closure-compiler.jar --compilation_level=SIMPLE_OPTIMIZATIONS --js=index.js > rdf_store_min.js`
  `cp ./dist/nodejs/rdf_store_min.js ./dist/nodejs/rdf_store_min.js.bak`  
  `cd ./dist/nodejs && gzip -9 rdf_store_min.js`
  `mv ./dist/nodejs/rdf_store_min.js.bak ./dist/nodejs/rdf_store_min.js`
  `rm ./dist/nodejs/closure-compiler.jar`
end

def write_nodejs_preamble(of)
  js_code =<<__END
(function() {\r\n
__END
  of << js_code
end


def write_nodejs_coda(of)
  js_code =<<__END
try{
  module.exports = Store;
}catch(e){}
})();
__END

  of << js_code;
end

def write_rdf_interfaces_api_coda(of)
  js_code =<<__END
try{
  if(typeof(module)==="undefined") {
    window['RDFJSInterface'] = RDFJSInterface;

    /* For ADVANCED optimisations */

    //window['RDFJSInterface']['UrisMap'] = RDFJSInterface.UrisMap;
    //window['RDFJSInterface']['UrisMap']['prototype']['get'] = RDFJSInterface.UrisMap.prototype.get;
    //window['RDFJSInterface']['UrisMap']['prototype']['values'] = RDFJSInterface.UrisMap.prototype.values;
    //window['RDFJSInterface']['UrisMap']['prototype']['remove'] = RDFJSInterface.UrisMap.prototype.remove;
    //window['RDFJSInterface']['UrisMap']['prototype']['set'] = RDFJSInterface.UrisMap.prototype.set;
    //window['RDFJSInterface']['UrisMap']['prototype']['setDefault'] = RDFJSInterface.UrisMap.prototype.setDefault;
    //window['RDFJSInterface']['UrisMap']['prototype']['addAll'] = RDFJSInterface.UrisMap.prototype.addAll;
    //window['RDFJSInterface']['UrisMap']['prototype']['resolve'] = RDFJSInterface.UrisMap.prototype.resolve;
    //window['RDFJSInterface']['UrisMap']['prototype']['shrink'] = RDFJSInterface.UrisMap.prototype.shrink;

    //window['RDFJSInterface']['Profile'] = RDFJSInterface.Profile;
    //window['RDFJSInterface']['Profile']['prototype']['importProfile'] = RDFJSInterface.Profile.prototype.importProfile;
    //window['RDFJSInterface']['Profile']['prototype']['resolve'] = RDFJSInterface.Profile.prototype.resolve;
    //window['RDFJSInterface']['Profile']['prototype']['setDefaultPrefix'] = RDFJSInterface.Profile.prototype.setDefaultPrefix;
    //window['RDFJSInterface']['Profile']['prototype']['setDefaultVocabulary'] = RDFJSInterface.Profile.prototype.setDefaultVocabulary;
    //window['RDFJSInterface']['Profile']['prototype']['setPrefix'] = RDFJSInterface.Profile.prototype.setPrefix;
    //window['RDFJSInterface']['Profile']['prototype']['setTerm'] = RDFJSInterface.Profile.prototype.setTerm;

    //window['RDFJSInterface']['RDFEnvironment'] = RDFJSInterface.RDFEnvironment;
    //window['RDFJSInterface']['RDFEnvironment']['prototype']['createBlankNode'] = RDFJSInterface.RDFEnvironment.prototype.createBlankNode;
    //window['RDFJSInterface']['RDFEnvironment']['prototype']['createNamedNode'] = RDFJSInterface.RDFEnvironment.prototype.createNamedNode;
    //window['RDFJSInterface']['RDFEnvironment']['prototype']['createLiteral'] = RDFJSInterface.RDFEnvironment.prototype.createLiteral;
    //window['RDFJSInterface']['RDFEnvironment']['prototype']['createTriple'] = RDFJSInterface.RDFEnvironment.prototype.createTriple;
    //window['RDFJSInterface']['RDFEnvironment']['prototype']['createGraph'] = RDFJSInterface.RDFEnvironment.prototype.createGraph;
    //window['RDFJSInterface']['RDFEnvironment']['prototype']['createAction'] = RDFJSInterface.RDFEnvironment.prototype.createAction;
    //window['RDFJSInterface']['RDFEnvironment']['prototype']['createProfile'] = RDFJSInterface.RDFEnvironment.prototype.createProfile;
    //window['RDFJSInterface']['RDFEnvironment']['prototype']['createTermMap'] = RDFJSInterface.RDFEnvironment.prototype.createTermMap;
    //window['RDFJSInterface']['RDFEnvironment']['prototype']['createPrefixMap'] = RDFJSInterface.RDFEnvironment.prototype.createPrefixMap;

    //window['RDFJSInterface']['RDFNode'] = RDFJSInterface.RDFNode;
    //window['RDFJSInterface']['RDFNode']['prototype']['equals'] = RDFJSInterface.RDFNode.prototype.equals;

    //window['RDFJSInterface']['BlankNode'] = RDFJSInterface.BlankNode;
    //window['RDFJSInterface']['BlankNode']['prototype']['toString'] = RDFJSInterface.BlankNode.prototype.toString;
    //window['RDFJSInterface']['BlankNode']['prototype']['toNT'] = RDFJSInterface.BlankNode.prototype.toNT;
    //window['RDFJSInterface']['BlankNode']['prototype']['valueOf'] = RDFJSInterface.BlankNode.prototype.valueOf;

    //window['RDFJSInterface']['Literal'] = RDFJSInterface.Literal;
    //window['RDFJSInterface']['Literal']['prototype']['toString'] = RDFJSInterface.Literal.prototype.toString;
    //window['RDFJSInterface']['Literal']['prototype']['toNT'] = RDFJSInterface.Literal.prototype.toNT;
    //window['RDFJSInterface']['Literal']['prototype']['valueOf'] = RDFJSInterface.Literal.prototype.valueOf;

    //window['RDFJSInterface']['NamedNode'] = RDFJSInterface.NamedNode;
    //window['RDFJSInterface']['NamedNode']['prototype']['toString'] = RDFJSInterface.NamedNode.prototype.toString;
    //window['RDFJSInterface']['NamedNode']['prototype']['toNT'] = RDFJSInterface.NamedNode.prototype.toNT;
    //window['RDFJSInterface']['NamedNode']['prototype']['valueOf'] = RDFJSInterface.NamedNode.prototype.valueOf;

    //window['RDFJSInterface']['Triple'] = RDFJSInterface.Triple;
    //window['RDFJSInterface']['Triple']['prototype']['equals'] = RDFJSInterface.Triple.prototype.equals;
    //window['RDFJSInterface']['Triple']['prototype']['toString'] = RDFJSInterface.Triple.prototype.toString;

    //window['RDFJSInterface']['Graph'] = RDFJSInterface.Graph;
    //window['RDFJSInterface']['Graph']['prototype']['add'] = RDFJSInterface.Graph.prototype.add;
    //window['RDFJSInterface']['Graph']['prototype']['addAction'] = RDFJSInterface.Graph.prototype.addAction;
    //window['RDFJSInterface']['Graph']['prototype']['addAll'] = RDFJSInterface.Graph.prototype.addAll;
    //window['RDFJSInterface']['Graph']['prototype']['remove'] = RDFJSInterface.Graph.prototype.remove;
    //window['RDFJSInterface']['Graph']['prototype']['toArray'] = RDFJSInterface.Graph.prototype.toArray;
    //window['RDFJSInterface']['Graph']['prototype']['some'] = RDFJSInterface.Graph.prototype.some;
    //window['RDFJSInterface']['Graph']['prototype']['every'] = RDFJSInterface.Graph.prototype.every;
    //window['RDFJSInterface']['Graph']['prototype']['filter'] = RDFJSInterface.Graph.prototype.filter;
    //window['RDFJSInterface']['Graph']['prototype']['forEach'] = RDFJSInterface.Graph.prototype.forEach;
    //window['RDFJSInterface']['Graph']['prototype']['merge'] = RDFJSInterface.Graph.prototype.merge;
    //window['RDFJSInterface']['Graph']['prototype']['match'] = RDFJSInterface.Graph.prototype.match;
    //window['RDFJSInterface']['Graph']['prototype']['removeMatches'] = RDFJSInterface.Graph.prototype.removeMatches;
    //window['RDFJSInterface']['Graph']['prototype']['toNT'] = RDFJSInterface.Graph.prototype.toNT;

    //window['RDFJSInterface']['rdf'] = RDFJSInterface.rdf;
  } else {
    module.exports = RDFJSInterface;
  }
}catch(e){}
})();
__END

  of << js_code;
end

def write_test_min_preamble(of)
  js_code =<<__END
var Store = require('./rdf_store_min.js');

console.log(Store);

var Lexicon = {};
Lexicon.Lexicon = function(f) {
    Store.create(function(store) {
        store.execute = function() {
            if(arguments.length === 2) {
                this.engine.execute(arguments[0],
                                    arguments[1]);
            } else if(arguments.length === 4) {
                this.engine.execute(arguments[0],
                                    arguments[1],
                                    arguments[2],
                                    arguments[3]);
            }
        };
        f(store);
    });
};

var QuadBackend = {};
QuadBackend.QuadBackend = function(opts,f) {
    f(opts);
};

var QueryEngine = {};
QueryEngine.QueryEngine = function(opts) {
    return opts.lexicon;
};
__END

  of << js_code;
end

def process_files_for_test_min
  File.open("./dist/nodejs/test_min.js", "w") do |of|
    
    write_test_min_preamble(of)
    
    File.open("./src/js-query-engine/test/test_cases.js", "r") do |f|
      puts "*** Adding W3C test cases to test file"
      f.each_line do |line|
        if(line =~ /[a-zA-Z0-9 =]*require/) == 0
          puts " * ignoring require"
        else
          of << line
        end
      end
    end
  end
end

def process_file_for_nodejs(of, f)
  f.each_line do |line|
    if (line =~ /exports\.[a-zA-Z0-9]+ *= *\{ *\};/) == 0
      puts " * modifying: #{line} -> #{line.split("exports.")[1]}"
      of << ("var "+line.split("exports.")[1])
    elsif (line =~/var QueryPlan = require/) == 0
      puts " * modifying #{line} -> var QueryPlan = QueryPlanDPSize;"
      of << "var QueryPlan = QueryPlanDPSize;";
    elsif (line =~ /var RDFStoreClient *= *require\(['\"]{1,1}[a-zA-Z0-9_\.\/-]*['\"]{1,1}\)\./) == 0
      puts " * writing right RDFStoreClient"
      tree = line.split(".")[-1];
      of << "var RDFStoreClient = RDFStoreChildClient;"
    elsif (line =~ /var *([a-zA-Z0-9]+) *= *exports\.\1;/) == 0
      puts " * ignoring: #{line}"
    elsif (line =~ /var Worker *= *require/) == 0
      puts " * ignoring: #{line}"
    elsif (line =~ /var *([a-zA-Z0-9]+) *= *require\(['\"]{1,1}[a-zA-Z0-9_\.\/-]*['\"]{1,1}\)\.\1;/) == 0
      puts " * ignoring: #{line}"
    elsif (line =~ /var *([a-zA-Z0-9]+) *= *require\(__dirname\+['\"]{1,1}[a-zA-Z0-9_\.\/-]*['\"]{1,1}\)\.\1;/) == 0
      puts " * ignoring: #{line}"
    elsif (line =~ /var BaseTree *= *require\(['\"]{1,1}[a-zA-Z0-9_\.\/-]*['\"]{1,1}\)\./) == 0
      puts " * writing right MemoryTree"
      tree = line.split(".")[-1];
      of << "var BaseTree = #{tree}"
    elsif (line =~ /[\w\d\s]*RVN3Parser;$/)
      puts " * Adding N3 Parser"
      of << "var N3Parser = RVN3Parser;";
    else
      # require for YUI compressor
      line.gsub!('dataset.default', "dataset['default']")
      line.gsub!("default:[]","'default':[]")
      line.gsub!("Callbacks.deleted","____TMP_DOT_DELETE____");
      line.gsub!(".delete","['delete']");
      line.gsub!("____TMP_DOT_DELETE____","Callbacks.deleted");
      line.gsub!(".extends","['extends']");
      line.gsub!(".with","['with']");
      line.gsub!(".using","['using']");
      of << line
    end
  end
end

def process_files_for_nodejs
  `cp ./bin/rdfstorejs ./dist/nodejs/bin/`
  `cp ./src/js-store/src/server.js ./dist/nodejs/server.js`
  File.open("./dist/nodejs/index.js", "w") do |of|
    
    write_nodejs_preamble(of)
    
    BUILD_CONFIGURATION[:nodejs][:modules].each do |module_file|
      puts "*** processing #{module_file}"
      File.open(module_file, "r") do |f|
        process_file_for_nodejs(of, f)
        of << "\r\n// end of #{module_file} \r\n"
      end
    end

  
    File.open("./src/js-communication/src/tcp_transport.js", "r") do |f|
      puts "*** processing TCP Transport file"
      process_file_for_nodejs(of, f)
    end
  
    write_nodejs_coda(of)
  end
end

def process_files_for_rdf_interface_api
  File.open("./dist/rdf_interface_api/index.js", "w") do |of|
    
    write_nodejs_preamble(of)
    
    BUILD_CONFIGURATION[:rdf_js_interface][:modules].each do |module_file|
      puts "*** processing #{module_file}"
      File.open(module_file, "r") do |f|
        process_file_for_nodejs(of, f)
        of << "\r\n// end of #{module_file} \r\n"
      end
    end

    write_rdf_interfaces_api_coda(of)
  end
end

def make_package_json
  puts "*** generating package.json"
  package_config = BUILD_CONFIGURATION[:nodejs][:package].to_json
  File.open("./dist/nodejs/package.json", 'w') do |of|
    of << package_config
  end
end

def make_rdf_interface_api_package_json
  puts "*** generating package.json"
  package_config = BUILD_CONFIGURATION[:rdf_js_interface][:package].to_json
  File.open("./dist/rdf_interface_api/package.json", 'w') do |of|
    of << package_config
  end
  `mkdir ./dist/rdf_interface_api/nodejs`
  `mv ./dist/rdf_interface_api/package.json ./dist/rdf_interface_api/nodejs/`
  `mv ./dist/rdf_interface_api/index.js ./dist/rdf_interface_api/nodejs/`
  `mkdir ./dist/rdf_interface_api/browser`
  `mv ./dist/rdf_interface_api/rdf_interface_api*.js ./dist/rdf_interface_api/browser/`
  `cp -f ./dist/rdf_interface_api/browser/* ./browsertests/rdf_interface_api/`    
end

def npm_linking
  exec 'cd ./dist/nodejs && npm link'
end

def make_nodejs
  puts "  NODEJS CONFIGURATION"
  load_configuration
  build_distribution_directory 'nodejs'
  process_files_for_nodejs
  make_package_json
  #npm_linking
  puts "\r\n*** FINISHED";
end


def write_browser_preamble(of)
  js_code =<<__END
(function() {\r\n

  if(typeof(console)=='undefined') {
     console = {};
     console.log = function(e){};
  }
  
  window.process = {};
  process.nextTick = function(f) {
    setTimeout(f,0);
  };
__END
  of << js_code
end

def process_file_for_browser(output, f)
  of = ''
  f.each_line do |line|
    if (line =~ /exports\.[a-zA-Z0-9]+ *= *\{ *\};/) == 0
      puts " * modifying: #{line} -> var #{line.split("exports.")[1]}"
      of << "var #{line.split('exports.')[1]}"
    elsif (line =~ /module\.exports|var N3\w+ = require/) == 0
      puts " * ignoring: #{line}"
    elsif (line =~/var QueryPlan = require/) == 0
      of << "var QueryPlan = QueryPlanDPSize;"
    elsif (line =~ /var QueryEngine = require/) == 0
      # Replace the line we are ignoring
      of << "var MongodbQueryEngine = { MongodbQueryEngine: function(){ throw 'MongoDB backend not supported in the browser version' } };\n"
    elsif (line =~ /var *([a-zA-Z0-9]+) *= *exports\.\1;/) == 0
      puts " * ignoring: #{line}"
    elsif (line =~ /var *([a-zA-Z0-9]+) *= *require\(['\"]{1,1}[a-zA-Z0-9_\.\/-]*['\"]{1,1}\)\.\1;/) == 0
      puts " * ignoring: #{line}"
    elsif (line =~ /var *([a-zA-Z0-9]+) *= *require\(__dirname\+['\"]{1,1}[a-zA-Z0-9_\.\/-]*['\"]{1,1}\)\.\1;/) == 0
      puts " * ignoring: #{line}"
    elsif (line =~ /var RDFStoreClient *= *require\(['\"]{1,1}[a-zA-Z0-9_\.\/-]*['\"]{1,1}\)\./) == 0
      puts " * writing right RDFStoreClient"
      tree = line.split(".")[-1];
      of << "var RDFStoreClient = RDFStoreClient;"
    elsif (line =~ /var *([a-zA-Z0-9]+) *= *require\(['\"]webworker[\"']\);/)
      puts " * ignoring require for NodeJS WebWorkers: #{line}"  
    elsif (line =~ /[\w\d\s]*RVN3Parser;$/)
      puts " * Adding N3 Parser"
      of << "var N3Parser = RVN3Parser;";
    elsif (line =~ /var BaseTree *= *require\(['\"]{1,1}[a-zA-Z0-9_\.\/-]*['\"]{1,1}\)\./) == 0
      puts " * writing right MemoryTree"
      tree = line.split(".")[-1];
      of << "var BaseTree = #{tree}"
    else
      # require for YUI compressor
      line.gsub!('dataset.default', "dataset['default']")
      line.gsub!("default:[]","'default':[]")
      line.gsub!("Callbacks.deleted","____TMP_DOT_DELETE____");
      line.gsub!(".delete","['delete']");
      line.gsub!("____TMP_DOT_DELETE____","Callbacks.deleted");
      line.gsub!(".extends","['extends']");
      line.gsub!(".with","['with']");
      line.gsub!(".using","['using']");
      of << line
    end
  end
  # remove trailing commas for IE
  of.gsub!(/,\s*\}/, '}')
  output << of
end

def process_file_for_browser_persistent(output, f)
  of = ''
  f.each_line do |line|
    if (line =~ /exports\.[a-zA-Z0-9]+ *= *\{ *\};/) == 0
      puts " * modifying: #{line} -> var #{line.split("exports.")[1]}"
      of << "var #{line.split('exports.')[1]}"
    elsif (line =~ /module\.exports|var N3\w+ = require/) == 0
      puts " * ignoring: #{line}"
    elsif (line =~/var QueryPlan = require/) == 0
      of << "var QueryPlan = QueryPlanDPSize;"
    elsif (line =~ /var QueryEngine = require/) == 0
      # Replace the line we are ignoring
      of << "var MongodbQueryEngine = { MongodbQueryEngine: function(){ throw 'MongoDB backend not supported in the browser version' } };\n"
    elsif (line =~ /var BaseTree *= *require\(['\"]{1,1}[a-zA-Z0-9_\.\/-]*['\"]{1,1}\)\./) == 0
      puts " * writing Persistent Memory Tree"
      of << "var BaseTree = WebLocalStorageBTree;"
    elsif (line =~ /var Lexicon *= *require\(['\"]{1,1}[a-zA-Z0-9_\.\/-]*['\"]{1,1}\)\./) == 0
      puts " * writing Persistent Lexicon"
      of << "var Lexicon = WebLocalStorageLexicon;"
    elsif (line =~ /var *([a-zA-Z0-9]+) *= *exports\.\1;/) == 0
      puts " * ignoring: #{line}"
    elsif (line =~ /var *([a-zA-Z0-9]+) *= *require\(['\"]{1,1}[a-zA-Z0-9_\.\/-]*['\"]{1,1}\)\.\1;/) == 0
      puts " * ignoring: #{line}"
    elsif (line =~ /var *([a-zA-Z0-9]+) *= *require\(__dirname\+['\"]{1,1}[a-zA-Z0-9_\.\/-]*['\"]{1,1}\)\.\1;/) == 0
      puts " * ignoring: #{line}"
    elsif (line =~ /[\w\d\s]*RVN3Parser;$/)
      puts " * Adding N3 Parser"
      of << "var N3Parser = RVN3Parser;";
    elsif (line =~ /var RDFStoreClient *= *require\(['\"]{1,1}[a-zA-Z0-9_\.\/-]*['\"]{1,1}\)\./) == 0
      puts " * writing right RDFStoreClient"
      tree = line.split(".")[-1];
      of << "var RDFStoreClient = RDFStoreClient;"
    elsif (line =~ /var *([a-zA-Z0-9]+) *= *require\(['\"]webworker[\"']\);/)
      puts " * ignoring require for NodeJS WebWorkers: #{line}"  
    else
      # require for YUI compressor
      line.gsub!('dataset.default', "dataset['default']")
      line.gsub!("default:[]","'default':[]")
      line.gsub!("Callbacks.deleted","____TMP_DOT_DELETE____");
      line.gsub!(".delete","['delete']");
      line.gsub!("____TMP_DOT_DELETE____","Callbacks.deleted");
      line.gsub!(".extends","['extends']");
      line.gsub!(".with","['with']");
      line.gsub!(".using","['using']");
      of << line
    end
  end
  # remove trailing commas for IE
  of.gsub!(/,\s*\}/, '}')
  output << of
end

def write_browser_coda(of)
  js_code =<<__END
try {
  window.rdfstore = Store;
} catch(e) { }
})();
__END

  of << js_code;
end

def process_files_for_browser
  File.open("./dist/browser/rdf_store.js", "w") do |of|
    
    if BUILD_CONFIGURATION[:browser][:load_jquery]
      File.open("./src/js-communication/src/jquery_ajax.js", "r") do |f|
        f.each_line do |line|
          of << line
        end
      end
    end

    
    write_browser_preamble(of)
    
    BUILD_CONFIGURATION[:browser][:modules].each do |module_file|
      puts "*** processing #{module_file}"
      File.open(module_file, "r") do |f|
        process_file_for_browser(of, f)
        of << "\r\n// end of #{module_file} \r\n"
      end
    end

    write_browser_coda(of)
  end
end

def process_files_for_browser_persistent
  File.open("./dist/browser_persistent/rdf_store.js", "w") do |of|

    if BUILD_CONFIGURATION[:browser_persistent][:load_jquery]
      File.open("./src/js-communication/src/jquery_ajax.js", "r") do |f|
        f.each_line do |line|
          of << line
        end
      end
    end

    
    write_browser_preamble(of)
    
    BUILD_CONFIGURATION[:browser_persistent][:modules].each do |module_file|
      puts "*** processing #{module_file}"
      File.open(module_file, "r") do |f|
        process_file_for_browser_persistent(of, f)
        of << "\r\n// end of #{module_file} \r\n"
      end
    end

    write_browser_coda(of)
  end
end

def make_browser
  puts "  BROWSER CONFIGURATION"
  load_configuration
  build_distribution_directory 'browser'
  process_files_for_browser
  minimize_output_browser
  puts "\r\n*** FINISHED";
end

def make_browser_persistent
  puts "  BROWSER PERSISTENT CONFIGURATION"
  load_configuration
  build_distribution_directory 'browser_persistent'
  process_files_for_browser_persistent
  minimize_output_browser_persistent
  puts "\r\n*** FINISHED";
end

def make_rdf_interface_api
  puts "  RDF JS INTERFACE API CONFIGURATION"
  load_configuration
  build_distribution_directory 'rdf_interface_api'
  process_files_for_rdf_interface_api
  minimize_output_rdf_interface_api
  make_rdf_interface_api_package_json
  puts "\r\n*** FINISHED";
end

def test_minimized
  puts "  MINIMIZED NODEJS CONFIGURATION"
  load_configuration
  build_distribution_directory 'nodejs'
  process_files_for_nodejs
  process_files_for_test_min
  minimize_output_nodejs
  puts `cd ./dist/nodejs && ../../#{NODEUNIT} ./test_min.js`
  puts "\r\n*** FINISHED";
end


if ARGV.length != 1
  puts "USAGE make.rb [nodejs | browser | browser_persistent | rdf_interface_api | tests | test_min]"
else
  if ARGV[0] == "nodejs"
    make_nodejs
  elsif ARGV[0] == "browser"
    make_browser
  elsif ARGV[0] == "browser_persistent"
    make_browser_persistent
  elsif ARGV[0] == "rdf_interface_api"
    make_rdf_interface_api
  elsif ARGV[0] == "test_min"
    test_minimized
  elsif ARGV[0] == "tests"
    exec "#{NODEUNIT} ./src/js-trees/tests/*.js ./src/js-store/test/*.js ./src/js-sparql-parser/test/*.js ./src/js-rdf-persistence/test/*.js ./src/js-query-engine/test/*.js ./src/js-communication/test/*.js ./src/js-connection/tests/*.js"
  else
    puts "Unknown configuration: #{ARGV[0]}"
    puts "USAGE make.rb [nodejs | browser | browser_persistent | rdf_interface_api | tests | test_min]"
  end
end
