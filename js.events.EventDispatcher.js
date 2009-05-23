js.events = {};

js.events.EventDispatcher = new js.lang.Class()  ({
    __init__ : function()  {
        this._eventListeners = new js.util.ArrayList();
    },
    
    addEventListener : function( listener )  {
        this._eventListeners.add( listener );
    },
    
    hasEventListener : function( listener )  {
        return( this._eventListeners.contains( listener ) );
    },
    
    removeEventListener : function( listener )  {
        this._eventListeners.remove( listener, this._eventListenerComparator );
    },
    
    _eventListenerComparator : function( a, b )  {
        return( a === b );
    },
    
    //  TODO: event-args is extended and optional params are added on a per-type basis
    //  TODO: add CancelBubble (return false?  or throw new js.events.EventDispatcher.Events.CancelEvent())
    dispatchEvent : function( event, eventArgs )  {
        var dispatcher = this;
        var eventHandle = 'handle$' + event;
        
        this._eventListeners.iterate( function( k, listener )  {
            if( (listener instanceof Object) && (eventHandle in listener) )  {
                listener[ eventHandle ]( dispatcher, eventArgs );
            }
        });
    }
});
