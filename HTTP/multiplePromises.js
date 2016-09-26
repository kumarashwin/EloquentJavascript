function all(promises) {
  return new Promise(function(success, fail) {
    var resultsArray = [];
    var counter = promises.length;
    if(!promises.length)
        return success(resultsArray);
    else {
        promises.forEach(function(promise, index){
            promise.then(
                function(value){
                    resultsArray[index] = value;
                    counter--;
                    if(!counter)
                        success(resultsArray);
                },
                function(error){
                    fail(error);
                }
            );
        });
    }
  });
}

// Test code.
all([]).then(function(array) {
  console.log("This should be []:", array);
});
function soon(val) {
  return new Promise(function(success) {
    setTimeout(function() { success(val); },
               Math.random() * 500);
  });
}
all([soon(1), soon(2), soon(3)]).then(function(array) {
  console.log("This should be [1, 2, 3]:", array);
});
function fail() {
  return new Promise(function(success, fail) {
    fail(new Error("boom"));
  });
}
all([soon(1), fail(), soon(3)]).then(function(array) {
  console.log("We should not get here");
}, function(error) {
  if (error.message != "boom") // I think the author made a mistake here... should be "=="
    console.log("Unexpected failure:", error);
  else console.log(error);
});