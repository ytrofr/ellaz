import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath, URL } from "node:url";

// Ellaz portal build config.
// - Phaser is isolated into its own stable vendor chunk so it is downloaded once
//   and cached across every Phaser-based game (see plan §5 / Appendix A2).
// - PWA precaches the SHELL only; game chunks are runtime-cached on first play.
// - `base` is "/" for root hosts (Firebase, local) and "/ellaz/" for GitHub Pages
//   (a project site is served under /<repo>/). Set via BASE_PATH in CI.
const base = process.env.BASE_PATH ?? "/";

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt", // never autoUpdate: a mid-game SW swap must not yank chunks
      includeAssets: ["favicon.svg", "icon.svg"],
      manifest: {
        name: "Ellaz Games",
        short_name: "Ellaz",
        description: "Fun games for phone, tablet, and computer.",
        theme_color: "#6c5ce7",
        background_color: "#0f1226",
        display: "standalone",
        orientation: "any",
        // relative so it resolves correctly under any base ("/" or "/ellaz/")
        start_url: ".",
        scope: base,
        icons: [
          { src: "icon.svg", sizes: "any", type: "image/svg+xml" },
          { src: "icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
        ],
      },
      workbox: {
        // Precache the shell (app JS/CSS/HTML). Game chunks are matched below and
        // cached lazily the first time a player opens that game.
        globPatterns: ["**/*.{html,css,js,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes("/assets/game-"),
            handler: "CacheFirst",
            options: {
              cacheName: "ellaz-games",
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@sdk": fileURLToPath(new URL("./src/sdk", import.meta.url)),
      "@ui": fileURLToPath(new URL("./src/ui", import.meta.url)),
      "@juice": fileURLToPath(new URL("./src/juice", import.meta.url)),
      "@i18n": fileURLToPath(new URL("./src/i18n", import.meta.url)),
    },
  },
  build: {
    target: "es2022",
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-phaser": ["phaser"],
          "vendor-react": ["react", "react-dom"],
        },
      },
    },
  },
  server: { port: 5180, host: true },
  preview: { port: 5180, host: true },
});
