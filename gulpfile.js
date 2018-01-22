global.__BASE = __dirname;
var __BASE = __dirname;

var gulp = require('gulp');
var util = require('gulp-util');
var sass = require('gulp-sass');
var cleancss = require('gulp-clean-css');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var header = require('gulp-header');

var path = require('path');
var del = require('del');
var browserify = require('browserify');
var watchify = require('watchify');
var source = require('vinyl-source-stream');

var mocha = require('gulp-mocha');
var istanbul = require('gulp-istanbul');

var pkg = require('./package.json');

// Created bundle files
// var _bundledCssName = pkg.name + '.css';
// var _bundledJsName = pkg.name + '.js';
var _bundledCssName = 'bundle.css';
var _bundledJsName = 'bundle.js';

var config = {
  // Source files
  sassPath: './src/sass',
  mainScss: path.join('src', 'scss', 'main.scss'),
  mainJs: path.join('src', 'js', 'main.js'),

  // Created bundle files
  bundledCssName: _bundledCssName,
  bundledJsName: _bundledJsName,
  bundledCssPath: path.join('css', _bundledCssName),
  bundledJsPath: path.join('js', _bundledJsName),

  browserifyOpts: {
    cache: {},
    packageCache: {},
    debug: true,
    standalone: pkg.title
  },

  banner: ['/*!\n',
    ' * <%= pkg.title %> - <%= pkg.description %> (<%= pkg.name %> v<%= pkg.version %> - <%= pkg.homepage %>)\n',
    ' *\n',
    ' * Licensed under <%= pkg.license %> (<%= pkg.homepage %>/blob/master/LICENSE)\n',
    ' *\n',
    ' * Inspired by works: https://prolearner.github.io/procedural-planet/\n',
    ' */\n',
    ''
  ].join(''),

};

// Clean-up
gulp.task('clean', function (cb) {
  del(['node_modules', 'yarn*.*'], cb);
});

// Unit testing
function generateUnitTestStream() {
  return gulp.src('src/test/unit/**/*.spec.js', {read: false})
    .pipe(mocha({reporter: 'spec', timeout: 15000}));
}

gulp.task('test:unitWithCoverage', function () {
  return generateUnitTestStream()
    .gulp.src('src/js/**/*.js')
    .pipe(istanbul())
    .pipe(istanbul.hookRequire())
    .pipe(istanbul.writeReports())
    .pipe(istanbul.enforceThresholds({thresholds: {global: 90}}));
});

gulp.task('test:unit', function () {
  return generateUnitTestStream();
});

// Minify CSS file
gulp.task('minify:css', function () {
  return gulp.src(config.bundledCssPath)
    .pipe(cleancss({
      compatibility: 'ie8'
    }))
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest('css'));
});

// Minify JS file
gulp.task('minify:js', function () {
  return gulp.src(config.bundledJsPath)
    .pipe(uglify())
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest('js'));
});

// Bundle JS files from /src/js into /js
function bundle(bundler) {
  return bundler
    .bundle()
    .on('error', function handleError(err) {
      util.log('Bundle error: ' + String(err));
    })
    .pipe(source(config.mainJs))
    .pipe(header(config.banner, {
      pkg: pkg
    }))
    .pipe(rename(config.bundledJsName))
    .pipe(gulp.dest('js'));
}

// Bundle SCSS files into css
gulp.task('bundle:css', function () {
  return gulp.src(config.mainScss)
    .pipe(sass({
      style: 'compressed',
      loadPath: [
        config.sassPath,
        'node_modules/bootstrap-sass-official/assets/stylesheets',
        'node_modules/font-awesome/scss'
      ]
    }))
    .pipe(header(config.banner, {
      pkg: pkg
    }))
    .pipe(rename(config.bundledCssName))
    .pipe(gulp.dest('css'));
});

// Bundle JS files into js
gulp.task('bundle:js', function () {
  var bundler = browserify(config.mainJs, config.browserifyOpts);
  return bundle(bundler);
});

// Watch bundled CSS and JS files
gulp.task('watch', function () {
  var bundler = browserify(config.mainJs, config.browserifyOpts);

  watchify(bundler, {delay: 10})
    .on('update', function updateBundle() {
      bundle(bundler);
    })
    .on('log', function logUpdate(msg) {
      util.log(msg);
    });

  return bundle(bundler);
});

// Copy locally installed modules to distribution area
gulp.task('copy', function () {
  // gulp.src(['node_modules/three/build/*.js'])
  //   .pipe(gulp.dest('lib/three'));
  //
  // gulp.src(['node_modules/three-orbit-controls/*.js'])
  //   .pipe(gulp.dest('lib/three-orbit-controls'));
  //
  // gulp.src(['node_modules/dat.gui/build/**'])
  //   .pipe(gulp.dest('lib/dat.gui'));

  gulp.src([
    'node_modules/bootstrap/dist/**/*',
    '!**/npm.js',
    '!**/bootstrap-theme.*',
    '!**/*.map'
  ]).pipe(gulp.dest('lib/bootstrap'));

  gulp.src(['node_modules/jquery/dist/**'])
    .pipe(gulp.dest('lib/jquery'));

  // gulp.src(['node_modules/popper.js/dist/**'])
  //   .pipe(gulp.dest('lib/popper.js'));

  gulp.src([
    'node_modules/font-awesome/**',
    '!**/*.map',
    '!**/.npmignore',
    '!**/*.txt',
    '!**/*.md',
    '!**/*.json',
    '!**/less/*',
    '!**/scss/*'
  ]).pipe(gulp.dest('lib/font-awesome'));

  return gulp.src([
    'node_modules/simple-line-icons/**',
    '!**/*.map',
    '!**/.npmignore',
    '!**/*.txt',
    '!**/*.md',
    '!**/*.json',
    '!**/less/*',
    '!**/scss/*'
  ]).pipe(gulp.dest('lib/simple-line-icons'));

});

// DEFAULT TASK:
gulp.task('default', ['copy', 'bundle:css', 'bundle:js', 'watch']);
