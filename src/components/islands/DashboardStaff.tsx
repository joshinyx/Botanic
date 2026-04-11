import { useState, useCallback } from "react";
import type { StaffEntry, DashboardRole } from "@/types";

interface Props {
  initialStaff: StaffEntry[];
  currentUserId: string;
}

const ROLES = ["super_admin", "editor", "reader"] as const;

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

export default function DashboardStaff({ initialStaff, currentUserId }: Props) {
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
        body: JSON.stringify({ username: assignUsername.trim(), role: assignRole }),
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
      {/* Assign role form */}
      {assigning ? (
        <div className="p-4 rounded-card"
             style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border-std)" }}>
          <p className="text-sm mb-3" style={{ fontWeight: 510, color: "var(--color-text-primary)" }}>
            Grant dashboard access
          </p>
          {assignError && (
            <p className="text-xs mb-2" style={{ color: "#f87171" }}>{assignError}</p>
          )}
          <form onSubmit={handleAssign} className="flex flex-wrap gap-2 items-end">
            <div>
              <label className="block text-xs mb-1" style={{ fontWeight: 510, color: "var(--color-text-faint)" }}>
                Username
              </label>
              <input
                type="text" value={assignUsername}
                onChange={(e) => setAssignUsername(e.target.value)}
                required placeholder="jane_doe"
                className="px-3 py-2 rounded text-sm outline-none w-44" style={fs}
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ fontWeight: 510, color: "var(--color-text-faint)" }}>
                Role
              </label>
              <select value={assignRole} onChange={(e) => setAssignRole(e.target.value as DashboardRole)}
                      className="px-3 py-2 rounded text-sm outline-none appearance-none cursor-pointer" style={fs}>
                {ROLES.map((r) => (
                  <option key={r} value={r} style={{ background: "var(--color-bg-surface)", color: "var(--color-text-primary)" }}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" disabled={assignLoading} className="px-4 py-2 rounded text-sm text-white"
                    style={{ background: assignLoading ? "rgba(58,125,94,0.6)" : "var(--color-brand)", fontWeight: 510, cursor: assignLoading ? "not-allowed" : "pointer" }}>
              {assignLoading ? "Saving…" : "Grant access"}
            </button>
            <button type="button" onClick={() => { setAssigning(false); setAssignError(""); }}
                    className="px-4 py-2 rounded text-sm transition-colors"
                    style={{ fontWeight: 510, color: "var(--color-text-muted)" }}>
              Cancel
            </button>
          </form>
        </div>
      ) : (
        <div className="flex justify-end">
          <button onClick={() => setAssigning(true)} className="px-4 py-2 rounded text-sm text-white transition-colors"
                  style={{ background: "var(--color-brand)", fontWeight: 510, fontFeatureSettings: "'cv01','ss03'" }}>
            + Grant access
          </button>
        </div>
      )}

      {/* Staff table */}
      <div className="rounded-card overflow-hidden" style={{ border: "1px solid var(--color-border-std)" }}>
        {staff.length === 0 ? (
          <p className="text-sm text-center py-10" style={{ fontWeight: 510, color: "var(--color-text-faint)" }}>
            No staff users yet
          </p>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border-subtle)", background: "var(--color-bg-card-elev)" }}>
                {["User", "Role", "Since", ""].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs" style={{ fontWeight: 510, color: "var(--color-text-faint)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => {
                const rs = ROLE_STYLE[s.role] ?? ROLE_STYLE.reader;
                const isSelf = s.id === currentUserId;
                const isLoading = loadingId === s.id;

                return (
                  <tr key={s.id} style={{ borderBottom: "1px solid var(--color-border-subtle)" }} className="transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm" style={{ fontWeight: 510, color: "var(--color-text-primary)", fontFeatureSettings: "'cv01','ss03'" }}>
                        @{s.username}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--color-text-faint)" }}>{s.email}</p>
                      {isSelf && (
                        <span className="mt-0.5 inline-block px-1.5 py-0.5 rounded-micro text-[10px]"
                              style={{ background: "var(--color-bg-card-elev)", color: "var(--color-text-faint)", fontWeight: 510 }}>
                          you
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <select value={s.role} onChange={(e) => handleRoleChange(s.id, e.target.value as DashboardRole)}
                              disabled={isSelf || isLoading}
                              className="px-2 py-1 rounded text-xs outline-none appearance-none cursor-pointer transition-colors"
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
                        confirmRevoke === s.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs" style={{ color: "#f87171" }}>Revoke?</span>
                            <button onClick={() => handleRevoke(s.id)} disabled={isLoading}
                                    className="px-2 py-1 rounded text-xs"
                                    style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171", fontWeight: 510 }}>
                              {isLoading ? "…" : "Confirm"}
                            </button>
                            <button onClick={() => setConfirmRevoke(null)}
                                    className="text-xs transition-colors" style={{ color: "var(--color-text-faint)" }}>
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmRevoke(s.id)}
                                  className="w-7 h-7 rounded flex items-center justify-center ml-auto transition-colors"
                                  style={{ background: "var(--color-bg-card-elev)", color: "var(--color-text-faint)" }}
                                  title="Revoke access">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
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
