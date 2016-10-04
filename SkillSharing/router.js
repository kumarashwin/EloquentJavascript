function Router(method, url, handler){
    this.routes = [];
}

Router.prototype.add = function(request, response){
    this.routes.push({
        method: method,
        url: url,
        handler: handler
    });
};

Router.prototype.resolve = function(request, response){
    var path = require("url").parse(request.url).pathname;

    return this.routes.some(function(route){
        var match = route.url.exec(path);
        if(!match || route.method != request.method)
            return false;
        
        // Gives only the ??? in /talks/???
        var urlParts = match.slice(1).map(decodeURIComponent);
        route.handler.apply(null, [request, response].concat(urlParts));
        return true;
    }); 
};

module.exports = Router;