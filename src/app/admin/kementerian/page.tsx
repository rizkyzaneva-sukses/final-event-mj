"use client";

import { useState, useEffect, useCallback } from "react";

interface Kementerian {
  id: string;
  nama: string;
  kodeUnik: string;
  _count: { event: number; adminUser: number };
}

export default function KementerianPage() {
  const [list, setList] = useState<Kementerian[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [nama, setNama] = useState("");
  const [kodeUnik, setKodeUnik] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchList = useCallback(async () => {
    const res = await fetch("/api/kementerian");
    const data = await res.json();
    setList(data.kementerian || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  const resetForm = () => {
    setShowForm(false);
    setEditId(null);
    setNama("");
    setKodeUnik("");
    setError("");
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const url = editId ? `/api/kementerian/${editId}` : "/api/kementerian";
      const method = editId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama, kodeUnik }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      resetForm();
      fetchList();
    } catch { setError("Gagal menyimpan"); }
    finally { setSaving(false); }
  };

  const handleEdit = (k: Kementerian) => {
    setEditId(k.id);
    setNama(k.nama);
    setKodeUnik(k.kodeUnik);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus kementerian ini?")) return;
    await fetch(`/api/kementerian/${id}`, { method: "DELETE" });
    fetchList();
  };

  return (
    <>
      <div className="admin-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="admin-page-title">Kementerian</h1>
          <p className="admin-page-subtitle">Kelola departemen penyelenggara event</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + Tambah
        </button>
      </div>

      {showForm && (
        <div className="admin-card" style={{ marginBottom: "24px" }}>
          <h3 className="admin-card-title" style={{ marginBottom: "16px" }}>
            {editId ? "Edit Kementerian" : "Tambah Kementerian"}
          </h3>
          {error && <div style={{ color: "var(--admin-danger)", fontSize: "0.875rem", marginBottom: "12px" }}>{error}</div>}
          <div className="form-row" style={{ marginBottom: "16px" }}>
            <div>
              <label className="input-label">Nama</label>
              <input className="input" placeholder="Nama kementerian" value={nama} onChange={(e) => setNama(e.target.value)} />
            </div>
            <div>
              <label className="input-label">Kode Unik</label>
              <input className="input font-mono" placeholder="01" value={kodeUnik} onChange={(e) => setKodeUnik(e.target.value)} maxLength={4} />
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={resetForm}>Batal</button>
          </div>
        </div>
      )}

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Kode</th>
              <th>Nama</th>
              <th>Event</th>
              <th>Admin</th>
              <th style={{ width: "120px" }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j}><div className="skeleton" style={{ height: "16px", width: "60%" }} /></td>
                  ))}
                </tr>
              ))
            ) : list.length === 0 ? (
              <tr><td colSpan={5}><div className="empty-state"><div className="empty-state-text">Belum ada kementerian</div></div></td></tr>
            ) : (
              list.map((k) => (
                <tr key={k.id}>
                  <td><span className="font-mono" style={{ fontWeight: 600 }}>{k.kodeUnik}</span></td>
                  <td style={{ fontWeight: 500 }}>{k.nama}</td>
                  <td>{k._count.event}</td>
                  <td>{k._count.adminUser}</td>
                  <td>
                    <div style={{ display: "flex", gap: "4px" }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(k)}>Edit</button>
                      <button className="btn btn-ghost btn-sm" style={{ color: "var(--admin-danger)" }} onClick={() => handleDelete(k.id)}>Hapus</button>
                    </div>
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
