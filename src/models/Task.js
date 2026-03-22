/**
 * Task Data Model
 * แทนข้อมูล task พร้อม validation และ transformation methods
 *
 * Layer: ไม่ผูกกับ layer ใด — ใช้ร่วมกันได้ทุก layer
 */
class Task {
    static VALID_STATUSES   = ['TODO', 'IN_PROGRESS', 'DONE'];
    static VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];

    constructor(data = {}) {
        this.id          = data.id          ?? null;
        this.title       = data.title       ?? '';
        this.description = data.description ?? '';
        this.status      = data.status      ?? 'TODO';
        this.priority    = data.priority    ?? 'MEDIUM';
        this.created_at  = data.created_at  ?? null;
        this.updated_at  = data.updated_at  ?? null;
    }

    /**
     * ตรวจสอบความถูกต้องของข้อมูล
     * @returns {{ valid: boolean, errors: string[] }}
     */
    isValid() {
        const errors = [];

        // ตรวจสอบ title
        if (!this.title || this.title.trim().length < 3) {
            errors.push('ชื่องานต้องมีอย่างน้อย 3 ตัวอักษร');
        }
        if (this.title && this.title.length > 100) {
            errors.push('ชื่องานต้องไม่เกิน 100 ตัวอักษร');
        }

        // ตรวจสอบ status
        if (!Task.VALID_STATUSES.includes(this.status)) {
            errors.push(`สถานะไม่ถูกต้อง (ใช้ได้: ${Task.VALID_STATUSES.join(', ')})`);
        }

        // ตรวจสอบ priority
        if (!Task.VALID_PRIORITIES.includes(this.priority)) {
            errors.push(`ระดับความสำคัญไม่ถูกต้อง (ใช้ได้: ${Task.VALID_PRIORITIES.join(', ')})`);
        }

        return { valid: errors.length === 0, errors };
    }

    /**
     * แปลงเป็น object สำหรับบันทึกลงฐานข้อมูล
     */
    toDatabase() {
        return {
            title:       this.title.trim(),
            description: this.description ? this.description.trim() : null,
            status:      this.status,
            priority:    this.priority,
        };
    }

    /**
     * แปลงเป็น plain object สำหรับ API response
     */
    toJSON() {
        return {
            id:          this.id,
            title:       this.title,
            description: this.description,
            status:      this.status,
            priority:    this.priority,
            created_at:  this.created_at,
            updated_at:  this.updated_at,
        };
    }
}

module.exports = Task;
