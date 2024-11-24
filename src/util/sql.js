const fs = require('fs');
const path = require('path');
const process = require('process');

const Database = require('better-sqlite3');

const db = new Database('store/store.db');
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

db.exec(fs.readFileSync(path.join(process.cwd(), 'src', 'schema.sql'), 'utf8'));

function getUserByUsername(username) {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    return stmt.get(username);
}

function insertUser(username, password) {
    const stmt = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
    return stmt.run(username, password);
}

function getFile(userId, filename) {
    const stmt = db.prepare('SELECT * FROM files WHERE user_id = ? AND filename = ?');
    return stmt.get(userId, filename);
}

function getFilesByUserId(userId) {
    const stmt = db.prepare('SELECT * FROM files WHERE user_id = ?');
    return stmt.all(userId);
}

function insertFile(userId, filename, filePath, filesize, hash) {
    const stmt = db.prepare('INSERT INTO files (user_id, filename, filepath, filesize, hash) VALUES (?, ?, ?, ?, ?)');
    return stmt.run(userId, filename, filePath, filesize, hash);
}

function deleteFile(userId, fileId) {
    const stmt = db.prepare('DELETE FROM files WHERE user_id = ? AND id = ?');
    return stmt.run(userId, fileId);
}

exports.getUserByUsername = getUserByUsername;
exports.insertUser = insertUser;
exports.getFile = getFile;
exports.getFilesByUserId = getFilesByUserId;
exports.insertFile = insertFile;
exports.deleteFile = deleteFile;