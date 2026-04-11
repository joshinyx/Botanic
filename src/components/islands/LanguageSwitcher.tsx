import { useState, useCallback } from "react";
import type { Lang } from "@/lib/i18n";

interface Props {
  currentLang: Lang;
}

export default function LanguageSwitcher({ currentLang }: Props) {
  const [lang, setLang] = useState<Lang>(currentLang);
  const [animating, setAnimating] = useState(false);

  const toggle = useCallback(() => {
    if (animating) return;
    const next: Lang = lang === "es" ? "en" : "es";
    setAnimating(true);
    setLang(next);
    document.cookie = `bc_lang=${next}; path=/; max-age=31536000; SameSite=Lax`;
    localStorage.setItem("bc_lang", next);
    setTimeout(() => window.location.reload(), 150);
  }, [lang, animating]);

  const isES = lang === "es";

  return (
    <button
      onClick={toggle}
      aria-label={isES ? "Switch to English" : "Cambiar a Español"}
      disabled={animating}
      style={{
        display: "flex",
        alignItems: "center",
        position: "relative",
        padding: "2px",
        borderRadius: "7px",
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-border-subtle)",
        cursor: animating ? "not-allowed" : "pointer",
        opacity: animating ? 0.6 : 1,
        transition: "opacity 0.15s ease",
        height: "28px",
      }}
    >
      {/* Sliding active indicator */}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "2px",
          bottom: "2px",
          left: isES ? "2px" : "calc(50% + 1px)",
          width: "calc(50% - 3px)",
          background: "var(--color-bg-card-elev)",
          border: "1px solid var(--color-border-std)",
          borderRadius: "4px",
          transition: "left 0.18s cubic-bezier(0.4, 0, 0.2, 1)",
          pointerEvents: "none",
        }}
      />

      {/* ES option */}
      <span
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          alignItems: "center",
          padding: "2px 8px",
          borderRadius: "4px",
          transition: "opacity 0.15s ease",
          opacity: isES ? 1 : 0.45,
          fontSize: "11px",
          fontWeight: 510,
          color: "var(--color-text-muted)",
          lineHeight: 1,
        }}
      >
        ES
      </span>

      {/* EN option */}
      <span
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          alignItems: "center",
          padding: "2px 8px",
          borderRadius: "4px",
          transition: "opacity 0.15s ease",
          opacity: isES ? 0.45 : 1,
          fontSize: "11px",
          fontWeight: 510,
          color: "var(--color-text-muted)",
          lineHeight: 1,
        }}
      >
        EN
      </span>
    </button>
  );
}
