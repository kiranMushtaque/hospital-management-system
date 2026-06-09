/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Settings, Save, Activity, ShieldCheck, HelpCircle, AlertCircle, RefreshCw
} from 'lucide-react';
import { HospitalSettings, User } from '../types';

interface SettingsProps {
  currentUser: User | null;
  settings: HospitalSettings;
  onUpdateSettings: (newSettings: HospitalSettings) => Promise<void>;
  lang: 'EN' | 'UR';
  t: (key: string) => string;
}

export default function SystemSettings({ currentUser, settings, onUpdateSettings, lang, t }: SettingsProps) {
  const [hospName, setHospName] = useState(settings.hospitalName);
  const [hospAddress, setHospAddress] = useState(settings.hospitalAddress);
  const [phone, setPhone] = useState(settings.phone);
  const [taxRate, setTaxRate] = useState(settings.taxRatePercent.toString());
  const [smsTpl, setSmsTpl] = useState(settings.smsTemplate);
  
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload: HospitalSettings = {
        hospitalName: hospName,
        hospitalAddress: hospAddress,
        phone,
        taxRatePercent: Number(taxRate) || 5,
        smsTemplate: smsTpl,
        whatsappTemplate: settings.whatsappTemplate || "",
        logoText: settings.logoText || "Mayo ERP"
      };

      await onUpdateSettings(payload);
      alert("System parameters synchronized inside database permanent registries!");
    } catch (err) {
      console.error(err);
      alert("Error saving settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6" id="settings-module-root">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-205 dark:border-slate-800/80 shadow-sm" id="settings-header">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Settings size={20} className="text-emerald-500 animate-spin-slow" />
            <span>{t('nav_settings')}</span>
          </h1>
          <p className="text-xs text-slate-455 mt-1">
            Conduct facility telemetry parameter adjustments, regulate Punjab Revenue Authority (PRA) taxations, and modify SMS dispatching arrays.
          </p>
        </div>
      </div>

      <div className="max-w-3xl bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm" id="settings-card-workspace">
        
        <form onSubmit={handleSubmit} className="space-y-6 text-xs text-left" id="global-settings-form">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <ShieldCheck className="text-emerald-505 text-emerald-500" size={17} />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-705 dark:text-white">Facility Configurations</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5" id="facility-grid-fields">
            
            <div className="space-y-1">
              <label className="block text-[10px] text-slate-450 font-bold uppercase">Hospital Clinic Name *</label>
              <input 
                id="settings-hosp-name" type="text" required value={hospName} onChange={e => setHospName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg text-slate-850 dark:text-white"
                placeholder="Hospital Title"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] text-slate-455 font-bold uppercase">Emergency Hotlines / Phone lines *</label>
              <input 
                id="settings-hosp-phone" type="text" required value={phone} onChange={e => setPhone(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg text-slate-850 dark:text-white font-mono"
                placeholder="e.g. +92 42 111-222-333"
              />
            </div>

          </div>

          <div className="space-y-1">
            <label className="block text-[10px] text-slate-450 font-bold uppercase">Physical Location Address *</label>
            <input 
              id="settings-hosp-address" type="text" required value={hospAddress} onChange={e => setHospAddress(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg text-slate-850 dark:text-white"
              placeholder="Full location address plot number"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 border-t pt-5 dark:border-slate-800" id="tax-and-comms-fields">
            
            <div className="space-y-1 col-span-1">
              <label className="block text-[10px] text-slate-450 font-bold uppercase flex items-center gap-1">
                <span>PRA Service Tax (%)</span>
                <span className="text-red-500 font-extrabold">*</span>
              </label>
              <input 
                id="settings-tax-rate" type="number" required min="0" max="25" step="0.5" value={taxRate} onChange={e => setTaxRate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg text-slate-850 dark:text-white font-mono font-bold"
              />
              <span className="text-[9.5px] text-slate-450 block leading-tight mt-1">Regulatory Punjab Revenue Authority sales tax percent. Applied on billing subtotal lines.</span>
            </div>

            <div className="space-y-1 col-span-2">
              <label className="block text-[10px] text-slate-450 font-bold uppercase">WhatsApp / SMS receipts SMS content template *</label>
              <textarea 
                id="settings-sms-tpl" rows={3.5} required value={smsTpl} onChange={e => setSmsTpl(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg text-slate-850 dark:text-white font-mono leading-normal"
                placeholder="Alert SMS bodies..."
              />
              <span className="text-[9px] text-slate-450 block leading-tight mt-1">Dynamic hooks supported: <code className="font-bold">[PATIENT]</code>, <code className="font-bold">[MRN]</code>, <code className="font-bold">[AMOUNT]</code>, <code className="font-bold">[HOSPITAL]</code>.</span>
            </div>

          </div>

          <div className="flex justify-end border-t pt-5 dark:border-slate-850">
            <button
              id="btn-settings-save" type="submit" disabled={saving}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow cursor-pointer text-xs uppercase tracking-wider"
            >
              <Save size={14} />
              <span>{saving ? 'Saving System Parameters...' : 'Synchronize Facility Parameters'}</span>
            </button>
          </div>

        </form>

      </div>

    </div>
  );
}
