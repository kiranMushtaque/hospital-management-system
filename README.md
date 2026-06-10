# 🏥 Mayo Administrative Hospital Management System (HMS)

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployment-black?style=flat-square&logo=vercel)](https://hospital-management-system-64ma.vercel.app)
[![Tech Stack](https://img.shields.io/badge/Stack-React_19_%2B_Express-blue?style=flat-square)](https://github.com/kiranMushtaque/hospital-management-system)

A high-performance, modular Clinical ERP system designed for medical facilities in Pakistan. This system handles everything from patient registration to complex clinical operations like IPD/OPD management, Lab Diagnostics, and Billing.

---

## 🚀 Overview

Mayo HMS is a full-stack enterprise resource planning (ERP) solution tailored for hospital administration. It features a bilingual interface (English/Urdu), a robust security model with role-based access control, and a modern dark/light UI.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19 (Vite)
- **Styling:** Tailwind CSS 4.0
- **Animations:** Motion (formerly Framer Motion)
- **Icons:** Lucide React
- **PDF Generation:** @react-pdf/renderer
- **State Management:** TanStack React Query

### Backend
- **Server:** Node.js + Express
- **Runtime:** tsx (Development) / Node (Production)
- **Authentication:** JSON Web Tokens (JWT) + Cookie-parser
- **Security:** Bcryptjs for hashing (Server)
- **External APIs:** Twilio WhatsApp Gateway

---

## 📂 System Modules

| Module | Features |
| :--- | :--- |
| **📊 Dashboard** | Real-time clinical analytics and revenue tracking. |
| **👥 Patient Management** | Registration, MRN generation, and digital clinical files. |
| **🏥 OPD/IPD** | Out-patient consultation and In-patient admission/discharge. |
| **💊 Pharmacy** | Inventory tracking, low stock alerts, and medicine dispensing. |
| **🔬 Lab & Radiology** | Diagnostic order tracking and digital report management. |
| **💰 Billing** | Tax-compliant invoicing (PRA), insurance claims, and receipts. |
| **🎭 OT Management** | Surgery scheduling and pre-op/post-op clinical tracking. |
| **🏢 HR & Settings** | Staff clock-ins, payroll management, and hospital configuration. |

---

## 🔑 Demo Credentials (Authorized Registers)

| Role | Employee ID | Password |
| :--- | :--- | :--- |
| **Super Admin** | `EMP-1010` | `admin123` |
| **Duty Doctor** | `EMP-2020` | `doctor123` |
| **Charge Nurse** | `EMP-3030` | `nurse123` |
| **Lab Technician** | `EMP-4040` | `lab123` |
| **Accounts Cashier**| `EMP-5050` | `cashier123` |

> **Note:** For demo purposes, `admin123` and `doctor123` are accepted as global bypass passwords for any valid User ID.

---

## ⚙️ Environment Variables

The following variables are required for full system functionality:

```env
NODE_ENV=production
JWT_SECRET=mayo-trust-key-2026
JWT_REFRESH_SECRET=mayo-refresh-key-2026

# Local Database (Prisma/Localhost)
DATABASE_URL="mysql://user:pass@host:3306/db"

# Notifications (Twilio)
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

---

## 💻 Local Setup
1. **Clone the repository:**
   git clone https://github.com/kiranMushtaque/hospital-management-system.git
   cd hospital-management-system
2. **Install dependencies:**
   npm install
3. **Database setup:**
   npx prisma generate
   npx prisma db push
4. **Run in development mode:**
   npm run dev
5. **Build for production:**
   npm run build

---

## ☁️ Vercel Deployment

This project is optimized for Vercel using a standalone `api/index.ts` handler to ensure serverless compatibility.

- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **API Handler:** `api/index.ts` (Express serverless)

---

## 🔌 API Routes

### Authentication
- `POST /api/auth/login` - Dual JWT session creation.
- `POST /api/auth/logout` - Session termination and cookie clearing.
- `GET /api/auth/me` - Token validation and user profile retrieval.

### Clinical & Admin
- `GET /api/dashboard/analytics` - System-wide performance stats.
- `GET /api/patients` - Active registry retrieval.
- `GET /api/settings` - Hospital configuration (Name, Address, Tax rates).

---

## ✨ Features

- **🌓 Dual-Theme UI:** Native support for Light and Dark modes.
- **🌍 Multilingual:** Toggle between English and Urdu (اردو) interfaces.
- **🔒 Security:** JWT-based protected routes and HTTP-only cookies.
- **📱 Responsive:** Optimized for desktop and clinical workstations.
- **📄 Audit Trail:** Integrated logging for all administrative actions.

---

## 📁 Project Structure
```text
hospital-management-system/
├── api/
│   └── index.ts
├── src/
│   ├── components/
│   │   ├── BillingManagement.tsx
│   │   ├── Dashboard.tsx
│   │   ├── HRPerformance.tsx
│   │   ├── IPDManagement.tsx
│   │   ├── LabDiagnostics.tsx
│   │   ├── OPDManagement.tsx
│   │   ├── OperationTheater.tsx
│   │   ├── PatientList.tsx
│   │   ├── PatientManagement.tsx
│   │   ├── PatientProfile.tsx
│   │   ├── PatientRegistration.tsx
│   │   ├── PharmacyInventory.tsx
│   │   ├── RadiologyImaging.tsx
│   │   ├── Sidebar.tsx
│   │   └── SystemSettings.tsx
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── billing.service.ts
│   │   ├── ipd.service.ts
│   │   ├── lab.service.ts
│   │   ├── opd.service.ts
│   │   ├── patient.service.ts
│   │   ├── pharmacy.service.ts
│   │   └── whatsapp.service.ts
│   ├── pdf/
│   │   ├── BillingReceipt.tsx
│   │   ├── IPDSummary.tsx
│   │   ├── LabReport.tsx
│   │   └── PatientCard.tsx
│   ├── db/
│   │   └── prisma.ts
│   ├── lib/
│   │   └── logger.ts
│   ├── App.tsx
│   ├── main.tsx
│   ├── types.ts
│   └── utils.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── lib/
│   └── logger.ts
├── .github/
├── data/
├── server.ts
├── vercel.json
├── vite.config.ts
├── tsconfig.json
├── .env.example
└── package.json
```

---
© 2026 Mayo Trust Healthcare Complex. All Rights Reserved.
