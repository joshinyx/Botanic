import { useState } from "react";

interface Props {
  plantId: string;
  plantName: string;
}

export default function QRDownload({ plantId, plantName }: Props) {
  const [loading, setLoading] = useState<"png" | "svg" | null>(null);

  async function download(format: "png" | "svg") {
    setLoading(format);
    try {
      const res = await fetch(`/api/plants/${plantId}/qr?format=${format}`);
      if (!res.ok) throw new Error("Failed to generate QR");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${plantName.toLowerCase().replace(/\s+/g, "-")}-qr.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => download("png")}
        disabled={loading !== null}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-colors"
        style={{
          fontWeight: 510,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: loading === "png" ? "#62666d" : "#d0d6e0",
          cursor: loading ? "not-allowed" : "pointer",
          fontFeatureSettings: "'cv01','ss03'",
        }}
      >
        {loading === "png" ? (
          <Spinner />
        ) : (
          <DownloadIcon />
        )}
        PNG
      </button>
      <button
        onClick={() => download("svg")}
        disabled={loading !== null}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-colors"
        style={{
          fontWeight: 510,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: loading === "svg" ? "#62666d" : "#d0d6e0",
          cursor: loading ? "not-allowed" : "pointer",
          fontFeatureSettings: "'cv01','ss03'",
        }}
      >
        {loading === "svg" ? (
          <Spinner />
        ) : (
          <DownloadIcon />
        )}
        SVG
      </button>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2"
      className="animate-spin"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
