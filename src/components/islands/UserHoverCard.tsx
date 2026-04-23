import { useState, useCallback, useRef, useEffect } from "react";

export interface HoverUser {
  username: string;
  name: string;
  bio: string | null;
  avatar_url: string | null;
  followers_count: number;
  following_count: number;
  plants_count?: number;
  social_links?: Record<string, string> | null;
}

type SocialIconDef = { path: string; type: "stroke" | "fill" };
const SOCIAL_ICONS: Record<string, SocialIconDef> = {
  website:   { type: "stroke", path: "M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 0v20M2 12h20M4.93 4.93C6.36 8.36 8 10 12 10s5.64-1.64 7.07-5.07M4.93 19.07C6.36 15.64 8 14 12 14s5.64 1.36 7.07 4.93" },
  twitter:   { type: "fill",   path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.74-8.855L2.25 2.25h6.826l4.26 5.637 4.908-5.637zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
  instagram: { type: "fill",   path: "M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.74 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" },
  github:    { type: "fill",   path: "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" },
  linkedin:  { type: "fill",   path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" },
};

function ProfilePopover({ user }: { user: HoverUser }) {
  const initial = user.name.charAt(0).toUpperCase();
  const socials = user.social_links
    ? Object.entries(user.social_links).filter(([, v]) => v && v.startsWith("http"))
    : [];

  return (
    <div>
      <div style={{ height: 3, background: "linear-gradient(90deg, var(--color-brand), var(--color-accent))" }} />
      <div style={{ padding: "14px 14px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          {user.avatar_url ? (
            <img src={user.avatar_url} alt={user.name}
                 style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "2px solid var(--color-border-std)" }} />
          ) : (
            <div style={{
              width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
              background: "rgba(58,125,94,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, fontWeight: 590, color: "#52b788",
            }}>
              {initial}
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 590, color: "var(--color-text-primary)", fontFeatureSettings: "'cv01','ss03'", lineHeight: 1.2 }}>
              {user.name}
            </p>
            <p style={{ margin: 0, fontSize: 11, color: "var(--color-accent)", fontWeight: 510 }}>
              @{user.username}
            </p>
          </div>
        </div>

        {user.bio && (
          <p style={{
            margin: "0 0 10px", fontSize: 11, lineHeight: 1.5,
            color: "var(--color-text-muted)",
            display: "-webkit-box", WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>
            {user.bio}
          </p>
        )}

        <div style={{ display: "flex", gap: 14, marginBottom: socials.length ? 10 : 0 }}>
          {(user.plants_count !== undefined) && (
            <div style={{ textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 590, color: "var(--color-text-primary)", lineHeight: 1 }}>{user.plants_count}</p>
              <p style={{ margin: 0, fontSize: 10, color: "var(--color-text-faint)", marginTop: 2 }}>plants</p>
            </div>
          )}
          <div style={{ textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 590, color: "var(--color-text-primary)", lineHeight: 1 }}>{user.followers_count}</p>
            <p style={{ margin: 0, fontSize: 10, color: "var(--color-text-faint)", marginTop: 2 }}>followers</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 590, color: "var(--color-text-primary)", lineHeight: 1 }}>{user.following_count}</p>
            <p style={{ margin: 0, fontSize: 10, color: "var(--color-text-faint)", marginTop: 2 }}>following</p>
          </div>
        </div>

        {socials.length > 0 && (
          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            {socials.map(([platform, url]) => {
              const icon = SOCIAL_ICONS[platform] ?? SOCIAL_ICONS["website"];
              return (
                <a key={platform} href={url} target="_blank" rel="noopener noreferrer"
                   onClick={(e) => e.stopPropagation()}
                   title={platform}
                   style={{ color: "var(--color-text-subtle)", textDecoration: "none", display: "flex" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24"
                       fill={icon.type === "fill" ? "currentColor" : "none"}
                       stroke={icon.type === "stroke" ? "currentColor" : "none"}
                       strokeWidth="1.5">
                    <path d={icon.path} />
                  </svg>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

interface UserMentionProps {
  user: HoverUser;
  /** Popover placement: "up" (default) or "down" */
  placement?: "up" | "down";
  style?: React.CSSProperties;
}

export function UserMention({ user, placement = "up", style }: UserMentionProps) {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onEnter = useCallback(() => {
    if (hideTimer.current) { clearTimeout(hideTimer.current); hideTimer.current = null; }
    showTimer.current = setTimeout(() => setVisible(true), 220);
  }, []);

  const onLeave = useCallback(() => {
    if (showTimer.current) { clearTimeout(showTimer.current); showTimer.current = null; }
    hideTimer.current = setTimeout(() => setVisible(false), 120);
  }, []);

  useEffect(() => () => {
    if (showTimer.current) clearTimeout(showTimer.current);
    if (hideTimer.current) clearTimeout(hideTimer.current);
  }, []);

  const popoverStyle: React.CSSProperties = placement === "up"
    ? { bottom: "calc(100% + 10px)", left: 0 }
    : { top: "calc(100% + 10px)", left: 0 };

  return (
    <div style={{ position: "relative", display: "inline-flex", ...style }}>
      <a
        href={`/user/${user.username}`}
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={() => { setHovered(true); onEnter(); }}
        onMouseLeave={() => { setHovered(false); onLeave(); }}
        style={{
          fontSize: 11, fontWeight: 510,
          color: hovered ? "var(--color-accent-hover, #74c69d)" : "var(--color-accent)",
          textDecoration: hovered ? "underline" : "none",
          textUnderlineOffset: 2,
          fontFeatureSettings: "'cv01','ss03'",
          transition: "color 0.15s",
          display: "inline-flex", alignItems: "center", gap: 3,
          cursor: "pointer",
        }}
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
             strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4"/>
          <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7"/>
        </svg>
        @{user.username}
      </a>

      {visible && (
        <>
          {/* Mouse bridge so pointer can reach the popover */}
          <div
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
            style={{
              position: "absolute",
              ...(placement === "up" ? { bottom: "100%" } : { top: "100%" }),
              left: 0, width: 220, height: 12, background: "transparent",
            }}
          />
          <div
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
            style={{
              position: "absolute",
              ...popoverStyle,
              width: 220,
              background: "var(--color-bg-surface)",
              border: "1px solid var(--color-border-std)",
              borderRadius: 12,
              boxShadow: "0 8px 28px rgba(0,0,0,0.32), 0 2px 8px rgba(0,0,0,0.12)",
              zIndex: 200,
              animation: "dropdown-in 0.12s ease",
              overflow: "hidden",
            }}
          >
            <ProfilePopover user={user} />
          </div>
        </>
      )}
    </div>
  );
}
