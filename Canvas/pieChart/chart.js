function Chart(lastChartId, data){
    this.id = lastChartId + 1;
    this.data = data;
    this.inputs = [];
    this.focused = false;
    this.size = 100;

    //Using a Getter function for totalObservations
    Object.defineProperties(this, {
        "totalObservations": {
            "get": function(){
                return this.data.reduce(function (sum, choice) { return sum + choice.value; }, 0);
            }
        }
    });
    
    this.canvas = this.createCanvas();
    this.element = this.createElement();
    this.addFocusEvent();
    this.addKeydownEvent();
}

Chart.prototype.createCanvas = function(){
    var canvas = document.createElement("canvas");
    canvas.setAttribute("width", 300);
    canvas.setAttribute("height", 300);
    return canvas;
};

Chart.prototype.createElement = function(){
    var inputs = document.createElement("div");
    inputs.setAttribute("class", "inputs");
    
    this.data.forEach(function(observation, index){
        var input = document.createElement("input");
        input.setAttribute("type", "text");
        input.setAttribute("name", observation.name);
        input.setAttribute("value", observation.value);
        input.tabIndex = -1;
        this.inputs.push(input);
        
        var textNode = document.createTextNode(observation.title + ": ");
        inputs.appendChild(textNode);
        inputs.appendChild(input);
        inputs.appendChild(document.createElement("br"));
    }, this);

    var div = document.createElement("div");
    div.setAttribute("id", this.id);
    div.setAttribute("class", "chart");
    div.appendChild(inputs);
    div.appendChild(this.canvas);
    return div;
};

//FOCUS
Chart.prototype.addFocusEvent = function(){
    this.element.addEventListener("click", function(event){
        if(event.target.nodeName == "INPUT"){
            this.focused = true;
            this.element.style.boxShadow = "0 0 20px lightblue";

            //Add tabIndexes, so we can tab through them
            this.inputs.forEach(function(input){input.tabIndex = 0});
            
            //Add 'click'-unfocus event on document:
            this._unfocusEvent = this.unfocusEvent.bind(this);
            document.addEventListener("click", this._unfocusEvent);
        }
    }.bind(this));
};

//UNFOCUS
Chart.prototype.unfocusEvent = function(event){
    var node = event.target;
    while(true){
        if(node == null){            // If our search has reached the parent elements beyond the 'chart',
            if(this.focused){        // check if the chart was clicked on (and perhaps modified)
                this.save(false);    // If yes, don't save changes,
                this.draw();         // then redraw
            }
            document.removeEventListener("click", this._unfocusEvent);
            this._unfocusEvent = undefined;
            break;
        }
        else if(node == this.element){ // Aha! The target was within the active element! Do nothing.
            break;
        }
        else {                         
            node = node.parentNode; // This node isn't the active element, but could be a child. Continue the search...
        }
    }
};

//KEYBOARD INPUT
Chart.prototype.keydownHandler = function(event) {
    //Traverse through the inputs
    if (event.key == "Tab") {
        //Last element; Shift NOT pressed
        if (!event.shiftKey && event.target == this.inputs[this.inputs.length - 1]) {
            this.inputs[0].focus();
            event.preventDefault();
        }
        //First element; Shift pressed
        else if (event.shiftKey && event.target == this.inputs[0]) {
            this.inputs[this.inputs.length - 1].focus();
            event.preventDefault();
        }
        //Otherwise, default 'Tab' operation
    }
    else if (!/(\d|\.|Backspace|ArrowLeft|ArrowRight)/.test(event.key)) {
        event.preventDefault(); //Only allow permitted input
        if (event.key == "Enter" || event.key == "Escape") {
            event.target.blur(); // Unfocus the input element 
            this.save(event.key == "Enter"); // 'Enter' must be true to save input.
            this.draw();
        }
    }
};

Chart.prototype.addKeydownEvent = function () {
    this._keydownHandler = this.keydownHandler.bind(this);
    this.element.addEventListener("keydown", this._keydownHandler);
};

Chart.prototype.removeKeydownEvent = function(){
    this.element.removeEventListener("keydown", this._keydownHandler);
    this._keydownHandler = undefined;
};

Chart.prototype.save = function(save){
    this.inputs.forEach(function(input){
        input.tabIndex = -1; //Clear tabIndexes while we're doing this
        
        var field = this.data.find(function(choice){return choice.name == this.getAttribute("name");}, input);

        if (save)
            field.value = parseInt(input.value);
        else
            input.value = field.value;
    }, this);
};

Chart.prototype.draw = function(size) {
    if(this.focused){
        this.focused = false;
        this.element.style.boxShadow = "";
    }

    new PieChart(
        this.canvas,
        this.data,
        this.totalObservations,
        size ? size : this.size, // If a 'size' argument exists; else use default size
        true);
};