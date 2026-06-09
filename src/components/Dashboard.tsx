/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, Users, Clipboard, BedDouble, AlertTriangle, 
  Clock, ShieldCheck, HeartPulse, UserX, Receipt
} from 'lucide-react';
import { formatPKR, formatDate } from '../utils';
import { AuditLog, User } from '../types';

interface DashboardProps {
  currentUser: User | null;
  lang: 'EN' | 'UR';
  t: (key: string) => string;
}

interface Analytics {
  totalPatients: number;
  opdQueueToday: number;
  activeAdmissions: number;
  occupancyRate: number;
  moduleRevenue: Record<string, number>;
  outstandingInsurance: number;
  doctorLoad: Record<string, number>;
  lowStockCount: number;
  totalRevenue: number;
}

export default function Dashboard({ currentUser, lang, t }: DashboardProps) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveTime, setLiveTime] = useState(new Date().toLocaleTimeString('en-GB'));

  useEffect(() => {
    // Sync clock
    const interval = setInterval(() => {
      setLiveTime(new Date().toLocaleTimeString('en-GB'));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const resAnalytic = await fetch('/api/dashboard/analytics');
      const dataAnalytic = await resAnalytic.json();
      setAnalytics(dataAnalytic);

      const resLogs = await fetch('/api/audit-logs');
      const dataLogs = await resLogs.json();
      setLogs(dataLogs.slice(0, 6)); // Display latest 6 events
    } catch (e) {
      console.error("Dashboard Fetch Failure:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const kpis = [
    {
      title: t('kpi_revenue'),
      value: analytics ? formatPKR(analytics.totalRevenue) : "Rs. 0",
      change: "Punjab Revenue Audited",
      color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60",
      icon: TrendingUp
    },
    {
      title: t('kpi_patients'),
      value: analytics ? analytics.totalPatients.toString() : "0",
      change: "Total Permanent MRNs",
      color: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200 dark:border-blue-900/60",
      icon: Users
    },
    {
      title: t('kpi_opd_today'),
      value: analytics ? analytics.opdQueueToday.toString() : "0",
      change: "Active Ticket Waitlist",
      color: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-900/60",
      icon: Clipboard
    },
    {
      title: t('kpi_active_ipd'),
      value: analytics ? analytics.activeAdmissions.toString() : "0",
      change: "Under Nursing Care Now",
      color: "bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 border-purple-200 dark:border-purple-900/60",
      icon: BedDouble
    }
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4" id="dashboard-loading">
        <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-emerald-600 animate-spin"></div>
        <p className="text-xs font-mono text-slate-500 animate-pulse">Syncing administrative servers...</p>
      </div>
    );
  }

  // Pre-calculations for beautiful visual charts
  const moduleEarnings = analytics?.moduleRevenue || {};
  const modulesKeys = ['OPD', 'IPD', 'LAB', 'RADIOLOGY', 'PHARMACY', 'OT'];
  const maxEarning = Math.max(...modulesKeys.map(k => moduleEarnings[k] || 1000));

  return (
    <div className="space-y-6 animate-fade-in" id="dashboard-module-root">
      
      {/* Alert Ribbon for Pharmacy Expiry or Critical Actions */}
      {analytics && analytics.lowStockCount > 0 && (
        <div className="flex items-center gap-3 p-3.5 bg-rose-50 dark:bg-rose-950/35 text-rose-800 dark:text-rose-200 border border-thin border-rose-200 dark:border-rose-900/60 rounded-xl animate-bounce" id="out-of-stock-alert">
          <AlertTriangle className="text-rose-500 shrink-0" size={18} />
          <div className="text-xs font-medium">
            <span className="font-bold">Attention Duty Pharmacist:</span> {analytics.lowStockCount} medicines are below critical minimum stock warning limits! Refresh inventories to avert operational stops.
          </div>
        </div>
      )}

      {/* Top Welcome Title Grid */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm" id="dashboard-welcome">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <HeartPulse size={22} className="text-emerald-500" />
            <span>{lang === 'EN' ? 'Clinical Command Board' : 'ہسپتال کا انتظامی کنٹرول بورڈ'}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {lang === 'EN' 
              ? `Operational status of Mayo University Care Center. Secure interface active: Room-Ingress authorized.`
              : `میو ٹرسٹ ہیلتھ کیئر سینٹر کا موجودہ انتظامی اور آپریشنل ریکارڈ۔`}
          </p>
        </div>

        {/* Live Metrics Widget */}
        <div className="flex items-center gap-3 font-mono text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/40 px-3.5 py-2 rounded-xl border border-slate-200/60 dark:border-slate-800/60 shrink-0">
          <Clock size={14} className="text-emerald-500 shrink-0" />
          <span>PKT:</span>
          <span className="font-bold text-slate-700 dark:text-white">{liveTime}</span>
          <span className="text-[10px] text-slate-400">|</span>
          <span>09/06/2026</span>
        </div>
      </div>

      {/* 4 KPI Cards Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="dashboard-kpi-grid">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div 
              key={idx} 
              id={`kpi-card-${idx}`}
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-250 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all flex items-start justify-between gap-3 group"
            >
              <div className="space-y-2">
                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">{kpi.title}</span>
                <span className="block text-xl font-bold text-slate-900 dark:text-white tracking-wider font-mono">{kpi.value}</span>
                <span className="block text-[10px] font-medium text-slate-500">{kpi.change}</span>
              </div>
              <div className={`p-3 rounded-xl border ${kpi.color}`}>
                <Icon size={20} className="group-hover:scale-110 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Box section: Pure Tailwind/SVG Graphics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5" id="dashboard-charts-row">
        
        {/* Earnings Breakdown */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-220 dark:border-slate-800/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingUp size={15} className="text-emerald-500" />
              <span>{t('module_income')}</span>
            </h3>
            <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 px-2 py-0.5 rounded-md font-mono">Rs. Standard PKR Currency</span>
          </div>

          {/* Bar Diagram */}
          <div className="space-y-4 pt-2">
            {modulesKeys.map(mKey => {
              const amount = moduleEarnings[mKey] || 0;
              const percent = maxEarning > 0 ? (amount / maxEarning) * 100 : 0;
              return (
                <div key={mKey} className="space-y-1.5" id={`chart-bar-${mKey.toLowerCase()}`}>
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-700 dark:text-slate-300 font-mono text-[11px]">{mKey} Department</span>
                    <span className="text-slate-900 dark:text-slate-200 font-bold font-mono">{formatPKR(amount)}</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-linear-to-r from-emerald-500 to-teal-600 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.max(5, percent)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ward Bed Occupancy Breakdown */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-5 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <BedDouble size={15} className="text-purple-500" />
              <span>{t('occupancy_chart_title')}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
              {/* Visual dial simulation */}
              <div className="flex flex-col items-center justify-center p-2 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl border border-slate-100 dark:border-slate-800/50">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-100 dark:text-slate-800"
                      strokeWidth="2.8"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-emerald-500"
                      strokeWidth="2.8"
                      strokeDasharray={`${analytics ? analytics.occupancyRate : 40}, 100`}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="text-center">
                    <span className="block text-xl font-bold text-slate-850 dark:text-white font-mono">{analytics ? analytics.occupancyRate : 0}%</span>
                    <span className="block text-[8px] text-slate-400 font-semibold uppercase">Total Occupied</span>
                  </div>
                </div>
              </div>

              {/* Ward breakdowns */}
              <div className="flex flex-col justify-center space-y-2 text-[11px]">
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950/30 p-1.5 rounded border border-slate-100 dark:border-slate-800/40">
                  <span className="font-medium text-slate-600 dark:text-slate-400">ICU Bed Unit</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">80% ●</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950/30 p-1.5 rounded border border-slate-100 dark:border-slate-800/40">
                  <span className="font-medium text-slate-600 dark:text-slate-400">CCU Cardiology</span>
                  <span className="font-mono font-bold text-amber-500">65% ●</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950/30 p-1.5 rounded border border-slate-100 dark:border-slate-800/40">
                  <span className="font-medium text-slate-600 dark:text-slate-400">General Wards</span>
                  <span className="font-mono font-bold text-emerald-500">42% ●</span>
                </div>
              </div>
            </div>

            {/* Inpatient Balance outstanding indicators */}
            <div className="bg-slate-50 dark:bg-slate-950/45 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/40 space-y-1 text-center mb-4">
              <span className="block text-[9px] font-bold text-slate-450 uppercase tracking-wider">{t('kpi_outstanding')}</span>
              <span className="block text-md font-bold text-rose-600 dark:text-rose-400 font-mono">{analytics ? formatPKR(analytics.outstandingInsurance) : "Rs.0"}</span>
              <span className="text-[9px] text-slate-450">Sehat Card & Private Insured Claims</span>
            </div>
          </div>

          {/* Clinician workload desk */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2">
            <span className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Physician Care Loads (Active OPD Tickets)</span>
            <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
              {analytics && Object.keys(analytics.doctorLoad).length > 0 ? (
                Object.entries(analytics.doctorLoad).map(([docName, loadCount]) => (
                  <div key={docName} className="flex justify-between items-center text-[11px] bg-slate-50 dark:bg-slate-950/20 p-1.5 rounded border border-slate-100 dark:border-slate-800/50">
                    <span className="font-semibold text-slate-700 dark:text-slate-350">{docName}</span>
                    <span className="px-2 py-0.5 font-mono text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-450 rounded-full">
                      {loadCount} Patients
                    </span>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex justify-between items-center text-[11px] bg-slate-50 dark:bg-slate-950/20 p-1.5 rounded border border-slate-100 dark:border-slate-800/50">
                    <span className="font-semibold text-slate-700 dark:text-slate-350">Dr. Sadia Malik (Cardiology)</span>
                    <span className="px-2 py-0.5 font-mono text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full">
                      Active On Duty
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] bg-slate-50 dark:bg-slate-950/20 p-1.5 rounded border border-slate-100 dark:border-slate-800/50">
                    <span className="font-semibold text-slate-700 dark:text-slate-350">Dr. Fahad Alvi (Pediatrician)</span>
                    <span className="px-2 py-0.5 font-mono text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full">
                      Lunch Break
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Security Audit Records Log */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-220 dark:border-slate-800/80 shadow-sm space-y-4" id="dashboard-audit-logs">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-850 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-500" />
            <span>Core Session Audit Trail (Live Logs)</span>
          </h3>
          <span className="text-[9px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-mono text-slate-500">ISO 27001 Cryptographic Logs</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-600 dark:text-slate-350" id="audit-logs-table">
            <thead className="bg-slate-50 dark:bg-slate-950/30 text-slate-400 text-[10px] font-mono uppercase border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="p-2.5 font-medium">Timestamp</th>
                <th className="p-2.5 font-medium">Session Operator</th>
                <th className="p-2.5 font-medium">Role Privilege</th>
                <th className="p-2.5 font-medium">Action Triggered</th>
                <th className="p-2.5 font-medium">System IP</th>
                <th className="p-2.5 font-medium">Record/Action Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-950/10 font-mono text-[11px] leading-relaxed">
                  <td className="p-2.5 whitespace-nowrap text-slate-450">{formatDate(log.timestamp)} {new Date(log.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">{log.staffName}</td>
                  <td className="p-2.5 whitespace-nowrap">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {log.role}
                    </span>
                  </td>
                  <td className="p-2.5 whitespace-nowrap font-bold text-emerald-600">{log.action}</td>
                  <td className="p-2.5 text-slate-450">{log.ipAddress}</td>
                  <td className="p-2.5 text-slate-700 dark:text-slate-300 max-w-[280px] truncate" title={log.details}>{log.details}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-400 font-sans italic">
                    {t('no_records')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
