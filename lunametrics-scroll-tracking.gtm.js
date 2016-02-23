;(function(document, window, config) {

  'use strict';

  var cache = {};

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

    var marks = {};
    var percents = [];
    var pixels = [];

    if(config.distances.percentages) {

      if(config.distances.percentages.each) {

        percents = percents.concat(config.distances.percentages.each);

      }

      if(config.distances.percentages.every) {

        var _everyPercent = every_(config.distances.percentages.every, 100);
        percents = percents.concat(_everyPercent);

      }

    }

    if(config.distances.pixels) {

      if(config.distances.pixels.each) {

        pixels = pixels.concat(config.distances.pixels.each);

      }

      if(config.distances.pixels.every) {

        var _everyPixel = every_(config.distances.pixels.every, _docHeight);
        pixels = pixels.concat(_everyPixel);

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

    var _bottom = parseBorder_(config.bottom);
    var _top = parseBorder_(config.top);

    var height = docHeight(_bottom, _top);
    var marks = getMarks(height, (_top || 0));
    var _curr = currentPosition();
    var key;

    for(key in marks) {

      if(_curr > marks[key] && !cache[key]) {

        cache[key] = true;
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

  function parseBorder_(border) {

    if(typeof border === 'number' || parseInt(border, 10)) {

      return parseInt(border, 10);

    }

    try {

      // If we have an element or a query selector, poll getBoundingClientRect
      var el = border.nodeType === 1 ? border : document.querySelector(border);
      var docTop = document.body.getBoundingClientRect().top;
      var _elTop = Math.floor(el.getBoundingClientRect().top - docTop);

      return _elTop;

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

})(document, window, {
  // Use 2 to force Classic Analytics hits and 1 for Universal hits
  'forceSyntax': false,
  // False if you just use the default dataLayer variable, otherwise enter it here
  'dataLayerName': false,
  'distances': {
    // Configure percentages of page you'd like to see if users scroll past
    'percentages': {
      'each': [10,90],
      'every': 25
    },
    // Configure for pixel measurements of page you'd like to see if users scroll past
    'pixels': {
      'each': [],
      'every': null
    }
  },
  // Accepts a number, DOM element, or query selector to determine the top of the scrolling area
  'top': null,
  // Accepts a number, DOM element, or query selector to determine the bottom of the scrolling area
  'bottom': null,
  // Text for Event Category
  'category': 'Scroll Tracking',
  // Text for Event Label
  'label': document.location.pathname
});
/*
 * v1.0.2
 * Created by the Google Analytics consultants at http://www.lunametrics.com/
 * Written by @notdanwilkerson
 * Documentation: https://github.com/lunametrics/gascroll/
 * Licensed under the Creative Commons 4.0 Attribution Public License
 */