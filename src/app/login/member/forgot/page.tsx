"use client";

import { useState } from "react";
import Link from "next/link";

type Step = "noWa" | "otp" | "reset" | "done";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("noWa");
  const [noWa, setNoWa] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [devOtp, setDevOtp] = useState("");

  const handleSendOtp = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/member-auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noWa }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      if (data.otp) setDevOtp(data.otp);
      setStep("otp");
    } catch {
      setError("Gagal mengirim OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = () => {
    if (!otp.trim()) return;
    setStep("reset");
  };

  const handleResetPassword = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/member-auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noWa, otpCode: otp, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setStep("done");
    } catch {
      setError("Gagal reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="public-page">
      <div className="public-container" style={{ maxWidth: "420px" }}>
        <div className="public-card">
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--public-text)" }}>
              {step === "noWa" && "Lupa Password"}
              {step === "otp" && "Verifikasi OTP"}
              {step === "reset" && "Password Baru"}
              {step === "done" && "Berhasil!"}
            </h1>
            <p style={{ color: "var(--public-text-secondary)", fontSize: "0.875rem" }}>
              {step === "noWa" && "Masukkan No. WA Anda untuk menerima kode OTP"}
              {step === "otp" && "Masukkan 6 digit kode OTP yang dikirim ke WhatsApp"}
              {step === "reset" && "Masukkan password baru Anda"}
              {step === "done" && "Password berhasil direset"}
            </p>
          </div>

          {error && (
            <div style={{
              background: "var(--public-danger-bg)", padding: "12px 16px",
              borderRadius: "var(--radius-md)", marginBottom: "20px",
              fontSize: "0.875rem", color: "var(--public-danger)",
            }}>
              {error}
            </div>
          )}

          {devOtp && step !== "done" && (
            <div style={{
              background: "var(--public-warning-bg)", padding: "12px 16px",
              borderRadius: "var(--radius-md)", marginBottom: "20px",
              fontSize: "0.8125rem", color: "var(--public-warning)",
            }}>
              <strong>Dev Mode:</strong> Kode OTP: <span className="font-mono" style={{ fontWeight: 700 }}>{devOtp}</span>
            </div>
          )}

          {step === "noWa" && (
            <>
              <div className="form-group">
                <label className="input-public-label" htmlFor="noWa">No. WhatsApp</label>
                <input
                  id="noWa" type="tel" className="input-public"
                  placeholder="08xx xxxx xxxx"
                  value={noWa} onChange={(e) => setNoWa(e.target.value)}
                  required autoFocus
                />
              </div>
              <button className="btn-public-primary" style={{ width: "100%" }} onClick={handleSendOtp} disabled={loading || !noWa.trim()}>
                {loading ? "Mengirim..." : "Kirim OTP"}
              </button>
            </>
          )}

          {step === "otp" && (
            <>
              <div className="form-group">
                <label className="input-public-label" htmlFor="otp">Kode OTP</label>
                <input
                  id="otp" type="text" className="input-public font-mono"
                  placeholder="000000" maxLength={6}
                  value={otp} onChange={(e) => setOtp(e.target.value)}
                  required autoFocus style={{ textAlign: "center", fontSize: "1.5rem", letterSpacing: "0.2em" }}
                />
              </div>
              <button className="btn-public-primary" style={{ width: "100%" }} onClick={handleVerifyOtp} disabled={!otp.trim()}>
                Verifikasi
              </button>
            </>
          )}

          {step === "reset" && (
            <>
              <div className="form-group">
                <label className="input-public-label" htmlFor="newPw">Password Baru</label>
                <input
                  id="newPw" type="password" className="input-public"
                  placeholder="Min. 6 karakter"
                  value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  required autoFocus
                />
              </div>
              <button className="btn-public-primary" style={{ width: "100%" }} onClick={handleResetPassword} disabled={loading || newPassword.length < 6}>
                {loading ? "Menyimpan..." : "Reset Password"}
              </button>
            </>
          )}

          {step === "done" && (
            <>
              <div style={{ textAlign: "center", marginBottom: "24px" }}>
                <div style={{ fontSize: "3rem", marginBottom: "16px" }}>✅</div>
                <p style={{ color: "var(--public-text-secondary)" }}>
                  Password Anda sudah direset. Silakan login dengan password baru.
                </p>
              </div>
              <Link href="/login/member" className="btn-public-primary" style={{ width: "100%", textAlign: "center", textDecoration: "none" }}>
                Login Sekarang
              </Link>
            </>
          )}

          <div style={{ marginTop: "20px", textAlign: "center", fontSize: "0.875rem" }}>
            <Link href="/login/member" style={{ color: "var(--public-text-muted)", textDecoration: "none" }}>
              ← Kembali ke Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
