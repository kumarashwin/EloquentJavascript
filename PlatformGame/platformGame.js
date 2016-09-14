
//LEVEL
function Level(plan){
    this.width = plan[0].length;
    this.height = plan.length;
    this.grid = [];
    this.actors = [];
    this.status = null;
    this.finishDelay = null;

    //Access each individual line
    for(var y = 0; y < this.height; y++){
        var line = plan[y];
        var gridLine = [];

        //Access inner array i.e. each element per line
        for(var x = 0; x < this.width; x++){
            var character = line[x];
            var fieldType = null;
            var Actor = actorChars[character];

            //Keep track of all actors
            if(Actor){
                this.actors.push(new Actor(new Vector(x, y), character));
            }
            else if(character == "x"){
                fieldType = "wall";
            }
            else if(character == "!"){
                fieldType = "lava";
            }

            gridLine.push(fieldType);
        }
        this.grid.push(gridLine);
    }

    //Searches the 'actors' array from the previous
    //for-loop for the element corresponding to the player
    //character and selects the first element of the array
    //thus returned
    this.player = this.actors.filter(function(actor){
        return actor.type == "player";
    })[0];
}

Level.prototype.isFinished = function(){
    return this.status != null && this.finishDelay < 0;
}

//VECTOR
function Vector(x, y){
    this.x = x;
    this.y = y;
}

Vector.prototype.plus = function(other){
    return new Vector(this.x + other.x,
                      this.y + other.y);
};

Vector.prototype.times = function(factor){
    return new Vector(this.x * factor,
                      this.y * factor);
};

//ACTORCHARS
var actorChars = {
    "@": Player,
    "o": Coin,
    "=": Lava,
    "|": Lava,
    "v": Lava
};

//PLAYER
function Player(pos){
    this.pos = pos.plus(new Vector(0, -0.5));
    this.size = new Vector(0.8, 1.5);
    this.speed = new Vector(0,0);
}
Player.prototype.type = "player";

//LAVA
function Lava(pos, character){
    this.pos = pos;
    this.size = new Vector(1,1);

    switch(character){
        case "=":
            this.speed = new Vector(2,0);
            break;
        case "|":
            this.speed = new Vector(0,2);
            break;
        case "v":
            this.speed = new Vector(0,3);
            this.repeatPos = pos;
            break;
    }
}

Lava.prototype.type = "lava";

//COIN
function Coin(pos){
    this.basePos = this.pos = pos.plus(new Vector(0.2, 0.1));
    this.size = new Vector(0.6, 0.6);
    this.wobble = Math.random() * Math.PI * 2;
}

Coin.prototype.type = "coin";