
# @check-type: Generate TypeScript functions that check that a runtime value conforms to a given TypeScript type

This library automatically generates TypeScript functions for a given TypeScript type,
which can dynamically check if a particular value conforms to that type. This is useful whenever you pass values across program boundaries, e.g. through a REST API, retrieving a value from a database or reading a file from disk.

For example, consider this type:

```TypeScript
// @check-type
export type Person = {
  name: string;
  age: number;
}
```

We can run the code generator using `yarn generate-schema --config '[{"root":"./src"}]'`, which generates a function `assertPerson: (value: unknown) => Person`[^1] that takes any value and either validates that the value conforms to `Person` (and returns that value fully typed), or throws an exception describing why the value is not conforming to `Person`.

For instance, here are some examples:

```TypeScript
const person = { name: "Peter"; age: 22 }
const notAPerson = { name: "Marry" }

assertPerson(person) // returns person (but typed now as Person)
assertPerson(notAPerson) // throws an exception, which the following message:
/*
value (aka. `{"person":"Peter"}`) does not conform to Person!
Field 'age' is not optional but missing from value
*/
```





[^1]: Technically, the `value` argument has type `NotPromise<T>` which is defined as `type NotPromise<T> = T extends Promise<unknown> ? never : T;`. This helps prevent accidentally passing an unresolved promise to the assertion functions, which is basically never right.