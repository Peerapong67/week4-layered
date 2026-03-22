/**
 * TaskRepository — Data Access Layer (ชั้นที่ 3)
 *
 * หน้าที่:
 *   ✅ CRUD operations กับฐานข้อมูล
 *   ✅ ประมวลผล SQL queries
 *   ✅ แปลง raw rows เป็น Task objects
 *
 * ไม่ควรมี:
 *   ❌ Business logic
 *   ❌ HTTP handling
 *   ❌ Data transformation logic ที่ซับซ้อน
 */
const database = require('../../database/connection');
const Task     = require('../models/Task');

class TaskRepository {

    /**
     * ค้นหา tasks ทั้งหมด พร้อมตัวกรองเสริม
     * @param {Object} filters - { status?, priority?, search? }
     * @returns {Promise<Task[]>}
     */
    async findAll(filters = {}) {
        let sql    = 'SELECT * FROM tasks WHERE 1=1';
        const params = [];

        if (filters.status) {
            sql += ' AND status = ?';
            params.push(filters.status);
        }
        if (filters.priority) {
            sql += ' AND priority = ?';
            params.push(filters.priority);
        }
        if (filters.search) {
            sql += ' AND (title LIKE ? OR description LIKE ?)';
            const term = `%${filters.search}%`;
            params.push(term, term);
        }

        sql += ' ORDER BY CASE priority WHEN "HIGH" THEN 1 WHEN "MEDIUM" THEN 2 WHEN "LOW" THEN 3 END, created_at DESC';

        const rows = await database.all(sql, params);
        return rows.map(row => new Task(row));
    }

    /**
     * ค้นหา task ตาม ID
     * @param {number} id
     * @returns {Promise<Task|null>}
     */
    async findById(id) {
        const row = await database.get('SELECT * FROM tasks WHERE id = ?', [id]);
        return row ? new Task(row) : null;
    }

    /**
     * สร้าง task ใหม่
     * @param {Task} task
     * @returns {Promise<Task>}
     */
    async create(task) {
        const data = task.toDatabase();
        const sql  = `
            INSERT INTO tasks (title, description, status, priority)
            VALUES (?, ?, ?, ?)
        `;
        const result = await database.run(sql, [
            data.title, data.description, data.status, data.priority,
        ]);
        return await this.findById(result.lastID);
    }

    /**
     * อัปเดต task (dynamic fields)
     * @param {number} id
     * @param {Object} updates
     * @returns {Promise<Task|null>}
     */
    async update(id, updates) {
        const fields = [];
        const params = [];

        if (updates.title       !== undefined) { fields.push('title = ?');       params.push(updates.title); }
        if (updates.description !== undefined) { fields.push('description = ?'); params.push(updates.description); }
        if (updates.status      !== undefined) { fields.push('status = ?');      params.push(updates.status); }
        if (updates.priority    !== undefined) { fields.push('priority = ?');    params.push(updates.priority); }

        if (fields.length === 0) return await this.findById(id);

        fields.push('updated_at = CURRENT_TIMESTAMP');
        params.push(id);

        const sql = `UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`;
        await database.run(sql, params);
        return await this.findById(id);
    }

    /**
     * ลบ task
     * @param {number} id
     * @returns {Promise<boolean>}
     */
    async delete(id) {
        const result = await database.run('DELETE FROM tasks WHERE id = ?', [id]);
        return result.changes > 0;
    }

    /**
     * นับจำนวน tasks จัดกลุ่มตาม status
     * @returns {Promise<Object>}
     */
    async countByStatus() {
        const rows = await database.all(
            'SELECT status, COUNT(*) as count FROM tasks GROUP BY status'
        );
        return rows.reduce((acc, row) => {
            acc[row.status] = row.count;
            return acc;
        }, {});
    }
}

module.exports = new TaskRepository();
