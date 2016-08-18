// Your code here.
var month = {};

(function(exports){
    var names = [
        "January", "February", "March", "April",
        "May", "June", "July", "August",
        "September", "October", "November", "December"];

    exports.name = function(number) {
        return names[number];
    };
    exports.number = function(name) {
        return names.indexOf(name);
    };
})(month);

console.log(month.name(2));
// → March
console.log(month.number("November"));
// → 10