/**
 * Utility functions to ensure type safety and apply specific formatting based on the type of input.
 */

import type { StringKeyDict } from '../types/StringKeyDict.js';

// RFC 5322 compliant regex for email validation
// eslint-disable-next-line max-len, no-control-regex
const emailRegex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;

const maximumEmailLengthWithAngleBrackets = 256;
const maximumEmailLengthWithoutAngleBrackets = 254;
const minimumEmailLength = 6;
const minimumUsernameLength = 1;
const maximumUsernameLength = 64;

/**
 * Validates if the input is a string and optionally truncates to a maximum length.
 *
 * @param string - The input string.
 * @param maximumLength - Optional maximum length for the string.
 * @returns The string if valid, truncated if necessary, undefined otherwise.
 */
function formatUnknownString(string?: unknown, maximumLength?: number): string | undefined {
  if (string === undefined || string === null) {
    return undefined;
  }

  if (typeof string !== 'string') {
    return undefined;
  }

  if (maximumLength !== undefined && !Number.isNaN(maximumLength)) {
    return string.substring(0, maximumLength);
  }

  return string;
}

function formatKnownString(string: string, maximumLength?: number): string {
  if (maximumLength !== undefined && !Number.isNaN(maximumLength)) {
    return string.substring(0, maximumLength);
  }

  return string;
}

/**
 * Validates if the input is an array.
 *
 * @param array - The input value.
 * @returns The array if valid, undefined otherwise.
 */
function formatArray(array?: unknown): unknown[] | undefined {
  if (array === undefined || array === null) {
    return undefined;
  }

  if (!Array.isArray(array)) {
    return undefined;
  }

  return array;
}

/**
 * Validates and formats a given email string.
 *
 * @param email - The email string to format.
 * @returns Formatted email if valid, undefined otherwise.
 */
function formatEmail(email?: string): string | undefined {
  if (email === undefined || email === null) {
    return undefined;
  }

  let userEmail = formatUnknownString(email, maximumEmailLengthWithAngleBrackets);

  if (userEmail === undefined || userEmail == null) {
    return undefined;
  }

  userEmail = userEmail.replace('mailto:', '').replace('<', '').replace('>', '');

  if (userEmail.length < minimumEmailLength || userEmail.length > maximumEmailLengthWithoutAngleBrackets) {
    return undefined;
  }

  if (!emailRegex.test(userEmail)) {
    return undefined;
  }

  const emailParts = userEmail.split('@');
  if (emailParts.length !== 2) {
    return undefined;
  }

  const username = emailParts[0];
  if (username.length < minimumUsernameLength || username.length > maximumUsernameLength) {
    return undefined;
  }

  return userEmail.toLowerCase();
}

/**
 * Validates and returns a Date object from a given string or number.
 *
 * @param forDate - The input date value.
 * @returns Date object if valid, undefined otherwise.
 */
function formatDate(forDate?: unknown): Date | undefined {
  if (forDate === undefined || forDate === null) {
    return undefined;
  }

  let date: Date;
  if (typeof forDate === 'string' || typeof forDate === 'number') {
    date = new Date(forDate);
  }
  else if (forDate instanceof Date) {
    date = forDate;
  }
  else {
    return undefined;
  }

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date;
}

/**
 * Converts the provided input to a boolean.
 *
 * @param boolean - The input value.
 * @returns Boolean value if valid, undefined otherwise.
 */
function formatBoolean(boolean?: unknown): boolean | undefined {
  if (boolean === undefined || boolean === null) {
    return undefined;
  }

  if (typeof boolean === 'boolean') {
    return boolean;
  }

  switch (boolean) {
    case 'true':
    case 1:
    case '1':
    case 'yes':
      return true;
    case 'false':
    case 0:
    case '0':
    case 'no':
      return false;
    default:
      return undefined;
  }
}

/**
 * Converts the provided input to a number.
 *
 * @param forNumber - The input value.
 * @returns Number if valid, undefined otherwise.
 */
function formatNumber(forNumber?: unknown): number | undefined {
  if (forNumber === undefined || forNumber === null) {
    return undefined;
  }

  const trueValues = new Set(['true', 'True', 'TRUE', '1', 'yes', 'Yes', 'YES']);
  const falseValues = new Set(['false', 'False', 'FALSE', '0', 'no', 'No', 'NO']);

  if (forNumber === true || trueValues.has(String(forNumber))) {
    return 1;
  }

  if (forNumber === false || falseValues.has(String(forNumber))) {
    return 0;
  }

  const number = Number(forNumber);

  if (!Number.isFinite(number)) {
    return undefined;
  }

  return number;
}

/**
 * Validates and formats a Base64 encoded string.
 *
 * @param forString - The input Base64 string.
 * @returns Formatted Base64 string if valid, undefined otherwise.
 */
function formatBase64EncodedString(forString?: unknown): string | undefined {
  if (forString === undefined || forString === null) {
    return undefined;
  }

  const string = formatUnknownString(forString);

  if (string === undefined || string === null) {
    return undefined;
  }

  const regex = /^(?:[A-Za-z\d+/]{4})*(?:[A-Za-z\d+/]{3}=|[A-Za-z\d+/]{2}==)?$/;
  if (!regex.test(string)) {
    return undefined;
  }

  return string;
}

/**
 * Validates if the input is a string:unknown dictionary.
 *
 * @param dict - The input value.
 * @returns The dict if valid, undefined otherwise.
 */
function formatDict(dict?: unknown): StringKeyDict | undefined {
  if (dict === undefined || dict === null) {
    return undefined;
  }

  if (typeof dict === 'object'
    && !Array.isArray(dict)
    && Object.getPrototypeOf(dict) === Object.prototype
  ) {
    return dict as StringKeyDict;
  }
  return undefined;
}

export {
  formatUnknownString,
  formatKnownString,
  formatArray,
  formatEmail,
  formatDate,
  formatBoolean,
  formatNumber,
  formatBase64EncodedString,
  formatDict,
};
