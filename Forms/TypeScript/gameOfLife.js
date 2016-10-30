var Game = (function () {
    function Game(div, width, height, clear) {
        if (width === void 0) { width = 5; }
        if (height === void 0) { height = 5; }
        this.div = div;
        this.width = width;
        this.height = height;
        this.clear = clear;
        this.grid = [];
        this.generateCheckboxes();
        if (!clear)
            this.initialRandom();
    }
    Game.prototype.createCheckbox = function () {
        var checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = false;
        return checkbox;
    };
    Game.prototype.generateCheckboxes = function () {
        for (var y = 0; y < this.height; y++) {
            var row = new Array();
            for (var x = 0; x < this.width; x++) {
                var checkbox = this.createCheckbox();
                row.push(checkbox);
                this.div.appendChild(checkbox);
            }
            this.grid.push(row);
            this.div.appendChild(document.createElement("br"));
        }
    };
    Game.prototype.initialRandom = function () {
        this.grid.forEach(function (row) { return row.forEach(function (checkbox) { return checkbox.checked = (function () { return Math.random() < 0.5 ? false : true; })(); }); });
    };
    Game.prototype.implementChanges = function (toChange) {
        var _this = this;
        toChange.forEach(function (coord) { return _this.grid[coord.y][coord.x].checked = !_this.grid[coord.y][coord.x].checked; }, this);
    };
    Game.prototype.checkAllCells = function () {
        var _this = this;
        var toChange = new Array();
        this.grid.forEach(function (row, y) { return row.forEach(function (checkbox, x) {
            var cell = { x: x, y: y };
            var numberOfLiveCellsAround = _this.checkAllDirections(cell);
            if (checkbox.checked ? _this.shouldDie(numberOfLiveCellsAround) : _this.shouldLive(numberOfLiveCellsAround))
                toChange.push({ x: x, y: y });
        }, _this); }, this);
        return toChange;
    };
    Game.prototype.shouldDie = function (numberOfLiveCellsAround) {
        if (numberOfLiveCellsAround < 2 || numberOfLiveCellsAround > 3)
            return true; // Should die.
        else
            return false; // Else continue living.
    };
    Game.prototype.shouldLive = function (numberOfLiveCellsAround) {
        if (numberOfLiveCellsAround == 3)
            return true; // Phoenix Down! Should live!
        else
            return false; // Still dead.
    };
    Game.prototype.checkAllDirections = function (cell) {
        var numberOfLiveCells = 0;
        for (var _y = -1; _y <= 1; _y++) {
            for (var _x = -1; _x <= 1; _x++) {
                if (_x || _y) {
                    var Y = cell.y + _y;
                    var X = cell.x + _x;
                    if (-1 < X && X < this.width
                        && -1 < Y && Y < this.height) {
                        if (this.grid[Y][X].checked)
                            numberOfLiveCells++;
                    }
                }
            }
        }
        return numberOfLiveCells;
    };
    return Game;
}());
// ==== NEW MAIN ==========
var grid = document.getElementById("grid");
var width = document.getElementById("width");
var height = document.getElementById("height");
var start = document.getElementById("start");
var clear = document.getElementById("clear");
var randomize = document.getElementById("randomize");
var gameOfLife = new Game(grid, Number(width.value), Number(height.value));
var running = false;
var interval;
start.addEventListener("click", function () {
    if (!running) {
        running = true;
        interval = setInterval(function () {
            var toChange = gameOfLife.checkAllCells();
            // If life has reached a stable state, clear interval 
            toChange.length ? gameOfLife.implementChanges(toChange) : clearInterval(interval);
        }, 150);
    }
});
function reDrawHandler(clear) {
    return function (event) {
        if (interval)
            clearInterval(interval);
        while (grid.firstChild)
            grid.removeChild(grid.firstChild);
        running = false;
        gameOfLife = new Game(grid, Number(width.value), Number(height.value), clear);
    };
}
;
width.addEventListener("change", reDrawHandler());
height.addEventListener("change", reDrawHandler());
clear.addEventListener("click", reDrawHandler(true));
randomize.addEventListener("click", reDrawHandler());
// ==== OLD MAIN ===========
// var width = document.getElementById("width");
// var height = document.getElementById("height");
// var grid = document.getElementById("grid");
// var button = document.getElementById("next");
// var clear = document.getElementById("clear");
// var randomize = document.getElementById("randomize");
// var gameOfLife = new GameOfLife(grid, width.value, height.value);
// var interval;
// button.addEventListener("click", function () {
//     interval = setInterval(function () {
//         toChange = gameOfLife.checkAllCells();
//         if (toChange.length == 0) // Life has reached a stable state
//             clearInterval(interval);
//         else
//             gameOfLife.implementChanges(toChange);
//     }, 150);
// });
// function reDrawHandler(clear) {
//     return function (event) {
//         if (interval)
//             clearInterval(interval);
//         while (grid.firstChild)
//             grid.removeChild(grid.firstChild);
//         gameOfLife = new GameOfLife(grid, width.value, height.value, clear);
//     };
// };
// width.addEventListener("change", reDrawHandler());
// height.addEventListener("change", reDrawHandler());
// clear.addEventListener("click", reDrawHandler(true));
// randomize.addEventListener("click", reDrawHandler());
// ==========================
// function GameOfLife(div, width, height, clear){
//     this.gridDiv = div;
//     this.grid = [];
//     this.width = width ? width : 5;
//     this.height = height ? height : 5;
//     this.generateCheckboxes();
//     if(!clear) this.intialRandom();
// }
// GameOfLife.prototype.createCheckbox = function(){
//     var checkbox = document.createElement("input");
//     checkbox.type = "checkbox";
//     checkbox.checked = false;
//     return checkbox;
// };
// GameOfLife.prototype.generateCheckboxes = function () {
//     for (var y = 0; y < this.height; y++) {
//         var row = [];
//         for (var x = 0; x < this.width; x++) {
//             var checkbox = this.createCheckbox();
//             row.push(checkbox);
//             this.gridDiv.appendChild(checkbox);
//         }
//         this.grid.push(row);
//         this.gridDiv.appendChild(document.createElement("br"));
//     }
// };
// GameOfLife.prototype.intialRandom = function () {
//     this.grid.forEach(function (row) {
//         row.forEach(function (checkbox) {
//             checkbox.checked = (function () {
//                 if (Math.random() < 0.5)
//                     return false;
//                 else
//                     return true;
//             })();
//         });
//     });
// };
// GameOfLife.prototype.implementChanges = function (toChange) {
//     toChange.forEach(function (coord) {
//         this.grid[coord.y][coord.x].checked = !this.grid[coord.y][coord.x].checked;
//     }, this);
// };
// GameOfLife.prototype.checkAllCells = function () {
//     var toChange = [];
//     this.grid.forEach(function (row, y) {
//         row.forEach(function (checkbox, x) {
//             if (checkbox.checked ? this.shouldDie(x, y) : this.shouldLive(x, y))
//                 toChange.push({ x: x, y: y });
//         }, this);
//     }, this);
//     return toChange;
// };
// GameOfLife.prototype.shouldDie = function (x, y) {
//     var numberOfLiveCellsAround = this.checkAllDirections(x, y);
//     if (numberOfLiveCellsAround < 2 || numberOfLiveCellsAround > 3)
//         return true; // Should die.
//     else
//         return false; // Continue living.
// };
// GameOfLife.prototype.shouldLive = function (x, y) {
//     var numberOfLiveCellsAround = this.checkAllDirections(x, y);
//     if (numberOfLiveCellsAround == 3)
//         return true; // Phoenix Down! Should live!
//     else
//         return false; // Continue dead.
// };
// GameOfLife.prototype.checkAllDirections = function (x, y) {
//     var numberOfLiveCells = 0;
//     for (var _y = -1; _y <= 1; _y++) {
//         for (var _x = -1; _x <= 1; _x++) {
//             if (_x || _y) {                       // If both _x and _y are 0, the following isn't run
//                 var Y = y + _y;
//                 var X = x + _x;
//                 if (-1 < X && X < this.width
//                     && -1 < Y && Y < this.height) {
//                     if (this.grid[Y][X].checked) numberOfLiveCells++;
//                 }
//             }
//         }
//     }
//     return numberOfLiveCells;
// }; 
