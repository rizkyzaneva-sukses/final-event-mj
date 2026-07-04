"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Kementerian {
  id: string;
  nama: string;
  kodeUnik: string;
}

export default function NewEventPage() {
  const router = useRouter();
  const [kementerianList, setKementerianList] = useState<Kementerian[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [kementerianId, setKementerianId] = useState("");
  const [nama, setNama] = useState("");
  const [slug, setSlug] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [tanggalMulai, setTanggalMulai] = useState("");
  const [tanggalSelesai, setTanggalSelesai] = useState("");
  const [lokasi, setLokasi] = useState("");
  const [tipeAudiens, setTipeAudiens] = useState("KEDUANYA");
  const [isBerbayar, setIsBerbayar] = useState(false);
  const [kodeProgram, setKodeProgram] = useState("");

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/kementerian");
      const data = await res.json();
      setKementerianList(data.kementerian || []);
    }
    load();
  }, []);

  // Auto-generate slug from nama
  useEffect(() => {
    const generated = nama
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 100);
    setSlug(generated);
  }, [nama]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kementerianId,
          nama,
          slug,
          deskripsi: deskripsi || undefined,
          tanggalMulai,
          tanggalSelesai: tanggalSelesai || tanggalMulai,
          lokasi,
          tipeAudiens,
          isBerbayar,
          kodeProgram: isBerbayar ? kodeProgram : "",
        }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error || "Gagal membuat event"); return; }

      router.push(`/admin/event/${data.event.id}`);
    } catch { setError("Terjadi kesalahan"); }
    finally { setSaving(false); }
  };

  return (
    <>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Buat Event Baru</h1>
        <p className="admin-page-subtitle">Isi detail event yang akan dibuat</p>
      </div>

      <div className="admin-card" style={{ maxWidth: "720px" }}>
        {error && (
          <div style={{ background: "var(--admin-danger-bg)", padding: "12px 16px", borderRadius: "var(--radius-md)", marginBottom: "20px", color: "var(--admin-danger)", fontSize: "0.875rem" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="input-label">Kementerian *</label>
            <select className="input select" value={kementerianId} onChange={(e) => setKementerianId(e.target.value)} required>
              <option value="">Pilih kementerian...</option>
              {kementerianList.map((k) => (
                <option key={k.id} value={k.id}>{k.nama} ({k.kodeUnik})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="input-label">Nama Event *</label>
            <input className="input" placeholder="Contoh: Buka Bersama / RAHMA 2026" value={nama} onChange={(e) => setNama(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="input-label">Slug (URL)</label>
            <input className="input font-mono" placeholder="rahma-2026" value={slug} onChange={(e) => setSlug(e.target.value)} />
            <p style={{ fontSize: "0.75rem", color: "var(--admin-text-muted)", marginTop: "4px" }}>
              URL: /daftar/<strong>{slug || "..."}</strong>
            </p>
          </div>

          <div className="form-group">
            <label className="input-label">Deskripsi</label>
            <textarea className="input" rows={3} placeholder="Deskripsi event (opsional)" value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} style={{ resize: "vertical" }} />
          </div>

          <div className="form-row" style={{ marginBottom: "20px" }}>
            <div>
              <label className="input-label">Tanggal Mulai *</label>
              <input type="date" className="input" value={tanggalMulai} onChange={(e) => setTanggalMulai(e.target.value)} required />
            </div>
            <div>
              <label className="input-label">Tanggal Selesai</label>
              <input type="date" className="input" value={tanggalSelesai} onChange={(e) => setTanggalSelesai(e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="input-label">Lokasi</label>
            <input className="input" placeholder="Lokasi event" value={lokasi} onChange={(e) => setLokasi(e.target.value)} />
          </div>

          <div className="form-row" style={{ marginBottom: "20px" }}>
            <div>
              <label className="input-label">Tipe Audiens</label>
              <select className="input select" value={tipeAudiens} onChange={(e) => setTipeAudiens(e.target.value)}>
                <option value="KEDUANYA">Semua (Member & Umum)</option>
                <option value="MEMBER_ONLY">Member Only</option>
                <option value="UMUM">Umum</option>
              </select>
            </div>
            <div>
              <label className="input-label">Event Berbayar?</label>
              <div
                onClick={() => setIsBerbayar(!isBerbayar)}
                style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "10px 14px", background: "var(--admin-bg)",
                  border: `1px solid ${isBerbayar ? "var(--admin-accent)" : "var(--admin-border)"}`,
                  borderRadius: "var(--radius-md)", cursor: "pointer",
                  transition: "all 150ms ease",
                }}
              >
                <div style={{
                  width: "36px", height: "20px", borderRadius: "10px",
                  background: isBerbayar ? "var(--admin-accent)" : "var(--admin-border)",
                  position: "relative", transition: "background 150ms ease",
                }}>
                  <div style={{
                    width: "16px", height: "16px", borderRadius: "50%",
                    background: "white", position: "absolute", top: "2px",
                    left: isBerbayar ? "18px" : "2px",
                    transition: "left 150ms ease",
                  }} />
                </div>
                <span style={{ fontSize: "0.875rem" }}>{isBerbayar ? "Ya" : "Tidak"}</span>
              </div>
            </div>
          </div>

          {isBerbayar && (
            <div className="form-group animate-fade-in">
              <label className="input-label">Kode Program (2 digit)</label>
              <input className="input font-mono" placeholder="21" value={kodeProgram} onChange={(e) => setKodeProgram(e.target.value)} maxLength={4} style={{ maxWidth: "120px" }} />
              <p style={{ fontSize: "0.75rem", color: "var(--admin-text-muted)", marginTop: "4px" }}>
                Kode unik pembayaran akan menjadi: {kementerianList.find((k) => k.id === kementerianId)?.kodeUnik || "??"}{kodeProgram || "??"}
              </p>
            </div>
          )}

          <div style={{ display: "flex", gap: "12px", marginTop: "28px" }}>
            <button type="button" className="btn btn-secondary" onClick={() => router.back()}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Menyimpan..." : "Buat Event"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
