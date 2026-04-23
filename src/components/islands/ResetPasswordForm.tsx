import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { t, type Lang } from "@/lib/i18n";

interface Props {
  lang: Lang;
}

export default function ResetPasswordForm({ lang }: Props) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let mounted = true;

    const clearAuthParamsFromUrl = () => {
      const current = new URL(window.location.href);
      const keys = ["code", "token_hash", "type", "error", "error_code", "error_description"];
      let changed = false;
      for (const key of keys) {
        if (current.searchParams.has(key)) {
          current.searchParams.delete(key);
          changed = true;
        }
      }
      if (changed) {
        const nextSearch = current.searchParams.toString();
        const nextUrl = `${current.pathname}${nextSearch ? `?${nextSearch}` : ""}${current.hash}`;
        window.history.replaceState({}, "", nextUrl);
      }
    };

    const resolveRecoverySession = async () => {
      try {
        const current = new URL(window.location.href);
        const code = current.searchParams.get("code");
        const tokenHash = current.searchParams.get("token_hash");
        const type = current.searchParams.get("type");

        // Recovery should use token_hash + verifyOtp. Using code requires a PKCE
        // code_verifier in local storage (not available in this server-initiated flow).
        if (tokenHash && type === "recovery") {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            type: "recovery",
            token_hash: tokenHash,
          });
          if (verifyError) {
            setError(verifyError.message);
          }
          clearAuthParamsFromUrl();
        } else if (code) {
          setError(
            lang === "es"
              ? "El enlace de recuperación no es válido para este flujo. Usa una plantilla con token_hash."
              : "Recovery link is not valid for this flow. Use a template that includes token_hash."
          );
          clearAuthParamsFromUrl();
        }

        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        setSessionReady(Boolean(data.session));
      } finally {
        if (mounted) setCheckingSession(false);
      }
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        setSessionReady(Boolean(session));
        setCheckingSession(false);
      }
    });

    void resolveRecoverySession();

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError(t("auth.field.passwordNew", lang));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("auth.reset.mismatch", lang));
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/auth/login";
      }, 1200);
    } finally {
      setLoading(false);
    }
  }, [password, confirmPassword, lang]);

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
          {t("auth.reset.title", lang)}
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--color-text-subtle)" }}>
          {t("auth.reset.subtitle", lang)}
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
            {t("auth.reset.success", lang)}
          </div>
        ) : checkingSession ? (
          <div
            className="px-3 py-2.5 rounded text-sm"
            style={{ background: "rgba(58,125,94,0.12)", border: "1px solid rgba(58,125,94,0.28)", color: "#9ae6b4" }}
          >
            {lang === "es" ? "Verificando enlace de recuperación..." : "Verifying recovery link..."}
          </div>
        ) : !sessionReady ? (
          <div
            className="px-3 py-2.5 rounded text-sm"
            style={{ background: "rgba(245,158,11,0.10)", border: "1px solid rgba(245,158,11,0.28)", color: "#fbbf24" }}
          >
            {t("auth.reset.invalidSession", lang)}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs mb-1.5" style={{ fontWeight: 510, color: "var(--color-text-muted)" }}>
                {t("auth.reset.field.password", lang)}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("auth.field.passwordNew", lang)}
                autoComplete="new-password"
                className="w-full px-3.5 py-2.5 rounded text-sm outline-none transition-colors"
                style={{
                  background: "var(--color-bg-card-hover)",
                  border: "1px solid var(--color-border-std)",
                  color: "var(--color-text-primary)",
                  fontFeatureSettings: "'cv01','ss03'",
                }}
              />
            </div>

            <div>
              <label className="block text-xs mb-1.5" style={{ fontWeight: 510, color: "var(--color-text-muted)" }}>
                {t("auth.reset.field.confirm", lang)}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t("auth.reset.field.confirm", lang)}
                autoComplete="new-password"
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
              {loading ? "..." : t("auth.reset.btn", lang)}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
