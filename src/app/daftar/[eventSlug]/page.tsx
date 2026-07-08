"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";

interface EventData {
  id: string;
  nama: string;
  slug: string;
  deskripsi: string | null;
  tanggalMulai: string;
  tanggalSelesai: string;
  lokasi: string;
  tipeAudiens: string;
  isBerbayar: boolean;
  kodeProgram: string;
  kementerian: { nama: string; kodeUnik: string };
  hargaTier: { id: string; kategori: string; harga: number; usiaMin: number | null; usiaMax: number | null }[];
  imageUrl: string | null;
}

interface MemberData {
  id: string;
  nama: string;
  noWa: string;
  domisili: string;
  email: string | null;
  angkatanMj: string | null;
  statusKeanggotaan: string;
  tanggungan: { id: string; nama: string; tanggalLahir: string | null; hubungan: string }[];
}

interface BreakdownItem {
  kategori: string;
  jumlah: number;
  hargaSatuan: number;
  subtotal: number;
}

type Step = "wa" | "data" | "peserta" | "ringkasan" | "pembayaran" | "selesai";

export default function RegistrationPage() {
  const params = useParams();
  const eventSlug = params.eventSlug as string;

  const [event, setEvent] = useState<EventData | null>(null);
  const [eventLoading, setEventLoading] = useState(true);
  const [eventError, setEventError] = useState("");

  // Step management
  const [step, setStep] = useState<Step>("wa");

  // WA lookup
  const [noWa, setNoWa] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [memberData, setMemberData] = useState<MemberData | null>(null);
  const [isNewMember, setIsNewMember] = useState(false);

  // Form data
  const [nama, setNama] = useState("");
  const [domisili, setDomisili] = useState("");
  const [email, setEmail] = useState("");
  const [angkatanMj, setAngkatanMj] = useState("");

  // Peserta selection
  const [includeSelf, setIncludeSelf] = useState(true);
  const [selectedTanggungan, setSelectedTanggungan] = useState<string[]>([]);
  const [newTanggungan, setNewTanggungan] = useState<{ nama: string; tanggalLahir: string; hubungan: string }[]>([]);
  const [showAddTanggungan, setShowAddTanggungan] = useState(false);
  const [newTName, setNewTName] = useState("");
  const [newTDob, setNewTDob] = useState("");
  const [newTHubungan, setNewTHubungan] = useState("ANAK");

  // Registration result
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [registrationResult, setRegistrationResult] = useState<{
    registrasi: { id: string; checkinCode: string };
    pembayaran: { id: string; jumlahTagihan: number; kodeUnik: string } | null;
    breakdown: BreakdownItem[];
  } | null>(null);

  // Payment
  const [noReferensi, setNoReferensi] = useState("");
  const [uploadingPayment, setUploadingPayment] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);

  // Accordion state for landing page
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  // Load event data
  useEffect(() => {
    async function loadEvent() {
      try {
        const res = await fetch(`/api/event/by-slug/${eventSlug}`);
        if (!res.ok) {
          setEventError("Event tidak ditemukan atau sudah ditutup");
          setEventLoading(false);
          return;
        }
        const data = await res.json();
        setEvent(data.event);
      } catch {
        setEventError("Gagal memuat data event");
      } finally {
        setEventLoading(false);
      }
    }
    loadEvent();
  }, [eventSlug]);

  // Scroll to top when step changes away from 'wa'
  useEffect(() => {
    if (step !== "wa") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [step]);

  // Toggle accordion
  const toggleAccordion = useCallback((section: string) => {
    setOpenAccordion((prev) => (prev === section ? null : section));
  }, []);

  // Scroll to form section
  const scrollToForm = useCallback(() => {
    const el = document.getElementById("form-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  // WA Lookup
  const handleLookup = async () => {
    if (!noWa.trim()) return;
    setLookupLoading(true);
    try {
      const res = await fetch(`/api/member/lookup?noWa=${encodeURIComponent(noWa)}`);
      const data = await res.json();

      if (data.found && data.member) {
        setMemberData(data.member);
        setNama(data.member.nama);
        setDomisili(data.member.domisili || "");
        setEmail(data.member.email || "");
        setAngkatanMj(data.member.angkatanMj || "");
        setIsNewMember(false);
      } else {
        setMemberData(null);
        setIsNewMember(true);
      }
      setStep("data");
    } catch {
      setSubmitError("Gagal memeriksa data");
    } finally {
      setLookupLoading(false);
    }
  };

  // Add new tanggungan (inline)
  const handleAddTanggungan = () => {
    if (!newTName.trim()) return;
    setNewTanggungan([...newTanggungan, { nama: newTName, tanggalLahir: newTDob, hubungan: newTHubungan }]);
    setNewTName("");
    setNewTDob("");
    setNewTHubungan("ANAK");
    setShowAddTanggungan(false);
  };

  // Submit registration
  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch(`/api/registrasi?eventSlug=${eventSlug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          noWa,
          nama,
          domisili,
          email: email || undefined,
          angkatanMj: angkatanMj || undefined,
          includeSelf,
          tanggunganIds: selectedTanggungan,
          newTanggungan,
          statusOts: false,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || "Pendaftaran gagal");
        return;
      }

      setRegistrationResult(data);
      if (event?.isBerbayar && data.pembayaran) {
        setStep("pembayaran");
      } else {
        setStep("selesai");
      }
    } catch {
      setSubmitError("Terjadi kesalahan koneksi");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit payment proof
  const handlePaymentSubmit = async () => {
    if (!registrationResult?.registrasi) return;
    setUploadingPayment(true);
    try {
      await fetch("/api/pembayaran", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrasiId: registrationResult.registrasi.id,
          noReferensi: noReferensi || undefined,
        }),
      });
      setPaymentDone(true);
      setStep("selesai");
    } catch {
      setSubmitError("Gagal mengirim bukti pembayaran");
    } finally {
      setUploadingPayment(false);
    }
  };

  // Step progress
  const allSteps: Step[] = event?.isBerbayar
    ? ["wa", "data", "peserta", "ringkasan", "pembayaran", "selesai"]
    : ["wa", "data", "peserta", "ringkasan", "selesai"];
  const currentStepIndex = allSteps.indexOf(step);

  // Helper: format date range
  const formatDateRange = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };
    if (s.toDateString() === e.toDateString()) {
      return s.toLocaleDateString("id-ID", { weekday: "long", ...opts });
    }
    return `${s.toLocaleDateString("id-ID", opts)} – ${e.toLocaleDateString("id-ID", opts)}`;
  };

  // Loading state
  if (eventLoading) {
    return (
      <div className="public-page">
        <div className="public-container">
          <div className="public-card" style={{ textAlign: "center", padding: "48px" }}>
            <div className="spinner" style={{ color: "var(--public-accent)", width: "32px", height: "32px", borderWidth: "3px" }} />
            <p style={{ marginTop: "16px", color: "var(--public-text-secondary)" }}>Memuat data event...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (eventError || !event) {
    return (
      <div className="public-page">
        <div className="public-container">
          <div className="public-card" style={{ textAlign: "center", padding: "48px" }}>
            <div style={{ fontSize: "3rem", marginBottom: "16px" }}>😕</div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--public-text)", marginBottom: "8px" }}>
              Event Tidak Ditemukan
            </h2>
            <p style={{ color: "var(--public-text-secondary)" }}>
              {eventError || "Event yang Anda cari tidak tersedia"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Accordion section data
  const accordionSections = [
    {
      id: "deskripsi",
      title: "Deskripsi",
      icon: "📋",
      content: (
        <div style={{ fontSize: "0.9375rem", color: "var(--public-text-secondary)", lineHeight: 1.7 }}>
          {event.deskripsi ? (
            <div style={{ whiteSpace: "pre-line" }}>{event.deskripsi}</div>
          ) : (
            <p style={{ fontStyle: "italic", color: "var(--public-text-muted)" }}>Deskripsi event belum tersedia.</p>
          )}
        </div>
      ),
    },
    {
      id: "jadwal",
      title: "Jadwal & Lokasi",
      icon: "📅",
      content: (
        <div style={{ fontSize: "0.9375rem", color: "var(--public-text-secondary)", lineHeight: 1.8 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "12px" }}>
            <span style={{ fontSize: "1.125rem", flexShrink: 0 }}>🗓️</span>
            <div>
              <div style={{ fontWeight: 500, color: "var(--public-text)", marginBottom: "2px" }}>Tanggal Pelaksanaan</div>
              <div>{formatDateRange(event.tanggalMulai, event.tanggalSelesai)}</div>
            </div>
          </div>
          {event.lokasi && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <span style={{ fontSize: "1.125rem", flexShrink: 0 }}>📍</span>
              <div>
                <div style={{ fontWeight: 500, color: "var(--public-text)", marginBottom: "2px" }}>Lokasi</div>
                <div>{event.lokasi}</div>
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "harga",
      title: "Harga / Tarif",
      icon: "💰",
      content: (
        <div style={{ fontSize: "0.9375rem", color: "var(--public-text-secondary)", lineHeight: 1.8 }}>
          {event.isBerbayar ? (
            <>
              <div style={{ marginBottom: "12px" }}>
                <span style={{
                  display: "inline-block",
                  background: "var(--public-warning-bg)",
                  color: "var(--public-warning)",
                  padding: "4px 12px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                }}>
                  💳 Event Berbayar
                </span>
              </div>
              {event.hargaTier && event.hargaTier.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {event.hargaTier.map((tier) => (
                    <div
                      key={tier.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "12px 16px",
                        background: "var(--public-surface)",
                        borderRadius: "var(--radius-md)",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 500, color: "var(--public-text)" }}>{tier.kategori}</div>
                        {tier.usiaMin != null && tier.usiaMax != null && (
                          <div style={{ fontSize: "0.8125rem", color: "var(--public-text-muted)", marginTop: "2px" }}>
                            Usia {tier.usiaMin}–{tier.usiaMax} tahun
                          </div>
                        )}
                      </div>
                      <div style={{ fontWeight: 700, color: "var(--public-accent)", fontFamily: "var(--font-mono)" }}>
                        Rp {tier.harga.toLocaleString("id-ID")}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: "var(--public-text-muted)" }}>Informasi harga belum tersedia.</p>
              )}
            </>
          ) : (
            <div style={{
              padding: "16px",
              background: "var(--public-success-bg)",
              borderRadius: "var(--radius-md)",
              color: "var(--public-success)",
              fontWeight: 500,
              textAlign: "center",
            }}>
              ✅ Event ini Gratis (Tanpa Biaya)
            </div>
          )}
        </div>
      ),
    },
    {
      id: "informasi",
      title: "Informasi Penting",
      icon: "ℹ️",
      content: (
        <div style={{ fontSize: "0.9375rem", color: "var(--public-text-secondary)", lineHeight: 1.8 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <span>🏷️</span>
              <div>
                <span style={{ color: "var(--public-text-muted)" }}>Kementerian:</span>{" "}
                <span style={{ fontWeight: 500, color: "var(--public-text)" }}>{event.kementerian.nama}</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <span>👥</span>
              <div>
                <span style={{ color: "var(--public-text-muted)" }}>Tipe Peserta:</span>{" "}
                <span style={{ fontWeight: 500, color: "var(--public-text)" }}>{event.tipeAudiens}</span>
              </div>
            </div>
            {event.kodeProgram && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <span>🔑</span>
                <div>
                  <span style={{ color: "var(--public-text-muted)" }}>Kode Program:</span>{" "}
                  <span style={{
                    fontFamily: "var(--font-mono)",
                    fontWeight: 600,
                    color: "var(--public-accent)",
                    background: "var(--public-accent-light)",
                    padding: "2px 8px",
                    borderRadius: "var(--radius-sm)",
                  }}>
                    {event.kodeProgram}
                  </span>
                </div>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <span>📱</span>
              <div style={{ color: "var(--public-text-muted)" }}>
                Pendaftaran dilakukan melalui WhatsApp. Pastikan nomor Anda aktif.
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="public-page">
      {/* ============ LANDING CONTENT (only when step === 'wa') ============ */}
      {step === "wa" && (
        <>
          {/* Hero Banner */}
          <div
            style={{
              position: "relative",
              width: "100%",
              minHeight: "320px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              background: event.imageUrl
                ? "none"
                : "linear-gradient(135deg, var(--public-accent) 0%, #1e40af 50%, #1e3a8a 100%)",
            }}
          >
            {event.imageUrl && (
              <img
                src={event.imageUrl}
                alt={event.nama}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            )}
            {/* Overlay gradient for text readability */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: event.imageUrl
                  ? "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.65) 100%)"
                  : "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.15) 100%)",
              }}
            />
            {/* Banner Content */}
            <div
              style={{
                position: "relative",
                zIndex: 1,
                textAlign: "center",
                padding: "64px 24px 48px",
                maxWidth: "640px",
                width: "100%",
              }}
            >
              {/* Kementerian badge */}
              <div
                style={{
                  display: "inline-block",
                  background: "rgba(255,255,255,0.18)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.25)",
                  padding: "6px 16px",
                  borderRadius: "50px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "#fff",
                  marginBottom: "16px",
                }}
              >
                {event.kementerian.nama} · Muda Juara
              </div>
              {/* Event Name */}
              <h1
                style={{
                  fontSize: "clamp(1.5rem, 5vw, 2.25rem)",
                  fontWeight: 800,
                  color: "#fff",
                  lineHeight: 1.2,
                  marginBottom: "16px",
                  textShadow: event.imageUrl ? "0 2px 12px rgba(0,0,0,0.3)" : "none",
                }}
              >
                {event.nama}
              </h1>
              {/* Meta info */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  gap: "8px 20px",
                  fontSize: "0.875rem",
                  color: "rgba(255,255,255,0.9)",
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  📅 {formatDateRange(event.tanggalMulai, event.tanggalSelesai)}
                </span>
                {event.lokasi && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    📍 {event.lokasi}
                  </span>
                )}
              </div>
            </div>
            {/* Bottom fade for smooth transition */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "48px",
                background: "var(--public-bg)",
                borderRadius: "24px 24px 0 0",
              }}
            />
          </div>

          {/* Accordion Sections */}
          <div style={{ maxWidth: "640px", margin: "0 auto", padding: "0 16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
              {accordionSections.map((section) => {
                const isOpen = openAccordion === section.id;
                return (
                  <div
                    key={section.id}
                    style={{
                      background: "var(--public-bg)",
                      border: "1px solid var(--public-border)",
                      borderRadius: "var(--radius-lg)",
                      overflow: "hidden",
                      transition: "all 0.2s ease",
                      boxShadow: isOpen ? "var(--shadow-md)" : "var(--shadow-sm)",
                    }}
                  >
                    {/* Accordion Header */}
                    <button
                      onClick={() => toggleAccordion(section.id)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "16px 20px",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        textAlign: "left",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ fontSize: "1.25rem" }}>{section.icon}</span>
                        <span style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--public-text)" }}>
                          {section.title}
                        </span>
                      </div>
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        style={{
                          transition: "transform 0.2s ease",
                          transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                          color: "var(--public-text-muted)",
                          flexShrink: 0,
                        }}
                      >
                        <path
                          d="M5 7.5L10 12.5L15 7.5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    {/* Accordion Content */}
                    <div
                      style={{
                        maxHeight: isOpen ? "600px" : "0",
                        opacity: isOpen ? 1 : 0,
                        overflow: "hidden",
                        transition: "max-height 0.3s ease, opacity 0.2s ease",
                        padding: isOpen ? "0 20px 20px" : "0 20px",
                      }}
                    >
                      {section.content}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CTA Button */}
            <div style={{ padding: "0 0 32px" }}>
              <button
                className="btn-public-primary"
                onClick={scrollToForm}
                style={{
                  width: "100%",
                  padding: "16px 24px",
                  fontSize: "1.0625rem",
                  fontWeight: 700,
                  borderRadius: "var(--radius-lg)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  boxShadow: "0 4px 20px rgba(37, 99, 235, 0.35)",
                }}
              >
                Daftar Sekarang
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 4V16M10 16L5 11M10 16L15 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <p style={{ textAlign: "center", fontSize: "0.8125rem", color: "var(--public-text-muted)", marginTop: "12px" }}>
                {event.isBerbayar ? "Pembayaran dilakukan setelah pendaftaran" : "Pendaftaran gratis — tidak dipungut biaya"}
              </p>
            </div>
          </div>
        </>
      )}

      {/* ============ FORM SECTION ============ */}
      <div
        className="public-container"
        id="form-section"
        style={step === "wa" ? { paddingTop: "0" } : { paddingTop: "24px" }}
      >
        {/* Header (shown when not in 'wa' step) */}
        {step !== "wa" && (
          <div className="public-header">
            <div style={{ fontSize: "0.8125rem", color: "var(--public-accent)", fontWeight: 600, marginBottom: "8px", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              {event.kementerian.nama} · Muda Juara
            </div>
            <h1 className="public-event-name">{event.nama}</h1>
            <div className="public-event-meta">
              📅 {new Date(event.tanggalMulai).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              {event.lokasi && <> · 📍 {event.lokasi}</>}
            </div>
          </div>
        )}

        {/* Step Indicator */}
        {step !== "selesai" && (
          <div className="public-step-indicator">
            {allSteps.filter((s) => s !== "selesai").map((s, i) => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {i > 0 && <div className={`public-step-line ${i <= currentStepIndex ? "completed" : ""}`} />}
                <div className={`public-step-dot ${s === step ? "active" : i < currentStepIndex ? "completed" : ""}`} />
              </div>
            ))}
          </div>
        )}

        <div className="public-card animate-fade-in" key={step}>
          {/* Step 1: No. WA */}
          {step === "wa" && (
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "8px", color: "var(--public-text)" }}>
                Masukkan No. WhatsApp
              </h2>
              <p style={{ fontSize: "0.875rem", color: "var(--public-text-secondary)", marginBottom: "24px" }}>
                Kami akan cek apakah Anda sudah terdaftar sebelumnya
              </p>

              <div className="form-group">
                <label className="input-public-label" htmlFor="noWa">No. WhatsApp</label>
                <input
                  id="noWa"
                  type="tel"
                  className="input-public"
                  placeholder="08xx xxxx xxxx"
                  value={noWa}
                  onChange={(e) => setNoWa(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                  autoFocus
                />
              </div>

              <button
                className="btn-public-primary"
                style={{ width: "100%" }}
                onClick={handleLookup}
                disabled={lookupLoading || !noWa.trim()}
              >
                {lookupLoading ? (
                  <><span className="spinner" style={{ width: "16px", height: "16px", borderWidth: "2px" }} /> Memeriksa...</>
                ) : "Lanjut →"}
              </button>
            </div>
          )}

          {/* Step 2: Data Diri */}
          {step === "data" && (
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "8px", color: "var(--public-text)" }}>
                {isNewMember ? "Lengkapi Data Diri" : "Konfirmasi Data Anda"}
              </h2>
              {!isNewMember && (
                <div style={{ background: "var(--public-accent-light)", padding: "12px 16px", borderRadius: "var(--radius-md)", marginBottom: "20px", fontSize: "0.875rem", color: "var(--public-accent)" }}>
                  ✅ Data ditemukan! Silakan periksa dan perbarui jika perlu.
                </div>
              )}

              <div className="form-group">
                <label className="input-public-label" htmlFor="nama">Nama Lengkap *</label>
                <input id="nama" className="input-public" placeholder="Nama lengkap Anda" value={nama} onChange={(e) => setNama(e.target.value)} />
              </div>

              <div className="form-row" style={{ marginBottom: "20px" }}>
                <div>
                  <label className="input-public-label" htmlFor="domisili">Domisili</label>
                  <input id="domisili" className="input-public" placeholder="Kota/Kabupaten" value={domisili} onChange={(e) => setDomisili(e.target.value)} />
                </div>
                <div>
                  <label className="input-public-label" htmlFor="email">Email</label>
                  <input id="email" type="email" className="input-public" placeholder="email@contoh.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label className="input-public-label" htmlFor="angkatan">Angkatan MJ (opsional)</label>
                <input id="angkatan" className="input-public" placeholder="Contoh: 1, 2, 3..." value={angkatanMj} onChange={(e) => setAngkatanMj(e.target.value)} />
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <button className="btn-public-primary" style={{ flex: 1, background: "var(--public-surface)", color: "var(--public-text)", border: "2px solid var(--public-border)" }} onClick={() => setStep("wa")}>
                  ← Kembali
                </button>
                <button className="btn-public-primary" style={{ flex: 2 }} onClick={() => setStep("peserta")} disabled={!nama.trim()}>
                  Lanjut →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Peserta */}
          {step === "peserta" && (
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "8px", color: "var(--public-text)" }}>
                Siapa Saja yang Ikut?
              </h2>
              <p style={{ fontSize: "0.875rem", color: "var(--public-text-secondary)", marginBottom: "20px" }}>
                Centang peserta yang akan hadir
              </p>

              {/* Self */}
              <div className={`checkbox-container ${includeSelf ? "checked" : ""}`} onClick={() => setIncludeSelf(!includeSelf)} style={{ marginBottom: "8px" }}>
                <input type="checkbox" className="checkbox-input" checked={includeSelf} readOnly />
                <div className="checkbox-label">
                  <span className="checkbox-name">{nama} (Anda)</span>
                  <span className="checkbox-detail">Pendaftar utama</span>
                </div>
              </div>

              {/* Existing tanggungan */}
              {memberData?.tanggungan.map((t) => {
                const checked = selectedTanggungan.includes(t.id);
                const hubLabel: Record<string, string> = { PASANGAN: "Pasangan", ANAK: "Anak", LAINNYA: "Lainnya" };
                return (
                  <div
                    key={t.id}
                    className={`checkbox-container ${checked ? "checked" : ""}`}
                    onClick={() => setSelectedTanggungan(checked ? selectedTanggungan.filter((x) => x !== t.id) : [...selectedTanggungan, t.id])}
                    style={{ marginBottom: "8px" }}
                  >
                    <input type="checkbox" className="checkbox-input" checked={checked} readOnly />
                    <div className="checkbox-label">
                      <span className="checkbox-name">{t.nama}</span>
                      <span className="checkbox-detail">
                        {hubLabel[t.hubungan] || t.hubungan}
                        {t.tanggalLahir && ` · ${new Date(t.tanggalLahir).toLocaleDateString("id-ID")}`}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* New tanggungan added */}
              {newTanggungan.map((t, i) => (
                <div key={i} className="checkbox-container checked" style={{ marginBottom: "8px" }}>
                  <input type="checkbox" className="checkbox-input" checked readOnly />
                  <div className="checkbox-label">
                    <span className="checkbox-name">{t.nama} (baru)</span>
                    <span className="checkbox-detail">{t.hubungan === "PASANGAN" ? "Pasangan" : t.hubungan === "ANAK" ? "Anak" : "Lainnya"}</span>
                  </div>
                </div>
              ))}

              {/* Add tanggungan form */}
              {showAddTanggungan ? (
                <div style={{ background: "var(--public-surface)", padding: "16px", borderRadius: "var(--radius-md)", marginBottom: "16px", marginTop: "12px" }}>
                  <div className="form-group" style={{ marginBottom: "12px" }}>
                    <label className="input-public-label" style={{ fontSize: "0.8125rem" }}>Nama</label>
                    <input className="input-public" style={{ padding: "10px 14px", fontSize: "0.875rem" }} value={newTName} onChange={(e) => setNewTName(e.target.value)} placeholder="Nama tanggungan" />
                  </div>
                  <div className="form-row" style={{ marginBottom: "12px" }}>
                    <div>
                      <label className="input-public-label" style={{ fontSize: "0.8125rem" }}>Tanggal Lahir</label>
                      <input type="date" className="input-public" style={{ padding: "10px 14px", fontSize: "0.875rem" }} value={newTDob} onChange={(e) => setNewTDob(e.target.value)} />
                    </div>
                    <div>
                      <label className="input-public-label" style={{ fontSize: "0.8125rem" }}>Hubungan</label>
                      <select className="input-public select" style={{ padding: "10px 14px", fontSize: "0.875rem" }} value={newTHubungan} onChange={(e) => setNewTHubungan(e.target.value)}>
                        <option value="ANAK">Anak</option>
                        <option value="PASANGAN">Pasangan</option>
                        <option value="LAINNYA">Lainnya</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button className="btn-public-primary" style={{ padding: "8px 16px", fontSize: "0.875rem" }} onClick={handleAddTanggungan} disabled={!newTName.trim()}>Tambah</button>
                    <button className="btn-public-primary" style={{ padding: "8px 16px", fontSize: "0.875rem", background: "transparent", color: "var(--public-text-secondary)", border: "1px solid var(--public-border)" }} onClick={() => setShowAddTanggungan(false)}>Batal</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowAddTanggungan(true)} style={{ width: "100%", padding: "12px", border: "2px dashed var(--public-border)", borderRadius: "var(--radius-md)", background: "transparent", color: "var(--public-accent)", fontSize: "0.875rem", fontWeight: 500, cursor: "pointer", marginTop: "8px", marginBottom: "20px", fontFamily: "inherit" }}>
                  + Tambah Tanggungan Baru
                </button>
              )}

              <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
                <button className="btn-public-primary" style={{ flex: 1, background: "var(--public-surface)", color: "var(--public-text)", border: "2px solid var(--public-border)" }} onClick={() => setStep("data")}>
                  ← Kembali
                </button>
                <button className="btn-public-primary" style={{ flex: 2 }} onClick={() => setStep("ringkasan")} disabled={!includeSelf && selectedTanggungan.length === 0 && newTanggungan.length === 0}>
                  Lanjut →
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Ringkasan */}
          {step === "ringkasan" && (
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "20px", color: "var(--public-text)" }}>
                Ringkasan Pendaftaran
              </h2>

              <div style={{ marginBottom: "20px" }}>
                <div style={{ fontSize: "0.8125rem", color: "var(--public-text-secondary)", marginBottom: "4px" }}>Pendaftar</div>
                <div style={{ fontWeight: 500 }}>{nama}</div>
                <div style={{ fontSize: "0.875rem", color: "var(--public-text-secondary)" }}>{noWa}</div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <div style={{ fontSize: "0.8125rem", color: "var(--public-text-secondary)", marginBottom: "8px" }}>Peserta ({(includeSelf ? 1 : 0) + selectedTanggungan.length + newTanggungan.length} orang)</div>
                {includeSelf && <div style={{ fontSize: "0.875rem", padding: "4px 0" }}>• {nama}</div>}
                {memberData?.tanggungan.filter((t) => selectedTanggungan.includes(t.id)).map((t) => (
                  <div key={t.id} style={{ fontSize: "0.875rem", padding: "4px 0" }}>• {t.nama}</div>
                ))}
                {newTanggungan.map((t, i) => (
                  <div key={i} style={{ fontSize: "0.875rem", padding: "4px 0" }}>• {t.nama} (baru)</div>
                ))}
              </div>

              {submitError && (
                <div style={{ background: "var(--public-danger-bg)", padding: "12px 16px", borderRadius: "var(--radius-md)", marginBottom: "16px", fontSize: "0.875rem", color: "var(--public-danger)" }}>
                  ⚠️ {submitError}
                </div>
              )}

              <div style={{ display: "flex", gap: "12px" }}>
                <button className="btn-public-primary" style={{ flex: 1, background: "var(--public-surface)", color: "var(--public-text)", border: "2px solid var(--public-border)" }} onClick={() => setStep("peserta")}>
                  ← Kembali
                </button>
                <button className="btn-public-primary" style={{ flex: 2 }} onClick={handleSubmit} disabled={submitting}>
                  {submitting ? (
                    <><span className="spinner" style={{ width: "16px", height: "16px", borderWidth: "2px" }} /> Mendaftar...</>
                  ) : "Daftar Sekarang ✓"}
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Pembayaran */}
          {step === "pembayaran" && registrationResult?.pembayaran && (
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "8px", color: "var(--public-text)" }}>
                Instruksi Pembayaran
              </h2>
              <p style={{ fontSize: "0.875rem", color: "var(--public-text-secondary)", marginBottom: "24px" }}>
                Transfer ke rekening berikut dengan nominal tepat
              </p>

              {/* Kode Unik */}
              <div style={{ textAlign: "center", marginBottom: "24px" }}>
                <div style={{ fontSize: "0.8125rem", color: "var(--public-text-secondary)", marginBottom: "8px" }}>Kode Unik</div>
                <div className="kode-unik-display" style={{ display: "inline-flex", justifyContent: "center" }}>
                  {registrationResult.pembayaran.kodeUnik}
                </div>
              </div>

              {/* Breakdown */}
              {registrationResult.breakdown.length > 0 && (
                <table className="breakdown-table">
                  <tbody>
                    {registrationResult.breakdown.map((b, i) => (
                      <tr key={i}>
                        <td>{b.kategori} × {b.jumlah}</td>
                        <td className="text-right">Rp {b.subtotal.toLocaleString("id-ID")}</td>
                      </tr>
                    ))}
                    <tr>
                      <td>Total</td>
                      <td className="text-right" style={{ color: "var(--public-accent)" }}>
                        Rp {registrationResult.pembayaran.jumlahTagihan.toLocaleString("id-ID")}
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}

              {/* Payment input */}
              <div style={{ marginTop: "24px", padding: "20px", background: "var(--public-surface)", borderRadius: "var(--radius-md)" }}>
                <div className="form-group">
                  <label className="input-public-label">No. Referensi / RRN (opsional)</label>
                  <input className="input-public" placeholder="Masukkan nomor referensi transfer" value={noReferensi} onChange={(e) => setNoReferensi(e.target.value)} />
                  <p style={{ fontSize: "0.75rem", color: "var(--public-text-muted)", marginTop: "6px" }}>
                    Dapat dilihat di riwayat transfer m-Banking Anda
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                <button className="btn-public-primary" style={{ flex: 1, background: "var(--public-surface)", color: "var(--public-text)", border: "2px solid var(--public-border)" }} onClick={() => setStep("selesai")}>
                  Nanti Saja
                </button>
                <button className="btn-public-primary" style={{ flex: 2 }} onClick={handlePaymentSubmit} disabled={uploadingPayment}>
                  {uploadingPayment ? "Mengirim..." : "Kirim ✓"}
                </button>
              </div>
            </div>
          )}

          {/* Step 6: Selesai */}
          {step === "selesai" && (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div style={{ width: "72px", height: "72px", background: "var(--public-success-bg)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: "2rem" }}>
                ✅
              </div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--public-text)", marginBottom: "8px" }}>
                Pendaftaran Berhasil!
              </h2>
              <p style={{ fontSize: "0.9375rem", color: "var(--public-text-secondary)", marginBottom: "24px", maxWidth: "360px", margin: "0 auto 24px" }}>
                {event.isBerbayar && !paymentDone
                  ? "Jangan lupa transfer pembayaran sesuai instruksi di atas ya!"
                  : event.isBerbayar && paymentDone
                  ? "Bukti pembayaran Anda sedang diverifikasi oleh bendahara."
                  : "Anda telah terdaftar untuk event ini. Sampai jumpa!"}
              </p>

              {event.isBerbayar && registrationResult?.pembayaran && (
                <div style={{ background: "var(--public-surface)", padding: "16px", borderRadius: "var(--radius-md)", marginBottom: "20px", textAlign: "left" }}>
                  <div style={{ fontSize: "0.8125rem", color: "var(--public-text-secondary)", marginBottom: "6px" }}>Total Tagihan</div>
                  <div className="font-mono" style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--public-accent)" }}>
                    Rp {registrationResult.pembayaran.jumlahTagihan.toLocaleString("id-ID")}
                  </div>
                  <div style={{ fontSize: "0.8125rem", color: "var(--public-text-muted)", marginTop: "4px" }}>
                    Kode: <span className="font-mono" style={{ fontWeight: 600 }}>{registrationResult.pembayaran.kodeUnik}</span>
                  </div>
                </div>
              )}

              {registrationResult?.registrasi?.checkinCode && (
                <div style={{ background: "var(--public-accent-light)", border: "2px dashed var(--public-accent)", padding: "16px", borderRadius: "var(--radius-md)", marginBottom: "20px", textAlign: "center" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--public-accent)", fontWeight: 600, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Kode Check-In Hari H
                  </div>
                  <div className="font-mono" style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--public-accent)", letterSpacing: "0.1em" }}>
                    {registrationResult.registrasi.checkinCode.slice(0, 8)}
                  </div>
                  <p style={{ fontSize: "0.75rem", color: "var(--public-text-muted)", marginTop: "8px" }}>
                    Tunjukkan kode ini ke panitia saat hari pelaksanaan
                  </p>
                </div>
              )}

              <div style={{ fontSize: "0.8125rem", color: "var(--public-text-muted)" }}>
                Event Muda Juara
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
