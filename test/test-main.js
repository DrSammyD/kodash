var tests = [];
for (var file in window.__karma__.files) {
    if (/Spec\.js$/.test(file)) {
        tests.push(file);
    }
}

requirejs.config({
    baseUrl: '/base',
    paths: {
        'test-main':'./test/test-main',
        'kodash': './javascripts/kodash',
        'knockout': './node_modules/knockout/build/output/knockout-latest',
        'lodash': './node_modules/lodash/dist/lodash',
        'chai': 'node_modules/chai/chai'
    },
 
    // ask Require.js to load these files (all our tests)
    deps: tests,

    // start test run, once Require.js is done
    callback: window.__karma__.start
});