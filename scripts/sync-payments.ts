/**
 * Sync Payments from CSV — Replaces all payment data in DB with the CSV data.
 * Run: npx tsx scripts/sync-payments.ts
 *
 * Steps:
 *  1. Add any missing students
 *  2. Clear payment_coverage + payments tables
 *  3. Insert ALL payment rows from Revenue CSV
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/db/schema";
import { eq, sql } from "drizzle-orm";

const client = neon(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

// ===== NAME ALIAS MAP =====
// Maps CSV "اسم اللاعب" values to the canonical DB student name.
// For sibling payments, the first name listed is the "primary" student.
const CSV_TO_DB_NAME: Record<string, string> = {
  "يحيى أوزيل": "يحيى أوزيل",
  "حسام صمودي": "حسام صمودي",
  "محمد عزام": "محمد عزام",
  "زيد كوتشاك": "زيد كوتشاك",
  "يامن الطبشة": "يامن الطبشة",
  "ياسين المصري": "ياسين المصري",
  "ياسين حمدان": "ياسين حمدان",
  "آدم عجوري": "آدم عجوري",
  "علي ماوردي": "علي ماوردي",
  "سليمان حنبلي": "سليمان حنبلي",
  "سليمان الحنبلي": "سليمان حنبلي",
  "آدم ونوح الشيخ صالح": "آدم الشيخ صالح",
  "عبدالله مهدي المبروك": "عبدالله المبروك",
  "محمد الفاتح قولي": "محمد الفاتح قولي",
  "حمزة عبادة": "حمزة عبادة",
  "أحمد الطويل": "أحمد الطويل",
  "سليمان المشوخي": "سليمان المشوخي",
  "أحمد جاد العتيق": "أحمد جاد عتيق",
  "أحمد جاد عتيق": "أحمد جاد عتيق",
  "يوسف أبو خلف": "يوسف أبو خلف",
  "محمد وسفيان هارون": "محمد هارون كايا",
  "إيهاب عفانة": "إيهاب عفانة",
  "عمر شاكر": "عمر شاكر",
  "آسر عبدالله منشاوي": "آسر منشاوي",
  "زيد يحيى زكريا": "زيد يحيى زكريا",
  "أحمد زين سلطان": "أحمد زين سلطان",
  "أمجد أشرم": "أمجد أشرم",
  "عبدالفتاح أحمد مهنا": "عبدالفتاح مهنا",
  "محمد طارق العلبي": "محمد طارق العلبي",
  "حذيفة وأويس أعويلي": "حذيفة أعويلي",
  "أمير تشوبوكلار": "أمير تشوبوكلار",
  "محمد عامر بيساني": "محمد عامر بيساني",
  "محمد عمار بيساني": "محمد عامر بيساني",
  "أشرف العثمان": "أشرف العثمان",
  "عكرمة مصطفى أوغلو": "عكرمة مصطفى أوغلو",
  "كريم لطوف": "كريم لطوف",
  "حيدر أصلان": "حيدر أصلان",
  "يزن ميستو": "يزن ميستو",
  "صهيب وقصي الذيب": "صهيب الذيب",
  "يمان نجيب": "يمان نجيب",
  "شهاب الدين أبو معمر": "شهاب الدين أبو معمر",
  "خالد إسلام أوغلو": "خالد إسلام أوغلو",
  "حمزة موسى": "حمزة موسى",
  "يوسف آرداملي": "يوسف آرداملي",
  "حسن وبراء ماجد": "براء ماجد",
  "حارث وعمر إبراهيم": "حارث إبراهيم",
  "محمد أمير": "محمد أمير دهان",
  "محمد أمير الدهان": "محمد أمير دهان",
  "ثابت وعلي عبدالله": "ثابت عبدالله",
  "أسامة صديق سليمان": "أسامة صديق سليمان",
};

// ===== NEW STUDENTS TO ADD =====
interface NewStudentDef {
  name: string;
  registrationDate: string;
  status: "active" | "inactive" | "frozen" | "trial";
  ageGroup: "5-10" | "10-15" | "15+";
  monthlyFee: number;
  notes?: string;
}

const newStudents: NewStudentDef[] = [
  {
    name: "ياسين حمدان",
    registrationDate: "2025-11-08",
    status: "active",
    ageGroup: "10-15",
    monthlyFee: 5000,
    notes: "تم الإضافة من بيانات الإيرادات",
  },
  {
    name: "آدم عجوري",
    registrationDate: "2025-11-08",
    status: "active",
    ageGroup: "10-15",
    monthlyFee: 5000,
    notes: "تم الإضافة من بيانات الإيرادات",
  },
  {
    name: "أمجد أشرم",
    registrationDate: "2025-12-13",
    status: "frozen",
    ageGroup: "10-15",
    monthlyFee: 4800,
    notes: "عرض الجمعة البيضاء - الاشتراك مجمد",
  },
  {
    name: "ثابت عبدالله",
    registrationDate: "2026-02-07",
    status: "active",
    ageGroup: "10-15",
    monthlyFee: 5200,
    notes: "تم الإضافة من بيانات الإيرادات",
  },
  {
    name: "علي عبدالله",
    registrationDate: "2026-02-07",
    status: "active",
    ageGroup: "10-15",
    monthlyFee: 5200,
    notes: "أخ ثابت عبدالله",
  },
  {
    name: "أسامة صديق سليمان",
    registrationDate: "2026-02-08",
    status: "trial",
    ageGroup: "10-15",
    monthlyFee: 0,
    notes: "ضيافة أسبوعين",
  },
];

// ===== PAYMENT DATA FROM CSV =====
interface PaymentRow {
  date: string;           // YYYY-MM-DD
  amount: number;
  method: "bank_transfer" | "cash";
  payerName: string;
  studentName: string;    // CSV "اسم اللاعب" value (will be resolved via alias map)
  type: "monthly" | "bus" | "uniform";
  coverageStart?: string; // YYYY-MM-DD
  coverageEnd?: string;   // YYYY-MM-DD
  notes?: string;
}

const allPayments: PaymentRow[] = [
  // ===== Pre-opening (before 18/10/2025) =====
  { date: "2025-08-08", amount: 2200, method: "bank_transfer", payerName: "ALİ ÖZİL", studentName: "يحيى أوزيل", type: "monthly" },
  { date: "2025-08-15", amount: 2000, method: "bank_transfer", payerName: "OULA ATAYA", studentName: "حسام صمودي", type: "monthly" },
  // TAMIM YILMAZ (2200 on 20/8) and ISLAM A J MEZIED (4000 on 25/8) — no student identified, skipped
  { date: "2025-08-27", amount: 3000, method: "bank_transfer", payerName: "HANSA ALTOUBAH", studentName: "محمد عزام", type: "monthly" },
  { date: "2025-09-06", amount: 2000, method: "bank_transfer", payerName: "زيد كوتشاك", studentName: "زيد كوتشاك", type: "monthly" },
  { date: "2025-09-10", amount: 2000, method: "bank_transfer", payerName: "MAHMOUD HUSSEN", studentName: "يامن الطبشة", type: "monthly" },
  { date: "2025-10-02", amount: 2000, method: "bank_transfer", payerName: "HANSA ALTOUBAH", studentName: "محمد عزام", type: "monthly" },

  // ===== October onwards =====
  { date: "2025-10-18", amount: 4000, method: "bank_transfer", payerName: "OULA ATAYA", studentName: "حسام صمودي", type: "monthly", coverageStart: "2025-10-12", coverageEnd: "2026-04-12", notes: "دفعة أولى اشتراك 6 شهور" },
  { date: "2025-10-23", amount: 4000, method: "bank_transfer", payerName: "HANSA ALTOUBAH", studentName: "محمد عزام", type: "monthly", coverageStart: "2025-10-12", coverageEnd: "2025-11-12" },

  // ===== November =====
  { date: "2025-11-01", amount: 12000, method: "cash", payerName: "والد فاتح", studentName: "محمد الفاتح قولي", type: "monthly", coverageStart: "2025-10-12", coverageEnd: "2026-02-12", notes: "اشتراك 4 شهور" },
  { date: "2025-11-01", amount: 3500, method: "cash", payerName: "والد زيد", studentName: "زيد كوتشاك", type: "monthly", coverageStart: "2025-10-12", coverageEnd: "2025-11-12", notes: "متبقي 2500 مع خالد (عهدة)" },
  { date: "2025-11-08", amount: 6000, method: "bank_transfer", payerName: "HALIT KARTAL", studentName: "ياسين المصري", type: "monthly", coverageStart: "2025-11-01", coverageEnd: "2025-12-01", notes: "يشمل الطقم" },
  { date: "2025-11-08", amount: 6000, method: "bank_transfer", payerName: "AHMAD RAMADAN IBRAHIM HAMDAN", studentName: "ياسين حمدان", type: "monthly", coverageStart: "2025-11-08", coverageEnd: "2025-12-08" },
  { date: "2025-11-08", amount: 5000, method: "cash", payerName: "والد آدم", studentName: "آدم عجوري", type: "monthly", coverageStart: "2025-11-08", coverageEnd: "2025-12-08" },
  { date: "2025-11-08", amount: 3500, method: "cash", payerName: "والد علي", studentName: "علي ماوردي", type: "monthly", coverageStart: "2025-10-12", coverageEnd: "2025-11-12" },
  { date: "2025-11-09", amount: 6000, method: "bank_transfer", payerName: "SARIA ELHANBALI", studentName: "سليمان حنبلي", type: "monthly", coverageStart: "2025-11-08", coverageEnd: "2025-12-08" },
  { date: "2025-11-09", amount: 3500, method: "bank_transfer", payerName: "DIMA ALSHIKH MEREI", studentName: "يامن الطبشة", type: "monthly", coverageStart: "2025-10-12", coverageEnd: "2025-11-12" },
  { date: "2025-11-09", amount: 7000, method: "bank_transfer", payerName: "ALAA MAHFOUZ", studentName: "آدم ونوح الشيخ صالح", type: "monthly", coverageStart: "2025-10-12", coverageEnd: "2025-11-12", notes: "آدم ونوح" },
  { date: "2025-11-15", amount: 5000, method: "bank_transfer", payerName: "ALİ ÖZİL", studentName: "يحيى أوزيل", type: "monthly", coverageStart: "2025-11-15", coverageEnd: "2025-12-15" },
  { date: "2025-11-15", amount: 7000, method: "bank_transfer", payerName: "MAHDI AMIN MOUSA ALMABROK", studentName: "عبدالله مهدي المبروك", type: "monthly", coverageStart: "2025-11-01", coverageEnd: "2025-12-01", notes: "يشمل الطقم" },
  { date: "2025-11-21", amount: 7000, method: "bank_transfer", payerName: "ALAA MAHFOUZ", studentName: "آدم ونوح الشيخ صالح", type: "monthly", coverageStart: "2025-11-12", coverageEnd: "2025-12-12" },
  { date: "2025-11-22", amount: 4240, method: "cash", payerName: "والد أحمد", studentName: "أحمد الطويل", type: "monthly", coverageStart: "2025-11-15", coverageEnd: "2025-12-15" },
  { date: "2025-11-23", amount: 4000, method: "bank_transfer", payerName: "OULA ATAYA", studentName: "حسام صمودي", type: "monthly", coverageStart: "2025-10-12", coverageEnd: "2026-04-12" },
  { date: "2025-11-28", amount: 4000, method: "bank_transfer", payerName: "HANSA ALTOUBAH", studentName: "محمد عزام", type: "monthly", coverageStart: "2025-11-12", coverageEnd: "2025-12-12" },
  { date: "2025-11-28", amount: 6000, method: "bank_transfer", payerName: "HALİT IBRAHİM ÖZ", studentName: "سليمان المشوخي", type: "monthly", coverageStart: "2025-11-29", coverageEnd: "2025-12-29", notes: "لا يوجد طقم على مقاسه حاليا" },
  { date: "2025-11-29", amount: 3500, method: "cash", payerName: "والد زيد", studentName: "زيد كوتشاك", type: "monthly", coverageStart: "2025-11-12", coverageEnd: "2025-12-12" },
  { date: "2025-11-30", amount: 6000, method: "bank_transfer", payerName: "ZAKARIA ATIK", studentName: "أحمد جاد العتيق", type: "monthly", coverageStart: "2025-10-25", coverageEnd: "2025-11-25", notes: "اشتراك 4000 + 2000 باص" },

  // ===== December =====
  { date: "2025-12-04", amount: 3500, method: "bank_transfer", payerName: "DIMA ALSHIKH MEREI", studentName: "يامن الطبشة", type: "monthly", coverageStart: "2025-11-12", coverageEnd: "2025-12-12" },
  { date: "2025-12-06", amount: 7000, method: "bank_transfer", payerName: "IMAN EBDA", studentName: "حمزة عبادة", type: "monthly", coverageStart: "2025-10-12", coverageEnd: "2025-12-12", notes: "اشتراك عن شهرين" },
  { date: "2025-12-06", amount: 6000, method: "cash", payerName: "والد حيدر", studentName: "حيدر أصلان", type: "monthly", coverageStart: "2025-12-06", coverageEnd: "2026-01-06", notes: "لا يوجد طقم على مقاسه حاليا" },
  { date: "2025-12-06", amount: 5000, method: "bank_transfer", payerName: "HALIT KARTAL", studentName: "ياسين المصري", type: "monthly", coverageStart: "2025-12-01", coverageEnd: "2026-01-01" },
  { date: "2025-12-06", amount: 7000, method: "bank_transfer", payerName: "AMIR MOHAMMAD ABUKHALAF", studentName: "يوسف أبو خلف", type: "monthly", coverageStart: "2025-12-06", coverageEnd: "2026-01-06", notes: "يشمل الطقم" },
  { date: "2025-12-06", amount: 10000, method: "bank_transfer", payerName: "NURAY KAYA", studentName: "محمد وسفيان هارون", type: "monthly", coverageStart: "2025-12-01", coverageEnd: "2026-01-01", notes: "يشمل الطقم" },
  { date: "2025-12-06", amount: 1000, method: "cash", payerName: "والد أحمد", studentName: "أحمد الطويل", type: "monthly", coverageStart: "2025-11-15", coverageEnd: "2025-12-15", notes: "متبقي 1,260 ولن يشترك بالباص" },
  { date: "2025-12-06", amount: 7000, method: "bank_transfer", payerName: "DENİZ YILDIRIM", studentName: "إيهاب عفانة", type: "monthly", coverageStart: "2025-11-30", coverageEnd: "2025-12-30", notes: "يشمل الطقم" },
  { date: "2025-12-07", amount: 1200, method: "cash", payerName: "والد أحمد", studentName: "أحمد الطويل", type: "monthly", coverageStart: "2025-11-15", coverageEnd: "2025-12-15" },
  { date: "2025-12-07", amount: 6000, method: "bank_transfer", payerName: "MAHDI AMIN MOUSA ALMABROK", studentName: "عبدالله مهدي المبروك", type: "monthly", coverageStart: "2025-12-01", coverageEnd: "2026-01-01" },
  { date: "2025-12-07", amount: 4000, method: "cash", payerName: "الدكتور أحمد شاكر", studentName: "عمر شاكر", type: "monthly", coverageStart: "2025-12-06", coverageEnd: "2026-01-06" },
  { date: "2025-12-08", amount: 6500, method: "bank_transfer", payerName: "MEDHAT MOHAMMED ELSHERIF", studentName: "آسر عبدالله منشاوي", type: "monthly", coverageStart: "2025-12-07", coverageEnd: "2026-01-07", notes: "يشمل الطقم" },
  { date: "2025-12-08", amount: 6000, method: "bank_transfer", payerName: "SARIA ELHANBALI", studentName: "سليمان حنبلي", type: "monthly", coverageStart: "2025-12-08", coverageEnd: "2026-01-08" },
  { date: "2025-12-09", amount: 5000, method: "bank_transfer", payerName: "YAHYA ZAKARIA HASSAN GAMAL", studentName: "زيد يحيى زكريا", type: "monthly", coverageStart: "2025-12-07", coverageEnd: "2026-01-07", notes: "اشتراك 4000 + 1000 طقم" },
  { date: "2025-12-10", amount: 8500, method: "bank_transfer", payerName: "MOHAMAD SAEED DABABO", studentName: "أحمد زين سلطان", type: "monthly", coverageStart: "2025-12-01", coverageEnd: "2026-01-01", notes: "اشتراك 5500 + طقم وباص" },
  { date: "2025-12-13", amount: 4800, method: "bank_transfer", payerName: "KEREM ASLAN", studentName: "أمجد أشرم", type: "monthly", coverageStart: "2025-12-13", coverageEnd: "2026-01-13", notes: "عرض الجمعة البيضاء (الاشتراك مجمد)" },
  { date: "2025-12-14", amount: 3500, method: "cash", payerName: "والد زيد", studentName: "زيد كوتشاك", type: "monthly", coverageStart: "2025-12-12", coverageEnd: "2026-01-12" },
  { date: "2025-12-14", amount: 3500, method: "cash", payerName: "والد علي", studentName: "علي ماوردي", type: "monthly", coverageStart: "2025-11-12", coverageEnd: "2025-12-12", notes: "المبلغ مع خالد" },
  { date: "2025-12-14", amount: 6000, method: "bank_transfer", payerName: "AHMED G M MHANNA", studentName: "عبدالفتاح أحمد مهنا", type: "monthly", coverageStart: "2025-12-13", coverageEnd: "2026-01-13", notes: "اشتراك 5000 + 1000 طقم" },
  { date: "2025-12-15", amount: 4800, method: "bank_transfer", payerName: "MUHAMMET FIRAS OLABI", studentName: "محمد طارق العلبي", type: "monthly", coverageStart: "2025-12-06", coverageEnd: "2026-01-06", notes: "عرض الجمعة البيضاء، الاشتراك 5500" },
  { date: "2025-12-16", amount: 3500, method: "bank_transfer", payerName: "IMAN EBDA", studentName: "حمزة عبادة", type: "monthly", coverageStart: "2025-12-12", coverageEnd: "2026-01-12" },
  { date: "2025-12-16", amount: 4000, method: "bank_transfer", payerName: "HANSA ALTOUBAH", studentName: "محمد عزام", type: "monthly", coverageStart: "2025-12-12", coverageEnd: "2026-01-12" },
  { date: "2025-12-17", amount: 9600, method: "bank_transfer", payerName: "ROUFEEDAH AVELI", studentName: "حذيفة وأويس أعويلي", type: "monthly", coverageStart: "2025-12-13", coverageEnd: "2026-01-13", notes: "الاشتراك 5000 لأنهم إخوة، وأول شهر فقط 4800" },
  { date: "2025-12-19", amount: 3500, method: "bank_transfer", payerName: "DIMA ALSHIKH MEREI", studentName: "يامن الطبشة", type: "monthly", coverageStart: "2025-12-12", coverageEnd: "2026-01-12" },
  { date: "2025-12-20", amount: 3000, method: "cash", payerName: "الدكتور أحمد شاكر", studentName: "عمر شاكر", type: "monthly", coverageStart: "2025-12-06", coverageEnd: "2026-01-06", notes: "تكملة الاشتراك" },
  { date: "2025-12-20", amount: 3500, method: "bank_transfer", payerName: "YUSUF ÇUBUKLU", studentName: "أمير تشوبوكلار", type: "monthly", coverageStart: "2025-10-15", coverageEnd: "2025-12-15", notes: "قيمة الاشتراك الشهري 1750" },
  { date: "2025-12-20", amount: 6000, method: "bank_transfer", payerName: "ALİ ÖZİL", studentName: "يحيى أوزيل", type: "monthly", coverageStart: "2025-12-15", coverageEnd: "2026-01-15", notes: "يشمل الطقم" },
  { date: "2025-12-20", amount: 7000, method: "bank_transfer", payerName: "ALAA MAHFOUZ", studentName: "آدم ونوح الشيخ صالح", type: "monthly", coverageStart: "2025-12-12", coverageEnd: "2026-01-12" },
  { date: "2025-12-20", amount: 9000, method: "bank_transfer", payerName: "OULA ATAYA", studentName: "حسام صمودي", type: "monthly", coverageStart: "2025-10-12", coverageEnd: "2026-04-12", notes: "شهرين + طقم" },
  { date: "2025-12-21", amount: 3500, method: "bank_transfer", payerName: "AMER ALBISANI", studentName: "محمد عامر بيساني", type: "monthly", coverageStart: "2025-12-15", coverageEnd: "2026-01-15" },
  { date: "2025-12-21", amount: 5500, method: "bank_transfer", payerName: "MUWAFFAK ALOSMAN", studentName: "أشرف العثمان", type: "monthly", coverageStart: "2025-12-21", coverageEnd: "2026-01-21" },
  { date: "2025-12-21", amount: 5000, method: "cash", payerName: "والد فاتح", studentName: "محمد الفاتح قولي", type: "monthly", coverageStart: "2025-10-12", coverageEnd: "2026-02-12", notes: "يشمل الطقم 1000 وتصفية اشتراك الباص 2000" },
  { date: "2025-12-21", amount: 15000, method: "cash", payerName: "والد عكرمة", studentName: "عكرمة مصطفى أوغلو", type: "monthly", coverageStart: "2025-12-21", coverageEnd: "2026-03-21", notes: "3 شهور - يشمل الطقم" },
  { date: "2025-12-25", amount: 4000, method: "bank_transfer", payerName: "ZAKARIA ATIK", studentName: "أحمد جاد العتيق", type: "monthly", coverageStart: "2025-11-25", coverageEnd: "2025-12-25" },
  { date: "2025-12-26", amount: 2000, method: "bank_transfer", payerName: "HANSA ALTOUBAH", studentName: "محمد عزام", type: "bus" },
  { date: "2025-12-26", amount: 2000, method: "bank_transfer", payerName: "SARIA ELHANBALI", studentName: "سليمان الحنبلي", type: "bus", notes: "تصفية اشتراك الباص" },
  { date: "2025-12-26", amount: 1000, method: "bank_transfer", payerName: "FUTOUN İSTANBULİ KOÇAK", studentName: "زيد كوتشاك", type: "uniform" },
  { date: "2025-12-27", amount: 6000, method: "bank_transfer", payerName: "HALİT İBRAHİM ÖZ", studentName: "سليمان المشوخي", type: "monthly", coverageStart: "2025-12-28", coverageEnd: "2026-01-28" },
  { date: "2025-12-27", amount: 6000, method: "cash", payerName: "والد يزن", studentName: "يزن ميستو", type: "monthly", coverageStart: "2025-12-28", coverageEnd: "2026-01-28", notes: "يشمل الطقم" },
  { date: "2025-12-27", amount: 1000, method: "bank_transfer", payerName: "FİRAS AJOURİ", studentName: "آدم عجوري", type: "uniform" },
  { date: "2025-12-28", amount: 3500, method: "cash", payerName: "والد علي", studentName: "علي ماوردي", type: "monthly", coverageStart: "2025-12-12", coverageEnd: "2026-01-12" },
  { date: "2025-12-29", amount: 15000, method: "bank_transfer", payerName: "DENİZ YILDIRIM", studentName: "إيهاب عفانة", type: "monthly", coverageStart: "2025-12-30", coverageEnd: "2026-03-30", notes: "3 شهور" },
  { date: "2025-12-30", amount: 14500, method: "bank_transfer", payerName: "AHMAD MAKSOUM", studentName: "كريم لطوف", type: "monthly", coverageStart: "2025-10-15", coverageEnd: "2026-01-15", notes: "3 شهور - يشمل الطقم" },
  { date: "2025-12-30", amount: 17000, method: "bank_transfer", payerName: "SARIA ELHANBALI", studentName: "سليمان الحنبلي", type: "monthly", coverageStart: "2026-01-01", coverageEnd: "2026-04-01", notes: "3 شهور + اشتراك باص لمدة شهر" },
  { date: "2025-12-31", amount: 500, method: "bank_transfer", payerName: "AHMED G M MHANNA", studentName: "عبدالفتاح أحمد مهنا", type: "bus", notes: "تصفية باص" },

  // ===== January 2026 =====
  { date: "2026-01-04", amount: 6000, method: "bank_transfer", payerName: "MAHDI AMIN MOUSA ALMABROK", studentName: "عبدالله مهدي المبروك", type: "monthly", coverageStart: "2026-01-01", coverageEnd: "2026-02-01" },
  { date: "2026-01-04", amount: 1000, method: "bank_transfer", payerName: "MAZEN MESTO", studentName: "يزن ميستو", type: "uniform" },
  { date: "2026-01-04", amount: 8000, method: "bank_transfer", payerName: "FAWZI NOUH NU'MAN ALDEEB", studentName: "صهيب وقصي الذيب", type: "monthly", coverageStart: "2026-01-01", coverageEnd: "2026-02-01", notes: "4000 لكل فرد" },
  { date: "2026-01-04", amount: 8000, method: "bank_transfer", payerName: "NURAY KAYA", studentName: "محمد وسفيان هارون", type: "monthly", coverageStart: "2026-01-01", coverageEnd: "2026-02-01" },
  { date: "2026-01-05", amount: 5000, method: "bank_transfer", payerName: "DINA ABOU SALEH", studentName: "أحمد جاد العتيق", type: "monthly", coverageStart: "2025-12-25", coverageEnd: "2026-01-25", notes: "يشمل الطقم" },
  { date: "2026-01-07", amount: 5000, method: "bank_transfer", payerName: "HALIT KARTAL", studentName: "ياسين المصري", type: "monthly", coverageStart: "2026-01-01", coverageEnd: "2026-02-01" },
  { date: "2026-01-08", amount: 1750, method: "bank_transfer", payerName: "HAKI ERDEMLI", studentName: "يوسف آرداملي", type: "monthly", notes: "تصفية اشتراك قديم" },
  { date: "2026-01-10", amount: 4000, method: "bank_transfer", payerName: "SUMAIA ZABAAN", studentName: "يمان نجيب", type: "monthly", coverageStart: "2026-01-01", coverageEnd: "2026-02-01" },
  { date: "2026-01-10", amount: 15000, method: "bank_transfer", payerName: "AMIR MOHAMMAD ABUKHALAF", studentName: "يوسف أبو خلف", type: "monthly", coverageStart: "2026-01-06", coverageEnd: "2026-04-06", notes: "3 شهور" },
  { date: "2026-01-12", amount: 2000, method: "bank_transfer", payerName: "SAADEDDIN MUSA", studentName: "حمزة موسى", type: "monthly" },
  { date: "2026-01-12", amount: 4000, method: "bank_transfer", payerName: "HANSA ALTOUBAH", studentName: "محمد عزام", type: "monthly", coverageStart: "2026-01-12", coverageEnd: "2026-02-12" },
  { date: "2026-01-12", amount: 1000, method: "bank_transfer", payerName: "SUMAIA ZABAAN", studentName: "يمان نجيب", type: "uniform" },
  { date: "2026-01-14", amount: 2000, method: "bank_transfer", payerName: "FAWZI NOUH NU'MAN ALDEEB", studentName: "صهيب وقصي الذيب", type: "uniform" },
  { date: "2026-01-15", amount: 14000, method: "bank_transfer", payerName: "Sohaila Medhat Mohamed Abdelhamid", studentName: "آسر عبدالله منشاوي", type: "monthly", coverageStart: "2026-01-17", coverageEnd: "2026-04-17", notes: "3 شهور" },
  { date: "2026-01-16", amount: 5000, method: "bank_transfer", payerName: "ALİ ÖZİL", studentName: "يحيى أوزيل", type: "monthly", coverageStart: "2026-01-15", coverageEnd: "2026-02-15" },
  { date: "2026-01-16", amount: 4000, method: "bank_transfer", payerName: "YAHYA ZAKARIA HASSAN GAMAL", studentName: "زيد يحيى زكريا", type: "monthly", coverageStart: "2026-01-07", coverageEnd: "2026-02-07" },
  { date: "2026-01-17", amount: 3500, method: "bank_transfer", payerName: "AMER ALBISANI", studentName: "محمد عامر بيساني", type: "monthly", coverageStart: "2026-01-15", coverageEnd: "2026-02-15" },
  { date: "2026-01-17", amount: 7000, method: "bank_transfer", payerName: "ALAA MAHFOUZ", studentName: "آدم ونوح الشيخ صالح", type: "monthly", coverageStart: "2026-01-12", coverageEnd: "2026-02-12" },
  { date: "2026-01-17", amount: 3500, method: "bank_transfer", payerName: "IMAN EBADA", studentName: "حمزة عبادة", type: "monthly", coverageStart: "2026-01-12", coverageEnd: "2026-02-12" },
  { date: "2026-01-17", amount: 5500, method: "bank_transfer", payerName: "MUHAMMET FIRAS OLABI", studentName: "محمد طارق العلبي", type: "monthly", coverageStart: "2026-01-13", coverageEnd: "2026-02-13" },
  { date: "2026-01-19", amount: 4000, method: "bank_transfer", payerName: "MOHAMAD SAEED DABABO", studentName: "أحمد زين سلطان", type: "monthly", coverageStart: "2026-01-01", coverageEnd: "2026-02-01", notes: "بسبب مجيئه يوم الأحد فقط استثناء" },
  { date: "2026-01-20", amount: 15000, method: "bank_transfer", payerName: "ABDULLAH MUAMMER", studentName: "شهاب الدين أبو معمر", type: "monthly", coverageStart: "2026-01-24", coverageEnd: "2026-04-24", notes: "3 شهور" },
  { date: "2026-01-20", amount: 2000, method: "bank_transfer", payerName: "RADWAN N M ABUMUAMAR", studentName: "شهاب الدين أبو معمر", type: "bus" },
  { date: "2026-01-24", amount: 6000, method: "bank_transfer", payerName: "EMAN İSLAMOĞLU", studentName: "خالد إسلام أوغلو", type: "monthly", coverageStart: "2026-01-24", coverageEnd: "2026-02-24" },
  { date: "2026-01-24", amount: 3500, method: "bank_transfer", payerName: "ALAA MAHFOUZ", studentName: "علي ماوردي", type: "monthly", coverageStart: "2026-01-12", coverageEnd: "2026-02-12" },
  { date: "2026-01-24", amount: 15000, method: "cash", payerName: "والد حسام", studentName: "حسام صمودي", type: "monthly", coverageStart: "2025-10-15", coverageEnd: "2026-06-15", notes: "تعديل الاشتراك لـ 8 شهور" },
  { date: "2026-01-24", amount: 5500, method: "cash", payerName: "أشرف", studentName: "أشرف العثمان", type: "monthly", coverageStart: "2026-01-21", coverageEnd: "2026-02-21" },
  { date: "2026-01-25", amount: 2000, method: "bank_transfer", payerName: "EMAN İSLAMOĞLU", studentName: "خالد إسلام أوغلو", type: "bus" },
  { date: "2026-01-31", amount: 3500, method: "cash", payerName: "والدة زيد", studentName: "زيد كوتشاك", type: "monthly", coverageStart: "2026-01-31", coverageEnd: "2026-03-02" },
  { date: "2026-01-31", amount: 2000, method: "bank_transfer", payerName: "HANSA ALTOUBAH", studentName: "محمد عزام", type: "uniform" },
  { date: "2026-01-31", amount: 12000, method: "bank_transfer", payerName: "NOUR ABUKUTAISH", studentName: "حسن وبراء ماجد", type: "monthly", coverageStart: "2026-01-25", coverageEnd: "2026-02-25", notes: "حسن وبراء ماجد" },
  { date: "2026-01-31", amount: 10000, method: "cash", payerName: "والد الحارث وعمر", studentName: "حارث وعمر إبراهيم", type: "monthly", coverageStart: "2026-01-24", coverageEnd: "2026-02-24", notes: "متبقي 1400 ليرة" },

  // ===== February 2026 =====
  { date: "2026-02-01", amount: 4000, method: "bank_transfer", payerName: "MOHAMAD SAEED DABABO", studentName: "أحمد زين سلطان", type: "monthly", coverageStart: "2026-02-01", coverageEnd: "2026-03-01" },
  { date: "2026-02-01", amount: 4000, method: "bank_transfer", payerName: "ZAKARIA ATIK", studentName: "أحمد جاد العتيق", type: "monthly", coverageStart: "2026-01-25", coverageEnd: "2026-02-25" },
  { date: "2026-02-01", amount: 2000, method: "cash", payerName: "والد محمد", studentName: "محمد أمير", type: "uniform" },
  { date: "2026-02-01", amount: 12000, method: "cash", payerName: "والد محمد وسفيان", studentName: "محمد وسفيان هارون", type: "monthly", coverageStart: "2026-02-01", coverageEnd: "2026-03-01", notes: "اشتراك شهر + طقمين" },
  { date: "2026-02-02", amount: 5000, method: "bank_transfer", payerName: "HALIT KARTAL", studentName: "ياسين المصري", type: "monthly", coverageStart: "2026-02-01", coverageEnd: "2026-03-01" },
  { date: "2026-02-03", amount: 7000, method: "bank_transfer", payerName: "HALİT İBRAHİM ÖZ", studentName: "سليمان المشوخي", type: "monthly", coverageStart: "2026-02-01", coverageEnd: "2026-03-01" },
  { date: "2026-02-05", amount: 2000, method: "bank_transfer", payerName: "HANSA ALTOUBAH", studentName: "محمد عزام", type: "bus" },
  { date: "2026-02-06", amount: 6000, method: "bank_transfer", payerName: "MAHDI AMIN MOUSA ALMABROK", studentName: "عبدالله مهدي المبروك", type: "monthly", coverageStart: "2026-02-01", coverageEnd: "2026-03-01" },
  { date: "2026-02-06", amount: 2000, method: "bank_transfer", payerName: "RADWAN N M ABUMUAMAR", studentName: "شهاب الدين أبو معمر", type: "uniform" },
  { date: "2026-02-08", amount: 15000, method: "cash", payerName: "والد محمد الدهان", studentName: "محمد أمير الدهان", type: "monthly", coverageStart: "2026-02-01", coverageEnd: "2026-05-01", notes: "3 شهور" },
  { date: "2026-02-08", amount: 3000, method: "cash", payerName: "سليمان مشوخي", studentName: "أسامة صديق سليمان", type: "monthly", notes: "ضيافة أسبوعين" },
  { date: "2026-02-08", amount: 10400, method: "cash", payerName: "والد ثابت وعلي", studentName: "ثابت وعلي عبدالله", type: "monthly", coverageStart: "2026-02-07", coverageEnd: "2026-03-07" },
  { date: "2026-02-08", amount: 1400, method: "cash", payerName: "والد الحارث وعمر", studentName: "حارث وعمر إبراهيم", type: "monthly", notes: "متبقي الاشتراك" },
  { date: "2026-02-08", amount: 4000, method: "cash", payerName: "والد الحارث وعمر", studentName: "حارث وعمر إبراهيم", type: "uniform" },
  { date: "2026-02-08", amount: 1000, method: "bank_transfer", payerName: "IBTIHAL MUSTAFAOĞLU", studentName: "عكرمة مصطفى أوغلو", type: "uniform" },
  { date: "2026-02-10", amount: 4000, method: "bank_transfer", payerName: "YAHYA ZAKARIA HASSAN GAMAL", studentName: "زيد يحيى زكريا", type: "monthly", coverageStart: "2026-02-08", coverageEnd: "2026-03-08" },
];

// ==========================================================================

async function main() {
  console.log("🔄 Starting payment sync...\n");

  // ===== Step 1: Add missing students =====
  console.log("📋 Step 1: Adding missing students...");

  const existingStudents = await db.select({ id: schema.students.id, name: schema.students.name }).from(schema.students);
  const studentNameToId: Record<string, string> = {};
  for (const s of existingStudents) {
    studentNameToId[s.name] = s.id;
  }
  console.log(`  Found ${existingStudents.length} existing students`);

  let addedCount = 0;
  for (const ns of newStudents) {
    if (studentNameToId[ns.name]) {
      console.log(`  ✓ Student "${ns.name}" already exists`);
      continue;
    }
    const [inserted] = await db.insert(schema.students).values({
      name: ns.name,
      status: ns.status,
      ageGroup: ns.ageGroup,
      registrationDate: ns.registrationDate,
      notes: ns.notes,
      area: "باشاك شهير",
    }).returning();
    studentNameToId[ns.name] = inserted.id;

    // Add fee config if needed
    if (ns.monthlyFee > 0) {
      await db.insert(schema.feeConfigs).values({
        studentId: inserted.id,
        monthlyFee: ns.monthlyFee.toString(),
        effectiveFrom: ns.registrationDate,
      });
    }

    addedCount++;
    console.log(`  + Added student "${ns.name}" (${ns.status})`);
  }
  console.log(`  ✅ ${addedCount} new students added\n`);

  // ===== Step 2: Build complete alias map =====
  // Merge CSV_TO_DB_NAME with direct matches
  const resolveStudentId = (csvName: string): string | null => {
    // Check alias map first
    const dbName = CSV_TO_DB_NAME[csvName];
    if (dbName && studentNameToId[dbName]) return studentNameToId[dbName];
    // Try direct match
    if (studentNameToId[csvName]) return studentNameToId[csvName];
    return null;
  };

  // ===== Step 3: Clear existing payments =====
  console.log("🗑️  Step 2: Clearing existing payments...");
  await db.execute(sql`DELETE FROM payment_coverage`);
  await db.execute(sql`DELETE FROM payments`);
  console.log("  ✅ Cleared payment_coverage and payments tables\n");

  // ===== Step 4: Insert all payments =====
  console.log("💰 Step 3: Inserting payments...");

  let inserted = 0;
  let skipped = 0;
  const skippedList: string[] = [];

  for (const p of allPayments) {
    const studentId = resolveStudentId(p.studentName);

    if (!studentId) {
      skipped++;
      skippedList.push(`  ⚠ SKIPPED: ${p.date} | ${p.amount} TL | "${p.studentName}" → student not found`);
      continue;
    }

    await db.insert(schema.payments).values({
      studentId,
      amount: p.amount.toString(),
      paymentType: p.type,
      paymentMethod: p.method,
      payerName: p.payerName,
      coverageStart: p.coverageStart ?? null,
      coverageEnd: p.coverageEnd ?? null,
      notes: p.notes ?? null,
      paymentDate: p.date,
    });
    inserted++;
  }

  console.log(`\n  ✅ ${inserted} payments inserted`);
  if (skipped > 0) {
    console.log(`  ⚠ ${skipped} payments skipped:\n`);
    skippedList.forEach(s => console.log(s));
  }

  // ===== Summary =====
  const totalAmount = allPayments
    .filter(p => resolveStudentId(p.studentName))
    .reduce((sum, p) => sum + p.amount, 0);

  console.log(`\n📊 Summary:`);
  console.log(`  Total students in DB: ${Object.keys(studentNameToId).length}`);
  console.log(`  Total payments: ${inserted}`);
  console.log(`  Total amount: ${totalAmount.toLocaleString()} TL`);
  console.log(`  Skipped: ${skipped}`);
  console.log("\n✅ Payment sync complete!");
}

main().catch(console.error);
