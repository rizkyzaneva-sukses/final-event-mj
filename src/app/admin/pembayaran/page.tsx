import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/session";
import Link from "next/link";

export default async function PembayaranPage() {
  const user = await getAuthUser();
  if (!user) return null;

  // Build event filter based on role
  let eventWhere = {};
  if (user.role === "KEMENTERIAN" && user.kementerianId) {
    eventWhere = { kementerianId: user.kementerianId };
  } else if (user.role === "BENDAHARA") {
    eventWhere = { bendaharaAssignment: { some: { adminUserId: user.userId } } };
  }

  const events = await prisma.event.findMany({
    where: { ...eventWhere, isBerbayar: true, isActive: true },
    include: {
      kementerian: { select: { nama: true } },
      registrasi: {
        include: {
          member: { select: { nama: true, noWa: true } },
          pembayaran: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { tanggalMulai: "desc" },
  });

  return (
    <>
      <style>{`
        .payment-event-section {
          margin-bottom: 32px;
        }
        .payment-event-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .payment-summary {
          display: flex;
          gap: 16px;
        }
        .payment-summary-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8125rem;
        }
      `}</style>

      <div className="admin-page-header">
        <h1 className="admin-page-title">Pembayaran</h1>
        <p className="admin-page-subtitle">Status pembayaran lintas event</p>
      </div>

      {events.length === 0 ? (
        <div className="admin-card">
          <div className="empty-state">
            <div className="empty-state-icon">💰</div>
            <div className="empty-state-title">Belum ada event berbayar</div>
          </div>
        </div>
      ) : (
        events.map((ev) => {
          const payments = ev.registrasi.filter((r) => r.pembayaran);
          const belumBayar = payments.filter((r) => r.pembayaran?.status === "BELUM_BAYAR").length;
          const pending = payments.filter((r) => r.pembayaran?.status === "BELUM_DIVERIFIKASI").length;
          const verified = payments.filter((r) => r.pembayaran?.status === "TERVERIFIKASI").length;
          const totalAmount = payments.reduce((sum, r) => sum + (r.pembayaran?.jumlahTagihan || 0), 0);
          const verifiedAmount = payments.filter((r) => r.pembayaran?.status === "TERVERIFIKASI").reduce((sum, r) => sum + (r.pembayaran?.jumlahTagihan || 0), 0);

          return (
            <div key={ev.id} className="payment-event-section animate-fade-in">
              <div className="payment-event-header">
                <div>
                  <Link href={`/admin/event/${ev.id}`} style={{ color: "var(--admin-text)", textDecoration: "none", fontWeight: 600, fontSize: "1.0625rem" }}>
                    {ev.nama}
                  </Link>
                  <div style={{ fontSize: "0.8125rem", color: "var(--admin-text-muted)" }}>{ev.kementerian.nama}</div>
                </div>
                <div className="payment-summary">
                  <div className="payment-summary-item">
                    <span className="status-dot status-dot-belum" />
                    {belumBayar}
                  </div>
                  <div className="payment-summary-item">
                    <span className="status-dot status-dot-pending" />
                    {pending}
                  </div>
                  <div className="payment-summary-item">
                    <span className="status-dot status-dot-verified" />
                    {verified}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
                <div className="stat-card" style={{ flex: 1, padding: "14px 18px" }}>
                  <div className="stat-label" style={{ fontSize: "0.75rem" }}>Total Tagihan</div>
                  <div className="font-mono" style={{ fontSize: "1.125rem", fontWeight: 600 }}>Rp {totalAmount.toLocaleString("id-ID")}</div>
                </div>
                <div className="stat-card" style={{ flex: 1, padding: "14px 18px" }}>
                  <div className="stat-label" style={{ fontSize: "0.75rem" }}>Terkumpul</div>
                  <div className="font-mono" style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--admin-success)" }}>Rp {verifiedAmount.toLocaleString("id-ID")}</div>
                </div>
              </div>

              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Pendaftar</th>
                      <th>Tagihan</th>
                      <th>Bukti</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.length === 0 ? (
                      <tr><td colSpan={4}><div className="empty-state" style={{ padding: "16px" }}><div className="empty-state-text">Belum ada pembayaran</div></div></td></tr>
                    ) : (
                      payments.slice(0, 10).map((reg) => (
                        <tr key={reg.id}>
                          <td>
                            <div style={{ fontWeight: 500, fontSize: "0.875rem" }}>{reg.member.nama}</div>
                            <div className="font-mono" style={{ fontSize: "0.75rem", color: "var(--admin-text-muted)" }}>{reg.member.noWa}</div>
                          </td>
                          <td className="font-mono" style={{ fontSize: "0.8125rem" }}>
                            Rp {(reg.pembayaran?.jumlahTagihan || 0).toLocaleString("id-ID")}
                          </td>
                          <td>
                            {reg.pembayaran?.buktiTransferUrl ? (
                              <a href={reg.pembayaran.buktiTransferUrl} target="_blank" rel="noreferrer">
                                <img
                                  src={reg.pembayaran.buktiTransferUrl.replace(/\/upload\//, "/upload/c_thumb,w_40,h_40,g_auto/")}
                                  alt="Bukti"
                                  className="thumbnail"
                                  style={{ width: "40px", height: "40px" }}
                                />
                              </a>
                            ) : "—"}
                          </td>
                          <td>
                            <span className={`badge ${
                              reg.pembayaran?.status === "TERVERIFIKASI" ? "badge-success"
                                : reg.pembayaran?.status === "BELUM_DIVERIFIKASI" ? "badge-warning"
                                : "badge-danger"
                            }`}>
                              {reg.pembayaran?.status === "TERVERIFIKASI" ? "✓ Verified"
                                : reg.pembayaran?.status === "BELUM_DIVERIFIKASI" ? "Pending"
                                : "Belum Bayar"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {payments.length > 10 && (
                <div style={{ textAlign: "center", marginTop: "8px" }}>
                  <Link href={`/admin/event/${ev.id}`} className="btn btn-ghost btn-sm">
                    Lihat semua ({payments.length}) →
                  </Link>
                </div>
              )}
            </div>
          );
        })
      )}
    </>
  );
}
