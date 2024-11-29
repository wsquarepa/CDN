const fs = require('fs');
const crypto = require('crypto');
const mime = require('mime-types');

const express = require('express');
const rateLimit = require('express-rate-limit');

const sql = require('../util/sql');

const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 1000,
    message: '429 - Too many requests. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false
});

const router = express.Router();

router.get('/:userId/:filename', limiter, function(req, res) {
    const { userId, filename } = req.params;
    const queryHash = req.query.h;

    const file = sql.getFile(userId, filename);

    if (!file) {
        res.status(404).send('File not found.');
        return;
    }

    const hash = file.hash;

    if (!crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(queryHash))) {
        res.status(400).send('Invalid hash.');
        return;
    }
    
    res.header('Content-Type', mime.lookup(file.filepath)); 
    res.header('Content-Length', file.filesize);
    res.send(fs.readFileSync(file.filepath));
});

module.exports = router;