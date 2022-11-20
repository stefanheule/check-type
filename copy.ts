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
    if (fs.existsSync(dest)) {
      fs.rmSync(dest);
    }
    fs.copyFileSync(source, dest)
  }
}

void main();
