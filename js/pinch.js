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
            'gesturestart': onGestureHandler,
            'gesturemove':  onGestureHandler,
            'gestureend':   onGestureHandler
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
            isGestureEnd = (event.type === 'gestureend'),
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
                        this.$el.trigger($.Event('pinchstart', eventData));
                    } else if (!isGestureEnd) {
                        this.$el.trigger($.Event('pinchmove', eventData));
                    }

                    if (isGestureEnd) {
                        this.$el.trigger($.Event('pinchend', eventData));
                    }
                }
            } 

            if (this.state === PinchState.INVALID && prevState === PinchState.PINCH) {
                this.$el.trigger($.Event('pinchend', {
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
        'pxtouch.pinch',
        [ 'pinchstart', 'pinchmove', 'pinchend'],
        Pinch);

})(PxTouch.jQuery || jQuery);



