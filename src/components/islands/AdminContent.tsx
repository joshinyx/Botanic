import { useState, useCallback } from "react";
import type { ContentEntry } from "@/types";

interface Props {
  initialEntries: ContentEntry[];
  langs: string[];
}

const fs: React.CSSProperties = {
  background: "var(--color-bg-card-elev)",
  border: "1px solid var(--color-border-std)",
  color: "var(--color-text-primary)",
  fontFeatureSettings: "'cv01','ss03'",
};

export default function AdminContent({ initialEntries, langs }: Props) {
  const [entries, setEntries] = useState<ContentEntry[]>(initialEntries);
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
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <input type="text" value={filterKey} onChange={(e) => setFilterKey(e.target.value)}
               placeholder="Filter by key…"
               className="px-3 py-1.5 rounded text-xs outline-none w-48" style={fs} />
        <select value={filterLang} onChange={(e) => setFilterLang(e.target.value)}
                className="px-3 py-1.5 rounded text-xs outline-none appearance-none cursor-pointer" style={fs}>
          <option value="all">All languages</option>
          {langs.map((l) => (
            <option key={l} value={l} style={{ background: "var(--color-bg-surface)", color: "var(--color-text-primary)" }}>{l}</option>
          ))}
        </select>
        <div className="flex-1" />
        <button onClick={() => setAddingNew(true)} className="px-3 py-1.5 rounded text-xs text-white"
                style={{ background: "var(--color-brand)", fontWeight: 510 }}>
          + New entry
        </button>
      </div>

      {/* New entry form */}
      {addingNew && (
        <div className="p-4 rounded-card"
             style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border-std)" }}>
          {newError && <p className="text-xs mb-2" style={{ color: "#f87171" }}>{newError}</p>}
          <form onSubmit={saveNew} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs mb-1" style={{ fontWeight: 510, color: "var(--color-text-faint)" }}>Key</label>
              <input type="text" value={newKey} onChange={(e) => setNewKey(e.target.value)}
                     placeholder="home.hero.title" required
                     className="w-full px-3 py-2 rounded text-sm outline-none" style={fs} />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ fontWeight: 510, color: "var(--color-text-faint)" }}>Language</label>
              <input type="text" value={newLang} onChange={(e) => setNewLang(e.target.value)}
                     placeholder="es" required
                     className="w-full px-3 py-2 rounded text-sm outline-none" style={fs} />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ fontWeight: 510, color: "var(--color-text-faint)" }}>Value</label>
              <input type="text" value={newValue} onChange={(e) => setNewValue(e.target.value)}
                     required className="w-full px-3 py-2 rounded text-sm outline-none" style={fs} />
            </div>
            <div className="sm:col-span-3 flex gap-2">
              <button type="submit" disabled={savingId === "new"} className="px-4 py-1.5 rounded text-xs text-white"
                      style={{ background: "var(--color-brand)", fontWeight: 510 }}>
                {savingId === "new" ? "Saving…" : "Save"}
              </button>
              <button type="button" onClick={() => { setAddingNew(false); setNewError(""); }}
                      className="px-4 py-1.5 rounded text-xs transition-colors"
                      style={{ fontWeight: 510, color: "var(--color-text-muted)" }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Entries */}
      {Object.keys(grouped).length === 0 ? (
        <p className="text-sm py-8 text-center" style={{ fontWeight: 510, color: "var(--color-text-faint)" }}>No entries found</p>
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
                              {savingId === entry.id ? "Saving…" : "Save"}
                            </button>
                            <button onClick={() => setEditingId(null)}
                                    className="px-3 py-1 rounded text-xs transition-colors"
                                    style={{ fontWeight: 510, color: "var(--color-text-muted)" }}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm cursor-pointer transition-colors"
                           style={{ color: "var(--color-text-secondary)" }}
                           onClick={() => startEdit(entry)} title="Click to edit">
                          {entry.value}
                        </p>
                      )}
                    </div>
                    {editingId !== entry.id && (
                      <button onClick={() => startEdit(entry)}
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
    </div>
  );
}
