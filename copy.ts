import fs from 'fs';

const FILES = [
  'tools/types/generate-schema-main.ts',
  'tools/types/generate-schema.ts',
  'tools/types/parse-types.ts',
  'shared/language.ts',
  'shared/type-definitions.ts',
  'shared/check-type.ts',
  'shared/validators.ts',
  'shared/types/common.ts',
];

async function main() {
  for (const file of FILES) {
    let source = `../nemo/backend/src/${file}`;
    let dest = `./src/${file}`;
    if (process.argv.length > 2 && process.argv[2] === 'export') {
      [source, dest] = [dest, source];
    }
    if (fs.existsSync(dest)) {
      fs.rmSync(dest);
    }
    fs.copyFileSync(source, dest)
  }
}

void main();
