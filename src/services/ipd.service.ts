/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getPrismaClient } from '../db/prisma';

export class IPDService {
  static async getBeds() {
    const prisma = getPrismaClient();
    if (!prisma) {
      throw new Error("Prisma client unconfigured.");
    }
    return prisma.bed.findMany({
      where: { deletedAt: null },
      include: { ward: true }
    });
  }

  static async getAdmissions() {
    const prisma = getPrismaClient();
    if (!prisma) {
      throw new Error("Prisma client unconfigured.");
    }
    return prisma.iPDAdmission.findMany({
      where: { deletedAt: null },
      include: {
        patient: true,
      },
      orderBy: { admittedAt: 'desc' }
    });
  }

  static async admitPatient(data: {
    patientMrn: string;
    bedId: string;
    diagnosis: string;
    createdBy?: string;
  }) {
    const prisma = getPrismaClient();
    if (!prisma) {
      throw new Error("Prisma client unconfigured.");
    }

    return prisma.$transaction(async (tx) => {
      const patient = await tx.patient.findUnique({
        where: { mrn: data.patientMrn }
      });

      if (!patient) throw new Error("Patient MRN not matched.");

      const bed = await tx.bed.findUnique({
        where: { id: data.bedId },
        include: { ward: true }
      });

      if (!bed || bed.status !== 'AVAILABLE') {
        throw new Error("Selected clinical bed is currently occupied or undergoing sanitation.");
      }

      // Mark Bed as OCCUPIED
      await tx.bed.update({
        where: { id: bed.id },
        data: { status: 'OCCUPIED' }
      });

      // Create IPD Admission File
      return tx.iPDAdmission.create({
        data: {
          patientId: patient.id,
          ward: bed.ward.name,
          bedId: bed.id,
          bedNumber: bed.bedNumber,
          diagnosis: data.diagnosis,
          dailyCharge: bed.dailyCharge,
          totalCalculatedBill: bed.dailyCharge,
          status: 'ADMITTED',
          createdBy: data.createdBy || 'SYSTEM',
        }
      });
    });
  }

  static async recordVitals(admissionId: string, note: string, notes?: string, charge?: number, staffId?: string) {
    const prisma = getPrismaClient();
    if (!prisma) {
      throw new Error("Prisma client unconfigured.");
    }

    const admission = await prisma.iPDAdmission.findUnique({
      where: { id: admissionId }
    });

    if (!admission || admission.status === 'DISCHARGED') {
      throw new Error("Active IPD admission profile is closed or locked.");
    }

    const updatedCharges = admission.totalCalculatedBill + (charge || 0);

    return prisma.iPDAdmission.update({
      where: { id: admissionId },
      data: {
        totalCalculatedBill: updatedCharges,
        dischargeInstructions: notes ? `${admission.dischargeInstructions || ''}\n[Vitals Update]: ${notes}` : admission.dischargeInstructions,
      }
    });
  }

  static async dischargePatient(admissionId: string, instructions: string, staffId?: string) {
    const prisma = getPrismaClient();
    if (!prisma) {
      throw new Error("Prisma client unconfigured.");
    }

    return prisma.$transaction(async (tx) => {
      const admission = await tx.iPDAdmission.findUnique({
        where: { id: admissionId }
      });

      if (!admission || admission.status === 'DISCHARGED') {
        throw new Error("Patient already discharged from unit.");
      }

      // Restore bed status to AVAILABLE
      await tx.bed.update({
        where: { id: admission.bedId },
        data: { status: 'AVAILABLE' }
      });

      // Update IPD File
      const discharged = await tx.iPDAdmission.update({
        where: { id: admissionId },
        data: {
          status: 'DISCHARGED',
          dischargedAt: new Date(),
          dischargeInstructions: instructions,
        },
        include: { patient: true }
      });

      // Issue billing ticket automatically
      const invoiceNumber = `BILL-IPD-${Math.floor(1000 + Math.random() * 9000)}`;
      const tax = discharged.totalCalculatedBill * 0.05;
      const net = discharged.totalCalculatedBill + tax;

      const bill = await tx.bill.create({
        data: {
          invoiceNumber,
          patientId: discharged.patientId,
          module: 'IPD',
          subtotal: discharged.totalCalculatedBill,
          taxAmount: tax,
          netBill: net,
          status: 'UNPAID', // Discharge balance sent to Cash checkout counters
          createdBy: staffId || 'SYSTEM',
        }
      });

      await tx.billItem.create({
        data: {
          billId: bill.id,
          description: `IPD Bed stay daily accumulatives: Ward: ${discharged.ward}, Bed: ${discharged.bedNumber}`,
          quantity: 1,
          unitPrice: discharged.totalCalculatedBill,
          totalPrice: discharged.totalCalculatedBill,
          createdBy: staffId || 'SYSTEM',
        }
      });

      return discharged;
    });
  }
}
