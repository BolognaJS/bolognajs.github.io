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
    const eventType = eventsData["events"][0].type;

    var p = createEvent.init().then(final => {
        final.talks = final.talks.map(el => ({
            title: el.title,
            speakers: el.speakers.split(";")
        }));
        
        if (eventType && eventType.includes("placeholder")) {
            eventsData["events"][0] = final;
        } else {
            eventsData["events"] = [final, ...eventsData["events"]];
        }

        if (eventType && eventType.includes("next")) {
            eventType.splice(eventType.indexOf("next"))
        }

        fs.writeFileSync('./src/eventsData.json', JSON.stringify(eventsData, null, '\t') ,"utf-8");
        return 1
    });
    return p;
});