"use server";

/**
 * SMS Service using Netgsm (Turkish SMS Provider)
 * https://www.netgsm.com.tr
 *
 * Required env vars:
 *   NETGSM_USERCODE  — your Netgsm user code
 *   NETGSM_PASSWORD  — your Netgsm password
 *   NETGSM_MSGHEADER — approved sender name (başlık)
 */

const NETGSM_USERCODE = process.env.NETGSM_USERCODE;
const NETGSM_PASSWORD = process.env.NETGSM_PASSWORD;
const NETGSM_MSGHEADER = process.env.NETGSM_MSGHEADER;

function isSmsConfigured(): boolean {
  return !!(NETGSM_USERCODE && NETGSM_PASSWORD && NETGSM_MSGHEADER);
}

/**
 * Normalize a Turkish phone number to Netgsm format: 905XXXXXXXXX (12 digits)
 * Netgsm expects numbers WITH country code 90, e.g. 905441772345
 */
function normalizePhone(phone: string): string {
  // Remove spaces, dashes, parens, plus
  let cleaned = phone.replace(/[\s\-\(\)\+]/g, "");

  // Strip leading 0 (0541... → 541...)
  if (cleaned.startsWith("0") && cleaned.length === 11) {
    cleaned = cleaned.slice(1);
  }

  // If already starts with 90 and is 12 digits, it's good
  if (cleaned.startsWith("90") && cleaned.length === 12) {
    return cleaned;
  }

  // If 10 digits starting with 5, prepend 90
  if (cleaned.startsWith("5") && cleaned.length === 10) {
    return "90" + cleaned;
  }

  // Fallback: prepend 90 if not already there
  if (!cleaned.startsWith("90")) {
    return "90" + cleaned;
  }

  return cleaned;
}

interface SendSmsResult {
  success: boolean;
  error?: string;
  messageId?: string;
}

/**
 * Netgsm API response codes:
 * 00, 01, 02 = success (queued/sent)
 * 20 = message too long
 * 30 = invalid credentials
 * 40 = sender not approved
 * 50 = recipient error
 * 70 = invalid params
 */
const NETGSM_SUCCESS_CODES = ["00", "01", "02"];

/**
 * Send an SMS message via Netgsm REST API
 */
export async function sendSms(to: string, body: string): Promise<SendSmsResult> {
  if (!isSmsConfigured()) {
    console.warn("SMS not configured — NETGSM env vars missing");
    return { success: false, error: "خدمة الرسائل غير مفعلة" };
  }

  const gsmno = normalizePhone(to);

  try {
    const params = new URLSearchParams({
      usercode: NETGSM_USERCODE!,
      password: NETGSM_PASSWORD!,
      gsmno,
      message: body,
      msgheader: NETGSM_MSGHEADER!,
      dil: "TR",
    });

    const url = `https://api.netgsm.com.tr/sms/send/get?${params.toString()}`;

    const response = await fetch(url);
    const text = await response.text();

    // Response format: "CODE MESSAGEID" e.g. "00 12345678"
    const parts = text.trim().split(/\s+/);
    const code = parts[0];
    const messageId = parts[1];

    if (NETGSM_SUCCESS_CODES.includes(code)) {
      return { success: true, messageId };
    }

    const errorMessages: Record<string, string> = {
      "20": "الرسالة طويلة جداً",
      "30": "بيانات الدخول غير صحيحة",
      "40": "اسم المرسل غير مفعل",
      "50": "خطأ في رقم المستلم",
      "70": "خطأ في البيانات المرسلة",
    };

    console.error("Netgsm error:", text);
    return {
      success: false,
      error: errorMessages[code] || `فشل في إرسال الرسالة (${code})`,
    };
  } catch (error) {
    console.error("SMS send error:", error);
    return { success: false, error: "فشل في إرسال الرسالة" };
  }
}

/**
 * Check if SMS service is available
 */
export async function checkSmsAvailable(): Promise<boolean> {
  return isSmsConfigured();
}
