"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";

export default function CheckinPage() {
  const params = useParams();
  const eventSlug = params.eventSlug as string;

  const [event, setEvent] = useState<{ id: string; nama: string; slug: string } | null>(null);
  const [member, setMember] = useState<{ memberId: string; nama: string; noWa: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [eventRes, meRes] = await Promise.all([
          fetch(`/api/event/by-slug/${eventSlug}`),
          fetch("/api/member-auth/me"),
        ]);
        const eventData = await eventRes.json();
        const meData = await meRes.json();

        if (eventData.event) setEvent(eventData.event);
        if (meData.member) setMember(meData.member);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [eventSlug]);

  const handleCheckin = useCallback(async () => {
    if (!event || !member) return;
    setCheckinLoading(true);
    setResult(null);

    try {
      // Find registrasi for this member + event
      const regRes = await fetch(`/api/event/${event.id}/registrasi`);
      const regData = await regRes.json();
      const myReg = regData.registrations?.find(
        (r: { member: { id: string } }) => r.member.id === member.memberId
      );

      if (!myReg) {
        setResult({ ok: false, message: "Anda belum terdaftar di event ini." });
        return;
      }

      const checkinRes = await fetch(`/api/event/${event.id}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkinCode: myReg.checkinCode }),
      });

      const checkinData = await checkinRes.json();

      if (checkinRes.ok) {
        setResult({ ok: true, message: "Check-in berhasil! Selamat datang." });
      } else if (checkinRes.status === 409) {
        setResult({ ok: false, message: "Anda sudah check-in sebelumnya." });
      } else {
        setResult({ ok: false, message: checkinData.error || "Check-in gagal" });
      }
    } catch {
      setResult({ ok: false, message: "Gagal menghubungi server" });
    } finally {
      setCheckinLoading(false);
    }
  }, [event, member]);

  if (loading) {
    return (
      <div className="public-page">
        <div className="public-container" style={{ maxWidth: "420px" }}>
          <div className="public-card" style={{ textAlign: "center", padding: "48px" }}>
            <div className="spinner" style={{ color: "var(--public-accent)" }} />
            <p style={{ marginTop: "16px", color: "var(--public-text-secondary)" }}>Memuat...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="public-page">
      <div className="public-container" style={{ maxWidth: "420px" }}>
        <div className="public-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "16px" }}>📋</div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--public-text)", marginBottom: "8px" }}>
            Check-In
          </h1>
          <p style={{ color: "var(--public-text-secondary)", fontSize: "0.9375rem", marginBottom: "8px" }}>
            {event?.nama}
          </p>

          {!member ? (
            <div>
              <p style={{ color: "var(--public-text-muted)", marginBottom: "24px" }}>
                Silakan login terlebih dahulu untuk check-in.
              </p>
              <a href="/login/member" className="btn-public-primary" style={{ textDecoration: "none" }}>
                Login Member
              </a>
            </div>
          ) : result ? (
            <div style={{ marginTop: "24px" }}>
              <div style={{
                padding: "24px",
                borderRadius: "var(--radius-lg)",
                background: result.ok ? "var(--public-success-bg)" : "var(--public-danger-bg)",
                marginBottom: "24px",
              }}>
                <div style={{ fontSize: "2rem", marginBottom: "8px" }}>
                  {result.ok ? "✅" : "❌"}
                </div>
                <p style={{
                  fontWeight: 600,
                  color: result.ok ? "var(--public-success)" : "var(--public-danger)",
                }}>
                  {result.message}
                </p>
              </div>
              {result.ok && (
                <p style={{ fontSize: "0.8125rem", color: "var(--public-text-muted)" }}>
                  Selamat datang, {member.nama}! 🎉
                </p>
              )}
            </div>
          ) : (
            <div style={{ marginTop: "24px" }}>
              <p style={{ color: "var(--public-text-secondary)", marginBottom: "8px" }}>
                Login sebagai: <strong>{member.nama}</strong>
              </p>
              <p style={{ color: "var(--public-text-muted)", fontSize: "0.8125rem", marginBottom: "24px" }}>
                Klik tombol di bawah untuk menandai kehadiran Anda
              </p>
              <button
                className="btn-public-primary"
                style={{ width: "100%", padding: "18px", fontSize: "1.125rem" }}
                onClick={handleCheckin}
                disabled={checkinLoading}
              >
                {checkinLoading ? (
                  <><span className="spinner" style={{ width: "20px", height: "20px", borderWidth: "2px" }} /> Memproses...</>
                ) : (
                  "✅ Hadir"
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
