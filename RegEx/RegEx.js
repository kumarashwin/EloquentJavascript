
// verify(/ca[rt]/,
//        ["my car", "bad cats"],
//        ["camper", "high art"]);

assert(/ca[rt]/, "my car", true);
assert(/ca[rt]/, "bad cats", true);
assert(/ca[rt]/, "camper", false);
assert(/ca[rt]/, "high art", false);

// verify(/.../,
//        ["pop culture", "mad props"],
//        ["plop"]);

assert(/pr?op/,"pop culture", true);
assert(/pr?op/,"mad props", true);
assert(/pr?op/,"plops", false);

// verify(/.../,
//        ["ferret", "ferry", "ferrari"],
//        ["ferrum", "transfer A"]);

//ferret, ferry, and ferrari 
assert(/ferr(et|y|ari)/,"ferret", true);
assert(/ferr(et|y|ari)/,"ferry", true);
assert(/ferr(et|y|ari)/,"ferrari", true);
assert(/ferr(et|y|ari)/,"ferrum", false);
assert(/ferr(et|y|ari)/,"transfer A", false);

// verify(/.../,
//        ["how delicious", "spacious room"],
//        ["ruinous", "consciousness"]);
var regEx = /ious\b/;
assert(regEx, "how delicious", true);
assert(regEx, "spacious room", true);
assert(regEx, "ruinous", false);
assert(regEx, "consciousness", false);

// verify(/.../,
//        ["bad punctuation ."],
//        ["escape the dot"]);
// A whitespace character followed by a dot, comma, colon, or semicolon

regEx = /\s[\.\:\,\;]/; 
assert(regEx, "bad punctuation .", true);
assert(regEx, "escape the dot", false);

// verify(/.../,
//        ["hottentottententen"],
//        ["no", "hotten totten tenten"]);
// A word longer than six letters

regEx = /\b\S{7,}\b/;
assert(regEx, "hottentottententen", true);
assert(regEx, "hotten totten tenten", false);
assert(regEx, "no", false);

// verify(/.../,
//        ["red platypus", "wobbling nest"],
//        ["earth bed", "learning ape"]);
//A word without the letter e
regEx = /\b[^\se]+\b/;
assert(regEx, "red platypus", true);
assert(regEx, "wobbling nest", true);
assert(regEx, "earth bed", false);
assert(regEx, "learning ape", false);

function assert(regexp, string, intendedResult)
{
  var result = regexp.test(string) == intendedResult;
  if(!result){
    console.log(
      "Problem with inputs:\n",
      "-- RegEx: ", regexp,
      "-- String: ", string);
  }
  else{
    console.log(regexp.test(string) == intendedResult);
  }
  return; 
}

// function verify(regexp, yes, no) {
//   // Ignore unfinished exercises
//   if (regexp.source == "...") {
//     return;
//   }
  
//   yes.forEach(function(s) {
//     var test = regexp.test(s);
//     if(!test){
//       console.log("This shouldn't show!");
//     }
//   });

//   no.forEach(function(s) {
//     if (regexp.test(s))
//       wtf
//       console.log("Unexpected match for '" + s + "'");
//   });
// }