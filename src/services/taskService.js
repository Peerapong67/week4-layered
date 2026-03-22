/**
 * TaskService — Business Logic Layer (ชั้นที่ 2)
 *
 * หน้าที่:
 *   ✅ กฎทางธุรกิจและการตรวจสอบ (Business rules & validation)
 *   ✅ การแปลงข้อมูล (Data transformation)
 *   ✅ Workflow orchestration
 *   ✅ การคำนวณที่ซับซ้อน
 *
 * ไม่ควรมี:
 *   ❌ HTTP handling (req, res)
 *   ❌ SQL queries โดยตรง
 *   ❌ UI concerns
 */
const taskRepository = require('../repositories/taskRepository');
const Task           = require('../models/Task');
const logger         = require('../utils/logger');

class TaskService {

    /**
     * ดึง tasks ทั้งหมดพร้อมตัวกรอง
     * @param {Object} filters
     * @returns {Promise<Task[]>}
     */
    async getAllTasks(filters = {}) {
        return await taskRepository.findAll(filters);
    }

    /**
     * ดึง task ตาม ID — โยน Error ถ้าไม่พบ
     * @param {number} id
     * @returns {Promise<Task>}
     */
    async getTaskById(id) {
        const task = await taskRepository.findById(id);
        if (!task) throw new Error(`ไม่พบ task ที่มี ID ${id}`);
        return task;
    }

    /**
     * สร้าง task ใหม่พร้อมตรวจสอบกฎทางธุรกิจ
     * @param {Object} taskData
     * @returns {Promise<Task>}
     */
    async createTask(taskData) {
        const task = new Task(taskData);

        // ─── Basic validation ─────────────────────────────────────────────
        const validation = task.isValid();
        if (!validation.valid) {
            throw new Error(`ข้อมูลไม่ถูกต้อง: ${validation.errors.join(', ')}`);
        }

        // ─── Business rules ───────────────────────────────────────────────
        if (task.priority === 'HIGH' && !task.description?.trim()) {
            throw new Error('งานลำดับความสำคัญสูงต้องมีรายละเอียด');
        }

        const created = await taskRepository.create(task);

        if (created.priority === 'HIGH') {
            logger.warn(`🔥 สร้างงานลำดับความสำคัญสูง: "${created.title}"`);
        }

        return created;
    }

    /**
     * อัปเดต task พร้อมกฎทางธุรกิจ
     * @param {number} id
     * @param {Object} updates
     * @returns {Promise<Task>}
     */
    async updateTask(id, updates) {
        const existing = await this.getTaskById(id);

        // ─── Validate updated fields ──────────────────────────────────────
        if (updates.title !== undefined || updates.status !== undefined || updates.priority !== undefined) {
            const merged   = new Task({ ...existing, ...updates });
            const validation = merged.isValid();
            if (!validation.valid) {
                throw new Error(`ข้อมูลไม่ถูกต้อง: ${validation.errors.join(', ')}`);
            }
        }

        // ─── Business rule: ห้ามถอย DONE → TODO ──────────────────────────
        if (existing.status === 'DONE' && updates.status === 'TODO') {
            throw new Error('ไม่สามารถเปลี่ยนงานที่เสร็จแล้วกลับไปเป็น TODO ได้');
        }

        // ─── Business rule: HIGH priority ต้องมี description ─────────────
        const finalPriority    = updates.priority    ?? existing.priority;
        const finalDescription = updates.description ?? existing.description;
        if (finalPriority === 'HIGH' && !finalDescription?.trim()) {
            throw new Error('งานลำดับความสำคัญสูงต้องมีรายละเอียด');
        }

        const updated = await taskRepository.update(id, updates);

        if (updates.status && updates.status !== existing.status) {
            logger.info(`📝 Task #${id}: ${existing.status} → ${updates.status}`);
        }

        return updated;
    }

    /**
     * ลบ task พร้อมกฎทางธุรกิจ
     * @param {number} id
     * @returns {Promise<boolean>}
     */
    async deleteTask(id) {
        const task = await this.getTaskById(id);

        if (task.priority === 'HIGH') {
            logger.warn(`⚠️  กำลังลบงานลำดับความสำคัญสูง: "${task.title}"`);
        }

        return await taskRepository.delete(id);
    }

    /**
     * ดึงสถิติ tasks
     * @returns {Promise<Object>}
     */
    async getStatistics() {
        const [counts, allTasks] = await Promise.all([
            taskRepository.countByStatus(),
            taskRepository.findAll(),
        ]);

        return {
            total:      allTasks.length,
            byStatus: {
                TODO:        counts.TODO        || 0,
                IN_PROGRESS: counts.IN_PROGRESS || 0,
                DONE:        counts.DONE        || 0,
            },
            byPriority: {
                LOW:    allTasks.filter(t => t.priority === 'LOW').length,
                MEDIUM: allTasks.filter(t => t.priority === 'MEDIUM').length,
                HIGH:   allTasks.filter(t => t.priority === 'HIGH').length,
            },
            completionRate: allTasks.length
                ? Math.round((counts.DONE || 0) / allTasks.length * 100)
                : 0,
        };
    }

    /**
     * เลื่อนงานไปสถานะถัดไปตาม flow: TODO → IN_PROGRESS → DONE
     * @param {number} id
     * @returns {Promise<Task>}
     */
    async moveToNextStatus(id) {
        const task = await this.getTaskById(id);

        const statusFlow = { TODO: 'IN_PROGRESS', IN_PROGRESS: 'DONE', DONE: null };
        const next       = statusFlow[task.status];

        if (!next) throw new Error('งานนี้เสร็จสมบูรณ์แล้ว ไม่สามารถเลื่อนสถานะได้');

        return await this.updateTask(id, { status: next });
    }
}

module.exports = new TaskService();
