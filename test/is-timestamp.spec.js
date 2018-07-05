const { expect } = require('chai');
const isTimestamp = require('../lib/is-timestamp');

describe('isTimestamp()', function() {
  it('is a function', function() {
    expect(isTimestamp).to.be.a('function');
  });
  it('returns false for an invalid value', function() {
    const invalidValues = [
      undefined,
      null,
      '',
      'value',
      '12.5',
      12.5,
      -1530602302,
      true,
      false
    ]
    invalidValues.forEach(value => {
      expect(isTimestamp(value), `tested value: ${value}`).to.equals(false);
    });
  });
  it('returns true for a valid value', function() {
    const validValues = [
      '1530602959',
      1530602959,
      '1',
      1
    ]
    validValues.forEach(value => {
      expect(isTimestamp(value), `tested value: ${value}`).to.equals(true);
    });
  });
});