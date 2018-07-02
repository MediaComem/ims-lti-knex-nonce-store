/**
 * Checks wether or not the given `value` is a timestamp, that is :
 * * It's a number
 * * It's an integer
 * * It's positive
 *
 * @param {string} value - The value to check.
 * @returns {boolean} `true` if it's a timestamp, `false` otherwise.
 */
function isTimestamp(value) {
  const convertedValue = Number(value);
  return !isNaN(convertedValue) && Number.isInteger(convertedValue) && convertedValue > 0;
};

module.exports = isTimestamp;
