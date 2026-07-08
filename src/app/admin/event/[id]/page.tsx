"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface EventDetail {
  id: string;
  nama: string;
  slug: string;
  deskripsi: string | null;
  imageUrl: string | null;
  tanggalMulai: string;
  tanggalSelesai: string;
  lokasi: string;
  tipeAudiens: string;
  isBerbayar: boolean;
  isActive: boolean;
  kodeProgram: string;
  kementerian: { id: string; nama: string; kodeUnik: string };
  hargaTier: { id: string; kategori: string; harga: number; usiaMin: number | null; usiaMax: number | null; urutan: number }[];
  bendaharaAssignment: { adminUser: { id: string; nama: string; email: string } }[];
  _count: { registrasi: number };
}

interface Registration {
  id: string;
  statusOts: boolean;
  createdAt: string;
  checkinCode: string;
  checkedIn: boolean;
  checkedInAt: string | null;
  member: { id: string; nama: string; noWa: string; domisili: string };
  peserta: { member: { nama: string } | null; tanggungan: { nama: string; tanggalLahir: string | null; hubungan: string } | null }[];
  pembayaran: { id: string; jumlahTagihan: number; kodeUnik: string; status: string; buktiTransferUrl: string | null; noReferensi: string | null } | null;
}

export default function EventDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"info" | "peserta" | "pembayaran" | "absensi">("info");
  const [verifying, setVerifying] = useState<string | null>(null);
  const [checkinInput, setCheckinInput] = useState("");
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [checkinResult, setCheckinResult] = useState<{ ok: boolean; message: string; member?: string } | null>(null);

  const fetchData = useCallback(async () => {
    const [eventRes, regRes] = await Promise.all([
      fetch(`/api/event/${id}`),
      fetch(`/api/event/${id}/registrasi`),
    ]);
    const eventData = await eventRes.json();
    const regData = await regRes.json();
    setEvent(eventData.event);
    setRegistrations(regData.registrations || []);
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleVerify = async (pembayaranId: string, status: string) => {
    setVerifying(pembayaranId);
    try {
      await fetch(`/api/pembayaran/${pembayaranId}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      fetchData();
    } finally { setVerifying(null); }
  };

  const handleCheckin = async () => {
    if (!checkinInput.trim()) return;
    setCheckinLoading(true);
    setCheckinResult(null);
    try {
      const res = await fetch(`/api/event/${id}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkinCode: checkinInput.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setCheckinResult({ ok: true, message: `Check-in berhasil: ${data.member.nama}`, member: data.member.nama });
        setCheckinInput("");
        fetchData();
      } else if (res.status === 409) {
        setCheckinResult({ ok: false, message: `${data.member.nama} sudah check-in sebelumnya` });
      } else {
        setCheckinResult({ ok: false, message: data.error || "Check-in gagal" });
      }
    } catch {
      setCheckinResult({ ok: false, message: "Gagal menghubungi server" });
    } finally {
      setCheckinLoading(false);
    }
  };

  const checkedInCount = registrations.filter((r) => r.checkedIn).length;
  const totalRegistrations = registrations.length;

  if (loading) {
    return (
      <div className="admin-page-header">
        <div className="skeleton" style={{ height: "28px", width: "300px", marginBottom: "12px" }} />
        <div className="skeleton" style={{ height: "16px", width: "150px" }} />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="empty-state">
        <div className="empty-state-title">Event tidak ditemukan</div>
      </div>
    );
  }

  const publicUrl = `/daftar/${event.slug}`;

  return (
    <>
      <style>{`
        .event-tabs {
          display: flex;
          gap: 4px;
          background: var(--admin-bg-secondary);
          padding: 4px;
          border-radius: var(--radius-md);
          margin-bottom: 24px;
          border: 1px solid var(--admin-border);
        }
        .event-tab {
          flex: 1;
          padding: 10px 16px;
          background: transparent;
          border: none;
          border-radius: var(--radius-sm);
          color: var(--admin-text-secondary);
          font-family: inherit;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all var(--transition-fast);
          text-align: center;
        }
        .event-tab:hover { color: var(--admin-text); }
        .event-tab.active {
          background: var(--admin-surface);
          color: var(--admin-accent);
          box-shadow: var(--shadow-sm);
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        @media (max-width: 768px) { .info-grid { grid-template-columns: 1fr; } }
        .tier-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid var(--admin-border);
        }
        .tier-row:last-child { border-bottom: none; }
        .verify-actions {
          display: flex;
          gap: 4px;
        }
      `}</style>

      <div className="admin-page-header">
        <Link href="/admin/event" style={{ color: "var(--admin-text-muted)", textDecoration: "none", fontSize: "0.875rem" }}>
          ← Kembali ke Daftar Event
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px" }}>
          <h1 className="admin-page-title">{event.nama}</h1>
          <span className={`badge ${event.isActive ? "badge-success" : "badge-neutral"}`}>
            {event.isActive ? "Aktif" : "Ditutup"}
          </span>
        </div>
        <p className="admin-page-subtitle">
          {event.kementerian.nama} · {event._count.registrasi} pendaftar
          <span style={{ marginLeft: "12px" }}>
            Link: <a href={publicUrl} target="_blank" style={{ color: "var(--admin-accent)" }} rel="noreferrer">{publicUrl}</a>
          </span>
        </p>
      </div>

      <div className="event-tabs">
        <button className={`event-tab ${tab === "info" ? "active" : ""}`} onClick={() => setTab("info")}>Info Event</button>
        <button className={`event-tab ${tab === "peserta" ? "active" : ""}`} onClick={() => setTab("peserta")}>Peserta ({registrations.length})</button>
        {event.isBerbayar && (
          <button className={`event-tab ${tab === "pembayaran" ? "active" : ""}`} onClick={() => setTab("pembayaran")}>Pembayaran</button>
        )}
        <button className={`event-tab ${tab === "absensi" ? "active" : ""}`} onClick={() => setTab("absensi")}>Absensi ({checkedInCount}/{totalRegistrations})</button>
      </div>

      {tab === "info" && (
        <div className="animate-fade-in">
          {event.imageUrl && (
            <div className="admin-card" style={{ marginBottom: "16px" }}>
              <h3 className="admin-card-title" style={{ marginBottom: "12px" }}>Banner</h3>
              <img
                src={event.imageUrl}
                alt={`Banner ${event.nama}`}
                style={{
                  width: "100%",
                  maxHeight: "300px",
                  objectFit: "cover",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--admin-border)",
                }}
              />
            </div>
          )}

          <div className="info-grid">
          <div className="admin-card">
            <h3 className="admin-card-title" style={{ marginBottom: "16px" }}>Detail</h3>
            <div className="detail-field" style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--admin-text-muted)", marginBottom: "4px" }}>Tanggal</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.875rem" }}>
                {new Date(event.tanggalMulai).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </div>
            </div>
            <div className="detail-field" style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--admin-text-muted)", marginBottom: "4px" }}>Lokasi</div>
              <div>{event.lokasi || "—"}</div>
            </div>
            <div className="detail-field" style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--admin-text-muted)", marginBottom: "4px" }}>Tipe</div>
              <div style={{ display: "flex", gap: "6px" }}>
                <span className="badge badge-info">{event.tipeAudiens === "MEMBER_ONLY" ? "Member Only" : event.tipeAudiens === "UMUM" ? "Umum" : "Semua"}</span>
                <span className={`badge ${event.isBerbayar ? "badge-warning" : "badge-info"}`}>{event.isBerbayar ? "Berbayar" : "Gratis"}</span>
              </div>
            </div>
            {event.isBerbayar && (
              <div className="detail-field">
                <div style={{ fontSize: "0.75rem", color: "var(--admin-text-muted)", marginBottom: "4px" }}>Kode Unik</div>
                <div className="font-mono" style={{ fontWeight: 600, fontSize: "1.125rem" }}>
                  {event.kementerian.kodeUnik}{event.kodeProgram}
                </div>
              </div>
            )}
          </div>

          {event.isBerbayar && (
            <div className="admin-card">
              <h3 className="admin-card-title" style={{ marginBottom: "16px" }}>Harga Tier</h3>
              {event.hargaTier.length === 0 ? (
                <div className="empty-state" style={{ padding: "24px 0" }}>
                  <div className="empty-state-text">Belum ada harga tier</div>
                </div>
              ) : (
                event.hargaTier.map((t) => (
                  <div key={t.id} className="tier-row">
                    <div>
                      <div style={{ fontWeight: 500, fontSize: "0.875rem" }}>{t.kategori}</div>
                      {(t.usiaMin !== null || t.usiaMax !== null) && (
                        <div style={{ fontSize: "0.75rem", color: "var(--admin-text-muted)" }}>
                          {t.usiaMin !== null && t.usiaMax !== null ? `${t.usiaMin}–${t.usiaMax} thn` : t.usiaMin !== null ? `≥${t.usiaMin} thn` : `≤${t.usiaMax} thn`}
                        </div>
                      )}
                    </div>
                    <div className="font-mono" style={{ fontWeight: 600, color: "var(--admin-accent)" }}>
                      Rp {t.harga.toLocaleString("id-ID")}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
          </div>
        </div>
      )}

      {tab === "peserta" && (
        <div className="table-container animate-fade-in">
          <table className="table">
            <thead>
              <tr>
                <th>No</th>
                <th>Pendaftar</th>
                <th>No. WA</th>
                <th>Peserta</th>
                <th>OTS</th>
                <th>Tanggal Daftar</th>
              </tr>
            </thead>
            <tbody>
              {registrations.length === 0 ? (
                <tr><td colSpan={6}><div className="empty-state"><div className="empty-state-text">Belum ada pendaftar</div></div></td></tr>
              ) : (
                registrations.map((reg, i) => (
                  <tr key={reg.id}>
                    <td>{i + 1}</td>
                    <td>
                      <Link href={`/admin/member/${reg.member.id}`} style={{ color: "var(--admin-accent)", textDecoration: "none", fontWeight: 500 }}>
                        {reg.member.nama}
                      </Link>
                    </td>
                    <td className="font-mono" style={{ fontSize: "0.8125rem" }}>{reg.member.noWa}</td>
                    <td>
                      {reg.peserta.map((p, j) => (
                        <span key={j} style={{ fontSize: "0.8125rem" }}>
                          {p.member?.nama || p.tanggungan?.nama || "—"}
                          {j < reg.peserta.length - 1 && ", "}
                        </span>
                      ))}
                    </td>
                    <td>{reg.statusOts ? <span className="badge badge-warning">OTS</span> : "—"}</td>
                    <td style={{ fontSize: "0.8125rem", fontFamily: "var(--font-mono)" }}>
                      {new Date(reg.createdAt).toLocaleDateString("id-ID")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "pembayaran" && event.isBerbayar && (
        <div className="table-container animate-fade-in">
          <table className="table">
            <thead>
              <tr>
                <th>Pendaftar</th>
                <th>Tagihan</th>
                <th>Kode</th>
                <th>Bukti</th>
                <th>Ref</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {registrations.filter((r) => r.pembayaran).length === 0 ? (
                <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-text">Belum ada pembayaran</div></div></td></tr>
              ) : (
                registrations.filter((r) => r.pembayaran).map((reg) => (
                  <tr key={reg.id}>
                    <td style={{ fontWeight: 500 }}>{reg.member.nama}</td>
                    <td className="font-mono" style={{ fontSize: "0.8125rem" }}>
                      Rp {reg.pembayaran!.jumlahTagihan.toLocaleString("id-ID")}
                    </td>
                    <td className="font-mono" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
                      {reg.pembayaran!.kodeUnik}
                    </td>
                    <td>
                      {reg.pembayaran!.buktiTransferUrl ? (
                        <a href={reg.pembayaran!.buktiTransferUrl} target="_blank" rel="noreferrer">
                          <img
                            src={reg.pembayaran!.buktiTransferUrl.replace(/\/upload\//, "/upload/c_thumb,w_48,h_48,g_auto/")}
                            alt="Bukti"
                            className="thumbnail"
                          />
                        </a>
                      ) : "—"}
                    </td>
                    <td className="font-mono" style={{ fontSize: "0.75rem" }}>
                      {reg.pembayaran!.noReferensi || "—"}
                    </td>
                    <td>
                      <span className={`badge ${
                        reg.pembayaran!.status === "TERVERIFIKASI" ? "badge-success"
                          : reg.pembayaran!.status === "BELUM_DIVERIFIKASI" ? "badge-warning"
                          : "badge-danger"
                      }`}>
                        <span className={`status-dot ${
                          reg.pembayaran!.status === "TERVERIFIKASI" ? "status-dot-verified"
                            : reg.pembayaran!.status === "BELUM_DIVERIFIKASI" ? "status-dot-pending"
                            : "status-dot-belum"
                        }`} />
                        {reg.pembayaran!.status === "TERVERIFIKASI" ? "Terverifikasi"
                          : reg.pembayaran!.status === "BELUM_DIVERIFIKASI" ? "Pending"
                          : "Belum Bayar"}
                      </span>
                    </td>
                    <td>
                      <div className="verify-actions">
                        {reg.pembayaran!.status !== "TERVERIFIKASI" && (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleVerify(reg.pembayaran!.id, "TERVERIFIKASI")}
                            disabled={verifying === reg.pembayaran!.id}
                          >
                            ✓
                          </button>
                        )}
                        {reg.pembayaran!.status === "TERVERIFIKASI" && (
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleVerify(reg.pembayaran!.id, "BELUM_DIVERIFIKASI")}
                            disabled={verifying === reg.pembayaran!.id}
                          >
                            ↩
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "absensi" && (
        <div className="animate-fade-in">
          <div className="admin-card" style={{ marginBottom: "24px", maxWidth: "480px" }}>
            <h3 className="admin-card-title" style={{ marginBottom: "16px" }}>Check-In Manual</h3>
            <p style={{ fontSize: "0.875rem", color: "var(--admin-text-muted)", marginBottom: "16px" }}>
              Masukkan kode check-in dari peserta (6 digit karakter unik)
            </p>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                className="input font-mono"
                placeholder="Masukkan kode check-in"
                value={checkinInput}
                onChange={(e) => setCheckinInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCheckin()}
                disabled={checkinLoading}
                style={{ flex: 1 }}
              />
              <button
                className="btn btn-primary"
                onClick={handleCheckin}
                disabled={checkinLoading || !checkinInput.trim()}
              >
                {checkinLoading ? "Proses..." : "Check-In"}
              </button>
            </div>
            {checkinResult && (
              <div style={{
                marginTop: "12px",
                padding: "12px 16px",
                borderRadius: "var(--radius-md)",
                fontSize: "0.875rem",
                background: checkinResult.ok ? "var(--admin-success-bg)" : "var(--admin-danger-bg)",
                color: checkinResult.ok ? "var(--admin-success)" : "var(--admin-danger)",
              }}>
                {checkinResult.message}
              </div>
            )}
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Pendaftar</th>
                  <th>No. WA</th>
                  <th>Kode Check-In</th>
                  <th>Status</th>
                  <th>Waktu Check-In</th>
                </tr>
              </thead>
              <tbody>
                {registrations.length === 0 ? (
                  <tr><td colSpan={6}><div className="empty-state"><div className="empty-state-text">Belum ada pendaftar</div></div></td></tr>
                ) : (
                  registrations.map((reg, i) => (
                    <tr key={reg.id}>
                      <td>{i + 1}</td>
                      <td style={{ fontWeight: 500 }}>{reg.member.nama}</td>
                      <td className="font-mono" style={{ fontSize: "0.8125rem" }}>{reg.member.noWa}</td>
                      <td>
                        <code style={{
                          padding: "4px 8px",
                          background: "var(--admin-bg)",
                          borderRadius: "var(--radius-sm)",
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.75rem",
                          letterSpacing: "0.05em",
                        }}>
                          {reg.checkinCode.slice(0, 8)}
                        </code>
                      </td>
                      <td>
                        <span className={`badge ${reg.checkedIn ? "badge-success" : "badge-neutral"}`}>
                          {reg.checkedIn ? "✓ Hadir" : "Belum"}
                        </span>
                      </td>
                      <td style={{ fontSize: "0.8125rem", fontFamily: "var(--font-mono)" }}>
                        {reg.checkedInAt
                          ? new Date(reg.checkedInAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
                          : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
