import { exec } from 'child_process';
import fs from 'fs';
import { promisify } from 'util';

const HERE = __dirname;

async function run(command: string) {
  console.log(`${command}`);
  const { stdout, stderr } = await promisify(exec)(command);
  if (stdout) console.log(stdout);
  if (stderr) {
    console.error(stderr);
    process.exit(1);
  }
}

async function main() {
  await run(`yarn build`);
  for (const project of ['metro', 'purplemoon']) {
    for (const dir of ['', 'server/', 'client/']) {
      await run(`rm -rf ${HERE}/../${project}/${dir}node_modules/check-type`);
    }

    await run(`yarn --cwd ${HERE}/../${project} install-all`);
  }
}

void main();
