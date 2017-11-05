var express = require("express");
var bodyParser = require("body-parser");
var jwt = require("jsonwebtoken");
var cors = require("cors");
var Datastore = require("nedb");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const SECRET_KEY = "secret";

var db = {
    users: new Datastore({ filename: 'db/users.db', autoload: true }),
    products: new Datastore({ filename: 'db/products.db', autoload: true })
};

// app.all('*', function(req, res, next) {
//     res.header("Access-Control-Allow-Origin", "*");
//     res.header("Access-Control-Allow-Headers", "X-Requested-With");
//     res.header('Access-Control-Allow-Headers', 'Content-Type');
//     next();
// });

app.get("/initilize", function(req, res) {
    db.users.insert([
        { name: "indresh", password: "12345", role: "user" },
        { name: "admin", password: "admin", role: "admin" }
    ], function(err, newdoc) {});

    db.users.find({}, function(err, docs) {
        res.json(docs);
    });
});

app.post("/login", function(req, res) {
    const body = req.body;

    if (body) {
        db.users.findOne(body, function(err, doc) {
            var json;
            console.log(doc);
            if (err) {
                json = { status: false, error: err };
            } else if (!doc || !doc.name) {
                json = { status: false, error: "Not a valid username or password" };
            } else if (doc && doc.name) {
                const data = { name: doc.name, role: doc.role };
                const token = jwt.sign(data, SECRET_KEY);
                json = { status: true, token: token, data: data };
            }

            res.json(json);
        });
    }

});

function ensureToken(req, res, next) {
    const bearerHeader = req.headers["authorization"];
    if (typeof bearerHeader != 'undefined') {
        const bearer = bearerHeader.split(" ");
        const bearerToken = bearer[1];
        req.token = bearerToken;
        next();
    } else {
        res.sendStatus(403);
    }
}

function verifyJWT(req, res, next) {
    jwt.verify(req.token, SECRET_KEY, function(err, data) {
        if (err) {
            console.log(err);
            res.sendStatus(403);
        } else {
            req.tokenData = data;
            next();
        }

    });
}

app.get("/protected", ensureToken, verifyJWT, function(req, res) {
    res.json({
        data: req.tokenData
    });
});

app.get("/checklogin", ensureToken, verifyJWT, function(req, res) {

    res.json({
        data: req.tokenData,
        status: true
    });
});


app.listen(3000, function() {
    console.log("Application running at localhost:3000");
})