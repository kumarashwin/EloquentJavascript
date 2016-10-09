// callback here is what the client wants to do with the response
// returned by the server.
function request(options, callback){
    var req = new XMLHttpRequest(); 
    req.open(options.method || "GET", options.pathname, true);

    req.addEventListener("load", function(){
        if(req.status < 400) // Meaning, everything was good
            callback(null, req.responseText);
        else
            callback(new Error("Request failed: " + req.statusText));
    });

    req.addEventListener("error", function(){
        callback(new Error("Network error"));
    });

    req.send(options.body || null);
}

function reportError(error){
    if(error)
        alert(error.toString());
}

// Used both to build up the initial display and to update it when
// something changes. It will use the shownTalks object, which
// associates talk titles with DOM nodes, to remember the talks it
// currently has on the screen.
var talkDiv = document.querySelector("#talks");
var shownTalks = Object.create(null);
function displayTalks(talks){
    talks.forEach(function(talk){
        var shown = shownTalks[talk.title];

        // In the case the talk is displayed, but has been deleted on
        // the server:
        if(shown && talk.deleted){
            talkDiv.removeChild(shown);
            delete shownTalks[talk.title];
        } else {
            var node = drawTalk(talk);

            // If talk is already displayed, update it, else, append it:
            if(shown)
                talkDiv.replaceChild(node, shown);
            else
                talkDiv.appendChild(node);

            //Finally, add the updated/appended talk to the tracking array
            shownTalks[talk.title] = node;
        }
    });
}

function instantiateTemplate(name, values){
    function instantiateText(text){
        // In STRING.replace, the second parameter of the callback, i.e. the
        // 'name' variable here is used to reflect the groups in the regular
        // expression, similar to $0, $1...
        // So here, it reflects the group (\w+) and therefore
        // it would be the string value of {{whatever}}
        return text.replace(/\{\{(\w+)\}\}/g, function(_, name){
            return values[name];
        });
    }
    
    function instantiate(node){
        
        switch(node.nodeType){
            // For populating the content of text nodes within the template
            case document.TEXT_NODE:
                return document.createTextNode(instantiateText(node.nodeValue));

            // If the node is of type Element, clones it, and then recursively
            // builds copies of the child elements and so forth, essentially
            // reconstructing the parent i.e. child node of #template     
            case document.ELEMENT_NODE:
                if(node.hasAttribute("template-repeat") && node.className != name){
                    var collectionName = node.getAttribute("template-repeat");
                    var copy = node.cloneNode();
                    values[collectionName].forEach(function(comment){
                        copy.appendChild(instantiateTemplate("comment", comment));
                    });
                    return copy;
                } else {
                    var copy = node.cloneNode();
                    for(var i = 0; i < node.childNodes.length; i++)
                        copy.appendChild(instantiate(node.childNodes[i]));
                    // if (copy.childNodes[1] && copy.className && copy.childNodes[1].className == copy.className)
                    //     return copy.childNodes[1];
                    return copy;
                }
                
            // In the case that the node is neither a TEXT_NODE, nor an
            // ELEMENT_NODE. Comments or Attributes. 
            default:
                return node;
        }
    }

    // What 'instantiateTemplate' actually does:
    var template = document.querySelector("#template ." + name);
    return instantiate(template);
}

function drawTalk(talk){
    var node = instantiateTemplate("talk", talk);
    // var comments = node.querySelector(".comments");

    // talk.comments.forEach(function(comment){
    //     comments.appendChild(instantiateTemplate("comment", comment));
    // });

    node.querySelector("button.del").addEventListener("click", deleteTalk.bind(null, talk.title));

    var form = node.querySelector("form");
    form.addEventListener("submit", function(event){
        event.preventDefault();
        addComment(talk.title, form.elements.comment.value);
        form.reset();
    });

    return node;
}

function talkURL(title){ return "talks/" + encodeURIComponent(title);}

function deleteTalk(title){
    request({pathname:talkURL(title), method:"DELETE"}, reportError);
}

function addComment(title, comment){
    var comment = {author: nameField.value, message: comment};
    localStorage.removeItem("comment");

    request({
        pathname: talkURL(title) + "/comments",
        body: JSON.stringify(comment),
        method: "POST"
        },
        reportError);
}

var nameField = document.querySelector("#name");
nameField.value = localStorage.getItem("name") || "";
nameField.addEventListener("change", function(){
    localStorage.setItem("name", nameField.value);
});


//For the comments to stay stored in case of refresh
talkDiv.addEventListener("input", function(event){
    if(event.target.name == "comment"){
        localStorage.setItem("comment", event.target.value);
    }
});

var talkForm = document.querySelector("#newtalk");
talkForm.addEventListener("submit", function(event){
    event.preventDefault();
    request(
        {
            pathname: talkURL(talkForm.elements.title.value),
            method: "PUT",
            body: JSON.stringify({
                presenter: nameField.value,
                summary: talkForm.elements.summary.value
            })
        },
        reportError
    );

    talkForm.reset();
});

function waitForChanges(){
    request({pathname: "talks?changesSince=" + lastServerTime},
            function(error, response){
                if(error){
                    setTimeout(waitForChanges, 2500);
                    console.error(error.stack);
                } else {
                    response = JSON.parse(response);
                    displayTalks(response.talks);

                    var commentField = document.querySelector("input[name=comment]");
                    var comment = localStorage.getItem("comment");
                    if(comment){
                        commentField.value = comment;
                        commentField.focus();
                    }
                    
                    lastServerTime = response.serverTime;
                    waitForChanges();
                }
    });
}

// The initial request displays the talks it receives on the screen
// and starts the long-polling process by calling waitForChanges.
var lastServerTime = 0;
request({pathname: "talks"}, function(error, response){
    if(error)
        reportError(error);
    else{
        response = JSON.parse(response);
        displayTalks(response.talks);
        localStorage.removeItem("comment");
        lastServerTime = response.serverTime;
        waitForChanges();
    }
});