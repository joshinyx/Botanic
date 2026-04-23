import { useState } from "react";
import { ChevronRightIcon } from "lucide-react";

interface Props {
  images: { src: string; alt: string }[];
}

export default function PlantImageCarousel({ images }: Props) {
  const [idx, setIdx] = useState(0);

  if (images.length === 0) return null;

  const multi = images.length > 1;
  const next = () => setIdx((i) => (i + 1) % images.length);

  return (
    <div>
      <div style={{
        position: "relative",
        aspectRatio: "1 / 1",
        borderRadius: 10,
        overflow: "hidden",
        border: "1px solid var(--color-border-std)",
      }}>
        <img
          key={idx}
          src={images[idx].src}
          alt={images[idx].alt}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />

        {multi && (
          <button
            onClick={next}
            aria-label="Next image"
            style={{
              position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
              width: 34, height: 34,
              display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: "50%",
              background: "rgba(0,0,0,0.50)",
              border: "1px solid rgba(255,255,255,0.18)",
              color: "#f7f8f8",
              cursor: "pointer",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
            }}
          >
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
