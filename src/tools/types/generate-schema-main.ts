// Main file to generate the type schema and type-checking functions.

import { parseTypes, tsProgramFromFiles, watchTsFiles } from './parse-types';
import {
  generateSchemaFile,
  generateCheckingFunctionsFile,
  TypesConfig,
} from './generate-schema';
import {
  SchemaKind,
  SCHEMA_KINDS,
  tsFilesForKind as tsFilesForBuiltinKind,
  typesConfigForKind as typesConfigForBuiltinKind,
} from '../check-type-config';
import { parse } from 'ts-command-line-args';
import { Types } from '../../shared/type-definitions';
import fs from 'fs';
import path from 'path';
import { sys } from 'typescript';

interface Arguments {
  kind: 'single' | SchemaKind;
  watch: boolean;
  help: boolean;
  'no-changes': boolean;
  sources?: string;
  'schema-path'?: string;
}

const args = parse<Arguments>(
  {
    kind: {
      type: (s: string | undefined): 'single' | SchemaKind | undefined => {
        const kinds: Array<string> = [...SCHEMA_KINDS, 'single'];
        if (s !== undefined && kinds.includes(s)) {
          return s as SchemaKind;
        }
        return undefined;
      },
      description: `What kind of code generation to run. One of: ${[
        'single',
        ...SCHEMA_KINDS,
      ].join(', ')}.`,
    },
    sources: {
      type: String,
      optional: true,
      description: 'Path to the source files (required for kind=single).',
    },
    'schema-path': {
      type: String,
      optional: true,
      description: 'Path to the schema file (required for kind=single).',
    },
    watch: {
      type: Boolean,
      description: 'Watch the source files for changes and re-run on changes.',
    },
    'no-changes': {
      type: Boolean,
      description: `Fail if the schema isn't already up-to-date.`,
    },
    help: {
      type: Boolean,
      alias: 'h',
      description: 'Prints this usage guide.',
    },
  },
  {
    helpArg: 'help',
  }
);

export function allTsFilesFor(directory: string, accumulator?: string[]) {
  const files: string[] = accumulator ?? [];
  for (const file of fs.readdirSync(directory)) {
    const fullPath = `${directory}/${file}`;
    if (fs.lstatSync(fullPath).isFile() && file.match(/.tsx?$/)) {
      files.push(fullPath);
    }
    if (
      (fs.lstatSync(fullPath).isDirectory() ||
        // TODO: check if the destination is a directory
        fs.lstatSync(fullPath).isSymbolicLink()) &&
      !fullPath.includes('/node_modules/')
    ) {
      allTsFilesFor(fullPath, files);
    }
  }
  return files;
}

function error(msg: string) {
  console.warn(msg);
  sys.exit(1);
}

function relativePathFromSrcToDst(src: string, dst: string): string {
  console.log({src, dst, relative: path.relative(src, dst)});
  return path.relative(src, dst);
}

async function main() {
  const kind = args.kind;
  const watching = args.watch;
  const noChanges = args['no-changes'];

  let root: string;
  let tsFilesForKind: () => string[];
  let typesConfigForKind: (types?: Types) => TypesConfig[];
  if (kind === 'single') {
    const sources = args.sources;
    if (sources === undefined) {
      return error(`Specify --sources when using --kind=single`);
    }
    root = path.resolve(sources);
    const schemaPath = args['schema-path'];
    if (schemaPath === undefined) {
      return error(`Specify --schema-path when using --kind=single`);
    }
    tsFilesForKind = () => allTsFilesFor(path.resolve(sources));
    typesConfigForKind = (types?: Types) => {
      types = types ?? parseTypes(root, tsProgramFromFiles(tsFilesForKind()));
      const absoluteSchemaPath = path.resolve(schemaPath);
      return [
        {
          kind,
          schema: types,
          absolutePathToSchema: absoluteSchemaPath,
          functions: {
            pathFromSchemaToType: filename =>
              relativePathFromSrcToDst(root, filename),
            pathToSharedFromSchema: () => `check-type`,
          },
        },
      ];
    };
  } else {
    root = path.resolve(`${__dirname}/../../../..`);
    tsFilesForKind = () => tsFilesForBuiltinKind(kind);
    typesConfigForKind = (types?: Types) =>
      typesConfigForBuiltinKind(kind, types);
  }

  // Watch for changes
  const files = tsFilesForKind();
  if (!watching) {
    console.log(
      `Processing ${files.length} file${
        files.length > 1 ? 's' : ''
      } for ${kind}...`
    );
    const configs = typesConfigForKind();
    for (const config of configs) {
      generateSchemaFile(config, noChanges);
      generateCheckingFunctionsFile(config);
    }
  } else {
    console.log(
      `Watching ${files.length} file${
        files.length > 1 ? 's' : ''
      } in ${kind} for changes...`
    );
    let first = true;
    watchTsFiles(
      () => tsFilesForKind(),
      program => {
        console.log(first ? `Initial processing...` : `Detected changes...`);
        first = false;
        const types = parseTypes(root, program);
        const configs = typesConfigForKind(types);
        for (const config of configs) {
          generateSchemaFile(config, noChanges);
          generateCheckingFunctionsFile(config);
        }
      }
    );
  }
}

void main();
