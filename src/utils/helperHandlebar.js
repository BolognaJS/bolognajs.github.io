module.exports = {
    helpers: {
        'equalTo' : function (arr, string, options) {
            'use strict';
            if (arr && arr.includes(string)) {
                return options.fn(this);
            }
            return options.inverse(this);
        },
        'greaterThan': function (v1, v2, options) {
            'use strict';
            if (v1 > v2) {
                return options.fn(this);
            }
            return options.inverse(this);
        },
        'roundUpCells': function (object, numElementsRow=0, options) {
            const size = object.length % numElementsRow
            const isNotOdd = size > 0 ? 1 : 0;
            const total = ((object.length - size) / numElementsRow + isNotOdd) * numElementsRow
            let accum = '';

            for(let i = 0; i < total; ++i) {
                if(object[i] && object[i].type && object[i].type.includes("double"))
                    accum += options.fn(i);
                accum += options.fn(i);
            }
            return accum;
        },
        'isLinkable': function (name, options) {
            'use strict';
            const regex = new RegExp(/(.*)\[(.*)\]/);
            const isLinkable = regex.exec(name);

            if (isLinkable) {
                return options.fn({
                    name: isLinkable[1],
                    link: isLinkable[2]
                });
            }
            return options.inverse(this);
        },
        'isNotLinkable': function (name, options) {
            'use strict';
            const regex = new RegExp(/(.*)\[(.*)\]/);
            const isLinkable = regex.exec(name);

            if (!isLinkable) {
                return options.fn(this);
            }
            return options.inverse(this);
        }
    }
}