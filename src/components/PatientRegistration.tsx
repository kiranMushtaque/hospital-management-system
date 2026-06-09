/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  UserPlus, Phone, ShieldCheck, HeartPulse, FileText, AlertTriangle, 
  MapPin, Printer, Camera, HelpCircle, Check, Search, CreditCard, Sparkles
} from 'lucide-react';
import { validateCNIC } from '../utils';
import { Patient } from '../types';

interface PatientRegistrationProps {
  currentUser: any;
  onSuccess: (patient: Patient) => void;
  lang: 'EN' | 'UR';
  t: (key: string) => string;
}

export default function PatientRegistration({ currentUser, onSuccess, lang, t }: PatientRegistrationProps) {
  // Form states
  const [formData, setFormData] = useState({
    fullName: '',
    fullNameUrdu: '',
    fatherName: '',
    dateOfBirth: '',
    age: '',
    gender: 'MALE',
    bloodGroup: 'O+',
    cnic: '',
    phone: '',
    whatsapp: '',
    sameAsWhatsApp: true,
    email: '',
    address: '',
    city: '',
    province: 'Punjab',
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelation: '',
    insuranceType: 'None',
    policyNumber: '',
    insuranceCompany: '',
    photoUrl: '',
  });

  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [generateMrn, setGenerateMrn] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string>('');

  // Search state for registration page top bar quick check
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // Fetch next MRN on mount
  useEffect(() => {
    const fetchNextMrn = async () => {
      try {
        const res = await fetch('/api/patients/mrn/generate');
        if (res.ok) {
          const data = await res.json();
          setGenerateMrn(data.mrn);
        } else {
          // Fallback
          const randomSuffix = Math.floor(1000 + Math.random() * 9000);
          setGenerateMrn(`MRN-2024-${randomSuffix}`);
        }
      } catch {
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        setGenerateMrn(`MRN-2024-${randomSuffix}`);
      }
    };
    fetchNextMrn();
  }, [success]);

  // Handle live CNIC formatting
  const handleCnicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9]/g, '');
    if (val.length > 13) val = val.slice(0, 13);
    
    let formatted = val;
    if (val.length > 5 && val.length <= 12) {
      formatted = `${val.slice(0, 5)}-${val.slice(5)}`;
    } else if (val.length > 12) {
      formatted = `${val.slice(0, 5)}-${val.slice(5, 12)}-${val.slice(12)}`;
    }
    
    setFormData(prev => ({ ...prev, cnic: formatted }));
    
    // Validate on the fly
    if (val.length === 13) {
      if (validateCNIC(formatted)) {
        setErrors(prev => {
          const n = { ...prev };
          delete n.cnic;
          return n;
        });
      } else {
        setErrors(prev => ({ ...prev, cnic: 'Invalid Pakistani CNIC pattern (12345-1234567-1)' }));
      }
    } else if (val.length > 0) {
      setErrors(prev => ({ ...prev, cnic: 'CNIC must be 13 digits' }));
    } else {
      setErrors(prev => {
        const n = { ...prev };
        delete n.cnic;
        return n;
      });
    }
  };

  // Handle Phone raw 03XX-XXXXXXX format validation
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'phone' | 'whatsapp' | 'emergencyPhone') => {
    let val = e.target.value.replace(/[^0-9]/g, '');
    if (val.length > 11) val = val.slice(0, 11);

    let formatted = val;
    if (val.length > 4) {
      formatted = `${val.slice(0, 4)}-${val.slice(4)}`;
    }

    setFormData(prev => {
      const updated = { ...prev, [fieldName]: formatted };
      if (fieldName === 'phone' && prev.sameAsWhatsApp) {
        updated.whatsapp = formatted;
      }
      return updated;
    });

    // Validate phone
    const pattern = /^03\d{2}-\d{7}$/;
    if (val.length === 11) {
      if (pattern.test(formatted)) {
        setErrors(prev => {
          const n = { ...prev };
          delete n[fieldName];
          return n;
        });
      } else {
        setErrors(prev => ({ ...prev, [fieldName]: 'Invalid Mobile Format (must start with 03XX)' }));
      }
    } else if (val.length > 0) {
      setErrors(prev => ({ ...prev, [fieldName]: 'Phone must be 11 digits' }));
    } else {
      setErrors(prev => {
        const n = { ...prev };
        delete n[fieldName];
        return n;
      });
    }
  };

  // Auto-calculate age from dateOfBirth
  useEffect(() => {
    if (formData.dateOfBirth) {
      const birth = new Date(formData.dateOfBirth);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        calculatedAge--;
      }
      
      if (calculatedAge >= 0) {
        setFormData(prev => ({ ...prev, age: String(calculatedAge) }));
      }
    }
  }, [formData.dateOfBirth]);

  // Photo uploading mockup
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const resultString = reader.result as string;
        setPhotoPreview(resultString);
        setFormData(prev => ({ ...prev, photoUrl: resultString }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Trigger quick avatar options
  const setDemoPhoto = (gender: string) => {
    const urls = {
      MALE: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=120&auto=format&fit=crop",
      FEMALE: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=120&auto=format&fit=crop",
      OTHER: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=120&auto=format&fit=crop"
    };
    const chosen = urls[gender as 'MALE' | 'FEMALE' | 'OTHER'] || urls.MALE;
    setPhotoPreview(chosen);
    setFormData(prev => ({ ...prev, photoUrl: chosen }));
  };

  // Validate all fields on submit
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name (English) is required';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.phone) newErrors.phone = 'Phone number is required';
    if (!formData.cnic) newErrors.cnic = 'CNIC is required';
    if (!formData.emergencyName.trim()) newErrors.emergencyName = 'Emergency contact name is required';
    if (!formData.emergencyPhone) newErrors.emergencyPhone = 'Emergency contact phone is required';
    
    // Check form fields formats
    if (formData.cnic && !validateCNIC(formData.cnic)) newErrors.cnic = 'Invalid CNIC format';
    const phonePattern = /^03\d{2}-\d{7}$/;
    if (formData.phone && !phonePattern.test(formData.phone)) newErrors.phone = 'Invalid phone format';
    if (formData.whatsapp && !phonePattern.test(formData.whatsapp)) newErrors.whatsapp = 'Invalid WhatsApp format';
    if (formData.emergencyPhone && !phonePattern.test(formData.emergencyPhone)) newErrors.emergencyPhone = 'Invalid emergency phone format';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      const firstError = Object.values(errors)[0] || "Please check required fields.";
      return;
    }

    setSubmitting(true);
    setSuccess('');

    try {
      const payload = {
        name: formData.fullName,
        fullNameUrdu: formData.fullNameUrdu,
        fatherName: formData.fatherName,
        dateOfBirth: formData.dateOfBirth,
        age: Number(formData.age),
        gender: formData.gender,
        bloodGroup: formData.bloodGroup,
        cnic: formData.cnic,
        phone: formData.phone,
        whatsapp: formData.whatsapp,
        email: formData.email,
        address: formData.address,
        city: formData.city,
        province: formData.province,
        emergencyContactName: formData.emergencyName,
        emergencyContactPhone: formData.emergencyPhone,
        emergencyRelation: formData.emergencyRelation,
        insuranceProvider: formData.insuranceType,
        insurancePolicyNumber: formData.policyNumber,
        insuranceCompany: formData.insuranceCompany,
        photoUrl: formData.photoUrl || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=120&auto=format&fit=crop`,
        staffId: currentUser?.id || "SYSTEM"
      };

      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to register patient");
      }

      const newPatient = await res.json();
      setSuccess(`Success! Patient ${newPatient.name} successfully registered with MRN: ${newPatient.mrn}`);
      
      // Reset Form fields
      setFormData({
        fullName: '',
        fullNameUrdu: '',
        fatherName: '',
        dateOfBirth: '',
        age: '',
        gender: 'MALE',
        bloodGroup: 'O+',
        cnic: '',
        phone: '',
        whatsapp: '',
        sameAsWhatsApp: true,
        email: '',
        address: '',
        city: '',
        province: 'Punjab',
        emergencyName: '',
        emergencyPhone: '',
        emergencyRelation: '',
        insuranceType: 'None',
        policyNumber: '',
        insuranceCompany: '',
        photoUrl: '',
      });
      setPhotoPreview('');
      
      setTimeout(() => {
        onSuccess(newPatient);
      }, 1500);

    } catch (err: any) {
      setErrors({ server: err.message || "An unexpected network error occurred." });
    } finally {
      setSubmitting(false);
    }
  };

  // Search existing during registration
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        try {
          const res = await fetch(`/api/patients?query=${encodeURIComponent(searchQuery)}`);
          if (res.ok) {
            const data = await res.json();
            setSearchResults(data);
            setShowSearchDropdown(true);
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        setSearchResults([]);
        setShowSearchDropdown(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  return (
    <div className="space-y-6" id="patient-registration-view">
      
      {/* Quick Search Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 rounded-3xl text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-white/5 rounded-full pointer-events-none"></div>
        <div className="space-y-1 relative z-10">
          <h2 className="text-xl font-extrabold flex items-center gap-2">
            <UserPlus size={22} className="text-emerald-250" />
            <span>Patient Admission & Enrollment Desk &bull; مریض کا اندراج</span>
          </h2>
          <p className="text-xs text-emerald-100 font-medium">
            Register new out-patients and compile permanent Electronic Medical Records.
          </p>
        </div>

        {/* Quick check search */}
        <div className="relative w-full max-w-sm shrink-0 index-50">
          <span className="absolute left-3 top-2.5 text-slate-300">
            <Search size={15} />
          </span>
          <input
            id="reg-check-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="CNIC / MRN Lookup before saving..."
            className="w-full bg-white/10 border border-white/20 pl-9 pr-3 py-2 text-xs rounded-xl text-white placeholder-slate-200/70 focus:outline-hidden focus:bg-white focus:text-slate-900 transition-all"
          />
          {showSearchDropdown && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 text-slate-800 dark:text-slate-200 max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              <div className="p-2 text-[10px] uppercase font-bold text-slate-400 bg-slate-50 dark:bg-slate-950/40">Similar Patient Exists (ہمشکل ریکارڈ):</div>
              {searchResults.map(p => (
                <div key={p.mrn} className="p-3 text-xs flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer">
                  <div>
                    <span className="font-extrabold block">{p.name} ({p.age}y &bull; {p.gender})</span>
                    <span className="text-[10px] text-slate-400 font-mono">CNIC: {p.cnic} &bull; {p.phone}</span>
                  </div>
                  <span className="text-[10px] font-mono bg-emerald-50 dark:bg-emerald-950/45 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded font-bold">{p.mrn}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border-l-4 border-emerald-500 rounded-2xl flex items-center gap-3 text-xs font-semibold text-emerald-700 dark:text-emerald-400 animate-fade-in" id="reg-success">
          <Check className="text-emerald-500 shrink-0" size={18} />
          <span>{success}</span>
        </div>
      )}

      {errors.server && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border-l-4 border-rose-500 rounded-2xl flex items-center gap-3 text-xs font-semibold text-rose-600 dark:text-rose-450 animate-fade-in" id="reg-error-server">
          <AlertTriangle className="text-rose-500 shrink-0" size={18} />
          <span>{errors.server}</span>
        </div>
      )}

      {/* Main Registration Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-8" id="patient-reg-form">
        
        {/* Top block: Auto MRN allocation */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-50 dark:bg-slate-950/45 border border-slate-100 dark:border-slate-800 rounded-2xl gap-3">
          <div className="flex items-center gap-2">
            <HeartPulse size={18} className="text-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Automated Record Number Allocation &bull; خودکار ایم آر این</span>
          </div>
          <div className="flex items-center gap-2 font-mono">
            <span className="text-[10px] text-slate-400">NEXT ALLOCATED ID:</span>
            <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900 border px-3 py-1 rounded-lg">
              {generateMrn || 'FETCHING...'}
            </span>
          </div>
        </div>

        {/* Section 1: Demographics */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800/80 pb-2 flex items-center gap-1.5">
            <CreditCard size={14} className="text-emerald-500" />
            <span>1. Patient Demographics (مریض کی معلومات)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Full Name English */}
            <div className="md:col-span-4 space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                Full Name (English) <span className="text-rose-500">*</span> / پورا نام انگریزی
              </label>
              <input
                id="reg-input-fullname"
                type="text"
                required
                value={formData.fullName}
                onChange={e => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                placeholder="e.g. Asma Bibi"
                className="w-full bg-slate-50 dark:bg-slate-950/10 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-emerald-500 font-medium"
              />
              {errors.fullName && <p className="text-[10px] text-rose-500">{errors.fullName}</p>}
            </div>

            {/* Full Name Urdu */}
            <div className="md:col-span-4 space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                Full Name (Urdu) / پورا نام اردو
              </label>
              <input
                id="reg-input-fullnameurdu"
                type="text"
                value={formData.fullNameUrdu}
                onChange={e => setFormData(prev => ({ ...prev, fullNameUrdu: e.target.value }))}
                placeholder="مثال: عاصمہ بی بی"
                className="w-full bg-slate-50 dark:bg-slate-950/10 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-emerald-500 text-right font-serif"
              />
            </div>

            {/* Father Name */}
            <div className="md:col-span-4 space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                Father / Husband Name / والد کا نام
              </label>
              <input
                id="reg-input-fathername"
                type="text"
                value={formData.fatherName}
                onChange={e => setFormData(prev => ({ ...prev, fatherName: e.target.value }))}
                placeholder="e.g. Muhammad Jameel"
                className="w-full bg-slate-50 dark:bg-slate-950/10 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-emerald-500"
              />
            </div>

            {/* DOB */}
            <div className="md:col-span-3 space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                Date of Birth <span className="text-rose-500">*</span> / تاریخِ پیدائش
              </label>
              <input
                id="reg-input-dob"
                type="date"
                required
                value={formData.dateOfBirth}
                onChange={e => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                className="w-full bg-slate-50 dark:bg-slate-950/10 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-emerald-500"
              />
              {errors.dateOfBirth && <p className="text-[10px] text-rose-500">{errors.dateOfBirth}</p>}
            </div>

            {/* Auto-calc Age */}
            <div className="md:col-span-2 space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                Age (Auto-calc) / عمر
              </label>
              <input
                id="reg-input-age"
                type="number"
                readOnly
                value={formData.age}
                placeholder="Age"
                className="w-full bg-slate-100 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 p-2.5 rounded-xl text-xs text-slate-500 font-mono font-bold"
              />
            </div>

            {/* Gender */}
            <div className="md:col-span-3 space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                Gender <span className="text-rose-500">*</span> / جنس
              </label>
              <select
                id="reg-input-gender"
                value={formData.gender}
                onChange={e => {
                  setFormData(prev => ({ ...prev, gender: e.target.value }));
                  if (!photoPreview) setDemoPhoto(e.target.value);
                }}
                className="w-full bg-slate-50 dark:bg-slate-950/10 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-emerald-500 cursor-pointer"
              >
                <option value="MALE">Male (مرد)</option>
                <option value="FEMALE">Female (عورت)</option>
                <option value="OTHER">Other (بلحاظ دگر)</option>
              </select>
            </div>

            {/* Blood Group */}
            <div className="md:col-span-4 space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                Blood Group / بلڈ گروپ
              </label>
              <select
                id="reg-input-blood"
                value={formData.bloodGroup}
                onChange={e => setFormData(prev => ({ ...prev, bloodGroup: e.target.value }))}
                className="w-full bg-slate-50 dark:bg-slate-950/10 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-emerald-500 cursor-pointer"
              >
                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Patient Photo (With direct preview before save) */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800/80 pb-2 flex items-center gap-1.5">
            <Camera size={14} className="text-emerald-500" />
            <span>2. Patient Photograph (مریض کی تصویر)</span>
          </h3>

          <div className="flex flex-col sm:flex-row items-center gap-5 bg-slate-50 dark:bg-slate-950/10 p-4 border border-slate-100 dark:border-slate-800 rounded-2xl">
            <div className="relative w-24 h-24 shrink-0 bg-slate-200 dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-350 dark:border-slate-705 overflow-hidden flex items-center justify-center">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-slate-400 py-4">
                  <Camera size={20} className="mx-auto mb-1 opacity-70" />
                  <span className="text-[7.5px] uppercase font-bold tracking-tight">No Image</span>
                </div>
              )}
            </div>

            <div className="space-y-2 text-center sm:text-left">
              <p className="text-[10px] text-slate-400 font-medium">
                Upload a real medical diagnostic avatar photo or pick a default mock profile based on gender. Max size 2MB (JPEG, PNG).
              </p>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                <label className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] cursor-pointer transition-all uppercase tracking-wide flex items-center gap-1">
                  <Camera size={11} />
                  <span>Choose Photo File</span>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
                <button
                  type="button"
                  id="reg-btn-demoimg"
                  onClick={() => setDemoPhoto(formData.gender)}
                  className="border hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all"
                >
                  Apply System Avatar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Permanent Address & KYC */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800/80 pb-2 flex items-center gap-1.5">
            <MapPin size={14} className="text-emerald-500" />
            <span>3. Residential Credentials & Permanent KYC Contacts</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* CNIC Number */}
            <div className="md:col-span-4 space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                CNIC Number (13 Digits) <span className="text-rose-500">*</span> / قومی شناختی کارڈ
              </label>
              <input
                id="reg-input-cnic"
                type="text"
                required
                value={formData.cnic}
                onChange={handleCnicChange}
                placeholder="35201-XXXXXXX-X"
                className="w-full bg-slate-50 dark:bg-slate-950/10 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs text-slate-900 dark:text-white font-mono focus:outline-emerald-500"
              />
              {errors.cnic && <p className="text-[10px] text-rose-500">{errors.cnic}</p>}
            </div>

            {/* Phone Number */}
            <div className="md:col-span-4 space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                Primary Phone <span className="text-rose-500">*</span> / موبائل نمبر
              </label>
              <input
                id="reg-input-phone"
                type="text"
                required
                value={formData.phone}
                onChange={e => handlePhoneChange(e, 'phone')}
                placeholder="0300-XXXXXXX"
                className="w-full bg-slate-50 dark:bg-slate-950/10 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs text-slate-900 dark:text-white font-mono focus:outline-emerald-500"
              />
              {errors.phone && <p className="text-[10px] text-rose-500">{errors.phone}</p>}
            </div>

            {/* WhatsApp Number same or different */}
            <div className="md:col-span-4 space-y-1">
              <div className="flex justify-between items-center">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  WhatsApp Number / واٹس ایپ
                </label>
                <label className="inline-flex items-center gap-1 text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold cursor-pointer">
                  <input
                    id="checkbox-sameas-whatsapp"
                    type="checkbox"
                    checked={formData.sameAsWhatsApp}
                    onChange={e => {
                      const checked = e.target.checked;
                      setFormData(prev => ({
                        ...prev,
                        sameAsWhatsApp: checked,
                        whatsapp: checked ? prev.phone : ''
                      }));
                    }}
                    className="rounded border-slate-300 dark:border-slate-750 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Same as Mobile</span>
                </label>
              </div>
              <input
                id="reg-input-whatsapp"
                type="text"
                disabled={formData.sameAsWhatsApp}
                value={formData.whatsapp}
                onChange={e => handlePhoneChange(e, 'whatsapp')}
                placeholder="0300-XXXXXXX"
                className={`w-full border p-2.5 rounded-xl text-xs text-slate-900 dark:text-white font-mono focus:outline-emerald-500 ${
                  formData.sameAsWhatsApp ? 'bg-slate-100 dark:bg-slate-950/40 text-slate-450 border-slate-200 dark:border-slate-850' : 'bg-slate-50 dark:bg-slate-950/10 border-slate-200 dark:border-slate-805'
                }`}
              />
              {errors.whatsapp && <p className="text-[10px] text-rose-500">{errors.whatsapp}</p>}
            </div>

            {/* Email Address */}
            <div className="md:col-span-4 space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                Email Address (Optional) / ای میل
              </label>
              <input
                id="reg-input-email"
                type="email"
                value={formData.email}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="e.g. patrick@gmail.com"
                className="w-full bg-slate-50 dark:bg-slate-950/10 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-emerald-500"
              />
            </div>

            {/* Complete Residence Address */}
            <div className="md:col-span-8 space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                Home Residence Address / گھر کا پتہ
              </label>
              <input
                id="reg-input-address"
                type="text"
                value={formData.address}
                onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="e.g. House 14-A, Street 2, Anarkali Lahore"
                className="w-full bg-slate-50 dark:bg-slate-950/10 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-emerald-500"
              />
            </div>

            {/* City */}
            <div className="md:col-span-6 space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                City / شہر
              </label>
              <input
                id="reg-input-city"
                type="text"
                value={formData.city}
                onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
                placeholder="e.g. Lahore"
                className="w-full bg-slate-50 dark:bg-slate-950/10 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-emerald-500"
              />
            </div>

            {/* Province State */}
            <div className="md:col-span-6 space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                Province Administrative State / صوبہ
              </label>
              <select
                id="reg-input-province"
                value={formData.province}
                onChange={e => setFormData(prev => ({ ...prev, province: e.target.value }))}
                className="w-full bg-slate-50 dark:bg-slate-950/10 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-emerald-500 cursor-pointer"
              >
                {['Punjab', 'Sindh', 'Khyber Pakhtunkhwa', 'Balochistan', 'Gilgit-Baltistan', 'Azad Kashmir', 'Islamabad Capital'].map(prv => (
                  <option key={prv} value={prv}>{prv}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: Emergency Contacts */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800/80 pb-2 flex items-center gap-1.5">
            <Phone size={14} className="text-emerald-500" />
            <span>4. Emergency Contact Personnel Info (ہنگامی رابطہ)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Contact Name */}
            <div className="md:col-span-4 space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                Contact Full Name <span className="text-rose-500">*</span> / رابطہ کار کا نام
              </label>
              <input
                id="reg-input-emergname"
                type="text"
                required
                value={formData.emergencyName}
                onChange={e => setFormData(prev => ({ ...prev, emergencyName: e.target.value }))}
                placeholder="e.g.Muhammad Saleem"
                className="w-full bg-slate-50 dark:bg-slate-950/10 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-emerald-500"
              />
              {errors.emergencyName && <p className="text-[10px] text-rose-500">{errors.emergencyName}</p>}
            </div>

            {/* Relation */}
            <div className="md:col-span-4 space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                Kin Relationship / رشتہ
              </label>
              <input
                id="reg-input-emergrelation"
                type="text"
                value={formData.emergencyRelation}
                onChange={e => setFormData(prev => ({ ...prev, emergencyRelation: e.target.value }))}
                placeholder="e.g. Brother, Husband, Daughter"
                className="w-full bg-slate-50 dark:bg-slate-950/10 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-emerald-500"
              />
            </div>

            {/* Phone */}
            <div className="md:col-span-4 space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                Contact Phone <span className="text-rose-500">*</span> / رابطہ نمبر
              </label>
              <input
                id="reg-input-emergphone"
                type="text"
                required
                value={formData.emergencyPhone}
                onChange={e => handlePhoneChange(e, 'emergencyPhone')}
                placeholder="0321-XXXXXXX"
                className="w-full bg-slate-50 dark:bg-slate-950/10 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs text-slate-900 dark:text-white font-mono focus:outline-emerald-500"
              />
              {errors.emergencyPhone && <p className="text-[10px] text-rose-500">{errors.emergencyPhone}</p>}
            </div>
          </div>
        </div>

        {/* Section 5: Insurance Scheme Info */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800/80 pb-2 flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>5. Financial Coverage / Insurance / Social Welfare scheme info</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Insurance Dropdown */}
            <div className="md:col-span-4 space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                Assigned Program / کارڈ اسکیم
              </label>
              <select
                id="reg-input-instype"
                value={formData.insuranceType}
                onChange={e => setFormData(prev => ({ ...prev, insuranceType: e.target.value }))}
                className="w-full bg-slate-50 dark:bg-slate-950/10 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-emerald-500 cursor-pointer animate-fade-in"
              >
                <option value="None">None (نفسی بلنگ)</option>
                <option value="Sehat Sahulat Card">KPK/Punjab Sehat Sahulat Welfare Card</option>
                <option value="EFU">EFU Private Life Insurance</option>
                <option value="Jubilee">Jubilee Micro-Enterprise Insured</option>
                <option value="State Life">State Life Co. Pakistan</option>
                <option value="IGI">IGI General Insurance</option>
                <option value="Other">Other Private Sponsor</option>
              </select>
            </div>

            {/* Policy Number */}
            <div className="md:col-span-4 space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                Policy Claim ID / پالیسی نمبر
              </label>
              <input
                id="reg-input-inspolicyno"
                type="text"
                disabled={formData.insuranceType === 'None'}
                value={formData.policyNumber}
                onChange={e => setFormData(prev => ({ ...prev, policyNumber: e.target.value }))}
                placeholder="e.g. SCH-8921-20"
                className={`w-full border p-2.5 rounded-xl text-xs text-slate-900 dark:text-white font-mono focus:outline-emerald-500 ${
                  formData.insuranceType === 'None' ? 'bg-slate-100 dark:bg-slate-950/40 text-slate-450 border-slate-200 dark:border-slate-850' : 'bg-slate-50 dark:bg-slate-950/10 border-slate-200 dark:border-slate-805'
                }`}
              />
            </div>

            {/* Company Name */}
            <div className="md:col-span-4 space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                Insurance Consortium / کمپنی کا نام
              </label>
              <input
                id="reg-input-inscompany"
                type="text"
                disabled={formData.insuranceType === 'None'}
                value={formData.insuranceCompany}
                onChange={e => setFormData(prev => ({ ...prev, insuranceCompany: e.target.value }))}
                placeholder="e.g. Jubilee Life Ins. Co."
                className={`w-full border p-2.5 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-emerald-500 ${
                  formData.insuranceType === 'None' ? 'bg-slate-100 dark:bg-slate-950/40 text-slate-450 border-slate-200 dark:border-slate-850' : 'bg-slate-50 dark:bg-slate-950/10 border-slate-200 dark:border-slate-805'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Actions Submit bar */}
        <div className="pt-6 border-t border-slate-150 dark:border-slate-800 flex flex-col sm:flex-row justify-end gap-3" id="registration-action-foot font-sans">
          <button
            type="submit"
            id="reg-btn-submit"
            disabled={submitting}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-6 py-3 rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all uppercase tracking-wide"
          >
            {submitting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Admitting Patient Record...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} className="text-emerald-100" />
                <span>Save Patient File &bull; ریکارڈ محفوظ کریں</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
