/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#0f172a',
  },
  header: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#0ea5e9', // Blue accent for admitting files
    paddingBottom: 12,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  titleCol: {
    flexDirection: 'column',
  },
  hospName: {
    fontSize: 15,
    fontFamily: 'Helvetica-Bold',
    color: '#0369a1',
  },
  sub: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 2,
  },
  summaryBadge: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#0369a1',
    textAlign: 'right',
  },
  patientBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 4,
    marginBottom: 15,
  },
  halfWidth: {
    width: '50%',
    marginBottom: 8,
  },
  label: {
    fontSize: 7,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  val: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    marginTop: 1,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    backgroundColor: '#0284c7',
    color: '#ffffff',
    padding: 5,
    borderRadius: 2,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  ledgerTable: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 15,
  },
  th: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    padding: 6,
    fontFamily: 'Helvetica-Bold',
  },
  tr: {
    flexDirection: 'row',
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tdDesc: { width: '60%' },
  tdRate: { width: '20%', textAlign: 'right' },
  tdTotal: { width: '20%', textAlign: 'right' },
  blocksContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  notesBlock: {
    width: '48%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#fafafa',
  },
  blockHeader: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#0369a1',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  blockContent: {
    fontSize: 8,
    color: '#334155',
    lineHeight: 1.3,
  },
  signSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
  },
  fText: {
    fontSize: 7,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 15,
  }
});

interface IPDSummaryPDFProps {
  admission: {
    id: string;
    ward: string;
    bedNumber: string;
    admittedAt: string;
    dischargedAt?: string;
    status: string;
    diagnosis?: string;
    dailyCharge: number;
    totalCalculatedBill: number;
    dischargeInstructions?: string;
    patient: {
      name: string;
      mrn: string;
      age: number;
      gender: string;
    };
  };
}

export const IPDSummaryPDF: React.FC<IPDSummaryPDFProps> = ({ admission }) => {
  const admitDateFormatted = new Date(admission.admittedAt).toLocaleDateString('en-GB');
  const dischargeDateFormatted = admission.dischargedAt
    ? new Date(admission.dischargedAt).toLocaleDateString('en-GB')
    : 'UNDER OBSERVATION';

  const calculateDays = () => {
    const start = new Date(admission.admittedAt);
    const end = admission.dischargedAt ? new Date(admission.dischargedAt) : new Date();
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diff || 1;
  };

  const stayDays = calculateDays();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleCol}>
            <Text style={styles.hospName}>Mayo Hospital Inpatient Care Unit</Text>
            <Text style={styles.sub}>Administrative Discharge Summary & Ledger Statement</Text>
          </View>
          <View>
            <Text style={styles.summaryBadge}>CLINICAL IPD SUMMARY</Text>
            <Text style={[styles.sub, { textAlign: 'right' }]}>MRN: {admission.patient?.mrn || 'N/A'}</Text>
          </View>
        </View>

        {/* Patient and Lodging Metadata */}
        <View style={styles.patientBox}>
          <View style={styles.halfWidth}>
            <Text style={styles.label}>Patient Name</Text>
            <Text style={styles.val}>{admission.patient?.name || 'Zainab Bibi'}</Text>
          </View>
          <View style={styles.halfWidth}>
            <Text style={styles.label}>Ward / Bed Occupied</Text>
            <Text style={styles.val}>{admission.ward} — Bed #{admission.bedNumber}</Text>
          </View>
          <View style={styles.halfWidth}>
            <Text style={styles.label}>Date Registered & Admitted</Text>
            <Text style={styles.val}>{admitDateFormatted}</Text>
          </View>
          <View style={styles.halfWidth}>
            <Text style={styles.label}>Date of Discharge / Release</Text>
            <Text style={styles.val}>{dischargeDateFormatted}</Text>
          </View>
        </View>

        {/* Financial Charge Ledger */}
        <Text style={styles.sectionTitle}>Lodging Ledger Statement</Text>
        <View style={styles.ledgerTable}>
          <View style={styles.th}>
            <Text style={styles.tdDesc}>Service / Lodging Charge Details</Text>
            <Text style={styles.tdRate}>Daily Rate (Rs.)</Text>
            <Text style={styles.tdTotal}>Subtotal (Rs.)</Text>
          </View>
          <View style={styles.tr}>
            <Text style={styles.tdDesc}>{admission.ward} (Stay duration: {stayDays} day(s))</Text>
            <Text style={styles.tdRate}>{admission.dailyCharge.toLocaleString()}</Text>
            <Text style={styles.tdTotal}>{(admission.dailyCharge * stayDays).toLocaleString()}</Text>
          </View>
          <View style={styles.tr}>
            <Text style={[styles.tdDesc, { fontFamily: 'Helvetica-Bold' }]}>Calculated Stay Bill total:</Text>
            <Text style={styles.tdRate} />
            <Text style={[styles.tdTotal, { fontFamily: 'Helvetica-Bold', color: '#ef4444' }]}>
              Rs {admission.totalCalculatedBill.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Doctors notes and discharge info */}
        <View style={styles.blocksContainer}>
          <View style={styles.notesBlock}>
            <Text style={styles.blockHeader}>Admitting Diagnosis Notes</Text>
            <Text style={styles.blockContent}>{admission.diagnosis || 'Cardiovascular distress tracking.'}</Text>
          </View>
          <View style={styles.notesBlock}>
            <Text style={styles.blockHeader}>Specialist Discharge Instructions</Text>
            <Text style={styles.blockContent}>
              {admission.dischargeInstructions || 'Follow-up prescriptions and vitals charts logs are requested on weekly clinic revisitations.'}
            </Text>
          </View>
        </View>

        {/* Signatures */}
        <View style={styles.signSection}>
          <View style={{ width: '40%', borderTopWidth: 1, borderTopColor: '#94a3b8', marginTop: 15, paddingTop: 4, alignItems: 'center' }}>
            <Text style={{ fontSize: 8, color: '#64748b' }}>Primary Duty Attendant Nurse</Text>
          </View>
          <View style={{ width: '40%', borderTopWidth: 1, borderTopColor: '#94a3b8', marginTop: 15, paddingTop: 4, alignItems: 'center' }}>
            <Text style={{ fontSize: 8, color: '#64748b' }}>Authorized Hospital Register Specialist</Text>
          </View>
        </View>

        <Text style={styles.fText}>
          Mayo Trust Complex — Standard IPD medical release file copy. Validated on {new Date().toLocaleDateString('en-GB')}.
        </Text>
      </Page>
    </Document>
  );
};
export default IPDSummaryPDF;
