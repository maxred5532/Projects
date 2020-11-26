// Changed const to var. Reason: 'const' is available in ES6 (use 'esversion: 6')
var path = require('path');
var express = require('express');
var fs = require('fs');
var app = express();

var crypto = require('crypto');
var cookie = require('cookie');
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static('frontend'));

var session = require('express-session');
app.use(session({
    secret: 'b512-51351d9a146d',
    resave: false,
    saveUninitialized: true
}));

app.use(function (req, res, next){
    console.log("HTTP request", req.method, req.url, req.body);
    next();
});

function generateSalt() {
    return crypto.randomBytes(16).toString('base64');
}

function generateHash (password, salt) {
    var hash = crypto.createHmac('sha512', salt);
    hash.update(password);
    return hash.digest('base64');
}

app.use(function(req, res, next) {
    req.user = ('user' in req.session) ? req.session.user : null;
    next();
});

app.use(function (req, res, next) {
    req.username = req.session.username ? req.session.username : null;
    console.log("HTTP request", req.username, req.method, req.url, req.body);
    next();
});

var isAuthenticated = function(req, res, next) {
    if (!req.username) return res.status(401).end("access denied");
    next();
};


var Datastore = require('nedb'),
    users = new Datastore({ filename: 'db/users.db', autoload: true, timestampData : true}),
    images = new Datastore({ filename: 'db/images.db', autoload: true, timestampData : true}),
    comments = new Datastore({ filename: 'db/comments.db', autoload: true, timestampData : true});


// Create

// User sign up
app.post('/api/user/signup/', function (req, res, next) {
    var username = req.body.username;
    var password = req.body.password;
    var salt = generateSalt();
    var hash = generateHash(password, salt);
    users.findOne({_id: username}, function(err, user){
        if (err) return res.status(500).end(err);
        if (user) return res.status(409).end("username " + username + " already exists");
        users.update({_id: username},{_id: username, password: hash, salt: salt}, {upsert: true}, function(err) {
            if (err) return res.status(500).end(err);
            // initialize cookie
            res.setHeader('Set-Cookie', cookie.serialize('username', username, {
                path : '/',
                maxAge: 60 * 60 * 24 * 7
            }));
            req.session.username = username;
            return res.json("user " + username + " signed up");
        });
    });
});

// User logs in
app.post('/api/user/signin/', function (req, res, next) {
    console.log("User signing in!");
    var username = req.body.username;
    var password = req.body.password;

    // retrieve user from the database
    users.findOne({_id: username}, function(err, user){
        if (err) return res.status(500).end(err);
        if (!user) return res.status(401).end("user does not exist");
        if (user.password !== generateHash(password, user.salt)) return res.status(401).end("incorrect password");
        // initialize cookie
        res.setHeader('Set-Cookie', cookie.serialize('username', username, {
            path : '/',
            maxAge: 60 * 60 * 24 * 7
        }));
        req.session.username = username;
        return res.json("user " + username + " signed in");
    });
});

var multer  = require('multer');
var upload = multer({ dest: 'uploads/' });
app.post('/api/image/', upload.single('file'), isAuthenticated, function (req, res, next) {
    // Check if someone already exists with this username
    // console.log(req.body.title, req.body.author, req.file);
    var newImage = {
        title: req.body.title,
        author: req.username,
        url: req.file
    };

    images.insert(newImage, function(err, doc) {
        return res.redirect('/');
    });
});

app.post('/api/comment/', isAuthenticated, function(req, res, next) {
    var newComment = {
        imageId: req.body.imageId,
        author: req.username,
        content: req.body.content
    };

    comments.insert(newComment, function(err, doc) {
        return res.json(doc);
    });
});


// Read

// Logout
app.get('/logout/', function(req, res, next) {
    res.setHeader('Set-Cookie', cookie.serialize('username', '', {
        path : '/',
        maxAge: 60 * 60 * 24 * 7 // 1 week in number of seconds
    }));
    req.session.destroy();
    res.redirect('/');
});

app.get('/api/user/', isAuthenticated, function(req, res, next) {
    var userList = [];
    users.find({}).sort({_id:1}).exec(function(err, data) {
        for (var i = 0; i < data.length; i++) {
            userList.push(data[i]._id);
        }
        return res.json(userList);
    });
});

app.get('/api/user/gallery/', isAuthenticated, function(req, res, next) {
    var userList = [];
    users.find({}).sort({_id:1}).skip(req.query.page).limit(10).exec(function(err, data) {
        for (var i = 0; i < data.length; i++) {
            userList.push(data[i]._id);
        }
        return res.json(userList);
    });
});


// Get all images
app.get('/api/user/:user/', isAuthenticated, function(req, res, next) {
    var imagedata = [];
    console.log(req.params.user);
    images.find({ author: req.params.user }).sort({createdAt:-1}).exec(function(err, data) {
        for (var i = 0; i < data.length; i++) {
            imagedata.push(data[i]._id);
        }
        return res.json(imagedata);
    });
});

app.get('/api/image/:id/', isAuthenticated, function(req, res, next) {
    images.findOne({ _id: req.params.id }, function (err, image) {
        // DNE
        if (image === null) {
            return res.status(404).end('Image ' + req.params.id + ' does not exists');
        } else {
            return res.json(image);
        }
    });
});


app.get('/api/image/:id/image/', isAuthenticated, function(req, res, next) {
    images.findOne({ _id: req.params.id }, function (err, image) {
        // DNE
        if (image === null) {
            return res.status(404).end('Image ' + req.params.id + ' does not exists');
        } else {
            var imageFile = image.url;
            res.set('Content-Type', imageFile.mimetype);
            // Get the absolute path on the machine so it can be displayed
            // and not crash the entire app
            res.sendFile(path.resolve(imageFile.path));
        }
    });
});

app.get('/api/comment/:id/', isAuthenticated, function(req, res, next) {
    comments.find({ imageId: req.params.id }).sort({createdAt:-1}).skip(req.query.page).limit(10).exec(function(err, data) {
        if (data === null) {
            return res.status(404).end('Image ' + req.params.id + ' does not exists');
        } else {
            return res.json(data);
        }
    });
});


// Delete

app.delete('/api/image/:id/', isAuthenticated, function(req, res, next) {
    images.findOne({ _id: req.params.id }, function (err, image) {

        // Check if image id exists
        if (image === null) {
            return res.status(404).end("Image id:" + req.params.id + " does not exists");
        }  else if (image.author !== req.username) {
            return res.status(401).end("access denied");
        } else {
            try {
                // Try to delete it off the disk
                fs.unlink(image.url.path);
                images.remove({ _id: req.params.id  }, {}, function (err, docs) {});
            } catch (e) {
                return res.status(417).end("image can not be deleted: " + e);
            }
        }
        return res.json(image);
    });
});

app.delete('/api/comment/:id/', isAuthenticated, function(req, res, next) {

    comments.findOne({_id: req.params.id}, function (err, comment) {
        images.findOne({_id: comment.imageId}, function (errr, image) {
            // Check if image id exists
            if (comment === null) {
                return res.status(404).end("Comment id:" + req.params.id + " does not exists");
            } else if (comment.author === req.username || image.author === req.username) {
                comments.remove({_id: req.params.id}, {}, function (err, docs) {
                });
            } else {
                return res.status(401).end("you are unauthorized to delete this comment");
            }
            return res.json(comment);
        });
    });

});

app.delete('/api/comment/all/:id/', isAuthenticated, function(req, res, next) {

    comments.findOne({ _id: req.params.id }, function (err, comment) {
        // Check if image id exists
        if (comment === null) {
            return res.status(404).end("Comment id:" + req.params.id + " does not exists");
        } else {
            // remove a single entry
            comments.remove({ _id: req.params.id  }, {}, function (err, docs) {});
        }
        return res.json(comment);
    });
});


var http = require('http');
var PORT = 3000;

http.createServer(app).listen(PORT, function (err) {
    if (err) console.log(err);
    else console.log("HTTP server on http://localhost:%s", PORT);
});
