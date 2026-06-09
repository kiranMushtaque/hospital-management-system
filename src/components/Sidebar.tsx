/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Activity, Users, Clipboard, BedDouble, CreditCard, FlaskConical, 
  Pill, Radio, Scissors, Briefcase, Settings2, LogOut, Languages, Sun, Moon, ShieldAlert
} from 'lucide-react';
import { User, HospitalSettings } from '../types';

interface SidebarProps {
  currentTab: string;
  setTab: (tab: string) => void;
  lang: 'EN' | 'UR';
  setLang: (lang: 'EN' | 'UR') => void;
  theme: 'LIGHT' | 'DARK';
  setTheme: (theme: 'LIGHT' | 'DARK') => void;
  currentUser: User | null;
  onLogout: () => void;
  settings: HospitalSettings;
  t: (key: string) => string;
}

export default function Sidebar({
  currentTab,
  setTab,
  lang,
  setLang,
  theme,
  setTheme,
  currentUser,
  onLogout,
  settings,
  t
}: SidebarProps) {
  
  const menuItems = [
    { id: 'dashboard', icon: Activity, label: t('nav_dashboard'), roles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'CASHIER', 'LAB_TECH'] },
    { id: 'patients', icon: Users, label: t('nav_patients'), roles: ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE'] },
    { id: 'opd', icon: Clipboard, label: t('nav_opd'), roles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'] },
    { id: 'ipd', icon: BedDouble, label: t('nav_ipd'), roles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE'] },
    { id: 'billing', icon: CreditCard, label: t('nav_billing'), roles: ['SUPER_ADMIN', 'ADMIN', 'CASHIER'] },
    { id: 'lab', icon: FlaskConical, label: t('nav_lab'), roles: ['SUPER_ADMIN', 'ADMIN', 'LAB_TECH', 'DOCTOR'] },
    { id: 'pharmacy', icon: Pill, label: t('nav_pharmacy'), roles: ['SUPER_ADMIN', 'ADMIN', 'CASHIER', 'DOCTOR'] },
    { id: 'radiology', icon: Radio, label: t('nav_radiology'), roles: ['SUPER_ADMIN', 'ADMIN', 'LAB_TECH', 'DOCTOR'] },
    { id: 'ot', icon: Scissors, label: t('nav_ot'), roles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE'] },
    { id: 'hr', icon: Briefcase, label: t('nav_hr'), roles: ['SUPER_ADMIN', 'ADMIN'] },
    { id: 'settings', icon: Settings2, label: t('nav_settings'), roles: ['SUPER_ADMIN', 'ADMIN'] },
  ];

  const visibleMenuItems = currentUser 
    ? menuItems.filter(item => item.roles.includes(currentUser.role))
    : [];

  return (
    <aside className="w-68 bg-slate-900 text-slate-100 flex flex-col h-screen fixed top-0 left-0 border-r border-slate-800 z-30 transition-transform md:translate-x-0">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-500 text-white p-1.5 rounded-lg flex items-center justify-center">
            <Activity size={20} className="animate-pulse" />
          </div>
          <div>
            <span className="font-bold text-md text-white tracking-wide">{settings.logoText}</span>
            <span className="block text-[9px] text-slate-400 font-mono tracking-tighter uppercase">Mayo Trust HMS</span>
          </div>
        </div>
      </div>

      {/* Staff Snapshot */}
      {currentUser && (
        <div className="p-4 bg-slate-950/40 border-b border-slate-800/40 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700/60 flex items-center justify-center text-emerald-400 font-bold uppercase shrink-0 text-sm">
            {(currentUser.name || "Staff Member").split(' ').map(n => n ? n[0] : '').join('').slice(0,2)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">{currentUser.name}</p>
            <p className="text-[10px] text-emerald-400 font-semibold font-mono tracking-wider">{currentUser.role}</p>
            <p className="text-[9px] text-slate-400 truncate">{currentUser.department}</p>
          </div>
        </div>
      )}

      {/* Primary Navigation */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {visibleMenuItems.map((item) => {
          const Icon = item.icon;
          const isSelected = currentTab === item.id;
          return (
            <button
              key={item.id}
              id={`sidebar-tab-${item.id}`}
              onClick={() => setTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium tracking-tight transition-all duration-150 group text-left ${
                isSelected 
                  ? 'bg-emerald-505 bg-emerald-600 text-white shadow-md' 
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              <Icon size={16} className={`shrink-0 ${isSelected ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400'}`} />
              <span className="truncate">{item.label}</span>
              {isSelected && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white"></span>}
            </button>
          );
        })}
      </div>

      {/* Bottom Actions & Utilities */}
      <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-950/20">
        
        {/* Multilingual & Visual controls */}
        <div className="grid grid-cols-2 gap-2">
          
          {/* Toggle Urdu / English */}
          <button
            id="lang-toggle-btn"
            onClick={() => setLang(lang === 'EN' ? 'UR' : 'EN')}
            className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md bg-slate-850 hover:bg-slate-800 text-xs font-medium text-slate-300 hover:text-white border border-slate-800/80 cursor-pointer"
            title="Convert translation system toggling English / اردو"
          >
            <Languages size={13} className="text-emerald-400" />
            <span className="font-mono text-[10px]">{lang === 'EN' ? 'اردو' : 'English'}</span>
          </button>

          {/* Toggle Light / Dark UI */}
          <button
            id="theme-toggle-btn"
            onClick={() => setTheme(theme === 'LIGHT' ? 'DARK' : 'LIGHT')}
            className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md bg-slate-850 hover:bg-slate-800 text-xs font-medium text-slate-300 hover:text-white border border-slate-800/80 cursor-pointer"
            title="Switch light/dark aesthetics"
          >
            {theme === 'LIGHT' ? (
              <>
                <Moon size={13} className="text-amber-400" />
                <span className="text-[9px]">Dark</span>
              </>
            ) : (
              <>
                <Sun size={13} className="text-amber-300" />
                <span className="text-[9px]">Light</span>
              </>
            )}
          </button>

        </div>

        {/* Logoff action */}
        <button
          id="logout-btn"
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium bg-red-950/20 hover:bg-red-900/30 text-rose-400 hover:text-rose-300 border border-thin border-rose-900/60 transition-all cursor-pointer"
        >
          <LogOut size={13} />
          <span>{lang === 'EN' ? 'Sign Out' : 'خروج'}</span>
        </button>

        <div className="text-[8px] font-mono text-slate-500 text-center leading-tight">
          PAK LOCAL TIME: 11:08 AM<br/>
          PUNJAB HEALTH ACCREDITED
        </div>
      </div>
    </aside>
  );
}
