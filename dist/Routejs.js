(function(root) {

  "use strict";


/* Routejs main */

// Base function.
var Route = function(data) {
    //set defaults
    var
        path = '/ajax',
        extension = '.html',
        routes = {
            default : {
                name : 'index',
                node : undefined,
                callback : function(){
                    //an empty function;
                }
            }
        };

    this.path = data.hasOwnProperty('path') ? data.path : path;
    this.extension = data.hasOwnProperty('extension') ? data.extension : extension;
    this.routes = data.hasOwnProperty('routes') ? data.routes : routes;
    //an empty state object for now. We'll manipulate this within url changes.
    this.stateObject = {
        route : ""
    };
    //currentRoute, holds a route object
    this.currentRoute = {};
    //if the browser supports history API use it, else fall back to hashbangs
    this.historyAPIsupport = !!(root.history && root.history.pushState);

    //regex expressions for hashbang fallback
    //the hash begins with a hash and is followed by any character
    this.isHash = /^#.*/;
    //capture chars after a hash character.
    this.captureHash = /#(.*)/;

    this.init();
};

Route.prototype.init = function(){
    var that = this;
    if(this.historyAPIsupport){
        root.onpopstate = function(e){
            e.preventDefault();
            if( that.routes.hasOwnProperty(that.currentRoute) ){
                that.getPage(that.currentRoute);
            }else{
                that.setRoute( that.routes['default'] );
            }
        };
    }else{
        root.hashchange = function(e){
            e.preventDefault();
            if( that.routes.hasOwnProperty(that.currentRoute) ){
                that.getpage(that.currentRoute);
            }else{
                that.setRoute( that.routes['default'] );
            }
        };
    }
};

Route.prototype.setRoute = function(route){
    this.currentRoute = route;
    this.stateObject.route = this.currentRoute.name;
    if(this.historyAPIsupport){
        root.history.pushState(this.stateObject, this.currentRoute.name, this.currentRoute.name);
    }else{
        root.location = "#"+this.currentRoute.name;
    }
};


Route.prototype.getPage = function(route){
    var xmlhttp = new root.XMLHttpRequest(),
        that = this;

    xmlhttp.open("GET", this.path + "/" + this.currentRoute.name + this.extension);
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
        }
    };
    xmlhttp.send();

};


// Export to the root, which is probably `window`.
root.Route = Route;


}(this));
