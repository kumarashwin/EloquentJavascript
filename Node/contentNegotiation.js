var http = require("http");
var request = http.request({
    hostname: "eloquentjavascript.net",
    path: "/author",
    method: "GET",
    headers: {Accept: process.argv[2] || "text/html"}
}, function(response){
    response.on("data", function(chunk){
        console.log(chunk.toString());
    });
});
request.end();