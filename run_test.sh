#!/bin/bash

export DISPLAY=:99.0
sh -e /etc/init.d/xvfb start
phantomjs test/phantom-js-loader.js