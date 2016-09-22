function Chart(lastChartId, data){
    this.chartId = lastChartId + 1;
    this.data = data;
    this.inputs = [];
    this.dataModified = false;

    this.canvas = this.createCanvas();
    this.element = this.createElement();
    this.addFocusEvent();
    this.addKeyboardValidation();
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
        //input.setAttribute("name", observation.name.toLowerCase().replace(/ /g,"-"));
        input.setAttribute("name", observation.name);
        input.setAttribute("value", observation.value);
        this.inputs.push(input);
        
        var textNode = document.createTextNode(observation.name + ": ");
        inputs.appendChild(textNode);
        inputs.appendChild(input);
        inputs.appendChild(document.createElement("br"));
    }, this);

    var div = document.createElement("div");
    div.setAttribute("id", this.chartId);
    div.setAttribute("class", "chart");
    div.appendChild(inputs);
    div.appendChild(this.canvas);
    return div;
};

//FOCUS
Chart.prototype.addFocusEvent = function(){
    this.element.addEventListener("click", function(event){
        if(event.target.nodeName == "INPUT"){
            this.event.style.boxShadow = "0 0 20px lightblue";
            this.dataModified = true;
            //Add tabIndexes, so we can tab through them
            for(var i = 0; i < inputs.length; i++){
                this.inputs[i].tabIndex = 0;
            }
        }
    });
};

//KEYBOARD INPUT
Chart.prototype.addKeyboardValidation = function () {
    this.element.addEventListener("keydown", function (event) {
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
            //Otherwise, default operation
        }
        else if (!/(\d|\.|Backspace|ArrowLeft|ArrowRight)/.test(event.key)) {
            event.preventDefault(); //Only allow permitted input
            if (event.key == "Enter" || event.key == "Escape") {
                event.target.blur(); // Unfocus the input element
                this.draw(event.key == "Enter"); // ONLY WAY TO SAVE INPUT!!
            }
        }
    });
};

Chart.prototype.testFunction = function(choice){
    var name = this.getAttribute("name");
    var result = choice.name == this.getAttribute("name");
    return result;
};

Chart.prototype.draw = function (saveInput) {
    this.inputs.forEach(function(input){
        input.tabIndex = -1; //Clear tabIndexes!
        //var name = input.getAttribute("name");
        var field = this.data.find(function(choice){return choice.name == this.getAttribute("name");}, input);
        //var field = this.data.find(this.testFunction, input);
        if (saveInput){ // Save, if true
            field.value = parseInt(input.value);
        }
        else //Default: Reset values
            input.value = field.value;
    }, this);
    this.element.style.boxShadow = "";
    this.dataModified = false;
    return new PieChart(this.canvas.getContext("2d"), this.data, 100, 150, 150);//, true, 28);
};