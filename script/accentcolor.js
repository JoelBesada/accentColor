/*
                    =============================
                         accentColor Script
                                v1.0

                       Demo and documentation:
                      www.joelb.me/accentcolor
                    =============================

    A small script for retrieving the accent color of a given site.
    This is done by calculating the dominant color of the site's favicon,
    which generally gives the expected results. The format of the returned
    color is 'rgb(R, G, B)'.

    Connects to http://g.etfv.co/ (getFavicon by Jason Cartwright) to get favicons. 

    Author: Joel Besada (http://www.joelb.me)
    Date: 2011-12-10

    Copyright 2011, Joel Besada
    MIT Licensed (http://www.opensource.org/licenses/mit-license.php)
*/

;(function () {
    // Default values
    var defaults = {
            // URL of site to get the color from
            url: null,
            // An optional proxy fallback for browsers without CORS support
            proxy: null,
            // Function to call when the color has been retrieved,
            onComplete: function() {},
            // Function to call on error
            onError: function() {}
        },
        // Height and width of the favicons
        iconDimension = 16,
        // Image data URI prefix
        imagePrefix = "data:image/png;base64,",
        needsProxy = browserNeedsProxy(),
        supportsCanvas = browserSupportsCanvas();


    /* Add the getAccentColor function to the window. The options object takes 4 parameters:
     * url, onComplete, proxy (optional) and onError (optional). */
    window.getAccentColor = function (options) {
        // Relies on canvas to analyze pixeldata
        if(!supportsCanvas) {
            return;
        }
        // Extend/override defaults with user given options
        var settings = {};
        for(var prop in defaults) {
            if(defaults.hasOwnProperty(prop)) {
                settings[prop] = options[prop] || defaults[prop];
            }
        }
        getColor(settings.url, settings.proxy, settings.onComplete, settings.onError);
    };

    /* Checks if the browser needs a proxy to load the favicon data */
    function browserNeedsProxy() {
        return !window.ArrayBuffer || !window.Uint8Array || (new XMLHttpRequest().withCredentials === undefined);
    }

    /* Check for canvas support */
    function browserSupportsCanvas() {
        return !!document.createElement("canvas").getContext;
    }

    /* Gets the accent color of the given site, by fetching the base64 encoded
     * favicon and calculating its dominant color. The color is returned as a parameter
     * to the onComplete function. */
    function getColor(href, proxy, onComplete, onError) {
        if(!href) {
            onError("Missing URL parameter");
            return;
        }
         // Insert HTTP protocol if http or https is not supplied 
        if (href.indexOf("http") === -1) {
            href = "http://" + href;
        }
        var xhr = new XMLHttpRequest();  

        // Get favicon data from proxy
        if(needsProxy && proxy) {
            xhr.open("GET", proxy + "?url=" + href, true);
            xhr.responseType = "text";

        // Get favicon directly with CORS
        } else {
            xhr.open("GET", "http://g.etfv.co/" + href + "?defaulticon=none", true);  
            xhr.responseType = "arraybuffer";  
        }

        xhr.onreadystatechange = function () {  
            if(xhr.readyState === 4) {
                if(xhr.status === 200) {
                    var base64, canvas, ctx, color,
                        image = new Image();

                    if(xhr.responseType === "arraybuffer") {
                        // Read the arraybuffer as a uint8array
                        // and convert it to base64
                        var arrayBuffer = xhr.response; 
                        if (arrayBuffer) { 
                            var byteArray = new Uint8Array(arrayBuffer);  
                            base64 = uint8ToBase64(byteArray);
                        }
                    } else {
                        // The proxy has already converted the data to base64
                        base64 = xhr.responseText;
                    }
                    
                    image.onload = function() {
                        // Draw the image on a canvas and send the image data to
                        // the findDominantColor function
                        canvas = document.createElement("canvas");
                        canvas.width = canvas.height = iconDimension;
                        ctx = canvas.getContext("2d");
                        ctx.drawImage(image, 0, 0, iconDimension, iconDimension);

                        color = findDominantColor(ctx.getImageData(0, 0, iconDimension, iconDimension));
                        // If the favicon consists of mainly transparent and gray colors
                        if(!color) {
                            onError("No accent color found for " + href);
                            return;                        
                        }
                        // Return the color as a parameter to onComplete
                        onComplete(color);
                    };

                    if(base64) {
                        image.src = imagePrefix + base64;
                    } else {
                        onError("No response from " + href);
                    } 
                     
                } else if(xhr.status === 204) {
                    onError("No response from " + href);
                } else {
                    onError("Service Unavailable");
                }
            }
        };  
        xhr.send(null); 

    }
    
    /* Converts a uint8array to a base64 encoded string */
    function uint8ToBase64(buf) {
        var i, length, out = "";
        for (i = 0, length = buf.length; i < length; i++) {
            out += String.fromCharCode(buf[i]);
        }
        return btoa(out);
    }

    /* Finds the dominant color of the given image data.
     * Filters out gray and transparent colors, and groups
     * similiar colors together. */
    function findDominantColor(imageData) {
    	var arr = imageData.data, 
    		cr, cg, cb, ca, 
    		numColors = 0,
    		colors = {},
            colorProp; 
    	for (var i = 0; i < arr.length; i+=4) {
    		// Get the R, G, B and A values
            cr = arr[i]; cg = arr[i+1]; cb = arr[i+2]; ca = arr[i+3];

            // Only store non-transparent, non-gray colors in the colors object
    		if (acceptableColor(cr,cg,cb,ca)) {
    			propStr = cr + "," + cg + "," + cb;

                // Check if the same color already is in the colors object
    			if(colors[propStr]) {
    				colors[propStr]++;
                // Check if a close enough color is in the object
    			} else if(colorProp = findCloseColorProp(colors, propStr)) {
                    colors[colorProp]++;
                // Else create a new property
                } else {
    				colors[propStr] = 1;
    			}
    		}
    	}
        var max = getMax(colors);
    	return max ? "rgb(" + max + ")" : null;
    }
    
    /* Checks if a color is too transparent or too gray,
     * we don't want to include these because they do not
     * contribute to the accent color of a site. */
    function acceptableColor(r, g, b, a) {
        return !(isTooTransparent(a) || isTooGray(r,g,b));
    }

     /* Transparency check, anything at less than 
     * half opacity is considered transparent */
    function isTooTransparent(a) {
        return a < 127;
    }

    /* Saturation check, if no color is further than 15
     * units away from the average (gray) color, we consider
     * the color to be gray (not saturated). */
    function isTooGray(r,g,b) {
        var boundary = 15,
            average = (r + g + b) / 3;

        return (Math.abs(r - average) < boundary &&
                Math.abs(g - average) < boundary &&
                Math.abs(b - average) < boundary);
    }

    /* Scans the colors object for a similar color.
     * We consider a color similar to another if the arithmetic
     * distance is less than 10 */
    function findCloseColorProp(colors, str) {
        for(var prop in colors) {
            if(colors.hasOwnProperty(prop)) {
                if(getColorDistance(prop, str) < 10) {
                    return prop;
                }
            }
        }
        return null;
    }
    
    /* Returns the arithmetic distance between two colors */
    function getColorDistance(str1, str2) {
        var col1 = str1.split(","),
            col2 = str2.split(",");
        return (Math.abs(col1[0]-col2[0]) + Math.abs(col1[1]-col2[1]) + Math.abs(col1[2]-col2[2]))/3;
    }

    /* Finds the property in an object with the highest value */
    function getMax(obj) {
    	var max = 0;
    	var maxProp;
    	for(var prop in obj) {
    		if(obj.hasOwnProperty(prop)) {
    			if(obj[prop] > max) {
    				max = obj[prop];
    				maxProp = prop;
    			}
    		}
    	}
    	return maxProp;
    }

    /* Converts R, G and B values into a CSS readable RGB string */
    function colorString(r, g, b) {
    	return "rgb(" + parseInt(r, 10) + "," + parseInt(g, 10) + "," + parseInt(b, 10) + ")";
    }
})();