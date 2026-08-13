"use client";
import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !password) {
      setError("Please fill in all required fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    // Loose Ghanaian phone format check (optional field): 0XXXXXXXXX or +233XXXXXXXXX
    if (phone && !/^(0\d{9}|\+233\d{9})$/.test(phone.replace(/\s/g, ""))) {
      setError("Enter a valid Ghanaian phone number, e.g. 024 123 4567.");
      return;
    }

    setSubmitting(true);
    try {
      await register({ name, email, password, phone: phone || undefined });
      // AuthContext's route guard redirects to /dashboard once `user` is set.
    } catch (err: any) {
      setError(err.message || "Failed to create account");
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = name && email && password && confirmPassword && !submitting;

  return (
    <main className="flex min-h-screen w-full font-sans antialiased bg-surface overflow-hidden">
      <section className="hidden lg:flex lg:w-1/2 kente-login relative items-center justify-center p-gutter overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary-container rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute bottom-[-5%] right-[-5%] w-80 h-80 bg-tertiary-container rounded-full opacity-10 blur-3xl"></div>
        <div className="relative z-10 text-center space-y-8 max-w-lg">
          <div className="flex flex-col items-center gap-4">
            <div className="w-24 h-24 bg-white rounded-xl flex items-center justify-center shadow-2xl transform rotate-3 hover:rotate-0 transition-all duration-200">
              <span className="material-symbols-outlined text-primary text-6xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                account_balance_wallet
              </span>
            </div>
            <h1 className="font-page-title text-white text-5xl font-extrabold tracking-tight">GhanaPay</h1>
          </div>
          <p className="font-section-title text-tertiary-fixed text-3xl font-semibold italic">Join the wallet built for Ghana</p>
        </div>
      </section>

      <section className="w-full lg:w-1/2 bg-white flex items-center justify-center p-8 md:p-16 relative">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex flex-col items-center gap-4 mb-8">
            <h1 className="font-page-title text-primary text-3xl font-extrabold tracking-tight">GhanaPay</h1>
          </div>

          <div className="space-y-2">
            <h2 className="font-page-title text-primary text-3xl font-bold">Create your account</h2>
            <p className="text-secondary font-sidebar-label">Sign up to start using GhanaPay</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-on-surface-variant" htmlFor="name">Full Name</label>
              <input
                id="name"
                className="w-full h-[44px] px-4 rounded-xl border border-border-subtle bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary-container outline-none"
                type="text"
                placeholder="Ama Owusu"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-on-surface-variant" htmlFor="email">Email Address</label>
              <input
                id="email"
                className="w-full h-[44px] px-4 rounded-xl border border-border-subtle bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary-container outline-none"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-on-surface-variant" htmlFor="phone">Phone Number (optional)</label>
              <input
                id="phone"
                className="w-full h-[44px] px-4 rounded-xl border border-border-subtle bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary-container outline-none"
                type="tel"
                placeholder="024 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-on-surface-variant" htmlFor="password">Password</label>
              <div className="relative">
                <input
                  id="password"
                  className="w-full h-[44px] px-4 rounded-xl border border-border-subtle bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary-container outline-none"
                  type={showPw ? "text" : "password"}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary"
                  onClick={() => setShowPw(!showPw)}
                >
                  <span className="material-symbols-outlined">{showPw ? "visibility_off" : "visibility"}</span>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-on-surface-variant" htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                className="w-full h-[44px] px-4 rounded-xl border border-border-subtle bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary-container outline-none"
                type={showPw ? "text" : "password"}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            {error && <div className="text-sm text-error font-medium">{error}</div>}

            <button
              type="submit"
              disabled={!canSubmit}
              className={`w-full h-[52px] font-bold rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                canSubmit
                  ? "bg-primary text-white hover:bg-primary-container hover:shadow-xl active:scale-[0.98] cursor-pointer"
                  : "bg-surface-variant text-outline cursor-not-allowed"
              }`}
            >
              {submitting ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <div className="text-center pt-2">
            <p className="text-sm text-secondary font-sidebar-label">
              Already have an account?{" "}
              <a className="text-primary font-bold hover:underline" href="/login">Log in</a>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
