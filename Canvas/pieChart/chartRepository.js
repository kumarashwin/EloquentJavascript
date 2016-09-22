function ChartRepository() {
    this.body = document.getElementsByTagName("body")[0];
    this.charts = [];
    this.defaultData = [
        { title: "Yes", name: "yes", value: 1043, color: "lightblue" },
        { title: "No", name: "no", value: 563, color: "lightgreen" },
        { title: "Maybe", name: "maybe", value: 510, color: "pink" },
        { title: "Not Sure", name: "not-sure", value: 175, color: "silver" }
    ];

    this.add();
}

ChartRepository.prototype.add = function(position) {
    var chart = new Chart(this.charts.length, this.defaultData);
    this.charts.push(chart);
    var buttons = this.createButtons(chart);
    buttons.appendChild(chart.element);

    if(position){
        this.body.insertBefore(buttons, position.parentNode.nextSibling);
    } else {
        this.body.appendChild(buttons);
    }
    
    chart.draw();
};

ChartRepository.prototype.remove = function(chart){
    chart.removeKeydownEvent();
    this.charts.splice(chart.id - 1,1);
    this.body.removeChild(chart.element.parentNode);
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
                    this.add(chart.element);
                    break;
                case "remove":
                    this.remove(chart);
                    break;
            }
        }
    }.bind(this));

    // var chartWithButtons = document.createElement("div");
    // chartWithButtons.setAttribute("class", "chart-with-buttons");
    // chartWithButtons.appendChild(buttons);

    return buttons;
};