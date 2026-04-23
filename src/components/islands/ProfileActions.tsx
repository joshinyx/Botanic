import { useState } from "react";
import EditProfileForm from "./EditProfileForm";
import { t, type Lang } from "@/lib/i18n";

interface Props {
  lang: Lang;
  initialName: string;
  initialBio: string;
  initialSocials: Record<string, string>;
  initialAvatarUrl: string | null;
  initialBannerUrl: string | null;
}

export default function ProfileActions({ lang, initialName, initialBio, initialSocials, initialAvatarUrl, initialBannerUrl }: Props) {
  const [editing, setEditing] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        title={t("profile.edit", lang)}
        onClick={() => setEditing(true)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setEditing(true); }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          cursor: "pointer", padding: 4, lineHeight: 0,
          color: hovered ? "var(--color-text-secondary)" : "var(--color-text-faint)",
          transition: "color 0.12s",
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M12.085 6.5l5.415 5.415l-8.793 8.792a1 1 0 0 1 -.707 .293h-4a1 1 0 0 1 -1 -1v-4a1 1 0 0 1 .293 -.707z" />
          <path d="M17.491 3.802a3.828 3.828 0 0 1 1.716 6.405l-.292 .293l-5.415 -5.415l.293 -.292a3.83 3.83 0 0 1 3.698 -.991" />
        </svg>
      </div>

      {editing && (
        <EditProfileForm
          lang={lang}
          initialName={initialName}
          initialBio={initialBio}
          initialSocials={initialSocials}
          initialAvatarUrl={initialAvatarUrl}
          initialBannerUrl={initialBannerUrl}
          onClose={() => setEditing(false)}
          onSaved={() => { setEditing(false); window.location.reload(); }}
        />
      )}
    </>
  );
}
