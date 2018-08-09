describe('scroll-tracker', function(){
  'use strict';

  beforeEach(function(done) {

    var html = '<div class="spacer" style="height: 1000px; width: 100%;"></div>' +
      '<div class="every" style="height: 200px; width: 100%;"></div>' +
      '<div id="each" style="height: 100px; width: 100%;"></div>' +
      '<div class="every" style="height: 200px; width: 100%;"></div>' +
      '<div class="every" style="height: 200px; width: 100%;"></div>' +
      '<div style="height: 200px; overflow: auto" class="nested">' +
      '  <div class="nested-every" style="height: 200px; width: 100%;">1</div>' +
      '  <div class="nested-every" style="height: 200px; width: 100%;">2</div>' +
      '</div>';

    document.body.innerHTML = html;

    done();

  });

  describe('context, no context, percentage, pixels, and elements', function() {

    it('should be true', function(done) {

      expect(typeof ScrollTracker).toBe('function');

      var passed = {
        normal: {},
        nested: {}
      };
      var nestedContext = document.querySelector('.nested');
      var tracker = ScrollTracker();
      var nestedTracker = ScrollTracker({
        context: nestedContext
      });
      tracker.on({
        percentages: {
          each: [10, 90],
          every: [25]
        },
        pixels: {
          each: [10, 90],
          every: [1000]
        },
        elements: {
          each: ['#each'],
          every: ['.every']
        }
      }, function(evt) {

        passed.normal[evt.data.label] = evt.data.depth;

      });

      nestedTracker.on({
        percentages: {
          each: [10, 90],
          every: [25]
        },
        pixels: {
          each: [10, 90],
          every: [100]
        },
        elements: {
          each: ['.each'],
          every: ['.nested-every']
        }
      }, function(evt) {

        passed.nested[evt.data.label] = evt.data.depth;

      });

      var outcome = {
        "nested": {
          ".nested-every[0]": 0,
          "10px": 10,
          "10%": 39,
          "90px": 90,
          "25%": 98,
          "100px": 100,
          "50%": 197,
          "200px": 200,
          ".nested-every[1]": 200,
          "75%": 296,
          "300px": 300,
          "90%": 355,
          "100%": 395
        },
        "normal": {
          "10px": 10,
          "90px": 90,
          "10%": 189,
          "25%": 473,
          "50%": 947,
          "1000px": 1000,
          ".every[0]": 1000,
          "#each": 1200,
          ".every[1]": 1300,
          "75%": 1421,
          ".every[2]": 1500,
          "90%": 1705,
          "100%": 1895
        }
      };

      window.scrollTo(0, 1900);
      nestedContext.scrollTop = 400;

      setTimeout(function() {

        expect(passed).toEqual(outcome);
        done();

      }, 1000);

    });

  });

  describe('body element', function() {

    it ('should track an element with percentages', function(done) {

      var tracker = ScrollTracker({
        context: '.spacer'
      });
      var passed = {};
      // @FIXME PhantomJS gets different heights than Chrome
      var outcome = {
        '10%': 99,
        '25%': 248,
        '50%': 497,
        '75%': 746,
        '90%': 895,
        '100%': 995
      };

      tracker.on({
        percentages: {
          every: [25],
          each: [10, 90]
        }
      }, function(evt) {

        passed[evt.data.label] = evt.data.depth;

      });

      window.scrollTo(0, 1000);

      setTimeout(function() {

        expect(passed).toEqual(outcome);
        done();

      }, 1000);

    });

  });

  describe('height change', function() {

    it ('should adjust marks when height changes', function(done) {

      var tracker = ScrollTracker();

      tracker.on({
        percentages: {
          each: [10]
        }
      }, noop);

      var init = Object.keys(tracker._marks);
      var div = document.createElement('div');

      div.style.height = '2000px';

      document.body.appendChild(div);

      setTimeout(function() {

        var newKeys = Object.keys(tracker._marks);

        expect(Number(newKeys[0]) - Number(init[0])).toBeGreaterThan(0);

        done();

      }, 501);

    });

  });

  describe('resize event', function() {

    it ('should re-calculate when a resize event occurs', function(done) {

      var tracker = ScrollTracker();

      tracker.on({
        percentages: {
          each: [10]
        }
      }, noop);

      spyOn(tracker, '_calculateMarks');

      window.dispatchEvent(new window.Event('resize'));

      setTimeout(function() {

        expect(tracker._calculateMarks).toHaveBeenCalled();

        done();

      }, 501);

    });

  });

	describe('reset()', function() {

		it ('should reset the internal marks', function() {

			var tracker = ScrollTracker();
			var events = [];
		
			tracker.on({
				percentages: {
					each: [10]
				}
			}, function(evt) {

				events.push(evt);

			});

      window.scrollTo(0, 1000);

      expect(events.length).toBe(1);
      tracker.reset();
      expect(events.length).toBe(2);

		});

	});

  describe('minHeight', function() {

    it ('should not set marks because the min height is too small', function() {

      var tracker = ScrollTracker({
        minHeight: 2000
      });

      tracker.on({
        percentages: {
          each: [10]
        }
      }, noop);

      expect(tracker._marks).toEqual({});

    });

    it('should set marks because the contextHeight > minHeight', function() {

      var tracker = ScrollTracker({
        minHeight: 1600
      });

      tracker.on({
        percentages: {
          each: [10]
        }
      }, noop);

      expect(Object.keys(tracker._marks).length).toBeGreaterThan(0);

    });

  });

  describe('destroy', function() {

    it ('should remove the timer and events', function() {

      var cachedInterval = window.setInterval;
      var cachedClearEvent = window.removeEventListener;
      var cachedClearInterval = window.clearInterval;
      var intervalCleared = false;
      var eventsUnhandled = 0;
      var timerId;

      window.setInterval = function(fn, int) {

        timerId = cachedInterval(fn, int);

        return timerId;

      };

      window.clearInterval = function() {

        intervalCleared = true;

        cachedClearInterval(timerId);

      };

      window.removeEventListener = function(eventName, fn) {

        eventsUnhandled++;

        return cachedClearEvent(eventName, fn);

      };

      var tracker = ScrollTracker({
        minHeight: 1600
      });

      tracker.on({
        percentages: {
          each: [10]
        }
      }, noop);

      tracker.destroy();

      expect(intervalCleared).toBe(true);
      expect(eventsUnhandled).toBe(2);

    });

  });

  describe('no context', function() {

    it ('should throw an error if the context is invalid', function(done) {

      try {
        ScrollTracker({
          context: '#foobar'
        });
      } catch(e) {

        expect(e).toBeDefined();
        done();

      }

    });

  });


});

function noop () {}
