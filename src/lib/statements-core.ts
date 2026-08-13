/**
 * Pure computation, deliberately separated from statements.ts's Firestore
 * fetch. No Firebase Admin SDK import here at all — that's what makes this
 * unit-testable without mocking Firestore or needing live credentials. See
 * src/lib/statements.test.ts.
 */

export interface StatementTransaction {
  type: "topup" | "withdrawal" | "transfer_out" | "transfer_in" | "bill" | "airtime";
  amount: number;
  fee: number;
  createdAtSeconds: number; // Unix seconds, already extracted from a Firestore Timestamp
}

export interface MonthlyStatementResult {
  monthKey: string;
  label: string;
  opening: number;
  closing: number;
  totalDebits: number;
  totalCredits: number;
  transactionCount: number;
}

const CREDIT_TYPES = new Set(["topup", "transfer_in"]);

/**
 * Replays transactions in chronological order, reconstructing a running
 * balance and bucketing into monthly opening/closing balances. Input MUST
 * already be sorted oldest-first — this function doesn't sort, so the
 * caller controls that (statements.ts fetches with orderBy("createdAt", "asc")).
 */
export function computeMonthlyStatements(allTx: StatementTransaction[]): MonthlyStatementResult[] {
  const monthBuckets = new Map<string, MonthlyStatementResult>();
  let runningBalance = 0;

  for (const tx of allTx) {
    const date = new Date(tx.createdAtSeconds * 1000);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const label = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });

    if (!monthBuckets.has(monthKey)) {
      monthBuckets.set(monthKey, {
        monthKey,
        label,
        opening: runningBalance,
        closing: runningBalance,
        totalDebits: 0,
        totalCredits: 0,
        transactionCount: 0,
      });
    }

    const bucket = monthBuckets.get(monthKey)!;
    const isCredit = CREDIT_TYPES.has(tx.type);
    const delta = isCredit ? tx.amount : -(tx.amount + (tx.fee || 0));

    runningBalance = Math.round((runningBalance + delta) * 100) / 100;
    bucket.closing = runningBalance;
    if (isCredit) bucket.totalCredits = Math.round((bucket.totalCredits + tx.amount) * 100) / 100;
    else bucket.totalDebits = Math.round((bucket.totalDebits + tx.amount + (tx.fee || 0)) * 100) / 100;
    bucket.transactionCount++;
  }

  return Array.from(monthBuckets.values()).sort((a, b) => (a.monthKey < b.monthKey ? 1 : -1));
}
