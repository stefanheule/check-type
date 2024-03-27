// @check-type:entire-file

import { IsoDate, IsoDatetime } from "../src";

// Types used to test checkValueAgainstType.
export interface Interface {
  boolField: boolean;
  optionalField?: boolean;
}
export type Union =
  | {
      kind: 'a';
    }
  | {
      kind: 'b';
      foo: number;
    };

export type Enum = 'a' | 'b';

export type MixedUnion =
  | 'a'
  | {
      kind: 'a';
    };

export type Undef = undefined;
export type Null = null;

export type ArrayT = number[];
export type ArrayT2 = Array<number>;

export type StringT = string;
export type NumberT = number;

export type RefT = SomeOtherNamedType;
export type SomeOtherNamedType = 'a';

export interface Base {
  base: string;
}
export interface Sub extends Base {
  sub: string;
}
export interface A {
  a: string;
}
export interface B {
  b: string;
}
export type And = A & B;

export type RecString = Record<string, number>;
export type RecAB = Record<'a' | 'b', number>;
export type MappedABOptional = {
  [Symbol in 'a' | 'b']?: number;
};
export type MappedABOptionalIndirect = {
  [Symbol in Enum]?: number;
};

export type IndexSignature = {
  [key: string]: number;
}

export interface CommonTypes {
  isoDate?: IsoDate;
  isoDatetime?: IsoDatetime;
  // ...
}

export type OmitTypeNoSub = Omit<Sub, 'sub'>;
export type OmitTypeNoBase = Omit<Sub, 'base'>;
export type OmitTypeNoSubNoBase = Omit<Sub, 'base' | 'sub'>;

export type KeyOfType = keyof Sub;
