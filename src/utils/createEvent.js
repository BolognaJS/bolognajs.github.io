var inq = require('inquirer');
module.exports = {

    init() {
        return new Promise(function(res,rej) {
            const eventQuestions =
                [
                    {
                        type: 'input',
                        name: 'date',
                        message: 'Date of the event ? (es: 12 luglio 2018)',
                        validate: (data) => data.match(/\d{2} [a-z]+ \d{4}/) 
                                                ? true 
                                                : "Not use the uppercase or check the format",
                        default: ""
                    },
                    {
                        type: 'checkbox',
                        name: 'type',
                        message: 'Select the type of the event (space to select multiple choices)',
                        choices: ["next", "placeholder", "double", "hands-on"],
                        validate: data => data.length > 0 ? true : "Select one or more events",
                        default: ""
                    },
                    {
                        type: 'input',
                        name: 'numberOfTalks',
                        message: 'How many speech there are in this event (max 3)',
                        validate: data => data.match(/[1-3]/) ? true : "You need to provide a valid number"
                    }
                ];
            
            const speechQuestionsHelper = (index) => [
                {
                    type: 'input',
                    name: 'title',
                    message: 'Type the title of the ' + (index + 1) + ' event',
                    validate: data => data.length > 0 ? true : "You need to provide a title"
                },
                {
                    type: 'input',
                    name: 'speakers',
                    message: 'Type the speakers of the ' + (index + 1) + ' event',
                }
            ];

            inq.prompt(eventQuestions).then(function (answersEvent) {
                let event = {...answersEvent, talks:[]};
                let promiseArr = [];

                for(let i = 0; i < Number(answersEvent.numberOfTalks); i++) {
                    promiseArr.push(inq.prompt.bind(this, speechQuestionsHelper(i)))
                }

                promiseArr.reduce(function(promise, el, i) {
                    return promise
                        .then(function(data) {
                            data && event.talks.push(data);
                            return el.call();
                        })
                        .catch(e => e);

                }, Promise.resolve())
                    .then(talk => {
                        event.talks.push(talk)
                        res(event)
                    })
                    .catch(e => e)
            });
        });
    }
}