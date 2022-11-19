import assert from 'assert';
import * as datefns from 'date-fns';

// Runtime assertion that value is not null or undefined.
export function assertNonNull<T>(
  value: T | undefined | null,
  message?: string
): T {
  if (value === undefined || value === null) {
    throw new Error(message ?? `Expected non-null value, but got ${value}.`);
  }
  return value;
}

// Returns a string JSON representation of an arbitrary object with reasonable indentation.
export function objectToJson(value: unknown): string {
  if (value === undefined) return 'undefined';
  return JSON.stringify(value, null, 2);
}

/** Returns true iff object[kindField] is part of array. If that's the case, the type of object
 * gets refined appropriately. */
export function isKind<
  T extends string,
  Field extends keyof O & string,
  O extends Record<Field, string>
>(
  object: O,
  array: readonly T[],
  // This cast is safe, but the compile is not smart enough to figure it out. The compiler error
  // message even confirms it's safe:
  // "Type 'string' is not assignable to type 'Field'. 'string' is assignable to the constraint
  // of type 'Field', but 'Field' could be instantiated with a different subtype of constraint 'string'."
  kindField: Field = 'kind' as Field
): object is O & Record<Field, T> {
  const stringArray: readonly string[] = array;
  return stringArray.includes(object[kindField]);
}

// Returns true iff the given value is an object with the given property.
export function hasProperty<T, Field extends PropertyKey>(
  value: T,
  property: Field
): value is T &
  (Field extends keyof T
    ? Record<Field, Exclude<T[Field], undefined>>
    : Record<Field, unknown>) {
  return (
    typeof value == 'object' &&
    value != null &&
    property in value &&
    (value as unknown as Record<Field, unknown>)[property] !== undefined
  );
}

export function emptyToUndefined<T extends string>(s: T): T | undefined {
  return s === '' ? undefined : s;
}

export function nullToUndefined<T>(t: T) {
  return t === null ? undefined : t;
}

/** Sleep for a given number of milliseconds. */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function mapEnum<T extends string, R>(value: T, map: Record<T, R>): R {
  return map[value];
}

export function mapEnumWithDefault<T extends string, R>(
  value: T,
  map: Partial<Record<T, R>>,
  default_: R
): R {
  return map[value] ?? default_;
}

export function processEnv(name: string): string {
  return assertNonNull(
    process.env[name],
    `${name} not defined in the process environment`
  );
}

export function deepCopy<A>(a: A): A {
  if (a === undefined) return undefined as unknown as A;
  if (a === null) return null as unknown as A;
  return JSON.parse(JSON.stringify(a)) as A;
}

export function deepEqual(a: unknown, b: unknown): boolean {
  try {
    assert.deepStrictEqual(a, b);
    return true;
  } catch (_) {
    return false;
  }
}

export function exceptionToString(error: unknown): string {
  const stack = hasProperty(error, 'stack') ? `${error.stack}` : '';
  const message = hasProperty(error, 'message')
    ? `${error.message}`
    : `${error}`;
  if (stack != '') return `${message}\n${stack}`;
  return message;
}

export function parametersToUrl(
  params: Record<string, string> | undefined
): string {
  return new URLSearchParams(params).toString();
}

export function deparseRelativeUrl(
  path: string,
  params: Record<string, string>,
  options?: { noSlash: boolean }
): string {
  const search = parametersToUrl(params);
  if (path === 'home') path = '';
  const prefix =
    options?.noSlash === true ||
    path.startsWith('https://') ||
    path.startsWith('http://')
      ? ''
      : '/';
  return search == '' ? `${prefix}${path}` : `${prefix}${path}?${search}`;
}

export function parseRelativeUrl(url: string):
  | {
      path: string;
      params: Record<string, string>;
    }
  | undefined {
  try {
    const data = new URL(url, 'https://example.com');
    const params: Record<string, string> = {};
    for (const [name, value] of data.searchParams) {
      params[name] = value;
    }
    return {
      path: data.pathname,
      params,
    };
  } catch (e) {
    return undefined;
  }
}

export function capitalizeFirstLetter(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function camelCase(s: string): string {
  return capitalizeFirstLetter(s.replace(/[-_./]./g, x => x[1].toUpperCase()));
}

/** Helper function for exhaustive checks. */
export function assertNever(value: never): never {
  throw new Error(`assertNever should be unreachable.`);
}

export interface RetryConfig {
  maxTries?: number;
  maxSeconds?: number;
  sleepMsBetweenTries?: number;
}

/** Retry a function for up to n times or up to a given time period. */
export async function retryWithoutSentryAnnotations<T>(
  f: () => Promise<T>,
  config: RetryConfig,
  annotateFailureCallback?: (info: {
    numTries: number;
    start: Date;
    reason: string;
  }) => void
): Promise<T> {
  let n = 1;
  const maxTries = config.maxTries ?? 10;
  const start = new Date();
  while (true) {
    try {
      return await f();
    } catch (e) {
      if (
        config.maxSeconds !== undefined &&
        datefns.isPast(datefns.add(start, { seconds: config.maxSeconds }))
      ) {
        const reason = `Stopping to retry, because ${datefns.differenceInSeconds(
          start,
          datefns.add(start, { seconds: config.maxSeconds })
        )} seconds have passed, and we stop after ${
          config.maxSeconds
        } seconds.`;
        console.log(reason);
        if (annotateFailureCallback !== undefined) {
          annotateFailureCallback({
            numTries: n,
            start,
            reason,
          });
        }
        throw e;
      }
      if (n >= maxTries) {
        const reason = `Stopping to retry, because we already tried ${n} times.`;
        console.log(reason);
        if (annotateFailureCallback !== undefined) {
          annotateFailureCallback({
            numTries: n,
            start,
            reason,
          });
        }
        throw e;
      }
      if (config.sleepMsBetweenTries !== undefined) {
        console.log(`Waiting for ${config.sleepMsBetweenTries}ms...`);
        await sleep(config.sleepMsBetweenTries);
      }
      console.log(`Retrying...`);
      n += 1;
    }
  }
}

export function sum(list: IterableIterator<number>): number {
  let result = 0;
  for (const element of list) {
    result += element;
  }
  return result;
}

/** Performs a lexical comparison between the tuples a and b. The TS type is an array because TS is not expressive enough.
 * Numbers are compared as usual, and strings are compared using localCompare. The types and length of elements must match.
 */
export function lexicalCompare(
  a: Array<string | number>,
  b: Array<string | number>
): number {
  if (a.length !== b.length)
    throw new Error(`a and b should be of equal length.`);
  for (let i = 0; i < a.length; i++) {
    const aItem = a[i];
    const bItem = b[i];
    if (typeof aItem === 'string' && typeof bItem === 'string') {
      const result = aItem.localeCompare(bItem);
      if (result !== 0) return result;
    } else if (typeof aItem === 'number' && typeof bItem === 'number') {
      if (aItem !== bItem) return aItem - bItem;
    } else {
      throw new Error(`a and b should contain the same types.`);
    }
  }
  return 0;
}

export function oxfordCommaList(l: string[]): string {
  if (l.length === 0) return '';
  if (l.length === 1) return l[0];
  if (l.length === 2) return `${l[0]} and ${l[1]}`;
  return `${l.slice(0, -1).join(', ')}, and ${l.slice(-1)[0]}`;
}
