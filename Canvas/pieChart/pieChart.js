//====== PIE CHART =====================
function drawPieChart(context, results, radius, centerX, centerY, stroke, strokeWidth) {
    var angles = [];
    var doneAnimation = false;
    var dumpInterval = false;

    //AWW YEAH, using closures!
    function clearFactory(radius, centerX, centerY, stroke, strokeWidth) {
        radius *= 1.1; //Some padding to be sure;
        return function () {
            context.clearRect(centerX - radius, centerY - radius, centerX + radius, centerY + radius);
        }
    };
    var clear = clearFactory(radius, centerX, centerY, stroke, strokeWidth);

    if (stroke === true && strokeWidth) {
        strokeWidth = Math.max(strokeWidth, 40);
        radius = radius - (strokeWidth / 2);
    }

    //First element starts at 90 degrees
    var startAngle = (-0.5 * Math.PI);
    var endAngle;
    var total = results.reduce(function (sum, choice) { return sum + choice.count; }, 0);

    for (var i = 0; i < results.length; i++) {
        var sliceAngle = (results[i].count / total) * 2 * Math.PI;
        endAngle = startAngle + sliceAngle;
        angles.push({ startAngle: startAngle, endAngle: endAngle });
        startAngle = endAngle;
    }

    angles.forEach(function (result, index) {
        var color = results[index].color;
        var difference = result.endAngle - result.startAngle;
        var step = Math.max(0.05, difference * 0.05);
        var startAngle = result.startAngle - (30 * (Math.PI / 180));
        var endAngle = startAngle;

        var interval = setInterval(function () {
            if (index == 0) {
                //In a new chain, if all elements are done animating
                if (doneAnimation)
                    //Initiate dump of the interval
                    dumpInterval = true;
                else
                    clear();
            }

            if (dumpInterval) {
                clearInterval(interval);
            }
            else {
                context.save();
                context.translate(centerX, centerY);
                context.beginPath();
                context.arc(0, 0, radius, Math.min(startAngle, result.startAngle), Math.min(endAngle, result.endAngle));

                if (stroke === true) {
                    context.strokeStyle = color;
                    context.lineWidth = strokeWidth;
                    context.stroke();
                } else {
                    context.lineTo(0, 0);
                    context.fillStyle = color;
                    context.fill();
                }

                context.restore();

                if (endAngle >= result.endAngle
                    && startAngle >= result.startAngle) {
                    //First element start the verification chain
                    if (index == 0)
                        doneAnimation = true;
                    else
                        //All other following elements continue the verification
                        doneAnimation = doneAnimation && true;
                }
                else {
                    doneAnimation = false;
                    startAngle += step / 2;
                    endAngle += step;
                }
            }
        }, 30);
    });
}
//========== END OF PIE DRAWING PART ========