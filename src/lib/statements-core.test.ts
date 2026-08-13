import { computeMonthlyStatements, type StatementTransaction } from "./statements-core";

function secondsFor(iso: string): number {
  return new Date(iso).getTime() / 1000;
}

describe("computeMonthlyStatements", () => {
  test("returns an empty array for no transactions", () => {
    expect(computeMonthlyStatements([])).toEqual([]);
  });

  test("a single top-up produces one month with correct opening/closing", () => {
    const tx: StatementTransaction[] = [
      { type: "topup", amount: 100, fee: 0, createdAtSeconds: secondsFor("2026-01-15T10:00:00Z") },
    ];
    const result = computeMonthlyStatements(tx);
    expect(result).toHaveLength(1);
    expect(result[0].monthKey).toBe("2026-01");
    expect(result[0].opening).toBe(0);
    expect(result[0].closing).toBe(100);
    expect(result[0].totalCredits).toBe(100);
    expect(result[0].totalDebits).toBe(0);
    expect(result[0].transactionCount).toBe(1);
  });

  test("opening balance of the second month equals the closing balance of the first", () => {
    const tx: StatementTransaction[] = [
      { type: "topup", amount: 100, fee: 0, createdAtSeconds: secondsFor("2026-01-15T10:00:00Z") },
      { type: "bill", amount: 30, fee: 0, createdAtSeconds: secondsFor("2026-01-20T10:00:00Z") },
      { type: "transfer_out", amount: 20, fee: 1, createdAtSeconds: secondsFor("2026-02-05T10:00:00Z") },
      { type: "transfer_in", amount: 50, fee: 0, createdAtSeconds: secondsFor("2026-02-10T10:00:00Z") },
    ];
    const result = computeMonthlyStatements(tx);
    expect(result).toHaveLength(2);

    // Most recent month first (matches getMonthlyStatements' sort order)
    const feb = result.find((m) => m.monthKey === "2026-02")!;
    const jan = result.find((m) => m.monthKey === "2026-01")!;

    expect(jan.opening).toBe(0);
    expect(jan.closing).toBe(70); // +100 topup, -30 bill
    expect(jan.totalDebits).toBe(30);
    expect(jan.totalCredits).toBe(100);

    // The core assertion: February's opening MUST equal January's closing.
    expect(feb.opening).toBe(jan.closing);
    expect(feb.opening).toBe(70);
    expect(feb.closing).toBe(99); // 70 - 20 - 1(fee) + 50
    expect(feb.totalDebits).toBe(21); // 20 + 1 fee
    expect(feb.totalCredits).toBe(50);
  });

  test("fees are correctly included in totalDebits and the running balance", () => {
    const tx: StatementTransaction[] = [
      { type: "topup", amount: 1000, fee: 0, createdAtSeconds: secondsFor("2026-03-01T10:00:00Z") },
      { type: "withdrawal", amount: 200, fee: 5, createdAtSeconds: secondsFor("2026-03-02T10:00:00Z") },
    ];
    const result = computeMonthlyStatements(tx);
    expect(result[0].closing).toBe(795); // 1000 - 200 - 5
    expect(result[0].totalDebits).toBe(205); // 200 + 5
  });

  test("months are sorted most-recent-first", () => {
    const tx: StatementTransaction[] = [
      { type: "topup", amount: 10, fee: 0, createdAtSeconds: secondsFor("2026-01-01T10:00:00Z") },
      { type: "topup", amount: 10, fee: 0, createdAtSeconds: secondsFor("2026-03-01T10:00:00Z") },
      { type: "topup", amount: 10, fee: 0, createdAtSeconds: secondsFor("2026-02-01T10:00:00Z") },
    ];
    const result = computeMonthlyStatements(tx);
    expect(result.map((m) => m.monthKey)).toEqual(["2026-03", "2026-02", "2026-01"]);
  });

  test("transfer_in is treated as a credit, transfer_out as a debit", () => {
    const tx: StatementTransaction[] = [
      { type: "transfer_in", amount: 500, fee: 0, createdAtSeconds: secondsFor("2026-04-01T10:00:00Z") },
      { type: "transfer_out", amount: 100, fee: 0, createdAtSeconds: secondsFor("2026-04-02T10:00:00Z") },
    ];
    const result = computeMonthlyStatements(tx);
    expect(result[0].totalCredits).toBe(500);
    expect(result[0].totalDebits).toBe(100);
    expect(result[0].closing).toBe(400);
  });

  test("floating point amounts don't drift due to rounding", () => {
    const tx: StatementTransaction[] = [
      { type: "topup", amount: 10.1, fee: 0, createdAtSeconds: secondsFor("2026-05-01T10:00:00Z") },
      { type: "topup", amount: 10.2, fee: 0, createdAtSeconds: secondsFor("2026-05-02T10:00:00Z") },
    ];
    const result = computeMonthlyStatements(tx);
    // Naive floating point addition (10.1 + 10.2) produces 20.299999999999997
    // in JS — this asserts the rounding logic actually prevents that.
    expect(result[0].closing).toBe(20.3);
  });
});
