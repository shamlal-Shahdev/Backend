import sharp from 'sharp';
import { existsSync, mkdirSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outDir = join(root, 'assets', 'images', 'badges');
const sourceDir = join(root, 'assets', 'images', 'badges-source');

const externalSource = join(
  process.env.USERPROFILE ?? '',
  '.cursor',
  'projects',
  'c-Users-Shaam-lal-Documents-WattsUp-Energy',
  'assets',
);

const USER_BADGES = {
  bronze: join(
    externalSource,
    'c__Users_Shaam_lal_AppData_Roaming_Cursor_User_workspaceStorage_03ebe31686395eed2831859c968bcee7_images_image-71c5ff33-d9f4-4a19-8e9c-15df46f34666.png',
  ),
  silver: join(
    externalSource,
    'c__Users_Shaam_lal_AppData_Roaming_Cursor_User_workspaceStorage_03ebe31686395eed2831859c968bcee7_images_image-be1a8d01-4f1e-4c91-b0a5-56d603e82743.png',
  ),
  gold: join(
    externalSource,
    'c__Users_Shaam_lal_AppData_Roaming_Cursor_User_workspaceStorage_03ebe31686395eed2831859c968bcee7_images_image-97bef42c-7ef9-4966-a0aa-f09cdf05da27.png',
  ),
  platinum: join(externalSource, 'platinum.png'),
};

const ALL_LEVELS = ['bronze', 'silver', 'gold', 'platinum'];

/** Bronze/gold checkerboard preview — remove neutral grey/white, keep medal colour. */
function isNeutralBackground(r, g, b, a) {
  if (a < 8) {
    return true;
  }
  if (r >= 248 && g >= 248 && b >= 248) {
    return true;
  }
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = max === 0 ? 0 : (max - min) / max;
  if (saturation < 0.07 && min >= 175) {
    return true;
  }
  return false;
}

function clearNeutralBackground(data) {
  for (let i = 0; i < data.length; i += 4) {
    if (isNeutralBackground(data[i], data[i + 1], data[i + 2], data[i + 3])) {
      data[i + 3] = 0;
    }
  }
}

/** Silver uses a white page background — edge flood only, never global grey removal. */
function isSilverOuterBackground(r, g, b, a) {
  if (a < 8) {
    return true;
  }
  if (r >= 250 && g >= 250 && b >= 250) {
    return true;
  }
  if (
    Math.abs(r - 204) <= 3 &&
    Math.abs(g - 204) <= 3 &&
    Math.abs(b - 204) <= 3
  ) {
    return true;
  }
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = max === 0 ? 0 : (max - min) / max;
  if (r >= 248 && g >= 248 && b >= 248 && saturation < 0.02) {
    return true;
  }
  return false;
}

function clearSilverBackgroundFromEdges(data, width, height) {
  const visited = new Uint8Array(width * height);
  const queue = [];

  const trySeed = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) {
      return;
    }
    const index = y * width + x;
    if (visited[index]) {
      return;
    }
    const offset = index * 4;
    if (!isSilverOuterBackground(data[offset], data[offset + 1], data[offset + 2], data[offset + 3])) {
      return;
    }
    visited[index] = 1;
    queue.push(index);
  };

  for (let x = 0; x < width; x++) {
    trySeed(x, 0);
    trySeed(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    trySeed(0, y);
    trySeed(width - 1, y);
  }

  while (queue.length > 0) {
    const index = queue.pop();
    data[index * 4 + 3] = 0;
    const x = index % width;
    const y = Math.floor(index / width);
    trySeed(x - 1, y);
    trySeed(x + 1, y);
    trySeed(x, y - 1);
    trySeed(x, y + 1);
  }
}

function rowOpaqueCount(data, width, y) {
  let count = 0;
  for (let x = 0; x < width; x++) {
    if (data[(y * width + x) * 4 + 3] > 10) {
      count++;
    }
  }
  return count;
}

function removeContentBelowSeal(data, width, height) {
  let sealMaxY = -1;
  for (let y = 0; y < height; y++) {
    const opaqueCount = rowOpaqueCount(data, width, y);
    if (opaqueCount >= width * 0.05 && opaqueCount < width * 0.72) {
      sealMaxY = Math.max(sealMaxY, y);
    }
  }
  if (sealMaxY < 0) {
    return;
  }
  for (let y = sealMaxY + 1; y < height; y++) {
    for (let x = 0; x < width; x++) {
      data[(y * width + x) * 4 + 3] = 0;
    }
  }
}

async function processSeal(inputPath, outputPath, level) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (level === 'silver') {
    clearSilverBackgroundFromEdges(data, info.width, info.height);
    removeContentBelowSeal(data, info.width, info.height);
  } else {
    clearNeutralBackground(data);
  }

  await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .trim()
    .extend({
      top: 24,
      bottom: 24,
      left: 24,
      right: 24,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .resize(360, 360, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(outputPath);
}

function syncSources() {
  mkdirSync(sourceDir, { recursive: true });
  mkdirSync(outDir, { recursive: true });

  for (const level of ALL_LEVELS) {
    const sourcePath = USER_BADGES[level];
    const dest = join(sourceDir, `${level}.png`);
    if (existsSync(sourcePath)) {
      copyFileSync(sourcePath, dest);
      continue;
    }
    const fallback = join(externalSource, `${level}.png`);
    if (existsSync(fallback)) {
      copyFileSync(fallback, dest);
    }
  }
}

async function main() {
  syncSources();
  for (const level of ALL_LEVELS) {
    const input = join(sourceDir, `${level}.png`);
    if (!existsSync(input)) {
      throw new Error(`Missing badge source for ${level}.png`);
    }
    await processSeal(input, join(outDir, `${level}.png`), level);
    console.log(`Processed ${level}.png`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
