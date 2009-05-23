/*jslint forin: true */

if (! ('js' in this)) {
    this.js = {};
}

// global logger
js.log = function(msg) {
    js.log.__appendLog__(msg);

    if (js.settings.debug) {
        js.log.__logger__(msg);
    }
};

js.log.__logItems__ = [];

js.log.__appendLog__ = function(msg) {
    var logItem = {};
    logItem[String(new Date())] = String(msg);

    js.log.__logItems__.push(logItem);
};

js.log.__logger__ = (function(console, print) {
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

// js.lang namespace
js.lang = (js.lang || {});

// reference to global context (in a browser: window)
js.lang.GlobalContext = (function() {
    return (this);
})();

// consumer settings/preferences
js.settings = {
    debug: (js.lang.GlobalContext.JS_DEBUG || false),
    globalClass: (js.lang.GlobalContext.JS_GLOBAL_CLASS || false),
    globalInterface: (js.lang.GlobalContext.JS_GLOBAL_INTERFACE || false),
    globalNamespace: (js.lang.GlobalContext.JS_GLOBAL_NAMESPACE || false)
};

// delete global clobbers (i.e. doesn't allow munging global-context.)
try {
    delete(js.lang.GlobalContext.JS_DEBUG);
    delete(js.lang.GlobalContext.JS_GLOBAL_CLASS);
    delete(js.lang.GlobalContext.JS_GLOBAL_INTERFACE);
    delete(js.lang.GlobalContext.JS_GLOBAL_NAMESPACE);
} catch(e) {}

// prototype munging
// TODO: inheritance with static members?
Function.prototype.Static = function(methods) {
    js.lang.Class.__merge__(this, [methods]);
    return (this);
};

Function.prototype.Implements = function(
/* Interface, Interface, ... */
) {
    this.__implements__ =
    ((this.prototype && this.prototype.constructor && this.prototype.constructor.__implements__) || []).slice();

    // TODO: __implements__ needs to be unique. (set(this.__implements__, arguments))
    Array.prototype.push.apply(this.__implements__, arguments);

    return (this);
};

Function.prototype.enforces = function(
/* Interface, Interface, ... */
) {
    return (js.lang.Class.__arrayContainsAll__(this.__implements__, arguments));
};

// Class
js.lang.Class = function(
/* Parent, Parent, ... */
) {
    var c = js.lang.Class.__generateClass__(js.lang.Class.__classInvokedWithGlobal__);
    js.lang.Class.__extend__(c, Array.apply([], arguments));

    return (c);
};

js.lang.Class.__STATIC_INIT_INVOKED_WITH_GLOBAL__ = 'Static method __init__ requires a context. nie: Parent.__init__.call( this );';
js.lang.Class.__CLASS_INSTANTIATED_WITHOUT_BODY__ = 'Class requires a class body. ie:\nA = new Class()  ({\n\t__init__ : function()  {}\n});';
js.lang.Class.__extending__ = false;

js.lang.Class.__generateClass__ = function(globalContextCallback) {
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
        throw new ReferenceError(js.lang.Class.__CLASS_INSTANTIATED_WITHOUT_BODY__);
    }

    this.constructor = c;

    if (js.lang.Class.__extending__ || !c.prototype.hasOwnProperty('__init__')) {
        return (undefined);
    }

    return (js.lang.Class.__invoke__(this, this.__init__, args));
};

js.lang.Class.__init__ = function(c, args) {
    if (this instanceof Function) {
        throw new TypeError(js.lang.Class.__STATIC_INIT_INVOKED_WITH_GLOBAL__);
    }

    return (js.lang.Class.__invoke__(this, c.prototype.__init__, args));
};

// TODO: extendClasses
js.lang.Class.__extend__ = function(c, parents) {
    var parent = (parents[0] || Object);

    js.lang.Class.__extending__ = true;
    try {
        c.prototype = new parent();
    }
    finally {
        js.lang.Class.__extending__ = false;
    }

    if (parents.length > 1) {
        js.lang.Class.__mergePrototypes__(c, parents);
    }

    c.prototype.constructor = parent;

    if (parent === Object) {
        delete(c.prototype.constructor.prototype);
    }
};

js.lang.Class.__extendObjects__ = function(c, parents) {
    // TODO: this is repeated three times.. extract into generic extend?
    c.prototype = (parents[0] || {});

    if (parents.length > 1) {
        js.lang.Class.__merge__(c.prototype, parents);
    }
};

js.lang.Class.__invoke__ = function(context, func, args) {
    if ((typeof(func) !== 'undefined') && (func.constructor === Function)) {
        return (func.apply(context, (args || [])));
    }
    return (undefined);
};

js.lang.Class.__mergePrototypes__ = function(c, parents) {
    for (var i = 0; i < parents.length; i++) {
        parents[i] = parents[i].prototype;
    }

    js.lang.Class.__merge__(c.prototype, parents);
};

// TODO: mergeAll ?
js.lang.Class.__merge__ = function(dest, srcs) {
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

js.lang.Class.__arrayContainsAll__ = function(a, b) {
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

js.lang.Class.__classInvokedWithGlobal__ = function(c, parents) {
    js.lang.Class.__merge__(c.prototype, parents);

    if ('__implements__' in c) {
        js.lang.Interface.__bindStubs__(c, c.__implements__);
    }

    c.__initialized__ = true;

    return (c);
};


// Interface
js.lang.Interface = function(
/* Parent, Parent, ... */
) {
    var c = js.lang.Class.__generateClass__(js.lang.Interface.__interfaceInvokedWithGlobal__);
    js.lang.Class.__extendObjects__(c, Array.apply([], arguments));
    return (c);
};

js.lang.Interface.__METHOD_NOT_IMPLEMENTED__ = "Method '{name}' not implemented; desired signature: {name}({parameters}).";

// TODO: bindStubsAll?
js.lang.Interface.__bindStubs__ = function(c, interfaces) {
    var proto = c.prototype;

    for (var i = 0, s, stubs; i < interfaces.length; i++) {
        stubs = interfaces[i]._stubs;

        for (s in stubs) {
            if (! (stubs.hasOwnProperty(s) && !(s in proto))) {
                continue;
            }

            js.log(stubs[s].__message__);
            proto[s] = stubs[s];
        }
    }
};

// TODO: generateStubsAll?
js.lang.Interface.__generateStubs__ = function(stubs) {
    for (var s in stubs) {
        if (!stubs.hasOwnProperty(s)) {
            continue;
        }
        stubs[s] = js.lang.Interface.__generateStub__(s, stubs[s]);
    }

    return (stubs);
};

js.lang.Interface.__generateStub__ = function(name, parameters) {
    var stub = function() {
        throw new ReferenceError(stub.__message__);
    };

    stub.__message__ = js.lang.Interface.__generateStubMessage__(name, parameters);
    stub.__parameters__ = parameters;

    return (stub);
};

js.lang.Interface.__generateStubMessage__ = function(name, parameters) {
    return (js.lang.Interface.__METHOD_NOT_IMPLEMENTED__
    .replace(/\{name\}/g, name)
    .replace(/\{parameters\}/g, (parameters || []).join(', ')));
};

js.lang.Interface.__interfaceInvokedWithGlobal__ = function(c, args) {
    c.__initialized__ = true;

    var iface = new c();

    var stubs = {};
    js.lang.Class.__merge__(stubs, [js.lang.Interface.__generateStubs__(args[0]), iface._stubs]);
    iface._stubs = stubs;

    return (iface);
};

// Namespace
// TODO: lazy-load these?!
// TODO: avoid eval: js.lang.Namespace('js.lang.Class', {});
// TODO: avoid eval: js.lang.Namespace('js.lang.Class', js.lang.Class);
// js.lang.Namespace = function(/* namespace, namespace, ... */) {
//     var namespace;
//     for (var i = 0; i < arguments.length; i++) {
//         namespace = eval(arguments[i]);
//         namespace.__namespace__ = js.lang.Namespace.generateNamespace(arguments[i], namespace);
//     }
// };
// 
// js.lang.Namespace.__NAMESPACE_TEMPLATE__ = 'var {property}={namespace}.{property};';
// 
// js.lang.Namespace.generateNamespace = function(id, namespace) {
//     var imports = '';
//     var template = js.lang.Namespace.__NAMESPACE_TEMPLATE__
//     .replace(/\{namespace\}/g, id);
// 
//     for (var p in namespace) {
//         if (!namespace.hasOwnProperty(p) || (p === 'prototype')) {
//             continue;
//         }
//         imports += template.replace(/\{property\}/g, p);
//     }
// 
//     return (imports);
// };

// generate & cache namespaces
// TODO: eval is slow; list manip?
// js.lang.Namespace('js', 'js.settings', 'js.lang', 'js.lang.Class', 'js.lang.Interface', 'js.lang.Namespace');

// initialize settings/preferences
if (js.settings.globalClass) {
    Class = js.lang.Class;
}

if (js.settings.globalInterface) {
    Interface = js.lang.Interface;
}

if (js.settings.globalNamespace) {
    Namespace = js.lang.Namespace;
}
