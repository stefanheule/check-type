import { Schema, Type, checkValueAgainstType as checkValueAgainstTypeBase } from '../src';
import TEST_SCHEMA from './schema.json';

console.log(
  `Ensure that the test schema.json is up to date, or run yarn codegen to update as necessary.`
);
console.log(
  `To update inline snapshots, run yarn jest test --updateSnapshot`
);

function checkValueAgainstType(value: unknown, type: { kind: string }): string {
  return checkValueAgainstTypeBase(
    value,
    type as Type,
    TEST_SCHEMA as unknown as Schema
  );
}

test('KeyOfType', () => {
  expect(
    checkValueAgainstType('sub', TEST_SCHEMA.types.KeyOfType)
  ).toMatchInlineSnapshot(`""`);
  expect(
    checkValueAgainstType('base', TEST_SCHEMA.types.KeyOfType)
  ).toMatchInlineSnapshot(`""`);
  expect(
  checkValueAgainstType('not_existing_field', TEST_SCHEMA.types.KeyOfType)
).toMatchInlineSnapshot(`
"value (aka. \`'not_existing_field'\`) does not conform to KeyOfType!

Expected one of ['sub','base'], but got 'not_existing_field'
"
`);
})

test('Omit', () => {
  expect(
    checkValueAgainstType({ sub: 'b' }, TEST_SCHEMA.types.OmitTypeNoBase)
  ).toMatchInlineSnapshot(`""`);
  expect(
    checkValueAgainstType({ base: 'a' }, TEST_SCHEMA.types.OmitTypeNoSub)
  ).toMatchInlineSnapshot(`""`);
  expect(
    checkValueAgainstType({}, TEST_SCHEMA.types.OmitTypeNoSubNoBase)
  ).toMatchInlineSnapshot(`""`);
  expect(
    checkValueAgainstType({ base: 'a' }, TEST_SCHEMA.types.OmitTypeNoSubNoBase)
  ).toMatchInlineSnapshot(`""`);
  expect(
    checkValueAgainstType({ sub: 'b' }, TEST_SCHEMA.types.OmitTypeNoSubNoBase)
  ).toMatchInlineSnapshot(`""`);
  expect(
    checkValueAgainstType({ base: 'a', sub: 'b' }, TEST_SCHEMA.types.OmitTypeNoSubNoBase)
  ).toMatchInlineSnapshot(`""`);
})

test('Records', () => {
  expect(
    checkValueAgainstType({ a: 1, b: 2, extraField: 3 }, TEST_SCHEMA.types.RecAB)
  ).toMatchInlineSnapshot(`""`);
  expect(checkValueAgainstType({ a: 1 }, TEST_SCHEMA.types.RecAB))
    .toMatchInlineSnapshot(`
    "value (aka. \`{"a":1}\`) does not conform to RecAB!

    Field 'b' is not optional but missing from value
    "
  `);
  expect(
    checkValueAgainstType({ a: 1, b: 'wrongFieldType' }, TEST_SCHEMA.types.RecAB)
  ).toMatchInlineSnapshot(`
    "value (aka. \`{"a":1,"b":"wrongFieldType"}\`) does not conform to RecAB!

    Expected Javascript type number, but got type string
    While checking value['b'] (aka. \`'wrongFieldType'\`) against type number
    "
  `);

  expect(
    checkValueAgainstType({ a: 1 }, TEST_SCHEMA.types.RecString)
  ).toMatchInlineSnapshot(`""`);

  expect(
    checkValueAgainstType({ a: 1 }, TEST_SCHEMA.types.MappedABOptional)
  ).toMatchInlineSnapshot(`""`);
});

test('IsoDatetime', () => {
  expect(
    checkValueAgainstType(
      { isoDatetime: '2022-01-21T20:47:27.104185Z' },
      TEST_SCHEMA.types.CommonTypes
    )
  ).toMatchInlineSnapshot(`""`);
});

test('interface', () => {
  // Passing.
  expect(
    checkValueAgainstType({ boolField: true }, TEST_SCHEMA.types.Interface)
  ).toMatchInlineSnapshot(`""`);
  expect(
    checkValueAgainstType(
      { boolField: true, extraFieldIsOk: true },
      TEST_SCHEMA.types.Interface
    )
  ).toMatchInlineSnapshot(`""`);
  expect(
    checkValueAgainstType(
      { boolField: true, optionalField: true },
      TEST_SCHEMA.types.Interface
    )
  ).toMatchInlineSnapshot(`""`);
  // Failing.
  expect(
    checkValueAgainstType(
      { boolField: true, optionalField: 'wrong-type' },
      TEST_SCHEMA.types.Interface
    )
  ).toMatchInlineSnapshot(`
    "value does not conform to Interface!

    Expected Javascript type boolean, but got type string
    While checking value['optionalField'] (aka. \`'wrong-type'\`) against type boolean
    While checking value against type Interface
    value = {
      "boolField": true,
      "optionalField": "wrong-type"
    }
    "
  `);
  expect(
    checkValueAgainstType({ boolField: 'wrong-type' }, TEST_SCHEMA.types.Interface)
  ).toMatchInlineSnapshot(`
    "value (aka. \`{"boolField":"wrong-type"}\`) does not conform to Interface!

    Expected Javascript type boolean, but got type string
    While checking value['boolField'] (aka. \`'wrong-type'\`) against type boolean
    "
  `);
});

test('union with kind', () => {
  // Passing.
  expect(
    checkValueAgainstType({ kind: 'a' }, TEST_SCHEMA.types.Union)
  ).toMatchInlineSnapshot(`""`);
  // Failing
  expect(checkValueAgainstType({ kind: 'wrong-kind' }, TEST_SCHEMA.types.Union))
    .toMatchInlineSnapshot(`
    "value (aka. \`{"kind":"wrong-kind"}\`) does not conform to Union!

    Expected field 'kind' to be one of ['a', 'b'], but got 'wrong-kind'
    "
  `);
  expect(checkValueAgainstType({ missingKindField: 1 }, TEST_SCHEMA.types.Union))
    .toMatchInlineSnapshot(`
    "value (aka. \`{"missingKindField":1}\`) does not conform to Union!

    Field 'kind' is missing from union
    "
  `);
  expect(checkValueAgainstType({ kind: 'b' }, TEST_SCHEMA.types.Union))
    .toMatchInlineSnapshot(`
    "value (aka. \`{"kind":"b"}\`) does not conform to Union!

    Field 'foo' is not optional but missing from value
    While checking value (aka. \`{"kind":"b"}\`) against type { kind: 'b'; foo: number }
    "
  `);
});

test('enum', () => {
  // Passing.
  expect(checkValueAgainstType('a', TEST_SCHEMA.types.Enum)).toMatchInlineSnapshot(
    `""`
  );
  expect(checkValueAgainstType('b', TEST_SCHEMA.types.Enum)).toMatchInlineSnapshot(
    `""`
  );
  // Failing.
  expect(checkValueAgainstType('wrong-enum-value', TEST_SCHEMA.types.Enum))
    .toMatchInlineSnapshot(`
    "value (aka. \`'wrong-enum-value'\`) does not conform to Enum!

    Expected one of ['a', 'b'], but got 'wrong-enum-value'
    "
  `);
  expect(checkValueAgainstType(null, TEST_SCHEMA.types.Enum)).toMatchInlineSnapshot(`
    "value (aka. \`null\`) does not conform to Enum!

    Expected Javascript type string, but got type object
    "
  `);
});

test('mixed-union', () => {
  // Passing.
  expect(
    checkValueAgainstType('a', TEST_SCHEMA.types.MixedUnion)
  ).toMatchInlineSnapshot(`""`);
  expect(
    checkValueAgainstType({ kind: 'a' }, TEST_SCHEMA.types.MixedUnion)
  ).toMatchInlineSnapshot(`""`);
  // Failing.
  expect(checkValueAgainstType('wrong-string', TEST_SCHEMA.types.MixedUnion))
    .toMatchInlineSnapshot(`
    "value (aka. \`'wrong-string'\`) does not conform to MixedUnion!

    No union member matches:
    - tried 1st union member, but got:
      Expected string literal 'a', but got 'wrong-string'
      While checking value (aka. \`'wrong-string'\`) against type 'a'
    - tried 2nd union member, but got:
      Expected Javascript type object, but got type string
      While checking value (aka. \`'wrong-string'\`) against type { kind: 'a' }
    "
  `);
  expect(checkValueAgainstType({ wrongObject: true }, TEST_SCHEMA.types.MixedUnion))
    .toMatchInlineSnapshot(`
    "value (aka. \`{"wrongObject":true}\`) does not conform to MixedUnion!

    No union member matches:
    - tried 1st union member, but got:
      Expected Javascript type string, but got type object
      While checking value (aka. \`{"wrongObject":true}\`) against type 'a'
    - tried 2nd union member, but got:
      Field 'kind' is not optional but missing from value
      While checking value (aka. \`{"wrongObject":true}\`) against type { kind: 'a' }
    "
  `);
});

test('array', () => {
  // Passing.
  expect(checkValueAgainstType([], TEST_SCHEMA.types.ArrayT)).toMatchInlineSnapshot(
    `""`
  );
  expect(
    checkValueAgainstType([1, 2, 3], TEST_SCHEMA.types.ArrayT)
  ).toMatchInlineSnapshot(`""`);
  // Failing.
  expect(checkValueAgainstType([1, 'b', 3], TEST_SCHEMA.types.ArrayT))
    .toMatchInlineSnapshot(`
    "value (aka. \`[1,"b",3]\`) does not conform to ArrayT!

    Expected Javascript type number, but got type string
    While checking value[1] (aka. \`'b'\`) against type number
    "
  `);
  expect(checkValueAgainstType({ 1: true }, TEST_SCHEMA.types.ArrayT))
    .toMatchInlineSnapshot(`
    "value (aka. \`{"1":true}\`) does not conform to ArrayT!

    Expected an array, but value is not an array
    "
  `);
});

test('array 2', () => {
  // Passing.
  expect(checkValueAgainstType([], TEST_SCHEMA.types.ArrayT)).toMatchInlineSnapshot(
    `""`
  );
  expect(
    checkValueAgainstType([1, 2, 3], TEST_SCHEMA.types.ArrayT)
  ).toMatchInlineSnapshot(`""`);
  // Failing.
  expect(checkValueAgainstType([1, 'b', 3], TEST_SCHEMA.types.ArrayT))
    .toMatchInlineSnapshot(`
    "value (aka. \`[1,"b",3]\`) does not conform to ArrayT!

    Expected Javascript type number, but got type string
    While checking value[1] (aka. \`'b'\`) against type number
    "
  `);
  expect(checkValueAgainstType({ 1: true }, TEST_SCHEMA.types.ArrayT))
    .toMatchInlineSnapshot(`
    "value (aka. \`{"1":true}\`) does not conform to ArrayT!

    Expected an array, but value is not an array
    "
  `);
});

test('null', () => {
  // Passing.
  expect(checkValueAgainstType(null, TEST_SCHEMA.types.Null)).toMatchInlineSnapshot(
    `""`
  );
  // Failing.
  expect(checkValueAgainstType(undefined, TEST_SCHEMA.types.Null))
    .toMatchInlineSnapshot(`
    "value (aka. \`undefined\`) does not conform to Null!

    Expected null value
    "
  `);
  expect(checkValueAgainstType(0, TEST_SCHEMA.types.Null)).toMatchInlineSnapshot(`
    "value (aka. \`0\`) does not conform to Null!

    Expected null value
    "
  `);
  expect(checkValueAgainstType({}, TEST_SCHEMA.types.Null)).toMatchInlineSnapshot(`
    "value (aka. \`{}\`) does not conform to Null!

    Expected null value
    "
  `);
});

test('undefined', () => {
  // Passing.
  expect(
    checkValueAgainstType(undefined, TEST_SCHEMA.types.Undef)
  ).toMatchInlineSnapshot(`""`);
  // Failing.
  expect(checkValueAgainstType(null, TEST_SCHEMA.types.Undef)).toMatchInlineSnapshot(`
    "value (aka. \`null\`) does not conform to Undef!

    Expected undefined value
    "
  `);
  expect(checkValueAgainstType(0, TEST_SCHEMA.types.Undef)).toMatchInlineSnapshot(`
    "value (aka. \`0\`) does not conform to Undef!

    Expected undefined value
    "
  `);
  expect(checkValueAgainstType({}, TEST_SCHEMA.types.Undef)).toMatchInlineSnapshot(`
    "value (aka. \`{}\`) does not conform to Undef!

    Expected undefined value
    "
  `);
});

test('reference types', () => {
  // Passing.
  expect(checkValueAgainstType('a', TEST_SCHEMA.types.RefT)).toMatchInlineSnapshot(
    `""`
  );
  // Failing.
  expect(checkValueAgainstType('b', TEST_SCHEMA.types.RefT)).toMatchInlineSnapshot(`
    "value (aka. \`'b'\`) does not conform to RefT!

    Expected string literal 'a', but got 'b'
    "
  `);
  expect(checkValueAgainstType(null, TEST_SCHEMA.types.RefT)).toMatchInlineSnapshot(`
    "value (aka. \`null\`) does not conform to RefT!

    Expected Javascript type string, but got type object
    "
  `);
});

test('number', () => {
  // Passing.
  expect(checkValueAgainstType(1, TEST_SCHEMA.types.NumberT)).toMatchInlineSnapshot(
    `""`
  );
  // Failing.
  expect(checkValueAgainstType('b', TEST_SCHEMA.types.NumberT))
    .toMatchInlineSnapshot(`
    "value (aka. \`'b'\`) does not conform to NumberT!

    Expected Javascript type number, but got type string
    "
  `);
});

test('string', () => {
  // Passing.
  expect(
    checkValueAgainstType('abc', TEST_SCHEMA.types.StringT)
  ).toMatchInlineSnapshot(`""`);
  // Failing.
  expect(checkValueAgainstType(1, TEST_SCHEMA.types.StringT)).toMatchInlineSnapshot(`
    "value (aka. \`1\`) does not conform to StringT!

    Expected Javascript type string, but got type number
    "
  `);
});

test('IsoDate', () => {
  // Passing.
  expect(
    checkValueAgainstType({ isoDate: '2022-01-10' }, TEST_SCHEMA.types.CommonTypes)
  ).toMatchInlineSnapshot(`""`);
  // Failing.
  expect(
    checkValueAgainstType({ isoDate: ' 2022-01-10' }, TEST_SCHEMA.types.CommonTypes)
  ).toMatchInlineSnapshot(`
    "value (aka. \`{"isoDate":" 2022-01-10"}\`) does not conform to CommonTypes!

    Expected YYYY-MM-DD. Got ' 2022-01-10' for IsoDate
    While checking value['isoDate'] (aka. \`' 2022-01-10'\`) against type IsoDate
    "
  `);
  expect(
    checkValueAgainstType({ isoDate: 'not a date' }, TEST_SCHEMA.types.CommonTypes)
  ).toMatchInlineSnapshot(`
    "value (aka. \`{"isoDate":"not a date"}\`) does not conform to CommonTypes!

    Expected YYYY-MM-DD. Got 'not a date' for IsoDate
    While checking value['isoDate'] (aka. \`'not a date'\`) against type IsoDate
    "
  `);
  expect(
    checkValueAgainstType({ isoDate: undefined }, TEST_SCHEMA.types.CommonTypes)
  ).toMatchInlineSnapshot(`""`);
});

test('inheritance', () => {
  // Passing.
  expect(
    checkValueAgainstType({ base: '', sub: '' }, TEST_SCHEMA.types.Sub)
  ).toMatchInlineSnapshot(`""`);
  // Failing.
  expect(checkValueAgainstType({ base: '' }, TEST_SCHEMA.types.Sub))
    .toMatchInlineSnapshot(`
    "value (aka. \`{"base":""}\`) does not conform to Sub!

    Field 'sub' is not optional but missing from value
    "
  `);
  expect(checkValueAgainstType({ sub: '' }, TEST_SCHEMA.types.Sub))
    .toMatchInlineSnapshot(`
    "value (aka. \`{"sub":""}\`) does not conform to Sub!

    Field 'base' is not optional but missing from value
    While checking value (aka. \`{"sub":""}\`) against type Base
    "
  `);
});

test('intersection', () => {
  // Passing.
  expect(
    checkValueAgainstType({ a: '', b: '' }, TEST_SCHEMA.types.And)
  ).toMatchInlineSnapshot(`""`);
  // Failing.
  expect(checkValueAgainstType({ a: '' }, TEST_SCHEMA.types.And))
    .toMatchInlineSnapshot(`
    "value (aka. \`{"a":""}\`) does not conform to And!

    Field 'b' is not optional but missing from value
    While checking value (aka. \`{"a":""}\`) against type B
    "
  `);
  expect(checkValueAgainstType({ b: '' }, TEST_SCHEMA.types.And))
    .toMatchInlineSnapshot(`
    "value (aka. \`{"b":""}\`) does not conform to And!

    Field 'a' is not optional but missing from value
    While checking value (aka. \`{"b":""}\`) against type A
    "
  `);
});

test('index signature', () => {
  // Passing.
  expect(
    checkValueAgainstType({ a: 1, b: 2 }, TEST_SCHEMA.types.IndexSignature)
  ).toMatchInlineSnapshot(`""`);
  expect(
    checkValueAgainstType({ }, TEST_SCHEMA.types.IndexSignature)
  ).toMatchInlineSnapshot(`""`);
  // Failing.
  expect(checkValueAgainstType({ a: 'wrong type' }, TEST_SCHEMA.types.IndexSignature)).
toMatchInlineSnapshot(`
"value (aka. \`{"a":"wrong type"}\`) does not conform to IndexSignature!

Expected Javascript type number, but got type string
While checking value['a'] (aka. \`'wrong type'\`) against type number
"
`);
  expect(checkValueAgainstType(undefined, TEST_SCHEMA.types.IndexSignature)).
toMatchInlineSnapshot(`
"value (aka. \`undefined\`) does not conform to IndexSignature!

Expected Javascript type object, but got type undefined
"
`);
  expect(checkValueAgainstType(3, TEST_SCHEMA.types.IndexSignature)).
toMatchInlineSnapshot(`
"value (aka. \`3\`) does not conform to IndexSignature!

Expected Javascript type object, but got type number
"
`);
  expect(checkValueAgainstType({ a: 1, b: 'wrong-type' }, TEST_SCHEMA.types.IndexSignature)).
toMatchInlineSnapshot(`
"value (aka. \`{"a":1,"b":"wrong-type"}\`) does not conform to IndexSignature!

Expected Javascript type number, but got type string
While checking value['b'] (aka. \`'wrong-type'\`) against type number
"
`);
});
