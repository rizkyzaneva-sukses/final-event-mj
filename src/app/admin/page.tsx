import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/session";
import Link from "next/link";

export default async function AdminDashboard() {
  const user = await getAuthUser();
  if (!user) return null;

  // Build queries based on role
  const memberCount = user.role === "SDM" ? await prisma.member.count() : null;

  let eventWhere = {};
  if (user.role === "KEMENTERIAN" && user.kementerianId) {
    eventWhere = { kementerianId: user.kementerianId };
  } else if (user.role === "BENDAHARA") {
    eventWhere = { bendaharaAssignment: { some: { adminUserId: user.userId } } };
  }

  const [activeEvents, totalRegistrations, pendingPayments, recentRegistrations] = await Promise.all([
    prisma.event.count({ where: { ...eventWhere, isActive: true } }),
    prisma.registrasi.count({
      where: user.role === "SDM" || user.role === "MENKEU"
        ? {}
        : { event: eventWhere },
    }),
    prisma.pembayaran.count({
      where: {
        status: { in: ["BELUM_BAYAR", "BELUM_DIVERIFIKASI"] },
        ...(user.role === "SDM" || user.role === "MENKEU"
          ? {}
          : { registrasi: { event: eventWhere } }),
      },
    }),
    prisma.registrasi.findMany({
      where: user.role === "SDM" || user.role === "MENKEU"
        ? {}
        : { event: eventWhere },
      include: {
        member: { select: { nama: true, noWa: true } },
        event: { select: { nama: true, slug: true } },
        pembayaran: { select: { status: true, jumlahTagihan: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const verifiedPayments = await prisma.pembayaran.count({
    where: {
      status: "TERVERIFIKASI",
      ...(user.role === "SDM" || user.role === "MENKEU"
        ? {}
        : { registrasi: { event: eventWhere } }),
    },
  });

  return (
    <>
      <style>{`
        .dashboard-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 32px;
        }
        .dashboard-recent {
          margin-top: 8px;
        }
        .recent-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 0;
          border-bottom: 1px solid var(--admin-border);
        }
        .recent-item:last-child {
          border-bottom: none;
        }
        .recent-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .recent-name {
          font-weight: 500;
          font-size: 0.9375rem;
        }
        .recent-event {
          font-size: 0.8125rem;
          color: var(--admin-text-muted);
        }
        .recent-time {
          font-size: 0.75rem;
          color: var(--admin-text-muted);
          font-family: var(--font-mono);
        }
        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        @media (max-width: 768px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="admin-page-header">
        <h1 className="admin-page-title">Dashboard</h1>
        <p className="admin-page-subtitle">
          Selamat datang, {user.nama}
        </p>
      </div>

      <div className="dashboard-stats stagger-children">
        {memberCount !== null && (
          <div className="stat-card">
            <div className="stat-label">Total Member</div>
            <div className="stat-value">{memberCount}</div>
          </div>
        )}
        <div className="stat-card">
          <div className="stat-label">Event Aktif</div>
          <div className="stat-value">{activeEvents}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Registrasi</div>
          <div className="stat-value">{totalRegistrations}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pembayaran Pending</div>
          <div className="stat-value" style={{ color: pendingPayments > 0 ? "var(--admin-warning)" : undefined }}>
            {pendingPayments}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Terverifikasi</div>
          <div className="stat-value" style={{ color: "var(--admin-success)" }}>
            {verifiedPayments}
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Registrasi Terbaru</h2>
          </div>
          <div className="dashboard-recent">
            {recentRegistrations.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-text">Belum ada registrasi</div>
              </div>
            ) : (
              recentRegistrations.map((reg) => (
                <div key={reg.id} className="recent-item animate-fade-in">
                  <div className="recent-info">
                    <span className="recent-name">{reg.member.nama}</span>
                    <span className="recent-event">{reg.event.nama}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    {reg.pembayaran && (
                      <span className={`badge ${
                        reg.pembayaran.status === "TERVERIFIKASI"
                          ? "badge-success"
                          : reg.pembayaran.status === "BELUM_DIVERIFIKASI"
                          ? "badge-warning"
                          : "badge-danger"
                      }`}>
                        {reg.pembayaran.status === "TERVERIFIKASI"
                          ? "✓ Verified"
                          : reg.pembayaran.status === "BELUM_DIVERIFIKASI"
                          ? "Pending"
                          : "Belum Bayar"}
                      </span>
                    )}
                    <span className="recent-time">
                      {new Date(reg.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Aksi Cepat</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {["SDM", "KEMENTERIAN"].includes(user.role) && (
              <Link href="/admin/event" className="btn btn-secondary" style={{ justifyContent: "flex-start" }}>
                📅 Kelola Event
              </Link>
            )}
            {["SDM", "MENKEU", "BENDAHARA"].includes(user.role) && (
              <Link href="/admin/pembayaran" className="btn btn-secondary" style={{ justifyContent: "flex-start" }}>
                💰 Verifikasi Pembayaran
              </Link>
            )}
            {user.role === "SDM" && (
              <>
                <Link href="/admin/member" className="btn btn-secondary" style={{ justifyContent: "flex-start" }}>
                  👥 Kelola Member
                </Link>
                <Link href="/admin/kementerian" className="btn btn-secondary" style={{ justifyContent: "flex-start" }}>
                  🏛️ Kelola Kementerian
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
