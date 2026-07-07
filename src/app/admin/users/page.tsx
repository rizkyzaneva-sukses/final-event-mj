"use client";

import { useState, useEffect, useCallback } from "react";

interface AdminUserItem {
  id: string;
  nama: string;
  email: string;
  role: string;
  kementerianId: string | null;
  kementerian: { nama: string } | null;
  _count: { bendaharaAssignment: number };
  createdAt: string;
}

interface Kementerian {
  id: string;
  nama: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [kementerianList, setKementerianList] = useState<Kementerian[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Form
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("KEMENTERIAN");
  const [kementerianId, setKementerianId] = useState("");

  const fetchData = useCallback(async () => {
    const [usersRes, kemRes] = await Promise.all([
      fetch("/api/admin-user"),
      fetch("/api/kementerian"),
    ]);
    const usersData = await usersRes.json();
    const kemData = await kemRes.json();
    setUsers(usersData.users || []);
    setKementerianList(kemData.kementerian || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const resetForm = () => {
    setShowForm(false);
    setNama("");
    setEmail("");
    setPassword("");
    setRole("KEMENTERIAN");
    setKementerianId("");
    setError("");
  };

  const handleCreate = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama, email, password, role,
          kementerianId: ["KEMENTERIAN", "BENDAHARA"].includes(role) ? kementerianId || null : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      resetForm();
      fetchData();
    } catch { setError("Gagal membuat user"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Hapus admin ini?")) return;
    try {
      const res = await fetch(`/api/admin-user/${userId}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch {
      setError("Gagal menghapus admin");
    }
  };

  const roleColors: Record<string, string> = {
    SDM: "badge-info",
    MENKEU: "badge-warning",
    KEMENTERIAN: "badge-success",
    BENDAHARA: "badge-neutral",
  };

  return (
    <>
      <div className="admin-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="admin-page-title">Admin Users</h1>
          <p className="admin-page-subtitle">Kelola akun admin panel</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Tambah Admin</button>
      </div>

      {showForm && (
        <div className="admin-card animate-fade-in" style={{ marginBottom: "24px", maxWidth: "560px" }}>
          <h3 className="admin-card-title" style={{ marginBottom: "16px" }}>Tambah Admin Baru</h3>
          {error && <div style={{ color: "var(--admin-danger)", fontSize: "0.875rem", marginBottom: "12px" }}>{error}</div>}
          <div className="form-group">
            <label className="input-label">Nama</label>
            <input className="input" value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama lengkap" />
          </div>
          <div className="form-row" style={{ marginBottom: "20px" }}>
            <div>
              <label className="input-label">Email</label>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@mudajuara.id" />
            </div>
            <div>
              <label className="input-label">Password</label>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 karakter" />
            </div>
          </div>
          <div className="form-row" style={{ marginBottom: "20px" }}>
            <div>
              <label className="input-label">Role</label>
              <select className="input select" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="SDM">SDM / Owner</option>
                <option value="MENKEU">Menkeu</option>
                <option value="KEMENTERIAN">Kementerian Admin</option>
                <option value="BENDAHARA">Bendahara Event</option>
              </select>
            </div>
            {["KEMENTERIAN", "BENDAHARA"].includes(role) && (
              <div>
                <label className="input-label">Kementerian</label>
                <select className="input select" value={kementerianId} onChange={(e) => setKementerianId(e.target.value)}>
                  <option value="">— Pilih —</option>
                  {kementerianList.map((k) => (
                    <option key={k.id} value={k.id}>{k.nama}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="btn btn-primary btn-sm" onClick={handleCreate} disabled={saving}>{saving ? "Menyimpan..." : "Buat"}</button>
            <button className="btn btn-ghost btn-sm" onClick={resetForm}>Batal</button>
          </div>
        </div>
      )}

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Nama</th>
              <th>Email</th>
              <th>Role</th>
              <th>Kementerian</th>
              <th>Bendahara</th>
              <th>Dibuat</th>
              <th style={{ width: "80px" }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 6 }).map((_, j) => (
                  <td key={j}><div className="skeleton" style={{ height: "16px", width: "70%" }} /></td>
                ))}</tr>
              ))
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 500 }}>{u.nama}</td>
                  <td style={{ fontSize: "0.8125rem" }}>{u.email}</td>
                  <td><span className={`badge ${roleColors[u.role] || "badge-neutral"}`}>{u.role}</span></td>
                  <td>{u.kementerian?.nama || "—"}</td>
                  <td>{u._count.bendaharaAssignment > 0 ? `${u._count.bendaharaAssignment} event` : "—"}</td>
                  <td style={{ fontSize: "0.8125rem", fontFamily: "var(--font-mono)", color: "var(--admin-text-muted)" }}>
                    {new Date(u.createdAt).toLocaleDateString("id-ID")}
                  </td>
                  <td>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ color: "var(--admin-danger)" }}
                      onClick={() => handleDelete(u.id)}
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
