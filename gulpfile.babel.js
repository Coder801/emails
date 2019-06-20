import gulp     from 'gulp';
import plugins  from 'gulp-load-plugins';
import browser  from 'browser-sync';
import rimraf   from 'rimraf';
import panini   from 'panini';
import yargs    from 'yargs';
import lazypipe from 'lazypipe';
import inky     from 'inky';
import fs       from 'fs';
import siphon   from 'siphon-media-query';
import merge    from 'merge-stream';
import beep     from 'beepbeep';
import run      from 'gulp-run-command';

const $ = plugins();

const template = yargs.argv.t;
const path = {
  src: `./templates/${template}/src`,
  dist: `./templates/${template}/dist`,
  zip: `./templates/${template}/zip/`,
  screen: `./templates/${template}/screen`
}
// const awsURL = `https://s3.amazonaws.com/mail-cdn/${yargs.argv.cdn || template}`
const port = 3000;
const host = 'localhost';
// const langs = yargs.argv.langs ? yargs.argv.langs.split(',') : ['en','ru','sv','pl','nl','es','fr','da','no','pt','tr','it','ko','ja','de','fi','cs','zh'];

// Look for the --production flag
const PRODUCTION = !!(yargs.argv.production);
const EMAIL = yargs.argv.to;

// Declar var so that both AWS task can use it.
var CONFIG;

// Build the "dist" folder by running all of the below tasks
gulp.task('build',
  gulp.series(clean, pages, sass, images, inline));

// Build emails, run the server, and watch for file changes
gulp.task('default',
  gulp.series('build', server, watch));

// Build emails, then send to EMAIL
gulp.task('mail',
  gulp.series('build', creds, /*aws,*/ mail));

// Build emails, then zip
gulp.task('zip',
  gulp.series('build', zip));

// Build emails, make screenshots
gulp.task('screen',
  gulp.series('build', server, run(`node screen.js --filePath=${path.dist}/emails --screenPath=${path.screen} --url=http://${host}:${port}`), serverExit));

// Delete the "dist" folder
// This happens every time a build starts
function clean(done) {
  rimraf(`${path.dist}`, done);
}

// Close connection
function serverExit(done) {
  browser.exit()
  done();
}

// Compile layouts, pages, and partials into flat HTML files
// Then parse using Inky templates
function pages() {
  if(!template){
    console.log('Sorry, you must specify the name of the template in the command line. Please see README.md');
    process.exit();
  }
  return gulp.src([`${path.src}/pages/**/*.html`, `!${path.src}/pages/archive/**/*.html`])
    .pipe(panini({
      root: `${path.src}/pages`,
      layouts: `${path.src}/layouts`,
      partials: `${path.src}/partials`,
      data: `${path.src}/data`,
      helpers: `${path.src}/helpers`
    }))
    //.pipe($.if(PRODUCTION, $.replace('./img', `${awsURL}`)))
    .pipe($.replace(/#\[br]/g, '<br/>'))
    .pipe($.replace(/#\[(\w+)(\((.*)\))?\s?(.*?)]/g, '<$1 $3>$4</$1>')) // Simple inline tag in yaml, like strong, em. etc. Mask #[htmltag text]
    .pipe($.htmlEntities('decode'))
    .pipe(inky())
    .pipe($.replace('<br>', '&nbsp;<br/>'))
    .pipe(gulp.dest(`${path.dist}`));
}

// Reset Panini's cache of layouts and partials
function resetPages(done) {
  panini.refresh();
  done();
}

// Compile Sass into CSS
function sass() {
  return gulp.src(`${path.src}/assets/scss/app.scss`)
    .pipe($.if(!PRODUCTION, $.sourcemaps.init()))
    .pipe($.sass({
      includePaths: ['node_modules/foundation-emails/scss']
    }).on('error', $.sass.logError))
    .pipe($.if(PRODUCTION, $.uncss(
      {
        html: [`${path.dist}/emails/*.html`]
      })))
    .pipe($.if(!PRODUCTION, $.sourcemaps.write()))
    .pipe(gulp.dest(`${path.dist}/css`));
}

// Copy and compress images
function images() {
  return gulp.src([`${path.src}/assets/img/**/*`, `!${path.src}/assets/img/archive/**/*`])
    .pipe($.imagemin())
    .pipe(gulp.dest(`./${path.dist}/emails/img`));
}

// Inline CSS and minify HTML
function inline() {
  return gulp.src(`${path.dist}/**/*.html`)
    .pipe($.if(PRODUCTION, inliner(`${path.dist}/css/app.css`)))
    .pipe(gulp.dest(`${path.dist}`));
}

// Start a server with LiveReload to preview the site in
function server(done) {
  browser.init({
    port,
    host,
    notify: false,
    server: `${path.dist}`,
    open: yargs.argv.open
  });
  done();
}

// Watch for file changes
function watch() {
  gulp.watch(`${path.src}/pages/**/*.html`).on('all', gulp.series(pages, inline, browser.reload));
  gulp.watch(`${path.src}/data/*.yml`).on('all', gulp.series(resetPages, pages, inline, browser.reload));
  gulp.watch([`${path.src}/layouts/**/*`, `${path.src}/partials/**/*`]).on('all', gulp.series(resetPages, pages, inline, browser.reload));
  gulp.watch([`../scss/**/*.scss`, `${path.src}/assets/scss/**/*.scss`]).on('all', gulp.series(resetPages, sass, pages, inline, browser.reload));
  gulp.watch(`${path.src}/assets/img/**/*`).on('all', gulp.series(images, browser.reload));
}

// Inlines CSS into HTML, adds media query CSS into the <style> tag of the email, and compresses the HTML
function inliner(css) {
  var css = fs.readFileSync(css).toString();
  var mqCss = siphon(css);

  var pipe = lazypipe()
    .pipe($.inlineCss, {
      applyStyleTags: false,
      removeStyleTags: true,
      preserveMediaQueries: true,
      removeLinkTags: false
    })
    .pipe($.replace, '<!-- <style> -->', `<style>${mqCss}</style>`)
    .pipe($.replace, '<link rel="stylesheet" type="text/css" href="css/app.css">', '')
    .pipe($.replace, 'href="#"', 'href="http://testlink.com/"')
    .pipe($.htmlmin, {
      collapseWhitespace: true,
      minifyCSS: true
    });

  return pipe();
}

// Ensure creds for manual test are at least there.
function creds(done) {
  var configPath = './config.json';
  try { CONFIG = JSON.parse(fs.readFileSync(configPath)); }
  catch(e) {
    beep();
    console.log('[AWS]'.bold.red + ' Sorry, there was an issue locating your config.json. Please see README.md');
    process.exit();
  }
  done();
}

// Send email to specified email for testing. If no AWS creds then do not replace img urls.
function mail() {

  if (EMAIL) {
    CONFIG.mail.to = [EMAIL];
  }

  return gulp.src(`./${path.dist}/emails/*.html`)
    .pipe($.replace('./img', `${awsURL}`))
    .pipe($.replace('<br>', '&nbsp;<br/>'))
    .pipe($.mail(CONFIG.mail))
    .pipe(gulp.dest(`./${path.dist}`));
}

// Copy and compress into Zip
function zip() {
  var emails = `./${path.dist}/emails/*.html`;
  var images = `./${path.dist}/emails/img/*`;

  var moveEmails = gulp.src(emails)
    .pipe($.replace(/src\s*=\s*"\D*\/(.+?)"/g, `src="./img/$1"`))
    .pipe($.rename(function (path) {
      path.dirname = '/';
      return path;
    }));

  var moveImages = gulp.src(images)
    .pipe($.rename(function (path) {
      path.dirname = '/img/';
      return path;
    }));

  return merge(moveEmails, moveImages)
    .pipe($.zip(`${template}.zip`))
    .pipe(gulp.dest(`${path.zip}`));
}