import { useState, useEffect, useRef, useCallback } from "react";
import { FaBell } from "react-icons/fa";
import { Badge } from "@/components/ui/badge";
import type { NotificationItem } from "@/types";

// ── helpers ──────────────────────────────────────────────────
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1)  return "ahora";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d}d`;
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

function Avatar({ url, name }: { url: string | null; name: string }) {
  const initial = name.charAt(0).toUpperCase();
  return url ? (
    <img src={url} alt={name} style={{
      width: 28, height: 28, borderRadius: "50%", objectFit: "cover", flexShrink: 0,
    }} />
  ) : (
    <div style={{
      width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
      background: "rgba(58,125,94,0.15)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 11, fontWeight: 590, color: "#52b788",
      fontFeatureSettings: "'cv01','ss03'",
    }}>
      {initial}
    </div>
  );
}

// ── main component ────────────────────────────────────────────
export default function NotificationBell() {
  const [open,        setOpen]        = useState(false);
  const [items,       setItems]       = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loaded,      setLoaded]      = useState(false);
  const [loading,     setLoading]     = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch on mount to get unread count for badge
  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.ok ? r.json() : null)
      .then((d: { items: NotificationItem[]; unreadCount: number } | null) => {
        if (!d) return;
        setItems(d.items);
        setUnreadCount(d.unreadCount);
        setLoaded(true);
      })
      .catch(() => {/* swallow — not authenticated */});
  }, []);

  // Re-fetch when dropdown opens (if already loaded, just refresh)
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/notifications")
      .then((r) => r.ok ? r.json() : null)
      .then((d: { items: NotificationItem[]; unreadCount: number } | null) => {
        if (!d) return;
        setItems(d.items);
        setUnreadCount(d.unreadCount);
        setLoaded(true);
      })
      .finally(() => setLoading(false));
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onPointer(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  const markOne = useCallback(async (id: string) => {
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    setUnreadCount((c) => Math.max(0, c - 1));
    await fetch("/api/notifications/read", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }, []);

  const markAll = useCallback(async () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    await fetch("/api/notifications/read", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
  }, []);

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((o) => !o)}
        title="Notificaciones"
        className="relative w-7 h-7 rounded-card flex items-center justify-center transition-colors"
        style={{
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border-subtle)",
          color: "var(--color-text-muted)",
        }}
      >
        <FaBell size={14} />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-2 -right-2 h-4 min-w-4 bg-red-600 px-1 text-white tabular-nums dark:bg-red-400"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0,
          width: 320,
          background: "var(--color-bg-surface)",
          border: "1px solid var(--color-border-std)",
          borderRadius: 10,
          boxShadow: "0 8px 28px rgba(0,0,0,0.22), 0 2px 6px rgba(0,0,0,0.10)",
          zIndex: 50,
          animation: "dropdown-in 0.12s ease",
          overflow: "hidden",
        }}>

          {/* Header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "11px 14px",
            borderBottom: "1px solid var(--color-border-subtle)",
          }}>
            <span style={{
              fontSize: 12, fontWeight: 590, color: "var(--color-text-primary)",
              fontFeatureSettings: "'cv01','ss03'",
            }}>
              Notificaciones
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAll}
                style={{
                  background: "none", border: "none", cursor: "pointer", padding: 0,
                  fontSize: 11, color: "var(--color-brand)", fontWeight: 510,
                  fontFeatureSettings: "'cv01','ss03'",
                }}
              >
                Marcar todo como leído
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: 380, overflowY: "auto" }}>
            {loading && !loaded ? (
              <div style={{
                padding: "28px 0", textAlign: "center",
                fontSize: 12, color: "var(--color-text-faint)",
              }}>
                Cargando…
              </div>
            ) : items.length === 0 ? (
              <div style={{
                padding: "32px 20px", textAlign: "center",
                fontSize: 12, color: "var(--color-text-faint)",
                fontFeatureSettings: "'cv01','ss03'",
              }}>
                Sin notificaciones
              </div>
            ) : (
              items.map((n) => (
                <NotifRow
                  key={n.id}
                  item={n}
                  onRead={() => {
                    if (!n.read) markOne(n.id);
                    setOpen(false);
                  }}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Notification row ──────────────────────────────────────────
function NotifRow({ item, onRead }: { item: NotificationItem; onRead: () => void }) {
  const plantUrl = item.entity_id ? `/plants/${item.entity_id}` : "/";
  const actorName = item.actor?.name ?? "Alguien";

  return (
    <a
      href={plantUrl}
      onClick={onRead}
      style={{
        display: "flex", alignItems: "flex-start", gap: 10,
        padding: "10px 14px",
        borderBottom: "1px solid var(--color-border-subtle)",
        textDecoration: "none",
        background: item.read ? "transparent" : "rgba(58,125,94,0.05)",
        transition: "background 0.12s",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background =
          item.read ? "var(--color-bg-card-hover)" : "rgba(58,125,94,0.09)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background =
          item.read ? "transparent" : "rgba(58,125,94,0.05)";
      }}
    >
      <Avatar url={item.actor?.avatar_url ?? null} name={actorName} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: 0, fontSize: 12, lineHeight: "1.45",
          color: "var(--color-text-secondary)",
          fontFeatureSettings: "'cv01','ss03'",
        }}>
          <span style={{ fontWeight: 590, color: "var(--color-text-primary)" }}>
            {item.actor ? `@${item.actor.username}` : actorName}
          </span>
          {" publicó una nueva planta"}
          {item.plant && (
            <>: <span style={{ fontWeight: 510, color: "var(--color-text-primary)" }}>
              {item.plant.name}
            </span></>
          )}
        </p>
        <span style={{
          display: "block", marginTop: 3,
          fontSize: 11, color: "var(--color-text-faint)",
        }}>
          {timeAgo(item.created_at)}
        </span>
      </div>

      {/* Unread dot */}
      {!item.read && (
        <div style={{
          width: 7, height: 7, borderRadius: "50%",
          background: "var(--color-brand)", flexShrink: 0, marginTop: 4,
        }} />
      )}
    </a>
  );
}
