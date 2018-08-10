module.exports = {
    helpers: {
        'greaterThan': function (v1, v2, options) {
            'use strict';
            if (v1 > v2) {
                return options.fn(this);
            }
            return options.inverse(this);
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