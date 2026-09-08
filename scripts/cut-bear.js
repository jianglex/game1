const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const assetsDir = path.join(__dirname, "..", "assets");

function isBg(r, g, b, a) {
  if (a < 20) return true;
  if (r > 235 && g > 220 && b > 200 && Math.abs(r - g) < 30 && r - b < 60) return true;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const chroma = max - min;
  const avg = (r + g + b) / 3;
  if (chroma < 18 && avg >= 150) return true;
  if (chroma < 25 && avg >= 110 && avg < 150 && Math.abs(r - g) < 14 && Math.abs(g - b) < 14) {
    return true;
  }
  return false;
}

async function cutout(file) {
  const input = path.join(assetsDir, file);
  const tmp = path.join(assetsDir, file.replace(/\.png$/, "-cut.png"));
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const out = Buffer.from(data);
  const visited = new Uint8Array(width * height);
  const queue = [];

  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const i = y * width + x;
    if (visited[i]) return;
    const o = i * channels;
    if (!isBg(out[o], out[o + 1], out[o + 2], out[o + 3])) return;
    visited[i] = 1;
    queue.push(i);
  };

  for (let x = 0; x < width; x++) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    push(0, y);
    push(width - 1, y);
  }

  let cleared = 0;
  while (queue.length) {
    const i = queue.pop();
    const o = i * channels;
    out[o + 3] = 0;
    cleared += 1;
    const x = i % width;
    const y = (i / width) | 0;
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }

  for (let pass = 0; pass < 3; pass++) {
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
          [1, 1],
          [-1, -1],
        ]) {
          if (out[((y + dy) * width + (x + dx)) * channels + 3] === 0) near = true;
        }
        if (near && isBg(out[o], out[o + 1], out[o + 2], out[o + 3])) {
          out[o + 3] = 0;
          cleared += 1;
        }
      }
    }
  }

  await sharp(out, { raw: { width, height, channels } }).png().toFile(tmp);
  fs.renameSync(tmp, input);
  console.log("cut:", file, "cleared", cleared);
}

(async () => {
  for (const file of ["hubbie-bear.png", "hubbie-bear-happy.png", "hubbie-bear-sad.png"]) {
    if (fs.existsSync(path.join(assetsDir, file))) await cutout(file);
  }
})();
