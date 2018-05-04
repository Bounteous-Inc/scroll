/**
 * Emits events based on scrolling behavior in a given context. Shouldn't
 * be called until after DOMReady.
 *
 * @example
 * var scrollTracker = ScrollTracker({
 *   context: '#content'
 * });
 *
 * scrollTracker.on({
 *   percentage: {
 *    every: [25]
 *   }
 * }, function(evt) {
 *
 *   // Will trigger when the user reaches 25, 50, 75, & 100% depth
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
  // Won't work on IE8, so we install a mock.
  if (window.navigator.userAgent.match(/MSIE [678]/gi)) return installMock();

  var document = window.document;

  /**
   * @constructor
   *
   * @param {object} [opts] options for the constructor
   * @param {HTMLElement} [opts.context] defaults to <body>
   * @param {number} [opts.minHeight] minimum height of context required to track
   *
   * @returns {ScrollTracker}
   */
  function ScrollTracker(opts) {

    if (!(this instanceof ScrollTracker)) return new ScrollTracker(opts);

    opts = opts || {};

    var context = opts.context || 'body';

    if (typeof context === 'string') context = document.querySelector(context);

    if (!context) throw new Error('Unable to find context ' + context);

    this._context = context;
    this.minHeight = opts.minHeight || 0;
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

    var boundAndThrottledDepthCheck = throttle(this._checkDepth.bind(this), 500);
    var boundUpdate = this._update.bind(this);
    var throttledUpdate = throttle(boundUpdate, 500);

    window.addEventListener('scroll', boundAndThrottledDepthCheck, true);
    window.addEventListener('resize', throttledUpdate);

    this._artifacts = {
      timer: onDocHeightChange(boundUpdate),
      resize: throttledUpdate,
      scroll: boundAndThrottledDepthCheck
    };

  }

  /**
   * Cleans up timer and event bindings
   */
  ScrollTracker.prototype.destroy = function() {

    clearInterval(this._artifacts._timer);
    window.removeEventListener('resize', this._artifacts.resize);
    window.removeEventListener('scroll', this._artifacts.scroll, true);

  };

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
    this._checkDepth();

  };

  /**
   * Calculates the pixels for all configs
   */
  ScrollTracker.prototype._calculateMarks = function() {

    delete this._marks;
    this._fromTop = getNodeDistanceFromTop(this._context);
    this._marks = {};

    var _config = this._config;
    var contextHeight = this._contextHeight();
    var addMark = this._addMark.bind(this);
    var self = this;
    var elements,
      element,
      depth,
      key;

    if (contextHeight < this.minHeight) return;

    for (key in _config.percentages.every) {

      forEachIn({
        n: Number(key),
        numerator: 100,
        callback: percentagesEveryCallback(_config.percentages.every[key])
      });

    }

    for (key in _config.pixels.every) {

      forEachIn({
        n: Number(key),
        numerator: contextHeight,
        callback: pixelsEveryCallback(_config.pixels.every[key])
      });

    }

    for (key in _config.percentages.each) {

      depth = Math.floor(contextHeight * Number(key) / 100);

      addMark({
        label: key + '%',
        depth: depth,
        handlers: _config.percentages.each[key]
      });

    }

    for (key in _config.pixels.each) {

      depth = Number(key);

      addMark({
        label: key + 'px',
        depth: depth,
        handlers: _config.pixels.each[key]
      });

    }

    for (key in _config.elements.every) {

      elements = [].slice.call(this._context.querySelectorAll(key));

      if (elements.length) {

        elements.forEach(elementsEveryCallback(key, _config.elements.every[key]));

      }

    }

    for (key in _config.elements.each) {

      element = this._context.querySelector(key);

      if (element) {

        depth = element.getBoundingClientRect().top -
          self._context.getBoundingClientRect().top;

        addMark({
          label: key,
          depth: depth,
          handlers: _config.elements.each[key]
        });

      }

    }

    /**
     * Callback for our everyElements iterations
     *
     * @param {string} key
     * @param {function[]} handlers
     *
     * @returns {everyElement~Callback}
     */
    function elementsEveryCallback(key, handlers) {

      /**
       * @callback everyElement~Callback
       *
       * @param {HTMLElement} element
       * @param {number} ind
       */
      return function(element, ind) {

        var depth = element.getBoundingClientRect().top -
           self._context.getBoundingClientRect().top;

        addMark({
          label: key + '[' + ind + ']',
          depth: depth,
          handlers: _config.elements.every[key]
        });

      };

    }


    /**
     * Builds a callback for our everyPercentages iterations
     *
     * @param {function[]} handlers
     *
     * @returns {everyPercentage~Callback}
     */
     function percentagesEveryCallback(handlers) {

       /**
        * @callback everyPercentage~Callback
        *
        * @param {number} n
        */
       return function(n) {

        var depth = Math.floor(n * contextHeight / 100);

        addMark({
          label: String(n) + '%',
          depth: depth,
          handlers: _config.percentages.every[key]
        });

      };

    }

    /**
     * Builds a callback for our everyPixels iterations
     *
     * @param {function[]} handlers
     *
     * @param {number} n
     */

    function pixelsEveryCallback(handlers) {

      /**
       * @callback everyPixel~Callback
       *
       * @param {function[]} handlers
       */
      return function(n) {

        var depth = n;

        addMark({
          label: String(depth) + 'px',
          depth: depth,
          handlers: handlers
        });

      };

    }

  };

  /**
   * Checks all marks and triggers appropriate handlers
   */
  ScrollTracker.prototype._checkDepth = function() {

    var marks = this._marks;
    var currentDepth = this._currentDepth();
    var key;

    for (key in marks) {

      if (currentDepth >= key && !this._tracked[key]) {

        marks[key].forEach(function(boundHandler) {
          boundHandler();
        });

        this._tracked[key] = true;

      }

    }

  };

  /**
   * Resets the internal cache of tracked marks
   */
  ScrollTracker.prototype.reset = function() {

    this._tracked = {};
    this._marks = {};

		this._update();

  };

  /**
   * Returns the height of the scrolling context
   *
   * @returns {number}
   */
  ScrollTracker.prototype._contextHeight = function() {

    if (this._context !== document.body) return this._context.scrollHeight - 5;

    return this._context.clientHeight - 5;

  };

  /**
   * Returns the current depth we've scrolled into the context
   *
   * @returns {number}
   */
  ScrollTracker.prototype._currentDepth = function() {

    var isVisible = visibleInViewport(this._context);
    var depth;

    if (!this._context.scrollTop) {

      this._context.scrollTop = 1;

      if (!this._context.scrollTop) {

        depth = (window.pageYOffset ||
          document.documentElement.scrollTop ||
          document.body.scrollTop || 0);

      } else {

        this._context.scrollTop = 0;
        depth = this._context.scrollTop + isVisible;

      }

    } else {

      depth = this._context.scrollTop + isVisible;

    }

    if (!isVisible) {

      return depth >= this._fromTop ? depth : -1;

    }

    return depth + isVisible;

  };

  /**
   * Adds a mark to be tracked
   *
   * @param {object} config
   * @param {number} config.depth
   * @param {string} config.label
   * @param {function[]} config.handlers
   */
  ScrollTracker.prototype._addMark = function(config) {

    var depth = config.depth;

    this._marks[depth] = (this._marks[depth] || []).concat(Mark(config));

  };

  /**
   * @constructor
   * @private
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
   * Calls a callback function each time config.n goes into config.numerator
   *
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
   * Returns the number of pixels of the element visible in the viewport
   * @param {HTMLElement} element
   *
   * @returns {number}
   * adapted from:
   * @link https://stackoverflow.com/questions/24768795/get-the-visible-height-of-a-div-with-jquery#answer-26831113
   */
  function visibleInViewport(element) {

    var height = element.offsetHeight;
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

  /**
   * Retrieves the distance of a node from the top of the document
   *
   * @param {HTMLElement} node
   *
   * @returns {number}
   */
  function getNodeDistanceFromTop(node) {

    var nodeTop = node.getBoundingClientRect().top;
    // @link https://developer.mozilla.org/en-US/docs/Web/API/Window/scrollX
    var docTop = (window.pageYOffset !== undefined) ?
      window.pageYOffset :
      (document.documentElement || document.body.parentNode || document.body).scrollTop;

    return nodeTop + docTop;

  }

  /**
   * Does nothing
   */
  function noop() {}

  /**
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

  /**
   * Installs a noop'd version of ScrollTracker on the window
   */
  function installMock() {

    var fake = {};
    var key;

    for (key in ScrollTracker) {

      fake[key] = noop;

    }

    window.ScrollTracker = fake;

  }

  window.ScrollTracker = ScrollTracker;

})(this);
/*
 * v2.0.3
 * Created by the Google Analytics consultants at http://www.lunametrics.com/
 * Written by @notdanwilkerson
 * Documentation: https://github.com/lunametrics/gascroll/
 * Licensed under the MIT License
 */