const express = require('express');

const passport = require('passport');
const LocalStrategy = require('passport-local');
const bcrypt = require('bcrypt');

const db = require('../util/sql');

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
        cb(null, { id: user.id, username: user.username });
    });
});
  
passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
        return cb(null, user);
    });
});

passport.use(new LocalStrategy(
    async function(username, password, done) {
        const user = await db.getUserByUsername(username);

        if (!user) {
            return done(null, false, { message: 'Incorrect username and password combination.' });
        }

        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return done(null, false, { message: 'Incorrect username and password combination.' });
        }

        return done(null, user);
    }
));

const router = express.Router();

router.get('/login', function(req, res, next) {
    if (req.user) {
        return res.redirect('/dashboard');
    }

    res.render('login', { error: req.session.messages?.[0] });
    req.session.messages = [];
    req.session.save();
});

router.get('/register', function(req, res) {
    if (req.user) {
        return res.redirect('/dashboard');
    }

    res.render('register', { error: req.session.messages?.[0] });
    req.session.messages = [];
    req.session.save();
});

router.post('/login/password', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/auth/login', failureMessage: true
}));

router.post('/register/password', async function(req, res) {
    if (process.env.DISABLE_REGISTRATION) {
        req.session.messages = ['Registration is disabled.'];
        req.session.save();
        res.redirect('/auth/register');
        return;
    }

    const username = req.body.username;
    const password = req.body.password;

    const user = await db.getUserByUsername(username);

    if (user) {
        req.session.messages = ['Username already exists.'];
        req.session.save();
        res.redirect('/auth/register');
        return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    db.insertUser(username, hashedPassword);

    res.redirect('/auth/login');
});

router.get('/logout', function(req, res) {
    req.logout(() => {
        res.redirect('/');
    });
});

module.exports = router;