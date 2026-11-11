import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/* Content-Security-Policy for the published build. The app is fully self-contained:
   no remote scripts, fonts, images or network calls are allowed. (Skipped in dev, where
   Vite's hot-reload needs inline scripts and a websocket.) Inline style attributes are
   required by React-positioned elements, hence 'unsafe-inline' for styles only. */
const csp = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ')

const securityHeaders = (): Plugin => ({
  name: 'moodspace-security-meta',
  apply: 'build',
  transformIndexHtml: (html) => html.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${csp}" />`),
})

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), securityHeaders()],
  server: { port: 5173 },
  build: { sourcemap: false, chunkSizeWarningLimit: 1200 },
})
