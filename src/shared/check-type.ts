// Generic function to take a value and compare it against a type definition.
// There are type-specialized versions of this generated for each type that are typically
// more convenient to use, but they all call this.
//
// We pay reasonable attention to making error messages readable.

import {
  Type,
  Schema,
  resolveType,
  isEnum,
  typeToString,
  indent,
  BuiltInType,
} from './type-definitions';
import { assertNonNull, exceptionToString, hasProperty, mapEnum, objectToJson } from './language';
import {
  validateCountryCode,
  validateDollarAmount,
  validateEmail,
  validateIsoDate,
  validateIsoDatetime,
  validateNumericString,
  validatePhoneNumber,
  validatePostalCode,
  validateSocialSecurityNumber,
  validateTrimmedString,
  validateUsState,
  validateUuid,
} from './validators';

export const SPECIAL_TYPES = [
  'IsoDate',
  'IsoDatetime',
  'TrimmedString',
  'Email',
  'PhoneNumber',
  'SocialSecurityNumber',
  'PostalCode',
  'Uuid',
  'NumericString',
  'DollarAmount',
  'UsState',
  'CountryCode',
];

// A type that can be used to express "Any type that's not a Promise".
export type NotPromise<T> = T extends Promise<unknown> ? never : T;

export class TypecheckingError extends Error {
  constructor(m: string) {
    super(m);
    // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#generated-constructor-code-substitutes-the-return-value-of-super-calls-as-this
    Object.setPrototypeOf(this, TypecheckingError.prototype);
  }
}

// Check the value for additional constraints when we know about a special type.
// These types are defined in shared/types/common.ts.
function checkSpecialStringType(value: string, type: BuiltInType) {
  if (type.specialName === undefined) return;
  const validator = mapEnum(type.specialName, {
    IsoDate: validateIsoDate,
    IsoDatetime: validateIsoDatetime,
    TrimmedString: validateTrimmedString,
    Email: validateEmail,
    PhoneNumber: validatePhoneNumber,
    SocialSecurityNumber: validateSocialSecurityNumber,
    PostalCode: validatePostalCode,
    Uuid: validateUuid,
    NumericString: validateNumericString,
    DollarAmount: validateDollarAmount,
    UsState: validateUsState,
    CountryCode: validateCountryCode,
  });
  if (validator !== undefined) {
    const result = validator(value);
    if (result !== '')
      throw new TypecheckingError(
        `${result} Got '${value}' for ${type.specialName}`
      );
  }
  // Check trimmed-ness
  if (
    ['TrimmedString', 'Email', 'DollarAmount', 'NumericString'].includes(
      type.specialName
    ) &&
    value !== value.trim()
  ) {
    throw new TypecheckingError(
      `${
        type.specialName
      } must not have extra whitespace, but found '${value}' == value != value.trim() == '${value.trim()}'`
    );
  }
}

/** Returns the set of possible properties on a given type. The set is an over-approximation. */
export function computePropertiesOfType(schema: Schema, type: Type): string[] {
  switch (type.kind) {
    case 'string':
    case 'number':
    case 'boolean':
    case 'undefined':
    case 'null':
    case 'unknown':
    case 'string-literal':
    case 'boolean-literal':
    case 'number-literal':
    case 'keyof':
      return [];
    case 'index-signature':
      throw new Error(`Cannot compute fields of ${typeToString(type)}, because it is an index signature.`);
    case 'mapped':
      const from = resolveType(schema, type.mapFrom);
      switch (from.kind) {
        case 'string-literal':
          return [from.value];
        case 'union':
          const result = [];
          for (const m of from.unionMembers) {
            const member = resolveType(schema, m);
            if (member.kind === 'string-literal') {
              result.push(member.value);
            } else {
              throw new Error(`Cannot compute fields of ${typeToString(type)}, because from is a union with a member that is ${member.kind}`);
            }
          }
          return result;
        default:
          throw new Error(`Cannot compute fields of ${typeToString(type)}, because from is ${from.kind}`);
      }
    case 'array':
      return ['length'];
    case 'reference-type':
      return computePropertiesOfType(schema, resolveType(schema, type));
    case 'omit':
      return computePropertiesOfType(schema, resolveType(schema, type)).filter(f => type.omittedFields.indexOf(f) === -1);
    case 'interface':
      const result: string[] = type.fields.map(field => field.name);
      for (const member of type.heritage) {
        for (const candidate of computePropertiesOfType(schema, member)) {
          if (!result.includes(candidate)) {
            result.push(candidate);
          }
        }
      }
      return result;
    case 'union': {
      const result: string[] = [];
      for (const member of type.unionMembers) {
        for (const candidate of computePropertiesOfType(schema, member)) {
          if (!result.includes(candidate)) {
            result.push(candidate);
          }
        }
      }
      return result;
    }
    case 'intersection': {
      const result: string[] = [];
      for (const member of type.intersectionMembers) {
        for (const candidate of computePropertiesOfType(schema, member)) {
          if (!result.includes(candidate)) {
            result.push(candidate);
          }
        }
      }
      return result;
    }
    case 'partial':
      return computePropertiesOfType(schema, type.elementType);
  }
}

// Returns '' if value conforms to the given type, or a readable error message otherwise.
export function checkValueAgainstType<T>(
  value: NotPromise<T>,
  type: Type,
  schema: Schema
): string {
  const valueString = 'value';
  const typeString = '_TYPE_';
  try {
    checkValueAgainstTypeHelper(
      value,
      type,
      schema,
      valueString,
      typeString,
      0
    );
  } catch (error) {
    if (error instanceof TypecheckingError) {
      const shortValueString = valueToShortString(value, valueString);
      return `${shortValueString} does not conform to ${typeToShortString(
        type,
        typeString
      )}!

${
  valueString !== shortValueString
    ? error.message.split('\n').slice(0, -1).join('\n')
    : `${error.message}
value = ${objectToJson(value)}`
}
${
  error.message.includes(typeString)
    ? `
_TYPE_ = ${objectToJson(type)}`
    : ''
}`;
    } else {
      throw error;
    }
  }
  return '';
}

// Completes normally if value conforms to type and throws a
// TypecheckingError with a readable message why not otherwise.
function checkValueAgainstTypeHelper(
  value: unknown,
  type: Type,
  schema: Schema,
  valueString: string,
  typeString: string,
  depth: number,
  options?: { partial?: boolean, ignoredFields?: string[] }
) {
  const checkJsType = (jsType: string, details?: string) => {
    if (typeof value !== jsType) {
      throw new TypecheckingError(
        `Expected Javascript type ${jsType}, but got type ${typeof value}`
      );
    }
  };
  const ignoredFields = options?.ignoredFields ?? [];

  handleTypecheckingError(
    () => {
      type = resolveType(schema, type);
      if (options?.partial === true && type.kind != 'interface') {
        throw new Error(
          `Can only check Partial<T> for interface T, but T was ${typeToString(
            type
          )}`
        );
      }
      switch (type.kind) {
        case 'string':
          checkJsType('string');
          checkSpecialStringType(value as string, type);
          break;
        case 'number':
        case 'boolean':
          checkJsType(type.kind);
          break;
        case 'unknown':
          break;
        case 'boolean-literal':
          checkJsType('boolean');
          if (value !== type.value)
            throw new TypecheckingError(
              `Expected ${type.value ? 'true' : 'false'} literal`
            );
          break;
        case 'keyof':
          checkJsType('string');
          const keys = computePropertiesOfType(schema, type.base);
          if (!keys.includes(value as string)) {
            throw new TypecheckingError(
              `Expected one of [${keys.map(value => `'${value}'`)}], but got '${value}'`
            );
          }
          break;
        case 'index-signature':
          checkJsType('object');
          for (const field of Object.keys(value as object)) {
            checkValueAgainstTypeHelper(
              (value as { [field: string]: unknown })[field],
              type.valueType,
              schema,
              `${valueString}['${field}']`,
              typeToShortString(type.valueType),
              depth + 1
            );
          }
          break;
        case 'omit':
          checkValueAgainstTypeHelper(
            value,
            type.base,
            schema,
            valueString,
            typeToShortString(type),
            depth + 1,
            { ignoredFields: ignoredFields.concat(type.omittedFields) }
          );
          break;
        case 'mapped':
          checkJsType('object');
          if (type.mapFrom.kind === 'string') {
            for (const field of Object.keys(value as object)) {
              if (ignoredFields.includes(field)) continue;
              checkValueAgainstTypeHelper(
                (value as { [field: string]: unknown })[field],
                type.mapTo,
                schema,
                `${valueString}['${field}']`,
                typeToShortString(type.mapTo),
                depth + 1
              );
            }
            break;
          }
          // Fixed set of properties?
          let properties;
          try {
            properties = computePropertiesOfType(schema, type);
          } catch (e) {
            throw new Error(
              `Cannot type-check mapped type with mapFrom type ${typeToString(
                type.mapFrom
              )}, because properties are not fixed: ${exceptionToString(e)}`
            );
          }
          for (const property of properties) {
            if (ignoredFields.includes(property)) continue;
            if (
              !type.optional &&
              options?.partial !== true &&
              !hasProperty(value, property)
            ) {
              throw new TypecheckingError(
                `Field '${property}' is not optional but missing from value`
              );
            }
            if (hasProperty(value, property)) {
              checkValueAgainstTypeHelper(
                value[property],
                type.mapTo,
                schema,
                `${valueString}['${property}']`,
                typeToShortString(type.mapTo),
                depth + 1
              );
            }
          }
          break;
        case 'null':
          if (value !== null)
            throw new TypecheckingError(`Expected null value`);
          break;
        case 'undefined':
          if (value !== undefined)
            throw new TypecheckingError(`Expected undefined value`);
          break;
        case 'string-literal':
          checkJsType('string');
          if (value !== type.value)
            throw new TypecheckingError(
              `Expected string literal '${type.value}', but got '${value}'`
            );
          break;
        case 'number-literal':
          checkJsType('number');
          if (value !== type.value)
            throw new TypecheckingError(
              `Expected number literal '${type.value}', but got '${value}'`
            );
          break;
        case 'intersection':
          for (const member of type.intersectionMembers) {
            checkValueAgainstTypeHelper(
              value,
              member,
              schema,
              valueString,
              typeToString(member, { short: true }),
              depth + 1,
              { ignoredFields }
            );
          }
          break;
        case 'union': {
          // Special case: enum
          const enums = isEnum(type);
          if (enums !== undefined) {
            checkJsType('string', 'enum type');
            if (enums.includes(value as string)) return;
            throw new TypecheckingError(
              `Expected one of [${enums
                .map(value => `'${value}'`)
                .join(', ')}], but got '${value}'`
            );
          }
          // Special case: union with kind
          if (type.kinds !== undefined) {
            checkJsType('object', 'union with kind');
            if (!hasProperty(value, 'kind')) {
              throw new TypecheckingError(`Field 'kind' is missing from union`);
            }
            if (typeof value.kind !== 'string') {
              throw new TypecheckingError(
                `Expected field 'kind' to have Javascript type string, but found type ${typeof value.kind}`
              );
            }
            if (!type.kinds.includes(value.kind)) {
              throw new TypecheckingError(
                `Expected field 'kind' to be one of [${type.kinds
                  .map(value => `'${value}'`)
                  .join(', ')}], but got '${value.kind}'`
              );
            }
            const unionKindType = assertNonNull(
              type.unionMembers.find(member => {
                const resolvedMember = resolveType(schema, member);
                return (
                  resolvedMember.kind === 'interface' &&
                  Boolean(
                    resolvedMember.fields.find(
                      field =>
                        field.name == 'kind' &&
                        field.type.kind == 'string-literal' &&
                        field.type.value == value.kind
                    )
                  )
                );
              })
            );
            checkValueAgainstTypeHelper(
              value,
              unionKindType,
              schema,
              valueString,
              typeToShortString(
                unionKindType,
                `${typeString}[kind == '${value.kind}']`
              ),
              depth + 1,
              { ignoredFields }
            );
          }
          // Generic handling.
          const errors = [];
          for (let i = 0; i < type.unionMembers.length; ++i) {
            const option = type.unionMembers[i];
            const error = handleTypecheckingError(
              () => {
                checkValueAgainstTypeHelper(
                  value,
                  option,
                  schema,
                  valueString,
                  typeToShortString(
                    option,
                    `${typeString}[${ith(i + 1)} union member]`
                  ),
                  depth + 1,
                  { ignoredFields }
                );
                return '';
              },
              error => {
                return error.message;
              }
            );
            if (error == '') return;
            errors.push(`- tried ${ith(i + 1)} union member, but got:
  ${indent(error)}`);
          }
          throw new TypecheckingError(`No union member matches:
${errors.join('\n')}`);
        }

        case 'array': {
          checkJsType('object');
          if (!Array.isArray(value)) {
            throw new TypecheckingError(
              `Expected an array, but value is not an array`
            );
          }
          for (let i = 0; i < value.length; ++i) {
            const elementType = type.elementType;
            checkValueAgainstTypeHelper(
              value[i],
              elementType,
              schema,
              `${valueString}[${i}]`,
              typeToShortString(
                elementType,
                `${typeString}[array element type]`
              ),
              depth + 1
            );
          }
          break;
        }

        case 'partial': {
          const elementType = resolveType(schema, type.elementType);
          checkValueAgainstTypeHelper(
            value,
            elementType,
            schema,
            valueString,
            typeToShortString(type, `Partial<${typeString}>`),
            depth + 1,
            { partial: true, ignoredFields }
          );
          break;
        }

        case 'interface': {
          checkJsType('object');
          for (const field of type.fields) {
            if (ignoredFields.includes(field.name)) continue;
            if (
              !field.optional &&
              options?.partial !== true &&
              !hasProperty(value, field.name)
            ) {
              throw new TypecheckingError(
                `Field '${field.name}' is not optional but missing from value`
              );
            }
            if (hasProperty(value, field.name)) {
              checkValueAgainstTypeHelper(
                value[field.name],
                field.type,
                schema,
                `${valueString}['${field.name}']`,
                typeToShortString(field.type, `${typeString}['${field.name}']`),
                depth + 1
              );
            }
          }
          for (const heritage of type.heritage) {
            checkValueAgainstTypeHelper(
              value,
              heritage,
              schema,
              valueString,
              typeToString(heritage, { short: true }),
              depth + 1,
              { ignoredFields }
            );
          }
          break;
        }
      }
    },
    error => {
      // if (depth == 0) throw error;
      throw new TypecheckingError(`${error.message}
While checking ${valueToShortString(
        value,
        valueString
      )} against type ${typeToShortString(type, typeString)}`);
    }
  );
}

function valueToShortString(value: unknown, valueString: string): string {
  const result =
    typeof value === 'object'
      ? JSON.stringify(value)
      : typeof value === 'string'
      ? `'${value}'`
      : String(value);
  if (result.length < 40) return `${valueString} (aka. \`${result}\`)`;
  return valueString;
}

function handleTypecheckingError<T>(
  call: () => T,
  errorHandler: (error: TypecheckingError) => T
) {
  try {
    return call();
  } catch (error) {
    if (error instanceof TypecheckingError) {
      return errorHandler(error);
    } else {
      throw error;
    }
  }
}

function ith(i: number) {
  return `${i}${i == 1 ? 'st' : i == 2 ? 'nd' : i == 3 ? 'rd' : 'th'}`;
}

function typeToShortString(type: Type, alternative?: string): string {
  if (type.name !== undefined) return type.name;
  const str = typeToString(type, { short: true });
  if (
    alternative === undefined ||
    str.length < alternative.length + 10 ||
    str.length < 40
  )
    return str;
  return alternative;
}
