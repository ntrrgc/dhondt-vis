var gulp = require('gulp');
var coffee = require('gulp-coffee');
var gutil = require('gulp-util');
var livereload = require('gulp-livereload');

gulp.task('coffee', function() {
  gulp.src('./src/*.coffee')
    .pipe(coffee({bare: true}).on('error', gutil.log))
    .pipe(gulp.dest('./public/'))
    .pipe(livereload())
});

gulp.task('notify', function() {
  gulp.src('./src/*.js')
  .pipe(livereload())
})

gulp.task('watch', function() {
  livereload.listen();
  gulp.watch('src/*.coffee', ['coffee'])
  gulp.watch('src/*.js', ['notify'])
  // gulp.watch('*.css', ['notify'])
  gulp.watch('*.html', ['notify'])
})
