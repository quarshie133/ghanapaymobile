import { readFileSync } from "fs";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

/**
 * WRITTEN BUT NOT EXECUTED IN THIS ENVIRONMENT. This sandbox's network
 * allowlist blocks storage.googleapis.com, which is where the Firebase
 * emulator's Java binary is hosted — `npx firebase emulators:start` fails
 * with a 403 here (verified, not assumed). This file is real and should
 * work when run on a machine with normal internet access:
 *
 *   npm run test:rules
 *
 * That script wraps this in `firebase emulators:exec`, which starts the
 * emulator, runs these tests against it, and shuts it down automatically.
 * If any assertion here is wrong, it will fail loudly when you run it —
 * this is not a substitute for actually running it once, just the best
 * that can be prepared without a working emulator connection.
 */

let testEnv: RulesTestEnvironment;

const PROJECT_ID = "ghanapay-rules-test";

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

afterEach(async () => {
  await testEnv.clearFirestore();
});

describe("users/{uid}", () => {
  test("a signed-in user can create their own profile with role=customer, tier=1", async () => {
    const alice = testEnv.authenticatedContext("alice");
    const ref = doc(alice.firestore(), "users/alice");
    await assertSucceeds(
      setDoc(ref, { uid: "alice", name: "Alice", role: "customer", tier: 1 })
    );
  });

  test("a user CANNOT create their own profile with role=administrator", async () => {
    const eve = testEnv.authenticatedContext("eve");
    const ref = doc(eve.firestore(), "users/eve");
    await assertFails(
      setDoc(ref, { uid: "eve", name: "Eve", role: "administrator", tier: 1 })
    );
  });

  test("a user can read their own profile", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "users/alice"), { uid: "alice", name: "Alice", role: "customer", tier: 1 });
    });
    const alice = testEnv.authenticatedContext("alice");
    await assertSucceeds(getDoc(doc(alice.firestore(), "users/alice")));
  });

  test("a user CANNOT read someone else's profile", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "users/alice"), { uid: "alice", name: "Alice", role: "customer", tier: 1 });
    });
    const bob = testEnv.authenticatedContext("bob");
    await assertFails(getDoc(doc(bob.firestore(), "users/alice")));
  });

  test("an unauthenticated request CANNOT read any profile", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "users/alice"), { uid: "alice", name: "Alice", role: "customer", tier: 1 });
    });
    const anon = testEnv.unauthenticatedContext();
    await assertFails(getDoc(doc(anon.firestore(), "users/alice")));
  });

  test("a user CANNOT elevate their own role via an update", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "users/alice"), { uid: "alice", name: "Alice", role: "customer", tier: 1 });
    });
    const alice = testEnv.authenticatedContext("alice");
    await assertFails(updateDoc(doc(alice.firestore(), "users/alice"), { role: "administrator" }));
  });

  test("a user CAN update their own name (a non-privilege field)", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "users/alice"), { uid: "alice", name: "Alice", role: "customer", tier: 1 });
    });
    const alice = testEnv.authenticatedContext("alice");
    await assertSucceeds(updateDoc(doc(alice.firestore(), "users/alice"), { name: "Alice Updated" }));
  });
});

describe("wallets/{uid} — client writes must always fail", () => {
  test("a user can read their own wallet", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "wallets/alice"), { uid: "alice", balance: 100 });
    });
    const alice = testEnv.authenticatedContext("alice");
    await assertSucceeds(getDoc(doc(alice.firestore(), "wallets/alice")));
  });

  test("a user CANNOT read someone else's wallet", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "wallets/alice"), { uid: "alice", balance: 100 });
    });
    const bob = testEnv.authenticatedContext("bob");
    await assertFails(getDoc(doc(bob.firestore(), "wallets/alice")));
  });

  test("a user CANNOT directly write their own wallet balance from the client — this is THE core anti-pattern the brief calls out", async () => {
    const alice = testEnv.authenticatedContext("alice");
    await assertFails(setDoc(doc(alice.firestore(), "wallets/alice"), { uid: "alice", balance: 999999 }));
  });

  test("a user CANNOT increment their own balance via an update either", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "wallets/alice"), { uid: "alice", balance: 100 });
    });
    const alice = testEnv.authenticatedContext("alice");
    await assertFails(updateDoc(doc(alice.firestore(), "wallets/alice"), { balance: 100000 }));
  });
});

describe("walletTransactions/{id} — immutable ledger", () => {
  test("a user can read their own transaction", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "walletTransactions/tx1"), { uid: "alice", amount: 50, type: "topup" });
    });
    const alice = testEnv.authenticatedContext("alice");
    await assertSucceeds(getDoc(doc(alice.firestore(), "walletTransactions/tx1")));
  });

  test("a user CANNOT read someone else's transaction", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "walletTransactions/tx1"), { uid: "alice", amount: 50, type: "topup" });
    });
    const bob = testEnv.authenticatedContext("bob");
    await assertFails(getDoc(doc(bob.firestore(), "walletTransactions/tx1")));
  });

  test("a user CANNOT create a fake transaction crediting their own wallet", async () => {
    const alice = testEnv.authenticatedContext("alice");
    await assertFails(
      setDoc(doc(alice.firestore(), "walletTransactions/fake1"), {
        uid: "alice", amount: 1000000, type: "topup", status: "successful",
      })
    );
  });
});

describe("kycRecords/{uid} — private, admin-reviewable", () => {
  test("a user can read their own KYC record", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "kycRecords/alice"), { uid: "alice", status: "pending_review" });
    });
    const alice = testEnv.authenticatedContext("alice");
    await assertSucceeds(getDoc(doc(alice.firestore(), "kycRecords/alice")));
  });

  test("a user CANNOT approve their own KYC record via a direct write", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "kycRecords/alice"), { uid: "alice", status: "pending_review" });
    });
    const alice = testEnv.authenticatedContext("alice");
    await assertFails(updateDoc(doc(alice.firestore(), "kycRecords/alice"), { status: "approved" }));
  });

  test("a non-admin CANNOT read someone else's KYC record", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "kycRecords/alice"), { uid: "alice", status: "pending_review" });
    });
    const bob = testEnv.authenticatedContext("bob");
    await assertFails(getDoc(doc(bob.firestore(), "kycRecords/alice")));
  });
});
