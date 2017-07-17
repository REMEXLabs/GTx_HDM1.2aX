
var DEBUG = true;

/* Modifications after checking Willison's original code with JSHint: added "use strict" and changed "window.onload != 'function'" into "window.onload !== 'function'".*/
/**
 * Add a function to the list of functions that need to be called when
 * the HTML document has finished loading (in other words, after the <code>window.load</code> event).
 * @param {Function} func - A function that needs to be invoked after <code>window.load</code>.
 * @static
 * @author Simon Willison
 * @see Simon Willison's article <a href="http://blog.simonwillison.net/post/57956760515/addloadevent">Executing JavaScript on page load</a> (26 May 2004).
 */
function addLoadEvent(func) {
    "use strict";
    var oldonload = window.onload;
    if (typeof window.onload !== 'function') {
        window.onload = func;
    } else {
        window.onload = function() {
            if (oldonload) {
                oldonload();
            }
            func();
        };
    }
}


// Modifications to the original script: addition of "use strict"; == replaced with ===.
/**
 * Load an external JavaScript without blocking other downloads or page processes.
 * @param {String} url - The URL of the JavaScript file. This URL is either an absolute URL, or relative to the HTML file that should load the script.
 * @param {Function} callback - The function that should be called when the external JavaScript file has finished loading.
 * @author Nicholas C. Zakas
 * @see Nicholas C. Zakas's article <a href="http://www.nczonline.net/blog/2009/07/28/the-best-way-to-load-external-javascript/">The best way to load external JavaScript</a> (NCZOnline, 28 July 2009).
 * @see Nicholas C. Zakas's article <a href="http://www.nczonline.net/blog/2009/06/23/loading-javascript-without-blocking/">Loading JavaScript without blocking</a> (NCZOnline, 23 June 2009).
 * @see Jack Slingerland's article <a href="http://www.re-cycledair.com/load-javascript-dynamically-with-lazy-load">Load Javascript Dynamically With Lazy Load</a> (Re-Cycled Air, 11 September 2010).
 */
function loadScript(url, callback) {
    "use strict";
    var script = document.createElement("script");
    script.type = "text/javascript";

    if (script.readyState) {  //IE
        script.onreadystatechange = function() {
            if (script.readyState === "loaded" ||
                    script.readyState === "complete") {
                script.onreadystatechange = null;
                callback();
            }
        };
    } else {  //Others
        script.onload = function() {
            callback();
        };
    }

    script.src = url;
    document.getElementsByTagName("head")[0].appendChild(script);
}


// addListener from N.C. Zakas: Maintainable JavaScript, p. 58
// Note: this function is almost identical to DOMhelp.addEvent by C. Heilmann;
//       DOMhelp.addEvent also passes on useCapture (boolean) to addEventListener.
//       See Christian Heilmann: Beginning JavaScript, p. 156 and p. 166 (Scott Andrew's addEvent method).
/**
 * Add an event listener to an HTML element.
 * @param {Element} target - The HTML element where the listener should be added.
 * @param {String} type - The type of listener (click, focus, etcetera).
 * @param {Function} handler - The function that will handle the event received by the element.
 * by the listener.
 * @author Nicholas C. Zakas
 */
function addListener(target, type, handler) {
    "use strict";
    if (target.addEventListener) {
        target.addEventListener(type, handler, false);
    } else if (target.attachEvent) {
        target.attachEvent("on" + type, handler);
    } else {
        target["on" + type] = handler;
    }
}


/**
 * Check the type of a variable. This function is intended to improve on the built-in <code>typeof</code> function.
 * @param  variable - The variable to be checked.
 * @returns {String} The detected type.
 * @author James Padolsey
 * @see James Padolsey's article <a href="http://james.padolsey.com/javascript/checking-types-in-javascript/">Checking types in JavaScript</a>
 * (12 January 2009).
 * @static
 */
function typeOfVar(variable) {
    "use strict";
    return !!variable && Object.prototype.toString.call(variable).match(/(\w+)\]/)[1];
}


/**
 * @namespace The main application object.
 */
var gtxhdm = {
    //prefsServerUrl: "http://localhost:8088/github/GTx_HDM12aX_preferences/",
    prefsServerUrl: "https://remexlabs.github.io/GTx_HDM12aX_preferences/";

    /**
     * Initialise the application, but only in browsers that support
     * the <abbr title="World Wide Web Consortium">W3C</abbr> Document Object Model
     * (<abbr>DOM</abbr>).
     * @author Christophe Strobbe (HdM)
     */
    init:function() {
        "use strict";
        var getJSON;

        loadScript("js/DOMhelp.js", function() { // Strictly speaking, it is better to load from a CDN instead of a relative path.
            if (DEBUG) { console.info("DOMhelp.js loaded."); }
        });

        getJSON = document.getElementById("getJSON");
        this.addJsonButtonListener();
        this.addJsonFormListenr();
    },


    /**
     * Add a listener for showing JSON test data.
     * @author Christophe Strobbe (HdM)
     */
    addJsonButtonListener: function() {
        "use strict";
        var widget = document.getElementById("getJSON");
        if (widget !== null) {
            addListener(widget, "click", gtxhdm.getTestJson);
        }
    },


    /**
     * Add a listener for showing JSON test data.
     * @author Christophe Strobbe (HdM)
     */
    addJsonFormListenr: function() {
        "use strict";
        var widget = document.getElementById("samplejsonform");
        if (widget !== null) {
            addListener(widget, "submit", gtxhdm.handleNPSet);
        }
    },


    /**
     * Create an XHR object (CORS).
     * @param {String} method - The HTTP method.
     * @param {String} url - The request URL.
     * @return {Object} xhr - A CORS request object, if supported by the browser; otherwise null.
     */
    createCorsRequest: function(method, url) {
        "use strict";
        var xhr;

        xhr = new XMLHttpRequest();
        if ("withCredentials" in xhr) {
            if (DEBUG) {console.info("XHR with credentials / XMLHTTPRequest2 object.");}
            xhr.open(method, url, true);
        } else if (typeof XDomainRequest != "undefined") {
            if (DEBUG) {console.info("XHR with XDomainRequest, i.e. Internet Explorer 8 / 9.");}
            xhr = new XDomainRequest();
            xhr.open(method, url);
        } else {
            console.warn("CORS not supported. xhr = null!");
            xhr = null;
        }
        return xhr;
    },


    /**
     * Display the JSON data.
     * @param {Object} data - data for the HTTP request.
     * @param {String} elementID - ID attibute value of an HTML element.
     * @author Christophe Strobbe (HdM)
     */
    displayJsonData: function(data, elementID) {
        "use strict";
        var content,
            prop;

        content = document.getElementById(elementID);
        if (content) {
            for (prop in data) {
                content.innerHTML += prop + ": " + data[prop] + '<br />';
            }
        } else {
            console.warn("Container element not found in the document!");
        }
        if (DEBUG) { console.info("Stringified JSON: \n" + JSON.stringify(data, null, " ")); }
    },


    /**
     * Make a JSON request.
     * @param {String} url - URL for the HTTP request.
     * @param {Function} callback - callback function that should be executed on the reply to the HTTP request.
     * @author Christophe Strobbe (HdM)
     */
    getJsonRequest: function(url, callback) {
        "use strict";
        var	reply = "",
            xhr;

        if (DEBUG) { console.log("getJsonRequest called."); }

        xhr = gtxhdm.createCorsRequest('GET', url);

        if (!xhr) {
            console.warn("CORS not supported!");
            return;
        }
        xhr.onload = function() {
            reply = JSON.parse(xhr.responseText);
            callback(reply);
        };
        xhr.onerror = function() {
            console.warn("CORS request caused error.");
        };

        xhr.send();
    },


    /**
     * Handle the needs & preferences set.
     * @param {Object} formevent - Event triggered in a form (presumaby submit).
     * @author Christophe Strobbe (HdM)
     */
    handleNPSet(formevent) {
        "use strict";
        var jsonurl,
            npMapping,
            npSetName,
            fullNpSet,
            prefs;

        npMapping = {
            "Anna-UK"      : "Anna-UK.json",
            "Lars-NO"      : "Lars-NO.json",
            "Lars-US"      : "Lars-US.json",
            "Monika-DE"    : "Monika-DE.json",
            "Susan-UK"     : "Susan-UK.json",
            "Tom-IE"       : "Tom-IE.json"
        };

        formevent.preventDefault(); // prevent form submission!

        npSetName = document.getElementById("npset").value;
        jsonurl = gtxhdm.prefsServerUrl + npMapping[npSetName];
        if (DEBUG) { console.log("samplejsonform submitted: " + npSetName + ". JSON URL: " + jsonurl);};

        gtxhdm.getJsonRequest(jsonurl, function(fullNpSet) {
            prefs = fullNpSet["flat"]["contexts"]["gpii-default"]["preferences"];
            if (DEBUG) { console.log("The prefs (stringified): " + JSON.stringify(prefs, null, " ")); };
            gtxhdm.displayJsonData(prefs, "npSetContainer");
        });
    },


    /**
     * Retrieves a sample JSON file. For demonstration/test purposes only.
     * @author Christophe Strobbe (HdM)
     */
    getTestJson: function() {
        "use strict";
        gtxhdm.getJsonRequest((gtxhdm.prefsServerUrl + 'testjson.json'), function(data){
            gtxhdm.displayJsonData(data, "sampleJsonContainer");
        });
    }

};

addLoadEvent(function() {
    "use strict";
    if (!document.getElementById || !document.createTextNode) {return;}
    gtxhdm.init();
});

