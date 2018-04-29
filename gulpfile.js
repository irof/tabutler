const gulp = require('gulp');
const eslint = require('gulp-eslint');

gulp.task('default', () => {
  gulp.src(['src/**/*.js'])
    .pipe(eslint())
    .pipe(eslint.format());
});

gulp.task('test', () => {
  console.log('NOTHING TO DO');
});

