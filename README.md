# MOODSPACE

**Your imagination, organized.** A creative workspace for moodboards, colour palettes and visual references that runs entirely in the browser.

- **Board editor** — an infinite canvas for images, text, frames, shapes, sticky notes and colour chips, with resize, rotate, grouping, alignment, layers, undo/redo and PNG export.
- **Color Lab** — build palettes, extract colours from images, generate harmonies and check contrast.
- **Library** — photography, textures, type pairings, shapes and saved elements, searchable and draggable onto a board.
- **Local-first** — no account and no server. Boards are saved in your browser (IndexedDB) and can be exported as `.moodspace` files.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

Built with React, TypeScript, Tailwind CSS, Konva and Zustand.

## Security and privacy

The app makes no network requests beyond loading its own files, and the production build ships a strict Content-Security-Policy. Imported board files are sanitised before use. See the in-app Privacy Policy (`#/privacy`) and Terms (`#/terms`).

No API keys are needed. If you add a service later, read `.env.example` first.

## Credits

Sample photographs are from [Unsplash](https://unsplash.com) and used under the Unsplash Licence. Typefaces: Inter, Manrope, Bodoni Moda and DM Mono (SIL Open Font License).
