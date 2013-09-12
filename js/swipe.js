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



