var api = (function() {
    "use strict";

    function send(method, url, data, callback) {
        var xhr = new XMLHttpRequest();
        xhr.onload = function() {
            if (xhr.status !== 200) callback("[" + xhr.status + "]" + xhr.responseText, null);
            else callback(null, JSON.parse(xhr.responseText));
        };
        xhr.open(method, url, true);
        if (!data) xhr.send();
        else{
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(JSON.stringify(data));
        }
    }


    var module = {};
    
    /*  ******* Data types *******
        image objects must have at least the following attributes:
            - (String) _id 
            - (String) title
            - (String) author
            - (Date) date
    
        comment objects must have the following attributes
            - (String) _id
            - (String) imageId
            - (String) author
            - (String) content
            - (Date) date
    
    ****************************** */

    module.getCurrentUser = function() {
        var l = document.cookie.split("username=");
        if (l.length > 1) return l[1];
        return null;
    };

    module.signup = function(username, password, callback) {
        send("POST", "/api/user/signup/", {username: username, password: password}, callback);
    };
    
    module.signin = function(username, password, callback) {
        send("POST", "/api/user/signin/", {username: username, password: password}, callback);
    };
    
    // get all usernames (no pagination)
    module.getUsernames = function(callback) {
        send("GET", "/api/user/", null, callback);
    };

    // get all usernames (with pagination)
    module.getPagedUsernames = function(page, callback) {
        send("GET", "/api/user/gallery/?page=" + page, null, callback);
    };
    
    // add an image to the gallery
    module.addImage = function(title, file, callback) {
        send("POST", "/api/image/", {title: title, file: file}, callback);
    };
    
    // delete an image from the gallery given its imageId
    module.deleteImage = function(imageId, callback) {
        send("DELETE", "/api/image/" + imageId + "/", null, callback);
    };
    
    // get an image from the gallery given its imageId
    module.getImage = function(imageId, callback) {
        send("GET", "/api/image/" + imageId + "/", null, callback);
    };

    // get the image file
    module.getImageFile = function(imageId, callback) {
        send("GET", "/api/image/" + imageId + "/image/", null, callback);
    };
    
    // get all imageIds for a given username's gallery (no pagination)
    module.getAllImageIds = function(username, callback) {
        send("GET", "/api/user/" + username + "/", null, callback);
    };
    
    // add a comment to an image
    module.addComment = function(imageId, content, callback) {
        send("POST", "/api/comment/", {imageId: imageId, content: content}, callback);
    };
    
    // delete a comment to an image
    module.deleteComment = function(commentId, callback) {
        send("DELETE", "/api/comment/" + commentId + "/", null, callback);
    };

    // delete all comment to an image
    module.deleteComments = function(imageId, callback) {
        send("DELETE", "/api/comment/all/" + imageId + "/", null, callback);
    };
    
    // get comments (with pagination)
    module.getComments = function(imageId, page, callback) {
        send("GET", "/api/comment/" + imageId + "/?page=" + page, null, callback);
    };
    
    return module;
})();
