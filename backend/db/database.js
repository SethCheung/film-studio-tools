const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'film-studio.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

// 确保 data 目录存在
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

// 启用外键
db.pragma('foreign_keys = ON');

// 初始化表结构
function init() {
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
    db.exec(schema);
    console.log('✅ 数据库初始化完成:', DB_PATH);
}

// 执行查询的辅助函数
function run(sql, params = []) {
    const stmt = db.prepare(sql);
    return stmt.run(...params);
}

function get(sql, params = []) {
    const stmt = db.prepare(sql);
    return stmt.get(...params);
}

function all(sql, params = []) {
    const stmt = db.prepare(sql);
    return stmt.all(...params);
}

module.exports = { db, init, run, get, all };