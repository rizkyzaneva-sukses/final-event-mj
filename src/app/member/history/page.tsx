"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface MemberInfo {
  memberId: string;
  nama: string;
  noWa: string;
  statusKeanggotaan: string;
  statusApproval: string;
}

interface RegistrasiHistory {
  id: string;
  createdAt: string;
  checkedIn: boolean;
  checkedInAt: string | null;
  event: {
    id: string;
    nama: string;
    slug: string;
    tanggalMulai: string;
    lokasi: string;
    isBerbayar: boolean;
  };
  pembayaran: {
    status: string;
    jumlahTagihan: number;
  } | null;
}

export default function MemberHistoryPage() {
  const router = useRouter();
  const [member, setMember] = useState<MemberInfo | null>(null);
  const [history, setHistory] = useState<RegistrasiHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [meRes, histRes] = await Promise.all([
          fetch("/api/member-auth/me"),
          fetch("/api/member/history"),
        ]);
        const meData = await meRes.json();
        if (!meData.member) {
          router.push("/login/member");
          return;
        }
        setMember(meData.member);
        const histData = await histRes.json();
        setHistory(histData.history || []);
      } catch {
        router.push("/login/member");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/member-auth/logout", { method: "POST" });
    router.push("/login/member");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="public-page">
        <div className="public-container" style={{ maxWidth: "640px" }}>
          <div className="public-card" style={{ textAlign: "center", padding: "48px" }}>
            <div className="spinner" style={{ color: "var(--public-accent)" }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="public-page">
      <div className="public-container" style={{ maxWidth: "640px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--public-text)" }}>
              Riwayat Event
            </h1>
            <p style={{ fontSize: "0.875rem", color: "var(--public-text-secondary)" }}>
              {member?.nama}
            </p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: "8px 16px", background: "var(--public-surface)",
              border: "1px solid var(--public-border)", borderRadius: "var(--radius-md)",
              fontSize: "0.8125rem", color: "var(--public-text-secondary)",
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Keluar
          </button>
        </div>

        {/* Member Info Card */}
        <div className="public-card" style={{ marginBottom: "16px", padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{
              width: "48px", height: "48px", borderRadius: "50%",
              background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 600, fontSize: "1.125rem", color: "white",
            }}>
              {member?.nama.charAt(0)}
            </div>
            <div>
              <div style={{ fontWeight: 600, color: "var(--public-text)" }}>{member?.nama}</div>
              <div style={{ fontSize: "0.8125rem", color: "var(--public-text-muted)" }}>{member?.noWa}</div>
            </div>
            <div style={{ marginLeft: "auto" }}>
              <span className={`badge ${member?.statusApproval === "APPROVED" ? "badge-success" : member?.statusApproval === "PENDING" ? "badge-warning" : "badge-neutral"}`}>
                {member?.statusApproval === "APPROVED" ? "✓ Aktif" : member?.statusApproval === "PENDING" ? "Menunggu" : "Ditolak"}
              </span>
            </div>
          </div>
        </div>

        {/* History List */}
        {history.length === 0 ? (
          <div className="public-card" style={{ textAlign: "center", padding: "48px" }}>
            <div style={{ fontSize: "3rem", marginBottom: "16px", opacity: 0.5 }}>📅</div>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--public-text)", marginBottom: "8px" }}>
              Belum Ada Event
            </h2>
            <p style={{ color: "var(--public-text-secondary)", fontSize: "0.875rem", marginBottom: "24px" }}>
              Anda belum mendaftar di event apapun
            </p>
            <Link href="/" style={{ color: "var(--public-accent)", textDecoration: "none", fontWeight: 500 }}>
              Lihat Event yang Tersedia →
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {history.map((reg) => (
              <div key={reg.id} className="public-card" style={{ padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <div>
                    <Link href={`/daftar/${reg.event.slug}`} style={{ fontWeight: 600, color: "var(--public-text)", textDecoration: "none", fontSize: "1.0625rem" }}>
                      {reg.event.nama}
                    </Link>
                    <div style={{ fontSize: "0.8125rem", color: "var(--public-text-secondary)", marginTop: "4px" }}>
                      📅 {new Date(reg.event.tanggalMulai).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                    </div>
                    {reg.event.lokasi && (
                      <div style={{ fontSize: "0.8125rem", color: "var(--public-text-muted)", marginTop: "2px" }}>
                        📍 {reg.event.lokasi}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                    {reg.checkedIn && (
                      <span className="badge badge-success">✓ Hadir</span>
                    )}
                    {reg.pembayaran && (
                      <span className={`badge ${
                        reg.pembayaran.status === "TERVERIFIKASI" ? "badge-success"
                          : reg.pembayaran.status === "BELUM_DIVERIFIKASI" ? "badge-warning"
                          : "badge-neutral"
                      }`}>
                        {reg.pembayaran.status === "TERVERIFIKASI" ? "Lunas"
                          : reg.pembayaran.status === "BELUM_DIVERIFIKASI" ? "Pending"
                          : "Belum Bayar"}
                      </span>
                    )}
                    {!reg.pembayaran && !reg.event.isBerbayar && (
                      <span className="badge badge-success">Gratis</span>
                    )}
                  </div>
                </div>
                {reg.event.isBerbayar && reg.pembayaran && (
                  <div style={{ fontSize: "0.8125rem", color: "var(--public-text-muted)", fontFamily: "var(--font-mono)" }}>
                    Rp {reg.pembayaran.jumlahTagihan.toLocaleString("id-ID")}
                  </div>
                )}
                {reg.checkedIn && reg.checkedInAt && (
                  <div style={{ fontSize: "0.75rem", color: "var(--public-success)", marginTop: "4px" }}>
                    Check-in: {new Date(reg.checkedInAt).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
