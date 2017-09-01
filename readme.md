# Scroll Tracking Google Analytics & GTM Plugin

Plug-and-play, dependency-free scroll tracking for Google Analytics or Google Tag Manager. Can be customized for custom percentages, custom pixel lengths, and element-based tracking. It will detect if GTM, Universal Analytics, or Classic Analytics is installed on the page, in that order, and use the first syntax it matches unless configured otherwise. It include support for delivering hits directly to Universal or Classic Google Analytics, or for pushing Data Layer events to be used by Google Tag Manager.

Once installed, the plugin will fire events with the following settings:

- Event Category: Scroll Tracking
- Event Action: *&lt;Scroll Percentage or Pixel Depth&gt;*
- Event Label: *&lt;Page Path&gt;*

Marker locations are refreshed every time the listener is called, so dynamic content should be trackable out of the box. Once a marker has been tracked, it is blocked from firing on subsequent checks. Tracking does not account for the starting position of the viewport; if the browser loads the viewport at the bottom of the page and the user triggers a scroll event, all percentages up to that point in the document will be tracked.

## Installation & Documentation

For installation instructions and complete documentation, visit [http://www.lunametrics.com/labs/recipes/scroll-tracking/#documentation](http://www.lunametrics.com/labs/recipes/scroll-tracking/#documentation).

## License

Licensed under the MIT License. For the full text of the license, view the LICENSE.MD file included with this repository.

## Browser Support

This library supports all features and is tested on the following browsers:
- IE8
- IE9
- IE10
- IE11
- Edge
- Chrome
- Firefox
- Opera
- Safari

## Acknowledgements

Created by the honest folks at [LunaMetrics](http://www.lunametrics.com/), a digital marketing & Google Analytics consultancy. For questions, please drop us a line here or [on our blog](http://www.lunametrics.com/blog/).

Written by [Dan Wilkerson](https://twitter.com/notdanwilkerson).
