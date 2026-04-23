import { useState, useEffect, useCallback } from "react";
import type { Plant, UserProfile } from "@/types";
import { t, type Lang } from "@/lib/i18n";
import { UserMention } from "./UserHoverCard";

export type PlantWithUser = Plant & {
  users: Pick<UserProfile, "username" | "name" | "bio" | "avatar_url" | "followers_count" | "following_count"> | null;
};

interface Props {
  initialPlants: PlantWithUser[];
  initialHasFilters: boolean;
  lang: Lang;
  emptyTitle: string;
  emptyFilters: string;
  emptyFirst: string;
  clearLabel: string;
  submittedByLabel: string;
  countOne?: string;
  countOther?: string;
  filteredLabel?: string;
}

export default function PlantGrid({
  initialPlants,
  initialHasFilters,
  lang,
  emptyTitle,
  emptyFilters,
  emptyFirst,
  clearLabel,
  countOne = "plant",
  countOther = "plants",
  filteredLabel = "",
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

  useEffect(() => {
    function onFilter(e: Event) {
      const params = (e as CustomEvent<URLSearchParams>).detail;
      fetchPlants(params);
    }
    window.addEventListener("plant-filter", onFilter);
    return () => window.removeEventListener("plant-filter", onFilter);
  }, [fetchPlants]);

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
          <div key={i} className="rounded-card"
               style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border-std)", aspectRatio: "3/4", animation: "pulse 1.5s ease-in-out infinite" }} />
        ))}
      </div>
    );
  }

  if (plants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 rounded-card border text-center"
           style={{ borderColor: "var(--color-border-subtle)", background: "var(--color-bg-card)" }}>
        <svg className="mb-4" style={{ color: "var(--color-text-faint)" }}
          width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z"/>
          <circle cx="12" cy="9" r="2.5"/>
        </svg>
        <p className="text-[15px]" style={{ fontWeight: 510, color: "var(--color-text-subtle)" }}>{emptyTitle}</p>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-faint)" }}>
          {hasFilters ? emptyFilters : emptyFirst}
        </p>
        {hasFilters && (
          <a href="/" className="mt-4 px-4 py-2 rounded text-xs transition-colors"
             style={{ border: "1px solid var(--color-border-std)", fontWeight: 510, color: "var(--color-text-muted)" }}>
            {clearLabel}
          </a>
        )}
      </div>
    );
  }

  const countLabel = plants.length === 1
    ? `1 ${countOne}`
    : `${plants.length} ${countOther}`;

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs" style={{ fontWeight: 510, color: "var(--color-text-subtle)" }}>
          {countLabel}
          {hasFilters && filteredLabel && (
            <span style={{ color: "var(--color-accent)" }}>{" "}{filteredLabel}</span>
          )}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {plants.map((plant, i) => (
          <PlantCard key={plant.id} plant={plant} index={i} />
        ))}
      </div>
    </>
  );
}

export function PlantCard({ plant, index }: { plant: PlantWithUser; index: number }) {
  return (
    <div
      className="pc-card group rounded-card overflow-hidden"
      onClick={() => { window.location.href = `/plants/${plant.id}`; }}
      onKeyDown={(e) => { if (e.key === "Enter") window.location.href = `/plants/${plant.id}`; }}
      role="link"
      tabIndex={0}
      style={{
        position: "relative",
        display: "block",
        cursor: "pointer",
        border: "1px solid var(--color-border-std)",
        animation: "card-in 0.4s ease both",
        animationDelay: `${Math.min(index * 45, 600)}ms`,
        aspectRatio: "3/4",
        background: "var(--color-bg-surface)",
      }}
    >
      {/* Full-bleed photo */}
      <img
        src={plant.image_url}
        alt={plant.name}
        className="pc-img"
        loading="lazy"
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          objectFit: "cover",
          transition: "transform 0.55s ease",
        }}
      />

      {/* Country pill — top right */}
      <div style={{
        position: "absolute", top: 12, right: 12,
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: "3px 9px",
        borderRadius: 99,
        background: "rgba(0,0,0,0.38)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        border: "1px solid rgba(255,255,255,0.12)",
        fontSize: 10, fontWeight: 510,
        color: "rgba(255,255,255,0.88)",
        letterSpacing: "0.02em",
        pointerEvents: "none",
      }}>
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 11a3 3 0 1 0 6 0 3 3 0 0 0-6 0"/>
          <path d="M17.657 16.657 13.414 20.9a2 2 0 0 1-2.827 0l-4.244-4.243a8 8 0 1 1 11.314 0z"/>
        </svg>
        {plant.origin_country}
      </div>

      {/* Bottom gradient overlay */}
      <div
        className="pc-overlay"
        style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.52) 38%, rgba(0,0,0,0.1) 62%, transparent 80%)",
          transition: "opacity 0.25s ease",
        }}
      />

      {/* Text content — sits on gradient */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: "0 14px 14px",
        display: "flex", flexDirection: "column", gap: 6,
      }}>
        {/* Name */}
        <h3 style={{
          margin: 0,
          fontSize: 15,
          fontWeight: 590,
          lineHeight: 1.25,
          letterSpacing: "-0.2px",
          fontFeatureSettings: "'cv01','ss03'",
          color: "#fff",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>
          {plant.name}
        </h3>

        {/* Description */}
        <p style={{
          margin: 0,
          fontSize: 11,
          lineHeight: 1.55,
          color: "rgba(255,255,255,0.65)",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>
          {plant.description}
        </p>

        {/* Author */}
        {plant.users && (
          <div style={{ marginTop: 2 }} onClick={(e) => e.stopPropagation()}>
            <UserMention
              user={{
                username: plant.users.username,
                name: plant.users.name,
                bio: plant.users.bio ?? null,
                avatar_url: plant.users.avatar_url ?? null,
                followers_count: plant.users.followers_count ?? 0,
                following_count: plant.users.following_count ?? 0,
              }}
              placement="up"
              style={{ color: "var(--color-accent)" }}
            />
          </div>
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
          border-color: rgba(58,125,94,0.5);
          transform: translateY(-3px);
          box-shadow: 0 14px 36px rgba(0,0,0,0.3), 0 0 0 1px rgba(58,125,94,0.12);
        }
        .pc-card:hover .pc-img {
          transform: scale(1.06);
        }
      `}</style>
    </div>
  );
}
