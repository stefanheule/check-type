import { Types } from '../shared/type-definitions';
import { TypesConfig } from './types/generate-schema';

export function tsFilesForKind(kind: SchemaKind): string[] {
  return []
}

export function typesConfigForKind(
  kind: SchemaKind,
  types?: Types
): Array<TypesConfig> {
  return [];
}

export const SCHEMA_KINDS: readonly string[] = [] as const;
export type SchemaKind = typeof SCHEMA_KINDS[number];
