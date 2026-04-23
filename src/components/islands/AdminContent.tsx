import { useState, useCallback, useEffect } from "react";
import type { ContentEntry, PlantTagRow, PlantFamilyRow, PlantClimateRow, PlantDurationRow } from "@/types";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

interface Props {
  initialEntries: ContentEntry[];
  langs: string[];
  initialTags?: PlantTagRow[];
  initialFamilies?: PlantFamilyRow[];
  initialClimates?: PlantClimateRow[];
  initialDurations?: PlantDurationRow[];
  lang: Lang;
}

const fs: React.CSSProperties = {
  background: "var(--color-bg-card-elev)",
  border: "1px solid var(--color-border-std)",
  color: "var(--color-text-primary)",
  fontFeatureSettings: "'cv01','ss03'",
};

export default function AdminContent({ initialEntries, langs, initialTags = [], initialFamilies = [], initialClimates = [], initialDurations = [], lang }: Props) {
  const [tab, setTab] = useState<"content" | "tags" | "families" | "climates" | "durations">("content");
  const [entries,   setEntries]   = useState<ContentEntry[]>(initialEntries);
  const [tags,      setTags]      = useState<PlantTagRow[]>(initialTags);
  const [families,  setFamilies]  = useState<PlantFamilyRow[]>(initialFamilies);
  const [climates,  setClimates]  = useState<PlantClimateRow[]>(initialClimates);
  const [durations, setDurations] = useState<PlantDurationRow[]>(initialDurations);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [filterLang, setFilterLang] = useState("all");
  const [filterKey, setFilterKey] = useState("");
  const [addingNew, setAddingNew] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newLang, setNewLang] = useState("es");
  const [newValue, setNewValue] = useState("");
  const [newError, setNewError] = useState("");

  const startEdit = useCallback((entry: ContentEntry) => {
    setEditingId(entry.id);
    setEditValue(entry.value);
  }, []);

  const saveEdit = useCallback(async (id: string) => {
    setSavingId(id);
    try {
      const res = await fetch(`/api/admin/content/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: editValue }),
      });
      if (res.ok) {
        setEntries((prev) => prev.map((e) => e.id === id ? { ...e, value: editValue } : e));
        setEditingId(null);
      }
    } finally {
      setSavingId(null);
    }
  }, [editValue]);

  const saveNew = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setNewError("");
    setSavingId("new");
    try {
      const res = await fetch("/api/admin/content/new", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: newKey.trim(), lang: newLang, value: newValue.trim() }),
      });
      const data = await res.json() as { ok?: boolean; id?: string; error?: string };
      if (!res.ok) { setNewError(data.error ?? "Failed"); return; }
      setAddingNew(false);
      setNewKey(""); setNewLang("es"); setNewValue("");
      window.location.reload();
    } finally {
      setSavingId(null);
    }
  }, [newKey, newLang, newValue]);

  // ── Tag management ──
  const [tagEditing, setTagEditing] = useState<string | null>(null);
  const [tagEdit, setTagEdit]       = useState<{ label_es: string; label_en: string }>({ label_es: "", label_en: "" });
  const [tagSaving, setTagSaving]   = useState<string | null>(null);

  const startTagEdit = useCallback((tag: PlantTagRow) => {
    setTagEditing(tag.key);
    setTagEdit({ label_es: tag.label_es, label_en: tag.label_en });
  }, []);

  const saveTagEdit = useCallback(async (key: string) => {
    setTagSaving(key);
    try {
      const res = await fetch(`/api/admin/tags/${key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tagEdit),
      });
      if (res.ok) {
        setTags((prev) => prev.map((t) => t.key === key ? { ...t, ...tagEdit } : t));
        setTagEditing(null);
      }
    } finally {
      setTagSaving(null);
    }
  }, [tagEdit]);

  const toggleTagActive = useCallback(async (key: string, active: boolean) => {
    setTagSaving(key);
    try {
      const res = await fetch(`/api/admin/tags/${key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      if (res.ok) {
        setTags((prev) => prev.map((t) => t.key === key ? { ...t, active } : t));
      }
    } finally {
      setTagSaving(null);
    }
  }, []);

  const [tagBulkSaving, setTagBulkSaving] = useState(false);
  const toggleAllTags = useCallback(async (active: boolean) => {
    setTagBulkSaving(true);
    try {
      await Promise.all(
        tags.filter((t) => t.active !== active).map((t) =>
          fetch(`/api/admin/tags/${t.key}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ active }),
          })
        )
      );
      setTags((prev) => prev.map((t) => ({ ...t, active })));
    } finally {
      setTagBulkSaving(false);
    }
  }, [tags]);

  // ── Family management ──
  const [famEditing, setFamEditing] = useState<string | null>(null);
  const [famEdit,    setFamEdit]    = useState<{ label_es: string; label_en: string }>({ label_es: "", label_en: "" });
  const [famSaving,  setFamSaving]  = useState<string | null>(null);

  const startFamEdit = useCallback((fam: PlantFamilyRow) => {
    setFamEditing(fam.key);
    setFamEdit({ label_es: fam.label_es, label_en: fam.label_en });
  }, []);

  const saveFamEdit = useCallback(async (key: string) => {
    setFamSaving(key);
    try {
      const res = await fetch(`/api/admin/families/${key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(famEdit),
      });
      if (res.ok) {
        setFamilies((prev) => prev.map((f) => f.key === key ? { ...f, ...famEdit } : f));
        setFamEditing(null);
      }
    } finally {
      setFamSaving(null);
    }
  }, [famEdit]);

  const toggleFamActive = useCallback(async (key: string, active: boolean) => {
    setFamSaving(key);
    try {
      const res = await fetch(`/api/admin/families/${key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      if (res.ok) {
        setFamilies((prev) => prev.map((f) => f.key === key ? { ...f, active } : f));
      }
    } finally {
      setFamSaving(null);
    }
  }, []);

  const [famBulkSaving, setFamBulkSaving] = useState(false);
  const toggleAllFamilies = useCallback(async (active: boolean) => {
    setFamBulkSaving(true);
    try {
      await Promise.all(
        families.filter((f) => f.active !== active).map((f) =>
          fetch(`/api/admin/families/${f.key}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ active }),
          })
        )
      );
      setFamilies((prev) => prev.map((f) => ({ ...f, active })));
    } finally {
      setFamBulkSaving(false);
    }
  }, [families]);

  // ── Climate management ──
  const [climEditing, setClimEditing] = useState<string | null>(null);
  const [climEdit,    setClimEdit]    = useState<{ label_es: string; label_en: string }>({ label_es: "", label_en: "" });
  const [climSaving,  setClimSaving]  = useState<string | null>(null);

  const startClimEdit = useCallback((c: PlantClimateRow) => {
    setClimEditing(c.key);
    setClimEdit({ label_es: c.label_es, label_en: c.label_en });
  }, []);

  const saveClimEdit = useCallback(async (key: string) => {
    setClimSaving(key);
    try {
      const res = await fetch(`/api/admin/climates/${key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(climEdit),
      });
      if (res.ok) {
        setClimates((prev) => prev.map((c) => c.key === key ? { ...c, ...climEdit } : c));
        setClimEditing(null);
      }
    } finally {
      setClimSaving(null);
    }
  }, [climEdit]);

  const toggleClimActive = useCallback(async (key: string, active: boolean) => {
    setClimSaving(key);
    try {
      const res = await fetch(`/api/admin/climates/${key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      if (res.ok) {
        setClimates((prev) => prev.map((c) => c.key === key ? { ...c, active } : c));
      }
    } finally {
      setClimSaving(null);
    }
  }, []);

  const [climBulkSaving, setClimBulkSaving] = useState(false);
  const toggleAllClimates = useCallback(async (active: boolean) => {
    setClimBulkSaving(true);
    try {
      await Promise.all(
        climates.filter((c) => c.active !== active).map((c) =>
          fetch(`/api/admin/climates/${c.key}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ active }),
          })
        )
      );
      setClimates((prev) => prev.map((c) => ({ ...c, active })));
    } finally {
      setClimBulkSaving(false);
    }
  }, [climates]);

  // ── Duration management ──
  const [durEditing, setDurEditing] = useState<string | null>(null);
  const [durEdit,    setDurEdit]    = useState<{ label_es: string; label_en: string }>({ label_es: "", label_en: "" });
  const [durSaving,  setDurSaving]  = useState<string | null>(null);

  const startDurEdit = useCallback((d: PlantDurationRow) => {
    setDurEditing(d.key);
    setDurEdit({ label_es: d.label_es, label_en: d.label_en });
  }, []);

  const saveDurEdit = useCallback(async (key: string) => {
    setDurSaving(key);
    try {
      const res = await fetch(`/api/admin/durations/${key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(durEdit),
      });
      if (res.ok) {
        setDurations((prev) => prev.map((d) => d.key === key ? { ...d, ...durEdit } : d));
        setDurEditing(null);
      }
    } finally {
      setDurSaving(null);
    }
  }, [durEdit]);

  const toggleDurActive = useCallback(async (key: string, active: boolean) => {
    setDurSaving(key);
    try {
      const res = await fetch(`/api/admin/durations/${key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      if (res.ok) {
        setDurations((prev) => prev.map((d) => d.key === key ? { ...d, active } : d));
      }
    } finally {
      setDurSaving(null);
    }
  }, []);

  const [durBulkSaving, setDurBulkSaving] = useState(false);
  const toggleAllDurations = useCallback(async (active: boolean) => {
    setDurBulkSaving(true);
    try {
      await Promise.all(
        durations.filter((d) => d.active !== active).map((d) =>
          fetch(`/api/admin/durations/${d.key}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ active }),
          })
        )
      );
      setDurations((prev) => prev.map((d) => ({ ...d, active })));
    } finally {
      setDurBulkSaving(false);
    }
  }, [durations]);

  // ── Add new helpers ──
  type NewItem = { key: string; label_es: string; label_en: string };
  const emptyNew: NewItem = { key: "", label_es: "", label_en: "" };

  const [addingTag, setAddingTag]       = useState(false);
  const [newTag,    setNewTag]          = useState<NewItem>(emptyNew);
  const [newTagErr, setNewTagErr]       = useState("");
  const [newTagSaving, setNewTagSaving] = useState(false);

  const submitNewTag = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setNewTagErr("");
    setNewTagSaving(true);
    try {
      const res = await fetch("/api/admin/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTag),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) { setNewTagErr(data.error ?? "Error"); return; }
      const sortOrder = tags.reduce((m, t) => Math.max(m, t.sort_order), 0) + 1;
      setTags((prev) => [...prev, { ...newTag, active: true, sort_order: sortOrder }]);
      setAddingTag(false);
      setNewTag(emptyNew);
    } finally {
      setNewTagSaving(false);
    }
  }, [newTag, tags]);

  const [addingFam, setAddingFam]       = useState(false);
  const [newFam,    setNewFam]          = useState<NewItem>(emptyNew);
  const [newFamErr, setNewFamErr]       = useState("");
  const [newFamSaving, setNewFamSaving] = useState(false);

  const submitNewFam = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setNewFamErr("");
    setNewFamSaving(true);
    try {
      const res = await fetch("/api/admin/families", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newFam),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) { setNewFamErr(data.error ?? "Error"); return; }
      const sortOrder = families.reduce((m, f) => Math.max(m, f.sort_order), 0) + 1;
      setFamilies((prev) => [...prev, { ...newFam, active: true, sort_order: sortOrder }]);
      setAddingFam(false);
      setNewFam(emptyNew);
    } finally {
      setNewFamSaving(false);
    }
  }, [newFam, families]);

  const [addingClim, setAddingClim]       = useState(false);
  const [newClim,    setNewClim]          = useState<NewItem>(emptyNew);
  const [newClimErr, setNewClimErr]       = useState("");
  const [newClimSaving, setNewClimSaving] = useState(false);

  const submitNewClim = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setNewClimErr("");
    setNewClimSaving(true);
    try {
      const res = await fetch("/api/admin/climates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newClim),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) { setNewClimErr(data.error ?? "Error"); return; }
      const sortOrder = climates.reduce((m, c) => Math.max(m, c.sort_order), 0) + 1;
      setClimates((prev) => [...prev, { ...newClim, active: true, sort_order: sortOrder }]);
      setAddingClim(false);
      setNewClim(emptyNew);
    } finally {
      setNewClimSaving(false);
    }
  }, [newClim, climates]);

  const [addingDur, setAddingDur]       = useState(false);
  const [newDur,    setNewDur]          = useState<NewItem>(emptyNew);
  const [newDurErr, setNewDurErr]       = useState("");
  const [newDurSaving, setNewDurSaving] = useState(false);

  const submitNewDur = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setNewDurErr("");
    setNewDurSaving(true);
    try {
      const res = await fetch("/api/admin/durations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDur),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) { setNewDurErr(data.error ?? "Error"); return; }
      const sortOrder = durations.reduce((m, d) => Math.max(m, d.sort_order), 0) + 1;
      setDurations((prev) => [...prev, { ...newDur, active: true, sort_order: sortOrder }]);
      setAddingDur(false);
      setNewDur(emptyNew);
    } finally {
      setNewDurSaving(false);
    }
  }, [newDur, durations]);

  // ── Delete helpers ──
  const [deletingTagKey,  setDeletingTagKey]  = useState<string | null>(null);
  const [deletingFamKey,  setDeletingFamKey]  = useState<string | null>(null);
  const [deletingClimKey, setDeletingClimKey] = useState<string | null>(null);
  const [deletingDurKey,  setDeletingDurKey]  = useState<string | null>(null);

  const deleteTag = useCallback(async (key: string) => {
    const res = await fetch(`/api/admin/tags/${key}`, { method: "DELETE" });
    if (res.ok) { setTags((prev) => prev.filter((t) => t.key !== key)); setDeletingTagKey(null); }
  }, []);

  const deleteFam = useCallback(async (key: string) => {
    const res = await fetch(`/api/admin/families/${key}`, { method: "DELETE" });
    if (res.ok) { setFamilies((prev) => prev.filter((f) => f.key !== key)); setDeletingFamKey(null); }
  }, []);

  const deleteClim = useCallback(async (key: string) => {
    const res = await fetch(`/api/admin/climates/${key}`, { method: "DELETE" });
    if (res.ok) { setClimates((prev) => prev.filter((c) => c.key !== key)); setDeletingClimKey(null); }
  }, []);

  const deleteDur = useCallback(async (key: string) => {
    const res = await fetch(`/api/admin/durations/${key}`, { method: "DELETE" });
    if (res.ok) { setDurations((prev) => prev.filter((d) => d.key !== key)); setDeletingDurKey(null); }
  }, []);

  useEffect(() => {
    if (!deletingTagKey && !deletingFamKey && !deletingClimKey && !deletingDurKey) return;
    const cancel = () => {
      setDeletingTagKey(null);
      setDeletingFamKey(null);
      setDeletingClimKey(null);
      setDeletingDurKey(null);
    };
    document.addEventListener("mousedown", cancel);
    return () => document.removeEventListener("mousedown", cancel);
  }, [deletingTagKey, deletingFamKey, deletingClimKey, deletingDurKey]);

  const filtered = entries.filter((e) => {
    if (filterLang !== "all" && e.lang !== filterLang) return false;
    if (filterKey && !e.key.toLowerCase().includes(filterKey.toLowerCase())) return false;
    return true;
  });

  const grouped = filtered.reduce<Record<string, ContentEntry[]>>((acc, e) => {
    (acc[e.key] ??= []).push(e);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Tab switcher */}
      <div className="flex gap-1 p-1 rounded-card w-fit" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border-subtle)" }}>
        {(["content", "tags", "families", "climates", "durations"] as const).map((tabKey) => (
          <button key={tabKey} onClick={() => setTab(tabKey)}
                  className="px-4 py-1.5 rounded text-xs transition-colors"
                  style={{
                    fontWeight: 510, fontFeatureSettings: "'cv01','ss03'",
                    background: tab === tabKey ? "var(--color-bg-elevated)" : "transparent",
                    color: tab === tabKey ? "var(--color-text-primary)" : "var(--color-text-faint)",
                    border: "none", cursor: "pointer",
                  }}>
            {tabKey === "content" ? t("dash.content.tab.content", lang)
             : tabKey === "tags" ? t("dash.content.tab.tags", lang)
             : tabKey === "families" ? t("dash.content.tab.families", lang)
             : tabKey === "climates" ? t("dash.content.tab.climates", lang)
             : t("dash.content.tab.durations", lang)}
          </button>
        ))}
      </div>

      {/* Tags section */}
      {tab === "tags" && (
        <div className="space-y-2">
          {tags.length > 0 && (
            <div className="flex justify-end gap-2">
              <button onClick={() => toggleAllTags(true)} disabled={tagBulkSaving || tags.every((t) => t.active)}
                      className="px-3 py-1 rounded text-xs transition-colors"
                      style={{ fontWeight: 510, border: "1px solid var(--color-border-std)", cursor: "pointer", background: "rgba(39,166,68,0.08)", color: "#27a644", opacity: tags.every((t) => t.active) ? 0.4 : 1 }}>
                {t("dash.content.activateAll", lang)}
              </button>
              <button onClick={() => toggleAllTags(false)} disabled={tagBulkSaving || tags.every((t) => !t.active)}
                      className="px-3 py-1 rounded text-xs transition-colors"
                      style={{ fontWeight: 510, border: "1px solid var(--color-border-std)", cursor: "pointer", background: "var(--color-bg-card-elev)", color: "var(--color-text-secondary)", opacity: tags.every((t) => !t.active) ? 0.4 : 1 }}>
                {t("dash.content.deactivateAll", lang)}
              </button>
            </div>
          )}
          {tags.length > 0 && (
            <div className="flex items-center gap-4 px-4 pb-0.5">
              <span className="text-[10px] uppercase tracking-wider w-28 shrink-0" style={{ color: "var(--color-text-faint)", fontWeight: 510 }}>Clave</span>
              <div className="flex flex-1 gap-4 items-center min-w-0">
                <span className="flex-1 text-[10px] uppercase tracking-wider" style={{ color: "var(--color-text-faint)", fontWeight: 510 }}>Español</span>
                <span className="flex-1 text-[10px] uppercase tracking-wider" style={{ color: "var(--color-text-faint)", fontWeight: 510 }}>Inglés</span>
                <div className="w-6 shrink-0" />
              </div>
              <span className="invisible shrink-0 px-2.5 py-1 text-xs select-none">Activo</span>
            </div>
          )}
          {tags.length === 0 && (
            <p className="text-sm py-8 text-center" style={{ color: "var(--color-text-faint)" }}>{t("dash.content.empty.tags", lang)}</p>
          )}
          {tags.map((tag) => (
            <div key={tag.key} className="rounded-card px-4 py-3 flex items-center gap-4"
                 style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border-std)", opacity: tag.active ? 1 : 0.5 }}>
              {/* Key */}
              <code className="text-xs font-mono w-28 shrink-0" style={{ color: "var(--color-accent)" }}>{tag.key}</code>

              {/* Labels */}
              {tagEditing === tag.key ? (
                <div className="flex flex-1 gap-2 items-center min-w-0 edit-row-enter">
                  <div className="flex-1 min-w-0">
                    <span className="block text-[10px] mb-1" style={{ color: "var(--color-text-faint)", fontWeight: 510 }}>ES</span>
                    <input value={tagEdit.label_es} onChange={(e) => setTagEdit((p) => ({ ...p, label_es: e.target.value }))}
                           autoFocus className="w-full px-2 py-1 rounded text-sm outline-none" style={fs} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-[10px] mb-1" style={{ color: "var(--color-text-faint)", fontWeight: 510 }}>EN</span>
                    <input value={tagEdit.label_en} onChange={(e) => setTagEdit((p) => ({ ...p, label_en: e.target.value }))}
                           className="w-full px-2 py-1 rounded text-sm outline-none" style={fs} />
                  </div>
                  <div className="flex gap-1 mt-4 shrink-0">
                    <button onClick={() => saveTagEdit(tag.key)} disabled={tagSaving === tag.key}
                            className="px-3 py-1 rounded text-xs text-white"
                            style={{ background: "var(--color-brand)", fontWeight: 510, border: "none", cursor: "pointer" }}>
                      {tagSaving === tag.key ? "…" : t("dash.save", lang)}
                    </button>
                    <button onClick={() => setTagEditing(null)}
                            className="px-3 py-1 rounded text-xs"
                            style={{ color: "var(--color-text-muted)", background: "none", border: "none", cursor: "pointer" }}>
                      {t("dash.cancel", lang)}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-1 gap-4 items-center min-w-0">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{tag.label_es}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{tag.label_en}</span>
                  </div>
                  <button onClick={() => startTagEdit(tag)}
                          className="shrink-0 w-6 h-6 rounded flex items-center justify-center"
                          style={{ background: "rgba(96,165,250,0.1)", color: "#60a5fa", border: "1px solid rgba(96,165,250,0.2)", cursor: "pointer" }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                </div>
              )}

              {/* Active toggle */}
              <button
                onClick={() => toggleTagActive(tag.key, !tag.active)}
                disabled={tagSaving === tag.key}
                title={tag.active ? t("dash.content.deactivate", lang) : t("dash.content.activate", lang)}
                className="shrink-0 px-2.5 py-1 rounded text-xs transition-colors"
                style={{
                  fontWeight: 510, border: "1px solid var(--color-border-std)", cursor: "pointer",
                  background: tag.active ? "rgba(39,166,68,0.1)" : "var(--color-bg-card-elev)",
                  color: tag.active ? "#27a644" : "var(--color-text-faint)",
                }}>
                {tag.active ? t("dash.content.active", lang) : t("dash.content.inactive", lang)}
              </button>
              {/* Delete */}
              <button onClick={() => deletingTagKey === tag.key ? deleteTag(tag.key) : setDeletingTagKey(tag.key)}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="shrink-0 w-6 h-6 rounded flex items-center justify-center transition-colors"
                      style={{ cursor: "pointer", background: deletingTagKey === tag.key ? "#dc2626" : "rgba(239,68,68,0.08)", color: deletingTagKey === tag.key ? "white" : "#f87171", border: `1px solid ${deletingTagKey === tag.key ? "#dc2626" : "rgba(239,68,68,0.15)"}` }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </button>
            </div>
          ))}
          {addingTag ? (
            <form onSubmit={submitNewTag} className="rounded-card px-4 py-3 edit-row-enter"
                  style={{ background: "var(--color-bg-card)", border: "1px solid rgba(96,165,250,0.25)" }}>
              {newTagErr && <p className="text-xs mb-2" style={{ color: "#f87171" }}>{newTagErr}</p>}
              <div className="flex gap-3 flex-wrap items-end">
                <div>
                  <label className="block text-[10px] mb-1 uppercase tracking-wider" style={{ color: "var(--color-text-faint)", fontWeight: 510 }}>{t("dash.content.add.key", lang)}</label>
                  <input value={newTag.key} onChange={(e) => setNewTag((p) => ({ ...p, key: e.target.value }))}
                         placeholder={t("dash.content.add.keyHint", lang)} required autoFocus
                         className="px-2 py-1 rounded text-sm outline-none w-28" style={fs} />
                </div>
                <div className="flex-1 min-w-32">
                  <label className="block text-[10px] mb-1 uppercase tracking-wider" style={{ color: "var(--color-text-faint)", fontWeight: 510 }}>{t("dash.content.add.labelEs", lang)}</label>
                  <input value={newTag.label_es} onChange={(e) => setNewTag((p) => ({ ...p, label_es: e.target.value }))}
                         required className="w-full px-2 py-1 rounded text-sm outline-none" style={fs} />
                </div>
                <div className="flex-1 min-w-32">
                  <label className="block text-[10px] mb-1 uppercase tracking-wider" style={{ color: "var(--color-text-faint)", fontWeight: 510 }}>{t("dash.content.add.labelEn", lang)}</label>
                  <input value={newTag.label_en} onChange={(e) => setNewTag((p) => ({ ...p, label_en: e.target.value }))}
                         required className="w-full px-2 py-1 rounded text-sm outline-none" style={fs} />
                </div>
                <div className="flex gap-1 shrink-0">
                  <button type="submit" disabled={newTagSaving}
                          className="px-3 py-1 rounded text-xs text-white"
                          style={{ background: "var(--color-brand)", fontWeight: 510, border: "none", cursor: "pointer" }}>
                    {newTagSaving ? "…" : t("dash.save", lang)}
                  </button>
                  <button type="button" onClick={() => { setAddingTag(false); setNewTag(emptyNew); setNewTagErr(""); }}
                          className="px-3 py-1 rounded text-xs"
                          style={{ color: "var(--color-text-muted)", background: "none", border: "none", cursor: "pointer" }}>
                    {t("dash.cancel", lang)}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <button onClick={() => { setAddingTag(true); setNewTagErr(""); }}
                    className="w-full py-2 rounded-card text-xs transition-colors"
                    style={{ fontWeight: 510, border: "1px dashed rgba(96,165,250,0.25)", cursor: "pointer", background: "transparent", color: "#60a5fa" }}>
              {t("dash.content.addNew", lang)}
            </button>
          )}
        </div>
      )}

      {/* Families section */}
      {tab === "families" && (
        <div className="space-y-2">
          {families.length > 0 && (
            <div className="flex justify-end gap-2">
              <button onClick={() => toggleAllFamilies(true)} disabled={famBulkSaving || families.every((f) => f.active)}
                      className="px-3 py-1 rounded text-xs transition-colors"
                      style={{ fontWeight: 510, border: "1px solid var(--color-border-std)", cursor: "pointer", background: "rgba(39,166,68,0.08)", color: "#27a644", opacity: families.every((f) => f.active) ? 0.4 : 1 }}>
                {t("dash.content.activateAll", lang)}
              </button>
              <button onClick={() => toggleAllFamilies(false)} disabled={famBulkSaving || families.every((f) => !f.active)}
                      className="px-3 py-1 rounded text-xs transition-colors"
                      style={{ fontWeight: 510, border: "1px solid var(--color-border-std)", cursor: "pointer", background: "var(--color-bg-card-elev)", color: "var(--color-text-secondary)", opacity: families.every((f) => !f.active) ? 0.4 : 1 }}>
                {t("dash.content.deactivateAll", lang)}
              </button>
            </div>
          )}
          {families.length > 0 && (
            <div className="flex items-center gap-4 px-4 pb-0.5">
              <span className="text-[10px] uppercase tracking-wider w-28 shrink-0" style={{ color: "var(--color-text-faint)", fontWeight: 510 }}>Clave</span>
              <div className="flex flex-1 gap-4 items-center min-w-0">
                <span className="flex-1 text-[10px] uppercase tracking-wider" style={{ color: "var(--color-text-faint)", fontWeight: 510 }}>Español</span>
                <span className="flex-1 text-[10px] uppercase tracking-wider" style={{ color: "var(--color-text-faint)", fontWeight: 510 }}>Inglés</span>
                <div className="w-6 shrink-0" />
              </div>
              <span className="invisible shrink-0 px-2.5 py-1 text-xs select-none">Activo</span>
            </div>
          )}
          {families.length === 0 && (
            <p className="text-sm py-8 text-center" style={{ color: "var(--color-text-faint)" }}>{t("dash.content.empty.families", lang)}</p>
          )}
          {families.map((fam) => (
            <div key={fam.key} className="rounded-card px-4 py-3 flex items-center gap-4"
                 style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border-std)", opacity: fam.active ? 1 : 0.5 }}>
              <code className="text-xs font-mono w-28 shrink-0" style={{ color: "var(--color-accent)" }}>{fam.key}</code>
              {famEditing === fam.key ? (
                <div className="flex flex-1 gap-2 items-center min-w-0 edit-row-enter">
                  <div className="flex-1 min-w-0">
                    <span className="block text-[10px] mb-1" style={{ color: "var(--color-text-faint)", fontWeight: 510 }}>ES</span>
                    <input value={famEdit.label_es} onChange={(e) => setFamEdit((p) => ({ ...p, label_es: e.target.value }))}
                           autoFocus className="w-full px-2 py-1 rounded text-sm outline-none" style={fs} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-[10px] mb-1" style={{ color: "var(--color-text-faint)", fontWeight: 510 }}>EN</span>
                    <input value={famEdit.label_en} onChange={(e) => setFamEdit((p) => ({ ...p, label_en: e.target.value }))}
                           className="w-full px-2 py-1 rounded text-sm outline-none" style={fs} />
                  </div>
                  <div className="flex gap-1 mt-4 shrink-0">
                    <button onClick={() => saveFamEdit(fam.key)} disabled={famSaving === fam.key}
                            className="px-3 py-1 rounded text-xs text-white"
                            style={{ background: "var(--color-brand)", fontWeight: 510, border: "none", cursor: "pointer" }}>
                      {famSaving === fam.key ? "…" : t("dash.save", lang)}
                    </button>
                    <button onClick={() => setFamEditing(null)}
                            className="px-3 py-1 rounded text-xs"
                            style={{ color: "var(--color-text-muted)", background: "none", border: "none", cursor: "pointer" }}>
                      {t("dash.cancel", lang)}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-1 gap-4 items-center min-w-0">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{fam.label_es}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{fam.label_en}</span>
                  </div>
                  <button onClick={() => startFamEdit(fam)}
                          className="shrink-0 w-6 h-6 rounded flex items-center justify-center"
                          style={{ background: "rgba(96,165,250,0.1)", color: "#60a5fa", border: "1px solid rgba(96,165,250,0.2)", cursor: "pointer" }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                </div>
              )}
              <button
                onClick={() => toggleFamActive(fam.key, !fam.active)}
                disabled={famSaving === fam.key}
                title={fam.active ? t("dash.content.deactivate", lang) : t("dash.content.activate", lang)}
                className="shrink-0 px-2.5 py-1 rounded text-xs transition-colors"
                style={{
                  fontWeight: 510, border: "1px solid var(--color-border-std)", cursor: "pointer",
                  background: fam.active ? "rgba(39,166,68,0.1)" : "var(--color-bg-card-elev)",
                  color: fam.active ? "#27a644" : "var(--color-text-faint)",
                }}>
                {fam.active ? t("dash.content.active", lang) : t("dash.content.inactive", lang)}
              </button>
              <button onClick={() => deletingFamKey === fam.key ? deleteFam(fam.key) : setDeletingFamKey(fam.key)}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="shrink-0 w-6 h-6 rounded flex items-center justify-center transition-colors"
                      style={{ cursor: "pointer", background: deletingFamKey === fam.key ? "#dc2626" : "rgba(239,68,68,0.08)", color: deletingFamKey === fam.key ? "white" : "#f87171", border: `1px solid ${deletingFamKey === fam.key ? "#dc2626" : "rgba(239,68,68,0.15)"}` }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </button>
            </div>
          ))}
          {addingFam ? (
            <form onSubmit={submitNewFam} className="rounded-card px-4 py-3 edit-row-enter"
                  style={{ background: "var(--color-bg-card)", border: "1px solid rgba(96,165,250,0.25)" }}>
              {newFamErr && <p className="text-xs mb-2" style={{ color: "#f87171" }}>{newFamErr}</p>}
              <div className="flex gap-3 flex-wrap items-end">
                <div>
                  <label className="block text-[10px] mb-1 uppercase tracking-wider" style={{ color: "var(--color-text-faint)", fontWeight: 510 }}>{t("dash.content.add.key", lang)}</label>
                  <input value={newFam.key} onChange={(e) => setNewFam((p) => ({ ...p, key: e.target.value }))}
                         placeholder={t("dash.content.add.keyHint", lang)} required autoFocus
                         className="px-2 py-1 rounded text-sm outline-none w-28" style={fs} />
                </div>
                <div className="flex-1 min-w-32">
                  <label className="block text-[10px] mb-1 uppercase tracking-wider" style={{ color: "var(--color-text-faint)", fontWeight: 510 }}>{t("dash.content.add.labelEs", lang)}</label>
                  <input value={newFam.label_es} onChange={(e) => setNewFam((p) => ({ ...p, label_es: e.target.value }))}
                         required className="w-full px-2 py-1 rounded text-sm outline-none" style={fs} />
                </div>
                <div className="flex-1 min-w-32">
                  <label className="block text-[10px] mb-1 uppercase tracking-wider" style={{ color: "var(--color-text-faint)", fontWeight: 510 }}>{t("dash.content.add.labelEn", lang)}</label>
                  <input value={newFam.label_en} onChange={(e) => setNewFam((p) => ({ ...p, label_en: e.target.value }))}
                         required className="w-full px-2 py-1 rounded text-sm outline-none" style={fs} />
                </div>
                <div className="flex gap-1 shrink-0">
                  <button type="submit" disabled={newFamSaving}
                          className="px-3 py-1 rounded text-xs text-white"
                          style={{ background: "var(--color-brand)", fontWeight: 510, border: "none", cursor: "pointer" }}>
                    {newFamSaving ? "…" : t("dash.save", lang)}
                  </button>
                  <button type="button" onClick={() => { setAddingFam(false); setNewFam(emptyNew); setNewFamErr(""); }}
                          className="px-3 py-1 rounded text-xs"
                          style={{ color: "var(--color-text-muted)", background: "none", border: "none", cursor: "pointer" }}>
                    {t("dash.cancel", lang)}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <button onClick={() => { setAddingFam(true); setNewFamErr(""); }}
                    className="w-full py-2 rounded-card text-xs transition-colors"
                    style={{ fontWeight: 510, border: "1px dashed rgba(96,165,250,0.25)", cursor: "pointer", background: "transparent", color: "#60a5fa" }}>
              {t("dash.content.addNew", lang)}
            </button>
          )}
        </div>
      )}

      {/* Climates section */}
      {tab === "climates" && (
        <div className="space-y-2">
          {climates.length > 0 && (
            <div className="flex justify-end gap-2">
              <button onClick={() => toggleAllClimates(true)} disabled={climBulkSaving || climates.every((c) => c.active)}
                      className="px-3 py-1 rounded text-xs transition-colors"
                      style={{ fontWeight: 510, border: "1px solid var(--color-border-std)", cursor: "pointer", background: "rgba(39,166,68,0.08)", color: "#27a644", opacity: climates.every((c) => c.active) ? 0.4 : 1 }}>
                {t("dash.content.activateAll", lang)}
              </button>
              <button onClick={() => toggleAllClimates(false)} disabled={climBulkSaving || climates.every((c) => !c.active)}
                      className="px-3 py-1 rounded text-xs transition-colors"
                      style={{ fontWeight: 510, border: "1px solid var(--color-border-std)", cursor: "pointer", background: "var(--color-bg-card-elev)", color: "var(--color-text-secondary)", opacity: climates.every((c) => !c.active) ? 0.4 : 1 }}>
                {t("dash.content.deactivateAll", lang)}
              </button>
            </div>
          )}
          {climates.length > 0 && (
            <div className="flex items-center gap-4 px-4 pb-0.5">
              <span className="text-[10px] uppercase tracking-wider w-28 shrink-0" style={{ color: "var(--color-text-faint)", fontWeight: 510 }}>Clave</span>
              <div className="flex flex-1 gap-4 items-center min-w-0">
                <span className="flex-1 text-[10px] uppercase tracking-wider" style={{ color: "var(--color-text-faint)", fontWeight: 510 }}>Español</span>
                <span className="flex-1 text-[10px] uppercase tracking-wider" style={{ color: "var(--color-text-faint)", fontWeight: 510 }}>Inglés</span>
                <div className="w-6 shrink-0" />
              </div>
              <span className="invisible shrink-0 px-2.5 py-1 text-xs select-none">Activo</span>
            </div>
          )}
          {climates.length === 0 && (
            <p className="text-sm py-8 text-center" style={{ color: "var(--color-text-faint)" }}>{t("dash.content.empty.climates", lang)}</p>
          )}
          {climates.map((clim) => (
            <div key={clim.key} className="rounded-card px-4 py-3 flex items-center gap-4"
                 style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border-std)", opacity: clim.active ? 1 : 0.5 }}>
              <code className="text-xs font-mono w-28 shrink-0" style={{ color: "var(--color-accent)" }}>{clim.key}</code>
              {climEditing === clim.key ? (
                <div className="flex flex-1 gap-2 items-center min-w-0 edit-row-enter">
                  <div className="flex-1 min-w-0">
                    <span className="block text-[10px] mb-1" style={{ color: "var(--color-text-faint)", fontWeight: 510 }}>ES</span>
                    <input value={climEdit.label_es} onChange={(e) => setClimEdit((p) => ({ ...p, label_es: e.target.value }))}
                           autoFocus className="w-full px-2 py-1 rounded text-sm outline-none" style={fs} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-[10px] mb-1" style={{ color: "var(--color-text-faint)", fontWeight: 510 }}>EN</span>
                    <input value={climEdit.label_en} onChange={(e) => setClimEdit((p) => ({ ...p, label_en: e.target.value }))}
                           className="w-full px-2 py-1 rounded text-sm outline-none" style={fs} />
                  </div>
                  <div className="flex gap-1 mt-4 shrink-0">
                    <button onClick={() => saveClimEdit(clim.key)} disabled={climSaving === clim.key}
                            className="px-3 py-1 rounded text-xs text-white"
                            style={{ background: "var(--color-brand)", fontWeight: 510, border: "none", cursor: "pointer" }}>
                      {climSaving === clim.key ? "…" : t("dash.save", lang)}
                    </button>
                    <button onClick={() => setClimEditing(null)}
                            className="px-3 py-1 rounded text-xs"
                            style={{ color: "var(--color-text-muted)", background: "none", border: "none", cursor: "pointer" }}>
                      {t("dash.cancel", lang)}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-1 gap-4 items-center min-w-0">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{clim.label_es}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{clim.label_en}</span>
                  </div>
                  <button onClick={() => startClimEdit(clim)}
                          className="shrink-0 w-6 h-6 rounded flex items-center justify-center"
                          style={{ background: "rgba(96,165,250,0.1)", color: "#60a5fa", border: "1px solid rgba(96,165,250,0.2)", cursor: "pointer" }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                </div>
              )}
              <button
                onClick={() => toggleClimActive(clim.key, !clim.active)}
                disabled={climSaving === clim.key}
                title={clim.active ? t("dash.content.deactivate", lang) : t("dash.content.activate", lang)}
                className="shrink-0 px-2.5 py-1 rounded text-xs transition-colors"
                style={{
                  fontWeight: 510, border: "1px solid var(--color-border-std)", cursor: "pointer",
                  background: clim.active ? "rgba(39,166,68,0.1)" : "var(--color-bg-card-elev)",
                  color: clim.active ? "#27a644" : "var(--color-text-faint)",
                }}>
                {clim.active ? t("dash.content.active", lang) : t("dash.content.inactive", lang)}
              </button>
              <button onClick={() => deletingClimKey === clim.key ? deleteClim(clim.key) : setDeletingClimKey(clim.key)}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="shrink-0 w-6 h-6 rounded flex items-center justify-center transition-colors"
                      style={{ cursor: "pointer", background: deletingClimKey === clim.key ? "#dc2626" : "rgba(239,68,68,0.08)", color: deletingClimKey === clim.key ? "white" : "#f87171", border: `1px solid ${deletingClimKey === clim.key ? "#dc2626" : "rgba(239,68,68,0.15)"}` }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </button>
            </div>
          ))}
          {addingClim ? (
            <form onSubmit={submitNewClim} className="rounded-card px-4 py-3 edit-row-enter"
                  style={{ background: "var(--color-bg-card)", border: "1px solid rgba(96,165,250,0.25)" }}>
              {newClimErr && <p className="text-xs mb-2" style={{ color: "#f87171" }}>{newClimErr}</p>}
              <div className="flex gap-3 flex-wrap items-end">
                <div>
                  <label className="block text-[10px] mb-1 uppercase tracking-wider" style={{ color: "var(--color-text-faint)", fontWeight: 510 }}>{t("dash.content.add.key", lang)}</label>
                  <input value={newClim.key} onChange={(e) => setNewClim((p) => ({ ...p, key: e.target.value }))}
                         placeholder={t("dash.content.add.keyHint", lang)} required autoFocus
                         className="px-2 py-1 rounded text-sm outline-none w-28" style={fs} />
                </div>
                <div className="flex-1 min-w-32">
                  <label className="block text-[10px] mb-1 uppercase tracking-wider" style={{ color: "var(--color-text-faint)", fontWeight: 510 }}>{t("dash.content.add.labelEs", lang)}</label>
                  <input value={newClim.label_es} onChange={(e) => setNewClim((p) => ({ ...p, label_es: e.target.value }))}
                         required className="w-full px-2 py-1 rounded text-sm outline-none" style={fs} />
                </div>
                <div className="flex-1 min-w-32">
                  <label className="block text-[10px] mb-1 uppercase tracking-wider" style={{ color: "var(--color-text-faint)", fontWeight: 510 }}>{t("dash.content.add.labelEn", lang)}</label>
                  <input value={newClim.label_en} onChange={(e) => setNewClim((p) => ({ ...p, label_en: e.target.value }))}
                         required className="w-full px-2 py-1 rounded text-sm outline-none" style={fs} />
                </div>
                <div className="flex gap-1 shrink-0">
                  <button type="submit" disabled={newClimSaving}
                          className="px-3 py-1 rounded text-xs text-white"
                          style={{ background: "var(--color-brand)", fontWeight: 510, border: "none", cursor: "pointer" }}>
                    {newClimSaving ? "…" : t("dash.save", lang)}
                  </button>
                  <button type="button" onClick={() => { setAddingClim(false); setNewClim(emptyNew); setNewClimErr(""); }}
                          className="px-3 py-1 rounded text-xs"
                          style={{ color: "var(--color-text-muted)", background: "none", border: "none", cursor: "pointer" }}>
                    {t("dash.cancel", lang)}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <button onClick={() => { setAddingClim(true); setNewClimErr(""); }}
                    className="w-full py-2 rounded-card text-xs transition-colors"
                    style={{ fontWeight: 510, border: "1px dashed rgba(96,165,250,0.25)", cursor: "pointer", background: "transparent", color: "#60a5fa" }}>
              {t("dash.content.addNew", lang)}
            </button>
          )}
        </div>
      )}

      {/* Durations section */}
      {tab === "durations" && (
        <div className="space-y-2">
          {durations.length > 0 && (
            <div className="flex justify-end gap-2">
              <button onClick={() => toggleAllDurations(true)} disabled={durBulkSaving || durations.every((d) => d.active)}
                      className="px-3 py-1 rounded text-xs transition-colors"
                      style={{ fontWeight: 510, border: "1px solid var(--color-border-std)", cursor: "pointer", background: "rgba(39,166,68,0.08)", color: "#27a644", opacity: durations.every((d) => d.active) ? 0.4 : 1 }}>
                {t("dash.content.activateAll", lang)}
              </button>
              <button onClick={() => toggleAllDurations(false)} disabled={durBulkSaving || durations.every((d) => !d.active)}
                      className="px-3 py-1 rounded text-xs transition-colors"
                      style={{ fontWeight: 510, border: "1px solid var(--color-border-std)", cursor: "pointer", background: "var(--color-bg-card-elev)", color: "var(--color-text-secondary)", opacity: durations.every((d) => !d.active) ? 0.4 : 1 }}>
                {t("dash.content.deactivateAll", lang)}
              </button>
            </div>
          )}
          {durations.length > 0 && (
            <div className="flex items-center gap-4 px-4 pb-0.5">
              <span className="text-[10px] uppercase tracking-wider w-28 shrink-0" style={{ color: "var(--color-text-faint)", fontWeight: 510 }}>Clave</span>
              <div className="flex flex-1 gap-4 items-center min-w-0">
                <span className="flex-1 text-[10px] uppercase tracking-wider" style={{ color: "var(--color-text-faint)", fontWeight: 510 }}>Español</span>
                <span className="flex-1 text-[10px] uppercase tracking-wider" style={{ color: "var(--color-text-faint)", fontWeight: 510 }}>Inglés</span>
                <div className="w-6 shrink-0" />
              </div>
              <span className="invisible shrink-0 px-2.5 py-1 text-xs select-none">Activo</span>
            </div>
          )}
          {durations.length === 0 && (
            <p className="text-sm py-8 text-center" style={{ color: "var(--color-text-faint)" }}>{t("dash.content.empty.durations", lang)}</p>
          )}
          {durations.map((dur) => (
            <div key={dur.key} className="rounded-card px-4 py-3 flex items-center gap-4"
                 style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border-std)", opacity: dur.active ? 1 : 0.5 }}>
              <code className="text-xs font-mono w-28 shrink-0" style={{ color: "var(--color-accent)" }}>{dur.key}</code>
              {durEditing === dur.key ? (
                <div className="flex flex-1 gap-2 items-center min-w-0 edit-row-enter">
                  <div className="flex-1 min-w-0">
                    <span className="block text-[10px] mb-1" style={{ color: "var(--color-text-faint)", fontWeight: 510 }}>ES</span>
                    <input value={durEdit.label_es} onChange={(e) => setDurEdit((p) => ({ ...p, label_es: e.target.value }))}
                           autoFocus className="w-full px-2 py-1 rounded text-sm outline-none" style={fs} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-[10px] mb-1" style={{ color: "var(--color-text-faint)", fontWeight: 510 }}>EN</span>
                    <input value={durEdit.label_en} onChange={(e) => setDurEdit((p) => ({ ...p, label_en: e.target.value }))}
                           className="w-full px-2 py-1 rounded text-sm outline-none" style={fs} />
                  </div>
                  <div className="flex gap-1 mt-4 shrink-0">
                    <button onClick={() => saveDurEdit(dur.key)} disabled={durSaving === dur.key}
                            className="px-3 py-1 rounded text-xs text-white"
                            style={{ background: "var(--color-brand)", fontWeight: 510, border: "none", cursor: "pointer" }}>
                      {durSaving === dur.key ? "…" : t("dash.save", lang)}
                    </button>
                    <button onClick={() => setDurEditing(null)}
                            className="px-3 py-1 rounded text-xs"
                            style={{ color: "var(--color-text-muted)", background: "none", border: "none", cursor: "pointer" }}>
                      {t("dash.cancel", lang)}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-1 gap-4 items-center min-w-0">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{dur.label_es}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{dur.label_en}</span>
                  </div>
                  <button onClick={() => startDurEdit(dur)}
                          className="shrink-0 w-6 h-6 rounded flex items-center justify-center"
                          style={{ background: "rgba(96,165,250,0.1)", color: "#60a5fa", border: "1px solid rgba(96,165,250,0.2)", cursor: "pointer" }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                </div>
              )}
              <button
                onClick={() => toggleDurActive(dur.key, !dur.active)}
                disabled={durSaving === dur.key}
                title={dur.active ? t("dash.content.deactivate", lang) : t("dash.content.activate", lang)}
                className="shrink-0 px-2.5 py-1 rounded text-xs transition-colors"
                style={{
                  fontWeight: 510, border: "1px solid var(--color-border-std)", cursor: "pointer",
                  background: dur.active ? "rgba(39,166,68,0.1)" : "var(--color-bg-card-elev)",
                  color: dur.active ? "#27a644" : "var(--color-text-faint)",
                }}>
                {dur.active ? t("dash.content.active", lang) : t("dash.content.inactive", lang)}
              </button>
              <button onClick={() => deletingDurKey === dur.key ? deleteDur(dur.key) : setDeletingDurKey(dur.key)}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="shrink-0 w-6 h-6 rounded flex items-center justify-center transition-colors"
                      style={{ cursor: "pointer", background: deletingDurKey === dur.key ? "#dc2626" : "rgba(239,68,68,0.08)", color: deletingDurKey === dur.key ? "white" : "#f87171", border: `1px solid ${deletingDurKey === dur.key ? "#dc2626" : "rgba(239,68,68,0.15)"}` }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </button>
            </div>
          ))}
          {addingDur ? (
            <form onSubmit={submitNewDur} className="rounded-card px-4 py-3 edit-row-enter"
                  style={{ background: "var(--color-bg-card)", border: "1px solid rgba(96,165,250,0.25)" }}>
              {newDurErr && <p className="text-xs mb-2" style={{ color: "#f87171" }}>{newDurErr}</p>}
              <div className="flex gap-3 flex-wrap items-end">
                <div>
                  <label className="block text-[10px] mb-1 uppercase tracking-wider" style={{ color: "var(--color-text-faint)", fontWeight: 510 }}>{t("dash.content.add.key", lang)}</label>
                  <input value={newDur.key} onChange={(e) => setNewDur((p) => ({ ...p, key: e.target.value }))}
                         placeholder={t("dash.content.add.keyHint", lang)} required autoFocus
                         className="px-2 py-1 rounded text-sm outline-none w-28" style={fs} />
                </div>
                <div className="flex-1 min-w-32">
                  <label className="block text-[10px] mb-1 uppercase tracking-wider" style={{ color: "var(--color-text-faint)", fontWeight: 510 }}>{t("dash.content.add.labelEs", lang)}</label>
                  <input value={newDur.label_es} onChange={(e) => setNewDur((p) => ({ ...p, label_es: e.target.value }))}
                         required className="w-full px-2 py-1 rounded text-sm outline-none" style={fs} />
                </div>
                <div className="flex-1 min-w-32">
                  <label className="block text-[10px] mb-1 uppercase tracking-wider" style={{ color: "var(--color-text-faint)", fontWeight: 510 }}>{t("dash.content.add.labelEn", lang)}</label>
                  <input value={newDur.label_en} onChange={(e) => setNewDur((p) => ({ ...p, label_en: e.target.value }))}
                         required className="w-full px-2 py-1 rounded text-sm outline-none" style={fs} />
                </div>
                <div className="flex gap-1 shrink-0">
                  <button type="submit" disabled={newDurSaving}
                          className="px-3 py-1 rounded text-xs text-white"
                          style={{ background: "var(--color-brand)", fontWeight: 510, border: "none", cursor: "pointer" }}>
                    {newDurSaving ? "…" : t("dash.save", lang)}
                  </button>
                  <button type="button" onClick={() => { setAddingDur(false); setNewDur(emptyNew); setNewDurErr(""); }}
                          className="px-3 py-1 rounded text-xs"
                          style={{ color: "var(--color-text-muted)", background: "none", border: "none", cursor: "pointer" }}>
                    {t("dash.cancel", lang)}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <button onClick={() => { setAddingDur(true); setNewDurErr(""); }}
                    className="w-full py-2 rounded-card text-xs transition-colors"
                    style={{ fontWeight: 510, border: "1px dashed rgba(96,165,250,0.25)", cursor: "pointer", background: "transparent", color: "#60a5fa" }}>
              {t("dash.content.addNew", lang)}
            </button>
          )}
        </div>
      )}

      {/* Content section */}
      {tab === "content" && <>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <input type="text" value={filterKey} onChange={(e) => setFilterKey(e.target.value)}
               placeholder={t("dash.content.filterKey", lang)}
               className="px-3 py-1.5 rounded text-xs outline-none w-48" style={fs} />
        <select value={filterLang} onChange={(e) => setFilterLang(e.target.value)}
                className="px-3 py-1.5 rounded text-xs outline-none appearance-none cursor-pointer" style={fs}>
          <option value="all">{t("dash.content.allLangs", lang)}</option>
          {langs.map((l) => (
            <option key={l} value={l} style={{ background: "var(--color-bg-surface)", color: "var(--color-text-primary)" }}>{l}</option>
          ))}
        </select>
        <div className="flex-1" />
        <button onClick={() => setAddingNew(true)} className="px-3 py-1.5 rounded text-xs text-white"
                style={{ background: "var(--color-brand)", fontWeight: 510 }}>
          {t("dash.content.newEntry", lang)}
        </button>
      </div>

      {/* New entry form */}
      {addingNew && (
        <div className="p-4 rounded-card"
             style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border-std)" }}>
          {newError && <p className="text-xs mb-2" style={{ color: "#f87171" }}>{newError}</p>}
          <form onSubmit={saveNew} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs mb-1" style={{ fontWeight: 510, color: "var(--color-text-faint)" }}>{t("dash.content.field.key", lang)}</label>
              <input type="text" value={newKey} onChange={(e) => setNewKey(e.target.value)}
                     placeholder="home.hero.title" required
                     className="w-full px-3 py-2 rounded text-sm outline-none" style={fs} />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ fontWeight: 510, color: "var(--color-text-faint)" }}>{t("dash.content.field.lang", lang)}</label>
              <input type="text" value={newLang} onChange={(e) => setNewLang(e.target.value)}
                     placeholder="es" required
                     className="w-full px-3 py-2 rounded text-sm outline-none" style={fs} />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ fontWeight: 510, color: "var(--color-text-faint)" }}>{t("dash.content.field.value", lang)}</label>
              <input type="text" value={newValue} onChange={(e) => setNewValue(e.target.value)}
                     required className="w-full px-3 py-2 rounded text-sm outline-none" style={fs} />
            </div>
            <div className="sm:col-span-3 flex gap-2">
              <button type="submit" disabled={savingId === "new"} className="px-4 py-1.5 rounded text-xs text-white"
                      style={{ background: "var(--color-brand)", fontWeight: 510 }}>
                {savingId === "new" ? t("dash.saving", lang) : t("dash.save", lang)}
              </button>
              <button type="button" onClick={() => { setAddingNew(false); setNewError(""); }}
                      className="px-4 py-1.5 rounded text-xs transition-colors"
                      style={{ fontWeight: 510, color: "var(--color-text-muted)" }}>
                {t("dash.cancel", lang)}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Entries */}
      {Object.keys(grouped).length === 0 ? (
        <p className="text-sm py-8 text-center" style={{ fontWeight: 510, color: "var(--color-text-faint)" }}>{t("dash.content.empty.entries", lang)}</p>
      ) : (
        <div className="space-y-2">
          {Object.entries(grouped).map(([key, keyEntries]) => (
            <div key={key} className="rounded-card overflow-hidden"
                 style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border-std)" }}>
              <div className="px-4 py-2"
                   style={{ borderBottom: "1px solid var(--color-border-subtle)", background: "var(--color-bg-card-elev)" }}>
                <code className="text-xs font-mono" style={{ color: "#52b788" }}>{key}</code>
              </div>
              <div className="divide-y" style={{ borderColor: "var(--color-border-subtle)" }}>
                {keyEntries.map((entry) => (
                  <div key={entry.id} className="px-4 py-3 flex items-start gap-3">
                    <span className="shrink-0 mt-0.5 px-1.5 py-0.5 rounded-micro text-[10px] uppercase tracking-wider"
                          style={{ background: "var(--color-bg-card-elev)", color: "var(--color-text-faint)", fontWeight: 510 }}>
                      {entry.lang}
                    </span>
                    <div className="flex-1 min-w-0">
                      {editingId === entry.id ? (
                        <div className="space-y-2">
                          <textarea value={editValue} onChange={(e) => setEditValue(e.target.value)}
                                    rows={2} autoFocus
                                    className="w-full px-3 py-2 rounded text-sm outline-none resize-none" style={fs} />
                          <div className="flex gap-2">
                            <button onClick={() => saveEdit(entry.id)} disabled={savingId === entry.id}
                                    className="px-3 py-1 rounded text-xs text-white"
                                    style={{ background: "var(--color-brand)", fontWeight: 510 }}>
                              {savingId === entry.id ? t("dash.saving", lang) : t("dash.save", lang)}
                            </button>
                            <button onClick={() => setEditingId(null)}
                                    className="px-3 py-1 rounded text-xs transition-colors"
                                    style={{ fontWeight: 510, color: "var(--color-text-muted)" }}>
                              {t("dash.cancel", lang)}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm cursor-pointer transition-colors"
                           style={{ color: "var(--color-text-secondary)" }}
                           onClick={() => startEdit(entry)} title={t("dash.content.clickEdit", lang)}>
                          {entry.value}
                        </p>
                      )}
                    </div>
                    {editingId !== entry.id && (
                      <button onClick={() => startEdit(entry)}
                              onMouseDown={(e) => e.stopPropagation()}
                      className="shrink-0 w-6 h-6 rounded flex items-center justify-center transition-colors"
                              style={{ background: "var(--color-bg-card-elev)", color: "var(--color-text-faint)" }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      </>}
    </div>
  );
}
