# 🚀 طريقة تشغيل المشروع خطوة بخطوة

## المتطلبات الأساسية

- **Node.js** (v18 أو أحدث) — [تحميل من هنا](https://nodejs.org/)
- **npm** (يجي مع Node.js تلقائياً)

---

## الخطوات

### 1️⃣ فتح Terminal في مجلد المشروع

```bash
cd seat-booking-project
```

### 2️⃣ تثبيت الحزم (Dependencies)

```bash
npm install
```

> ⏱️ هذي الخطوة تاخذ وقت أول مرة (5-8 دقائق تقريباً).
> Prisma Client يتولّد تلقائياً بعد التثبيت عن طريق سكربت `postinstall`.

### 3️⃣ إعداد ملف البيئة `.env`

أنشئ ملف `.env` في المجلد الرئيسي (أو عدّل الموجود):

```env
DATABASE_URL=postgresql://user:password@host:port/db?sslmode=require
```

> 📌 غيّر رابط الاتصال برابط قاعدة بياناتك (Neon / Supabase / أي PostgreSQL).
> ممكن تنسخ من ملف `.env.example` كقالب.

### 4️⃣ مزامنة قاعدة البيانات مع السكيما

```bash
npx prisma db push
```

> هذا الأمر ينشئ الجداول التالية في قاعدة البيانات:
>
> - `User` — المستخدمين
> - `Room` — الغرف
> - `Seat` — المقاعد
> - `Booking` — الحجوزات
> - `Rating` — التقييمات

### 5️⃣ تشغيل المشروع

```bash
npm run dev
```

### 6️⃣ فتح المشروع في المتصفح

```
http://localhost:3000
```

---

## ⚡ أوامر مفيدة إضافية

| الأمر                  | الوظيفة                                      |
| ---------------------- | -------------------------------------------- |
| `npx prisma studio`   | فتح واجهة لإدارة قاعدة البيانات بصرياً        |
| `npx prisma db push`  | مزامنة التغييرات في السكيما مع القاعدة         |
| `npx prisma generate` | إعادة توليد Prisma Client بعد تعديل السكيما   |
| `npm run lint`         | فحص الكود                                     |

---

## 🛠️ حل المشاكل الشائعة

### مشكلة: `'tee' is not recognized`

السكربت الأصلي يستخدم أمر `tee` اللي يشتغل بس على Linux/Mac.

**الحل:** عدّل سكربت `dev` في `package.json`:

```json
"dev": "next dev -p 3000"
```

بدل:

```json
"dev": "next dev -p 3000 2>&1 | tee dev.log"
```

### مشكلة: `prisma is not recognized`

**الحل:** أعد تثبيت الحزم:

```bash
rm -rf node_modules
npm install
```

### مشكلة: خطأ اتصال بقاعدة البيانات

**الحل:** تأكد إن رابط `DATABASE_URL` في ملف `.env` صحيح وإن قاعدة البيانات شغالة.

---

## 📁 هيكل المشروع

```
seat-booking-project/
├── prisma/
│   └── schema.prisma      # سكيما قاعدة البيانات
├── src/
│   └── app/
│       ├── api/            # API Routes (الباك إند)
│       │   ├── bookings/   # حجوزات
│       │   ├── rooms/      # غرف
│       │   ├── seats/      # مقاعد
│       │   ├── ratings/    # تقييمات
│       │   └── users/      # مستخدمين
│       ├── page.tsx        # الصفحة الرئيسية
│       ├── layout.tsx      # التخطيط العام
│       └── globals.css     # الستايل العام
├── .env                    # متغيرات البيئة
├── .env.example            # قالب متغيرات البيئة
├── package.json            # إعدادات المشروع والحزم
└── next.config.ts          # إعدادات Next.js
```
