module.exports = function(config) {
    config.set({
 
        // base path, that will be used to resolve files and exclude
        basePath: './',
 
        // frameworks to use
        frameworks: ['mocha','requirejs'],
 
        // list of files / patterns to load in the browser
        files: [
              './test/test-main.js',
              {pattern:'./spec/*.js',included:false, served:true},
              {pattern:'./javascripts/*.js',included:false, served:true},
              {pattern: 'node_modules/**/*.js', included: false}
        ],

        client: {
            mocha: {
                reporter: 'html', // change Karma's debug.html to the mocha web reporter
                ui: 'tdd'
            }
        },
        // list of files to exclude
        exclude: [
            '**/*.map.js'
        ],
 
        // test results reporter to use
        reporters: ['progress','coverage'],

        //what files to preprocess and how before tests
        preprocessors:{
            'javascripts/**/*.js':['coverage']
        },

        coverageReporter:{
            dir: 'build/reports/coverage',
            reporters:[
                {type:'lcov', subdir: '.'}
            ]
        },
 
        // web server port
        port: 9876,
 
        // enable / disable colors in the output (reporters and logs)
        colors: true,
 
        // level of logging
        logLevel: config.LOG_INFO,
 
        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: true,
 
        // Start these browsers
        browsers: ['PhantomJS'],
 
        // If browser does not capture in given timeout [ms], kill it
        captureTimeout: 60000,
 
        // Continuous Integration mode
        // if true, it capture browsers, run tests and exit
        singleRun: true
    });
};