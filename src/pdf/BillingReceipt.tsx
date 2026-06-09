/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#1e293b',
  },
  header: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#10b981',
    paddingBottom: 15,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoSection: {
    flexDirection: 'column',
  },
  hospitalName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f766e',
  },
  hospitalSub: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 2,
  },
  invoiceTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'right',
  },
  invoiceNo: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#ef4444',
    textAlign: 'right',
    marginTop: 2,
  },
  metaSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 4,
  },
  metaCol: {
    flexDirection: 'column',
    width: '45%',
  },
  metaLabel: {
    fontSize: 8,
    color: '#64748b',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  metaText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 6,
  },
  table: {
    width: '100%',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0f766e',
    color: '#ffffff',
    fontWeight: 'bold',
    padding: 6,
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  colDesc: { width: '50%' },
  colQty: { width: '15%', textAlign: 'center' },
  colPrice: { width: '15%', textAlign: 'right' },
  colTotal: { width: '20%', textAlign: 'right' },
  totalsContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    marginTop: 15,
    paddingRight: 6,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '40%',
    paddingVertical: 3,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '40%',
    borderTopWidth: 1.5,
    borderTopColor: '#0f766e',
    paddingVertical: 5,
    marginTop: 4,
  },
  grandTotalLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0f766e',
  },
  grandTotalVal: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#ef4444',
  },
  footer: {
    marginTop: 40,
    borderTopWidth: 1,
    borderTopColor: '#cbd5e1',
    paddingTop: 10,
    textAlign: 'center',
  },
  footerText: {
    fontSize: 8,
    color: '#94a3b8',
  },
  qrPlaceholder: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    padding: 4,
    borderRadius: 3,
    fontSize: 7,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
  }
});

interface BillingReceiptPDFProps {
  invoice: {
    invoiceNumber: string;
    createdAt: string;
    module: string;
    subtotal: number;
    discountApprovedAmount: number;
    taxAmount: number;
    netBill: number;
    paymentMethod: string;
    patient: {
      name: string;
      mrn: string;
      cnic: string;
      phone: string;
    };
    items: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
    }>;
  };
}

export const BillingReceiptPDF: React.FC<BillingReceiptPDFProps> = ({ invoice }) => {
  const formattedDate = new Date(invoice.createdAt).toLocaleDateString('en-GB');

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoSection}>
            <Text style={styles.hospitalName}>Mayo Trust Healthcare Complex</Text>
            <Text style={styles.hospitalSub}>Mayo Hospital Road, Near Anarkali, Lahore (PRA Registered)</Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>OFFICIAL BILLING RECEIPT</Text>
            <Text style={styles.invoiceNo}>{invoice.invoiceNumber}</Text>
          </View>
        </View>

        {/* Metas */}
        <View style={styles.metaSection}>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Patient Details</Text>
            <Text style={styles.metaText}>{invoice.patient.name}</Text>
            <Text style={{ fontSize: 8 }}>MRN: {invoice.patient.mrn}</Text>
            <Text style={{ fontSize: 8 }}>CNIC: {invoice.patient.cnic || 'N/A'}</Text>
            <Text style={{ fontSize: 8 }}>Phone: {invoice.patient.phone || 'N/A'}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Invoice Details</Text>
            <Text style={styles.metaText}>Date: {formattedDate}</Text>
            <Text style={{ fontSize: 8 }}>Department Module: {invoice.module}</Text>
            <Text style={{ fontSize: 8 }}>Payment Ledger: {invoice.paymentMethod}</Text>
            <Text style={{ fontSize: 8 }}>Verified Status: PAID</Text>
          </View>
          <View style={styles.qrPlaceholder}>
            <Text>QR Code</Text>
            <Text style={{ fontSize: 5, marginTop: 4 }}>{invoice.invoiceNumber}</Text>
          </View>
        </View>

        {/* Item Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colDesc, { color: '#ffffff' }]}>Description</Text>
            <Text style={[styles.colQty, { color: '#ffffff' }]}>Qty</Text>
            <Text style={[styles.colPrice, { color: '#ffffff' }]}>Rate (Rs.)</Text>
            <Text style={[styles.colTotal, { color: '#ffffff' }]}>Subtotal (Rs.)</Text>
          </View>

          {invoice.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>{item.unitPrice.toLocaleString()}</Text>
              <Text style={styles.colTotal}>{(item.quantity * item.unitPrice).toLocaleString()}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalRow}>
            <Text style={{ color: '#64748b' }}>Subtotal:</Text>
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>Rs {invoice.subtotal.toLocaleString()}</Text>
          </View>
          {invoice.discountApprovedAmount > 0 && (
            <View style={styles.totalRow}>
              <Text style={{ color: '#10b981' }}>Discount Approval:</Text>
              <Text style={{ fontFamily: 'Helvetica-Bold', color: '#10b981' }}>- Rs {invoice.discountApprovedAmount.toLocaleString()}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={{ color: '#64748b' }}>Punjab Revenue (PRA) 5%:</Text>
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>Rs {invoice.taxAmount.toLocaleString()}</Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Net Bill:</Text>
            <Text style={styles.grandTotalVal}>Rs {invoice.netBill.toLocaleString()}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', marginBottom: 2 }}>* This is a PRA software validated computerized billing statement *</Text>
          <Text style={styles.footerText}>For queries, please dial our 24/7 Helpline: +92 42 111-222-333 or email billing@mayotrust.pk</Text>
          <Text style={[styles.footerText, { marginTop: 4 }]}>Mayo Trust Complex — Thank you for choosing us for your therapeutic interventions.</Text>
        </View>
      </Page>
    </Document>
  );
};
export default BillingReceiptPDF;
