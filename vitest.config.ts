import { defineConfig } from "vitest/config";
import solid from "vite-plugin-solid";
import { fileURLToPath } from "node:url";

const SRC = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
  // vite-plugin-solid types come from vite 6; vitest 2 bundles vite 5.
  // Functionally compatible; cast to satisfy the type checker.
  plugins: [solid() as unknown as never],
  resolve: {
    conditions: ["development", "browser"],
    alias: {
      "~": SRC,
    },
  },
  // When running from a git worktree nested under another checkout (e.g. the
  // .claude/worktrees/ pattern this repo uses), pnpm can pull packages from
  // the parent checkout's node_modules cache. Vite 5's default fs.strict
  // refuses to serve those files. Loosening this is safe for unit tests.
  server: {
    fs: { strict: false },
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["tests/**/*.test.{ts,tsx}", "src/**/*.test.{ts,tsx}"],
    exclude: ["node_modules", "dist", ".astro"],
    setupFiles: ["./tests/setup.ts"],
  },
});
