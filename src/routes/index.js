const express = require('express');

const router = express.Router();

router.get('/', function(req, res) {
    if (req.user) {
        res.redirect('/dashboard');
        return;
    }

    res.render('index');
});

module.exports = router;