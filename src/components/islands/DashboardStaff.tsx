import { useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import type { StaffEntry, DashboardRole } from "@/types";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

interface Props {
  initialStaff: StaffEntry[];
  currentUserId: string;
  lang: Lang;
}

const ROLES = ["super_admin", "editor", "reader"] as const;

function roleLabel(role: DashboardRole, lang: Lang): string {
  return t(`dash.role.${role}` as Parameters<typeof t>[0], lang);
}

const ROLE_STYLE: Record<DashboardRole, { color: string; bg: string }> = {
  super_admin: { color: "#74c69d", bg: "rgba(82,183,136,0.12)" },
  editor:      { color: "#60a5fa", bg: "rgba(96,165,250,0.12)" },
  reader:      { color: "var(--color-text-subtle)", bg: "var(--color-bg-card-elev)" },
};

const fs: React.CSSProperties = {
  background: "var(--color-bg-card-elev)",
  border: "1px solid var(--color-border-std)",
  color: "var(--color-text-primary)",
  fontFeatureSettings: "'cv01','ss03'",
};

export default function DashboardStaff({ initialStaff, currentUserId, lang }: Props) {
  const [staff, setStaff] = useState<StaffEntry[]>(initialStaff);
  const [assigning, setAssigning] = useState(false);
  const [assignUsername, setAssignUsername] = useState("");
  const [assignRole, setAssignRole] = useState<DashboardRole>("reader");
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState("");
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleAssign = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setAssignError("");
    setAssignLoading(true);
    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: assignUsername.trim(), role: assignRole }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) { setAssignError(data.error ?? "Failed"); return; }
      setAssigning(false);
      setAssignUsername("");
      window.location.reload();
    } finally {
      setAssignLoading(false);
    }
  }, [assignUsername, assignRole]);

  const handleRoleChange = useCallback(async (id: string, role: DashboardRole) => {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/staff/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        setStaff((prev) => prev.map((s) => s.id === id ? { ...s, role } : s));
      }
    } finally {
      setLoadingId(null);
    }
  }, []);

  const handleBadgeToggle = useCallback(async (id: string, value: boolean) => {
    setStaff((prev) => prev.map((s) => s.id === id ? { ...s, show_staff_badge: value } : s));
    const res = await fetch(`/api/admin/staff/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ show_staff_badge: value }),
    });
    if (!res.ok) {
      setStaff((prev) => prev.map((s) => s.id === id ? { ...s, show_staff_badge: !value } : s));
    }
  }, []);

  const handleRevoke = useCallback(async (id: string) => {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/staff/${id}`, { method: "DELETE" });
      const data = await res.json() as { error?: string };
      if (!res.ok) { alert(data.error ?? "Failed"); return; }
      setStaff((prev) => prev.filter((s) => s.id !== id));
      setConfirmRevoke(null);
    } finally {
      setLoadingId(null);
    }
  }, []);

  return (
    <div className="space-y-4">
      {/* Staff table */}
      <div className="rounded-card overflow-hidden" style={{ border: "1px solid var(--color-border-std)" }}>
        {staff.length === 0 ? (
          <p className="text-sm text-center py-10" style={{ fontWeight: 510, color: "var(--color-text-faint)" }}>
            {t("dash.staff.empty", lang)}
          </p>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border-subtle)", background: "var(--color-bg-card-elev)" }}>
                <th className="px-4 py-3 text-left text-sm"   style={{ fontWeight: 510, color: "var(--color-text-faint)" }}>{t("dash.staff.username", lang)}</th>
                <th className="px-4 py-3 text-center text-sm" style={{ fontWeight: 510, color: "var(--color-text-faint)" }}>{t("dash.staff.role", lang)}</th>
                <th className="px-4 py-3 text-center text-sm" style={{ fontWeight: 510, color: "var(--color-text-faint)" }}>{t("dash.staff.badge", lang)}</th>
                <th className="px-4 py-3 text-left text-sm"   style={{ fontWeight: 510, color: "var(--color-text-faint)" }}>{t("dash.staff.since", lang)}</th>
                <th className="px-4 py-3 text-sm"             style={{ fontWeight: 510, color: "var(--color-text-faint)" }}></th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => {
                const rs = ROLE_STYLE[s.role] ?? ROLE_STYLE.reader;
                const isSelf = s.id === currentUserId;
                const isLoading = loadingId === s.id;

                return (
                  <tr key={s.id} style={{ borderBottom: "1px solid var(--color-border-subtle)" }} className="transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="text-[15px]" style={{ fontWeight: 510, color: "var(--color-text-primary)", fontFeatureSettings: "'cv01','ss03'" }}>
                        @{s.username}
                      </p>
                      <p className="text-sm mt-0.5" style={{ color: "var(--color-text-faint)" }}>{s.email}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <RoleSelect
                        value={s.role}
                        onChange={(role) => handleRoleChange(s.id, role)}
                        disabled={isSelf || isLoading}
                        size="sm"
                        lang={lang}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      {(() => {
                        const isReader = s.role === "reader";
                        return (
                          <button
                            type="button"
                            disabled={isReader}
                            onClick={() => !isReader && handleBadgeToggle(s.id, !s.show_staff_badge)}
                            style={{
                              width: 36, height: 20, borderRadius: 9999,
                              border: "1px solid var(--color-border-subtle)",
                              cursor: isReader ? "not-allowed" : "pointer",
                              position: "relative", display: "inline-flex",
                              transition: "background 0.2s ease",
                              background: (!isReader && s.show_staff_badge) ? "var(--color-brand)" : "var(--color-bg-card-elev)",
                              padding: 0, flexShrink: 0,
                              opacity: isReader ? 0.35 : 1,
                            }}
                          >
                            <div style={{
                              position: "absolute", top: 2,
                              left: (!isReader && s.show_staff_badge) ? 18 : 2,
                              width: 14, height: 14, borderRadius: "50%",
                              background: "white",
                              transition: "left 0.18s ease",
                              boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
                            }} />
                          </button>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm" style={{ color: "var(--color-text-faint)" }}>
                        {new Date(s.created_at).toLocaleDateString(lang === "es" ? "es-ES" : "en-US", { month: "short", year: "numeric" })}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isSelf ? (
                        <span className="inline-flex w-7 h-7 items-center justify-center rounded ml-auto text-xs"
                              style={{ background: "var(--color-bg-card-elev)", color: "var(--color-text-faint)", fontWeight: 510 }}>
                          {t("dash.staff.you", lang)}
                        </span>
                      ) : confirmRevoke === s.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs" style={{ color: "#f87171" }}>{t("dash.staff.revokeQ", lang)}</span>
                          <button onClick={() => handleRevoke(s.id)} disabled={isLoading}
                                  className="px-2 py-1 rounded text-xs"
                                  style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171", fontWeight: 510 }}>
                            {isLoading ? "…" : t("dash.confirm", lang)}
                          </button>
                          <button onClick={() => setConfirmRevoke(null)}
                                  className="text-xs transition-colors" style={{ color: "var(--color-text-faint)" }}>
                            {t("dash.cancel", lang)}
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmRevoke(s.id)}
                                className="w-7 h-7 rounded flex items-center justify-center ml-auto transition-colors"
                                style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.18)", color: "#f87171" }}
                                title={t("dash.staff.revokeTitle", lang)}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                          </svg>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Grant access — below the table */}
      {assigning ? (
        <div className="p-4 rounded-card"
             style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border-std)" }}>
          <p className="text-[15px] mb-4" style={{ fontWeight: 510, color: "var(--color-text-primary)" }}>
            {t("dash.staff.grantTitle", lang)}
          </p>
          {assignError && (
            <p className="text-xs mb-2" style={{ color: "#f87171" }}>{assignError}</p>
          )}
          <form onSubmit={handleAssign} className="flex flex-wrap gap-2 items-end">
            <div>
              <label className="block text-xs mb-1" style={{ fontWeight: 510, color: "var(--color-text-faint)" }}>
                {t("dash.staff.username", lang)}
              </label>
              <input
                type="text" value={assignUsername}
                onChange={(e) => setAssignUsername(e.target.value)}
                required placeholder={lang === "es" ? "usuario o correo" : "username or email"}
                className="px-3 py-2.5 rounded text-[15px] outline-none w-48" style={fs}
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ fontWeight: 510, color: "var(--color-text-faint)" }}>
                {t("dash.staff.role", lang)}
              </label>
              <RoleSelect value={assignRole} onChange={setAssignRole} disabled={false} size="md" lang={lang} />
            </div>
            <button type="submit" disabled={assignLoading} className="px-4 py-2 rounded text-sm text-white"
                    style={{ background: assignLoading ? "rgba(58,125,94,0.6)" : "var(--color-brand)", fontWeight: 510, cursor: assignLoading ? "not-allowed" : "pointer" }}>
              {assignLoading ? t("dash.saving", lang) : t("dash.staff.grantSubmit", lang)}
            </button>
            <button type="button" onClick={() => { setAssigning(false); setAssignError(""); }}
                    className="px-4 py-2 rounded text-sm transition-colors"
                    style={{ fontWeight: 510, color: "var(--color-text-muted)" }}>
              {t("dash.cancel", lang)}
            </button>
          </form>
        </div>
      ) : (
        <div className="flex justify-end">
          <button onClick={() => setAssigning(true)} className="px-4 py-2 rounded text-sm text-white transition-colors"
                  style={{ background: "var(--color-brand)", fontWeight: 510, fontFeatureSettings: "'cv01','ss03'" }}>
            {t("dash.staff.grantBtn", lang)}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Custom role dropdown (portal-based to escape overflow:hidden) ─────────────
function RoleSelect({ value, onChange, disabled, size, lang }: {
  value: DashboardRole;
  onChange: (r: DashboardRole) => void;
  disabled: boolean;
  size: "sm" | "md";
  lang: Lang;
}) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropRef    = useRef<HTMLDivElement>(null);
  const rs = ROLE_STYLE[value] ?? ROLE_STYLE.reader;

  useEffect(() => {
    if (!open) return;
    function handler(e: PointerEvent) {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        dropRef.current?.contains(e.target as Node)
      ) return;
      setOpen(false);
    }
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [open]);

  function handleToggle() {
    if (disabled) return;
    if (!open && triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setRect({ top: r.bottom + 4, left: r.left, width: r.width });
    }
    setOpen((o) => !o);
  }

  const pad   = size === "md" ? "10px 14px" : "6px 10px";
  const fsize = size === "md" ? 14 : 13;
  const csize = size === "md" ? 12 : 10;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
          padding: pad, borderRadius: 5, minWidth: size === "md" ? 88 : 72,
          background: "var(--color-bg-card-elev)",
          border: "1px solid var(--color-border-std)",
          color: rs.color,
          fontSize: fsize, fontWeight: 510,
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
          fontFeatureSettings: "'cv01','ss03'",
          whiteSpace: "nowrap",
        }}
      >
        {roleLabel(value, lang)}
        <svg width={csize} height={csize} viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="2.5" strokeLinecap="round"
             style={{ opacity: 0.6, flexShrink: 0, transition: "transform 0.15s", transform: open ? "rotate(180deg)" : "none" }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && rect && createPortal(
        <div ref={dropRef} style={{
          position: "fixed", top: rect.top, left: rect.left, minWidth: rect.width,
          zIndex: 9999,
          background: "var(--color-bg-surface)",
          border: "1px solid var(--color-border-std)",
          borderRadius: 7, overflow: "hidden",
          boxShadow: "0 8px 24px rgba(0,0,0,0.22), 0 2px 6px rgba(0,0,0,0.12)",
        }}>
          {ROLES.map((r) => {
            const rStyle = ROLE_STYLE[r] ?? ROLE_STYLE.reader;
            const isActive = r === value;
            return (
              <button
                key={r}
                type="button"
                onClick={() => { onChange(r); setOpen(false); }}
                style={{
                  display: "block", width: "100%", textAlign: "left",
                  padding: size === "md" ? "10px 14px" : "8px 12px",
                  fontSize: fsize, fontWeight: 510,
                  background: isActive ? "var(--color-bg-card-elev)" : "transparent",
                  color: rStyle.color,
                  border: "none", cursor: "pointer",
                  fontFeatureSettings: "'cv01','ss03'",
                }}
                onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "var(--color-bg-card-hover)"; }}
                onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                {roleLabel(r, lang)}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </>
  );
}
