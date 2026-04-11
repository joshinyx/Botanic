import { useState, useCallback } from "react";

interface Props {
  targetUserId: string;
  isOwner: boolean;
  initialIsFollowing: boolean;
  initialNotificationsEnabled: boolean;
}

// Bell icon — filled when active
function BellIcon({ muted }: { muted: boolean }) {
  return muted ? (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      <path d="M18.63 13A17.89 17.89 0 0 1 18 8" />
      <path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14" />
      <path d="M17.99 17.99A5 5 0 0 0 19 8a5 5 0 0 0-9.9-.87" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

export default function FollowButton({
  targetUserId,
  isOwner,
  initialIsFollowing,
  initialNotificationsEnabled,
}: Props) {
  const [isFollowing,  setIsFollowing]  = useState(initialIsFollowing);
  const [notifEnabled, setNotifEnabled] = useState(initialNotificationsEnabled);
  const [loading,      setLoading]      = useState(false);
  const [bellLoading,  setBellLoading]  = useState(false);

  const handleFollow = useCallback(async () => {
    if (loading) return;
    setLoading(true);

    if (isFollowing) {
      const res = await fetch("/api/follow", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followingId: targetUserId }),
      });
      if (res.ok) {
        setIsFollowing(false);
        setNotifEnabled(true); // reset for next follow
      }
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

  const handleToggleNotif = useCallback(async () => {
    if (bellLoading) return;
    const next = !notifEnabled;
    setNotifEnabled(next); // optimistic
    setBellLoading(true);

    const res = await fetch("/api/follow/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ followingId: targetUserId, enabled: next }),
    });

    if (!res.ok) setNotifEnabled(!next); // rollback
    setBellLoading(false);
  }, [bellLoading, notifEnabled, targetUserId]);

  // Never render on own profile
  if (isOwner) return null;

  const btnBase: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 5,
    padding: "6px 13px", borderRadius: 6, border: "none",
    cursor: loading ? "default" : "pointer",
    fontSize: 12, fontWeight: 510,
    fontFeatureSettings: "'cv01','ss03'",
    transition: "background 0.15s, color 0.15s",
    opacity: loading ? 0.65 : 1,
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {/* Follow / Siguiendo */}
      <button
        onClick={handleFollow}
        disabled={loading}
        style={isFollowing ? {
          ...btnBase,
          background: "var(--color-bg-card-elev)",
          color: "var(--color-text-secondary)",
          border: "1px solid var(--color-border-std)",
        } : {
          ...btnBase,
          background: "var(--color-brand)",
          color: "white",
          border: "1px solid transparent",
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

      {/* Bell toggle — visible only while following */}
      {isFollowing && (
        <button
          onClick={handleToggleNotif}
          disabled={bellLoading}
          title={notifEnabled ? "Desactivar notificaciones" : "Activar notificaciones"}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 30, height: 30, borderRadius: 6, border: "none",
            cursor: bellLoading ? "default" : "pointer",
            opacity: bellLoading ? 0.55 : 1,
            background: notifEnabled
              ? "rgba(58,125,94,0.12)"
              : "var(--color-bg-card-elev)",
            color: notifEnabled
              ? "var(--color-brand)"
              : "var(--color-text-subtle)",
            transition: "background 0.15s, color 0.15s",
          }}
        >
          <BellIcon muted={!notifEnabled} />
        </button>
      )}
    </div>
  );
}
