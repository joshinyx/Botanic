import { useState, useCallback, useRef, useEffect } from "react";
import { TrashIcon, PencilIcon, RotateCcwIcon, CheckIcon, XIcon, ChevronDownIcon, ThermometerIcon, TimerIcon } from "lucide-react";
import type { Plant, UserProfile, Climate, Duration } from "@/types";

type PlantWithUser = Plant & { users: Pick<UserProfile, "username" | "name"> | null };

interface Props {
  initialPlants: PlantWithUser[];
  currentStaffRole: string;
}

const CLIMATES: Climate[] = ["tropical", "arid", "temperate", "continental", "polar", "mediterranean"];
const DURATIONS: Duration[] = ["annual", "biennial", "perennial"];
const TAGS = ["medicinal","edible","ornamental","succulent","aquatic","climbing","shrub","tree","herb","fern","cactus","grass"];

const CLIMATE_COLOR: Record<string, string> = {
  tropical: "#4ade80", arid: "#fbbf24", temperate: "#60a5fa",
  continental: "#c084fc", polar: "#94a3b8", mediterranean: "#fb923c",
};
const CLIMATE_BG: Record<string, string> = {
  tropical: "rgba(74,222,128,0.12)", arid: "rgba(251,191,36,0.12)",
  temperate: "rgba(96,165,250,0.12)", continental: "rgba(192,132,252,0.12)",
  polar: "rgba(148,163,184,0.12)", mediterranean: "rgba(251,146,60,0.12)",
};
const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  pending:  { color: "#fbbf24", bg: "rgba(251,191,36,0.1)" },
  approved: { color: "#4ade80", bg: "rgba(74,222,128,0.1)" },
  rejected: { color: "#f87171", bg: "rgba(248,113,113,0.1)" },
};
const fs: React.CSSProperties = {
  background: "var(--color-bg-card-elev)",
  border: "1px solid var(--color-border-std)",
  color: "var(--color-text-primary)",
  fontFeatureSettings: "'cv01','ss03'",
};

export default function AdminSubmissions({ initialPlants, currentStaffRole }: Props) {
  const [plants,        setPlants]        = useState<PlantWithUser[]>(initialPlants);
  const [expanded,      setExpanded]      = useState<string | null>(null);
  const [editing,       setEditing]       = useState<string | null>(null);
  const [editData,      setEditData]      = useState<Partial<Plant>>({});
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [loading,       setLoading]       = useState<string | null>(null);

  const canEdit = currentStaffRole !== "reader";

  const doAction = useCallback(async (plantId: string, fn: () => Promise<Response>) => {
    setLoading(plantId);
    try {
      const res = await fn();
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        alert(d.error ?? "Action failed");
      }
      return res.ok;
    } finally {
      setLoading(null);
    }
  }, []);

  const handleStatus = useCallback(async (id: string, action: "approve" | "reject") => {
    const ok = await doAction(id, () =>
      fetch(`/api/admin/plants/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
    );
    if (ok) setPlants((prev) => prev.map((p) =>
      p.id === id ? { ...p, status: action === "approve" ? "approved" : "rejected" } : p
    ));
  }, [doAction]);

  const handleRestore = useCallback(async (id: string) => {
    const ok = await doAction(id, () =>
      fetch(`/api/admin/plants/${id}/restore`, { method: "POST" })
    );
    if (ok) window.location.reload();
  }, [doAction]);

  const handleDelete = useCallback(async (id: string) => {
    const ok = await doAction(id, () =>
      fetch(`/api/admin/plants/${id}`, { method: "DELETE" })
    );
    if (ok) { setPlants((prev) => prev.filter((p) => p.id !== id)); setConfirmDelete(null); }
  }, [doAction]);

  const handleSaveEdit = useCallback(async (id: string) => {
    const ok = await doAction(id, () =>
      fetch(`/api/admin/plants/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      })
    );
    if (ok) {
      setPlants((prev) => prev.map((p) => p.id === id ? { ...p, ...editData } : p));
      setEditing(null); setEditData({});
    }
  }, [doAction, editData]);

  const startEdit = useCallback((plant: PlantWithUser) => {
    setEditing(plant.id);
    setEditData({
      name: plant.name, description: plant.description,
      origin_country: plant.origin_country, climate: plant.climate,
      duration: plant.duration, tags: [...plant.tags], image_url: plant.image_url,
    });
  }, []);

  if (plants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 rounded-card border text-center"
           style={{ borderColor: "var(--color-border-subtle)", background: "var(--color-bg-card)" }}>
        <p className="text-sm" style={{ fontWeight: 510, color: "var(--color-text-faint)" }}>No submissions yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {plants.map((plant) => {
        const isOpen        = expanded === plant.id;
        const isEditingThis = editing === plant.id;
        const isLoading     = loading === plant.id;
        const st            = STATUS_STYLE[plant.status] ?? STATUS_STYLE.pending;

        return (
          <div key={plant.id} className="rounded-card overflow-hidden"
               style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border-std)" }}>

            {/* ── Compact header ── */}
            <button
              type="button"
              className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
              style={{ background: "transparent", cursor: "pointer", border: "none", color: "inherit" }}
              onClick={() => setExpanded(isOpen ? null : plant.id)}
            >
              <img src={plant.image_url} alt={plant.name}
                   className="rounded object-cover shrink-0"
                   style={{ width: 44, height: 44, border: "1px solid var(--color-border-subtle)" }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate"
                   style={{ fontWeight: 510, color: "var(--color-text-primary)", fontFeatureSettings: "'cv01','ss03'" }}>
                  {plant.name}
                </p>
                <p className="text-xs truncate" style={{ color: "var(--color-text-faint)" }}>
                  {plant.origin_country} · {plant.climate}
                  {plant.users && (
                    <span style={{ color: "var(--color-text-subtle)" }}> · @{plant.users.username}</span>
                  )}
                </p>
              </div>
              <span className="shrink-0 px-2 py-0.5 rounded-full text-[11px]"
                    style={{ background: st.bg, color: st.color, fontWeight: 510 }}>
                {plant.status}
              </span>
              <ChevronDownIcon size={14} style={{
                color: "var(--color-text-faint)", flexShrink: 0,
                transition: "transform 0.15s",
                transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              }} />
            </button>

            {/* ── Expanded body ── */}
            {isOpen && (
              <div className="px-4 pb-4 pt-3" style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
                {isEditingThis ? (
                  <EditForm
                    data={editData} onChange={setEditData}
                    climates={CLIMATES} durations={DURATIONS} tags={TAGS}
                    onSave={() => handleSaveEdit(plant.id)}
                    onCancel={() => { setEditing(null); setEditData({}); }}
                    loading={isLoading}
                  />
                ) : (
                  <div className="space-y-3">
                    {/* Image + description */}
                    <div className="flex gap-4">
                      <div className="shrink-0 rounded-card p-1"
                           style={{ background: "var(--color-bg-card-elev)", border: "1px solid var(--color-border-std)" }}>
                        <img src={plant.image_url} alt={plant.name}
                             className="rounded object-cover block"
                             style={{ width: 118, height: 118 }} />
                      </div>
                      <div className="flex flex-col gap-2 min-w-0">
                        <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
                          {plant.description}
                        </p>
                        {/* Meta chips */}
                        <div className="flex flex-wrap gap-1.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px]"
                                style={{ background: CLIMATE_BG[plant.climate] ?? "var(--color-bg-card-elev)", color: CLIMATE_COLOR[plant.climate] ?? "var(--color-text-muted)", fontWeight: 510 }}>
                            <ThermometerIcon size={10} />
                            {plant.climate}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px]"
                                style={{ background: "var(--color-bg-card-elev)", color: "var(--color-text-muted)", fontWeight: 510 }}>
                            <TimerIcon size={10} />
                            {plant.duration}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px]"
                                style={{ background: "var(--color-bg-card-elev)", color: "var(--color-text-muted)", fontWeight: 510 }}>
                            <span style={{ fontSize: 10, lineHeight: 1 }}>🌍</span>
                            {plant.origin_country}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Tags */}
                    {(plant.tags ?? []).length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {(plant.tags ?? []).map((tag) => (
                          <span key={tag}
                                className="px-2.5 py-0.5 rounded-full text-[11px]"
                                style={{
                                  background: "rgba(82,183,136,0.1)",
                                  border: "1px solid rgba(82,183,136,0.2)",
                                  color: "var(--color-accent-hover)",
                                  fontWeight: 510,
                                  fontFeatureSettings: "'cv01','ss03'",
                                }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Author + date */}
                    <div className="flex items-center gap-3">
                      {plant.users && <UserMention username={plant.users.username} name={plant.users.name} />}
                      <span className="text-xs" style={{ color: "var(--color-text-faint)" }}>
                        {new Date(plant.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                      </span>
                    </div>

                    {/* Actions */}
                    {canEdit && (
                      <div className="flex items-center gap-2 pt-1">
                        {/* Delete — left, red */}
                        {confirmDelete === plant.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs" style={{ color: "#f87171" }}>Delete?</span>
                            <button onClick={() => handleDelete(plant.id)}
                                    className="px-2.5 py-1 rounded text-xs"
                                    style={{ background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.25)", color: "#f87171", fontWeight: 510, cursor: "pointer" }}>
                              Confirm
                            </button>
                            <button onClick={() => setConfirmDelete(null)}
                                    className="text-xs" style={{ color: "var(--color-text-faint)", background: "none", border: "none", cursor: "pointer" }}>
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmDelete(plant.id)}
                                  className="w-7 h-7 rounded flex items-center justify-center transition-colors"
                                  style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.15)", color: "#f87171", cursor: "pointer" }}
                                  title="Delete">
                            <TrashIcon size={13} />
                          </button>
                        )}

                        <div className="flex-1" />

                        {/* Right side — Edit, Restore, Reject, Approve */}
                        <IconBtn icon={<PencilIcon size={12} />} label="Edit"
                                 color="var(--color-accent)" onClick={() => startEdit(plant)} loading={isLoading} />
                        <IconBtn icon={<RotateCcwIcon size={12} />} label="Restore original"
                                 color="var(--color-text-muted)" onClick={() => handleRestore(plant.id)} loading={isLoading} />

                        {plant.status !== "rejected" && (
                          <IconBtn icon={<XIcon size={12} />} label="Reject"
                                   color="#f87171" onClick={() => handleStatus(plant.id, "reject")} loading={isLoading} />
                        )}
                        {plant.status !== "approved" && (
                          <IconBtn icon={<CheckIcon size={12} />} label="Approve"
                                   color="#4ade80" onClick={() => handleStatus(plant.id, "approve")} loading={isLoading} />
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── User mention with hover card ────────────────────────────────────────────

interface HoverProfile {
  name: string;
  username: string;
  bio: string | null;
  avatar_url: string | null;
  social_links: Record<string, string> | null;
  followers_count: number;
  following_count: number;
  plants_count: number;
}

function UserMention({ username, name }: { username: string; name: string }) {
  const [profile, setProfile] = useState<HoverProfile | null>(null);
  const [visible, setVisible] = useState(false);
  const [fetched, setFetched] = useState(false);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchProfile = useCallback(async () => {
    if (fetched) return;
    setFetched(true);
    try {
      const res = await fetch(`/api/users/${username}`);
      if (res.ok) setProfile(await res.json() as HoverProfile);
    } catch { /* swallow */ }
  }, [username, fetched]);

  const onEnter = useCallback(() => {
    if (hideTimer.current) { clearTimeout(hideTimer.current); hideTimer.current = null; }
    showTimer.current = setTimeout(() => { fetchProfile(); setVisible(true); }, 260);
  }, [fetchProfile]);

  const onLeave = useCallback(() => {
    if (showTimer.current) { clearTimeout(showTimer.current); showTimer.current = null; }
    hideTimer.current = setTimeout(() => setVisible(false), 120);
  }, []);

  useEffect(() => () => {
    if (showTimer.current) clearTimeout(showTimer.current);
    if (hideTimer.current) clearTimeout(hideTimer.current);
  }, []);

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <a
        href={`/user/${username}`}
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        style={{
          fontSize: 12, fontWeight: 510,
          color: "var(--color-text-muted)",
          textDecoration: "none",
          fontFeatureSettings: "'cv01','ss03'",
        }}
      >
        @{username}
      </a>

      {visible && (
        <>
          {/* Invisible bridge fills the gap so mouse can reach the card */}
          <div
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
            style={{
              position: "absolute", bottom: "100%", left: 0,
              width: 220, height: 10,
              background: "transparent",
            }}
          />
          <div
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
            style={{
              position: "absolute",
              bottom: "calc(100% + 10px)",
              left: 0,
              width: 220,
              background: "var(--color-bg-surface)",
              border: "1px solid var(--color-border-std)",
              borderRadius: 12,
              boxShadow: "0 8px 28px rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.12)",
              zIndex: 100,
              animation: "dropdown-in 0.12s ease",
              overflow: "hidden",
            }}
          >
            {profile ? <ProfileCard profile={profile} /> : (
              <div style={{ padding: "20px 16px", textAlign: "center", fontSize: 11, color: "var(--color-text-faint)" }}>
                Loading…
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

type SocialIconDef = { path: string; type: "stroke" | "fill" };
const SOCIAL_ICONS: Record<string, SocialIconDef> = {
  website:   { type: "stroke", path: "M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 0v20M2 12h20M4.93 4.93C6.36 8.36 8 10 12 10s5.64-1.64 7.07-5.07M4.93 19.07C6.36 15.64 8 14 12 14s5.64 1.36 7.07 4.93" },
  twitter:   { type: "fill",   path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.74-8.855L2.25 2.25h6.826l4.26 5.637 4.908-5.637zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
  instagram: { type: "fill",   path: "M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.74 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" },
  github:    { type: "fill",   path: "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" },
  linkedin:  { type: "fill",   path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" },
};

function ProfileCard({ profile }: { profile: HoverProfile }) {
  const initial = profile.name.charAt(0).toUpperCase();
  const socials = profile.social_links
    ? Object.entries(profile.social_links).filter(([, v]) => v && v.startsWith("http"))
    : [];

  return (
    <div>
      {/* Top accent bar */}
      <div style={{ height: 3, background: "linear-gradient(90deg, var(--color-brand), var(--color-accent))" }} />

      <div style={{ padding: "14px 14px 12px" }}>
        {/* Avatar + name */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.name}
                 style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "2px solid var(--color-border-std)" }} />
          ) : (
            <div style={{
              width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
              background: "rgba(58,125,94,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, fontWeight: 590, color: "#52b788",
            }}>
              {initial}
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 590, color: "var(--color-text-primary)", fontFeatureSettings: "'cv01','ss03'", lineHeight: 1.2 }}>
              {profile.name}
            </p>
            <p style={{ margin: 0, fontSize: 11, color: "var(--color-accent)", fontWeight: 510 }}>
              @{profile.username}
            </p>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p style={{
            margin: "0 0 10px", fontSize: 11, lineHeight: 1.5,
            color: "var(--color-text-muted)",
            display: "-webkit-box", WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>
            {profile.bio}
          </p>
        )}

        {/* Stats */}
        <div style={{ display: "flex", gap: 14, marginBottom: socials.length ? 10 : 0 }}>
          {[
            { label: "plants",     value: profile.plants_count },
            { label: "followers",  value: profile.followers_count },
            { label: "following",  value: profile.following_count },
          ].map(({ label, value }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 590, color: "var(--color-text-primary)", lineHeight: 1 }}>
                {value}
              </p>
              <p style={{ margin: 0, fontSize: 10, color: "var(--color-text-faint)", marginTop: 2 }}>
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* Social links — icons */}
        {socials.length > 0 && (
          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            {socials.map(([platform, url]) => {
              const icon = SOCIAL_ICONS[platform] ?? SOCIAL_ICONS["website"];
              return (
                <a key={platform} href={url} target="_blank" rel="noopener noreferrer"
                   onClick={(e) => e.stopPropagation()}
                   title={platform}
                   style={{ color: "var(--color-text-subtle)", textDecoration: "none", display: "flex" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24"
                       fill={icon.type === "fill" ? "currentColor" : "none"}
                       stroke={icon.type === "stroke" ? "currentColor" : "none"}
                       strokeWidth="1.5">
                    <path d={icon.path} />
                  </svg>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Action button (icon + label) ────────────────────────────────────────────

function IconBtn({ icon, label, color, onClick, loading }: {
  icon: React.ReactNode; label: string; color: string;
  onClick: () => void; loading: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      title={label}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs transition-colors"
      style={{
        fontWeight: 510, color,
        background: "var(--color-bg-card-elev)",
        border: "1px solid var(--color-border-std)",
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.5 : 1,
        fontFeatureSettings: "'cv01','ss03'",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

// ── Edit form ───────────────────────────────────────────────────────────────

interface EditFormProps {
  data: Partial<Plant>; onChange: (d: Partial<Plant>) => void;
  climates: Climate[]; durations: Duration[]; tags: string[];
  onSave: () => void; onCancel: () => void; loading: boolean;
}

function EditForm({ data, onChange, climates, durations, tags, onSave, onCancel, loading }: EditFormProps) {
  const field = (key: keyof Plant) => (
    <input type="text" value={(data[key] as string) ?? ""}
           onChange={(e) => onChange({ ...data, [key]: e.target.value })}
           className="w-full px-3 py-2 rounded text-sm outline-none" style={fs} />
  );
  return (
    <div className="space-y-3 mt-2">
      <Row label="Name">{field("name")}</Row>
      <Row label="Description">
        <textarea value={data.description ?? ""}
                  onChange={(e) => onChange({ ...data, description: e.target.value })}
                  rows={3} className="w-full px-3 py-2 rounded text-sm outline-none resize-none" style={fs} />
      </Row>
      <div className="grid grid-cols-2 gap-3">
        <Row label="Country">{field("origin_country")}</Row>
        <Row label="Image URL">{field("image_url")}</Row>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Row label="Climate">
          <select value={data.climate ?? ""} onChange={(e) => onChange({ ...data, climate: e.target.value as Climate })}
                  className="w-full px-3 py-2 rounded text-sm outline-none appearance-none" style={fs}>
            {climates.map((c) => <option key={c} value={c} style={{ background: "var(--color-bg-surface)", color: "var(--color-text-primary)" }}>{c}</option>)}
          </select>
        </Row>
        <Row label="Duration">
          <select value={data.duration ?? ""} onChange={(e) => onChange({ ...data, duration: e.target.value as Duration })}
                  className="w-full px-3 py-2 rounded text-sm outline-none appearance-none" style={fs}>
            {durations.map((d) => <option key={d} value={d} style={{ background: "var(--color-bg-surface)", color: "var(--color-text-primary)" }}>{d}</option>)}
          </select>
        </Row>
      </div>
      <Row label="Tags">
        <div className="flex flex-wrap gap-1.5 mt-1">
          {tags.map((tag) => {
            const active = (data.tags ?? []).includes(tag);
            return (
              <button key={tag} type="button"
                      onClick={() => {
                        const next = active ? (data.tags ?? []).filter((t) => t !== tag) : [...(data.tags ?? []), tag];
                        onChange({ ...data, tags: next });
                      }}
                      className="px-2 py-0.5 rounded-full text-[11px] transition-colors"
                      style={{ fontWeight: 510, background: active ? "rgba(82,183,136,0.15)" : "transparent",
                               color: active ? "#74c69d" : "var(--color-text-subtle)",
                               border: active ? "1px solid rgba(82,183,136,0.3)" : "1px solid var(--color-border-std)", cursor: "pointer" }}>
                {tag}
              </button>
            );
          })}
        </div>
      </Row>
      <div className="flex gap-2 pt-1">
        <button onClick={onSave} disabled={loading} className="px-4 py-1.5 rounded text-xs text-white"
                style={{ background: loading ? "rgba(58,125,94,0.6)" : "var(--color-brand)", fontWeight: 510, cursor: loading ? "not-allowed" : "pointer" }}>
          {loading ? "Saving…" : "Save"}
        </button>
        <button onClick={onCancel} className="px-4 py-1.5 rounded text-xs"
                style={{ fontWeight: 510, color: "var(--color-text-muted)", background: "none", border: "none", cursor: "pointer" }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs mb-1" style={{ fontWeight: 510, color: "var(--color-text-faint)" }}>{label}</label>
      {children}
    </div>
  );
}
