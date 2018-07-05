const { expect } = require('chai');

const isFreshTimestamp = require('../lib/is-fresh-timestamp');

describe('isFreshTimestamp()', function() {
  it('is a function', function() {
    expect(isFreshTimestamp).to.be.a('function');
  });
  it('raises an error if the first argument is invalid', function() {
    expect(() => isFreshTimestamp('invalidvalue')).to.throw(TypeError, "The timestamp parameter should be an integer ; 'invalidvalue' (string) given.");
  });
  it('raises an error if the second argument is invalid', function() {
    const invalidValues = [
      { value: 'foo', type: 'string' },
      { value: 12.5, type: 'number' },
      { value: -15.5, type: 'number' },
      { value: -300, type: 'number' }
    ];
    invalidValues.forEach(item => {
      expect(() => isFreshTimestamp(1530602959, item.value)).to.throw(TypeError, `The lifetime parameter must be an integer ; '${item.value}' (${item.type}) given.`);
    });
  });
  it('returns false if the timestamp is not fresh', function() {
    // Timestamp for the 2th of July 2018
    expect(isFreshTimestamp(1530518280)).to.equals(false);
    // Timestamp for 15 minutes ago
    const timestamp = Math.round(Date.now() / 1000) - 15 * 60;
    // With a lifetime of 12 minutes
    expect(isFreshTimestamp(timestamp, 12 * 60)).to.equals(false);
  });
  it('returns true if the timestamp is fresh', function() {
    let freshTimestamp = Math.round(Date.now() / 1000);
    expect(isFreshTimestamp(freshTimestamp)).to.equals(true);
    // Timestramp for 12 minutes ago
    freshTimestamp = freshTimestamp - 12 * 60;
    // With a lifetime of 15 minutes
    expect(isFreshTimestamp(freshTimestamp, 15 * 60)).to.equals(true);
  });
});