
//====== PIE CHART =====================
function PieChart(context, results, radius, posX, posY, stroke, strokeWidth) {
    this.context = context;
    this.data = results;
    this.slices = [];
    this.doneAnimation = false;
    this.dumpInterval = false;
    this.posX = posX;
    this.posY = posY;
    this.totalObservations = this.data.reduce(function (sum, choice) { return sum + choice.count; }, 0);

    this.size = radius;
    if(stroke === true){                    // Determine if style is hollow i.e. we use strokes
        this.stroke = stroke;               // If strokeWidth provided
        if(strokeWidth) {
            this.strokeWidth = strokeWidth; // If yes;
            this.size = radius - ( Math.max(strokeWidth, 40) / 2); // Reduce size by outer half of stroke
        } else {
            this.strokeWidth = 40; // If not;
            this.size = radius - 20; // Reduce size by half of minimum stroke width i.e. 40 / 2
        }
    }

    this.clear = this.clearFactory(this.size, this.posX, this.posY);
    this.populateSlices();
    this.draw(this);
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
        var sliceAngle = (slice.count / this.totalObservations) * 2 * Math.PI; // Percentage of a full circle
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
        context.lineTo(0, 0);
        context.fillStyle = color;
        context.fill();
    }
};

function Slice(color, beginning, end){
    this.color = color;
    this.beginning = beginning;
    this.end = end;

    //For step-by-step animation:
    this.startAngle = this.endAngle = this.beginning - (2*Math.PI/12); // beginning - 30 degrees
    this.step = Math.max(0.05, (this.end - this.beginning) * 0.05); // Minimum 0.05 upto 5% of slice's angle
}

PieChart.prototype.draw = function(_this){

    //TESTING:
    // var slice = _this.slices[0];
    // var index = 0;
    _this.slices.forEach(function(slice, index){
        var interval = setInterval(function(){
            if (index == 0){                    // In a new chain,
                if(_this.doneAnimation)         // if all elements are done animating,
                    _this.dumpInterval = true;  // initiate dump of the interval
                else
                    _this.clear();              // Otherwise, clear the canvas
            }

            if (_this.dumpInterval) {
                clearInterval(interval); // End animation for the slices
            }
            else {
                slice.startAngle = Math.min(slice.startAngle, slice.beginning);
                slice.endAngle = Math.min(slice.endAngle, slice.end);

                _this.context.save();
                _this.context.translate(_this.posX, _this.posY);
                _this.context.beginPath();
                _this.context.arc(0, 0, _this.size, slice.startAngle, slice.endAngle);
                _this.paint(slice.color);
                _this.context.restore();

                if (slice.endAngle == slice.end && slice.startAngle == slice.beginning){ // If animation complete,
                    if (index == 0) // First element starts the verification chain
                        _this.doneAnimation = true;
                    else
                        _this.doneAnimation = _this.doneAnimation && true; //All other following elements continue the verification
                }
                else {                                      
                    _this.doneAnimation = false; // Otherwise, if one slice hasn't finished, 
                    slice.startAngle += slice.step / 2;     // it sets the doneAnimation to 'false'
                    slice.endAngle += slice.step;           // and increases the relevant variables
                }
            }
        }, 30);
    });
};
//========== END OF PIE DRAWING PART ========