#!/usr/bin/env node
/**
 * Génère des icones PNG 192×192 et 512×512 pour le manifest PWA.
 * Aucune dépendance externe - PNG pur Node.js.
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

// CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
  crcTable[n] = c;
}
function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (const b of buf) crc = crcTable[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const len = Buffer.allocUnsafe(4); len.writeUInt32BE(data.length);
  const crcVal = Buffer.allocUnsafe(4); crcVal.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crcVal]);
}

/**
 * Crée un PNG carré avec un dégradé vertical bleu → bleu clair.
 * Couleurs brand: #0057B8 → #3A9BD5
 */
function makePNG(size) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // RGB
  ihdr[10] = ihdr[11] = ihdr[12] = 0;

  // Pixels : dégradé vertical du bleu brand
  const rowLen = 1 + size * 3; // 1 filtre + RGB par pixel
  const raw = Buffer.allocUnsafe(size * rowLen);
  for (let y = 0; y < size; y++) {
    const t = y / (size - 1);
    const r = Math.round(0   + t * 58);   // 0   → 58
    const g = Math.round(87  + t * 68);   // 87  → 155
    const b = Math.round(184 + t * -29);  // 184 → 155
    raw[y * rowLen] = 0; // filter None
    for (let x = 0; x < size; x++) {
      raw[y * rowLen + 1 + x * 3]     = r;
      raw[y * rowLen + 1 + x * 3 + 1] = g;
      raw[y * rowLen + 1 + x * 3 + 2] = b;
    }
  }

  // Add a simple "P" letter in white at center (optional - skip for pure color square)
  // Just use solid gradient for simplicity

  const compressed = deflateSync(raw, { level: 6 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))]);
}

const __dir = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dir, '..', 'public');

for (const size of [192, 512]) {
  const png = makePNG(size);
  const out = join(publicDir, `icon-${size}.png`);
  writeFileSync(out, png);
  console.log(`✅  ${out}  (${png.length} bytes)`);
}
