# MINI SANDBOX 3D

Browser-based 3D creative sandbox built with Babylon.js and Vite.

## Features
- First-person building and block removal
- Six procedural block materials
- Local world save in browser storage
- Floating Verity companion with a local scripted helper chat
- Multiplayer rooms with live player positions, shared block edits and room chat
- Mobile movement controls

## Multiplayer architecture
- Frontend: `src/multiplayer.js` connects to `/api/room/:room` over WebSocket.
- Pages Function: `functions/api/room/[room].js` routes each room to its Durable Object.
- Realtime service: Cloudflare Worker `mini-sandbox-3d-realtime`.
- Durable Object class: `SandboxRoom`, one isolated object per room name.
- Binding: Pages production and preview binding `GAME_ROOMS` points to the `SandboxRoom` namespace.
- Room data: player connections and chat are live; the block snapshot is stored in Durable Object storage and shared with new participants.
- Room limit: 16 connected players. Room IDs are lowercase letters, digits, underscores and hyphens.

## Development
```bash
npm install
npm run dev
npm run build
npm run preview
```

## Notes
- Verity currently uses local scripted responses; it is not connected to a remote AI model.
- Player identity is a display name only. There is no account system yet.


## 3D model import
- The official Babylon.js glTF loader is included from the Babylon CDN.
- Use **Импортировать 3D-модель** to add a local .glb or .gltf model to the current browser session.
- Local model imports are not yet synchronized to multiplayer rooms or included in world saves.
- Keep imported files below 50 MB for browser performance.

## Free asset sources
- [Poly Haven](https://polyhaven.com/) — CC0 models, PBR textures and HDRIs. See its [license](https://polyhaven.com/license).
- [Kenney](https://kenney.nl/assets) — CC0 game asset packs. See [Kenney support/licensing](https://kenney.nl/support).
- [Babylon.js official Asset Librarian](https://doc.babylonjs.com/toolsAndResources/assetLibrarian) — free assets; check each source asset's license and attribution before copying files into this repository.
