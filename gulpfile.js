// FOUNDATION FOR APPS TEMPLATE GULPFILE
// -------------------------------------
// This file processes all of the assets in the "client" folder, combines them with the Foundation for Apps assets, and outputs the finished files in the "build" folder as a finished app.

// 1. LIBRARIES
// - - - - - - - - - - - - - - -

var $ = require('gulp-load-plugins')();
var argv = require('yargs').argv;
var gulp = require('gulp');
var del = require('del');
var sequence = require('run-sequence');
const typescript = require('gulp-typescript');
const sourcemaps = require('gulp-sourcemaps');
const tscConfig = require('./tsconfig.json');
const tsProject = typescript.createProject("tsconfig.json");

// Check for --production flag
var isProduction = !!(argv.production);

// 2. FILE PATHS
// - - - - - - - - - - - - - - -

var paths = {
  assets: [
    './client/**/*.*',
    '!./client/assets/{scss,js,ts}/**/*.*'
  ],
  angularJs: [
    './node_modules/systemjs/dist/system.src.js',
    './node_modules/reflect-metadata/Reflect.js',
    './node_modules/zone.js/dist/zone.js',
    './node_modules/core-js/client/shim.min.js',
    './node_modules/@angular/compiler/bundles/compiler.umd.js',
    './node_modules/@angular/platform-browser/bundles/platform-browser.umd.js',
    './node_modules/@angular/platform-browser-dynamic/bundles/platform-browser-dynamic.umd.js',
    './node_modules/@angular/core/bundles/core.umd.js'
  ],
  libs: [
    './node_modules/rxjs/*',
    './node_modules/angular2-in-memory-web-api/*'
  ],
  // Sass will check these folders for files when you use @import.
  sass: [
    'client/assets/scss',
    'bower_components/foundation-apps/scss'
  ],
  // These files include Foundation for Apps and its dependencies
  foundationJS: [
    'bower_components/fastclick/lib/fastclick.js',
    'bower_components/viewport-units-buggyfill/viewport-units-buggyfill.js',
    'bower_components/tether/tether.js',
    'bower_components/hammerjs/hammer.js',
    'bower_components/angular/angular.js',
    'bower_components/angular-animate/angular-animate.js',
    'bower_components/angular-ui-router/release/angular-ui-router.js',
    'bower_components/foundation-apps/js/vendor/**/*.js',
    'bower_components/foundation-apps/js/angular/**/*.js',
    '!bower_components/foundation-apps/js/angular/app.js'
  ],
  // These files are for your app's JavaScript
  appJS: [
    'client/assets/js/main.js'
  ]
};

// 3. TASKS
// - - - - - - - - - - - - - - -

// Cleans the build directory
gulp.task('clean', function () {
  return del('./build');
});

/**
 * Lint all custom TypeScript files.
 */
gulp.task('tslint', function () {
  return gulp.src("./client/assets/ts/**/*")
    .pipe(tslint({
      formatter: 'prose'
    }))
    .pipe(tslint.report());
});

/**
 * Compile TypeScript sources and create sourcemaps in build directory.
 */
gulp.task("compile", ["tslint"], function () {
  var tsResult = gulp.src("./client/assets/ts/**/*")
    .pipe(sourcemaps.init())
    .pipe(typescript(tsProject));
  return tsResult.js
    .pipe(sourcemaps.write(".", {sourceRoot: '/client'}))
    .pipe(gulp.dest("build"));
});

/**
 * Copy all resources that are not TypeScript files into build directory.
 */
gulp.task("resources", function () {
  return gulp.src(["client/**/*", "!./**/*.ts","!./**/*.scss"])
    .pipe(gulp.dest("build"));
});

/**
 * Copy all required libraries into build directory.
 */
gulp.task("copy:libs", function () {
  return gulp.src([
      'core-js/client/shim.min.js',
      'systemjs/dist/system-polyfills.js',
      'systemjs/dist/system.src.js',
      'reflect-metadata/Reflect.js',
      'rxjs/**',
      'zone.js/dist/**',
      '@angular/**/bundles/*.js'
    ], {cwd: "node_modules/**"}) /* Glob required here. */
    .pipe(gulp.dest("build/lib"));
});


// Compiles the Foundation for Apps directive partials into a single JavaScript file
gulp.task('copy:foundation', function (cb) {
  gulp.src('bower_components/foundation-apps/js/angular/components/**/*.html')
    .pipe($.ngHtml2js({
      prefix: 'components/',
      moduleName: 'foundation',
      declareModule: false
    }))
    .pipe($.uglify())
    .pipe(gulp.dest('./build/assets/js'));

  // Iconic SVG icons
  gulp.src('./bower_components/foundation-apps/iconic/**/*')
    .pipe(gulp.dest('./build/assets/img/iconic/'));

  cb();
});

// Compiles Sass
gulp.task('sass', function () {
  var minifyCss = $.if(isProduction, $.minifyCss());

  return gulp.src('client/assets/scss/app.scss')
    .pipe($.sass({
      includePaths: paths.sass,
      outputStyle: (isProduction ? 'compressed' : 'nested'),
      errLogToConsole: true
    }))
    .pipe($.autoprefixer({
      browsers: ['last 2 versions', 'ie 10']
    }))
    .pipe(minifyCss)
    .pipe(gulp.dest('./build/assets/css/'))
    ;
});

// Compiles and copies the Foundation for Apps JavaScript, as well as your app's custom JS
gulp.task('uglify', ['uglify:foundation', 'uglify:app'])

gulp.task('uglify:foundation', function (cb) {
  var uglify = $.if(isProduction, $.uglify()
    .on('error', function (e) {
      console.log(e);
    }));

  return gulp.src(paths.foundationJS)
    .pipe(uglify)
    .pipe($.concat('foundation.js'))
    .pipe(gulp.dest('./build/assets/js/'))
    ;
});

gulp.task('uglify:app', function () {
  var uglify = $.if(isProduction, $.uglify()
    .on('error', function (e) {
      console.log(e);
    }));

  return gulp.src(paths.appJS)
    .pipe(uglify)
    .pipe($.concat('main.js'))
    .pipe(gulp.dest('./build/assets/js/'))
    ;
});

// TypeScript compile
gulp.task('compile', function () {
  return gulp
    .src('client/assets/ts/*.ts')
    .pipe(typescript(tscConfig.compilerOptions))
    .pipe(gulp.dest('./build/assets/js'));
});

// Starts a test server, which you can view at http://localhost:8079
gulp.task('server', ['build'], function () {
  gulp.src('./build')
    .pipe($.webserver({
      port: 8079,
      host: 'localhost',
      livereload: true,
      open: true
    }))
  ;
});

// Builds your entire app once, without starting a server
gulp.task('build', function (cb) {
  sequence('clean', 'copy:libs', ['resources', 'compile', 'copy:foundation', 'sass', 'uglify'], cb);
});

// Default task: builds your app, starts a server, and recompiles assets when they change
gulp.task('default', ['server'], function () {
  // Watch Sass
  gulp.watch(['./client/assets/scss/**/*', './scss/**/*'], ['sass']);

  // Watch Typescript
  gulp.watch(["./client/**/*.ts"], ['compile']).on('change', function (e) {
    console.log('TypeScript file ' + e.path + ' has been changed. Compiling.');
  });

  // Watch static files
  gulp.watch(['./client/**/*.html', './client/**/*.css', './client/**/*.js'], ['resources']);

});
