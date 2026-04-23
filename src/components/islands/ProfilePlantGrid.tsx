import { useState, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  IconSearch,
  IconAdjustmentsHorizontal,
  IconChevronDown,
  IconTemperature,
  IconClock,
  IconWorld,
  IconTag,
  IconUser,
  IconCheck,
  IconTrash,
} from "@tabler/icons-react";
import type { Climate, Duration, PlantTag } from "@/types";
import { t, type Lang } from "@/lib/i18n";
import { PlantCard, type PlantWithUser } from "./PlantGrid";

const CLIMATES: Climate[] = ["tropical", "arid", "temperate", "continental", "polar", "mediterranean"];
const DURATIONS: Duration[] = ["annual", "biennial", "perennial"];
const TAGS: PlantTag[] = [
  "medicinal", "edible", "ornamental", "succulent", "aquatic",
  "climbing", "shrub", "tree", "herb", "fern", "cactus", "grass",
];

function toggle(arr: string[], item: string): string[] {
  return arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item];
}

interface Props {
  initialPlants: PlantWithUser[];
  lang: Lang;
}

export default function ProfilePlantGrid({ initialPlants, lang }: Props) {
  const [query,          setQuery]          = useState("");
  const [author,         setAuthor]         = useState("");
  const [tags,           setTags]           = useState<string[]>([]);
  const [climate,        setClimate]        = useState<string[]>([]);
  const [duration,       setDuration]       = useState<string[]>([]);
  const [country,        setCountry]        = useState<string[]>([]);
  const [filtersOpen,    setFiltersOpen]    = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeDropdown) return;
    function onPointer(e: PointerEvent) {
      const target = e.target as Element;
      if (target.closest?.("[data-filter-portal]")) return;
      if (containerRef.current && !containerRef.current.contains(target)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [activeDropdown]);

  const countries = useMemo(() =>
    [...new Set(
      initialPlants.map(p => p.origin_country).filter((c): c is string => !!c)
    )].sort(),
    [initialPlants]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const a = author.replace(/^@/, "").trim().toLowerCase();
    return initialPlants.filter(p => {
      if (q && !p.name.toLowerCase().includes(q) && !(p.description ?? "").toLowerCase().includes(q)) return false;
      if (a && !(p.users?.username ?? "").toLowerCase().includes(a)) return false;
      if (tags.length     && !tags.every(tag => (p.tags ?? []).includes(tag)))   return false;
      if (climate.length  && !climate.includes(p.climate        ?? ""))          return false;
      if (duration.length && !duration.includes(p.duration      ?? ""))          return false;
      if (country.length  && !country.includes(p.origin_country ?? ""))          return false;
      return true;
    });
  }, [initialPlants, query, author, tags, climate, duration, country]);

  const hasFilters = !!(climate.length || duration.length || country.length || tags.length || author);

  function clearAll() {
    setQuery(""); setAuthor(""); setTags([]); setClimate([]); setDuration([]); setCountry([]);
    setActiveDropdown(null);
  }

  function openDropdown(id: string) {
    setActiveDropdown(prev => prev === id ? null : id);
  }

  return (
    <div>
      <div ref={containerRef} className="mb-5">
        <div
          className="flex items-center rounded-card"
          style={{
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border-std)",
            overflow: "hidden",
          }}
        >
          {/* Search icon + input */}
          <IconSearch size={14} className="shrink-0 ml-3" style={{ color: "var(--color-text-subtle)", flexShrink: 0 }} />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t("search.placeholder", lang)}
            className="px-3 py-2 text-sm outline-none bg-transparent"
            style={{
              flex: 1,
              minWidth: 60,
              color: "var(--color-text-primary)",
              fontFeatureSettings: "'cv01','ss03'",
            }}
          />
          {query && (
            <button onClick={() => setQuery("")} className="shrink-0 px-2 text-sm transition-colors"
                    style={{ color: "var(--color-text-subtle)" }}>×</button>
          )}

          {/* ── Sliding filter section ── */}
          <div style={{
            overflow: "hidden",
            maxWidth: filtersOpen ? 800 : 0,
            transition: "max-width 0.38s cubic-bezier(0.4, 0, 0.2, 1)",
            flexShrink: 0,
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "0 8px",
              whiteSpace: "nowrap",
              transform: filtersOpen ? "translateX(0)" : "translateX(28px)",
              opacity: filtersOpen ? 1 : 0,
              transition: "transform 0.32s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.22s ease",
            }}>
              {/* Left divider — siempre visible cuando el panel está abierto */}
              <div style={{ width: 1, height: 20, background: "var(--color-border-std)", flexShrink: 0 }} />

              {/* Trash — se contrae a 0 cuando no hay filtros activos */}
              <div style={{
                display: "flex", alignItems: "center", flexShrink: 0,
                maxWidth: (hasFilters || query) ? 28 : 0,
                overflow: "hidden",
                transition: "max-width 0.26s cubic-bezier(0.4,0,0.2,1)",
              }}>
                <button onClick={clearAll} title={t("filter.clearAll", lang)} style={{
                  display: "flex", alignItems: "center",
                  color: "#e03131", background: "none", border: "none", padding: "4px 6px",
                  cursor: "pointer", flexShrink: 0,
                }}>
                  <IconTrash size={14} />
                </button>
              </div>

              <DropdownFilter id="climate"  label={t("filter.climate",  lang)} icon={<IconTemperature size={12} />}
                options={CLIMATES}  selected={climate}  onToggle={v => setClimate(prev  => toggle(prev, v))}
                active={activeDropdown === "climate"}   onOpen={openDropdown} />

              <DropdownFilter id="duration" label={t("filter.duration", lang)} icon={<IconClock size={12} />}
                options={DURATIONS} selected={duration} onToggle={v => setDuration(prev => toggle(prev, v))}
                active={activeDropdown === "duration"}  onOpen={openDropdown} />

              {countries.length > 1 && (
                <DropdownFilter id="country" label={t("filter.country", lang)} icon={<IconWorld size={12} />}
                  options={countries} selected={country} onToggle={v => setCountry(prev => toggle(prev, v))}
                  active={activeDropdown === "country"} onOpen={openDropdown} />
              )}

              <DropdownFilter id="tags"    label={t("filter.tags",    lang)} icon={<IconTag size={12} />}
                options={TAGS}      selected={tags}     onToggle={v => setTags(prev    => toggle(prev, v))}
                active={activeDropdown === "tags"}     onOpen={openDropdown} />

              {/* Author */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "4px 9px", borderRadius: 6,
                border: "1px solid var(--color-border-std)",
                background: "var(--color-bg-card)",
              }}>
                <IconUser size={11} style={{ color: author ? "var(--color-accent)" : "var(--color-text-faint)", flexShrink: 0 }} />
                <span style={{ display: "flex", alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: "var(--color-text-subtle)", userSelect: "none" }}>@</span>
                  <input
                    type="text"
                    value={author.replace(/^@/, "")}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder={t("filter.authorPlaceholder", lang).replace(/^@/, "")}
                    style={{
                      outline: "none", background: "transparent",
                      width: 54, fontSize: 11, fontWeight: 510,
                      fontFeatureSettings: "'cv01','ss03'",
                      color: author ? "var(--color-accent-hover)" : "var(--color-text-primary)",
                    }}
                  />
                </span>
              </div>
            </div>
          </div>

          {/* Divider before Filters button */}
          <div style={{ width: 1, alignSelf: "stretch", background: "var(--color-border-std)", margin: "6px 0", flexShrink: 0 }} />

          {/* Filters toggle */}
          <button
            onClick={() => setFiltersOpen(o => !o)}
            className="shrink-0 flex items-center gap-1.5 px-3 h-full text-xs transition-colors"
            style={{
              fontWeight: 510, fontFeatureSettings: "'cv01','ss03'",
              color: hasFilters ? "var(--color-accent-hover)" : "var(--color-text-muted)",
              background: "transparent", border: "none", cursor: "pointer",
              paddingTop: 8, paddingBottom: 8,
            }}
          >
            <IconAdjustmentsHorizontal size={12} />
            {t("filter.filters", lang)}
            <IconChevronDown size={11} style={{
              transition: "transform 0.25s ease",
              transform: filtersOpen ? "rotate(180deg)" : "none",
              color: "var(--color-text-subtle)",
            }} />
          </button>
        </div>
      </div>

      {/* ── Grid or no results ── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-card border text-center"
             style={{ borderColor: "var(--color-border-subtle)", background: "var(--color-bg-card)" }}>
          <IconSearch size={32} className="mb-3" style={{ color: "var(--color-text-faint)" }} />
          <p className="text-sm" style={{ fontWeight: 510, color: "var(--color-text-subtle)" }}>
            {t("search.noResults", lang)}
          </p>
          {(query || hasFilters) && (
            <button onClick={clearAll} className="mt-3 px-4 py-2 rounded text-xs transition-colors"
                    style={{ border: "1px solid var(--color-border-std)", fontWeight: 510, color: "var(--color-text-muted)", background: "none", cursor: "pointer" }}>
              {t("filter.clearAll", lang)}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((plant, i) => (
            <PlantCard key={plant.id} plant={plant} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Multi-select dropdown (portal) ────────────────────────────

interface DropdownFilterProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
  active: boolean;
  onOpen: (id: string) => void;
}

function DropdownFilter({ id, label, icon, options, selected, onToggle, active, onOpen }: DropdownFilterProps) {
  const triggerRef  = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const hasSelection = selected.length > 0;

  useEffect(() => {
    if (!active || !triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setMenuPos({ top: r.bottom + 4, left: r.left });
  }, [active]);

  return (
    <div style={{ display: "inline-flex", flexShrink: 0 }}>
      <button
        ref={triggerRef}
        onClick={() => onOpen(id)}
        style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "4px 9px", borderRadius: 6, fontSize: 11, fontWeight: 510,
          cursor: "pointer", fontFeatureSettings: "'cv01','ss03'",
          transition: "color 0.12s",
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border-std)",
          color: hasSelection ? "var(--color-accent-hover)" : "var(--color-text-muted)",
        }}
      >
        <span style={{ color: hasSelection ? "var(--color-accent)" : "var(--color-text-faint)", display: "flex" }}>
          {icon}
        </span>
        {label}
        <IconChevronDown size={10} style={{
          transition: "transform 0.18s ease",
          transform: active ? "rotate(180deg)" : "none",
          color: "var(--color-text-faint)",
        }} />
      </button>

      {active && createPortal(
        <div
          data-filter-portal
          style={{
            position: "fixed",
            top: menuPos.top,
            left: menuPos.left,
            minWidth: 160,
            maxWidth: 240,
            background: "var(--color-bg-surface)",
            border: "1px solid var(--color-border-std)",
            borderRadius: 8,
            boxShadow: "0 4px 20px rgba(0,0,0,0.24), 0 1px 4px rgba(0,0,0,0.1)",
            zIndex: 9999,
            overflow: "hidden",
            maxHeight: 240,
            overflowY: "auto",
          }}
        >
          {options.map((opt) => {
            const isSelected = selected.includes(opt);
            return (
              <button
                key={opt}
                onClick={() => onToggle(opt)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  width: "100%", padding: "7px 12px", fontSize: 11,
                  fontWeight: isSelected ? 590 : 450,
                  color: isSelected ? "var(--color-accent-hover)" : "var(--color-text-primary)",
                  background: "transparent",
                  border: "none", cursor: "pointer", textAlign: "left",
                  fontFeatureSettings: "'cv01','ss03'",
                  transition: "background 0.1s",
                }}
              >
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
                {isSelected && <IconCheck size={11} style={{ color: "var(--color-accent)", flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}
