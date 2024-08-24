import { exec } from 'child_process';
import fs from 'fs';
import { promisify } from 'util';

const HERE = __dirname;

async function run(command: string, config?: {
  allowStdErr?: boolean;
}) {
  console.log(`${command}`);
  const { stdout, stderr } = await promisify(exec)(command);
  if (stdout) console.log(stdout);
  if (stderr) {
    console.log('STDERR:')
    console.error(stderr);
    if (config?.allowStdErr !== true) process.exit(1);
  }
}

async function main() {
  
  console.log('usage: yarn release [local] [only=project1,project2]');

  await run(`yarn build`);

  const local = process.argv[2] && process.argv[2].includes('local');
  if (local) {
    console.log('Local build, skipping terra sync');
  }

  // No need to do anything on terra other than update the repo and rebuild. Deploying projects does a fresh install of dependencies, so that's fine.
  if (!local) await run(`ssh terra NO_GITSTATUS=yes 'zsh -ic "cd ~/www/check-type && git pull && yarn install && yarn build"'`, {
    allowStdErr: true
  });

  let projects = ['metro', 'purplemoon', 'call-schedule'];
  const only = process.argv.find(arg => arg.startsWith('only='));
  if (only) {
    projects = only.split('=')[1].split(',');
    console.log(`Only building ${projects.join(', ')}`);
  }
  for (const project of projects) {
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
