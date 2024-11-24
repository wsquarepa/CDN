const fs = require('fs');
const path = require('path');
const process = require('process');
const crypto = require('crypto');

const express = require('express');
const multer = require('multer');

const sql = require('../util/sql');

const storage = multer.diskStorage({
    destination: path.join(process.cwd(), 'uploads'),
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const upload = multer({ storage });

const db = require('../util/sql');

const router = express.Router();

router.use((req, res, next) => { // AUTH CHECK
    if (!req.user) {
        res.redirect('/auth/login');
    } else {
        next();
    }
});

router.get('/', function(req, res) {
    sql.getFilesByUserId(req.user.id).then(files => {
        res.render('dashboard', { user: req.user, files });
    });
})

router.post('/upload', upload.single('file'), async function(req, res) {
    const file = req.file;

    const hash = crypto.createHash('sha256');
    const input = fs.readFileSync(file.path);
    hash.update(input);
    const fileHash = hash.digest('hex');

    const user = req.user;
    const userId = user.id;

    const fileSize = fs.statSync(file.path).size;

    db.insertFile(userId, file.originalname, file.path, fileSize, fileHash);

    res.json({ success: true, url: `/content/${file.filename}?h=${fileHash}` });
})

module.exports = router;