/**
 * TaskController — Presentation Layer (ชั้นที่ 1)
 *
 * หน้าที่:
 *   ✅ รับ HTTP requests จาก client
 *   ✅ ตรวจสอบรูปแบบข้อมูลที่เข้ามา (format validation)
 *   ✅ เรียกใช้ Business Logic Layer (Service)
 *   ✅ จัดรูปแบบ responses เป็น JSON
 *   ✅ จัดการ HTTP status codes
 *
 * ไม่ควรมี:
 *   ❌ Business logic
 *   ❌ Database queries
 *   ❌ การคำนวณที่ซับซ้อน
 */
const taskService = require('../services/taskService');

class TaskController {

    /**
     * GET /api/tasks
     * ดึง tasks ทั้งหมดพร้อมตัวกรองเสริม
     */
    async getAllTasks(req, res, next) {
        try {
            const filters = {};
            if (req.query.status)   filters.status   = req.query.status.toUpperCase();
            if (req.query.priority) filters.priority = req.query.priority.toUpperCase();
            if (req.query.search)   filters.search   = req.query.search.trim();

            const tasks = await taskService.getAllTasks(filters);
            res.json({ success: true, data: tasks, count: tasks.length });
        } catch (err) {
            next(err);
        }
    }

    /**
     * GET /api/tasks/stats
     * ดึงสถิติ tasks
     */
    async getStatistics(req, res, next) {
        try {
            const stats = await taskService.getStatistics();
            res.json({ success: true, data: stats });
        } catch (err) {
            next(err);
        }
    }

    /**
     * GET /api/tasks/:id
     * ดึง task ตาม ID
     */
    async getTaskById(req, res, next) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                return res.status(400).json({ success: false, error: 'ID ไม่ถูกต้อง' });
            }

            const task = await taskService.getTaskById(id);
            res.json({ success: true, data: task });
        } catch (err) {
            if (err.message.includes('ไม่พบ')) {
                return res.status(404).json({ success: false, error: err.message });
            }
            next(err);
        }
    }

    /**
     * POST /api/tasks
     * สร้าง task ใหม่
     */
    async createTask(req, res, next) {
        try {
            // ✅ Presentation layer: ดึงข้อมูลจาก request เท่านั้น
            const taskData = {
                title:       req.body.title,
                description: req.body.description,
                status:      req.body.status,
                priority:    req.body.priority,
            };

            const task = await taskService.createTask(taskData);
            res.status(201).json({ success: true, data: task, message: 'สร้างงานสำเร็จ' });
        } catch (err) {
            if (err.message.includes('ข้อมูลไม่ถูกต้อง') || err.message.includes('ต้องมีรายละเอียด')) {
                return res.status(400).json({ success: false, error: err.message });
            }
            next(err);
        }
    }

    /**
     * PUT /api/tasks/:id
     * อัปเดต task
     */
    async updateTask(req, res, next) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                return res.status(400).json({ success: false, error: 'ID ไม่ถูกต้อง' });
            }

            // ✅ ส่งเฉพาะ fields ที่ส่งมาจริง ๆ
            const updates = {};
            if (req.body.title       !== undefined) updates.title       = req.body.title;
            if (req.body.description !== undefined) updates.description = req.body.description;
            if (req.body.status      !== undefined) updates.status      = req.body.status;
            if (req.body.priority    !== undefined) updates.priority    = req.body.priority;

            const task = await taskService.updateTask(id, updates);
            res.json({ success: true, data: task, message: 'อัปเดตงานสำเร็จ' });
        } catch (err) {
            if (err.message.includes('ไม่พบ')) {
                return res.status(404).json({ success: false, error: err.message });
            }
            if (err.message.includes('ข้อมูลไม่ถูกต้อง') || err.message.includes('ไม่สามารถ')) {
                return res.status(400).json({ success: false, error: err.message });
            }
            next(err);
        }
    }

    /**
     * DELETE /api/tasks/:id
     * ลบ task
     */
    async deleteTask(req, res, next) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                return res.status(400).json({ success: false, error: 'ID ไม่ถูกต้อง' });
            }

            await taskService.deleteTask(id);
            res.json({ success: true, message: 'ลบงานสำเร็จ' });
        } catch (err) {
            if (err.message.includes('ไม่พบ')) {
                return res.status(404).json({ success: false, error: err.message });
            }
            next(err);
        }
    }

    /**
     * PATCH /api/tasks/:id/next-status
     * เลื่อนงานไปสถานะถัดไป
     */
    async moveToNextStatus(req, res, next) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                return res.status(400).json({ success: false, error: 'ID ไม่ถูกต้อง' });
            }

            const task = await taskService.moveToNextStatus(id);
            res.json({ success: true, data: task, message: 'เปลี่ยนสถานะงานสำเร็จ' });
        } catch (err) {
            if (err.message.includes('ไม่พบ')) {
                return res.status(404).json({ success: false, error: err.message });
            }
            if (err.message.includes('เสร็จสมบูรณ์แล้ว')) {
                return res.status(400).json({ success: false, error: err.message });
            }
            next(err);
        }
    }
}

module.exports = new TaskController();
