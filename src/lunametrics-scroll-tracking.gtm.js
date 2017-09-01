;(function(document, window, config) {

  'use strict';

  // Global cache we'll use to ensure no double-tracking occurs
  var MarksAlreadyTracked = {};

  // Backwards compatible with old every setting, which was single value
  if (config.distances.percentages && config.distances.percentages.every) {

    if (!isArray_(config.distances.percentages.every)) {

      config.distances.percentages.every = [config.distances.percentages.every];

    }

  }

  // Backwards compatible with old every setting, which was single value
  if (config.distances.pixels && config.distances.pixels.every) {

    if (!isArray_(config.distances.pixels.every)) {

      config.distances.pixels.every = [config.distances.pixels.every];

    }

  }

  // Get a hold of any relevant elements, if specified in config
  var elementDistances = (function(selectors) {

    // If no selectors specified, short circuit here
    if (!selectors) return;

    // Create a cache to store positions of elements temporarily
    var cache = {};
    var counter = 0;

    // Fetch latest positions
    _update();

    // Return a function that can be called to get a map of element positions
    return function () {

      // Clone here to prevent inheritance from getMarks step
      var shallowClone = {};
      var key;

      counter++;

      // If temp cache counter is greater than 10, re-poll elements
      if (counter > 10) {

        _update();
        counter = 0;

      }

      for (key in cache) {

        shallowClone[key] = cache[key];

      }

      return shallowClone;

    };

    function _update() {

      var selector,
          markName,
          els,
          el,
          y,
          i;
      // Clear current cache
      cache = {};

      if (selectors.each) {

        for (i = 0; i < selectors.each.length; i++) {

          selector = selectors.each[i];

          if (!MarksAlreadyTracked[selector]) {

            el = document.querySelector(selector);

            if (el) cache[selector] = getNodeDistanceFromTop(el);

          }

        }

      }

      if (selectors.every) {

        for (i = 0; i < selectors.every.length; i++) {

          selector = selectors.every[i];
          els = document.querySelectorAll(selector);

          // If the last item in the selected group has been tracked, we skip it
          if (els.length && !MarksAlreadyTracked[selector + ':' + (els.length - 1)]) {

            for (y = 0; y < els.length; y++) {

              markName = selector + ':' + y;

              // We also check at the individual element level
              if (!MarksAlreadyTracked[markName]) {

                el = els[y];
                cache[markName] = getNodeDistanceFromTop(el);

              }

            }

          }

        }

      }

    }

  })(config.distances.elements);

  // If our document is ready to go, fire straight away
  if(document.readyState !== 'loading') {

    init();

  } else {

    // On IE8 this fires on window.load, all other browsers will fire when DOM ready
    document.addEventListener ?
      addEvent(document, 'DOMContentLoaded', init) :
      addEvent(window, 'load', init);

  }

  function init() {

    // Browser dependencies, script fails silently
    if (!document.querySelector || !document.body.getBoundingClientRect) {

      return false;

    }

    // Set our dataLayer name for later
    config.dataLayerName = config.dataLayerName || 'dataLayer';

    // Initialize our distances, for later
    config.distances = config.distances || {};

    checkDepth();
    addEvent(window, 'scroll', throttle(checkDepth, 500));

  }

  function getMarks(_docHeight, _offset) {

    var marks = elementDistances() || {};
    var percents = [];
    var pixels = [];
    var everyPercent,
        everyPixel,
        i;

    if(config.distances.percentages) {

      if(config.distances.percentages.each) {

        percents = percents.concat(config.distances.percentages.each);

      }

      if(config.distances.percentages.every) {

        for (i = 0; i < config.distances.percentages.every.length; i++) {

          everyPercent = every_(config.distances.percentages.every[i], 100);
          percents = pixels.concat(everyPercent);

        }

      }

    }

    if(config.distances.pixels) {

      if(config.distances.pixels.each) {

        pixels = pixels.concat(config.distances.pixels.each);

      }

      if(config.distances.pixels.every) {

        for (i = 0; i < config.distances.pixels.every.length; i++) {

          everyPixel = every_(config.distances.pixels.every[i], _docHeight);
          pixels = pixels.concat(everyPixel);

        }

      }

    }

    marks = addMarks_(marks, percents, '%', _docHeight, _offset);
    marks = addMarks_(marks, pixels, 'px', _docHeight, _offset);

    return marks;

  }

  function addMarks_(marks, points, symbol, _docHeight, _offset) {

    var i;

    for(i = 0; i < points.length; i++) {

      var _point = parseInt(points[i], 10);
      var height = symbol !== '%' ? _point + _offset : _docHeight * (_point / 100) + _offset;
      var mark = _point + symbol;

      if(height <= _docHeight + _offset) {

        marks[mark] = height;

      }

    }

    return marks;

  }

  function every_(n, total) {

    var _n = parseInt(n, 10);
    var _num = total / _n;
    var arr = [];
    var i;

    for(i = 1; i < _num + 1; i++) {

      arr.push(i * _n);

    }

    return arr;

  }

  function checkDepth() {

    var _bottom = parseScrollBorder(config.bottom);
    var _top = parseScrollBorder(config.top);
    var height = docHeight(_bottom, _top);
    var marks = getMarks(height, (_top || 0));
    var _curr = currentPosition();
    var target,
        key;

    for(key in marks) {

      target = marks[key];

      // If we've scrolled past the mark, we haven't tracked it yet, and it's in range, track the mark
      if(
        _curr > target &&
        !MarksAlreadyTracked[key] &&
        target < (_bottom || Infinity) &&
        target > (_top || 0)
      ) {

        MarksAlreadyTracked[key] = true;
        fireAnalyticsEvent(key);

      }

    }

  }

  function fireAnalyticsEvent(distance) {

    var _ga = window.GoogleAnalyticsObject;

    if(typeof window[config.dataLayerName] !== 'undefined' && !config.forceSyntax) {

      window[config.dataLayerName].push( {
        'event': 'scrollTracking',
        'attributes': {
          'distance': distance,
          'label': config.label
        }
      });

    } else if (typeof window[_ga] === 'function' &&
              typeof window[_ga].getAll === 'function' &&
              config.forceSyntax !== 2)
    {

      window[_ga]('send', 'event', config.category, distance, config.label, {'nonInteraction': 1});

    } else if(typeof window._gaq !== 'undefined' && config.forceSyntax !== 1) {

      window._gaq.push(['_trackEvent', config.category, distance, config.label, 0, true]);

    }

  }

  function parseScrollBorder(border) {

    if(typeof border === 'number' || parseInt(border, 10)) {

      return parseInt(border, 10);

    }

    try {

      // If we have an element or a query selector, poll getBoundingClientRect
      var el = border.nodeType === 1 ? border : document.querySelector(border);

      return getNodeDistanceFromTop(el);

    } catch (e) {

      return void(0);

    }

  }

  // Adapted from https://developer.mozilla.org/en-US/docs/Web/API/Window/scrollY
  function currentPosition() {

    var supportPageOffset = window.pageXOffset !== undefined;
    var isCSS1Compat = ((document.compatMode || "") === "CSS1Compat");

    var currScrollTop = supportPageOffset ?
                        window.pageYOffset :
                        isCSS1Compat ?
                          document.documentElement.scrollTop :
                          document.body.scrollTop;

    return parseInt(currScrollTop, 10) + parseInt(viewportHeight(), 10);

  }

  function viewportHeight() {

    var elem = (document.compatMode === "CSS1Compat") ?
              document.documentElement :
              document.body;

    return elem.clientHeight;

  }

  function docHeight(_bottom, _top) {

    var body = document.body;
    var html = document.documentElement;

    var height = Math.max(body.scrollHeight, body.offsetHeight,
                      html.clientHeight, html.scrollHeight, html.offsetHeight);


    if(_top) {

      height = height - _top;

    }

    if(_bottom) {

      height = _bottom - (_top || 0);

    }

    return height - 5;

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

  // Cross-browser compliant event listener
  function addEvent(el, evt, fn) {

    if (el.addEventListener) {

      el.addEventListener(evt, fn);

    } else if (el.attachEvent) {

      el.attachEvent('on' + evt, function(evt) {

        // Call the event to ensure uniform 'this' handling, pass it event
        fn.call(el, evt);

      });

    } else if (typeof el['on' + evt] === 'undefined' || el['on' + evt] === null) {

      el['on' + evt] = function(evt) {

        // Call the event to ensure uniform 'this' handling, pass it event
        fn.call(el, evt);

      };

    }

  }

  // Helper for fetching top of element
  function getNodeDistanceFromTop(node) {

    var nodeTop = node.getBoundingClientRect().top;
    // https://developer.mozilla.org/en-US/docs/Web/API/Window/scrollX
    var docTop = (window.pageYOffset !== undefined) ?
      window.pageYOffset :
      (document.documentElement || document.body.parentNode || document.body).scrollTop;

    return nodeTop + docTop;

  }

  // Helper to check if something is an Array
  function isArray_(thing) {

    return thing instanceof Array;

  }

  return {
    reset: function() {

      MarksAlreadyTracked = {};

    }
  };

})(document, window, {
  'distances': {
    // Configure elements you'd like to see users scroll past (using CSS Selectors)
    'elements': {
      'every': ['.finder-listing']
    }
  },
  // Text for Event Category
  'category': 'Finder Tracking',
  // Text for Event Label
  'label': document.location.pathname
});
