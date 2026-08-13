"use client";
import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || submitting) return;
    setError("");
    setSubmitting(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-surface p-8 font-sans antialiased">
      <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-2xl shadow-lg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center shadow-lg">
            <span className="material-symbols-outlined text-white text-3xl">account_balance_wallet</span>
          </div>
          <h1 className="font-page-title text-primary text-2xl font-bold">Reset your password</h1>
          <p className="text-secondary text-sm text-center">
            Enter the email linked to your GhanaPay account and we'll send you a link to reset your password.
          </p>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="text-sm text-success font-medium bg-success/10 rounded-xl p-4">
              If an account exists for <strong>{email}</strong>, a password reset email has been sent. Check your inbox
              (and spam folder).
            </div>
            <a href="/login" className="text-primary font-bold hover:underline text-sm">Back to login</a>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
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

            {error && <div className="text-sm text-error font-medium">{error}</div>}

            <button
              type="submit"
              disabled={!email || submitting}
              className={`w-full h-[52px] font-bold rounded-xl shadow-lg transition-all duration-200 ${
                email && !submitting
                  ? "bg-primary text-white hover:bg-primary-container hover:shadow-xl active:scale-[0.98] cursor-pointer"
                  : "bg-surface-variant text-outline cursor-not-allowed"
              }`}
            >
              {submitting ? "Sending..." : "Send Reset Link"}
            </button>

            <div className="text-center">
              <a href="/login" className="text-primary font-bold hover:underline text-sm">Back to login</a>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
