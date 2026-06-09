/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getPrismaClient } from '../db/prisma';

export class BillingService {
  static async createInvoice(data: {
    patientMrn: string;
    module: string;
    subtotal: number;
    discountApprovedAmount: number;
    discountReason?: string;
    taxAmount: number;
    netBill: number;
    paymentMethod: string;
    items: Array<{ description: string; quantity: number; unitPrice: number }>;
    createdBy?: string;
  }) {
    const prisma = getPrismaClient();
    if (!prisma) {
      throw new Error("Prisma Client unconfigured.");
    }

    const patient = await prisma.patient.findUnique({
      where: { mrn: data.patientMrn }
    });

    if (!patient) {
      throw new Error("Patient not registered in system databases (Missing MRN Mapping).");
    }

    const invoiceNumber = `BILL-26-${Math.floor(10000 + Math.random() * 90000)}`;

    return prisma.$transaction(async (tx) => {
      const bill = await tx.bill.create({
        data: {
          invoiceNumber,
          patientId: patient.id,
          module: data.module,
          subtotal: data.subtotal,
          discountApprovedAmount: data.discountApprovedAmount,
          discountReason: data.discountReason,
          taxAmount: data.taxAmount,
          netBill: data.netBill,
          paymentMethod: data.paymentMethod,
          status: 'PAID', // In clinical flows, invoice payment completes status parameters
          createdBy: data.createdBy || 'SYSTEM',
        }
      });

      // Bulk create invoice line items
      for (const item of data.items) {
        await tx.billItem.create({
          data: {
            billId: bill.id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
            createdBy: data.createdBy || 'SYSTEM',
          }
        });
      }

      // Add payment logs
      await tx.payment.create({
        data: {
          billId: bill.id,
          amountPaid: data.netBill,
          paymentMethod: data.paymentMethod,
          notes: 'Auto validated payment record.',
          createdBy: data.createdBy || 'SYSTEM',
        }
      });

      return bill;
    });
  }

  static async getInvoices(searchQuery?: string) {
    const prisma = getPrismaClient();
    if (!prisma) {
      throw new Error("Prisma client unconfigured.");
    }

    return prisma.bill.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        patient: true,
        items: true,
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
