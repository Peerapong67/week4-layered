# 🪞 REFLECTION.md — สัปดาห์ที่ 4: Layered Architecture

---

## 1. สิ่งที่เรียนรู้

การทำ Lab นี้ทำให้เข้าใจอย่างลึกซึ้งว่า **Separation of Concerns ไม่ใช่แค่แนวคิด แต่คือวินัยในการเขียนโค้ด** เมื่อนำโค้ดจาก Monolithic มา Refactor จะเห็นชัดว่าโค้ดเดิมมีหน้าที่ปนกันอยู่อย่างน่าแปลกใจ — บรรทัดเดียวอาจทั้ง validate ข้อมูล, query database และจัดรูป JSON response พร้อมกัน

สิ่งที่ได้เรียนรู้ที่สำคัญที่สุดคือ **interface ระหว่าง layers มีคุณค่ามากกว่า implementation ข้างใน** Controller ไม่จำเป็นต้องรู้ว่า Service ทำงานอย่างไร — รู้แค่ว่า `taskService.createTask(data)` จะคืน Task กลับมาหรือโยน Error ก็พอ ความคิดนี้ทำให้การเปลี่ยนแปลงภายใน layer หนึ่งไม่กระทบ layer อื่นเลย

นอกจากนี้ยังได้เรียนรู้ว่า **Singleton pattern** (ใน `database/connection.js` และ repository/service instances) เป็นวิธีที่ Node.js ใช้แชร์ state ระหว่างไฟล์ต่าง ๆ โดยใช้ module caching ของ `require()` โดยธรรมชาติ

---

## 2. ข้อดีที่พบจากการทำจริง

**ข้อดีที่โดดเด่นที่สุดในระหว่างการทำ Lab:**

ตอนที่ต้องเพิ่ม business rule ใหม่ว่า "งาน DONE ห้ามถอยกลับเป็น TODO" ใน Layered architecture เปิด `taskService.js` เพิ่มโค้ด 3 บรรทัด แล้วปิด ไม่ต้องแตะไฟล์อื่นเลย ในขณะที่ถ้าทำแบบเดิมใน Monolithic ต้องหาก่อนว่า route handler อยู่บรรทัดไหน แล้วเพิ่มโค้ดท่ามกลาง SQL queries และ HTTP response logic

**ข้อดีที่สอง** คือเมื่อเกิด error ตอน test API การ debug ง่ายขึ้นมาก เพราะ error message บอกว่าเกิดที่ layer ไหน (Repository error หมายถึงปัญหา SQL, Service error หมายถึง business rule ถูกละเมิด, Controller error หมายถึงรูปแบบ request ผิด)

---

## 3. ความท้าทายที่พบ

**ความท้าทายที่ 1: การตัดสินใจว่าโค้ดควรอยู่ใน Layer ไหน**

ตอนแรกสับสนกับการ validate input — `title.length < 3` ควรอยู่ใน Controller หรือ Service? คำตอบที่ได้คือ: Controller ตรวจสอบ *รูปแบบ* (ว่า field มีอยู่หรือไม่, type ถูกต้องหรือเปล่า) ส่วน Service ตรวจสอบ *ความหมาย* ตามกฎธุรกิจ (ว่าค่าที่ได้ถูกต้องตาม business rules หรือไม่) ความแตกต่างนี้ดูเล็กน้อยแต่สำคัญมาก

**ความท้าทายที่ 2: Route ordering ใน Express**

endpoint `/api/tasks/stats` ต้องลงทะเบียนก่อน `/api/tasks/:id` เพราะ Express จะแปล "stats" เป็น id parameter ถ้าลำดับผิด ปัญหานี้ทำให้ error แปลก ๆ และต้องใช้เวลาสักพักกว่าจะเข้าใจว่า routing order มีความสำคัญมาก

**ความท้าทายที่ 3: Async error propagation**

ใน Layered architecture errors ต้องถูกส่งต่อขึ้นมาจาก Repository → Service → Controller → Error Handler อย่างถูกต้อง ถ้าลืม `throw` ใน layer กลาง error จะหายไปเงียบ ๆ ทำให้ต้องระมัดระวังการใช้ `try-catch` และ `next(err)` ทุกจุด

---

## 4. การจัดโครงสร้างโค้ด

การแบ่ง layers ช่วยให้การจัดโครงสร้างโค้ดดีขึ้นเมื่อเทียบกับสัปดาห์ที่ 3 ใน 3 มิติหลัก:

**มิติที่ 1: ความสามารถในการค้นหา (Discoverability)**
ใน Monolithic ถ้าต้องการหา "ที่ที่บันทึก task ลงฐานข้อมูล" ต้องอ่าน server.js ทั้งไฟล์ ใน Layered รู้ทันทีว่าต้องดูที่ `src/repositories/taskRepository.js` ความรู้นี้ทำให้ developer ใหม่เข้าใจโปรเจกต์ได้เร็วขึ้นมาก

**มิติที่ 2: ขอบเขตความรับผิดชอบ (Ownership Boundaries)**
แต่ละไฟล์มี "เจ้าของ" ที่ชัดเจน controller ดูแลโดย frontend-focused developer, repository ดูแลโดย database specialist ทีมทำงานแบบ parallel ได้โดยไม่เหยียบกัน

**มิติที่ 3: การอ่านและทำความเข้าใจ (Readability)**
`taskService.js` อ่านเหมือนสารบัญของ business rules ของระบบ ไม่ปนกับ SQL syntax หรือ HTTP response formatting ทำให้ product owner หรือ business analyst สามารถอ่านและตรวจสอบ business logic ได้โดยไม่ต้องเข้าใจเทคนิคทุกอย่าง

---

## 5. เมื่อไหร่ควรใช้ Layered Architecture

**ควรใช้เมื่อ:**
- โปรเจกต์มีอายุการใช้งานนานกว่า 3 เดือน และต้องการดูแลรักษา
- ทีมมีสมาชิก 3 คนขึ้นไป และต้องทำงานพร้อมกัน
- มี business rules ที่ซับซ้อน เช่น workflow หลายขั้นตอน, เงื่อนไขหลายชั้น
- ต้องการ automated testing โดยเฉพาะ unit tests และ integration tests
- คาดว่าจะเปลี่ยนฐานข้อมูลหรือ external services ในอนาคต
- ระบบที่ต้องการ audit trail หรือ compliance (เพราะ business rules อยู่จุดเดียว)

**ไม่ควรใช้เมื่อ:**
- สร้าง prototype หรือ proof-of-concept ที่อาจ discard
- โปรเจกต์ขนาดเล็กมากที่ทำคนเดียวและรู้ว่าจะไม่โต
- Script หรือ CLI tool ที่ไม่ใช่ web application
- กำหนดเวลาเร่งรีบมากและต้องการ ship ให้เร็วที่สุด

---

## 6. การวิเคราะห์ Trade-offs

### ข้อดี
- **Testability** สูงมาก — unit test แต่ละ layer ได้โดยไม่ต้องมี database จริง
- **Maintainability** ระยะยาวดีกว่า Monolithic อย่างมีนัยสำคัญ
- **Onboarding ง่ายขึ้น** — developer ใหม่เข้าใจโครงสร้างได้เร็วจาก folder names
- **Bug isolation** — เมื่อเกิดบั๊ก รู้ทันทีว่าต้องดู layer ไหน
- **Technology independence** — เปลี่ยน database หรือ framework ได้โดยแก้ที่ layer เดียว

### ข้อเสีย
- **Initial setup time** สูงกว่า — ต้องสร้าง folder structure, interfaces, conventions ก่อนเริ่มเขียน feature
- **Boilerplate code** มากขึ้น — บาง operation ง่าย ๆ ต้องผ่าน 3 ไฟล์
- **Learning curve** — developer ใหม่ต้องเรียนรู้ convention ของโปรเจกต์ก่อน
- **Over-engineering risk** — ถ้าใช้กับโปรเจกต์เล็กเกินไป จะรู้สึกว่าโครงสร้างใหญ่กว่าเนื้อหา

### การประเมินโดยรวม

Layered Architecture เป็นตัวเลือกที่ถูกต้องสำหรับโปรเจกต์ระดับ production ที่ต้องดูแลระยะยาว ความซับซ้อนเพิ่มขึ้นในระยะแรก แต่แลกมาด้วยความง่ายในการดูแลรักษาที่ยั่งยืน เปรียบได้กับการลงทุนซื้อเครื่องมือที่ดี — ราคาแพงกว่าในวันแรก แต่ประหยัดเวลาและลดความเครียดในระยะยาวอย่างคุ้มค่า

สำหรับ ENGSE207 Lab นี้ การเรียนรู้ผ่านการ Refactor จาก Monolithic ให้ผลที่ดีกว่าการสร้าง Layered ตั้งแต่ต้น เพราะทำให้เห็นความแตกต่างอย่างเป็นรูปธรรมว่าโค้ดชิ้นเดิมเมื่ออยู่ในโครงสร้างต่างกัน ส่งผลต่อการดูแลรักษาอย่างไร
