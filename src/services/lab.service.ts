/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getPrismaClient } from '../db/prisma';

export class LabService {
  static async getOrders() {
    const prisma = getPrismaClient();
    if (!prisma) {
      throw new Error("Prisma client unconfigured.");
    }
    return prisma.labOrder.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async createOrder(data: {
    patientMrn: string;
    testCode: string;
    requestedByDoctorId?: string;
    createdBy?: string;
  }) {
    const prisma = getPrismaClient();
    if (!prisma) {
      throw new Error("Prisma client unconfigured.");
    }

    const patient = await prisma.patient.findUnique({
      where: { mrn: data.patientMrn }
    });

    if (!patient) throw new Error("Patient not registered.");

    const test = await prisma.labTest.findUnique({
      where: { code: data.testCode }
    });

    if (!test) throw new Error("Test template not found in master catalog.");

    const doctor = data.requestedByDoctorId ? await prisma.user.findUnique({
      where: { id: data.requestedByDoctorId }
    }) : null;

    return prisma.labOrder.create({
      data: {
        patientId: patient.id,
        testId: test.id,
        testName: test.name,
        sampleType: test.sampleType,
        requestedByDoctorId: doctor?.id,
        requestedByDoctorName: doctor?.name || "OPD Duty Doctor",
        charges: test.price,
        status: 'ORDERED',
        createdBy: data.createdBy || 'SYSTEM',
      }
    });
  }

  static async recordResults(orderId: string, resultValue: string, isCritical: boolean, notes?: string, staffId?: string) {
    const prisma = getPrismaClient();
    if (!prisma) {
      throw new Error("Prisma client unconfigured.");
    }

    const tech = staffId ? await prisma.user.findUnique({ where: { id: staffId } }) : null;

    return prisma.$transaction(async (tx) => {
      const order = await tx.labOrder.update({
        where: { id: orderId },
        data: {
          resultValue,
          isCritical,
          notes,
          status: 'VALIDATED',
          labTechId: tech?.id,
          labTechName: tech?.name || "Lab Technician",
        }
      });

      await tx.labResult.upsert({
        where: { labOrderId: orderId },
        update: {
          resultData: resultValue,
          isCritical,
          remarks: notes,
          verifiedBy: tech?.name,
        },
        create: {
          labOrderId: orderId,
          resultData: resultValue,
          isCritical,
          remarks: notes,
          verifiedBy: tech?.name,
          createdBy: staffId || 'SYSTEM',
        }
      });

      return order;
    });
  }
}
