// # Ghost Configuration
// Setup your Ghost install for various environments
// Documentation can be found at http://support.ghost.org/config/

var path = require('path'),
    config;
var config;
if (process.env.OPENSHIFT_MYSQL_DB_HOST != undefined) {
    config = {
        // ### Production
        // When running Ghost in the wild, use the production environment
        // Configure your URL and mail settings here
        production: {
            url: 'http://'+process.env.OPENSHIFT_APP_DNS,
            mail: {
                transport: 'SMTP',
                options: {
                    service: 'Mailgun',
                    auth: {
                        user: 'postmaster@sandboxb5ca0045c16c485dba034cae348c467f.mailgun.org', // mailgun username
                        pass: '74ce6cb35612eca64e03458c020009b8'  // mailgun password
                    }
                }
            },
            database: {
                client: 'mysql',
                connection: {
                    host     : process.env.OPENSHIFT_MYSQL_DB_HOST,
                    port     : process.env.OPENSHIFT_MYSQL_DB_PORT,
                    user     : process.env.OPENSHIFT_MYSQL_DB_USERNAME,
                    password : process.env.OPENSHIFT_MYSQL_DB_PASSWORD,
                    database : process.env.OPENSHIFT_APP_NAME,
                    charset  : 'utf8'
                }
            },
            server: {
                // Host to be passed to node's `net.Server#listen()`
                host: process.env.OPENSHIFT_NODEJS_IP,
                // Port to be passed to node's `net.Server#listen()`, for iisnode set this to `process.env.PORT`
                port: process.env.OPENSHIFT_NODEJS_PORT
            },
            paths: {
                contentPath: path.join(__dirname, '/content/')
            }
        }
    }
} else if (process.env.OPENSHIFT_POSTGRESQL_DB_HOST != undefined) {
    config = {
        // ### Production
        // When running Ghost in the wild, use the production environment
        // Configure your URL and mail settings here
        production: {
            url: 'http://'+process.env.OPENSHIFT_APP_DNS,
            mail: {
                transport: 'SMTP',
                options: {
                    service: 'Mailgun',
                    auth: {
                        user: 'postmaster@sandboxb5ca0045c16c485dba034cae348c467f.mailgun.org', // mailgun username
                        pass: '74ce6cb35612eca64e03458c020009b8'  // mailgun password
                    }
                }
            },
            database: {
                client: 'pg',
                connection: {
                    host     : process.env.OPENSHIFT_POSTGRESQL_DB_HOST,
                    port     : process.env.OPENSHIFT_POSTGRESQL_DB_PORT,
                    user     : process.env.OPENSHIFT_POSTGRESQL_DB_USERNAME,
                    password : process.env.OPENSHIFT_POSTGRESQL_DB_PASSWORD,
                    database : process.env.OPENSHIFT_APP_NAME,
                    charset  : 'utf8'
                }
            },
            server: {
                // Host to be passed to node's `net.Server#listen()`
                host: process.env.OPENSHIFT_NODEJS_IP,
                // Port to be passed to node's `net.Server#listen()`, for iisnode set this to `process.env.PORT`
                port: process.env.OPENSHIFT_NODEJS_PORT
            },
            paths: {
                contentPath: path.join(__dirname, '/content/')
            }
        }
    }
} else {
    config = {
        // ### Development **(default)**
        development: {
            // The url to use when providing links to the site, E.g. in RSS and email.
            url: 'http://my-ghost-blog.com',

            // Example mail config
            // Visit http://support.ghost.org/mail for instructions
            // ```
            mail: {
                transport: 'SMTP',
                options: {
                    service: 'Mailgun',
                    auth: {
                        user: 'postmaster@sandboxb5ca0045c16c485dba034cae348c467f.mailgun.org', // mailgun username
                        pass: '74ce6cb35612eca64e03458c020009b8'  // mailgun password
                    }
                }
            },
            // ```

            database: {
                client: 'sqlite3',
                connection: {
                    filename: path.join(__dirname, '/content/data/ghost-dev.db')
                },
                debug: false
            },
            server: {
                // Host to be passed to node's `net.Server#listen()`
                host: '127.0.0.1',
                // Port to be passed to node's `net.Server#listen()`, for iisnode set this to `process.env.PORT`
                port: '2368'
            },
            paths: {
                contentPath: path.join(__dirname, '/content/')
            }
        },

        // ### Production
        // When running Ghost in the wild, use the production environment
        // Configure your URL and mail settings here
        production: {
            url: 'http://'+process.env.OPENSHIFT_APP_DNS,
            mail: {},
            database: {
                client: 'sqlite3',
                connection: {
                    filename: path.join(__dirname, '/content/data/ghost.db')
                },
                debug: false
            },
            server: {
                // Host to be passed to node's `net.Server#listen()`
                host: process.env.OPENSHIFT_NODEJS_IP,
                // Port to be passed to node's `net.Server#listen()`, for iisnode set this to `process.env.PORT`
                port: process.env.OPENSHIFT_NODEJS_PORT
            },
            paths: {
                contentPath: path.join(__dirname, '/content/')
            }
        },

        // **Developers only need to edit below here**

        // ### Testing
        // Used when developing Ghost to run tests and check the health of Ghost
        // Uses a different port number
        testing: {
            url: 'http://127.0.0.1:2369',
            database: {
                client: 'sqlite3',
                connection: {
                    filename: path.join(__dirname, '/content/data/ghost-test.db')
                }
            },
            server: {
                host: '127.0.0.1',
                port: '2369'
            },
            logging: false
        },

        // ### Testing MySQL
        // Used by Travis - Automated testing run through GitHub
        'testing-mysql': {
            url: 'http://127.0.0.1:2369',
            database: {
                client: 'mysql',
                connection: {
                    host     : '127.0.0.1',
                    user     : 'root',
                    password : '',
                    database : 'ghost_testing',
                    charset  : 'utf8'
                }
            },
            server: {
                host: '127.0.0.1',
                port: '2369'
            },
            logging: false
        },

        // ### Testing pg
        // Used by Travis - Automated testing run through GitHub
        'testing-pg': {
            url: 'http://127.0.0.1:2369',
            database: {
                client: 'pg',
                connection: {
                    host     : '127.0.0.1',
                    user     : 'postgres',
                    password : '',
                    database : 'ghost_testing',
                    charset  : 'utf8'
                }
            },
            server: {
                host: '127.0.0.1',
                port: '2369'
            },
            logging: false
        }
    };
}

// Export config
module.exports = config;
