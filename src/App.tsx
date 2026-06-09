/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Building2, LogOut, Globe, Moon, Sun, 
  Stethoscope, UserCheck, Lock, Activity
} from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PatientManagement from './components/PatientManagement';
import OPDManagement from './components/OPDManagement';
import IPDManagement from './components/IPDManagement';
import BillingManagement from './components/BillingManagement';
import LabDiagnostics from './components/LabDiagnostics';
import PharmacyInventory from './components/PharmacyInventory';
import RadiologyImaging from './components/RadiologyImaging';
import OperationTheater from './components/OperationTheater';
import HRPerformance from './components/HRPerformance';
import SystemSettings from './components/SystemSettings';

import { User, HospitalSettings } from './types';
import { translations } from './utils';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [lang, setLang] = useState<'EN' | 'UR'>('EN');
  const [darkMode, setDarkMode] = useState<boolean>(false);
  
  const [settings, setSettings] = useState<HospitalSettings>({
    hospitalName: "Mayo Trust Healthcare Complex",
    hospitalAddress: "Mayo Hospital Road, Near Anarkali Bazaar, Lahore, Punjab, Pakistan",
    phone: "+92 42 111-222-333",
    taxRatePercent: 5,
    whatsappTemplate: "Assalam o Alaikum [PATIENT], your clinical file has been processed successfully.",
    logoText: "Mayo Trust ERP",
    smsTemplate: "Dear [PATIENT], your bill of [AMOUNT] has ben validated. Thank you for choosing [HOSPITAL]!"
  });

  // Authentication inputs
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Auto-fill fast login dropdown helper (UX gold)
  const quickAccessLogins = [
    { id: 'EMP-1010', label: 'Super Admin (Dr. Asif Mayo)' },
    { id: 'EMP-2020', label: 'Duty Doctor (Dr. Sadia Malik)' },
    { id: 'EMP-3030', label: 'Charge Nurse (Sister Maria)' },
    { id: 'EMP-4040', label: 'Lab Technician (Basit Ali)' },
    { id: 'EMP-5050', label: 'Accounts Cashier (Kamran Khan)' }
  ];

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Sync index.html root body style dark class
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginId) return;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: loginId, password: loginPassword })
      });

      if (!res.ok) {
        throw new Error("Invalid Employee credentials or incorrect password.");
      }

      const data = await res.json();
      const user = data.user;
      if (!user) {
        throw new Error("Invalid response format from authorization server.");
      }
      setCurrentUser(user);
      
      // Seed initial audit trail
      await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'LOGIN_ESTABLISHED',
          details: `Staff member ${user.name} logged in securely with role: ${user.role}`,
          staffId: user.id
        })
      });

    } catch (err: any) {
      setLoginError(err.message || 'Error occurred during login authentication sequence.');
    }
  };

  const handleLogout = async () => {
    if (currentUser) {
      // Log logout trace
      await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'LOGOUT_SEQUENCE',
          details: `Staff member ${currentUser.name} signed out of session.`,
          staffId: currentUser.id
        })
      });
    }
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  const updateSettings = async (newSettings: HospitalSettings) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const t = (key: string): string => {
    return translations[lang][key] || translations['EN'][key] || key;
  };

  // Switch tabs rendering dispatcher
  const renderCurrentView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard currentUser={currentUser} lang={lang} t={t} />;
      case 'patients':
        return <PatientManagement currentUser={currentUser} settings={settings} lang={lang} t={t} />;
      case 'opd':
        return <OPDManagement currentUser={currentUser} lang={lang} t={t} />;
      case 'ipd':
        return <IPDManagement currentUser={currentUser} lang={lang} t={t} />;
      case 'billing':
        return <BillingManagement currentUser={currentUser} settings={settings} lang={lang} t={t} />;
      case 'lab':
        return <LabDiagnostics currentUser={currentUser} lang={lang} t={t} />;
      case 'pharmacy':
        return <PharmacyInventory currentUser={currentUser} lang={lang} t={t} />;
      case 'radiology':
        return <RadiologyImaging currentUser={currentUser} lang={lang} t={t} />;
      case 'ot':
        return <OperationTheater currentUser={currentUser} lang={lang} t={t} />;
      case 'hr':
        return <HRPerformance currentUser={currentUser} lang={lang} t={t} />;
      case 'settings':
        return <SystemSettings currentUser={currentUser} settings={settings} onUpdateSettings={updateSettings} lang={lang} t={t} />;
      default:
        return <Dashboard currentUser={currentUser} lang={lang} t={t} />;
    }
  };

  /* ==================== LOGIN SCREEN VIEW ==================== */
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-radial from-slate-50 to-slate-200 dark:from-slate-900 dark:to-slate-950 p-6 selection:bg-emerald-500 selection:text-white" id="login-screen">
        
        <div className="bg-white/80 dark:bg-slate-900/85 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/80 shadow-2xl rounded-3xl max-w-md w-full p-8 space-y-6 transition-all" id="login-card">
          
          <div className="text-center space-y-3">
            {/* Elegant Hospital Logo Placeholder */}
            <div className="relative w-16 h-16 bg-gradient-to-tr from-emerald-500 to-teal-400 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
              <Building2 size={32} className="animate-pulse" />
              <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 text-emerald-500 border border-emerald-500/20 rounded-lg p-1 shadow-sm">
                <Activity size={12} />
              </div>
            </div>
            
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Mayo Trust Hospital
              </h1>
              <span className="inline-block text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Clinical ERP Gateway
              </span>
              <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs mx-auto mt-1">
                Joint Commission International PHC Joint Accredited System (PHC-892)
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-left" id="login-verify-form">
            
            {loginError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs rounded-xl border border-rose-200/30 font-medium">
                ⚠️ {loginError}
              </div>
            )}

            <div className="space-y-1 text-xs">
              <label className="block text-[10px] text-slate-450 dark:text-slate-400 uppercase tracking-wider font-bold">CNIC/Employee ID (ملازم کا کارڈ نمبر)</label>
              <div className="relative">
                <input 
                  id="login-id-input"
                  type="text"
                  required
                  value={loginId}
                  onChange={e => setLoginId(e.target.value)}
                  placeholder="e.g. EMP-1010 or CNIC Number..."
                  className="w-full bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 p-3 rounded-xl text-slate-850 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="block text-[10px] text-slate-450 dark:text-slate-400 uppercase tracking-wider font-bold">Security Password (سیکورٹی پاس ورڈ)</label>
              <div className="relative">
                <input 
                  id="login-password-input"
                  type="password"
                  required
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 p-3 rounded-xl text-slate-850 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            {/* Quick login bypass selector */}
            <div className="space-y-1 text-xs pt-1">
              <label className="block text-[10px] text-slate-450 dark:text-slate-400 font-bold uppercase tracking-wider">Fast Access Core Roles Demo Bypass</label>
              <select 
                id="login-quick-select"
                value={loginId}
                onChange={e => {
                  const val = e.target.value;
                  setLoginId(val);
                  if (val === 'EMP-1010') {
                    setLoginPassword('admin123');
                  } else if (val) {
                    setLoginPassword('doctor123');
                  } else {
                    setLoginPassword('');
                  }
                }}
                className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-slate-700 dark:text-slate-300 cursor-pointer font-medium text-xs focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">-- Choose Role Option --</option>
                {quickAccessLogins.map(role => (
                  <option key={role.id} value={role.id}>{role.label}</option>
                ))}
              </select>
            </div>

            <button
              id="btn-login"
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold py-3 rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/35 transition-all text-xs tracking-wider uppercase cursor-pointer"
            >
              Sign-In & Sync Registry
            </button>

          </form>

          {/* Secure credentials on board panel requested by user */}
          <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800 p-4 rounded-xl text-left text-[11px] text-slate-500 dark:text-slate-400 space-y-1.5" id="onboard-clinical-key">
            <span className="font-bold text-[10px] text-slate-750 dark:text-slate-300 uppercase tracking-wide block">Authorized Clinical Registers Info:</span>
            <div className="grid grid-cols-2 gap-2 font-mono">
              <div className="bg-white dark:bg-slate-900 border p-2 rounded-lg space-y-0.5">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold block text-[10px]">🔑 Super Admin</span>
                <p>ID: <span className="font-bold text-slate-700 dark:text-slate-200">EMP-1010</span></p>
                <p>Pass: <span className="font-bold text-slate-700 dark:text-slate-200">admin123</span></p>
              </div>
              <div className="bg-white dark:bg-slate-900 border p-2 rounded-lg space-y-0.5">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold block text-[10px]">🩺 Duty Doctor</span>
                <p>ID: <span className="font-bold text-slate-700 dark:text-slate-200">EMP-2020</span></p>
                <p>Pass: <span className="font-bold text-slate-700 dark:text-slate-200">doctor123</span></p>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 leading-tight">These secure credentials bind directly to the local memory database audit indexes.</p>
          </div>

          <footer className="text-[9.5px] text-slate-400 font-medium flex justify-between uppercase font-mono pt-4 border-t border-slate-100 dark:border-slate-800">
            <span>Ver: 5.1.0 Production</span>
            <span>Punjab, PK</span>
          </footer>

        </div>
      </div>
    );
  }

  /* ==================== ACTIVE DASHBOARD VIEW LAYOUT ==================== */
  return (
    <div className={`min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 ${lang === 'UR' ? 'rtl font-serif' : 'ltr font-sans'}`} id="applet-main-canvas">
      
      {/* 1. Left Navigation Sidebar */}
      <Sidebar 
        currentTab={activeTab} 
        setTab={setActiveTab} 
        lang={lang} 
        setLang={setLang} 
        theme={darkMode ? 'DARK' : 'LIGHT'}
        setTheme={(newTheme) => setDarkMode(newTheme === 'DARK')}
        currentUser={currentUser} 
        onLogout={handleLogout}
        settings={settings}
        t={t} 
      />

      {/* 2. Main content container */}
      <article className="flex-1 min-w-0 flex flex-col min-h-screen md:pl-68" id="main-view-workspace">
        
        {/* Top Control bar (Header with parameters) */}
        <header className="h-16 border-b border-slate-200/60 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between no-print" id="dashboard-navbar">
          
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 px-2.5 py-1 rounded-sm uppercase tracking-wide">
              {currentUser.role} Active Desks
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline">&mdash; {settings.hospitalName} Lahore</span>
          </div>

          <div className="flex items-center gap-3">
            
            {/* Language switcher button */}
            <button
              id="btn-lang-toggle"
              onClick={() => setLang(lang === 'EN' ? 'UR' : 'EN')}
              className="border p-2 rounded-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer text-xs font-semibold"
            >
              <Globe size={13} />
              <span>{lang === 'EN' ? 'اردو زبان' : 'English View'}</span>
            </button>

            {/* Dark mode switcher toggle */}
            <button
              id="btn-theme-toggle"
              className="border p-2 rounded-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? <Sun size={13} /> : <Moon size={13} />}
            </button>

            {/* Active User Badge */}
            <div className="flex items-center gap-2 border-l pl-3 dark:border-slate-800 text-left">
              <div className="hidden md:block">
                <span className="block text-xs font-bold text-slate-800 dark:text-slate-100">{currentUser.name}</span>
                <span className="block text-[9px] text-slate-400 font-mono font-bold leading-none mt-0.5">{currentUser.id}</span>
              </div>
              <button
                id="btn-logout"
                onClick={handleLogout}
                className="bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 text-rose-600 border border-rose-100 dark:border-rose-900/50 p-2 rounded-xl cursor-pointer"
                title="Secure Sign-out session"
              >
                <LogOut size={13} />
              </button>
            </div>

          </div>

        </header>

        {/* 3. Render module viewport */}
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full" id="module-viewport">
          {renderCurrentView()}
        </main>

      </article>

    </div>
  );
}
