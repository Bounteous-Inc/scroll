var tape = require('tap');
var fs = require('fs');
var MockBrowser = new require('mock-browser').mocks.MockBrowser;
var browser = new MockBrowser();
var window = browser.getWindow();
var script = fs.readFileSync(__dirname + '/../src/scroll-tracker.js', 'utf-8');
function evalInContext(js, context) {
    return function() { return eval(js); }.call(context);
}

window.document.querySelector = function(selector) {

  return {
    getBoundingClientRect: function() {

      return {
        top: 50,
        height: 200
      };

    },
    addEventListener: window.addEventListener,
    scrollTop: 0
  };

};

window.document.querySelectorAll = function(selector) {

  return [window.document.querySelector(), window.document.querySelector()];

};

evalInContext(script, window);

tape.test('e2e', function(t) {

  t.plan(19);

  var tracker = window.ScrollTracker();
  var count = 0;

  tracker.on({
    percentages: {
      every: [10, 90],
      each: [25]
    },
    pixels: {
      every: [10, 90],
      each: [25]
    },
    elements: {
      every: ['#baz'],
      each: ['#bar'] // 2
    }
  }, handler);


  function handler(evt) {

    count++;
    t.pass(evt.data.label);

    if (count === 19) tracker.destroy();

  }

  window.dispatchEvent(new window.Event('scroll'));

});

tape.test('resize', function(t) {

  var context = window.document.querySelector();
  var tracker = window.ScrollTracker(context);

  t.plan(2);

  tracker.on({
    percentages: {
      every: [50],
    }
  }, function() {});

  t.ok(tracker._marks['100'], '50% === 100px');

  context.getBoundingClientRect = function() {

    return {
      top: 50,
      height: 400
    };

  };

  window.dispatchEvent(new window.Event('resize'));

  setTimeout(function() {

    t.ok(tracker._marks['200'], '50% === 200px');
    tracker.destroy();

  }, 500);

});

tape.test('documentHeight', function(t) {

  var mockWindow = {
    addEventListener: function() {},
    document: {
      body: {
        scrollHeight: 0
      },
      documentElement: {}
    }
  };
  evalInContext(script, mockWindow);

  var context = window.document.querySelector();
  var tracker = mockWindow.ScrollTracker(context);

  t.plan(2);

  tracker.on({
    percentages: {
      every: [50],
    }
  }, function() {});

  context.getBoundingClientRect = function() {

    return {
      top: 50,
      height: 400
    };

  };

  t.ok(tracker._marks['100'], '50% === 100px');

  setTimeout(function() {

    t.ok(tracker._marks['200'], '50% === 200px');
    tracker.destroy();

  }, 500);

});
