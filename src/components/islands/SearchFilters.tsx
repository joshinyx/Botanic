import { useState, useCallback, useRef, useEffect } from "react";
import {
  SlidersHorizontalIcon,
  ThermometerIcon,
  TimerIcon,
  TagIcon,
  UserRoundIcon,
  ChevronDownIcon,
} from "lucide-react";
import type { Climate, Duration, PlantTag } from "@/types";
import { t, type Lang } from "@/lib/i18n";

interface Props {
  lang: Lang;
  initialName?: string;
  initialTags?: string[];
  initialCountry?: string;
  initialClimate?: string;
  initialDuration?: string;
  initialAuthor?: string;
  countries: string[];
}

const CLIMATES: Climate[]  = ["tropical", "arid", "temperate", "continental", "polar", "mediterranean"];
const DURATIONS: Duration[] = ["annual", "biennial", "perennial"];
const TAGS: PlantTag[] = [
  "medicinal", "edible", "ornamental", "succulent", "aquatic",
  "climbing", "shrub", "tree", "herb", "fern", "cactus", "grass",
];

export default function SearchFilters({
  lang,
  initialName     = "",
  initialTags     = [],
  initialCountry  = "",
  initialClimate  = "",
  initialDuration = "",
  initialAuthor   = "",
  countries,
}: Props) {
  const [name,         setName]         = useState(initialName);
  const [tags,         setTags]         = useState<string[]>(initialTags);
  const [country,      setCountry]      = useState(initialCountry);
  const [climate,      setClimate]      = useState(initialClimate);
  const [duration,     setDuration]     = useState(initialDuration);
  const [author,       setAuthor]       = useState(initialAuthor);
  const [filtersOpen,  setFiltersOpen]  = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!filtersOpen) return;
    function onPointer(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node))
        setFiltersOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [filtersOpen]);

  const applyFilters = useCallback((overrides: Partial<{
    name: string; tags: string[]; country: string;
    climate: string; duration: string; author: string;
  }> = {}) => {
    const params = new URLSearchParams();
    const n  = overrides.name     ?? name;
    const tg = overrides.tags     ?? tags;
    const co = overrides.country  ?? country;
    const cl = overrides.climate  ?? climate;
    const d  = overrides.duration ?? duration;
    const a  = (overrides.author  ?? author).replace(/^@/, "").trim();

    if (n)         params.set("name", n);
    if (tg.length) params.set("tags", tg.join(","));
    if (co)        params.set("country", co);
    if (cl)        params.set("climate", cl);
    if (d)         params.set("duration", d);
    if (a)         params.set("author", a);

    const query = params.toString();
    history.pushState({}, "", query ? `/?${query}` : "/");
    window.dispatchEvent(new CustomEvent("plant-filter", { detail: params }));
  }, [name, tags, country, climate, duration, author]);

  const toggleTag = useCallback((tag: string) => {
    const next = tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag];
    setTags(next);
    applyFilters({ tags: next });
  }, [tags, applyFilters]);

  const handleClear = useCallback(() => {
    setName(""); setTags([]); setCountry(""); setClimate(""); setDuration(""); setAuthor("");
    history.pushState({}, "", "/");
    window.dispatchEvent(new CustomEvent("plant-filter", { detail: new URLSearchParams() }));
  }, []);

  const hasFilters = !!(climate || duration || country || tags.length || author);

  return (
    <div ref={containerRef}>
      {/* ── Search bar ────────────────────────────────────── */}
      <div
        className="flex items-center rounded-card overflow-hidden"
        style={{
          background: "var(--color-bg-card)",
          border: `1px solid ${filtersOpen ? "var(--color-border-std)" : "var(--color-border-std)"}`,
          borderBottomLeftRadius:  filtersOpen ? 0 : undefined,
          borderBottomRightRadius: filtersOpen ? 0 : undefined,
        }}
      >
        {/* Search icon */}
        <svg
          className="shrink-0 ml-3"
          style={{ color: "var(--color-text-subtle)" }}
          width="14" height="14" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>

        {/* Text input */}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applyFilters({ name })}
          placeholder={t("search.placeholder", lang)}
          className="flex-1 px-3 py-2 text-sm outline-none bg-transparent"
          style={{
            color: "var(--color-text-primary)",
            fontFeatureSettings: "'cv01','ss03'",
          }}
        />

        {/* Clear ×  */}
        {name && (
          <button
            onClick={() => { setName(""); applyFilters({ name: "" }); }}
            className="shrink-0 px-2 transition-colors text-sm"
            style={{ color: "var(--color-text-subtle)" }}
          >
            ×
          </button>
        )}

        {/* Vertical divider */}
        <div style={{
          width: 1, alignSelf: "stretch",
          background: "var(--color-border-std)",
          margin: "6px 0",
        }} />

        {/* Filtros button */}
        <button
          onClick={() => setFiltersOpen((o) => !o)}
          className="shrink-0 flex items-center gap-1.5 px-3 h-full text-xs transition-colors"
          style={{
            fontWeight: 510,
            fontFeatureSettings: "'cv01','ss03'",
            color: hasFilters
              ? "var(--color-accent-hover)"
              : "var(--color-text-muted)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            paddingTop: 8,
            paddingBottom: 8,
          }}
        >
          <SlidersHorizontalIcon size={12} />
          {t("filter.filters", lang)}
          {hasFilters && (
            <span style={{
              width: 5, height: 5, borderRadius: "50%",
              background: "var(--color-accent)", flexShrink: 0,
            }} />
          )}
          <ChevronDownIcon
            size={11}
            style={{
              transition: "transform 0.15s",
              transform: filtersOpen ? "rotate(180deg)" : "rotate(0deg)",
              color: "var(--color-text-subtle)",
            }}
          />
        </button>
      </div>

      {/* ── Filter panel (inline expand) ──────────────────── */}
      {filtersOpen && (
        <div style={{
          background: "var(--color-bg-surface)",
          border: "1px solid var(--color-border-std)",
          borderTop: "none",
          borderRadius: "0 0 8px 8px",
          padding: "14px 16px 16px",
        }}>

          {/* Selects row */}
          <div className="flex flex-wrap gap-3 mb-4">
            {/* Climate */}
            <div className="flex-1 min-w-[120px]">
              <SectionLabel icon={<ThermometerIcon size={11} />} label={t("filter.climate", lang)} />
              <FilterSelect
                value={climate}
                onChange={(v) => { setClimate(v); applyFilters({ climate: v }); }}
                placeholder={t("filter.climate", lang)}
                options={CLIMATES}
              />
            </div>

            {/* Duration */}
            <div className="flex-1 min-w-[120px]">
              <SectionLabel icon={<TimerIcon size={11} />} label={t("filter.duration", lang)} />
              <FilterSelect
                value={duration}
                onChange={(v) => { setDuration(v); applyFilters({ duration: v }); }}
                placeholder={t("filter.duration", lang)}
                options={DURATIONS}
              />
            </div>

            {/* Country */}
            {countries.length > 0 && (
              <div className="flex-1 min-w-[120px]">
                <SectionLabel icon={<span style={{ fontSize: 11 }}>🌍</span>} label={t("filter.country", lang)} />
                <FilterSelect
                  value={country}
                  onChange={(v) => { setCountry(v); applyFilters({ country: v }); }}
                  placeholder={t("filter.country", lang)}
                  options={countries}
                />
              </div>
            )}

            {/* Submitted by */}
            <div className="flex-1 min-w-[120px]">
              <SectionLabel icon={<UserRoundIcon size={11} />} label={t("filter.submittedBy", lang)} />
              <div style={{ position: "relative" }}>
                <span style={{
                  position: "absolute", left: 8, top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: 11, color: "var(--color-text-subtle)",
                  pointerEvents: "none",
                }}>@</span>
                <input
                  type="text"
                  value={author.replace(/^@/, "")}
                  onChange={(e) => setAuthor(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && applyFilters({ author })}
                  placeholder={t("filter.authorPlaceholder", lang).replace(/^@/, "")}
                  className="w-full outline-none appearance-none"
                  style={{
                    padding: "5px 8px 5px 20px",
                    borderRadius: 6,
                    fontSize: 11,
                    background: author ? "rgba(82,183,136,0.08)" : "var(--color-bg-card)",
                    border: author
                      ? "1px solid rgba(82,183,136,0.25)"
                      : "1px solid var(--color-border-std)",
                    color: author ? "var(--color-accent-hover)" : "var(--color-text-primary)",
                    fontWeight: 510,
                    fontFeatureSettings: "'cv01','ss03'",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "var(--color-border-subtle)", marginBottom: 12 }} />

          {/* Tags */}
          <div className="flex items-center gap-1.5 mb-2">
            <SectionLabel icon={<TagIcon size={11} />} label={t("filter.tags", lang)} />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TAGS.map((tag) => {
              const active = tags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  style={{
                    padding: "3px 10px",
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 510,
                    cursor: "pointer",
                    fontFeatureSettings: "'cv01','ss03'",
                    transition: "background 0.12s, color 0.12s, border-color 0.12s",
                    background: active ? "rgba(82,183,136,0.15)" : "var(--color-bg-card)",
                    color: active ? "var(--color-accent-hover)" : "var(--color-text-muted)",
                    border: active
                      ? "1px solid rgba(82,183,136,0.3)"
                      : "1px solid var(--color-border-std)",
                  }}
                >
                  {tag}
                </button>
              );
            })}
          </div>

          {/* Clear all */}
          {hasFilters && (
            <div className="flex justify-end mt-3">
              <button
                onClick={handleClear}
                className="text-xs transition-colors"
                style={{
                  fontWeight: 510,
                  color: "var(--color-text-subtle)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFeatureSettings: "'cv01','ss03'",
                }}
              >
                {t("filter.clearAll", lang)}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────

function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1 mb-1.5" style={{
      fontSize: 10, fontWeight: 590,
      color: "var(--color-text-subtle)",
      textTransform: "uppercase",
      letterSpacing: "0.06em",
      fontFeatureSettings: "'cv01','ss03'",
    }}>
      <span style={{ color: "var(--color-text-faint)" }}>{icon}</span>
      {label}
    </div>
  );
}

interface SelectProps {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: string[];
}

function FilterSelect({ value, onChange, placeholder, options }: SelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full outline-none appearance-none cursor-pointer"
      style={{
        padding: "5px 8px",
        borderRadius: 6,
        fontSize: 11,
        background: value ? "rgba(82,183,136,0.08)" : "var(--color-bg-card)",
        border: value ? "1px solid rgba(82,183,136,0.25)" : "1px solid var(--color-border-std)",
        color: value ? "var(--color-accent-hover)" : "var(--color-text-muted)",
        fontWeight: 510,
        fontFeatureSettings: "'cv01','ss03'",
      }}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option
          key={o} value={o}
          style={{ background: "var(--color-bg-surface)", color: "var(--color-text-primary)" }}
        >
          {o.charAt(0).toUpperCase() + o.slice(1)}
        </option>
      ))}
    </select>
  );
}
