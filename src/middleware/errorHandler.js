/**
 * Global Error Handler Middleware
 * ต้องลงทะเบียนเป็น middleware ตัวสุดท้ายใน Express
 */
function errorHandler(err, req, res, next) {
    console.error('❌ [ERROR]', err.message);

    let statusCode = 500;
    let message    = 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์';

    if (err.message?.includes('SQLITE')) {
        statusCode = 500;
        message    = 'เกิดข้อผิดพลาดในฐานข้อมูล';
    } else if (err.message?.includes('ข้อมูลไม่ถูกต้อง')) {
        statusCode = 400;
        message    = err.message;
    }

    res.status(statusCode).json({
        success: false,
        error:   message,
        // แสดง stack trace เฉพาะใน development
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
}

module.exports = errorHandler;
