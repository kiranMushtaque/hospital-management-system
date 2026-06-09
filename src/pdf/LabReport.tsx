/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 35,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#0f172a',
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: '#0f766e',
    paddingBottom: 10,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  titleCol: {
    flexDirection: 'column',
  },
  title: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#0f766e',
  },
  subtitle: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 2,
  },
  reportBadge: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#1e293b',
    textAlign: 'right',
  },
  badgeSub: {
    fontSize: 8,
    color: '#ef4444',
    textAlign: 'right',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  patientBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 4,
    padding: 10,
    marginBottom: 20,
    backgroundColor: '#f8fafc',
  },
  patientField: {
    width: '33%',
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 7,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  fieldVal: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    marginTop: 1,
  },
  testSection: {
    marginBottom: 25,
  },
  testHeader: {
    backgroundColor: '#0f766e',
    color: '#ffffff',
    fontSize: 10,
    padding: 6,
    fontFamily: 'Helvetica-Bold',
    borderRadius: 2,
    marginBottom: 10,
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  tableRowHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    padding: 6,
    fontFamily: 'Helvetica-Bold',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    alignItems: 'center',
  },
  colParam: { width: '35%' },
  colValue: { width: '25%', fontFamily: 'Helvetica-Bold' },
  colRange: { width: '40%' },
  criticalValue: {
    color: '#ef4444',
    fontFamily: 'Helvetica-Bold',
  },
  signSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  signBox: {
    flexDirection: 'column',
    alignItems: 'center',
    width: '40%',
  },
  signLine: {
    width: '80%',
    borderBottomWidth: 1,
    borderBottomColor: '#94a3b8',
    marginBottom: 5,
  },
  signTitle: {
    fontSize: 8,
    color: '#64748b',
  },
  disclaimer: {
    marginTop: 30,
    backgroundColor: '#fffbeb',
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
    padding: 8,
    borderRadius: 2,
  },
  disclaimerText: {
    fontSize: 7,
    color: '#b45309',
  }
});

interface LabReportPDFProps {
  order: {
    id: string;
    testName: string;
    sampleType: string;
    requestedByDoctorName: string;
    labTechName: string;
    status: string;
    isCritical: boolean;
    resultValue: string;
    notes?: string;
    createdAt: string;
    patient: {
      name: string;
      age: number;
      gender: string;
      mrn: string;
    };
  };
}

export const LabReportPDF: React.FC<LabReportPDFProps> = ({ order }) => {
  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-GB');

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleCol}>
            <Text style={styles.title}>Mayo Diagnostics Laboratory</Text>
            <Text style={styles.subtitle}>ISO 9001:2015 Accredited | Mayo Hospital Road, Lahore</Text>
          </View>
          <View>
            <Text style={styles.reportBadge}>CLINICAL PATHOLOGY REPORT</Text>
            <Text style={styles.badgeSub}>{order.isCritical ? '⚠️ ATYPICAL RESIDUALS FLAG' : 'NORMAL RANGE STATUS'}</Text>
          </View>
        </View>

        {/* Patient Profile */}
        <View style={styles.patientBox}>
          <View style={styles.patientField}>
            <Text style={styles.fieldLabel}>Patient Name</Text>
            <Text style={styles.fieldVal}>{order.patient?.name || 'Tariq Mehmood'}</Text>
          </View>
          <View style={styles.patientField}>
            <Text style={styles.fieldLabel}>MRN / Ref ID</Text>
            <Text style={styles.fieldVal}>{order.patient?.mrn || 'MRN-2026-8910'}</Text>
          </View>
          <View style={styles.patientField}>
            <Text style={styles.fieldLabel}>Age / Gender</Text>
            <Text style={styles.fieldVal}>
              {order.patient ? `${order.patient.age} Yrs / ${order.patient.gender}` : '52 Yrs / MALE'}
            </Text>
          </View>
          <View style={styles.patientField}>
            <Text style={styles.fieldLabel}>Sample Collected Date</Text>
            <Text style={styles.fieldVal}>{formattedDate}</Text>
          </View>
          <View style={styles.patientField}>
            <Text style={styles.fieldLabel}>Requesting Physician</Text>
            <Text style={styles.fieldVal}>Dr. {order.requestedByDoctorName || 'Sadia Malik'}</Text>
          </View>
          <View style={styles.patientField}>
            <Text style={styles.fieldLabel}>Laboratory Order Reference</Text>
            <Text style={styles.fieldVal}>LAB-ORD-{order.id.slice(0, 6).toUpperCase()}</Text>
          </View>
        </View>

        {/* Test Section */}
        <View style={styles.testSection}>
          <Text style={styles.testHeader}>{order.testName}</Text>
          <View style={styles.table}>
            <View style={styles.tableRowHeader}>
              <Text style={styles.colParam}>Analytic Investigation</Text>
              <Text style={styles.colValue}>Observed Range Value</Text>
              <Text style={styles.colRange}>Bio-Reference Interval Normal</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={styles.colParam}>{order.testName.replace(/Complete|Tests|Sugar|Function/gi, '').trim()}</Text>
              <Text style={[styles.colValue, order.isCritical && styles.criticalValue]}>
                {order.resultValue || 'Awaiting entry...'}
              </Text>
              <Text style={styles.colRange}>
                {order.testName.includes('CBC') ? 'Hb: 13.5-17.5 g/dL' :
                 order.testName.includes('Sugar') ? '70-100 mg/dL' : 'Within physiological benchmarks'}
              </Text>
            </View>
          </View>
        </View>

        {/* Technical Remarks */}
        {order.notes && (
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 8, color: '#475569', marginBottom: 4 }}>
              LABORATORY SPECIALIST / TECHNOLOGIST INTERPRETIVE INSIGHTS:
            </Text>
            <Text style={{ backgroundColor: '#f8fafc', padding: 8, borderRadius: 3, fontStyle: 'italic', fontSize: 8 }}>
              {order.notes}
            </Text>
          </View>
        )}

        {/* Signatures */}
        <View style={styles.signSection}>
          <View style={styles.signBox}>
            <View style={styles.signLine} />
            <Text style={styles.signTitle}>Report Prepared By:</Text>
            <Text style={[styles.fieldVal, { fontSize: 8 }]}>{order.labTechName || 'Kamran Khan (Lab Technologist)'}</Text>
          </View>
          <View style={styles.signBox}>
            <View style={styles.signLine} />
            <Text style={styles.signTitle}>Verified & Authorized By:</Text>
            <Text style={[styles.fieldVal, { fontSize: 8 }]}>Dr. Sadia Malik (Consultant Pathologist)</Text>
          </View>
        </View>

        {/* Advisory Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            * Advisory Notice: Pathological investigations are indicative of the particular physiological sample status. General therapies must take clinical histories and other radiological symptoms into consideration. Please consult your physician directly.
          </Text>
        </View>
      </Page>
    </Document>
  );
};
export default LabReportPDF;
