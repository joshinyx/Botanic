import { useState, useRef, useEffect, useCallback, type FC, type ReactNode } from "react";
import { t, type Lang } from "@/lib/i18n";
import { isValidHttpUrl } from "@/lib/validate";

// ─────────────────────────────────────────────────────────────────────────────
// Crop helpers (shared types)
// ─────────────────────────────────────────────────────────────────────────────
type DragMode = "move" | "tl" | "tr" | "bl" | "br";

// ─────────────────────────────────────────────────────────────────────────────
// AvatarCropModal — square crop, outputs 400×400
// ─────────────────────────────────────────────────────────────────────────────
interface SquareCrop { x: number; y: number; size: number }
interface SquareDragState { mode: DragMode; startMX: number; startMY: number; startCrop: SquareCrop }

function AvatarCropModal({ file, onApply, onCancel, lang }: { file: File; onApply: (b: Blob) => void; onCancel: () => void; lang: Lang }) {
  const [imgSrc, setImgSrc] = useState("");
  const [crop, setCrop] = useState<SquareCrop>({ x: 0, y: 0, size: 0 });
  const [ready, setReady] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<SquareDragState | null>(null);

  useEffect(() => {
    const r = new FileReader();
    r.onload = (e) => setImgSrc(e.target?.result as string ?? "");
    r.readAsDataURL(file);
  }, [file]);

  const onImgLoad = useCallback(() => {
    const img = imgRef.current; if (!img) return;
    const s = Math.round(Math.min(img.offsetWidth, img.offsetHeight) * 0.8);
    setCrop({ x: Math.round((img.offsetWidth - s) / 2), y: Math.round((img.offsetHeight - s) / 2), size: s });
    setReady(true);
  }, []);

  useEffect(() => {
    function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }
    const MIN = 48;
    function onMove(e: PointerEvent) {
      if (!dragRef.current || !imgRef.current || !containerRef.current) return;
      const img = imgRef.current; const cr = containerRef.current.getBoundingClientRect();
      const W = img.offsetWidth; const H = img.offsetHeight;
      const mx = e.clientX - cr.left; const my = e.clientY - cr.top;
      const { mode, startMX, startMY, startCrop: s } = dragRef.current;
      let { x, y, size } = s;
      if (mode === "move") { x = clamp(s.x + (mx - startMX), 0, W - size); y = clamp(s.y + (my - startMY), 0, H - size); }
      else {
        const br = { x: s.x + s.size, y: s.y + s.size }, tl = { x: s.x, y: s.y };
        const tr = { x: s.x + s.size, y: s.y }, bl = { x: s.x, y: s.y + s.size };
        if (mode === "br") { const ns = clamp(Math.min(mx - tl.x, my - tl.y), MIN, Math.min(W - tl.x, H - tl.y)); x = tl.x; y = tl.y; size = ns; }
        else if (mode === "tl") { const ns = clamp(Math.min(br.x - mx, br.y - my), MIN, Math.min(br.x, br.y)); x = br.x - ns; y = br.y - ns; size = ns; }
        else if (mode === "tr") { const ns = clamp(Math.min(mx - bl.x, bl.y - my), MIN, Math.min(W - bl.x, bl.y)); x = bl.x; y = bl.y - ns; size = ns; }
        else if (mode === "bl") { const ns = clamp(Math.min(tr.x - mx, my - tr.y), MIN, Math.min(tr.x, H - tr.y)); x = tr.x - ns; y = tr.y; size = ns; }
      }
      setCrop({ x: Math.round(x), y: Math.round(y), size: Math.round(size) });
    }
    function onUp() { dragRef.current = null; }
    window.addEventListener("pointermove", onMove); window.addEventListener("pointerup", onUp);
    return () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
  }, []);

  const startDrag = useCallback((mode: DragMode, e: React.PointerEvent) => {
    e.preventDefault(); e.stopPropagation();
    dragRef.current = { mode, startMX: e.clientX - containerRef.current!.getBoundingClientRect().left, startMY: e.clientY - containerRef.current!.getBoundingClientRect().top, startCrop: { ...crop } };
  }, [crop]);

  const apply = useCallback(() => {
    const img = imgRef.current; if (!img) return;
    const canvas = document.createElement("canvas"); canvas.width = 400; canvas.height = 400;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    ctx.drawImage(img, crop.x * (img.naturalWidth / img.offsetWidth), crop.y * (img.naturalHeight / img.offsetHeight), crop.size * (img.naturalWidth / img.offsetWidth), crop.size * (img.naturalHeight / img.offsetHeight), 0, 0, 400, 400);
    canvas.toBlob((b) => { if (b) onApply(b); }, "image/jpeg", 0.92);
  }, [crop, onApply]);

  const HANDLE = 9; const HIT = 18;
  const handles = [
    { key: "tl" as DragMode, cx: crop.x, cy: crop.y, cursor: "nwse-resize" },
    { key: "tr" as DragMode, cx: crop.x + crop.size, cy: crop.y, cursor: "nesw-resize" },
    { key: "bl" as DragMode, cx: crop.x, cy: crop.y + crop.size, cursor: "nesw-resize" },
    { key: "br" as DragMode, cx: crop.x + crop.size, cy: crop.y + crop.size, cursor: "nwse-resize" },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.88)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 480, background: "var(--color-bg-surface)", border: "1px solid var(--color-border-std)", borderRadius: 12, display: "flex", flexDirection: "column", maxHeight: "90vh", overflow: "hidden" }}>
        <div style={{ padding: "13px 16px", borderBottom: "1px solid var(--color-border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 590, color: "var(--color-text-primary)", fontFeatureSettings: "'cv01','ss03'" }}>{t("profile.form.adjustPhoto", lang)}</span>
          <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 19, lineHeight: 1, color: "var(--color-text-subtle)" }}>×</button>
        </div>
        <div style={{ overflowY: "auto", flexShrink: 1 }}>
          <div ref={containerRef} style={{ position: "relative", lineHeight: 0, userSelect: "none" }}>
            {imgSrc && <img ref={imgRef} src={imgSrc} onLoad={onImgLoad} draggable={false} style={{ width: "100%", display: "block" }} />}
            {ready && (<>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: crop.y, background: "rgba(0,0,0,0.55)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, top: crop.y + crop.size, background: "rgba(0,0,0,0.55)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", top: crop.y, width: crop.x, height: crop.size, left: 0, background: "rgba(0,0,0,0.55)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", top: crop.y, left: crop.x + crop.size, right: 0, height: crop.size, background: "rgba(0,0,0,0.55)", pointerEvents: "none" }} />
              <div onPointerDown={(e) => startDrag("move", e)} style={{ position: "absolute", left: crop.x, top: crop.y, width: crop.size, height: crop.size, border: "1px solid rgba(255,255,255,0.75)", cursor: "move", boxSizing: "border-box" }}>
                <div style={{ position: "absolute", inset: 0, opacity: 0.2, pointerEvents: "none" }}>
                  <div style={{ position: "absolute", left: "33.33%", top: 0, bottom: 0, width: 1, background: "white" }} />
                  <div style={{ position: "absolute", left: "66.66%", top: 0, bottom: 0, width: 1, background: "white" }} />
                  <div style={{ position: "absolute", top: "33.33%", left: 0, right: 0, height: 1, background: "white" }} />
                  <div style={{ position: "absolute", top: "66.66%", left: 0, right: 0, height: 1, background: "white" }} />
                </div>
              </div>
              {handles.map(({ key, cx, cy, cursor }) => (
                <div key={key} onPointerDown={(e) => startDrag(key, e)} style={{ position: "absolute", width: HIT, height: HIT, left: cx - HIT / 2, top: cy - HIT / 2, display: "flex", alignItems: "center", justifyContent: "center", cursor, zIndex: 2 }}>
                  <div style={{ width: HANDLE, height: HANDLE, background: "white", borderRadius: 2, boxShadow: "0 1px 4px rgba(0,0,0,0.55)" }} />
                </div>
              ))}
            </>)}
          </div>
        </div>
        <div style={{ padding: "11px 16px", borderTop: "1px solid var(--color-border-subtle)", display: "flex", justifyContent: "flex-end", gap: 8, flexShrink: 0 }}>
          <button onClick={onCancel} style={{ padding: "7px 16px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 510, background: "var(--color-bg-card-elev)", color: "var(--color-text-secondary)", fontFeatureSettings: "'cv01','ss03'" }}>Cancelar</button>
          <button onClick={apply} style={{ padding: "7px 16px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 510, background: "var(--color-brand)", color: "white", fontFeatureSettings: "'cv01','ss03'" }}>Aplicar</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BannerCropModal — 4:1 aspect ratio, outputs 1200×300
// ─────────────────────────────────────────────────────────────────────────────
const BANNER_ASPECT = 4;
const BANNER_OUT_W = 1200;
const BANNER_OUT_H = 300;

interface BannerCrop { x: number; y: number; w: number; h: number }
interface BannerDragState { mode: DragMode; startMX: number; startMY: number; startCrop: BannerCrop }

function BannerCropModal({ file, onApply, onCancel, lang }: { file: File; onApply: (b: Blob) => void; onCancel: () => void; lang: Lang }) {
  const [imgSrc, setImgSrc] = useState("");
  const [crop, setCrop] = useState<BannerCrop>({ x: 0, y: 0, w: 0, h: 0 });
  const [ready, setReady] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<BannerDragState | null>(null);

  useEffect(() => {
    const r = new FileReader();
    r.onload = (e) => setImgSrc(e.target?.result as string ?? "");
    r.readAsDataURL(file);
  }, [file]);

  const onImgLoad = useCallback(() => {
    const img = imgRef.current; if (!img) return;
    const W = img.offsetWidth; const H = img.offsetHeight;
    let w: number, h: number;
    if (W / H > BANNER_ASPECT) { h = Math.round(H * 0.9); w = Math.round(h * BANNER_ASPECT); }
    else { w = Math.round(W * 0.9); h = Math.round(w / BANNER_ASPECT); }
    setCrop({ x: Math.round((W - w) / 2), y: Math.round((H - h) / 2), w, h });
    setReady(true);
  }, []);

  useEffect(() => {
    function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }
    const MIN_W = 90;
    function onMove(e: PointerEvent) {
      if (!dragRef.current || !imgRef.current || !containerRef.current) return;
      const img = imgRef.current; const cr = containerRef.current.getBoundingClientRect();
      const W = img.offsetWidth; const H = img.offsetHeight;
      const mx = e.clientX - cr.left; const my = e.clientY - cr.top;
      const { mode, startMX, startMY, startCrop: s } = dragRef.current;
      let { x, y, w, h } = s;
      if (mode === "move") { x = clamp(s.x + (mx - startMX), 0, W - s.w); y = clamp(s.y + (my - startMY), 0, H - s.h); }
      else if (mode === "br") { const nw = clamp(mx - s.x, MIN_W, Math.min(W - s.x, (H - s.y) * BANNER_ASPECT)); w = nw; h = nw / BANNER_ASPECT; x = s.x; y = s.y; }
      else if (mode === "tl") { const brx = s.x + s.w; const bry = s.y + s.h; const nw = clamp(brx - mx, MIN_W, Math.min(brx, bry * BANNER_ASPECT)); w = nw; h = nw / BANNER_ASPECT; x = brx - w; y = bry - h; }
      else if (mode === "tr") { const bly = s.y + s.h; const nw = clamp(mx - s.x, MIN_W, Math.min(W - s.x, bly * BANNER_ASPECT)); w = nw; h = nw / BANNER_ASPECT; x = s.x; y = bly - h; }
      else if (mode === "bl") { const trx = s.x + s.w; const nw = clamp(trx - mx, MIN_W, Math.min(trx, (H - s.y) * BANNER_ASPECT)); w = nw; h = nw / BANNER_ASPECT; x = trx - w; y = s.y; }
      setCrop({ x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) });
    }
    function onUp() { dragRef.current = null; }
    window.addEventListener("pointermove", onMove); window.addEventListener("pointerup", onUp);
    return () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
  }, []);

  const startDrag = useCallback((mode: DragMode, e: React.PointerEvent) => {
    e.preventDefault(); e.stopPropagation();
    dragRef.current = { mode, startMX: e.clientX - containerRef.current!.getBoundingClientRect().left, startMY: e.clientY - containerRef.current!.getBoundingClientRect().top, startCrop: { ...crop } };
  }, [crop]);

  const apply = useCallback(() => {
    const img = imgRef.current; if (!img) return;
    const canvas = document.createElement("canvas"); canvas.width = BANNER_OUT_W; canvas.height = BANNER_OUT_H;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    ctx.drawImage(img, crop.x * (img.naturalWidth / img.offsetWidth), crop.y * (img.naturalHeight / img.offsetHeight), crop.w * (img.naturalWidth / img.offsetWidth), crop.h * (img.naturalHeight / img.offsetHeight), 0, 0, BANNER_OUT_W, BANNER_OUT_H);
    canvas.toBlob((b) => { if (b) onApply(b); }, "image/jpeg", 0.92);
  }, [crop, onApply]);

  const HANDLE = 9; const HIT = 18;
  const handles = [
    { key: "tl" as DragMode, cx: crop.x, cy: crop.y, cursor: "nwse-resize" },
    { key: "tr" as DragMode, cx: crop.x + crop.w, cy: crop.y, cursor: "nesw-resize" },
    { key: "bl" as DragMode, cx: crop.x, cy: crop.y + crop.h, cursor: "nesw-resize" },
    { key: "br" as DragMode, cx: crop.x + crop.w, cy: crop.y + crop.h, cursor: "nwse-resize" },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.88)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 640, background: "var(--color-bg-surface)", border: "1px solid var(--color-border-std)", borderRadius: 12, display: "flex", flexDirection: "column", maxHeight: "90vh", overflow: "hidden" }}>
        <div style={{ padding: "13px 16px", borderBottom: "1px solid var(--color-border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 590, color: "var(--color-text-primary)", fontFeatureSettings: "'cv01','ss03'" }}>{t("profile.form.adjustBanner", lang)}</span>
          <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 19, lineHeight: 1, color: "var(--color-text-subtle)" }}>×</button>
        </div>
        <div style={{ overflowY: "auto", flexShrink: 1 }}>
          <div ref={containerRef} style={{ position: "relative", lineHeight: 0, userSelect: "none" }}>
            {imgSrc && <img ref={imgRef} src={imgSrc} onLoad={onImgLoad} draggable={false} style={{ width: "100%", display: "block" }} />}
            {ready && (<>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: crop.y, background: "rgba(0,0,0,0.55)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, top: crop.y + crop.h, background: "rgba(0,0,0,0.55)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", top: crop.y, width: crop.x, height: crop.h, left: 0, background: "rgba(0,0,0,0.55)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", top: crop.y, left: crop.x + crop.w, right: 0, height: crop.h, background: "rgba(0,0,0,0.55)", pointerEvents: "none" }} />
              <div onPointerDown={(e) => startDrag("move", e)} style={{ position: "absolute", left: crop.x, top: crop.y, width: crop.w, height: crop.h, border: "1px solid rgba(255,255,255,0.75)", cursor: "move", boxSizing: "border-box" }}>
                <div style={{ position: "absolute", inset: 0, opacity: 0.18, pointerEvents: "none" }}>
                  <div style={{ position: "absolute", left: "33.33%", top: 0, bottom: 0, width: 1, background: "white" }} />
                  <div style={{ position: "absolute", left: "66.66%", top: 0, bottom: 0, width: 1, background: "white" }} />
                  <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1, background: "white" }} />
                </div>
              </div>
              {handles.map(({ key, cx, cy, cursor }) => (
                <div key={key} onPointerDown={(e) => startDrag(key, e)} style={{ position: "absolute", width: HIT, height: HIT, left: cx - HIT / 2, top: cy - HIT / 2, display: "flex", alignItems: "center", justifyContent: "center", cursor, zIndex: 2 }}>
                  <div style={{ width: HANDLE, height: HANDLE, background: "white", borderRadius: 2, boxShadow: "0 1px 4px rgba(0,0,0,0.55)" }} />
                </div>
              ))}
            </>)}
          </div>
        </div>
        <div style={{ padding: "11px 16px", borderTop: "1px solid var(--color-border-subtle)", display: "flex", justifyContent: "flex-end", gap: 8, flexShrink: 0 }}>
          <button onClick={onCancel} style={{ padding: "7px 16px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 510, background: "var(--color-bg-card-elev)", color: "var(--color-text-secondary)", fontFeatureSettings: "'cv01','ss03'" }}>Cancelar</button>
          <button onClick={apply} style={{ padding: "7px 16px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 510, background: "var(--color-brand)", color: "white", fontFeatureSettings: "'cv01','ss03'" }}>Aplicar</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Icon components
// ─────────────────────────────────────────────────────────────────────────────
const IconMail: FC<{ size?: number }> = ({ size = 16 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M22 7.535v9.465a3 3 0 0 1 -2.824 2.995l-.176 .005h-14a3 3 0 0 1 -2.995 -2.824l-.005 -.176v-9.465l9.445 6.297l.116 .066a1 1 0 0 0 .878 0l.116 -.066l9.445 -6.297z" />
    <path d="M19 4c1.08 0 2.027 .57 2.555 1.427l-9.555 6.37l-9.555 -6.37a2.999 2.999 0 0 1 2.354 -1.42l.201 -.007h14z" />
  </svg>
);

const IconMapPin: FC<{ size?: number }> = ({ size = 16 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
    <path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0z" />
  </svg>
);

const IconWorld: FC<{ size?: number }> = ({ size = 16 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" />
    <path d="M3.6 9h16.8" /><path d="M3.6 15h16.8" />
    <path d="M11.5 3a17 17 0 0 0 0 18" /><path d="M12.5 3a17 17 0 0 1 0 18" />
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// Network definitions
// ─────────────────────────────────────────────────────────────────────────────
interface Network {
  key: string; label: string; prefix: string | null;
  Icon: FC<{ size?: number }>;
  validate?: (v: string) => string | null;
  inputType?: string; placeholder?: string;
}

const NETWORKS: Network[] = [
  { key: "website", label: "Website", prefix: null, Icon: IconWorld, inputType: "text", placeholder: "https://tuweb.com", validate: (v) => (v && !isValidHttpUrl(v) ? "Debe ser una URL válida (https://...)" : null) },
  { key: "mail", label: "Email", prefix: null, Icon: IconMail, inputType: "text", placeholder: "usuario@email.com", validate: (v) => (v && !v.includes("@") ? "Debe contener @" : null) },
];

const LEGACY_PREFIXES: Record<string, string> = { twitter: "https://twitter.com/" };

function extractHandle(url: string, prefix: string, key: string): string {
  if (!url) return "";
  if (url.startsWith(prefix)) return url.slice(prefix.length);
  const legacy = LEGACY_PREFIXES[key];
  if (legacy && url.startsWith(legacy)) return url.slice(legacy.length);
  return url;
}

function buildHandles(initialSocials: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const net of NETWORKS) {
    const val = initialSocials[net.key] ?? "";
    result[net.key] = net.prefix ? extractHandle(val, net.prefix, net.key) : val;
  }
  return result;
}

function initialActiveKeys(initialSocials: Record<string, string>): Set<string> {
  const active = new Set<string>();
  for (const net of NETWORKS) { if (initialSocials[net.key]?.trim()) active.add(net.key); }
  return active;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
interface Props {
  lang: Lang;
  initialName: string;
  initialBio: string;
  initialSocials: Record<string, string>;
  initialAvatarUrl: string | null;
  initialBannerUrl: string | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditProfileForm({ lang, initialName, initialBio, initialSocials, initialAvatarUrl, initialBannerUrl, onClose, onSaved }: Props) {
  // Text fields
  const [name, setName] = useState(initialName);
  const [bio, setBio] = useState(initialBio);
  const [location, setLocation] = useState(initialSocials["location"] ?? "");
  const [handles, setHandles] = useState<Record<string, string>>(() => buildHandles(initialSocials));
  const [activeKeys, setActiveKeys] = useState<Set<string>>(() => initialActiveKeys(initialSocials));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Avatar state
  const [avatarBlob, setAvatarBlob] = useState<Blob | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(initialAvatarUrl);
  const [avatarCropFile, setAvatarCropFile] = useState<File | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);

  // Banner state
  const [bannerBlob, setBannerBlob] = useState<Blob | null>(null);
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string | null>(initialBannerUrl);
  const [bannerCropFile, setBannerCropFile] = useState<File | null>(null);
  const [removeBanner, setRemoveBanner] = useState(false);

  // Hover state for banner
  const [bannerHovered, setBannerHovered] = useState(false);

  // Avatar dropdown menu
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const avatarMenuRef = useRef<HTMLDivElement>(null);

  // UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const avatarFileRef = useRef<HTMLInputElement>(null);
  const bannerFileRef = useRef<HTMLInputElement>(null);

  // Close avatar menu on outside click
  useEffect(() => {
    if (!avatarMenuOpen) return;
    function handler(e: PointerEvent) {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target as Node))
        setAvatarMenuOpen(false);
    }
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [avatarMenuOpen]);
  const initial = (name || initialName).charAt(0).toUpperCase();

  // ── Photo handlers ──
  const handleAvatarFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setAvatarCropFile(file);
    if (avatarFileRef.current) avatarFileRef.current.value = "";
  }, []);

  const handleAvatarCropApply = useCallback((blob: Blob) => {
    setAvatarCropFile(null);
    setAvatarBlob(blob);
    setAvatarPreviewUrl(URL.createObjectURL(blob));
    setRemoveAvatar(false);
  }, []);

  const handleBannerFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setBannerCropFile(file);
    if (bannerFileRef.current) bannerFileRef.current.value = "";
  }, []);

  const handleBannerCropApply = useCallback((blob: Blob) => {
    setBannerCropFile(null);
    setBannerBlob(blob);
    setBannerPreviewUrl(URL.createObjectURL(blob));
    setRemoveBanner(false);
  }, []);

  // ── Network handlers ──
  const addNetwork = useCallback((key: string) => { setActiveKeys((p) => new Set([...p, key])); }, []);
  const removeNetwork = useCallback((key: string) => {
    setActiveKeys((p) => { const n = new Set(p); n.delete(key); return n; });
    setHandles((p) => ({ ...p, [key]: "" }));
    setFieldErrors((p) => { const n = { ...p }; delete n[key]; return n; });
  }, []);
  const handleChange = useCallback((key: string, value: string) => {
    setHandles((p) => ({ ...p, [key]: value }));
    setFieldErrors((p) => { const n = { ...p }; delete n[key]; return n; });
  }, []);

  // ── Submit ──
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate social fields
    const errors: Record<string, string> = {};
    for (const net of NETWORKS) {
      if (!activeKeys.has(net.key)) continue;
      const val = handles[net.key]?.trim() ?? "";
      if (!val || !net.validate) continue;
      const msg = net.validate(val);
      if (msg) errors[net.key] = msg;
    }
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }

    setLoading(true);
    try {
      // Upload avatar if changed
      if (avatarBlob) {
        const body = new FormData(); body.append("avatar", avatarBlob, "avatar.jpg");
        const res = await fetch("/api/user/avatar", { method: "POST", body });
        if (!res.ok) { const d = await res.json() as { error?: string }; setError(d.error ?? "Error al subir foto"); return; }
      } else if (removeAvatar) {
        const res = await fetch("/api/user/avatar", { method: "DELETE" });
        if (!res.ok) { setError("Error al eliminar foto"); return; }
      }

      // Upload banner if changed
      if (bannerBlob) {
        const body = new FormData(); body.append("banner", bannerBlob, "banner.jpg");
        const res = await fetch("/api/user/banner", { method: "POST", body });
        if (!res.ok) { const d = await res.json() as { error?: string }; setError(d.error ?? "Error al subir banner"); return; }
      } else if (removeBanner) {
        const res = await fetch("/api/user/banner", { method: "DELETE" });
        if (!res.ok) { setError("Error al eliminar banner"); return; }
      }

      // Update profile fields
      const social_links: Record<string, string> = {};
      for (const net of NETWORKS) {
        if (!activeKeys.has(net.key)) continue;
        const handle = handles[net.key]?.trim() ?? "";
        if (!handle) continue;
        social_links[net.key] = net.prefix ? net.prefix + handle : handle;
      }
      const locVal = location.trim();
      if (locVal) social_links["location"] = locVal;
      const res = await fetch("/api/user/profile", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio, social_links }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) { setError(data.error ?? "Update failed"); return; }
      onSaved();
    } finally { setLoading(false); }
  }, [name, bio, location, handles, activeKeys, avatarBlob, bannerBlob, removeAvatar, removeBanner, onSaved]);

  const inactiveNetworks = NETWORKS.filter((n) => !activeKeys.has(n.key));
  const activeNetworks   = NETWORKS.filter((n) => activeKeys.has(n.key));

  return (
    <>
      {avatarCropFile && <AvatarCropModal file={avatarCropFile} onApply={handleAvatarCropApply} onCancel={() => setAvatarCropFile(null)} lang={lang} />}
      {bannerCropFile && <BannerCropModal file={bannerCropFile} onApply={handleBannerCropApply} onCancel={() => setBannerCropFile(null)} lang={lang} />}

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)" }}>
        <div className="w-full flex flex-col" style={{ maxWidth: 680, background: "var(--color-bg-surface)", border: "1px solid var(--color-border-std)", borderRadius: 12, maxHeight: "92vh", overflow: "hidden" }}>

          {/* Header */}
          <div style={{ padding: "13px 16px", borderBottom: "1px solid var(--color-border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <span style={{ fontSize: 14, fontWeight: 590, color: "var(--color-text-primary)", fontFeatureSettings: "'cv01','ss03'" }}>{t("profile.edit", lang)}</span>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, lineHeight: 1, color: "var(--color-text-subtle)", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", width: 24, height: 24 }}>×</button>
          </div>

          {/* Scrollable body */}
          <div style={{ overflowY: "auto", flexShrink: 1 }}>

            {/* ── Photo preview section ── */}
            <div style={{ position: "relative", paddingBottom: 60, marginBottom: 24 }}>

              {/* Banner */}
              <div
                onMouseEnter={() => setBannerHovered(true)}
                onMouseLeave={() => setBannerHovered(false)}
                onClick={() => bannerFileRef.current?.click()}
                style={{ position: "relative", cursor: "pointer", overflow: "hidden",
                  ...(bannerPreviewUrl ? { aspectRatio: "4/1", minHeight: 110 } : { height: 110, background: "var(--color-bg-base)" }) }}
              >
                {bannerPreviewUrl && (
                  <img src={bannerPreviewUrl} alt="Banner" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                )}
                {/* Banner hover overlay */}
                {bannerHovered && (
                  <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.38)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 510, color: "rgba(255,255,255,0.9)", fontFeatureSettings: "'cv01','ss03'", padding: "4px 10px", borderRadius: 5, border: "1px solid rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.1)" }}>
                      {bannerPreviewUrl ? t("profile.form.changeBanner", lang) : t("profile.form.addBanner", lang)}
                    </span>
                    {bannerPreviewUrl && (
                      <button type="button"
                        onClick={(e) => { e.stopPropagation(); setBannerPreviewUrl(null); setBannerBlob(null); setRemoveBanner(true); }}
                        style={{ fontSize: 11, fontWeight: 510, color: "#f87171", padding: "4px 10px", borderRadius: 5, border: "1px solid rgba(224,85,85,0.45)", background: "rgba(224,85,85,0.12)", cursor: "pointer" }}>
                        {t("profile.form.removeBanner", lang)}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Avatar — overlapping banner, with dropdown menu */}
              <div ref={avatarMenuRef} style={{ position: "absolute", bottom: 0, left: 20 }}>
                {/* Avatar circle */}
                <div
                  onClick={() => setAvatarMenuOpen(o => !o)}
                  style={{ cursor: "pointer", width: 100, height: 100, borderRadius: "50%", overflow: "hidden",
                    position: "relative",
                    background: "#1e3a2a",
                    border: "3px solid var(--color-bg-surface)",
                    boxShadow: "0 0 0 1px rgba(58,125,94,0.25)",
                  }}
                >
                  {avatarPreviewUrl ? (
                    <img src={avatarPreviewUrl} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, fontWeight: 590, color: "#52b788", fontFeatureSettings: "'cv01','ss03'" }}>
                      {initial}
                    </div>
                  )}
                  {/* Persistent photo-spark overlay */}
                  <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.38)",
                    display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                    <PhotoSparkIcon />
                  </div>
                </div>

                {/* Dropdown menu */}
                {avatarMenuOpen && (
                  <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 30, minWidth: 148,
                    background: "var(--color-bg-surface)", border: "1px solid var(--color-border-std)",
                    borderRadius: 8, overflow: "hidden",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.22), 0 2px 6px rgba(0,0,0,0.12)",
                    animation: "dropdown-in 0.12s ease",
                  }}>
                    <MenuBtn icon={<UploadIcon />} onClick={() => { setAvatarMenuOpen(false); avatarFileRef.current?.click(); }}>
                      {t("profile.form.changePhoto", lang)}
                    </MenuBtn>
                    {avatarPreviewUrl && (
                      <MenuBtn icon={<TrashIcon />} danger onClick={() => { setAvatarMenuOpen(false); setAvatarPreviewUrl(null); setAvatarBlob(null); setRemoveAvatar(true); }}>
                        {t("profile.form.removePhoto", lang)}
                      </MenuBtn>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── Form fields ── */}
            <div style={{ padding: "0 20px 8px" }}>
              {error && (
                <div className="mb-4 px-3 py-2.5 rounded text-sm" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>{error}</div>
              )}

              <form id="edit-profile-form" onSubmit={handleSubmit} noValidate className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-xs mb-1.5" style={{ fontSize: 13, fontWeight: 510, color: "var(--color-text-muted)" }}>
                    {t("profile.form.name", lang)}
                  </label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full rounded outline-none"
                    style={{ padding: "10px 14px", fontSize: 15, background: "var(--color-bg-card-hover)", border: "1px solid var(--color-border-std)", color: "var(--color-text-primary)", fontFeatureSettings: "'cv01','ss03'" }} />
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-xs mb-1.5" style={{ fontSize: 13, fontWeight: 510, color: "var(--color-text-muted)" }}>{t("profile.form.bio", lang)}</label>
                  <div style={{ position: "relative" }}>
                    <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} maxLength={300}
                      className="w-full rounded outline-none resize-none"
                      style={{ padding: "10px 14px", paddingBottom: 26, fontSize: 15, background: "var(--color-bg-card-hover)", border: "1px solid var(--color-border-std)", color: "var(--color-text-primary)", fontFeatureSettings: "'cv01','ss03'" }} />
                    <span style={{ position: "absolute", bottom: 10, right: 10, fontSize: 11, fontWeight: 500, color: "var(--color-text-subtle)", pointerEvents: "none" }}>{bio.length}/300</span>
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-xs mb-1.5" style={{ fontSize: 13, fontWeight: 510, color: "var(--color-text-muted)" }}>{t("profile.form.location", lang)}</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-subtle)", pointerEvents: "none", display: "flex" }}>
                      <IconMapPin size={16} />
                    </span>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder={t("profile.form.locationPlaceholder", lang)}
                      maxLength={120}
                      className="w-full rounded outline-none"
                      style={{ paddingTop: 10, paddingBottom: 10, paddingLeft: 36, paddingRight: 14, fontSize: 15, background: "var(--color-bg-card-hover)", border: "1px solid var(--color-border-std)", color: "var(--color-text-primary)", fontFeatureSettings: "'cv01','ss03'" }}
                    />
                  </div>
                </div>

                {/* Social links */}
                <div>
                  <label className="block text-xs mb-2" style={{ fontSize: 13, fontWeight: 510, color: "var(--color-text-muted)" }}>{t("profile.form.socials", lang)}</label>
                  {activeNetworks.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {activeNetworks.map((net) => (
                        <ActiveRow key={net.key} net={net} value={handles[net.key] ?? ""} error={fieldErrors[net.key]} onChange={(v) => handleChange(net.key, v)} onRemove={() => removeNetwork(net.key)} />
                      ))}
                    </div>
                  )}
                  {inactiveNetworks.length > 0 && (
                    <div className="flex flex-wrap gap-3 pt-1">
                      {inactiveNetworks.map((net) => (
                        <AddNetworkIcon key={net.key} net={net} onClick={() => addNetwork(net.key)} />
                      ))}
                    </div>
                  )}
                </div>

              </form>
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding: "13px 20px", borderTop: "1px solid var(--color-border-subtle)", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <button type="submit" form="edit-profile-form" disabled={loading}
              className="px-6 py-2.5 rounded text-white transition-colors"
              style={{ fontSize: 15, fontWeight: 510, background: loading ? "rgba(58,125,94,0.6)" : "var(--color-brand)", cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? t("profile.form.saving", lang) : t("profile.form.save", lang)}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded transition-colors"
              style={{ fontSize: 15, fontWeight: 510, color: "var(--color-text-muted)" }}>
              {t("profile.form.cancel", lang)}
            </button>
          </div>
        </div>

        {/* Hidden file inputs */}
        <input ref={avatarFileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleAvatarFileChange} style={{ display: "none" }} />
        <input ref={bannerFileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleBannerFileChange} style={{ display: "none" }} />
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────
function AddNetworkIcon({ net, onClick }: { net: Network; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button type="button" onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} title={net.label}
      style={{ position: "relative", background: "none", border: "none", padding: 0, cursor: "pointer", color: hovered ? "var(--color-text-secondary)" : "var(--color-text-subtle)", transition: "color 0.12s ease", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <net.Icon size={22} />
      {hovered && (
        <span style={{ position: "absolute", bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)", padding: "2px 7px", borderRadius: 4, fontSize: 11, fontWeight: 510, whiteSpace: "nowrap", pointerEvents: "none", background: "var(--color-bg-elevated)", border: "1px solid var(--color-border-std)", color: "var(--color-text-secondary)", zIndex: 20, boxShadow: "0 4px 12px rgba(0,0,0,0.18)", fontFeatureSettings: "'cv01','ss03'" }}>
          {net.label}
        </span>
      )}
    </button>
  );
}

function ActiveRow({ net, value, error, onChange, onRemove }: { net: Network; value: string; error?: string; onChange: (v: string) => void; onRemove: () => void }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center">
        <div className="flex flex-1 rounded" style={{ border: `1px solid ${error ? "rgba(239,68,68,0.5)" : "var(--color-border-std)"}`, background: "var(--color-bg-card-elev)" }}>
          <div className="relative group shrink-0 flex items-center justify-center px-3 rounded-l" style={{ color: "var(--color-text-subtle)" }}>
            <net.Icon size={18} />
            <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-0.5 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-100"
              style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border-std)", color: "var(--color-text-secondary)", zIndex: 20, boxShadow: "0 4px 12px rgba(0,0,0,0.18)", fontWeight: 510, fontFeatureSettings: "'cv01','ss03'" }}>
              {net.label}
            </span>
          </div>
          <div className="w-px self-stretch" style={{ background: "var(--color-border-subtle)" }} />
          {net.prefix && (<>
            <span className="px-3 py-2.5 text-sm shrink-0 select-none" style={{ color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>{net.prefix}</span>
            <div className="w-px self-stretch" style={{ background: "var(--color-border-subtle)" }} />
          </>)}
          <input type={net.inputType ?? "text"} value={value} onChange={(e) => onChange(e.target.value)} placeholder={net.placeholder} autoFocus
            className="flex-1 min-w-0 outline-none"
            style={{ padding: "11px 14px", fontSize: 15, background: "var(--color-bg-card-hover)", color: "var(--color-text-primary)", fontFeatureSettings: "'cv01','ss03'" }} />
          <div className="w-px self-stretch" style={{ background: "var(--color-border-subtle)" }} />
          <button type="button" onClick={onRemove} title="Quitar"
            className="shrink-0 w-10 flex items-center justify-center rounded-r transition-colors"
            style={{ color: "var(--color-text-faint)", background: "transparent", border: "none", cursor: "pointer" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#e05555"; (e.currentTarget as HTMLElement).style.background = "rgba(224,85,85,0.08)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-text-faint)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
      {error && <p className="text-xs pl-1" style={{ color: "#f87171" }}>{error}</p>}
    </div>
  );
}

function MenuBtn({ children, icon, onClick, danger = false }: { children: ReactNode; icon: ReactNode; onClick: () => void; danger?: boolean }) {
  const [hov, setHov] = useState(false);
  return (
    <button type="button" onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 13px",
        background: danger ? (hov ? "rgba(224,85,85,0.08)" : "none") : (hov ? "var(--color-bg-card-hover)" : "none"),
        border: "none", cursor: "pointer", fontSize: 12, fontWeight: 510, textAlign: "left",
        color: danger ? "#e05555" : "var(--color-text-secondary)",
        fontFeatureSettings: "'cv01','ss03'",
      }}>
      <span style={{ color: danger ? "#e05555" : "var(--color-accent)", opacity: 0.8 }}>{icon}</span>
      {children}
    </button>
  );
}

function PhotoSparkIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
         stroke="rgba(255,255,255,0.88)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <path d="M15 8h.01"/>
      <path d="M12 21h-6a3 3 0 0 1 -3 -3v-12a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v6"/>
      <path d="M3 16l5 -5c.928 -.893 2.072 -.893 3 0l3.993 3.993"/>
      <path d="M14 14l1 -1c.47 -.452 .995 -.675 1.52 -.67"/>
      <path d="M19 22.5a4.75 4.75 0 0 1 3.5 -3.5a4.75 4.75 0 0 1 -3.5 -3.5a4.75 4.75 0 0 1 -3.5 3.5a4.75 4.75 0 0 1 3.5 3.5"/>
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14H6L5 6"/>
      <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
    </svg>
  );
}
