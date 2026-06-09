/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  BedDouble, PlusSquare, HeartPulse, UserCheck, Activity, 
  Layers, CheckCircle, Flame, Calendar, MapPin, ClipboardList, PenTool, Clipboard
} from 'lucide-react';
import { formatPKR, formatDate } from '../utils';
import { Bed, IPDAdmission, Patient, User, WardType } from '../types';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { IPDSummaryPDF } from '../pdf/IPDSummary';

interface IPDManagementProps {
  currentUser: User | null;
  lang: 'EN' | 'UR';
  t: (key: string) => string;
}

export default function IPDManagement({ currentUser, lang, t }: IPDManagementProps) {
  const [beds, setBeds] = useState<Bed[]>([]);
  const [admissions, setAdmissions] = useState<IPDAdmission[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<User[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [selectedWardFilter, setSelectedWardFilter] = useState<string>('ALL');
  
  // Selection/Admit Forms state
  const [showAdmitForm, setShowAdmitForm] = useState(false);
  const [admitPatientMrn, setAdmitPatientMrn] = useState('');
  const [admitBedId, setAdmitBedId] = useState('');
  const [admitDoctorId, setAdmitDoctorId] = useState('');

  // Active Admission Detail Workspace card
  const [inspectedAdmission, setInspectedAdmission] = useState<IPDAdmission | null>(null);
  
  // Modal note states
  const [nurseNoteText, setNurseNoteText] = useState('');
  const [docNotesText, setDocNotesText] = useState('');
  const [docVisitCharge, setDocVisitCharge] = useState('2500');

  // Discharge Summary details
  const [dischargeDiagnosis, setDischargeDiagnosis] = useState('');
  const [dischargeTreatment, setDischargeTreatment] = useState('');
  const [dischargeInstructions, setDischargeInstructions] = useState('');

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const resB = await fetch('/api/ipd/beds');
      const dataB = await resB.json();
      setBeds(dataB);

      const resA = await fetch('/api/ipd/admissions');
      const dataA = await resA.json();
      setAdmissions(dataA);

      const resP = await fetch('/api/patients');
      const dataP = await resP.json();
      setPatients(dataP.filter((p: Patient) => {
        // Prevent registering a patient who is already admitted
        return !dataA.some((a: IPDAdmission) => a.patientMrn === p.mrn && a.status === 'ADMITTED');
      }));

      const resS = await fetch('/api/hr/staff');
      const dataS = await resS.json();
      setDoctors(dataS.filter((u: User) => u.role === 'DOCTOR'));
    } catch (e) {
      console.error("IPD fetch error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!admitPatientMrn || !admitBedId || !admitDoctorId) {
      setFormError('Please select Patient, Bed vacancy and Attending Doctor.');
      return;
    }

    try {
      const payload = {
        patientMrn: admitPatientMrn,
        bedId: admitBedId,
        admittingDoctorId: admitDoctorId,
        staffId: currentUser?.id || "SYSTEM"
      };

      const res = await fetch('/api/ipd/admissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Admit transaction failed.");
      }

      setFormSuccess('Patient admitted successfully! Ward bed is marked occupied.');
      setAdmitPatientMrn('');
      setAdmitBedId('');
      
      setTimeout(() => {
        setShowAdmitForm(false);
        setFormSuccess('');
        fetchData();
      }, 1500);

    } catch (err: any) {
      setFormError(err.message || 'Error executing admission.');
    }
  };

  const submitNurseNote = async () => {
    if (!inspectedAdmission || !nurseNoteText) return;
    try {
      const res = await fetch(`/api/ipd/admissions/${inspectedAdmission.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'NURSE_NOTE',
          note: nurseNoteText,
          staffId: currentUser?.id || "EMP-2020"
        })
      });
      const data = await res.json();
      setInspectedAdmission(data);
      setNurseNoteText('');
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const submitDoctorRound = async () => {
    if (!inspectedAdmission || !docNotesText) return;
    try {
      const res = await fetch(`/api/ipd/admissions/${inspectedAdmission.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DOCTOR_VISIT',
          notes: docNotesText,
          charge: Number(docVisitCharge),
          doctorId: inspectedAdmission.admittingDoctorId,
          staffId: currentUser?.id || "SYSTEM"
        })
      });
      const data = await res.json();
      setInspectedAdmission(data);
      setDocNotesText('');
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDischarge = async () => {
    if (!inspectedAdmission) return;
    try {
      const res = await fetch(`/api/ipd/admissions/${inspectedAdmission.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DISCHARGE',
          diagnosis: dischargeDiagnosis,
          treatmentGiven: dischargeTreatment,
          followUpInstructions: dischargeInstructions,
          staffId: currentUser?.id || "SYSTEM"
        })
      });
      const finalAdmission = await res.json();

      // Trigger standard IPD settlement Transaction Invoice
      await fetch('/api/billing/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientMrn: finalAdmission.patientMrn,
          module: 'IPD',
          subtotal: finalAdmission.totalCalculatedBill,
          discountApprovedAmount: 0,
          taxAmount: finalAdmission.totalCalculatedBill * 0.05,
          netBill: finalAdmission.totalCalculatedBill * 1.05,
          paymentMethod: 'CASH',
          items: [{ description: `IPD Patient Discharge Settlement invoice. Days Ward care & diagnostics. Bed ID: ${finalAdmission.bedId}`, qty: 1, price: finalAdmission.totalCalculatedBill }],
          staffId: currentUser?.id || "SYSTEM"
        })
      });

      setInspectedAdmission(null);
      setDischargeDiagnosis('');
      setDischargeTreatment('');
      setDischargeInstructions('');
      fetchData();
      alert("Discharge file signed. Surcharges routed to Accounts counters.");
    } catch (e) {
      console.error(e);
    }
  };

  const filteredBeds = selectedWardFilter === 'ALL' 
    ? beds 
    : beds.filter(b => b.ward === selectedWardFilter);

  const wardTabs: { id: string; label: string }[] = [
    { id: 'ALL', label: 'All Wards' },
    { id: 'GENERAL', label: 'General Wards' },
    { id: 'PRIVATE', label: 'Private Deluxe' },
    { id: 'ICU', label: 'ICU Critical' },
    { id: 'CCU', label: 'CCU Cardiac' },
    { id: 'MATERNITY', label: 'Maternity Unit' },
  ];

  return (
    <div className="space-y-6" id="ipd-module-root">
      
      {/* KPI Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-205 dark:border-slate-800/80 shadow-sm" id="ipd-header-panel">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <BedDouble size={20} className="text-purple-550 text-purple-500" />
            <span>{t('nav_ipd')}</span>
          </h1>
          <p className="text-xs text-slate-450 mt-1">
            Dispatch diagnostic beds, supervise clinical ward occupancies (ICUs/CCUs), record nurse logs, and complete discharge summaries.
          </p>
        </div>

        <button
          id="btn-trigger-admit-form"
          onClick={() => {
            setShowAdmitForm(!showAdmitForm);
            setInspectedAdmission(null);
          }}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer shrink-0"
        >
          <PlusSquare size={15} />
          <span>{showAdmitForm ? t('cancel') : t('ipd_admission')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5" id="ipd-workspace">
        
        {/* LEFT COLUMN FORM: Admit Patient Form */}
        {showAdmitForm && (
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-950/40 shadow-sm space-y-4" id="ipd-admit-form-panel">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <PlusSquare className="text-emerald-505 text-emerald-500" size={17} />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-705 dark:text-white">Begin Inpatient File</span>
            </div>

            <form onSubmit={handleAdmit} className="space-y-4 text-xs text-left" id="ipd-new-admit-form">
              {formError && <div className="p-2.5 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-450 rounded-lg border border-rose-220/50">{formError}</div>}
              {formSuccess && <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 rounded-lg border border-emerald-250">{formSuccess}</div>}

              {/* Patient Selector */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-tight">Patient Registry Profile *</label>
                <select
                  id="admit-form-patient" required value={admitPatientMrn} onChange={e => setAdmitPatientMrn(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 px-2 py-2 rounded-lg text-slate-800 dark:text-white"
                >
                  <option value="">-- Choose Patient MRN (Unadmitted Only) --</option>
                  {patients.map(p => (
                    <option key={p.mrn} value={p.mrn}>[{p.mrn}] {p.name} - Blood: {p.bloodGroup}</option>
                  ))}
                </select>
              </div>

              {/* Vacant Bed Selector */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-tight">Assign Ward Vacancy *</label>
                <select
                  id="admit-form-bed" required value={admitBedId} onChange={e => setAdmitBedId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 px-2 py-2 rounded-lg text-slate-800 dark:text-white"
                >
                  <option value="">-- Choose Bed (Room Charge) --</option>
                  {beds.filter(b => b.status === 'AVAILABLE').map(bed => (
                    <option key={bed.id} value={bed.id}>[{bed.ward}] Bed ID {bed.bedNumber} - {formatPKR(bed.dailyCharge)}/day</option>
                  ))}
                </select>
              </div>

              {/* Select Physician */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-tight">Attending Doctor Rounds Physician *</label>
                <select
                  id="admit-form-doctor" required value={admitDoctorId} onChange={e => setAdmitDoctorId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 px-2 py-2 rounded-lg text-slate-800 dark:text-white"
                >
                  <option value="">-- Choose Attending Clinician --</option>
                  {doctors.map(doc => (
                    <option key={doc.id} value={doc.id}>{doc.name} ({doc.department})</option>
                  ))}
                </select>
              </div>

              <button
                id="btn-submit-ipd-admission" type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
              >
                Incept Inpatient File (داخل کریں)
              </button>
            </form>
          </div>
        )}

        {/* RIGHT COLUMN LAYOUT MATRIX: Beds Grid & Admissions Panel */}
        <div className={`space-y-6 ${showAdmitForm ? 'lg:col-span-8' : 'lg:col-span-12'}`} id="ipd-beds-space">
          
          {/* Bed Visual Dashboard Layout with Category Toggles */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4" id="bed-visual-board">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b pb-3 border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-850 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Activity size={16} className="text-purple-500" />
                <span>Specialty Ward Bed Availability Grid</span>
              </span>

              {/* Legend stats indicator */}
              <div className="flex items-center gap-3 text-[10px] font-mono leading-relaxed">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Vacant</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span> Admitted</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Maint</span>
              </div>
            </div>

            {/* Ward Quick Filtration tab list */}
            <div className="flex items-center gap-1 border-b pb-2 overflow-x-auto" id="ward-filter-scroller">
              {wardTabs.map(t => (
                <button
                  key={t.id}
                  id={`ward-tab-${t.id.toLowerCase()}`}
                  onClick={() => setSelectedWardFilter(t.id)}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                    selectedWardFilter === t.id
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Visual bed cards mapping */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-2" id="beds-color-matrix">
              {filteredBeds.map(bed => {
                const statusColor = bed.status === 'AVAILABLE' 
                  ? 'border-emerald-200 bg-emerald-50/40 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-450' 
                  : bed.status === 'OCCUPIED'
                  ? 'border-rose-225 bg-rose-50/45 text-rose-750 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-450'
                  : 'border-amber-205 bg-amber-50/40 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-450';
                
                return (
                  <div 
                    key={bed.id} 
                    className={`border p-3.5 rounded-xl text-center space-y-1.5 transition-shadow hover:shadow ${statusColor}`}
                    id={`visual-bed-${bed.id}`}
                  >
                    <span className="block text-[8px] font-mono font-extrabold uppercase tracking-widest text-slate-400">{bed.ward} Unit</span>
                    <strong className="block text-sm font-bold tracking-tight">Bed {bed.bedNumber}</strong>
                    <span className="block text-[10px] font-mono leading-none font-semibold">{formatPKR(bed.dailyCharge)}/D</span>
                    <span className="text-[9px] block uppercase font-mono font-bold tracking-tighter mt-1">{bed.status}</span>
                  </div>
                );
              })}
            </div>

          </div>

          {/* Active Admission Files lists ledger */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4" id="active-admissions-panel">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-white flex items-center gap-1.5">
                <ClipboardList size={16} className="text-purple-500" />
                <span>Active Ward Inpatient Files Ledger</span>
              </span>
              <span className="text-[10px] font-mono bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-900/40 font-bold">
                {admissions.filter(a => a.status === 'ADMITTED').length} Inpatients
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left" id="ipd-ledger-table">
                <thead className="bg-slate-50 dark:bg-slate-950/35 text-slate-400 text-[10px] font-mono uppercase border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="p-3 font-semibold">Inpatient ID</th>
                    <th className="p-3 font-semibold">Patient Demographics</th>
                    <th className="p-3 font-semibold">Assigned Bed Code</th>
                    <th className="p-3 font-semibold">Attending Doctor</th>
                    <th className="p-3 font-semibold">Admission Timestamp</th>
                    <th className="p-3 font-semibold text-center">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                  {admissions.map((adm) => (
                    <tr key={adm.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-950/10">
                      <td className="p-3 font-mono font-bold text-slate-650 dark:text-white">{adm.id}</td>
                      <td className="p-3">
                        <span className="block font-bold text-slate-850 dark:text-slate-200">{adm.patientName}</span>
                        <span className="block text-[10px] font-mono text-slate-450">{adm.patientMrn}</span>
                      </td>
                      <td className="p-3 font-mono text-center">
                        <span className="inline-block text-[10px] bg-slate-105 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-bold">
                          {adm.bedId} ({adm.ward})
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-800 dark:text-slate-300">{adm.admittingDoctorName}</td>
                      <td className="p-3 font-mono text-slate-500">{formatDate(adm.admittedAt)} {new Date(adm.admittedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="p-3 text-center">
                        {adm.status === 'ADMITTED' ? (
                          <button
                            id={`btn-open-inpatient-chart-${adm.id}`}
                            onClick={() => setInspectedAdmission(adm)}
                            className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg cursor-pointer"
                          >
                            Open Clinical Chart
                          </button>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-[9px] text-slate-450 uppercase font-bold tracking-tight">DISCHARGED</span>
                            <PDFDownloadLink
                              document={<IPDSummaryPDF admission={{
                                id: adm.id,
                                ward: adm.ward,
                                bedNumber: adm.bedId,
                                admittedAt: adm.admittedAt,
                                dischargedAt: adm.dischargedAt,
                                status: adm.status,
                                diagnosis: adm.dischargeSummary?.diagnosis || 'Clinical ward observation treatment & follow-up planning.',
                                dailyCharge: 2200,
                                totalCalculatedBill: adm.totalCalculatedBill || 6605,
                                dischargeInstructions: adm.dischargeSummary?.followUpInstructions || 'Maintain regular bedside checkups. Revisit OPD in case of temperature fluctuations.',
                                patient: {
                                  name: adm.patientName,
                                  mrn: adm.patientMrn,
                                  age: 39,
                                  gender: 'MALE'
                                }
                              }} />}
                              fileName={`Discharge_${adm.id}.pdf`}
                              className="bg-sky-600 hover:bg-sky-500 text-white font-sans font-bold text-[8.5px] px-2 py-0.5 rounded transition-all select-none text-center block"
                            >
                              {({ loading }) => loading ? '...' : 'PDF Doc'}
                            </PDFDownloadLink>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {admissions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-slate-400 font-sans italic">
                        No patient files currently registered on active inpatient lists.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </div>

      </div>

      {/* FULL RESPONSIVE CLINICAL CHART DETAIL MODAL */}
      {inspectedAdmission && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="inpatient-chart-modal">
          <div className="bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto" id="inpatient-chart-dialog">
            
            {/* Header */}
            <div className="p-4 border-b bg-slate-50 dark:bg-slate-950/20 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-850 dark:text-white flex items-center gap-2">
                  <ClipboardList className="text-purple-500 animate-pulse" size={18} />
                  <span>Ward Inpatient File: {inspectedAdmission.patientName}</span>
                </h3>
                <span className="text-[10px] font-mono text-slate-400">Record: {inspectedAdmission.id} | MRN: {inspectedAdmission.patientMrn} | Bed Assignment: {inspectedAdmission.bedId} ({inspectedAdmission.ward})</span>
              </div>
              <button 
                id="btn-close-chart-modal"
                onClick={() => setInspectedAdmission(null)}
                className="text-slate-400 hover:text-slate-600 hover:dark:text-white cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6" id="chart-workspace">
              
              {/* LEFT COLUMN: Active History list and Logger forms (Nurse/Doctor notes) */}
              <div className="md:col-span-7 space-y-6 text-left" id="chart-entries">
                
                {/* 1. Nurses notes history card */}
                <div className="space-y-3 bg-slate-50 dark:bg-slate-950/40 p-4.5 rounded-xl border">
                  
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-purple-650 dark:text-purple-400 uppercase tracking-wider block">Nursing Care logs & Notes</span>
                    <span className="text-[9px] text-slate-400 uppercase font-mono font-bold">Duty Care roster</span>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1" id="nursing-logs-scroll">
                    {inspectedAdmission.nurseNotes.map((note, idx) => (
                      <div key={idx} className="bg-white dark:bg-slate-900 p-3 rounded-lg border text-[11px] leading-relaxed relative">
                        <span className="block text-[9px] font-mono text-slate-450">{formatDate(note.time)} {new Date(note.time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                        <p className="text-slate-800 dark:text-slate-350 mt-1">{note.note}</p>
                        <span className="block text-[8px] text-right font-mono font-bold text-purple-500 uppercase mt-1">&mdash; {note.nurseName}</span>
                      </div>
                    ))}
                    {inspectedAdmission.nurseNotes.length === 0 && (
                      <p className="text-[10px] text-slate-400 italic text-center p-4">No nursing records found inside file.</p>
                    )}
                  </div>

                  {/* Add nurse note input */}
                  <div className="flex gap-2 border-t pt-3">
                    <input 
                      id="ipd-nurse-note-input"
                      type="text" value={nurseNoteText} onChange={e => setNurseNoteText(e.target.value)}
                      placeholder="Write new nurse care entry (vitals, meds, IVs status)..."
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded text-xs focus:outline-purple-500"
                    />
                    <button 
                      id="btn-add-nurse-note"
                      onClick={submitNurseNote}
                      className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-4 rounded transition-all cursor-pointer whitespace-nowrap"
                    >
                      Log Note
                    </button>
                  </div>
                </div>

                {/* 2. Doctor rounds visit index */}
                <div className="space-y-3 bg-slate-50 dark:bg-slate-950/40 p-4.5 rounded-xl border">
                  
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-purple-650 dark:text-purple-400 uppercase tracking-wider block">Doctor Rounds & Visit Logs</span>
                    <span className="text-[9px] text-slate-400 uppercase font-mono font-bold">Standard Round Surcharges</span>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1" id="doctor-rounds-scroll">
                    {inspectedAdmission.doctorVisits.map((v, idx) => (
                      <div key={idx} className="bg-white dark:bg-slate-900 p-3 rounded-lg border text-[11px] leading-relaxed">
                        <span className="block text-[9px] font-mono text-slate-450">{formatDate(v.time)} {new Date(v.time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                        <p className="text-slate-800 dark:text-slate-350 mt-1 font-semibold">{v.notes}</p>
                        <div className="flex items-center justify-between text-[8px] font-mono font-bold text-teal-650 dark:text-teal-400 uppercase mt-1.5">
                          <span>Verified Physician: {v.doctorName}</span>
                          <span className="text-[10px]">{formatPKR(v.charge)} Fee Surchg</span>
                        </div>
                      </div>
                    ))}
                    {inspectedAdmission.doctorVisits.length === 0 && (
                      <p className="text-[10px] text-slate-400 italic text-center p-4">No physician round notes logged in file.</p>
                    )}
                  </div>

                  {/* Add doctor round visit logs */}
                  <div className="space-y-2 border-t pt-3">
                    <textarea 
                      id="ipd-doc-visit-note-input"
                      rows={1.5} value={docNotesText} onChange={e => setDocNotesText(e.target.value)}
                      placeholder="Write doctor clinical instructions for this round..."
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded text-xs focus:outline-purple-500"
                    />
                    <div className="flex gap-2">
                      <select 
                        id="ipd-doc-visit-charge-dropdown"
                        value={docVisitCharge} onChange={e => setDocVisitCharge(e.target.value)}
                        className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 text-xs px-2 py-1.5 rounded"
                      >
                        <option value="1500">Rs. 1,500 GOPD doctor round</option>
                        <option value="2500">Rs. 2,500 Specialist senior round</option>
                        <option value="5000">Rs. 5,000 Professor ICU emergency</option>
                      </select>
                      <button 
                        id="btn-add-doc-visit"
                        onClick={submitDoctorRound}
                        className="ml-auto bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-4 rounded transition-all cursor-pointer"
                      >
                        Log Round Visit
                      </button>
                    </div>
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN: DISCHARGE THERAPEUTIC SUMMARY SHEET */}
              <div className="md:col-span-5 bg-purple-50/20 dark:bg-purple-950/20 p-5 rounded-2xl border border-dashed border-purple-200 dark:border-purple-900/60 text-left space-y-4" id="discharge-panel">
                <div className="flex items-center gap-1.5 border-b border-purple-100 dark:border-purple-900/50 pb-3">
                  <Flame className="text-purple-600 animate-pulse text-purple-500" size={17} />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-purple-300">Sign Discharge Case Summary</span>
                </div>

                <div className="space-y-3 text-xs leading-normal">
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Ticking off the discharge process releases Bed vacancy, seals inpatient registers, and dispatches itemized ledger breakdown to cashier accounts counters.
                  </p>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-450 block font-bold uppercase">Discharge definitive Diagnosis *</label>
                    <input 
                      id="discharge-input-diagnosis"
                      type="text" value={dischargeDiagnosis} onChange={e => setDischargeDiagnosis(e.target.value)}
                      placeholder="e.g. Acute STEMI post-PCI success"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded focus:outline-purple-500 text-xs text-slate-850 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-450 block font-bold uppercase">Summary of treatment Given *</label>
                    <textarea 
                      id="discharge-input-treatment"
                      rows={2.5} value={dischargeTreatment} onChange={e => setDischargeTreatment(e.target.value)}
                      placeholder="Specify therapeutic procedures, stent sizes, central lines, surgeries completed..."
                      className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 p-2 rounded focus:outline-purple-500 text-xs text-slate-850 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-450 block font-bold uppercase">Follow-up Clinical Instructions</label>
                    <textarea 
                      id="discharge-input-instructions"
                      rows={2.5} value={dischargeInstructions} onChange={e => setDischargeInstructions(e.target.value)}
                      placeholder="e.g. Bed rest, avoid heavy weights, check BP twice daily, review in clinic in 7 days..."
                      className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 p-2 rounded focus:outline-purple-500 text-xs text-slate-850 dark:text-white"
                    />
                  </div>

                  {/* Financial Estimate Summary display */}
                  <div className="bg-slate-950/45 text-slate-400 p-3 rounded-xl border border-slate-800 space-y-1 text-center font-mono">
                    <span className="text-[8px] text-slate-450 tracking-wider font-bold block uppercase">Accumulated Round & Ward fee</span>
                    <strong className="text-md text-emerald-400 block tracking-tight font-extrabold">{formatPKR(inspectedAdmission.totalCalculatedBill)}</strong>
                    <span className="text-[7.5px] text-slate-500 leading-none">Excluding PRA Taxes & Pharmacy dispensing.</span>
                  </div>

                  <button
                    id="btn-discharge-ipd"
                    disabled={!dischargeDiagnosis || !dischargeTreatment}
                    onClick={handleDischarge}
                    className="w-full bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold py-2.5 rounded-xl shadow transition-all cursor-pointer text-center text-xs block uppercase tracking-wide flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle size={14} />
                    <span>Compile & Authorize Discharge</span>
                  </button>

                </div>

              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
