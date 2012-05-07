#!/bin/bash

export DISPLAY=:99.0
sh -e /etc/init.d/xvfb start
phantomjs lib/test/phantom-js-loader.js