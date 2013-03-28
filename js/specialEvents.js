
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
                        manager.start();
                        $el.data(dataKey, manager);
                    }
                    
                    manager.activeEventTypes++;
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



