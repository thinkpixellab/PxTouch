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



