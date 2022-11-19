import fs from 'fs';

const TOOL_FILES = [
  'generate-schema-main.ts',
  'generate-schema.ts',
  'parse-types.ts',
]

const SHARED_FILES = [
  'language.ts',
  'type-definitions.ts',
];

async function main() {
  for (const file of TOOL_FILES) {
    const dest = `./src/tools/types/${file}`;
    if (fs.existsSync(dest)) {
      fs.rmSync(dest);
    }
    fs.copyFileSync(`../nemo/backend/src/tools/types/${file}`, dest)
  }

  for (const file of SHARED_FILES) {
    const dest = `./src/shared/${file}`;
    if (fs.existsSync(dest)) {
      fs.rmSync(dest);
    }
    fs.copyFileSync(`../nemo/backend/src/shared/${file}`, dest)
  }
}

void main();
