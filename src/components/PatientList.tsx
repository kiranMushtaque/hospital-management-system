/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Search, Users, Trash2, Edit2, ClipboardList, CreditCard, ChevronRight,
  Filter, Eye, ChevronLeft, ArrowDownToLine, RefreshCw, AlertCircle, Sparkles, Check
} from 'lucide-react';
import { formatDate } from '../utils';
import { Patient } from '../types';

interface PatientListProps {
  currentUser: any;
  onSelectPatient: (patient: Patient) => void;
  onEditPatient: (patient: Patient) => void;
  onNewVisit: (patient: Patient) => void;
  onPrintCard: (patient: Patient) => void;
  lang: 'EN' | 'UR';
  t: (key: string) => string;
}

export default function PatientList({ 
  currentUser, onSelectPatient, onEditPatient, onNewVisit, onPrintCard, lang, t 
}: PatientListProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filter states
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [bloodFilter, setBloodFilter] = useState('');
  const [insuranceFilter, setInsuranceFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Delete confirm dialogue controls
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState('');

  const fetchPatientsList = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/patients');
      if (res.ok) {
        const data = await res.json();
        setPatients(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientsList();
  }, [deleteSuccess]);

  // Client-side filtering logic
  const filteredPatients = patients.filter(p => {
    // Search query match
    const q = search.toLowerCase();
    const queryMatch = !search || 
      p.name.toLowerCase().includes(q) || 
      p.mrn.toLowerCase().includes(q) || 
      (p.cnic && p.cnic.includes(q)) || 
      (p.phone && p.phone.includes(q));

    // Gender match
    const genderMatch = !genderFilter || p.gender === genderFilter;

    // Blood match
    const bloodMatch = !bloodFilter || p.bloodGroup === bloodFilter;

    // Insurance match
    const insMatch = !insuranceFilter || 
      (insuranceFilter === 'None' && (!p.insuranceProvider || p.insuranceProvider === 'None' || p.insuranceProvider === 'NONE')) ||
      (insuranceFilter !== 'None' && p.insuranceProvider === insuranceFilter);

    // Date range match
    let dateMatch = true;
    if (p.createdAt) {
      const createdDate = new Date(p.createdAt);
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0,0,0,0);
        if (createdDate < start) dateMatch = false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23,59,59,99)
        if (createdDate > end) dateMatch = false;
      }
    }

    return queryMatch && genderMatch && bloodMatch && insMatch && dateMatch;
  });

  // Pagination calculations
  const totalItems = filteredPatients.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPatients.slice(indexOfFirstItem, indexOfLastItem);

  // Set page constraints
  useEffect(() => {
    setCurrentPage(1);
  }, [search, genderFilter, bloodFilter, insuranceFilter, startDate, endDate, itemsPerPage]);

  // Export CSV handler
  const handleExportCSV = () => {
    if (filteredPatients.length === 0) return;
    
    // Header Row
    const headers = ["MRN", "Name", "Age", "Gender", "Blood Group", "CNIC", "Phone", "WhatsApp", "Address", "City", "Province", "Insurance", "Policy Number", "Registration Date"];
    
    const rows = filteredPatients.map(p => [
      p.mrn,
      p.name,
      p.age,
      p.gender,
      p.bloodGroup || 'N/A',
      p.cnic || 'N/A',
      p.phone || 'N/A',
      (p as any).whatsapp || 'N/A',
      (p.address || '').replace(/,/g, ' '),
      (p as any).city || 'Lahore',
      (p as any).province || 'Punjab',
      p.insuranceProvider || 'None',
      p.insurancePolicyNumber || 'N/A',
      formatDate(p.createdAt)
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Mayo_HMS_Patients_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Perform soft delete
  const handleDeletePatient = async () => {
    if (!patientToDelete) return;
    try {
      const res = await fetch(`/api/patients/${patientToDelete.mrn}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setDeleteSuccess(`Patient ${patientToDelete.name} was archived successfully.`);
        setTimeout(() => setDeleteSuccess(''), 2500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPatientToDelete(null);
    }
  };

  return (
    <div className="space-y-6" id="patient-list-viewport">
      
      {/* Toast Archive Notification */}
      {deleteSuccess && (
        <div className="fixed top-4 right-4 z-50 p-4 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-2 text-xs shadow-2xl animate-bounce">
          <Check size={16} />
          <span>{deleteSuccess}</span>
        </div>
      )}

      {/* Stats Counter Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="list-stats-badges">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-5 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="block text-[10px] uppercase font-bold text-slate-400">Archived Enrolled (کل داخل مریض)</span>
            <span className="block text-xl font-bold font-mono text-slate-800 dark:text-white">{patients.length}</span>
          </div>
          <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center">
            <Users size={18} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-5 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="block text-[10px] uppercase font-bold text-slate-400">Filtered Patients (موجودہ کٹ آف)</span>
            <span className="block text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{filteredPatients.length}</span>
          </div>
          <div className="w-10 h-10 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center">
            <Filter size={18} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-5 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="block text-[10px] uppercase font-bold text-slate-400">Insured Claims (صحت کارڈ / اسکیم)</span>
            <span className="block text-xl font-bold font-mono text-sky-505 dark:text-sky-400">
              {patients.filter(p => p.insuranceProvider && p.insuranceProvider !== 'None' && p.insuranceProvider !== 'NONE').length}
            </span>
          </div>
          <div className="w-10 h-10 bg-sky-500/10 text-sky-500 rounded-xl flex items-center justify-center">
            <Sparkles size={17} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-5 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="block text-[10px] uppercase font-bold text-slate-400">Gender Allocation</span>
            <span className="block text-[11px] font-mono font-bold text-slate-650 dark:text-slate-350">
              M: {patients.filter(p => p.gender === 'MALE').length} | F: {patients.filter(p => p.gender === 'FEMALE').length}
            </span>
          </div>
          <div className="w-10 h-10 bg-purple-500/10 text-purple-500 rounded-xl flex items-center justify-center font-bold text-xs uppercase font-mono">
            M/F
          </div>
        </div>
      </div>

      {/* Advanced Filter Chest layout */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-xs space-y-4 text-left" id="patient-bento-filters">
        
        <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800/80">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-450 flex items-center gap-1.5">
            <Filter size={15} className="text-emerald-500" />
            <span>Search & Diagnostic Filters (مریض کی تلاش اور فلٹر)</span>
          </span>
          <button
            id="btn-export-csv"
            onClick={handleExportCSV}
            disabled={filteredPatients.length === 0}
            className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:text-emerald-500 dark:hover:text-emerald-450 border border-slate-200 dark:border-slate-800 text-[11px] font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-all uppercase"
          >
            <ArrowDownToLine size={13} />
            <span>Export CSV Sheet</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          
          {/* Main search */}
          <div className="md:col-span-2 space-y-1 text-xs">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-tight">Interactive search (نام یا شناختی کارڈ)</span>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400">
                <Search size={14} />
              </span>
              <input
                id="filter-search-input"
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Name, MRN, CNIC or Phone..."
                className="w-full bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 pl-9 pr-3 py-2 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-450 focus:outline-emerald-500"
              />
            </div>
          </div>

          {/* Gender Select */}
          <div className="space-y-1 text-xs">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-tight">Gender Identity (جنس)</span>
            <select
              id="filter-gender-select"
              value={genderFilter}
              onChange={e => setGenderFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 p-2 rounded-xl text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <option value="">All Genders</option>
              <option value="MALE">Male (مرد)</option>
              <option value="FEMALE">Female (عورت)</option>
              <option value="OTHER">Other (بلحاظ دگر)</option>
            </select>
          </div>

          {/* Blood group select */}
          <div className="space-y-1 text-xs">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-tight">Blood Group (بلڈ گروپ)</span>
            <select
              id="filter-blood-select"
              value={bloodFilter}
              onChange={e => setBloodFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 p-2 rounded-xl text-xs text-slate-700 dark:text-slate-300 cursor-pointer text-center"
            >
              <option value="">All Groups</option>
              {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </div>

          {/* Insurance Provider */}
          <div className="space-y-1 text-xs">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-tight">Coverage / Scheme (انشورنس)</span>
            <select
              id="filter-insurance-select"
              value={insuranceFilter}
              onChange={e => setInsuranceFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 p-2 rounded-xl text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <option value="">All Schemes</option>
              <option value="None">None (نفسی بلنگ)</option>
              <option value="Sehat Sahulat Card">KPK/Punjab Sehat Card</option>
              <option value="EFU">EFU Private Life</option>
              <option value="Jubilee">Jubilee Micro-Enterprise</option>
              <option value="State Life">State Life Co.</option>
              <option value="IGI">IGI Insurance</option>
              <option value="Other">Other Private</option>
            </select>
          </div>

          {/* Date Range Start */}
          <div className="space-y-1 text-xs">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-tight">Start Date / تاریخ سے</span>
            <input
              id="filter-start-date"
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 p-1.5 rounded-xl text-xs text-slate-755 dark:text-slate-305"
            />
          </div>

        </div>
      </div>

      {/* Main Table Segment */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden" id="patient-data-table">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-50/75 dark:bg-slate-950/30 border-b border-slate-100 dark:border-slate-850 text-slate-400 uppercase tracking-wider font-bold text-[10px]">
                <th className="py-4 px-5">MRN / مریض آئی ڈی</th>
                <th className="py-4 px-2">Diagnostic Photo</th>
                <th className="py-4 px-4">Full Patient Name / نام</th>
                <th className="py-4 px-4">CNIC / شناختی کارڈ</th>
                <th className="py-4 px-4">Phone Contact / فون</th>
                <th className="py-4 px-3 text-center">Blood Group</th>
                <th className="py-4 px-4">Registry Date</th>
                <th className="py-4 px-3 text-center">Status</th>
                <th className="py-4 px-5 text-right font-sans">Administrative Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <RefreshCw className="animate-spin mx-auto mb-2 text-emerald-500" size={24} />
                    <span>Accessing patient clinical registers...</span>
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 space-y-2">
                    <AlertCircle className="mx-auto text-slate-300" size={32} />
                    <p className="font-semibold">{t('no_records')}</p>
                    <p className="text-[10px] text-slate-400/80">No matches found for parameters within this index cycle.</p>
                  </td>
                </tr>
              ) : (
                currentItems.map(p => (
                  <tr key={p.mrn} className="hover:bg-slate-50/60 dark:hover:bg-slate-950/15 transition-all text-slate-700 dark:text-slate-300">
                    {/* MRN Code */}
                    <td className="py-3 px-5 font-mono font-extrabold text-emerald-600 dark:text-emerald-450">
                      {p.mrn}
                    </td>

                    {/* Image Avatar */}
                    <td className="py-3 px-2">
                      <img 
                        src={p.photoUrl || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=120&auto=format&fit=crop`} 
                        alt="Patient avatar" 
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-xl object-cover border border-slate-100 dark:border-slate-800"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=120&auto=format&fit=crop";
                        }}
                      />
                    </td>

                    {/* Patient Name */}
                    <td className="py-3 px-4 font-extrabold text-slate-900 dark:text-white">
                      <div>
                        <span>{p.name}</span>
                        {(p as any).fullNameUrdu && (
                          <span className="block text-right pr-4 font-serif text-[10px] text-slate-400">{(p as any).fullNameUrdu}</span>
                        )}
                        <span className="block text-[10px] font-normal text-slate-400 mt-0.5">{p.age} Yrs &bull; {p.gender}</span>
                      </div>
                    </td>

                    {/* CNIC Number */}
                    <td className="py-3 px-4 font-mono font-medium">
                      {p.cnic || '35201-XXXXXXX-X'}
                    </td>

                    {/* Secondary Phone contact */}
                    <td className="py-3 px-4 font-mono">
                      {p.phone || '0300-XXXXXXX'}
                    </td>

                    {/* Blood Badge */}
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-md font-extrabold text-[10px] font-mono bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-950/55">
                        {p.bloodGroup || 'O+'}
                      </span>
                    </td>

                    {/* Created Date */}
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {formatDate(p.createdAt)}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span>Active</span>
                      </span>
                    </td>

                    {/* Action Operations menu */}
                    <td className="py-3 px-5 text-right space-x-1 whitespace-nowrap">
                      {/* View dossier */}
                      <button
                        id={`btn-view-${p.mrn}`}
                        onClick={() => onSelectPatient(p)}
                        className="p-1 px-2.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-805 text-slate-600 dark:text-slate-350 border border-slate-200 dark:border-slate-800 font-bold rounded-lg cursor-pointer transition-all uppercase text-[9.5px] items-center inline-flex gap-1"
                        title="View permanent EHR database files"
                      >
                        <Eye size={11} />
                        <span>Profile</span>
                      </button>

                      {/* Edit Patient */}
                      <button
                        id={`btn-edit-${p.mrn}`}
                        onClick={() => onEditPatient(p)}
                        className="p-1 px-2 bg-slate-50 dark:bg-slate-950 hover:bg-amber-100/40 dark:hover:bg-amber-950/15 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 border border-slate-200 dark:border-slate-800 rounded-lg cursor-pointer transition-all inline-flex items-center"
                        title="Edit Demographics Form"
                      >
                        <Edit2 size={11} />
                      </button>

                      {/* New OPD Visit ticket */}
                      <button
                        id={`btn-opd-${p.mrn}`}
                        onClick={() => onNewVisit(p)}
                        className="p-1 px-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-200/50 rounded-lg cursor-pointer transition-all inline-flex items-center font-bold text-[9.5px] gap-0.5"
                        title="Formulate new clinic treatment encounter"
                      >
                        <ClipboardList size={11} />
                        <span>Visit</span>
                      </button>

                      {/* Print identity card */}
                      <button
                        id={`btn-card-${p.mrn}`}
                        onClick={() => onPrintCard(p)}
                        className="p-1 px-2 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-805 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-lg cursor-pointer transition-all inline-flex items-center"
                        title="Review ID Card Printing parameters"
                      >
                        <CreditCard size={11} />
                      </button>

                      {/* Soft Archive Delete */}
                      <button
                        id={`btn-delete-${p.mrn}`}
                        onClick={() => {
                          setPatientToDelete(p);
                          setDeleteConfirmText('');
                        }}
                        className="p-1 px-2 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-500 text-rose-600 hover:text-white border border-rose-100 dark:border-rose-900/40 rounded-lg cursor-pointer transition-all inline-flex items-center"
                        title="Archive permanent ledger delete"
                      >
                        <Trash2 size={11} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-850 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs" id="table-pagination-nav">
          <div className="flex items-center gap-2">
            <span className="text-slate-450 font-semibold">Rows per page:</span>
            <select
              id="pagination-size-select"
              value={itemsPerPage}
              onChange={e => setItemsPerPage(Number(e.target.value))}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 cursor-pointer focus:outline-emerald-500 font-mono"
            >
              {[10, 25, 50].map(sz => (
                <option key={sz} value={sz}>{sz}</option>
              ))}
            </select>
            <span className="text-slate-400 font-mono">
              Showing {totalItems > 0 ? indexOfFirstItem + 1 : 0}-{Math.min(indexOfLastItem, totalItems)} of {totalItems} patients
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              id="btn-page-prev"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 border rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="px-3 py-1 bg-white dark:bg-slate-900 border rounded-lg font-mono font-bold">
              {currentPage} / {totalPages}
            </span>
            <button
              id="btn-page-next"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 border rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>

      </div>

      {/* DELETE CONFIRM DIALOG MODAL */}
      {patientToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="delete-patient-modal">
          <div className="bg-white dark:bg-slate-900 border border-rose-220/40 dark:border-slate-800 rounded-3xl max-w-md w-full shadow-2xl p-6 text-left space-y-5 animate-scale-up">
            
            <div className="flex gap-3.5 items-start">
              <div className="w-10 h-10 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-full flex items-center justify-center shrink-0">
                <AlertCircle size={20} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">Confirm Patient Archival</h3>
                <p className="text-[11.5px] text-slate-500 leading-relaxed">
                  You are about to archive patient <strong>{patientToDelete.name} ({patientToDelete.mrn})</strong>. This will soft-delete their demographic records from clinical registers.
                </p>
              </div>
            </div>

            <div className="space-y-1.5 bg-rose-50/40 dark:bg-slate-950/20 p-3 rounded-2xl border border-rose-100 dark:border-slate-800/60 text-xs">
              <span className="block font-bold text-rose-800 dark:text-rose-400">To confirm, please type <code className="bg-rose-100 dark:bg-rose-950/70 border border-rose-200/50 px-1 py-0.5 rounded font-mono font-bold text-[10px]">{patientToDelete.mrn}</code>:</span>
              <input
                id="delete-confirm-text"
                type="text"
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                placeholder="Type MRN value..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-lg text-slate-800 dark:text-white font-mono focus:outline-rose-500 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 font-sans">
              <button
                id="btn-delete-cancel"
                onClick={() => setPatientToDelete(null)}
                className="border bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 text-slate-650 dark:text-slate-350 px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all"
              >
                Keep File
              </button>
              <button
                id="btn-delete-confirm"
                disabled={deleteConfirmText !== patientToDelete.mrn}
                onClick={handleDeletePatient}
                className="bg-rose-600 hover:bg-rose-500 disabled:bg-rose-300 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all shadow-md cursor-pointer"
              >
                Archive Delete
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
