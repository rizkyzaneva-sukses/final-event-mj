"use client";

import { useState, useEffect } from "react";
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
    registrasi: { id: string };
    pembayaran: { id: string; jumlahTagihan: number; kodeUnik: string } | null;
    breakdown: BreakdownItem[];
  } | null>(null);

  // Payment
  const [noReferensi, setNoReferensi] = useState("");
  const [uploadingPayment, setUploadingPayment] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);

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

  return (
    <div className="public-page">
      <div className="public-container">
        {/* Header */}
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
