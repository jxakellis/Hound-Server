/**
 * Takes single object or array of objects. If ALL objects provided are defined, returns true. Otherwise, returns false. Behaves the same as atLeastOneDefined for single object.
 */
function areAllDefined(...args) {
  // make sure ...args is an array, which it should be
  if (Array.isArray(args) === false) {
    return undefined;
  }
  // checks to see all objects in array are defined
  for (let i = 0; i < args.length; i += 1) {
    if (typeof args[i] === 'undefined') {
      // single object in array is undefined so return false
      return false;
    }
  }
  // all items are defined
  return true;
}

/**
   * Take single object or array of objects. If at least one object provided is defined, returns true. Otherwise, returns false. Behaves the same as areAllDefined for single object.
   */
function atLeastOneDefined(...args) {
  // make sure ...args is an array, which it should be
  if (Array.isArray(args) === false) {
    return undefined;
  }

  // checks to see if at least one object in array is defined

  for (let i = 0; i < args.length; i += 1) {
    if (typeof args[i] !== 'undefined') {
      // Single object in array is defined, so atLeastOneDefined in args, therefore return true
      return true;
    }
  }

  // everything in the array was undefined (or the array was empty), return false
  return false;
}

module.exports = {
  areAllDefined, atLeastOneDefined,
};
