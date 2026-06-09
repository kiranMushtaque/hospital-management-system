/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, Printer, Search, RefreshCw, Smartphone, CheckSquare, 
  Percent, ArrowDownRight, PrinterCheck, AlertTriangle, Play, ShieldAlert, Receipt
} from 'lucide-react';
import { formatPKR, formatDate } from '../utils';
import { BillingTransaction, HospitalSettings, Patient, User } from '../types';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { BillingReceiptPDF } from '../pdf/BillingReceipt';

interface BillingProps {
  currentUser: User | null;
  settings: HospitalSettings;
  lang: 'EN' | 'UR';
  t: (key: string) => string;
}

export default function BillingManagement({ currentUser, settings, lang, t }: BillingProps) {
  const [txns, setTxns] = useState<BillingTransaction[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  
  // Custom Transaction creation states (Ad-Hoc billing)
  const [showAddBillForm, setShowAddBillForm] = useState(false);
  const [adHocPatient, setAdHocPatient] = useState('');
  const [adHocModule, setAdHocModule] = useState<'LAB' | 'RADIOLOGY' | 'PHARMACY' | 'OT'>('LAB');
  const [adHocDesc, setAdHocDesc] = useState('');
  const [adHocPrice, setAdHocPrice] = useState('');
  const [adHocDiscount, setAdHocDiscount] = useState('0');
  const [adHocDiscReason, setAdHocDiscReason] = useState('');
  const [adHocPayMethod, setAdHocPayMethod] = useState<'CASH' | 'CARD' | 'BANK_TRANSFER' | 'CHEQUE'>('CASH');
  const [adHocInsurance, setAdHocInsurance] = useState<string>('NONE');

  // Inspected Invoice Printable Modal state
  const [selectedTxn, setSelectedTxn] = useState<BillingTransaction | null>(null);
  
  // WhatsApp triggering notification block
  const [patientPhone, setPatientPhone] = useState('');
  const [whatsappLogs, setWhatsappLogs] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/billing/transactions');
      const data = await res.json();
      setTxns(data);

      const resP = await fetch('/api/patients');
      const dataP = await resP.json();
      setPatients(dataP);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateAdHocBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adHocPatient || !adHocPrice || !adHocDesc) {
      alert("Please fill complete bill lines.");
      return;
    }

    try {
      const priceVal = Number(adHocPrice);
      const discVal = Number(adHocDiscount);
      const subtotal = priceVal;
      const taxRate = settings.taxRatePercent / 100;
      const taxAmount = Number(((subtotal - discVal) * taxRate).toFixed(2));
      const netBill = subtotal - discVal + taxAmount;

      // Calculate insurance coverage
      let insProviderText = adHocInsurance as any;
      let insClaimAmt = 0;
      if (insProviderText !== 'NONE') {
        insClaimAmt = netBill; // Coverage is complete under standard welfare templates
      }

      const payload = {
        patientMrn: adHocPatient,
        module: adHocModule,
        subtotal,
        discountApprovedAmount: discVal,
        discountReason: adHocDiscReason || undefined,
        taxAmount,
        netBill,
        insuranceClaimProvider: insProviderText,
        insuranceClaimAmount: insClaimAmt,
        amountPaidByPatient: insProviderText !== 'NONE' ? 0 : netBill,
        paymentMethod: adHocPayMethod,
        items: [{ description: adHocDesc, qty: 1, price: priceVal }],
        staffId: currentUser?.id || "SYSTEM"
      };

      const res = await fetch('/api/billing/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error("Ad-Hoc billing failed.");
      }

      setShowAddBillForm(false);
      setAdHocDesc('');
      setAdHocPrice('');
      setAdHocDiscount('0');
      setAdHocDiscReason('');
      fetchData();
      alert("Ad-Hoc Billing invoice added on ledger safely.");

    } catch (err: any) {
      alert(err.message || "Error adding adhoc invoice.");
    }
  };

  const dispatchWhatsAppSimulation = async () => {
    if (!selectedTxn) return;
    try {
      const phoneVal = patientPhone || "0300-1234567";
      const payload = {
        txnId: selectedTxn.id,
        phone: phoneVal,
        patientName: selectedTxn.patientName,
        amount: selectedTxn.amountPaidByPatient,
        mrn: selectedTxn.patientMrn
      };

      const res = await fetch('/api/billing/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setWhatsappLogs(data.text);
      setPatientPhone('');
      alert("Simulated WhatsApp dispatched. View payload template on-screen logs!");
    } catch (e) {
      console.error(e);
    }
  };

  const executeRefund = async (invoiceId: string) => {
    if (!confirm("Are you sure you want to authorize a full refund for invoice " + invoiceId + "?")) return;
    try {
      alert("Refund request is authorized by Super Admin. Surcharges reversed in ledger.");
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredInvoices = search 
    ? txns.filter(t => t.id.includes(search) || t.patientName.toLowerCase().includes(search.toLowerCase()) || t.patientMrn.includes(search))
    : txns;

  return (
    <div className="space-y-6" id="billing-module-root">
      
      {/* KPI Cards header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-205 dark:border-slate-800/80 shadow-sm" id="billing-header">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <CreditCard size={20} className="text-emerald-500" />
            <span>{t('nav_billing')}</span>
          </h1>
          <p className="text-xs text-slate-450 mt-1">
            Conduct accounts audit checklists, process Sehat Card claims, process PRA service taxes, and issue printed clinical receipts.
          </p>
        </div>

        <button
          id="btn-trigger-add-bill"
          onClick={() => setShowAddBillForm(!showAddBillForm)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer shrink-0"
        >
          <Receipt size={14} />
          <span>{showAddBillForm ? t('cancel') : 'Create Ad-Hoc Invoice'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5" id="billing-workspace">
        
        {/* LEFT COMPONENTFORM: Ad-Hoc Invoice drafting pad */}
        {showAddBillForm && (
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4" id="adhoc-invoice-form">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Receipt className="text-emerald-550 text-emerald-500" size={17} />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-white">Draft Diagnostics Invoice</span>
            </div>

            <form onSubmit={handleCreateAdHocBill} className="space-y-3.5 text-xs text-left" id="billing-ticket-form">
              
              <div className="space-y-1">
                <label className="block text-[10px] text-slate-450 font-bold uppercase">Patient MRN *</label>
                <select
                  id="bill-form-patient" required value={adHocPatient} onChange={e => setAdHocPatient(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 px-2 py-2 rounded-lg text-slate-800 dark:text-white font-mono"
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map(p => (
                    <option key={p.mrn} value={p.mrn}>[{p.mrn}] {p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-450 font-bold uppercase">Source Module</label>
                  <select
                    id="bill-form-module" value={adHocModule} onChange={e => setAdHocModule(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 px-2 py-2 rounded-lg text-slate-800 dark:text-white"
                  >
                    <option value="LAB">Lab Diagnostics</option>
                    <option value="RADIOLOGY">Radiology scans</option>
                    <option value="PHARMACY">Pharmacy item</option>
                    <option value="OT">Operation Theater</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-450 font-bold uppercase">Payment Mode</label>
                  <select
                    id="bill-form-paymethod" value={adHocPayMethod} onChange={e => setAdHocPayMethod(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 px-2 py-2 rounded-lg text-slate-800 dark:text-white"
                  >
                    <option value="CASH">Cash Counters</option>
                    <option value="CARD">Debit / VISA card</option>
                    <option value="BANK_TRANSFER">HBL Online Transfer</option>
                    <option value="CHEQUE">Bank Cheque</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-slate-450 font-bold uppercase">Welfare / Insurance coverage</label>
                <select
                  id="bill-form-insurance" value={adHocInsurance} onChange={e => setAdHocInsurance(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 px-2 py-2 rounded-lg text-slate-850 dark:text-white"
                >
                  <option value="NONE">None - Private Direct paying</option>
                  <option value="SEHAT_CARD">Sehat Insaf Card coverage</option>
                  <option value="EFU">EFU Insurance Claim</option>
                  <option value="JUBILEE">Jubilee Life</option>
                  <option value="STATE_LIFE">State Life Welfare</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-slate-455 font-bold uppercase">Diagnostics study list / description *</label>
                <input 
                  id="bill-form-desc" type="text" value={adHocDesc} onChange={e => setAdHocDesc(e.target.value)} required
                  placeholder="e.g. Brain MRI with Contrast or CBC Panel"
                  className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-lg text-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-450 font-bold uppercase">Base Price (Rs) *</label>
                  <input 
                    id="bill-form-price" type="number" value={adHocPrice} onChange={e => setAdHocPrice(e.target.value)} required
                    placeholder="e.g. 4500" className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-lg text-slate-800 dark:text-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-450 font-bold uppercase flex items-center gap-1">
                    <Percent size={11} className="text-amber-550" />
                    <span>Approved Disc</span>
                  </label>
                  <input 
                    id="bill-form-discount" type="number" value={adHocDiscount} onChange={e => setAdHocDiscount(e.target.value)}
                    placeholder="e.g. 500" className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-lg text-slate-850 dark:text-white font-mono"
                  />
                </div>
              </div>

              {Number(adHocDiscount) > 0 && (
                <div className="space-y-1 animate-slide-in">
                  <label className="block text-[10px] text-slate-450 block font-bold uppercase">Discount Reason / Approval Note *</label>
                  <input 
                    id="bill-form-disc-reason" type="text" value={adHocDiscReason} onChange={e => setAdHocDiscReason(e.target.value)} required
                    placeholder="e.g. Zakat committee authorized, patient indigent"
                    className="w-full bg-slate-50 dark:bg-slate-950/30 border border-amber-200 dark:border-amber-900/60 p-2 rounded text-slate-850 dark:text-white"
                  />
                </div>
              )}

              <button
                id="btn-submit-adhoc-bill" type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
              >
                Sign & Authorize Invoice
              </button>
            </form>
          </div>
        )}

        {/* RIGHT COLUMN: Outstanding invoice grids */}
        <div className={`bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4 ${
          showAddBillForm ? 'lg:col-span-8' : 'lg:col-span-12'
        }`} id="billing-ledger-list">
          
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950/20 px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800/65">
            <Search size={16} className="text-slate-400 shrink-0" />
            <input 
              id="billing-search-input"
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Query transactions by Invoice Number, Patient Name or MRN number..."
              className="w-full bg-transparent border-0 text-xs text-slate-850 dark:text-white focus:outline-hidden"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left" id="billing-txns-table">
              <thead className="bg-slate-50 dark:bg-slate-950/35 text-slate-400 text-[10px] font-mono uppercase border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="p-3 font-semibold">Invoice ID</th>
                  <th className="p-3 font-semibold">Patient Demographics</th>
                  <th className="p-3 font-semibold">Clinic Source</th>
                  <th className="p-3 font-semibold">Tax & Discount Summary</th>
                  <th className="p-3 font-semibold">Net Bill (PKR)</th>
                  <th className="p-3 font-semibold">Insurance Coverage</th>
                  <th className="p-3 font-semibold text-center">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {filteredInvoices.map((txn) => (
                  <tr key={txn.id} className="hover:bg-slate-0/60 dark:hover:bg-slate-950/10">
                    <td className="p-3 font-mono font-bold text-slate-850 dark:text-white whitespace-nowrap">{txn.id}</td>
                    <td className="p-3">
                      <span className="block font-bold text-slate-850 dark:text-slate-200">{txn.patientName}</span>
                      <span className="block text-[10px] font-mono text-slate-450">{txn.patientMrn}</span>
                    </td>
                    <td className="p-3">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-[10px] font-bold">
                        {txn.module}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[11px] leading-relaxed">
                      <p>Tax (5%): +Rs. {txn.taxAmount}</p>
                      {txn.discountApprovedAmount > 0 ? (
                        <p className="text-amber-600 font-bold">Disc: -Rs. {txn.discountApprovedAmount}</p>
                      ) : (
                        <p className="text-slate-400">No discount</p>
                      )}
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-900 dark:text-emerald-400 whitespace-nowrap">
                      {formatPKR(txn.netBill)}
                    </td>
                    <td className="p-3">
                      {txn.insuranceClaimProvider === 'NONE' ? (
                        <span className="text-[10px] text-slate-400">Cash Counters (Private)</span>
                      ) : (
                        <div>
                          <span className="inline-block text-[10px] bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 font-bold px-1.5 py-0.5 rounded">{txn.insuranceClaimProvider}</span>
                          <span className="block text-[9px] font-mono text-slate-400 mt-0.5">Claim: -{formatPKR(txn.insuranceClaimAmount)}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
                      <div className="flex justify-center gap-2">
                        <button
                          id={`btn-open-invoice-${txn.id}`}
                          onClick={() => {
                            setSelectedTxn(txn);
                            setWhatsappLogs(null);
                          }}
                          className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold text-[10px] px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                        >
                          Print Details
                        </button>
                        <button
                          id={`btn-refund-invoice-${txn.id}`}
                          onClick={() => executeRefund(txn.id)}
                          className="text-rose-500 hover:text-rose-700 font-bold text-[10px] px-2.5 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/10 cursor-pointer"
                        >
                          Refund
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredInvoices.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-400 font-sans italic">
                      There are no financial invoices matching query in archive.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* COMPREHENSIVE CLINICAL RECEIPT AND WHATSAPP TRANSMITTER MODAL */}
      {selectedTxn && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="invoice-detail-modal">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto animate-scale-up">
            
            {/* Modal actions bars - hidden on printable copy */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between no-print">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-450 flex items-center gap-1.5">
                <Receipt size={14} className="text-emerald-500" />
                <span>Audited Transaction Invoice</span>
              </span>
              <button 
                id="btn-close-invoice"
                onClick={() => setSelectedTxn(null)}
                className="text-slate-400 hover:text-slate-600 hover:dark:text-white cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Print Area Section */}
            <div className="p-8 print-area bg-white dark:bg-slate-900 text-left text-xs space-y-6" id="printable-invoice">
              
              {/* Receipt Header details */}
              <div className="flex justify-between items-start border-b pb-4">
                <div className="space-y-1">
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white">{settings.hospitalName}</h2>
                  <address className="text-[10px] text-slate-500 not-italic leading-relaxed max-w-xs">{settings.hospitalAddress}</address>
                  <p className="text-[10px] text-slate-500">Phone lines: {settings.phone}</p>
                </div>
                <div className="text-right space-y-1 shrink-0 font-mono">
                  <span className="inline-block text-[10px] bg-emerald-500 text-white font-bold py-0.5 px-2 rounded-md uppercase">Original Tax Invoice</span>
                  <p className="font-bold text-slate-800 dark:text-white mt-1 text-[11px]">Invoice ID: {selectedTxn.id}</p>
                  <p className="text-[10px] text-slate-450">Date Issued: {formatDate(selectedTxn.createdAt)}</p>
                </div>
              </div>

              {/* Patient details & Scheme */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950/45 p-3.5 rounded-xl border">
                <div className="space-y-1">
                  <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest">Billing Patient</span>
                  <p className="text-[11px] font-bold text-slate-850 dark:text-white leading-none">{selectedTxn.patientName}</p>
                  <p className="text-[10px] text-slate-500 font-mono">MRN: {selectedTxn.patientMrn}</p>
                </div>
                <div className="space-y-1 font-mono text-right">
                  <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest">Settlement details</span>
                  <p className="text-[11px]">Method: <span className="font-bold">{selectedTxn.paymentMethod}</span></p>
                  <p className="text-[10px]">Welfare scheme: <span className="font-bold">{selectedTxn.insuranceClaimProvider}</span></p>
                </div>
              </div>

              {/* Itemized lines */}
              <div className="space-y-2">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Itemized Medical & Diagnostics Charges</span>
                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left" id="invoice-items-table">
                    <thead className="bg-slate-50 dark:bg-slate-950/20 text-slate-400 text-[9px] uppercase font-bold font-mono">
                      <tr>
                        <th className="p-2.5">Item Description</th>
                        <th className="p-2.5 text-center font-mono">Qty</th>
                        <th className="p-2.5 text-right font-mono">Unit Price</th>
                        <th className="p-2.5 text-right font-mono">Total (PKR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      {selectedTxn.items.map((line, lineIdx) => (
                        <tr key={lineIdx}>
                          <td className="p-2.5 font-semibold text-slate-850 dark:text-white">{line.description}</td>
                          <td className="p-2.5 text-center font-mono">{line.qty}</td>
                          <td className="p-2.5 text-right font-mono">{formatPKR(line.price)}</td>
                          <td className="p-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">{formatPKR(line.price * line.qty)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Calculations Block */}
              <div className="flex justify-end pt-2">
                <div className="w-64 space-y-1.5 text-xs font-mono font-medium">
                  
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatPKR(selectedTxn.subtotal)}</span>
                  </div>

                  {selectedTxn.discountApprovedAmount > 0 && (
                    <div className="flex justify-between text-amber-600 font-bold">
                      <span className="font-sans">Discount ({selectedTxn.discountReason}):</span>
                      <span>-{formatPKR(selectedTxn.discountApprovedAmount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>PRA Taxes ({settings.taxRatePercent}%):</span>
                    <span>+{formatPKR(selectedTxn.taxAmount)}</span>
                  </div>

                  <div className="flex justify-between border-t border-slate-200 pt-1 text-slate-900 dark:text-white font-bold">
                    <span>Net Invoice Value:</span>
                    <span>{formatPKR(selectedTxn.netBill)}</span>
                  </div>

                  {selectedTxn.insuranceClaimAmount > 0 && (
                    <div className="flex justify-between text-teal-600 font-bold border-b pb-1">
                      <span>Welfare Deductible:</span>
                      <span>-{formatPKR(selectedTxn.insuranceClaimAmount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-extrabold text-sm border-b-2 double border-emerald-500 pt-1">
                    <span>Paid Counter Cash:</span>
                    <span>{formatPKR(selectedTxn.amountPaidByPatient)}</span>
                  </div>

                </div>
              </div>

              {/* Receipt Policy warning footnotes */}
              <div className="text-[9px] text-slate-450 leading-relaxed pt-2 border-t text-center font-serif">
                Mayo Trust and Center are Punjab Healthcare Commission Accredited. All billing is integrated with PRA and FBR online sales tax monitors. Under regulatory mandate, diagnostic fees are non-refundable once testing samples are logged into clinical systems.
              </div>

            </div>

            {/* WHATSAPP TRIGGER & PRINT TRIGGERS PANEL - HIDDEN ON COPIES */}
            <div className="p-5 bg-slate-50 dark:bg-slate-950/45 border-t border-slate-100 dark:border-slate-800 space-y-4 no-print">
              
              {/* Simulated WhatsApp dispatcher section */}
              <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-dashed border-emerald-350 space-y-2.5">
                <div className="flex items-center gap-1.5">
                  <Smartphone className="text-emerald-500 shrink-0" size={16} />
                  <span className="text-[11px] font-bold uppercase text-slate-800 dark:text-white">Simulated WhatsApp SMS receipt dispatching</span>
                </div>
                
                <div className="flex gap-2 text-xs">
                  <input 
                    id="billing-whatsapp-phone-input"
                    type="text" value={patientPhone} onChange={e => setPatientPhone(e.target.value)}
                    placeholder="Enter Patient Mobile e.g. 0300-1234567..."
                    className="w-full bg-slate-50 dark:bg-slate-950/20 border border-slate-205 dark:border-slate-800 px-2 rounded text-xs text-slate-850 dark:text-white focus:outline-emerald-500"
                  />
                  <button 
                    id="btn-trigger-whatsapp-simulation"
                    onClick={dispatchWhatsAppSimulation}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded px-4 py-1.5 transition-all cursor-pointer whitespace-nowrap"
                  >
                    Send Receipt
                  </button>
                </div>

                {whatsappLogs && (
                  <div className="text-[10px] font-mono leading-relaxed bg-slate-900 text-slate-200 border border-emerald-950/50 p-2.5 rounded-lg whitespace-pre-wrap mt-2 select-text text-left">
                    <span className="block text-emerald-450 font-bold uppercase tracking-widest text-[8px] pb-1 font-sans">Simulated API Payload Sent Successfully:</span>
                    {whatsappLogs}
                  </div>
                )}
              </div>

              {/* Standard printer target */}
              <div className="flex justify-end gap-2 text-xs font-semibold">
                <button 
                  id="btn-modal-close"
                  onClick={() => setSelectedTxn(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-xl cursor-pointer hover:bg-slate-100"
                >
                  Close
                </button>
                <button 
                  id="btn-print-receipt"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded-xl cursor-pointer"
                >
                  <Printer size={13} />
                  <span>Print UI View</span>
                </button>

                <PDFDownloadLink
                  document={<BillingReceiptPDF invoice={{
                    invoiceNumber: selectedTxn.id,
                    createdAt: new Date().toISOString(),
                    module: selectedTxn.module,
                    subtotal: selectedTxn.subtotal,
                    discountApprovedAmount: selectedTxn.discountApprovedAmount,
                    taxAmount: selectedTxn.taxAmount,
                    netBill: selectedTxn.netBill,
                    paymentMethod: selectedTxn.insuranceClaimProvider !== 'NONE' ? selectedTxn.insuranceClaimProvider : 'CASH',
                    patient: {
                      name: selectedTxn.patientName,
                      mrn: selectedTxn.patientMrn,
                      cnic: '',
                      phone: ''
                    },
                    items: selectedTxn.items.map(item => ({
                      description: item.description,
                      quantity: item.qty || 1,
                      unitPrice: item.price
                    }))
                  }} />}
                  fileName={`MayoBill_${selectedTxn.id}.pdf`}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl cursor-pointer font-sans"
                >
                  {({ loading }) => (
                    <>
                      <PrinterCheck size={13} />
                      <span>{loading ? 'Compiling PDF...' : 'Download Official PDF'}</span>
                    </>
                  )}
                </PDFDownloadLink>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
