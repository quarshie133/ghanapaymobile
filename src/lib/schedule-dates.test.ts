import { advanceScheduleDate } from "./schedule-dates";

describe("advanceScheduleDate", () => {
  const base = new Date("2026-08-13T10:00:00Z");

  test("daily adds exactly one day", () => {
    const result = advanceScheduleDate(base, "daily");
    expect(result.toISOString()).toBe("2026-08-14T10:00:00.000Z");
  });

  test("weekly adds exactly seven days", () => {
    const result = advanceScheduleDate(base, "weekly");
    expect(result.toISOString()).toBe("2026-08-20T10:00:00.000Z");
  });

  test("monthly adds one month for a normal mid-month date", () => {
    const result = advanceScheduleDate(base, "monthly");
    expect(result.toISOString()).toBe("2026-09-13T10:00:00.000Z");
  });

  test("annually adds exactly one year", () => {
    const result = advanceScheduleDate(base, "annually");
    expect(result.toISOString()).toBe("2027-08-13T10:00:00.000Z");
  });

  // Regression test: this is the exact bug found during manual
  // verification in Phase 10 — naive Date.setMonth(+1) on Jan 31 silently
  // overflowed into March 3rd (skipping February entirely) because
  // February doesn't have 31 days. Locking this in so it can never
  // silently regress.
  test("REGRESSION: Jan 31 + monthly clamps into February, not March", () => {
    const jan31 = new Date("2026-01-31T10:00:00Z");
    const result = advanceScheduleDate(jan31, "monthly");
    expect(result.getUTCMonth()).toBe(1); // February (0-indexed)
    expect(result.getUTCDate()).toBe(28); // 2026 is not a leap year
  });

  test("Mar 31 + monthly clamps to Apr 30, not overflowing to May", () => {
    const mar31 = new Date("2026-03-31T10:00:00Z");
    const result = advanceScheduleDate(mar31, "monthly");
    expect(result.getUTCMonth()).toBe(3); // April
    expect(result.getUTCDate()).toBe(30);
  });

  test("Dec 31 + monthly correctly rolls over into January of the next year", () => {
    const dec31 = new Date("2026-12-31T10:00:00Z");
    const result = advanceScheduleDate(dec31, "monthly");
    expect(result.getUTCFullYear()).toBe(2027);
    expect(result.getUTCMonth()).toBe(0); // January
    expect(result.getUTCDate()).toBe(31);
  });

  test("Feb 29 (leap year) + annually clamps to Feb 28 the following non-leap year", () => {
    const leapDay = new Date("2024-02-29T10:00:00Z");
    const result = advanceScheduleDate(leapDay, "annually");
    expect(result.getUTCFullYear()).toBe(2025);
    expect(result.getUTCMonth()).toBe(1); // February
    expect(result.getUTCDate()).toBe(28);
  });

  test("repeated monthly advancement from Jan 31 stays sane across a full year", () => {
    let date = new Date("2026-01-31T10:00:00Z");
    const days: number[] = [];
    for (let i = 0; i < 12; i++) {
      date = advanceScheduleDate(date, "monthly");
      days.push(date.getUTCDate());
    }
    // Every resulting date must be a real day of its month — this would
    // throw or produce an out-of-range date if the clamping logic broke.
    for (const d of days) {
      expect(d).toBeGreaterThanOrEqual(1);
      expect(d).toBeLessThanOrEqual(31);
    }
  });
});
