export interface Transaction {
  id: string;
  date: string;
  time: string;
  name: string;
  type: "Sent" | "Received" | "Bill" | "Airtime";
  method: string;
  amount: number;
  status: "completed" | "pending" | "failed";
  note: string;
  ref: string;
  fee: number;
  phone: string;
}

export interface SpendingWeek {
  week: string;
  amount: number;
  prev: number;
}

export interface Category {
  name: string;
  pct: number;
  amount: number;
  color: string;
}

export interface KycEntry {
  id: string;
  name: string;
  phone: string;
  submitted: string;
  status: "pending" | "urgent" | "approved" | "rejected";
  docScore: number;
  faceScore: number;
  tier: number;
}

export interface ScheduledPayment {
  id: number;
  recipient: string;
  type: string;
  amount: number;
  freq: string;
  nextRun: string;
  status: "active" | "paused";
}

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  tier: number;
  status: "active" | "suspended" | "pending";
  balance: number;
  joined: string;
}

export interface SavingsGoal {
  icon: string;
  name: string;
  saved: number;
  target: number;
  pct: number;
  eta: string;
}
