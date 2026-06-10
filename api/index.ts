import express, { Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());
app.use(cookieParser());

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || 'mayo-trust-key-2026';
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'mayo-refresh-key-2026';

// -------------------------------------------------------------------------
// DATA MODELS (Copied from server.ts seedDb)
// -------------------------------------------------------------------------

const MOCK_USERS = [
  { id: "EMP-4040", name: "Dr. Mushtaq Khan", role: "DOCTOR", department: "CARDIOLOGY", phone: "0300-1112233", email: "doc.mushtaq@mayotrust.pk", shift: "MORNING", status: "ACTIVE", salary: 280000, cnic: "35201-8812345-9", password: "doctor123" },
  { id: "EMP-4041", name: "Dr. Ayesha Naeem", role: "DOCTOR", department: "MATERNITY", phone: "0321-4445566", email: "ayesha.n@mayotrust.pk", shift: "MORNING", status: "ACTIVE", salary: 260000, cnic: "35202-1234567-2", password: "doctor123" },
  { id: "EMP-4042", name: "Dr. Haris Jameel", role: "DOCTOR", department: "GENERAL_OPD", phone: "0333-5556677", email: "h.jameel@mayotrust.pk", shift: "EVENING", status: "ACTIVE", salary: 190000, cnic: "34101-7765432-1", password: "doctor123" },
  { id: "EMP-1010", name: "Dr. Asif Mayo", role: "SUPER_ADMIN", department: "ADMINISTRATION", phone: "0300-8889900", email: "asif.admin@mayotrust.pk", shift: "MORNING", status: "ACTIVE", salary: 350000, cnic: "35201-1111111-1", password: "admin123" },
  { id: "EMP-2020", name: "Dr. Sadia Malik", role: "DOCTOR", department: "GENERAL_OPD", phone: "0345-2233445", email: "sadia.doctor@mayotrust.pk", shift: "NIGHT", status: "ACTIVE", salary: 185000, cnic: "35202-9988776-6", password: "doctor123" },
  { id: "EMP-3030", name: "Qasim Siddiqui", role: "CASHIER", department: "ACCOUNTS", phone: "0322-1234567", email: "qasim.cash@mayotrust.pk", shift: "MORNING", status: "ACTIVE", salary: 85000, cnic: "35201-3456789-3", password: "nurse123" },
  { id: "EMP-5050", name: "Yousuf Raza", role: "LAB_TECH", department: "DIAGNOSTICS", phone: "0311-9988776", email: "yousuf.lab@mayotrust.pk", shift: "EVENING", status: "ACTIVE", salary: 110000, cnic: "35102-1212121-7", password: "lab123" },
  { id: "EMP-6060", name: "Sonia Bibi", role: "RECEPTIONIST", department: "FRONT_DESK", phone: "0300-7654321", email: "sonia.front@mayotrust.pk", shift: "MORNING", status: "ACTIVE", salary: 65000, cnic: "35202-4545454-4", password: "admin123" },
];

const MOCK_PATIENTS = [
  { mrn: "MRN-2026-0001", cnic: "35202-8812345-1", name: "Muhammad Shahid", age: 48, gender: "MALE", bloodGroup: "B+", address: "House 45, Sector Y, DHA Phase 3, Lahore", phone: "0300-5551212", emergencyContactName: "Rubina Shahid (Wife)", emergencyContactPhone: "0301-5551212", insuranceProvider: "SEHAT_CARD", insurancePolicyNumber: "SC-9988112-LHR", photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=120&auto=format&fit=crop", createdAt: "2026-05-15T10:30:00Z" },
  { mrn: "MRN-2026-0002", cnic: "35404-1234987-2", name: "Sajida Parveen", age: 32, gender: "FEMALE", bloodGroup: "O-", address: "Mohallah Eidgah, Tehsil Chishtian, Bahawalnagar", phone: "0313-9876543", emergencyContactName: "Tariq Mahmood (Husband)", emergencyContactPhone: "0333-9876543", insuranceProvider: "STATE_LIFE", insurancePolicyNumber: "SL-88-2339-B", photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=120&auto=format&fit=crop", createdAt: "2026-06-01T14:20:00Z" },
  { mrn: "MRN-2026-0003", cnic: "35201-1122334-3", name: "Tariq Mehmood", age: 55, gender: "MALE", bloodGroup: "A+", address: "Flat 12-B, Palace Heights, Gulberg III, Lahore", phone: "0300-1234567", emergencyContactName: "Asim Tariq (Son)", emergencyContactPhone: "0321-7654321", insuranceProvider: "NONE", insurancePolicyNumber: "", photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=120&auto=format&fit=crop", createdAt: "2026-06-02T11:15:00Z" },
  { mrn: "MRN-2026-0004", cnic: "35201-9876543-2", name: "Zainab Bibi", age: 24, gender: "FEMALE", bloodGroup: "AB+", address: "House 24, Street 3, Gool Bazaar, Samanabad, Lahore", phone: "0345-6789012", emergencyContactName: "Amjad Ali (Father)", emergencyContactPhone: "0300-9876543", insuranceProvider: "SEHAT_CARD", insurancePolicyNumber: "SC-445582-LHR", photoUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=120&auto=format&fit=crop", createdAt: "2026-06-03T09:20:00Z" },
  { mrn: "MRN-2026-0005", cnic: "35202-4455667-5", name: "Kamran Akmal", age: 37, gender: "MALE", bloodGroup: "O+", address: "Sector J, Block C, Johar Town, Lahore", phone: "0311-2233445", emergencyContactName: "Rashid Akmal (Brother)", emergencyContactPhone: "0311-2233446", insuranceProvider: "STATE_LIFE", insurancePolicyNumber: "SL-99234-A", photoUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=120&auto=format&fit=crop", createdAt: "2026-06-04T16:45:00Z" },
  { mrn: "MRN-2026-0006", cnic: "35201-2233445-6", name: "Bilquis Edhi", age: 61, gender: "FEMALE", bloodGroup: "B-", address: "House 102, Block D, Model Town, Lahore", phone: "0333-1122334", emergencyContactName: "Faisal Edhi (Son)", emergencyContactPhone: "0333-1122335", insuranceProvider: "NONE", insurancePolicyNumber: "", photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=120&auto=format&fit=crop", createdAt: "2026-06-05T08:10:00Z" },
  { mrn: "MRN-2026-0007", cnic: "35202-9988112-7", name: "Asad Rasheed", age: 29, gender: "MALE", bloodGroup: "A-", address: "House 55, Street 1, Faisal Town, Lahore", phone: "0302-3344556", emergencyContactName: "Sofia Rasheed (Mother)", emergencyContactPhone: "0302-3344557", insuranceProvider: "SEHAT_CARD", insurancePolicyNumber: "SC-122391-LHR", photoUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=120&auto=format&fit=crop", createdAt: "2026-06-06T14:35:00Z" },
  { mrn: "MRN-2026-0008", cnic: "42201-1234981-8", name: "Farah Naz", age: 42, gender: "FEMALE", bloodGroup: "O+", address: "Block 5, Clifton, Karachi", phone: "0321-9988776", emergencyContactName: "Nawaz Sharif (Husband)", emergencyContactPhone: "0321-9988775", insuranceProvider: "STATE_LIFE", insurancePolicyNumber: "SL-KHI-4819", photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=120&auto=format&fit=crop", createdAt: "2026-06-07T12:00:00Z" },
  { mrn: "MRN-2026-0009", cnic: "35201-2299118-9", name: "Haroon Pasha", age: 50, gender: "MALE", bloodGroup: "AB-", address: "House 88, Lane 5, Cavalry Ground, Lahore Cantt", phone: "0300-8484841", emergencyContactName: "Zahid Pasha (Brother)", emergencyContactPhone: "0300-8484842", insuranceProvider: "NONE", insurancePolicyNumber: "", photoUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=120&auto=format&fit=crop", createdAt: "2026-06-08T10:45:00Z" },
  { mrn: "MRN-2026-0010", cnic: "35202-3344112-0", name: "Saima Kirmani", age: 31, gender: "FEMALE", bloodGroup: "B+", address: "House 12, Block F-II, Wapda Town, Lahore", phone: "0332-1212123", emergencyContactName: "Kashif Kirmani (Husband)", emergencyContactPhone: "0332-1212124", insuranceProvider: "SEHAT_CARD", insurancePolicyNumber: "SC-909022-LHR", photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=120&auto=format&fit=crop", createdAt: "2026-06-09T08:30:00Z" },
];

const MOCK_BEDS: any[] = [];
const wards: string[] = ["GENERAL", "PRIVATE", "ICU", "CCU", "MATERNITY"];
wards.forEach((ward) => {
  let price = 1200;
  if (ward === "PRIVATE") price = 8500;
  if (ward === "ICU") price = 15000;
  if (ward === "CCU") price = 18000;
  if (ward === "MATERNITY") price = 5000;
  for (let i = 1; i <= 6; i++) {
    MOCK_BEDS.push({
      id: `${ward}-${i < 10 ? "0" + i : i}`,
      ward: ward,
      bedNumber: `${i}`,
      status: i === 2 ? "OCCUPIED" : i === 4 ? "MAINTENANCE" : "AVAILABLE",
      dailyCharge: price,
      currentPatientMrn: i === 2 ? "MRN-2026-0001" : undefined,
    });
  }
});

const MOCK_ADMISSIONS = [
  { id: "IPD-2026-0001", patientMrn: "MRN-2026-0001", patientName: "Muhammad Shahid", ward: "ICU", bedId: "ICU-02", admittedAt: "2026-06-06T09:00:00Z", admittingDoctorId: "EMP-4040", admittingDoctorName: "Dr. Mushtaq Khan", status: "ADMITTED", nurseNotes: [{ time: "2026-06-08T22:00:00Z", note: "Patient vitals stable. BP 130/85, Pulse 82. Intravenous fluids running smoothly.", nurseName: "Nurse Fatima Batool" }], doctorVisits: [{ time: "2026-06-08T10:00:00Z", notes: "Condition improved post angiography. Keep monitored for 24h.", doctorId: "EMP-4040", doctorName: "Dr. Mushtaq Khan", charge: 2500 }], totalCalculatedBill: 45000 },
];

const MOCK_LAB_TESTS = [
  { id: "LAB-001", name: "Complete Blood Count (CBC)", category: "Hematology", price: 950, normalRange: "Hb: 13-17 g/dL, WBC: 4-11 x10^9/L", unit: "Various" },
  { id: "LAB-002", name: "Fasting Blood Sugar (FBS)", category: "Biochemistry", price: 350, normalRange: "70 - 100", unit: "mg/dL" },
  { id: "LAB-003", name: "HbA1c (Glycated Hemoglobin)", category: "Biochemistry", price: 1800, normalRange: "Under 5.7%", unit: "%" },
  { id: "LAB-004", name: "Serum Creatinine (Kidney Function)", category: "Biochemistry", price: 600, normalRange: "0.6 - 1.2", unit: "mg/dL" },
  { id: "LAB-005", name: "Lipid Profile (Cholesterol)", category: "Biochemistry", price: 2100, normalRange: "Cholesterol < 200, LDL < 100", unit: "mg/dL" },
];

const MOCK_LAB_ORDERS = [
  { id: "ORD-2026-101", patientMrn: "MRN-2026-0001", patientName: "Muhammad Shahid", testId: "LAB-005", testName: "Lipid Profile (Cholesterol)", requestedByDoctorId: "EMP-4040", requestedByDoctorName: "Dr. Mushtaq Khan", orderedAt: "2026-06-08T12:00:00Z", status: "COMPLETED", sampleType: "Blood Plasma", resultValue: "Cholesterol: 240 (High), LDL: 162 (High)", isCritical: true, notes: "Severe dyslipidemia detected. Requires aggressive statin therapy.", testedAt: "2026-06-08T15:00:00Z", labTechId: "EMP-5050", labTechName: "Yousuf Raza" },
];

const MOCK_RADIOLOGY = [
  { id: "RAD-2026-301", patientMrn: "MRN-2026-0002", patientName: "Sajida Parveen", type: "ULTRASOUND", instructions: "Pelvic study to verify gestational safety progress.", orderedByDoctorId: "EMP-4041", orderedByDoctorName: "Dr. Ayesha Naeem", orderedAt: "2026-06-09T05:30:00Z", status: "COMPLETED", findings: "Single live intrauterine pregnancy of 14 weeks. Fetal heart rate is 144 bpm. Placenta is anterior and clear.", completedAt: "2026-06-09T06:00:00Z" },
];

const MOCK_OT = [
  { id: "OT-2026-901", patientMrn: "MRN-2026-0001", patientName: "Muhammad Shahid", surgeryName: "Coronary Angioplasty (Single Stent)", scheduledAt: "2026-06-12T11:00:00Z", durationMinutes: 90, team: [{ role: "Primary Surgeon", staffName: "Dr. Mushtaq Khan" }, { role: "Assistant", staffName: "Dr. Haris Jameel" }, { role: "Scrub Nurse", staffName: "Nurse Fatima Batool" }], preOpChecklist: { consentSigned: true, pacCompleted: true, fastingOk: true, markedSite: true }, charges: 185000, status: "SCHEDULED", theaterNumber: "OT-Cardio-01" },
];

const MOCK_OPD_VISITS = [
  { id: "OPD-2026-0010", patientMrn: "MRN-2026-0002", patientName: "Sajida Parveen", tokenNumber: 4, doctorId: "EMP-4041", doctorName: "Dr. Ayesha Naeem", specialty: "Maternity Care", visitDate: "2026-06-09T09:15:00Z", status: "COMPLETED", vitals: { bp: "115/75", temp: 37.0, weight: 64, pulse: 78, recordedAt: "2026-06-09T09:00:00Z" }, symptoms: "Routine second-trimester review. Mild fatigue.", diagnosis: "Normal Gestational Progress with minor iron deficiency anemia.", prescription: [{ medicineId: "MED-003", name: "Fefol Vit capsule (Iron + Folic Acid)", dosage: "1-0-0", frequency: "After Breakfast", duration: "30 Days", quantity: 30 }], billingStatus: "PAID", billAmount: 1500 },
];

const MOCK_MEDICINES = [
  { id: "MED-001", name: "Panadol 500mg (Paracetamol)", genericName: "Paracetamol", batchNumber: "B-PN882", stockCount: 1200, minStockLevel: 200, expiryDate: "2028-04-12", salePrice: 3, supplierName: "GSK Pakistan Ltd" },
  { id: "MED-002", name: "Augmentin DS Suspension 312mg", genericName: "Co-Amoxiclav", batchNumber: "B-AG401", stockCount: 45, minStockLevel: 50, expiryDate: "2027-01-20", salePrice: 280, supplierName: "GSK Pakistan Ltd" },
  { id: "MED-003", name: "Fefol-Vit Capsules", genericName: "Iron Sulfate + Folic Acid + Vit C", batchNumber: "B-FF12", stockCount: 450, minStockLevel: 100, expiryDate: "2026-11-01", salePrice: 12, supplierName: "GlaxoSmithKline" },
  { id: "MED-004", name: "Lipiget 20mg (Atorvastatin)", genericName: "Atorvastatin Calcium", batchNumber: "B-LP440", stockCount: 60, minStockLevel: 100, expiryDate: "2026-07-25", salePrice: 35, supplierName: "Getz Pharma Pakistan" },
  { id: "MED-005", name: "Secnil 1g Sachet", genericName: "Secnidazole", batchNumber: "B-SN091", stockCount: 150, minStockLevel: 20, expiryDate: "2027-09-14", salePrice: 160, supplierName: "Abbott Laboratories Pakistan" },
];

const MOCK_BILLING = [
  { id: "INV-2026-0001", patientMrn: "MRN-2026-0002", patientName: "Sajida Parveen", module: "OPD", subtotal: 1500, discountApprovedAmount: 200, discountReason: "Zakat Welfare Fund Contribution", taxAmount: 65, netBill: 1365, insuranceClaimProvider: "NONE", insuranceClaimAmount: 0, amountPaidByPatient: 1365, paymentMethod: "CASH", paymentStatus: "PAID", createdByStaffId: "EMP-3030", createdByStaffName: "Qasim Siddiqui", createdAt: "2026-06-09T09:30:00Z", items: [{ description: "OPD Consultation Gynaecology Token #4", qty: 1, price: 1500 }] },
  { id: "INV-2026-0002", patientMrn: "MRN-2026-0001", patientName: "Muhammad Shahid", module: "LAB", subtotal: 2100, discountApprovedAmount: 0, taxAmount: 105, netBill: 2205, insuranceClaimProvider: "SEHAT_CARD", insuranceClaimAmount: 2205, amountPaidByPatient: 0, paymentMethod: "BANK_TRANSFER", paymentStatus: "PAID", createdByStaffId: "EMP-3030", createdByStaffName: "Qasim Siddiqui", createdAt: "2026-06-08T15:30:00Z", items: [{ description: "Lipid Profile test LAB-005", qty: 1, price: 2100 }] },
];

const MOCK_CLOCKS = [
  { id: "CLK-101", staffId: "EMP-4040", staffName: "Dr. Mushtaq Khan", role: "DOCTOR", date: "09-06-2026", clockIn: "08:14", status: "PRESENT" },
  { id: "CLK-102", staffId: "EMP-1010", staffName: "Dr. Asif Mayo", role: "SUPER_ADMIN", date: "09-06-2026", clockIn: "07:55", status: "PRESENT" },
  { id: "CLK-103", staffId: "EMP-2020", staffName: "Dr. Sadia Malik", role: "DOCTOR", date: "09-06-2026", clockIn: "19:50", status: "PRESENT" },
];

const MOCK_SETTINGS = {
  hospitalName: 'Mayo University Care Center & Trust',
  hospitalAddress: 'Near Neela Gumbad, Anarkali Bazaar, Lahore, Punjab 54000, Pakistan',
  phone: '+92 42 99211100',
  taxRatePercent: 5.0,
  logoText: 'Mayo HMS',
  whatsappTemplate: 'Dear Patient {patientName}, your clinical file {mrn} has been processed at {hospitalName}. Transaction: {txnId}, Amount: Rs. {amount}.',
  smsTemplate: 'Mayo HMS: Your receipt is ready.'
};

// -------------------------------------------------------------------------
// AUTH ROUTES
// -------------------------------------------------------------------------

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { employeeId, password } = req.body;
  const user = MOCK_USERS.find(u => u.id === employeeId);
  const isDemoBypass = password === 'admin123' || password === 'doctor123';

  if (!user || (user.password !== password && !isDemoBypass)) {
    return res.status(401).json({ error: 'Invalid credentials. Use demo IDs (EMP-1010, etc.)' });
  }

  const accessToken = jwt.sign(
    { userId: user.id, employeeId: user.id, role: user.role, name: user.name },
    ACCESS_TOKEN_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId: user.id, employeeId: user.id },
    REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.json({
    success: true,
    accessToken,
    user: {
      id: user.id,
      employeeId: user.id,
      name: user.name,
      role: user.role,
      department: user.department,
    },
  });
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('refreshToken');
  res.json({ success: true });
});

app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Missing token' });

  try {
    const payload = jwt.verify(token, ACCESS_TOKEN_SECRET) as any;
    const user = MOCK_USERS.find(u => u.id === payload.employeeId) || {
        id: payload.userId,
        employeeId: payload.employeeId,
        name: payload.name,
        role: payload.role,
        department: 'GENERAL'
    };
    res.json({ user });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// -------------------------------------------------------------------------
// SYSTEM ROUTES (Synchronized with server.ts)
// -------------------------------------------------------------------------

app.get('/api/dashboard/analytics', (req, res) => {
  res.json({
    totalPatients: MOCK_PATIENTS.length,
    opdQueueToday: MOCK_OPD_VISITS.length,
    activeAdmissions: MOCK_ADMISSIONS.length,
    occupancyRate: 6.6, // (2/30 * 100) based on seed
    moduleRevenue: { OPD: 1365, LAB: 2205, IPD: 0, Pharmacy: 0 },
    outstandingInsurance: 2205,
    doctorLoad: { 'Dr. Ayesha Naeem': 1 },
    lowStockCount: 2, // Lipiget and Augmentin are below min
    totalRevenue: 3570,
  });
});

app.get('/api/patients', (req, res) => res.json(MOCK_PATIENTS));
app.get('/api/settings', (req, res) => res.json(MOCK_SETTINGS));

// IPD
app.get('/api/ipd/beds', (req, res) => res.json(MOCK_BEDS));
app.get('/api/ipd/admissions', (req, res) => res.json(MOCK_ADMISSIONS));

// OPD
app.get('/api/opd/visits', (req, res) => res.json(MOCK_OPD_VISITS));

// Lab
app.get('/api/lab/tests', (req, res) => res.json(MOCK_LAB_TESTS));
app.get('/api/lab/orders', (req, res) => res.json(MOCK_LAB_ORDERS));

// Pharmacy
app.get('/api/pharmacy/medicines', (req, res) => res.json(MOCK_MEDICINES));

// Radiology
app.get('/api/radiology/orders', (req, res) => res.json(MOCK_RADIOLOGY));

// OT
app.get('/api/ot/schedules', (req, res) => res.json(MOCK_OT));

// HR
app.get('/api/hr/staff', (req, res) => res.json(MOCK_USERS));
app.get('/api/hr/clocks', (req, res) => res.json(MOCK_CLOCKS));

// Billing
app.get('/api/billing/transactions', (req, res) => res.json(MOCK_BILLING));

// Audit
app.post('/api/audit', (req, res) => res.json({ success: true }));

export default app;
