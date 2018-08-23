var gulp = require('gulp');
var handlebars = require('gulp-compile-handlebars');
var rename = require('gulp-rename');
var handlebarOptions = require("./src/utils/helperHandlebar.js");
var data = require("./src/utils/eventsData.js");
var createEvent = require("./src/utils/createEvent");
var fs = require("fs");
var {log} = console;


gulp.task('handlebar', function() {
    return gulp.src('src/template/index.hbs')
        .pipe(handlebars(data, handlebarOptions))
        .pipe(rename("index.html"))
        .pipe(gulp.dest('./'));
});

gulp.task('addevent', function() {
    const rfdata = fs.readFileSync('./src/eventsData.json', "utf-8");
    let eventsData = JSON.parse(rfdata);

    var p = createEvent.init().then(final => {
        final.talks = final.talks.map(el => ({
            title: el.title,
            speakers: el.speakers.split(";")
        }));
        
        if (eventsData["events"][0].type && eventsData["events"][0].type.includes("placeholder")) {
            eventsData["events"][0] = final;
        } else {
            eventsData["events"] = [final, ...eventsData["events"]];
        }
        fs.writeFileSync('./src/eventsData.json', "utf-8");
        return 1
    });
    return p;
});