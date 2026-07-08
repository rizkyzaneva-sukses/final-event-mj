"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function MemberLoginPage() {
  const router = useRouter();
  const [noWa, setNoWa] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/member-auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noWa, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login gagal");
        return;
      }

      if (data.member.statusApproval !== "APPROVED") {
        setError("Akun Anda belum disetujui. Silakan tunggu persetujuan dari admin.");
        return;
      }

      router.push("/member/history");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan koneksi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="public-page">
      <div className="public-container" style={{ maxWidth: "420px" }}>
        <div className="public-card">
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div style={{
              width: "56px", height: "56px",
              background: "linear-gradient(135deg, var(--public-accent), #6366f1)",
              borderRadius: "var(--radius-lg)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px", fontSize: "1.5rem",
            }}>
              👤
            </div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--public-text)" }}>
              Login Member
            </h1>
            <p style={{ color: "var(--public-text-secondary)", fontSize: "0.875rem" }}>
              Masuk untuk melihat riwayat event Anda
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

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="input-public-label" htmlFor="noWa">No. WhatsApp</label>
              <input
                id="noWa"
                type="tel"
                className="input-public"
                placeholder="08xx xxxx xxxx"
                value={noWa}
                onChange={(e) => setNoWa(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="input-public-label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="input-public"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn-public-primary"
              style={{ width: "100%" }}
              disabled={loading}
            >
              {loading ? "Masuk..." : "Masuk"}
            </button>
          </form>

          <div style={{ marginTop: "20px", textAlign: "center", fontSize: "0.875rem" }}>
            <Link href="/login/member/forgot" style={{ color: "var(--public-accent)", textDecoration: "none" }}>
              Lupa password?
            </Link>
          </div>

          <div style={{ marginTop: "16px", textAlign: "center", fontSize: "0.875rem", color: "var(--public-text-secondary)" }}>
            Belum punya akun?{" "}
            <Link href="/register" style={{ color: "var(--public-accent)", textDecoration: "none", fontWeight: 500 }}>
              Daftar sekarang
            </Link>
          </div>

          <div style={{ marginTop: "16px", textAlign: "center", fontSize: "0.8125rem" }}>
            <Link href="/login" style={{ color: "var(--public-text-muted)", textDecoration: "none" }}>
              ← Login Admin
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
