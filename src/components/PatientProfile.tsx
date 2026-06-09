/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  User, Clipboard, CreditCard, FlaskConical, Pill, FileText, ChevronRight, 
  MapPin, Phone, ShieldCheck, Heart, Trash2, Edit, Save, Activity, UploadCloud, CheckCircle
} from 'lucide-react';
import { formatDate } from '../utils';
import { Patient } from '../types';

interface PatientProfileProps {
  currentUser: any;
  patient: Patient;
  onBack: () => void;
  lang: 'EN' | 'UR';
  t: (key: string) => string;
}

export default function PatientProfile({ currentUser, patient: initialPatient, onBack, lang, t }: PatientProfileProps) {
  const [patient, setPatient] = useState<Patient>(initialPatient);
  const [activeTab, setActiveTab] = useState<'PERSONAL' | 'VISITS' | 'BILLS' | 'LABS' | 'PRESCRIPTIONS' | 'DOCUMENTS'>('PERSONAL');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  // Edit Form Fields
  const [editForm, setEditForm] = useState({
    name: patient.name,
    fullNameUrdu: (patient as any).fullNameUrdu || '',
    fatherName: (patient as any).fatherName || '',
    age: String(patient.age),
    gender: patient.gender,
    bloodGroup: patient.bloodGroup || 'O+',
    phone: patient.phone || '',
    cnic: patient.cnic || '',
    address: patient.address || '',
    city: (patient as any).city || 'Lahore',
    province: (patient as any).province || 'Punjab',
    emergencyContactName: patient.emergencyContactName || '',
    emergencyContactPhone: patient.emergencyContactPhone || '',
    emergencyRelation: (patient as any).emergencyRelation || '',
    insuranceProvider: patient.insuranceProvider || 'NONE',
    insurancePolicyNumber: patient.insurancePolicyNumber || '',
    insuranceCompany: (patient as any).insuranceCompany || '',
  });

  // Dynamic clinical cards loaded from database
  const [historyVisits, setHistoryVisits] = useState<any[]>([]);
  const [historyBills, setHistoryBills] = useState<any[]>([]);
  const [historyLabs, setHistoryLabs] = useState<any[]>([]);
  const [historyPrescriptions, setHistoryPrescriptions] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([
    { name: "Chest X-Ray Digital Copy.png", size: "1.4 MB", type: "Radiology", date: "15-MAY-2024" },
    { name: "Punjab Health Commission Patient Form.pdf", size: "540 KB", type: "Admin", date: "12-FEB-2024" },
    { name: "HbA1c Lab Report.pdf", size: "260 KB", type: "Laboratory", date: "24-JAN-2024" }
  ]);

  // Load patient clinical logs from backend APIs
  const loadClinicalHistoryDetails = async () => {
    try {
      setLoading(true);
      
      // Load OPD/IPD visits
      const visitsRes = await fetch('/api/opd/visits');
      if (visitsRes.ok) {
        const data = await visitsRes.json();
        // Filter by patient ID or mrn
        const filtered = data.filter((v: any) => v.patientMrn === patient.mrn || v.patientId === patient.mrn);
        setHistoryVisits(filtered);
        
        // Extract prescriptions on the fly from completed visits
        const prescs: any[] = [];
        filtered.forEach((v: any) => {
          if (v.prescription && Array.isArray(v.prescription)) {
            v.prescription.forEach((p: any) => {
              prescs.push({
                date: v.visitDate || v.createdAt,
                doctor: v.doctorName,
                medicine: p.name,
                dosage: p.dosage,
                frequency: p.frequency || 'N/A',
                duration: p.duration
              });
            });
          }
        });
        setHistoryPrescriptions(prescs);
      }

      // Load Billing ledger transactions
      const billsRes = await fetch('/api/billing/transactions');
      if (billsRes.ok) {
        const data = await billsRes.json();
        const filtered = data.filter((b: any) => b.patientMrn === patient.mrn);
        setHistoryBills(filtered);
      }

      // Load Pathology lab orders
      const labsRes = await fetch('/api/lab/orders');
      if (labsRes.ok) {
        const data = await labsRes.json();
        const filtered = data.filter((l: any) => l.patientMrn === patient.mrn || l.patientId === patient.mrn);
        setHistoryLabs(filtered);
      }

    } catch (e) {
      console.error("Clinical fetching failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClinicalHistoryDetails();
  }, [patient.mrn]);

  // Handle document upload mockup
  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeKB = Math.round(file.size / 1024);
      const sizeStr = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;
      const newDoc = {
        name: file.name,
        size: sizeStr,
        type: file.type.split('/')[1]?.toUpperCase() || "FILE",
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase().replace(/ /g, '-')
      };
      setDocuments(prev => [newDoc, ...prev]);
    }
  };

  // Save updated demographics
  const handleSaveDemographics = async () => {
    try {
      setLoading(true);
      const payload = {
        ...patient,
        name: editForm.name,
        fullNameUrdu: editForm.fullNameUrdu,
        fatherName: editForm.fatherName,
        age: Number(editForm.age),
        gender: editForm.gender as any,
        bloodGroup: editForm.bloodGroup as any,
        phone: editForm.phone,
        cnic: editForm.cnic,
        address: editForm.address,
        city: editForm.city,
        province: editForm.province,
        emergencyContactName: editForm.emergencyContactName,
        emergencyContactPhone: editForm.emergencyContactPhone,
        emergencyRelation: editForm.emergencyRelation,
        insuranceProvider: editForm.insuranceProvider as any,
        insurancePolicyNumber: editForm.insurancePolicyNumber,
        insuranceCompany: editForm.insuranceCompany
      };

      const res = await fetch(`/api/patients/${patient.mrn}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const updated = await res.json();
        setPatient(updated);
        setIsEditing(false);
        setSuccessMsg("Demographic coordinates updated successfully!");
        setTimeout(() => setSuccessMsg(''), 2500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-left" id="patient-profile-workstation">
      
      {/* Toast Notification */}
      {successMsg && (
        <div className="fixed top-4 right-4 z-50 p-4 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-2 text-xs shadow-2xl animate-fade-in">
          <CheckCircle size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Profile Header card block */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6" id="profile-details-banner">
        
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <div className="relative shrink-0">
            <img 
              src={patient.photoUrl || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=120&auto=format&fit=crop`} 
              alt="Profile Pic" 
              referrerPolicy="no-referrer"
              className="w-20 h-20 rounded-2xl border border-slate-100 dark:border-slate-800 object-cover" 
            />
            <span className="absolute -bottom-1 -right-1 bg-emerald-500 border-2 border-white dark:border-slate-900 w-4.5 h-4.5 rounded-full inline-block animate-pulse"></span>
          </div>

          <div className="space-y-1.5 text-center sm:text-left">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white leading-tight flex flex-col sm:flex-row sm:items-center gap-2">
              <span>{patient.name}</span>
              {(patient as any).fullNameUrdu && (
                <span className="font-serif text-sm font-semibold text-slate-400">{(patient as any).fullNameUrdu}</span>
              )}
            </h2>
            <code className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 py-0.5 px-2.5 rounded-md w-fit inline-block">
              {patient.mrn}
            </code>
            <p className="text-xs text-slate-455 font-semibold">
              {patient.age} Yrs &bull; {patient.gender} &bull; Blood group: <span className="text-rose-500 font-bold">{patient.bloodGroup || 'O+'}</span>
            </p>
            <div className="flex flex-wrap gap-2 pt-1 justify-center sm:justify-start">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold rounded-lg text-slate-650 dark:text-slate-350">
                <ShieldCheck size={11} className="text-slate-400" />
                <span>CNIC: {patient.cnic || '35201-1234567-1'}</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold rounded-lg text-slate-650 dark:text-slate-350">
                <Phone size={11} className="text-slate-400" />
                <span>{patient.phone || '0300-1234567'}</span>
              </span>
              {patient.insuranceProvider && patient.insuranceProvider !== 'None' && patient.insuranceProvider !== 'NONE' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/40 text-[10px] font-black rounded-lg text-emerald-800 dark:text-emerald-400 border border-emerald-250/20">
                  <span>Welfare Coverage: {patient.insuranceProvider}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic QR block */}
        <div className="flex items-center gap-4 border-t sm:border-t-0 md:border-l pt-4 md:pt-0 pb-1 pl-0 md:pl-6 border-slate-150 dark:border-slate-800 shrink-0 w-full md:w-auto justify-center md:justify-end">
          <div className="text-left md:text-right hidden sm:block">
            <span className="block text-[8px] text-slate-405 font-mono">CORE SYSTEM EMISSION QR</span>
            <span className="block text-xs font-mono font-bold text-slate-800 dark:text-white mt-1">SWIPE AT TOKEN DESK</span>
            <span className="block text-[10px] text-slate-400 font-mono mt-0.5">MAYO ERP EXPORT</span>
          </div>
          <div className="bg-white p-1.5 rounded-xl border flex flex-col items-center justify-center">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=72x72&data=${patient.mrn}`} 
              alt="Patient QR Code" 
              className="w-[72px] h-[72px]"
              referrerPolicy="no-referrer"
            />
            <span className="text-[7px] font-mono mt-1 tracking-wider text-slate-500 font-bold">{patient.mrn}</span>
          </div>
        </div>

      </div>

      {/* Tabs list switch controls */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto whitespace-nowrap bg-white dark:bg-slate-900 rounded-2xl p-1 shadow-xs" id="profile-tabs-switches">
        {[
          { id: 'PERSONAL', icon: User, label: "Demographics & Personal" },
          { id: 'VISITS', icon: Clipboard, label: `Visits History (${historyVisits.length})` },
          { id: 'BILLS', icon: CreditCard, label: `Inquiries & Bills (${historyBills.length})` },
          { id: 'LABS', icon: FlaskConical, label: `Lab Orders (${historyLabs.length})` },
          { id: 'PRESCRIPTIONS', icon: Pill, label: `Therapeutics (${historyPrescriptions.length})` },
          { id: 'DOCUMENTS', icon: FileText, label: `Scan Dossiers (${documents.length})` }
        ].map(tb => (
          <button
            key={tb.id}
            id={`profile-tab-btn-${tb.id}`}
            onClick={() => setActiveTab(tb.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl cursor-pointer transition-all ${
              activeTab === tb.id 
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/10' 
                : 'text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <tb.icon size={13} />
            <span>{tb.label}</span>
          </button>
        ))}
      </div>

      {/* TAB VIWER WORKSPACE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm min-h-[400px]">
        
        {/* T1: PERSONAL INFO */}
        {activeTab === 'PERSONAL' && (
          <div className="space-y-6" id="view-profile-demographics">
            <div className="flex justify-between items-center border-b pb-3 border-slate-100 dark:border-slate-850">
              <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Demographic Records Dossier</span>
              <button
                id="profile-edit-toggle-btn"
                onClick={() => {
                  if (isEditing) {
                    handleSaveDemographics();
                  } else {
                    setIsEditing(true);
                  }
                }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase cursor-pointer transition-all ${
                  isEditing 
                    ? 'bg-emerald-605 bg-emerald-600 text-white hover:bg-emerald-500' 
                    : 'bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-805 border border-slate-200 dark:border-slate-800'
                }`}
              >
                {isEditing ? (
                  <>
                    <Save size={13} />
                    <span>Save Changes</span>
                  </>
                ) : (
                  <>
                    <Edit size={13} />
                    <span>Edit Demographics</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left text-xs">
              
              {/* English Full Name */}
              <div className="space-y-1">
                <span className="block font-bold text-slate-405 uppercase tracking-wide">English Full Name / انگریزی نام</span>
                {isEditing ? (
                  <input
                    id="edit-name"
                    type="text"
                    value={editForm.name}
                    onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-950 p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl"
                  />
                ) : (
                  <p className="p-2.5 bg-slate-50/50 dark:bg-slate-950/20 border rounded-xl font-bold text-slate-900 dark:text-white">{patient.name}</p>
                )}
              </div>

              {/* Urdu Full Name */}
              <div className="space-y-1">
                <span className="block font-bold text-slate-405 uppercase tracking-wide">Urdu Full Name / اردو نام</span>
                {isEditing ? (
                  <input
                    id="edit-nameurdu"
                    type="text"
                    value={editForm.fullNameUrdu}
                    onChange={e => setEditForm(prev => ({ ...prev, fullNameUrdu: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-950 p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-right font-serif"
                  />
                ) : (
                  <p className="p-2.5 bg-slate-50/50 dark:bg-slate-950/20 border rounded-xl font-bold text-slate-900 dark:text-white text-right font-serif">{(patient as any).fullNameUrdu || 'درج نہیں'}</p>
                )}
              </div>

              {/* Father Name */}
              <div className="space-y-1">
                <span className="block font-bold text-slate-405 uppercase tracking-wide">Father / Husband Name / ولدیت</span>
                {isEditing ? (
                  <input
                    id="edit-father"
                    type="text"
                    value={editForm.fatherName}
                    onChange={e => setEditForm(prev => ({ ...prev, fatherName: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-950 p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl"
                  />
                ) : (
                  <p className="p-2.5 bg-slate-50/50 dark:bg-slate-950/20 border rounded-xl font-bold text-slate-900 dark:text-white">{(patient as any).fatherName || 'Not provided'}</p>
                )}
              </div>

              {/* Age */}
              <div className="space-y-1">
                <span className="block font-bold text-slate-405 uppercase tracking-wide">Age & Gender / عمر اور جنس</span>
                <p className="p-2.5 bg-slate-100 dark:bg-slate-950/30 border rounded-xl text-slate-500 font-bold font-mono">
                  {patient.age} Yrs &bull; {patient.gender}
                </p>
              </div>

              {/* CNIC Number */}
              <div className="space-y-1">
                <span className="block font-bold text-slate-405 uppercase tracking-wide">CNIC Identity Number / شناختی کارڈ</span>
                {isEditing ? (
                  <input
                    id="edit-cnic"
                    type="text"
                    value={editForm.cnic}
                    onChange={e => setEditForm(prev => ({ ...prev, cnic: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-950 p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl font-mono"
                  />
                ) : (
                  <p className="p-2.5 bg-slate-50/50 dark:bg-slate-950/20 border rounded-xl font-bold text-slate-900 dark:text-white font-mono">{patient.cnic}</p>
                )}
              </div>

              {/* Phone contact */}
              <div className="space-y-1">
                <span className="block font-bold text-slate-405 uppercase tracking-wide">Primary Phone Contact / فون نمبر</span>
                {isEditing ? (
                  <input
                    id="edit-phone"
                    type="text"
                    value={editForm.phone}
                    onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-950 p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl font-mono"
                  />
                ) : (
                  <p className="p-2.5 bg-slate-50/50 dark:bg-slate-950/20 border rounded-xl font-bold text-slate-900 dark:text-white font-mono">{patient.phone}</p>
                )}
              </div>

              {/* Home Address */}
              <div className="space-y-1 md:col-span-2">
                <span className="block font-bold text-slate-405 uppercase tracking-wide">Home Residence / گھر کا پتہ</span>
                {isEditing ? (
                  <input
                    id="edit-address"
                    type="text"
                    value={editForm.address}
                    onChange={e => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-950 p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl"
                  />
                ) : (
                  <p className="p-2.5 bg-slate-50/50 dark:bg-slate-950/20 border rounded-xl font-bold text-slate-900 dark:text-white">{patient.address || 'Not provided'}</p>
                )}
              </div>

              {/* City and Province */}
              <div className="space-y-1">
                <span className="block font-bold text-slate-405 uppercase tracking-wide">City & Province / صوبہ و شہر</span>
                <p className="p-2.5 bg-slate-100 dark:bg-slate-950/30 border rounded-xl text-slate-500 font-bold">
                  {(patient as any).city || 'Lahore'} / {(patient as any).province || 'Punjab'}
                </p>
              </div>

              {/* Emergency Contact */}
              <div className="space-y-1 md:col-span-3 bg-rose-50/30 dark:bg-rose-950/15 p-4 rounded-2xl border border-rose-225/20 text-left space-y-3 mt-2">
                <span className="text-[10px] font-black uppercase text-rose-700 dark:text-rose-400 tracking-wider flex items-center gap-1">
                  <Phone size={13} />
                  <span>Primary Emergency Kin (ہنگامی رابطہ کریں)</span>
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-bold block">Kin Name</span>
                    <span className="font-extrabold text-slate-800 dark:text-white">{(patient as any).emergencyContactName || patient.emergencyContactName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-bold block">Relationship</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-205">{(patient as any).emergencyRelation || 'Kin Family'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-bold block">Phone Call</span>
                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{(patient as any).emergencyContactPhone || patient.emergencyContactPhone || 'N/A'}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* T2: VISIT HISTORY */}
        {activeTab === 'VISITS' && (
          <div className="space-y-4" id="view-profile-visits">
            <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400 block border-b pb-2 border-slate-100 dark:border-slate-850">Medical & Clinic Encounters Ledger</span>
            
            {historyVisits.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Clipboard size={32} className="mx-auto mb-2 opacity-50" />
                <p className="font-bold">No registered clinical visits yet.</p>
                <p className="text-[10px] text-slate-455">Create new visit from the Patients list to record diagnostics.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {historyVisits.map((v: any, index: number) => (
                  <div key={index} className="border border-slate-150 dark:border-slate-805 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-emerald-500/50 transition-all">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-450">OPD CLINIC TICKET</span>
                        <code className="text-[10px] bg-slate-50 dark:bg-slate-950 border px-1.5 py-0.5 rounded font-bold">OPD-{v.tokenNumber || index + 10}</code>
                        <span className="text-[10px] text-slate-450">&bull; {formatDate(v.createdAt || v.visitDate)}</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-850 dark:text-slate-300">
                        Diagnostics: <span className="font-bold text-slate-900 dark:text-white italic">{v.diagnosis || 'Undiagnosed Complaints'}</span>
                      </p>
                      <p className="text-[11px] text-slate-450">
                        Clinician: <span className="font-bold">{v.doctorName || 'Dr. Sadia Malik'}</span> &bull; Symptoms: <span className="italic">"{v.symptoms || v.complaints || 'None reported'}"</span>
                      </p>
                    </div>

                    <div className="text-left sm:text-right font-mono">
                      <span className="block text-[8px] text-slate-402">VITALS REC</span>
                      <span className="block text-[11px] text-slate-700 dark:text-slate-300 mt-1 font-bold">
                        {v.vitals?.bp || v.vitalsBp || '120/80'} mmHg &bull; {v.vitals?.pulse || v.vitalsPulse || '75'} bpm
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* T3: BILLS */}
        {activeTab === 'BILLS' && (
          <div className="space-y-4" id="view-profile-bills">
            <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400 block border-b pb-2 border-slate-100 dark:border-slate-850">Accounts Ledger & Billings invoice</span>
            
            {historyBills.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <CreditCard size={32} className="mx-auto mb-2 opacity-50" />
                <p className="font-bold">No invoices generated for this patient yet.</p>
                <p className="text-[10px] text-slate-455">Financial items generate automatically during OPD consultation billing cycles.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950/20 text-slate-400 font-bold border-b border-slate-100 dark:border-slate-850 uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Invoice / ٹرانزیکشن آئی ڈی</th>
                      <th className="py-3 px-4">Module Code</th>
                      <th className="py-3 px-4">Original Net Bill</th>
                      <th className="py-3 px-4">Paid by Patient</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4">Ledger Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                    {historyBills.map((b: any, index: number) => (
                      <tr key={index} className="hover:bg-slate-50/50 text-slate-700 dark:text-slate-300 font-mono">
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white uppercase">{b.invoiceNumber || b.id || 'TXN-001'}</td>
                        <td className="py-3 px-4 font-bold text-emerald-500">{b.module || 'OPD TICKET'}</td>
                        <td className="py-3 px-4 font-bold">Rs. {b.netBill || b.total || '1,500'}</td>
                        <td className="py-3 px-4 font-bold">Rs. {b.amountPaidByPatient || b.paid || '1,500'}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                            (b.status || 'PAID') === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {b.status || 'PAID'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400">{formatDate(b.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* T4: LAB RESULTS */}
        {activeTab === 'LABS' && (
          <div className="space-y-4" id="view-profile-labs">
            <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400 block border-b pb-2 border-slate-100 dark:border-slate-850">Pathology & Diagnostics studies orders</span>
            
            {historyLabs.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <FlaskConical size={32} className="mx-auto mb-2 opacity-50" />
                <p className="font-bold">No active lab study prescription logs recorded.</p>
                <p className="text-[10px] text-slate-455">Order blood samples, CBC profiles, or sputum test packages in the Lab module.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950/20 text-slate-400 font-bold border-b border-slate-100 dark:border-slate-850 uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Test name / ٹیسٹ کا نام</th>
                      <th className="py-3 px-4">Category study</th>
                      <th className="py-3 px-4">Lab Result Value</th>
                      <th className="py-3 px-4 text-center">Diagnostics Status</th>
                      <th className="py-3 px-4">Specimen Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                    {historyLabs.map((l: any, index: number) => (
                      <tr key={index} className="hover:bg-slate-50/50 text-slate-700 dark:text-slate-300">
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white uppercase">{l.testName || 'Serum Lipids Panel'}</td>
                        <td className="py-3 px-4 font-mono font-medium">{l.sampleType || 'BLOOD / PLASMA'}</td>
                        <td className="py-3 px-4 font-mono font-extrabold text-indigo-500">{l.resultValue || 'PENDING VERIFICATION'}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                            l.status === 'VALIDATED' ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-803'
                          }`}>
                            {l.status || 'ORDERED'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-400">{formatDate(l.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* T5: PRESCRIPTIONS */}
        {activeTab === 'PRESCRIPTIONS' && (
          <div className="space-y-4" id="view-profile-prescriptions">
            <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400 block border-b pb-2 border-slate-100 dark:border-slate-850">Pharmacopeia Medication Schedule</span>
            
            {historyPrescriptions.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Pill size={32} className="mx-auto mb-2 opacity-50" />
                <p className="font-bold">No therapeutics medicines currently prescribed.</p>
                <p className="text-[10px] text-slate-455">Add active generic schedules inside the OPD visit interface during consultation.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {historyPrescriptions.map((pr: any, index: number) => (
                  <div key={index} className="p-4 border dark:border-slate-805 rounded-2x border-slate-150 rounded-2xl space-y-2 text-left bg-slate-50/45 dark:bg-slate-950/20">
                    <div className="flex justify-between items-center border-b pb-1.5 dark:border-slate-805 border-slate-100">
                      <span className="font-black text-xs text-slate-850 dark:text-white font-mono">{pr.medicine}</span>
                      <span className="text-[9px] bg-emerald-100 text-emerald-850 px-2 py-0.5 rounded-md font-bold uppercase">{pr.duration}</span>
                    </div>
                    <div className="font-mono text-[10px] space-y-0.5 text-slate-450">
                      <p>Active dosage: <span className="font-bold text-emerald-600">{pr.dosage}</span> &bull; ({pr.frequency})</p>
                      <p>Prescribing physician: <span className="font-bold text-slate-700 dark:text-slate-300">{pr.doctor}</span></p>
                      <p>Prescribe Date: <span className="font-bold">{formatDate(pr.date)}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* T6: DOCUMENTS */}
        {activeTab === 'DOCUMENTS' && (
          <div className="space-y-4" id="view-profile-documents">
            <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400 block border-b pb-2 border-slate-100 dark:border-slate-850">Diagnostic Scan dossier archives</span>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 dark:bg-slate-950/20 p-4 border border-dashed rounded-2xl text-slate-450 hover:bg-slate-100/50 transition-all text-center sm:text-left justify-between">
              <div className="flex items-center gap-3">
                <UploadCloud size={24} className="text-slate-400 invisible sm:visible shrink-0" />
                <div>
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-300">Upload diagnostic scan reports</span>
                  <span className="block text-[10px] text-slate-400 leading-relaxed mt-0.5">JPEG, PNG, or PDF attachments up to 10MB acceptable. Permanent EHR backup.</span>
                </div>
              </div>
              <label className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer transition-all uppercase whitespace-nowrap">
                <span>Upload Report Attachment</span>
                <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleDocUpload} />
              </label>
            </div>

            <div className="space-y-2.5">
              {documents.map((doc, index) => (
                <div key={index} className="p-3.5 bg-white dark:bg-slate-900 border dark:border-slate-805 border-slate-150 rounded-2xl flex items-center justify-between hover:border-slate-300 transition-all font-mono text-[11px]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-xs">
                      {doc.type[0]}
                    </div>
                    <div>
                      <span className="font-extrabold text-slate-900 dark:text-white block truncate max-w-[250px] sm:max-w-md">{doc.name}</span>
                      <span className="text-[10px] text-slate-400 font-medium font-sans">{doc.date} &bull; Clinical {doc.type} study &bull; File Size: {doc.size}</span>
                    </div>
                  </div>
                  
                  <button
                    id={`btn-doc-del-${index}`}
                    onClick={() => {
                      setDocuments(prev => prev.filter((_, i) => i !== index));
                    }}
                    className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-400 hover:text-rose-500 rounded-lg cursor-pointer transition-all shrink-0"
                    title="Remove attachment from EHR profile"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
