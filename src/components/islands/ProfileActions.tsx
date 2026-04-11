import { useState } from "react";
import EditProfileForm from "./EditProfileForm";
import { t, type Lang } from "@/lib/i18n";

interface Props {
  lang: Lang;
  initialName: string;
  initialBio: string;
  initialSocials: Record<string, string>;
}

export default function ProfileActions({ lang, initialName, initialBio, initialSocials }: Props) {
  const [editing, setEditing] = useState(false);

  return (
    <>
      <button
        onClick={() => setEditing(true)}
        className="px-3 py-1.5 rounded text-xs transition-colors"
        style={{
          fontWeight: 510,
          border: "1px solid var(--color-border-std)",
          background: "var(--color-bg-card)",
          color: "var(--color-text-secondary)",
          fontFeatureSettings: "'cv01','ss03'",
        }}
      >
        {t("profile.edit", lang)}
      </button>

      {editing && (
        <EditProfileForm
          lang={lang}
          initialName={initialName}
          initialBio={initialBio}
          initialSocials={initialSocials}
          onClose={() => setEditing(false)}
          onSaved={() => { setEditing(false); window.location.reload(); }}
        />
      )}
    </>
  );
}
