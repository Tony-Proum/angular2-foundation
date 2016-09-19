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
  libs: [
    './node_modules/core-js/client/shim.min.js',
    './node_modules/systemjs/dist/system-polyfills.js',
    './node_modules/systemjs/dist/system.src.js',
    './node_modules/reflect-metadata/Reflect.js',
    './node_modules/rxjs/**/*.js',
    './node_modules/zone.js/dist/**',
    './node_modules/@angular/**/bundles/**',
    './node_modules/angular2-in-memory-web-api/**/*.js',
    './bower_components/foundation-sites/dist/**/*.js',
    './bower_components/jquery/dist/jquery.js'
  ],
  // Sass will check these folders for files when you use @import.
  sass: [
    './client/assets/scss/**'
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
  return gulp.src(["client/**/*", "!./**/*.ts", "!./**/*.scss"])
    .pipe(gulp.dest("build"));
});

/**
 * Copy all required libraries into build directory.
 */
gulp.task("copy:libs", function () {
  return gulp.src(paths.libs)
    .pipe(gulp.dest("build/lib"));
});

// Compiles Sass
gulp.task('sass', function () {
  var minifyCss = $.if(isProduction, $.minifyCss());
  return gulp.src(paths.sass)
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
gulp.task('uglify', function () {
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
  sequence('clean', 'copy:libs', ['resources', 'compile', 'sass', 'uglify'], cb);
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
