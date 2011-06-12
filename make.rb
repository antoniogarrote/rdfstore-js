#!/usr/bin/env ruby

require 'rubygems'
require 'fileutils'
require 'json'

def load_configuration
  puts "*** loading configuration"
  require(File.dirname(__FILE__)+"/configuration")
end

def build_distribution_directory(system);
  begin
    puts "*** building distribution directory"
    Dir.mkdir "./dist"
    Dir.mkdir "./dist/browser"
    Dir.mkdir "./dist/nodejs"
  rescue 
    puts "(!) dist directory already exits"
    FileUtils.rm_r("./dist/browser/") if system == 'browser'
    FileUtils.rm_r("./dist/nodejs/") if system == 'nodejs'
    Dir.mkdir "./dist/browser" if system == 'browser'
    Dir.mkdir "./dist/nodejs" if system == 'nodejs'
  end
end

def minimize_output_browser
  puts "*** minimizing output"
  `cp ./yuicompressor-2.4.6.jar ./dist/browser/`
  `cd ./dist/browser && java -jar yuicompressor-2.4.6.jar rdf_store.js > rdf_store_min.js`
  `rm ./dist/browser/yuicompressor-2.4.6.jar`
end

def write_nodejs_preamble(of)
  js_code =<<__END
(function() {\r\n
__END
  of << js_code
end


def write_nodejs_coda(of)
  js_code =<<__END
module.exports = Store;
})();
__END

  of << js_code;
end

def process_file_for_nodejs(of, f) 
  f.each_line do |line|
    if (line =~ /exports\.[a-zA-Z]+ *= *\{ *\};/) == 0
      puts " * modifying: #{line} -> #{line.split("exports.")[1]}"
      of << line.split("exports.")[1]
    elsif (line =~ /var *([a-zA-Z]+) *= *exports\.\1;/) == 0
      puts " * ignoring: #{line}"
    elsif (line =~ /var *([a-zA-Z]+) *= *require\(['\"]{1,1}[a-zA-Z_\.\/-]*['\"]{1,1}\)\.\1;/) == 0
      puts " * ignoring: #{line}"
    elsif (line =~ /var BaseTree *= *require\(['\"]{1,1}[a-zA-Z_\.\/-]*['\"]{1,1}\)\./) == 0
      puts " * writing right MemoryTree"
      tree = line.split(".")[-1];
      of << "var BaseTree = #{tree}"
    else
      # require for YUI compressor
      line.gsub!('dataset.default', "dataset['default']")
      line.gsub!("default:[]","'default':[]")
      line.gsub!(".while","meanwhile");
      line.gsub!(".delete","['delete']");
      line.gsub!(".extends","['extends']");
      line.gsub!(".with","['with']");
      line.gsub!(".using","['using']");
      of << line
    end
  end
end

def process_files_for_nodejs
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

def make_package_json
  puts "*** generating package.json"
  package_config = BUILD_CONFIGURATION[:nodejs][:package].to_json
  File.open("./dist/nodejs/package.json", 'w') do |of|
    of << package_config
  end
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
__END
  of << js_code
end

def process_file_for_browser(of, f) 
  f.each_line do |line|
    if (line =~ /exports\.[a-zA-Z]+ *= *\{ *\};/) == 0
      puts " * modifying: #{line} -> var #{line.split("exports.")[1]}"
      of << "var #{line.split('exports.')[1]}"
    elsif (line =~ /var *([a-zA-Z]+) *= *exports\.\1;/) == 0
      puts " * ignoring: #{line}"
    elsif (line =~ /var *([a-zA-Z]+) *= *require\(['\"]{1,1}[a-zA-Z_\.\/-]*['\"]{1,1}\)\.\1;/) == 0
      puts " * ignoring: #{line}"
    elsif (line =~ /var BaseTree *= *require\(['\"]{1,1}[a-zA-Z_\.\/-]*['\"]{1,1}\)\./) == 0
      puts " * writing right MemoryTree"
      tree = line.split(".")[-1];
      of << "var BaseTree = #{tree}"
    else
      # require for YUI compressor
      line.gsub!('dataset.default', "dataset['default']")
      line.gsub!("default:[]","'default':[]")
      line.gsub!(".while","meanwhile");
      line.gsub!(".delete","['delete']");
      line.gsub!(".extends","['extends']");
      line.gsub!(".with","['with']");
      line.gsub!(".using","['using']");
      of << line
    end
  end
end

def write_browser_coda(of)
  js_code =<<__END
window.rdfstore = Store;
})(window);
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

def make_browser
  puts "  BROWSER CONFIGURATION"
  load_configuration
  build_distribution_directory 'browser'
  process_files_for_browser
  minimize_output_browser
  puts "\r\n*** FINISHED";
end


if ARGV.length != 1
  puts "USAGE make.rb [nodejs | browser | tests]"
else
  if ARGV[0] == "nodejs"
    make_nodejs
  elsif ARGV[0] == "browser"
    make_browser
  elsif ARGV[0] == "tests"
    exec 'nodeunit ./src/js-trees/tests/* ./src/js-store/test/* ./src/js-sparql-parser/test/* ./src/js-rdf-persistence/test/* ./src/js-query-engine/test/* ./src/js-communication/test/*'
  else
    puts "Unknown configuration: #{ARGV[0]}"
    puts "USAGE make.rb [nodejs | browser | tests]"
  end
end
