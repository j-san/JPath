const qunit = require('qunit');

qunit.run({

    code: {
        /* Include your CODE to test here */
        path: './src/JPath.js'
    },
    tests: [
        /* Include your TESTS to run here */
        'test.js'
    ].map(function (v) { return './test/' + v })
});