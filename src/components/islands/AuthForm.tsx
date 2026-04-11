import { useState, useEffect, useCallback } from "react";
import { t, type Lang } from "@/lib/i18n";

type Mode = "login" | "register";

interface Props {
  lang: Lang;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function AuthForm({ lang }: Props) {
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const debouncedUsername = useDebounce(username, 400);

  useEffect(() => {
    if (mode !== "register") return;
    const u = debouncedUsername.toLowerCase().trim();
    if (!u) { setUsernameStatus("idle"); return; }
    if (!/^[a-z0-9_]{3,30}$/.test(u)) { setUsernameStatus("invalid"); return; }
    setUsernameStatus("checking");
    fetch(`/api/auth/check-username?username=${encodeURIComponent(u)}`)
      .then(r => r.json())
      .then((data: { available: boolean }) => setUsernameStatus(data.available ? "available" : "taken"))
      .catch(() => setUsernameStatus("idle"));
  }, [debouncedUsername, mode]);

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) { setError(data.error ?? "Login failed"); return; }
      window.location.href = "/";
    } finally { setLoading(false); }
  }, [identifier, password]);

  const handleRegister = useCallback(async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (usernameStatus !== "available") { setError(t("auth.user.invalid", lang)); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username: username.toLowerCase().trim(), email, password: regPassword }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) { setError(data.error ?? "Registration failed"); return; }
      window.location.href = "/";
    } finally { setLoading(false); }
  }, [name, username, email, regPassword, usernameStatus, lang]);

  const usernameHint = {
    idle:      null,
    checking:  <span style={{ color: "var(--color-text-subtle)" }}>{t("auth.user.checking", lang)}</span>,
    available: <span style={{ color: "#27a644" }}>{t("auth.user.available", lang)}</span>,
    taken:     <span style={{ color: "#ef4444" }}>{t("auth.user.taken", lang)}</span>,
    invalid:   <span style={{ color: "#ef4444" }}>{t("auth.user.invalid", lang)}</span>,
  }[usernameStatus];

  const card: React.CSSProperties = {
    background: "var(--color-bg-card)",
    border: "1px solid var(--color-border-std)",
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="rounded-panel p-8" style={card}>
        {/* Mode tabs */}
        <div className="flex items-center gap-1 mb-8">
          {(["login", "register"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(""); }}
              className="px-3 py-1.5 rounded text-sm transition-colors"
              style={{
                fontWeight: 510,
                background: mode === m ? "var(--color-bg-card-elev)" : "transparent",
                color: mode === m ? "var(--color-text-primary)" : "var(--color-text-subtle)",
              }}
            >
              {m === "login" ? t("auth.tab.signin", lang) : t("auth.tab.register", lang)}
            </button>
          ))}
        </div>

        {/* Title */}
        <h1 className="text-[20px] tracking-[-0.24px] mb-1"
            style={{ fontWeight: 590, color: "var(--color-text-primary)" }}>
          {mode === "login" ? t("auth.signin.title", lang) : t("auth.register.title", lang)}
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--color-text-subtle)" }}>
          {mode === "login" ? t("auth.signin.subtitle", lang) : t("auth.register.subtitle", lang)}
        </p>

        {error && (
          <div className="mb-4 px-3 py-2.5 rounded text-sm"
               style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
            {error}
          </div>
        )}

        {/* Login form */}
        {mode === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <Field label={t("auth.field.emailOrUser", lang)} type="text" value={identifier} onChange={setIdentifier}
                   placeholder="you@example.com" autoComplete="username" />
            <Field label={t("auth.field.password", lang)} type="password" value={password} onChange={setPassword}
                   placeholder="••••••••" autoComplete="current-password" />
            <SubmitBtn loading={loading}>{t("auth.btn.signin", lang)}</SubmitBtn>
          </form>
        )}

        {/* Register form */}
        {mode === "register" && (
          <form onSubmit={handleRegister} className="space-y-4">
            <Field label={t("auth.field.name", lang)} type="text" value={name} onChange={setName}
                   placeholder="Jane Doe" autoComplete="name" />
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs" style={{ fontWeight: 510, color: "var(--color-text-muted)" }}>
                  {t("auth.field.username", lang)}
                </label>
                <span className="text-xs">{usernameHint}</span>
              </div>
              <input
                type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                placeholder="jane_doe" autoComplete="username"
                className="w-full px-3.5 py-2.5 rounded text-sm outline-none transition-colors"
                style={{
                  background: "var(--color-bg-card-hover)",
                  border: usernameStatus === "available" ? "1px solid rgba(39,166,68,0.4)"
                        : usernameStatus === "taken" || usernameStatus === "invalid" ? "1px solid rgba(239,68,68,0.4)"
                        : "1px solid var(--color-border-std)",
                  color: "var(--color-text-primary)",
                  fontFeatureSettings: "'cv01','ss03'",
                }}
              />
            </div>
            <Field label={t("auth.field.email", lang)} type="email" value={email} onChange={setEmail}
                   placeholder="you@example.com" autoComplete="email" />
            <Field label={t("auth.field.password", lang)} type="password" value={regPassword} onChange={setRegPassword}
                   placeholder={t("auth.field.passwordNew", lang)} autoComplete="new-password" />
            <SubmitBtn loading={loading}>{t("auth.btn.register", lang)}</SubmitBtn>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ label, type, value, onChange, placeholder, autoComplete }: {
  label: string; type: string; value: string;
  onChange: (v: string) => void; placeholder?: string; autoComplete?: string;
}) {
  return (
    <div>
      <label className="block text-xs mb-1.5" style={{ fontWeight: 510, color: "var(--color-text-muted)" }}>
        {label}
      </label>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} autoComplete={autoComplete}
        className="w-full px-3.5 py-2.5 rounded text-sm outline-none transition-colors"
        style={{
          background: "var(--color-bg-card-hover)",
          border: "1px solid var(--color-border-std)",
          color: "var(--color-text-primary)",
          fontFeatureSettings: "'cv01','ss03'",
        }}
      />
    </div>
  );
}

function SubmitBtn({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit" disabled={loading}
      className="w-full py-2.5 rounded text-sm text-white transition-colors mt-2"
      style={{
        fontWeight: 510, fontFeatureSettings: "'cv01','ss03'",
        background: loading ? "rgba(58,125,94,0.6)" : "var(--color-brand)",
        cursor: loading ? "not-allowed" : "pointer",
      }}
    >
      {loading ? "…" : children}
    </button>
  );
}
