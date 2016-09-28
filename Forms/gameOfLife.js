function GameOfLife(div, size, clear){
    this.gridDiv = div;
    this.grid = [];
    this.size = size ? size : 5;
    this.generateCheckboxes();
    if(!clear) this.intialRandom();
}

GameOfLife.prototype.createCheckbox = function(){
    var checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = false;
    return checkbox;
};

GameOfLife.prototype.generateCheckboxes = function(){
    for(var y = 0; y < this.size; y++){
        var row = [];
        for(var x = 0; x < this.size; x++){
            var checkbox = this.createCheckbox();
            row.push(checkbox);
            this.gridDiv.appendChild(checkbox);
        }
        this.grid.push(row);
        this.gridDiv.appendChild(document.createElement("br"));
    }
};

GameOfLife.prototype.intialRandom = function(){
    this.grid.forEach(function(row){
        row.forEach(function(checkbox){
            checkbox.checked = (function(){
                if(Math.random() < 0.5)
                    return false;
                else
                    return true;
            })();
        });
    });
};

GameOfLife.prototype.implementChanges = function(toChange){
    toChange.forEach(function(coord){
        this.grid[coord.y][coord.x].checked = !this.grid[coord.y][coord.x].checked;
    }, this);
};

GameOfLife.prototype.checkAllCells = function(){
    var toChange = [];
    this.grid.forEach(function(row, y){
        row.forEach(function(checkbox, x){
            if(checkbox.checked ? this.shouldDie(x, y) : this.shouldLive(x, y))
                toChange.push({x:x, y:y});
        }, this);
    }, this);
    return toChange;
};

GameOfLife.prototype.shouldDie = function(x,y){
    var numberOfLiveCellsAround = this.checkAllDirections(x,y);
    if(numberOfLiveCellsAround < 2 || numberOfLiveCellsAround > 3)
        return true; // Should die.
    else
        return false; // Continue living.
};

GameOfLife.prototype.shouldLive = function(x,y){
    var numberOfLiveCellsAround = this.checkAllDirections(x,y);
    if(numberOfLiveCellsAround == 3)
        return true; // Phoenix Down! Should live!
    else
        return false; // Continue dead.
};

GameOfLife.prototype.checkAllDirections = function(x, y){
    var numberOfLiveCells = 0;
    for(var _y = -1; _y <= 1; _y++){
        for(var _x = -1; _x <= 1; _x++){
            if(_x || _y){                       // If both _x and _y are 0, the following isn't run
                var Y = y + _y;
                var X = x + _x;
                if(-1 < X && X < this.size
                && -1 < Y && Y < this.size){
                    if(this.grid[Y][X].checked) numberOfLiveCells++;
                }
            }
        }
    }
    return numberOfLiveCells;
};

//Main
var size = document.getElementById("size");
var grid = document.getElementById("grid");
var button = document.getElementById("next");
var clear = document.getElementById("clear");
var randomize = document.getElementById("randomize");
var gameOfLife = new GameOfLife(grid, size.value);

var interval;
button.addEventListener("click", function(){
    interval = setInterval(function(){
        toChange = gameOfLife.checkAllCells();
        if (toChange.length == 0) // Life has reached a stable state
            clearInterval(interval);
        else
            gameOfLife.implementChanges(toChange);   
    }, 150);
});

function reDraw(clear){
    if(interval)
        clearInterval(interval);
    while(grid.firstChild)
        grid.removeChild(grid.firstChild);
    gameOfLife = new GameOfLife(grid, size.value, clear);
}

size.addEventListener("change", function(){
    reDraw();
});

clear.addEventListener("click", function(){
    reDraw(true);
})

randomize.addEventListener("click", function(){
    reDraw();
});