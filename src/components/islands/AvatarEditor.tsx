import { useState, useRef, useEffect, useCallback } from "react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type DragMode = "move" | "tl" | "tr" | "bl" | "br";

interface Crop { x: number; y: number; size: number }

interface DragState {
  mode: DragMode;
  startMX: number; startMY: number;
  startCrop: Crop;
}

// ─────────────────────────────────────────────
// CropModal
// ─────────────────────────────────────────────
function CropModal({
  file,
  onApply,
  onCancel,
}: {
  file: File;
  onApply: (blob: Blob) => void;
  onCancel: () => void;
}) {
  const [imgSrc, setImgSrc] = useState("");
  const [crop,   setCrop]   = useState<Crop>({ x: 0, y: 0, size: 0 });
  const [ready,  setReady]  = useState(false);

  const imgRef       = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef      = useRef<DragState | null>(null);

  // ── Load file as data URL ──
  useEffect(() => {
    const reader = new FileReader();
    reader.onload = (e) => setImgSrc(e.target?.result as string ?? "");
    reader.readAsDataURL(file);
  }, [file]);

  // ── Init crop centered in the image ──
  const onImgLoad = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    const w = img.offsetWidth;
    const h = img.offsetHeight;
    const size = Math.round(Math.min(w, h) * 0.8);
    setCrop({ x: Math.round((w - size) / 2), y: Math.round((h - size) / 2), size });
    setReady(true);
  }, []);

  // ── Global pointer move / up ──
  useEffect(() => {
    function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }
    const MIN = 48;

    function onMove(e: PointerEvent) {
      if (!dragRef.current || !imgRef.current) return;
      const img = imgRef.current;
      const W = img.offsetWidth;
      const H = img.offsetHeight;
      const cr = containerRef.current!.getBoundingClientRect();
      const mx = e.clientX - cr.left;
      const my = e.clientY - cr.top;
      const { mode, startMX, startMY, startCrop: s } = dragRef.current;

      let { x, y, size } = s;

      if (mode === "move") {
        x = clamp(s.x + (mx - startMX), 0, W - size);
        y = clamp(s.y + (my - startMY), 0, H - size);
      } else {
        // Fixed opposite corners
        const br = { x: s.x + s.size, y: s.y + s.size };
        const tl = { x: s.x,          y: s.y };
        const tr = { x: s.x + s.size, y: s.y };
        const bl = { x: s.x,          y: s.y + s.size };

        if (mode === "br") {
          const newSize = clamp(Math.min(mx - tl.x, my - tl.y), MIN, Math.min(W - tl.x, H - tl.y));
          x = tl.x; y = tl.y; size = newSize;
        } else if (mode === "tl") {
          const newSize = clamp(Math.min(br.x - mx, br.y - my), MIN, Math.min(br.x, br.y));
          x = br.x - newSize; y = br.y - newSize; size = newSize;
        } else if (mode === "tr") {
          const newSize = clamp(Math.min(mx - bl.x, bl.y - my), MIN, Math.min(W - bl.x, bl.y));
          x = bl.x; y = bl.y - newSize; size = newSize;
        } else if (mode === "bl") {
          const newSize = clamp(Math.min(tr.x - mx, my - tr.y), MIN, Math.min(tr.x, H - tr.y));
          x = tr.x - newSize; y = tr.y; size = newSize;
        }
      }

      setCrop({ x: Math.round(x), y: Math.round(y), size: Math.round(size) });
    }

    function onUp() { dragRef.current = null; }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup",   onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup",   onUp);
    };
  }, []);

  const startDrag = useCallback((mode: DragMode, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const cr = containerRef.current!.getBoundingClientRect();
    dragRef.current = {
      mode,
      startMX: e.clientX - cr.left,
      startMY: e.clientY - cr.top,
      startCrop: { ...crop },
    };
  }, [crop]);

  // ── Apply: canvas crop → JPEG blob ──
  const apply = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    const scaleX = img.naturalWidth  / img.offsetWidth;
    const scaleY = img.naturalHeight / img.offsetHeight;
    const canvas = document.createElement("canvas");
    canvas.width = 400; canvas.height = 400;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(
      img,
      crop.x * scaleX, crop.y * scaleY,
      crop.size * scaleX, crop.size * scaleY,
      0, 0, 400, 400,
    );
    canvas.toBlob((blob) => { if (blob) onApply(blob); }, "image/jpeg", 0.92);
  }, [crop, onApply]);

  // ── Corner handles ──
  const HANDLE = 9; // visual square size
  const handles: { key: DragMode & ("tl"|"tr"|"bl"|"br"); cx: number; cy: number; cursor: string }[] = [
    { key: "tl", cx: crop.x,            cy: crop.y,            cursor: "nwse-resize" },
    { key: "tr", cx: crop.x + crop.size, cy: crop.y,            cursor: "nesw-resize" },
    { key: "bl", cx: crop.x,            cy: crop.y + crop.size, cursor: "nesw-resize" },
    { key: "br", cx: crop.x + crop.size, cy: crop.y + crop.size, cursor: "nwse-resize" },
  ];

  const HIT = 18; // hit-area size (larger than visual for easier grab)

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,0.88)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16,
    }}>
      <div style={{
        width: "100%", maxWidth: 480,
        background: "var(--color-bg-surface)",
        border: "1px solid var(--color-border-std)",
        borderRadius: 12,
        display: "flex", flexDirection: "column",
        maxHeight: "90vh", overflow: "hidden",
      }}>

        {/* Header */}
        <div style={{
          padding: "13px 16px",
          borderBottom: "1px solid var(--color-border-subtle)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 13, fontWeight: 590, color: "var(--color-text-primary)",
                         fontFeatureSettings: "'cv01','ss03'" }}>
            Ajustar foto
          </span>
          <button onClick={onCancel} style={{
            background: "none", border: "none", cursor: "pointer", padding: "0 2px",
            fontSize: 19, lineHeight: 1, color: "var(--color-text-subtle)",
          }}>×</button>
        </div>

        {/* Image + crop overlay */}
        <div style={{ overflowY: "auto", flexShrink: 1 }}>
          <div ref={containerRef} style={{ position: "relative", lineHeight: 0, userSelect: "none" }}>
            {imgSrc && (
              <img
                ref={imgRef}
                src={imgSrc}
                onLoad={onImgLoad}
                draggable={false}
                style={{ width: "100%", display: "block" }}
              />
            )}

            {ready && (
              <>
                {/* Dark overlay: top */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0,
                              height: crop.y, background: "rgba(0,0,0,0.55)", pointerEvents: "none" }} />
                {/* Dark overlay: bottom */}
                <div style={{ position: "absolute", left: 0, right: 0, bottom: 0,
                              top: crop.y + crop.size, background: "rgba(0,0,0,0.55)", pointerEvents: "none" }} />
                {/* Dark overlay: left */}
                <div style={{ position: "absolute", top: crop.y, width: crop.x,
                              height: crop.size, left: 0, background: "rgba(0,0,0,0.55)", pointerEvents: "none" }} />
                {/* Dark overlay: right */}
                <div style={{ position: "absolute", top: crop.y, left: crop.x + crop.size,
                              right: 0, height: crop.size, background: "rgba(0,0,0,0.55)", pointerEvents: "none" }} />

                {/* Crop box — moveable */}
                <div
                  onPointerDown={(e) => startDrag("move", e)}
                  style={{
                    position: "absolute",
                    left: crop.x, top: crop.y,
                    width: crop.size, height: crop.size,
                    border: "1px solid rgba(255,255,255,0.75)",
                    cursor: "move", boxSizing: "border-box",
                  }}
                >
                  {/* Rule-of-thirds grid */}
                  <div style={{ position: "absolute", inset: 0, opacity: 0.2, pointerEvents: "none" }}>
                    <div style={{ position: "absolute", left: "33.33%", top: 0, bottom: 0, width: 1, background: "white" }} />
                    <div style={{ position: "absolute", left: "66.66%", top: 0, bottom: 0, width: 1, background: "white" }} />
                    <div style={{ position: "absolute", top: "33.33%", left: 0, right: 0, height: 1, background: "white" }} />
                    <div style={{ position: "absolute", top: "66.66%", left: 0, right: 0, height: 1, background: "white" }} />
                  </div>
                </div>

                {/* Corner handles */}
                {handles.map(({ key, cx, cy, cursor }) => (
                  <div
                    key={key}
                    onPointerDown={(e) => startDrag(key, e)}
                    style={{
                      position: "absolute",
                      width: HIT, height: HIT,
                      left: cx - HIT / 2, top: cy - HIT / 2,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor, zIndex: 2,
                    }}
                  >
                    <div style={{
                      width: HANDLE, height: HANDLE,
                      background: "white", borderRadius: 2,
                      boxShadow: "0 1px 4px rgba(0,0,0,0.55)",
                    }} />
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: "11px 16px",
          borderTop: "1px solid var(--color-border-subtle)",
          display: "flex", justifyContent: "flex-end", gap: 8,
          flexShrink: 0,
        }}>
          <button onClick={onCancel} style={{
            padding: "7px 16px", borderRadius: 6, border: "none", cursor: "pointer",
            fontSize: 12, fontWeight: 510,
            background: "var(--color-bg-card-elev)", color: "var(--color-text-secondary)",
            fontFeatureSettings: "'cv01','ss03'",
          }}>
            Cancelar
          </button>
          <button onClick={apply} style={{
            padding: "7px 16px", borderRadius: 6, border: "none", cursor: "pointer",
            fontSize: 12, fontWeight: 510,
            background: "var(--color-brand)", color: "white",
            fontFeatureSettings: "'cv01','ss03'",
          }}>
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// AvatarEditor
// ─────────────────────────────────────────────
interface Props {
  name: string;
  initialAvatarUrl: string | null;
  isOwner: boolean;
}

export default function AvatarEditor({ name, initialAvatarUrl, isOwner }: Props) {
  const [avatarUrl,   setAvatarUrl]   = useState(initialAvatarUrl);
  const [hovered,     setHovered]     = useState(false);
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [fileForCrop, setFileForCrop] = useState<File | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const fileRef      = useRef<HTMLInputElement>(null);
  const initial      = name.charAt(0).toUpperCase();

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function onPointer(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node))
        setMenuOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [menuOpen]);

  // File selected → show crop modal (no upload yet)
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setFileForCrop(file);
    if (fileRef.current) fileRef.current.value = "";
  }, []);

  // After crop: upload the resulting blob
  const handleCropApply = useCallback(async (blob: Blob) => {
    setFileForCrop(null);
    setLoading(true);
    setError("");
    try {
      const body = new FormData();
      body.append("avatar", blob, "avatar.jpg");
      const res  = await fetch("/api/user/avatar", { method: "POST", body });
      const data = await res.json() as { ok?: boolean; url?: string; error?: string };
      if (!res.ok) { setError(data.error ?? "Upload failed"); return; }
      setAvatarUrl(`${data.url}?t=${Date.now()}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRemove = useCallback(async () => {
    setMenuOpen(false); setError(""); setLoading(true);
    try {
      const res  = await fetch("/api/user/avatar", { method: "DELETE" });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) { setError(data.error ?? "Remove failed"); return; }
      setAvatarUrl(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const showOverlay = isOwner && (hovered || menuOpen || loading);

  return (
    <>
      {/* Crop modal — rendered outside the avatar DOM tree so it's full-screen */}
      {fileForCrop && (
        <CropModal
          file={fileForCrop}
          onApply={handleCropApply}
          onCancel={() => setFileForCrop(null)}
        />
      )}

      <div ref={containerRef} style={{ position: "relative", display: "inline-block", flexShrink: 0 }}>

        {/* Avatar circle */}
        <div
          onMouseEnter={() => isOwner && setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={() => { if (isOwner) { setMenuOpen(o => !o); setError(""); } }}
          style={{
            width: 64, height: 64, borderRadius: "50%",
            position: "relative", overflow: "hidden",
            cursor: isOwner ? "pointer" : "default",
            background: "rgba(58,125,94,0.15)",
            border: "1px solid rgba(58,125,94,0.25)",
            userSelect: "none",
          }}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={name}
                 style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          ) : (
            <div style={{
              width: "100%", height: "100%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24, fontWeight: 590, color: "#52b788",
              fontFeatureSettings: "'cv01','ss03'",
            }}>
              {initial}
            </div>
          )}

          {showOverlay && (
            <div style={{
              position: "absolute", inset: 0,
              background: "rgba(0,0,0,0.45)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {loading ? (
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: "rgba(255,255,255,0.85)",
                  animation: "avatar-pulse 0.9s ease-in-out infinite",
                }} />
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                     stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                     style={{ opacity: 0.92 }}>
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              )}
            </div>
          )}
        </div>

        {/* Dropdown menu */}
        {menuOpen && (
          <div style={{
            position: "absolute", top: "calc(100% + 6px)", left: 0,
            minWidth: 158,
            background: "var(--color-bg-surface)",
            border: "1px solid var(--color-border-std)",
            borderRadius: 8,
            boxShadow: "0 8px 24px rgba(0,0,0,0.22), 0 2px 6px rgba(0,0,0,0.12)",
            zIndex: 30, overflow: "hidden",
            animation: "dropdown-in 0.12s ease",
          }}>
            <button
              onClick={() => { setMenuOpen(false); fileRef.current?.click(); }}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                width: "100%", padding: "9px 13px",
                background: "none", border: "none", cursor: "pointer",
                fontSize: 12, fontWeight: 510, textAlign: "left",
                color: "var(--color-text-secondary)",
                fontFeatureSettings: "'cv01','ss03'",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Cambiar foto
            </button>

            {avatarUrl && (
              <button
                onClick={handleRemove}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  width: "100%", padding: "9px 13px",
                  background: "none", cursor: "pointer",
                  border: "none", borderTop: "1px solid var(--color-border-subtle)",
                  fontSize: 12, fontWeight: 510, textAlign: "left",
                  color: "#ef4444",
                  fontFeatureSettings: "'cv01','ss03'",
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14H6L5 6" />
                  <path d="M10 11v6M14 11v6M9 6V4h6v2" />
                </svg>
                Eliminar foto
              </button>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            position: "absolute", top: "calc(100% + 6px)", left: 0,
            padding: "5px 10px", borderRadius: 6, fontSize: 11, whiteSpace: "nowrap",
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
            color: "#f87171", zIndex: 30,
          }}>
            {error}
          </div>
        )}

        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif"
               onChange={handleFileChange} style={{ display: "none" }} />

        <style>{`
          @keyframes avatar-pulse {
            0%, 100% { opacity: 0.4; transform: scale(0.85); }
            50%       { opacity: 1;   transform: scale(1.15); }
          }
        `}</style>
      </div>
    </>
  );
}
