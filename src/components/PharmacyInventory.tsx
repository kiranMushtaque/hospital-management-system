/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Pill, Plus, Search, RefreshCw, ShoppingCart, 
  Trash, AlertTriangle, AlertCircle, ShoppingBag, FolderOpen
} from 'lucide-react';
import { formatPKR, formatDate } from '../utils';
import { Medicine, User } from '../types';

interface PharmacyProps {
  currentUser: User | null;
  lang: 'EN' | 'UR';
  t: (key: string) => string;
}

export default function PharmacyInventory({ currentUser, lang, t }: PharmacyProps) {
  const [stock, setStock] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Purchase Order replenishing variables
  const [showPOForm, setShowPOForm] = useState(false);
  const [replenishId, setReplenishId] = useState('');
  const [addQty, setAddQty] = useState('100');
  const [supplierName, setSupplierName] = useState('GSK Pakistan Ltd');

  // Ad hoc dispense variables
  const [showDispenseForm, setShowDispenseForm] = useState(false);
  const [dispenseMedId, setDispenseMedId] = useState('');
  const [dispenseQty, setDispenseQty] = useState('');
  const [dispensePat, setDispensePat] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/pharmacy/medicines');
      const data = await res.json();
      setStock(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePurchaseOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replenishId || !addQty) {
      alert("Please fill replenish parameters.");
      return;
    }

    try {
      const res = await fetch('/api/pharmacy/purchase-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicineId: replenishId,
          addedQty: Number(addQty),
          supplierName,
          staffId: currentUser?.id || "SYSTEM"
        })
      });

      if (res.ok) {
        setShowPOForm(false);
        setReplenishId('');
        setAddQty('100');
        fetchData();
        alert("Purchase Order processed. Stocks replenished in pharmacy records successfully.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDispenseAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispenseMedId || !dispenseQty) {
      alert("Please complete fields.");
      return;
    }

    try {
      const activeMed = stock.find(m => m.id === dispenseMedId);
      if (!activeMed) return;

      const qtyNum = Number(dispenseQty);
      const res = await fetch('/api/pharmacy/dispense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicineId: dispenseMedId,
          qty: qtyNum,
          patientName: dispensePat || "Walk-In Patient Counter",
          staffId: currentUser?.id || "SYSTEM"
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Dispensing stopped.");
      }

      // Automatically register pharmacy bill
      const billVal = activeMed.salePrice * qtyNum;
      await fetch('/api/billing/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientMrn: "MRN-WALK-IN",
          module: 'PHARMACY',
          subtotal: billVal,
          discountApprovedAmount: 0,
          taxAmount: billVal * 0.05,
          netBill: billVal * 1.05,
          paymentMethod: 'CASH',
          items: [{ description: `Dispensed OTC medicine: ${activeMed.name}`, qty: qtyNum, price: activeMed.salePrice }],
          staffId: currentUser?.id || "SYSTEM"
        })
      });

      setShowDispenseForm(false);
      setDispenseMedId('');
      setDispenseQty('');
      setDispensePat('');
      fetchData();
      alert(`OTC Dispensed successfully! Bill invoice valued Rs. ${billVal * 1.05} routed to cashier counters.`);

    } catch (e: any) {
      alert(e.message || "Error dispensing.");
    }
  };

  const filteredMedicines = stock.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    m.genericName.toLowerCase().includes(search.toLowerCase()) ||
    m.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6" id="pharmacy-module-root">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-205 dark:border-slate-800/80 shadow-sm" id="pharmacy-header">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Pill size={20} className="text-emerald-500" />
            <span>{t('nav_pharmacy')}</span>
          </h1>
          <p className="text-xs text-slate-450 mt-1">
            Supervise medication stocks, generate replenishment purchase orders, and dispense medicines.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            id="btn-trigger-dispense"
            onClick={() => {
              setShowDispenseForm(!showDispenseForm);
              setShowPOForm(false);
            }}
            className="flex items-center gap-1.5 bg-purple-650 bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <ShoppingBag size={14} />
            <span>{showDispenseForm ? t('cancel') : 'Ad-Hoc Dispense'}</span>
          </button>
          
          <button
            id="btn-trigger-po"
            onClick={() => {
              setShowPOForm(!showPOForm);
              setShowDispenseForm(false);
            }}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <ShoppingCart size={14} />
            <span>{showPOForm ? t('cancel') : 'Create PO / Restock'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5" id="pharmacy-workspace">
        
        {/* LEFT COLUMN: Restock form or OTC dispense forms */}
        {showPOForm && (
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-950/40 shadow-sm space-y-4" id="pharmacy-po-form">
            <div className="flex items-center gap-2 border-b border-emerald-50 dark:border-emerald-900/50 pb-3">
              <ShoppingCart className="text-emerald-500 animate-pulse" size={17} />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-white">Procure Stock Purchase Order</span>
            </div>

            <form onSubmit={handlePurchaseOrderSubmit} className="space-y-4 text-xs text-left" id="po-restock-form">
              
              <div className="space-y-1">
                <label className="block text-[10px] text-slate-450 font-bold uppercase">Select Medicine item *</label>
                <select
                  id="po-form-medicine" required value={replenishId} onChange={e => setReplenishId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-205 dark:border-slate-800 px-2 py-2 rounded-lg text-slate-800 dark:text-white"
                >
                  <option value="">-- Select SKU --</option>
                  {stock.map(m => (
                    <option key={m.id} value={m.id}>{m.name} (Cur Stock: {m.stockCount})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-slate-450 font-bold uppercase">Procurement Quantity *</label>
                <input 
                  id="po-form-qty" type="number" value={addQty} onChange={e => setAddQty(e.target.value)} required
                  className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-lg text-slate-800 dark:text-white font-mono"
                  placeholder="e.g. 500" min="1"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-slate-450 font-bold uppercase">Supplier vendor *</label>
                <input 
                  id="po-form-supplier" type="text" value={supplierName} onChange={e => setSupplierName(e.target.value)} required
                  className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-lg text-slate-80) dark:text-white"
                  placeholder="GSK Pakistan, Abbott, Getz Pharma..."
                />
              </div>

              <button
                id="btn-po-submit" type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl shadow transition-all cursor-pointer"
              >
                Sign & Authorize Procurement
              </button>
            </form>
          </div>
        )}

        {showDispenseForm && (
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-purple-100 dark:border-purple-950/40 shadow-sm space-y-4 animate-slide-in" id="pharmacy-dispense-form">
            <div className="flex items-center gap-2 border-b border-purple-100 dark:border-purple-900/50 pb-3">
              <ShoppingBag className="text-purple-550 text-purple-500 animate-pulse" size={17} />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-705 dark:text-white">OTC Medicine Direct Dispense</span>
            </div>

            <form onSubmit={handleDispenseAction} className="space-y-4 text-xs text-left" id="otc-dispensing-form">
              
              <div className="space-y-1">
                <label className="block text-[10px] text-slate-450 font-bold uppercase">Patron Patient Name</label>
                <input 
                  id="dispense-form-patient" type="text" value={dispensePat} onChange={e => setDispensePat(e.target.value)}
                  placeholder="Walk-In Customer / Patient Name"
                  className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-lg text-slate-800 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-slate-450 font-bold uppercase">Choose Medicine *</label>
                <select
                  id="dispense-form-med" required value={dispenseMedId} onChange={e => setDispenseMedId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 px-2 py-2 rounded-lg text-slate-805 dark:text-white"
                >
                  <option value="">-- Select stocked item --</option>
                  {stock.map(m => (
                    <option key={m.id} value={m.id} disabled={m.stockCount <= 0}>{m.name} (Stock: {m.stockCount})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-slate-450 font-bold uppercase">Dispensing Qty *</label>
                <input 
                  id="dispense-form-qty" type="number" required value={dispenseQty} onChange={e => setDispenseQty(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-205 dark:border-slate-800 px-3 py-2 rounded-lg text-slate-800 dark:text-white font-mono"
                  placeholder="e.g. 10" min="1"
                />
              </div>

              <button
                id="btn-dispense-submit" type="submit"
                className="w-full bg-purple-600 hover:bg-purple-505 text-white font-bold py-2.5 rounded-xl shadow transition-all cursor-pointer text-center"
              >
                Log Dispense & Process Fee Card
              </button>
            </form>
          </div>
        )}

        {/* RIGHT COLUMN: Medicine lists */}
        <div className={`bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4 ${
          (showPOForm || showDispenseForm) ? 'lg:col-span-8' : 'lg:col-span-12'
        }`} id="pharmacy-med-lists">
          
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950/30 px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800/65">
            <Search size={16} className="text-slate-400 shrink-0" />
            <input 
              id="pharmacy-search-input"
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Query general pharmacopeia by SKU ID, Medicine Name or Generic Formula name..."
              className="w-full bg-transparent border-0 text-xs text-slate-850 dark:text-white focus:outline-hidden"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left" id="pharmacy-table">
              <thead className="bg-slate-50 dark:bg-slate-950/35 text-slate-400 text-[10px] font-mono uppercase border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="p-3 font-semibold">SKU ID</th>
                  <th className="p-3 font-semibold">Medicine Description</th>
                  <th className="p-3 font-semibold">Generic Formula</th>
                  <th className="p-3 font-semibold text-center font-mono">Stock Level</th>
                  <th className="p-3 font-semibold font-mono">Sale Price (PKR)</th>
                  <th className="p-3 font-semibold font-mono">Expiry Date</th>
                  <th className="p-3 font-semibold">Acquisition Contractor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {filteredMedicines.map((med) => {
                  const isLow = med.stockCount <= med.minStockLevel;
                  return (
                    <tr key={med.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-950/10">
                      <td className="p-3 font-mono font-bold text-slate-700 dark:text-white">{med.id}</td>
                      <td className="p-3">
                        <span className="block font-bold text-slate-855 dark:text-slate-150">{med.name}</span>
                        {isLow && (
                          <span className="inline-block text-[8px] bg-red-101 text-red-650 bg-red-50 dark:bg-red-950/35 dark:text-red-400 border border-red-200 font-bold px-1.5 py-0.2 rounded font-mono animate-pulse uppercase">LOW STOCK TARGET</span>
                        )}
                      </td>
                      <td className="p-3 italic text-slate-500">{med.genericName}</td>
                      <td className="p-3 text-center font-mono font-bold">
                        <span className={isLow ? "text-red-500 font-extrabold" : "text-slate-800 dark:text-slate-200"}>
                          {med.stockCount} Units
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">{formatPKR(med.salePrice)}</td>
                      <td className="p-3 font-mono text-slate-550 whitespace-nowrap">{formatDate(med.expiryDate)}</td>
                      <td className="p-3 text-slate-450 font-medium">{med.supplierName}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
