
//====== PIE CHART =====================
function PieChart(canvas, data, totalObservations, radius, stroke) {
    this.context = canvas.getContext('2d');
    this.clear = function(){this.context.clearRect(0, 0, canvas.width, canvas.height);};
    this.data = data;
    this.totalObservations = totalObservations;
    this.slices = [];
    this.doneAnimation = false;
    this.dumpInterval = false;
    this.posX = canvas.width/2;
    this.posY = canvas.height/2;
    //this.clear = this.clearFactory(radius, this.posX, this.posY);
    this.size = radius;
    
    if(stroke === true){                    // Determine if style is hollow i.e. we use strokes
        this.stroke = stroke;
        this.strokeWidth = radius * 0.4;
        this.size = radius - (this.strokeWidth/2);
    }

    this.populateSlices();
    this.draw(this);
}

function Slice(color, beginning, end){
    this.color = color;
    this.beginning = beginning;
    this.end = end;

    //For step-by-step animation:
    this.startAngle = this.endAngle = this.beginning - (2*Math.PI/12); // beginning - 30 degrees
    this.step = Math.max(0.1, (this.end - this.beginning) * 0.1); // From 0.1 upto 1% of slice's angle
}

PieChart.prototype.clear = function(){
    
}

//AWW YEAH, using closures!
PieChart.prototype.clearFactory = function(size, posX, posY){
    size *= 1.1; //Some padding to be sure;
    return function(){
        this.context.clearRect(posX - size, posY - size, posX + size, posY + size);
    }
};

PieChart.prototype.populateSlices = function(){
    var startAngle = -0.5 * Math.PI; //First element starts at 90 degrees
    var endAngle;
    for (var i = 0; i < this.data.length; i++) {
        var slice = this.data[i];
        var sliceAngle = (slice.value / this.totalObservations) * 2 * Math.PI; // Percentage of a full circle
        endAngle = startAngle + sliceAngle;
        this.slices.push(new Slice(slice.color, startAngle, endAngle));
        startAngle = endAngle;
    }
};

PieChart.prototype.paint = function(color){
    if(this.stroke === true){
        this.context.lineWidth = this.strokeWidth;
        this.context.strokeStyle = color;
        this.context.stroke();
    } else {
        this.context.lineTo(0, 0);
        this.context.fillStyle = color;
        this.context.fill();
    }
};

PieChart.prototype.draw = function(){
    this.slices.forEach(function(slice, index){
        var interval = setInterval(function(){
            if (index == 0){                    // In a new chain,
                if(this.doneAnimation)         // if all elements are done animating,
                    this.dumpInterval = true;  // initiate dump of the interval
                else
                    this.clear();              // Otherwise, clear the canvas
            }

            if (this.dumpInterval) {
                clearInterval(interval); // End animation for the slices
            }
            else {
                slice.startAngle = Math.min(slice.startAngle, slice.beginning);
                slice.endAngle = Math.min(slice.endAngle, slice.end);

                this.context.save();
                this.context.translate(this.posX, this.posY);
                this.context.beginPath();
                this.context.arc(0, 0, this.size, slice.startAngle, slice.endAngle);
                this.paint(slice.color);
                this.context.restore();

                if (slice.endAngle == slice.end && slice.startAngle == slice.beginning){ // If animation complete,
                    if (index == 0)                                 // First element starts the verification chain
                        this.doneAnimation = true;
                    else
                        this.doneAnimation = this.doneAnimation && true; //All other following elements continue the verification
                }
                else {                                      
                    this.doneAnimation = false;            // Otherwise, if one slice hasn't finished, 
                    slice.startAngle += slice.step / 2;     // it sets the doneAnimation to 'false'
                    slice.endAngle += slice.step;           // and increases the relevant variables
                }
            }
        }.bind(this), 30);
    }, this);
};
//========== END OF PIE DRAWING PART ========