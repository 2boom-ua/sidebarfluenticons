// Fluent System Icons Viewer
// Copyright 2boom, 2026
// tools/generate-icons.js
const fs = require('fs');
const path = require('path');

const PACKAGE_DIR = path.join(__dirname, '..', 'node_modules', '@fluentui', 'svg-icons', 'icons');
const OUTPUT_FILE = path.join(__dirname, '..', 'data', 'icons.json');
const VERSION = '1.1.339';

function parseFilename(filename) {
  const match = filename.match(/^(.+)_(\d+)_(regular|filled)\.svg$/);
  if (!match) return null;
  return {
    name: match[1],
    size: parseInt(match[2], 10),
    style: match[3],
    file: filename
  };
}

function generateIndex() {
  try {
    if (!fs.existsSync(PACKAGE_DIR)) {
      console.error('❌ Package not found. Run: npm install @fluentui/svg-icons@' + VERSION);
      process.exit(1);
    }

    const files = fs.readdirSync(PACKAGE_DIR);
    const svgFiles = files.filter(f => f.endsWith('.svg') && !f.startsWith('.'));

    if (svgFiles.length === 0) {
      console.error('❌ No SVG files found in package.');
      process.exit(1);
    }

    const items = [];
    for (const file of svgFiles) {
      const parsed = parseFilename(file);
      if (parsed) {
        items.push(parsed);
      }
    }

    items.sort((a, b) => {
      if (a.name !== b.name) return a.name.localeCompare(b.name);
      if (a.size !== b.size) return a.size - b.size;
      return a.style.localeCompare(b.style);
    });

    const outputDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const output = {
      version: VERSION,
      icons: items
    };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf8');
    console.log(`✅ Generated ${items.length} icons (version ${VERSION}) to ${OUTPUT_FILE}`);
  } catch (err) {
    console.error('❌ Failed to generate index:', err.message);
    process.exit(1);
  }
}

generateIndex();