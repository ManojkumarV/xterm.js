const browserify = require('browserify');
const buffer = require('vinyl-buffer');
const fs = require('fs-extra');
const gulp = require('gulp');
const merge = require('merge-stream');
const source = require('vinyl-source-stream');
const sourcemaps = require('gulp-sourcemaps');
const ts = require('gulp-typescript');

gulp.task('tsc', function () {
  // Remove the lib/ directory to prevent confusion if files were deleted in src/
  fs.emptyDirSync('lib');

  // Build all TypeScript files (including tests) to lib/
  let tsProject = ts.createProject('tsconfig.json');
  let tsResult = tsProject.src().pipe(sourcemaps.init()).pipe(tsProject());
  let tsc = tsResult.js.pipe(sourcemaps.write('.')).pipe(gulp.dest('lib'));

  // Copy all addons from src/ to lib/
  let copyAddons = gulp.src('src/addons/**/*').pipe(gulp.dest('lib/addons'));

  // Copy stylesheets from src/ to lib/
  let copyStylesheets = gulp.src('src/**/*.css').pipe(gulp.dest('lib'));

  return merge(tsc, copyAddons, copyStylesheets);
});

gulp.task('build', ['tsc'], function() {
  let buildDir = process.env.BUILD_DIR || 'build';

  // Ensure that the build directory exists
  fs.ensureDirSync(buildDir);

  let browserifyOptions = {
    basedir: 'lib',
    debug: true,
    entries: ['xterm.js'],
    standalone: 'Terminal'
  };
  let bundle = browserify(browserifyOptions).bundle()
        .pipe(source('xterm.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({
          loadMaps: true
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(buildDir));

  // Copy all add-ons from lib/ to buildDir
  let copyAddons = gulp.src('lib/addons/**/*').pipe(gulp.dest(`${buildDir}/addons`));

  // Copy stylesheets from src/ to lib/
  let copyStylesheets = gulp.src('lib/**/*.css').pipe(gulp.dest(buildDir));

  return merge(bundle, copyAddons, copyStylesheets);
});
