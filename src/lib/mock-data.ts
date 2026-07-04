import type { Transaction, SpendingWeek, Category, KycEntry, ScheduledPayment } from "@/types/transaction";

export const TRANSACTIONS: Transaction[] = [
  { id: "GHP-001", date: "16 Jun 2026", time: "10:42 AM", name: "Kwame Mensah",   type: "Sent",     method: "MTN MoMo",      amount: -200,  status: "completed", note: "Thank you bro 🙏",      ref: "GHP-20260616-4821", fee: 0, phone: "0244 567 890" },
  { id: "GHP-002", date: "16 Jun 2026", time: "08:30 AM", name: "ECG Token",      type: "Bill",     method: "Electricity",   amount: -100,  status: "completed", note: "Meter: 1234567890",    ref: "GHP-20260616-3201", fee: 0, phone: "" },
  { id: "GHP-003", date: "15 Jun 2026", time: "05:15 PM", name: "Abena Asante",   type: "Received", method: "GhanaPay",      amount: 500,   status: "completed", note: "School fees share",    ref: "GHP-20260615-9822", fee: 0, phone: "0201 234 567" },
  { id: "GHP-004", date: "15 Jun 2026", time: "02:00 PM", name: "MTN Airtime",    type: "Airtime",  method: "MTN",           amount: -50,   status: "completed", note: "Self top-up",          ref: "GHP-20260615-7711", fee: 0, phone: "" },
  { id: "GHP-005", date: "14 Jun 2026", time: "09:00 AM", name: "Kofi Landlord",  type: "Sent",     method: "Bank Transfer", amount: -1500, status: "completed", note: "June rent",            ref: "GHP-20260614-0032", fee: 2, phone: "0277 890 123" },
  { id: "GHP-006", date: "13 Jun 2026", time: "11:20 AM", name: "DStv Subscription", type: "Bill", method: "TV",            amount: -180,  status: "completed", note: "Compact Plus",         ref: "GHP-20260613-5544", fee: 0, phone: "" },
  { id: "GHP-007", date: "12 Jun 2026", time: "03:45 PM", name: "Ama Atta",       type: "Received", method: "GhanaPay",      amount: 300,   status: "completed", note: "Split dinner",         ref: "GHP-20260612-8831", fee: 0, phone: "0244 111 222" },
  { id: "GHP-008", date: "12 Jun 2026", time: "01:00 PM", name: "GWCL Water",     type: "Bill",     method: "Water",         amount: -60,   status: "pending",   note: "Account #772345",      ref: "GHP-20260612-2209", fee: 0, phone: "" },
  { id: "GHP-009", date: "11 Jun 2026", time: "09:30 AM", name: "Yaw Boateng",    type: "Sent",     method: "MTN MoMo",      amount: -400,  status: "completed", note: "Business payment",     ref: "GHP-20260611-1122", fee: 1, phone: "0244 333 444" },
  { id: "GHP-010", date: "10 Jun 2026", time: "04:00 PM", name: "Salary Credit",  type: "Received", method: "Bank Transfer", amount: 4500,  status: "completed", note: "Monthly salary",       ref: "GHP-20260610-0001", fee: 0, phone: "" },
];

export const SPENDING_DATA: SpendingWeek[] = [
  { week: "Jun 1–7",   amount: 580, prev: 720 },
  { week: "Jun 8–14",  amount: 940, prev: 860 },
  { week: "Jun 15–21", amount: 680, prev: 610 },
  { week: "Jun 22–30", amount: 300, prev: 490 },
];

export const CATEGORIES: Category[] = [
  { name: "Food & Dining", pct: 34, amount: 680, color: "#E67E22" },
  { name: "Utilities",     pct: 22, amount: 440, color: "#cea62c" },
  { name: "Transport",     pct: 18, amount: 360, color: "#1E7B9E" },
  { name: "Shopping",      pct: 16, amount: 320, color: "#8E44AD" },
  { name: "Other",         pct: 10, amount: 200, color: "#777682" },
];

export const KYC_QUEUE: KycEntry[] = [
  { id: "GHP-2026-38821", name: "Abena Owusu",  phone: "+233 24 567 8901", submitted: "47 mins ago",  status: "pending", docScore: 94, faceScore: 91, tier: 2 },
  { id: "GHP-2026-39012", name: "Kofi Mensah",  phone: "+233 20 123 4567", submitted: "1 hr ago",     status: "pending", docScore: 88, faceScore: 85, tier: 2 },
  { id: "GHP-2026-38100", name: "Ama Atta",     phone: "+233 24 111 2222", submitted: "26 hrs ago",   status: "urgent",  docScore: 76, faceScore: 70, tier: 2 },
  { id: "GHP-2026-37990", name: "Yaw Darko",    phone: "+233 27 789 0123", submitted: "2 hrs ago",    status: "pending", docScore: 92, faceScore: 89, tier: 2 },
];

export const SCHEDULED: ScheduledPayment[] = [
  { id: 1, recipient: "Kofi (Landlord)", type: "Transfer", amount: 1500, freq: "Monthly", nextRun: "1 Jul 2026",  status: "active" },
  { id: 2, recipient: "ECG Electricity", type: "Bill",     amount: 200,  freq: "Monthly", nextRun: "5 Jul 2026",  status: "active" },
  { id: 3, recipient: "MTN Airtime",     type: "Airtime",  amount: 50,   freq: "Weekly",  nextRun: "18 Jun 2026", status: "paused" },
];
