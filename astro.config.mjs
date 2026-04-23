import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import node from "@astrojs/node";

export default defineConfig({
  output: "server",
  vite: {
    server: {
      allowedHosts: ["app.joshiny.dev"],
    },
  },
  adapter: node({
    mode: "standalone",
  }),
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
  ],
});
