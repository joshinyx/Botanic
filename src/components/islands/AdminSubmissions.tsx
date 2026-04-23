import { useState, useCallback } from "react";
import { TrashIcon, PencilIcon, RotateCcwIcon, CheckIcon, XIcon, ChevronDownIcon, ThermometerIcon, TimerIcon } from "lucide-react";
import type { Plant, UserProfile, Climate, Duration } from "@/types";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { UserMention } from "./UserHoverCard";

type PlantWithUser = Plant & { users: Pick<UserProfile, "username" | "name" | "bio" | "avatar_url" | "followers_count" | "following_count" | "social_links"> | null };

interface Props {
  initialPlants: PlantWithUser[];
  currentStaffRole: string;
  lang: Lang;
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

export default function AdminSubmissions({ initialPlants, currentStaffRole, lang }: Props) {
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
        <p className="text-sm" style={{ fontWeight: 510, color: "var(--color-text-faint)" }}>{t("dash.submissions.empty", lang)}</p>
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
                    loading={isLoading} lang={lang}
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
                      {plant.users && (
                        <UserMention
                          user={{
                            username: plant.users.username,
                            name: plant.users.name,
                            bio: plant.users.bio ?? null,
                            avatar_url: plant.users.avatar_url ?? null,
                            followers_count: plant.users.followers_count ?? 0,
                            following_count: plant.users.following_count ?? 0,
                            social_links: plant.users.social_links ?? null,
                          }}
                          placement="up"
                        />
                      )}
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
                            <span className="text-xs" style={{ color: "#f87171" }}>{t("dash.submissions.deleteQ", lang)}</span>
                            <button onClick={() => handleDelete(plant.id)}
                                    className="px-2.5 py-1 rounded text-xs"
                                    style={{ background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.25)", color: "#f87171", fontWeight: 510, cursor: "pointer" }}>
                              {t("dash.confirm", lang)}
                            </button>
                            <button onClick={() => setConfirmDelete(null)}
                                    className="text-xs" style={{ color: "var(--color-text-faint)", background: "none", border: "none", cursor: "pointer" }}>
                              {t("dash.cancel", lang)}
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
                        <IconBtn icon={<PencilIcon size={12} />} label={t("dash.submissions.edit", lang)}
                                 color="var(--color-accent)" onClick={() => startEdit(plant)} loading={isLoading} />
                        <IconBtn icon={<RotateCcwIcon size={12} />} label={t("dash.submissions.restore", lang)}
                                 color="var(--color-text-muted)" onClick={() => handleRestore(plant.id)} loading={isLoading} />

                        {plant.status !== "rejected" && (
                          <IconBtn icon={<XIcon size={12} />} label={t("dash.submissions.reject", lang)}
                                   color="#f87171" onClick={() => handleStatus(plant.id, "reject")} loading={isLoading} />
                        )}
                        {plant.status !== "approved" && (
                          <IconBtn icon={<CheckIcon size={12} />} label={t("dash.submissions.approve", lang)}
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
  onSave: () => void; onCancel: () => void; loading: boolean; lang: Lang;
}

function EditForm({ data, onChange, climates, durations, tags, onSave, onCancel, loading, lang }: EditFormProps) {
  const field = (key: keyof Plant) => (
    <input type="text" value={(data[key] as string) ?? ""}
           onChange={(e) => onChange({ ...data, [key]: e.target.value })}
           className="w-full px-3 py-2 rounded text-sm outline-none" style={fs} />
  );
  return (
    <div className="space-y-3 mt-2">
      <Row label={t("dash.submissions.field.name", lang)}>{field("name")}</Row>
      <Row label={t("dash.submissions.field.desc", lang)}>
        <textarea value={data.description ?? ""}
                  onChange={(e) => onChange({ ...data, description: e.target.value })}
                  rows={3} className="w-full px-3 py-2 rounded text-sm outline-none resize-none" style={fs} />
      </Row>
      <div className="grid grid-cols-2 gap-3">
        <Row label={t("dash.submissions.field.country", lang)}>{field("origin_country")}</Row>
        <Row label={t("dash.submissions.field.imageUrl", lang)}>{field("image_url")}</Row>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Row label={t("dash.submissions.field.climate", lang)}>
          <select value={data.climate ?? ""} onChange={(e) => onChange({ ...data, climate: e.target.value as Climate })}
                  className="w-full px-3 py-2 rounded text-sm outline-none appearance-none" style={fs}>
            {climates.map((c) => <option key={c} value={c} style={{ background: "var(--color-bg-surface)", color: "var(--color-text-primary)" }}>{c}</option>)}
          </select>
        </Row>
        <Row label={t("dash.submissions.field.duration", lang)}>
          <select value={data.duration ?? ""} onChange={(e) => onChange({ ...data, duration: e.target.value as Duration })}
                  className="w-full px-3 py-2 rounded text-sm outline-none appearance-none" style={fs}>
            {durations.map((d) => <option key={d} value={d} style={{ background: "var(--color-bg-surface)", color: "var(--color-text-primary)" }}>{d}</option>)}
          </select>
        </Row>
      </div>
      <Row label={t("dash.submissions.field.tags", lang)}>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {tags.map((tag) => {
            const active = (data.tags ?? []).includes(tag);
            return (
              <button key={tag} type="button"
                      onClick={() => {
                        const next = active ? (data.tags ?? []).filter((tg) => tg !== tag) : [...(data.tags ?? []), tag];
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
          {loading ? t("dash.saving", lang) : t("dash.save", lang)}
        </button>
        <button onClick={onCancel} className="px-4 py-1.5 rounded text-xs"
                style={{ fontWeight: 510, color: "var(--color-text-muted)", background: "none", border: "none", cursor: "pointer" }}>
          {t("dash.cancel", lang)}
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
