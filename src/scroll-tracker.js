// @TODO Fix each/every
// @TODO Finish example
// @TODO Add options to constructor
// @TODO add "minHeight" option
/**
 * @example
 *
 * var scrollTracker = ScrollTracker({
 *    target: '#content'
 * });
 *
 * scrollTracker.on({
 *   percentage: {
 *    each: []
 *
 *   }
 * }, function(evt) {
 *
 *   notifySomeService(evt.data.scrollDepth);
 *
 * });
 *
 * Copyright(c) 2017 LunaMetrics, LLC.
 * Written by @notdanwilkerson
 * Licensed under the MIT License
 * For full license text, visit https://opensource.org/licenses/MIT
 */
(function(window) {

  'use strict';
  var document = window.document;

  /**
   * @constructor
   *
   * @param {HTMLElement} [context] defaults to <body>
   *
   * @returns {ScrollTracker}
   */
  function ScrollTracker(context) {

    if (!(this instanceof ScrollTracker)) return new ScrollTracker(context);

    context = context || 'body';

    if (typeof context === 'string') context = document.querySelector(context);

    this._context = context;
    this._marks = {};
    this._tracked = {};
    this._config = {
      percentages: {
        each: {},
        every: {}
      },
      pixels: {
        each: {},
        every: {}
      },
      elements: {
        each: {},
        every: {}
      }
    };

    var boundDepthCheck = this.checkDepth.bind(this);
    var boundUpdate = this._update.bind(this);

    window.addEventListener('scroll', throttle(boundDepthCheck, 500), true);

    window.addEventListener('resize', throttle(boundUpdate, 500));

    this._timer = onDocHeightChange(boundUpdate);

  }

  ScrollTracker.prototype.destroy = function() {

    clearInterval(this._timer);

  };

  /**
   * Helper that watches for changes in the height of the document
   */
  function onDocHeightChange(handler) {

    var documentHeight = docHeight();

    return setInterval(function() {

      if (docHeight() !== documentHeight) {

        handler();
        documentHeight = docHeight();

      }

    }, 500);

  }

  /**
   * Returns the height of the document
   *
   * @returns {number}
   */
  function docHeight() {

    var body = document.body;
    var html = document.documentElement;

    return Math.max(body.scrollHeight, body.offsetHeight,
                      html.clientHeight, html.scrollHeight, html.offsetHeight);

  }

  /**
   * Registers a handler for a given configuration
   *
   * @param {object} config
   * @param {object} [config.percentages]
   * @param {number[]} [config.percentages.each] tracks every 100 / n percentage
   * @param {number[]} [config.percentages.every] tracks each percentage once
   * @param {object} [config.pixels]
   * @param {number[]} [config.pixels.each] tracks every context.height() / n pixel depth
   * @param {number[]} [config.pixels.every] tracks each pixel depth once
   * @param {object} [config.elements]
   * @param {string[]} [config.elements.each] tracks every element that matches each selector
   * @param {string[]} [config.elements.every] tracks the first element that matches each selector
   * @param {function} handler
   */
  ScrollTracker.prototype.on = function(config, handler) {

    var _config = this._config;

    ['percentages', 'pixels', 'elements'].forEach(function(type) {

      if (!config[type]) return;

      ['each', 'every'].forEach(function(freq) {

        if (!config[type][freq]) return;

        config[type][freq].forEach(function(key) {

          _config[type][freq][key] = _config[type][freq][key] || [];
          _config[type][freq][key].push(handler);

        });

      });

    });

    this._update();

  };

  /**
   * Checks marks and depth
   */
  ScrollTracker.prototype._update = function() {

    this._calculateMarks();
    this.checkDepth();

  };

  /**
   * Calculates the pixels for all configs
   */
  ScrollTracker.prototype._calculateMarks = function() {

    delete this._marks;
    this._marks = {};

    var _config = this._config;
    var contextHeight = this._contextHeight();
    var addMark = this._addMark.bind(this);
    var self = this;
    var elements,
        element,
        depth,
        key;

    for (key in _config.percentages.each) {

      forEachIn({
        n: Number(key),
        numerator: 100,
        callback: function(n) {

          var depth = Math.floor(n * contextHeight / 100);

          addMark({
            label: String(n) + '%',
            depth: depth,
            handlers: _config.percentages.each[key]
          });

        }
      });

    }

    for (key in _config.pixels.each) {

      forEachIn({
        n: Number(key),
        numerator: contextHeight,
        callback: function(n) {

          var depth = n;

          addMark({
            label: String(depth),
            depth: depth,
            handlers: _config.pixels.each[key]
          });

        }
      });

    }

    for (key in _config.percentages.every) {

      depth = Math.floor(contextHeight * Number(key) / 100);

      addMark({
        label: key + '%',
        depth: depth,
        handlers: _config.percentages.every[key]
      });

    }

    for (key in _config.pixels.every) {

      depth = Number(key);

      addMark({
        label: key,
        depth: depth,
        handlers: _config.pixels.every[key]
      });

    }

    for (key in _config.elements.each) {

      elements = [].slice.call(document.querySelectorAll(key));

      if (elements.length) {

        elements.forEach(function(element, ind) {

          var depth = element.getBoundingClientRect().top + self._context.scrollTop;

          addMark({
            label: key + '[' + ind + ']',
            depth: depth,
            handlers: _config.elements.each[key]
          });

        });

      }

    }

    for (key in _config.elements.every) {

      element = document.querySelector(key);

      if (element) {

        depth = element.getBoundingClientRect().top + this._context.scrollTop;

        addMark({
          label: key,
          depth: depth,
          handlers: _config.elements.every[key]
        });

      }

    }

  };

  /**
   * Checks all marks and triggers appropriate handlers
   */
  ScrollTracker.prototype.checkDepth = function() {

    var marks = this._marks;
    var currentDepth = this._currentDepth();
    var key;

    for (key in marks) {

      if (currentDepth >= key && !this._tracked[key]) {

        marks[key].forEach(function(boundHandler) { boundHandler(); });

        this._tracked[key] = true;

      }

    }

  };


  /**
   * Resets the internal cache of tracked marks
   */
  ScrollTracker.prototype.reset = function() {

    this._tracked = {};

  };

  /**
   * Returns the height of the scrolling context
   */
  ScrollTracker.prototype._contextHeight = function() {

    return this._context.scrollHeight - 10;

  };

  /**
   * Returns the current depth we've scrolled into the context
   */
  ScrollTracker.prototype._currentDepth = function() {

    return this._context.scrollTop + visibleInViewport(this._context);

  };

  /**
   * Adds a mark to be tracked
   *
   * @param {object} config
   * @param {number} config.depth
   * @param {string} config.label
   * @param {function[]} config.handlers
   */
  ScrollTracker.prototype._addMark = function (config) {

    var depth = config.depth;

    this._marks[depth] = (this._marks[depth] || []).concat(Mark(config));

  };

  ScrollTracker.prototype._defer = function(opts) {

    this.__opts = opts;

    return {
      on: function(config, handler) {

        this.__on = (this.__on || []).push([config, handler]);

      }
    };

  };

  /**
   * @constructor
   *
   * @param {object} config
   * @param {string} config.label
   * @param {number} config.depth
   * @param {function[]} config.handlers
   *
   * @returns {Mark}
   */
  function Mark(config) {

    /**
     * A Mark is an array of callbacks bound with their data payloads
     *
     * @name Mark
     *
     * @type {function[]}
     */
    return config.handlers.map(function(handler) {

      return handler.bind(this, {
        data: {
          depth: config.depth,
          label: config.label
        }
      });

    });

  }

  /**
   * @param {object} config
   * @param {number} config.n
   * @param {number} config.numerator
   * @param {function} config.callback
   */
  function forEachIn(config) {

    var len = Math.floor(config.numerator / config.n);
    var i;

    for (i = 1; i <= len; i++) {

      config.callback(i * config.n);

    }

  }

  /**
   * Returns the number of pixels of the element visible in the viewport
   * @param {HTMLElement} element
   *
   * @returns {number}
   * direct inspired by:
   * @link https://stackoverflow.com/questions/24768795/get-the-visible-height-of-a-div-with-jquery#answer-26831113
   */
  function visibleInViewport(element) {

    var height = element.offsetHeight
    var windowHeight = viewportHeight();
    var rect = element.getBoundingClientRect();

    return Math.max(
      0,
      rect.top > 0 ? Math.min(height, windowHeight - rect.top) :
        (rect.bottom < windowHeight ? rect.bottom : windowHeight)
    );

  }

  /**
   * Returns the height of the viewport
   *
   * @returns {number}
   */
  function viewportHeight() {

    var elem = (document.compatMode === "CSS1Compat") ?
              document.documentElement :
              document.body;

    return elem.clientHeight;

  }

  /*
   * Throttle function borrowed from:
   * Underscore.js 1.5.2
   * http://underscorejs.org
   * (c) 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
   * Underscore may be freely distributed under the MIT license.
   */
  function throttle(func, wait) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    var later = function() {
      previous = new Date;
      timeout = null;
      result = func.apply(context, args);
    };
    return function() {
      var now = new Date;
      if (!previous) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
      } else if (!timeout) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  }

  window.ScrollTracker = document.readyState !== 'loading' ?
    ScrollTracker :
    ScrollTracker.deferred;

// Basically, if the DOM aint' ready, temporarily store
// calls to on and the constructor, then fix those when it is ready

  document.addEventListener('DOMContentLoaded', function() {



  });

})(this);
