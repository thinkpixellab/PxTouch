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



