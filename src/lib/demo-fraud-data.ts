/**
 * DEMO-ONLY fraud data. There is no real fraud detection engine in this
 * project — your brief (§26) explicitly lists fraud/anomaly detection
 * under future enhancements, not something to fake as working now. This
 * is a fixed, static array purely so the admin dashboard's fraud summary
 * card and the /admin/fraud detail page always show the SAME numbers —
 * both import from here, so there's exactly one source of truth instead
 * of two places that could drift out of sync.
 *
 * Never wire this to real user data or present it as live detection.
 */

export type RiskLevel = "High" | "Medium" | "Low";
export type AlertType = "Velocity" | "Geo-anomaly" | "Large transfer" | "Suspicious pattern" | "Account takeover";
export type AlertStatus = "open" | "investigating" | "dismissed";

export interface FraudAlert {
  id: string;
  user: string;
  userId: string;
  type: AlertType;
  riskScore: number;
  risk: RiskLevel;
  amount: number;
  time: string;
  status: AlertStatus;
  note: string;
}

export const DEMO_FRAUD_ALERTS: FraudAlert[] = [
  {
    id: "FR-8821", user: "Kweku Asante", userId: "USR-0112",
    type: "Velocity", riskScore: 94, risk: "High", amount: 4800,
    time: "14 mins ago", status: "open", note: "12 transactions in 3 minutes",
  },
  {
    id: "FR-8802", user: "Priscilla Darko", userId: "USR-0234",
    type: "Geo-anomaly", riskScore: 91, risk: "High", amount: 2200,
    time: "1 hr ago", status: "investigating", note: "Login from Nigeria, transfer to Togo",
  },
  {
    id: "FR-8789", user: "Nana Boateng", userId: "USR-0389",
    type: "Large transfer", riskScore: 78, risk: "Medium", amount: 9500,
    time: "3 hrs ago", status: "open", note: "5× average transaction size",
  },
  {
    id: "FR-8771", user: "Adwoa Sarpong", userId: "USR-0441",
    type: "Suspicious pattern", riskScore: 72, risk: "Medium", amount: 1100,
    time: "5 hrs ago", status: "dismissed", note: "Round-tripping between 3 accounts",
  },
  {
    id: "FR-8754", user: "Kwabena Asomah", userId: "USR-0512",
    type: "Account takeover", riskScore: 88, risk: "High", amount: 3500,
    time: "7 hrs ago", status: "investigating", note: "New device + password change + large xfer",
  },
  {
    id: "FR-8730", user: "Esi Nyarko", userId: "USR-0601",
    type: "Velocity", riskScore: 45, risk: "Low", amount: 600,
    time: "12 hrs ago", status: "dismissed", note: "Borderline velocity — confirmed legit",
  },
];

export const DEMO_BLOCKED_IPS = [
  { ip: "41.66.192.77", country: "Nigeria", reason: "Fraud pattern", blocked: "2 days ago" },
  { ip: "197.211.58.0", country: "Unknown", reason: "Bot activity", blocked: "5 days ago" },
  { ip: "154.120.49.33", country: "Ghana", reason: "Account takeover attempt", blocked: "1 week ago" },
];
