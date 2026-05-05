# Kalorien-Rechner

React + Vite + Tailwind. Single-file HTML build via `vite-plugin-singlefile` — der gesamte Output ist eine HTML-Datei (~175 KB) ohne externe Assets.

## Lokal entwickeln

```bash
npm install
npm run dev
```

## Production-Build

```bash
npm run build
# → dist/index.html  (alles inline)
```

## Deploy

Auf allen drei Plattformen reicht es, das Repo zu connecten — Auto-Detect erkennt Vite und nutzt die Defaults:

| Plattform           | Build Command   | Output Dir |
|---------------------|-----------------|------------|
| Vercel              | `npm run build` | `dist`     |
| Cloudflare Pages    | `npm run build` | `dist`     |
| Netlify             | `npm run build` | `dist`     |

**Manuell** (z. B. eigener Webspace):

```bash
npm run build
# dist/index.html irgendwohin hochladen — fertig.
```

## Stack

- Vite 5
- React 18
- Tailwind 3
- vite-plugin-singlefile (inline aller Assets)

Schriften (Anton, Archivo, Inter) werden via Google Fonts zur Laufzeit geladen — also einmal beim ersten Render. Möchtest du komplett offline-fähig, müsstest du sie als Base64 in die CSS einbauen.

## Logik

- BMR via Mifflin–St Jeor
- Aktivitäts-Faktor: `1.2 + Schritte/30000 + Krafttage·0.03 + Cardio_min/1500`
- Defizit/Surplus skaliert mit KFA-Schätzung
- Adhärenz-Anpassung: bei Food-Thoughts ≥7 oder Heißhunger-Historie wird das Defizit um 5pp gemildert (gekappt bei −10 %)
- Makros: Protein 1.8/1.9/2.2 g/kg je nach Ziel · Fett 25 % · Carbs Rest

Alles in `src/App.jsx` — eine Datei, keine Magic.
