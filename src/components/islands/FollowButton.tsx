import { useState, useCallback } from "react";

interface Props {
  targetUserId: string;
  isOwner: boolean;
  initialIsFollowing: boolean;
}

export default function FollowButton({ targetUserId, isOwner, initialIsFollowing }: Props) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading,     setLoading]     = useState(false);

  const handleFollow = useCallback(async () => {
    if (loading) return;
    setLoading(true);

    if (isFollowing) {
      const res = await fetch("/api/follow", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followingId: targetUserId }),
      });
      if (res.ok) setIsFollowing(false);
    } else {
      const res = await fetch("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followingId: targetUserId }),
      });
      if (res.ok) setIsFollowing(true);
    }

    setLoading(false);
  }, [isFollowing, loading, targetUserId]);

  if (isOwner) return null;

  return (
    <button
      onClick={handleFollow}
      disabled={loading}
      style={{
        display: "flex", alignItems: "center", gap: 5,
        padding: "6px 13px", borderRadius: 6, border: "none",
        cursor: loading ? "default" : "pointer",
        fontSize: 12, fontWeight: 510,
        fontFeatureSettings: "'cv01','ss03'",
        transition: "background 0.15s, color 0.15s",
        opacity: loading ? 0.65 : 1,
        ...(isFollowing ? {
          background: "var(--color-bg-card-elev)",
          color: "var(--color-text-secondary)",
          border: "1px solid var(--color-border-std)",
        } : {
          background: "var(--color-brand)",
          color: "white",
          border: "1px solid transparent",
        }),
      }}
    >
      {isFollowing ? (
        <>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Siguiendo
        </>
      ) : "Seguir"}
    </button>
  );
}
