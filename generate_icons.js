const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPNG(size, primaryColor, secondaryColor) {
  // Simple uncompressed/deflated raw RGBA PNG generator
  const width = size;
  const height = size;

  // Buffer for scanlines: each scanline starts with filter byte 0, followed by width * 4 bytes RGBA
  const rawData = Buffer.alloc(height * (1 + width * 4));

  const [r1, g1, b1] = primaryColor;
  const [r2, g2, b2] = secondaryColor;

  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      // Rounded rectangle mask
      const radius = size * 0.22;
      const dx = Math.max(0, Math.abs(x - (size - 1) / 2) - ((size - 1) / 2 - radius));
      const dy = Math.max(0, Math.abs(y - (size - 1) / 2) - ((size - 1) / 2 - radius));
      const isInside = (dx * dx + dy * dy) <= (radius * radius);

      if (!isInside) {
        rawData[offset++] = 0;
        rawData[offset++] = 0;
        rawData[offset++] = 0;
        rawData[offset++] = 0; // Transparent
        continue;
      }

      // Check inner icon: document / sheet with checkmark / lightning
      const innerMarginX = size * 0.28;
      const innerMarginY = size * 0.20;
      const isPaper = (x >= innerMarginX && x <= size - innerMarginX && y >= innerMarginY && y <= size - innerMarginY);

      if (isPaper) {
        // Draw text lines on paper
        const lineY1 = Math.floor(size * 0.38);
        const lineY2 = Math.floor(size * 0.52);
        const lineY3 = Math.floor(size * 0.66);
        const isLine = ((y === lineY1 || y === lineY1 + 1 || y === lineY2 || y === lineY2 + 1 || y === lineY3) && 
                        x >= innerMarginX + size * 0.08 && x <= size - innerMarginX - size * 0.08);

        if (isLine) {
          rawData[offset++] = r1;
          rawData[offset++] = g1;
          rawData[offset++] = b1;
          rawData[offset++] = 255;
        } else {
          // White paper
          rawData[offset++] = 255;
          rawData[offset++] = 255;
          rawData[offset++] = 255;
          rawData[offset++] = 255;
        }
      } else {
        // Background gradient
        const factor = y / height;
        rawData[offset++] = Math.round(r1 + (r2 - r1) * factor);
        rawData[offset++] = Math.round(g1 + (r2 - g1) * factor);
        rawData[offset++] = Math.round(b1 + (r2 - b1) * factor);
        rawData[offset++] = 255;
      }
    }
  }

  const deflated = zlib.deflateSync(rawData);

  // PNG header
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: RGBA (6)
  ihdr[10] = 0; // Compression: deflate
  ihdr[11] = 0; // Filter: standard
  ihdr[12] = 0; // Interlace: none
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // IDAT chunk
  const idatChunk = makeChunk('IDAT', deflated);

  // IEND chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(4 + 4 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crc = crc32(chunk.slice(4, 8 + len));
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

// Simple CRC32 implementation
function crc32(buf) {
  let table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    table[n] = c;
  }
  let c = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ (-1)) >>> 0;
}

const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

// Teal & Emerald Govt Job Theme
const primary = [16, 149, 114]; // #109572
const secondary = [13, 94, 76];

[16, 48, 128].forEach(size => {
  const png = createPNG(size, primary, secondary);
  fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), png);
  console.log(`Generated icon${size}.png (${png.length} bytes)`);
});
