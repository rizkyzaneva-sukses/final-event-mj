"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface MemberDetail {
  id: string;
  nama: string;
  noWa: string;
  domisili: string;
  email: string | null;
  angkatanMj: string | null;
  statusKeanggotaan: string;
  tanggungan: {
    id: string;
    nama: string;
    tanggalLahir: string | null;
    hubungan: string;
  }[];
  registrasi: {
    id: string;
    statusOts: boolean;
    createdAt: string;
    event: { id: string; nama: string; slug: string; tanggalMulai: string };
    pembayaran: { status: string; jumlahTagihan: number } | null;
    peserta: { tanggungan: { nama: string } | null }[];
  }[];
}

export default function MemberDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [member, setMember] = useState<MemberDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/member/${id}`);
      const data = await res.json();
      setMember(data.member);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="admin-page-header">
        <div className="skeleton" style={{ height: "28px", width: "200px", marginBottom: "12px" }} />
        <div className="skeleton" style={{ height: "16px", width: "120px" }} />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="empty-state">
        <div className="empty-state-title">Member tidak ditemukan</div>
        <Link href="/admin/member" className="btn btn-secondary" style={{ marginTop: "16px" }}>
          ← Kembali
        </Link>
      </div>
    );
  }

  const hubunganLabel: Record<string, string> = {
    PASANGAN: "Pasangan",
    ANAK: "Anak",
    LAINNYA: "Lainnya",
  };

  return (
    <>
      <style>{`
        .member-detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 24px;
        }
        @media (max-width: 768px) {
          .member-detail-grid { grid-template-columns: 1fr; }
        }
        .detail-field {
          margin-bottom: 16px;
        }
        .detail-field-label {
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--admin-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 4px;
        }
        .detail-field-value {
          font-size: 0.9375rem;
          color: var(--admin-text);
        }
        .tanggungan-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: var(--admin-bg);
          border: 1px solid var(--admin-border);
          border-radius: var(--radius-md);
          margin-bottom: 8px;
        }
        .tanggungan-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .tanggungan-name {
          font-weight: 500;
          font-size: 0.875rem;
        }
        .tanggungan-meta {
          font-size: 0.75rem;
          color: var(--admin-text-muted);
        }
      `}</style>

      <div className="admin-page-header">
        <Link href="/admin/member" style={{ color: "var(--admin-text-muted)", textDecoration: "none", fontSize: "0.875rem" }}>
          ← Kembali ke Daftar Member
        </Link>
        <h1 className="admin-page-title" style={{ marginTop: "8px" }}>{member.nama}</h1>
        <p className="admin-page-subtitle">
          <span className={`badge ${member.statusKeanggotaan === "MEMBER" ? "badge-info" : "badge-neutral"}`}>
            {member.statusKeanggotaan}
          </span>
        </p>
      </div>

      <div className="member-detail-grid">
        <div className="admin-card">
          <h2 className="admin-card-title" style={{ marginBottom: "20px" }}>Profil</h2>
          <div className="detail-field">
            <div className="detail-field-label">No. WhatsApp</div>
            <div className="detail-field-value font-mono">{member.noWa}</div>
          </div>
          <div className="detail-field">
            <div className="detail-field-label">Domisili</div>
            <div className="detail-field-value">{member.domisili || "—"}</div>
          </div>
          <div className="detail-field">
            <div className="detail-field-label">Email</div>
            <div className="detail-field-value">{member.email || "—"}</div>
          </div>
          <div className="detail-field">
            <div className="detail-field-label">Angkatan MJ</div>
            <div className="detail-field-value">{member.angkatanMj || "—"}</div>
          </div>
        </div>

        <div className="admin-card">
          <h2 className="admin-card-title" style={{ marginBottom: "20px" }}>
            Tanggungan ({member.tanggungan.length})
          </h2>
          {member.tanggungan.length === 0 ? (
            <div className="empty-state" style={{ padding: "24px 0" }}>
              <div className="empty-state-text">Belum ada tanggungan</div>
            </div>
          ) : (
            member.tanggungan.map((t) => (
              <div key={t.id} className="tanggungan-card">
                <div className="tanggungan-info">
                  <span className="tanggungan-name">{t.nama}</span>
                  <span className="tanggungan-meta">
                    {hubunganLabel[t.hubungan] || t.hubungan}
                    {t.tanggalLahir && ` · ${new Date(t.tanggalLahir).toLocaleDateString("id-ID")}`}
                  </span>
                </div>
                <span className="badge badge-neutral">{hubunganLabel[t.hubungan]}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="admin-card">
        <h2 className="admin-card-title" style={{ marginBottom: "20px" }}>
          Riwayat Event ({member.registrasi.length})
        </h2>
        {member.registrasi.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-text">Belum pernah mengikuti event</div>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Tanggal</th>
                  <th>Peserta</th>
                  <th>Status Bayar</th>
                  <th>Tagihan</th>
                </tr>
              </thead>
              <tbody>
                {member.registrasi.map((reg) => (
                  <tr key={reg.id}>
                    <td>
                      <Link
                        href={`/admin/event/${reg.event.id}`}
                        style={{ color: "var(--admin-accent)", textDecoration: "none", fontWeight: 500 }}
                      >
                        {reg.event.nama}
                      </Link>
                    </td>
                    <td style={{ fontSize: "0.8125rem" }}>
                      {new Date(reg.event.tanggalMulai).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td>{reg.peserta.length} orang</td>
                    <td>
                      {reg.pembayaran ? (
                        <span className={`badge ${
                          reg.pembayaran.status === "TERVERIFIKASI" ? "badge-success"
                            : reg.pembayaran.status === "BELUM_DIVERIFIKASI" ? "badge-warning"
                            : "badge-danger"
                        }`}>
                          {reg.pembayaran.status === "TERVERIFIKASI" ? "✓ Verified"
                            : reg.pembayaran.status === "BELUM_DIVERIFIKASI" ? "Pending"
                            : "Belum Bayar"}
                        </span>
                      ) : (
                        <span className="badge badge-neutral">Gratis</span>
                      )}
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}>
                      {reg.pembayaran
                        ? `Rp ${reg.pembayaran.jumlahTagihan.toLocaleString("id-ID")}`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
