import { defineConfig } from "vite";
import { resolve } from "node:path";
export default defineConfig({ build: { rollupOptions: { input: { main: resolve(process.cwd(), "index.html"), about: resolve(process.cwd(), "about.html"), guide: resolve(process.cwd(), "guide.html") } } } });
