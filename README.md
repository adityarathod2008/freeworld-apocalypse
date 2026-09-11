# FREEWORLD — ULTIMATE REAL-CITY APOCALYPSE 🧟‍♂️🌆
## MASTER OPEN-WORLD SURVIVAL WEBGL ENGINE v5.0

**FreeWorld** is a high-performance, persistent open-world survival game engine built with **Three.js**, **Vanilla JavaScript**, and **PBR WebGL Shaders**.

---

## 🚀 Vercel Deployment Instructions

### Option A: 1-Click Vercel Import (GitHub)
1. Push this repository (`game_freeworld_repo`) to your GitHub account:
   ```bash
   git init
   git add .
   git commit -m "Initial release v5.0"
   git remote add origin https://github.com/YOUR_USERNAME/freeworld-apocalypse.git
   git push -u origin main
   ```
2. Go to [Vercel Dashboard](https://vercel.com/new).
3. Select **Import Git Repository** -> pick `freeworld-apocalypse`.
4. Vercel will auto-detect **Vite**. Click **Deploy**.

---

### Option B: Deploy via Vercel CLI
```bash
npm install -g vercel
vercel
```

---

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Start Vite dev server
npm run dev

# Build production bundle
npm run build
```

---

## 🏛️ Architecture & Systems

- **6-Layer System Architecture + Cross-Cutting Foundation**: `WORLD`, `ENTITY`, `PLAYER`, `STORY`, `GAMEPLAY`, `PRESENTATION`, and `CROSS-CUTTING`.
- **World Streaming & Sectors**: Dynamic 60m x 60m spatial partition grid (`SectorManager.js`).
- **Multi-Tier Simulation LOD**: `NEAR` (<75m), `MID` (75-180m), `FAR` (180-320m), `UNLOADED` (>320m).
- **GIS Data Pipeline**: Geographic GeoJSON parser with procedural synthesis fallback (`GISDataParser.js` & `CityImporter.js`).
- **Vehicle Ownership & Persistent Theft Loop**: Registered vehicle ownership, keys, alarm response, and persistent vehicle world state.
- **Master Story State Machine**: Full `StoryState` serializable schema with complete state save/reload reconstruction.
