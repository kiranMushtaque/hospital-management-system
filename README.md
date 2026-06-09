# Mayo Administrative Hospital Management System (HMS)

A complete, production-ready full-stack Hospital Management Enterprise Resource Planning (ERP) system designed with strict modularity, high security standards, and comprehensive medical data compliance metrics.

---

## 🛠️ Tech Stack & Pillars

- **Frontend Core:** Next.js 14 (App Router) + React 19 + TypeScript + Tailwind CSS
- **Interactions & Micro-Animations:** `motion` (by motion/react)
- **Official Medical Printouts (PDFs):** Custom typeset vectors compiled on-the-fly using `@react-pdf/renderer`
- **Dynamic Chartings:** `recharts` / `d3` analytics dashboards
- **Backend Architecture:** Node.js + Express + Prisma ORM + JWT Session Authorization
- **Database Target:** MySQL relational engine (fully PlanetScale and Cloud SQL compatible)
- **External Notifications Engine:** Twilio WhatsApp Messaging Gateway API
- **Security Protocols:** Failed login lockouts, HTTP-Only Token Cookies, Rate-limiting, and CORS configurations.

---

## 📂 Modular Structure

- `/src/pdf/` - Beautiful clinical vectors layout engines (`BillingReceipt.tsx`, `LabReport.tsx`, `IPDSummary.tsx`, `PatientCard.tsx`)
- `/src/services/` - Typesafe backend transaction handlers (`auth.service.ts`, `patient.service.ts`, `billing.service.ts`, `lab.service.ts`, `pharmacy.service.ts`, `ipd.service.ts`, `opd.service.ts`, `whatsapp.service.ts`)
- `/prisma/` - Database schemas, seeding records, and migrations indexes
- `/lib/logger.ts` - Comprehensive security trace auditor and route error tracker logging to `logs/error.log`

---

## 🔑 Default Credentials (Seeded)

| Name | Role | Employee ID | Default Password |
| :--- | :--- | :--- | :--- |
| **Irfan Qureshi** | Super Admin | `EMP-1010` | `admin123` |
| **Dr. Sadia Malik** | Doctor / Cardiologist | `EMP-2020` | `doctor123` |
| **Dr. Fahad Alvi** | Doctor / Pediatrician | `EMP-3030` | `doctor123` |

---

## 🔌 API Route Endpoints

### 🔒 Authentication System
- `POST /api/auth/login` - Dual JWT session creation (Access Token + HttpOnly Refresh Token Cookie)
- `POST /api/auth/logout` - Blacklists access token; flushes cookies
- `POST /api/auth/refresh-token` - Signs new short-lived access token using valid refresh cookies
- `GET /api/auth/me` - Validates bearer session access and maps the current user profile
- `POST /api/auth/change-password` - Checks strength and updates hashed password secrets

### 📢 WhatsApp Notification Engines (Twilio)
- `POST /api/whatsapp/send-receipt` - Dispatches billing invoice details template
- `POST /api/whatsapp/send-appointment` - Dispatches physician timing slots confirmation
- `POST /api/whatsapp/send-lab-result` - Dispatches atypical observation completion warnings

### 💾 Administrative Utilities
- `GET /api/admin/backup` - Pulls whole relational structure in plain downloadable format

---

## 🚀 Compilation & Deployment Guidelines

### 1. Environment Configurations
Clone `.env.example` into `.env` and fill the variables:
```bash
cp .env.example .env
```

### 2. Database Schema Push & Migration
Synchronize your schema directly onto PlanetScale/MySQL databases:
```bash
npx prisma generate
npx prisma db push
```

### 3. Database Seeding
Execute our mock seed scripts:
```bash
npx prisma db seed
```

### 4. Running the Development Server
```bash
npm run dev
```

### 5. Production Build Compiling
Build frontend static targets and bundle TypeScript backend layers with esbuild:
```bash
npm run build
npm start
```
