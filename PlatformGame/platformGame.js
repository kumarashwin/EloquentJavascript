
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

Level.prototype.obstacleAt = function(pos, size) {
    var xStart = Math.floor(pos.x);
    var xEnd = Math.ceil(pos.x + size.x);
    var yStart = Math.floor(pos.y);
    var yEnd = Math.ceil(pos.y + size.y);

    if(xStart < 0 || xEnd > this.width || yStart < 0){
        return "wall";
    }
    if(yEnd > this.height){
        return "lava";
    }
    for(var y = yStart; y < yEnd; y++){
        for(var x = xStart; x < xEnd; x++){
            var fieldType = this.grid[y][x];
            if(fieldType){
                return fieldType;
            }
        }
    }
};

Level.prototype.actorAt = function(actor){
    for(var i = 0; i < this.actors.length; i++){
        var other = this.actors[i];

        //If other actor is not actor, and occupies part
        //of the same space, return it.
        if(other != actor &&
            actor.pos.x + actor.size.x > other.pos.x &&
            actor.pos.x < other.pos.x + other.size.x &&
            actor.pos.y + actor.size.y > other.pos.y &&
            actor.pos.y < other.pos.y + other.size.y){
                return other;
            }
    }
};

var maxStep = 0.05;

Level.prototype.animate = function(step, keys){
    if(this.status != null){
        this.finishDelay -= step;
    }

    while(step > 0){
        var thisStep = Math.min(step, maxStep);
        this.actors.forEach(function(actor){
            actor.act(thisStep, this, keys);
        }, this);
        step -= thisStep;
    }
};

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

Lava.prototype.act = function(step, level){
    var newPos = this.pos.plus(this.speed.times(step));

    if(!level.obstacleAt(newPos, this.size)){
        this.pos = newPos;
    }
    else if(this.repeatPos){
        this.pos = this.repeatPos;
    }
    else{
        this.speed = this.speed.times(-1);
    }
}

//COIN
function Coin(pos){
    this.basePos = this.pos = pos.plus(new Vector(0.2, 0.1));
    this.size = new Vector(0.6, 0.6);
    this.wobble = Math.random() * Math.PI * 2;
}

Coin.prototype.type = "coin";

var wobbleSpeed = 8;
var wobbleDistance = 0.07;

Coin.prototype.act = function(step){
    this.wobble += step * wobbleSpeed;
    var wobblePos = Math.sin(this.wobble) * wobbleDist;
    this.pos = this.basePos.plus(new Vector(0, wobblePos));
};

//ELEMENT
function element(name, className){
    var element = document.createElement(name);
    if(className){
        element.className = className;
    }
    return element;
}

//DISPLAY
function DOMDisplay(parent, level){
    this.wrap = parent.appendChild(element("div", "game"));
    this.level = level;

    this.wrap.appendChild(this.drawBackground());
    this.actorLayer = null;
    this.drawFrame();
}

//SCALE
var scale = 20;

DOMDisplay.prototype.drawBackground= function(){
    var table = element("table", "background");
    table.style.width = this.level.width * scale + "px";
    this.level.grid.forEach(function(row){
        var rowElement = table.appendChild(element("tr"));
        rowElement.style.height = scale + "px";
        row.forEach(function(type){
            rowElement.appendChild(element("td", type));
        });
    });
    return table;
};

DOMDisplay.prototype.drawActors = function(){
    var wrap = element("div");
    this.level.actors.forEach(function(actor){
        var rect = wrap.appendChild(element("div", "actor " + actor.type));

        rect.style.width = (actor.size.x * scale) + "px";
        rect.style.height = (actor.size.y * scale) + "px";
        rect.style.left = (actor.pos.x * scale) + "px";
        rect.style.top = (actor.pos.y * scale) + "px";
    });
    return wrap;
};

DOMDisplay.prototype.drawFrame = function(){
    if(this.actorLayer){
        this.wrap.removeChild(this.actorLayer);
    }
    this.actorLayer = this.wrap.appendChild(this.drawActors());
    this.wrap.className = "game " + (this.level.status || "");
    this.scrollPlayerIntoView();
};

DOMDisplay.prototype.scrollPlayerIntoView = function(){
    var width = this.wrap.clientWidth;
    var height = this.wrap.clientHeight;
    var margin = width/3;

    var left = this.wrap.scrollLeft;
    var right = left + width;

    var top = this.wrap.scrollTop;
    var bottom = top + height;

    var player = this.level.player;
    var center = player.pos.plus(player.size.times(0.5)).times(scale);

    if(center.x < left + margin){
        this.wrap.scrollLeft = center.x - margin;
    }
    else if(center.x > right - margin){
        this.wrap.scrollLeft = center.x + margin - width;
    }

    if(center.y < top + margin){
        this.wrap.scrollTop = center.y - margin;
    }
    else if(center.y > bottom - margin){
        this.wrap.scrollTop = center.y + margin - height;
    }
};

DOMDisplay.prototype.clear = function(){
    this.wrap.parentNode.removeChild(this.wrap);
};
