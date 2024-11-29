const fs = require('fs');
const path = require('path');
const process = require('process');
const crypto = require('crypto');

const express = require('express');
const multer = require('multer');
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    message: '429 - Inhumane upload speed. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false
});

const sql = require('../util/sql');

function hashFile(path) {
    if (!fs.existsSync(path)) {
        throw new Error('File does not exist.');
    }

    const hash = crypto.createHash('sha256');
    const input = fs.readFileSync(path);
    hash.update(input);
    return hash.digest('hex');
}

function sanitizeFilename(filename) {
    return filename.replace(/[^a-zA-Z0-9_.-]/g, '_');
}

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

router.post('/upload/single', limiter, async (req, res) => {
    multer({ 
        storage: multer.diskStorage({
            destination: path.join(process.cwd(), 'uploads'),
            filename: (req, file, cb) => {
                cb(null, `${req.user.id}-${Date.now()}-${sanitizeFilename(file.originalname)}`);
            },
        }),
        limits: {
            fileSize: 50 * 1024 * 1024, // Enforce 50MB default
            files: 1
        },
        fileFilter: (_, file, cb) => {   
            if (!file) {
                return cb(new Error('No file uploaded.'), false);
            }
    
            cb(null, true);
        }
    }).single('file')(req, res, async function(err) {
        if (err) {
            return res.status(400).json({ success: false, message: err.message });
        }

        const file = req.file;

        const userId = req.user.id;
        const originalName = file.originalname;
        const fileSize = fs.statSync(file.path).size;
        const fileHash = hashFile(file.path);

        db.insertFile(userId, originalName, file.path, fileSize, fileHash);

        res.json({ success: true, url: `/content/${userId}/${originalName}?h=${fileHash}` });
    }); 
});

router.post('/upload/chunk', async (req, res) => {
    multer({ 
        storage: multer.diskStorage({
            destination: path.join(process.cwd(), 'uploads', 'chunks', req.user.id.toString()),
            filename: (req, _, cb) => {
                if (req.query.id == null) {
                    return cb(new Error('Missing id.'), null);
                }

                cb(null, `${req.query.id}-${Date.now()}.part`);
            },
        }),
        limits: {
            fileSize: 10 * 1024 * 1024, // Enforce 10MB default
            files: 1
        },
        fileFilter: (_, file, cb) => {
            if (!file) {
                return cb(new Error('No file uploaded.'), false);
            }

            const { id, filename, currentChunk: ccStr, totalChunks: tcStr } = req.query;

            if (!filename || !id) {
                return cb(new Error('Missing parameters.'), false);
            }

            const currentChunk = parseInt(ccStr);
            const totalChunks = parseInt(tcStr);

            if (isNaN(currentChunk) || isNaN(totalChunks)) {
                return cb(new Error('Invalid chunk number.'), false);
            }

            if (currentChunk > totalChunks) {
                return cb(new Error(`Invalid chunk number. Got ${currentChunk} > ${totalChunks}.`), false);
            }
    
            cb(null, true);
        }
    }).single('file')(req, res, async function(err) {
        if (err) {
            console.error(err);
            return res.status(400).json({ success: false, message: err.message });
        }

        const { id, filename: suggestedFilename, currentChunk: ccStr, totalChunks: tcStr } = req.query;

        const filename = sanitizeFilename(suggestedFilename);
        const currentChunk = parseInt(ccStr);
        const totalChunks = parseInt(tcStr);

        if (currentChunk == totalChunks) {
            const chunkPaths = fs.readdirSync(path.join(process.cwd(), 'uploads', 'chunks', req.user.id.toString())).filter(f => f.startsWith(`${id}-`)).sort();

            if (chunkPaths.length !== totalChunks) {
                return res.status(500).json({ success: false, message: 'Missing chunks..??', got: chunkPaths.length, expected: totalChunks });
            }

            const name = `${req.user.id}-${Date.now()}-${filename}`;

            const fileStream = fs.createWriteStream(path.join(process.cwd(), 'uploads', name));

            for (const chunkPath of chunkPaths) {
                fileStream.write(fs.readFileSync(path.join(process.cwd(), 'uploads', 'chunks', req.user.id.toString(), chunkPath)));
                fs.unlinkSync(path.join(process.cwd(), 'uploads', 'chunks', req.user.id.toString(), chunkPath));
            }

            await new Promise((resolve, _) => {
                fileStream.end(resolve);
            })

            const filePath = path.join(process.cwd(), 'uploads', name);
            const fileHash = hashFile(filePath);
            const size = fs.statSync(filePath).size;
            
            db.insertFile(req.user.id, filename, filePath, size, fileHash);

            return res.json({ success: true, url: `/content/${req.user.id}/${filename}?h=${fileHash}` });
        }

        res.json({ success: true, next: currentChunk + 1 });
    }); 
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