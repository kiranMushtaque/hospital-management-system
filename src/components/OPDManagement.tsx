/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Clipboard, UserCheck, PlusSquare, HeartPulse, Sparkles, 
  Trash2, Plus, ArrowRight, CheckCircle, RefreshCw, Layers
} from 'lucide-react';
import { formatPKR, formatDate } from '../utils';
import { OPDVisit, User, Patient, Medicine, PrescriptionItem } from '../types';

interface OPDManagementProps {
  currentUser: User | null;
  lang: 'EN' | 'UR';
  t: (key: string) => string;
}

export default function OPDManagement({ currentUser, lang, t }: OPDManagementProps) {
  const [visits, setVisits] = useState<OPDVisit[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [clinicians, setClinicians] = useState<User[]>([]);
  const [inventory, setInventory] = useState<Medicine[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<OPDVisit | null>(null);

  // Scheduling Form States
  const [patientMrn, setPatientMrn] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [symptomsText, setSymptomsText] = useState('');
  const [specialty, setSpecialty] = useState('GENERAL_OPD');
  const [billAmount, setBillAmount] = useState('1500');

  // Consultation Clinical States
  const [bp, setBp] = useState('120/80');
  const [temp, setTemp] = useState('37.0');
  const [weight, setWeight] = useState('70');
  const [pulse, setPulse] = useState('75');
  const [diagnosis, setDiagnosis] = useState('');
  const [referralDept, setReferralDept] = useState('');

  // Prescription items state list
  const [prescriptionList, setPrescriptionList] = useState<PrescriptionItem[]>([]);
  const [medId, setMedId] = useState('');
  const [medDosage, setMedDosage] = useState('1-0-1');
  const [medFreq, setMedFreq] = useState('After Meals (کھانے کے بعد)');
  const [medDur, setMedDur] = useState('5 Days');
  const [medQty, setMedQty] = useState('10');

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const resV = await fetch('/api/opd/visits');
      const dataV = await resV.json();
      setVisits(dataV);

      const resP = await fetch('/api/patients');
      const dataP = await resP.json();
      setPatients(dataP);

      const resS = await fetch('/api/hr/staff');
      const dataS = await resS.json();
      setClinicians(dataS.filter((u: User) => u.role === 'DOCTOR'));

      const resM = await fetch('/api/pharmacy/medicines');
      const dataM = await resM.json();
      setInventory(dataM);
    } catch (e) {
      console.error("OPD data query failure", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!patientMrn || !doctorId) {
      setFormError('Select active Patient and Physician.');
      return;
    }

    try {
      const payload = {
        patientMrn,
        doctorId,
        symptomsText,
        specialty,
        billAmount: Number(billAmount),
        staffId: currentUser?.id || "SYSTEM"
      };

      const res = await fetch('/api/opd/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Token dispatch failed.');
      }

      setFormSuccess('OPD Token allocated on consultation queue!');
      setPatientMrn('');
      setSymptomsText('');
      
      // Auto trigger standard OPD bill registration
      const freshVisit = await res.json();
      await fetch('/api/billing/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientMrn: freshVisit.patientMrn,
          module: 'OPD',
          subtotal: freshVisit.billAmount,
          discountApprovedAmount: 0,
          taxAmount: freshVisit.billAmount * 0.05,
          netBill: freshVisit.billAmount * 1.05,
          paymentMethod: 'CASH',
          items: [{ description: `OPD Consultation ticket - Token #${freshVisit.tokenNumber}`, qty: 1, price: freshVisit.billAmount }],
          staffId: currentUser?.id || "SYSTEM"
        })
      });

      setTimeout(() => {
        setFormSuccess('');
        fetchData();
      }, 1500);

    } catch (err: any) {
      setFormError(err.message || 'Error booking appointment.');
    }
  };

  // Add line item to clinical prescription pad
  const addPrescriptionLine = () => {
    if (!medId) return;
    const medicineItem = inventory.find(m => m.id === medId);
    if (!medicineItem) return;

    const line: PrescriptionItem = {
      medicineId: medId,
      name: medicineItem.name,
      dosage: medDosage,
      frequency: medFreq,
      duration: medDur,
      quantity: Number(medQty)
    };

    setPrescriptionList([...prescriptionList, line]);
    // reset prescription item dropdown
    setMedId('');
  };

  const removePrescriptionLine = (idx: number) => {
    setPrescriptionList(prescriptionList.filter((_, i) => i !== idx));
  };

  const handleCompleteConsultation = async () => {
    if (!selectedVisit) return;
    try {
      const payload = {
        status: 'COMPLETED',
        bp,
        temp: Number(temp),
        weight: Number(weight),
        pulse: Number(pulse),
        diagnosis,
        prescription: prescriptionList,
        referralDepartment: referralDept || undefined,
        staffId: currentUser?.id || "SYSTEM"
      };

      const res = await fetch(`/api/opd/visits/${selectedVisit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Update failed.");
      }

      // Dispense medicines from stock counts automatically
      for (const rx of prescriptionList) {
        await fetch('/api/pharmacy/dispense', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            medicineId: rx.medicineId,
            qty: rx.quantity,
            patientName: selectedVisit.patientName,
            staffId: currentUser?.id || "SYSTEM"
          })
        });
      }

      setSelectedVisit(null);
      setPrescriptionList([]);
      setDiagnosis('');
      setReferralDept('');
      fetchData();
    } catch (e: any) {
      alert(e.message || "Consultation entry error.");
    }
  };

  return (
    <div className="space-y-6" id="opd-module-root">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-205 dark:border-slate-800/80 shadow-sm" id="opd-header-panel">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Clipboard size={20} className="text-emerald-500" />
            <span>{t('nav_opd')}</span>
          </h1>
          <p className="text-xs text-slate-450 mt-1">
            Dispatch diagnostic tokens, record patient vitals on triage, and write secure digital prescriptions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5" id="opd-workspace">
        
        {/* LEFT COLUMN: Issue Token Desk */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4" id="opd-issue-token-desk">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Clipboard className="text-emerald-500 animate-pulse" size={18} />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-white">Issue OPD Access Ticket</span>
          </div>

          <form onSubmit={handleCreateToken} className="space-y-3.5 text-xs text-left" id="opd-issue-form">
            {formError && <div className="p-2.5 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-450 rounded-lg border border-rose-220/50">{formError}</div>}
            {formSuccess && <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 rounded-lg border border-emerald-250">{formSuccess}</div>}

            {/* Select Patient MRN */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-450 uppercase tracking-tight">Active Patient MRN *</label>
              <select
                id="opd-form-patient" required value={patientMrn} onChange={e => setPatientMrn(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 px-2 py-2 rounded-lg text-slate-800 dark:text-white focus:outline-emerald-500"
              >
                <option value="">-- Choose Patient MRN (CNIC / Name) --</option>
                {patients.map(p => (
                  <option key={p.mrn} value={p.mrn}>[{p.mrn}] {p.name} - CNIC: {p.cnic}</option>
                ))}
              </select>
            </div>

            {/* Select Doctor */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-450 uppercase tracking-tight">Consultant On-Duty *</label>
              <select
                id="opd-form-doctor" required value={doctorId} onChange={e => setDoctorId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 px-2 py-2 rounded-lg text-slate-800 dark:text-white focus:outline-emerald-500"
              >
                <option value="">-- Choose Specialist Doctor --</option>
                {clinicians.map(doc => (
                  <option key={doc.id} value={doc.id}>{doc.name} ({doc.department})</option>
                ))}
              </select>
            </div>

            {/* Consultation Unit Type */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-450 uppercase tracking-tight">Consultation Ward</label>
                <select
                  id="opd-form-dept" value={specialty} onChange={e => setSpecialty(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 px-2 py-2 rounded-lg text-slate-800 dark:text-white focus:outline-emerald-500"
                >
                  <option value="GENERAL_OPD">General Medicine</option>
                  <option value="CARDIOLOGY">Cardiology Clinic</option>
                  <option value="MATERNITY">Gynaecology & Maternity</option>
                  <option value="PEDIATRICS">Paediatrics Unit</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-450 uppercase tracking-tight">Fee (Rs) *</label>
                <select
                  id="opd-form-fee" value={billAmount} onChange={e => setBillAmount(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 px-2 py-2 rounded-lg text-slate-800 dark:text-white focus:outline-emerald-500"
                >
                  <option value="1500">Rs. 1,500 (GOPD)</option>
                  <option value="2500">Rs. 2,500 (Consultant Special)</option>
                  <option value="0">Rs. 0 (Mayo Poor Welfare Surchg)</option>
                </select>
              </div>
            </div>

            {/* Complaint Text */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-450 uppercase tracking-tight">Chief Physical Complaint</label>
              <textarea
                id="opd-form-symptoms" value={symptomsText} onChange={e => setSymptomsText(e.target.value)}
                placeholder="Briefly state vital symptoms or discomfort described by patient, e.g., acute hyperthermia, chest pressure..." rows={2}
                className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 px-3 py-2 rounded-lg text-slate-800 dark:text-white focus:outline-emerald-500"
              />
            </div>

            <button
              id="btn-submit-opd-token" type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
            >
              Dispatch Token Ticket (پرچی جاری کریں)
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: Active Waitlists Queue */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4" id="opd-waiting-queue-panel">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-white flex items-center gap-1.5">
              <UserCheck size={16} className="text-emerald-500" />
              <span>Diagnostic Queue Ticket Waitlist</span>
            </span>
            <span className="text-[10px] font-mono bg-amber-50 dark:bg-amber-950/35 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40 px-2 py-0.5 rounded-md font-bold">
              {visits.filter(v => v.status === 'WAITING').length} Waitlist Pending
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left" id="opd-queue-table">
              <thead className="bg-slate-50 dark:bg-slate-950/35 text-slate-400 text-[10px] font-mono uppercase border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="p-3 font-semibold text-center">Token</th>
                  <th className="p-3 font-semibold">Patient Demographics</th>
                  <th className="p-3 font-semibold">Target Clinician</th>
                  <th className="p-3 font-semibold">Specialty Dept</th>
                  <th className="p-3 font-semibold">Consult Status</th>
                  <th className="p-3 font-semibold text-center">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {visits.map((visit) => (
                  <tr key={visit.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-950/10">
                    <td className="p-3 text-center whitespace-nowrap">
                      <span className="inline-block font-mono font-bold text-center w-8 h-8 leading-8 rounded-full bg-slate-105 bg-slate-100 dark:bg-slate-800 dark:text-white text-slate-700">
                        {visit.tokenNumber}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="block font-bold text-slate-850 dark:text-slate-200">{visit.patientName}</span>
                      <span className="block text-[10px] text-slate-450 font-mono italic">{visit.patientMrn}</span>
                    </td>
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-350">{visit.doctorName}</td>
                    <td className="p-3 font-mono text-slate-500">{visit.specialty}</td>
                    <td className="p-3 whitespace-nowrap">
                      {visit.status === 'WAITING' ? (
                        <span className="inline-block text-[9px] bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded font-bold uppercase animate-pulse">Waiting Triage</span>
                      ) : (
                        <span className="inline-block text-[9px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded font-bold uppercase">Completed</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {visit.status === 'WAITING' ? (
                        <button
                          id={`btn-trigger-consult-${visit.id}`}
                          onClick={() => {
                            setSelectedVisit(visit);
                            setPrescriptionList([]);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                        >
                          Triage & Clinical Consult
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 block max-w-[120px] truncate" title={visit.diagnosis}>
                          {visit.diagnosis || "No diagnosis saved"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {visits.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-400 font-sans italic">
                      There are no active OPD tokens issued today.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* CLINCAL CONSULT PRESCRIBING MODAL (DUTY DOC CHARTS) */}
      {selectedVisit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="consultation-modal">
          <div className="bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" id="consultation-modal-dialog">
            
            {/* Header */}
            <div className="p-4 border-b border-light bg-slate-55 dark:bg-slate-950/20 dark:border-slate-805 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <HeartPulse className="text-emerald-505 text-emerald-500 animate-pulse" size={18} />
                  <span>Clinical Prescribing Pad • Token #{selectedVisit.tokenNumber}</span>
                </h3>
                <span className="text-[10px] text-slate-450">Active Patient: {selectedVisit.patientName} ({selectedVisit.patientMrn})</span>
              </div>
              <button 
                id="btn-close-consult-modal"
                onClick={() => setSelectedVisit(null)}
                className="text-slate-400 hover:text-slate-600 hover:dark:text-white cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <div className="p-6 space-y-6 text-left text-xs">
              
              {/* Vitals Capture Section */}
              <div className="bg-slate-50 dark:bg-slate-950/45 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800/40 space-y-3">
                <span className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Triage Vitals Checkpoints</span>
                <div className="grid grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 block font-bold uppercase">BP (syst/diast)</label>
                    <input 
                      id="vital-input-bp" type="text" value={bp} onChange={e => setBp(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded text-slate-800 dark:text-white font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 block font-bold uppercase">Temp (°C)</label>
                    <input 
                      id="vital-input-temp" type="number" step="0.1" value={temp} onChange={e => setTemp(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded text-slate-800 dark:text-white font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 block font-bold uppercase">Weight (kg)</label>
                    <input 
                      id="vital-input-weight" type="number" value={weight} onChange={e => setWeight(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded text-slate-800 dark:text-white font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 block font-bold uppercase">Pulse Rate (bpm)</label>
                    <input 
                      id="vital-input-pulse" type="number" value={pulse} onChange={e => setPulse(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded text-slate-800 dark:text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Diagnosis and Symptoms */}
              <div className="space-y-3">
                <span className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Clinician Evaluation Summary</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-450 font-bold uppercase text-[10px]">Active Disease Diagnosis *</label>
                    <textarea 
                      id="clinical-input-diagnosis" rows={2.5} value={diagnosis} onChange={e => setDiagnosis(e.target.value)} required
                      placeholder="Identify pathology definitively e.g. acute bacterial sinusitis, Type 2 diabetes mellitus decompensated..." 
                      className="w-full bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg text-slate-850 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-450 font-semibold text-[10px]">Complain details / triage logs</label>
                    <div className="p-3 min-h-[50px] bg-slate-50 dark:bg-slate-955 dark:bg-slate-950/45 rounded-xl border italic text-slate-500 overflow-y-auto">
                      &ldquo;{selectedVisit.symptoms}&rdquo;
                    </div>
                  </div>
                </div>
              </div>

              {/* Pharmacy Prescribe Medicine Line items assembling */}
              <div className="space-y-3.5 border-t border-slate-100 dark:border-slate-800/80 pt-4">
                <span className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Medication Prescribing Pad</span>
                
                {/* Pad input line */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end bg-slate-50 dark:bg-slate-950/45 p-3.5 rounded-xl border border-dashed border-slate-250">
                  
                  <div className="md:col-span-4 space-y-1">
                    <label className="block text-[10px] text-slate-400 font-bold uppercase">Select Medicine SKU</label>
                    <select
                      id="clinical-med-dropdown" value={medId} onChange={e => setMedId(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-1.5 rounded text-xs text-slate-800 dark:text-white"
                    >
                      <option value="">-- Choose Stock SKU --</option>
                      {inventory.map(med => (
                        <option key={med.id} value={med.id} disabled={med.stockCount <= 0}>
                          {med.name} (Stock: {med.stockCount} / Rs. {med.salePrice})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2 space-y-1">
                    <label className="block text-[10px] text-slate-400 font-bold uppercase">Dosage</label>
                    <input 
                      id="clinical-med-dosage" type="text" placeholder="e.g. 1-0-1" value={medDosage} onChange={e => setMedDosage(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-1.5 rounded text-xs"
                    />
                  </div>

                  <div className="md:col-span-3 space-y-1">
                    <label className="block text-[10px] text-slate-400 font-bold uppercase">Interval</label>
                    <input 
                      id="clinical-med-freq" type="text" value={medFreq} onChange={e => setMedFreq(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-1.5 rounded text-xs"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-1">
                    <label className="block text-[10px] text-slate-450 font-bold uppercase">Qty</label>
                    <input 
                      id="clinical-med-qty" type="number" value={medQty} onChange={e => setMedQty(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-1.5 rounded text-xs"
                    />
                  </div>

                  <div className="md:col-span-1">
                    <button
                      id="btn-add-prescription-line" type="button" onClick={addPrescriptionLine}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-2.5 rounded justify-center items-center flex"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                </div>

                {/* List of currently prescribed line items */}
                <div className="overflow-x-auto border rounded-xl" id="prescription-itemized-table">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-950/20 text-slate-400 font-mono text-[9px] uppercase border-b">
                      <tr>
                        <th className="p-2.5 font-semibold">SKU Medicine Name</th>
                        <th className="p-2.5 font-semibold">Scheduled Dosage</th>
                        <th className="p-2.5 font-semibold">Interval Routine</th>
                        <th className="p-2.5 font-semibold font-mono text-center">Dispensing Qty</th>
                        <th className="p-2.5 font-semibold text-center">Remove</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {prescriptionList.map((rx, rxIdx) => (
                        <tr key={rxIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10">
                          <td className="p-2.5 font-semibold text-slate-850 dark:text-slate-100">{rx.name}</td>
                          <td className="p-2.5 font-mono text-[11px]">{rx.dosage}</td>
                          <td className="p-2.5 italic text-slate-550">{rx.frequency}</td>
                          <td className="p-2.5 font-mono text-center font-bold text-slate-850 dark:text-white">{rx.quantity}</td>
                          <td className="p-2.5 text-center">
                            <button 
                              id={`remove-rx-item-${rxIdx}`}
                              onClick={() => removePrescriptionLine(rxIdx)}
                              className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/10 cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {prescriptionList.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-slate-400 font-sans italic">
                            Pre-populate prescriptions items list from standard pharmacopeia using key dropdown triggers.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

              </div>

              {/* Department Referrals */}
              <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-800/80 pt-4">
                <label className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest">Refer to Other Specialty Department</label>
                <select
                  id="clinical-referral-dropdown" value={referralDept} onChange={e => setReferralDept(e.target.value)}
                  className="w-xs bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-lg text-slate-850 dark:text-white"
                >
                  <option value="">No Departmental Referral Required</option>
                  <option value="CARDIOLOGY">Cardiology Clinical Unit</option>
                  <option value="MATERNITY">Gynaecology & Maternity Unit</option>
                  <option value="PEDIATRICS">Paediatrics Ward Desk</option>
                  <option value="DIAGNOSTICS_LAB">Pathology Diagnostics Laboratory</option>
                  <option value="RADIOLOGY">Radiology Imaging Desk</option>
                </select>
              </div>

            </div>

            {/* Actions Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950/20 border-t dark:border-slate-805 flex justify-end gap-2.5">
              <button
                id="btn-cancel-consultation"
                onClick={() => setSelectedVisit(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="btn-complete-consultation"
                disabled={!diagnosis}
                onClick={handleCompleteConsultation}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white px-5 py-2 rounded-xl shadow font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle size={14} />
                <span>Sign & Compile Prescription (نسخہ مکمل کریں)</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
