# Scroll Tracker

Library for observing scrolling behavior. Register handlers to fire when a user scrolls past a custom percentage, pixel depth, or selector-picked element. Compatible with nested scrolling areas (e.g. overflows). Tested on:

- IE 9
- IE 10
- IE 11
- Edge 15
- Firefox 55
- Chrome 60
- Opera 47
- Safari 5.1 9.1

To get started, install the script in your project and set up a tracker.

    var tracker = window.ScrollTracker();

Then register a handler on the scrolling events you'd like to observe.

    tracker.on({
      percentages: {
        every: [25]
      }
    }, function(evt) {

      console.log(evt.data.label); // > "25%"
      console.log(evt.data.depth); // > 500

    });

Additional handlers can be added at any time to additional measurements or measurements that already have a handler.

    tracker.on({
      percentages: {
        every: [25]
      },
      elements: {
        each: ['.header', '.footer']
      }
    }, someNewHandler);

When a tracker is no longer required it can be destroyed by calling `.destroy()`.

    tracker.destroy();

# Google Tag Manager Plugin

A pre-build Google Tag Manager container is included in the repository for download to import tracking into Google Tag Manager. The file is named luna-scroll-tracking.json.

## Installation & Documentation

For installation instructions and complete documentation, visit [http://www.lunametrics.com/labs/recipes/scroll-tracking/#documentation](http://www.lunametrics.com/labs/recipes/scroll-tracking/#documentation).

## License

Licensed under the MIT License. For the full text of the license, view the LICENSE.MD file included with this repository.

## Acknowledgements

Created by the honest folks at [LunaMetrics](http://www.lunametrics.com/), a digital marketing & Google Analytics consultancy. For questions, please drop us a line here or [on our blog](http://www.lunametrics.com/blog/).

Written by [Dan Wilkerson](https://twitter.com/notdanwilkerson).
