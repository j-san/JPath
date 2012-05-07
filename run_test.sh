#!/bin/bash

export DISPLAY=:99.0
sh -e /etc/init.d/xvfb start
phantomjs lib/travis-ci-node-and-browser-qunit/test/phantom-js-loader.js