require('dotenv').config();

// ===== INIT STEPS
const fs = require('fs');
const path = require('path');

const express = require('express');
const cookieParser = require('cookie-parser');

const Database = require("better-sqlite3");
const session = require("express-session");
const passport = require('passport');

fs.mkdirSync('store', { recursive: true });

// ===== ENVIRONMENT

const PORT = process.env.PORT || 8080;
const COOKIE_SECRET = process.env.COOKIE_SECRET || 'SET_THIS_VALUE_IN_DOTENV';

// ===== EXPRESS SETUP

const app = express();
app.use(cookieParser(COOKIE_SECRET));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'public', 'views'));

app.disable('x-powered-by');

// ===== PASSPORT SETUP

const SqliteStore = require("better-sqlite3-session-store")(session)
const db = new Database("store/sessions.db");

app.use(
    session({
        store: new SqliteStore({
            client: db, 
            expired: {
                clear: true,
                intervalMs: 900000 // 15m
            }
        }),
        secret: COOKIE_SECRET,
        resave: true,
        saveUninitialized: true,
        name: 'cdn-session-token',
    })
)

app.use(passport.initialize());
app.use(passport.authenticate('session'));

// ===== ROUTES

app.use('/static/css', express.static(path.join(__dirname, 'public', 'css')));
app.use('/static/js', express.static(path.join(__dirname, 'public', 'js')));

const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const dashboardRouter = require('./routes/dashboard');

app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/dashboard', dashboardRouter);

// ===== ERROR HANDLING

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// ===== START SERVER

app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
})