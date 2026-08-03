// MapLibre's ESM worker script (maplibre-gl-worker.mjs) imports a sibling
// file (maplibre-gl-shared.mjs) via a relative specifier. It resolves that
// relative to wherever the worker script is served from, so the two files
// have to be colocated on disk. Turbopack's `new URL(x, import.meta.url)`
// asset handling only copies the one referenced file (not its imports),
// which breaks the worker at load time — see GymMapInner.tsx.
//
// Fix: vendor both files into public/, served byte-for-byte with their
// import intact, and point maplibre's setWorkerUrl() at the public path.
// Runs on `npm install` (postinstall) so it can't drift from whatever
// maplibre-gl version is actually installed.

import { copyFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const srcDir = join(root, 'node_modules/maplibre-gl/dist')
const destDir = join(root, 'public/maplibre')

mkdirSync(destDir, { recursive: true })
for (const file of ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs']) {
  copyFileSync(join(srcDir, file), join(destDir, file))
}
console.log('Vendored maplibre-gl worker files into public/maplibre/')
