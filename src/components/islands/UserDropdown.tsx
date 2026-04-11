import { useState, useEffect, useRef, useCallback } from "react";
import { t, type Lang } from "@/lib/i18n";

interface Props {
  username: string;
  name: string;
  avatarUrl: string | null;
  lang: Lang;
  role: string | null;
}

export default function UserDropdown({ username, name, avatarUrl, lang, role }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleClose = useCallback(() => {
    closeTimer.current = setTimeout(() => setOpen(false), 80);
  }, []);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  // Close on outside click (covers mobile tap-outside)
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => { cancelClose(); setOpen(true); }}
        onMouseLeave={scheduleClose}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={username ? `@${username}` : "User menu"}
        className="flex items-center gap-1 p-1 rounded transition-colors"
        style={{
          background: open ? "var(--color-bg-card-elev)" : "transparent",
        }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name || username}
            width={26}
            height={26}
            style={{ borderRadius: "50%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: "50%",
              background: "rgba(58,125,94,0.15)",
              color: "#52b788",
              fontSize: 11,
              fontWeight: 590,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {(name || username).charAt(0).toUpperCase() || "?"}
          </div>
        )}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
             style={{ opacity: 0.45, transition: "transform 0.15s ease", transform: open ? "rotate(180deg)" : "rotate(0deg)", color: "var(--color-text-secondary)" }}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          role="menu"
          className="absolute right-0 top-full mt-1.5 w-44 rounded-panel overflow-hidden"
          style={{
            background: "var(--color-bg-surface)",
            border: "1px solid var(--color-border-std)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.22), 0 2px 6px rgba(0,0,0,0.12)",
            animation: "dropdown-in 0.12s ease",
            zIndex: 100,
          }}
        >
          {username && (
            <a
              href={`/user/${username}`}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 text-xs w-full transition-colors"
              style={{
                color: "var(--color-text-secondary)",
                fontWeight: 510,
                fontFeatureSettings: "'cv01','ss03'",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
              {t("nav.viewProfile", lang)}
            </a>
          )}

          {role && (
            <div style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
              <a
                href="/dashboard"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 text-xs w-full transition-colors"
                style={{
                  color: "var(--color-text-secondary)",
                  fontWeight: 510,
                  fontFeatureSettings: "'cv01','ss03'",
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
                Dashboard
              </a>
            </div>
          )}

          <div style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
            <form method="POST" action="/api/auth/logout">
              <button
                type="submit"
                role="menuitem"
                className="flex items-center gap-2 px-3 py-2.5 text-xs w-full text-left transition-colors"
                style={{
                  color: "var(--color-text-subtle)",
                  fontWeight: 510,
                  fontFeatureSettings: "'cv01','ss03'",
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                {t("nav.signout", lang)}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
