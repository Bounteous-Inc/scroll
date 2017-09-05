module.exports = function(config) {
  'use strict';

  config.set({

    basePath: './',

    // customContextFile: 'test/scroll.html',

    frameworks: ["jasmine"],

    files: [
      'src/scroll-tracker.js',
      'test/**/*.spec.js'
    ],

    autoWatch: true,

    browsers: ['Chrome']

  });
};
