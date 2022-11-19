// A set of type definitions, indexed by their name.
export type Types = {
  [key: string]: Type;
};

export type Type = ReferenceType | ResolvedType;
export type ResolvedType =
  | InterfaceType
  | UnionType
  | IntersectionType
  | ArrayType
  | PartialType
  | BuiltInType
  | StringLiteralType
  | NullType
  | UnknownType
  | MappedType
  | BooleanLiteralType
  | UndefinedType;
export interface BaseType {
  // The name of this type (if it has one).
  name?: string;
  // The filename where this type is defined.
  filename?: string;
}
export interface ReferenceType extends BaseType {
  kind: 'reference-type';
  referencedTypeName: string;
}
export interface NullType extends BaseType {
  kind: 'null';
}
export interface UnknownType extends BaseType {
  kind: 'unknown';
}
export interface MappedType extends BaseType {
  kind: 'mapped';
  mapFrom: Type;
  optional: boolean;
  mapTo: Type;
}
export interface BooleanLiteralType extends BaseType {
  kind: 'boolean-literal';
  value: boolean;
}
export interface UndefinedType extends BaseType {
  kind: 'undefined';
}
export interface StringLiteralType extends BaseType {
  kind: 'string-literal';
  value: string;
}
export interface ArrayType extends BaseType {
  kind: 'array';
  elementType: Type;
}
export interface PartialType extends BaseType {
  kind: 'partial';
  elementType: Type;
}
export interface BuiltInType extends BaseType {
  kind: 'number' | 'boolean' | 'string';
}
export interface InterfaceType extends BaseType {
  kind: 'interface';
  fields: Field[];
  heritage: ReferenceType[];
}
export interface UnionType extends BaseType {
  kind: 'union';
  unionMembers: Type[];
  // If all members have a kind field (our convention for unions that aren't enums),
  // then list the kinds.
  kinds?: string[];
}
export interface IntersectionType extends BaseType {
  kind: 'intersection';
  intersectionMembers: Type[];
}

export interface Field {
  name: string;
  optional: boolean;
  type: Type;
}

// Resolves a type: a reference type will be mapped to it's definition (potentially
// following multiple resolve steps), and all other types are returned as is.
export function resolveType(types: Types, type: Type): ResolvedType {
  if (type.kind != 'reference-type') {
    return type;
  }
  if (type.referencedTypeName in types) {
    const candidate = types[type.referencedTypeName];
    if (candidate.kind == 'reference-type') {
      return resolveType(types, candidate);
    }
    return { ...candidate, name: type.referencedTypeName };
  }
  throw new Error(
    `Type '${type.referencedTypeName}' was used, but not defined.`
  );
}

// Returns the enum values if this Union is an enum (i.e. a set of string literal types),
// or undefined otherwise.
export function isEnum(union: UnionType): string[] | undefined {
  const result = [];
  for (const member of union.unionMembers) {
    if (member.kind == 'string-literal') {
      result.push(member.value);
    } else {
      return undefined;
    }
  }
  return result;
}

export function indent(s: string, indent = '  ') {
  return s.replace(/\n/g, `\n${indent}`);
}
export function typeToString(
  type: Type,
  options?: { short?: boolean }
): string {
  const short = options?.short === true;
  if (type.name !== undefined) return type.name;
  switch (type.kind) {
    case 'string':
    case 'number':
    case 'boolean':
    case 'null':
    case 'unknown':
    case 'undefined':
      return type.kind;
    case 'boolean-literal':
      return type.value ? 'true' : 'false';
    case 'reference-type':
      return type.referencedTypeName;
    case 'interface':
      return `{${short ? ' ' : '\n  '}${type.fields
        .map(
          field => `${field.name}: ${indent(typeToString(field.type, options))}`
        )
        .join(short ? '; ' : '\n  ')}${short ? ' ' : '\n'}}${
        type.heritage.length > 0
          ? ` extends ${type.heritage
              .map(x => typeToString(x, options))
              .join(', ')}`
          : ''
      }`;
    case 'union': {
      const members = type.unionMembers.map(member =>
        indent(typeToString(member, options))
      );
      if (short || members.every(member => !member.includes('\n')))
        return members.join(' | ');
      return members.join(' | \n');
    }
    case 'intersection':
      return type.intersectionMembers
        .map(type => typeToString(type, options))
        .join(' & ');
    case 'array':
      return `Array<${typeToString(type.elementType, options)}>`;
    case 'partial':
      return `Partial<${typeToString(type.elementType, options)}>`;
    case 'string-literal':
      return `'${type.value}'`;
    case 'mapped':
      return `{ [Symbol in ${type.mapFrom}]: ${type.mapTo}}`;
  }
}
