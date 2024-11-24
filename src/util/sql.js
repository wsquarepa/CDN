const fs = require('fs');
const path = require('path');
const process = require('process');

const Database = require('better-sqlite3');

const db = new Database('store/store.db');
db.pragma('foreign_keys = ON');

db.exec(fs.readFileSync(path.join(process.cwd(), 'src', 'schema.sql'), 'utf8'));

function getUserByUsername(username) {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    return stmt.get(username);
}

function insertUser(username, password) {
    const stmt = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
    return stmt.run(username, password);
}

function getFilesByUserId(userId) {
    const stmt = db.prepare('SELECT * FROM files WHERE user_id = ?');
    return stmt.all(userId);
}

function insertFile(userId, filename, filePath, filesize, hash) {
    const stmt = db.prepare('INSERT INTO files (user_id, filename, filepath, filesize, hash) VALUES (?, ?, ?, ?, ?)');
    return stmt.run(userId, filename, filePath, filesize, hash);
}

exports.getUserByUsername = getUserByUsername;
exports.insertUser = insertUser;
exports.getFilesByUserId = getFilesByUserId;
exports.insertFile = insertFile;