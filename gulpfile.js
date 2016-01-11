'use strict';

//let connect = require('gulp-connect');
let gulp = require('gulp');
let jade = require('gulp-jade');
let livereload = require('gulp-livereload');

gulp.task('templates', function() {
  var YOUR_LOCALS = {};
 
  gulp.src('./jade/*.jade')
    .pipe(jade({
      locals: YOUR_LOCALS
    }))
    .pipe(gulp.dest('./dist/'))
    .pipe(livereload());
});

gulp.task('watch', function() {
  livereload.listen();
  gulp.watch('jade/*.jade', ['templates']);
});


/*
gulp.task('server', () => {
	connect.server();
});
*/

gulp.task('default', ['templates', 'watch']);