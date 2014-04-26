#RouteJs

A bare bones, no nonsense javascript router.

##How it works

Depends on some sort of server file to rewrite links so it can work with `history.pushState()`

I found this to be particularly useful for Apache:

        # html5 pushstate (history) support:
        <ifModule mod_rewrite.c>
            RewriteEngine On
            RewriteCond %{REQUEST_FILENAME} !-f
            RewriteCond %{REQUEST_FILENAME} !-d
            RewriteCond %{REQUEST_URI} !index
            RewriteRule (.*) index.html [L]
        </ifModule>

From Joss Crowcroft's blog post,
[HTML5 History / pushState URLs, .htaccess and You](http://www.josscrowcroft.com/2012/code/htaccess-for-html5-history-pushstate-url-routing/)


For same-page ajax requests, use hashes, as such:

`somedomain.com/home#about`

makes use of push state to be written as such:

`somedomain.com/about`

and will fallback to:

`somedomain.com/#about`

##How to use it:


        new Route({
            routes:{
                default:{
                    name: "home",
                    node: "ajax-content",
                    callback: function(){

                    }
                },
                anotherRoute:{
                    name: "about",
                    node: "ajax-content",
                    callback: seperateFunc
                },
                home:{
                    name: "home",
                    node: "ajax-content",
                    callback: function(){

                    }
                },
                _404:{
                    name: "404",
                    node: "body",
                    callback: function(){};
                }
            },
            resolve: "_404",
            path: 'path/to/ajax/content',
            extension: '.whateveryourcontentis',


        });



As of now, XHR responseText is placed in the route node.

### route objects

 + name
    + the name of the route, the url name.
 + node *
    + the id of the node in the DOM that the responseText will be placed into.
 + callback
    + a function that gets fired when the responseText returns and is loaded into the DOM

*note: `node` does not have to be defined here, but it's suggested for your own sanity that it is. The alternative is
to include a wrapper in the ajax file where the node will be defined as such:

        <div id="ajax-content">
            <h1>this is content that gets loaded.</h1>
        </div

When the previous file is requested without a node definition, RouteJs looks for a node with the id "ajax-content",
 and refreshes it with the content of the child nodes.

**Don't use both a node definition and a node wrapper at the same time.**

#### Default

 If you do not supply a default router, a default will be provided as follows:

        defaultRoute = {
            name : 'index',
            node : "body",
            callback : function(){
                //an empty function;
            }
         }


### resolve

ex:
        resolve : "_404"

  + the where to go if the user attempts to navigate to a route not defined, or is 404 is returned from server*.
  + defaults to `_404` if present, otherwise `default`.

#### The difference between `resolve` and `default`

Where both can be the same route, `resolve` is used to handle missing pages (i.e. improperly defined routes or
non-existent pages). `default` is used if content is found, but no node exists to place that content.

 For example:

 from the definition about, a user trying to navigate to www.example.com/directions, would get a "page not found".

 now let's say that we added a route as follows:

        contact : {
             name: "contact",
             node: null,
             callback: function(){}
        }

 navigating to www.example.com/contact, would result in redirecting the user to the home page.

### path

  + where your ajax files reside
  + defaults to 'ajax'

### extension

  + Self explanatory, defaults to '.html'

# * On 404 status.

Do to the Apache rewrite rule, no ajax requests (other than index.html) in any given folder will be returned as 404.

This is because Apache is redirecting any links to the index that are not actual files or directories.

Any file you request via ajax that does not exist will return the entire body of original index.html as responseText.

I have not yet found a good way of dealing with this yet, other than ensuring that you do not define routes to files
that do not exist.