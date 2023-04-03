// Main file to generate the type schema and type-checking functions.

import { parseTypes, tsProgramFromFiles, watchTsFiles } from './parse-types';
import {
  generateSchemaFile,
  generateCheckingFunctionsFile,
  TypesConfig,
} from './generate-schema';

import { parse } from 'ts-command-line-args';
import { Schema } from '../../shared/type-definitions';
import fs from 'fs';
import path from 'path';
import { sys } from 'typescript';
import {
  assertNonNull,
  hasProperty,
  objectToJson,
} from '../../shared/language';
import util from 'util';

interface Arguments {
  watch: boolean;
  help: boolean;
  'no-changes': boolean;
  internal: boolean;
  config: string;
}

const args = parse<Arguments>(
  {
    config: {
      type: String,
      description: 'Configuration (json)',
    },
    watch: {
      type: Boolean,
      description: 'Watch the source files for changes and re-run on changes.',
    },
    'no-changes': {
      type: Boolean,
      description: `Fail if the schema isn't already up-to-date.`,
    },
    internal: {
      type: Boolean,
      description: `Internal use only.`,
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

type IndividualConfig = {
  root: string;
  noGen?: boolean;
};

const CONFIG_FORMAT = `Format is:

type Config = IndividualConfig | IndividualConfig[]
type IndividualConfig = {
  root: string;
  noGen?: boolean;
};
    `;

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

function error(msg: string): never {
  console.warn(msg);
  sys.exit(1);
  throw Error('Unreachable');
}

function parseIndividualConfig(config: object): IndividualConfig {
  if (hasProperty(config, 'root') && typeof config.root === 'string') {
    if (hasProperty(config, 'doNotGenerateSchema')) {
    }
    return {
      root: path.resolve(config.root),
      noGen: hasProperty(config, 'noGen') && config.noGen === true,
    };
  }
  return error(
    `Invalid config; missing root property for '${objectToJson(
      config
    )}'. ${CONFIG_FORMAT}`
  );
}

async function main() {
  util.inspect.defaultOptions.depth = Infinity;
  util.inspect.defaultOptions.maxArrayLength = Infinity;
  const watching = args.watch;
  const noChanges = args['no-changes'];

  let configJson;
  try {
    configJson = JSON.parse(args.config) as unknown;
  } catch (e) {
    error(`Failed to parse JSON.parse config. ${CONFIG_FORMAT}`);
  }

  let configs: IndividualConfig[];
  if (Array.isArray(configJson)) {
    configs = configJson.map(parseIndividualConfig);
  } else if (typeof configJson === 'object' && configJson !== null) {
    configs = [parseIndividualConfig(configJson)];
  } else {
    return error(
      `Invalid config of type ${typeof configJson}. ${CONFIG_FORMAT}`
    );
  }
  if (configs.length === 0) {
    return error(`Empty config. ${CONFIG_FORMAT}`);
  }

  const root = configs.map(c => c.root).sort((a, b) => a.length - b.length)[0];

  const tsFilesForKind = () => allTsFilesFor(root);
  const typesConfigForKind: (schema?: Schema) => TypesConfig[] = schema => {
    const resolvedSchema =
      schema ?? parseTypes(root, tsProgramFromFiles(tsFilesForKind()));
    const allTypes = Object.entries(resolvedSchema.types).sort((a, b) =>
      a[0].localeCompare(b[0])
    );
    return configs.map((config, i) => {
      const otherConfigs = configs.filter((_, j) => i !== j);
      const otherNonParentConfigs = otherConfigs.filter(
        other => !config.root.startsWith(other.root)
      );
      const result: TypesConfig = {
        name: config.root,
        noGen: config.noGen === true,
        root,
        noFunctions: false,
        schema: {
          types: Object.fromEntries(
            allTypes.filter(([_, type]) => {
              const filename = `${root}/${assertNonNull(type.filename)}`;
              return (
                filename.startsWith(config.root) &&
                !otherNonParentConfigs.some(other =>
                  filename.startsWith(other.root)
                )
              );
            })
          ),
          assertedTypes: resolvedSchema.assertedTypes,
        },
        absolutePathToSchema: config.root,
        pathToSharedFromSchema: name => {
          if (args.internal) {
            return `./${path.relative(
              config.root,
              `${
                configs.length > 1
                  ? configs[1].root
                  : `${__dirname}/../../shared`
              }`
            )}/${name}`;
          }
          return `check-type`;
        },
        pathOfAdditionalSchemas: otherNonParentConfigs.map(
          config => config.root
        ),
      };
      return result;
    });
  };

  // Watch for changes
  const files = tsFilesForKind();
  if (!watching) {
    console.log(
      `Processing ${files.length} file${files.length > 1 ? 's' : ''}...`
    );
    const configs = typesConfigForKind();
    for (const config of configs) {
      if (config.noGen) continue;
      generateSchemaFile(config, noChanges);
      generateCheckingFunctionsFile(config);
    }
  } else {
    console.log(
      `Watching ${files.length} file${
        files.length > 1 ? 's' : ''
      } for changes...`
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
          if (config.noGen) continue;
          generateSchemaFile(config, noChanges);
          generateCheckingFunctionsFile(config);
        }
      }
    );
  }

  return;
}

void main();
