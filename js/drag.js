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



