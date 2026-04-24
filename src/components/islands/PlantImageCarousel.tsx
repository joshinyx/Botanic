import { useState, useRef, useEffect } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

interface Props {
  images: { src: string; alt: string }[];
}

const arrowStyle = (side: "left" | "right", visible: boolean): React.CSSProperties => ({
  position: "absolute", [side]: 10, top: "50%", transform: "translateY(-50%)",
  width: 34, height: 34,
  display: "flex", alignItems: "center", justifyContent: "center",
  borderRadius: "50%",
  background: "rgba(0,0,0,0.50)",
  border: "1px solid rgba(255,255,255,0.18)",
  color: "#f7f8f8",
  cursor: "pointer",
  backdropFilter: "blur(6px)",
  WebkitBackdropFilter: "blur(6px)",
  opacity: visible ? 1 : 0,
  pointerEvents: visible ? "auto" : "none",
  transition: "opacity 0.2s ease",
});

export default function PlantImageCarousel({ images }: Props) {
  const [idx, setIdx] = useState(0);
  const [hovered, setHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const multi = images.length > 1;

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !multi) return;

    const onTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (touchStartX.current === null) return;
      const delta = touchStartX.current - e.changedTouches[0].clientX;
      if (Math.abs(delta) > 50) {
        if (delta > 0) setIdx((i) => Math.min(i + 1, images.length - 1));
        else setIdx((i) => Math.max(i - 1, 0));
      }
      touchStartX.current = null;
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [multi, images.length]);

  if (images.length === 0) return null;

  const prev = () => setIdx((i) => i - 1);
  const next = () => setIdx((i) => i + 1);

  return (
    <div>
      <div
        ref={containerRef}
        style={{
          position: "relative",
          borderRadius: 10,
          overflow: "hidden",
          border: "1px solid var(--color-border-std)",
          touchAction: "pan-y",
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <img
          key={idx}
          src={images[idx].src}
          alt={images[idx].alt}
          draggable={false}
          style={{ width: "100%", height: "auto", display: "block" }}
        />

        {multi && idx > 0 && (
          <button onClick={prev} aria-label="Imagen anterior" style={arrowStyle("left", hovered)}>
            <ChevronLeftIcon size={17} />
          </button>
        )}

        {multi && idx < images.length - 1 && (
          <button onClick={next} aria-label="Siguiente imagen" style={arrowStyle("right", hovered)}>
            <ChevronRightIcon size={17} />
          </button>
        )}
      </div>

      {multi && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 10 }}>
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              aria-label={`Imagen ${i + 1}`}
              style={{
                width: i === idx ? 18 : 6,
                height: 6,
                borderRadius: 999,
                background: i === idx ? "var(--color-accent)" : "var(--color-border-std)",
                border: "none",
                cursor: "pointer",
                padding: 0,
                transition: "width 0.2s ease, background 0.2s ease",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
