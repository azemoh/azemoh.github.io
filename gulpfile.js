/*global require*/
"use strict";

var cp = require('child_process');
var gulp = require('gulp');
var browserSync = require('browser-sync');
var sass = require('gulp-sass');
var autoprefix = require('gulp-autoprefixer');
var minifyHTML = require('gulp-minify-html');
var uglify = require('gulp-uglifyjs');

var config = {
	publicDir: '_site/',
	cssDir: 'assets/css/',
	jsDir: 'assets/js/',
	jekyllBuildMessage: '<span style="color: grey">Running:</span> $ jekyll build'
};

/**
 * Build the Jekyll Site
 */
gulp.task('jekyll:build', function (done) {
	browserSync.notify(config.jekyllBuildMessage);
	return cp.spawn('jekyll.bat', ['build'], { stdio: 'inherit' })
		.on('close', done);
});

/**
 * Rebuild Jekyll and reload page
 */
gulp.task('jekyll:rebuild', ['jekyll:build'], function () {
	browserSync.reload();
});

/**
 * Wait for jekyll:build, then launch the Server
 */
gulp.task('browser-sync', ['sass', 'jekyll:build', 'minify:html', 'minify:js'], function () {
	browserSync({
		server: { baseDir: config.publicDir },
		notify: false
	});
});

/**
* Build site without starting server and watching for changes.
*/
gulp.task('build', ['sass', 'jekyll:build', 'minify:html', 'minify:js']);

/**
 * Compile files from _scss into both _site/css (for live injecting) and site (for future jekyll builds)
 */
gulp.task('sass', function () {
	return gulp
		.src(config.cssDir + '*.scss')
		.pipe(sass({
			includePaths: [config.cssDir],
			outputStyle: 'compressed',
			onError: browserSync.notify
		}))
		.pipe(autoprefix(['last 15 versions', '> 1%', 'ie 8', 'ie 7'], {
			cascade: true
		}))
		.pipe(gulp.dest(config.publicDir + config.cssDir))
		.pipe(browserSync.reload({ stream: true	}))
		.pipe(gulp.dest(config.cssDir));
});

/*
* Minify html files after jekyll build
*/
gulp.task('minify:html', function() {
  return gulp.src(config.publicDir + '**/*.html')
    .pipe(minifyHTML({
			conditionals: true,
    	spare: true
		}))
    .pipe(gulp.dest(config.publicDir));
});

gulp.task('minify:js', function () {
	return gulp.src(config.jsDir + 'script.js')
		.pipe(uglify('script.min.js', { outSourceMap: true }))
		.pipe(gulp.dest(config.publicDir + config.jsDir))
		.pipe(browserSync.reload({ stream: true	}))
		.pipe(gulp.dest(config.jsDir));
});

/**
 * Watch scss files for changes & recompile
 * Watch html/md files, run jekyll & reload BrowserSync
 */
gulp.task('watch', function () {
	gulp.watch(config.cssDir + '**/*.scss', ['sass']);
	gulp.watch(config.jsDir + 'script.js', ['minify:js']);
	gulp.watch([
		'*.html',
		'_layouts/*.html',
		'_includes/**/*.html',
		'_posts/*.md',
		'_config.yml'
	], ['jekyll:rebuild']);
	gulp.watch(config.publicDir + '**/*.html', ['minify:html']);
});

/**
 * Default task, running just `gulp` will compile the sass,
 * compile the jekyll site, launch BrowserSync & watch files.
 */
gulp.task('default', ['browser-sync', 'watch']);