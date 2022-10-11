//jshint esversion:6
require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const lib = require("./library/library.js");
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { sameSite: 'strict' }
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.MONGOOSE);

const userSchema = new mongoose.Schema({
    name: String,
    username: String,
    password: String
});

const diarySchema = new mongoose.Schema({
    username: String,
    title: String,
    date: String,
    body: String
})

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);
const Diary = new mongoose.model("Diary", diarySchema);
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function (req, res) {
    res.render('welcome');
});

app.get("/content", function (req, res) {
    if (req.isAuthenticated()) {
        loggedUser = req.session.passport.user
        Diary.find({ username: loggedUser }, function (err, foundData) {
            if (err) {
                console.log(err);
            } else {
                if (foundData) {
                    for (let x in foundData) {
                        foundData[x].body = lib.cryptoDecrypt(foundData[x].body)
                    }
                    res.render("content", { dData: foundData, username: loggedUser });
                }
            }
        });
    } else {
        res.redirect('/')
    }
});

app.get("/compose", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("compose");
    } else {
        res.redirect('/')
    }
});

app.get("/logout", function (req, res) {
    req.logout(function () { });
    res.redirect('/')
});

app.get("/:path*", function (req, res) {
    res.render('404')
});

app.post("/register", function (req, res) {
    User.register({ username: req.body.username }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.json({ ok: false });
        }
        else {
            User.updateOne({ username: req.body.username }, { $set: { name: req.body.name } }, function (err) {
                if (err) {
                    console.log(err);
                }
            });
            passport.authenticate('local')(req, res, function () {
                res.json({ ok: true });
            })
        }
    });
});

app.post("/login",
    passport.authenticate("local"), function (req, res) {
        const user = new User({
            username: req.body.username,
            password: req.body.password
        });
        req.login(user, function (err) {
            if (err) {
                console.log(err);
                res.json({ ok: false });
            } else {
                res.json({ ok: true });
            }
        });
    });

app.post("/compose", function (req, res) {
    if (req.isAuthenticated()) {
        const newDiary = new Diary({
            username: req.session.passport.user,
            title: req.body.title,
            date: lib.dateNow(),
            body: lib.cryptoEncrypt(req.body.main)
        });
        newDiary.save(function (err) {
            if (err) {
                console.log(err);
            }
            else {
                res.redirect("/content");
            }
        })

    } else {
        res.redirect('/')
    }
});
app.post("/delete", function (req, res) {
    Diary.deleteOne({ _id: req.body.id }, function (err) {
        if (!err) {
            res.json({ ok: true })
        }
        else {
            console.log(err);
            res.json({ ok: false })
        }
    });
});

app.listen(process.env.PORT || 3000, function () {
    console.log("Server running in port 3000");
});
