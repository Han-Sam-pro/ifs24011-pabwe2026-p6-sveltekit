import { defineConfig, loadEnv } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { svelteTesting } from "@testing-library/svelte/vite";
import tailwindcss from "@tailwindcss/vite";
import process from "process";

// Menyisipkan CSS hasil build langsung ke index.html agar tidak ada
// stylesheet eksternal yang memblokir render (Lighthouse: render-blocking).
function inlineCssPlugin() {
  return {
    name: "inline-css",
    apply: "build",
    enforce: "post",
    transformIndexHtml: {
      order: "post",
      handler(html, ctx) {
        const bundle = ctx && ctx.bundle;
        if (!bundle) return html;
        // Preload skrip entri (modulepreload) agar tidak dihitung sebagai rantai
        // permintaan kritis (Lighthouse: network dependency tree).
        const withPreload = html.replace(
          /<script\b[^>]*type=["']module["'][^>]*src=["']([^"']+)["'][^>]*><\/script>/,
          (tag, src) => `<link rel="modulepreload" crossorigin href="${src}">\n    ${tag}`
        );
        return withPreload.replace(/<link\b[^>]*>/g, (tag) => {
          if (!/rel=["']stylesheet["']/.test(tag)) return tag;
          const match = tag.match(/href=["']([^"']+\.css)["']/);
          if (!match) return tag;
          const asset = bundle[match[1].replace(/^\//, "")];
          if (!asset || asset.type !== "asset") return tag;
          const css =
            typeof asset.source === "string"
              ? asset.source
              : new TextDecoder().decode(asset.source);
          return `<style>${css}</style>`;
        });
      },
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      svelte({
        prebundleSvelteLibraries: false,
      }),
      tailwindcss(),
      svelteTesting(),
      inlineCssPlugin(),
    ],
    server: {
      port: Number(env.APP_PORT) || 3000,
    },
    preview: {
      port: Number(env.APP_PORT) || 3000,
    },
    build: {
      chunkSizeWarningLimit: 1500,
    },
    define: {
      DELCOM_BASEURL: JSON.stringify(
        env.VITE_DELCOM_BASEURL || "https://open-api.delcom.org/api/v1"
      ),
    },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./src/setupTests.js",
      coverage: {
        provider: "v8",
        reporter: ["text", "json", "html", "lcov"],
        include: ["src/**/*.{js,svelte}"],
        exclude: [
          "src/main.js",
          "src/setupTests.js",
          "src/test-utils.js",
          "**/*.test.{js,jsx}",
          "node_modules/**",
          ".docs/**",
        ],
        thresholds: {
          lines: 100,
          functions: 100,
          branches: 100,
          statements: 100,
        },
      },
    },
  };
});
