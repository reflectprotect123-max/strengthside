// EDS rebrand for the imported Engine page. The Engine source of truth lives on
// its own branch, so the rename is applied at import time with exact-count
// patch points (like PATCHES in import-engine-house.mjs) and fails safely if the
// upstream text moved. Internal code names and storage keys are unchanged.
import { readFileSync } from 'node:fs';

const MARK = new URL('../apps/mobile/capacitor/brand/eds-mark-96.png', import.meta.url);
const OLD_LOGO = /data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/=]+/g;

export const BRAND_PATCHES = [
  ['<title>The Hybrid Engine</title>', '<title>EDS Engine</title>'],
  ['<div class="standalone-note">The Hybrid Engine</div>', '<div class="standalone-note">EDS Engine</div>'],
  ["'Enter the same email + password you use on THE Hybrid Engine'", "'Enter the same email + password you use on EDS Engine'"],
  ["'Version '+currentVersion:'The Hybrid Engine'", "'Version '+currentVersion:'EDS Engine'"],
  ['Choose a StrengthSide standalone backup.', 'Choose an EDS Strength backup.'],
  ['<span class="home-mark" aria-hidden="true">TH</span>', '<img class="home-mark home-mark-img" src="@EDS_MARK@" width="36" height="36" alt="" aria-hidden="true">'],
  ['.home-mark {\n', '.home-mark-img { padding: 0; border: 0; object-fit: cover; }\n.home-mark {\n'],
];

export function applyBrand(html, mark = readFileSync(MARK)) {
  let out = String(html);
  for (const [from, to] of BRAND_PATCHES) {
    const count = out.split(from).length - 1;
    if (count !== 1) throw new Error(`Engine brand patch ${from.slice(0, 40)} found ${count} times; expected exactly 1`);
    out = out.replace(from, () => to);
  }
  // The Hybrid Power Project logo (nav, logger hub, training header) becomes the EDS mark.
  const logos = out.match(OLD_LOGO) || [];
  if (logos.length !== 3) throw new Error(`Engine brand: expected 3 embedded HPP logos, found ${logos.length}`);
  const alts = out.split('alt="Hybrid Power Project"').length - 1;
  if (alts !== 2) throw new Error(`Engine brand: expected 2 Hybrid Power Project alts, found ${alts}`);
  const uri = 'data:image/png;base64,' + Buffer.from(mark).toString('base64');
  return out
    .replace(OLD_LOGO, () => '@EDS_MARK@')
    .split('alt="Hybrid Power Project"').join('alt="EDS Strength"')
    .split('@EDS_MARK@').join(uri);
}
