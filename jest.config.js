/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["<rootDir>/src/lib/**/*.test.ts"],
  // Only the pure-logic modules under test import zero Firebase Admin SDK
  // code — see docs/09_Testing_Report.md for why unit tests here are
  // scoped to computation, not I/O.
  collectCoverageFrom: ["src/lib/**/*.ts", "!src/lib/**/*.test.ts"],
};
