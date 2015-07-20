'use strict';

var fs = require('fs');
var browserSync = require('browser-sync');
var browserify = require('browserify');
var program = require('commander');

var gulp = require('gulp');
var gulpif = require('gulp-if');
var gutil = require('gulp-util');
var buffer = require('gulp-buffer');
var cssmin = require('gulp-cssmin');
var ignore = require('gulp-ignore');
var imagemin = require('gulp-imagemin');
var jade = require('gulp-jade');
var rename = require('gulp-rename');
var size = require('gulp-size');
var stylus = require('gulp-stylus');
var source = require('vinyl-source-stream');
var uglify = require('gulp-uglify');
var zip = require('gulp-zip');
var watch = require('gulp-watch');

var cfg = require('../config');

program.on('--help', function () {
  console.log('  Tasks:');
  console.log();
  console.log('    build:all\t\tbuild the game and all assets');
  console.log('    build:audio\t\tbuild audio assets');
  console.log('    build:fonts\t\tbuild fonts assets');
  console.log('    build:images\tbuild images assets');
  console.log('    build:html\t\tconvert Jade files to HTML files');
  console.log('    build:js\t\tbuild JS files');
  console.log('    build:css\t\tconvert Stylus files to CSS files');
  console.log('    build:vendors\tbuild vendors files');
  console.log();
  console.log('    clean:all\t\tremove all generated files');
  console.log('    clean:audio\t\tremove generated audio assets');
  console.log('    clean:fonts\t\tremove generated fonts assets');
  console.log('    clean:images\tremove generated images assets');
  console.log('    clean:html\t\tremove generated HTML files');
  console.log('    clean:js\t\tremove generated JS files');
  console.log('    clean:css\t\tremove generated CSS files');
  console.log('    clean:vendors\tremove generated vendors files');
  console.log();
  console.log('    serve\t\tlaunch local server');
  console.log('    watch\t\twatch for file changes and rebuild automatically');
  console.log();
});

program
  .option('-p, --prod', 'enforce production environment')
  .option('-c, --compress', 'produce a zip package')
  .parse(process.argv);

gulp.task('build:all', [
  'build:audio',
  'build:fonts',
  'build:images',
  'build:html',
  'build:js',
  'build:css',
  'build:vendors'
]);

gulp.task('build:audio', function () {
  var src = './assets/audio/**/*';
  return gulp.src(src)
    .pipe(watch(src))
    .pipe(gulp.dest('./build/assets/audio/'))
    .pipe(browserSync.reload({stream: true, once: true}));
});

gulp.task('build:fonts', function () {
  var src = './assets/fonts/**/*';
  return gulp.src(src)
    .pipe(watch(src))
    .pipe(gulp.dest('./build/assets/fonts'))
    .pipe(browserSync.reload({stream: true, once: true}));
});

gulp.task('build:images', function () {
  var src = ['./assets/*.jpg', './assets/*.png']
  return gulp.src(src)
    .pipe(watch(src))
    .pipe(imagemin())
    .pipe(gulp.dest('./build/assets/'))
    .pipe(browserSync.reload({stream: true, once: true}));
});

gulp.task('build:html', function () {
  var src = './src/*jade';
  return gulp.src(src)
    .pipe(watch(src))
    .pipe(jade({
      pretty: !program.prod,
      data: {
        name: cfg.name,
        debug: !program.prod
      }
    }))
    .pipe(gulp.dest('./build/'))
    .pipe(browserSync.reload({stream: true}));
});

gulp.task('build:js', function () {
  var src = './src/scripts/main.js';
  return browserify(src, {debug: !program.prod})
    .pipe(watch(src))
    .bundle()
    .on('error', onBrowserifyError)
    .pipe(source('game.js'))
    .pipe(buffer())
    .pipe(gulpif(program.prod, uglify()))
    .pipe(gulpif(program.prod, rename('game.min.js')))
    .pipe(gulp.dest('./build/js/'))
    .pipe(browserSync.reload({stream: true, once: true}));
});

gulp.task('build:css', function () {
  var src = './src/stylesheets/*.styl';
  return gulp.src(src)
    .pipe(watch(src))
    .pipe(stylus())
    .pipe(buffer())
    .pipe(gulpif(program.prod, cssmin()))
    .pipe(gulp.dest('./build/css/'))
    .pipe(browserSync.reload({stream: true}));
});

gulp.task('build:vendors', function () {
  // TODO: Improve to automatically include vendors, concatenate and uglyfy them
  var bowerConfig = JSON.parse(fs.readFileSync('./.bowerrc', 'utf8'));

  return gulp.src('./' + bowerConfig['directory'] + '/phaser/build/phaser*')
    .pipe(ignore('*.ts'))
    .pipe(gulp.dest('./build/js/'));
});

gulp.task('build:dist', ['build:all'], function () {
  if (!program.prod) {
    gutil.log(gutil.colors.yellow('WARNING'), gutil.colors.grey('Missing flag --prod'));
    gutil.log(gutil.colors.yellow('WARNING'), gutil.colors.grey('You should switch to prod environment'));
  }

  return gulp.src('./build/**/*')
    .pipe(gulpif(program.compress, zip('build.zip')))
    .pipe(size())
    .pipe(gulp.dest('./dist/'))
});

function onBrowserifyError(err) {
  //gutil(gutil.colors.red('ERROR'), gutil.colors.grey(err.message));
  console.log(err.message);
  this.emit('end');
};
