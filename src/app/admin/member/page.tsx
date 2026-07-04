"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Member {
  id: string;
  nama: string;
  noWa: string;
  domisili: string;
  email: string | null;
  angkatanMj: string | null;
  statusKeanggotaan: string;
  tanggungan: { id: string; nama: string }[];
  _count: { registrasi: number };
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function MemberPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/member?search=${encodeURIComponent(search)}&page=${page}&limit=20`);
      const data = await res.json();
      setMembers(data.members || []);
      setPagination(data.pagination || null);
    } catch (err) {
      console.error("Fetch members error:", err);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    const timer = setTimeout(() => fetchMembers(), 300);
    return () => clearTimeout(timer);
  }, [fetchMembers]);

  return (
    <>
      <div className="admin-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="admin-page-title">Member</h1>
          <p className="admin-page-subtitle">
            {pagination ? `${pagination.total} total member` : "Memuat..."}
          </p>
        </div>
      </div>

      <div className="admin-card" style={{ marginBottom: "24px" }}>
        <div className="search-bar">
          <span className="search-bar-icon">🔍</span>
          <input
            type="text"
            placeholder="Cari berdasarkan Nama atau No. WA..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Nama</th>
              <th>No. WA</th>
              <th>Domisili</th>
              <th>Status</th>
              <th>Tanggungan</th>
              <th>Event</th>
              <th>Terdaftar</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j}><div className="skeleton" style={{ height: "16px", width: "80%" }} /></td>
                  ))}
                </tr>
              ))
            ) : members.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">
                    <div className="empty-state-title">
                      {search ? "Tidak ada hasil" : "Belum ada member"}
                    </div>
                    <div className="empty-state-text">
                      {search
                        ? `Tidak ditemukan member dengan kata kunci "${search}"`
                        : "Member akan muncul setelah ada pendaftaran event"}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              members.map((m) => (
                <tr key={m.id}>
                  <td>
                    <Link
                      href={`/admin/member/${m.id}`}
                      style={{ color: "var(--admin-accent)", textDecoration: "none", fontWeight: 500 }}
                    >
                      {m.nama}
                    </Link>
                  </td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}>
                    {m.noWa}
                  </td>
                  <td>{m.domisili || "—"}</td>
                  <td>
                    <span className={`badge ${m.statusKeanggotaan === "MEMBER" ? "badge-info" : "badge-neutral"}`}>
                      {m.statusKeanggotaan}
                    </span>
                  </td>
                  <td>{m.tanggungan.length}</td>
                  <td>{m._count.registrasi}</td>
                  <td style={{ fontSize: "0.8125rem", color: "var(--admin-text-muted)" }}>
                    {new Date(m.createdAt).toLocaleDateString("id-ID")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
          >
            ← Prev
          </button>
          {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
            const p = i + 1;
            return (
              <button
                key={p}
                className={`pagination-btn ${p === page ? "active" : ""}`}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            );
          })}
          <button
            className="pagination-btn"
            onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
            disabled={page >= pagination.totalPages}
          >
            Next →
          </button>
        </div>
      )}
    </>
  );
}
