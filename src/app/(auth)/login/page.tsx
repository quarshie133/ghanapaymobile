"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import T from "@/lib/tokens";
import Input from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(false);

  const handleLogin = () => {
    if (!phone || !password) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push("/dashboard");
    }, 1200);
  };

  const canSubmit = phone.length > 0 && password.length > 0;

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Inter', sans-serif" }}>

      {/* ── LEFT PANEL ── */}
      <div className="kente-bg-dark" style={{
        width: "48%", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", padding: 48, gap: 32,
      }}>
        {/* Brand */}
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 80, height: 80, borderRadius: 20,
            background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)",
            border: "1px solid rgba(206,166,44,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px", fontSize: 32, color: T.gold,
          }}>₵</div>
          <div className="syne" style={{ fontSize: 36, color: "#fff", marginBottom: 8 }}>GhanaPay</div>
          <div style={{ fontSize: 18, fontStyle: "italic", color: T.gold, marginBottom: 16 }}>
            &quot;Your Money, Your Way&quot;
          </div>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", lineHeight: 1.7, maxWidth: 380 }}>
            The unified national mobile money wallet platform powered by Ghana&apos;s commercial banks and rural community banks.
          </p>
        </div>

        {/* Feature tiles */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
          {[
            ["🌍 Global Standard", "Bank-Grade Security"],
            ["📶 Accessibility",   "Nationwide Network"],
          ].map(([sub, title]) => (
            <div key={title} style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(206,166,44,0.25)",
              borderRadius: 12, padding: "16px 20px",
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.gold, letterSpacing: "0.08em", marginBottom: 4 }}>{sub}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{title}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
          <span>🔒</span> PCI-DSS COMPLIANT PLATFORM
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        background: T.white, padding: 48,
      }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <h1 style={{ fontSize: 30, fontWeight: 700, color: T.navy, marginBottom: 6 }}>
            Welcome back
          </h1>
          <p style={{ fontSize: 14, color: T.textMuted, marginBottom: 36 }}>
            Please enter your credentials to access your portal
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <Input
              id="phone-input"
              label="Phone Number or Email"
              icon="👤"
              placeholder="02X XXX XXXX or email@example.com"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Input
              id="password-input"
              label="PIN / Password"
              icon="🔒"
              type={showPw ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              right={
                <span onClick={() => setShowPw((s) => !s)}>
                  {showPw ? "🙈" : "👁"}
                </span>
              }
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "16px 0" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: T.textSec, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Remember this device
            </label>
            <span style={{ fontSize: 13, color: T.navyLight, fontWeight: 500, cursor: "pointer" }}>
              Forgot PIN?
            </span>
          </div>

          <button
            id="login-btn"
            onClick={handleLogin}
            disabled={!canSubmit}
            style={{
              width: "100%", height: 52,
              background: canSubmit ? T.navy : T.borderVar,
              color: "#fff", border: "none", borderRadius: 12,
              fontSize: 16, fontWeight: 600,
              cursor: canSubmit ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "all 0.15s",
            }}>
            {loading ? <span className="spinner" /> : <>Log In →</>}
          </button>

          {/* Divider */}
          <div style={{ margin: "24px 0", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, height: 1, background: T.border }} />
            <span style={{ fontSize: 12, color: T.textMuted }}>secured by</span>
            <div style={{ flex: 1, height: 1, background: T.border }} />
          </div>

          {/* Security badges */}
          <div style={{ display: "flex", justifyContent: "center", gap: 32 }}>
            {([["🔐", "BANK GRADE"], ["🛡", "ENCRYPTED"], ["✅", "REGULATED"]] as [string, string][]).map(([icon, label]) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 22, color: T.textMuted }}>{icon}</div>
                <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, letterSpacing: "0.08em", marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>

          <p style={{ textAlign: "center", fontSize: 13, color: T.textMuted, marginTop: 28 }}>
            Don&apos;t have an account?{" "}
            <span style={{ color: T.navy, fontWeight: 700, cursor: "pointer" }}>
              Sign up for Enterprise
            </span>
          </p>

          <div style={{ textAlign: "center", marginTop: 32, display: "flex", justifyContent: "center", gap: 20 }}>
            {["Privacy Policy", "Terms of Service", "© 2026 GhanaPay"].map((l, i) => (
              <span key={i} style={{ fontSize: 11, color: T.textMuted, cursor: i < 2 ? "pointer" : "default" }}>{l}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
