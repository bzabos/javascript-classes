/*jslint forin: true */

if (! ('js' in this)) {
    this.js = {};
}

js.util = (js.util || {});

js.util.arrayContainsAll = function(a, b) {
    /** Checks if a is a list of the same objects as b. **/
    for (var contains = 0, i = 0; i < b.length; i++) {
        for (var j = 0; j < a.length; j++) {
            if (a[j] === b[i]) {
                contains++;
                break;
            }
        }

        if (contains < i) {
            return (false);
        }
    }

    return (contains === b.length);
};

js.util.objectMergeAll = function(dest, srcs) {
    /** Merges all properties of each object in sources (srcs) to destination (dest). **/
    for (var src, p, i = (srcs.length - 1); i >= 0; i--) {
        src = srcs[i];

        for (p in src) {
            if (!src.hasOwnProperty(p)) {
                continue;
            }
            dest[p] = src[p];
        }
    }
};



// global logger
js.log = function(msg) {
    js.log.appendLog(msg);

    if (js.settings.debug) {
        js.log._logger(msg);
    }
};

js.log._logItems = [];

js.log.appendLog = function(msg) {
    var logItem = {};
    logItem[String(new Date())] = String(msg);

    js.log._logItems.push(logItem);
};

js.log._logger = (function(console, print) {
    if ((console !== undefined) && ('log' in console)) {
        return (function(msg) {
            console.log(msg);
        });
    }
    else if ((print !== undefined) && (print.constructor === Function)) {
        return (print);
    }
    return (function() {});
})(this.console, this.print);

js.lang = (js.lang || {});

// reference to global context (in a browser: window)
js.lang.GlobalContext = (function() {
    return (this);
})();

// consumer settings/preferences
js.settings = {
    debug:           (js.lang.GlobalContext.JS_DEBUG            || false),
    globalClass:     (js.lang.GlobalContext.JS_GLOBAL_CLASS     || false),
    globalInterface: (js.lang.GlobalContext.JS_GLOBAL_INTERFACE || false),
    globalNamespace: (js.lang.GlobalContext.JS_GLOBAL_NAMESPACE || false)
};

// delete global clobbers (i.e. doesn't allow munging global-context.)
try {
    delete(js.lang.GlobalContext.JS_DEBUG);
    delete(js.lang.GlobalContext.JS_GLOBAL_CLASS);
    delete(js.lang.GlobalContext.JS_GLOBAL_INTERFACE);
    delete(js.lang.GlobalContext.JS_GLOBAL_NAMESPACE);
} catch(e) {/* do nothing. */}

// prototype munging
// TODO: inheritance with static members?
Function.prototype.Static = function(methods) {
    js.util.objectMergeAll(this, [methods]);
    return (this);
};

Function.prototype.Implements = function(/* Interface, Interface, ... */) {
    this.__implements__ =
        ((this.prototype && this.prototype.constructor && this.prototype.constructor.__implements__) || []).slice();

    // TODO: __implements__ needs to be unique. (set(this.__implements__, arguments))
    Array.prototype.push.apply(this.__implements__, arguments);

    return (this);
};

Function.prototype.enforces = function(/* Interface, Interface, ... */) {
    return (js.util.arrayContainsAll(this.__implements__, arguments));
};

// Class
js.lang.Class = function(/* Parent, Parent, ... */) {
    var c = js.lang.Class.generateClass(js.lang.Class.classInvokedWithGlobal);
    js.lang.Class.extend(c, Array.apply([], arguments));

    return (c);
};

js.lang.Class.STATIC_INIT_INVOKED_WITH_GLOBAL = 'Static method __init__ requires a context. nie: Parent.__init__.call( this );';
js.lang.Class.CLASS_INSTANTIATED_WITHOUT_BODY = 'Class requires a class body. ie:\nA = new Class()  ({\n\t__init__ : function()  {}\n});';
js.lang.Class._extending = false;

js.lang.Class.generateClass = function(globalContextCallback) {
    var c = function() {
        return (js.lang.Class.__constructor__.call(this, c, globalContextCallback, arguments));
    };

    c.__init__ = function() {
        return (js.lang.Class.__init__.call(this, c, arguments));
    };

    return (c);
};

js.lang.Class.__constructor__ = function(c, globalContextCallback, args) {
    if (this === js.lang.GlobalContext) {
        return (globalContextCallback.call(this, c, args));
    }

    if (!c.__initialized__) {
        throw new ReferenceError(js.lang.Class.CLASS_INSTANTIATED_WITHOUT_BODY);
    }

    this.constructor = c;

    if (js.lang.Class._extending || !c.prototype.hasOwnProperty('__init__')) {
        return (undefined);
    }

    return (js.lang.Class.invokeIfExists(this, this.__init__, args));
};

js.lang.Class.__init__ = function(c, args) {
    if (this instanceof Function) {
        throw new TypeError(js.lang.Class.STATIC_INIT_INVOKED_WITH_GLOBAL);
    }

    return (js.lang.Class.invokeIfExists(this, c.prototype.__init__, args));
};

// TODO: extendClasses
js.lang.Class.extend = function(c, parents) {
    var parent = (parents[0] || Object);

    js.lang.Class._extending = true;
    try {
        c.prototype = new parent();
    }
    finally {
        js.lang.Class._extending = false;
    }

    if (parents.length > 1) {
        js.lang.Class.mergePrototypes(c, parents);
    }

    c.prototype.constructor = parent;

    if (parent === Object) {
        delete(c.prototype.constructor.prototype);
    }
};

js.lang.Class.extendObjects = function(c, parents) {
    // TODO: this is repeated three times.. extract into generic extend!
    c.prototype = (parents[0] || {});

    if (parents.length > 1) {
        js.util.objectMergeAll(c.prototype, parents);
    }
};

js.lang.Class.invokeIfExists = function(context, func, args) {
    if ((typeof(func) !== 'undefined') && (func.constructor === Function)) {
        return (func.apply(context, (args || [])));
    }
    return (undefined);
};

js.lang.Class.mergePrototypes = function(c, parents) {
    for (var i = 0; i < parents.length; i++) {
        parents[i] = parents[i].prototype;
    }

    js.util.objectMergeAll(c.prototype, parents);
};

js.lang.Class.classInvokedWithGlobal = function(c, parents) {
    js.util.objectMergeAll(c.prototype, parents);

    if ('__implements__' in c) {
        js.lang.Interface.bindStubs(c, c.__implements__);
    }

    c.__initialized__ = true;

    return (c);
};


// Interface
js.lang.Interface = function(/* Parent, Parent, ... */) {
    var c = js.lang.Class.generateClass(js.lang.Interface.interfaceInvokedWithGlobal);
    js.lang.Class.extendObjects(c, Array.apply([], arguments));
    return (c);
};

js.lang.Interface.METHOD_NOT_IMPLEMENTED = "Method '{name}' not implemented; desired signature: {name}({parameters}).";

// TODO: bindStubsAll?
js.lang.Interface.bindStubs = function(c, interfaces) {
    var proto = c.prototype;

    for (var i = 0, s, stubs; i < interfaces.length; i++) {
        stubs = interfaces[i]._stubs;

        for (s in stubs) {
            if (! (stubs.hasOwnProperty(s) && !(s in proto))) {
                continue;
            }

            js.log(stubs[s].__message);
            proto[s] = stubs[s];
        }
    }
};

// TODO: generateStubsAll?
js.lang.Interface.generateStubs = function(stubs) {
    for (var s in stubs) {
        if (!stubs.hasOwnProperty(s)) {
            continue;
        }
        stubs[s] = js.lang.Interface.generateStub(s, stubs[s]);
    }

    return (stubs);
};

js.lang.Interface.generateStub = function(name, parameters) {
    var stub = function() {
        throw new ReferenceError(stub.__message);
    };

    stub.__message = js.lang.Interface.generateStubMessage(name, parameters);
    stub.__parameters = parameters;

    return (stub);
};

js.lang.Interface.generateStubMessage = function(name, parameters) {
    return (js.lang.Interface.METHOD_NOT_IMPLEMENTED
    .replace(/\{name\}/g, name)
    .replace(/\{parameters\}/g, (parameters || []).join(', ')));
};

js.lang.Interface.interfaceInvokedWithGlobal = function(c, args) {
    c.__initialized__ = true;

    var iface = new c();

    var stubs = {};
    js.util.objectMergeAll(stubs, [js.lang.Interface.generateStubs(args[0]), iface._stubs]);
    iface._stubs = stubs;

    return (iface);
};

// initialize settings/preferences
if (js.settings.globalClass) {
    Class = js.lang.Class;
}

if (js.settings.globalInterface) {
    Interface = js.lang.Interface;
}
