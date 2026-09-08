const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const dir = path.join(__dirname, "..", "assets");

function isGreen(r, g, b) {
  return g > 140 && g > r + 40 && g > b + 40;
}

function isEdgeBg(r, g, b, a) {
  if (a < 20) return true;
  if (isGreen(r, g, b)) return true;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const chroma = max - min;
  const avg = (r + g + b) / 3;
  if (chroma < 12 && avg >= 210) return true;
  if (chroma < 10 && avg >= 180 && Math.abs(r - b) < 8) return true;
  return false;
}

async function process(raw, outName) {
  const input = path.join(dir, raw);
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const out = Buffer.from(data);
  const visited = new Uint8Array(width * height);
  const q = [];

  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const i = y * width + x;
    if (visited[i]) return;
    const o = i * channels;
    if (!isEdgeBg(out[o], out[o + 1], out[o + 2], out[o + 3])) return;
    visited[i] = 1;
    q.push(i);
  };

  for (let x = 0; x < width; x++) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    push(0, y);
    push(width - 1, y);
  }

  while (q.length) {
    const i = q.pop();
    const o = i * channels;
    out[o + 3] = 0;
    const x = i % width;
    const y = (i / width) | 0;
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }

  for (let pass = 0; pass < 2; pass++) {
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const i = y * width + x;
        const o = i * channels;
        if (out[o + 3] === 0) continue;
        let near = false;
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          if (out[((y + dy) * width + (x + dx)) * channels + 3] === 0) near = true;
        }
        if (near && isGreen(out[o], out[o + 1], out[o + 2])) out[o + 3] = 0;
      }
    }
  }

  const cutBuf = await sharp(out, { raw: { width, height, channels } }).png().toBuffer();
  const pad = Math.round(width * 0.08);
  const size = width + pad * 2;
  const final = path.join(dir, outName);
  const tmp = final + ".tmp.png";
  await sharp({
    create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: cutBuf, left: pad, top: pad }])
    .png()
    .toFile(tmp);
  fs.renameSync(tmp, final);
  console.log("ok", outName);
}

(async () => {
  await process("hubbie-happy-raw.png", "hubbie-bear-happy.png");
  await process("hubbie-sad-raw.png", "hubbie-bear-sad.png");
  await process("hubbie-idle-raw.png", "hubbie-bear.png");
})();
