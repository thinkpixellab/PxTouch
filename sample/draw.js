jQuery(function() {

    var $ = jQuery,
        canvas = document.getElementById('c'),
        ctx = canvas.getContext('2d'),
        canvasOffset = $(canvas).offset(),
        $log = $('#log').val('');

    $('#clear').click(function() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        $log.val('');
    });

    function log(line) {
        $log.val($log.val() + line + '\r');
        $log.scrollTop($log[0].scrollHeight);
    }

    function logEvent(event) {
        log(event.type + ' ' + event.pointer.type + ' id:' + event.pointer.id +
            ' x:' + event.pointer.x + ' y:' + event.pointer.y);
    }

    function logGesture(event) {
        var numPaths = event.paths.length,
            i, path;

        log(event.type + ' paths: ' + numPaths);
        for (i = 0; i < numPaths; i++) {
            path = event.paths[i];
            log(' ' + (i + 1) + ':' +
                ' [' + path.startPointer.x + ',' + path.startPointer.y + '] to' +
                ' [' + path.movePointer.x + ',' + path.movePointer.y + ']');
        }
    }

    // Colors from http://kuler.adobe.com/#themeID/1943143
    var COLORS = [ '#384E66', '#C4B44D', '#661E3B', '#B8442F', '#E87F2C' ],
        colorIndex = 0,
        pointerColors = {},
        CIRCLE_RADIUS = 5;

    function drawPointer(event) {
        // get canvas relative coordinates
        var x = event.pointer.x - canvasOffset.left,
            y = event.pointer.y - canvasOffset.top,

            // dict keys must have a char prefix
            colorKey = 'c-' + event.pointer.id,
            color = pointerColors[colorKey];

        // choose a color and advance the color index
        if (!color) {
            pointerColors[colorKey] = color = COLORS[colorIndex];
            colorIndex = (colorIndex + 1) % COLORS.length;
        }

        ctx.beginPath();
        ctx.arc(x, y, CIRCLE_RADIUS, 0, 2 * Math.PI, false);
        ctx.fillStyle = color;
        ctx.fill();
    }

    $(canvas).on('click', function(event) {
        log ('canvas clicked');
    });

    $('#link').on('click', function(event) {
        log ('link clicked');
    });

    $('#touchArea').on({
        MSPointerCancel: function(event) {
            logEvent(event);
        },
        
        pointerstart: function(event) {
            logEvent(event);
            drawPointer(event);    
        },
        pointermove: function(event) {
            drawPointer(event);    

            // prevent panning the screen
            event.preventDefault();
        },
        pointerend: function(event) {
            logEvent(event);
            drawPointer(event);
            delete pointerColors['c-' + event.pointer.id];
        },

        gesturestart: function(event) {
            logGesture(event);
        },
        gesturemove: function(event) {
            //logGesture(event);
        },
        gestureend: function(event) {
            logGesture(event);
        },

        tap: function(event) {
            log('tap');
        },
        holdstart: function(event) {
            log('holdstart');
        },
        holdend: function(event) {
            log('holdend');
        },

        dragstart: function(event) {
            log(event.type + ' length:' + event.length.toFixed(2));
        },
        dragmove: function(event) {
            //log(event.type + ' angle:' + event.angle.toFixed(2));
        },
        dragend: function(event) {
            log(event.type + ' length:' + event.length.toFixed(2));
        },

        pinchstart: function(event) {
            log(event.type + ' scale:' + event.scale.toFixed(2));
        },
        pinchmove: function(event) {
            log(event.type + ' scale:' + event.scale.toFixed(2));
        },
        pinchend: function(event) {
            log(event.type + ' scale:' + event.scale.toFixed(2));
        },

        swipestart: function(event) {
            log(event.type + ' angle:' + event.angle.toFixed(2));
        },
        swipemove: function(event) {
            //log(event.type + ' angle:' + event.angle.toFixed(2));
        },
        swipeend: function(event) {
            log(event.type + ' angle:' + event.angle.toFixed(2));
        }

    });

});