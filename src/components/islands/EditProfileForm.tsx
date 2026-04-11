import { useState, useCallback } from "react";
import { t, type Lang } from "@/lib/i18n";

interface Props {
  lang: Lang;
  initialName: string;
  initialBio: string;
  initialSocials: Record<string, string>;
  onClose: () => void;
  onSaved: () => void;
}

interface SocialField {
  key: string;
  label: string;
  prefix: string | null;
  /** SVG path d attribute */
  iconPath: string;
  /** "stroke" = outline icon, "fill" = filled icon */
  iconType: "stroke" | "fill";
}

const SOCIAL_FIELDS: SocialField[] = [
  {
    key: "website",
    label: "Website",
    prefix: null,
    iconType: "stroke",
    iconPath: "M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 0v20M2 12h20M4.93 4.93C6.36 8.36 8 10 12 10s5.64-1.64 7.07-5.07M4.93 19.07C6.36 15.64 8 14 12 14s5.64 1.36 7.07 4.93",
  },
  {
    key: "twitter",
    label: "X",
    prefix: "https://x.com/",
    iconType: "fill",
    iconPath: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.74-8.855L2.25 2.25h6.826l4.26 5.637 4.908-5.637zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  },
  {
    key: "instagram",
    label: "Instagram",
    prefix: "https://www.instagram.com/",
    iconType: "fill",
    iconPath: "M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.74 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z",
  },
  {
    key: "github",
    label: "GitHub",
    prefix: "https://github.com/",
    iconType: "fill",
    iconPath: "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    prefix: "https://www.linkedin.com/in/",
    iconType: "fill",
    iconPath: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  },
];

const LEGACY_PREFIXES: Partial<Record<string, string>> = {
  twitter: "https://twitter.com/",
};

function extractHandle(url: string, prefix: string): string {
  if (!url) return "";
  if (url.startsWith(prefix)) return url.slice(prefix.length);
  for (const lp of Object.values(LEGACY_PREFIXES)) {
    if (url.startsWith(lp)) return url.slice(lp.length);
  }
  return url;
}

function initHandles(initialSocials: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const field of SOCIAL_FIELDS) {
    const val = initialSocials[field.key] ?? "";
    result[field.key] = field.prefix ? extractHandle(val, field.prefix) : val;
  }
  return result;
}

const fs: React.CSSProperties = {
  background: "var(--color-bg-card-hover)",
  border: "1px solid var(--color-border-std)",
  color: "var(--color-text-primary)",
  fontFeatureSettings: "'cv01','ss03'",
};

export default function EditProfileForm({ lang, initialName, initialBio, initialSocials, onClose, onSaved }: Props) {
  const [name, setName] = useState(initialName);
  const [bio, setBio] = useState(initialBio);
  const [handles, setHandles] = useState<Record<string, string>>(() => initHandles(initialSocials));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const social_links: Record<string, string> = {};
      for (const field of SOCIAL_FIELDS) {
        const handle = handles[field.key]?.trim() ?? "";
        if (!handle) continue;
        social_links[field.key] = field.prefix ? field.prefix + handle : handle;
      }
      const res = await fetch("/api/user/profile", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio, social_links }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) { setError(data.error ?? "Update failed"); return; }
      onSaved();
    } finally { setLoading(false); }
  }, [name, bio, handles, onSaved]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: "rgba(0,0,0,0.85)" }}>
      <div className="w-full max-w-md rounded-panel p-6"
           style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-std)",
                    maxHeight: "90vh", overflowY: "auto" }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[17px] tracking-[-0.165px]"
              style={{ fontWeight: 590, color: "var(--color-text-primary)", fontFeatureSettings: "'cv01','ss03'" }}>
            {t("profile.edit", lang)}
          </h2>
          <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                  style={{ background: "var(--color-bg-card-elev)", color: "var(--color-text-subtle)" }}>
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 px-3 py-2.5 rounded text-sm"
               style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs mb-1.5" style={{ fontWeight: 510, color: "var(--color-text-muted)" }}>
              {t("profile.form.name", lang)} <span style={{ color: "var(--color-text-subtle)" }}>*</span>
            </label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                   className="w-full px-3.5 py-2.5 rounded text-sm outline-none" style={fs} />
          </div>

          <div>
            <label className="block text-xs mb-1.5" style={{ fontWeight: 510, color: "var(--color-text-muted)" }}>
              {t("profile.form.bio", lang)}
            </label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={300}
                      className="w-full px-3.5 py-2.5 rounded text-sm outline-none resize-none" style={fs} />
            <p className="text-xs mt-1 text-right" style={{ color: "var(--color-text-subtle)" }}>{bio.length}/300</p>
          </div>

          <div>
            <label className="block text-xs mb-2" style={{ fontWeight: 510, color: "var(--color-text-muted)" }}>
              {t("profile.form.socials", lang)}
            </label>
            <div className="space-y-2">
              {SOCIAL_FIELDS.map(({ key, label, prefix, iconPath, iconType }) => (
                <div key={key} className="flex items-center gap-2">

                  {/* Input — prefix+handle or free-form */}
                  {prefix ? (
                    <div className="flex flex-1 rounded"
                         style={{ border: "1px solid var(--color-border-std)", background: "var(--color-bg-card-elev)" }}>
                      {/* Logo inside the container */}
                      <div className="relative group shrink-0 flex items-center justify-center px-2.5 rounded-l"
                           style={{ color: "var(--color-text-subtle)" }}>
                        <svg
                          width="13" height="13" viewBox="0 0 24 24"
                          fill={iconType === "fill" ? "currentColor" : "none"}
                          stroke={iconType === "stroke" ? "currentColor" : "none"}
                          strokeWidth={iconType === "stroke" ? "1.75" : undefined}
                          strokeLinecap={iconType === "stroke" ? "round" : undefined}
                          strokeLinejoin={iconType === "stroke" ? "round" : undefined}
                        >
                          <path d={iconPath} />
                        </svg>
                        {/* Tooltip */}
                        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5
                                         px-2 py-0.5 rounded text-xs whitespace-nowrap
                                         opacity-0 group-hover:opacity-100 transition-opacity duration-100"
                              style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-std)",
                                       color: "var(--color-text-secondary)", zIndex: 20,
                                       boxShadow: "0 4px 12px rgba(0,0,0,0.18)" }}>
                          {label}
                        </span>
                      </div>
                      {/* Thin divider */}
                      <div className="w-px self-stretch" style={{ background: "var(--color-border-subtle)" }} />
                      {/* Prefix */}
                      <span className="px-2.5 py-2 text-xs shrink-0 select-none"
                            style={{ color: "var(--color-text-primary)", whiteSpace: "nowrap" }}>
                        {prefix}
                      </span>
                      {/* Thin divider */}
                      <div className="w-px self-stretch" style={{ background: "var(--color-border-subtle)" }} />
                      {/* Handle */}
                      <input
                        type="text"
                        value={handles[key] ?? ""}
                        onChange={(e) => setHandles((p) => ({ ...p, [key]: e.target.value }))}
                        className="flex-1 min-w-0 px-2.5 py-2 text-xs outline-none rounded-r"
                        style={{ background: "var(--color-bg-card-hover)", color: "var(--color-text-primary)",
                                 fontFeatureSettings: "'cv01','ss03'" }}
                      />
                    </div>
                  ) : (
                    /* Website: logo inside free-form container too */
                    <div className="flex flex-1 rounded"
                         style={{ border: "1px solid var(--color-border-std)", background: "var(--color-bg-card-elev)" }}>
                      <div className="relative group shrink-0 flex items-center justify-center px-2.5 rounded-l"
                           style={{ color: "var(--color-text-subtle)" }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                             strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                          <path d={iconPath} />
                        </svg>
                        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5
                                         px-2 py-0.5 rounded text-xs whitespace-nowrap
                                         opacity-0 group-hover:opacity-100 transition-opacity duration-100"
                              style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-std)",
                                       color: "var(--color-text-secondary)", zIndex: 20,
                                       boxShadow: "0 4px 12px rgba(0,0,0,0.18)" }}>
                          {label}
                        </span>
                      </div>
                      <div className="w-px self-stretch" style={{ background: "var(--color-border-subtle)" }} />
                      <input
                        type="url"
                        value={handles[key] ?? ""}
                        onChange={(e) => setHandles((p) => ({ ...p, [key]: e.target.value }))}
                        className="flex-1 min-w-0 px-2.5 py-2 text-xs outline-none rounded-r"
                        style={{ background: "var(--color-bg-card-hover)", color: "var(--color-text-primary)",
                                 fontFeatureSettings: "'cv01','ss03'" }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button type="submit" disabled={loading} className="px-5 py-2 rounded text-sm text-white transition-colors"
                    style={{ fontWeight: 510, background: loading ? "rgba(58,125,94,0.6)" : "var(--color-brand)",
                             cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? t("profile.form.saving", lang) : t("profile.form.save", lang)}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 rounded text-sm transition-colors"
                    style={{ fontWeight: 510, color: "var(--color-text-muted)" }}>
              {t("profile.form.cancel", lang)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
