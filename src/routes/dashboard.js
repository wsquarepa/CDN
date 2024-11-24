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
    const files = sql.getFilesByUserId(req.user.id)

    res.render('dashboard', { user: req.user, files });
})

router.post('/upload', upload.single('file'), async function(req, res) {
    const file = req.file;

    const hash = crypto.createHash('sha256');
    const input = fs.readFileSync(file.path);
    hash.update(input);
    const fileHash = hash.digest('hex');

    const userId = req.user.id;

    const fileSize = fs.statSync(file.path).size;

    db.insertFile(userId, file.originalname, file.path, fileSize, fileHash);

    res.json({ success: true, url: `/content/${userId}/${file.originalname}?h=${fileHash}` });
})

router.post('/delete', function(req, res) {
    const { filename } = req.body;

    const file = sql.getFile(req.user.id, filename);

    if (!file) {
        res.status(404).send('File not found.');
        return
    }

    fs.unlinkSync(file.filepath);
    db.deleteFile(req.user.id, file.id);

    res.json({ success: true });
});

module.exports = router;