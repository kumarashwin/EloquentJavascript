/**
 * Helper function for generating DOM Elements.
 * @param {string} name - Tagname of the element.
 * @param {Object} attributes - An object of name-value pairs for attaching attributes.
 * @param {...Node} children - Any number of child nodes.
 * @return {Node} The generated DOM Element.
 */
function elt(name, attributes, children){
    var node = document.createElement(name);
    if(attributes){
        for(var attr in attributes)
            if(attributes.hasOwnProperty(attr))
                node.setAttribute(attr, attributes[attr]);
    }
    for(var i = 2; i < arguments.length; i++){
        var child = arguments[i];
        if(typeof child == "string")
            child = document.createTextNode(child);
        node.appendChild(child);
    }
    return node;
}

/**
 * Holds the controls
 * @property {Object} tool - Holds the function for generating the 'tools'
 */
var controls = Object.create(null);

/**
 * Created the 'div' containing the canvas and the controls toolbar.
 * @param {Node} parent - The parent element to which the 'div' is appended.
 */
function createPaint(parent){
    var canvas = elt("canvas", {width: 500, height: 300});
    var cx = canvas.getContext("2d");
    var toolbar = elt("div", {class: "toolbar"});

    for(var name in controls)
        toolbar.appendChild(controls[name](cx));
    
    var panel = elt("div", {class:"picturepanel"}, canvas);
    parent.appendChild(elt("div", null, panel, toolbar));
}

var tools = Object.create(null);

/**
 * The tool field is populated with <option> elements for all tools
 * that have been defined, and a "mousedown" handler on the canvas
 * element takes care of calling the function for the current tool,
 * passing it both the event object and the drawing context as arguments.
 * It also calls preventDefault so that holding the mouse button and
 * dragging does not cause the browser to select parts of the page.
 * @memberOf controls
 * @param {Context} cx - Context of the canvas.
 * @returns {string} Just testing this shit
 */
controls.tool = function(cx){
    var select = elt("select");
    for(var name in tools){
        select.appendChild(elt("option", null, name));
    }
        
    select.onchange = function(event){
        if(event.target.value == "Color picker")
            cx.canvas.style.cursor = "url(http://spritedatabase.net/downloads/SpriteTracer/images/drop.gif) 0 15, pointer";
        else
            cx.canvas.style.cursor = "auto";
    };
    
    cx.canvas.addEventListener("mousedown", function(event){
        if(event.buttons == 1){
            tools[select.value](event, cx);
            event.preventDefault();
        }
    });

    return elt("span", null, "Tool: ", select);
};



function relativePos(event, element){
    var rect = element.getBoundingClientRect();
    return {x: Math.floor(event.clientX - rect.left),
            y: Math.floor(event.clientY - rect.top)};
}

function trackDrag(onMove, onEnd){
    function end(event){
        removeEventListener("mousemove", onMove);
        removeEventListener("mouseup", end);
        if(onEnd)
            onEnd(event);
    }
    addEventListener("mousemove", onMove);
    addEventListener("mouseup", end);
}

tools.Line = function(event, cx, onEnd){
    cx.lineCap = "round";

    var pos = relativePos(event, cx.canvas);
    trackDrag(function(event){
        cx.beginPath();
        cx.moveTo(pos.x, pos.y);
        pos = relativePos(event, cx.canvas);
        cx.lineTo(pos.x, pos.y);
        cx.stroke();
    }, onEnd);
};

tools.Rectangle = function(event, cx){
    var pos = relativePos(event, cx.canvas);

    var overlayDiv = elt("div", {class:"overlay"});
    overlayDiv.style.borderColor = cx.fillStyle;
    document.getElementsByClassName("picturepanel")[0].appendChild(overlayDiv);

    var lastPos;
    trackDrag(
        function(event){
            lastPos = relativePos(event, cx.canvas);

            if(lastPos.x < 0) lastPos.x = 0;
            if(lastPos.y < 0) lastPos.y = 0;

            if(lastPos.x > cx.canvas.width - 2) lastPos.x = cx.canvas.width - 2;
            if(lastPos.y > cx.canvas.height - 2) lastPos.y = cx.canvas.height - 2; 

            overlayDiv.style.top =  Math.min(lastPos.y, pos.y) + "px";
            overlayDiv.style.height = Math.abs(lastPos.y - pos.y) + "px";

            overlayDiv.style.left = Math.min(lastPos.x, pos.x) + "px";
            overlayDiv.style.width = Math.abs(lastPos.x - pos.x) + "px"; 
        },
        function(event){
            cx.fillRect(pos.x, pos.y, lastPos.x - pos.x, lastPos.y - pos.y);
            overlayDiv.parentNode.removeChild(overlayDiv);
        }
    );
};

tools.Erase = function(event, cx){
    cx.globalCompositeOperation = "destination-out";
    tools.Line(event, cx, function(){
        cx.globalCompositeOperation = "source-over";
    });
};

tools.Text = function(event, cx){
    var text = prompt("Text: ", "");
    if(text){
        var pos = relativePos(event, cx.canvas);
        cx.font = Math.max(7, cx.lineWidth) + "px sans-serif";
        cx.fillText(text, pos.x, pos.y);
    }
};

function randomPointInRadius(radius){
    while(true){
        var x = Math.random() * 2 - 1;
        var y = Math.random() * 2 - 1;

        if(x * x + y * y <= 1){
            return {
                x: x * radius,
                y: y * radius
            };
        }
    }
}

tools.Spray = function(event, cx){
    var radius = cx.lineWidth/2;
    var area = radius * radius * Math.PI;
    var dotsPerTick = Math.ceil(area/30);

    var currentPos = relativePos(event, cx.canvas);
    var spray = setInterval(function(){
        for(var i = 0; i < dotsPerTick; i++){
            var offset = randomPointInRadius(radius);
            cx.fillRect(currentPos.x + offset.x,
                        currentPos.y + offset.y, 1, 1);
        }
    }, 25);

    trackDrag(
        function(event){currentPos = relativePos(event, cx.canvas);},
        function(){clearInterval(spray);}
    );
};

function rgb2hex(rgb){
    var hex = "#";
    var curr;
    for (var i = 0; i < 3; i++){
        curr = rgb[i].toString(16);
        hex += curr.length > 1 ? curr : "0" + curr; 
    }
    return hex;
}

tools["Color picker"] = function(event, cx){
    var pos = relativePos(event, cx.canvas);
    var pixel = cx.getImageData(pos.x, pos.y, 1, 1);

    cx.fillStyle = cx.strokeStyle =  "rgb(" + pixel.data[0] + "," + pixel.data[1] + "," + pixel.data[2] + ")";
    document.querySelector("input[type=color]").value = rgb2hex(pixel.data);
};

controls.color = function(cx){
    var input = elt("input", {type: "color"});
    input.addEventListener("change", function(){
        cx.fillStyle = input.value;
        cx.strokeStyle = input.value;
    });
    return elt("span", null, "Color: ", input);
};

controls.brushSize = function(cx){
    var select = elt("select");
    var sizes = [1,2,3,5,6,12,25,35,50,75,100];

    sizes.forEach(function(size){
        select.appendChild(elt("option", {value:size}, size + " pixels"));
    });

    select.addEventListener("change", function(){
        cx.lineWidth = select.value;
    });
    return elt("span", null, "Brush size: ", select);
};

controls.save = function(cx){
    var link = elt("a", {href: "/"}, "Save");
    function update(){
        try {
            link.href = cx.canvas.toDataURL();
        } catch(e) {
            if(e instanceof SecurityError)
               link.href = "javascript:alert(" + JSON.stringify("Can't save: " + e.toString()) + ")";
            else
             throw e; 
        }
    }
    link.addEventListener("mouseover", update);
    link.addEventListener("focus", update);
    return link;
};

function loadImageURL(cx, url){
    var image = document.createElement("img");
    image.addEventListener("load", function(){
        var color = cx.fillStyle;
        var size = cx.lineWidth;

        cx.canvas.width = image.width;
        cx.canvas.height = image.height;
        cx.drawImage(image, 0, 0);
        cx.fillStyle = color;
        cx.strokeStyle = color;
        cx.lineWidth = size;
    });
    image.src = url;
}

controls.openFile = function(cx){
    var input = elt("input", {type: "file"});
    input.addEventListener("change", function(){
        if(input.files.length){
            var reader = new FileReader();
            reader.addEventListener("load", function(){
                loadImageURL(cx, reader.result);
            });
            reader.readAsDataURL(input.files[0]);
        }
    });
    return elt("div", null, "Open file: ", input);
};

controls.openURL = function(cx){
    var input = elt("input", {type: "text"});
    var submit = elt("button", {type:"submit"}, "load");
    var form = elt("form", null, "Open URL: ", input, submit);

    form.addEventListener("submit", function(event){
        event.preventDefault();
        loadImageURL(cx, input.value);
    });
    return form;
};
