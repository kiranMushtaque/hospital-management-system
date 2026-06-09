/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  FlaskConical, Plus, Search, FileText, Activity, 
  CheckCircle, AlertOctagon, HelpCircle, ShieldAlert
} from 'lucide-react';
import { formatPKR, formatDate } from '../utils';
import { LabOrder, LabTest, Patient, User } from '../types';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { LabReportPDF } from '../pdf/LabReport';

interface LabProps {
  currentUser: User | null;
  lang: 'EN' | 'UR';
  t: (key: string) => string;
}

export default function LabDiagnostics({ currentUser, lang, t }: LabProps) {
  const [catalog, setCatalog] = useState<LabTest[]>([]);
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<User[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);

  // Placeworkorder forms
  const [selectedPatientMrn, setSelectedPatientMrn] = useState('');
  const [selectedTestId, setSelectedTestId] = useState('');
  const [requestDocId, setRequestDocId] = useState('');

  // Results logging popup states
  const [chosenOrder, setChosenOrder] = useState<LabOrder | null>(null);
  const [resultVal, setResultVal] = useState('');
  const [notes, setNotes] = useState('');
  const [isCritical, setIsCritical] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const resC = await fetch('/api/lab/tests');
      const dataC = await resC.json();
      setCatalog(dataC);

      const resO = await fetch('/api/lab/orders');
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
    if (!selectedPatientMrn || !selectedTestId) {
      alert("Please select Patient and Diagnostic study.");
      return;
    }

    try {
      const payload = {
        patientMrn: selectedPatientMrn,
        testId: selectedTestId,
        doctorId: requestDocId,
        staffId: currentUser?.id || "SYSTEM"
      };

      const res = await fetch('/api/lab/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error("Workorder fail.");
      }

      // Automatically register lab bill
      const activeTest = catalog.find(t => t.id === selectedTestId);
      if (activeTest) {
        await fetch('/api/billing/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientMrn: selectedPatientMrn,
            module: 'LAB',
            subtotal: activeTest.price,
            discountApprovedAmount: 0,
            taxAmount: activeTest.price * 0.05,
            netBill: activeTest.price * 1.05,
            paymentMethod: 'CASH',
            items: [{ description: `Lab workorder diagnostic: ${activeTest.name}`, qty: 1, price: activeTest.price }],
            staffId: currentUser?.id || "SYSTEM"
          })
        });
      }

      setShowOrderForm(false);
      setSelectedPatientMrn('');
      setSelectedTestId('');
      fetchData();
      alert("Diagnostics laboratory workorder created. Surcharges forwarded to cashier.");

    } catch (err) {
      alert("Error creating lab order.");
    }
  };

  // Move order state to 'SAMPLE_COLLECTED'
  const handleSampleCollected = async (orderId: string) => {
    try {
      const res = await fetch(`/api/lab/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'SAMPLE_COLLECTED',
          staffId: currentUser?.id || "SYSTEM"
        })
      });
      if (res.ok) {
        fetchData();
        alert("Specimen sample logged. Safe transport to diagnostic machinery.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRecordResult = async () => {
    if (!chosenOrder || !resultVal) return;
    try {
      const res = await fetch(`/api/lab/orders/${chosenOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'COMPLETED',
          resultValue: resultVal,
          isCritical,
          notes,
          staffId: currentUser?.id || "EMP-5050"
        })
      });

      if (res.ok) {
        setChosenOrder(null);
        setResultVal('');
        setNotes('');
        setIsCritical(false);
        fetchData();
        alert("Observations recorded safely into permanent patient records.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleWhatsAppNotify = async (order: any) => {
    try {
      const res = await fetch('/api/whatsapp/send-lab-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: '03001234567',
          patientName: order.patientName,
          testName: order.testName,
          date: new Date(order.orderedAt || Date.now()).toLocaleDateString('en-GB')
        })
      });
      const info = await res.json();
      alert(`Assalam o Alaikum! WhatsApp dispatched to ${order.patientName}:\n\n"${info.messageText}"`);
    } catch (err: any) {
      alert(`Courier Alert notification failure: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6" id="lab-diagnostics-module">
      
      {/* KPI Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-205 dark:border-slate-800/80 shadow-sm" id="lab-header">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FlaskConical size={20} className="text-emerald-500" />
            <span>{t('nav_lab')}</span>
          </h1>
          <p className="text-xs text-slate-450 mt-1">
            Conduct specimen sample track sequences, compile observation results, and track pathology catalogs.
          </p>
        </div>

        <button
          id="btn-trigger-lab-form"
          onClick={() => setShowOrderForm(!showOrderForm)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer shrink-0"
        >
          <Plus size={14} />
          <span>{showOrderForm ? t('cancel') : t('lab_request_test')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5" id="lab-workspace">
        
        {/* LEFT COLUMN: request order form */}
        {showOrderForm && (
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4 animate-slide-in" id="lab-order-form">
            <div className="flex items-center gap-2 border-b border-rose-100 dark:border-rose-955 pb-3">
              <FlaskConical className="text-emerald-500 animate-pulse" size={17} />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-705 dark:text-white">Request pathology Study</span>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-4 text-xs text-left" id="lab-workorder-form">
              
              <div className="space-y-1">
                <label className="block text-[10px] text-slate-450 font-bold uppercase">Patient demographics *</label>
                <select
                  id="lab-form-patient" required value={selectedPatientMrn} onChange={e => setSelectedPatientMrn(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 px-2 py-2 rounded-lg text-slate-800 dark:text-white"
                >
                  <option value="">-- Choose Patient MRN --</option>
                  {patients.map(p => (
                    <option key={p.mrn} value={p.mrn}>[{p.mrn}] {p.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-slate-450 font-bold uppercase">Test requested *</label>
                <select
                  id="lab-form-test" required value={selectedTestId} onChange={e => setSelectedTestId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 px-2 py-2 rounded-lg text-slate-850 dark:text-white"
                >
                  <option value="">-- Choose Target Test Study --</option>
                  {catalog.map(item => (
                    <option key={item.id} value={item.id}>{item.name} &mdash; ({formatPKR(item.price)})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-slate-450 font-bold uppercase">Doctor Rounds Requesting Doctor</label>
                <select
                  id="lab-form-doctor" value={requestDocId} onChange={e => setRequestDocId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 px-2 py-2 rounded-lg text-slate-800 dark:text-white"
                >
                  <option value="">-- Choose Clinician --</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.department})</option>
                  ))}
                </select>
              </div>

              <button
                id="btn-submit-lab-order" type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
              >
                Dispatch Lab Workorder
              </button>
            </form>
          </div>
        )}

        {/* RIGHT COLUMN: Active diagnostic waitlists queue tracking */}
        <div className={`bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4 ${
          showOrderForm ? 'lg:col-span-8' : 'lg:col-span-12'
        }`} id="lab-active-orders">
          
          <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-white flex items-center gap-1.5">
              <Activity size={16} className="text-emerald-500" />
              <span>Specimen workflow & tracking registries</span>
            </span>
            <span className="text-[10px] font-mono bg-purple-55 bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded border font-bold">
              {orders.filter(o => o.status !== 'COMPLETED').length} active tests
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left" id="lab-specimens-table">
              <thead className="bg-slate-50 dark:bg-slate-950/35 text-slate-400 text-[10px] font-mono uppercase border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="p-3 font-semibold">Workorder ID</th>
                  <th className="p-3 font-semibold">Patient MRN</th>
                  <th className="p-3 font-semibold">Target test study</th>
                  <th className="p-3 font-semibold">Requested By</th>
                  <th className="p-3 font-semibold font-mono">Workflow State</th>
                  <th className="p-3 font-semibold text-center">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-950/10">
                    <td className="p-3 font-mono font-bold text-slate-800 dark:text-white">{o.id}</td>
                    <td className="p-3">
                      <span className="block font-bold text-slate-850 dark:text-slate-100">{o.patientName}</span>
                      <span className="block text-[10px] font-mono text-slate-455">{o.patientMrn}</span>
                    </td>
                    <td className="p-3">
                      <span className="block font-semibold text-emerald-600 dark:text-emerald-450">{o.testName}</span>
                      <span className="block text-[9px] font-mono text-slate-450 leading-none">Sample Tube: {o.sampleType}</span>
                    </td>
                    <td className="p-3 text-slate-650 dark:text-slate-400 font-medium">Dr. {(o.requestedByDoctorName || "Khan").split(' ').slice(-1)}</td>
                    <td className="p-3 whitespace-nowrap">
                      {o.status === 'ORDERED' ? (
                        <span className="inline-block text-[9px] bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 px-1.5 py-0.5 rounded font-bold uppercase animate-pulse">Tube Pending</span>
                      ) : o.status === 'SAMPLE_COLLECTED' ? (
                        <span className="inline-block text-[9px] bg-amber-50 dark:bg-amber-950/40 text-amber-500 dark:text-amber-400 px-1.5 py-0.5 rounded font-bold uppercase">Specimen Analyzed</span>
                      ) : (
                        <div>
                          <span className="inline-block text-[9px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-450 px-1.5 py-0.5 rounded font-bold uppercase">Ready</span>
                          {o.isCritical && (
                            <span className="block text-[8px] bg-red-650 bg-red-500 text-white font-mono px-1 py-0.1 select-none font-bold rounded uppercase mt-1 animate-bounce">CRITICAL FLAG</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center gap-1.5 whitespace-nowrap">
                        {o.status === 'ORDERED' && (
                          <button
                            id={`btn-collect-sample-${o.id}`}
                            onClick={() => handleSampleCollected(o.id)}
                            className="bg-amber-550 bg-amber-600 hover:bg-amber-500 text-white font-bold text-[10px] px-2.5 py-1.5 rounded transition-all cursor-pointer"
                          >
                            Collect Specimen Tube
                          </button>
                        )}
                        {o.status === 'SAMPLE_COLLECTED' && (
                          <button
                            id={`btn-record-results-${o.id}`}
                            onClick={() => {
                              setChosenOrder(o);
                              setResultVal('');
                            }}
                            className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] px-2.5 py-1.5 rounded transition-all cursor-pointer"
                          >
                            Upload Observation
                          </button>
                        )}
                        {o.status === 'COMPLETED' && (
                          <div className="flex flex-col gap-2 p-2 bg-slate-50 dark:bg-slate-950/40 rounded border border-slate-100 text-left">
                            <div className="font-mono text-[10px]">
                              <p className="font-bold text-slate-850 dark:text-slate-100">Val: &ldquo;{o.resultValue}&rdquo;</p>
                              <p className="text-[9px] tracking-tight text-slate-400 font-sans">Diag: {o.notes || "None"}</p>
                            </div>
                            <div className="flex gap-1.5 pt-1">
                              <PDFDownloadLink
                                document={<LabReportPDF order={{
                                  id: o.id,
                                  testName: o.testName,
                                  sampleType: o.sampleType || 'Whole Blood Specimen',
                                  requestedByDoctorName: o.requestedByDoctorName,
                                  labTechName: 'Lab Specialities',
                                  status: o.status,
                                  isCritical: o.isCritical,
                                  resultValue: o.resultValue,
                                  notes: o.notes,
                                  createdAt: o.orderedAt || new Date().toISOString(),
                                  patient: {
                                    name: o.patientName,
                                    age: 42,
                                    gender: 'MALE',
                                    mrn: o.patientMrn
                                  }
                                }} />}
                                fileName={`LabReport_${o.id}.pdf`}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[8.5px] px-2 py-1 rounded transition-all select-none text-center block"
                              >
                                {({ loading }) => loading ? '...' : 'PDF'}
                              </PDFDownloadLink>

                              <button
                                id={`btn-whatsapp-notify-${o.id}`}
                                onClick={() => handleWhatsAppNotify(o)}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[8.5px] px-2 py-1 rounded cursor-pointer block"
                              >
                                WhatsApp
                              </button>
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

          {/* Core tests price catalogs table */}
          <div className="bg-slate-50 dark:bg-slate-950/20 p-5 rounded-xl border border-slate-200/50 space-y-3" id="lab-test-price-catalog">
            <span className="block text-[10px] text-slate-450 font-bold uppercase tracking-widest">{t('lab_test_catalog')}</span>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {catalog.map(item => (
                <div key={item.id} className="bg-white dark:bg-slate-900 border p-3 rounded-lg text-left" id={`catalog-test-${item.id}`}>
                  <span className="block text-[9px] text-slate-400 font-mono font-bold uppercase">{item.category}</span>
                  <strong className="block text-slate-800 dark:text-white leading-tight mt-1 text-[11.5px] truncate" title={item.name}>{item.name}</strong>
                  <code className="block text-[10px] font-mono text-slate-450 mt-1">Norms: {item.normalRange} {item.unit}</code>
                  <span className="block font-mono font-bold text-emerald-600 mt-2 text-xs">{formatPKR(item.price)}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* UPLOAD RESULT VALUE MODAL */}
      {chosenOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="record-results-modal">
          <div className="bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full overflow-hidden animate-scale-up" id="record-results-dialog">
            
            <div className="p-4 border-b bg-slate-50 dark:bg-slate-950/20 flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider">Upload Diagnostics Result</span>
              <button 
                id="btn-close-results"
                onClick={() => setChosenOrder(null)}
                className="text-slate-400 hover:text-slate-650 hover:dark:text-white cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="p-6 text-left text-xs space-y-4">
              
              <div className="bg-slate-50 dark:bg-slate-950/45 p-3 rounded-lg border">
                <p className="font-bold">Patient Name: {chosenOrder.patientName}</p>
                <p className="text-slate-505 text-emerald-600 dark:text-emerald-450 font-semibold">Test Item: {chosenOrder.testName}</p>
                <p className="text-[10px] font-mono text-slate-450">Specimen sample: {chosenOrder.sampleType}</p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-450 block font-bold uppercase">Recorded Observation Value *</label>
                <input 
                  id="results-input" type="text" value={resultVal} onChange={e => setResultVal(e.target.value)} required
                  placeholder="e.g. cholesterol values, blood glucose count..."
                  className="w-full bg-slate-101 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20 p-2.5 rounded-lg text-slate-850 dark:text-white font-mono focus:outline-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-450 block font-bold uppercase">Diagnostician findings / notes</label>
                <textarea 
                  id="results-notes" rows={2.5} value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Clinical notes regarding speciment condition or calibration values..."
                  className="w-full bg-slate-101 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20 p-2.5 rounded-lg text-slate-850 dark:text-white"
                />
              </div>

              {/* Critical Value Toggle */}
              <div className="flex items-center gap-3 p-3 bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200/50 rounded-xl">
                <input 
                  id="results-critical-checkbox"
                  type="checkbox" checked={isCritical} onChange={e => setIsCritical(e.target.checked)}
                  className="w-4 h-4 text-rose-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-rose-500 cursor-pointer"
                />
                <div>
                  <label className="text-rose-800 dark:text-rose-400 font-bold block">Flag Critical Warning Value</label>
                  <span className="text-[9.5px] text-slate-500 leading-none">Highlights report index red; flags physician alerts dynamically.</span>
                </div>
              </div>

            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950/10 border-t flex justify-end gap-2">
              <button 
                id="btn-cancel-recording"
                onClick={() => setChosenOrder(null)}
                className="px-4 py-2 border rounded-lg text-slate-600 dark:text-slate-350 hover:bg-slate-100 text-xs cursor-pointer font-bold"
              >
                Cancel
              </button>
              <button 
                id="btn-save-lab-results"
                disabled={!resultVal}
                onClick={handleRecordResult}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs px-5 py-2 rounded-lg cursor-pointer"
              >
                Sign Diagnostics findings
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
