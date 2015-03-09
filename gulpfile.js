var gulp = require('gulp');
var browserify = require('browserify');
var debowerify = require("debowerify");
var bowerResolve = require('bower-resolve');
var closureCompiler = require('gulp-closure-compiler');
var source = require('vinyl-source-stream');
var jasmine = require('gulp-jasmine');
var PEG = require('pegjs');
var fs = require('fs');


gulp.task('browserify', function() {
    return browserify('./src/store.js')
        .bundle()
        .pipe(source('rdfstore.js'))
        .pipe(gulp.dest('./build'));
});

gulp.task('bowerify', function(){
    bowerResolve.init(function () {
        var b = browserify('./src/store.js');
        b.external(bowerResolve('moment'));
        b.external(bowerResolve('async'));
        b.external(bowerResolve('lodash'));
        b.external(bowerResolve('n3js'));
        b.transform('debowerify');

        b.bundle().pipe(fs.createWriteStream('./build/bundle.js'));
    });
});

gulp.task('performance',function(){
    require('./src/perftest/trees');
});

gulp.task('specs', function () {
    return gulp.src('./spec/*.js')
        .pipe(jasmine({includeStackTrace: true, verbose:true}));
});

gulp.task('parseGrammar', function(){
    fs.readFile('pegjs/sparql_query.grammar', 'utf8', function(err, grammar){
        if(err) {
            throw err;
        } else {
            var parser =  PEG.buildParser(grammar, {output: 'source', optimize: 'size'});
            fs.unlinkSync('src/parser.js');
            fs.writeFileSync('src/parser.js',"module.exports = "+parser);
        }
    })
});

gulp.task('minimize', function() {
    return gulp.src('build/*.js')
        .pipe(closureCompiler({
            compilerPath: './node_modules/closure-compiler/lib/vendor/compiler.jar',
            fileName: 'dist/rdfstore.js',
            compilerFlags: {
                'language_in': 'ECMASCRIPT5'
//                'compilation_level': 'ADVANCED_OPTIMIZATIONS'
            }
        }))
});

gulp.task('default', ['parseGrammar', 'specs', 'browserify', 'minimize']);