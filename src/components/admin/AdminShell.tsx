"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

interface AdminShellProps {
  user: {
    userId: string;
    role: string;
    kementerianId?: string;
    nama: string;
  };
  children: React.ReactNode;
}

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: "📊",
    roles: ["SDM", "MENKEU", "KEMENTERIAN", "BENDAHARA"],
    exact: true,
  },
  {
    label: "Member",
    href: "/admin/member",
    icon: "👥",
    roles: ["SDM"],
  },
  {
    label: "Approval Member",
    href: "/admin/member-approval",
    icon: "✅",
    roles: ["SDM"],
  },
  {
    label: "Kementerian",
    href: "/admin/kementerian",
    icon: "🏛️",
    roles: ["SDM"],
  },
  {
    label: "Event",
    href: "/admin/event",
    icon: "📅",
    roles: ["SDM", "KEMENTERIAN", "BENDAHARA"],
  },
  {
    label: "Pembayaran",
    href: "/admin/pembayaran",
    icon: "💰",
    roles: ["SDM", "MENKEU", "BENDAHARA"],
  },
  {
    label: "Admin Users",
    href: "/admin/users",
    icon: "🔑",
    roles: ["SDM"],
  },
];

export default function AdminShell({ user, children }: AdminShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const filteredNav = NAV_ITEMS.filter((item) =>
    item.roles.includes(user.role)
  );

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  };

  const roleLabel: Record<string, string> = {
    SDM: "SDM / Owner",
    MENKEU: "Menkeu",
    KEMENTERIAN: "Kementerian",
    BENDAHARA: "Bendahara",
  };

  return (
    <div className="admin-page">
      <style>{`
        .admin-shell {
          display: flex;
          min-height: 100vh;
        }

        /* Sidebar */
        .admin-sidebar {
          width: 260px;
          background: var(--admin-bg-secondary);
          border-right: 1px solid var(--admin-border);
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          z-index: 40;
          transition: transform var(--transition-base);
        }

        .sidebar-brand {
          padding: 20px 24px;
          border-bottom: 1px solid var(--admin-border);
        }

        .sidebar-brand-name {
          font-size: 1.0625rem;
          font-weight: 700;
          color: var(--admin-text);
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .sidebar-brand-icon {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, var(--admin-accent), #6366f1);
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.875rem;
          flex-shrink: 0;
        }

        .sidebar-brand-sub {
          font-size: 0.75rem;
          color: var(--admin-text-muted);
          margin-top: 2px;
          padding-left: 42px;
        }

        .sidebar-nav {
          flex: 1;
          padding: 16px 12px;
          overflow-y: auto;
        }

        .sidebar-nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 16px;
          border-radius: var(--radius-md);
          color: var(--admin-text-secondary);
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all var(--transition-fast);
          margin-bottom: 2px;
        }

        .sidebar-nav-item:hover {
          color: var(--admin-text);
          background: var(--admin-surface-hover);
        }

        .sidebar-nav-item.active {
          color: var(--admin-accent);
          background: var(--admin-accent-glow);
        }

        .sidebar-nav-item .nav-icon {
          font-size: 1.125rem;
          width: 24px;
          text-align: center;
        }

        .sidebar-footer {
          padding: 16px;
          border-top: 1px solid var(--admin-border);
        }

        .sidebar-user {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: var(--radius-md);
          margin-bottom: 8px;
        }

        .sidebar-user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.875rem;
          color: white;
          flex-shrink: 0;
        }

        .sidebar-user-name {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--admin-text);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .sidebar-user-role {
          font-size: 0.75rem;
          color: var(--admin-text-muted);
        }

        .sidebar-logout-btn {
          width: 100%;
          padding: 8px;
          background: transparent;
          border: 1px solid var(--admin-border);
          border-radius: var(--radius-md);
          color: var(--admin-text-secondary);
          font-size: 0.8125rem;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .sidebar-logout-btn:hover {
          background: var(--admin-danger-bg);
          border-color: rgba(239, 68, 68, 0.3);
          color: var(--admin-danger);
        }

        /* Main Content */
        .admin-main {
          flex: 1;
          margin-left: 260px;
          min-height: 100vh;
        }

        .admin-topbar {
          display: none;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: var(--admin-bg-secondary);
          border-bottom: 1px solid var(--admin-border);
          position: sticky;
          top: 0;
          z-index: 30;
        }

        .admin-topbar-menu-btn {
          background: none;
          border: none;
          color: var(--admin-text);
          font-size: 1.25rem;
          cursor: pointer;
          padding: 4px;
        }

        .admin-content {
          padding: 32px;
        }

        .admin-page-header {
          margin-bottom: 28px;
        }

        .admin-page-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--admin-text);
          margin-bottom: 4px;
        }

        .admin-page-subtitle {
          font-size: 0.875rem;
          color: var(--admin-text-muted);
        }

        /* Mobile overlay */
        .sidebar-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 35;
        }

        @media (max-width: 1024px) {
          .admin-sidebar {
            transform: translateX(-100%);
          }
          .admin-sidebar.open {
            transform: translateX(0);
          }
          .sidebar-overlay.open {
            display: block;
          }
          .admin-main {
            margin-left: 0;
          }
          .admin-topbar {
            display: flex;
          }
          .admin-content {
            padding: 20px 16px;
          }
        }
      `}</style>

      <div className="admin-shell">
        {/* Sidebar Overlay (mobile) */}
        <div
          className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* Sidebar */}
        <aside className={`admin-sidebar admin-scroll ${sidebarOpen ? "open" : ""}`}>
          <div className="sidebar-brand">
            <div className="sidebar-brand-name">
              <span className="sidebar-brand-icon">⚡</span>
              Muda Juara
            </div>
            <div className="sidebar-brand-sub">Event Management</div>
          </div>

          <nav className="sidebar-nav">
            {filteredNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-nav-item ${isActive(item.href, item.exact) ? "active" : ""}`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="sidebar-footer">
            <div className="sidebar-user">
              <div className="sidebar-user-avatar">
                {user.nama.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="sidebar-user-name">{user.nama}</div>
                <div className="sidebar-user-role">{roleLabel[user.role] || user.role}</div>
              </div>
            </div>
            <button
              className="sidebar-logout-btn"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut ? "Keluar..." : "Keluar"}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="admin-main">
          <div className="admin-topbar">
            <button
              className="admin-topbar-menu-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle menu"
            >
              ☰
            </button>
            <span style={{ fontSize: "0.875rem", color: "var(--admin-text-secondary)" }}>
              {user.nama}
            </span>
          </div>

          <div className="admin-content animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
