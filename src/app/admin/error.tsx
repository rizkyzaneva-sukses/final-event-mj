"use client";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="admin-page">
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "24px",
      }}>
        <div className="admin-card" style={{ textAlign: "center", maxWidth: "400px" }}>
          <div style={{ fontSize: "3rem", marginBottom: "16px" }}>⚠️</div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "8px", color: "var(--admin-text)" }}>
            Terjadi Kesalahan
          </h2>
          <p style={{ color: "var(--admin-text-muted)", marginBottom: "24px", fontSize: "0.875rem" }}>
            {error.message || "Terjadi kesalahan yang tidak terduga."}
          </p>
          <button
            onClick={reset}
            className="btn btn-primary"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    </div>
  );
}
