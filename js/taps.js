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
