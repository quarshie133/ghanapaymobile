/**
 * Pure date math, no Firebase imports — extracted from scheduled-payments.ts
 * so it's unit-testable. This is the logic that previously had a real bug
 * (Jan 31 + 1 month silently overflowing to March 3rd) caught during manual
 * verification — now covered by an automated regression test instead of
 * relying on someone remembering to check it by hand again.
 */

export type ScheduleFrequency = "daily" | "weekly" | "monthly" | "annually";

export function advanceScheduleDate(date: Date, frequency: ScheduleFrequency): Date {
  const next = new Date(date);
  switch (frequency) {
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "monthly": {
      // Naive setMonth(+1) overflows for month-end dates — e.g. Jan 31 +
      // 1 month rolls into March 3rd (Feb only has 28/29 days), silently
      // skipping a day. Clamp to the last valid day of the target month.
      const targetMonth = next.getMonth() + 1;
      const originalDay = next.getDate();
      next.setMonth(targetMonth, 1); // move to the 1st of the target month first, avoids overflow
      const daysInTargetMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
      next.setDate(Math.min(originalDay, daysInTargetMonth));
      break;
    }
    case "annually": {
      // Same overflow risk for Feb 29 on a leap year -> non-leap year.
      const originalDay = next.getDate();
      const originalMonth = next.getMonth();
      next.setFullYear(next.getFullYear() + 1, originalMonth, 1);
      const daysInTargetMonth = new Date(next.getFullYear(), originalMonth + 1, 0).getDate();
      next.setDate(Math.min(originalDay, daysInTargetMonth));
      break;
    }
  }
  return next;
}
