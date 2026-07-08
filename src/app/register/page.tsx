"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [noWa, setNoWa] = useState("");
  const [nama, setNama] = useState("");
  const [password, setPassword] = useState("");
  const [domisili, setDomisili] = useState("");
  const [email, setEmail] = useState("");
  const [angkatanMj, setAngkatanMj] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/member-auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noWa, nama, password, domisili, email, angkatanMj }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registrasi gagal");
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
      <div className="public-container" style={{ maxWidth: "480px" }}>
        <div className="public-card">
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--public-text)" }}>
              Daftar Member
            </h1>
            <p style={{ color: "var(--public-text-secondary)", fontSize: "0.875rem" }}>
              Buat akun untuk mendaftar event
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
              <label className="input-public-label" htmlFor="noWa">No. WhatsApp *</label>
              <input
                id="noWa" type="tel" className="input-public"
                placeholder="08xx xxxx xxxx"
                value={noWa} onChange={(e) => setNoWa(e.target.value)}
                required autoFocus
              />
            </div>

            <div className="form-group">
              <label className="input-public-label" htmlFor="nama">Nama Lengkap *</label>
              <input
                id="nama" className="input-public"
                placeholder="Nama lengkap Anda"
                value={nama} onChange={(e) => setNama(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="input-public-label" htmlFor="password">Password *</label>
              <input
                id="password" type="password" className="input-public"
                placeholder="Min. 6 karakter"
                value={password} onChange={(e) => setPassword(e.target.value)}
                required minLength={6}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="form-group">
                <label className="input-public-label" htmlFor="domisili">Domisili</label>
                <input
                  id="domisili" className="input-public"
                  placeholder="Kota/Kabupaten"
                  value={domisili} onChange={(e) => setDomisili(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="input-public-label" htmlFor="email">Email</label>
                <input
                  id="email" type="email" className="input-public"
                  placeholder="email@contoh.com"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="input-public-label" htmlFor="angkatan">Angkatan MJ (opsional)</label>
              <input
                id="angkatan" className="input-public"
                placeholder="Contoh: 1, 2, 3..."
                value={angkatanMj} onChange={(e) => setAngkatanMj(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn-public-primary"
              style={{ width: "100%" }}
              disabled={loading}
            >
              {loading ? "Mendaftar..." : "Daftar Sekarang"}
            </button>
          </form>

          <div style={{ marginTop: "16px", textAlign: "center", fontSize: "0.875rem", color: "var(--public-text-secondary)" }}>
            Sudah punya akun?{" "}
            <Link href="/login/member" style={{ color: "var(--public-accent)", textDecoration: "none", fontWeight: 500 }}>
              Masuk
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
