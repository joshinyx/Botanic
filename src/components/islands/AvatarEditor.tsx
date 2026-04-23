interface Props {
  name: string;
  initialAvatarUrl: string | null;
  size?: number;
}

export default function AvatarEditor({ name, initialAvatarUrl, size = 64 }: Props) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      overflow: "hidden", flexShrink: 0,
      background: "#1e3a2a",
      border: `${size >= 80 ? 3 : 2}px solid var(--color-bg-panel)`,
      boxShadow: "0 0 0 1px rgba(58,125,94,0.25)",
    }}>
      {initialAvatarUrl ? (
        <img src={initialAvatarUrl} alt={name}
             style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      ) : (
        <div style={{
          width: "100%", height: "100%",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: Math.round(size * 0.36), fontWeight: 590, color: "#52b788",
          fontFeatureSettings: "'cv01','ss03'",
        }}>
          {initial}
        </div>
      )}
    </div>
  );
}
