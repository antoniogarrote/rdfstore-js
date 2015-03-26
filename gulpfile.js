var gulp = require('gulp');
var browserify = require('browserify');
//var browserify = require('gulp-browserify');
var rename     = require('gulp-rename');
var closureCompiler = require('gulp-closure-compiler');
var source = require('vinyl-source-stream');
var jasmine = require('gulp-jasmine');
var PEG = require('pegjs');
var fs = require('fs');


gulp.task('browserify', function() {
/*
    return gulp.src(['./src/store.js'])
        .pipe(browserify({
            standalone: 'rdfstore',
            exclude: ["sqlite3","indexeddb-js"]
        }))
        .pipe(rename('rdfstore.js'))
        .pipe(gulp.dest('./dist'));
*/

    return browserify('./src/store.js',{standalone: 'rdfstore'})
        .exclude("sqlite3")
        .exclude("indexeddb-js")
        // Should we bundle this as dependencies?
        //.external("jsonld")
        //.external("n3")
        .bundle()
     .pipe(source('rdfstore.js'))
        .pipe(gulp.dest('./dist'));

});

gulp.task('minimize', function() {
    return gulp.src('dist/*.js')
        .pipe(closureCompiler({
            compilerPath: './node_modules/closure-compiler/lib/vendor/compiler.jar',
            fileName: 'dist/rdfstore_min.js',
            compilerFlags: {
                'language_in': 'ECMASCRIPT5'
                //'compilation_level': 'ADVANCED_OPTIMIZATIONS'
            }
        }));
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

gulp.task('default', ['parseGrammar', 'specs']);