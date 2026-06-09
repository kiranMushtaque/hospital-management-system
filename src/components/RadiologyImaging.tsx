/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Radio, Search, PlusCircle, FileText, CheckCircle, 
  Layers, Image, HelpCircle, Activity, Printer, X
} from 'lucide-react';
import { formatPKR, formatDate } from '../utils';
import { RadiologyOrder, Patient, User, RadiologyType } from '../types';

interface RadiologyProps {
  currentUser: User | null;
  lang: 'EN' | 'UR';
  t: (key: string) => string;
}

export default function RadiologyImaging({ currentUser, lang, t }: RadiologyProps) {
  const [orders, setOrders] = useState<RadiologyOrder[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<User[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);

  // Scheduling forms
  const [patientMrn, setPatientMrn] = useState('');
  const [scanType, setScanType] = useState<RadiologyType>('X_RAY');
  const [instructions, setInstructions] = useState('');
  const [doctorId, setDoctorId] = useState('');

  // Diagnosis Modal reports upload states
  const [inspectedOrder, setInspectedOrder] = useState<RadiologyOrder | null>(null);
  const [findingsText, setFindingsText] = useState('');
  const [selectedSimImg, setSelectedSimImg] = useState('brain_scan');

  const fetchData = async () => {
    try {
      setLoading(true);
      const resO = await fetch('/api/radiology/orders');
      const dataO = await resO.json();
      setOrders(dataO);

      const resP = await fetch('/api/patients');
      const dataP = await resP.json();
      setPatients(dataP);

      const resS = await fetch('/api/hr/staff');
      const dataS = await resS.json();
      setDoctors(dataS.filter((u: User) => u.role === 'DOCTOR'));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientMrn) {
      alert("Please select Patient MRN.");
      return;
    }

    try {
      const payload = {
        patientMrn,
        type: scanType,
        instructions,
        doctorId,
        staffId: currentUser?.id || "SYSTEM"
      };

      const res = await fetch('/api/radiology/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error("Radiology order failed.");
      }

      // Automatically register radiology bill in database
      let pricing = 1500; // X_RAY
      if (scanType === 'MRI') pricing = 12000;
      if (scanType === 'CT_SCAN') pricing = 7500;
      if (scanType === 'ULTRASOUND') pricing = 2200;

      await fetch('/api/billing/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientMrn,
          module: 'RADIOLOGY',
          subtotal: pricing,
          discountApprovedAmount: 0,
          taxAmount: pricing * 0.05,
          netBill: pricing * 1.05,
          paymentMethod: 'CASH',
          items: [{ description: `Radiological Scan study: ${scanType}`, qty: 1, price: pricing }],
          staffId: currentUser?.id || "SYSTEM"
        })
      });

      setShowOrderForm(false);
      setPatientMrn('');
      setInstructions('');
      fetchData();
      alert("Radiology study requested. Bills dispatched to accounts counters.");

    } catch (e) {
      alert("Error issuing radiology order.");
    }
  };

  const handleUploadReport = async () => {
    if (!inspectedOrder || !findingsText) return;
    try {
      // Choose scenic high-fidelity hospital radiographics simulated pics
      let url = "https://images.unsplash.com/photo-1559757175-5700dde675bc?q=80&w=350&auto=format&fit=crop"; // CT x-ray chest
      if (selectedSimImg === 'ultrasound') {
        url = "https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=350&auto=format&fit=crop"; // lab fetal echo scan
      } else if (selectedSimImg === 'brain_scan') {
        url = "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?q=80&w=350&auto=format&fit=crop"; // brain CT tomography slice
      }

      const res = await fetch(`/api/radiology/orders/${inspectedOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          findings: findingsText,
          imageUrl: url,
          staffId: currentUser?.id || "SYSTEM"
        })
      });

      if (res.ok) {
        setInspectedOrder(null);
        setFindingsText('');
        fetchData();
        alert("Report uploaded safely into patient electronic health logs.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const imagesPresets = [
    { id: 'brain_scan', label: 'Brain computed tomography slice' },
    { id: 'chest_xray', label: 'Thorasic chest radiography view' },
    { id: 'ultrasound', label: 'Abdomen real-time ultrasound echo study' }
  ];

  return (
    <div className="space-y-6" id="radiology-module-root">
      
      {/* KPI Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-205 dark:border-slate-800/80 shadow-sm" id="radiology-header">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Radio size={20} className="text-emerald-555 animate-pulse text-emerald-500" />
            <span>{t('nav_radiology')}</span>
          </h1>
          <p className="text-xs text-slate-450 mt-1">
            Dispatch diagnostic high-frequency imaging studies (X-Rays, MRIs, CT scans) and record radiological findings.
          </p>
        </div>

        <button
          id="btn-trigger-radiology-form"
          onClick={() => setShowOrderForm(!showOrderForm)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer shrink-0"
        >
          <PlusCircle size={15} />
          <span>{showOrderForm ? t('cancel') : t('rad_order')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5" id="radiology-workspace">
        
        {/* LEFT COLUMN: Scan Order Draft Pads */}
        {showOrderForm && (
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-201 dark:border-slate-800/80 shadow-sm space-y-4 animate-slide-in" id="radiology-add-order-form">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Radio className="text-emerald-500 animate-pulse" size={17} />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-705 dark:text-white">Order Radiological Scan</span>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-4 text-xs text-left" id="radiology-issue-form">
              
              <div className="space-y-1">
                <label className="block text-[10px] text-slate-450 font-bold uppercase">Patient MRN *</label>
                <select
                  id="rad-form-patient" required value={patientMrn} onChange={e => setPatientMrn(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 px-2 py-2 rounded-lg text-slate-800 dark:text-white"
                >
                  <option value="">-- Select Patient MRN --</option>
                  {patients.map(p => (
                    <option key={p.mrn} value={p.mrn}>[{p.mrn}] {p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-450 font-bold uppercase">Imaging Category</label>
                  <select
                    id="rad-form-type" value={scanType} onChange={e => setScanType(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 px-2 py-2 rounded-lg text-slate-810 dark:text-white"
                  >
                    <option value="X_RAY">Digital X-Ray (Rs. 1,500)</option>
                    <option value="ULTRASOUND">Ultrasound Echo (Rs. 2,200)</option>
                    <option value="CT_SCAN">CT Scan Tomo (Rs. 7,500)</option>
                    <option value="MRI">High Field MRI (Rs. 12,000)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-450 font-bold uppercase">Requesting Doctor</label>
                  <select
                    id="rad-form-doctor" value={doctorId} onChange={e => setDoctorId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-205 dark:border-slate-800 px-2 py-2 rounded-lg text-slate-800 dark:text-white"
                  >
                    <option value="">-- Choose clinician --</option>
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-slate-450 font-bold uppercase">Imaging Instructions</label>
                <textarea
                  id="rad-form-instructions" value={instructions} onChange={e => setInstructions(e.target.value)}
                  placeholder="Focus areas e.g., third lumbar vertebra lateral view or left knee joint, pelvic area scan..." rows={3.5}
                  className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-195 dark:border-slate-800 px-3 py-2 rounded-lg text-slate-800 dark:text-white focus:outline-emerald-500"
                />
              </div>

              <button
                id="btn-submit-radiology-order" type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl shadow transition-all cursor-pointer"
              >
                Sign & Authorize Study
              </button>
            </form>
          </div>
        )}

        {/* RIGHT COLUMN: Active study tracking ledger */}
        <div className={`bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4 ${
          showOrderForm ? 'lg:col-span-8' : 'lg:col-span-12'
        }`} id="radiology-active-scans">
          
          <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-white flex items-center gap-1.5">
              <Activity size={16} className="text-emerald-500" />
              <span>Diagnostic Imaging Study Registries</span>
            </span>
            <span className="text-[10px] font-mono bg-amber-50 dark:bg-amber-950/20 text-amber-600 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900/40 font-bold">
              {orders.filter(o => o.status === 'PENDING').length} Studies Outstanding
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left" id="radiology-table">
              <thead className="bg-slate-50 dark:bg-slate-950/35 text-slate-400 text-[10px] font-mono uppercase border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="p-3 font-semibold">Study Code</th>
                  <th className="p-3 font-semibold">Patient Demographics</th>
                  <th className="p-3 font-semibold">Imaging Study Category</th>
                  <th className="p-3 font-semibold">Clincial Instructions</th>
                  <th className="p-3 font-semibold">Status Checks</th>
                  <th className="p-3 font-semibold text-center">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/65 dark:hover:bg-slate-950/10">
                    <td className="p-3 font-mono font-bold text-slate-800 dark:text-white">{o.id}</td>
                    <td className="p-3">
                      <span className="block font-bold text-slate-850 dark:text-slate-100">{o.patientName}</span>
                      <span className="block text-[10px] font-mono text-slate-455">{o.patientMrn}</span>
                    </td>
                    <td className="p-3">
                      <span className="inline-block px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-650 dark:text-emerald-400 font-mono text-[10px] font-bold">
                        {o.type}
                      </span>
                    </td>
                    <td className="p-3 text-slate-550 max-w-[180px] truncate" title={o.instructions}>{o.instructions}</td>
                    <td className="p-3 whitespace-nowrap">
                      {o.status === 'PENDING' ? (
                        <span className="inline-block text-[9px] bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded font-bold uppercase animate-pulse">Pending Scan</span>
                      ) : (
                        <span className="inline-block text-[9px] bg-emerald-50 dark:bg-emerald-950/45 text-emerald-700 dark:text-emerald-450 px-1.5 py-0.5 rounded font-bold uppercase">Uploaded</span>
                      )}
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
                      <div className="flex justify-center gap-2">
                        {o.status === 'PENDING' ? (
                          <button
                            id={`btn-complete-scan-${o.id}`}
                            onClick={() => {
                              setInspectedOrder(o);
                              setFindingsText('');
                            }}
                            className="bg-purple-650 bg-purple-600 hover:bg-purple-505 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg cursor-pointer"
                          >
                            Upload findings
                          </button>
                        ) : (
                          <div className="bg-slate-50 p-2.5 rounded text-left border text-[10.5px] max-w-xs space-y-2">
                            <div className="flex gap-2.5">
                              {o.imageUrl && (
                                <img 
                                  src={o.imageUrl} alt="Scan Study" referrerPolicy="no-referrer"
                                  className="w-12 h-12 rounded object-cover border filter grayscale" 
                                />
                              )}
                              <div>
                                <p className="font-bold underline dark:text-white">Radiologist Report Findings:</p>
                                <p className="text-slate-500 italic mt-0.5 max-w-[150px] truncate">{o.findings}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* RADIOLOGY REPORT FINDINGS WRITER MODAL */}
      {inspectedOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="radiology-diagnose-modal">
          <div className="bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full overflow-hidden animate-scale-up" id="radiology-findings-dialog">
            
            <div className="p-4 border-b bg-slate-55 bg-slate-50 dark:bg-slate-950/20 flex items-center justify-between">
              <span className="font-bold text-slate-800 lg:dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={15} />
                <span>Log Radiographical findings study</span>
              </span>
              <button 
                id="btn-close-findings"
                onClick={() => setInspectedOrder(null)}
                className="text-slate-400 hover:text-slate-650 hover:dark:text-white cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="p-6 text-left text-xs space-y-4">
              
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950/45 rounded-xl border border-slate-105">
                <p className="font-extrabold text-slate-850 dark:text-slate-100">Patient: {inspectedOrder.patientName}</p>
                <p className="font-mono text-[10px] text-slate-455">MRN Code: {inspectedOrder.patientMrn}</p>
                <p className="font-bold text-emerald-600 dark:text-emerald-400 uppercase font-mono text-[10px] mt-1">Study index: {inspectedOrder.type}</p>
              </div>

              {/* Simulated radiographic scan image selection */}
              <div className="space-y-1.5">
                <label className="block text-[10px] text-slate-450 font-bold uppercase tracking-tight">Select simulated radiographic study visual</label>
                <select 
                  id="radiology-img-dropdown" value={selectedSimImg} onChange={e => setSelectedSimImg(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 p-2 rounded"
                >
                  {imagesPresets.map(img => (
                    <option key={img.id} value={img.id}>{img.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-slate-450 block font-bold uppercase">Radiological Diagnosis findings summary *</label>
                <textarea 
                  id="findings-notes" rows={4} value={findingsText} onChange={e => setFindingsText(e.target.value)} required
                  placeholder="Write full clinical diagnosis report e.g., bone structures are fully intact with zero fractures noted. Chest lungs have clear vascular contours, no consolidation detected."
                  className="w-full bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg text-slate-850 dark:text-white text-xs leading-normal focus:outline-emerald-500"
                />
              </div>

            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950/15 border-t flex justify-end gap-2 text-xs">
              <button 
                id="btn-cancel-findings"
                onClick={() => setInspectedOrder(null)}
                className="px-4 py-2 border rounded-lg text-slate-600 dark:text-slate-350 hover:bg-slate-100 cursor-pointer font-bold"
              >
                Cancel
              </button>
              <button 
                id="btn-save-findings"
                disabled={!findingsText}
                onClick={handleUploadReport}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold px-5 py-2 rounded-lg cursor-pointer"
              >
                Sign Radiological Report
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
