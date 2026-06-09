/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Format currency to PKR Rupees
export function formatPKR(val: number): string {
  return `Rs. ${val.toLocaleString('en-PK')}`;
}

// Format Date to Pakistani Human Format (DD/MM/YYYY)
export function formatDate(isoStr?: string): string {
  if (!isoStr) return "N/A";
  const date = new Date(isoStr);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// CNIC input format validation
export function validateCNIC(cnicStr: string): boolean {
  // Format: 5 digits, dash, 7 digits, dash, 1 digit (e.g. 35201-1234567-1)
  const pattern = /^\d{5}-\d{7}-\d{1}$/;
  return pattern.test(cnicStr);
}

// Global System Multi-language Translation Database
export const translations: Record<'EN' | 'UR', Record<string, string>> = {
  EN: {
    // Nav links
    nav_dashboard: "Hospital Overview",
    nav_patients: "Patient Records",
    nav_opd: "OPD Ticket Desk",
    nav_ipd: "Ward & Bed (IPD)",
    nav_billing: "Accounts & Invoicing",
    nav_lab: "Lab Diagnostics",
    nav_pharmacy: "Pharmacy Stock",
    nav_radiology: "Radiology & Imaging",
    nav_ot: "Operation Theater",
    nav_hr: "HR Staff roster",
    nav_settings: "Hospital Config",

    // Dashboard
    kpi_revenue: "Gross Revenue",
    kpi_patients: "Total Registered",
    kpi_opd_today: "OPD Visits Today",
    kpi_active_ipd: "Active Admissions",
    kpi_occupancy: "Bed Occupancy",
    kpi_outstanding: "Claim Balances",
    module_income: "Departmental Earnings Breakdown",
    occupancy_chart_title: "Active Bed Allocations by Specialty Ward",
    clinical_roster: "Active Duty Clinicians",

    // General Words
    search_placeholder: "Search patients by Name, MRN, Phone or CNIC...",
    add_new: "Register / Enlist",
    actions: "Actions",
    no_records: "No files found in archives.",
    submit: "Save Record",
    cancel: "Discard",
    status: "Status",
    save_success: "Changes saved safely.",
    back: "Go Back",

    // Patient forms
    pat_name: "Patient Name",
    pat_age: "Age (Years)",
    pat_gender: "Gender Identity",
    pat_blood: "Blood Group",
    pat_phone: "Primary Phone",
    pat_cnic: "Pakistani CNIC Number",
    pat_address: "Home Residence Address",
    pat_emergency: "Emergency Contact Person",
    pat_emergency_phone: "Emergency Contact Phone",
    pat_insurance: "Insurance/Welfare Provider",
    pat_insurance_no: "Policy / Claim ID Number",
    pat_gender_male: "Male (مرد)",
    pat_gender_female: "Female (عورت)",
    pat_gender_other: "Other (دگر)",

    // OPD Labeling
    opd_vitals: "Vitals Registration",
    opd_bp: "Blood Pressure (systolic/diastolic)",
    opd_temp: "Body Temperature (°C)",
    opd_weight: "Patient Weight (kg)",
    opd_pulse: "Heart Rate Pulse (bpm)",
    opd_symptoms: "Reported Clinical Symptoms",
    opd_diagnosis: "Physician Definitive Diagnosis",
    opd_prescription: "Prescribe Medication",
    opd_referral: "Internal Department Referral",
    opd_is_referred: "Referred to:",
    opd_token: "OPD Queue Token Code",

    // IPD Ward Management
    ipd_ward: "Specialist Ward Unit",
    ipd_charge: "Routine Daily Bed Charge",
    ipd_admission: "Patient Admission Record",
    ipd_notes: "Nursing Care Logs",
    ipd_discharge: "Discharge & Summarize Case",

    // Lab
    lab_test_catalog: "Diagnostic Test Price List",
    lab_request_test: "Order Pathology Test",
    lab_results: "Diagnostic Observation Entry",
    lab_test_name: "Diagnostic Target Study",

    // Pharmacy
    pharm_stock: "Medicine Inventory Stock",
    pharm_dispense: "Dispense Against Prescription",
    pharm_low_alert: "Low Inventory Warning Level",
    pharm_expiry: "Batch Expiration Date",

    // Radiology
    rad_order: "Order Radiology Diagnostic",
    rad_studies: "Radiological Scan Catalog",
    rad_findings: "Radiologist Study Report Notes",

    // OT
    ot_booking: "Surgery Theater Schedule",
    ot_checks: "Surgical Safety Checklist",
    ot_team: "Accredited Surgery Team",

    // Settings
    settings_title: "Identity & General Financial Parameters",
    settings_tax: "Revenue Service Tax Rate (%)",
    settings_whatsapp_tmp: "WhatsApp Integration Receipt Template"
  },
  UR: {
    // Nav links
    nav_dashboard: "ہسپتال کا جائزہ",
    nav_patients: "مریضوں کا ریکارڈ",
    nav_opd: "او پی ڈی پرچی کاؤنٹر",
    nav_ipd: "وارڈ اور بیڈ (انڈور)",
    nav_billing: "شعبہ اکاؤنٹس اور بلنگ",
    nav_lab: "لیبارٹری ٹیسٹ",
    nav_pharmacy: "فارمیسی اسٹاک",
    nav_radiology: "ریڈیولوجی ایکس رے",
    nav_ot: "آپریشن تھیٹر شیڈول",
    nav_hr: "ملازمین کا ریکارڈ / حاضری",
    nav_settings: "سسٹم سیٹنگز",

    // Dashboard
    kpi_revenue: "کل آمدنی",
    kpi_patients: "کل رجسٹرڈ مریض",
    kpi_opd_today: "کل او پی ڈی مریض",
    kpi_active_ipd: "داخل مریض",
    kpi_occupancy: "بیڈز کے بھرنے کی شرح",
    kpi_outstanding: "بقايا جات انشورنس",
    module_income: "شعبہ جات کی آمدنی کا تقابل",
    occupancy_chart_title: "مختلف ہسپتالی وارڈز میں بیڈز کا استعمال",
    clinical_roster: "ڈیوٹی پر موجود ڈاکٹرز",

    // General Words
    search_placeholder: "مریض کا نام، شناختی کارڈ یا فون نمبر درج کریں...",
    add_new: "نیا اندراج کریں",
    actions: "کارروائی",
    no_records: "آرکائیو میں کوئی ریکارڈ نہیں ملا۔",
    submit: "ریکارڈ محفوظ کریں",
    cancel: "منسوخ کریں",
    status: "حالت",
    save_success: "تبدیلیاں کامیابی سے محفوظ ہوگئیں۔",
    back: "واپس جائیں",

    // Patient forms
    pat_name: "مریض کا نام",
    pat_age: "عمر (سال)",
    pat_gender: "جنس",
    pat_blood: "بلڈ گروپ",
    pat_phone: "موبائل نمبر",
    pat_cnic: "قومی شناختی کارڈ نمبر (CNIC)",
    pat_address: "مستقل رہائشی پتہ",
    pat_emergency: "اضطراری رابطہ کار کا نام",
    pat_emergency_phone: "اضطراری رابطہ کار کا فون",
    pat_insurance: "انشورنس / صحت کارڈ اسکیم",
    pat_insurance_no: "پالیسی کارڈ نمبر",
    pat_gender_male: "مرد",
    pat_gender_female: "عورت",
    pat_gender_other: "دگر",

    // OPD Labeling
    opd_vitals: "مریض کے وائٹلز کا اندراج",
    opd_bp: "بلڈ پریشر",
    opd_temp: "جسمانی درجہ حرارت (°C)",
    opd_weight: "وزن (کلو)",
    opd_pulse: "نبض کی رفتار",
    opd_symptoms: "طبی علامات کی تفصیل",
    opd_diagnosis: "ڈاکٹر کی تشخیص",
    opd_prescription: "ادویات کا نسخہ",
    opd_referral: "شعبہ جاتی ریفرل",
    opd_is_referred: "ریفر کیا گیا برائے شعبہ:",
    opd_token: "او پی ڈی ٹوکن نمبر",

    // IPD Ward Management
    ipd_ward: "میڈیکل وارڈ",
    ipd_charge: "یومیہ بیڈ کا کرایہ",
    ipd_admission: "مریض کو داخل کریں",
    ipd_notes: "نوزنگ ڈیلی رپورٹ نوٹس",
    ipd_discharge: "ڈسچارج اور میڈیکل سمری",

    // Lab
    lab_test_catalog: "لیبارٹری ٹیسٹ کی قیمتیں",
    lab_request_test: "لیبارٹری ٹیسٹ تجویز کریں",
    lab_results: "ٹیسٹ رزلٹ درج کریں",
    lab_test_name: "ٹیسٹ کا نام",

    // Pharmacy
    pharm_stock: "ادویات کا اسٹاک لیول",
    pharm_dispense: "نسخہ کے مطابق دوا فراہم کریں",
    pharm_low_alert: "کم اسٹاک وارننگ لیول",
    pharm_expiry: "ادویات کی تاریخِ تنسیخ",

    // Radiology
    rad_order: "ریڈیولوجی ٹیسٹ تجویز کریں",
    rad_studies: "ریڈیولوجی معائنہ درکار",
    rad_findings: "ریڈیولوجسٹ مفصل رپورٹ",

    // OT
    ot_booking: "آپریشن تھیٹر بکنگ",
    ot_checks: "آپریشن سے قبل حفاظتی چیک لسٹ",
    ot_team: "نامزد سرجیکل ٹیم ارکان",

    // Settings
    settings_title: "ہسپتال کی شناخت اور ٹیکس ریٹ",
    settings_tax: "پنجاب ریونیو سروس ٹیکس (%)",
    settings_whatsapp_tmp: "واٹس ایپ بلنگ ایس ایم ایس ٹیمپلیٹ"
  }
};
