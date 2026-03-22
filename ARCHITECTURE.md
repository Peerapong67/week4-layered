# 🏛️ ARCHITECTURE.md — สถาปัตยกรรมระบบ Week 4

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                         │
│              index.html · style.css · app.js                │
│           (fetch API calls → /api/tasks/*)                  │
└─────────────────────────────────────────────────────────────┘
                              │
                    HTTP Requests / Responses
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              PRESENTATION LAYER — Controllers               │
│                  src/controllers/taskController.js          │
│                                                             │
│   ┌───────────────────────────────────────────────────┐     │
│   │  getAllTasks()   · getTaskById()   · createTask()  │     │
│   │  updateTask()   · deleteTask()   · getStatistics() │     │
│   │  moveToNextStatus()                                │     │
│   └───────────────────────────────────────────────────┘     │
│                                                             │
│   หน้าที่: รับ req · parse params · call service · res JSON │
│   ห้ามมี: SQL queries · Business logic · Calculations       │
└─────────────────────────────────────────────────────────────┘
                              │
                    Service method calls
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│            BUSINESS LOGIC LAYER — Services                  │
│                   src/services/taskService.js               │
│                                                             │
│   ┌───────────────────────────────────────────────────┐     │
│   │  Business Rules:                                   │     │
│   │  • title ต้องมี 3-100 ตัวอักษร                     │     │
│   │  • HIGH priority ต้องมี description                │     │
│   │  • DONE → TODO ไม่ได้                              │     │
│   │  • Status flow: TODO → IN_PROGRESS → DONE          │     │
│   └───────────────────────────────────────────────────┘     │
│                                                             │
│   หน้าที่: Validate · Apply rules · Orchestrate workflow    │
│   ห้ามมี: req/res objects · Direct SQL · HTTP status codes  │
└─────────────────────────────────────────────────────────────┘
                              │
                    Repository method calls
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│            DATA ACCESS LAYER — Repositories                 │
│                src/repositories/taskRepository.js           │
│                                                             │
│   ┌───────────────────────────────────────────────────┐     │
│   │  findAll(filters)  · findById(id)                  │     │
│   │  create(task)      · update(id, updates)           │     │
│   │  delete(id)        · countByStatus()               │     │
│   └───────────────────────────────────────────────────┘     │
│                                                             │
│   หน้าที่: CRUD SQL · Map rows → Task objects               │
│   ห้ามมี: Business logic · Validation rules · HTTP logic    │
└─────────────────────────────────────────────────────────────┘
                              │
                    Promise-based DB calls
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   DATABASE LAYER                            │
│              database/connection.js (Singleton)             │
│                   database/tasks.db (SQLite)                │
│                                                             │
│   run() · get() · all()  — Promise wrappers                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Supporting Components

```
┌──────────────────────────────────────────────────────────────┐
│                    Supporting Components                     │
│                                                              │
│  ┌─────────────────────┐   ┌──────────────────────────────┐  │
│  │   src/models/       │   │   src/middleware/             │  │
│  │   Task.js           │   │   errorHandler.js            │  │
│  │                     │   │   validator.js               │  │
│  │  • constructor()    │   │                              │  │
│  │  • isValid()        │   │  errorHandler:               │  │
│  │  • toDatabase()     │   │  • catch all unhandled errors│  │
│  │  • toJSON()         │   │  • map to HTTP status codes  │  │
│  │                     │   │                              │  │
│  │  ใช้ร่วมกันทุก layer │   │  validator:                  │  │
│  └─────────────────────┘   │  • check request format      │  │
│                             │  • validate :id params       │  │
│  ┌─────────────────────┐   └──────────────────────────────┘  │
│  │   src/utils/        │                                      │
│  │   logger.js         │                                      │
│  │                     │                                      │
│  │  • info()           │                                      │
│  │  • warn()           │                                      │
│  │  • error()          │                                      │
│  │  • debug()          │                                      │
│  └─────────────────────┘                                      │
└──────────────────────────────────────────────────────────────┘
```

---

## Data Flow Example: POST /api/tasks

```
1. Browser ส่ง:
   POST /api/tasks
   Body: { "title": "งานใหม่", "priority": "HIGH", "description": "รายละเอียด" }
   │
   ▼
2. Express Middleware:
   • express.json()          → parse body เป็น JavaScript object
   • validateCreateTask()    → ตรวจสอบว่ามี title field หรือไม่
   • logger middleware       → บันทึก "POST /api/tasks"
   │
   ▼
3. TaskController.createTask(req, res, next)
   • ดึง taskData จาก req.body
   • เรียก taskService.createTask(taskData)
   │
   ▼
4. TaskService.createTask(taskData)
   • new Task(taskData)           → สร้าง Task object
   • task.isValid()               → ตรวจสอบ format (length, valid values)
   • ตรวจ HIGH priority rule      → ต้องมี description
   • เรียก taskRepository.create(task)
   │
   ▼
5. TaskRepository.create(task)
   • task.toDatabase()            → แปลงเป็น plain object
   • database.run(INSERT SQL)     → บันทึกลง SQLite
   • database.get(SELECT SQL)     → ดึงข้อมูลที่บันทึกแล้ว
   • คืนค่า new Task(row)
   │
   ▼
6. Response ไหลกลับขึ้น:
   Repository → Service → Controller
   │
   ▼
7. Controller ส่ง:
   HTTP 201 Created
   { "success": true, "data": { id, title, priority, ... }, "message": "สร้างงานสำเร็จ" }
```

---

## Error Flow Example: Business Rule Violation

```
POST /api/tasks { "title": "AB", "priority": "HIGH" }   ← title สั้นเกินไป
│
▼
Controller.createTask()
│
▼
Service.createTask()
  task.isValid() → { valid: false, errors: ["ชื่องานต้องมีอย่างน้อย 3 ตัวอักษร"] }
  throw new Error("ข้อมูลไม่ถูกต้อง: ชื่องานต้องมีอย่างน้อย 3 ตัวอักษร")
│
▼ (error propagates up)
Controller.createTask() — catch block
  error.message.includes("ข้อมูลไม่ถูกต้อง") → true
  res.status(400).json({ success: false, error: "..." })
│
▼
Browser ได้รับ:
HTTP 400 Bad Request
{ "success": false, "error": "ข้อมูลไม่ถูกต้อง: ชื่องานต้องมีอย่างน้อย 3 ตัวอักษร" }
```

---

## เปรียบเทียบโครงสร้าง: Week 3 vs Week 4

```
WEEK 3 — MONOLITHIC                    WEEK 4 — LAYERED
─────────────────────────              ──────────────────────────────────────

server.js (~150 บรรทัด)                server.js               (entry point)
├── Express setup                      ├── database/
├── DB connection                      │   ├── connection.js   (DB singleton)
├── Route handlers                     │   └── schema.sql
│   ├── GET /tasks     ─┐              └── src/
│   ├── POST /tasks     ├─ ทุกอย่าง        ├── controllers/
│   ├── PUT /tasks/:id  │   รวมกัน             │   └── taskController.js  ← HTTP
│   └── DELETE /tasks  ─┘              │   ├── services/
├── Validation logic                   │   │   └── taskService.js    ← Business
├── Business rules                     │   ├── repositories/
├── SQL queries                        │   │   └── taskRepository.js ← Data
└── Error handling                     │   ├── models/
                                       │   │   └── Task.js           ← Model
                                       │   ├── middleware/
                                       │   │   ├── errorHandler.js
                                       │   │   └── validator.js
                                       │   └── utils/
                                       │       └── logger.js
                                       │
                                       ไฟล์ทั้งหมด: 9 ไฟล์ JS
                                       ทุก layer มีหน้าที่เดียว
```

---

## Dependency Graph

```
server.js
    ├── database/connection.js
    ├── src/controllers/taskController.js
    │       └── src/services/taskService.js
    │               ├── src/repositories/taskRepository.js
    │               │       ├── database/connection.js
    │               │       └── src/models/Task.js
    │               ├── src/models/Task.js
    │               └── src/utils/logger.js
    ├── src/middleware/errorHandler.js
    ├── src/middleware/validator.js
    └── src/utils/logger.js

Dependencies ไหลลงทางเดียว (One-directional):
Controller → Service → Repository → Database
ไม่มีการ import ย้อนกลับ (No circular dependencies)
```
