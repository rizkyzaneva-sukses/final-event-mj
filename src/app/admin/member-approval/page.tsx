"use client";

import { useState, useEffect, useCallback } from "react";

interface PendingMember {
  id: string;
  nama: string;
  noWa: string;
  domisili: string;
  email: string | null;
  angkatanMj: string | null;
  statusKeanggotaan: string;
  createdAt: string;
  _count: { registrasi: number; tanggungan: number };
}

export default function MemberApprovalPage() {
  const [members, setMembers] = useState<PendingMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchPending = useCallback(async () => {
    const res = await fetch("/api/admin/approve-member");
    const data = await res.json();
    setMembers(data.members || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  const handleAction = async (memberId: string, action: "approve" | "reject") => {
    setProcessing(memberId);
    try {
      await fetch("/api/admin/approve-member", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, action }),
      });
      fetchPending();
    } finally {
      setProcessing(null);
    }
  };

  return (
    <>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Approval Member</h1>
        <p className="admin-page-subtitle">
          {members.length} menunggu persetujuan
        </p>
      </div>

      {loading ? (
        <div className="admin-card">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ padding: "16px 0", borderBottom: "1px solid var(--admin-border)" }}>
              <div className="skeleton" style={{ height: "20px", width: "40%", marginBottom: "8px" }} />
              <div className="skeleton" style={{ height: "14px", width: "60%" }} />
            </div>
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="admin-card">
          <div className="empty-state">
            <div className="empty-state-icon">✅</div>
            <div className="empty-state-title">Tidak ada yang menunggu</div>
            <div className="empty-state-text">Semua member sudah disetujui</div>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {members.map((m) => (
            <div key={m.id} className="admin-card animate-fade-in" style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "1.0625rem", color: "var(--admin-text)", marginBottom: "4px" }}>
                    {m.nama}
                  </div>
                  <div style={{ fontSize: "0.8125rem", color: "var(--admin-text-muted)", fontFamily: "var(--font-mono)", marginBottom: "8px" }}>
                    {m.noWa}
                  </div>
                  <div style={{ display: "flex", gap: "12px", fontSize: "0.8125rem", color: "var(--admin-text-secondary)" }}>
                    {m.domisili && <span>📍 {m.domisili}</span>}
                    {m.email && <span>📧 {m.email}</span>}
                    {m.angkatanMj && <span>🎓 Angkatan {m.angkatanMj}</span>}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--admin-text-muted)", marginTop: "8px" }}>
                    Mendaftar: {new Date(m.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    {m._count.tanggungan > 0 && ` · ${m._count.tanggungan} tanggungan`}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => handleAction(m.id, "approve")}
                    disabled={processing === m.id}
                  >
                    ✓ Setujui
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ color: "var(--admin-danger)" }}
                    onClick={() => handleAction(m.id, "reject")}
                    disabled={processing === m.id}
                  >
                    ✕ Tolak
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
