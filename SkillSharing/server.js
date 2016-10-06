var http = require("http");
var Router = require("./router");
var ecstatic = require("ecstatic");
var fs = require("fs");

var fileServer = ecstatic({root: "./public"});
var router = new Router();

function respond(response, status, data, type){
    response.writeHead(status, {"Content-Type": type || "text/plain"});
    response.end(data);
}

function respondJSON(response, status, data){
    respond(response, status, JSON.stringify(data), "application/json");
}

function readStreamAsJSON(stream, callback){
    var data = "";
    stream.on("data", function(chunk){
        data += chunk;
    });
    stream.on("end", function(){
        var result;
        var error;
        
        try {result = JSON.parse(data);}
        catch(e){error = e;}

        callback(error, result);
    });

    stream.on("error", function(error){
        callback(error);
    });
}

function sendTalks(talks, response){
    respondJSON(response, 200, {
        serverTime: Date.now(),
        talks: talks
    });
}

var waiting = [];
function waitForChanges(since, response){
    var waiter = {since: since, response: response};
    waiting.push(waiter);

    setTimeout(function() {
        var found = waiting.indexOf(waiter);
        if(found > -1){
            waiting.splice(found, 1);
            sendTalks([], response);
        }
    }, 90 * 1000);
}

// registerChange is called whenever a PUT, DELETE or POST(comments) action is performed.
// It checks the array of waiting clients and pushs the changes to them by calling sendTalks
// with the most recent changed data i.e. through getChangedTalks
var changes = [];
function registerChange(title){
    changes.push({title:title, time: Date.now()});
    waiting.forEach(function(waiter){
        sendTalks(getChangedTalks(waiter.since), waiter.response);
    });
    waiting = [];

    // Save changes to file
    writeToFile(talks);
}

function getChangedTalks(since){
    var found = [];
    function alreadySeen(title){return found.some(function(f) { return f.title == title;});}

    // Moving from the back to the front...
    for (var i = changes.length - 1; i >= 0; i--){
        var change = changes[i];

        // Break when we reach the most recent change which was already sent to the client
        if(change.time <= since)
            break;
        // If in our traversal, we've already dealt with the more recent changes to a
        // certain talk, we can ignore it and continue
        else if(alreadySeen(change.title))
            continue;
        // If the talk was changed, push the new version of the talk into found
        else if(change.title in talks)
            found.push(talks[change.title]);
        // If the talk was deleted, send a signal to the client to remove it from the DOM
        else
            found.push({title: change.title, deleted: true});
    }
    //Return the array to the sendTalks function called in registerChange
    return found;
}

router.add("GET", /^\/talks$/, function(request, response){
    var query = require("url").parse(request.url, true).query;
    if(query.changesSince == null){
        var list = [];
        for (var title in talks)
            list.push(talks[title]);
        sendTalks(list, response);
    } else {
        var since = Number(query.changesSince);
        if(isNaN(since)){
            respond(response, 400, "Invalid parameter: changesSince");
        } else {
            var changed = getChangedTalks(since);
            if(changed.length > 0)
                sendTalks(changed, response);
            else
                waitForChanges(since, response);
        }
    }
});

router.add("GET", /^\/talks\/([^\/]+)$/, function(request, response, title){
    if(title in talks)
        respondJSON(response, 200, talks[title]);
    else
        respondJSON(response, 404, "No talk '" + title + "' found");
});

router.add("DELETE", /^\/talks\/([^\/]+)$/, function(request, response, title){
    if(title in talks){
        delete talks[title];
        registerChange(title);
    }
    respondJSON(response, 204, null);
});



router.add("PUT", /^\/talks\/([^\/]+)$/, function(request, response, title){
    readStreamAsJSON(request, function(error, talk){
        if(error){
            respond(response, 400, error.toString());
        } else if (!talk || typeof talk.presenter != "string" || typeof talk.summary != "string") {
            respond(response, 400, "Bad 'talk' data");
        } else {
            talks[title] = {
                title: title,
                presenter: talk.presenter,
                summary: talk.summary,
                comments: []};
            registerChange(title);
            respond(response, 204, null);
        }
    });
});

router.add("POST", /^\/talks\/([^\/]+)\/comments$/, function(request, response, title){
    readStreamAsJSON(request, function(error, comment){
        if(error){
            respond(response, 400, error.toString());
        } else if (!comment || typeof comment.author != "string" || typeof comment.message != "string") {
            respond(response, 400, "Bad 'comment' data");
        } else if (title in talks){
            talks[title].comments.push(comment);
            registerChange(title);
            respond(response, 204, null);
        } else {
            respond(response, 404, "No talk '" + title + "' found");
        }
    });
});

function writeToFile(talks){
    fs.writeFile("./data.json", JSON.stringify(talks), function(error){
        if(error)
            console.log("Failed to write file: ", error);
    });
}

function readFromFile(){
    var result = Object.create(null);
    var json;

    try {
        json = JSON.parse(fs.readFileSync("./data.json", "utf8"));
    }
    catch(e){
        json = {};
    }
    for(var title in json)
        result[title] = json[title];
    
    return result;
}

// === MAIN ===
// Load previously stored talks 
var talks = readFromFile();

//If router.resolve returns false, serve the static files.
http.createServer(function(request, response){
    if(!router.resolve(request, response))
        fileServer(request, response);
}).listen(8000);
