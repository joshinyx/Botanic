import { useCallback, useState } from "react";
import { t, type Lang } from "@/lib/i18n";

interface Props {
  lang: Lang;
}

export default function ForgotPasswordForm({ lang }: Props) {
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!identifier.trim()) {
      setError(t("form.required", lang));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim() }),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Request failed");
        return;
      }

      setSuccess(true);
    } finally {
      setLoading(false);
    }
  }, [identifier, lang]);

  return (
    <div className="w-full max-w-sm mx-auto">
      <div
        className="rounded-panel p-8"
        style={{
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border-std)",
        }}
      >
        <h1 className="text-[20px] tracking-[-0.24px] mb-1" style={{ fontWeight: 590, color: "var(--color-text-primary)" }}>
          {t("auth.forgot.title", lang)}
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--color-text-subtle)" }}>
          {t("auth.forgot.subtitle", lang)}
        </p>

        {error && (
          <div
            className="mb-4 px-3 py-2.5 rounded text-sm"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}
          >
            {error}
          </div>
        )}

        {success ? (
          <div
            className="px-3 py-2.5 rounded text-sm"
            style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.24)", color: "#34d399" }}
          >
            {t("auth.forgot.success", lang)}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs mb-1.5" style={{ fontWeight: 510, color: "var(--color-text-muted)" }}>
                {t("auth.forgot.field.identifier", lang)}
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="you@example.com"
                autoComplete="username"
                className="w-full px-3.5 py-2.5 rounded text-sm outline-none transition-colors"
                style={{
                  background: "var(--color-bg-card-hover)",
                  border: "1px solid var(--color-border-std)",
                  color: "var(--color-text-primary)",
                  fontFeatureSettings: "'cv01','ss03'",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded text-sm text-white transition-colors"
              style={{
                fontWeight: 510,
                fontFeatureSettings: "'cv01','ss03'",
                background: loading ? "rgba(58,125,94,0.6)" : "var(--color-brand)",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "..." : t("auth.forgot.btn", lang)}
            </button>
          </form>
        )}

        <a
          href="/auth/login"
          className="mt-6 inline-block text-xs transition-colors hover:underline underline-offset-2"
          style={{ color: "var(--color-text-muted)" }}
        >
          {t("auth.forgot.back", lang)}
        </a>
      </div>
    </div>
  );
}
