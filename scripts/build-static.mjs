import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const devHtml = path.join(ROOT, 'index.dev.html');
const rootHtml = path.join(ROOT, 'index.html');
const distDir = path.join(ROOT, 'dist');
const distHtml = path.join(distDir, 'index.html');
const distAssets = path.join(distDir, 'assets');
const rootAssets = path.join(ROOT, 'assets');
const rootNoJekyll = path.join(ROOT, '.nojekyll');

// 1. Sync sanitized aggregate summary if local Excel is present
execSync('node scripts/sync-public-summary.mjs', { cwd: ROOT, stdio: 'inherit' });

// 2. Restore Vite entry template to index.html for compilation
fs.copyFileSync(devHtml, rootHtml);

// 3. Run Vite production build
execSync('npx vite build', { cwd: ROOT, stdio: 'inherit' });

// 4. Mirror compiled static artifacts to root so GitHub Pages (branch: main / root) works out-of-the-box
if (fs.existsSync(rootAssets)) {
  fs.rmSync(rootAssets, { recursive: true, force: true });
}
fs.cpSync(distAssets, rootAssets, { recursive: true });
fs.copyFileSync(distHtml, rootHtml);
fs.writeFileSync(rootNoJekyll, '', 'utf8');

console.log('[build-static] Artefactos estáticos listos en raíz (index.html + assets/ + .nojekyll) y en dist/.');
