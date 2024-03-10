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

  // No need to do anything on terra other than update the repo and rebuild. Deploying projects does a fresh install of dependencies, so that's fine.
  await run(`ssh terra NO_GITSTATUS=yes 'zsh -ic "cd ~/www/check-type && git pull && yarn install && yarn build"'`);

  for (const project of ['metro', 'purplemoon', 'call-schedule']) {
    await run(`rm -f ${HERE}/../${project}/node_modules/.bin/generate-schema`);
    for (const dir of ['', 'server/', 'client/']) {
      await run(`rm -rf ${HERE}/../${project}/${dir}node_modules/check-type`);
    }

    for (const dir of ['server', 'client']) {
      await run(`yarn --cwd ${HERE}/../${project} ${dir} install --check-files`);
    }
    await run(`yarn --cwd ${HERE}/../${project} install --check-files`);
  }
}

void main();
