var gulp = require('gulp');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var jasmine = require('gulp-jasmine');

gulp.task('browserify', function() {
    return browserify('./src/main.js')
        .bundle()
        .pipe(source('jsondb.js'))
        .pipe(gulp.dest('./build'));
});

gulp.task('performance',function(){
    require('./src/perftest/trees');
});

gulp.task('specs', function () {
    return gulp.src('./spec/*.js')
        .pipe(jasmine());
});

gulp.task('default', ['browserify']);