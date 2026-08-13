import { normalizeGhanaPhone, isValidGhanaPhone } from "./phone";

describe("normalizeGhanaPhone", () => {
  test("normalizes a spaced local number", () => {
    expect(normalizeGhanaPhone("024 123 4567")).toBe("0241234567");
  });

  test("passes through an already-normalized number", () => {
    expect(normalizeGhanaPhone("0241234567")).toBe("0241234567");
  });

  test("normalizes an international +233 number", () => {
    expect(normalizeGhanaPhone("+233241234567")).toBe("0241234567");
  });

  test("normalizes a bare-233 number without the plus sign", () => {
    expect(normalizeGhanaPhone("233241234567")).toBe("0241234567");
  });

  test("adds a missing leading 0 for a 9-digit number", () => {
    expect(normalizeGhanaPhone("241234567")).toBe("0241234567");
  });

  test("normalizes a dashed number", () => {
    expect(normalizeGhanaPhone("024-123-4567")).toBe("0241234567");
  });

  test("all six real-world formats above converge to the same value", () => {
    const variants = ["024 123 4567", "0241234567", "+233241234567", "233241234567", "241234567", "024-123-4567"];
    const normalized = variants.map(normalizeGhanaPhone);
    expect(new Set(normalized).size).toBe(1);
  });
});

describe("isValidGhanaPhone", () => {
  test("accepts a valid local number", () => {
    expect(isValidGhanaPhone("0241234567")).toBe(true);
  });

  test("accepts a valid international-format number", () => {
    expect(isValidGhanaPhone("+233241234567")).toBe(true);
  });

  test("rejects non-numeric input", () => {
    expect(isValidGhanaPhone("not a phone")).toBe(false);
  });

  test("rejects a too-short number", () => {
    expect(isValidGhanaPhone("024123")).toBe(false);
  });

  test("rejects a too-long number", () => {
    expect(isValidGhanaPhone("02412345678901")).toBe(false);
  });

  test("rejects an empty string", () => {
    expect(isValidGhanaPhone("")).toBe(false);
  });
});
