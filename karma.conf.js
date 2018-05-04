module.exports = function(config) {
  'use strict';

  config.set({

    basePath: './',

    frameworks: ["jasmine"],

    files: [
      'src/scroll-tracker.js',
      'test/**/*.spec.js'
    ],

    autoWatch: true,

    browsers: ['PhantomJS']

  });
};
