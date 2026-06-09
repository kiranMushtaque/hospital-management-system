/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getPrismaClient } from '../db/prisma';

export class PharmacyService {
  static async getMedicines() {
    const prisma = getPrismaClient();
    if (!prisma) {
      throw new Error("Prisma client unconfigured.");
    }
    return prisma.medicine.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' }
    });
  }

  static async dispenseMedicine(medicineCode: string, qty: number, patientName: string, patientMrn?: string, staffId?: string) {
    const prisma = getPrismaClient();
    if (!prisma) {
      throw new Error("Prisma client unconfigured.");
    }

    return prisma.$transaction(async (tx) => {
      const med = await tx.medicine.findUnique({
        where: { code: medicineCode }
      });

      if (!med) throw new Error("Medicine not found in catalog.");
      if (med.stockCount < qty) {
        throw new Error(`Insufficient inventory: only ${med.stockCount} units available for ${med.name}.`);
      }

      const updatedMed = await tx.medicine.update({
        where: { id: med.id },
        data: {
          stockCount: med.stockCount - qty,
        }
      });

      const orderCost = med.salePrice * qty;

      await tx.pharmacyOrder.create({
        data: {
          patientName,
          patientMrn,
          totalBills: orderCost,
          status: 'DISPENSED',
          createdBy: staffId || 'SYSTEM',
        }
      });

      return updatedMed;
    });
  }

  static async purchaseStock(medicineCode: string, addedQty: number, supplierName?: string, staffId?: string) {
    const prisma = getPrismaClient();
    if (!prisma) {
      throw new Error("Prisma client unconfigured.");
    }

    return prisma.$transaction(async (tx) => {
      const med = await tx.medicine.findUnique({
        where: { code: medicineCode }
      });

      if (!med) throw new Error("Medicine code incorrect.");

      const updated = await tx.medicine.update({
        where: { id: med.id },
        data: {
          stockCount: med.stockCount + addedQty,
          supplierName: supplierName || med.supplierName,
        }
      });

      await tx.medicineStock.create({
        data: {
          medicineId: med.id,
          batchNumber: med.batchNumber,
          quantityAdded: addedQty,
          supplierName: supplierName || med.supplierName,
          createdBy: staffId || 'SYSTEM',
        }
      });

      return updated;
    });
  }
}
