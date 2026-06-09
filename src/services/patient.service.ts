/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getPrismaClient } from '../db/prisma';

export class PatientService {
  static async getPatients(searchQuery?: string) {
    const prisma = getPrismaClient();
    if (!prisma) {
      throw new Error("Prisma client unconfigured.");
    }

    return prisma.patient.findMany({
      where: {
        deletedAt: null,
        OR: searchQuery ? [
          { name: { contains: searchQuery } },
          { mrn: { contains: searchQuery } },
          { cnic: { contains: searchQuery } },
          { phone: { contains: searchQuery } },
        ] : undefined
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async registerPatient(data: {
    name: string;
    age: number;
    gender: string;
    bloodGroup?: string;
    address?: string;
    phone?: string;
    cnic?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    insuranceProvider?: string;
    insurancePolicyNumber?: string;
    photoUrl?: string;
    createdBy?: string;
  }) {
    const prisma = getPrismaClient();
    if (!prisma) {
      throw new Error("Prisma client unconfigured.");
    }

    // Generate unique MRN
    const mrn = `MRN-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    return prisma.patient.create({
      data: {
        ...data,
        mrn,
      }
    });
  }

  static async getPatientByMrn(mrn: string) {
    const prisma = getPrismaClient();
    if (!prisma) {
      throw new Error("Prisma client unconfigured.");
    }

    return prisma.patient.findUnique({
      where: { mrn, deletedAt: null }
    });
  }
}
