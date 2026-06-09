/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Users, UserPlus, ListFilter, ClipboardList, Eye, ArrowLeft, Printer, CreditCard
} from 'lucide-react';
import { Patient, User, HospitalSettings } from '../types';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { PatientCardPDF } from '../pdf/PatientCard';
import { formatDate } from '../utils';

// Import our newly created specialized subcomponents
import PatientRegistration from './PatientRegistration';
import PatientList from './PatientList';
import PatientProfile from './PatientProfile';

interface PatientManagementProps {
  currentUser: User | null;
  settings: HospitalSettings;
  lang: 'EN' | 'UR';
  t: (key: string) => string;
}

export default function PatientManagement({ currentUser, settings, lang, t }: PatientManagementProps) {
  // Navigation states: 'LIST' | 'REGISTER' | 'PROFILE'
  const [currentView, setCurrentView] = useState<'LIST' | 'REGISTER' | 'PROFILE'>('LIST');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  
  // Printing ID Card Modal overlay state
  const [cardPatient, setCardPatient] = useState<Patient | null>(null);

  // Print raw page layout
  const printPatientCard = () => {
    window.print();
  };

  return (
    <div className="space-y-6" id="patient-management-module">
      
      {/* Top action header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-205 dark:border-slate-800/80 shadow-sm" id="patients-header-panel">
        <div className="text-left font-sans">
          <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Users size={20} className="text-emerald-500" />
            <span>{t('nav_patients')} &bull; مریضوں کا ریکارڈ</span>
          </h1>
          <p className="text-xs text-slate-450 mt-1">
            {currentView === 'LIST' && "Permanent Electronic Health Records (EHR) index directory."}
            {currentView === 'REGISTER' && "Onboard new patient files and allocate automated MRN codes."}
            {currentView === 'PROFILE' && "Comprehensive clinical encounter records, labs, and personal KYC profile."}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {currentView !== 'LIST' && (
            <button
              id="btn-nav-list"
              onClick={() => {
                setCurrentView('LIST');
                setSelectedPatient(null);
              }}
              className="flex items-center gap-1.5 bg-slate-105 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-705 dark:text-slate-205 font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>{t('back')}</span>
            </button>
          )}

          {currentView !== 'REGISTER' && (
            <button
              id="btn-nav-register"
              onClick={() => {
                setCurrentView('REGISTER');
                setSelectedPatient(null);
              }}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
            >
              <UserPlus size={15} />
              <span>{t('add_new')}</span>
            </button>
          )}
        </div>
      </div>

      {/* RENDER CURRENT RELEVANT COMPONENT */}
      <div className="animate-fade-in" id="patient-management-panels-container">
        
        {currentView === 'LIST' && (
          <PatientList
            currentUser={currentUser}
            onSelectPatient={(p) => {
              setSelectedPatient(p);
              setCurrentView('PROFILE');
            }}
            onEditPatient={(p) => {
              setSelectedPatient(p);
              setCurrentView('PROFILE');
              // Auto edit triggered in profile personal tab
            }}
            onNewVisit={(p) => {
              // Visit creation switches visually to opd or notifies staff
              setSelectedPatient(p);
              setCurrentView('PROFILE');
            }}
            onPrintCard={(p) => {
              setCardPatient(p);
            }}
            lang={lang}
            t={t}
          />
        )}

        {currentView === 'REGISTER' && (
          <PatientRegistration
            currentUser={currentUser}
            onSuccess={(newPat) => {
              setSelectedPatient(newPat);
              setCurrentView('PROFILE');
            }}
            lang={lang}
            t={t}
          />
        )}

        {currentView === 'PROFILE' && selectedPatient && (
          <PatientProfile
            currentUser={currentUser}
            patient={selectedPatient}
            onBack={() => {
              setCurrentView('LIST');
              setSelectedPatient(null);
            }}
            lang={lang}
            t={t}
          />
        )}

      </div>

      {/* PRINT PATIENT IDENTITY CARD OVERLAY MODAL */}
      {cardPatient && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="idcard-modal-overlay">
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-scale-up">
            
            {/* Modal Head */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-slate-800 select-none">
              <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <CreditCard size={15} className="text-emerald-500" />
                <span>Patient EHR Issued Card</span>
              </span>
              <button
                id="btn-close-card-modal"
                onClick={() => setCardPatient(null)}
                className="text-slate-400 hover:text-slate-650 dark:hover:text-white font-bold cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            {/* Card Content Area for raw print */}
            <div className="p-6 print-area bg-linear-to-b from-emerald-500/10 via-white to-white dark:from-slate-950/50 dark:via-slate-900 dark:to-slate-900 text-left font-sans" id="printable-card-area">
              <div className="border-2 border-emerald-500 dark:border-slate-700 p-5 rounded-2xl flex flex-col space-y-4 max-w-md mx-auto bg-white/70 dark:bg-slate-900/70 backdrop-blur-md">
                
                {/* Brand Line */}
                <div className="flex items-center justify-between border-b border-emerald-100 dark:border-slate-850 pb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-white">Mayo Trust Care Card</span>
                  </div>
                  <span className="text-[10px] font-mono bg-emerald-500 text-white px-2 py-0.5 rounded font-bold uppercase">Patient MRN Card</span>
                </div>

                {/* Patient Specs */}
                <div className="flex gap-4">
                  <img 
                    src={cardPatient.photoUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=120&auto=format&fit=crop"} 
                    alt="Patient Pic" 
                    referrerPolicy="no-referrer"
                    className="w-20 h-20 rounded-xl border object-cover shrink-0" 
                    onError={(e) => {
                      const tgt = e.target as HTMLImageElement;
                      tgt.src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=120&auto=format&fit=crop";
                    }}
                  />
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight truncate">{cardPatient.name}</h3>
                    <code className="block text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/45 py-0.5 px-2 rounded w-fit">{cardPatient.mrn}</code>
                    
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono space-y-0.5">
                      <p>Age: <span className="font-bold">{cardPatient.age} Yrs</span> • Sex: <span className="font-bold">{cardPatient.gender}</span></p>
                      <p>Blood Group: <span className="font-bold text-red-600">{cardPatient.bloodGroup || 'O+'}</span></p>
                      <p className="truncate">CNIC: {cardPatient.cnic}</p>
                    </div>
                  </div>
                </div>

                {/* Address & Emergency info */}
                <div className="bg-slate-50 dark:bg-slate-950/45 p-2.5 rounded-lg space-y-1 text-[9px] text-slate-500 dark:text-slate-400">
                  <p className="truncate"><strong className="uppercase">Address:</strong> {cardPatient.address || 'Not provided'}</p>
                  <p className="truncate"><strong className="uppercase">Emergency Contact:</strong> {cardPatient.emergencyContactName} ({cardPatient.emergencyContactPhone})</p>
                  <p className="truncate"><strong className="uppercase">Scheme Coverage:</strong> {cardPatient.insuranceProvider} ({cardPatient.insurancePolicyNumber || "No Claim Account"})</p>
                </div>

                {/* Card footer: Dynamic QR from global server */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-850">
                  <div className="space-y-0.5">
                    <span className="block text-[8px] text-slate-400">DATE ISSUED:</span>
                    <span className="block text-[9px] font-mono font-bold text-slate-700 dark:text-white">{formatDate(cardPatient.createdAt)}</span>
                  </div>

                  {/* Dynamic QR */}
                  <div className="bg-white p-1 rounded-lg border flex flex-col items-center justify-center shrink-0">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=36x36&data=${cardPatient.mrn}`}
                      alt="Mini QR" 
                      className="w-9 h-9"
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-[5.5px] font-mono mt-0.5 tracking-tighter text-slate-500">{cardPatient.mrn}</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Printable Controls actions bar */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950/10 border-t border-slate-105 dark:border-slate-800 flex justify-end gap-2 no-print font-sans">
              <button 
                id="btn-print-identity"
                onClick={printPatientCard}
                className="flex items-center gap-1.5 bg-slate-605 bg-slate-600 hover:bg-slate-550 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
              >
                <Printer size={13} />
                <span>Print Card</span>
              </button>

              <PDFDownloadLink
                document={<PatientCardPDF patient={{
                  mrn: cardPatient.mrn,
                  name: cardPatient.name,
                  age: cardPatient.age,
                  gender: cardPatient.gender,
                  bloodGroup: cardPatient.bloodGroup,
                  phone: cardPatient.phone,
                  emergencyContactName: cardPatient.emergencyContactName,
                  emergencyContactPhone: cardPatient.emergencyContactPhone,
                  photoUrl: cardPatient.photoUrl
                }} />}
                fileName={`PatientID_${cardPatient.mrn}.pdf`}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
              >
                {({ loading }) => (
                  <>
                    <Printer size={13} />
                    <span>{loading ? 'Compiling PDF...' : 'Download Official ID'}</span>
                  </>
                )}
              </PDFDownloadLink>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
