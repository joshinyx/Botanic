import { useState, useCallback, useRef, useEffect } from "react";
import { ChevronDownIcon, CheckIcon, UploadIcon } from "lucide-react";
import type { Climate, Duration, PlantTagRow, PlantFamilyRow, PlantClimateRow, PlantDurationRow } from "@/types";
import { t, type Lang } from "@/lib/i18n";

type ActiveItem = Pick<PlantTagRow, "key" | "label_es" | "label_en">;

interface Props {
  lang: Lang;
  activeTags?: ActiveItem[];
  activeFamilies?: ActiveItem[];
  activeClimates?: Pick<PlantClimateRow, "key" | "label_es" | "label_en">[];
  activeDurations?: Pick<PlantDurationRow, "key" | "label_es" | "label_en">[];
}

const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda","Argentina","Armenia","Australia","Austria",
  "Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan",
  "Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso","Burundi","Cabo Verde","Cambodia",
  "Cameroon","Canada","Central African Republic","Chad","Chile","China","Colombia","Comoros","Congo","Costa Rica",
  "Croatia","Cuba","Cyprus","Czech Republic","Denmark","Djibouti","Dominica","Dominican Republic","Ecuador","Egypt",
  "El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia","Fiji","Finland","France","Gabon",
  "Gambia","Georgia","Germany","Ghana","Greece","Grenada","Guatemala","Guinea","Guinea-Bissau","Guyana",
  "Haiti","Honduras","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel",
  "Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kiribati","Kuwait","Kyrgyzstan","Laos",
  "Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","Madagascar","Malawi",
  "Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius","Mexico","Micronesia","Moldova",
  "Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar","Namibia","Nauru","Nepal","Netherlands",
  "New Zealand","Nicaragua","Niger","Nigeria","North Korea","North Macedonia","Norway","Oman","Pakistan","Palau",
  "Palestine","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal","Qatar","Romania",
  "Russia","Rwanda","Saint Kitts and Nevis","Saint Lucia","Saint Vincent and the Grenadines","Samoa","San Marino",
  "Sao Tome and Principe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia",
  "Slovenia","Solomon Islands","Somalia","South Africa","South Korea","South Sudan","Spain","Sri Lanka","Sudan",
  "Suriname","Sweden","Switzerland","Syria","Taiwan","Tajikistan","Tanzania","Thailand","Timor-Leste","Togo",
  "Tonga","Trinidad and Tobago","Tunisia","Turkey","Turkmenistan","Tuvalu","Uganda","Ukraine",
  "United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan","Vanuatu",
  "Vatican City","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe",
];

const CLIMATES: { value: Climate; label: string }[] = [
  { value: "tropical",      label: "Tropical" },
  { value: "arid",          label: "Arid" },
  { value: "temperate",     label: "Temperate" },
  { value: "continental",   label: "Continental" },
  { value: "polar",         label: "Polar" },
  { value: "mediterranean", label: "Mediterranean" },
];

const DURATIONS: { value: Duration; label: string }[] = [
  { value: "annual",    label: "Annual" },
  { value: "biennial",  label: "Biennial" },
  { value: "perennial", label: "Perennial" },
];


// ── Shared styles ──────────────────────────────────────────────────────────

const inputBase: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 6,
  fontSize: 14,
  background: "var(--color-bg-card-hover)",
  color: "var(--color-text-primary)",
  outline: "none",
  fontFeatureSettings: "'cv01','ss03'",
  boxSizing: "border-box",
};

// ── Hook: close on outside click ───────────────────────────────────────────

function useOutsideClose(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function handler(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [open, onClose]);
  return ref;
}

// ── Main component ─────────────────────────────────────────────────────────

export default function PlantSubmitForm({ lang, activeTags = [], activeFamilies = [], activeClimates = [], activeDurations = [] }: Props) {
  const climateOptions = (() => {
    const items = activeClimates.length > 0 ? activeClimates : CLIMATES.map(c => ({ key: c.value, label_es: c.label, label_en: c.label }));
    const unknown = items.find(c => c.key === "unknown");
    const rest = items.filter(c => c.key !== "unknown");
    return [
      ...(unknown ? [{ value: unknown.key as Climate, label: lang === "en" ? unknown.label_en : unknown.label_es, dividerAfter: true }] : []),
      ...rest.map(c => ({ value: c.key as Climate, label: lang === "en" ? c.label_en : c.label_es })),
    ];
  })();

  const durationOptions = (() => {
    const items = activeDurations.length > 0 ? activeDurations : DURATIONS.map(d => ({ key: d.value, label_es: d.label, label_en: d.label }));
    const unknown = items.find(d => d.key === "unknown");
    const rest = items.filter(d => d.key !== "unknown");
    return [
      ...(unknown ? [{ value: unknown.key as Duration, label: lang === "en" ? unknown.label_en : unknown.label_es, dividerAfter: true }] : []),
      ...rest.map(d => ({ value: d.key as Duration, label: lang === "en" ? d.label_en : d.label_es })),
    ];
  })();
  const [name,        setName]        = useState("");
  const [description, setDescription] = useState("");
  const [country,     setCountry]     = useState("");
  const [climate,     setClimate]     = useState<Climate | "">("");
  const [duration,    setDuration]    = useState<Duration | "">("");
  const [family,      setFamily]      = useState("");
  const [tags,        setTags]        = useState<string[]>([]);
  const [imageUrl,    setImageUrl]    = useState("");
  const [flowerUrl,   setFlowerUrl]   = useState("");
  const [loading,       setLoading]       = useState(false);
  const [submitError,   setSubmitError]   = useState("");
  const [errors,        setErrors]        = useState<Record<string, boolean>>({});
  const [uploading,     setUploading]     = useState(false);
  const [uploadError,   setUploadError]   = useState("");
  const [uploadedName,  setUploadedName]  = useState("");
  const [flowerUploading,    setFlowerUploading]    = useState(false);
  const [flowerUploadError,  setFlowerUploadError]  = useState("");
  const [flowerUploadedName, setFlowerUploadedName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const flowerFileInputRef = useRef<HTMLInputElement>(null);

  const requiredMsg = t("form.required", lang);

  const toggleTag = useCallback((tag: string) => {
    setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  }, []);

  const clearError = useCallback((field: string) => {
    setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  }, []);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/plants/upload-image", { method: "POST", body: fd });
      const data = await res.json() as { ok?: boolean; url?: string; error?: string };
      if (!res.ok || !data.url) { setUploadError(data.error ?? "Upload failed"); return; }
      setImageUrl(data.url);
      setUploadedName(file.name);
      clearError("imageUrl");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [clearError]);

  const handleFlowerUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFlowerUploadError("");
    setFlowerUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/plants/upload-image", { method: "POST", body: fd });
      const data = await res.json() as { ok?: boolean; url?: string; error?: string };
      if (!res.ok || !data.url) { setFlowerUploadError(data.error ?? "Upload failed"); return; }
      setFlowerUrl(data.url);
      setFlowerUploadedName(file.name);
      clearError("flowerUrl");
    } finally {
      setFlowerUploading(false);
      if (flowerFileInputRef.current) flowerFileInputRef.current.value = "";
    }
  }, [clearError]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    const newErrors: Record<string, boolean> = {};
    if (!name.trim())         newErrors.name      = true;
    if (!imageUrl.trim())     newErrors.imageUrl  = true;
    if (!flowerUrl.trim())    newErrors.flowerUrl = true;
    if (!country)             newErrors.country   = true;
    if (!climate)             newErrors.climate   = true;
    if (!duration)            newErrors.duration  = true;
    if (activeFamilies.length > 0 && !family) newErrors.family = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/plants/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, origin_country: country, climate, duration, family: family || undefined, tags, image_url: imageUrl, flower_url: flowerUrl || undefined }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) { setSubmitError(data.error ?? "Submission failed"); return; }
      window.location.href = "/";
    } finally {
      setLoading(false);
    }
  }, [name, description, country, climate, duration, family, tags, imageUrl, flowerUrl]);

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5 max-w-xl mx-auto">
      {submitError && (
        <div className="px-3 py-2.5 rounded text-sm"
             style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
          {submitError}
        </div>
      )}

      {/* Name */}
      <F label={t("submit.field.name", lang)} required error={errors.name} errorMsg={requiredMsg}>
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); if (e.target.value.trim()) clearError("name"); }}
          placeholder="e.g. Monstera Deliciosa"
          style={{ ...inputBase, border: `1px solid ${errors.name ? "rgba(248,113,113,0.5)" : "var(--color-border-std)"}` }}
        />
      </F>

      {/* Description (optional) */}
      <F label={t("submit.field.desc", lang)}>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          style={{ ...inputBase, border: "1px solid var(--color-border-std)", resize: "none" }}
        />
      </F>

      {/* Images: flower (left) + plant (right) — side by side */}
      <input ref={flowerFileInputRef} type="file" accept="image/png,image/webp,image/jpeg,image/avif" style={{ display: "none" }} onChange={handleFlowerUpload} />
      <input ref={fileInputRef}       type="file" accept="image/png,image/webp,image/jpeg,image/avif" style={{ display: "none" }} onChange={handleFileUpload} />

      <div className="grid grid-cols-2 gap-3">
        {/* Flower */}
        <F label={t("submit.field.flower", lang)} required error={errors.flowerUrl} errorMsg={requiredMsg}>
          <div style={{ position: "relative" }}>
            {flowerUploadedName ? (
              <div style={{ ...inputBase, paddingRight: 44, border: `1px solid ${errors.flowerUrl ? "rgba(248,113,113,0.5)" : "var(--color-border-std)"}`, display: "flex", alignItems: "center", gap: 8, cursor: "default" }}>
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 13, color: "var(--color-text-secondary)" }}>{flowerUploadedName}</span>
                <button type="button" onClick={() => { setFlowerUrl(""); setFlowerUploadedName(""); }}
                        style={{ flexShrink: 0, background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--color-text-faint)", lineHeight: 1, marginRight: 28 }}
                        title="Remove">✕</button>
              </div>
            ) : (
              <input type="url" value={flowerUrl}
                     onChange={(e) => { setFlowerUrl(e.target.value); if (e.target.value.trim()) clearError("flowerUrl"); }}
                     placeholder="https://…"
                     style={{ ...inputBase, paddingRight: 44, border: `1px solid ${errors.flowerUrl ? "rgba(248,113,113,0.5)" : "var(--color-border-std)"}` }} />
            )}
            <button type="button" disabled={flowerUploading} onClick={() => flowerFileInputRef.current?.click()}
                    title="Subir imagen"
                    style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 5, background: "transparent", color: flowerUploading ? "var(--color-text-faint)" : "var(--color-text-muted)", border: "none", cursor: flowerUploading ? "not-allowed" : "pointer", transition: "background 0.1s, color 0.1s" }}
                    onMouseEnter={(e) => { if (!flowerUploading) { (e.currentTarget as HTMLElement).style.background = "var(--color-bg-card-elev)"; (e.currentTarget as HTMLElement).style.color = "var(--color-text-primary)"; } }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--color-text-muted)"; }}>
              <UploadIcon size={14} />
            </button>
          </div>
          {flowerUploadError && <p style={{ margin: "4px 0 0", fontSize: 11, color: "#f87171" }}>{flowerUploadError}</p>}
          {flowerUrl && (
            <div className="mt-2 rounded-card overflow-hidden" style={{ border: "1px solid var(--color-border-std)" }}>
              <img src={flowerUrl} alt={t("submit.preview", lang)} className="w-full h-28 object-cover"
                   onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            </div>
          )}
        </F>

        {/* Plant */}
        <F label={t("submit.field.image", lang)} required error={errors.imageUrl} errorMsg={requiredMsg}>
          <div style={{ position: "relative" }}>
            {uploadedName ? (
              <div style={{ ...inputBase, paddingRight: 44, border: `1px solid ${errors.imageUrl ? "rgba(248,113,113,0.5)" : "var(--color-border-std)"}`, display: "flex", alignItems: "center", gap: 8, cursor: "default" }}>
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 13, color: "var(--color-text-secondary)" }}>{uploadedName}</span>
                <button type="button" onClick={() => { setImageUrl(""); setUploadedName(""); }}
                        style={{ flexShrink: 0, background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--color-text-faint)", lineHeight: 1, marginRight: 28 }}
                        title="Remove">✕</button>
              </div>
            ) : (
              <input type="url" value={imageUrl}
                     onChange={(e) => { setImageUrl(e.target.value); if (e.target.value.trim()) clearError("imageUrl"); }}
                     placeholder="https://…"
                     style={{ ...inputBase, paddingRight: 44, border: `1px solid ${errors.imageUrl ? "rgba(248,113,113,0.5)" : "var(--color-border-std)"}` }} />
            )}
            <button type="button" disabled={uploading} onClick={() => fileInputRef.current?.click()}
                    title="Subir imagen"
                    style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 5, background: "transparent", color: uploading ? "var(--color-text-faint)" : "var(--color-text-muted)", border: "none", cursor: uploading ? "not-allowed" : "pointer", transition: "background 0.1s, color 0.1s" }}
                    onMouseEnter={(e) => { if (!uploading) { (e.currentTarget as HTMLElement).style.background = "var(--color-bg-card-elev)"; (e.currentTarget as HTMLElement).style.color = "var(--color-text-primary)"; } }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--color-text-muted)"; }}>
              <UploadIcon size={14} />
            </button>
          </div>
          {uploadError && <p style={{ margin: "4px 0 0", fontSize: 11, color: "#f87171" }}>{uploadError}</p>}
          {imageUrl && (
            <div className="mt-2 rounded-card overflow-hidden" style={{ border: "1px solid var(--color-border-std)" }}>
              <img src={imageUrl} alt={t("submit.preview", lang)} className="w-full h-28 object-cover"
                   onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            </div>
          )}
        </F>
      </div>

      {/* Country */}
      <F label={t("submit.field.country", lang)} required error={errors.country} errorMsg={requiredMsg}>
        <SearchableSelect
          value={country}
          onChange={(v) => { setCountry(v); clearError("country"); }}
          options={[{ value: "unknown", label: t("option.unknown", lang), dividerAfter: true }, ...COUNTRIES.map((c) => ({ value: c, label: c }))]}
          placeholder={t("option.unspecified", lang)}
          hasError={!!errors.country}
          searchable
        />
      </F>

      {/* Family (required when families exist) */}
      {activeFamilies.length > 0 && (
        <F label={t("submit.field.family", lang)} required error={errors.family} errorMsg={requiredMsg}>
          <SearchableSelect
            value={family}
            onChange={(v) => { setFamily(v); clearError("family"); }}
            options={activeFamilies.map(f => ({
              value: f.key,
              label: lang === "en" ? f.label_en : f.label_es,
            }))}
            placeholder={t("option.unspecified", lang)}
            hasError={!!errors.family}
            searchable
          />
        </F>
      )}

      {/* Climate · Duration · Tags — 3 columns */}
      <div className="grid grid-cols-3 gap-3">
        <F label={t("submit.field.climate", lang)} required error={errors.climate} errorMsg={requiredMsg}>
          <SearchableSelect
            value={climate}
            onChange={(v) => { setClimate(v as Climate); clearError("climate"); }}
            options={climateOptions}
            placeholder={t("option.unspecified", lang)}
            hasError={!!errors.climate}
          />
        </F>
        <F label={t("submit.field.duration", lang)} required error={errors.duration} errorMsg={requiredMsg}>
          <SearchableSelect
            value={duration}
            onChange={(v) => { setDuration(v as Duration); clearError("duration"); }}
            options={durationOptions}
            placeholder={t("option.unspecified", lang)}
            hasError={!!errors.duration}
          />
        </F>
        <F label={t("submit.field.tags", lang)}>
          <TagsDropdown value={tags} onChange={setTags} placeholder={t("option.unspecified", lang)} options={activeTags.map(t => ({ key: t.key, label: lang === "en" ? t.label_en : t.label_es }))} />
        </F>
      </div>

      {/* Submit */}
      <div className="pt-2 flex flex-col items-center">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 rounded text-sm text-white transition-colors"
          style={{
            fontWeight: 510,
            fontFeatureSettings: "'cv01','ss03'",
            background: loading ? "rgba(58,125,94,0.6)" : "var(--color-brand)",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? t("submit.btn.loading", lang) : t("submit.btn", lang)}
        </button>
      </div>
    </form>
  );
}

// ── Field wrapper ──────────────────────────────────────────────────────────

function F({
  label, required, error, errorMsg, children,
}: {
  label: string; required?: boolean; error?: boolean;
  errorMsg?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label
          className="text-xs"
          style={{ fontWeight: 510, color: error ? "#f87171" : "var(--color-text-muted)" }}
        >
          {label}
          {required && (
            <span style={{ color: error ? "#f87171" : "var(--color-text-subtle)", marginLeft: 2 }}>*</span>
          )}
        </label>
        {error && errorMsg && (
          <span className="text-[11px]" style={{ color: "#f87171", fontFeatureSettings: "'cv01','ss03'" }}>
            {errorMsg}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

// ── Custom select (single) ─────────────────────────────────────────────────

interface SelectOption { value: string; label: string; dividerAfter?: boolean; }

function SearchableSelect({
  value, onChange, options, placeholder, hasError, searchable = false,
}: {
  value: string; onChange: (v: string) => void;
  options: SelectOption[]; placeholder: string;
  hasError?: boolean; searchable?: boolean;
}) {
  const [open,   setOpen]   = useState(false);
  const [query,  setQuery]  = useState("");
  const close = useCallback(() => { setOpen(false); setQuery(""); }, []);
  const ref = useOutsideClose(open, close);

  const filtered = searchable && query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          ...inputBase,
          border: `1px solid ${hasError ? "rgba(248,113,113,0.5)" : open ? "var(--color-accent)" : "var(--color-border-std)"}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          cursor: "pointer",
          color: selected ? "var(--color-text-primary)" : "var(--color-text-subtle)",
          padding: "9px 12px",
        }}
      >
        <span style={{ fontSize: 13 }}>{selected ? selected.label : placeholder}</span>
        <ChevronDownIcon size={13} style={{
          color: "var(--color-text-subtle)", flexShrink: 0, marginLeft: 6,
          transition: "transform 0.15s",
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
        }} />
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 60,
          background: "var(--color-bg-surface)",
          border: "1px solid var(--color-border-std)",
          borderRadius: 8,
          boxShadow: "0 8px 24px rgba(0,0,0,0.22)",
          overflow: "hidden",
          animation: "dropdown-in 0.1s ease",
        }}>
          {searchable && (
            <div style={{ padding: "8px 10px", borderBottom: "1px solid var(--color-border-subtle)" }}>
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                style={{
                  width: "100%", padding: "5px 8px", borderRadius: 5, fontSize: 12,
                  background: "var(--color-bg-card)",
                  border: "1px solid var(--color-border-std)",
                  color: "var(--color-text-primary)", outline: "none",
                  fontFeatureSettings: "'cv01','ss03'",
                  boxSizing: "border-box",
                }}
              />
            </div>
          )}
          <div style={{ maxHeight: 200, overflowY: "auto" }}>
            {filtered.map((opt) => (
              <div key={opt.value}>
                <button
                  type="button"
                  onClick={() => { onChange(opt.value); close(); }}
                  style={{
                    width: "100%", textAlign: "left", padding: "8px 12px",
                    fontSize: 13, cursor: "pointer",
                    background: opt.value === value ? "rgba(82,183,136,0.08)" : "transparent",
                    color: opt.value === value ? "var(--color-accent-hover)" : "var(--color-text-primary)",
                    border: "none", display: "flex", alignItems: "center", justifyContent: "space-between",
                    fontFeatureSettings: "'cv01','ss03'",
                  }}
                  onMouseEnter={(e) => {
                    if (opt.value !== value)
                      (e.currentTarget as HTMLElement).style.background = "var(--color-bg-card-hover)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background =
                      opt.value === value ? "rgba(82,183,136,0.08)" : "transparent";
                  }}
                >
                  {opt.label}
                  {opt.value === value && <CheckIcon size={12} style={{ color: "var(--color-accent)", flexShrink: 0 }} />}
                </button>
                {opt.dividerAfter && (
                  <div style={{ height: 1, background: "var(--color-border-std)", margin: "4px 10px" }} />
                )}
              </div>
            ))}
            {filtered.length === 0 && (
              <p style={{ padding: "10px 12px", fontSize: 12, color: "var(--color-text-faint)", margin: 0 }}>
                No results
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tags dropdown (multi) ──────────────────────────────────────────────────

function TagsDropdown({
  value, onChange, options, placeholder = "—",
}: {
  value: string[]; onChange: (v: string[]) => void; options: { key: string; label: string }[]; placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useOutsideClose(open, close);

  const toggle = (tag: string) => {
    onChange(value.includes(tag) ? value.filter((t) => t !== tag) : [...value, tag]);
  };

  const firstLabel = options.find(o => o.key === value[0])?.label ?? value[0];
  const label = value.length === 0
    ? placeholder
    : value.length === 1
      ? firstLabel
      : `${value.length} selected`;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          ...inputBase,
          border: `1px solid ${open ? "var(--color-accent)" : "var(--color-border-std)"}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          cursor: "pointer",
          color: value.length > 0 ? "var(--color-text-primary)" : "var(--color-text-subtle)",
          padding: "9px 12px",
        }}
      >
        <span style={{ fontSize: 13 }}>{label}</span>
        <ChevronDownIcon size={13} style={{
          color: "var(--color-text-subtle)", flexShrink: 0, marginLeft: 6,
          transition: "transform 0.15s",
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
        }} />
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 60,
          background: "var(--color-bg-surface)",
          border: "1px solid var(--color-border-std)",
          borderRadius: 8,
          boxShadow: "0 8px 24px rgba(0,0,0,0.22)",
          padding: "8px",
          animation: "dropdown-in 0.1s ease",
        }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {options.map(({ key, label: optLabel }) => {
              const active = value.includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggle(key)}
                  style={{
                    padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 510,
                    cursor: "pointer", fontFeatureSettings: "'cv01','ss03'",
                    transition: "background 0.1s, color 0.1s",
                    background: active ? "rgba(82,183,136,0.15)" : "var(--color-bg-card)",
                    color: active ? "var(--color-accent-hover)" : "var(--color-text-muted)",
                    border: active ? "1px solid rgba(82,183,136,0.3)" : "1px solid var(--color-border-std)",
                  }}
                >
                  {optLabel}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
