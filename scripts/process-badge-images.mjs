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

function isBackgroundPixel(r, g, b) {
  if (r < 16 && g < 16 && b < 16) {
    return true;
  }

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = max === 0 ? 0 : (max - min) / max;

  if (
    Math.abs(r - 204) <= 3 &&
    Math.abs(g - 204) <= 3 &&
    Math.abs(b - 204) <= 3
  ) {
    return true;
  }

  if (r >= 248 && g >= 248 && b >= 248 && saturation < 0.03) {
    return true;
  }

  if (min >= 245 && max - min <= 6 && saturation < 0.03) {
    return true;
  }

  if (min >= 235 && max - min <= 20 && saturation < 0.08) {
    return true;
  }

  return false;
}

function floodClearFromEdges(data, width, height) {
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
    if (!isBackgroundPixel(data[offset], data[offset + 1], data[offset + 2])) {
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

function removeDetachedEdgeLines(data, width, height) {
  const rowOpaqueCount = (y) => {
    let count = 0;
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 10) {
        count++;
      }
    }
    return count;
  };

  for (const edge of ['bottom', 'top']) {
    let y = edge === 'bottom' ? height - 1 : 0;
    while (y >= 0 && y < height) {
      const opaqueCount = rowOpaqueCount(y);
      if (opaqueCount < width * 0.5) {
        break;
      }

      let gapRows = 0;
      const step = edge === 'bottom' ? -1 : 1;
      for (let scanY = y + step, i = 0; i < 20; scanY += step, i++) {
        if (scanY < 0 || scanY >= height) {
          break;
        }
        if (rowOpaqueCount(scanY) < width * 0.05) {
          gapRows++;
        } else {
          break;
        }
      }

      if (gapRows >= 5) {
        for (let x = 0; x < width; x++) {
          data[(y * width + x) * 4 + 3] = 0;
        }
        y += step;
        continue;
      }

      break;
    }
  }
}

async function processSeal(inputPath, outputPath) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  floodClearFromEdges(data, info.width, info.height);
  removeDetachedEdgeLines(data, info.width, info.height);

  await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .trim()
    .resize(320, 320, {
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
    await processSeal(input, join(outDir, `${level}.png`));
    console.log(`Processed ${level}.png`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
