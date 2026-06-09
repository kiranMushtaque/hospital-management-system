/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import twilio from 'twilio';

// Lazy load Twilio client to prevent backend compile-time crashes
let twilioClientInstance: any = null;
const whatsappHistory: Array<{
  id: string;
  recipient: string;
  templateType: string;
  messageText: string;
  status: string;
  timestamp: string;
}> = [];

export function getTwilioClient() {
  if (twilioClientInstance) return twilioClientInstance;

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;

  if (!sid || !token || sid.includes('ACxxx') || token === '') {
    console.warn('⚠️ [Twilio Service] Twilio SID/Auth Token is missing or holds placeholder values. Dispatch triggers will run in simulated development console-log mode.');
    return null;
  }

  try {
    twilioClientInstance = twilio(sid, token);
    return twilioClientInstance;
  } catch (err) {
    console.error('❌ [Twilio Service] Initialization failure:', err);
    return null;
  }
}

export class WhatsAppService {
  static getHistory() {
    return whatsappHistory;
  }

  static async sendWhatsApp(toPhone: string, templateType: 'RECEIPT' | 'APPOINTMENT' | 'LAB_RESULT', variables: Record<string, string>) {
    const fromWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
    let messageText = '';

    // Standard requested Pakistani greeting templates
    if (templateType === 'RECEIPT') {
      messageText = `Assalam o Alaikum ${variables.patientName || 'Patient'},\nYour bill from ${variables.hospitalName || 'Mayo Trust Complex'} has been generated.\nBill No: ${variables.billNo || 'BILL-001'}\nDate: ${variables.date || new Date().toLocaleDateString('en-GB')}\nServices: ${variables.services || 'General OPD Consultations'}\nTotal: Rs ${variables.total || '0'}\nPaid: Rs ${variables.paid || '0'}\nBalance: Rs ${variables.balance || '0'}\nThank you for choosing ${variables.hospitalName || 'Mayo Trust Hospital'}.\nFor queries: ${variables.phone || '+92 42 111-222-333'}`;
    } else if (templateType === 'APPOINTMENT') {
      messageText = `Assalam o Alaikum ${variables.patientName || 'Patient'},\nYour appointment is confirmed.\nDoctor: Dr. ${variables.doctorName || 'Duty Consultant'}\nDate: ${variables.date || new Date().toLocaleDateString('en-GB')}\nTime: ${variables.time || '10:00 AM'}\nDepartment: ${variables.department || 'OPD'}\nPlease arrive 15 minutes early.\n${variables.hospitalName || 'Mayo Trust Complex'} - ${variables.phone || '+92 42 111-222-333'}`;
    } else if (templateType === 'LAB_RESULT') {
      messageText = `Assalam o Alaikum ${variables.patientName || 'Patient'},\nYour lab results are ready.\nTest: ${variables.testName || 'Diagnostics'}\nDate: ${variables.date || new Date().toLocaleDateString('en-GB')}\nPlease collect your report from lab.\n${variables.hospitalName || 'Mayo Trust Complex'} - ${variables.phone || '+92 42 111-222-333'}`;
    }

    const cleanedPhone = toPhone.startsWith('+') ? toPhone : `+92${toPhone.replace(/^0/, '')}`;
    const formattedTo = `whatsapp:${cleanedPhone}`;

    const client = getTwilioClient();
    const historyId = `WA-MSG-${Math.floor(100000 + Math.random() * 900000)}`;

    if (!client) {
      // Graceful simulated success mode
      console.log(`[SIMULATED TWILIO WHATSAPP RECEIPT DISPATCH]`);
      console.log(`From: ${fromWhatsAppNumber} -> To: ${formattedTo}`);
      console.log(`Body:\n${messageText}`);
      
      whatsappHistory.unshift({
        id: historyId,
        recipient: cleanedPhone,
        templateType,
        messageText,
        status: 'SIMULATED_SUCCESS_PREVIEW',
        timestamp: new Date().toISOString()
      });

      return { success: true, simulated: true, messageText };
    }

    try {
      const response = await client.messages.create({
        from: fromWhatsAppNumber,
        to: formattedTo,
        body: messageText
      });

      whatsappHistory.unshift({
        id: historyId,
        recipient: cleanedPhone,
        templateType,
        messageText,
        status: response.status || 'SENT',
        timestamp: new Date().toISOString()
      });

      return { success: true, sid: response.sid, messageText };
    } catch (error: any) {
      console.error('❌ [Twilio WhatsApp Service Error]:', error);
      
      whatsappHistory.unshift({
        id: historyId,
        recipient: cleanedPhone,
        templateType,
        messageText,
        status: 'DISPATCH_ERROR',
        timestamp: new Date().toISOString()
      });

      throw new Error(`Failed dispatching WhatsApp notification via Twilio: ${error.message}`);
    }
  }
}
