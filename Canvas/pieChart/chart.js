// <div id="controls" style="width: 300px; padding: 10px; border: 0 solid black;">
//                 <div style="padding: 0 15%;">
//                     Yes: <input type="text" name="yes" value="1043"><br>
//                     No: <input type="text" name="no" value="563"><br>
//                     Maybe: <input type="text" name="maybe" value="510"><br>
//                     Not Sure: <input type="text" name="notSure" value="175">
//                 </div>
//             <canvas style="border: 0 solid black;" width="300" height="300"></canvas>
//         </div>

function Chart(lastChartId, data){
    this.chartId = lastChartId + 1;
    this.data = data;
    this.element = this.createElement();
}

Chart.prototype.createElement = function(){
    var inputs = document.createElement("div");
    inputs.setAttribute("class", "inputs");
    
    this.data.forEach(function(observation, index){

        var input = document.createElement("input");
        input.setAttribute("type", "text");
        input.setAttribute("name", observation.name.toLowerCase().replace(/ /g,"-"));
        input.setAttribute("value", observation.value);
        
        var textNode = document.createTextNode(observation.name + ": ");
        
        inputs.appendChild(textNode);
        inputs.appendChild(input);
        inputs.appendChild(document.createElement("br"));
    });
    
    var canvas = document.createElement("canvas");
    canvas.setAttribute("width", 300);
    canvas.setAttribute("height", 300);
    
    var div = document.createElement("div");
    div.setAttribute("id", this.chartId);
    div.setAttribute("class", "chart");
    div.appendChild(inputs);
    div.appendChild(canvas);
    return div;
};