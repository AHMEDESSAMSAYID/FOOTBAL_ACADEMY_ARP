/**
 * Seed Script — Import real data from CSV files
 * Run: npx tsx scripts/seed-real-data.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/db/schema";
import { eq, sql } from "drizzle-orm";

const client = neon(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

// ===== STUDENT DATA (from Membership CSV) =====
// Extracted manually from the CSV since it's complex multi-line format

interface StudentData {
  name: string;
  fullName?: string;
  registrationDate: string;
  status: "active" | "inactive" | "frozen" | "trial";
  ageGroup: "5-10" | "10-15" | "15+";
  birthDate?: string;
  nationality?: string;
  idNumber?: string;
  phone?: string;
  parentPhone?: string;
  school?: string;
  address?: string;
  uniformPaid: boolean;
  monthlyFee: number;
  busFee?: number;
  notes?: string;
}

const studentsData: StudentData[] = [
  // === 5-10 AGE GROUP ===
  {
    name: "أحمد زين سلطان",
    registrationDate: "2023-07-17",
    status: "active",
    ageGroup: "5-10",
    uniformPaid: true,
    monthlyFee: 4000,
    busFee: 2000,
    notes: "اشتراك شهري مع باص",
  },
  {
    name: "يزن ميستو",
    registrationDate: "2023-11-20",
    status: "active",
    ageGroup: "5-10",
    uniformPaid: true,
    monthlyFee: 6000,
    notes: "نشط | غير مدفوع",
  },
  {
    name: "نوح الشيخ صالح",
    fullName: "نوح وجدي الشيخ صالح",
    registrationDate: "2024-04-08",
    status: "active",
    ageGroup: "5-10",
    birthDate: "2017-09-09",
    nationality: "سوري",
    idNumber: "99129537184",
    parentPhone: "5367078017",
    school: "Nurettin topçu ilkokulu",
    address: "Başakşehir. Cahit Zarifoğlu caddesi. olimpa Park 2 sitesi. daire 41",
    uniformPaid: false,
    monthlyFee: 3500,
  },
  {
    name: "محمد الفاتح قولي",
    registrationDate: "2024-09-08",
    status: "active",
    ageGroup: "5-10",
    uniformPaid: true,
    monthlyFee: 3000,
    notes: "اشتراك 4 شهور",
  },
  {
    name: "سفيان هارون كايا",
    fullName: "سفيان هارون كايا",
    registrationDate: "2024-09-14",
    status: "active",
    ageGroup: "5-10",
    birthDate: "2017-09-08",
    nationality: "فلسطيني - تركي",
    idNumber: "48112962632",
    parentPhone: "5331341139",
    school: "TOKİ- OSMAN GAZİ İLK OKULU",
    address: "BULVAR İSTANBUL SİTESİ. BLOK:. B4. D:25/ BAŞAKŞEHİR-İSTANBUL",
    uniformPaid: true,
    monthlyFee: 4000,
  },
  {
    name: "يحيى أوزيل",
    registrationDate: "2024-11-02",
    status: "active",
    ageGroup: "5-10",
    uniformPaid: true,
    monthlyFee: 5000,
  },
  {
    name: "حسام صمودي",
    fullName: "حسام بلال صمودي",
    registrationDate: "2025-07-02",
    status: "active",
    ageGroup: "5-10",
    birthDate: "2018-12-18",
    nationality: "سوري",
    idNumber: "99522286788",
    phone: "5523422462",
    parentPhone: "5319338732",
    school: "مدرسة الأوائل الدولية",
    address: "AĞAOĞLU MY WORLD SİTESİ. BLOK:B4. D:93 / BAŞAKŞEHİR- İSTANBUL",
    uniformPaid: true,
    monthlyFee: 4000,
    notes: "اشتراك 8 شهور حتى 15/6/2026",
  },
  {
    name: "زيد كوتشاك",
    fullName: "زيد أسامة كوتشاك",
    registrationDate: "2025-07-19",
    status: "active",
    ageGroup: "5-10",
    birthDate: "2017-08-21",
    nationality: "سوري- تركي",
    idNumber: "46061047592",
    parentPhone: "05375457792",
    school: "--",
    address: "Başakşehir. onurkent. Necmettin Erbakan caddesi. örnek sitesi. A blok daire 35",
    uniformPaid: true,
    monthlyFee: 3500,
  },
  {
    name: "يامن الطبشة",
    registrationDate: "2025-07-26",
    status: "frozen",
    ageGroup: "5-10",
    uniformPaid: false,
    monthlyFee: 3500,
    notes: "متوقف بسبب السفر في العطلة",
  },
  {
    name: "أحمد جاد عتيق",
    fullName: "أحمد زكريا جاد عتيق",
    registrationDate: "2025-10-25",
    status: "active",
    ageGroup: "5-10",
    birthDate: "2019-11-19",
    nationality: "سوري",
    idNumber: "99924868094",
    parentPhone: "5523306702",
    school: "مدرسة الأوائل الدولية",
    address: "باشاك شهير - شارع جاهد زاريف أوغلو، اسم البناء Hclin b12 - شقة 12",
    uniformPaid: true,
    monthlyFee: 4000,
    busFee: 2000,
  },
  {
    name: "ياسين المصري",
    fullName: "ياسين خالد المصري Yasin Kartal",
    registrationDate: "2025-11-01",
    status: "active",
    ageGroup: "5-10",
    birthDate: "2020-07-20",
    nationality: "مصري - تركي",
    idNumber: "72256180720",
    phone: "5465687662",
    parentPhone: "5550314455",
    school: "روضة الأوقاف",
    address: "جونشلر - إسطنبول",
    uniformPaid: true,
    monthlyFee: 5000,
  },
  {
    name: "عبدالله المبروك",
    fullName: "عبدالله مهدي أمين المبروك",
    registrationDate: "2025-11-01",
    status: "active",
    ageGroup: "5-10",
    birthDate: "2019-10-08",
    nationality: "فلسطيني",
    idNumber: "99729677860",
    parentPhone: "05312691366",
    school: "مدرسة فؤاد سزجن الابتدائية",
    address: "Kayabaşı mahallesi gazi yaşargil caddesi- Emlak konut 1.etap 4.kısım A3-44",
    uniformPaid: true,
    monthlyFee: 6000,
  },
  {
    name: "إيهاب عفانة",
    fullName: "إيهاب حسن عزمي عفانة",
    registrationDate: "2025-11-30",
    status: "active",
    ageGroup: "5-10",
    birthDate: "2020-05-25",
    nationality: "فلسطيني - تركي",
    idNumber: "29816589288",
    parentPhone: "5343494509",
    school: "مدرسة الاحسان",
    address: "PARK MAVERA 2 SİTESİ. BLOK:B1. D:102 / BAŞAKŞEHİR-İSTANBUL",
    uniformPaid: true,
    monthlyFee: 5000,
  },
  {
    name: "يوسف أبو خلف",
    registrationDate: "2025-12-06",
    status: "active",
    ageGroup: "5-10",
    uniformPaid: true,
    monthlyFee: 5000,
  },
  {
    name: "عمر شاكر",
    fullName: "عمر أحمد شاكر",
    registrationDate: "2025-12-06",
    status: "inactive",
    ageGroup: "5-10",
    birthDate: "2018-01-02",
    nationality: "سوري- تركي",
    idNumber: "22625808250",
    parentPhone: "5340789944",
    school: "BİLİM KOLEJİ",
    address: "MAVERA COMFORT SİTESİ. BLOK: A2 . D:36 / BAŞAKŞEHİR-İSTANBUL",
    uniformPaid: true,
    monthlyFee: 7000,
    notes: "منتهي",
  },
  {
    name: "زيد يحيى زكريا",
    fullName: "زيد يحيى زكريا حسان جمال",
    registrationDate: "2025-12-07",
    status: "active",
    ageGroup: "5-10",
    birthDate: "2020-01-06",
    nationality: "مصري",
    idNumber: "99762522844",
    parentPhone: "5536911215",
    school: "مدرسة الهدى",
    address: "SEYRAN ŞEHİR SİTESİ. KAYAŞEHİR. BLOK: B2. D:7 / BAŞAKŞEHİR- İSTANBUL",
    uniformPaid: true,
    monthlyFee: 4000,
  },
  {
    name: "حمزة موسى",
    registrationDate: "2025-11-29",
    status: "active",
    ageGroup: "5-10",
    uniformPaid: false,
    monthlyFee: 2000,
    notes: "حمزة موسى",
  },
  {
    name: "كريم لطوف",
    registrationDate: "2025-10-15",
    status: "frozen",
    ageGroup: "5-10",
    uniformPaid: true,
    monthlyFee: 4833,
    notes: "متوقف بداعي المرض",
  },
  // === 10-15 AGE GROUP ===
  {
    name: "آدم الشيخ صالح",
    fullName: "آدم وجدي الشيخ صالح",
    registrationDate: "2023-08-18",
    status: "active",
    ageGroup: "10-15",
    birthDate: "2014-05-26",
    nationality: "سوري",
    idNumber: "99622961868",
    parentPhone: "5367078017",
    school: "EMİNSEJ ORTA OKULU",
    address: "Başakşehir. Cahit Zarifoğlu caddesi. olimpa Park 2 sitesi. daire 41",
    uniformPaid: false,
    monthlyFee: 3500,
  },
  {
    name: "محمد عزام",
    fullName: "محمد حمزة عزام",
    registrationDate: "2023-09-01",
    status: "active",
    ageGroup: "10-15",
    birthDate: "1997-12-05",
    nationality: "أردني",
    idNumber: "99297847948",
    phone: "5340720934",
    parentPhone: "5318143790",
    school: "حاصل على شهادة الثانوية العامة",
    address: "Bulvar Istanbul - Blok J1 - Daire 80",
    uniformPaid: true,
    monthlyFee: 4000,
    busFee: 2000,
  },
  {
    name: "يوسف الأرناؤوط",
    registrationDate: "2023-10-11",
    status: "active",
    ageGroup: "10-15",
    birthDate: "2015-10-15",
    uniformPaid: false,
    monthlyFee: 0,
    notes: "لا توجد بيانات اشتراك",
  },
  {
    name: "علي ماوردي",
    fullName: "علي نبيل ماوردي",
    registrationDate: "2023-10-11",
    status: "active",
    ageGroup: "10-15",
    birthDate: "2014-03-16",
    nationality: "سوري",
    idNumber: "99033612250",
    parentPhone: "5344958374",
    address: "Başakşehir. Cahit Zarifoğlu caddesi. 17 B",
    uniformPaid: false,
    monthlyFee: 3500,
  },
  {
    name: "ماهر أبو حمدي",
    registrationDate: "2023-11-01",
    status: "active",
    ageGroup: "10-15",
    uniformPaid: false,
    monthlyFee: 0,
    notes: "دعم المواهب",
  },
  {
    name: "محمد هارون كايا",
    fullName: "محمد هارون كايا",
    registrationDate: "2024-09-14",
    status: "active",
    ageGroup: "10-15",
    birthDate: "2014-12-08",
    nationality: "فلسطيني - تركي",
    idNumber: "72976129788",
    parentPhone: "5331341139",
    school: "TOKİ-MUSTAFA KUTLU İMAM HATİP ORTAOKULU",
    address: "BULVAR İSTANBUL SİTESİ. BLOK:. B4. D:25/ BAŞAKŞEHİR-İSTANBUL",
    uniformPaid: true,
    monthlyFee: 4000,
  },
  {
    name: "عكرمة مصطفى أوغلو",
    fullName: "عكرمة مصطفى إبراهيم أوغلو",
    registrationDate: "2024-09-21",
    status: "active",
    ageGroup: "10-15",
    birthDate: "2012-10-13",
    nationality: "تركي",
    idNumber: "24842755782",
    phone: "5380539590",
    parentPhone: "5366609130",
    school: "Ertuğrul ortaokulu",
    address: "Başakşehir,kayabaşı avrupa konutları 2 A1-100",
    uniformPaid: true,
    monthlyFee: 5000,
    notes: "اشتراك 3 شهور",
  },
  {
    name: "حمزة عبادة",
    fullName: "حمزة نعيم عبادة",
    registrationDate: "2025-01-29",
    status: "active",
    ageGroup: "10-15",
    birthDate: "2014-03-15",
    nationality: "مصري",
    idNumber: "49102947400",
    parentPhone: "5301710683",
    school: "EMİN SARAÇ İMAM HATİP ORTA OKULU",
    address: "Başakşehir. Cahit Zarifoğlu caddesi. olimpa Park 2 sitesi. daire 10",
    uniformPaid: false,
    monthlyFee: 3500,
  },
  {
    name: "يوسف آرداملي",
    registrationDate: "2025-10-11",
    status: "frozen",
    ageGroup: "10-15",
    uniformPaid: false,
    monthlyFee: 1750,
    notes: "متوقف",
  },
  {
    name: "أمير تشوبوكلار",
    registrationDate: "2025-10-11",
    status: "frozen",
    ageGroup: "10-15",
    uniformPaid: false,
    monthlyFee: 1750,
    notes: "متوقف",
  },
  {
    name: "أحمد الطويل",
    fullName: "أحمد مؤيد إسماعيل الطويل",
    registrationDate: "2025-11-15",
    status: "active",
    ageGroup: "10-15",
    birthDate: "2014-08-12",
    nationality: "فلسطيني - غزة",
    idNumber: "99963917340",
    phone: "5510072543",
    parentPhone: "5394999444",
    school: "Toki Fenertepe ortaokulu",
    address: "كيا شهير -بولغي 24 - جوتش أدا",
    uniformPaid: true,
    monthlyFee: 5000,
    notes: "دعم المواهب",
  },
  {
    name: "سليمان حنبلي",
    fullName: "سليمان عبدالرحمن الحنبلي",
    registrationDate: "2025-11-08",
    status: "active",
    ageGroup: "10-15",
    birthDate: "2016-08-17",
    nationality: "لبناني-تركي",
    idNumber: "22595830992",
    parentPhone: "5319687991",
    school: "مدرسة الاحسان - اتاكينت",
    uniformPaid: false,
    monthlyFee: 6000,
    busFee: 2000,
    notes: "تم تجميد الاشتراك بتاريخ 10/01/2026 للسفر",
  },
  {
    name: "سليمان المشوخي",
    registrationDate: "2025-11-29",
    status: "active",
    ageGroup: "10-15",
    uniformPaid: true,
    monthlyFee: 6000,
  },
  {
    name: "حيدر أصلان",
    fullName: "حيدر مراد اصلان",
    registrationDate: "2025-12-06",
    status: "inactive",
    ageGroup: "10-15",
    birthDate: "2013-01-18",
    nationality: "سوري- تركي",
    idNumber: "35039565398",
    phone: "5555311111",
    parentPhone: "5555555512",
    school: "مدرسه الجزري",
    address: "وادي اسطنبول",
    uniformPaid: false,
    monthlyFee: 6000,
    notes: "منتهي",
  },
  {
    name: "آسر منشاوي",
    fullName: "آسر عبدالله جمال منشاوي",
    registrationDate: "2025-12-07",
    status: "active",
    ageGroup: "10-15",
    birthDate: "2013-08-19",
    nationality: "مصري",
    idNumber: "98911159160",
    phone: "5444477246",
    parentPhone: "5435504600",
    school: "الإحسان إنترناشيونال",
    address: "Mavera comfort sitesi olimpiyat | A6 blok/D10",
    uniformPaid: true,
    monthlyFee: 5000,
  },
  {
    name: "محمد طارق العلبي",
    fullName: "محمد طارق محمد فراس العلبي",
    registrationDate: "2025-12-13",
    status: "active",
    ageGroup: "10-15",
    birthDate: "2013-07-03",
    nationality: "تركي",
    idNumber: "41501199640",
    phone: "5010116600",
    parentPhone: "5396733372",
    school: "الإحسان إنترناشيونال",
    address: "BAŞAKŞEHİR kayabası mah. kayasehir BUL. Adim istanbol",
    uniformPaid: false,
    monthlyFee: 5500,
  },
  {
    name: "عبدالفتاح مهنا",
    fullName: "عبدالفتاح أحمد مهنا",
    registrationDate: "2025-12-13",
    status: "frozen",
    ageGroup: "10-15",
    nationality: "فلسطيني",
    idNumber: "99311452868",
    phone: "5382462811",
    parentPhone: "5301152811",
    school: "مدرسة القدس الدولية",
    address: "Başakşehir mahallesi oğuzhan Sokak nova rezidans no:4 iç kapı no:43 başakşehir İstanbul",
    uniformPaid: true,
    monthlyFee: 5000,
    notes: "متوقف",
  },
  {
    name: "كمال عبود",
    fullName: "كمال متني عبود",
    registrationDate: "2025-12-20",
    status: "active",
    ageGroup: "10-15",
    birthDate: "2015-05-11",
    nationality: "سوري",
    idNumber: "99509178020",
    parentPhone: "5350783546",
    school: "صلاح الدين الأيوبي",
    address: "باشاك شهير غوفرجين كايا جمهوريات جادسي/181",
    uniformPaid: false,
    monthlyFee: 0,
    notes: "دعم المواهب",
  },
  {
    name: "علي عبود",
    fullName: "محمد علي كارا عبود",
    registrationDate: "2025-12-20",
    status: "active",
    ageGroup: "10-15",
    nationality: "سوري",
    idNumber: "99220984924",
    parentPhone: "5395644880",
    school: "صلاح الدين الأيوبي",
    address: "باشاك شهير غوفرجين كايا جمهوريات جادسي/162",
    uniformPaid: false,
    monthlyFee: 0,
    notes: "دعم المواهب",
  },
  {
    name: "محمد عامر بيساني",
    registrationDate: "2025-12-15",
    status: "active",
    ageGroup: "10-15",
    uniformPaid: false,
    monthlyFee: 3500,
  },
  {
    name: "أشرف العثمان",
    fullName: "أشرف موفق العثمان",
    registrationDate: "2025-12-21",
    status: "active",
    ageGroup: "10-15",
    nationality: "سوري",
    idNumber: "99045516256",
    phone: "5398222399",
    parentPhone: "5375815026",
    school: "الإحسان",
    address: "Başak mahallesi gazi mustafa kemal bulvar 3.istanbul hasbahçe evleri A4 blok/ 44 daire",
    uniformPaid: false,
    monthlyFee: 5500,
  },
  // === 15+ AGE GROUP ===
  {
    name: "حذيفة أعويلي",
    fullName: "حذيفة جمال أعويلي",
    registrationDate: "2025-12-13",
    status: "active",
    ageGroup: "15+",
    nationality: "ليبي",
    idNumber: "32153516466",
    phone: "5551006601",
    parentPhone: "55510066050",
    school: "الجزري",
    address: "Movela comfort A1/2",
    uniformPaid: false,
    monthlyFee: 4800,
    notes: "نشط | غير مدفوع",
  },
  {
    name: "أويس أعويلي",
    fullName: "أويس جمال أعويلي",
    registrationDate: "2025-12-13",
    status: "active",
    ageGroup: "10-15",
    birthDate: "2015-03-12",
    nationality: "ليبي",
    idNumber: "32147516694",
    phone: "5389699020",
    parentPhone: "55510066050",
    school: "الجزري",
    address: "Movela comfort A1/2",
    uniformPaid: false,
    monthlyFee: 4800,
    notes: "نشط | غير مدفوع",
  },
  {
    name: "قصي بشيتي",
    registrationDate: "2025-12-01",
    status: "active",
    ageGroup: "15+",
    uniformPaid: false,
    monthlyFee: 5000,
  },
  {
    name: "محمد دامر",
    registrationDate: "2025-12-01",
    status: "active",
    ageGroup: "15+",
    uniformPaid: false,
    monthlyFee: 5000,
  },
  {
    name: "صهيب الذيب",
    registrationDate: "2026-01-01",
    status: "frozen",
    ageGroup: "10-15",
    uniformPaid: true,
    monthlyFee: 5000,
    notes: "متوقف - يريدون العودة بعد رمضان",
  },
  {
    name: "قصي الذيب",
    registrationDate: "2026-01-01",
    status: "frozen",
    ageGroup: "10-15",
    uniformPaid: true,
    monthlyFee: 5000,
    notes: "متوقف - يريدون العودة بعد رمضان",
  },
  {
    name: "يمان نجيب",
    fullName: "يمان نجيب زعبان",
    registrationDate: "2026-01-01",
    status: "active",
    ageGroup: "10-15",
    uniformPaid: true,
    monthlyFee: 5000,
    notes: "نشط | غير مدفوع",
  },
  {
    name: "شهاب الدين أبو معمر",
    fullName: "شهاب الدين أبو معمر",
    registrationDate: "2026-01-24",
    status: "active",
    ageGroup: "10-15",
    birthDate: "2012-06-09",
    nationality: "فلسطيني",
    idNumber: "432018687",
    phone: "5053703162",
    parentPhone: "5059891718",
    school: "الإحسان",
    address: "باشاك شهير إيفلاري - القسم الثالث - بلوك D",
    uniformPaid: true,
    monthlyFee: 5000,
    busFee: 2000,
  },
  {
    name: "خالد إسلام أوغلو",
    fullName: "خالد فاتح إسلام أوغلو",
    registrationDate: "2026-01-24",
    status: "active",
    ageGroup: "10-15",
    birthDate: "2012-10-04",
    nationality: "فلسطيني",
    idNumber: "24464768146",
    phone: "5350841539",
    parentPhone: "5304175822",
    school: "الإحسان",
    address: "كايا شهير - مافيرا",
    uniformPaid: false,
    monthlyFee: 6000,
    busFee: 2000,
  },
  {
    name: "براء ماجد",
    registrationDate: "2026-01-25",
    status: "active",
    ageGroup: "10-15",
    uniformPaid: false,
    monthlyFee: 6000,
  },
  {
    name: "حسن ماجد",
    registrationDate: "2026-01-25",
    status: "active",
    ageGroup: "10-15",
    uniformPaid: false,
    monthlyFee: 6000,
  },
  {
    name: "حارث إبراهيم",
    registrationDate: "2026-01-24",
    status: "active",
    ageGroup: "10-15",
    birthDate: "2013-01-17",
    nationality: "عراقي - تركي",
    idNumber: "50344903390",
    phone: "5516633175",
    parentPhone: "5306279074",
    address: "Mavera 4, AZ D: 22 kat: 8, kayaşehir",
    uniformPaid: false,
    monthlyFee: 5700,
    notes: "متبقي 700",
  },
  {
    name: "عمر إبراهيم",
    registrationDate: "2026-01-24",
    status: "active",
    ageGroup: "10-15",
    birthDate: "2014-05-02",
    nationality: "عراقي - تركي",
    idNumber: "5034903236",
    phone: "5516633175",
    parentPhone: "5306279074",
    address: "Mavera 4, AZ D: 22 kat: 8, kayaşehir",
    uniformPaid: false,
    monthlyFee: 5700,
    notes: "متبقي 700",
  },
  {
    name: "محمد أمير دهان",
    fullName: "محمد أمير دهان",
    registrationDate: "2026-02-01",
    status: "active",
    ageGroup: "5-10",
    nationality: "سوري - تركي",
    idNumber: "17771974632",
    parentPhone: "5161673000",
    address: "Başakşehir, park mavir 1, B2 blok, D: 101",
    uniformPaid: true,
    monthlyFee: 5000,
    notes: "نشط - غير مدفوع",
  },
];

// ===== CRM LEADS DATA (from CRM CSV) =====
interface LeadData {
  name: string;
  phone: string;
  childName?: string;
  age?: number;
  area?: string;
  status: "new" | "contacted" | "interested" | "trial_scheduled" | "trial_completed" | "converted" | "not_interested" | "waiting_other_area";
  notes?: string;
}

const leadsData: LeadData[] = [
  { name: "احمد مغربي", phone: "05395614277", childName: "حمدو مغربي", age: 15, area: "باغجلار", status: "trial_scheduled", notes: "لديه موهبة، كان في غالاتا سراي" },
  { name: "احمد والد عبدالفتاح مهنا", phone: "05301152811", childName: "عبدالفتاح مهنا", age: 11, status: "converted" },
  { name: "اخو عمر سامي الكوكو", phone: "05388279370", age: 8, area: "باشاك شهير", status: "not_interested", notes: "اعتذروا بسبب المبلغ" },
  { name: "سليم والد ارام اسسو", phone: "05070552156", childName: "ارام اسسو", age: 9, area: "يني بوسنا", status: "trial_completed" },
  { name: "عبدالرحمن هيثم", phone: "05056711340", status: "new" },
  { name: "محمد الرعد", phone: "05527557498", age: 11, area: "باغجلار", status: "new" },
  { name: "محمود فراس الاحمد", phone: "05375256392", age: 14, area: "اكيتللي", status: "new" },
  { name: "صالح خليل", phone: "05387409874", age: 7, status: "contacted", notes: "تم الدعوة للتجربة لكن من دون رد" },
  { name: "سعد والد حمزه موسى", phone: "05370115776", childName: "حمزة موسى", age: 5, area: "باشاك شهير", status: "converted" },
  { name: "فراس والد طارق علبي", phone: "05396733372", childName: "طارق العلبي", age: 13, area: "باشاك شهير", status: "converted", notes: "لاعب موهوب" },
  { name: "عبد المالك", phone: "05374083443", age: 8, area: "باشاك شهير", status: "trial_scheduled", notes: "من الجزائر لديه ولدين توام" },
  { name: "مجد اشرم", phone: "05346207067", age: 18, area: "تشامليجا", status: "trial_completed" },
  { name: "حذيفة اعويلي", phone: "5551006601", age: 16, area: "باشاك شهير", status: "converted" },
  { name: "صقر والد شحادة", phone: "5392685973", childName: "شحادة الشيخ حسين", age: 6, area: "باغجلار", status: "trial_scheduled" },
  { name: "عثمان الحموي", phone: "5526151917", age: 11, area: "اسنيورت", status: "waiting_other_area" },
  { name: "عبدالمجيد مرشو", phone: "5318321660", age: 12, area: "باغجلار", status: "contacted" },
  { name: "عبد الرحمن خضر", phone: "05380888470", age: 19, area: "زيتين بورنو", status: "trial_scheduled" },
  { name: "عمر والد عبد الله العلو", phone: "05388867166", childName: "عبد الله العلو", age: 11, area: "ولايه اورفا", status: "waiting_other_area" },
  { name: "والد محمود العبادي", phone: "5398524329", age: 17, area: "كوتشوك تشيكميجي", status: "trial_scheduled" },
];

// ===== MAIN SEED FUNCTION =====

/** Normalize phone to +905XXXXXXXXX format */
function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-\(\)\+]/g, "");
  if (cleaned.startsWith("0") && cleaned.length === 11) cleaned = cleaned.slice(1);
  if (cleaned.startsWith("90") && cleaned.length === 12) return "+" + cleaned;
  if (cleaned.startsWith("5") && cleaned.length === 10) return "+90" + cleaned;
  return "+90" + cleaned.replace(/^0+/, "");
}

async function seed() {
  console.log("🔴 Clearing all existing data...");

  // Clear tables in correct order (respect foreign keys)
  await db.execute(sql`DELETE FROM parent_evaluations`);
  await db.execute(sql`DELETE FROM survey_responses`);
  await db.execute(sql`DELETE FROM surveys`);
  await db.execute(sql`DELETE FROM evaluations`);
  await db.execute(sql`DELETE FROM escalation_logs`);
  await db.execute(sql`DELETE FROM notifications`);
  await db.execute(sql`DELETE FROM activity_logs`);
  await db.execute(sql`DELETE FROM lead_communications`);
  await db.execute(sql`DELETE FROM leads`);
  await db.execute(sql`DELETE FROM attendance`);
  await db.execute(sql`DELETE FROM training_sessions`);
  await db.execute(sql`DELETE FROM payment_coverage`);
  await db.execute(sql`DELETE FROM payments`);
  await db.execute(sql`DELETE FROM fee_configs`);
  await db.execute(sql`DELETE FROM contacts`);
  await db.execute(sql`DELETE FROM students`);

  console.log("✅ All tables cleared");

  // ===== 1. INSERT STUDENTS =====
  console.log("👥 Inserting students...");

  const studentIdMap: Record<string, string> = {};

  for (const s of studentsData) {
    const [inserted] = await db
      .insert(schema.students)
      .values({
        name: s.name,
        fullName: s.fullName,
        status: s.status,
        ageGroup: s.ageGroup,
        birthDate: s.birthDate,
        nationality: s.nationality,
        idNumber: s.idNumber,
        phone: s.phone ? normalizePhone(s.phone) : undefined,
        school: s.school,
        address: s.address,
        registrationDate: s.registrationDate,
        notes: s.notes,
        area: "باشاك شهير",
      })
      .returning();

    studentIdMap[s.name] = inserted.id;

    // Insert parent contact if parentPhone exists
    if (s.parentPhone) {
      await db.insert(schema.contacts).values({
        studentId: inserted.id,
        name: `ولي أمر ${s.name}`,
        relation: "father",
        phone: normalizePhone(s.parentPhone),
        isPrimaryPayer: true,
      });
    }

    // Insert fee config
    if (s.monthlyFee > 0) {
      await db.insert(schema.feeConfigs).values({
        studentId: inserted.id,
        monthlyFee: s.monthlyFee.toString(),
        busFee: s.busFee?.toString() ?? null,
        uniformPaid: s.uniformPaid,
        uniformPrice: s.uniformPaid ? "1000" : null,
        effectiveFrom: s.registrationDate,
      });
    }
  }

  console.log(`✅ ${studentsData.length} students inserted`);

  // ===== 2. INSERT CRM LEADS =====
  console.log("📋 Inserting CRM leads...");

  for (const lead of leadsData) {
    await db.insert(schema.leads).values({
      name: lead.name,
      phone: normalizePhone(lead.phone),
      childName: lead.childName,
      age: lead.age,
      area: lead.area,
      status: lead.status,
      source: "whatsapp",
    });
  }

  console.log(`✅ ${leadsData.length} leads inserted`);

  // ===== 3. INSERT TRAINING SESSIONS + ATTENDANCE =====
  console.log("📅 Inserting training sessions and attendance...");

  // Session dates and who attended (from Records CSV)
  interface SessionRecord {
    date: string;
    dayOfWeek: "saturday" | "sunday";
    groups: {
      ageGroup: "5-10" | "10-15" | "15+";
      students: string[];
    }[];
  }

  const sessions: SessionRecord[] = [
    {
      date: "2025-12-28", dayOfWeek: "sunday",
      groups: [
        { ageGroup: "5-10", students: ["يامن الطبشة", "زيد كوتشاك", "حسام صمودي", "كريم لطوف", "يزن ميستو", "يحيى أوزيل", "ياسين المصري", "زيد يحيى زكريا", "يوسف أبو خلف", "إيهاب عفانة", "عمر شاكر", "أحمد زين سلطان", "محمد الفاتح قولي", "نوح الشيخ صالح", "أحمد جاد عتيق", "سفيان هارون كايا", "عبدالله المبروك"] },
        { ageGroup: "10-15", students: ["يوسف الأرناؤوط", "محمد عزام", "عبدالفتاح مهنا", "آدم الشيخ صالح", "حمزة عبادة", "علي ماوردي", "سليمان حنبلي", "آسر منشاوي", "أشرف العثمان", "محمد طارق العلبي", "ماهر أبو حمدي", "محمد عامر بيساني", "كمال عبود", "علي عبود", "أويس أعويلي", "صهيب الذيب", "قصي الذيب", "يمان نجيب", "أحمد الطويل", "محمد هارون كايا", "حيدر أصلان", "سليمان المشوخي", "أمير تشوبوكلار", "يوسف آرداملي", "عكرمة مصطفى أوغلو"] },
        { ageGroup: "15+", students: ["حذيفة أعويلي", "قصي بشيتي", "محمد دامر"] },
      ],
    },
    {
      date: "2026-01-03", dayOfWeek: "saturday",
      groups: [
        { ageGroup: "5-10", students: ["عمر شاكر", "نوح الشيخ صالح", "زيد يحيى زكريا", "ياسين المصري", "يامن الطبشة", "كريم لطوف", "عبدالله المبروك", "زيد كوتشاك", "يحيى أوزيل", "أحمد جاد عتيق", "سفيان هارون كايا", "إيهاب عفانة", "حمزة موسى", "حسام صمودي", "يزن ميستو", "يوسف أبو خلف", "أحمد زين سلطان", "محمد الفاتح قولي"] },
        { ageGroup: "10-15", students: ["يوسف الأرناؤوط", "محمد عزام", "آدم الشيخ صالح", "حمزة عبادة", "علي ماوردي", "سليمان المشوخي", "كمال عبود", "آسر منشاوي", "عكرمة مصطفى أوغلو", "محمد عامر بيساني", "محمد طارق العلبي", "أشرف العثمان", "محمد هارون كايا", "أويس أعويلي", "صهيب الذيب", "قصي الذيب", "يمان نجيب", "أحمد الطويل", "حيدر أصلان", "أمير تشوبوكلار", "يوسف آرداملي", "عبدالفتاح مهنا", "ماهر أبو حمدي", "علي عبود", "سليمان حنبلي"] },
        { ageGroup: "15+", students: ["حذيفة أعويلي", "قصي بشيتي", "محمد دامر"] },
      ],
    },
    {
      date: "2026-01-04", dayOfWeek: "sunday",
      groups: [
        { ageGroup: "5-10", students: ["يزن ميستو", "أحمد جاد عتيق", "نوح الشيخ صالح", "ياسين المصري", "أحمد زين سلطان", "زيد كوتشاك", "زيد يحيى زكريا", "يحيى أوزيل", "عبدالله المبروك", "إيهاب عفانة", "كريم لطوف", "يامن الطبشة", "محمد الفاتح قولي", "سفيان هارون كايا", "حسام صمودي", "يوسف أبو خلف", "عمر شاكر", "حمزة موسى"] },
        { ageGroup: "10-15", students: ["يوسف الأرناؤوط", "محمد عزام", "آدم الشيخ صالح", "حمزة عبادة", "علي ماوردي", "سليمان المشوخي", "أشرف العثمان", "محمد هارون كايا", "أويس أعويلي", "سليمان حنبلي", "محمد عامر بيساني", "عكرمة مصطفى أوغلو", "آسر منشاوي", "صهيب الذيب", "قصي الذيب", "يمان نجيب", "أحمد الطويل", "حيدر أصلان", "عبدالفتاح مهنا", "ماهر أبو حمدي", "علي عبود", "كمال عبود", "محمد طارق العلبي"] },
        { ageGroup: "15+", students: ["حذيفة أعويلي", "قصي بشيتي"] },
      ],
    },
    {
      date: "2026-01-10", dayOfWeek: "saturday",
      groups: [
        { ageGroup: "5-10", students: ["زيد كوتشاك", "نوح الشيخ صالح", "محمد الفاتح قولي", "يوسف أبو خلف", "عبدالله المبروك", "زيد يحيى زكريا", "إيهاب عفانة", "ياسين المصري", "يامن الطبشة", "يحيى أوزيل", "كريم لطوف", "يزن ميستو", "أحمد جاد عتيق", "أحمد زين سلطان", "حسام صمودي", "عمر شاكر", "حمزة موسى"] },
        { ageGroup: "10-15", students: ["سليمان المشوخي", "عكرمة مصطفى أوغلو", "محمد عامر بيساني", "محمد هارون كايا", "محمد عزام", "سفيان هارون كايا", "محمد طارق العلبي", "يمان نجيب", "يوسف الأرناؤوط", "حمزة عبادة", "آدم الشيخ صالح", "أحمد الطويل", "حيدر أصلان", "عبدالفتاح مهنا", "ماهر أبو حمدي", "علي عبود", "كمال عبود", "سليمان حنبلي", "قصي الذيب", "صهيب الذيب", "آسر منشاوي", "أويس أعويلي", "علي ماوردي", "سليمان المشوخي", "أشرف العثمان"] },
        { ageGroup: "15+", students: ["قصي بشيتي", "حذيفة أعويلي"] },
      ],
    },
    {
      date: "2026-01-11", dayOfWeek: "sunday",
      groups: [
        { ageGroup: "5-10", students: ["محمد الفاتح قولي", "زيد كوتشاك", "كريم لطوف", "ياسين المصري", "زيد يحيى زكريا", "يوسف أبو خلف", "نوح الشيخ صالح", "أحمد زين سلطان", "أحمد جاد عتيق", "يامن الطبشة", "يزن ميستو", "حسام صمودي", "عمر شاكر", "حمزة موسى", "يحيى أوزيل", "إيهاب عفانة"] },
        { ageGroup: "10-15", students: ["محمد عامر بيساني", "يمان نجيب", "آدم الشيخ صالح", "أشرف العثمان", "محمد هارون كايا", "عكرمة مصطفى أوغلو", "علي ماوردي", "حمزة عبادة", "سليمان المشوخي", "محمد عزام", "محمد طارق العلبي", "يوسف الأرناؤوط", "سفيان هارون كايا", "قصي الذيب", "عبدالفتاح مهنا", "ماهر أبو حمدي", "علي عبود", "كمال عبود", "سليمان حنبلي", "آسر منشاوي", "أويس أعويلي", "أحمد الطويل", "حيدر أصلان"] },
        { ageGroup: "15+", students: ["حذيفة أعويلي"] },
      ],
    },
    {
      date: "2026-01-17", dayOfWeek: "saturday",
      groups: [
        { ageGroup: "5-10", students: ["أحمد جاد عتيق", "نوح الشيخ صالح", "يحيى أوزيل", "حسام صمودي", "يوسف أبو خلف", "إيهاب عفانة", "ياسين المصري", "عبدالله المبروك", "محمد الفاتح قولي", "عمر شاكر", "حمزة موسى", "يزن ميستو", "يامن الطبشة", "أحمد زين سلطان", "زيد يحيى زكريا", "كريم لطوف", "زيد كوتشاك"] },
        { ageGroup: "10-15", students: ["محمد عامر بيساني", "محمد طارق العلبي", "كمال عبود", "علي ماوردي", "حمزة عبادة", "علي عبود", "أحمد الطويل", "يوسف الأرناؤوط", "محمد هارون كايا", "آدم الشيخ صالح", "محمد عزام", "قصي الذيب", "سليمان المشوخي", "يمان نجيب", "آسر منشاوي", "سفيان هارون كايا", "أشرف العثمان", "عبدالفتاح مهنا", "ماهر أبو حمدي", "سليمان حنبلي", "أويس أعويلي", "حيدر أصلان", "صهيب الذيب", "عكرمة مصطفى أوغلو"] },
      ],
    },
    {
      date: "2026-01-18", dayOfWeek: "sunday",
      groups: [
        { ageGroup: "5-10", students: ["نوح الشيخ صالح", "أحمد جاد عتيق", "زيد يحيى زكريا", "محمد الفاتح قولي", "حسام صمودي", "عبدالله المبروك", "إيهاب عفانة", "عمر شاكر", "حمزة موسى", "يزن ميستو", "يامن الطبشة", "أحمد زين سلطان", "كريم لطوف", "زيد كوتشاك", "ياسين المصري", "يوسف أبو خلف", "يحيى أوزيل"] },
        { ageGroup: "10-15", students: ["علي ماوردي", "آسر منشاوي", "آدم الشيخ صالح", "حمزة عبادة", "أشرف العثمان", "محمد طارق العلبي", "أحمد الطويل", "محمد عامر بيساني", "عبدالفتاح مهنا", "ماهر أبو حمدي", "سليمان حنبلي", "أويس أعويلي", "حيدر أصلان", "سفيان هارون كايا", "يمان نجيب", "سليمان المشوخي", "قصي الذيب", "محمد عزام", "محمد هارون كايا", "يوسف الأرناؤوط", "كمال عبود", "صهيب الذيب", "عكرمة مصطفى أوغلو"] },
      ],
    },
    {
      date: "2026-01-24", dayOfWeek: "saturday",
      groups: [
        { ageGroup: "5-10", students: ["ياسين المصري", "زيد يحيى زكريا", "إيهاب عفانة", "نوح الشيخ صالح", "حسام صمودي", "محمد الفاتح قولي", "يحيى أوزيل", "أحمد جاد عتيق", "عبدالله المبروك", "يوسف أبو خلف", "زيد كوتشاك", "كريم لطوف", "أحمد زين سلطان", "يامن الطبشة", "يزن ميستو", "حمزة موسى", "عمر شاكر", "عكرمة مصطفى أوغلو"] },
        { ageGroup: "10-15", students: ["قصي الذيب", "سفيان هارون كايا", "يمان نجيب", "خالد إسلام أوغلو", "شهاب الدين أبو معمر", "سليمان المشوخي", "أشرف العثمان", "علي ماوردي", "محمد طارق العلبي", "محمد عامر بيساني", "آدم الشيخ صالح", "كمال عبود", "أحمد الطويل", "يوسف الأرناؤوط", "حارث إبراهيم", "عمر إبراهيم", "محمد هارون كايا", "محمد عزام", "حيدر أصلان", "أويس أعويلي", "ماهر أبو حمدي", "عبدالفتاح مهنا", "عكرمة مصطفى أوغلو"] },
      ],
    },
    {
      date: "2026-01-25", dayOfWeek: "sunday",
      groups: [
        { ageGroup: "5-10", students: ["حسام صمودي", "محمد الفاتح قولي", "نوح الشيخ صالح", "ياسين المصري", "أحمد جاد عتيق", "يوسف أبو خلف", "إيهاب عفانة", "يحيى أوزيل", "عبدالله المبروك", "زيد كوتشاك", "كريم لطوف", "أحمد زين سلطان", "يامن الطبشة", "يزن ميستو", "حمزة موسى", "عمر شاكر"] },
        { ageGroup: "10-15", students: ["سفيان هارون كايا", "شهاب الدين أبو معمر", "آسر منشاوي", "براء ماجد", "أشرف العثمان", "عمر إبراهيم", "حارث إبراهيم", "يوسف الأرناؤوط", "محمد طارق العلبي", "أحمد الطويل", "علي ماوردي", "محمد عامر بيساني", "حسن ماجد", "آدم الشيخ صالح", "حمزة عبادة", "محمد هارون كايا", "محمد عزام", "سليمان المشوخي", "حيدر أصلان", "أويس أعويلي", "ماهر أبو حمدي", "عبدالفتاح مهنا", "عكرمة مصطفى أوغلو"] },
      ],
    },
    {
      date: "2026-01-31", dayOfWeek: "saturday",
      groups: [
        { ageGroup: "5-10", students: ["زيد كوتشاك", "يحيى أوزيل", "محمد الفاتح قولي", "عبدالله المبروك", "ياسين المصري", "أحمد جاد عتيق", "حسام صمودي", "نوح الشيخ صالح", "كريم لطوف", "أحمد زين سلطان", "يامن الطبشة", "يزن ميستو", "حمزة موسى", "عمر شاكر", "إيهاب عفانة", "يوسف أبو خلف"] },
        { ageGroup: "10-15", students: ["محمد هارون كايا", "سفيان هارون كايا", "آدم الشيخ صالح", "شهاب الدين أبو معمر", "خالد إسلام أوغلو", "محمد عزام", "عمر إبراهيم", "حارث إبراهيم", "حسن ماجد", "براء ماجد", "محمد عامر بيساني", "محمد طارق العلبي", "أشرف العثمان", "أحمد الطويل", "عكرمة مصطفى أوغلو", "حمزة عبادة", "علي ماوردي", "يوسف الأرناؤوط", "سليمان المشوخي", "حيدر أصلان", "أويس أعويلي", "ماهر أبو حمدي", "عبدالفتاح مهنا", "كمال عبود", "سليمان المشوخي", "يمان نجيب"] },
      ],
    },
    {
      date: "2026-02-01", dayOfWeek: "sunday",
      groups: [
        { ageGroup: "5-10", students: ["أحمد جاد عتيق", "محمد أمير دهان", "حسام صمودي", "ياسين المصري", "زيد كوتشاك", "عبدالله المبروك", "محمد الفاتح قولي", "يوسف أبو خلف", "كريم لطوف", "أحمد زين سلطان", "يامن الطبشة", "يزن ميستو", "حمزة موسى", "عمر شاكر", "إيهاب عفانة", "نوح الشيخ صالح", "يحيى أوزيل"] },
        { ageGroup: "10-15", students: ["محمد هارون كايا", "سفيان هارون كايا", "شهاب الدين أبو معمر", "خالد إسلام أوغلو", "محمد عزام", "عمر إبراهيم", "حارث إبراهيم", "حسن ماجد", "براء ماجد", "محمد عامر بيساني", "محمد طارق العلبي", "أشرف العثمان", "أحمد الطويل", "عكرمة مصطفى أوغلو", "حمزة عبادة", "علي ماوردي", "يوسف الأرناؤوط", "سليمان المشوخي", "سليمان المشوخي", "حيدر أصلان", "أويس أعويلي", "ماهر أبو حمدي", "عبدالفتاح مهنا", "كمال عبود", "آدم الشيخ صالح", "يمان نجيب"] },
      ],
    },
    {
      date: "2026-02-07", dayOfWeek: "saturday",
      groups: [
        { ageGroup: "5-10", students: ["حسام صمودي", "زيد كوتشاك", "يحيى أوزيل", "نوح الشيخ صالح", "محمد الفاتح قولي", "يوسف أبو خلف", "أحمد جاد عتيق", "ياسين المصري", "إيهاب عفانة", "زيد يحيى زكريا", "عبدالله المبروك", "كريم لطوف", "أحمد زين سلطان", "يامن الطبشة", "يزن ميستو", "حمزة موسى", "عمر شاكر"] },
        { ageGroup: "10-15", students: ["حارث إبراهيم", "عمر إبراهيم", "أحمد الطويل", "حسن ماجد", "براء ماجد", "آدم الشيخ صالح", "شهاب الدين أبو معمر", "خالد إسلام أوغلو", "محمد عزام", "آسر منشاوي", "محمد عامر بيساني", "محمد طارق العلبي", "أشرف العثمان", "عكرمة مصطفى أوغلو", "حمزة عبادة", "علي ماوردي", "يوسف الأرناؤوط", "سليمان المشوخي", "سليمان حنبلي", "حيدر أصلان", "أويس أعويلي", "ماهر أبو حمدي", "عبدالفتاح مهنا", "كمال عبود", "يمان نجيب"] },
      ],
    },
  ];

  let sessionCount = 0;
  let attendanceCount = 0;

  for (const sess of sessions) {
    // Create one session per age group per date
    for (const group of sess.groups) {
      const [session] = await db
        .insert(schema.trainingSessions)
        .values({
          sessionDate: sess.date,
          dayOfWeek: sess.dayOfWeek,
          ageGroup: group.ageGroup,
        })
        .returning();

      sessionCount++;

      // Mark attendance for each student present (deduplicated)
      const uniqueStudents = [...new Set(group.students)];
      for (const studentName of uniqueStudents) {
        const studentId = studentIdMap[studentName];
        if (studentId) {
          await db.insert(schema.attendance).values({
            sessionId: session.id,
            studentId,
            status: "present",
          }).onConflictDoNothing();
          attendanceCount++;
        }
      }
    }
  }

  console.log(`✅ ${sessionCount} training sessions, ${attendanceCount} attendance records inserted`);

  // ===== 4. INSERT PAYMENTS =====
  console.log("💰 Inserting payments...");

  interface PaymentRecord {
    date: string;
    amount: number;
    method: "bank_transfer" | "cash";
    payerName: string;
    studentName: string; // can be multiple separated by "و"
    type: "monthly" | "bus" | "uniform";
    coverageStart?: string;
    coverageEnd?: string;
    notes?: string;
  }

  // Helper to parse DD/MM/YYYY to YYYY-MM-DD
  function parseDate(d: string): string {
    const parts = d.trim().split("/");
    if (parts.length !== 3) return d;
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const paymentsData: PaymentRecord[] = [
    // Pre-opening / early payments
    { date: "2025-08-08", amount: 2200, method: "bank_transfer", payerName: "ALİ ÖZİL", studentName: "يحيى أوزيل", type: "monthly" },
    { date: "2025-08-15", amount: 2000, method: "bank_transfer", payerName: "OULA ATAYA", studentName: "حسام صمودي", type: "monthly" },
    { date: "2025-08-27", amount: 3000, method: "bank_transfer", payerName: "HANSA ALTOUBAH", studentName: "محمد عزام", type: "monthly" },
    { date: "2025-09-06", amount: 2000, method: "bank_transfer", payerName: "زيد كوتشاك", studentName: "زيد كوتشاك", type: "monthly" },
    { date: "2025-09-10", amount: 2000, method: "bank_transfer", payerName: "MAHMOUD HUSSEN", studentName: "يامن الطبشة", type: "monthly" },
    { date: "2025-10-02", amount: 2000, method: "bank_transfer", payerName: "HANSA ALTOUBAH", studentName: "محمد عزام", type: "monthly" },
    // October onwards with coverage
    { date: "2025-10-18", amount: 4000, method: "bank_transfer", payerName: "OULA ATAYA", studentName: "حسام صمودي", type: "monthly", coverageStart: "2025-10-12", coverageEnd: "2026-04-12", notes: "دفعة أولى اشتراك 6 شهور" },
    { date: "2025-10-23", amount: 4000, method: "bank_transfer", payerName: "HANSA ALTOUBAH", studentName: "محمد عزام", type: "monthly", coverageStart: "2025-10-12", coverageEnd: "2025-11-12" },
    { date: "2025-11-01", amount: 12000, method: "cash", payerName: "والد فاتح", studentName: "محمد الفاتح قولي", type: "monthly", coverageStart: "2025-10-12", coverageEnd: "2026-02-12", notes: "اشتراك 4 شهور" },
    { date: "2025-11-01", amount: 3500, method: "cash", payerName: "والد زيد", studentName: "زيد كوتشاك", type: "monthly", coverageStart: "2025-10-12", coverageEnd: "2025-11-12" },
    { date: "2025-11-08", amount: 6000, method: "bank_transfer", payerName: "HALIT KARTAL", studentName: "ياسين المصري", type: "monthly", coverageStart: "2025-11-01", coverageEnd: "2025-12-01", notes: "يشمل الطقم" },
    { date: "2025-11-08", amount: 3500, method: "cash", payerName: "والد علي", studentName: "علي ماوردي", type: "monthly", coverageStart: "2025-10-12", coverageEnd: "2025-11-12" },
    { date: "2025-11-09", amount: 6000, method: "bank_transfer", payerName: "SARIA ELHANBALI", studentName: "سليمان حنبلي", type: "monthly", coverageStart: "2025-11-08", coverageEnd: "2025-12-08" },
    { date: "2025-11-09", amount: 3500, method: "bank_transfer", payerName: "DIMA ALSHIKH MEREI", studentName: "يامن الطبشة", type: "monthly", coverageStart: "2025-10-12", coverageEnd: "2025-11-12" },
    { date: "2025-11-09", amount: 7000, method: "bank_transfer", payerName: "ALAA MAHFOUZ", studentName: "آدم الشيخ صالح", type: "monthly", coverageStart: "2025-10-12", coverageEnd: "2025-11-12", notes: "آدم ونوح" },
    { date: "2025-11-15", amount: 5000, method: "bank_transfer", payerName: "ALİ ÖZİL", studentName: "يحيى أوزيل", type: "monthly", coverageStart: "2025-11-15", coverageEnd: "2025-12-15" },
    { date: "2025-11-15", amount: 7000, method: "bank_transfer", payerName: "MAHDI AMIN MOUSA ALMABROK", studentName: "عبدالله المبروك", type: "monthly", coverageStart: "2025-11-01", coverageEnd: "2025-12-01", notes: "يشمل الطقم" },
    { date: "2025-11-21", amount: 7000, method: "bank_transfer", payerName: "ALAA MAHFOUZ", studentName: "آدم الشيخ صالح", type: "monthly", coverageStart: "2025-11-12", coverageEnd: "2025-12-12", notes: "آدم ونوح" },
    { date: "2025-11-22", amount: 4240, method: "cash", payerName: "والد أحمد", studentName: "أحمد الطويل", type: "monthly", coverageStart: "2025-11-15", coverageEnd: "2025-12-15" },
    { date: "2025-11-23", amount: 4000, method: "bank_transfer", payerName: "OULA ATAYA", studentName: "حسام صمودي", type: "monthly", coverageStart: "2025-10-12", coverageEnd: "2026-04-12" },
    { date: "2025-11-28", amount: 4000, method: "bank_transfer", payerName: "HANSA ALTOUBAH", studentName: "محمد عزام", type: "monthly", coverageStart: "2025-11-12", coverageEnd: "2025-12-12" },
    { date: "2025-11-28", amount: 6000, method: "bank_transfer", payerName: "HALİT İBRAHİM ÖZ", studentName: "سليمان المشوخي", type: "monthly", coverageStart: "2025-11-29", coverageEnd: "2025-12-29" },
    { date: "2025-11-29", amount: 3500, method: "cash", payerName: "والد زيد", studentName: "زيد كوتشاك", type: "monthly", coverageStart: "2025-11-12", coverageEnd: "2025-12-12" },
    { date: "2025-11-30", amount: 6000, method: "bank_transfer", payerName: "ZAKARIA ATIK", studentName: "أحمد جاد عتيق", type: "monthly", coverageStart: "2025-10-25", coverageEnd: "2025-11-25", notes: "اشتراك 4000 + 2000 باص" },
    { date: "2025-12-04", amount: 3500, method: "bank_transfer", payerName: "DIMA ALSHIKH MEREI", studentName: "يامن الطبشة", type: "monthly", coverageStart: "2025-11-12", coverageEnd: "2025-12-12" },
    { date: "2025-12-06", amount: 7000, method: "bank_transfer", payerName: "IMAN EBDA", studentName: "حمزة عبادة", type: "monthly", coverageStart: "2025-10-12", coverageEnd: "2025-12-12", notes: "اشتراك عن شهرين" },
    { date: "2025-12-06", amount: 6000, method: "cash", payerName: "والد حيدر", studentName: "حيدر أصلان", type: "monthly", coverageStart: "2025-12-06", coverageEnd: "2026-01-06" },
    { date: "2025-12-06", amount: 5000, method: "bank_transfer", payerName: "HALIT KARTAL", studentName: "ياسين المصري", type: "monthly", coverageStart: "2025-12-01", coverageEnd: "2026-01-01" },
    { date: "2025-12-06", amount: 7000, method: "bank_transfer", payerName: "AMIR MOHAMMAD ABUKHALAF", studentName: "يوسف أبو خلف", type: "monthly", coverageStart: "2025-12-06", coverageEnd: "2026-01-06", notes: "يشمل الطقم" },
    { date: "2025-12-06", amount: 10000, method: "bank_transfer", payerName: "NURAY KAYA", studentName: "محمد هارون كايا", type: "monthly", coverageStart: "2025-12-01", coverageEnd: "2026-01-01", notes: "محمد وسفيان هارون - يشمل الطقم" },
    { date: "2025-12-06", amount: 1000, method: "cash", payerName: "والد أحمد", studentName: "أحمد الطويل", type: "monthly", coverageStart: "2025-11-15", coverageEnd: "2025-12-15" },
    { date: "2025-12-06", amount: 7000, method: "bank_transfer", payerName: "DENİZ YILDIRIM", studentName: "إيهاب عفانة", type: "monthly", coverageStart: "2025-11-30", coverageEnd: "2025-12-30", notes: "يشمل الطقم" },
    { date: "2025-12-07", amount: 1200, method: "cash", payerName: "والد أحمد", studentName: "أحمد الطويل", type: "monthly", coverageStart: "2025-11-15", coverageEnd: "2025-12-15" },
    { date: "2025-12-07", amount: 6000, method: "bank_transfer", payerName: "MAHDI AMIN MOUSA ALMABROK", studentName: "عبدالله المبروك", type: "monthly", coverageStart: "2025-12-01", coverageEnd: "2026-01-01" },
    { date: "2025-12-07", amount: 4000, method: "cash", payerName: "الدكتور أحمد شاكر", studentName: "عمر شاكر", type: "monthly", coverageStart: "2025-12-06", coverageEnd: "2026-01-06" },
    { date: "2025-12-08", amount: 6500, method: "bank_transfer", payerName: "MEDHAT MOHAMMED ELSHERIF", studentName: "آسر منشاوي", type: "monthly", coverageStart: "2025-12-07", coverageEnd: "2026-01-07", notes: "يشمل الطقم" },
    { date: "2025-12-08", amount: 6000, method: "bank_transfer", payerName: "SARIA ELHANBALI", studentName: "سليمان حنبلي", type: "monthly", coverageStart: "2025-12-08", coverageEnd: "2026-01-08" },
    { date: "2025-12-09", amount: 5000, method: "bank_transfer", payerName: "YAHYA ZAKARIA HASSAN GAMAL", studentName: "زيد يحيى زكريا", type: "monthly", coverageStart: "2025-12-07", coverageEnd: "2026-01-07", notes: "اشتراك 4000 + 1000 طقم" },
    { date: "2025-12-10", amount: 8500, method: "bank_transfer", payerName: "MOHAMAD SAEED DABABO", studentName: "أحمد زين سلطان", type: "monthly", coverageStart: "2025-12-01", coverageEnd: "2026-01-01", notes: "اشتراك 5500 + طقم وباص" },
    { date: "2025-12-14", amount: 3500, method: "cash", payerName: "والد زيد", studentName: "زيد كوتشاك", type: "monthly", coverageStart: "2025-12-12", coverageEnd: "2026-01-12" },
    { date: "2025-12-14", amount: 3500, method: "cash", payerName: "والد علي", studentName: "علي ماوردي", type: "monthly", coverageStart: "2025-11-12", coverageEnd: "2025-12-12" },
    { date: "2025-12-14", amount: 6000, method: "bank_transfer", payerName: "AHMED G M MHANNA", studentName: "عبدالفتاح مهنا", type: "monthly", coverageStart: "2025-12-13", coverageEnd: "2026-01-13", notes: "اشتراك 5000 + 1000 طقم" },
    { date: "2025-12-15", amount: 4800, method: "bank_transfer", payerName: "MUHAMMET FIRAS OLABI", studentName: "محمد طارق العلبي", type: "monthly", coverageStart: "2025-12-06", coverageEnd: "2026-01-06", notes: "عرض الجمعة البيضاء" },
    { date: "2025-12-16", amount: 3500, method: "bank_transfer", payerName: "IMAN EBDA", studentName: "حمزة عبادة", type: "monthly", coverageStart: "2025-12-12", coverageEnd: "2026-01-12" },
    { date: "2025-12-16", amount: 4000, method: "bank_transfer", payerName: "HANSA ALTOUBAH", studentName: "محمد عزام", type: "monthly", coverageStart: "2025-12-12", coverageEnd: "2026-01-12" },
    { date: "2025-12-17", amount: 9600, method: "bank_transfer", payerName: "ROUFEEDAH AVELI", studentName: "حذيفة أعويلي", type: "monthly", coverageStart: "2025-12-13", coverageEnd: "2026-01-13", notes: "حذيفة وأويس أعويلي" },
    { date: "2025-12-19", amount: 3500, method: "bank_transfer", payerName: "DIMA ALSHIKH MEREI", studentName: "يامن الطبشة", type: "monthly", coverageStart: "2025-12-12", coverageEnd: "2026-01-12" },
    { date: "2025-12-20", amount: 3000, method: "cash", payerName: "الدكتور أحمد شاكر", studentName: "عمر شاكر", type: "monthly", coverageStart: "2025-12-06", coverageEnd: "2026-01-06", notes: "تكملة الاشتراك" },
    { date: "2025-12-20", amount: 6000, method: "bank_transfer", payerName: "ALİ ÖZİL", studentName: "يحيى أوزيل", type: "monthly", coverageStart: "2025-12-15", coverageEnd: "2026-01-15", notes: "يشمل الطقم" },
    { date: "2025-12-20", amount: 7000, method: "bank_transfer", payerName: "ALAA MAHFOUZ", studentName: "آدم الشيخ صالح", type: "monthly", coverageStart: "2025-12-12", coverageEnd: "2026-01-12", notes: "آدم ونوح" },
    { date: "2025-12-20", amount: 9000, method: "bank_transfer", payerName: "OULA ATAYA", studentName: "حسام صمودي", type: "monthly", coverageStart: "2025-10-12", coverageEnd: "2026-04-12", notes: "شهرين + طقم" },
    { date: "2025-12-21", amount: 3500, method: "bank_transfer", payerName: "AMER ALBISANI", studentName: "محمد عامر بيساني", type: "monthly", coverageStart: "2025-12-15", coverageEnd: "2026-01-15" },
    { date: "2025-12-21", amount: 5500, method: "bank_transfer", payerName: "MUWAFFAK ALOSMAN", studentName: "أشرف العثمان", type: "monthly", coverageStart: "2025-12-21", coverageEnd: "2026-01-21" },
    { date: "2025-12-21", amount: 5000, method: "cash", payerName: "والد فاتح", studentName: "محمد الفاتح قولي", type: "monthly", coverageStart: "2025-10-12", coverageEnd: "2026-02-12", notes: "يشمل الطقم وتصفية باص" },
    { date: "2025-12-21", amount: 15000, method: "cash", payerName: "والد عكرمة", studentName: "عكرمة مصطفى أوغلو", type: "monthly", coverageStart: "2025-12-21", coverageEnd: "2026-03-21", notes: "3 شهور - يشمل الطقم" },
    { date: "2025-12-25", amount: 4000, method: "bank_transfer", payerName: "ZAKARIA ATIK", studentName: "أحمد جاد عتيق", type: "monthly", coverageStart: "2025-11-25", coverageEnd: "2025-12-25" },
    { date: "2025-12-26", amount: 2000, method: "bank_transfer", payerName: "HANSA ALTOUBAH", studentName: "محمد عزام", type: "bus" },
    { date: "2025-12-26", amount: 2000, method: "bank_transfer", payerName: "SARIA ELHANBALI", studentName: "سليمان حنبلي", type: "bus", notes: "تصفية اشتراك الباص" },
    { date: "2025-12-26", amount: 1000, method: "bank_transfer", payerName: "FUTOUN İSTANBULİ KOÇAK", studentName: "زيد كوتشاك", type: "uniform" },
    { date: "2025-12-27", amount: 6000, method: "bank_transfer", payerName: "HALİT İBRAHİM ÖZ", studentName: "سليمان المشوخي", type: "monthly", coverageStart: "2025-12-28", coverageEnd: "2026-01-28" },
    { date: "2025-12-27", amount: 6000, method: "cash", payerName: "والد يزن", studentName: "يزن ميستو", type: "monthly", coverageStart: "2025-12-28", coverageEnd: "2026-01-28", notes: "يشمل الطقم" },
    { date: "2025-12-28", amount: 3500, method: "cash", payerName: "والد علي", studentName: "علي ماوردي", type: "monthly", coverageStart: "2025-12-12", coverageEnd: "2026-11-12" },
    { date: "2025-12-29", amount: 15000, method: "bank_transfer", payerName: "DENİZ YILDIRIM", studentName: "إيهاب عفانة", type: "monthly", coverageStart: "2025-12-30", coverageEnd: "2026-03-30", notes: "3 شهور" },
    { date: "2025-12-30", amount: 14500, method: "bank_transfer", payerName: "AHMAD MAKSOUM", studentName: "كريم لطوف", type: "monthly", coverageStart: "2025-10-15", coverageEnd: "2026-01-15", notes: "3 شهور - يشمل الطقم" },
    { date: "2025-12-30", amount: 17000, method: "bank_transfer", payerName: "SARIA ELHANBALI", studentName: "سليمان حنبلي", type: "monthly", coverageStart: "2026-01-01", coverageEnd: "2026-04-01", notes: "3 شهور + اشتراك باص لمدة شهر" },
    { date: "2025-12-31", amount: 500, method: "bank_transfer", payerName: "AHMED G M MHANNA", studentName: "عبدالفتاح مهنا", type: "bus", notes: "تصفية باص" },
    // January 2026
    { date: "2026-01-04", amount: 6000, method: "bank_transfer", payerName: "MAHDI AMIN MOUSA ALMABROK", studentName: "عبدالله المبروك", type: "monthly", coverageStart: "2026-01-01", coverageEnd: "2026-02-01" },
    { date: "2026-01-04", amount: 1000, method: "bank_transfer", payerName: "MAZEN MESTO", studentName: "يزن ميستو", type: "uniform" },
    { date: "2026-01-04", amount: 8000, method: "bank_transfer", payerName: "FAWZI NOUH ALDEEB", studentName: "صهيب الذيب", type: "monthly", coverageStart: "2026-01-01", coverageEnd: "2026-02-01", notes: "صهيب وقصي الذيب" },
    { date: "2026-01-04", amount: 8000, method: "bank_transfer", payerName: "NURAY KAYA", studentName: "محمد هارون كايا", type: "monthly", coverageStart: "2026-01-01", coverageEnd: "2026-02-01", notes: "محمد وسفيان هارون" },
    { date: "2026-01-05", amount: 5000, method: "bank_transfer", payerName: "DINA ABOU SALEH", studentName: "أحمد جاد عتيق", type: "monthly", coverageStart: "2025-12-25", coverageEnd: "2026-01-25", notes: "يشمل الطقم" },
    { date: "2026-01-07", amount: 5000, method: "bank_transfer", payerName: "HALIT KARTAL", studentName: "ياسين المصري", type: "monthly", coverageStart: "2026-01-01", coverageEnd: "2026-02-01" },
    { date: "2026-01-10", amount: 4000, method: "bank_transfer", payerName: "SUMAIA ZABAAN", studentName: "يمان نجيب", type: "monthly", coverageStart: "2026-01-01", coverageEnd: "2026-02-01" },
    { date: "2026-01-10", amount: 15000, method: "bank_transfer", payerName: "AMIR MOHAMMAD ABUKHALAF", studentName: "يوسف أبو خلف", type: "monthly", coverageStart: "2026-01-06", coverageEnd: "2026-04-06", notes: "3 شهور" },
    { date: "2026-01-12", amount: 2000, method: "bank_transfer", payerName: "SAADEDDIN MUSA", studentName: "حمزة موسى", type: "monthly" },
    { date: "2026-01-12", amount: 4000, method: "bank_transfer", payerName: "HANSA ALTOUBAH", studentName: "محمد عزام", type: "monthly", coverageStart: "2026-01-12", coverageEnd: "2026-02-12" },
    { date: "2026-01-12", amount: 1000, method: "bank_transfer", payerName: "SUMAIA ZABAAN", studentName: "يمان نجيب", type: "uniform" },
    { date: "2026-01-14", amount: 2000, method: "bank_transfer", payerName: "FAWZI NOUH ALDEEB", studentName: "صهيب الذيب", type: "uniform", notes: "طقم صهيب وقصي الذيب" },
    { date: "2026-01-15", amount: 14000, method: "bank_transfer", payerName: "Sohaila Medhat", studentName: "آسر منشاوي", type: "monthly", coverageStart: "2026-01-17", coverageEnd: "2026-04-17", notes: "3 شهور" },
    { date: "2026-01-16", amount: 5000, method: "bank_transfer", payerName: "ALİ ÖZİL", studentName: "يحيى أوزيل", type: "monthly", coverageStart: "2026-01-15", coverageEnd: "2026-02-15" },
    { date: "2026-01-16", amount: 4000, method: "bank_transfer", payerName: "YAHYA ZAKARIA HASSAN GAMAL", studentName: "زيد يحيى زكريا", type: "monthly", coverageStart: "2026-01-07", coverageEnd: "2026-02-07" },
    { date: "2026-01-17", amount: 3500, method: "bank_transfer", payerName: "AMER ALBISANI", studentName: "محمد عامر بيساني", type: "monthly", coverageStart: "2026-01-15", coverageEnd: "2026-02-15" },
    { date: "2026-01-17", amount: 7000, method: "bank_transfer", payerName: "ALAA MAHFOUZ", studentName: "آدم الشيخ صالح", type: "monthly", coverageStart: "2026-01-12", coverageEnd: "2026-02-12", notes: "آدم ونوح" },
    { date: "2026-01-17", amount: 3500, method: "bank_transfer", payerName: "IMAN EBADA", studentName: "حمزة عبادة", type: "monthly", coverageStart: "2026-01-12", coverageEnd: "2026-02-12" },
    { date: "2026-01-17", amount: 5500, method: "bank_transfer", payerName: "MUHAMMET FIRAS OLABI", studentName: "محمد طارق العلبي", type: "monthly", coverageStart: "2026-01-13", coverageEnd: "2026-02-13" },
    { date: "2026-01-19", amount: 4000, method: "bank_transfer", payerName: "MOHAMAD SAEED DABABO", studentName: "أحمد زين سلطان", type: "monthly", coverageStart: "2026-01-01", coverageEnd: "2026-02-01" },
    { date: "2026-01-20", amount: 15000, method: "bank_transfer", payerName: "ABDULLAH MUAMMER", studentName: "شهاب الدين أبو معمر", type: "monthly", coverageStart: "2026-01-24", coverageEnd: "2026-04-24", notes: "3 شهور" },
    { date: "2026-01-20", amount: 2000, method: "bank_transfer", payerName: "RADWAN N M ABUMUAMAR", studentName: "شهاب الدين أبو معمر", type: "bus" },
    { date: "2026-01-24", amount: 6000, method: "bank_transfer", payerName: "EMAN İSLAMOĞLU", studentName: "خالد إسلام أوغلو", type: "monthly", coverageStart: "2026-01-24", coverageEnd: "2026-02-24" },
    { date: "2026-01-24", amount: 3500, method: "bank_transfer", payerName: "ALAA MAHFOUZ", studentName: "علي ماوردي", type: "monthly", coverageStart: "2026-01-12", coverageEnd: "2026-02-12" },
    { date: "2026-01-24", amount: 15000, method: "cash", payerName: "والد حسام", studentName: "حسام صمودي", type: "monthly", coverageStart: "2025-10-15", coverageEnd: "2026-06-15", notes: "تعديل الاشتراك لـ 8 شهور" },
    { date: "2026-01-24", amount: 5500, method: "cash", payerName: "أشرف", studentName: "أشرف العثمان", type: "monthly", coverageStart: "2026-01-21", coverageEnd: "2026-02-21" },
    { date: "2026-01-25", amount: 2000, method: "bank_transfer", payerName: "EMAN İSLAMOĞLU", studentName: "خالد إسلام أوغلو", type: "bus" },
    { date: "2026-01-31", amount: 3500, method: "cash", payerName: "والدة زيد", studentName: "زيد كوتشاك", type: "monthly", coverageStart: "2026-01-31", coverageEnd: "2026-03-02" },
    { date: "2026-01-31", amount: 2000, method: "bank_transfer", payerName: "HANSA ALTOUBAH", studentName: "محمد عزام", type: "uniform" },
    { date: "2026-01-31", amount: 12000, method: "bank_transfer", payerName: "NOUR ABUKUTAISH", studentName: "براء ماجد", type: "monthly", coverageStart: "2026-01-25", coverageEnd: "2026-02-25", notes: "حسن وبراء ماجد" },
    { date: "2026-01-31", amount: 10000, method: "cash", payerName: "والد الحارث وعمر", studentName: "حارث إبراهيم", type: "monthly", coverageStart: "2026-01-24", coverageEnd: "2026-02-24", notes: "حارث وعمر إبراهيم - متبقي 1400" },
    // February 2026
    { date: "2026-02-01", amount: 4000, method: "bank_transfer", payerName: "MOHAMAD SAEED DABABO", studentName: "أحمد زين سلطان", type: "monthly", coverageStart: "2026-02-01", coverageEnd: "2026-03-01" },
    { date: "2026-02-01", amount: 4000, method: "bank_transfer", payerName: "ZAKARIA ATIK", studentName: "أحمد جاد عتيق", type: "monthly", coverageStart: "2026-01-25", coverageEnd: "2026-02-25" },
    { date: "2026-02-01", amount: 2000, method: "cash", payerName: "والد محمد", studentName: "محمد أمير دهان", type: "uniform" },
    { date: "2026-02-01", amount: 12000, method: "cash", payerName: "والد محمد وسفيان", studentName: "محمد هارون كايا", type: "monthly", coverageStart: "2026-02-01", coverageEnd: "2026-03-01", notes: "اشتراك شهر + طقمين" },
    { date: "2026-02-02", amount: 5000, method: "bank_transfer", payerName: "HALIT KARTAL", studentName: "ياسين المصري", type: "monthly", coverageStart: "2026-02-01", coverageEnd: "2026-03-01" },
    { date: "2026-02-03", amount: 7000, method: "bank_transfer", payerName: "HALİT İBRAHİM ÖZ", studentName: "سليمان المشوخي", type: "monthly", coverageStart: "2026-02-01", coverageEnd: "2026-03-01" },
    { date: "2026-02-05", amount: 2000, method: "bank_transfer", payerName: "HANSA ALTOUBAH", studentName: "محمد عزام", type: "bus" },
    { date: "2026-02-06", amount: 6000, method: "bank_transfer", payerName: "MAHDI AMIN MOUSA ALMABROK", studentName: "عبدالله المبروك", type: "monthly", coverageStart: "2026-02-01", coverageEnd: "2026-03-01" },
    { date: "2026-02-06", amount: 2000, method: "bank_transfer", payerName: "RADWAN N M ABUMUAMAR", studentName: "شهاب الدين أبو معمر", type: "uniform" },
    { date: "2026-02-08", amount: 15000, method: "cash", payerName: "والد محمد الدهان", studentName: "محمد أمير دهان", type: "monthly", coverageStart: "2026-02-01", coverageEnd: "2026-05-01", notes: "3 شهور" },
    { date: "2026-02-08", amount: 1400, method: "cash", payerName: "والد الحارث وعمر", studentName: "حارث إبراهيم", type: "monthly", notes: "متبقي الاشتراك" },
    { date: "2026-02-08", amount: 4000, method: "cash", payerName: "والد الحارث وعمر", studentName: "حارث إبراهيم", type: "uniform", notes: "طقم حارث وعمر" },
    { date: "2026-02-10", amount: 4000, method: "bank_transfer", payerName: "YAHYA ZAKARIA HASSAN GAMAL", studentName: "زيد يحيى زكريا", type: "monthly", coverageStart: "2026-02-08", coverageEnd: "2026-03-08" },
  ];

  let paymentCount = 0;
  let paymentSkipped = 0;

  for (const p of paymentsData) {
    // Try to find the student by name
    const studentId = studentIdMap[p.studentName];

    if (!studentId) {
      console.warn(`  ⚠ Payment skipped: student "${p.studentName}" not found`);
      paymentSkipped++;
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
    paymentCount++;
  }

  if (paymentSkipped > 0) {
    console.log(`  ⚠ ${paymentSkipped} payments skipped (student not found)`);
  }

  console.log(`✅ ${paymentCount} payments inserted`);

  // ===== PAYMENT COVERAGE =====
  console.log("\n📋 Generating payment coverage...");

  // Sibling keyword detection: [keyword in notes, primaryStudentName, siblingName]
  const siblingKeywords: [string, string, string][] = [
    ["آدم ونوح", "آدم الشيخ صالح", "نوح الشيخ صالح"],
    ["محمد وسفيان هارون", "محمد هارون كايا", "سفيان هارون كايا"],
    ["محمد وسفيان", "محمد هارون كايا", "سفيان هارون كايا"],
    ["صهيب وقصي", "صهيب الذيب", "قصي الذيب"],
    ["حارث وعمر", "حارث إبراهيم", "عمر إبراهيم"],
    ["حسن وبراء", "براء ماجد", "حسن ماجد"],
    ["حذيفة وأويس", "حذيفة أعويلي", "أويس أعويلي"],
  ];

  function getMonthsBetween(startDate: string, endDate: string): string[] {
    const s = new Date(startDate);
    const e = new Date(endDate);
    let total = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
    if (total <= 0) total = 1;
    if (total > 12) total = 12;
    const months: string[] = [];
    for (let i = 0; i < total; i++) {
      const m = (s.getMonth() + i) % 12;
      const y = s.getFullYear() + Math.floor((s.getMonth() + i) / 12);
      months.push(`${y}-${String(m + 1).padStart(2, "0")}`);
    }
    return months;
  }

  // Collect all payments from DB for this student, then generate coverage
  const allDbPayments = await db.select().from(schema.payments);
  const allFeeConfigs = await db.select().from(schema.feeConfigs);
  const feeConfigMap = new Map(allFeeConfigs.map(fc => [fc.studentId, fc]));
  const reverseStudentMap = new Map(Object.entries(studentIdMap).map(([name, id]) => [id, name]));

  const coverageSeen = new Set<string>();
  let coverageCount = 0;

  for (const pmt of allDbPayments) {
    if (pmt.paymentType === "uniform") continue;
    if (!pmt.coverageStart || !pmt.coverageEnd) continue;

    const feeType: "monthly" | "bus" = pmt.paymentType === "bus" ? "bus" : "monthly";
    const months = getMonthsBetween(pmt.coverageStart, pmt.coverageEnd);
    const studentName = reverseStudentMap.get(pmt.studentId) || "";

    // Collect student IDs to create coverage for (this student + possible sibling)
    const studentIds = [pmt.studentId];
    if (pmt.notes) {
      for (const [keyword, name1, name2] of siblingKeywords) {
        if (pmt.notes.includes(keyword)) {
          const siblingName = studentName === name1 ? name2 : studentName === name2 ? name1 : null;
          if (siblingName && studentIdMap[siblingName]) {
            studentIds.push(studentIdMap[siblingName]);
          }
          break;
        }
      }
    }

    for (const sid of studentIds) {
      const fc = feeConfigMap.get(sid);
      const amountDue = feeType === "monthly"
        ? parseFloat(fc?.monthlyFee || "0")
        : parseFloat(fc?.busFee || "0");
      if (amountDue === 0) continue;

      for (const ym of months) {
        const key = `${sid}|${ym}|${feeType}`;
        if (coverageSeen.has(key)) continue;
        coverageSeen.add(key);

        await db.insert(schema.paymentCoverage).values({
          studentId: sid,
          feeType,
          yearMonth: ym,
          amountDue: amountDue.toString(),
          amountPaid: amountDue.toString(),
          status: "paid",
          paymentId: pmt.id,
        });
        coverageCount++;
      }
    }
  }

  console.log(`✅ ${coverageCount} payment coverage records inserted`);

  // ===== SUMMARY =====
  console.log("\n🎉 Seed completed!");
  console.log(`   Students:     ${studentsData.length}`);
  console.log(`   CRM Leads:    ${leadsData.length}`);
  console.log(`   Sessions:     ${sessionCount}`);
  console.log(`   Attendance:   ${attendanceCount}`);
  console.log(`   Payments:     ${paymentCount}`);
  console.log(`   Coverage:     ${coverageCount}`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  });
