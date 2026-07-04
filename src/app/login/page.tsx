"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login gagal");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan koneksi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--admin-bg);
          padding: 16px;
        }
        .login-container {
          width: 100%;
          max-width: 420px;
          animation: fadeInScale var(--transition-base) ease-out;
        }
        .login-logo {
          text-align: center;
          margin-bottom: 40px;
        }
        .login-logo-icon {
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, var(--admin-accent), #6366f1);
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          font-size: 1.5rem;
          box-shadow: 0 8px 32px rgba(59, 130, 246, 0.3);
        }
        .login-logo h1 {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--admin-text);
          margin-bottom: 4px;
        }
        .login-logo p {
          color: var(--admin-text-muted);
          font-size: 0.875rem;
        }
        .login-card {
          background: var(--admin-surface);
          border: 1px solid var(--admin-border);
          border-radius: var(--radius-xl);
          padding: 32px;
        }
        .login-error {
          background: var(--admin-danger-bg);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: var(--admin-danger);
          padding: 12px 16px;
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          margin-bottom: 20px;
          animation: fadeIn var(--transition-fast) ease-out;
        }
        .login-form-group {
          margin-bottom: 20px;
        }
        .login-btn {
          width: 100%;
          padding: 14px;
          font-size: 1rem;
          margin-top: 8px;
        }
        .login-footer {
          text-align: center;
          margin-top: 24px;
          font-size: 0.8125rem;
          color: var(--admin-text-muted);
        }
      `}</style>

      <div className="login-container">
        <div className="login-logo">
          <div className="login-logo-icon">⚡</div>
          <h1>Event Muda Juara</h1>
          <p>Admin Panel</p>
        </div>

        <div className="login-card">
          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="login-form-group">
              <label className="input-label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="admin@mudajuara.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="login-form-group">
              <label className="input-label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary login-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  Masuk...
                </>
              ) : (
                "Masuk"
              )}
            </button>
          </form>
        </div>

        <div className="login-footer">
          Event Muda Juara v1.0
        </div>
      </div>
    </div>
  );
}
