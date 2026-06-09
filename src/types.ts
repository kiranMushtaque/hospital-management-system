/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 
  | 'SUPER_ADMIN' 
  | 'ADMIN' 
  | 'DOCTOR' 
  | 'NURSE' 
  | 'RECEPTIONIST' 
  | 'CASHIER' 
  | 'LAB_TECH';

export interface User {
  id: string; // Employee ID or auto-gen
  cnic: string; // Passport/CNIC Pakistani format e.g. 35201-1234567-1
  name: string;
  role: UserRole;
  department: string;
  phone: string;
  email: string;
  shift: 'MORNING' | 'EVENING' | 'NIGHT';
  status: 'ACTIVE' | 'INACTIVE';
  passwordHash?: string;
  salary: number;
}

export interface Patient {
  mrn: string; // Auto-generated MRN, e.g. MRN-2026-0001
  cnic: string; // Pakistani CNIC 15-digit form: 35201-1234567-1
  name: string;
  fullNameUrdu?: string;
  deletedAt?: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  address: string;
  phone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  insuranceProvider: 'NONE' | 'SEHAT_CARD' | 'EFU' | 'JUBILEE' | 'STATE_LIFE';
  insurancePolicyNumber?: string;
  photoUrl: string; // Or base64/placeholder
  qrCode?: string; // QR code data
  createdAt: string;
}

export interface Vitals {
  bp: string; // e.g. "120/80"
  temp: number; // in Celsius or Fahrenheit
  weight: number; // in kg
  pulse: number; // bpm
  recordedAt: string;
}

export interface PrescriptionItem {
  medicineId: string;
  name: string;
  dosage: string; // e.g. "1-0-1"
  frequency: string; // e.g. "After Meals"
  duration: string; // e.g. "5 Days"
  quantity: number;
}

export interface OPDVisit {
  id: string;
  patientMrn: string;
  patientName: string;
  tokenNumber: number;
  doctorId: string;
  doctorName: string;
  specialty: string;
  visitDate: string;
  status: 'WAITING' | 'IN_CONSULTATION' | 'COMPLETED' | 'CANCELLED';
  vitals?: Vitals;
  symptoms: string;
  diagnosis: string;
  prescription: PrescriptionItem[];
  referralDepartment?: string;
  referredAt?: string;
  billingStatus: 'PENDING' | 'PAID';
  billAmount: number;
}

export type WardType = 'GENERAL' | 'PRIVATE' | 'ICU' | 'CCU' | 'MATERNITY';

export interface Bed {
  id: string; // Ward-Bed sequence e.g., ICU-01
  ward: WardType;
  bedNumber: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
  currentPatientMrn?: string;
  dailyCharge: number;
}

export interface IPDAdmission {
  id: string;
  patientMrn: string;
  patientName: string;
  ward: WardType;
  bedId: string;
  admittedAt: string;
  dischargedAt?: string;
  admittingDoctorId: string;
  admittingDoctorName: string;
  status: 'ADMITTED' | 'DISCHARGED';
  nurseNotes: {
    time: string;
    note: string;
    nurseName: string;
  }[];
  doctorVisits: {
    time: string;
    notes: string;
    doctorId: string;
    doctorName: string;
    charge: number;
  }[];
  dischargeSummary?: {
    diagnosis: string;
    treatmentGiven: string;
    followUpInstructions: string;
    dischargeMedication: PrescriptionItem[];
  };
  totalCalculatedBill: number;
}

export interface Medicine {
  id: string;
  name: string;
  genericName: string;
  batchNumber: string;
  stockCount: number;
  minStockLevel: number; // Trigger warning
  expiryDate: string; // YYYY-MM-DD
  salePrice: number; // Rs.
  supplierName: string;
}

export interface LabTest {
  id: string;
  name: string;
  category: string;
  price: number;
  normalRange: string;
  unit: string;
}

export interface LabOrder {
  id: string;
  patientMrn: string;
  patientName: string;
  testId: string;
  testName: string;
  requestedByDoctorId: string;
  requestedByDoctorName: string;
  orderedAt: string;
  status: 'ORDERED' | 'SAMPLE_COLLECTED' | 'COMPLETED';
  sampleType: string;
  resultValue?: string;
  isCritical?: boolean;
  notes?: string;
  testedAt?: string;
  labTechId?: string;
  labTechName?: string;
}

export type RadiologyType = 'X_RAY' | 'MRI' | 'CT_SCAN' | 'ULTRASOUND';

export interface RadiologyOrder {
  id: string;
  patientMrn: string;
  patientName: string;
  type: RadiologyType;
  instructions: string;
  orderedByDoctorId: string;
  orderedByDoctorName: string;
  orderedAt: string;
  status: 'PENDING' | 'COMPLETED';
  imageUrl?: string; // Simulated static scan placeholder
  findings?: string;
  completedAt?: string;
}

export interface OTSchedule {
  id: string;
  patientMrn: string;
  patientName: string;
  surgeryName: string;
  scheduledAt: string;
  durationMinutes: number;
  team: {
    role: string; // "Primary Surgeon", "Assistant Surgeon", "Anesthetist", "Scrub Nurse"
    staffName: string;
  }[];
  preOpChecklist: {
    consentSigned: boolean;
    pacCompleted: boolean;
    fastingOk: boolean;
    markedSite: boolean;
  };
  postOpNotes?: string;
  charges: number;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  theaterNumber: string;
}

export interface HRClock {
  id: string;
  staffId: string;
  staffName: string;
  role: UserRole;
  date: string; // DD-MM-YYYY
  clockIn: string; // HH:MM
  clockOut?: string; 
  status: 'PRESENT' | 'ABSENT' | 'LEAVE' | 'LATE';
}

export interface BillingTransaction {
  id: string; // Invoice number e.g. TXN-2026-0001
  patientMrn: string;
  patientName: string;
  module: 'OPD' | 'IPD' | 'LAB' | 'RADIOLOGY' | 'PHARMACY' | 'OT';
  subtotal: number;
  discountApprovedAmount: number;
  discountReason?: string;
  taxAmount: number; // e.g. 5% PRA services tax or standard PST
  netBill: number;
  insuranceClaimProvider: 'NONE' | 'SEHAT_CARD' | 'EFU' | 'JUBILEE' | 'STATE_LIFE';
  insuranceClaimAmount: number;
  amountPaidByPatient: number;
  paymentMethod: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'CHEQUE';
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID' | 'REFUNDED';
  refundAmount?: number;
  createdByStaffId: string;
  createdByStaffName: string;
  createdAt: string;
  items: {
    description: string;
    qty: number;
    price: number;
  }[];
}

export interface HospitalSettings {
  hospitalName: string;
  hospitalAddress: string;
  phone: string;
  taxRatePercent: number;
  whatsappTemplate: string;
  smsTemplate: string;
  logoText: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  staffId: string;
  staffName: string;
  role: UserRole;
  action: string; // e.g. "Register Patient", "Dispense Medicine", "Delete OT Booking"
  ipAddress: string;
  details: string;
}
