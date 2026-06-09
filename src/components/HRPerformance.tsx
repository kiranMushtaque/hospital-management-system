/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Award, CheckCircle, 
  Clock, ShieldAlert, Sliders, ChevronRight, Activity
} from 'lucide-react';
import { formatPKR, formatDate } from '../utils';
import { User, HRClock } from '../types';

interface HRProps {
  currentUser: User | null;
  lang: 'EN' | 'UR';
  t: (key: string) => string;
}

export default function HRPerformance({ currentUser, lang, t }: HRProps) {
  const [staff, setStaff] = useState<User[]>([]);
  const [attendance, setAttendance] = useState<HRClock[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Selected Employee workspace card for Appraisal Sliders
  const [selectedEmp, setSelectedEmp] = useState<User | null>(null);
  const [salarySlider, setSalarySlider] = useState(60000);
  const [appraisalNotes, setAppraisalNotes] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const resS = await fetch('/api/hr/staff');
      const dataS = await resS.json();
      setStaff(dataS);

      const resA = await fetch('/api/hr/clocks');
      const dataA = await resA.json();
      setAttendance(dataA);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleClockAction = async (staffId: string, action: 'CLOCK_IN' | 'CLOCK_OUT') => {
    try {
      const res = await fetch('/api/hr/clocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId,
          action,
          staffIdModifier: currentUser?.id || "SYSTEM"
        })
      });
      if (res.ok) {
        fetchData();
        alert(`Staff clock event verified. Logs written into audit databases.`);
      } else {
        const err = await res.json();
        alert(err.error || "Clock event failed.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const saveAppraisalAdjustment = async () => {
    if (!selectedEmp) return;
    try {
      const res = await fetch(`/api/hr/staff/${selectedEmp.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salary: salarySlider,
          appraisalNotes,
          staffId: currentUser?.id || "SYSTEM"
        })
      });

      if (res.ok) {
        setSelectedEmp(null);
        setAppraisalNotes('');
        fetchData();
        alert("Appraisal finalized successfully. Employee salary bracket and logs updated.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredStaff = staff.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.id.includes(search) || 
    s.role.includes(search.toUpperCase())
  );

  return (
    <div className="space-y-6" id="hr-module-root">
      
      {/* KPI Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-205 dark:border-slate-800/80 shadow-sm" id="hr-header">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Users size={20} className="text-emerald-500" />
            <span>{t('nav_hr')}</span>
          </h1>
          <p className="text-xs text-slate-455 mt-1">
            Track workforce attendance schedules (In/Out markers), allocate nurse shift cards, and execute performance appraisal checks.
          </p>
        </div>

        <div className="text-[11px] font-mono leading-normal text-right shrink-0">
          <span className="block font-bold">Total Workforce: {staff.length} Members</span>
          <span className="text-slate-450">Active today: {attendance.filter(a => a.status === 'PRESENT').length} members</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5" id="hr-workspace">
        
        {/* LEFT COLUMN: Workforce registries lists & attendance trigger buttons */}
        <div className={`space-y-4 ${selectedEmp ? 'lg:col-span-8' : 'lg:col-span-12'}`} id="hr-staff-directories">
          
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3.5 py-4 rounded-xl border border-slate-200/80 dark:border-slate-850">
            <Search size={16} className="text-slate-400 shrink-0" />
            <input 
              id="hr-search-input"
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Query workforce roster by Employee Code, Specialist's Name or Role type..."
              className="w-full bg-transparent border-0 text-xs text-slate-855 dark:text-white focus:outline-hidden"
            />
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left" id="hr-staff-table">
                <thead className="bg-slate-50 dark:bg-slate-950/35 text-slate-400 text-[10px] font-mono uppercase border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="p-3 font-semibold">Employee ID</th>
                    <th className="p-3 font-semibold">Staff Demographics</th>
                    <th className="p-3 font-semibold">Role Profile</th>
                    <th className="p-3 font-semibold text-center">Status</th>
                    <th className="p-3 font-semibold font-mono">Current Salary</th>
                    <th className="p-3 font-semibold text-center">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                  {filteredStaff.map((emp) => {
                    // Check if employee is currently clocked in (clocked in today and doesn't have clockOut yet)
                    const isClockedIn = attendance.some(a => a.staffId === emp.id && !a.clockOut);

                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-950/10">
                        <td className="p-3 font-mono font-bold text-slate-850 dark:text-white">{emp.id}</td>
                        <td className="p-3">
                          <span className="block font-bold text-slate-855 dark:text-slate-100">{emp.name}</span>
                          <span className="block text-[10px] font-mono text-slate-450">{emp.cnic}</span>
                        </td>
                        <td className="p-3">
                          <span className="inline-block px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 font-mono text-[10px] font-bold uppercase">
                            {emp.role}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {isClockedIn ? (
                            <span className="inline-block text-[9px] bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 font-bold px-2 py-0.5 rounded uppercase font-mono animate-pulse">ON_DUTY</span>
                          ) : (
                            <span className="inline-block text-[9px] bg-slate-100 dark:bg-slate-850 text-slate-500 px-2 py-0.5 rounded uppercase font-mono">OFF_DUTY</span>
                          )}
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-900 dark:text-emerald-400 whitespace-nowrap">
                          {formatPKR(emp.salary || 65000)}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex justify-center items-center gap-2">
                            {isClockedIn ? (
                              <button
                                id={`btn-clock-out-${emp.id}`}
                                onClick={() => handleClockAction(emp.id, 'CLOCK_OUT')}
                                className="bg-rose-100 dark:bg-rose-950/10 hover:bg-rose-225 text-rose-600 font-bold text-[10px] px-2 py-1 rounded transition-all cursor-pointer whitespace-nowrap"
                              >
                                Clock Out (پلاگ آؤٹ)
                              </button>
                            ) : (
                              <button
                                id={`btn-clock-in-${emp.id}`}
                                onClick={() => handleClockAction(emp.id, 'CLOCK_IN')}
                                className="bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 text-emerald-600 font-bold text-[10px] px-2 py-1 rounded transition-all cursor-pointer whitespace-nowrap"
                              >
                                Clock In (آمد)
                              </button>
                            )}

                            <button
                              id={`btn-open-appraisal-${emp.id}`}
                              onClick={() => {
                                setSelectedEmp(emp);
                                setSalarySlider(emp.salary || 65000);
                              }}
                              className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-200 font-bold text-[10px] px-2 py-1 rounded transition-all cursor-pointer"
                            >
                              Appraisal
                            </button>
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

        {/* RIGHT COLUMN APPRAISAL SLIDERS SLIDE WORKSPACE */}
        {selectedEmp && (
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-purple-200 dark:border-purple-950/50 shadow-sm space-y-4 animate-slide-in" id="hr-appraisal-panel">
            
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-650 dark:text-purple-400 flex items-center gap-1.5">
                <Award size={15} />
                <span>Workforce Appraisal sliders</span>
              </span>
              <button 
                id="btn-close-appraisal"
                onClick={() => setSelectedEmp(null)}
                className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-4 text-xs text-left" id="salary-slider-card">
              
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950/45 rounded-xl border border-slate-105">
                <p className="font-extrabold text-slate-800 dark:text-slate-100">{selectedEmp.name}</p>
                <code className="text-[10px] text-slate-400">Employee Code ID: {selectedEmp.id}</code>
                <span className="block font-mono text-[10px] text-purple-600 mt-1 uppercase font-bold">Category: {selectedEmp.role}</span>
              </div>

              {/* Dynamic salary slider wrapper */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-455 uppercase">
                  <span>Authorized Salary Slider Range</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-450 text-xs font-extrabold">{formatPKR(salarySlider)}</span>
                </div>

                <input 
                  id="salary-slider-input"
                  type="range"
                  min="40000"
                  max="450000"
                  step="5000"
                  value={salarySlider}
                  onChange={e => setSalarySlider(Number(e.target.value))}
                  className="w-full h-2 bg-slate-101 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />

                <div className="flex justify-between text-[8px] font-mono text-slate-450">
                  <span>Min: Rs. 40,000</span>
                  <span>Mid: Rs. 245,000</span>
                  <span>Max: Rs. 450,000</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-450 block font-bold uppercase">Appraisal verification / review note *</label>
                <textarea 
                  id="appraisal-notes" rows={3.5} value={appraisalNotes} onChange={e => setAppraisalNotes(e.target.value)} required
                  placeholder="e.g. Excellent professional devotion inside the ICU units, leadership verified by senior surgeons."
                  className="w-full bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg text-slate-850 dark:text-white"
                />
              </div>

              <button
                id="btn-save-appraisal"
                disabled={!appraisalNotes}
                onClick={saveAppraisalAdjustment}
                className="w-full bg-purple-600 hover:bg-purple-505 disabled:opacity-45 text-white font-bold py-2.5 rounded-xl shadow cursor-pointer text-center"
              >
                Sign Salary Increment Appraisal
              </button>

            </div>

          </div>
        )}

      </div>

    </div>
  );
}
