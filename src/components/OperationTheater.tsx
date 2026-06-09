/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Calendar, Plus, ShieldCheck, HeartPulse, ShieldAlert, 
  Layers, CheckCheck, Clock, UserCheck, Activity, Trash
} from 'lucide-react';
import { formatPKR, formatDate } from '../utils';
import { OTSchedule, Patient, User } from '../types';

interface OTProps {
  currentUser: User | null;
  lang: 'EN' | 'UR';
  t: (key: string) => string;
}

export default function OperationTheater({ currentUser, lang, t }: OTProps) {
  const [bookings, setBookings] = useState<OTSchedule[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<User[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // New Booking slot states
  const [bookPatientMrn, setBookPatientMrn] = useState('');
  const [surgeryName, setSurgeryName] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [theaterNumber, setTheaterNumber] = useState('OT-Room-01');
  const [leadSurgeonId, setLeadSurgeonId] = useState('');
  const [anesthetistName, setAnesthetistName] = useState('');
  const [chargesCost, setChargesCost] = useState('120000');

  // Pre-Op & Post-Op checklists validation overlays
  const [inspectedBooking, setInspectedBooking] = useState<OTSchedule | null>(null);
  
  // Checklist states
  const [consentSigned, setConsentSigned] = useState(false);
  const [pacCompleted, setPacCompleted] = useState(false);
  const [fastingOk, setFastingOk] = useState(false);
  const [markedSite, setMarkedSite] = useState(false);

  // Post op outcomes
  const [postOpNotes, setPostOpNotes] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const resO = await fetch('/api/ot/schedules');
      const dataO = await resO.json();
      setBookings(dataO);

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

  const handleBookOT = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookPatientMrn || !surgeryName || !scheduledAt || !leadSurgeonId) {
      alert("Please fill slot booking parameters completely.");
      return;
    }

    try {
      const activeDoc = doctors.find(d => d.id === leadSurgeonId);
      const leadSurgeonName = activeDoc ? activeDoc.name : "Dr. Mushtaq Khan";

      const payload = {
        patientMrn: bookPatientMrn,
        surgeryName,
        scheduledAt,
        theaterNumber,
        team: [
          { role: "Primary Surgeon", staffName: leadSurgeonName },
          { role: "Anesthetist", staffName: anesthetistName || "On-Call Anesthetist" }
        ],
        charges: Number(chargesCost),
        staffId: currentUser?.id || "SYSTEM"
      };

      const res = await fetch('/api/ot/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error("OT Booking slot collision.");
      }

      setShowAddForm(false);
      setBookPatientMrn('');
      setSurgeryName('');
      setScheduledAt('');
      setAnesthetistName('');
      fetchData();
      alert("Surgical suite slots reserved on theater scheduling grids safely.");

    } catch (e) {
      alert("Error scheduling OT slot booking.");
    }
  };

  const handleUpdateChecklist = async () => {
    if (!inspectedBooking) return;
    try {
      const res = await fetch(`/api/ot/schedules/${inspectedBooking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preOpChecklist: {
            consentSigned,
            pacCompleted,
            fastingOk,
            markedSite
          },
          staffId: currentUser?.id || "SYSTEM"
        })
      });
      const data = await res.json();
      setInspectedBooking(data);
      fetchData();
      alert("Pre-Op Checklist safety markers synchronized.");
    } catch (e) {
      console.error(e);
    }
  };

  const handleFinalizeSurgery = async () => {
    if (!inspectedBooking || !postOpNotes) return;
    try {
      // Complete booking
      const res = await fetch(`/api/ot/schedules/${inspectedBooking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'COMPLETED',
          postOpNotes,
          staffId: currentUser?.id || "SYSTEM"
        })
      });
      const finalBooking = await res.json();

      // Automatically dispatch high-value OT surgery billing transaction invoices
      await fetch('/api/billing/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientMrn: finalBooking.patientMrn,
          module: 'OT',
          subtotal: finalBooking.charges,
          discountApprovedAmount: 0,
          taxAmount: finalBooking.charges * 0.05,
          netBill: finalBooking.charges * 1.05,
          paymentMethod: 'CASH',
          items: [{ description: `Surgical OT theater occupancy: ${finalBooking.surgeryName}`, qty: 1, price: finalBooking.charges }],
          staffId: currentUser?.id || "SYSTEM"
        })
      });

      setInspectedBooking(null);
      setPostOpNotes('');
      fetchData();
      alert(`Surgery finalized! Surcharge invoice of Rs. ${finalBooking.charges * 1.05} routed to cash registers.`);

    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6" id="ot-module-root">
      
      {/* KPI Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-205 dark:border-slate-800/80 shadow-sm" id="ot-header">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Calendar size={20} className="text-emerald-500" />
            <span>{t('nav_ot')}</span>
          </h1>
          <p className="text-xs text-slate-455 mt-1">
            Reserve surgical suite chambers, compile pre-operatory checklists (blood matches, consents), and log post-op notes.
          </p>
        </div>

        <button
          id="btn-trigger-ot-form"
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer shrink-0"
        >
          <Plus size={14} />
          <span>{showAddForm ? t('cancel') : t('ot_reserve_theater')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5" id="ot-workspace">
        
        {/* LEFT COLUMN: Reserve Slot Form */}
        {showAddForm && (
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-rose-100 dark:border-rose-955 shadow-sm space-y-4 animate-slide-in" id="ot-reservation-form">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Calendar className="text-emerald-505 text-emerald-505 text-emerald-500 animate-pulse" size={17} />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-705 dark:text-white">Reserve Surgical Suite</span>
            </div>

            <form onSubmit={handleBookOT} className="space-y-3.5 text-xs text-left" id="ot-slot-form">
              
              <div className="space-y-1">
                <label className="block text-[10px] text-slate-450 font-bold uppercase">Patient Registry Profile *</label>
                <select
                  id="ot-form-patient" required value={bookPatientMrn} onChange={e => setBookPatientMrn(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 px-2 py-2 rounded-lg text-slate-850 dark:text-white"
                >
                  <option value="">-- Choose Patient MRN --</option>
                  {patients.map(p => (
                    <option key={p.mrn} value={p.mrn}>[{p.mrn}] {p.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-slate-455 font-bold uppercase">Surgery Study description *</label>
                <input 
                  id="ot-form-surgery" type="text" value={surgeryName} onChange={e => setSurgeryName(e.target.value)} required
                  placeholder="e.g. Open Laparoscopic Cholecystectomy"
                  className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-205 dark:border-slate-800 px-3 py-2 rounded-lg text-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-450 font-bold uppercase">Surgical Room</label>
                  <select
                    id="ot-form-theater" value={theaterNumber} onChange={e => setTheaterNumber(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 px-2 py-2 rounded-lg text-slate-800 dark:text-white"
                  >
                    <option value="OT-Room-01">Surgical Suite A</option>
                    <option value="OT-Room-02">Surgical Suite B - Neuro</option>
                    <option value="OT-Room-03">Cardiac Surgical Room</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-450 font-bold uppercase">Charges Cost (PKR)</label>
                  <input 
                    id="ot-form-cost" type="number" value={chargesCost} onChange={e => setChargesCost(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-lg text-slate-850 dark:text-white font-mono"
                    placeholder="e.g. 120000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-450 font-bold uppercase">Lead Surgeon *</label>
                  <select
                    id="ot-form-surgeon" required value={leadSurgeonId} onChange={e => setLeadSurgeonId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 px-2 py-2 rounded-lg text-slate-800 dark:text-white"
                  >
                    <option value="">-- Choose Surgeon --</option>
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.department})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-450 font-bold uppercase">Anesthetist Specialist</label>
                  <input 
                    id="ot-form-anesthetist" type="text" value={anesthetistName} onChange={e => setAnesthetistName(e.target.value)}
                    placeholder="Anesthetist on-Call name"
                    className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-205 dark:border-slate-800 px-3 py-2 rounded-lg text-slate-815 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-slate-450 font-bold uppercase">Scheduled Timestamp *</label>
                <input 
                  id="ot-form-scheduled" type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} required
                  className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-205 dark:border-slate-800 px-3 py-2 rounded-lg text-slate-800 dark:text-white"
                />
              </div>

              <button
                id="btn-schedule-ot" type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-505 text-white font-bold py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
              >
                Sign slots reservations template
              </button>
            </form>
          </div>
        )}

        {/* RIGHT COLUMN: Reservated Theater Ledger Queue */}
        <div className={`bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4 ${
          showAddForm ? 'lg:col-span-8' : 'lg:col-span-12'
        }`} id="ot-scheduled-list">
          
          <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-white flex items-center gap-1.5">
              <Activity size={16} className="text-emerald-500" />
              <span>Surgical Slot Schedules Ledger</span>
            </span>
            <span className="text-[10px] font-mono bg-amber-50 dark:bg-amber-950/25 text-amber-600 px-2.5 py-0.5 rounded border border-amber-200 dark:border-amber-900/40 font-bold">
              {bookings.filter(b => b.status === 'SCHEDULED').length} Active procedures
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left" id="ot-schedules-table">
              <thead className="bg-slate-50 dark:bg-slate-950/35 text-slate-400 text-[10px] font-mono uppercase border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="p-3 font-semibold">OT Booking ID</th>
                  <th className="p-3 font-semibold">Patient Demographics</th>
                  <th className="p-3 font-semibold">Surgical Procedure</th>
                  <th className="p-3 font-semibold">Clinical Teams allocation</th>
                  <th className="p-3 font-semibold">Scheduled Date & Room</th>
                  <th className="p-3 font-semibold text-center">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {bookings.map((b) => {
                  const leadSurgeon = b.team.find(t => t.role === "Primary Surgeon")?.staffName || "Dr. Mushtaq Khan";
                  const anesth = b.team.find(t => t.role === "Anesthetist")?.staffName || "On-Call";

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-950/10">
                      <td className="p-3 font-mono font-bold text-slate-800 dark:text-white">{b.id}</td>
                      <td className="p-3">
                        <span className="block font-bold text-slate-855 dark:text-slate-100">{b.patientName}</span>
                        <span className="block text-[10px] font-mono text-slate-455">{b.patientMrn}</span>
                      </td>
                      <td className="p-3">
                        <span className="block font-semibold text-rose-505 text-rose-600 dark:text-rose-400">{b.surgeryName}</span>
                        <span className="block text-[9px] font-mono text-slate-455 mt-0.5 font-bold uppercase font-mono">Suite Cost: {formatPKR(b.charges)}</span>
                      </td>
                      <td className="p-3 text-[11px] leading-relaxed">
                        <p className="font-bold text-slate-800 dark:text-slate-200">Surgeon: {leadSurgeon}</p>
                        <p className="text-slate-500 font-medium">Anesth: {anesth}</p>
                      </td>
                      <td className="p-3">
                        <p className="font-mono text-[10.5px] font-bold text-slate-700 dark:text-slate-300">{formatDate(b.scheduledAt)} &mdash; {new Date(b.scheduledAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
                        <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-505 text-slate-500 font-mono mt-1">Room: {b.theaterNumber}</span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex justify-center whitespace-nowrap">
                          {b.status !== 'COMPLETED' ? (
                            <button
                              id={`btn-open-checklist-${b.id}`}
                              onClick={() => {
                                setInspectedBooking(b);
                                // Sync checklists states
                                setConsentSigned(b.preOpChecklist?.consentSigned || false);
                                setPacCompleted(b.preOpChecklist?.pacCompleted || false);
                                setFastingOk(b.preOpChecklist?.fastingOk || false);
                                setMarkedSite(b.preOpChecklist?.markedSite || false);
                              }}
                              className="bg-purple-660 bg-purple-600 hover:bg-purple-505 text-white font-bold text-[10px] px-3.5 py-1.5 rounded-lg transition-all cursor-pointer"
                            >
                              Open Checklist Desk
                            </button>
                          ) : (
                            <div className="text-left font-mono max-w-xs truncate text-[10px] bg-emerald-50 dark:bg-emerald-950/25 p-2 rounded border border-emerald-100/50">
                              <span className="font-bold text-emerald-850 dark:text-emerald-450 animate-pulse">COMPLETED ✓</span>
                              {b.postOpNotes && <p className="text-[9.5px] text-slate-500 mt-1">{b.postOpNotes}</p>}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>

      </div>

      {/* PRE-OP AND POST-OP CHECKLIST POPUP WORKSPACE */}
      {inspectedBooking && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="ot-checklist-modal">
          <div className="bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full overflow-hidden max-h-[92vh] overflow-y-auto animate-scale-up" id="ot-checklist-dialog">
            
            <div className="p-4 border-b bg-slate-50/50 dark:bg-slate-950/20 flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-emerald-500 animate-pulse" />
                <span>Pre-Op Checklist & Surg outcomes : {inspectedBooking.patientName}</span>
              </span>
              <button 
                id="btn-close-checklist"
                onClick={() => setInspectedBooking(null)}
                className="text-slate-400 hover:text-slate-655 hover:dark:text-white cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-left text-xs" id="checklist-modal-workspace">
              
              {/* Left pane checklist controls */}
              <div className="space-y-4" id="preop-checklists-items">
                <span className="text-[10px] font-bold text-purple-650 dark:text-purple-400 uppercase tracking-wider block">Clinical Safety Checklists</span>
                
                <div className="space-y-3 bg-slate-55 bg-slate-50 dark:bg-slate-950/40 p-4.5 rounded-xl border">
                  
                  <div className="flex items-start gap-2.5 cursor-pointer">
                    <input 
                      id="checkbox-consent" type="checkbox" checked={consentSigned} onChange={e => setConsentSigned(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-500 mt-0.5"
                    />
                    <div>
                      <label className="font-bold block text-slate-800 dark:text-slate-200">Surgical consent form cleared *</label>
                      <span className="text-[9.5px] text-slate-455 leading-relaxed block">Legal authorization and risk template signed by patient guardians.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 cursor-pointer border-t pt-3">
                    <input 
                      id="checkbox-pac" type="checkbox" checked={pacCompleted} onChange={e => setPacCompleted(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-500 mt-0.5"
                    />
                    <div>
                      <label className="font-bold block text-slate-800 dark:text-slate-200">Pre-Anesthetic Examination Cleared *</label>
                      <span className="text-[9.5px] text-slate-455 leading-relaxed block">Corroborated airway rating, lungs, and baseline vitals pre-OT check.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 cursor-pointer border-t pt-3">
                    <input 
                      id="checkbox-fasting" type="checkbox" checked={fastingOk} onChange={e => setFastingOk(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-500 mt-0.5"
                    />
                    <div>
                      <label className="font-bold block text-slate-800 dark:text-slate-200">NPO Fasting Status verified *</label>
                      <span className="text-[9.5px] text-slate-450 leading-relaxed block">Minimum 6-8 hrs nil-per-os checklist verified by nursing shift.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 cursor-pointer border-t pt-3">
                    <input 
                      id="checkbox-site" type="checkbox" checked={markedSite} onChange={e => setMarkedSite(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-500 mt-0.5"
                    />
                    <div>
                      <label className="font-bold block text-slate-800 dark:text-slate-200">Universal Surgical Site Marked</label>
                      <span className="text-[9.5px] text-slate-455 leading-relaxed block">Physical visual mark indicator clearly visible at surgery site.</span>
                    </div>
                  </div>

                </div>

                <button
                  id="btn-save-checklist"
                  onClick={handleUpdateChecklist}
                  className="w-full bg-slate-900 hover:bg-slate-850 dark:bg-purple-900 border text-white font-bold py-2 rounded-xl text-xs transition-all cursor-pointer text-center"
                >
                  Synchronize Checklist State
                </button>
              </div>

              {/* Right panel Post Op sign-off summary outcomes */}
              <div className="space-y-4" id="postop-signoff-summary">
                <span className="text-[10px] font-bold text-red-655 text-rose-500 uppercase tracking-wider block">Authorize post-Op surgery clearance</span>
                
                <div className="space-y-3 bg-rose-50/50 dark:bg-rose-955 bg-rose-50/20 p-4 rounded-xl border border-dashed border-rose-200 dark:border-rose-900/50">
                  <p className="text-[9.5px] leading-relaxed text-slate-550">
                    Surgical checklists must be fully cleared and marked checked. Once initialized, summarizing therapeutic outcomes releases slots and dispatches accounts billing ledger.
                  </p>

                  <div className="space-y-1">
                    <label className="block text-[10px] text-slate-455 font-bold uppercase">Surgical output findings notes *</label>
                    <textarea 
                      id="postop-notes-input" rows={4} value={postOpNotes} onChange={e => setPostOpNotes(e.target.value)} required
                      placeholder="e.g. Gall bladder completely resected safely. Normal bile flow verified. Patient fully stable, routed to High Dependency Recovery Unit."
                      className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 p-2.5 rounded-lg text-slate-855 dark:text-white leading-normal"
                    />
                  </div>

                  {(!inspectedBooking.preOpChecklist?.consentSigned || !inspectedBooking.preOpChecklist?.pacCompleted || !inspectedBooking.preOpChecklist?.fastingOk) && (
                    <div className="flex gap-2 p-2 bg-amber-50 dark:bg-amber-955 text-amber-700 dark:text-amber-400 rounded-lg border border-amber-200">
                      <ShieldAlert className="shrink-0 mt-0.5" size={14} />
                      <span className="text-[9px] leading-snug">Safety warnings: Critical checklists are incomplete. Please authenticate checklist items first.</span>
                    </div>
                  )}

                  <button
                    id="btn-finalize-surgery"
                    disabled={!inspectedBooking.preOpChecklist?.consentSigned || !inspectedBooking.preOpChecklist?.pacCompleted || !inspectedBooking.preOpChecklist?.fastingOk || !postOpNotes}
                    onClick={handleFinalizeSurgery}
                    className="w-full bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-extrabold py-2.5 rounded-xl uppercase tracking-wide cursor-pointer text-center flex items-center justify-center gap-1.5"
                  >
                    <CheckCheck size={14} />
                    <span>Authorize discharge & file to Accounts</span>
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
