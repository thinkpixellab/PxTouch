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
            msPointer: {
                'MSPointerDown':   normalizeEvent(onPointerStart, this),
                'MSPointerMove':   normalizeEvent(onPointerMove, this),
                'MSPointerUp':     normalizeEvent(onPointerEnd, this),
                'MSPointerCancel': normalizeEvent(onPointerCancel, this)
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
            mouse: {
                'mouseup': normalizeEvent(onPointerEnd, this)
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

        if (window.navigator.msPointerEnabled) {
            this.$el.on(this.listeners.msPointer);
            $(document).on(this.docListeners.msPointer);
            if (this.useTopDocument) {
                $(top.document).on(this.docListeners.msPointer);
            }
        } else {
            // add touch events if supported
            if ('ontouchstart' in window) {
                this.$el.on(this.listeners.touch);
            }

            // also add mouse events (mice should still work with touchscreens)
            this.$el.on(this.listeners.mouse);
            $(document).on(this.docListeners.mouse);
            if (this.useTopDocument) {
                $(top.document).on(this.docListeners.mouse);
            }
            this.mouseEventsEnabled = true;
        }
    };

    Pointers.prototype.stop = function() {   
        this.$el
            .off(this.listeners.msPointer)
            .off(this.listeners.touch)
            .off(this.listeners.mouse);

        $(document)
            .off(this.docListeners.msPointer)
            .off(this.docListeners.mouse);

        if (this.useTopDocument) {
            $(top.document)
                .off(this.docListeners.msPointer)
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
        this.triggerEvent('pointerstart', pointer, event);
    }

    function onPointerMove(pointer, event) {
        // see if we the pointer was started (might just be the mouse moving while up)
        var activeIndex = pointer.indexIn(this.activePointers);
        if (activeIndex >= 0) {

            // TODO: check to see if we've left the element

            // replace the pointer and call listener
            this.activePointers.splice(activeIndex, 1, pointer);
            this.triggerEvent('pointermove', pointer, event);
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
            this.triggerEvent('pointerend', pointer, event, cancelled);
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
        var oe = event.originalEvent;
        switch(oe.pointerType) {
            case oe.MSPOINTER_TYPE_MOUSE:
                return PointerType.MOUSE;
            case oe.MSPOINTER_TYPE_TOUCH:
                return PointerType.TOUCH;
            case oe.MSPOINTER_TYPE_PEN:
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
        'pxtouch.pointers',
        [ 'pointerstart', 'pointermove', 'pointerend'],
        Pointers);

})(PxTouch.jQuery || jQuery);



