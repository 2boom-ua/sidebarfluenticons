// Fluent System Icons Viewer
// Copyright 2boom, 2026
// tools/generate-sprite.js
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const ICONS_JSON = path.join(DATA_DIR, 'icons.json');
const PACKAGE_DIR = path.join(__dirname, '..', 'node_modules', '@fluentui', 'svg-icons', 'icons');
const OUTPUT_FILE = path.join(DATA_DIR, 'iconsSprite24.svg');

function readIconsIndex() {
  if (!fs.existsSync(ICONS_JSON)) {
    console.error('❌ icons.json not found. Run: node tools/generate-icons.js');
    process.exit(1);
  }
  const raw = fs.readFileSync(ICONS_JSON, 'utf8');
  const data = JSON.parse(raw);
  if (!data || !Array.isArray(data.icons)) {
    console.error('❌ Invalid icons.json structure.');
    process.exit(1);
  }
  return data.icons;
}

function extractInnerSvg(svgText) {
  const match = svgText.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
  if (!match) return null;
  return match[1].trim();
}

function buildSprite(items) {
  if (!fs.existsSync(PACKAGE_DIR)) {
    console.error('❌ Package not found. Run: npm install @fluentui/svg-icons@' + '1.1.341');
    process.exit(1);
  }

  const symbols = [];
  let skipped = 0;

  for (const item of items) {
    if (item.size !== 24) continue;

    const filePath = path.join(PACKAGE_DIR, item.file);
    if (!fs.existsSync(filePath)) {
      skipped++;
      continue;
    }

    const svgText = fs.readFileSync(filePath, 'utf8');
    const inner = extractInnerSvg(svgText);
    if (!inner) {
      skipped++;
      continue;
    }

    const id = `ic_fluent_${item.name}_24_${item.style}`;
    symbols.push(`<symbol id="${id}" viewBox="0 0 24 24">${inner}</symbol>`);
  }

  const sprite = `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">${symbols.join('')}</svg>`;
  return { sprite, count: symbols.length, skipped };
}

function generateSprite() {
  try {
    const items = readIconsIndex();
    const { sprite, count, skipped } = buildSprite(items);

    if (count === 0) {
      console.error('❌ No 24px icons found.');
      process.exit(1);
    }

    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_FILE, sprite, 'utf8');
    console.log(`✅ Generated sprite with ${count} symbols (skipped ${skipped}) to ${OUTPUT_FILE}`);
  } catch (err) {
    console.error('❌ Failed to generate sprite:', err.message);
    process.exit(1);
  }
}

generateSprite();