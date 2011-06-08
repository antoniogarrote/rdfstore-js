#!/usr/bin/env ruby

require 'fileutils'

def load_configuration
  puts "*** loading configuration"
  require(File.dirname(__FILE__)+"/configuration")
end

def build_distribution_directory
  begin
    puts "*** building distribution directory"
    Dir.mkdir "./dist"
  rescue 
    puts "(!) dist directory already exits"
    FileUtils.rm_r("./dist")
    Dir.mkdir "./dist"
  end
end

def write_nodejs_preamble(of)
  js_code =<<__END
(function() {\r\n
__END
  of << js_code
end


def write_nodejs_coda(of)
  js_code =<<__END
module.exports = Store.Store;
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
  File.open("./dist/js_sparql.js", "w") do |of|
    
    write_nodejs_preamble(of)
    
    BUILD_CONFIGURATION[:nodejs][:modules].each do |module_file|
      puts "*** processing #{module_file}"
      File.open(module_file, "r") do |f|
        process_file_for_nodejs(of, f)
        of << "\r\n// end of #{module_file} \r\n"
      end
    end

  
    File.open("./js-communication/src/tcp_transport.js", "r") do |f|
      puts "*** processing TCP Transport file"
      process_file_for_nodejs(of, f)
    end
  
    write_nodejs_coda(of)
  end
end

def make_nodejs
  puts "  NODEJS CONFIGURATION"
  load_configuration
  build_distribution_directory
  process_files_for_nodejs
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
window.sparqlStore = Store.Store;
})(window);
__END

  of << js_code;
end

def process_files_for_browser
  File.open("./dist/js_sparql.js", "w") do |of|
    
    if BUILD_CONFIGURATION[:browser][:load_jquery]
      File.open("./js-communication/src/jquery_ajax.js", "r") do |f|
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
  build_distribution_directory
  process_files_for_browser
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
    exec 'nodeunit ./js-trees/tests/* ./js-store/test/* ./js-sparql-parser/test/* ./js-rdf-persistence/test/* ./js-query-engine/test/* ./js-communication/test/*'
  else
    puts "Unknown configuration: #{ARGV[0]}"
    puts "USAGE make.rb [nodejs | browser | tests]"
  end
end
