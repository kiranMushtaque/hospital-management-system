import express, { Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());
app.use(cookieParser());

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || 'mayo-trust-key-2026';
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'mayo-refresh-key-2026';

// Mock Users for Demo
const MOCK_USERS: Record<string, any> = {
  'EMP-1010': { id: 'EMP-1010', employeeId: 'EMP-1010', name: 'Super Admin', role: 'SUPER_ADMIN', department: 'ADMINISTRATION', password: 'admin123' },
  'EMP-2020': { id: 'EMP-2020', employeeId: 'EMP-2020', name: 'Dr. Sadia Malik', role: 'DOCTOR', department: 'CARDIOLOGY', password: 'doctor123' },
  'EMP-3030': { id: 'EMP-3030', employeeId: 'EMP-3030', name: 'Nurse Fatima', role: 'NURSE', department: 'GENERAL_OPD', password: 'nurse123' },
  'EMP-4040': { id: 'EMP-4040', employeeId: 'EMP-4040', name: 'Lab Tech Yousuf', role: 'LAB_TECH', department: 'DIAGNOSTICS', password: 'lab123' },
  'EMP-5050': { id: 'EMP-5050', employeeId: 'EMP-5050', name: 'Cashier Ahmed', role: 'CASHIER', department: 'BILLING', password: 'cashier123' },
};

// 1. Authentication Routes
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { employeeId, password } = req.body;

  const user = MOCK_USERS[employeeId];
  const isDemoBypass = password === 'admin123' || password === 'doctor123';

  if (!user || (user.password !== password && !isDemoBypass)) {
    return res.status(401).json({ error: 'Invalid credentials. Use demo IDs (EMP-1010, etc.)' });
  }

  const accessToken = jwt.sign(
    { userId: user.id, employeeId: user.employeeId, role: user.role, name: user.name },
    ACCESS_TOKEN_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId: user.id, employeeId: user.employeeId },
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
      employeeId: user.employeeId,
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
    const user = MOCK_USERS[payload.employeeId] || {
        id: payload.userId,
        employeeId: payload.employeeId,
        name: payload.name,
        role: payload.role,
        department: 'GENERAL'
    };
    
    res.json({
      id: user.id,
      employeeId: user.employeeId,
      name: user.name,
      role: user.role,
      department: user.department,
    });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// 2. Dashboard & Analytics
app.get('/api/dashboard/analytics', (req, res) => {
  res.json({
    totalPatients: 1250,
    opdQueueToday: 45,
    activeAdmissions: 12,
    occupancyRate: 85.5,
    moduleRevenue: { OPD: 150000, IPD: 450000, Pharmacy: 85000, Lab: 42000 },
    outstandingInsurance: 125000,
    doctorLoad: { 'Dr. Sadia': 15, 'Dr. Asif': 12, 'Dr. Fahad': 18 },
    lowStockCount: 8,
    totalRevenue: 727000,
  });
});

// 3. Patients
app.get('/api/patients', (req, res) => {
  res.json([]);
});

// 4. Settings
app.get('/api/settings', (req, res) => {
  res.json({
    hospitalName: 'Mayo University Care Center & Trust',
    hospitalAddress: 'Near Neela Gumbad, Anarkali Bazaar, Lahore, Punjab 54000, Pakistan',
    phone: '+92 42 99211100',
    taxRatePercent: 5.0,
    logoText: 'Mayo HMS',
    whatsappTemplate: 'Dear Patient, your appointment at Mayo Hospital is confirmed.',
    smsTemplate: 'Mayo HMS: Your receipt is ready.'
  });
});

export default app;
