(function(root) {

  "use strict";


// Base function.
var Route = function(data) {
    //set defaults
    var
        path = 'ajax',
        extension = '.html',
        defaultRoute = {
            name : 'index',
            node : undefined,
            callback : function(){
                //an empty function;
            }
        };


    this.path = data.hasOwnProperty('path') ? data.path : path;
    this.extension = data.hasOwnProperty('extension') ? data.extension : extension;
    this.routes = data.hasOwnProperty('routes') ? data.routes : {};
    //check to see if there is a default route, we have to have one
    if(!this.routes.hasOwnProperty('default')){
        this.routes.default = defaultRoute;
    }
    this._404 = this.routes.hasOwnProperty("_404") ? true : false;
    //resolve to default, or _404 if it's defined, or whatever the user wants it to be.
    this.resolve = data.hasOwnProperty('resolve') ? data.resolve : (this._404 ? data.routes._404 : data.routes.default);


    //an empty state object for now. We'll manipulate this within url changes.
    this.stateObject = {
        page : ""
    };
    //currentRoute, holds a route object
    this.currentRoute = {};
    //if the browser supports history API use it.
    this.historyAPIsupport = !!(root.history && root.history.pushState);
    //capture chars after a hash character.
    this.captureHash = /#(.*)/;

    this.init();
};

Route.prototype.init = function(){
    var that = this;
    if(this.historyAPIsupport){
        root.onpopstate = function(){
            var route = that.getRoute();
            if( route.name !== that.currentRoute.name ){
                that.setRoute(route);
            }
        };
    }


    root.onhashchange = function(){
        var route = that.getRoute();
        if( route.name !== that.currentRoute.name ){
            that.setRoute(route);
        }else{
            root.location.hash = "";
        }
    };

    //if the page is being loaded for the first time
    root.onload = function(){

        //so we don't go overriding anything
        if(root.document.body.getAttribute('id') === null && that.routes.default.name === "body"){
            root.document.body.id = "body";
        }else if(root.document.body.getAttribute('if') !== null && that.routes.default.name === "body"){
            that.routes.default.name = root.document.body.id;
        }

        var route = that.getRoute();
        that.setRoute(route);
    };

};
Route.prototype.getRoute = function(){
    var route,
        pathArray = root.location.pathname.split('/'),
        lastPath = pathArray[pathArray.length-1],
        hash = root.location.hash,
        isHash = true;

    //first check if there is a hash, which is one way to navigate
    if( hash !== ""){
        route = this.captureHash.exec(hash)[1];
    }else{
        //there is no hash, so either the page is being loaded for the first time, or a popstate was fired
        isHash = false;
        //first check to see if we're at the root, if so the route should goto the default
        if(lastPath === ""){
            route = "default";
        }else{
            route = lastPath;

        }
    }
    if(this.routes.hasOwnProperty(route) ){
        route = this.routes[route];
    }
    //the route doesn't exist, but it's an anchor. We want to keep default anchors to keep default functionality.
    else if(isHash){
        route = {
            anchor : true
        };
    }else{
        route = this.resolve;
    }
    return route;
};
Route.prototype.setRoute = function(route){
    //the route doesn't exist but is an anchor.
    if(route.hasOwnProperty('anchor')){
        return;
    }
    //no validation occurs, as this shouldn't be used without getRoute()
    this.currentRoute = route;
    this.stateObject.route = this.currentRoute.name;

    //push the history
    if(this.historyAPIsupport){
        root.history.replaceState(this.stateObject, this.currentRoute.name, this.currentRoute.name);
    }else{
        root.location = "#"+this.currentRoute.name;
    }

    this.getPage(this.currentRoute);
};

Route.prototype.getPage = function(route){
    var xmlhttp = new root.XMLHttpRequest(),
        that = this,
        target = this.path + "/" + this.currentRoute.name + this.extension;


    xmlhttp.onreadystatechange = function(){
        var nodeId = "", //where we'll be attaching the content
            responseBody = "";
        if(xmlhttp.readyState == 4 && xmlhttp.status == 200){
            if(typeof route.node == "undefined"){
                //the node is undefined, so we'll check the ajax response to see if it defines an outer node
                // this is a pretty weak fallback, and more of an alternative functionality... the node should be defined
                // in the route object, but doesn't have to be.
                var _node = root.document.createElement('div');
                _node.innerHTML = xmlhttp.responseText;
                var id = _node.childNodes[0].getAttribute('id');

                //id was not found
                if(id === null ){
                    console.error(that.currentRoute.name, "does not have a node to attach to. Redirecting to default.");
                    that.setRoute(that.routes['default']);
                    return;
                }

                nodeId = id;
                responseBody = _node.childNodes[0].innerHTML;
            }else{
                nodeId = route.node;
                responseBody = xmlhttp.responseText;
            }

            //no such node exists in the document to bind to...
            if(root.document.getElementById(nodeId) === null){
                console.error("Cannot find", nodeId, "for", that.currentRoute.name,". Redirecting to default");
                that.setRoute(that.routes['default']);
                return;
            }

            //otherwise, set the node
            root.document.getElementById(nodeId).innerHTML = responseBody;
            //and fire the callback
            that.currentRoute.callback();
        }else{
            if(xmlhttp.status == 404){
                //uh oh, not found
                that.setRoute(that.resolve);
            }
        }
    };

    xmlhttp.open("GET", target);
    xmlhttp.send(null);

};
root.Route = Route;

}(this));
