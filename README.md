# PxTouch

PxTouch is a jQuery plugin designed to normalize mouse and touch events across all modern browsers. Our goal is to make is easier to create touch enabled sites that work everywhere. We support simple touch events along with a set of multi-touch gestures.

---

## Simple Example

Scenario: a user is reading an article contained inside an div. The following code adds a pinch-to-close gesture to the article element:

```javascript
$('#article').on('pxpinchend', function(event) {
    if (event.scale <= 0.60) {
        $('#close-button').trigger('click');
    }
});
```

## Draw Sample

We've created a drawing sample that will log all pointer and gesture related events. Try using your mouse to draw on the canvas and then try experimenting with gestures on a touch device.

### Try the Online Demo
[http://thinkpixellab.com/pxtouch/](http://thinkpixellab.com/pxtouch/)


### Building the Sample Locally
1. Clone the repostiory to your machine.
2. Install NodeJS from [http://nodejs.org/](http://nodejs.org)
3. Open a command prompt and navigate to the project's root directory (where you cloned the repository)
4. Run the command "npm install" to install grunt and its plugins
5. Run the command "npm install -g grunt-cli" to install grunt command line globally
6. Run "grunt" to build the project
7. Open the /sample/index.html page in your browser


---

## Components
PxTouch is separated into several pieces. Developers can pick and choose which features they would like to use.

### Pointers
The core component consolidates mouse, touch, and pen events into a single pointer event. This follows the MSPointer model introduced in IE10 and later submitted for [consideration as an W3C open standard](http://www.w3.org/2012/pointerevents/).  In IE10, we simply listen to MSPointer events. In IE11, we listen to the W3C proposed standard pointer* style events. For other browers, we normalize mouse and touch events.

- Events: pxpointerstart, pxpointermove, pxpointerend
- Concurrent touch events are serialized into single events
- We use a fallback document listener to ensure end events always fire event when the up occurs outside the target element.
- Each event includes the pointer (x, y, id, inputType) which changed, a set of active pointers, and a flag to indicate whether the pointer was cancelled.

### Gestures
This component listens to the pointer* events and provides some common functionality to enable higher level gestures. Gesture events are built with multi-touch in mind and keep track of each pointer individually.

- Events: pxgesturestart, pxgesturemove, pxgestureend
- When a gesture starts we create a Path, which keeps track of the initial pointer & timestamp plus the current pointer.
- The path has convenience methods to calculate the length, elapsed time, angle, general direction, etc.
- Gesture events include a set of paths, one for each pointer.
- If a individual pointer ends, the path is marked as inactive. Example: in a two finger gesture the user might lift one finger up slightly before the other.
- If a pointer is cancelled, the path is removed. If all pointers are cancelled, then the gesture is also flagged as cancelled (in the pxgestureend event).

### Taps
Most browsers will synthesize a click event at the end of a gesture. This ensures that sites which use click events will still work correctly. However, sometimes you don’t want a gesture to trigger a click event (example: swiping in a newsreader should not trigger a click if the swipe ends over a link). 

Of course you can cancel the default behavior which will prevent the click, but in some cases that can cause issues (kills scrolling in some browsers and you have to be careful not to disable an intended tap by the user). For these cases, its better to listen to a gesture-aware tap event instead of the native click event.

In addition to a tap event, we also have a hold event which can detect when the user holds a pointer in the same place. We’ll fire a holdstart event after half a second and then fire an holdend event when the user either lifts their finger or drags away.

### Pinch
Listening to the base gesture events we can detect when the user uses two fingers in a pinching or expanding motion. 

- Events: pxpinchstart, pxpinchmove, pxpinchend
- Pinch events include: Component paths, Scale, Origin x & y (midpoint between the two fingers)
- The cancelled flag on the end event indicates if the gesture could no longer be classified as a pinch (but fingers still may be moving)

### Drag
Listens to base gesture events and and fires once the user begins to move one or more pointers in the same path. Pointers should be relatively close to each other during the entire path.

- Events: pxdragstart, pxdragmove, pxdragend
- Drag events include the component paths and the length of the first path.
- The cancelled flag (on the pxdragend event) indicates whether the conditions necessary to classify the gesture as a drag are no longer true.

### Swipe
Builds on top of the drag events. Gesture must meet the drag preconditions and additionally we ensure that the gesture is progressing in the same general direction. 

- Events: pxswipestart, pxswipemove, pxswipeend
- Swipe events include set of component paths plus the angle and length (of the first path)
- The event will be flagged as cancelled if the user’s finger travels too far backwards or begins to curve too much.





---

### The MIT License

Copyright (c) 2013 Pixel Lab

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.