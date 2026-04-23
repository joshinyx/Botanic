import { TegakiRenderer } from "tegaki/react";
import parisienne from "tegaki/fonts/parisienne";

export default function AuthBrand() {
  return (
    <a
      href="/"
      className="mb-10 inline-flex items-center justify-center transition-opacity hover:opacity-80"
      style={{ color: "#ffffff" }}
      aria-label="Go to home"
    >
      <TegakiRenderer
        font={parisienne}
        effects={{
          glow: { radius: 6, color: "#ffffff" },
        }}
        style={{
          pointerEvents: "none",
          color: "#ffffff",
          fontSize: "42px",
          lineHeight: 1,
          fontWeight: 510,
          letterSpacing: "0.08em",
          textShadow: "0 0 14px rgba(255,255,255,0.18)",
        }}
      >
        BOTANIC
      </TegakiRenderer>
    </a>
  );
}
