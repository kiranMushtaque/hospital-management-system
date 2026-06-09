/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getPrismaClient } from '../db/prisma';

export class OPDService {
  static async getVisits() {
    const prisma = getPrismaClient();
    if (!prisma) {
      throw new Error("Prisma client unconfigured.");
    }
    return prisma.oPDVisit.findMany({
      where: { deletedAt: null },
      include: {
        patient: true,
        prescriptions: true,
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async scheduleVisit(data: {
    patientMrn: string;
    doctorEmployeeId: string;
    department: string;
    vitalsBp?: string;
    vitalsPulse?: string;
    vitalsTemp?: string;
    vitalsWeight?: string;
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
      if (!patient) throw new Error("Patient not registered.");

      const doctor = await tx.user.findUnique({
        where: { employeeId: data.doctorEmployeeId }
      });
      if (!doctor) throw new Error("Physician Employee ID not active.");

      // Calculate token number for the day
      const count = await tx.oPDVisit.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0,0,0,0))
          }
        }
      });

      const tokenNumber = count + 1;

      return tx.oPDVisit.create({
        data: {
          tokenNumber,
          patientMrn: patient.mrn,
          patientId: patient.id,
          doctorId: doctor.id,
          department: data.department,
          vitalsBp: data.vitalsBp || "120/80",
          vitalsPulse: data.vitalsPulse || "75",
          vitalsTemp: data.vitalsTemp || "98.6 Fac",
          vitalsWeight: data.vitalsWeight || "70 kg",
          charges: 1500.0,
          status: 'PENDING',
          createdBy: data.createdBy || 'SYSTEM',
        }
      });
    });
  }

  static async submitDoctorConsult(visitId: string, diagnosis: string, plan: string, medicinesList: Array<{ code: string; name: string; dosage: string; duration: string }>, staffId?: string) {
    const prisma = getPrismaClient();
    if (!prisma) {
      throw new Error("Prisma client unconfigured.");
    }

    return prisma.$transaction(async (tx) => {
      const visit = await tx.oPDVisit.update({
        where: { id: visitId },
        data: {
          diagnosis,
          treatmentPlan: plan,
          status: 'COMPLETED',
        }
      });

      for (const rx of medicinesList) {
        await tx.oPDPrescription.create({
          data: {
            opdVisitId: visit.id,
            medicineId: rx.code,
            name: rx.name,
            dosage: rx.dosage,
            duration: rx.duration,
            createdBy: staffId || 'SYSTEM',
          }
        });
      }

      return visit;
    });
  }
}
