# 📋 TaskBoard — สัปดาห์ที่ 4: Layered Architecture

> แอปพลิเคชันจัดการงาน (Task Management) แบบ Full-stack ที่ Refactor จาก Monolithic มาเป็น **Layered (3-Tier) Architecture**

---

## 🚀 เริ่มต้นใช้งาน

```bash
# 1. ติดตั้ง dependencies
npm install

# 2. สร้างฐานข้อมูล
cd database
sqlite3 tasks.db < schema.sql
cd ..

# 3. เริ่ม development server
npm run dev

# 4. เปิดเบราว์เซอร์
# → http://localhost:3000
```

---

## 📁 โครงสร้างโปรเจกต์

```
week4-layered/
├── server.js                      # จุดเริ่มต้นโปรแกรม (Entry Point)
├── package.json
├── .env                           # ตัวแปร Environment
├── .gitignore
├── database/
│   ├── schema.sql                 # สคีมาฐานข้อมูล + ข้อมูลตัวอย่าง
│   ├── tasks.db                   # SQLite database (auto-created, git-ignored)
│   └── connection.js              # Database connection singleton
├── src/
│   ├── controllers/               # ⭐ Presentation Layer (ชั้นที่ 1)
│   │   └── taskController.js      # รับ-ส่ง HTTP requests/responses
│   ├── services/                  # ⭐ Business Logic Layer (ชั้นที่ 2)
│   │   └── taskService.js         # กฎทางธุรกิจและการตรวจสอบ
│   ├── repositories/              # ⭐ Data Access Layer (ชั้นที่ 3)
│   │   └── taskRepository.js      # CRUD operations กับ SQLite
│   ├── models/                    # Data Models
│   │   └── Task.js                # Task class พร้อม validation
│   ├── middleware/                # Express Middleware
│   │   ├── errorHandler.js        # จัดการ errors ทั้งระบบ
│   │   └── validator.js           # ตรวจสอบ request format
│   └── utils/                     # Utilities
│       └── logger.js              # Logging helper
├── public/                        # Static Frontend
│   ├── index.html
│   ├── style.css
│   └── app.js
├── ANALYSIS.md                    # การวิเคราะห์เปรียบเทียบ
├── ARCHITECTURE.md                # แผนภาพสถาปัตยกรรม
├── README.md
└── REFLECTION.md
```

---

## 🏛️ สถาปัตยกรรม 3 ชั้น

```
┌──────────────────────────────────────────────────────────┐
│               Presentation Layer (Controllers)           │
│   รับ HTTP requests · ตรวจสอบ format · จัดรูป JSON       │
└──────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────┐
│              Business Logic Layer (Services)             │
│   กฎทางธุรกิจ · Validation · Workflow orchestration      │
└──────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────┐
│            Data Access Layer (Repositories)              │
│          CRUD operations · SQL queries · Mapping         │
└──────────────────────────────────────────────────────────┘
                            ↓
                     [ SQLite Database ]
```

---

## 🔌 API Endpoints

### Tasks
| Method | Endpoint | คำอธิบาย |
|--------|----------|----------|
| GET | `/api/tasks` | ดึงรายการงานทั้งหมด (`?status=`, `?priority=`, `?search=`) |
| GET | `/api/tasks/:id` | ดึงงานรายการเดียว |
| POST | `/api/tasks` | สร้างงานใหม่ |
| PUT | `/api/tasks/:id` | อัปเดตงาน |
| DELETE | `/api/tasks/:id` | ลบงาน |

### Statistics & Actions
| Method | Endpoint | คำอธิบาย |
|--------|----------|----------|
| GET | `/api/tasks/stats` | ดึงสถิติงาน (แยกตาม status และ priority) |
| PATCH | `/api/tasks/:id/next-status` | เลื่อนงานไปสถานะถัดไป |

### ตัวอย่างการเรียกใช้งาน

```bash
# สร้างงานใหม่
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"ทดสอบ Layered Arch","description":"ทดสอบ 3-tier","priority":"HIGH"}'

# ดึงสถิติ
curl http://localhost:3000/api/tasks/stats

# เลื่อนไปสถานะถัดไป
curl -X PATCH http://localhost:3000/api/tasks/1/next-status

# กรองตามสถานะ
curl http://localhost:3000/api/tasks?status=TODO
```

---

## 📏 กฎทางธุรกิจ (Business Rules)

ทั้งหมดนี้อยู่ใน `src/services/taskService.js` เท่านั้น:

1. ชื่องานต้องมีอย่างน้อย **3 ตัวอักษร** และไม่เกิน **100 ตัวอักษร**
2. งาน **HIGH priority** ต้องมีรายละเอียด (description)
3. **ไม่สามารถ** เปลี่ยนงานที่ `DONE` กลับไปเป็น `TODO`
4. Status ที่ใช้ได้: `TODO` → `IN_PROGRESS` → `DONE`
5. Priority ที่ใช้ได้: `LOW`, `MEDIUM`, `HIGH`

---

## ⚖️ Monolithic vs Layered — สรุปข้อเปรียบเทียบ

### ✅ ข้อดีของ Layered Architecture
- **Maintainability** — แก้ไข layer ที่ต้องการได้โดยไม่กระทบส่วนอื่น
- **Testability** — ทดสอบแต่ละ layer แยกกันได้อิสระ
- **Reusability** — Repository สามารถนำไปใช้ใน Service อื่นได้
- **Separation of Concerns** — หน้าที่ชัดเจน รู้ว่าโค้ดอยู่ที่ไหน
- **Team Collaboration** — ทีมทำงานคนละ layer ได้พร้อมกัน

### ❌ ข้อเสียเมื่อเทียบกับ Monolithic
- **Complexity** — มีไฟล์และโครงสร้างมากขึ้น ~4 เท่า
- **Performance** — มี overhead เล็กน้อยจากการเรียกผ่าน layers
- **Over-engineering** — อาจมากเกินไปสำหรับโปรเจกต์เล็กหรือ MVP

---

## 🛠️ เทคโนโลยีที่ใช้

| ชั้น | เทคโนโลยี |
|------|----------|
| Runtime | Node.js 18+ |
| Framework | Express 4 |
| ฐานข้อมูล | SQLite 3 (via node-sqlite3) |
| Configuration | dotenv |
| Frontend | Vanilla HTML / CSS / JS |
| Dev server | nodemon |

---

## 🔧 การแก้ไขปัญหาเบื้องต้น

**Port 3000 ถูกใช้งานอยู่:**
```bash
lsof -i :3000 && kill -9 <PID>
# หรือ:
PORT=4000 npm run dev
```

**ไม่พบ module:**
```bash
npm install
```

**ฐานข้อมูลถูกล็อก:**
- ปิด Extension SQLite Viewer ใน VS Code
- Restart server

**ฐานข้อมูลว่างเปล่า:**
```bash
cd database && sqlite3 tasks.db < schema.sql && cd ..
```
