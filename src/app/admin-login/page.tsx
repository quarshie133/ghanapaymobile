"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getOrCreateUserProfile } from "@/lib/user-profile";

/**
 * A separate URL for admin sign-in, distinct from the customer /login
 * page. This does NOT use a different auth system — it's the same
 * Firebase Authentication, same users/{uid} Firestore profiles. What makes
 * this "admin login" is that it checks the resulting profile's `role`
 * immediately after signing in, and REJECTS (signs the account back out)
 * if it isn't "administrator" — rather than quietly letting any account
 * in and relying on route guards alone. A customer account typing their
 * real password here still gets bounced, with a clear message, instead of
 * landing somewhere confusing.
 */
export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || submitting) return;
    setError("");
    setSubmitting(true);

    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const profile = await getOrCreateUserProfile(credential.user);

      if (profile.role !== "administrator") {
        await signOut(auth);
        setError("This account does not have administrator access.");
        return;
      }

      router.replace("/admin");
    } catch (err: any) {
      const code = err?.code || "";
      if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
        setError("Incorrect email or password.");
      } else if (code === "auth/too-many-requests") {
        setError("Too many attempts. Please wait a moment and try again.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-[#0a0a2e] p-8 font-sans antialiased">
      <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-2xl shadow-2xl">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center shadow-lg">
            <span className="material-symbols-outlined text-white text-3xl">admin_panel_settings</span>
          </div>
          <h1 className="font-page-title text-primary text-2xl font-bold">Admin Portal</h1>
          <p className="text-secondary text-sm text-center">
            Sign in with an administrator account. This is the same GhanaPay account system as the customer app —
            only accounts with administrator access can sign in here.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-on-surface-variant" htmlFor="email">Admin Email</label>
            <input
              id="email"
              className="w-full h-[44px] px-4 rounded-xl border border-border-subtle bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary-container outline-none"
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-on-surface-variant" htmlFor="password">Password</label>
            <input
              id="password"
              className="w-full h-[44px] px-4 rounded-xl border border-border-subtle bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary-container outline-none"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && <div className="text-sm text-error font-medium">{error}</div>}

          <button
            type="submit"
            disabled={!email || !password || submitting}
            className={`w-full h-[52px] font-bold rounded-xl shadow-lg transition-all duration-200 ${
              email && password && !submitting
                ? "bg-primary text-white hover:bg-primary-container hover:shadow-xl active:scale-[0.98] cursor-pointer"
                : "bg-surface-variant text-outline cursor-not-allowed"
            }`}
          >
            {submitting ? "Signing in..." : "Sign In to Admin Portal"}
          </button>

          <div className="text-center">
            <a href="/login" className="text-primary font-bold hover:underline text-sm">
              Not an admin? Go to customer login
            </a>
          </div>
        </form>
      </div>
    </main>
  );
}
