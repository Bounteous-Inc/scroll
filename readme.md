#Scroll Tracking Google Analytics & GTM Plugin

Plug-and-play, dependency-free scroll tracking for Google Analytics or Google Tag Manager. Can be customized for custom percentages and custom pixel lengths. It will detect if GTM, Universal Analytics, or Classic Analytics is installed on the page, in that order, and use the first syntax it matches unless configured otherwise. It include support for delivering hits directly to Universal or Classic Google Analytics, or for pushing Data Layer events to be used by Google Tag Manager.

Once installed, the plugin will fire events with the following settings:

- Event Category: Scroll Tracking
- Event Action: *&lt;Scroll Percentage or Pixel Depth&gt;*
- Event Label: *&lt;Page Path&gt;*

##Installation

This plugin is designed to be plug-and-play. By default, the plugin will try and detect if your site has Google Tag Manager, Universal Analytics, or Classic Analytics, and it will send the data to the first source it matches in that order.

###Google Tag Manager Installation

####Container Import (recommended)

1. Download the file 'gascroll-gtm-import.json' from this repository.
2. In Google Tag Manager, navigate to the **Admin** tab.
3. Under the **Container** column, select **Import Container**.
4. Click **Choose Container File** and select the 'gascroll-gtm-import.json' file you downloaded.
5. Select **Merge** from the radio selector beneath the Choose Container File button.
6. Select **Rename** from the radio selector that appears beneath the Merge selector.
7. Click Continue, then Confirm.
8. Navigate to the **Variables** interface, and select **Scroll Tracking - UA Number** from the User-Defined Variables table.
9. Click anywhere in the **Configure Variable** section and change **UA-XXXXXX-YY** to **your** Google Analytics UA Number, then save your changes.

Once you publish your next container, scroll tracking will begin working immediately.

**NOTE:** If you're using a custom GA cookie name, GA cookie domain, or GA function name, you'll need to change those variables as well.

####Manual Installation (not recommended)

#####Adding the Script
1. In Google Tag Manager, create a new Custom HTML tag.
2. Copy the below into the blank Custom HTML tag:

    <script type="text/javascript" id="gtm-scroll-tracking">
      // HIGHLIGHT THIS ENTIRE LINE
    </script>

3. Copy to your clipboard the entire contents of (https://github.com/lunametrics/gascroll/lunametrics-scroll-tracking.gtm.js)[the scroll tracking script, located here]. 
4. Highlight the line with **HIGHLIGHT THIS ENTIRE LINE** printed inside and paste the contents of the script over it.
5. Save the tag with the trigger **All Pages**. 

#####Configuring GTM
Create the following Trigger in Google Tag Manager:

* Trigger Name: Luna Scroll Tracking Event
  - Trigger Type: Custom Event
  - Event Name: lunaScrollTracking

Create the following Variables in Google Tag Manager:

* Variable Name: luna.scrollTracking.distance
  - Variable Type: Data Layer
  - Data Layer Variable Name: luna.scrollTracking.label

* Variable Name: luna.scrollTracking.label
  - Variable Type: Data Layer
  - Data Layer Variable Name: luna.scrollTracking.label

Create the following Tag in Google Tag Manager:

* Tag Name: GA Event - LunaMetrics Scroll Tracking
  - Tag Type: Google Analytics
  - Choose A Tag Type: Universal Analytics 
  - Tracking ID: *&lt; Enter your Google Analytics Tracking ID (UA Number)*&gt;
  - Track Type: Event
  - Category: Scroll Tracking
  - Action: {{luna.scrollTracking.distance}}
  - Label: {{luna.scrollTracking.label}}
  - Fire On: More
    - Choose From Existing Triggers: Luna Scroll Tracking Event

Ensure all other settings match existing Event tags in the container (e.g., cookieDomain is set properly).

###Universal Analytics/Classic Analytics Installation
To install the Scroll Tracking script on non-GTM implementations, simply include the script in the &lt;head&gt; section of every page you'd like to track. You'll need to host the script on your own server, then include it using a &lt;script&gt; tag that looks something like this:

    <script src="/somewhere-on-your-server/lunametrics-scroll-tracking.gtm.js"></script>

We have provided a minified version that you can use, too.

## Configuration

### Default Configuration
Out of the box, the script will fire an event into Google Analytics whenever a user scrolls down 10%, 25%, 50%, 75%, 90%, and 100% of the page. You can adjust this by changingthe distances.percentages.each array in the configuration object at the bottom of the script. It will try and send those events to the Google Tag Manager Data Layer, then the Universal Analytics global function (typically 'ga'), then the Classic Analytics queue (_gaq), in that order.

### Scroll Distances

#### distances.percentages.every
Fires an event every *n*% scrolled. The default setting fires every 25%.

    (function(document, window, config) {

      // ... the tracking code

    })(document, window, {
      'distances': {
        'percentages': {
          'every': 25 // Fires at the 25%, 50%, 75%, and 100% scroll marks
        }
      }
    });

#### distances.percentages.each
Fires an event when the user scrolls past each percentage provided in the array. The default setting fires at the 10% and 90% mark.

    (function(document, window, config) {

      // ... the tracking code

    })(document, window, {
      'distances': {
        'percentages': {
          'each': [10, 90] // Fires at the 10% and 90% scroll marks
        }
      }
    });

**NOTE**: Google Analytics has a 500 hit per-session limitation, as well as a 20 hit window that replenishes at 2 hits per second. For that reason, it is HIGHLY INADVISABLE to     track every 1% of page scrolled.

#### distances.pixels.every
Fires an event every *n* pixels scrolled vertically.

    (function(document, window, config) {

      // ... the tracking code

    })(document, window, {
      'distances': {
        'pixels': {
          'every': 250  // Fires at the 250px, 500px, 750px, ... scroll marks.
        }
      }
    });

#### distances.pixels.each
Fires an event when the user scrolls past each number of pixels provided in the array, vertically.

    (function(document, window, config) {

      // ... the tracking code

    })(document, window, {
      'distances': {
        'pixels': {
          'each': [100, 250, 1001] // Fires at the 100px, 250px, and 1001px scroll marks.
        }
      }
    });

**NOTE**: Google Analytics has a 500 hit per-session limitation, as well as a 20 hit window that replenishes at 2 hits per second. For that reason, it is HIGHLY INADVISABLE to     track every pixel of the page scrolled.

### Top/Bottom Of Scrollable Area
This script allows you to specify where to begin and end tracking user scrolling. The default configuration is the entire page.

#### Top
The top, or starting pixel, is configured by passing a number, element, or CSS query selector. All scroll distances will be begin offset *n* pixels down the page, where *n* is the number provided or the top edge of the element selected.

    (function(document, window, config) {

      // ... the tracking code

    })(document, window, {
      'top': '#content'  // Sets the point to being scroll tracking as the top of the element that matches the query selector '#content'
    });

#### Bottom
The bottom, or starting pixel, is configured by passing a number, element, or CSS query selector. All scroll distances will be calculated with *n* maximum depth, where *n* is the number provided or the top edge of the element selected.

    (function(document, window, config) {

      // ... the tracking code

    })(document, window, {
      'bottom': '#footer'  // Sets the point to being scroll tracking as the top of the element that matches the query selector '#footer'
    });

### Event Values
This script allows you to specify a Category and Label for the events that are sent to Google Analytics (or pushed to the Data Layer).

#### category
The Category value provided to the Event or Data Layer for each scroll tracking event measured. The default setting is 'Scroll Tracking'.

    (function(document, window, config) {

      // ... the tracking code

    })(document, window, {
      'category': 'Scroll Tracking'  // Sets the Google Analytics Event Category to Scroll Tracking
    });

#### label
The Label value provided to the Event or Data Layer for each scroll tracking event measured. The default setting is the page path.

    (function(document, window, config) {

      // ... the tracking code

    })(document, window, {
      'category': document.location.pathname  // Sets the Google Analytics Event Label to the path of the page
    });

### Forcing Universal or Classic Analytics Instead of GTM

By default, the plugin will try and fire Data Layer events, then fallback to Univeral Analytics events, then fallback to Classic Analytics events. If you want to force the script to use a particular syntax for your events, you can set the 'forceSyntax' property of the configuration object to an integer:

    (function(document, window, config) {
    
       // ... the tracking code

    })(document, window, {
      'forceSyntax': 1  // Forces the script to send hits using Universal syntax
    });

Setting this value to 0 will force the script to use Google Tag Manager events, setting it 1 will force it to use Universal Google Analytics events, and setting it to 2 will force it to use Classic Google Analytics events.

### Using A Custom Data Layer Name (GTM Only)
If you're using a name for your dataLayer object other than 'dataLayer', you must configure the script to push the data into the correct place. Otherwise, it will try Universal Analytics directly, then Classic Analytics, and then fail silently.

    (function(document, window, config) {
    
       // ... the tracking code

    })(document, window, {
      'dataLayerName': 'customDataLayerName'  // The script will try and push the event data into window.customDataLayerName
    });

## License

Licensed under the Creative Commons 4.0 International Public License. Refer to the LICENSE.MD file in the repository for the complete text of the license.

## Acknowledgements

Created by the honest folks at [LunaMetrics](http://www.lunametrics.com/), a digital marketing & Google Analytics consultancy. For questions, please drop us a line here or [on our blog](http://www.lunametrics.com/blog/).

Written by [Dan Wilkerson](https://twitter.com/notdanwilkerson).
