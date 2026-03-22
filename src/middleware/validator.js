/**
 * Request Validator Middleware
 * ตรวจสอบรูปแบบข้อมูลเบื้องต้นก่อนส่งไปยัง Controller
 */

/**
 * ตรวจสอบ body ของ POST /api/tasks
 */
function validateCreateTask(req, res, next) {
    const { title } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({
            success: false,
            error:   'กรุณาระบุชื่องาน (title)',
        });
    }

    next();
}

/**
 * ตรวจสอบ :id parameter
 */
function validateId(req, res, next) {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
        return res.status(400).json({
            success: false,
            error:   'ID ต้องเป็นตัวเลขจำนวนเต็มบวก',
        });
    }
    next();
}

module.exports = { validateCreateTask, validateId };
