var _ = require('underscore.string');
var conflict = require('gulp-conflict');
var gulp = require('gulp');
var install = require('gulp-install');
var inquirer = require('inquirer');
var rename = require('gulp-rename');
var template = require('gulp-template');

gulp.task('default', function (done) {
  inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'What is your project name?',
      default: 'Phaser Game'
    },
    {
      type: 'input',
      name: 'phaser',
      message: 'Which Phaser version would you like to use?',
      default: 'latest'
    },
    {
      type: 'input',
      name: 'width',
      message: 'Game display width',
      default: '320'
    },
    {
      type: 'input',
      name: 'height',
      message: 'Game display height',
      default: '480'
    }
  ], function (answers) {
    answers.nameSlug = _.slugify(answers.name);

    gulp.src(__dirname + '/templates/app/**')
      .pipe(template(answers))
      .pipe(rename(function (file) {
        if (_.startsWith(file.basename, '_')) {
          file.basename = _.join('', '.', file.basename.slice(1));
        }
      }))
      .pipe(conflict(answers.nameSlug))
      .pipe(gulp.dest(answers.nameSlug))
      .pipe(install())
      .on('finish', function () {
        done();
      });
  });
});
