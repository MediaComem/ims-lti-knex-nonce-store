const isTimestamp = require('./is-timestamp');

/**
 * Checks that the given timestamp value is still "fresh".
 * A fresh timestamp is one that represents a date that is not to distant from the current moment.
 * By default, the timestamp shouldn't be older than 90 minutes (as [recommended by the LTI 1.1 spec]{@link https://www.imsglobal.org/specs/ltiv1p1p1/implementation-guide#toc-4}), but you can change this by passing
 * a positive number of secondes as the lifetime parameter's value.
 *
 * @param {number} timestamp - A UNIX timestamp.
 * @param {number} [lifetime=90*60] - The number of seconds during which the timestamp is valid.
 * @returns {boolean} Wether or not the timestamp is still fresh.
 * @throws {TypeError} When the `timestamp` parameter is not a valid timestamp.
 * @throws {TypeError} When the `lifetime` parameter is present but not a positive integer.
 */
function isFreshTimestamp(timestamp, lifetime = 90 * 60) {
  if (!isTimestamp(timestamp)) {
    throw new TypeError(`The timestamp parameter should be an integer ; '${timestamp}' (${typeof timestamp}) given.`)
  }
  if (lifetime && (!Number.isInteger(lifetime) || lifetime <= 0)) {
    throw new TypeError(`The lifetime parameter must be an integer ; '${lifetime}' (${typeof lifetime}) given.`)
  }
  const currentTime = Math.round(Date.now() / 1000);
  return (currentTime - parseInt(timestamp, 10)) <= lifetime;
};

module.exports = isFreshTimestamp;
