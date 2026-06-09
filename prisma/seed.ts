/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding clinical registers database...');

  // 1. Create Default Settings
  const defaultSettings = await prisma.setting.upsert({
    where: { id: 'default-settings' },
    update: {},
    create: {
      id: 'default-settings',
      hospitalName: 'Mayo Trust Healthcare Complex',
      hospitalAddress: 'Mayo Hospital Road, Near Anarkali Bazaar, Lahore, Punjab, Pakistan',
      phone: '+92 42 111-222-333',
      taxRatePercent: 5.0,
      smsTemplate: 'Dear [PATIENT], your patient ledger receipt of RS [AMOUNT] has been authorized by [HOSPITAL] managers successfully.',
      whatsappTemplate: 'Assalam o Alaikum {patientName}, Your bill from {hospitalName} has been generated. Bill No: {txnId}. Date: {date}. Total: Rs {amount}. Paid: {paidAmount}. Thank you for choosing us!',
      logoText: 'Mayo Trust ERP',
    }
  });

  // 2. Create Default Roles
  const defaultRoles = ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'CASHIER', 'LAB_TECH'];
  for (const role of defaultRoles) {
    await prisma.role.upsert({
      where: { name: role },
      update: {},
      create: {
        name: role,
        description: `Clinical ERP authorized profile for ${role}`,
      }
    });
  }

  // 3. Create Default Users (including doctors and administrative staff)
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash('admin123', salt);
  const doctorHash = await bcrypt.hash('doctor123', salt);

  const usersToSeed = [
    {
      employeeId: 'EMP-1010',
      name: 'Dr. Asif Mayo',
      email: 'asif.mayo@mayotrust.pk',
      phone: '+92 300 8889900',
      cnic: '35201-1111111-1',
      role: 'SUPER_ADMIN',
      department: 'ADMINISTRATION',
      passwordHash: passwordHash,
      salary: 350000,
    },
    {
      employeeId: 'EMP-2020',
      name: 'Dr. Sadia Malik',
      email: 's.malik@mayotrust.pk',
      phone: '+92 300 1112233',
      cnic: '35201-8812345-9',
      role: 'DOCTOR',
      department: 'CARDIOLOGY',
      passwordHash: doctorHash,
      salary: 280000,
    },
    {
      employeeId: 'EMP-2030',
      name: 'Dr. Haris Jameel',
      email: 'h.jameel@mayotrust.pk',
      phone: '+92 321 4445566',
      cnic: '35202-1234567-2',
      role: 'DOCTOR',
      department: 'GENERAL_OPD',
      passwordHash: doctorHash,
      salary: 190000,
    },
    {
      employeeId: 'EMP-3030',
      name: 'Sister Maria',
      email: 'maria.nurse@mayotrust.pk',
      phone: '+92 345 2233445',
      cnic: '35202-9988776-6',
      role: 'NURSE',
      department: 'ICU',
      passwordHash: passwordHash,
      salary: 95000,
    },
    {
      employeeId: 'EMP-4040',
      name: 'Basit Ali',
      email: 'basit.lab@mayotrust.pk',
      phone: '+92 311 9988776',
      cnic: '35102-1212121-7',
      role: 'LAB_TECH',
      department: 'DIAGNOSTICS',
      passwordHash: passwordHash,
      salary: 110000,
    },
    {
      employeeId: 'EMP-5050',
      name: 'Kamran Khan',
      email: 'kamran.cash@mayotrust.pk',
      phone: '+92 322 1234567',
      cnic: '35201-3456789-3',
      role: 'CASHIER',
      department: 'ACCOUNTS',
      passwordHash: passwordHash,
      salary: 85000,
    },
    {
      employeeId: 'EMP-6060',
      name: 'Sonia Bibi',
      email: 'sonia.receptionist@mayotrust.pk',
      phone: '+92 300 7654321',
      cnic: '35202-4545454-4',
      role: 'RECEPTIONIST',
      department: 'FRONT_DESK',
      passwordHash: passwordHash,
      salary: 65000,
    }
  ];

  for (const user of usersToSeed) {
    await prisma.user.upsert({
      where: { employeeId: user.employeeId },
      update: {
        passwordHash: user.passwordHash,
        salary: user.salary,
      },
      create: user
    });
  }

  // 4. Create Sample Wards
  const wards = [
    { name: 'Intensive Care Unit (ICU)', type: 'ICU', totalBeds: 5 },
    { name: 'Male Surgical Ward A', type: 'GENERAL', totalBeds: 10 },
    { name: 'Female Maternity Ward B', type: 'GENERAL', totalBeds: 10 },
  ];

  for (const w of wards) {
    const wardObj = await prisma.ward.upsert({
      where: { name: w.name },
      update: {},
      create: w
    });

    // Create Beds
    for (let i = 1; i <= w.totalBeds; i++) {
      const bNo = `${w.type.slice(0,3)}-${i.toString().padStart(2, '0')}`;
      await prisma.bed.create({
        data: {
          bedNumber: bNo,
          wardId: wardObj.id,
          status: i === 3 ? 'OCCUPIED' : 'AVAILABLE',
          dailyCharge: w.type === 'ICU' ? 4500 : 1500,
        }
      });
    }
  }

  // 5. Create Sample Patients
  const patients = [
    {
      mrn: 'MRN-2026-8910',
      name: 'Tariq Mehmood',
      age: 52,
      gender: 'MALE',
      bloodGroup: 'O_POSITIVE',
      address: 'House #12, Phase 4 DHA, Lahore, Punjab, Pakistan',
      phone: '+92 315 4455667',
      cnic: '35201-9012345-1',
      emergencyContactName: 'Kashif Mehmood',
      emergencyContactPhone: '+92 333 5558899',
      insuranceProvider: 'Jubilee General Insurance',
      insurancePolicyNumber: 'JUB-8902-1A'
    },
    {
      mrn: 'MRN-2026-9025',
      name: 'Zainab Bibi',
      age: 29,
      gender: 'FEMALE',
      bloodGroup: 'B_NEGATIVE',
      address: 'Plot 4, Block D, Model Town, Lahore, Pakistan',
      phone: '+92 301 2233445',
      cnic: '34101-7890123-2',
      emergencyContactName: 'Muhammad Salman',
      emergencyContactPhone: '+92 300 4455667',
      insuranceProvider: 'EFU General Insurance',
      insurancePolicyNumber: 'EFU-990-23'
    }
  ];

  for (const p of patients) {
    await prisma.patient.upsert({
      where: { mrn: p.mrn },
      update: {},
      create: p
    });
  }

  // 6. Create Medicines Catalog
  const medicines = [
    { code: 'MED-001', name: 'Panadol 500mg Tab', genericName: 'Paracetamol', category: 'ORAL', batchNumber: 'B-PN109', stockCount: 1200, minStockLevel: 100, expiryDate: '2028-06-12', salePrice: 4.5 },
    { code: 'MED-002', name: 'Amoxil 250mg Cap', genericName: 'Amoxicillin', category: 'ORAL', batchNumber: 'B-AM209', stockCount: 450, minStockLevel: 50, expiryDate: '2027-12-05', salePrice: 15.0 },
    { code: 'MED-003', name: 'Loprin 75mg Tab', genericName: 'Aspirin', category: 'ORAL', batchNumber: 'B-LP01', stockCount: 600, minStockLevel: 40, expiryDate: '2028-03-24', salePrice: 3.0 },
    { code: 'MED-004', name: 'Novorapid Flexpen', genericName: 'Insulin Aspart', category: 'INJECTION', batchNumber: 'B-NV881', stockCount: 15, minStockLevel: 5, expiryDate: '2027-10-18', salePrice: 2850.0 },
  ];

  for (const m of medicines) {
    await prisma.medicine.upsert({
      where: { code: m.code },
      update: {
        stockCount: m.stockCount,
        salePrice: m.salePrice,
      },
      create: m
    });
  }

  // 7. Create Diagnostic Lab Tests
  const labTests = [
    { code: 'LT-CBC', name: 'Complete Blood Count (CBC)', sampleType: 'Whole Blood (EDTA)', normalRange: 'Hb: 13.5-17.5 g/dL, WBC: 4.0-11.0 x10^9/L, Platelets: 150-450 x10^9/L', price: 950 },
    { code: 'LT-LFT', name: 'Liver Function Tests (LFTs)', sampleType: 'Serum (Yellow Top)', normalRange: 'Bilirubin: <1.2 mg/dL, ALT: <50 U/L, AST: <40 U/L', price: 1850 },
    { code: 'LT-RFT', name: 'Renal Function Tests (RFTs)', sampleType: 'Serum / Urine', normalRange: 'Urea: 15-45 mg/dL, Creatinine: 0.6-1.2 mg/dL', price: 1450 },
    { code: 'LT-FBS', name: 'Fasting Blood Sugar (FBS)', sampleType: 'Fluoride Plasma', normalRange: '70 - 100 mg/dL', price: 400 },
  ];

  for (const t of labTests) {
    await prisma.labTest.upsert({
      where: { code: t.code },
      update: {
        price: t.price,
      },
      create: t
    });
  }

  console.log('Clinical database registers seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
