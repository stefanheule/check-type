// Temporal related functions

import { Temporal } from '@js-temporal/polyfill';
import { TemporalPlainDateTime, TemporalPlainDate, TemporalPlainTime, TemporalPlainYearMonth, TemporalPlainMonthDay, TemporalZonedDateTime } from './types/common';

export function deserializeTemporalPlainDateTime(value: TemporalPlainDateTime): Temporal.PlainDateTime {
  return Temporal.PlainDateTime.from(value, {
    overflow: 'reject',
  });
}

export function validateTemporalPlainDateTime(value: string): string {
  try {
    const obj = deserializeTemporalPlainDateTime(value as TemporalPlainDateTime);
    const serialized = serializeTemporalPlainDateTime(obj);
    if (serialized !== value) {
      return `Invalid Temporal.PlainDateTime: value == ${value} !== ${serialized} == serialize(deserialize(value))`;
    }
    return '';
  } catch (e) {
    return `Invalid Temporal.PlainDateTime: ${e}`;
  }
}

export function serializeTemporalPlainDateTime(value: Temporal.PlainDateTime): TemporalPlainDateTime {
  return value.toString() as TemporalPlainDateTime;
}

export function deserializeTemporalPlainDate(value: TemporalPlainDate): Temporal.PlainDate {
  return Temporal.PlainDate.from(value, {
    overflow: 'reject',
  });
}

export function validateTemporalPlainDate(value: string): string {
  try {
    const obj = deserializeTemporalPlainDate(value as TemporalPlainDate);
    const serialized = serializeTemporalPlainDate(obj);
    if (serialized !== value) {
      return `Invalid Temporal.PlainDate: value == ${value} !== ${serialized} == serialize(deserialize(value))`;
    }
    return '';
  } catch (e) {
    return `Invalid Temporal.PlainDate: ${e}`;
  }
}

export function serializeTemporalPlainDate(value: Temporal.PlainDate): TemporalPlainDate {
  return value.toString() as TemporalPlainDate;
}

export function deserializeTemporalPlainTime(value: TemporalPlainTime): Temporal.PlainTime {
  return Temporal.PlainTime.from(value, {
    overflow: 'reject',
  });
}

export function validateTemporalPlainTime(value: string): string {
  try {
    const obj = deserializeTemporalPlainTime(value as TemporalPlainTime);
    const serialized = serializeTemporalPlainTime(obj);
    if (serialized !== value) {
      return `Invalid Temporal.PlainTime: value == ${value} !== ${serialized} == serialize(deserialize(value))`;
    }
    return '';
  } catch (e) {
    return `Invalid Temporal.PlainTime: ${e}`;
  }
}

export function serializeTemporalPlainTime(value: Temporal.PlainTime): TemporalPlainTime {
  return value.toString() as TemporalPlainTime;
}

export function deserializeTemporalPlainYearMonth(value: TemporalPlainYearMonth): Temporal.PlainYearMonth {
  return Temporal.PlainYearMonth.from(value, {
    overflow: 'reject',
  });
}

export function validateTemporalPlainYearMonth(value: string): string {
  try {
    const obj = deserializeTemporalPlainYearMonth(value as TemporalPlainYearMonth);
    const serialized = serializeTemporalPlainYearMonth(obj);
    if (serialized !== value) {
      return `Invalid Temporal.PlainYearMonth: value == ${value} !== ${serialized} == serialize(deserialize(value))`;
    }
    return '';
  } catch (e) {
    return `Invalid Temporal.PlainYearMonth: ${e}`;
  }
}

export function serializeTemporalPlainYearMonth(value: Temporal.PlainYearMonth): TemporalPlainYearMonth {
  return value.toString() as TemporalPlainYearMonth;
}

export function deserializeTemporalPlainMonthDay(value: TemporalPlainMonthDay): Temporal.PlainMonthDay {
  return Temporal.PlainMonthDay.from(value, {
    overflow: 'reject',
  });
}

export function validateTemporalPlainMonthDay(value: string): string {
  try {
    const obj = deserializeTemporalPlainMonthDay(value as TemporalPlainMonthDay);
    const serialized = serializeTemporalPlainMonthDay(obj);
    if (serialized !== value) {
      return `Invalid Temporal.PlainMonthDay: value == ${value} !== ${serialized} == serialize(deserialize(value))`;
    }
    return '';
  } catch (e) {
    return `Invalid Temporal.PlainMonthDay: ${e}`;
  }
}

export function serializeTemporalPlainMonthDay(value: Temporal.PlainMonthDay): TemporalPlainMonthDay {
  return value.toString() as TemporalPlainMonthDay;
}

export function deserializeTemporalZonedDateTime(value: TemporalZonedDateTime): Temporal.ZonedDateTime {
  return Temporal.ZonedDateTime.from(value, {
    overflow: 'reject',
  });
}

export function validateTemporalZonedDateTime(value: string): string {
  try {
    const obj = deserializeTemporalZonedDateTime(value as TemporalZonedDateTime);
    const serialized = serializeTemporalZonedDateTime(obj);
    if (serialized !== value) {
      return `Invalid Temporal.ZonedDateTime: value == ${value} !== ${serialized} == serialize(deserialize(value))`;
    }
    return '';
  } catch (e) {
    return `Invalid Temporal.ZonedDateTime: ${e}`;
  }
}

export function serializeTemporalZonedDateTime(value: Temporal.ZonedDateTime): TemporalZonedDateTime {
  return value.toString() as TemporalZonedDateTime;
}
