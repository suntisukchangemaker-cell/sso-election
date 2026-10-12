# SSO Election — เว็บแสดงผลการเลือกตั้งบอร์ดประกันสังคม

Static web (Vue 3 + Vite) แสดงผลการเลือกตั้งคณะกรรมการประกันสังคม จังหวัดสระบุรี
จากข้อมูล CSV ใน `../output/` โดยนำเสนอเป็นอันดับคะแนนที่อ่านง่าย พร้อมมุมมองรายหน่วย

## พัฒนา

```bash
cd web
npm install
npm run build:data   # อ่าน ../output/*.csv -> src/data/results.json
npm run dev          # http://localhost:5173/sso-election/
```

## ทดสอบ / build

```bash
npm test             # unit + integration tests (Vitest)
npm run build        # output ที่ web/dist
npm run preview
```

## ข้อมูล

- แหล่งข้อมูล: `../output/ตัวแทนผู้ประกันตน_คะแนนดิบ.csv`,
  `../output/ตัวแทนนายจ้าง_คะแนนดิบ.csv`, `../output/ข้อมูลหน่วยเลือกตั้ง.csv`
- `output/` ถูก gitignore จึงต้องรัน `npm run build:data` แล้ว commit
  `src/data/results.json` (ไฟล์นี้คือข้อมูลที่เว็บใช้จริง)
- รวมคะแนนด้วย "หมายเลขผู้สมัคร" และเลือกชื่อที่พบบ่อยที่สุดเป็นชื่อหลัก
  (ชดเชยชื่อที่ OCR อ่านเพี้ยน)
- ตัวเลขบางหน่วยอาจผิดปกติได้ เนื่องจากข้อจำกัดการอ่านเอกสารด้วย OCR

## Deploy

Workflow `.github/workflows/deploy.yml` จะ build แล้ว deploy ขึ้น GitHub Pages
เมื่อ push เข้า `main` (ไฟล์ใน `web/`) เปิดใช้ครั้งแรกที่
**Settings → Pages → Build and deployment → Source = GitHub Actions**

เว็บจะอยู่ที่ `https://<owner>.github.io/sso-election/`
(ตั้ง `base: '/sso-election/'` ใน `vite.config.js` ให้ตรงกับชื่อ repo)

## โครงสร้าง

```
web/
  scripts/build-data.mjs   # CSV -> results.json (มี unit test ครอบคุม parser/aggregation)
  src/lib/parse.js         # อ่าน CSV (ตัด BOM)
  src/lib/election.js      # รวมคะแนน/จัดอันดับ/สรุปยอด (pure functions)
  src/components/          # SummaryCards, CandidateList, UnitTable
  src/App.vue              # หน้าเดียว: สรุป + แท็บประเภท + สลับมุมมองภาพรวม/รายหน่วย
  tests/                   # election.spec.js (unit), app.spec.js (integration)
```
