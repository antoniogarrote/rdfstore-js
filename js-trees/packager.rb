require 'yaml'

output_module = ARGV[0] || "JSTrees"
output_path =  ARGV[1] || "out.js"
modules = YAML.load(File.open("./export.yml","r").read)

File.open(output_path,"w") do |out|
  out << "#{output_module} = {};\n"
  out << "(function(){"

  modules.each do |module_name|
    to_read_path = "./src/#{module_name}.js"
    out << "\n// Including #{module_name} from ./src/#{module_name}.js\n"
    jsin = File.open(to_read_path, "r").each_line do |l|
      l.gsub!("exports", output_module)
      out << "\t#{l}" if l.index("require(").nil?
    end

  end

  out << "})();"
end
