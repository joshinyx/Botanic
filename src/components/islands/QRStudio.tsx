import { useState, useEffect, useRef, useCallback } from "react";
import QRCode from "qrcode";

type Template = "plain" | "label" | "botanical";

const PRESETS = [
  { name: "Clásico",  dark: "#111111", light: "#ffffff" },
  { name: "Oscuro",   dark: "#e0e0e0", light: "#0d0d0d" },
  { name: "Bosque",   dark: "#2d5a27", light: "#f0f5e8" },
  { name: "Océano",   dark: "#1e3a5f", light: "#e8f0fa" },
  { name: "Tierra",   dark: "#7c3526", light: "#fdf6ee" },
];

// canvas dimensions per template
const CW: Record<Template, number> = { plain: 500, label: 800, botanical: 500 };
const CH: Record<Template, number> = { plain: 500, label: 320, botanical: 560 };

interface Props {
  plantId: string;
  plantName: string;
  climate?: string;
  origin?: string;
}

// ─── logo cache ──────────────────────────────────────────────────────────────

let _logo: HTMLImageElement | null = null;
async function getLogo(): Promise<HTMLImageElement | null> {
  if (_logo) return _logo;
  try {
    const img = new Image();
    img.src = "/images/botanic-logo.png";
    await img.decode();
    _logo = img;
    return img;
  } catch {
    return null;
  }
}

// ─── shared QR painter ───────────────────────────────────────────────────────

async function paintQR(
  ctx: CanvasRenderingContext2D,
  url: string,
  x: number, y: number, size: number,
  dark: string, light: string,
  withLogo: boolean,
) {
  const tmp = document.createElement("canvas");
  await QRCode.toCanvas(tmp, url, {
    width: size, margin: 1,
    errorCorrectionLevel: "H",
    color: { dark, light },
  });
  ctx.drawImage(tmp, x, y, size, size);

  if (!withLogo) return;
  const logo = await getLogo();
  if (!logo) return;

  const ls = Math.round(size * 0.26);
  const cx = x + size / 2;
  const cy = y + size / 2;

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, ls / 2 + 8, 0, Math.PI * 2);
  ctx.fillStyle = light;
  ctx.fill();
  ctx.restore();
  ctx.drawImage(logo, cx - ls / 2, cy - ls / 2, ls, ls);
}

// ─── template renderers ──────────────────────────────────────────────────────

async function renderPlain(
  ctx: CanvasRenderingContext2D,
  url: string, dark: string, light: string, withLogo: boolean,
) {
  const w = CW.plain, h = CH.plain, m = 50;
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, w, h);
  await paintQR(ctx, url, m, m, w - m * 2, dark, light, withLogo);
}

async function renderLabel(
  ctx: CanvasRenderingContext2D,
  url: string, name: string,
  dark: string, light: string, withLogo: boolean,
  climate?: string, origin?: string,
) {
  const w = CW.label, h = CH.label, pad = 32;
  const qrSize = h - pad * 2;
  const divX = pad + qrSize + pad;
  const tx = divX + 28;
  const midY = h / 2;

  ctx.fillStyle = light;
  ctx.fillRect(0, 0, w, h);

  // outer border
  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.strokeStyle = dark;
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, w - 2, h - 2);
  ctx.restore();

  await paintQR(ctx, url, pad, pad, qrSize, dark, light, withLogo);

  // vertical divider
  ctx.save();
  ctx.globalAlpha = 0.14;
  ctx.strokeStyle = dark;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(divX, pad + 10);
  ctx.lineTo(divX, h - pad - 10);
  ctx.stroke();
  ctx.restore();

  // "CATÁLOGO BOTÁNICO"
  ctx.save();
  ctx.globalAlpha = 0.42;
  ctx.fillStyle = dark;
  ctx.font = "500 12px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("CATÁLOGO  BOTÁNICO", tx, midY - 46);
  ctx.restore();

  // plant name
  ctx.save();
  ctx.fillStyle = dark;
  ctx.font = "bold 30px Georgia, 'Times New Roman', serif";
  ctx.textAlign = "left";
  const maxW = w - tx - pad;
  let dn = name;
  while (ctx.measureText(dn).width > maxW && dn.length > 3) dn = dn.slice(0, -1);
  if (dn !== name) dn += "…";
  ctx.fillText(dn, tx, midY + 2);
  ctx.restore();

  // thin rule
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = dark;
  ctx.fillRect(tx, midY + 14, 50, 1);
  ctx.restore();

  // meta
  const meta = [climate, origin].filter(Boolean).join("  ·  ");
  if (meta) {
    ctx.save();
    ctx.globalAlpha = 0.52;
    ctx.fillStyle = dark;
    ctx.font = "400 14px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(meta, tx, midY + 38);
    ctx.restore();
  }

  // domain
  ctx.save();
  ctx.globalAlpha = 0.32;
  ctx.fillStyle = dark;
  ctx.font = "400 12px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "left";
  try { ctx.fillText(new URL(url).hostname, tx, h - pad); }
  catch { ctx.fillText(url, tx, h - pad); }
  ctx.restore();
}

async function renderBotanical(
  ctx: CanvasRenderingContext2D,
  url: string, name: string,
  dark: string, light: string, withLogo: boolean,
  climate?: string, origin?: string,
) {
  const w = CW.botanical, h = CH.botanical;
  const qrSize = 280;
  const qrX = (w - qrSize) / 2;

  ctx.fillStyle = light;
  ctx.fillRect(0, 0, w, h);

  // corner brackets
  const bp = 18, bsz = 16, bth = 1.5;
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = dark;
  ([ [bp, bp, bsz, bth], [bp, bp, bth, bsz],
     [w-bp-bsz, bp, bsz, bth], [w-bp-bth, bp, bth, bsz],
     [bp, h-bp-bth, bsz, bth], [bp, h-bp-bsz, bth, bsz],
     [w-bp-bsz, h-bp-bth, bsz, bth], [w-bp-bth, h-bp-bsz, bth, bsz],
  ] as [number,number,number,number][]).forEach(([x,y,bw,bh]) => ctx.fillRect(x, y, bw, bh));
  ctx.restore();

  // header double line
  ctx.save();
  ctx.globalAlpha = 0.26;
  ctx.fillStyle = dark;
  ctx.fillRect(40, 42, w - 80, 1);
  ctx.fillRect(40, 46, w - 80, 0.5);
  ctx.restore();

  // "CATÁLOGO BOTÁNICO"
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = dark;
  ctx.font = "600 11px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("CATÁLOGO  BOTÁNICO", w / 2, 68);
  ctx.restore();

  // plant name — detect one-line vs two-line
  ctx.save();
  ctx.fillStyle = dark;
  ctx.textAlign = "center";
  const maxNameW = w - 60;
  const twoLine = ctx.measureText(name).width > maxNameW;
  let afterNameY: number;

  if (!twoLine) {
    ctx.font = "bold 34px Georgia, 'Times New Roman', serif";
    ctx.fillText(name, w / 2, 116);
    afterNameY = 134;
  } else {
    ctx.font = "bold 27px Georgia, 'Times New Roman', serif";
    const words = name.split(" ");
    const mid = Math.ceil(words.length / 2);
    ctx.fillText(words.slice(0, mid).join(" "), w / 2, 107);
    ctx.fillText(words.slice(mid).join(" "), w / 2, 141);
    afterNameY = 158;
  }
  ctx.restore();

  // rule below name
  ctx.save();
  ctx.globalAlpha = 0.17;
  ctx.fillStyle = dark;
  ctx.fillRect(w / 2 - 40, afterNameY, 80, 1);
  ctx.restore();

  // meta + dynamic QR start
  const meta = [climate, origin].filter(Boolean).join("  ·  ");
  let qrY = afterNameY + 34;
  if (meta) {
    ctx.save();
    ctx.globalAlpha = 0.48;
    ctx.fillStyle = dark;
    ctx.font = "400 13px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(meta, w / 2, afterNameY + 22);
    ctx.restore();
    qrY = afterNameY + 46;
  }

  await paintQR(ctx, url, qrX, qrY, qrSize, dark, light, withLogo);

  // footer double line
  const footY = qrY + qrSize + 22;
  ctx.save();
  ctx.globalAlpha = 0.26;
  ctx.fillStyle = dark;
  ctx.fillRect(40, footY, w - 80, 0.5);
  ctx.fillRect(40, footY + 4, w - 80, 1);
  ctx.restore();

  // domain
  ctx.save();
  ctx.globalAlpha = 0.48;
  ctx.fillStyle = dark;
  ctx.font = "400 13px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  try { ctx.fillText(new URL(url).hostname, w / 2, footY + 26); }
  catch { ctx.fillText(url, w / 2, footY + 26); }
  ctx.restore();
}

// ─── main component ───────────────────────────────────────────────────────────

export default function QRStudio({ plantId, plantName, climate, origin }: Props) {
  const [open, setOpen] = useState(false);
  const [template, setTemplate] = useState<Template>("botanical");
  const [presetIdx, setPresetIdx] = useState(0);
  const [dark, setDark] = useState(PRESETS[0].dark);
  const [light, setLight] = useState(PRESETS[0].light);
  const [withLogo, setWithLogo] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const render = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width  = CW[template];
    canvas.height = CH[template];
    const url = `${window.location.origin}/plants/${plantId}`;
    if (template === "plain")
      await renderPlain(ctx, url, dark, light, withLogo);
    else if (template === "label")
      await renderLabel(ctx, url, plantName, dark, light, withLogo, climate, origin);
    else
      await renderBotanical(ctx, url, plantName, dark, light, withLogo, climate, origin);
  }, [plantId, plantName, template, dark, light, withLogo, climate, origin]);

  useEffect(() => { if (open) render(); }, [open, render]);

  function pickPreset(i: number) {
    setPresetIdx(i);
    setDark(PRESETS[i].dark);
    setLight(PRESETS[i].light);
  }

  async function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setDownloading(true);
    try {
      await render();
      await new Promise<void>((res) =>
        canvas.toBlob((blob) => {
          if (!blob) return res();
          const u = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = u; a.download = `${plantName.toLowerCase().replace(/\s+/g, "-")}-qr.png`;
          a.click(); URL.revokeObjectURL(u); res();
        }, "image/png"),
      );
    } finally {
      setDownloading(false);
    }
  }

  const templates: { id: Template; label: string; desc: string }[] = [
    { id: "plain",     label: "Simple",   desc: "Solo el código QR" },
    { id: "label",     label: "Etiqueta", desc: "QR + nombre, horizontal" },
    { id: "botanical", label: "Botánico", desc: "Tarjeta decorativa" },
  ];

  return (
    <>
      {/* trigger */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-colors"
        style={{
          fontWeight: 510, cursor: "pointer",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#d0d6e0",
          fontFeatureSettings: "'cv01','ss03'",
        }}
      >
        <DownloadIcon /> Descargar QR
      </button>

      {/* modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(4px)" }}
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full rounded-xl overflow-hidden"
            style={{
              maxWidth: 780, maxHeight: "90vh", overflowY: "auto",
              background: "var(--color-bg-panel)",
              border: "1px solid var(--color-border-std)",
            }}
          >
            {/* header */}
            <div className="flex items-center justify-between px-6 py-4"
                 style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
              <div>
                <h2 className="text-[15px]"
                    style={{ fontWeight: 590, color: "var(--color-text-primary)", fontFeatureSettings: "'cv01','ss03'" }}>
                  Descargar código QR
                </h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-text-faint)" }}>{plantName}</p>
              </div>
              <button onClick={() => setOpen(false)} style={{ cursor: "pointer", border: "none", background: "none" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* body */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-6 p-6">

              {/* settings */}
              <div className="space-y-6">

                {/* template */}
                <div>
                  <p className="text-[11px] uppercase tracking-widest mb-2"
                     style={{ fontWeight: 510, color: "var(--color-text-subtle)" }}>Plantilla</p>
                  <div className="grid grid-cols-3 gap-2">
                    {templates.map((t) => {
                      const active = template === t.id;
                      return (
                        <button key={t.id} onClick={() => setTemplate(t.id)}
                                className="p-3 rounded-lg text-left transition-all"
                                style={{
                                  cursor: "pointer",
                                  border: active ? "1px solid rgba(96,165,250,0.45)" : "1px solid var(--color-border-std)",
                                  background: active ? "rgba(96,165,250,0.07)" : "rgba(255,255,255,0.02)",
                                }}>
                          <TemplateIcon id={t.id} active={active} />
                          <p className="text-xs mt-2"
                             style={{ fontWeight: 590, color: active ? "#60a5fa" : "var(--color-text-primary)", fontFeatureSettings: "'cv01','ss03'" }}>
                            {t.label}
                          </p>
                          <p className="text-[11px] mt-0.5 leading-snug"
                             style={{ color: "var(--color-text-faint)" }}>
                            {t.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* color */}
                <div>
                  <p className="text-[11px] uppercase tracking-widest mb-2"
                     style={{ fontWeight: 510, color: "var(--color-text-subtle)" }}>Color</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {PRESETS.map((p, i) => (
                      <button key={i} title={p.name} onClick={() => pickPreset(i)}
                              className="w-9 h-9 rounded-lg relative overflow-hidden transition-all shrink-0"
                              style={{
                                cursor: "pointer", border: "none",
                                outline: presetIdx === i ? "2px solid #60a5fa" : "2px solid transparent",
                                outlineOffset: "2px",
                              }}>
                        <span style={{ position: "absolute", inset: 0, left: 0, top: 0, width: "50%", background: p.dark }} />
                        <span style={{ position: "absolute", inset: 0, left: "50%", top: 0, width: "50%", background: p.light }} />
                      </button>
                    ))}

                    {/* divider */}
                    <span style={{ width: 1, height: 28, background: "var(--color-border-subtle)", display: "inline-block", margin: "0 4px" }} />

                    {/* custom pickers */}
                    <label title="Color de módulos" style={{ cursor: "pointer", display: "block" }}>
                      <span className="text-[10px] block mb-0.5" style={{ color: "var(--color-text-faint)" }}>Módulos</span>
                      <input type="color" value={dark}
                             onChange={(e) => { setDark(e.target.value); setPresetIdx(-1); }}
                             className="w-9 h-7 rounded cursor-pointer block"
                             style={{ padding: "1px 2px", border: "1px solid var(--color-border-std)", background: "transparent" }} />
                    </label>
                    <label title="Color de fondo" style={{ cursor: "pointer", display: "block" }}>
                      <span className="text-[10px] block mb-0.5" style={{ color: "var(--color-text-faint)" }}>Fondo</span>
                      <input type="color" value={light}
                             onChange={(e) => { setLight(e.target.value); setPresetIdx(-1); }}
                             className="w-9 h-7 rounded cursor-pointer block"
                             style={{ padding: "1px 2px", border: "1px solid var(--color-border-std)", background: "transparent" }} />
                    </label>
                  </div>
                </div>

                {/* logo toggle */}
                <div>
                  <p className="text-[11px] uppercase tracking-widest mb-2"
                     style={{ fontWeight: 510, color: "var(--color-text-subtle)" }}>Logo</p>
                  <label className="flex items-center gap-3" style={{ cursor: "pointer" }}>
                    <button
                      role="switch" aria-checked={withLogo}
                      onClick={() => setWithLogo(!withLogo)}
                      className="relative w-9 h-5 rounded-full transition-colors shrink-0"
                      style={{
                        cursor: "pointer", border: "none",
                        background: withLogo ? "rgba(96,165,250,0.75)" : "rgba(255,255,255,0.1)",
                      }}
                    >
                      <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                            style={{ left: withLogo ? "17px" : "2px", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
                    </button>
                    <span className="text-xs" style={{ fontWeight: 510, color: "var(--color-text-secondary)" }}>
                      Logo en el centro del QR
                    </span>
                  </label>
                  <p className="text-[11px] mt-1.5" style={{ color: "var(--color-text-faint)" }}>
                    Usa corrección de errores H — escaneo garantizado
                  </p>
                </div>
              </div>

              {/* preview */}
              <div className="flex flex-col gap-2">
                <p className="text-[11px] uppercase tracking-widest"
                   style={{ fontWeight: 510, color: "var(--color-text-subtle)" }}>Vista previa</p>
                <div className="rounded-lg overflow-hidden p-2 flex items-center justify-center"
                     style={{ background: "rgba(255,255,255,0.025)", border: "1px solid var(--color-border-subtle)" }}>
                  <canvas ref={canvasRef} style={{ width: "100%", height: "auto", display: "block" }} />
                </div>
              </div>
            </div>

            {/* footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4"
                 style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
              <button onClick={() => setOpen(false)}
                      className="px-4 py-2 rounded text-sm transition-colors"
                      style={{ cursor: "pointer", background: "rgba(255,255,255,0.04)", border: "1px solid var(--color-border-std)", color: "var(--color-text-muted)" }}>
                Cancelar
              </button>
              <button onClick={download} disabled={downloading}
                      className="flex items-center gap-2 px-5 py-2 rounded text-sm transition-colors"
                      style={{
                        fontWeight: 510, fontFeatureSettings: "'cv01','ss03'",
                        cursor: downloading ? "not-allowed" : "pointer",
                        background: downloading ? "rgba(96,165,250,0.2)" : "rgba(96,165,250,0.12)",
                        border: "1px solid rgba(96,165,250,0.35)",
                        color: downloading ? "rgba(96,165,250,0.5)" : "#60a5fa",
                      }}>
                {downloading ? <Spinner /> : <DownloadIcon />}
                Descargar PNG
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── small SVG icons for template tiles ──────────────────────────────────────

function TemplateIcon({ id, active }: { id: Template; active: boolean }) {
  const c = active ? "#60a5fa" : "var(--color-text-muted)";
  if (id === "plain") return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <rect x="3" y="3" width="30" height="30" rx="2" stroke={c} strokeWidth="1.5"/>
      <rect x="8"  y="8"  width="7" height="7" rx="0.5" fill={c} opacity="0.75"/>
      <rect x="21" y="8"  width="7" height="7" rx="0.5" fill={c} opacity="0.75"/>
      <rect x="8"  y="21" width="7" height="7" rx="0.5" fill={c} opacity="0.75"/>
      <rect x="21" y="21" width="3" height="3" fill={c} opacity="0.55"/>
      <rect x="25" y="21" width="3" height="3" fill={c} opacity="0.55"/>
      <rect x="21" y="25" width="3" height="3" fill={c} opacity="0.55"/>
      <rect x="25" y="25" width="3" height="3" fill={c} opacity="0.55"/>
      <circle cx="18" cy="18" r="4" fill={c} opacity="0.22"/>
    </svg>
  );
  if (id === "label") return (
    <svg width="44" height="28" viewBox="0 0 44 28" fill="none">
      <rect x="1.5" y="1.5" width="41" height="25" rx="2" stroke={c} strokeWidth="1.5"/>
      <rect x="5" y="5" width="16" height="18" rx="1" fill={c} opacity="0.2"/>
      <line x1="25" y1="2" x2="25" y2="26" stroke={c} strokeWidth="0.75" opacity="0.4"/>
      <rect x="29" y="9"  width="11" height="2" rx="1" fill={c} opacity="0.7"/>
      <rect x="29" y="13" width="7"  height="1.5" rx="0.75" fill={c} opacity="0.4"/>
      <rect x="29" y="17" width="9"  height="1.5" rx="0.75" fill={c} opacity="0.3"/>
    </svg>
  );
  return (
    <svg width="28" height="36" viewBox="0 0 28 36" fill="none">
      <rect x="1.5" y="1.5" width="25" height="33" rx="2" stroke={c} strokeWidth="1.5"/>
      <line x1="4" y1="6"  x2="24" y2="6"  stroke={c} strokeWidth="1" opacity="0.45"/>
      <line x1="4" y1="8"  x2="24" y2="8"  stroke={c} strokeWidth="0.5" opacity="0.3"/>
      <rect x="8" y="12" width="12" height="2.5" rx="1" fill={c} opacity="0.55"/>
      <rect x="5" y="17" width="18" height="14" rx="1" fill={c} opacity="0.18"/>
      <line x1="4" y1="33" x2="24" y2="33" stroke={c} strokeWidth="0.5" opacity="0.35"/>
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );
}

function Spinner() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  );
}
