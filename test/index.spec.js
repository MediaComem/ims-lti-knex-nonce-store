const lib = require('../index');
const { expect } = require('chai');

describe('Library endpoint', function() {
  it('should be an object', function() {
    expect(lib).to.be.an('Object');
  });
  it('should have the correct properties, of the correct types', function() {
    const keys = ['KnexNonceStore', 'isFreshTimestamp', 'isTimestamp'];
    expect(lib).to.have.all.keys(keys);
    expect(lib.KnexNonceStore).to.be.a('function');
    expect(lib.isFreshTimestamp).to.be.a('function');
    expect(lib.isTimestamp).to.be.a('function');
  });
});