const sqlite3 = require('sqlite3').verbose();
const path    = require('path');
require('dotenv').config();

/**
 * Database connection — Singleton
 * ห่อ sqlite3 ด้วย Promise-based helpers
 */
class Database {
    constructor() {
        this.db = null;
    }

    connect() {
        return new Promise((resolve, reject) => {
            const dbPath = path.resolve(process.env.DB_PATH || './database/tasks.db');

            this.db = new sqlite3.Database(dbPath, (err) => {
                if (err) {
                    console.error('❌ เชื่อมต่อฐานข้อมูลล้มเหลว:', err.message);
                    reject(err);
                } else {
                    console.log('✅ เชื่อมต่อฐานข้อมูลสำเร็จ:', dbPath);
                    this.db.run('PRAGMA foreign_keys = ON');
                    this._autoInit(dbPath);
                    resolve(this.db);
                }
            });
        });
    }

    /** สร้างตารางอัตโนมัติถ้ายังไม่มี */
    _autoInit(dbPath) {
        const fs   = require('fs');
        const schemaPath = path.join(__dirname, 'schema.sql');

        if (fs.existsSync(schemaPath) && fs.statSync(dbPath).size === 0) {
            const schema = fs.readFileSync(schemaPath, 'utf8');
            this.db.exec(schema, (err) => {
                if (err) console.error('❌ Schema init error:', err.message);
                else console.log('✅ Database initialized from schema.sql');
            });
        }
    }

    getConnection() {
        if (!this.db) throw new Error('ยังไม่ได้เชื่อมต่อฐานข้อมูล เรียก connect() ก่อน');
        return this.db;
    }

    close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) reject(err);
                    else {
                        console.log('✅ ปิดการเชื่อมต่อฐานข้อมูล');
                        this.db = null;
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }

    /** Promise wrapper: execute INSERT/UPDATE/DELETE */
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function (err) {
                if (err) reject(err);
                else resolve({ lastID: this.lastID, changes: this.changes });
            });
        });
    }

    /** Promise wrapper: SELECT single row */
    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    /** Promise wrapper: SELECT multiple rows */
    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
}

// Singleton
const database = new Database();
module.exports = database;
