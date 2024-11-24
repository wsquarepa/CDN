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

router.use((req, res, next) => { // AUTH CHECK
    if (req.user) {
        res.redirect('/dashboard');
    } else {
        next();
    }
});

router.get('/login', function(req, res, next) {
    res.render('login', { error: req.session.messages?.[0] });
    req.session.messages = [];
    req.session.save();
});

router.post('/login/password', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/auth/login', failureMessage: true
}));

module.exports = router;