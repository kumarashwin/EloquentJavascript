var http = require("http");
var fs = require("fs");
var methods = Object.create(null);

http.createServer(function(request, response){
    function respond(code, body, type){
        if(!type) type = "text/plain";
        response.writeHead(code, {"Content-Type":type});
        if(body && body.pipe)
            body.pipe(response);
        else
            response.end(body);
    }

    if(request.method in methods)
        methods[request.method](urlToPath(request.url), respond, request);
    else
        respond(405, "Method " + request.method + " not allowed.");
}).listen(8000);

function urlToPath(url){
    var path = require("url").parse(url).pathname;
    return "." + decodeURIComponent(path);
}

methods.GET = function(path, respond){
    fs.stat(path, function(error, stats){
        if(error && error.code == "ENOENT")
            respond(404, "File not found\r\n");
        else if(error)
            respond(500, error.toString());
        else if(stats.isDirectory())
            fs.readdir(path, function(error, files){
                if(error)
                    respond(500, error.toString());
                else
                    respond(200, files.join("\r\n"));
            });
        else
            respond(200, fs.createReadStream(path), require("mime").lookup("path"));
    });
};

methods.DELETE = function(path, respond){
    fs.stat(path, function(error, stats){
        if(error && error.code == "ENOENT")
            respond(204);
        else if(error)
            respond(500, error.toString());
        else if(stats.isDirectory())
            fs.rmdir(path, respondErrorOrNothing(respond));
        else
            fs.unlink(path, respondErrorOrNothing(respond));
    });
};

// Dynamically generates and return a callback in the nature
// of 'function(error, result){ ... }'
function respondErrorOrNothing(respond){
    return function(error){
        if(error)
            respond(500, error.toString());
        else{
            respond(204);
        }
    };
}

methods.PUT = function(path, respond, request){
    var outStream = fs.createWriteStream(path);

    outStream.on("error", function(error){respond(500, error.toString());});
    outStream.on("finish", function(){respond(204);});

    request.pipe(outStream);
};

methods.MKCOL = function(path, respond, request){
    fs.stat(path, function(error, stats){
        if(error && error.code == "ENOENT"){
            var path = require("url").parse(request.url).pathname;
            path = path.toString().split("/");
            if(/[#<>%$\+\-!`&*'|{}?/:\\\s@"=]+/.test(path[1]))
                respond(405, "Illegal directory name: You cannot include: #<>%$\+\-!`&*'|{}?/:\\\s@\"=]+");
            else
                fs.mkdir(path[1], respondErrorOrNothing(respond));
        }
        else if (error)
            respond(500, error.toString());
        else if(stats.isDirectory())
            respond(405, "Directory already exists\n");
        else
            respond(500, "No idea. Contact programmer");
    });
};