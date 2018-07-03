/**
 * Checks wether or not the given `value` is a timestamp, that is :
 * * It's a number and
 * * It's an integer and
 * * It's positive
 *
 * @param {string} value - The value to check.
 * @returns {boolean} `true` if it's a timestamp, `false` otherwise.
 */
function isTimestamp(value) {
  if (typeof value === 'boolean') return false;
  const convertedValue = Number(value);
  return !isNaN(convertedValue) && Number.isInteger(convertedValue) && convertedValue > 0;
};

module.exports = isTimestamp;
