/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#0f172a',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContainer: {
    width: 260,
    height: 160,
    borderWidth: 1.5,
    borderColor: '#0f766e',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    flexDirection: 'column',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
  titleBar: {
    backgroundColor: '#0f766e',
    padding: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleText: {
    color: '#ffffff',
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },
  emergencyBadge: {
    backgroundColor: '#ef4444',
    color: '#ffffff',
    fontSize: 6,
    borderRadius: 2,
    paddingHorizontal: 4,
    paddingVertical: 1,
    fontFamily: 'Helvetica-Bold',
  },
  mainBody: {
    flexDirection: 'row',
    padding: 8,
    flex: 1,
  },
  photoSide: {
    width: '30%',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  photoFallback: {
    width: 50,
    height: 50,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    marginBottom: 6,
  },
  avatarImg: {
    width: 50,
    height: 50,
    borderRadius: 4,
  },
  bloodGroup: {
    backgroundColor: '#fee2e2',
    color: '#ef4444',
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    padding: 2,
    borderRadius: 2,
    textAlign: 'center',
    width: '100%',
  },
  detailsSide: {
    width: '70%',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  patientName: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#1e293b',
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  fieldCol: {
    flexDirection: 'column',
    width: '48%',
  },
  lbl: {
    fontSize: 6,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  val: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#334155',
  },
  qrFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    padding: 4,
    backgroundColor: '#f8fafc',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  barCodeBox: {
    flexDirection: 'column',
  },
  barcodeText: {
    fontSize: 6,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 2,
  }
});

interface PatientCardPDFProps {
  patient: {
    mrn: string;
    name: string;
    age: number;
    gender: string;
    bloodGroup?: string;
    phone: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    photoUrl?: string;
  };
}

export const PatientCardPDF: React.FC<PatientCardPDFProps> = ({ patient }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.cardContainer}>
          {/* Header Title Bar */}
          <View style={styles.titleBar}>
            <Text style={styles.titleText}>MAYO TRUST MEDICAL ID</Text>
            <Text style={styles.emergencyBadge}>EMERGENCY PATIENT CARD</Text>
          </View>

          {/* Main ID Body */}
          <View style={styles.mainBody}>
            {/* Left Photo & Blood group column */}
            <View style={styles.photoSide}>
              <View style={styles.photoFallback}>
                {patient.photoUrl ? (
                  <Image src={patient.photoUrl} style={styles.avatarImg} />
                ) : (
                  <Text style={{ fontSize: 16, color: '#94a3b8' }}>👤</Text>
                )}
              </View>
              <Text style={styles.bloodGroup}>{patient.bloodGroup ? patient.bloodGroup.replace('_', ' ') : 'O NEGATIVE'}</Text>
            </View>

            {/* Right demographics descriptors column */}
            <View style={styles.detailsSide}>
              <View>
                <Text style={styles.patientName}>{patient.name}</Text>
                <Text style={{ fontSize: 7, color: '#0f766e', fontFamily: 'Helvetica-Bold' }}>MRN: {patient.mrn}</Text>
              </View>

              <View style={styles.fieldRow}>
                <View style={styles.fieldCol}>
                  <Text style={styles.lbl}>Gender & Age</Text>
                  <Text style={styles.val}>{patient.gender} / {patient.age} Yrs</Text>
                </View>
                <View style={styles.fieldCol}>
                  <Text style={styles.lbl}>Contact Phone</Text>
                  <Text style={styles.val}>{patient.phone || 'N/A'}</Text>
                </View>
              </View>

              <View style={styles.fieldRow}>
                <View style={{ width: '100%', marginTop: 2 }}>
                  <Text style={styles.lbl}>Emergency Contact</Text>
                  <Text style={[styles.val, { fontSize: 7 }]}>
                    {patient.emergencyContactName || 'Guardian'} : {patient.emergencyContactPhone || patient.phone}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Bottom Scanner info bar */}
          <View style={styles.qrFooter}>
            <View style={styles.barCodeBox}>
              <Text style={{ fontSize: 5, color: '#94a3b8' }}>SYSTEM MRN BARCODE</Text>
              <Text style={styles.barcodeText}>||||| | ||||| | ||| {patient.mrn}</Text>
            </View>
            <Text style={{ fontSize: 6, color: '#0f766e', fontFamily: 'Helvetica-Bold' }}>Mayo Trust ERP</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
export default PatientCardPDF;
