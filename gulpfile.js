var gulp = require('gulp');
var handlebars = require('gulp-compile-handlebars');
var rename = require('gulp-rename');
var data = require("./src/eventsData.js")
var handlebarOptions = require("./src/utils/helperHandlebar.js")

gulp.task('handlebar', function () {
    return gulp.src('src/template/index.hbs')
        .pipe(handlebars(data, handlebarOptions))
        .pipe(rename("index.html"))
        .pipe(gulp.dest('./'));
});