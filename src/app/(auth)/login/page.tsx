"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password || submitting) return;
    setError("");
    setSubmitting(true);
    try {
      await login({ phone, password });
    } catch (err: any) {
      setError(err.message || "Failed to log in");
      setSubmitting(false);
    }
  };

  const canSubmit = phone.length > 0 && password.length > 0 && !submitting;

  return (
    <main className="flex min-h-screen w-full font-sans antialiased bg-surface overflow-hidden">
      {/* Left Section: Branding */}
      <section className="hidden lg:flex lg:w-1/2 kente-login relative items-center justify-center p-gutter overflow-hidden">
        {/* Glassmorphic Decorative Circles */}
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
          
          <div className="space-y-4">
            <p className="font-section-title text-tertiary-fixed text-3xl font-semibold italic">"Your Money, Your Way"</p>
            <p className="text-on-primary-container text-lg opacity-90 leading-relaxed font-sidebar-label">
              The unified national mobile money wallet platform powered by Ghana’s commercial banks and rural community banks.
            </p>
          </div>
          
          {/* Floating Stats Bento (Visual Interest) */}
          <div className="grid grid-cols-2 gap-4 mt-12 text-left">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-card-padding rounded-xl">
              <p className="text-tertiary-fixed font-semibold text-sm uppercase tracking-wider mb-1">Global Standard</p>
              <p className="text-white font-bold text-xl">Bank-Grade Security</p>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-card-padding rounded-xl">
              <p className="text-tertiary-fixed font-semibold text-sm uppercase tracking-wider mb-1">Accessibility</p>
              <p className="text-white font-bold text-xl">Nationwide Network</p>
            </div>
          </div>
        </div>
        
        {/* Bottom Left Decorative Badge */}
        <div className="absolute bottom-10 left-10 flex items-center gap-2 text-white/40 font-sidebar-label text-xs uppercase tracking-widest">
          <span className="material-symbols-outlined text-sm">verified_user</span>
          <span>PCI-DSS COMPLIANT PLATFORM</span>
        </div>
      </section>

      {/* Right Section: Login Form */}
      <section className="w-full lg:w-1/2 bg-white flex items-center justify-center p-8 md:p-16 relative">
        <div className="w-full max-w-md space-y-10">
          {/* Mobile Branding (Hidden on Desktop) */}
          <div className="lg:hidden flex flex-col items-center gap-4 mb-8">
            <h1 className="font-page-title text-primary text-3xl font-extrabold tracking-tight">GhanaPay</h1>
          </div>
          
          <div className="space-y-2">
            <h2 className="font-page-title text-primary text-3xl font-bold">Welcome back</h2>
            <p className="text-secondary font-sidebar-label">Please enter your credentials to access your portal</p>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="space-y-4">
              {/* Identity Field */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-on-surface-variant flex items-center gap-2" htmlFor="identifier">
                  <span className="material-symbols-outlined text-sm">person</span>
                  Phone Number or Email
                </label>
                <input
                  className="w-full h-[44px] px-4 rounded-xl border border-border-subtle bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary-container outline-none transition-all duration-200 font-sidebar-label placeholder:text-outline-variant"
                  id="identifier"
                  name="identifier"
                  type="text"
                  placeholder="02X XXX XXXX or email@example.com"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-on-surface-variant flex items-center gap-2" htmlFor="password">
                    <span className="material-symbols-outlined text-sm">lock</span>
                    PIN / Password
                  </label>
                  <a className="text-sm font-medium text-primary hover:underline transition-all duration-200" href="#">
                    Forgot PIN?
                  </a>
                </div>
                <div className="relative">
                  <input
                    className="w-full h-[44px] px-4 rounded-xl border border-border-subtle bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary-container outline-none transition-all duration-200 font-sidebar-label placeholder:text-outline-variant"
                    id="password"
                    name="password"
                    type={showPw ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-all duration-200"
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                  >
                    <span className="material-symbols-outlined">
                      {showPw ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="text-sm text-error font-medium">
                {error}
              </div>
            )}

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                className="w-5 h-5 rounded border-border-subtle text-primary focus:ring-primary-container cursor-pointer transition-all duration-200"
                id="remember"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <label className="ml-3 text-sm text-on-surface-variant font-medium cursor-pointer" htmlFor="remember">
                Remember this device
              </label>
            </div>

            {/* CTA */}
            <button
              className={`w-full h-[52px] font-bold rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 group ${
                canSubmit
                  ? "bg-primary text-white hover:bg-primary-container hover:shadow-xl active:scale-[0.98] cursor-pointer"
                  : "bg-surface-variant text-outline cursor-not-allowed"
              }`}
              type="submit"
              disabled={!canSubmit}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Logging in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Log In
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-all duration-200">arrow_forward</span>
                </span>
              )}
            </button>
          </form>

          {/* Google SSO Login */}
          <div className="pt-4 border-t border-border-subtle">
            <button
              onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/google`}
              className="w-full h-[52px] bg-white text-primary border border-border-subtle rounded-xl font-bold hover:bg-surface transition-all duration-200 flex items-center justify-center gap-3"
            >
              <img
                src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png"
                alt="Google"
                className="w-5 h-5"
              />
              Continue with Google
            </button>
          </div>

          <div className="pt-6">
            <div className="grid grid-cols-3 gap-6 items-center grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
              {/* Security Badge 1 */}
              <div className="flex flex-col items-center gap-1 text-center">
                <span className="material-symbols-outlined text-success text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  verified
                </span>
                <span className="text-[10px] font-bold text-on-surface uppercase tracking-tighter">Bank Grade</span>
              </div>
              {/* Security Badge 2 */}
              <div className="flex flex-col items-center gap-1 text-center">
                <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  shield
                </span>
                <span className="text-[10px] font-bold text-on-surface uppercase tracking-tighter">Encrypted</span>
              </div>
              {/* Security Badge 3 */}
              <div className="flex flex-col items-center gap-1 text-center">
                <span className="material-symbols-outlined text-tertiary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  gpp_good
                </span>
                <span className="text-[10px] font-bold text-on-surface uppercase tracking-tighter">Regulated</span>
              </div>
            </div>
          </div>

          <div className="text-center pt-4">
            <p className="text-sm text-secondary font-sidebar-label">
              Don't have an account?{" "}
              <a className="text-primary font-bold hover:underline" href="#">
                Sign up for Enterprise
              </a>
            </p>
          </div>
        </div>

        {/* Global Footer Info (Absolute Bottom Right) */}
        <footer className="absolute bottom-6 right-8 text-[11px] text-outline flex gap-6 font-medium">
          <a className="hover:text-primary transition-all duration-200" href="#">Privacy Policy</a>
          <a className="hover:text-primary transition-all duration-200" href="#">Terms of Service</a>
          <span>© 2026 GhanaPay Enterprise</span>
        </footer>
      </section>
    </main>
  );
}
