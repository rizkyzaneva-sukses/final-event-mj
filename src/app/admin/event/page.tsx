"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface EventItem {
  id: string;
  nama: string;
  slug: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  lokasi: string;
  tipeAudiens: string;
  isBerbayar: boolean;
  isActive: boolean;
  kementerian: { nama: string; kodeUnik: string };
  _count: { registrasi: number; hargaTier: number };
}

export default function EventPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    const res = await fetch("/api/event");
    const data = await res.json();
    setEvents(data.events || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const audiensLabel: Record<string, string> = {
    MEMBER_ONLY: "Member Only",
    UMUM: "Umum",
    KEDUANYA: "Semua",
  };

  return (
    <>
      <style>{`
        .event-card-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 16px;
        }
        .event-card {
          background: var(--admin-surface);
          border: 1px solid var(--admin-border);
          border-radius: var(--radius-lg);
          padding: 20px;
          transition: all var(--transition-fast);
          text-decoration: none;
          color: inherit;
          display: block;
        }
        .event-card:hover {
          border-color: var(--admin-accent);
          box-shadow: 0 0 20px var(--admin-accent-glow);
          transform: translateY(-2px);
        }
        .event-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .event-card-name {
          font-weight: 600;
          font-size: 1rem;
          color: var(--admin-text);
          margin-bottom: 4px;
        }
        .event-card-kemen {
          font-size: 0.75rem;
          color: var(--admin-text-muted);
        }
        .event-card-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 12px;
        }
        .event-card-stat {
          font-size: 0.8125rem;
          color: var(--admin-text-secondary);
        }
        .event-card-date {
          font-size: 0.8125rem;
          color: var(--admin-text-muted);
          font-family: var(--font-mono);
        }
        .event-link-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid var(--admin-border);
        }
        .event-link-copy {
          font-size: 0.75rem;
          font-family: var(--font-mono);
          color: var(--admin-text-muted);
          background: var(--admin-bg);
          padding: 4px 8px;
          border-radius: var(--radius-sm);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 200px;
        }
      `}</style>

      <div className="admin-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="admin-page-title">Event</h1>
          <p className="admin-page-subtitle">{events.length} event</p>
        </div>
        <Link href="/admin/event/new" className="btn btn-primary">
          + Buat Event
        </Link>
      </div>

      {loading ? (
        <div className="event-card-list">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="event-card">
              <div className="skeleton" style={{ height: "20px", width: "70%", marginBottom: "8px" }} />
              <div className="skeleton" style={{ height: "14px", width: "40%", marginBottom: "16px" }} />
              <div className="skeleton" style={{ height: "14px", width: "90%" }} />
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="admin-card">
          <div className="empty-state">
            <div className="empty-state-icon">📅</div>
            <div className="empty-state-title">Belum ada event</div>
            <div className="empty-state-text">Buat event pertama untuk mulai menerima pendaftaran</div>
          </div>
        </div>
      ) : (
        <div className="event-card-list stagger-children">
          {events.map((ev) => (
            <Link key={ev.id} href={`/admin/event/${ev.id}`} className="event-card">
              <div className="event-card-top">
                <div>
                  <div className="event-card-name">{ev.nama}</div>
                  <div className="event-card-kemen">{ev.kementerian.nama}</div>
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <span className={`badge ${ev.isActive ? "badge-success" : "badge-neutral"}`}>
                    {ev.isActive ? "Aktif" : "Ditutup"}
                  </span>
                  <span className={`badge ${ev.isBerbayar ? "badge-warning" : "badge-info"}`}>
                    {ev.isBerbayar ? "Berbayar" : "Gratis"}
                  </span>
                </div>
              </div>

              <div className="event-card-date">
                📅 {new Date(ev.tanggalMulai).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                {ev.tanggalMulai !== ev.tanggalSelesai && (
                  <> – {new Date(ev.tanggalSelesai).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</>
                )}
              </div>

              {ev.lokasi && (
                <div style={{ fontSize: "0.8125rem", color: "var(--admin-text-muted)", marginTop: "4px" }}>
                  📍 {ev.lokasi}
                </div>
              )}

              <div className="event-card-meta">
                <span className="badge badge-neutral">{audiensLabel[ev.tipeAudiens]}</span>
                <span className="event-card-stat">👥 {ev._count.registrasi} pendaftar</span>
                {ev.isBerbayar && (
                  <span className="event-card-stat">💰 {ev._count.hargaTier} tier</span>
                )}
              </div>

              <div className="event-link-row">
                <span style={{ fontSize: "0.75rem", color: "var(--admin-text-muted)" }}>Link:</span>
                <span className="event-link-copy">/daftar/{ev.slug}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
