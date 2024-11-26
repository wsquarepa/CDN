const fs = require('fs');
const path = require('path');
const process = require('process');
const crypto = require('crypto');

const express = require('express');
const multer = require('multer');

const sql = require('../util/sql');

if (!fs.existsSync(path.join(process.cwd(), 'uploads', 'chunks'))) {
    fs.mkdirSync(path.join(process.cwd(), 'uploads', 'chunks'), { recursive: true });
}

const storage = multer.diskStorage({
    destination: path.join(process.cwd(), 'uploads'),
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const upload = multer({ 
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // Enforce 50MB default
    }
});

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

router.post("/upload/chunk", upload.single('file'), async function(req, res) {
    const { filename, currentChunk, totalChunks } = req.body;

    if (!filename || !currentChunk || !totalChunks) {
        res.status(400).send('Missing parameters.');
        return;
    }

    if (!filename.match(/^[a-zA-Z0-9_.-]+$/)) {
        res.status(400).send('Invalid filename.');
        return;
    }

    const file = req.file;
    fs.renameSync(file.path, path.join(process.cwd(), 'uploads', 'chunks', `${filename}.${currentChunk}.part`));

    if (currentChunk == totalChunks) {
        const chunkPaths = fs.readdirSync(path.join(process.cwd(), 'uploads', 'chunks')).filter(f => f.startsWith(filename)).sort();

        const fsName = `${Date.now()}-${filename}`

        const fileStream = fs.createWriteStream(path.join(process.cwd(), 'uploads', fsName));

        for (const chunkPath of chunkPaths) {
            fileStream.write(fs.readFileSync(path.join(process.cwd(), 'uploads', 'chunks', chunkPath)));
            fs.unlinkSync(path.join(process.cwd(), 'uploads', 'chunks', chunkPath));
        }

        await new Promise((resolve, reject) => {
            fileStream.end(resolve);
        })

        const hash = crypto.createHash('sha256');
        const input = fs.readFileSync(path.join(process.cwd(), 'uploads', fsName));
        hash.update(input);
        const fileHash = hash.digest('hex');

        const filePath = path.join(process.cwd(), 'uploads', fsName);
        const size = fs.statSync(filePath).size;
        
        db.insertFile(req.user.id, filename, filePath, size, fileHash);

        return res.json({ success: true, url: `/content/${req.user.id}/${filename}?h=${fileHash}` });
    }

    res.json({ success: true, next: currentChunk + 1 });
});

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