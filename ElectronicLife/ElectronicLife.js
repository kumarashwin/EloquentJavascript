//---- Vector ------------------
function Vector(x, y) {
    this.x = x;
    this.y = y;
}

Vector.prototype.plus = function(other){
    return new Vector(
        this.x + other.x,
        this.y + other.y
    );
};
//------------------------------

//----- Grid ----
function Grid(width, height){
    this.space = new Array(width * height);
    this.width = width;
    this.height = height;
}

Grid.prototype.isInside = function(vector){
    return vector.x >= 0 && vector.x < this.width &&
    vector.y >= 0 && vector.y < this.height;
}

Grid.prototype.get = function(vector) {
    return this.space[vector.x + this.width * vector.y];
}

Grid.prototype.set = function(vector, value) {
    this.space[vector.x + (this.width * vector.y)] = value;
}

// This function iterates through each element of the Grid i.e.
// each item in the 'grid.space' array, and then applies the
// function 'func', calling it from the object passed as
// 'contextObject', and passes itself the arguments
// 'valueOfElement' & 'currentPositionVector' 
// Hence: contextObject.func(valueOfElement, currentPositionVector);
Grid.prototype.forEach = function(func, contextObject){
    for(var y = 0; y < this.height; y++){
        for(x = 0; x < this.width; x++){

            var cellValue = this.space[x + (y * this.width)];
            var currentPositionVector = new Vector(x, y);

            if(cellValue != null)
            {
                func.call(contextObject, cellValue, currentPositionVector);
            }
        }
    }
};
//------------------------------

//----- Directions -----
var directions = {
  "n":  new Vector( 0, -1),
  "ne": new Vector( 1, -1),
  "e":  new Vector( 1,  0),
  "se": new Vector( 1,  1),
  "s":  new Vector( 0,  1),
  "sw": new Vector(-1,  1),
  "w":  new Vector(-1,  0),
  "nw": new Vector(-1, -1)
};

var directionNames = "n ne e se s sw w nw".split(" ");
//-----------------------

// ---- Random ----
function randomElement(array){
    return array[Math.floor(Math.random() * array.length)];
}
// ------------------------

// ---- Bouncing critter ------
function BouncingCritter(){
    this.direction = randomElement(directionNames);
};

BouncingCritter.prototype.act = function(view){
    if(view.look(this.direction) != " "){
        this.direction = view.find(" ") || "s";
    }
    return {
        type: "move",
        direction: this.direction
    };
}

//----------------------------

//----- Elements/Characters ----
function elementFromCharacter(legend, character){
    if (character == " "){
        return null;
    }
    var element = new legend[character]();
    element.originalCharacter = character;
    return element;
}

function characterFromElement(element){
    return element == null ? " " : element.originalCharacter;
}
// ----------------------

// ---- World -------
function World(map, legend){
    var grid = new Grid(map[0].length, map.length);
    this.grid = grid;
    this.legend = legend;

    map.forEach(function(line, y){
        for(var x = 0; x < line.length; x++){
            grid.set(new Vector(x,y), elementFromCharacter(legend, line[x]));
        }
    });
}

World.prototype.toString = function(){
    var output = "";
    for (var y = 0; y < this.grid.height; y++){
        for (var x = 0; x < this.grid.width; x++) {
            var element = this.grid.get(new Vector(x, y));
            output += characterFromElement(element);
        }
        output += "\n";
    }
    return output;
};

World.prototype.turn = function() {
    var acted = [];

    // === Read comments above in 'Grid' ===
    //  ...contextObject.func(cellValue, currentPositionVector);
    //
    // The function passed as the argument below is the 'func' in
    // the example line above. The 'this' supplies the contextObject
    this.grid.forEach(function(cellValue, currentPositionVector){

        // Confirms that the cellValue represents a critter by
        // checking to see if it manifests the property 'act'
        // and then, as long as the 'critter' hasn't already
        // 'acted', it calls 'letAct'
        if(cellValue.act){
            var critter = cellValue;

            if(acted.indexOf(critter) == -1){
                acted.push(critter);
                this.letAct(critter, currentPositionVector);
            } 
        }
    }, this);
};

World.prototype.letAct = function(critter, currentPositionVector){
    var action = critter.act(new View(this, currentPositionVector));

    if(action && action.type == "move") {
        var destinationVector = this.checkDestination(action, currentPositionVector);

        if(destinationVector && this.grid.get(destinationVector) == null) {
            this.grid.set(currentPositionVector, null);
            this.grid.set(destinationVector, critter);
        }
    }
};

World.prototype.checkDestination = function(action, currentPositionVector){
    if (directions.hasOwnProperty(action.direction)) {
        var destinationVector = currentPositionVector.plus(directions[action.direction]);

        if(this.grid.isInside(destinationVector)){
            return destinationVector;
        }
    }
}
// ----------------------

// ---- View -----

function View(world, currentPositionVector){
    this.world = world;
    this.currentPositionVector = currentPositionVector;
}

View.prototype.look = function(direction) {
    var target = this.currentPositionVector.plus(directions[direction]);

    return this.world.grid.isInside(target)
        ? characterFromElement(this.world.grid.get(target))
        : "#";
};

View.prototype.findAll = function(character){
    var found = [];
    for (var direction in directions){
        if (this.look(direction) == character){
            found.push(direction);
        }
    }
    return found;
};

View.prototype.find = function(character){
    var found = this.findAll(character);
    if(found.length == 0){
        return null;
    }
    return randomElement(found);
};

// --------------------

// ----- Wall ----
function Wall(){}
// -----------------

// ---- Legend -----
var legend = {
    "#": Wall,
    "o": BouncingCritter
};
// -----------------

// ----- Seed (Map) -----
var seed = ["############################",
            "#      #    #      o      ##",
            "#                          #",
            "#          #####           #",
            "##         #   #    ##     #",
            "###           ##     #     #",
            "#           ###      #     #",
            "#   ####                   #",
            "#   ##       o             #",
            "# o  #         o       ### #",
            "#    #                     #",
            "############################"];
// -------------------

//==== MAIN ====

var world = new World(seed, legend);
console.log(world.toString());
for(var i = 0; i < 5; i++){
    world.turn();
    console.log(world.toString());    
}

//==== END ====