"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--admin-bg)",
      color: "var(--admin-text)",
      padding: "24px",
    }}>
      <div style={{ textAlign: "center", maxWidth: "400px" }}>
        <div style={{ fontSize: "3rem", marginBottom: "16px" }}>⚠️</div>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "8px" }}>
          Terjadi Kesalahan
        </h2>
        <p style={{ color: "var(--admin-text-muted)", marginBottom: "24px", fontSize: "0.875rem" }}>
          {error.message || "Terjadi kesalahan yang tidak terduga."}
        </p>
        <button
          onClick={reset}
          style={{
            padding: "10px 20px",
            background: "var(--admin-accent)",
            color: "white",
            border: "none",
            borderRadius: "var(--radius-md)",
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          Coba Lagi
        </button>
      </div>
    </div>
  );
}
