/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import { AuthService } from "./src/services/auth.service";
import { WhatsAppService } from "./src/services/whatsapp.service";
import {
  User,
  Patient,
  OPDVisit,
  IPDAdmission,
  Bed,
  Medicine,
  LabTest,
  LabOrder,
  RadiologyOrder,
  OTSchedule,
  HRClock,
  BillingTransaction,
  HospitalSettings,
  AuditLog,
  UserRole,
  WardType,
} from "./src/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(cookieParser());

const PORT = 3000;
const isVercel = process.env.VERCEL === "1" || process.env.NOW_BUILD === "1";
const DB_FILE = isVercel
  ? path.join("/tmp", "hospital_db.json")
  : path.join(__dirname, "data", "hospital_db.json");

// Ensure database directory exists safely without throwing or crashing
try {
  const dbDir = path.dirname(DB_FILE);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
} catch (error) {
  console.warn(
    "⚠️ [Server Start] Database directory creation skipped or failed (un-writable filesystem):",
    error,
  );
}

// Global Relational Database Memory Cache
let db: {
  users: User[];
  patients: Patient[];
  opdVisits: OPDVisit[];
  ipdAdmissions: IPDAdmission[];
  beds: Bed[];
  medicines: Medicine[];
  labTests: LabTest[];
  labOrders: LabOrder[];
  radiologyOrders: RadiologyOrder[];
  otSchedules: OTSchedule[];
  hrClocks: HRClock[];
  billingTransactions: BillingTransaction[];
  settings: HospitalSettings;
  auditLogs: AuditLog[];
} = {
  users: [],
  patients: [],
  opdVisits: [],
  ipdAdmissions: [],
  beds: [],
  medicines: [],
  labTests: [],
  labOrders: [],
  radiologyOrders: [],
  otSchedules: [],
  hrClocks: [],
  billingTransactions: [],
  settings: {
    hospitalName: "Mayo University Care Center & Trust",
    hospitalAddress:
      "Near Neela Gumbad, Anarkali Bazaar, Lahore, Punjab 54000, Pakistan",
    phone: "+92 42 99211100",
    taxRatePercent: 5.0, // Punjab Revenue Authority service tax rate
    whatsappTemplate:
      "Assalam-o-Alaikum {patientName},\nYour payment of Rs. {amount} has been processed at {hospitalName}.\nMRN: {mrn}\nTransaction/Invoice ID: {txnId}\nThank you for choosing Mayo Trust.",
    smsTemplate:
      "Dear Patron, your OPD token is #{token} for Ward {department}. Track live status on our app. Mayo Trust.",
    logoText: "Mayo Care",
  },
  auditLogs: [],
};

// Database persistence helpers
function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (error) {
    console.error("Database Save Failed:", error);
  }
}

function loadDb() {
  // 1. Try to load from writable/runtime state
  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      db = JSON.parse(content);
      // Auto-update database state if old demo version is cached
      if (
        !db.patients ||
        db.patients.length < 10 ||
        !db.users ||
        db.users.length < 6
      ) {
        console.log(
          "Upgrading loaded database structure to match fresh Pakistani high-fidelity demo profiles...",
        );
        seedDb();
      }
      return;
    } catch (error) {
      console.error("Database Parse Failed, trying bundled fallback:", error);
    }
  }

  // 2. Try to fallback to pre-bundled seed state in source bundle
  const bundledDbPath = path.join(__dirname, "data", "hospital_db.json");
  if (fs.existsSync(bundledDbPath)) {
    try {
      const content = fs.readFileSync(bundledDbPath, "utf-8");
      db = JSON.parse(content);
      console.log(
        "✅ Loaded hospital data successfully from bundled database.",
      );

      // Attempt to save to write buffer
      try {
        fs.writeFileSync(DB_FILE, content, "utf-8");
      } catch (_) {}
      return;
    } catch (error) {
      console.error("Bundled Database Parse Failed:", error);
    }
  }

  // 3. Fallback to fresh seed
  seedDb();
}

// High-fidelity Pakistani Context Seed Data
function seedDb() {
  console.log(
    "Seeding Database with clean Pakistani administrative profiles...",
  );

  // Registered Clinicians and Administrators
  db.users = [
    {
      id: "EMP-4040",
      name: "Dr. Mushtaq Khan",
      role: "DOCTOR",
      department: "CARDIOLOGY",
      phone: "0300-1112233",
      email: "doc.mushtaq@mayotrust.pk",
      shift: "MORNING",
      status: "ACTIVE",
      salary: 280000,
      cnic: "35201-8812345-9",
    },
    {
      id: "EMP-4041",
      name: "Dr. Ayesha Naeem",
      role: "DOCTOR",
      department: "MATERNITY",
      phone: "0321-4445566",
      email: "ayesha.n@mayotrust.pk",
      shift: "MORNING",
      status: "ACTIVE",
      salary: 260000,
      cnic: "35202-1234567-2",
    },
    {
      id: "EMP-4042",
      name: "Dr. Haris Jameel",
      role: "DOCTOR",
      department: "GENERAL_OPD",
      phone: "0333-5556677",
      email: "h.jameel@mayotrust.pk",
      shift: "EVENING",
      status: "ACTIVE",
      salary: 190000,
      cnic: "34101-7765432-1",
    },
    {
      id: "EMP-1010",
      name: "Dr. Asif Mayo",
      role: "SUPER_ADMIN",
      department: "ADMINISTRATION",
      phone: "0300-8889900",
      email: "asif.admin@mayotrust.pk",
      shift: "MORNING",
      status: "ACTIVE",
      salary: 350000,
      cnic: "35201-1111111-1",
    },
    {
      id: "EMP-2020",
      name: "Dr. Sadia Malik",
      role: "DOCTOR",
      department: "GENERAL_OPD",
      phone: "0345-2233445",
      email: "sadia.doctor@mayotrust.pk",
      shift: "NIGHT",
      status: "ACTIVE",
      salary: 185000,
      cnic: "35202-9988776-6",
    },
    {
      id: "EMP-3030",
      name: "Qasim Siddiqui",
      role: "CASHIER",
      department: "ACCOUNTS",
      phone: "0322-1234567",
      email: "qasim.cash@mayotrust.pk",
      shift: "MORNING",
      status: "ACTIVE",
      salary: 85000,
      cnic: "35201-3456789-3",
    },
    {
      id: "EMP-5050",
      name: "Yousuf Raza",
      role: "LAB_TECH",
      department: "DIAGNOSTICS",
      phone: "0311-9988776",
      email: "yousuf.lab@mayotrust.pk",
      shift: "EVENING",
      status: "ACTIVE",
      salary: 110000,
      cnic: "35102-1212121-7",
    },
    {
      id: "EMP-6060",
      name: "Sonia Bibi",
      role: "RECEPTIONIST",
      department: "FRONT_DESK",
      phone: "0300-7654321",
      email: "sonia.front@mayotrust.pk",
      shift: "MORNING",
      status: "ACTIVE",
      salary: 65000,
      cnic: "35202-4545454-4",
    },
  ];

  // Core Hospital Bed Assignments
  const wards: WardType[] = ["GENERAL", "PRIVATE", "ICU", "CCU", "MATERNITY"];
  db.beds = [];
  wards.forEach((ward) => {
    let price = 1200; // General
    if (ward === "PRIVATE") price = 8500;
    if (ward === "ICU") price = 15000;
    if (ward === "CCU") price = 18000;
    if (ward === "MATERNITY") price = 5000;

    for (let i = 1; i <= 6; i++) {
      db.beds.push({
        id: `${ward}-${i < 10 ? "0" + i : i}`,
        ward: ward,
        bedNumber: `${i}`,
        status: i === 2 ? "OCCUPIED" : i === 4 ? "MAINTENANCE" : "AVAILABLE",
        dailyCharge: price,
        currentPatientMrn: i === 2 ? "MRN-2026-0001" : undefined,
      });
    }
  });

  // Default Pre-Registered Patients
  db.patients = [
    {
      mrn: "MRN-2026-0001",
      cnic: "35202-8812345-1",
      name: "Muhammad Shahid",
      age: 48,
      gender: "MALE",
      bloodGroup: "B+",
      address: "House 45, Sector Y, DHA Phase 3, Lahore",
      phone: "0300-5551212",
      emergencyContactName: "Rubina Shahid (Wife)",
      emergencyContactPhone: "0301-5551212",
      insuranceProvider: "SEHAT_CARD",
      insurancePolicyNumber: "SC-9988112-LHR",
      photoUrl:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=120&auto=format&fit=crop",
      createdAt: "2026-05-15T10:30:00Z",
    },
    {
      mrn: "MRN-2026-0002",
      cnic: "35404-1234987-2",
      name: "Sajida Parveen",
      age: 32,
      gender: "FEMALE",
      bloodGroup: "O-",
      address: "Mohallah Eidgah, Tehsil Chishtian, Bahawalnagar",
      phone: "0313-9876543",
      emergencyContactName: "Tariq Mahmood (Husband)",
      emergencyContactPhone: "0333-9876543",
      insuranceProvider: "STATE_LIFE",
      insurancePolicyNumber: "SL-88-2339-B",
      photoUrl:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=120&auto=format&fit=crop",
      createdAt: "2026-06-01T14:20:00Z",
    },
    {
      mrn: "MRN-2026-0003",
      cnic: "35201-1122334-3",
      name: "Tariq Mehmood",
      age: 55,
      gender: "MALE",
      bloodGroup: "A+",
      address: "Flat 12-B, Palace Heights, Gulberg III, Lahore",
      phone: "0300-1234567",
      emergencyContactName: "Asim Tariq (Son)",
      emergencyContactPhone: "0321-7654321",
      insuranceProvider: "NONE",
      insurancePolicyNumber: "",
      photoUrl:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=120&auto=format&fit=crop",
      createdAt: "2026-06-02T11:15:00Z",
    },
    {
      mrn: "MRN-2026-0004",
      cnic: "35201-9876543-2",
      name: "Zainab Bibi",
      age: 24,
      gender: "FEMALE",
      bloodGroup: "AB+",
      address: "House 24, Street 3, Gool Bazaar, Samanabad, Lahore",
      phone: "0345-6789012",
      emergencyContactName: "Amjad Ali (Father)",
      emergencyContactPhone: "0300-9876543",
      insuranceProvider: "SEHAT_CARD",
      insurancePolicyNumber: "SC-445582-LHR",
      photoUrl:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=120&auto=format&fit=crop",
      createdAt: "2026-06-03T09:20:00Z",
    },
    {
      mrn: "MRN-2026-0005",
      cnic: "35202-4455667-5",
      name: "Kamran Akmal",
      age: 37,
      gender: "MALE",
      bloodGroup: "O+",
      address: "Sector J, Block C, Johar Town, Lahore",
      phone: "0311-2233445",
      emergencyContactName: "Rashid Akmal (Brother)",
      emergencyContactPhone: "0311-2233446",
      insuranceProvider: "STATE_LIFE",
      insurancePolicyNumber: "SL-99234-A",
      photoUrl:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=120&auto=format&fit=crop",
      createdAt: "2026-06-04T16:45:00Z",
    },
    {
      mrn: "MRN-2026-0006",
      cnic: "35201-2233445-6",
      name: "Bilquis Edhi",
      age: 61,
      gender: "FEMALE",
      bloodGroup: "B-",
      address: "House 102, Block D, Model Town, Lahore",
      phone: "0333-1122334",
      emergencyContactName: "Faisal Edhi (Son)",
      emergencyContactPhone: "0333-1122335",
      insuranceProvider: "NONE",
      insurancePolicyNumber: "",
      photoUrl:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=120&auto=format&fit=crop",
      createdAt: "2026-06-05T08:10:00Z",
    },
    {
      mrn: "MRN-2026-0007",
      cnic: "35202-9988112-7",
      name: "Asad Rasheed",
      age: 29,
      gender: "MALE",
      bloodGroup: "A-",
      address: "House 55, Street 1, Faisal Town, Lahore",
      phone: "0302-3344556",
      emergencyContactName: "Sofia Rasheed (Mother)",
      emergencyContactPhone: "0302-3344557",
      insuranceProvider: "SEHAT_CARD",
      insurancePolicyNumber: "SC-122391-LHR",
      photoUrl:
        "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=120&auto=format&fit=crop",
      createdAt: "2026-06-06T14:35:00Z",
    },
    {
      mrn: "MRN-2026-0008",
      cnic: "42201-1234981-8",
      name: "Farah Naz",
      age: 42,
      gender: "FEMALE",
      bloodGroup: "O+",
      address: "Block 5, Clifton, Karachi",
      phone: "0321-9988776",
      emergencyContactName: "Nawaz Sharif (Husband)",
      emergencyContactPhone: "0321-9988775",
      insuranceProvider: "STATE_LIFE",
      insurancePolicyNumber: "SL-KHI-4819",
      photoUrl:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=120&auto=format&fit=crop",
      createdAt: "2026-06-07T12:00:00Z",
    },
    {
      mrn: "MRN-2026-0009",
      cnic: "35201-2299118-9",
      name: "Haroon Pasha",
      age: 50,
      gender: "MALE",
      bloodGroup: "AB-",
      address: "House 88, Lane 5, Cavalry Ground, Lahore Cantt",
      phone: "0300-8484841",
      emergencyContactName: "Zahid Pasha (Brother)",
      emergencyContactPhone: "0300-8484842",
      insuranceProvider: "NONE",
      insurancePolicyNumber: "",
      photoUrl:
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=120&auto=format&fit=crop",
      createdAt: "2026-06-08T10:45:00Z",
    },
    {
      mrn: "MRN-2026-0010",
      cnic: "35202-3344112-0",
      name: "Saima Kirmani",
      age: 31,
      gender: "FEMALE",
      bloodGroup: "B+",
      address: "House 12, Block F-II, Wapda Town, Lahore",
      phone: "0332-1212123",
      emergencyContactName: "Kashif Kirmani (Husband)",
      emergencyContactPhone: "0332-1212124",
      insuranceProvider: "SEHAT_CARD",
      insurancePolicyNumber: "SC-909022-LHR",
      photoUrl:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=120&auto=format&fit=crop",
      createdAt: "2026-06-09T08:30:00Z",
    },
  ];

  // Active Ward Admissions
  db.ipdAdmissions = [
    {
      id: "IPD-2026-0001",
      patientMrn: "MRN-2026-0001",
      patientName: "Muhammad Shahid",
      ward: "ICU",
      bedId: "ICU-02",
      admittedAt: "2026-06-06T09:00:00Z",
      admittingDoctorId: "EMP-4040",
      admittingDoctorName: "Dr. Mushtaq Khan",
      status: "ADMITTED",
      nurseNotes: [
        {
          time: "2026-06-08T22:00:00Z",
          note: "Patient vitals stable. BP 130/85, Pulse 82. Intravenous fluids running smoothly.",
          nurseName: "Nurse Fatima Batool",
        },
      ],
      doctorVisits: [
        {
          time: "2026-06-08T10:00:00Z",
          notes: "Condition improved post angiography. Keep monitored for 24h.",
          doctorId: "EMP-4040",
          doctorName: "Dr. Mushtaq Khan",
          charge: 2500,
        },
      ],
      totalCalculatedBill: 45000,
    },
  ];

  // System Diagnostics Catalog
  db.labTests = [
    {
      id: "LAB-001",
      name: "Complete Blood Count (CBC)",
      category: "Hematology",
      price: 950,
      normalRange: "Hb: 13-17 g/dL, WBC: 4-11 x10^9/L",
      unit: "Various",
    },
    {
      id: "LAB-002",
      name: "Fasting Blood Sugar (FBS)",
      category: "Biochemistry",
      price: 350,
      normalRange: "70 - 100",
      unit: "mg/dL",
    },
    {
      id: "LAB-003",
      name: "HbA1c (Glycated Hemoglobin)",
      category: "Biochemistry",
      price: 1800,
      normalRange: "Under 5.7%",
      unit: "%",
    },
    {
      id: "LAB-004",
      name: "Serum Creatinine (Kidney Function)",
      category: "Biochemistry",
      price: 600,
      normalRange: "0.6 - 1.2",
      unit: "mg/dL",
    },
    {
      id: "LAB-005",
      name: "Lipid Profile (Cholesterol)",
      category: "Biochemistry",
      price: 2100,
      normalRange: "Cholesterol < 200, LDL < 100",
      unit: "mg/dL",
    },
  ];

  // Lab Workorders
  db.labOrders = [
    {
      id: "ORD-2026-101",
      patientMrn: "MRN-2026-0001",
      patientName: "Muhammad Shahid",
      testId: "LAB-005",
      testName: "Lipid Profile (Cholesterol)",
      requestedByDoctorId: "EMP-4040",
      requestedByDoctorName: "Dr. Mushtaq Khan",
      orderedAt: "2026-06-08T12:00:00Z",
      status: "COMPLETED",
      sampleType: "Blood Plasma",
      resultValue: "Cholesterol: 240 (High), LDL: 162 (High)",
      isCritical: true,
      notes:
        "Severe dyslipidemia detected. Requires aggressive statin therapy.",
      testedAt: "2026-06-08T15:00:00Z",
      labTechId: "EMP-5050",
      labTechName: "Yousuf Raza",
    },
  ];

  // Radiology Scan Tasks
  db.radiologyOrders = [
    {
      id: "RAD-2026-301",
      patientMrn: "MRN-2026-0002",
      patientName: "Sajida Parveen",
      type: "ULTRASOUND",
      instructions: "Pelvic study to verify gestational safety progress.",
      orderedByDoctorId: "EMP-4041",
      orderedByDoctorName: "Dr. Ayesha Naeem",
      orderedAt: "2026-06-09T05:30:00Z",
      status: "COMPLETED",
      findings:
        "Single live intrauterine pregnancy of 14 weeks. Fetal heart rate is 144 bpm. Placenta is anterior and clear.",
      completedAt: "2026-06-09T06:00:00Z",
    },
  ];

  // OT Surgery Schedules
  db.otSchedules = [
    {
      id: "OT-2026-901",
      patientMrn: "MRN-2026-0001",
      patientName: "Muhammad Shahid",
      surgeryName: "Coronary Angioplasty (Single Stent)",
      scheduledAt: "2026-06-12T11:00:00Z",
      durationMinutes: 90,
      team: [
        { role: "Primary Surgeon", staffName: "Dr. Mushtaq Khan" },
        { role: "Assistant", staffName: "Dr. Haris Jameel" },
        { role: "Scrub Nurse", staffName: "Nurse Fatima Batool" },
      ],
      preOpChecklist: {
        consentSigned: true,
        pacCompleted: true,
        fastingOk: true,
        markedSite: true,
      },
      charges: 185000,
      status: "SCHEDULED",
      theaterNumber: "OT-Cardio-01",
    },
  ];

  // Active OPD Visits and Prescription Records
  db.opdVisits = [
    {
      id: "OPD-2026-0010",
      patientMrn: "MRN-2026-0002",
      patientName: "Sajida Parveen",
      tokenNumber: 4,
      doctorId: "EMP-4041",
      doctorName: "Dr. Ayesha Naeem",
      specialty: "Maternity Care",
      visitDate: "2026-06-09T09:15:00Z",
      status: "COMPLETED",
      vitals: {
        bp: "115/75",
        temp: 37.0,
        weight: 64,
        pulse: 78,
        recordedAt: "2026-06-09T09:00:00Z",
      },
      symptoms: "Routine second-trimester review. Mild fatigue.",
      diagnosis:
        "Normal Gestational Progress with minor iron deficiency anemia.",
      prescription: [
        {
          medicineId: "MED-003",
          name: "Fefol Vit capsule (Iron + Folic Acid)",
          dosage: "1-0-0",
          frequency: "After Breakfast",
          duration: "30 Days",
          quantity: 30,
        },
      ],
      billingStatus: "PAID",
      billAmount: 1500,
    },
  ];

  // Pharmacy Medication Stock
  db.medicines = [
    {
      id: "MED-001",
      name: "Panadol 500mg (Paracetamol)",
      genericName: "Paracetamol",
      batchNumber: "B-PN882",
      stockCount: 1200,
      minStockLevel: 200,
      expiryDate: "2028-04-12",
      salePrice: 3,
      supplierName: "GSK Pakistan Ltd",
    },
    {
      id: "MED-002",
      name: "Augmentin DS Suspension 312mg",
      genericName: "Co-Amoxiclav",
      batchNumber: "B-AG401",
      stockCount: 45,
      minStockLevel: 50,
      expiryDate: "2027-01-20",
      salePrice: 280,
      supplierName: "GSK Pakistan Ltd",
    },
    {
      id: "MED-003",
      name: "Fefol-Vit Capsules",
      genericName: "Iron Sulfate + Folic Acid + Vit C",
      batchNumber: "B-FF12",
      stockCount: 450,
      minStockLevel: 100,
      expiryDate: "2026-11-01",
      salePrice: 12,
      supplierName: "GlaxoSmithKline",
    },
    {
      id: "MED-004",
      name: "Lipiget 20mg (Atorvastatin)",
      genericName: "Atorvastatin Calcium",
      batchNumber: "B-LP440",
      stockCount: 60,
      minStockLevel: 100,
      expiryDate: "2026-07-25",
      salePrice: 35,
      supplierName: "Getz Pharma Pakistan",
    },
    {
      id: "MED-005",
      name: "Secnil 1g Sachet",
      genericName: "Secnidazole",
      batchNumber: "B-SN091",
      stockCount: 150,
      minStockLevel: 20,
      expiryDate: "2027-09-14",
      salePrice: 160,
      supplierName: "Abbott Laboratories Pakistan",
    },
  ];

  // Financial Invoices
  db.billingTransactions = [
    {
      id: "INV-2026-0001",
      patientMrn: "MRN-2026-0002",
      patientName: "Sajida Parveen",
      module: "OPD",
      subtotal: 1500,
      discountApprovedAmount: 200,
      discountReason: "Zakat Welfare Fund Contribution",
      taxAmount: 65,
      netBill: 1365,
      insuranceClaimProvider: "NONE",
      insuranceClaimAmount: 0,
      amountPaidByPatient: 1365,
      paymentMethod: "CASH",
      paymentStatus: "PAID",
      createdByStaffId: "EMP-3030",
      createdByStaffName: "Qasim Siddiqui",
      createdAt: "2026-06-09T09:30:00Z",
      items: [
        {
          description: "OPD Consultation Gynaecology Token #4",
          qty: 1,
          price: 1500,
        },
      ],
    },
    {
      id: "INV-2026-0002",
      patientMrn: "MRN-2026-0001",
      patientName: "Muhammad Shahid",
      module: "LAB",
      subtotal: 2100,
      discountApprovedAmount: 0,
      taxAmount: 105,
      netBill: 2205,
      insuranceClaimProvider: "SEHAT_CARD",
      insuranceClaimAmount: 2205,
      amountPaidByPatient: 0,
      paymentMethod: "BANK_TRANSFER",
      paymentStatus: "PAID",
      createdByStaffId: "EMP-3030",
      createdByStaffName: "Qasim Siddiqui",
      createdAt: "2026-06-08T15:30:00Z",
      items: [
        { description: "Lipid Profile test LAB-005", qty: 1, price: 2100 },
      ],
    },
  ];

  // Clock Attendance history
  db.hrClocks = [
    {
      id: "CLK-101",
      staffId: "EMP-4040",
      staffName: "Dr. Mushtaq Khan",
      role: "DOCTOR",
      date: "09-06-2026",
      clockIn: "08:14",
      status: "PRESENT",
    },
    {
      id: "CLK-102",
      staffId: "EMP-1010",
      staffName: "Irfan Qureshi",
      role: "SUPER_ADMIN",
      date: "09-06-2026",
      clockIn: "07:55",
      status: "PRESENT",
    },
    {
      id: "CLK-103",
      staffId: "EMP-2020",
      staffName: "Nurse Fatima Batool",
      role: "NURSE",
      date: "09-06-2026",
      clockIn: "19:50",
      status: "PRESENT",
    },
  ];

  // System Audit Trail
  db.auditLogs = [
    {
      id: "LOG-0001",
      timestamp: "2026-06-09T05:00:00Z",
      staffId: "EMP-1010",
      staffName: "Irfan Qureshi",
      role: "SUPER_ADMIN",
      action: "BOOT_SYSTEM",
      ipAddress: "127.0.0.1",
      details:
        "Hospital Management Database core models synchronized and seeded successfully.",
    },
  ];

  saveDb();
}

// Initialize database
loadDb();

// Audit log helper
function addAuditLog(
  staffId: string,
  action: string,
  details: string,
  req: express.Request,
) {
  const staff = db.users.find((u) => u.id === staffId) || {
    name: "System",
    role: "SUPER_ADMIN" as UserRole,
  };
  const log: AuditLog = {
    id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    staffId: staffId || "SYSTEM",
    staffName: staff.name,
    role: staff.role,
    action: action,
    ipAddress: req.ip || "127.0.0.1",
    details: details,
  };
  db.auditLogs.unshift(log);
  saveDb();
}

// APP API ENDPOINTS

// 1. Auth System Endpoints
app.post("/api/auth/login", async (req, res) => {
  const { employeeId, password } = req.body;

  if (!employeeId || !password) {
    return res
      .status(400)
      .json({ error: "Please provide both Employee ID and password." });
  }

  try {
    const authResult = await AuthService.authenticateUser(
      employeeId,
      password,
      req.ip,
    );

    // Save refresh token in HttpOnly cookie (7 Days)
    res.cookie("refreshToken", authResult.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 Days
    });

    // Handle audit logging for trace records
    addAuditLog(
      authResult.user.id,
      "LOGIN_SUCCESS",
      `Authorized as ${authResult.user.role} with JWT cookies setup.`,
      req,
    );

    return res.json({
      success: true,
      accessToken: authResult.accessToken,
      user: authResult.user,
    });
  } catch (err: any) {
    return res.status(401).json({ error: err.message });
  }
});

app.post("/api/auth/logout", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (token) {
    AuthService.blacklistToken(token);
  }
  res.clearCookie("refreshToken");
  res.json({ success: true, message: "Logged out successfully." });
});

app.post("/api/auth/refresh-token", async (req, res) => {
  const refCookie = req.cookies.refreshToken;
  if (!refCookie) {
    return res.status(401).json({ error: "Refresh token cookie missing." });
  }

  try {
    const payload = AuthService.verifyRefreshToken(refCookie);
    const userObj = db.users.find(
      (u) => u.id === payload.employeeId || u.id === payload.userId,
    ) || {
      id: payload.userId,
      name: payload.name || "Default Staff",
      role: payload.role || "SUPER_ADMIN",
    };

    // Sign new access token
    const jwt = (await import("jsonwebtoken")).default;
    const isProd = process.env.NODE_ENV === "production";
    const accessToken = jwt.sign(
      {
        userId: userObj.id,
        employeeId: userObj.id,
        role: userObj.role,
        name: userObj.name,
      },
      process.env.JWT_SECRET || "mayo-trust-clinical-erp-super-secure-key-2026",
      { expiresIn: "15m" },
    );

    return res.json({ success: true, accessToken });
  } catch (err: any) {
    return res.status(401).json({ error: "Refresh token expired or invalid." });
  }
});

app.get("/api/auth/me", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Access token missing." });
  }

  try {
    const decoded = AuthService.verifyAccessToken(token);
    const fullUser = db.users.find((u) => u.id === decoded.userId) || {
      id: decoded.userId,
      employeeId: decoded.employeeId,
      name: decoded.name,
      role: decoded.role,
      department: "GENERAL",
      shift: "MORNING",
    };
    return res.json({ user: fullUser });
  } catch (err: any) {
    return res
      .status(401)
      .json({ error: "Access token invalidated or expired." });
  }
});

app.post("/api/auth/change-password", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Authorization token required." });
  }

  const { newPassword, staffId } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return res
      .status(400)
      .json({
        error: "Password must be at least 6 characters with secure length.",
      });
  }

  try {
    const decoded = AuthService.verifyAccessToken(token);
    const userToUpdate = db.users.find((u) => u.id === decoded.userId);

    if (userToUpdate) {
      const bcrypt = (await import("bcryptjs")).default;
      userToUpdate.passwordHash = await bcrypt.hash(newPassword, 12);
      saveDb();
      addAuditLog(
        decoded.userId,
        "PASSWORD_MUTATION",
        `Re-keyed authorization password securely.`,
        req,
      );
      return res.json({
        success: true,
        message: "Password updated successfully.",
      });
    }
    return res.status(404).json({ error: "User mapping not found." });
  } catch (err: any) {
    return res.status(401).json({ error: "Token expired or invalid." });
  }
});

// WhatsApp Dispatch Gateways
app.post("/api/whatsapp/send-receipt", async (req, res) => {
  const { phone, patientName, billNo, services, total, paid, balance } =
    req.body;
  try {
    const result = await WhatsAppService.sendWhatsApp(phone, "RECEIPT", {
      patientName,
      hospitalName: db.settings.hospitalName,
      billNo,
      date: new Date().toLocaleDateString("en-GB"),
      services,
      total: String(total),
      paid: String(paid),
      balance: String(balance),
      phone: db.settings.phone,
    });
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/whatsapp/send-appointment", async (req, res) => {
  const { phone, patientName, doctorName, date, time, department } = req.body;
  try {
    const result = await WhatsAppService.sendWhatsApp(phone, "APPOINTMENT", {
      patientName,
      doctorName,
      date,
      time,
      department,
      hospitalName: db.settings.hospitalName,
      phone: db.settings.phone,
    });
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/whatsapp/send-lab-result", async (req, res) => {
  const { phone, patientName, testName, date } = req.body;
  try {
    const result = await WhatsAppService.sendWhatsApp(phone, "LAB_RESULT", {
      patientName,
      testName,
      date,
      hospitalName: db.settings.hospitalName,
      phone: db.settings.phone,
    });
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/whatsapp/history", (req, res) => {
  res.json(WhatsAppService.getHistory());
});

// Admin Database Backup Backup Utility
app.get("/api/admin/backup", (req, res) => {
  // Return whole structure formatted inside an elegant downloadable file
  res.setHeader("Content-Type", "application/json");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=MayoHMS_Backup_${Date.now()}.json`,
  );
  res.send(JSON.stringify(db, null, 2));
});

app.get("/api/audit-logs", (req, res) => {
  res.json(db.auditLogs);
});

app.post("/api/audit", (req, res) => {
  const { action, details, staffId } = req.body;
  addAuditLog(
    staffId || "SYSTEM",
    action || "SYSTEM_EVENT",
    details || "",
    req,
  );
  res.json({ success: true });
});

// 2. Patient Registration Endpoints
app.get("/api/patients/mrn/generate", (req, res) => {
  const year = new Date().getFullYear();
  // Find highest index for the current year
  const prefix = `MRN-${year}-`;
  const matchingPatients = db.patients.filter((p) => p.mrn.startsWith(prefix));
  let nextNum = 1;
  if (matchingPatients.length > 0) {
    const numbers = matchingPatients.map((p) => {
      const parts = p.mrn.split("-");
      const numPart = parseInt(parts[2], 10);
      return isNaN(numPart) ? 0 : numPart;
    });
    nextNum = Math.max(...numbers) + 1;
  } else {
    nextNum = db.patients.length + 1;
  }
  const nextMrn = `MRN-${year}-${nextNum.toString().padStart(4, "0")}`;
  res.json({ mrn: nextMrn });
});

app.get("/api/patients", (req, res) => {
  const { query } = req.query;
  // Filter active (non-soft-deleted) patients
  let activePatients = db.patients.filter((p) => !p.deletedAt);

  if (query) {
    const q = String(query).toLowerCase();
    activePatients = activePatients.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.fullNameUrdu && p.fullNameUrdu.toLowerCase().includes(q)) ||
        p.mrn.toLowerCase().includes(q) ||
        (p.cnic && p.cnic.includes(q)) ||
        (p.phone && p.phone.includes(q)),
    );
  }
  res.json(activePatients);
});

app.get("/api/patients/:mrn", (req, res) => {
  const { mrn } = req.params;
  const patient = db.patients.find((p) => p.mrn === mrn && !p.deletedAt);
  if (!patient) {
    return res.status(404).json({ error: "Patient not found or archived" });
  }
  res.json(patient);
});

app.post("/api/patients", (req, res) => {
  const {
    name,
    fullNameUrdu,
    fatherName,
    dateOfBirth,
    age,
    gender,
    bloodGroup,
    address,
    phone,
    whatsapp,
    email,
    city,
    province,
    emergencyContactName,
    emergencyContactPhone,
    emergencyRelation,
    insuranceProvider,
    insurancePolicyNumber,
    insuranceCompany,
    photoUrl,
    staffId,
    cnic,
  } = req.body;

  const resolvedCnic = cnic || req.body.cnic;
  if (!name || !age || !gender || !bloodGroup || !phone || !resolvedCnic) {
    return res
      .status(400)
      .json({
        error:
          "Required fields are missing. Make sure to complete demographics.",
      });
  }

  // Auto-generate MRN
  const year = new Date().getFullYear();
  const prefix = `MRN-${year}-`;
  const matchingPatients = db.patients.filter((p) => p.mrn.startsWith(prefix));
  let nextNum = 1;
  if (matchingPatients.length > 0) {
    const numbers = matchingPatients.map((p) => {
      const parts = p.mrn.split("-");
      const numPart = parseInt(parts[2], 10);
      return isNaN(numPart) ? 0 : numPart;
    });
    nextNum = Math.max(...numbers) + 1;
  } else {
    nextNum = db.patients.length + 1;
  }
  const mrn = `MRN-${year}-${nextNum.toString().padStart(4, "0")}`;

  const newPatient: any = {
    mrn,
    cnic: resolvedCnic,
    name,
    fullNameUrdu: fullNameUrdu || "",
    fatherName: fatherName || "",
    dateOfBirth: dateOfBirth || "",
    age: Number(age),
    gender,
    bloodGroup,
    address: address || "Not provided",
    phone,
    whatsapp: whatsapp || phone,
    email: email || "",
    city: city || "Lahore",
    province: province || "Punjab",
    emergencyContactName: emergencyContactName || "Not provided",
    emergencyContactPhone: emergencyContactPhone || "Not provided",
    emergencyRelation: emergencyRelation || "",
    insuranceProvider: insuranceProvider || "NONE",
    insurancePolicyNumber: insurancePolicyNumber || "",
    insuranceCompany: insuranceCompany || "",
    photoUrl:
      photoUrl ||
      `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=120&auto=format&fit=crop`,
    createdAt: new Date().toISOString(),
    qrCode: `HMS-PATIENT-CARD:${mrn}`,
  };

  db.patients.unshift(newPatient);
  saveDb();

  addAuditLog(
    staffId || "SYSTEM",
    "PATIENT_REGISTER",
    `Registered new patient ${name} successfully with MRN ${mrn}`,
    req,
  );

  res.status(201).json(newPatient);
});

app.put("/api/patients/:mrn", (req, res) => {
  const { mrn } = req.params;
  const index = db.patients.findIndex((p) => p.mrn === mrn);
  if (index === -1) {
    return res.status(404).json({ error: "Patient not found" });
  }

  const existing = db.patients[index];
  const {
    name,
    fullNameUrdu,
    fatherName,
    dateOfBirth,
    age,
    gender,
    bloodGroup,
    address,
    phone,
    whatsapp,
    email,
    city,
    province,
    emergencyContactName,
    emergencyContactPhone,
    emergencyRelation,
    insuranceProvider,
    insurancePolicyNumber,
    insuranceCompany,
    photoUrl,
  } = req.body;

  const updatedPatient = {
    ...existing,
    name: name || existing.name,
    fullNameUrdu:
      fullNameUrdu !== undefined
        ? fullNameUrdu
        : (existing as any).fullNameUrdu,
    fatherName:
      fatherName !== undefined ? fatherName : (existing as any).fatherName,
    dateOfBirth:
      dateOfBirth !== undefined ? dateOfBirth : (existing as any).dateOfBirth,
    age: age !== undefined ? Number(age) : existing.age,
    gender: gender || existing.gender,
    bloodGroup: bloodGroup || existing.bloodGroup,
    address: address || existing.address,
    phone: phone || existing.phone,
    whatsapp: whatsapp !== undefined ? whatsapp : (existing as any).whatsapp,
    email: email !== undefined ? email : (existing as any).email,
    city: city !== undefined ? city : (existing as any).city,
    province: province !== undefined ? province : (existing as any).province,
    emergencyContactName: emergencyContactName || existing.emergencyContactName,
    emergencyContactPhone:
      emergencyContactPhone || existing.emergencyContactPhone,
    emergencyRelation:
      emergencyRelation !== undefined
        ? emergencyRelation
        : (existing as any).emergencyRelation,
    insuranceProvider: insuranceProvider || existing.insuranceProvider,
    insurancePolicyNumber:
      insurancePolicyNumber || existing.insurancePolicyNumber,
    insuranceCompany:
      insuranceCompany !== undefined
        ? insuranceCompany
        : (existing as any).insuranceCompany,
    photoUrl: photoUrl || existing.photoUrl,
    updatedAt: new Date().toISOString(),
  };

  db.patients[index] = updatedPatient;
  saveDb();

  addAuditLog(
    req.body.staffId || "SYSTEM",
    "PATIENT_UPDATE",
    `Updated patient coordinates for ${mrn}`,
    req,
  );
  res.json(updatedPatient);
});

app.delete("/api/patients/:mrn", (req, res) => {
  const { mrn } = req.params;
  const index = db.patients.findIndex((p) => p.mrn === mrn);
  if (index === -1) {
    return res.status(440).status(404).json({ error: "Patient not found" });
  }

  // Soft delete setting deletedAt
  db.patients[index].deletedAt = new Date().toISOString();
  saveDb();

  addAuditLog(
    "SYSTEM",
    "PATIENT_ARCHIVE",
    `Soft deleted / Archived patient MRN ${mrn}`,
    req,
  );
  res.json({ success: true, mrn });
});

app.post("/api/patients/search", (req, res) => {
  const { query } = req.body;
  let activePatients = db.patients.filter((p) => !p.deletedAt);
  if (query) {
    const q = String(query).toLowerCase();
    activePatients = activePatients.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.fullNameUrdu && p.fullNameUrdu.toLowerCase().includes(q)) ||
        p.mrn.toLowerCase().includes(q) ||
        (p.cnic && p.cnic.includes(q)) ||
        (p.phone && p.phone.includes(q)),
    );
  }
  res.json(activePatients);
});

// 3. OPD Queue & Operations
app.get("/api/opd/visits", (req, res) => {
  res.json(db.opdVisits);
});

app.post("/api/opd/visits", (req, res) => {
  const {
    patientMrn,
    doctorId,
    symptoms,
    symptomsText,
    staffId,
    billAmount,
    specialty,
  } = req.body;
  const patient = db.patients.find((p) => p.mrn === patientMrn);
  const doctor = db.users.find((u) => u.id === doctorId);

  if (!patient || !doctor) {
    return res
      .status(400)
      .json({ error: "Invalid patient MRN or Doctor ID selected." });
  }

  const tokenNumber =
    db.opdVisits.filter(
      (v) =>
        v.doctorId === doctorId &&
        v.visitDate.startsWith(new Date().toISOString().split("T")[0]),
    ).length + 1;

  const newVisit: OPDVisit = {
    id: `OPD-${Date.now().toString().slice(-6)}`,
    patientMrn,
    patientName: patient.name,
    tokenNumber,
    doctorId,
    doctorName: doctor.name,
    specialty: specialty || doctor.department,
    visitDate: new Date().toISOString(),
    status: "WAITING",
    symptoms: symptoms || symptomsText || "General checkup and review",
    diagnosis: "",
    prescription: [],
    billingStatus: billAmount ? "PENDING" : "PAID",
    billAmount: billAmount || 1500,
  };

  db.opdVisits.unshift(newVisit);
  saveDb();

  addAuditLog(
    staffId || "SYSTEM",
    "OPD_SCHEDULE",
    `Issued Token #${tokenNumber} for patient ${patient.name} under ${doctor.name}`,
    req,
  );

  res.status(201).json(newVisit);
});

app.put("/api/opd/visits/:id", (req, res) => {
  const { id } = req.params;
  const {
    status,
    bp,
    temp,
    weight,
    pulse,
    diagnosis,
    prescription,
    referralDepartment,
    staffId,
  } = req.body;

  const visit = db.opdVisits.find((v) => v.id === id);
  if (!visit) {
    return res.status(404).json({ error: "Consultation visit not found" });
  }

  if (status) visit.status = status;
  if (diagnosis !== undefined) visit.diagnosis = diagnosis;
  if (prescription !== undefined) visit.prescription = prescription;
  if (referralDepartment !== undefined) {
    visit.referralDepartment = referralDepartment;
    visit.referredAt = new Date().toISOString();
  }

  if (bp || temp || weight || pulse) {
    visit.vitals = {
      bp: bp || visit.vitals?.bp || "120/80",
      temp: Number(temp) || visit.vitals?.temp || 37.0,
      weight: Number(weight) || visit.vitals?.weight || 70,
      pulse: Number(pulse) || visit.vitals?.pulse || 75,
      recordedAt: new Date().toISOString(),
    };
  }

  saveDb();
  addAuditLog(
    staffId || "SYSTEM",
    "OPD_UPDATE_CLINICAL",
    `Updated health chart of ${visit.patientName} (Token #${visit.tokenNumber})`,
    req,
  );
  res.json(visit);
});

// 4. IPD Modules
app.get("/api/ipd/beds", (req, res) => {
  res.json(db.beds);
});

app.get("/api/ipd/admissions", (req, res) => {
  res.json(db.ipdAdmissions);
});

app.post("/api/ipd/admissions", (req, res) => {
  const { patientMrn, bedId, admittingDoctorId, staffId } = req.body;
  const patient = db.patients.find((p) => p.mrn === patientMrn);
  const bed = db.beds.find((b) => b.id === bedId);
  const doctor = db.users.find((u) => u.id === admittingDoctorId);

  if (!patient || !bed || !doctor) {
    return res
      .status(400)
      .json({ error: "Invalid patient, bed code, or clinician ID entered." });
  }

  if (bed.status !== "AVAILABLE") {
    return res
      .status(400)
      .json({
        error:
          "The chosen bed is currently occupied or undergoing maintenance.",
      });
  }

  // Update Bed State
  bed.status = "OCCUPIED";
  bed.currentPatientMrn = patientMrn;

  const admissionId = `IPD-${Date.now().toString().slice(-6)}`;
  const newAdmission: IPDAdmission = {
    id: admissionId,
    patientMrn,
    patientName: patient.name,
    ward: bed.ward,
    bedId: bedId,
    admittedAt: new Date().toISOString(),
    admittingDoctorId,
    admittingDoctorName: doctor.name,
    status: "ADMITTED",
    nurseNotes: [],
    doctorVisits: [],
    totalCalculatedBill: bed.dailyCharge, // Initial daily flat rate
  };

  db.ipdAdmissions.unshift(newAdmission);
  saveDb();

  addAuditLog(
    staffId || "SYSTEM",
    "IPD_ADMISSION",
    `Admitted ${patient.name} to Bed ${bedId} in ward ${bed.ward}`,
    req,
  );

  res.status(201).json(newAdmission);
});

app.put("/api/ipd/admissions/:id", (req, res) => {
  const { id } = req.params;
  const {
    action,
    note,
    diagnosis,
    treatmentGiven,
    followUpInstructions,
    dischargeMedication,
    doctorId,
    notes,
    charge,
    staffId,
  } = req.body;

  const admission = db.ipdAdmissions.find((a) => a.id === id);
  if (!admission) {
    return res.status(404).json({ error: "IPD Admission file not found" });
  }

  if (action === "NURSE_NOTE") {
    admission.nurseNotes.push({
      time: new Date().toISOString(),
      note: note || "Routine vitals recorded and oral medications distributed.",
      nurseName: db.users.find((u) => u.id === staffId)?.name || "Duty Nurse",
    });
  } else if (action === "DOCTOR_VISIT") {
    const doc = db.users.find((u) => u.id === doctorId) || {
      name: "Consultant Physician",
    };
    const visitCharge = Number(charge) || 1500;
    admission.doctorVisits.push({
      time: new Date().toISOString(),
      notes:
        notes || "Systemic review completed. Patient shows active recovery.",
      doctorId: doctorId || "EMP-4040",
      doctorName: doc.name,
      charge: visitCharge,
    });
    admission.totalCalculatedBill += visitCharge;
  } else if (action === "DISCHARGE") {
    admission.status = "DISCHARGED";
    admission.dischargedAt = new Date().toISOString();

    const bed = db.beds.find((b) => b.id === admission.bedId);
    if (bed) {
      bed.status = "AVAILABLE";
      bed.currentPatientMrn = undefined;
    }

    admission.dischargeSummary = {
      diagnosis: diagnosis || "Acute Coronary Syndromes (Ameliorated)",
      treatmentGiven:
        treatmentGiven ||
        "Double stent therapeutic angioplasty, active beta-blocker routines.",
      followUpInstructions:
        followUpInstructions ||
        "Complete cardiac rest for 14 days. Avoid high sodium diets.",
      dischargeMedication: dischargeMedication || [],
    };

    // Calculate final billing breakdown
    const diffTime = Math.abs(
      new Date(admission.dischargedAt).getTime() -
        new Date(admission.admittedAt).getTime(),
    );
    const days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    const bedCharge = (bed?.dailyCharge || 1200) * days;
    admission.totalCalculatedBill += bedCharge;
  }

  saveDb();
  addAuditLog(
    staffId || "SYSTEM",
    "IPD_MODIFY",
    `Updated admission chart for ${admission.patientName} (Action: ${action})`,
    req,
  );
  res.json(admission);
});

// 5. Billing Operations
app.get("/api/billing/transactions", (req, res) => {
  res.json(db.billingTransactions);
});

app.post("/api/billing/transactions", (req, res) => {
  const {
    patientMrn,
    module,
    subtotal,
    discountApprovedAmount,
    discountReason,
    taxAmount,
    netBill,
    insuranceClaimProvider,
    insuranceClaimAmount,
    amountPaidByPatient,
    paymentMethod,
    items,
    staffId,
  } = req.body;

  if (!patientMrn || !subtotal || !items || items.length === 0) {
    return res
      .status(400)
      .json({ error: "Required transaction detail parameters are missing." });
  }

  const patient = db.patients.find((p) => p.mrn === patientMrn) || {
    name: "Walk-in Patron",
  };
  const staff = db.users.find((u) => u.id === staffId) || {
    name: "Accounts Counter Cashier",
  };

  const invoiceId = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const newTxn: BillingTransaction = {
    id: invoiceId,
    patientMrn,
    patientName: patient.name,
    module: module || "OPD",
    subtotal: Number(subtotal),
    discountApprovedAmount: Number(discountApprovedAmount) || 0,
    discountReason: discountReason || "",
    taxAmount: Number(taxAmount) || 0,
    netBill: Number(netBill),
    insuranceClaimProvider: insuranceClaimProvider || "NONE",
    insuranceClaimAmount: Number(insuranceClaimAmount) || 0,
    amountPaidByPatient: Number(amountPaidByPatient) || Number(netBill),
    paymentMethod: paymentMethod || "CASH",
    paymentStatus:
      Number(amountPaidByPatient) >= Number(netBill) ? "PAID" : "PARTIAL",
    createdByStaffId: staffId || "SYSTEM",
    createdByStaffName: staff.name,
    createdAt: new Date().toISOString(),
    items: items,
  };

  db.billingTransactions.unshift(newTxn);

  // If this was an OPD ticket billing, mark the associated token paid
  if (module === "OPD") {
    const matchingOPD = db.opdVisits.find(
      (v) => v.patientMrn === patientMrn && v.billingStatus === "PENDING",
    );
    if (matchingOPD) matchingOPD.billingStatus = "PAID";
  }

  saveDb();
  addAuditLog(
    staffId || "SYSTEM",
    "GENERATE_INVOICE",
    `Generated transaction invoice ${invoiceId} for ${patient.name} - net Rs. ${netBill}`,
    req,
  );

  res.status(201).json(newTxn);
});

app.post("/api/billing/whatsapp", (req, res) => {
  const { txnId, phone, patientName, amount, mrn } = req.body;

  // Format template simulation
  let text = db.settings.whatsappTemplate;
  text = text
    .replace("{patientName}", patientName || "Valued Patron")
    .replace("{amount}", amount || "0")
    .replace("{hospitalName}", db.settings.hospitalName)
    .replace("{mrn}", mrn || "N/A")
    .replace("{txnId}", txnId || "N/A");

  // In standard testing setups, we log the SMS dispatcher directly to logs
  console.log(
    `[SIMULATED WHATSAPP DISPATCH] To Phone: ${phone || "Patient Mobile"} -> Text:\n${text}`,
  );

  addAuditLog(
    "SYSTEM",
    "WHATSAPP_RECEIPT",
    `Dispatched billing WhatsApp receipt for invoice ${txnId} to patient ${patientName}.`,
    req,
  );
  res.json({
    success: true,
    message: "WhatsApp receipt template dispatched successfully!",
    text,
  });
});

// 6. Diagnostics Laboratory Endpoints
app.get("/api/lab/tests", (req, res) => {
  res.json(db.labTests);
});

app.get("/api/lab/orders", (req, res) => {
  res.json(db.labOrders);
});

app.post("/api/lab/orders", (req, res) => {
  const { patientMrn, testId, doctorId, staffId } = req.body;
  const patient = db.patients.find((p) => p.mrn === patientMrn);
  const test = db.labTests.find((t) => t.id === testId);
  const doctor = db.users.find((u) => u.id === doctorId) || {
    name: "OPD Specialist",
  };

  if (!patient || !test) {
    return res
      .status(400)
      .json({ error: "Missing or invalid patient MRN or test code." });
  }

  const orderId = `LAB-ORD-${Date.now().toString().slice(-5)}`;
  const newOrder: LabOrder = {
    id: orderId,
    patientMrn,
    patientName: patient.name,
    testId,
    testName: test.name,
    requestedByDoctorId: doctorId || "EMP-4040",
    requestedByDoctorName: doctor.name,
    orderedAt: new Date().toISOString(),
    status: "ORDERED",
    sampleType: test.category === "Hematology" ? "Whole Blood" : "Blood Serum",
  };

  db.labOrders.unshift(newOrder);
  saveDb();

  addAuditLog(
    staffId || "SYSTEM",
    "ORDER_LAB_TEST",
    `Placed lab diagnostical order for ${patient.name} - Test: ${test.name}`,
    req,
  );

  res.status(201).json(newOrder);
});

app.put("/api/lab/orders/:id", (req, res) => {
  const { id } = req.params;
  const { status, resultValue, isCritical, notes, staffId } = req.body;

  const order = db.labOrders.find((o) => o.id === id);
  if (!order) {
    return res.status(404).json({ error: "Lab tracking ticket not found" });
  }

  const tech = db.users.find((u) => u.id === staffId) || {
    name: "Lead Lab Diagnostician",
  };

  if (status) order.status = status;
  if (resultValue !== undefined) order.resultValue = resultValue;
  if (isCritical !== undefined) order.isCritical = isCritical;
  if (notes !== undefined) order.notes = notes;

  if (status === "COMPLETED") {
    order.testedAt = new Date().toISOString();
    order.labTechId = staffId || "EMP-5050";
    order.labTechName = tech.name;
  }

  saveDb();
  addAuditLog(
    staffId || "SYSTEM",
    "LAB_UPDATE_REPORT",
    `Recorded diagnostical results for order card ${order.id}`,
    req,
  );

  res.json(order);
});

// 7. Pharmaceutical Inventories
app.get("/api/pharmacy/medicines", (req, res) => {
  res.json(db.medicines);
});

app.post("/api/pharmacy/dispense", (req, res) => {
  const { medicineId, qty, patientName, staffId } = req.body;
  const medicine = db.medicines.find((m) => m.id === medicineId);

  if (!medicine) {
    return res.status(404).json({ error: "Medicine SKU not found" });
  }

  if (medicine.stockCount < Number(qty)) {
    return res
      .status(400)
      .json({
        error: `Insufficient pharmacy inventory. Only ${medicine.stockCount} units available.`,
      });
  }

  medicine.stockCount -= Number(qty);
  saveDb();

  addAuditLog(
    staffId || "SYSTEM",
    "DISPENSE_PHARMACY",
    `Dispensed ${qty} units of ${medicine.name} for Patient ${patientName || "Ad-Hoc"}`,
    req,
  );

  res.json({ success: true, remainingStock: medicine.stockCount });
});

app.post("/api/pharmacy/purchase-order", (req, res) => {
  const { medicineId, addedQty, supplierName, staffId } = req.body;
  const medicine = db.medicines.find((m) => m.id === medicineId);

  if (!medicine) {
    return res.status(440).json({ error: "Medicine SKU not found" });
  }

  medicine.stockCount += Number(addedQty);
  if (supplierName) medicine.supplierName = supplierName;
  saveDb();

  addAuditLog(
    staffId || "SYSTEM",
    "REPLENISH_PHARMACY",
    `Replenished medicine ${medicine.name} (+${addedQty} units)`,
    req,
  );
  res.json({ success: true, updatedStockCount: medicine.stockCount });
});

// 8. Radiology Imaging
app.get("/api/radiology/orders", (req, res) => {
  res.json(db.radiologyOrders);
});

app.post("/api/radiology/orders", (req, res) => {
  const { patientMrn, type, instructions, doctorId, staffId } = req.body;
  const patient = db.patients.find((p) => p.mrn === patientMrn);
  const doctor = db.users.find((u) => u.id === doctorId) || {
    name: "Referral Clinician",
  };

  if (!patient || !type) {
    return res
      .status(400)
      .json({ error: "Missing patient MRN or radiology study category." });
  }

  const orderId = `RAD-${Date.now().toString().slice(-5)}`;
  const newOrder: RadiologyOrder = {
    id: orderId,
    patientMrn,
    patientName: patient.name,
    type,
    instructions: instructions || "Standard visual study ordered",
    orderedByDoctorId: doctorId || "EMP-4040",
    orderedByDoctorName: doctor.name,
    orderedAt: new Date().toISOString(),
    status: "PENDING",
  };

  db.radiologyOrders.unshift(newOrder);
  saveDb();

  addAuditLog(
    staffId || "SYSTEM",
    "ORDER_RADIOLOGY",
    `Created ${type} clinical scan request for ${patient.name}`,
    req,
  );

  res.status(201).json(newOrder);
});

app.put("/api/radiology/orders/:id", (req, res) => {
  const { id } = req.params;
  const { findings, imageUrl, staffId } = req.body;

  const order = db.radiologyOrders.find((r) => r.id === id);
  if (!order) {
    return res.status(404).json({ error: "Radiology order file not found." });
  }

  order.status = "COMPLETED";
  order.findings =
    findings || "Anatomical elements fall within physiological parameters.";
  order.imageUrl =
    imageUrl ||
    "https://images.unsplash.com/photo-1559757175-5700dde675bc?q=80&w=140&auto=format&fit=crop";
  order.completedAt = new Date().toISOString();

  saveDb();
  addAuditLog(
    staffId || "SYSTEM",
    "RADIOLOGY_REPORT_ENTRY",
    `Uploaded diagnosis findings for radiology scan ID ${order.id}`,
    req,
  );

  res.json(order);
});

// 9. Operation Theater schedules
app.get("/api/ot/schedules", (req, res) => {
  res.json(db.otSchedules);
});

app.post("/api/ot/schedules", (req, res) => {
  const {
    patientMrn,
    surgeryName,
    scheduledAt,
    theaterNumber,
    team,
    charges,
    staffId,
  } = req.body;
  const patient = db.patients.find((p) => p.mrn === patientMrn);

  if (!patient || !surgeryName || !scheduledAt) {
    return res
      .status(400)
      .json({ error: "Incomplete OT surgical booking parameters." });
  }

  const id = `OT-SCH-${Date.now().toString().slice(-4)}`;
  const newSchedule: OTSchedule = {
    id,
    patientMrn,
    patientName: patient.name,
    surgeryName,
    scheduledAt,
    durationMinutes: 90,
    theaterNumber: theaterNumber || "OT-Room-02",
    team: team || [
      { role: "Primary Surgeon", staffName: "Dr. Mushtaq Khan" },
      { role: "Scrub Nurse", staffName: "Nurse Fatima Batool" },
    ],
    preOpChecklist: {
      consentSigned: false,
      pacCompleted: false,
      fastingOk: false,
      markedSite: false,
    },
    charges: Number(charges) || 120000,
    status: "SCHEDULED",
  };

  db.otSchedules.unshift(newSchedule);
  saveDb();

  addAuditLog(
    staffId || "SYSTEM",
    "OT_SCHEDULE",
    `Scheduled ${surgeryName} surgery for patient ${patient.name}`,
    req,
  );

  res.status(201).json(newSchedule);
});

app.put("/api/ot/schedules/:id", (req, res) => {
  const { id } = req.params;
  const { preOpChecklist, postOpNotes, status, charges, staffId } = req.body;

  const schedule = db.otSchedules.find((o) => o.id === id);
  if (!schedule) {
    return res.status(404).json({ error: "Surgical schedule card not found." });
  }

  if (preOpChecklist) schedule.preOpChecklist = preOpChecklist;
  if (postOpNotes !== undefined) schedule.postOpNotes = postOpNotes;
  if (status) schedule.status = status;
  if (charges) schedule.charges = Number(charges);

  saveDb();
  addAuditLog(
    staffId || "SYSTEM",
    "OT_UPDATE_SURGERY",
    `Updated clinical checkpoints/status of surgery card ${schedule.id}`,
    req,
  );

  res.json(schedule);
});

// 10. HR Roster Attendance / Management
app.get("/api/hr/clocks", (req, res) => {
  res.json(db.hrClocks);
});

app.get("/api/hr/staff", (req, res) => {
  res.json(db.users);
});

app.post("/api/hr/clocks", (req, res) => {
  const { staffId, action, status, date, clockIn, clockOut } = req.body;
  const staff = db.users.find((u) => u.id === staffId);

  if (!staff) {
    return res.status(404).json({ error: "Staff member not found" });
  }

  const currentDate =
    date || new Date().toLocaleDateString("en-GB").replace(/\//g, "-"); // DD-MM-YYYY
  const currentTime =
    clockIn ||
    new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });

  if (action === "CLOCK_IN") {
    const existingClock = db.hrClocks.find(
      (c) => c.staffId === staffId && c.date === currentDate,
    );
    if (existingClock) {
      return res.status(400).json({ error: "Already clocked in for today." });
    }

    const clock: HRClock = {
      id: `CLK-${Date.now().toString().slice(-4)}`,
      staffId,
      staffName: staff.name,
      role: staff.role,
      date: currentDate,
      clockIn: currentTime,
      status: status || "PRESENT",
    };

    db.hrClocks.unshift(clock);
    saveDb();

    addAuditLog(
      staffId,
      "HR_CLOCK_IN",
      `Clocked in for shift at ${currentTime}`,
      req,
    );
    return res.status(201).json(clock);
  } else if (action === "CLOCK_OUT") {
    const clock = db.hrClocks.find(
      (c) => c.staffId === staffId && c.date === currentDate && !c.clockOut,
    );
    if (!clock) {
      return res
        .status(400)
        .json({
          error: "Punch-in entry not found or already clocked out for today.",
        });
    }

    clock.clockOut =
      clockOut ||
      new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      });
    saveDb();

    addAuditLog(
      staffId,
      "HR_CLOCK_OUT",
      `Clocked out of shift at ${clock.clockOut}`,
      req,
    );
    return res.json(clock);
  }

  res.status(400).json({ error: "Invalid HR action request." });
});

app.post("/api/hr/staff", (req, res) => {
  const { name, role, department, phone, email, shift, cnic, salary, staffId } =
    req.body;

  if (!name || !role || !department || !cnic) {
    return res
      .status(400)
      .json({
        error: "Primary parameters (Name, Role, Dept, CNIC) are required.",
      });
  }

  const employeeId = `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
  const newUser: User = {
    id: employeeId,
    cnic,
    name,
    role,
    department,
    phone: phone || "Not provided",
    email: email || `${name.toLowerCase().replace(/\s+/g, "")}@mayotrust.pk`,
    shift: shift || "MORNING",
    status: "ACTIVE",
    salary: Number(salary) || 45000,
  };

  db.users.push(newUser);
  saveDb();

  addAuditLog(
    staffId || "SYSTEM",
    "HR_ADD_STAFF",
    `Enrolled staff member ${name} as ${role} inside administrative database. ID: ${employeeId}`,
    req,
  );

  res.status(201).json(newUser);
});

// 12. Settings Endpoint
app.get("/api/settings", (req, res) => {
  res.json(db.settings);
});

app.put("/api/settings", (req, res) => {
  const {
    hospitalName,
    hospitalAddress,
    phone,
    taxRatePercent,
    whatsappTemplate,
    smsTemplate,
    logoText,
    staffId,
  } = req.body;

  if (hospitalName) db.settings.hospitalName = hospitalName;
  if (hospitalAddress) db.settings.hospitalAddress = hospitalAddress;
  if (phone) db.settings.phone = phone;
  if (taxRatePercent !== undefined)
    db.settings.taxRatePercent = Number(taxRatePercent);
  if (whatsappTemplate) db.settings.whatsappTemplate = whatsappTemplate;
  if (smsTemplate) db.settings.smsTemplate = smsTemplate;
  if (logoText) db.settings.logoText = logoText;

  saveDb();
  addAuditLog(
    staffId || "SYSTEM",
    "UPDATE_SETTINGS",
    `Reconfigured general system/hospital configurations`,
    req,
  );

  res.json(db.settings);
});

// 11. Dashboard Analytics Data Compile Endpoint
app.get("/api/dashboard/analytics", (req, res) => {
  // Aggregate revenue by module
  const moduleRevenue = db.billingTransactions.reduce(
    (acc, txn) => {
      acc[txn.module] = (acc[txn.module] || 0) + txn.netBill;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Bed Occupancy Calculation
  const totalBeds = db.beds.length;
  const occupiedBeds = db.beds.filter((b) => b.status === "OCCUPIED").length;
  const occupancyRate =
    totalBeds > 0 ? Number(((occupiedBeds / totalBeds) * 100).toFixed(1)) : 0;

  // Outstanding claim accounts (Insurance balance outstanding)
  const outstandingInsurance = db.billingTransactions
    .filter(
      (txn) =>
        txn.insuranceClaimProvider !== "NONE" && txn.paymentStatus !== "PAID",
    )
    .reduce((val, txn) => val + txn.insuranceClaimAmount, 0);

  // Doctor Patient Load count
  const doctorLoad = db.opdVisits.reduce(
    (acc, visit) => {
      acc[visit.doctorName] = (acc[visit.doctorName] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Expiry notifications countdown (pharmacy)
  const lowStockMedicines = db.medicines.filter(
    (m) => m.stockCount <= m.minStockLevel,
  ).length;

  res.json({
    totalPatients: db.patients.length,
    opdQueueToday: db.opdVisits.length,
    activeAdmissions: db.ipdAdmissions.filter((a) => a.status === "ADMITTED")
      .length,
    occupancyRate,
    moduleRevenue,
    outstandingInsurance,
    doctorLoad,
    lowStockCount: lowStockMedicines,
    totalRevenue: db.billingTransactions.reduce((x, y) => x + y.netBill, 0),
  });
});

// Configure Vite or Static production hosting
async function startServer() {
  const isProd =
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL === "1" ||
    fs.existsSync(path.join(process.cwd(), "dist", "index.html"));

  if (!isProd) {
    console.log(
      "Starting Hot-reloading Vite dev server inside Express pipeline...",
    );
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (importErr) {
      console.error(
        "Failed to dynamically launch Vite server, falling back to static hosting:",
        importErr,
      );
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  } else {
    // Production serving static files
    console.log("Starting full-stack production static hosting pipelines...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Under Vercel lambdas, we do not need standalone port binding, but we can do it safely
  if (process.env.VERCEL !== "1") {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`===============================================`);
      console.log(` Mayo Hospital Management Server is running live `);
      console.log(` Address: http://0.0.0.0:${PORT}               `);
      console.log(`===============================================`);
    });
  } else {
    console.log(
      "🚀 [Serverless Environment] Bypassed local app.listen port binding under Vercel.",
    );
  }
}

startServer();

export { app };
export default app;
