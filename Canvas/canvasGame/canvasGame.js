
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
    if(paused == false){
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
    }
};

Level.prototype.playerTouched = function(type, actor){
    if(type == "lava" && this.status == null){
        this.status = "lost";
        this.finishDelay = 1;
    } else if(type == "coin"){
        this.actors = this.actors.filter(function(other){
            return other != actor;
        });
        var coinsLeft = this.actors.some(function(actor){
            return actor.type == "coin";}); 
        if(!coinsLeft){
            this.status = "won";
            this.finishDelay = 1;
        }
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

var playerXSpeed = 7;

Player.prototype.moveX = function(step, level, keys) {
    this.speed.x = 0;
    if(keys.left){
        this.speed.x -= playerXSpeed;
    }
    if(keys.right){
        this.speed.x += playerXSpeed;
    }

    var motion = new Vector(this.speed.x * step, 0);
    var newPos = this.pos.plus(motion);
    
    var obstacle = level.obstacleAt(newPos, this.size);
    if(obstacle){
        level.playerTouched(obstacle)
    }
    else{
        this.pos = newPos;
    }
};

var gravity = 30;
var jumpSpeed = 17;

Player.prototype.moveY = function(step, level, keys){
    this.speed.y += step * gravity;
    var motion = new Vector(0, this.speed.y * step);
    var newPos = this.pos.plus(motion);
    var obstacle = level.obstacleAt(newPos, this.size);
    if(obstacle){
        level.playerTouched(obstacle)
        if(keys.up && this.speed.y > 0){
            this.speed.y = -jumpSpeed;
        }
        else{
            this.speed.y = 0;
        }
    }
    else {
        this.pos = newPos;
    }
};

Player.prototype.act = function(step, level, keys){
    this.moveX(step, level, keys);
    this.moveY(step, level, keys);

    var otherActor = level.actorAt(this);
    if(otherActor){
        level.playerTouched(otherActor.type, otherActor);
    }

    //Losing Animation
    if(level.status == "lost"){
        this.pos.y += step;
        this.size.y -= step;
    }
};

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
var wobbleDist = 0.07;

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

//SCALE i.e. pixels per grid element
var scale = 40;

//DISPLAY
function CanvasDisplay(parent, level){
    this.canvas = document.createElement("canvas");
    this.canvas.width = Math.min(600, level.width * scale);
    this.canvas.height = Math.min(450, level.height * scale);
    
    parent.appendChild(this.canvas);
    this.cx = this.canvas.getContext("2d");
    this.level = level;
    this.animationTime = 0;
    this.flipPlayer = false;

    this.viewport = {
        left: 0,
        top: 0,
        width: this.canvas.width / scale,
        height: this.canvas.height / scale
    };

    
    this.drawFrame(0);
}

CanvasDisplay.prototype.clear = function(){
    this.canvas.parentNode.removeChild(this.canvas);
};

CanvasDisplay.prototype.drawFrame = function(step){
    this.animationTime += step;
    this.updateViewport();
    this.clearDisplay();
    this.drawBackground();
    this.drawActors();
};

CanvasDisplay.prototype.updateViewport = function(){
    var view = this.viewport;
    var margin = view.width / 3;
    var player = this.level.player;
    var center = player.pos.plus(player.size.times(0.5));

    if(center.x < view.left + margin)
        view.left = Math.max(center.x - margin, 0);
    else if(center.x > view.left + view.width - margin){
        view.left = Math.min(
            center.x - view.width + margin,
            this.level.width - view.width);}

    if(center.y < view.top + margin)
        view.top = Math.max(center.y - margin, 0);
    else if(center.y > view.top + view.height - margin){
        view.top = Math.min(
            center.y - view.height + margin,
            this.level.height - view.height);}
};

CanvasDisplay.prototype.clearDisplay = function(){
    if(this.level.status == "won")
        this.cx.fillStyle = "rgb(68, 191, 255)";
    else if(this.level.status == "lost")
        this.cx.fillStyle = "rgb(44, 136, 214)";
    else
        this.cx.fillStyle = "rgb(52, 166, 251)";
    this.cx.fillRect(0, 0, this.canvas.width, this.canvas.height);
};

var otherSprites = document.createElement("img");
otherSprites.src = "img/sprites_big.png";

CanvasDisplay.prototype.drawBackground = function(){
    var view = this.viewport;
    var xStart = Math.floor(view.left);
    var xEnd = Math.ceil(view.left + view.width);
    var yStart = Math.floor(view.top);
    var yEnd = Math.ceil(view.top + view.height);

    for (var y = yStart; y < yEnd; y++){
        for(var x = xStart; x < xEnd; x++){
            var tile = this.level.grid[y][x];
            if(tile != null){
                var screenX = (x - view.left) * scale;
                var screenY = (y - view.top) * scale;
                var tileX = tile == "lava" ? scale : 0;
                this.cx.drawImage(
                    otherSprites,
                    tileX, 0, scale, scale,
                    screenX, screenY, scale, scale);
            }
        }
    }    
};

function flipHorizontally(context, around) {
  context.translate(around, 0);
  context.scale(-1, 1);
  context.translate(-around, 0);
}

var playerSprites = document.createElement("img");
playerSprites.src = "img/player_big.png";
var playerXOverlap = 8;
CanvasDisplay.prototype.drawPlayer = function(x, y, width, height){
    var sprite = 8;
    var player = this.level.player;
    
    width += playerXOverlap * 2;
    x -= playerXOverlap;

    if(player.speed.x != 0){
        this.flipPlayer = player.speed.x < 0;
    }

    if(player.speed.y != 0)
        sprite = 9;
    else if(player.speed.x != 0)
        sprite = Math.floor(this.animationTime * 12) % 8;

    this.cx.save();
    if(this.flipPlayer)
        flipHorizontally(this.cx, x + width/2);

    this.cx.drawImage(playerSprites,
                        sprite * width, 0, width, height,
                        x, y, width, height);

    this.cx.restore();
};

CanvasDisplay.prototype.drawActors = function(){
    this.level.actors.forEach(function(actor){
        var width = actor.size.x * scale;
        var height = actor.size.y * scale;

        var x = (actor.pos.x - this.viewport.left) * scale;
        var y = (actor.pos.y - this.viewport.top) * scale;

        if(actor.type == "player"){
            this.drawPlayer(x, y, width, height);
        } else {
            var tileX = (actor.type == "coin" ? 2 : 1) * scale;
            this.cx.drawImage(otherSprites,
                                tileX, 0, width, height,
                                x, y, width, height);
        }
    }, this);
};

//KEYS
var arrowCodes = {37: "left",
                  38: "up",
                  39: "right",
                  27: "pause"};

var paused = false;

var pressedKey = Object.create(null);
function handler(event) {
    if (arrowCodes.hasOwnProperty(event.keyCode)) {

        var down;
        if (event.type == "keydown") {
            down = true;
            //Escape pressed:
            if (event.keyCode == 27) {
                //Switch from true to false and vice-versa
                paused = (paused == true) ? false : true;
                down = paused;
            }
        }
        else {
            down = false;
            //keyup doesn't change paused state with Escape
            if (event.keyCode == 27) {
                down = paused;
            }

        }
        pressedKey[arrowCodes[event.keyCode]] = down;
        event.preventDefault();
    }
}

function trackKeys() {
    addEventListener("keydown", handler);
    addEventListener("keyup", handler);
}

function disposeKeys(){
    removeEventListener("keydown", handler);
    removeEventListener("keyup", handler);
}

//RUN
function runAnimation(frameFunction){
    var lastTime = null;
    function frame(time){
        var stop = false;
        if(lastTime != null){
            var timeStep = Math.min(time - lastTime, 100) / 1000;
            stop = frameFunction(timeStep) === false;
        }
        lastTime = time;
        if(!stop){
            requestAnimationFrame(frame);
        } 
    }
    requestAnimationFrame(frame);
}

function runLevel(level, Display, andThen){
    var display = new Display(document.body, level);
    runAnimation(function(step){
        level.animate(step, pressedKey);
        display.drawFrame(step);

        if(level.isFinished()){
            display.clear();
            if(andThen){
                andThen(level.status);
            }
            return false;
        }
    });
}

var extraLives = 2;
function runGame(plans, Display){
    function startLevel(n){

        var andThen = function(status){
            if(status == "lost"){
                if(extraLives > 0){
                    extraLives--;
                    startLevel(n);
                }
                else
                    disposeKeys();
                    console.log("You lose!");
            }
            else if(n < plans.length - 1){
                startLevel(n+1);
            }
            else{
                disposeKeys();
                console.log("You win!");
            }
        };
        runLevel(new Level(plans[n]), Display, andThen);
    }

    trackKeys();
    startLevel(0);
}