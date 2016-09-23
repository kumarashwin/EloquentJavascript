function ChartRepository() {
    // Use this to change default values
    this.defaultData = [
        { title: "Yes", name: "yes", value: 1043, color: "lightblue" },
        { title: "No", name: "no", value: 563, color: "lightgreen" },
        { title: "Maybe", name: "maybe", value: 510, color: "pink" },
        { title: "Not Sure", name: "not-sure", value: 175, color: "silver" }
    ];

    this.body = document.getElementsByTagName("body")[0];
    this.charts = [];
    this.add();
}

// 'data' is an array of objects; like 'this.defaultData'
ChartRepository.prototype.deepCopy = function(data){
    return data.map(function(object){
        var newObject = {};
        for(var property in object){
            if(object.hasOwnProperty(property)){
                newObject[property] = object[property];
            }
        }
        return newObject;
    });
};

ChartRepository.prototype.add = function(position) {
    var chart = new Chart(this.charts.length, this.deepCopy(this.defaultData)); // Creating a copy of the default data with deepCopy;
    this.charts.push(chart);
    var buttons = this.createButtons(chart);
    buttons.appendChild(chart.element);

    if(position){
        this.body.insertBefore(buttons, position.parentNode.nextSibling); // Find the parent 'buttons' around the div, and add after
    } else {
        this.body.appendChild(buttons);
    }
    
    buttons.style.opacity = 0;
    buttons.style.position = "relative";
    var opacity = 0;

    var endLeft = /\d+/.exec(buttons.style.left);
    var startLeft = endLeft - 10;
    buttons.style.left = startLeft + "px";
    
    var interval = setInterval(function(){
        startLeft = Math.min(endLeft, startLeft);
        opacity = Math.min(1, opacity); 

        buttons.style.left = startLeft + "px";
        buttons.style.opacity = opacity;

        if(opacity >= 1.0 && startLeft >= endLeft)
            clearInterval(interval);
        else{
            opacity += 0.1;
            startLeft += 1;
        }
    }, 30);
    chart.draw();
};

ChartRepository.prototype.remove = function(chart){
    var buttons = chart.element.parentNode;
    var opacity = 1.0;
    var opacityInterval = setInterval(function(){
        buttons.style.opacity = opacity -= 0.05;
        if(opacity <= 0){
            clearInterval(opacityInterval);
            chart.removeKeydownEvent();
            this.charts.splice(chart.id - 1,1);
            this.body.removeChild(buttons);
        }
    }.bind(this), 30);
};

ChartRepository.prototype.createButtons = function (chart) {
    var add = document.createElement("button");
    add.setAttribute("value", chart.id);
    add.setAttribute("name", "add");
    add.appendChild(document.createTextNode("+"));

    var remove = document.createElement("button");
    remove.setAttribute("value", chart.id);
    remove.setAttribute("name", "remove");
    remove.appendChild(document.createTextNode("-"));

    var buttons = document.createElement("div");
    buttons.setAttribute("class", "buttons");
    buttons.appendChild(add);
    buttons.appendChild(remove);

    buttons.addEventListener("click", function(event){
        if(event.target.nodeName == "BUTTON"){
            switch(event.target.name){
                case "add":
                    this.add(chart.element); //Pass the div element after which the new div should be added
                    break;
                case "remove":
                    this.remove(chart);
                    break;
            }
        }
    }.bind(this));

    return buttons;
};