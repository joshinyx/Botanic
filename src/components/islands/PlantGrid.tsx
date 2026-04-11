import { useState, useEffect, useCallback } from "react";
import type { Plant, UserProfile } from "@/types";
import { t, type Lang } from "@/lib/i18n";

type PlantWithUser = Plant & { users: Pick<UserProfile, "username" | "name"> | null };

interface Props {
  initialPlants: PlantWithUser[];
  initialHasFilters: boolean;
  lang: Lang;
  emptyTitle: string;
  emptyFilters: string;
  emptyFirst: string;
  clearLabel: string;
  submittedByLabel: string;
}


const CLIMATE_COLOR: Record<string, string> = {
  tropical:      "#4ade80",
  arid:          "#fbbf24",
  temperate:     "#60a5fa",
  continental:   "#c084fc",
  polar:         "#94a3b8",
  mediterranean: "#fb923c",
};
const CLIMATE_BG: Record<string, string> = {
  tropical:      "rgba(74,222,128,0.12)",
  arid:          "rgba(251,191,36,0.12)",
  temperate:     "rgba(96,165,250,0.12)",
  continental:   "rgba(192,132,252,0.12)",
  polar:         "rgba(148,163,184,0.12)",
  mediterranean: "rgba(251,146,60,0.12)",
};

export default function PlantGrid({
  initialPlants,
  initialHasFilters,
  lang,
  emptyTitle,
  emptyFilters,
  emptyFirst,
  clearLabel,
  submittedByLabel,
}: Props) {
  const [plants,     setPlants]     = useState<PlantWithUser[]>(initialPlants);
  const [loading,    setLoading]    = useState(false);
  const [hasFilters, setHasFilters] = useState(initialHasFilters);

  const fetchPlants = useCallback(async (params: URLSearchParams) => {
    setLoading(true);
    setHasFilters(params.toString().length > 0);
    try {
      const res = await fetch(`/api/plants?${params.toString()}`);
      if (!res.ok) return;
      const data = await res.json() as { plants: PlantWithUser[] };
      setPlants(data.plants);
    } finally {
      setLoading(false);
    }
  }, []);

  // Listen for filter changes dispatched by SearchFilters
  useEffect(() => {
    function onFilter(e: Event) {
      const params = (e as CustomEvent<URLSearchParams>).detail;
      fetchPlants(params);
    }
    window.addEventListener("plant-filter", onFilter);
    return () => window.removeEventListener("plant-filter", onFilter);
  }, [fetchPlants]);

  // Also handle browser back/forward
  useEffect(() => {
    function onPop() {
      fetchPlants(new URLSearchParams(window.location.search));
    }
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [fetchPlants]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="rounded-card border"
            style={{
              background: "var(--color-bg-card)",
              borderColor: "var(--color-border-std)",
              aspectRatio: "4/5",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
        ))}
      </div>
    );
  }

  if (plants.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-24 rounded-card border text-center"
        style={{ borderColor: "var(--color-border-subtle)", background: "var(--color-bg-card)" }}
      >
        <svg className="mb-4" style={{ color: "var(--color-text-faint)" }}
          width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z"/>
          <circle cx="12" cy="9" r="2.5"/>
        </svg>
        <p className="text-[15px]" style={{ fontWeight: 510, color: "var(--color-text-subtle)" }}>
          {emptyTitle}
        </p>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-faint)" }}>
          {hasFilters ? emptyFilters : emptyFirst}
        </p>
        {hasFilters && (
          <a
            href="/"
            className="mt-4 px-4 py-2 rounded text-xs transition-colors"
            style={{ border: "1px solid var(--color-border-std)", fontWeight: 510, color: "var(--color-text-muted)" }}
          >
            {clearLabel}
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {plants.map((plant, i) => (
        <PlantCard key={plant.id} plant={plant} submittedByLabel={submittedByLabel} index={i} />
      ))}
    </div>
  );
}

function PlantCard({ plant, submittedByLabel, index }: { plant: PlantWithUser; submittedByLabel: string; index: number }) {
  return (
    <a
      href={`/plants/${plant.id}`}
      className="pc-card group block rounded-card border overflow-hidden"
      style={{
        background: "var(--color-bg-card)",
        borderColor: "var(--color-border-std)",
        animation: "card-in 0.4s ease both",
        animationDelay: `${Math.min(index * 45, 600)}ms`,
      }}
    >
      {/* Square image */}
      <div className="relative overflow-hidden" style={{ aspectRatio: "1/1", background: "var(--color-bg-surface)" }}>
        <img
          src={plant.image_url}
          alt={plant.name}
          className="pc-img w-full h-full object-cover"
          loading="lazy"
        />
        {/* Hover overlay */}
        <div className="pc-overlay absolute inset-0"
             style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)" }} />
      </div>

      {/* Content */}
      <div className="p-2.5">
        <h3 className="text-[13px] tracking-[-0.1px] mb-1.5 truncate"
            style={{ fontWeight: 590, fontFeatureSettings: "'cv01','ss03'", color: "var(--color-text-primary)" }}>
          {plant.name}
        </h3>

        {/* Meta row: climate · duration · country */}
        <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
          <span className="text-[11px] px-2 py-0.5 rounded-full"
                style={{ background: CLIMATE_BG[plant.climate] ?? "var(--color-bg-card-elev)", color: CLIMATE_COLOR[plant.climate] ?? "var(--color-text-muted)", fontWeight: 510 }}>
            {plant.climate}
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full"
                style={{ background: "var(--color-bg-card-elev)", color: "var(--color-text-muted)", fontWeight: 510 }}>
            {plant.duration}
          </span>
          <span className="text-[11px] ml-auto truncate" style={{ color: "var(--color-text-subtle)", fontWeight: 510 }}>
            {plant.origin_country}
          </span>
        </div>

        {/* Tags */}
        {plant.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1.5">
            {plant.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="px-1.5 py-0.5 rounded-micro text-[10px]"
                    style={{ background: "var(--color-bg-card-hover)", border: "1px solid var(--color-border-subtle)", color: "var(--color-text-subtle)", fontWeight: 510 }}>
                {tag}
              </span>
            ))}
            {plant.tags.length > 2 && (
              <span className="px-1.5 py-0.5 rounded-micro text-[10px]"
                    style={{ background: "var(--color-bg-card-hover)", border: "1px solid var(--color-border-subtle)", color: "var(--color-text-subtle)" }}>
                +{plant.tags.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Author */}
        {plant.users && (
          <p className="text-[11px]" style={{ color: "var(--color-text-subtle)" }}>
            <a href={`/user/${plant.users.username}`}
               onClick={(e) => e.stopPropagation()}
               className="transition-colors"
               style={{ color: "var(--color-text-muted)", fontWeight: 510 }}>
              @{plant.users.username}
            </a>
          </p>
        )}
      </div>

      <style>{`
        @keyframes card-in {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .pc-card {
          transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
        }
        .pc-card:hover {
          border-color: rgba(58,125,94,0.45);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.18);
        }
        .pc-img { transition: transform 0.5s ease; }
        .pc-card:hover .pc-img { transform: scale(1.05); }
        .pc-overlay { opacity: 0; transition: opacity 0.25s ease; }
        .pc-card:hover .pc-overlay { opacity: 1; }
      `}</style>
    </a>
  );
}
