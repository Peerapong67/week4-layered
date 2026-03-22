DROP TABLE IF EXISTS tasks;

CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'TODO',
    priority TEXT DEFAULT 'MEDIUM',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO tasks (title, description, status, priority) VALUES
('ติดตั้ง Environment', 'ติดตั้ง Node.js, npm, SQLite และตั้งค่า development environment', 'DONE', 'HIGH'),
('ศึกษา Monolithic', 'ศึกษา Monolithic architecture patterns ข้อดีข้อเสียเปรียบกับ microservices', 'DONE', 'HIGH'),
('Refactor เป็น Layered', 'แยกโค้ดออกเป็น Controller, Service, Repository', 'IN_PROGRESS', 'HIGH'),
('เขียน Unit Tests', 'เขียนทดสอบสำหรับแต่ละ layer', 'TODO', 'MEDIUM'),
('เขียนเอกสาร', 'สร้าง README.md, ANALYSIS.md และ REFLECTION.md', 'TODO', 'LOW');
