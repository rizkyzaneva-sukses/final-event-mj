"use client";

export default function DaftarError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="public-page">
      <div className="public-container">
        <div className="public-card" style={{ textAlign: "center", padding: "48px" }}>
          <div style={{ fontSize: "3rem", marginBottom: "16px" }}>⚠️</div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "8px", color: "var(--public-text)" }}>
            Terjadi Kesalahan
          </h2>
          <p style={{ color: "var(--public-text-muted)", marginBottom: "24px", fontSize: "0.875rem" }}>
            {error.message || "Terjadi kesalahan yang tidak terduga."}
          </p>
          <button
            onClick={reset}
            className="btn-public-primary"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    </div>
  );
}
