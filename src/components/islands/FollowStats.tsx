import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";

interface UserCard {
  id: string;
  username: string;
  name: string;
  avatar_url: string | null;
  role: string | null;
  viewer_follows: boolean;
}

interface Props {
  userId: string;
  currentUserId?: string | null;
  displayFollowers: string | number;
  displayFollowing: string | number;
  followersLabel: string;
  followingLabel: string;
}

function StaffBadge() {
  return (
    <svg width="15" height="15" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"
         fill="var(--color-accent)" aria-label="Staff" style={{ flexShrink: 0 }}>
      <g transform="translate(9.375,9.825)">
        <g transform="matrix(3.38855421686747,0,0,3.38855421686747,-28.802710843373493,-29.26133626914886)">
          <path d="M32.628212,8.6361885c-1.3350086,2.6396627-2.1030216,5.61516-2.1008072,8.7757549c0.0030556,8.8963432,5.9801903,16.3825207,14.1322403,18.705534c3.6843719-7.3044529,2.4856567-16.4400749-3.6176529-22.5373764C38.6159935,11.1556845,35.708065,9.5134058,32.628212,8.6361885z"/>
          <path d="M36.6367226,44.4209976c-2.2498589-8.2716866-9.7946415-14.3607674-18.7788963-14.3561306C14.4649076,30.0661316,11.2771158,30.9387112,8.5,32.4654617c0.8604574,3.1732445,2.5209713,6.1744614,5.014431,8.6644402C19.7794399,47.3903809,29.2442551,48.4790459,36.6367226,44.4209976z"/>
          <path d="M55.8574944,63.100174c-4.2872086,7.4469681-3.2679024,17.1136398,3.1020927,23.474884c2.2940254,2.2922363,5.0209694,3.880127,7.9149857,4.7891769c1.6449127-2.858284,2.5996017-6.1639252,2.5978088-9.6987228C69.4694366,72.9555359,63.745388,65.5863647,55.8574944,63.100174z"/>
          <path d="M63.6276436,55.5768967c2.5443764,7.7994499,9.8681145,13.438858,18.5163231,13.4329529c3.2794952-0.0010529,6.3647232-0.8215637,9.0758514-2.254921c-0.9208527-2.8249702-2.486496-5.485714-4.7325592-7.7296715C80.2964554,52.8389931,70.9795303,51.6921387,63.6276436,55.5768967z"/>
          <path d="M30.5274048,81.6813278c0.0012646,3.5291061,0.9556408,6.8292618,2.5986557,9.6833267c2.8991814-0.9107361,5.6306572-2.5032654,7.9271049-4.8024521c6.3580856-6.3627243,7.3740196-16.0220184,3.0891266-23.4626579C36.2468147,65.587204,30.5213947,72.9648132,30.5274048,81.6813278z"/>
          <path d="M36.3721466,55.576683c-7.3567352-3.8893929-16.6797752-2.7372704-22.8689957,3.4578514c-2.241004,2.242691-3.8027496,4.9006958-4.72192,7.7218742c2.7157688,1.4356766,5.8073206,2.2557602,9.0932493,2.2534409C26.5151005,69.006897,33.8301964,63.3696022,36.3721466,55.576683z"/>
          <path d="M69.4723816,17.3963432c-0.0010529-3.1555357-0.7696991-6.1255512-2.1030197-8.7609978c-3.0833282,0.8789034-5.9938965,2.5245552-8.4208412,4.9538212c-6.0945625,6.0989876-7.2872696,15.2284966-3.6074257,22.5278873C63.4990463,33.7925644,69.4770203,26.2994328,69.4723816,17.3963432z"/>
          <path d="M63.3639107,44.4203644c7.3991051,4.060791,16.8699303,2.9689598,23.1346245-3.3035316c2.4859772-2.4876633,4.1424866-5.4840279,5.0014648-8.6517944c-2.7815399-1.5288563-5.9742889-2.4018574-9.3726883-2.4001713C73.1491699,30.0682411,65.6136627,36.1560555,63.3639107,44.4203644z"/>
        </g>
      </g>
    </svg>
  );
}

export default function FollowStats({
  userId,
  currentUserId,
  displayFollowers,
  displayFollowing,
  followersLabel,
  followingLabel,
}: Props) {
  const [modal,        setModal]        = useState<"followers" | "following" | null>(null);
  const [users,        setUsers]        = useState<UserCard[]>([]);
  const [loading,      setLoading]      = useState(false);
  // per-user follow state: true = following, false = not following, undefined = loading
  const [followMap,    setFollowMap]    = useState<Map<string, boolean>>(new Map());
  const [loadingFollow, setLoadingFollow] = useState<Set<string>>(new Set());

  const open = useCallback(async (type: "followers" | "following") => {
    setModal(type);
    setUsers([]);
    setFollowMap(new Map());
    setLoading(true);
    try {
      const viewerParam = currentUserId ? `&viewerId=${currentUserId}` : "";
      const res  = await fetch(`/api/user/follows?userId=${userId}&type=${type}${viewerParam}`);
      const data = await res.json() as { users: UserCard[] };
      const list = data.users ?? [];
      setUsers(list);
      const map = new Map<string, boolean>();
      list.forEach(u => map.set(u.id, u.viewer_follows));
      setFollowMap(map);
    } catch { /* silent */ }
    setLoading(false);
  }, [userId, currentUserId]);

  const close = useCallback(() => setModal(null), []);

  const handleFollow = useCallback(async (targetId: string) => {
    if (!currentUserId || loadingFollow.has(targetId)) return;

    const isFollowing = followMap.get(targetId) ?? false;
    setLoadingFollow(prev => new Set(prev).add(targetId));

    const res = await fetch("/api/follow", {
      method: isFollowing ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ followingId: targetId }),
    });

    if (res.ok) {
      setFollowMap(prev => new Map(prev).set(targetId, !isFollowing));
    }
    setLoadingFollow(prev => { const s = new Set(prev); s.delete(targetId); return s; });
  }, [currentUserId, followMap, loadingFollow]);

  useEffect(() => {
    if (!modal) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [modal, close]);

  const title = (modal === "followers" ? followersLabel : followingLabel)
    .replace(/^\w/, (c) => c.toUpperCase());

  const statBtn = (label: string, count: string | number, type: "followers" | "following") => (
    <button
      onClick={() => open(type)}
      style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", padding: 0, cursor: "pointer" }}
    >
      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>{count}</span>
      <span
        className="capitalize"
        style={{ fontSize: 13, color: "var(--color-text-subtle)", transition: "color 0.12s" }}
        onMouseEnter={e => ((e.target as HTMLElement).style.color = "var(--color-text-secondary)")}
        onMouseLeave={e => ((e.target as HTMLElement).style.color = "var(--color-text-subtle)")}
      >
        {label}
      </span>
    </button>
  );

  return (
    <>
      {statBtn(followingLabel, displayFollowing, "following")}
      {statBtn(followersLabel, displayFollowers, "followers")}

      {modal && createPortal(
        <div
          onClick={close}
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(0,0,0,0.82)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "var(--color-bg-surface)",
              border: "1px solid var(--color-border-std)",
              borderRadius: 12,
              width: "100%", maxWidth: 400,
              maxHeight: "68vh",
              display: "flex", flexDirection: "column",
              overflow: "hidden",
              boxShadow: "0 8px 40px rgba(0,0,0,0.45), 0 1px 4px rgba(0,0,0,0.2)",
            }}
          >
            {/* Header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 16px 12px",
              borderBottom: "1px solid var(--color-border-subtle)",
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 14, fontWeight: 590, color: "var(--color-text-primary)", fontFeatureSettings: "'cv01','ss03'" }}>
                {title}
              </span>
              <button
                onClick={close}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 26, height: 26, borderRadius: 6,
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--color-text-subtle)", transition: "color 0.12s",
                }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = "var(--color-text-primary)")}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = "var(--color-text-subtle)")}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div style={{ overflowY: "auto", flex: 1 }}>
              {loading ? (
                <div style={{ padding: "32px 16px", textAlign: "center", fontSize: 13, color: "var(--color-text-subtle)" }}>
                  Cargando…
                </div>
              ) : users.length === 0 ? (
                <div style={{ padding: "32px 16px", textAlign: "center", fontSize: 13, color: "var(--color-text-subtle)" }}>
                  Sin resultados
                </div>
              ) : users.map((u) => {
                const isFollowing  = followMap.get(u.id) ?? u.viewer_follows;
                const isSelf       = u.id === currentUserId;
                const btnLoading   = loadingFollow.has(u.id);
                const showFollowBtn = !!currentUserId && !isSelf;

                return (
                  <div
                    key={u.id}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "9px 16px",
                      borderBottom: "1px solid var(--color-border-subtle)",
                      background: "transparent", transition: "background 0.1s",
                    }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "var(--color-bg-card-hover)")}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                  >
                    {/* Avatar */}
                    <a href={`/user/${u.username}`} style={{ flexShrink: 0, lineHeight: 0 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: "50%",
                        overflow: "hidden",
                        background: "var(--color-bg-elevated)",
                        border: "1px solid var(--color-border-subtle)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt={u.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <span style={{ fontSize: 13, fontWeight: 590, color: "var(--color-text-muted)" }}>
                            {(u.name || u.username).charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                    </a>

                    {/* Name + username */}
                    <a href={`/user/${u.username}`} style={{ minWidth: 0, flex: 1, textDecoration: "none" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{
                          fontSize: 13, fontWeight: 510,
                          color: "var(--color-text-primary)",
                          fontFeatureSettings: "'cv01','ss03'",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {u.name || u.username}
                        </span>
                        {u.role && u.role !== "reader" && <StaffBadge />}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--color-text-subtle)" }}>@{u.username}</div>
                    </a>

                    {/* Follow button */}
                    {showFollowBtn && (
                      <button
                        onClick={() => handleFollow(u.id)}
                        disabled={btnLoading}
                        style={{
                          flexShrink: 0,
                          padding: "4px 11px", borderRadius: 6,
                          fontSize: 11, fontWeight: 510,
                          fontFeatureSettings: "'cv01','ss03'",
                          cursor: btnLoading ? "default" : "pointer",
                          opacity: btnLoading ? 0.6 : 1,
                          border: "none",
                          transition: "background 0.15s, color 0.15s",
                          ...(isFollowing ? {
                            background: "var(--color-bg-card-elev)",
                            color: "var(--color-text-secondary)",
                            outline: "1px solid var(--color-border-std)",
                          } : {
                            background: "var(--color-brand)",
                            color: "white",
                          }),
                        }}
                      >
                        {isFollowing ? "Siguiendo" : "Seguir"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
