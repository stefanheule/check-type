// Main file to generate the type schema and type-checking functions.

import * as fs from 'fs';

import { Schema, Type } from '../../shared/type-definitions';
import { assertNonNull } from '../../shared/language';
import { visitAllTypes } from './parse-types';
import path from 'path';

export function allTypeNames(schema: Schema): string[] {
  return Object.keys(schema.types);
}
export function allTypes(schema: Schema): Type[] {
  return Object.values(schema.types);
}

export function generateSchemaFile(config: TypesConfig, noChanges: boolean) {
  if (allTypeNames(config.schema).length === 0) {
    console.log(`  Schema for ${config.name} is empty, skipping.`);
    return;
  }
  const schema = JSON.stringify(config.schema, null, 2);
  const path = `${config.absolutePathToSchema}/schema.json`;
  if (fs.existsSync(path) && fs.lstatSync(path).isFile()) {
    if (fs.readFileSync(path).toString() == schema) {
      console.log(`  Schema for ${config.name} already up to date.`);
      return;
    }
  }

  // Test is not checked in, so we don't check.
  if (
    noChanges &&
    !config.absolutePathToSchema.endsWith('backend/src/tools/types')
  ) {
    console.log(
      `Schema for '${config.name}' is not up to date, please generate it using 'yarn codegen'.`
    );
    process.exit(1);
  }

  fs.writeFileSync(path, schema);
  console.log(`  Generated schema for ${config.name}.`);
}

export function generateCheckingFunctionsFile(config: TypesConfig) {
  if (allTypeNames(config.schema).length === 0) {
    return;
  }
  if (config.noFunctions === true) return;
  const filenameToType: { [key: string]: string[] } = {};
  for (const type of allTypes(config.schema)) {
    const filename = path.relative(
      config.absolutePathToSchema,
      `${config.root}/${type.filename?.replace(/\.tsx?$/, '')}`
    );
    if (!(filename in filenameToType)) filenameToType[filename] = [];
    filenameToType[filename].push(assertNonNull(type.name));
  }
  const usedSpecialTypes = new Set<string>();
  visitAllTypes(config.schema, type => {
    if (type.kind === 'string' && type.specialName !== undefined) {
      usedSpecialTypes.add(type.specialName);
    }
  });
  const functions = `// IMPORTANT: This file is automatically generated by ${__filename}, do not manually change it.

/* eslint-disable */
import { Type, Schema } from '${config.pathToSharedFromSchema(
    'type-definitions'
  )}';
import { ${[...usedSpecialTypes].join(
    ', '
  )} } from '${config.pathToSharedFromSchema('types/common')}';
import { NotPromise, checkValueAgainstType, computePropertiesOfType } from '${config.pathToSharedFromSchema(
    'check-type'
  )}';
import mainSchema from './schema.json';
${config.pathOfAdditionalSchemas
  .map(
    (pathToSchema, i) =>
      `import additionalSchema${i} from './${path.relative(
        config.absolutePathToSchema,
        pathToSchema
      )}/schema.json';`
  )
  .join('\n')}

${Object.entries(filenameToType)
  .map(entry => `import { ${entry[1].join(', ')} } from './${entry[0]}';`)
  .join('\n')}

const schema = { types: { ...mainSchema.types, ${config.pathOfAdditionalSchemas
    .map((_, i) => `...additionalSchema${i}.types`)
    .join(', ')} } }

export function propertiesOfType(typeName: ${allTypeNames(config.schema)
    .map(name => `'${name}'`)
    .join(' | ')}): string[] {
  return computePropertiesOfType(schema as unknown as Schema, (schema.types as {[key: string]: Type})[typeName]);
}

${[...usedSpecialTypes]
  .map(
    type => `export function assert${type}<T>(value: NotPromise<T>): ${type} {
  const error = checkValueAgainstType(value, { kind: 'string' } as unknown as Type, schema as unknown as Schema);
  if (error != '') throw new Error(error);
  return value as unknown as ${type};
}`
  )
  .join('\n\n')}

${allTypes(config.schema)
  .map(
    type => `export function assert${type.name}<T>(value: NotPromise<T>): ${type.name} {
  const error = checkValueAgainstType(value, (schema.types as {[key: string]: Type})['${type.name}'], schema as unknown as Schema);
  if (error != '') throw new Error(error);
  return value as unknown as ${type.name};
}`
  )
  .join('\n\n')}
`;
  const filePath = `${config.absolutePathToSchema}/check-type.generated.ts`;
  if (fs.existsSync(filePath) && fs.lstatSync(filePath).isFile()) {
    if (fs.readFileSync(filePath).toString() == functions) {
      console.log(
        `  Type checking functions for ${config.name} already up to date.`
      );
      return;
    }
  }

  fs.writeFileSync(filePath, functions);
  console.log(`  Generated type checking functions for ${config.name}.`);
}

export type TypesConfig = {
  name: string;
  noGen: boolean;
  noFunctions: boolean;
  root: string;
  absolutePathToSchema: string;
  schema: Schema;
  pathOfAdditionalSchemas: string[];
  pathToSharedFromSchema: (filename: string) => string;
};
