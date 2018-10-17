/*! PxTouch v1.1.0 | http://github.com/thinkpixellab/pxtouch */

// single global namespace
if (typeof(PxTouch) === 'undefined') { PxTouch = {}; }

(function($) {

    PxTouch.registerSpecialEvents = function(dataKey, eventTypes, ManagerFactory) {

        $.each(eventTypes, function(i, eventType) {
            $.event.special[eventType] = {
                setup: function(data, namespaces, eventHandle) {
                    var $el = $(this),
                        manager = $el.data(dataKey);

                    // create the special event manager object if necessary
                    if (!manager) {
                        manager = new ManagerFactory($el);
                        manager.activeEventTypes = 0;
                        $el.data(dataKey, manager);
                    }

                    manager.activeEventTypes++;
                    if (manager.activeEventTypes === 1) {
                        manager.start();
                    }
                },
                teardown: function(namespaces) {
                    var manager = $(this).data(dataKey);
                    if (manager) {
                        manager.activeEventTypes--;
                        if (manager.activeEventTypes === 0) {
                            manager.stop();
                        }
                    }
                }
            };
        });
    };

})(PxTouch.jQuery || jQuery);




(function($) {

    // Per element helper that listens to mouse, touch, and MSPointer
    // events and triggers normalized jQuery pointer* events
    function Pointers($element) {

        this.$el = $element;

        // holds current set of active pointers
        this.activePointers = [];

        // we'll disable mouse events if a touch is detected
        this.mouseEventsEnabled = false;

        // serializes multiple pointers into individual events
        var normalizeEvent = function(handler, context) {
            return function(event) {
                var pointers = extractPointers(event), i, len;
                for (i = 0, len = pointers.length; i < len; i++) {
                    handler.call(context, pointers[i], event);
                }
            };
        };

        // set of native events we listen to categorized by input type
        this.listeners = {
            // IE10 uses vendor style event names
            msPointer: {
                'MSPointerDown':   normalizeEvent(onPointerStart, this),
                'MSPointerMove':   normalizeEvent(onPointerMove, this),
                'MSPointerUp':     normalizeEvent(onPointerEnd, this),
                'MSPointerCancel': normalizeEvent(onPointerCancel, this)
            },
            // IE11 uses the w3c proposed standard names
            pointer: {
                'pointerdown':   normalizeEvent(onPointerStart, this),
                'pointermove':   normalizeEvent(onPointerMove, this),
                'pointerup':     normalizeEvent(onPointerEnd, this),
                'pointercancel': normalizeEvent(onPointerCancel, this)
            }, 
            touch: {
                'touchstart':   normalizeEvent(onTouchStart, this),
                'touchmove':    normalizeEvent(onPointerMove, this),
                'touchend':     normalizeEvent(onPointerEnd, this),
                'touchcancel':  normalizeEvent(onPointerCancel, this)
            },
            mouse: {
                'mousedown':    normalizeEvent(onPointerStart, this),
                'mousemove':    normalizeEvent(onPointerMove, this),
                'mouseup':      normalizeEvent(onPointerEnd, this)
            }
        };

        // up events don't fire for mouse outside target, so listen to doc
        this.docListeners = {
            msPointer: {
                'MSPointerUp': normalizeEvent(onPointerEnd, this)
            },
            pointer: {
                'pointerup': normalizeEvent(onPointerEnd, this)
            },
            mouse: {
                'mouseup': normalizeEvent(onPointerEnd, this)
            },
            touch: {
                // when using touch mouse may work too, so add both
                'mouseup': normalizeEvent(onPointerEnd, this),
                'touchend': normalizeEvent(onPointerEnd, this)
            }
        };

        // determine whether we should also bind to the top level document
        this.useTopDocument = false;
        try {
            this.useTopDocument = (document !== top.document);
        } catch(ex) {
            // ignore exception when accessing doc from another domain
        }
    }

    Pointers.prototype.start = function() {

        var addDocListeners;
        if (window.navigator.pointerEnabled) {
            this.$el.on(this.listeners.pointer);
            addDocListeners = this.docListeners.pointer;
        } else if (window.navigator.msPointerEnabled) {
            this.$el.on(this.listeners.msPointer);
            addDocListeners = this.docListeners.msPointer;
        } else {
            // add touch events if supported
            if ('ontouchstart' in window) {
                this.$el.on(this.listeners.touch);
                
                addDocListeners = this.docListeners.touch;
            } else {
                addDocListeners = this.docListeners.mouse;
            }

            // also add mouse events (mice should still work with touchscreens)
            this.$el.on(this.listeners.mouse);
            this.mouseEventsEnabled = true;
        }

        $(document).on(addDocListeners);
        if (this.useTopDocument) {
            $(top.document).on(addDocListeners);
        }
    };

    Pointers.prototype.stop = function() {   
        this.$el
            .off(this.listeners.msPointer)
            .off(this.listeners.pointer)
            .off(this.listeners.touch)
            .off(this.listeners.mouse);

        $(document)
            .off(this.docListeners.msPointer)
            .off(this.docListeners.pointer)
            .off(this.docListeners.mouse);

        if (this.useTopDocument) {
            $(top.document)
                .off(this.docListeners.msPointer)
                .off(this.docListeners.pointer)
                .off(this.docListeners.mouse);
        }

        this.mouseEventsEnabled = false;
        this.activePointers = [];
    };

    function onTouchStart(pointer, event) {
        // remove mouse events once we recieve a touch
        if (this.mouseEventsEnabled) {
            this.$el.off(this.listeners.mouse);
            $(document).off(this.docListeners.mouse);
            this.mouseEventsEnabled = false;
        }
        return onPointerStart.call(this, pointer, event);
    }

    function onPointerStart(pointer, event) {
        // add new pointers to the active list and notify listener
        this.activePointers.push(pointer);
        this.triggerEvent('pxpointerstart', pointer, event);
    }

    function onPointerMove(pointer, event) {
        // see if we the pointer was started (might just be the mouse moving while up)
        var activeIndex = pointer.indexIn(this.activePointers);
        if (activeIndex >= 0) {

            // TODO: check to see if we've left the element

            // replace the pointer and call listener
            this.activePointers.splice(activeIndex, 1, pointer);
            this.triggerEvent('pxpointermove', pointer, event);
        }
    }

    function onPointerCancel(pointer, event) {
        return onPointerEnd.call(this, pointer, event, true);
    }

    function onPointerEnd(pointer, event, cancelled) {
        var activeIndex = pointer.indexIn(this.activePointers);
        if (activeIndex >= 0) {

            // remove active pointer and notify listener
            this.activePointers.splice(activeIndex, 1);
            this.triggerEvent('pxpointerend', pointer, event, cancelled);
        }        
    }

    function extractPointers(event) {

        // prevent touches from panning the screen
        if (event.preventManipulation) {
            event.preventManipulation();
        }

        // convert to normalized Pointer objects
        var pointers = [],
            pointerType = getPointerType(event),
            oe = event.originalEvent,
            eventPointers = oe.changedTouches || oe.targetTouches || oe.touches || [ oe ],
            i, len, ep, x, y, id;

        for (i = 0, len = eventPointers.length; i < len; i++) {
            ep = eventPointers[i];

            // get the mouse coordinate relative to the page
            // http://www.quirksmode.org/js/events_properties.html
            x = y = 0;
            if (ep.pageX || ep.pageY) {
                x = ep.pageX;
                y = ep.pageY;
            } else if (ep.clientX || ep.clientY) {
                var docEl = document.documentElement;
                x = ep.clientX + document.body.scrollLeft + docEl.scrollLeft;
                y = ep.clientY + document.body.scrollTop + docEl.scrollTop;
            }

            // pointer id is either explicit or implied using index
            id = ep.pointerId || ep.identifier || i;

            pointers.push(new Pointer(x, y, id, pointerType));
        }

        return pointers;
    }

    Pointers.prototype.triggerEvent = function(eventType, pointer, originalEvent, cancelled) {
        this.$el.trigger(new $.Event(eventType, {
            pointer: pointer,
            cancelled: (cancelled === true),
            activePointers: this.activePointers,
            originalEvent: originalEvent 
        }));
    };

    // Enumeration of supported input types
    var PointerType = {
        MOUSE: 'mouse',
        TOUCH: 'touch',
        PEN:   'pen'
    };

    // map the MS PointerType to our PointerType
    function getPointerType(event) {

        // check for touch or mouse events
        if (event.type.indexOf('touch') === 0) {
            return PointerType.TOUCH;
        } else if (event.type.indexOf('mouse') === 0) {
            return PointerType.MOUSE;
        }
            
        // check MSPointer type
        // IE10 uses numeric constants
        // IE11 uses string constants
        var oe = event.originalEvent;
        switch(oe.pointerType) {
            case oe.MSPOINTER_TYPE_MOUSE:
            case 'mouse':
                return PointerType.MOUSE;
            case oe.MSPOINTER_TYPE_TOUCH:
            case 'touch':
                return PointerType.TOUCH;
            case oe.MSPOINTER_TYPE_PEN:
            case 'pen':
                return PointerType.PEN;
        }

        // fallback to mouse
        return PointerType.MOUSE;
    }

    function Pointer(x, y, id, type) {
        this.x = x;
        this.y = y;
        this.id = id;
        this.type = type;
    }

    Pointer.prototype.getDistance = function(other) {
        var x = this.x - other.x,
            y = this.y - other.y;
        return Math.sqrt((x * x) + (y * y));
    };

    Pointer.prototype.indexIn = function(collection) {
        for (var i = 0, len = collection.length; i < len; i++) {
            if (collection[i].id === this.id) {
                return i;
            }
        }
        return -1;
    };

    PxTouch.registerSpecialEvents(
        'pxpointers',
        [ 'pxpointerstart', 'pxpointermove', 'pxpointerend'],
        Pointers);

})(PxTouch.jQuery || jQuery);




(function($) {

    function Gestures($element) {
        this.$el = $element;

        // keep track of current pointer paths
        this.paths = [];

        var onPointerHandler = $.proxy(onPointerEvent, this);
        this.listeners = {
            'pxpointerstart': onPointerHandler,
            'pxpointermove':  onPointerHandler,
            'pxpointerend':   onPointerHandler
        };
    }

    Gestures.prototype.start = function() {
        this.$el.on(this.listeners);
    };

    Gestures.prototype.stop = function() {
        this.$el.off(this.listeners);
        this.paths = [];
    };

    function onPointerEvent(event) {

        var pointer = event.pointer,
            prevPaths = this.paths.length,
            activeCount = 0,
            path, currentPath, gestureType, i, currentIndex;

        // find the existing path and count active paths
        for (i = 0; i < prevPaths; i++) {
            path = this.paths[i];
            if (path.isActive) {
                activeCount++;
            }
            if (path.id === pointer.id) {
                currentIndex = i;
                currentPath = path;
            }
        }

        if (event.cancelled) {
            // remove the path if the pointer was cancellled
            if (currentPath) {
                this.paths.splice(currentIndex, 1);
                activeCount -= currentPath.isActive ? 1 : 0;
            }
        } else {
            // update or create the path
            if (currentPath) {
                currentPath.movePointer = pointer;
                currentPath.moveTime = new Date().getTime();
            } else {
                currentPath = new Path(pointer);
                this.paths.push(currentPath);
                activeCount++;
            }

            // mark the path as inactive if pointer ended
            if (event.type === 'pxpointerend' && currentPath.isActive) {
                activeCount--;
                currentPath.isActive = false;
            }
        }

        // determine the gesture state
        if (activeCount <= 0) {
            gestureType = 'pxgestureend';
        } else if (prevPaths === 0) {
            gestureType = 'pxgesturestart';
        } else {
            gestureType = 'pxgesturemove';
        }

        this.$el.trigger(new $.Event(gestureType, {
            paths: this.paths,
            cancelled: (this.paths.length === 0),
            originalEvent: event.originalEvent
        }));

        // clear the paths if the gesture ended
        if (activeCount <= 0) {
            this.paths = [];
        }
    }

    function Path(startPointer) {
        this.id = startPointer.id;
        this.startPointer = startPointer;
        this.startTime = new Date().getTime();
        this.movePointer = startPointer;
        this.moveTime = this.startTime;
        this.isActive = true;
    }

    Path.prototype.getLength = function() {
        return Math.abs(this.movePointer.getDistance(this.startPointer));
    };

    Path.prototype.getElapsed = function() {
        return this.moveTime - this.startTime;
    };

    Path.prototype.getAngle = function() {
        var theta = Math.atan2(
            this.movePointer.y - this.startPointer.y,
            this.startPointer.x - this.movePointer.x);
        return theta / Math.PI * 180 + 180;
    };

    Path.prototype.getDirection = function() {
        var angle = this.getAngle();
        if (angle >=45 && angle < 135) { return 'up'; }
        if (angle >= 135 && angle < 225) { return 'left'; }
        if (angle >= 225 && angle < 315) { return 'down'; }
        return 'right';
    };

    Path.prototype.angleBetween = function(other) {
        var angle = Math.abs(this.getAngle() - other.getAngle());
        angle = Math.min(angle, 360 - angle);
        return angle;
    };

    PxTouch.registerSpecialEvents(
        'pxgestures',
        [ 'pxgesturestart', 'pxgesturemove', 'pxgestureend' ],
        Gestures);

})(PxTouch.jQuery || jQuery);




(function($) {

    var MAX_DISTANCE = 10, // disregard tap if finger moves too much
        MIN_HOLD_TIME = 500; // threshold between tap and hold
    
    var TapState = {
        NONE:    0, // gesture has not started
        INVALID: 1, // gesture in progress but not a tap or hold
        TAP:     2,
        HOLD:    3
    };

    function Taps($element) {
        this.$el = $element;

        // keep track of how many event *types* are being used
        this.activeEventTypes = 0;

        this.state = TapState.NONE;
        this.holdTimer = null;

        var onGestureHandler = $.proxy(onGestureEvent, this);
        this.listeners = {
            'pxgesturestart': onGestureHandler,
            'pxgesturemove':  onGestureHandler,
            'pxgestureend':   onGestureHandler
        };
    }

    Taps.prototype.start = function() {
        this.$el.on(this.listeners);
    };

    Taps.prototype.stop = function() {
        this.$el.off(this.listeners);
        this.state = TapState.NONE;
    };

    function onGestureEvent(event) {

        var paths = event.paths,
            prevState = this.state,
            isGestureEnd = (event.type === 'pxgestureend'),
            isRightClick = false,
            newState, distance;

        // don't consider right clicks as taps
        if (event.originalEvent.which) { 
            isRightClick = (event.originalEvent.which === 3);
        } else if (event.originalEvent.button) {
            isRightClick = (event.originalEvent.button === 2);
        }
        
        if (prevState === TapState.INVALID || paths.length !== 1 ||
            isRightClick || event.cancelled) {
            // too many fingers or already invalid
            newState = TapState.INVALID;
        } else {
            
            // verify the pointer hasn't moved too much
            distance = paths[0].getLength();
            if (distance > MAX_DISTANCE) {
                newState = TapState.INVALID;
            } else if (prevState === TapState.HOLD) {
                // remain in same state once in hold
                newState = TapState.HOLD;
            } else {
                newState = TapState.TAP;
            }
        }

        // do we need to either start or clear the hold timer?
        if (!this.holdTimer && newState === TapState.TAP) {
            this.holdTimer = setTimeout(
                createHoldStartTrigger(event, this),
                MIN_HOLD_TIME);
        } else if (this.holdTimer && (newState === TapState.INVALID || isGestureEnd)) {
            clearTimeout(this.holdTimer);
            this.holdTimer = null;
        }

        // did a hold just end?
        if ((newState === TapState.HOLD && isGestureEnd) ||
            (prevState === TapState.HOLD && newState !== prevState)) {
            this.triggerEvent('pxholdend', event, newState === TapState.INVALID);  
        } 
        // or should we trigger a tap 
        else if (isGestureEnd && newState === TapState.TAP) {
            this.triggerEvent('pxtap', event);  
        }

        // reset if its the end of a gesture
        this.state = isGestureEnd ? TapState.NONE : newState;
    }

    function createHoldStartTrigger(event, context) {
        return $.proxy(function() {
            this.state = TapState.HOLD;
            this.triggerEvent('pxholdstart', event);
            this.holdTimer = null;
        }, context);
    }

    Taps.prototype.triggerEvent = function(eventType, event, cancelled) {
        var pointer = event.paths.length > 0 ? event.paths[0].movePointer : null;
        this.$el.trigger(new $.Event(eventType, {
            x: pointer ? pointer.x : 0,
            y: pointer ? pointer.y : 0,
            pointerType: pointer ? pointer.type : null,
            cancelled: (cancelled === true),
            originalEvent: event.originalEvent 
        }));
    };

    PxTouch.registerSpecialEvents(
        'pxtaps',
        [ 'pxtap', 'pxholdstart', 'pxholdend' ],
        Taps);

})(PxTouch.jQuery || jQuery);

(function($) {

    var MAX_DISTANCE = 20, // disregard tap if finger moves too much
        MAX_TIME = 1000;   // max time between taps
    
    var TapState = {
        NONE:       0, // gesture has not started
        SINGLE_TAP: 1  // a single tap has been detected
    };

    function DoubleTap($element) {
        this.$el = $element;

        // keep track of how many event *types* are being used
        this.activeEventTypes = 0;

        this.state = TapState.NONE;
        this.firstX = 0;
        this.firstY = 0;
        this.firstTime = 0;

        this.listeners = { 
            'pxtap': $.proxy(onTapHandler, this)
        };
    }

    DoubleTap.prototype.start = function() {
        this.$el.on(this.listeners);
    };

    DoubleTap.prototype.stop = function() {
        this.$el.off(this.listeners);
        this.state = TapState.NONE;
    };

    function onTapHandler(event) {

        var prevState = this.state,
            newState, distance, x, y;

         if (prevState === TapState.NONE) {
            newState = TapState.SINGLE_TAP;
         } else {

            // has too much time occured since the last tap?
            var elapsed = Date.now() - this.firstTime;
            if (elapsed > MAX_TIME) {
                newState = TapState.SINGLE_TAP;
                //console.log('too much time between taps: ' + elapsed);
            } else {

                // find distance between two taps
                x = event.x - this.firstX;
                y = event.y - this.firstY;
                distance = Math.abs(Math.sqrt((x * x) + (y * y)));
                
                // verify the pointer hasn't moved too much
                if (distance > MAX_DISTANCE) {
                    newState = TapState.SINGLE_TAP;
                    //console.log('taps too far apart: ' + distance);
                } else {

                    // trigger the double tap
                    this.$el.trigger(new $.Event('pxdoubletap', {
                        x: event.x,
                        y: event.y,
                        pointerType: event.pointerType,
                        originalEvent: event.originalEvent 
                    }));

                    // reset tap state
                    newState = TapState.NONE;
                }
            }
        }

        // capture info for first tap
        if (newState === TapState.SINGLE_TAP) {
            this.firstX = event.x;
            this.firstY = event.y;
            this.firstTime = Date.now();
        }

        this.state = newState;
    }

    PxTouch.registerSpecialEvents('pxdoubletap', [ 'pxdoubletap' ], DoubleTap);

})(PxTouch.jQuery || jQuery);




(function($) {

        // minimum length of at least one side before its considered a pinch
    var MIN_LENGTH = 10,

        // min length of both sides before angle check is required
        ANGLE_CHECK_MIN_LENGTH = 15,

        // min angle between lines (parallel lines are not a pinch)
        MIN_ANGLE_DEGREES = 30;


    var PinchState = {
        NONE:    0,
        PINCH:   1,
        INVALID: 2
    };

    function Pinch($element) {
        this.$el = $element;

        this.state = PinchState.NONE;

        var onGestureHandler = $.proxy(onGestureEvent, this);
        this.listeners = {
            'pxgesturestart': onGestureHandler,
            'pxgesturemove':  onGestureHandler,
            'pxgestureend':   onGestureHandler
        };
    }

    Pinch.prototype.start = function() {
        this.$el.on(this.listeners);
    };

    Pinch.prototype.stop = function() {
        this.$el.off(this.listeners);
        this.state = PinchState.NONE;
    };

    function onGestureEvent(event) {

        var paths = event.paths,
            prevState = this.state,
            isGestureEnd = (event.type === 'pxgestureend'),
            pathA, pathB, aLen, bLen, moveDistance, startDistance, scale;
            
        if (prevState !== PinchState.INVALID) {

            // we only support 2 finger pinch
            if (paths.length > 2 || event.cancelled) {
                this.state = PinchState.INVALID;
            } else if (paths.length === 2) {
                
                // get the length of each path 
                pathA = paths[0];
                pathB = paths[1];
                aLen = pathA.getLength();
                bLen = pathB.getLength();

                // make sure at least one side is bigger than the minimum
                if (aLen > MIN_LENGTH || bLen > MIN_LENGTH) {

                    // do we need to check the angle betwen the lines?
                    if (aLen > ANGLE_CHECK_MIN_LENGTH && bLen > ANGLE_CHECK_MIN_LENGTH) {
                        //console.log('angle between: ' + pathA.angleBetween(pathB).toFixed(2));
                        if (pathA.angleBetween(pathB) >= MIN_ANGLE_DEGREES) {
                            this.state = PinchState.PINCH;
                        } else {
                            this.state = PinchState.INVALID;
                        }
                    } else {
                        this.state = PinchState.PINCH;
                    }
                }

                if (this.state === PinchState.PINCH) {
                    moveDistance = pathA.movePointer.getDistance(pathB.movePointer);
                    startDistance = pathA.startPointer.getDistance(pathB.startPointer);

                    // calc the origin and scale and trigger the event
                    var eventData = {
                        originX: (pathA.movePointer.x + pathB.movePointer.x) / 2,
                        originY: (pathA.movePointer.y + pathB.movePointer.y) / 2,
                        scale: moveDistance / startDistance,
                        paths: paths,
                        cancelled: false,
                        originalEvent: event.originalEvent
                    };

                    if (prevState === PinchState.NONE) {
                        this.$el.trigger($.Event('pxpinchstart', eventData));
                    } else if (!isGestureEnd) {
                        this.$el.trigger($.Event('pxpinchmove', eventData));
                    }

                    if (isGestureEnd) {
                        this.$el.trigger($.Event('pxpinchend', eventData));
                    }
                }
            } 

            if (this.state === PinchState.INVALID && prevState === PinchState.PINCH) {
                this.$el.trigger($.Event('pxpinchend', {
                    originX: 0,
                    originY: 0,
                    scale: 0,
                    paths: [],
                    cancelled: true,
                    originalEvent: event.originalEvent
                }));
            }
        }
        
        if (isGestureEnd) {
            // reset validity if the gesture is done
            this.state = PinchState.NONE;
        }
    }

    PxTouch.registerSpecialEvents(
        'pxpinch',
        [ 'pxpinchstart', 'pxpinchmove', 'pxpinchend'],
        Pinch);

})(PxTouch.jQuery || jQuery);




(function($) {

        // minimum length of a path before its considered a drag
    var MIN_LENGTH = 10,

        // max distance between two paths
        MAX_SEPARATION = 200;

    var DragState = {
        NONE:    0,
        DRAG:    1,
        INVALID: 2
    };

    function Drag($element) {
        this.$el = $element;

        this.state = DragState.NONE;

        var onGestureHandler = $.proxy(onGestureEvent, this);
        this.listeners = {
            'pxgesturestart': onGestureHandler,
            'pxgesturemove':  onGestureHandler,
            'pxgestureend':   onGestureHandler
        };
    }

    Drag.prototype.start = function() {
        this.$el.on(this.listeners);
    };

    Drag.prototype.stop = function() {
        this.$el.off(this.listeners);
        this.state = DragState.NONE;
    };

    // helper to verify that the path endpoints are close to eachother
    function arePathsClose(paths) {
        var numPaths = paths.length,
            i, j, path, isClose, separation;

        if (numPaths > 1) {
            for (i = 0; i < numPaths; i++) {

                // only measure separation for active paths
                path = paths[i];
                if (path.isActive) {
                    
                    isClose = false;
                    for (j = 0; j < numPaths; j++) {
                        // don't check distance for same point
                        if (i === j) {
                            continue;
                        }

                        // see if the endpoint is close to the other path's endpoint
                        separation = path.movePointer.getDistance(paths[j].movePointer);
                        if (separation <= MAX_SEPARATION) {
                            isClose = true;
                            break;
                        }
                    }

                    // fail if even a single point is too far away
                    if (!isClose) { return false; }
                }
            }
        }
        return true;
    }

    function onGestureEvent(event) {

        var paths = event.paths,
            prevState = this.state,
            isGestureEnd = (event.type === 'pxgestureend'),
            path, length;
            
        if (prevState !== DragState.INVALID) {

            // we'll validate that all points are relatively close but then
            // we just use the first path for all remaining checks
            length = (paths.length > 0) ? paths[0].getLength() : 0;

            var eventData = {
                paths: paths,
                length: length,
                cancelled: event.cancelled,
                originalEvent: event.originalEvent
            };

            if (event.cancelled || !arePathsClose(event.paths)) {
                this.state = DragState.INVALID;
                eventData.cancelled = true;
            } else {

                if (this.state === DragState.NONE) {

                    // start the drag gesture
                    if (length > MIN_LENGTH) {
                        this.state = DragState.DRAG;
                        this.$el.trigger($.Event('pxdragstart', eventData));
                    }
                } else if (!isGestureEnd) {
                    this.$el.trigger($.Event('pxdragmove', eventData));
                }
            }

            if ((prevState === DragState.DRAG && this.state === DragState.INVALID) ||
                (this.state === DragState.DRAG && isGestureEnd)) {
                this.$el.trigger($.Event('pxdragend', eventData));
            }
        }

        // reset validity if the gesture is done
        if (isGestureEnd) {
            this.state = DragState.NONE;
        }
    }

    PxTouch.registerSpecialEvents(
        'pxdrag',
        [ 'pxdragstart', 'pxdragmove', 'pxdragend'],
        Drag);

})(PxTouch.jQuery || jQuery);




(function($) {

        // swipe should not travel backwards very much
    var MAX_LENGTH_VARIATION = 20,

        // swipe shouldn't be too curved
        MAX_ANGLE_VARIATION = 20;

    var SwipeState = {
        NONE:    0,
        SWIPE:   1,
        INVALID: 2
    };

    function Swipe($element) {
        this.$el = $element;

        this.state = SwipeState.NONE;

        // track the maximum length
        this.maxLength = 0;
        this.angle = 0;

        var onDragHandler = $.proxy(onDragEvent, this);
        this.listeners = {
            'pxdragstart': onDragHandler,
            'pxdragmove':  onDragHandler,
            'pxdragend':   onDragHandler
        };
    }

    Swipe.prototype.start = function() {
        this.$el.on(this.listeners);
    };

    Swipe.prototype.stop = function() {
        this.$el.off(this.listeners);
        this.state = SwipeState.NONE;
        this.maxLength = 0;
        this.angle = 0;
    };

    function onDragEvent(event) {

        var paths = event.paths,
            prevState = this.state,
            isDragEnd = (event.type === 'pxdragend'),
            length = event.length,
            angle, angleDiff;
            
        if (this.state !== SwipeState.INVALID) {

            angle = (paths.length > 0) ? paths[0].getAngle() : 0;

            var eventData = {
                length: length,
                angle: angle,
                paths: paths,
                cancelled: event.cancelled,
                originalEvent: event.originalEvent
            };

            if (event.cancelled) {
                this.state = SwipeState.INVALID;
            } else if (this.state === SwipeState.NONE) {
                // start the swipe gesture
                this.state = SwipeState.SWIPE;
                this.maxLength = length;
                this.angle = angle;
                this.$el.trigger($.Event('pxswipestart', eventData));
            } else {

                // verify that the length and angle don't vary too much
                if (length >= this.maxLength) {
                    this.maxLength = length;
                } else if (this.maxLength - length > MAX_LENGTH_VARIATION) {
                    this.state = SwipeState.INVALID;
                }

                angleDiff = Math.abs(this.angle - angle);
                if (Math.min(angleDiff, 360 - angleDiff)  > MAX_ANGLE_VARIATION) {
                    this.state = SwipeState.INVALID;
                }

                if (this.state !== SwipeState.INVALID && !isDragEnd) {
                    this.$el.trigger($.Event('pxswipemove', eventData));
                }
            }

            if ((prevState === SwipeState.SWIPE && this.state === SwipeState.INVALID) ||
                (this.state === SwipeState.SWIPE && isDragEnd)) {
                eventData.cancelled = (this.state === SwipeState.INVALID);
                this.$el.trigger($.Event('pxswipeend', eventData));
            }
        }

        // reset validity if the gesture is done
        if (isDragEnd) {
            this.state = SwipeState.NONE;
            this.maxLength = 0;
            this.angle = 0;
        }
    }

    PxTouch.registerSpecialEvents(
        'pxswipe',
        [ 'pxswipestart', 'pxswipemove', 'pxswipeend'],
        Swipe);

})(PxTouch.jQuery || jQuery);



