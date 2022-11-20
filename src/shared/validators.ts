// Defines validators, parsing and formatting functions for common types.
//
// For a given type of value X (e.g. PhoneNumber), we generally have:
// (1) A format (or formats) expected from the users when entering this value,
//     e.g. ###-###-####.
// (2) A format we use to show to the user. This is always one of the formats
//     from (1). We call this the canonical form.
//     We call this format UserX.
// (3) A format we use to store the value (and typed as X), e.g. +1##########.
//
// We define functions on these formats/types:
// - parseUserX parses a string with format (1) into type X, or throw an exception if
//   the input doesn't conform to (1). Use validateUserX to check against (1).
// - deparseUserX takes a value of type X and returns a string with format (2).
// - validateUserX checks against (1) and returns a readable error if the given string
//   does not conform to (1).
// - assertX checks a string against (3) and either returns X, or throws an exception.
//   (this function is automatically generated, and the implementation of the check can
//   be found in checkSpecialStringType of frontend/shared/check-type.ts).
//
// Some special cases:
// - If (1) and (2) are the same (e.g. PhoneNumber): Don't define a deparseUserX, as it
//   would be the identity.
// - If (2) and (3) are the same (e.g. TrimmedString, Email): Don't use *User* in
//   function names, and don't define deparseUserX, since it would be the identity.
// - If (1), (2), and (3) are the same (e.g. SocialSecurityNumber, PostalCode): Same previous case.
// Note: For TrimmedString/Email, (1) is not the same as (2) because we allow extra
// whitespace in (1), but not (2)/(3).
//
// NOTE: To avoid circular dependencies, all parse functions are placed in validators2.ts.

import { assert } from 'chai';
import * as datefns from 'date-fns';
import { validate as isEmailValid } from 'email-validator';
import { IsoDate, PhoneNumber, IsoDatetime } from './types/common';

export function nonEmptyValidator(name: string): (value: string) => string {
  return (s: string) => {
    s = s.trim();
    if (s == '') return `${name} is required.`;
    return '';
  };
}

// --- SocialSecurityNumber

export function validateSocialSecurityNumber(value: string): string {
  value = value.trim();
  if (!/^[0-9]{3}-[0-9]{2}-[0-9]{4}$/.test(value))
    return 'SSN must use ###-##-#### format.';
  return '';
}

// --- PhoneNumber

export function validateUserPhoneNumber(value: string): string {
  value = value.trim();
  if (!/^[0-9]{3}-[0-9]{3}-[0-9]{4}$/.test(value))
    return 'Phone number must use ###-###-#### format.';
  return '';
}

export function validatePhoneNumber(value: string): string {
  value = value.trim();
  if (!/^\+1[0-9]{10}$/.test(value))
    return 'Phone numbers must use +1########## format.';
  return '';
}

export function deparseUserPhoneNumber(value: PhoneNumber): string {
  const usNumber = value.substring(2);
  return (
    usNumber.substring(0, 3) +
    '-' +
    usNumber.substring(3, 6) +
    '-' +
    usNumber.substring(6)
  );
}

// --- PostalCode

export function validatePostalCode(value: string): string {
  value = value.trim();
  if (!/^[0-9]{5}-[0-9]{4}$/.test(value) && !/^[0-9]{5}$/.test(value))
    return 'Postal code must use ##### or #####-#### format.';
  return '';
}

// --- TrimmedString

export function validateTrimmedString(value: string): string {
  value = value.trim();
  if (value === '') return 'Cannot be empty.';
  if (value.length > 100) return 'Enter at most 100 characters.';
  return '';
}

// --- DollarAmount

export function validateDollarAmount(value: string): string {
  value = value.trim();

  const numberResult = validateNumericString(value);
  if (numberResult !== '') {
    return numberResult;
  }
  if (value.includes('.')) {
    const [_, afterDot] = value.split('.');
    if (afterDot.length > 2) return 'Use at most 2 decimal places.';
  }
  if (value.includes('-')) {
    return 'Enter a positive number.';
  }
  return '';
}

// --- NumericString

export function validateNumericString(value: string): string {
  value = value.trim();

  if (
    !(
      // 0
      (
        value == '0' ||
        // integer
        /^-?[1-9][0-9]*$/.test(value) ||
        // decimal number
        /^-?[0-9]+.[0-9]+$/.test(value)
      )
    )
  ) {
    return "Must be a valid number, e.g. '1.24'.";
  }
  return '';
}

// --- Email

export function validateEmail(value: string): string {
  value = value.trim();
  if (value == '') return 'Email is required.';
  // TODO: does this validator match the one used by Auth0?
  if (!isEmailValid(value)) return 'Email is malformed.';
  return '';
}

// --- Password

export function validatePassword(value: string): string {
  // This matches the auth0 policy.
  if (value.length < 8) return 'Password must be at least 8 characters long.';
  if (!/[a-z]/.test(value))
    return 'Password must contain lower case characters.';
  if (!/[A-Z]/.test(value))
    return 'Password must contain upper case characters.';
  if (!/[0-9]/.test(value)) return 'Password must contain numbers.';
  return '';
}

export function validatePin(value: string): string {
  if (!/^[0-9][0-9][0-9][0-9]$/.test(value)) return 'Pin must be 4 numbers';
  return '';
}

// --- Dates

// Our app uses MM/DD/YYYY format for dates in input boxes. When parsing
// user input, we are a bit more forgiving and also accept M/D/YYYY and
// YYYY-MM-DD, since there is no ambiguity.

export const AMERICAN_DATE_DATEFNS_FORMAT = 'M/d/yyyy';
export const ISO_DATE_DATEFNS_FORMAT = 'yyyy-MM-dd';

function parseDateHelper(value: string): Date | undefined {
  const tryFormat = (format: string) => {
    const date = datefns.parse(value, format, new Date());
    return datefns.isValid(date) ? date : undefined;
  };
  return (
    tryFormat(AMERICAN_DATE_DATEFNS_FORMAT) ||
    tryFormat(ISO_DATE_DATEFNS_FORMAT)
  );
}

export function parseUserIsoDate(value: string): IsoDate {
  const result = parseDateHelper(value);
  if (result === undefined) {
    throw new Error(`Value is not a UserIsoDate: '${value}'`);
  }
  return dateToIsoDate(result);
}

export function deparseIsoDate(value: IsoDate): string {
  return datefns.format(isoDateToDate(value), AMERICAN_DATE_DATEFNS_FORMAT);
}

export function deparseDate(value: Date): string {
  return datefns.format(value, AMERICAN_DATE_DATEFNS_FORMAT);
}

export function validateUserIsoDate(
  value: string,
  options?: {
    restriction?: 'past' | 'past-or-today' | 'future' | 'future-or-today';
  }
): string {
  const date = parseDateHelper(value);
  if (date === undefined) return 'Date must use MM/DD/YYYY format.';
  const isToday = datefns.isToday(date);
  const isFuture = datefns.isFuture(date);
  const isPast = datefns.isPast(date);
  switch (options?.restriction) {
    case undefined:
      break;
    case 'past':
      if (!isPast) return 'Date must be in the past.';
      break;
    case 'past-or-today':
      if (!isPast && !isToday) return 'Date must be today or in the past.';
      break;
    case 'future':
      if (!isFuture) return 'Date must be in the future.';
      break;
    case 'future-or-today':
      if (!isFuture && !isToday) return 'Date must be today or in the future.';
      break;
  }
  return '';
}

export function dateToIsoDate(value: Date): IsoDate {
  return datefns.format(value, ISO_DATE_DATEFNS_FORMAT) as IsoDate;
}

export function isoDateToDate(value: IsoDate): Date {
  const result = datefns.parse(value, ISO_DATE_DATEFNS_FORMAT, new Date());
  assert.isTrue(datefns.isValid(result));
  return result;
}

export function isoDatetimeToDate(value: IsoDatetime): Date {
  const result = datefns.parseISO(value);
  assert.isTrue(datefns.isValid(result));
  return result;
}

export function dateToIsoDatetime(value: Date): IsoDatetime {
  return datefns.formatISO(value) as IsoDatetime;
}

export function deparseIsoDatetime(value: IsoDatetime) {
  return datefns.format(
    isoDatetimeToDate(value),
    `${ISO_DATE_DATEFNS_FORMAT} HH:mm`
  );
}

export function deparseUserIsoDatetime(value: IsoDatetime) {
  const date = isoDatetimeToDate(value);
  return `${datefns.format(
    date,
    `${AMERICAN_DATE_DATEFNS_FORMAT}`
    /* cspell:disable-next-line */
  )} at ${datefns.format(date, `K:mmbbb`)}`;
}

export function validateIsoDate(value: string): string {
  const date = datefns.parse(value, ISO_DATE_DATEFNS_FORMAT, new Date());
  if (!datefns.isValid(date)) {
    return `Expected YYYY-MM-DD.`;
  }
  return '';
}

export function validateIsoDatetime(value: string): string {
  const date = datefns.parseISO(value);
  if (
    !datefns.isValid(date) ||
    // While YYYY-MM-DD is technically a valid ISO date, we want to reject it,
    // to detect accidental usage of IsoDatetime instead of IsoDate.
    /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value)
  ) {
    return `Expected a date and time of format 2021-12-05T18:44:38Z.`;
  }
  return '';
}

//  --- Uuid

export function validateUuid(value: string): string {
  if (
    !/^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/.test(
      value
    )
  ) {
    return `Expected a UUID like '123e4567-e89b-12d3-a456-426614174000'.`;
  }
  return '';
}
