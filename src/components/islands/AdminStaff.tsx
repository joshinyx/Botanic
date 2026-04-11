import { useState, useCallback } from "react";
import type { StaffUser } from "@/types";

interface Props {
  initialStaff: StaffUser[];
  currentUserId: string;
}

const ROLES = ["super_admin", "editor", "reader"] as const;
type Role = typeof ROLES[number];

const ROLE_STYLE: Record<Role, { color: string; bg: string }> = {
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

export default function AdminStaff({ initialStaff, currentUserId }: Props) {
  const [staff, setStaff] = useState<StaffUser[]>(initialStaff);
  const [creating, setCreating] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<Role>("reader");
  const [createLoading, setCreateLoading] = useState(false);
  const [createResult, setCreateResult] = useState<{ password: string } | null>(null);
  const [createError, setCreateError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleCreate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setCreateLoading(true);
    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail, role: newRole }),
      });
      const data = await res.json() as { ok?: boolean; tempPassword?: string; error?: string };
      if (!res.ok) { setCreateError(data.error ?? "Failed"); return; }
      setCreateResult({ password: data.tempPassword ?? "" });
      setNewEmail("");
      setCreating(false);
      window.location.reload();
    } finally {
      setCreateLoading(false);
    }
  }, [newEmail, newRole]);

  const handleRoleChange = useCallback(async (id: string, role: Role) => {
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

  const handleDelete = useCallback(async (id: string) => {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/staff/${id}`, { method: "DELETE" });
      const data = await res.json() as { error?: string };
      if (!res.ok) { alert(data.error ?? "Failed"); return; }
      setStaff((prev) => prev.filter((s) => s.id !== id));
      setConfirmDelete(null);
    } finally {
      setLoadingId(null);
    }
  }, []);

  return (
    <div className="space-y-4">
      {/* Create result banner */}
      {createResult && (
        <div className="p-4 rounded-card"
             style={{ background: "rgba(39,166,68,0.08)", border: "1px solid rgba(39,166,68,0.2)" }}>
          <p className="text-sm" style={{ fontWeight: 510, color: "#4ade80" }}>Staff user created</p>
          <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
            Temporary password:{" "}
            <code className="px-1.5 py-0.5 rounded font-mono"
                  style={{ background: "var(--color-bg-card-elev)", color: "var(--color-text-primary)" }}>
              {createResult.password}
            </code>
            <span className="ml-2" style={{ color: "var(--color-text-faint)" }}>— Share this securely</span>
          </p>
          <button onClick={() => setCreateResult(null)} className="text-xs mt-2 transition-colors"
                  style={{ color: "var(--color-text-faint)" }}>
            Dismiss
          </button>
        </div>
      )}

      {/* Create form */}
      {creating ? (
        <div className="p-4 rounded-card"
             style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border-std)" }}>
          <p className="text-sm mb-3" style={{ fontWeight: 510, color: "var(--color-text-primary)" }}>New staff user</p>
          {createError && (
            <p className="text-xs mb-2" style={{ color: "#f87171" }}>{createError}</p>
          )}
          <form onSubmit={handleCreate} className="flex flex-wrap gap-2 items-end">
            <div>
              <label className="block text-xs mb-1" style={{ fontWeight: 510, color: "var(--color-text-faint)" }}>Email</label>
              <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                     required placeholder="staff@example.com"
                     className="px-3 py-2 rounded text-sm outline-none w-56" style={fs} />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ fontWeight: 510, color: "var(--color-text-faint)" }}>Role</label>
              <select value={newRole} onChange={(e) => setNewRole(e.target.value as Role)}
                      className="px-3 py-2 rounded text-sm outline-none appearance-none cursor-pointer" style={fs}>
                {ROLES.map((r) => (
                  <option key={r} value={r} style={{ background: "var(--color-bg-surface)", color: "var(--color-text-primary)" }}>{r}</option>
                ))}
              </select>
            </div>
            <button type="submit" disabled={createLoading} className="px-4 py-2 rounded text-sm text-white"
                    style={{ background: createLoading ? "rgba(58,125,94,0.6)" : "var(--color-brand)", fontWeight: 510, cursor: createLoading ? "not-allowed" : "pointer" }}>
              {createLoading ? "Creating…" : "Create"}
            </button>
            <button type="button" onClick={() => { setCreating(false); setCreateError(""); }}
                    className="px-4 py-2 rounded text-sm transition-colors"
                    style={{ fontWeight: 510, color: "var(--color-text-muted)" }}>
              Cancel
            </button>
          </form>
        </div>
      ) : (
        <div className="flex justify-end">
          <button onClick={() => setCreating(true)} className="px-4 py-2 rounded text-sm text-white transition-colors"
                  style={{ background: "var(--color-brand)", fontWeight: 510, fontFeatureSettings: "'cv01','ss03'" }}>
            + New staff user
          </button>
        </div>
      )}

      {/* Staff table */}
      <div className="rounded-card overflow-hidden" style={{ border: "1px solid var(--color-border-std)" }}>
        {staff.length === 0 ? (
          <p className="text-sm text-center py-10" style={{ fontWeight: 510, color: "var(--color-text-faint)" }}>No staff users</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border-subtle)", background: "var(--color-bg-card-elev)" }}>
                {["Email", "Role", "Joined", ""].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs" style={{ fontWeight: 510, color: "var(--color-text-faint)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => {
                const rs = ROLE_STYLE[s.role as Role] ?? ROLE_STYLE.reader;
                const isSelf = s.id === currentUserId;
                const isLoading = loadingId === s.id;

                return (
                  <tr key={s.id} style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
                      className="transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-sm" style={{ color: "var(--color-text-secondary)", fontFeatureSettings: "'cv01','ss03'" }}>
                        {s.email}
                      </span>
                      {isSelf && (
                        <span className="ml-2 px-1.5 py-0.5 rounded-micro text-[10px]"
                              style={{ background: "var(--color-bg-card-elev)", color: "var(--color-text-faint)", fontWeight: 510 }}>
                          you
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <select value={s.role} onChange={(e) => handleRoleChange(s.id, e.target.value as Role)}
                              disabled={isSelf || isLoading}
                              className="px-2 py-1 rounded text-xs outline-none appearance-none transition-colors"
                              style={{
                                background: rs.bg, color: rs.color, border: "none", fontWeight: 510,
                                opacity: isSelf ? 0.5 : 1, cursor: isSelf ? "not-allowed" : "pointer",
                              }}>
                        {ROLES.map((r) => (
                          <option key={r} value={r} style={{ background: "var(--color-bg-surface)", color: "var(--color-text-primary)" }}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs" style={{ color: "var(--color-text-faint)" }}>
                        {new Date(s.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!isSelf && (
                        confirmDelete === s.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs" style={{ color: "#f87171" }}>Delete?</span>
                            <button onClick={() => handleDelete(s.id)} disabled={isLoading}
                                    className="px-2 py-1 rounded text-xs"
                                    style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171", fontWeight: 510 }}>
                              {isLoading ? "…" : "Confirm"}
                            </button>
                            <button onClick={() => setConfirmDelete(null)}
                                    className="text-xs transition-colors" style={{ color: "var(--color-text-faint)" }}>
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmDelete(s.id)}
                                  className="w-7 h-7 rounded flex items-center justify-center ml-auto transition-colors"
                                  style={{ background: "var(--color-bg-card-elev)", color: "var(--color-text-faint)" }}
                                  title="Remove">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14H6L5 6" />
                              <path d="M10 11v6M14 11v6M9 6V4h6v2" />
                            </svg>
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
