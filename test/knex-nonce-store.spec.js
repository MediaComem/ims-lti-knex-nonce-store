const { expect } = require('chai');
const KnexNonceStore = require('../lib/knex-nonce-store.class');

describe('KnexNonceStore', function() {
  let knex, tableName;
  it('is a function', function() {
    expect(KnexNonceStore).to.be.a('function');
  });
  it('raises an error if the first constructor parameter is invalid', function() {
    const invalidValues = [
      { value: undefined, type: 'undefined' },
      { value: null, type: 'object' },
      { value: 'text', type: 'string' },
      { value: 0, type: 'number' },
      { value: true, type: 'boolean' },
      { value: false, type: 'boolean' },
      { value: [], type: 'object' },
      { value: {}, type: 'object' }
    ];
    invalidValues.forEach(item => {
      expect(() => new KnexNonceStore(item.value)).to.throw(TypeError, `The knex argument must be a function ; ${item.type} given.`);
    });
  });
  beforeEach(function() {
    knex = function() { };
  });
  it('raises an error if the second constructor parameter is invalid', function() {
    const invalidValues = [
      { value: 0, type: 'number' },
      { value: [], type: 'object' },
      { value: {}, type: 'object' },
      { value: () => { }, type: 'function' }
    ];
    invalidValues.forEach(item => {
      expect(() => new KnexNonceStore(knex, item.value)).to.throw(TypeError, `The tableName argument must be a string ; ${item.type} given.`);
    });
  });
  beforeEach(function() {
    tableName = "custom_table_name";
  });
  it('raises an error if the third constructor parameter is invalid', function() {
    const invalidValues = [
      { value: function() { }, type: 'function' },
      { value: [], type: 'object' },
      { value: {}, type: 'object' },
      { value: 'value', type: 'string' },
      { value: 15.5, type: 'number' },
      { value: -150, type: 'number' },
    ];
    invalidValues.forEach(item => {
      expect(() => new KnexNonceStore(knex, tableName, item.value)).to.throw(TypeError, `The expireIn argument must be a positive integer ; ${item.value} (${item.type}) given.`);
    });
  });
  it('creates an object with correct methods and default properties', function() {
    const expectedKeys = ['isNew', 'setUsed', 'tableName', 'knex', 'expireIn'];
    const knexNonceStore = new KnexNonceStore(knex);
    expect(knexNonceStore).to.be.an.instanceOf(KnexNonceStore).that.include.all.keys(expectedKeys);
    expect(knexNonceStore.knex).to.eql(knex);
    expect(knexNonceStore.expireIn).to.equals(300);
    expect(knexNonceStore.tableName).to.equals('nonce_store');
    expect(knexNonceStore.isNew).to.be.a('function');
    expect(knexNonceStore.setUsed).to.be.a('function');
  });
  it('creates an object with correct methods and custom properties', function() {
    const knexNonceStore = new KnexNonceStore(knex, tableName, 15 * 60);
    expect(knexNonceStore.expireIn).to.equals(15 * 60);
    expect(knexNonceStore.tableName).to.equals('custom_table_name');
  });

  describe('isNew method', function() {
    it('raises an error if the first parameter is invalid');
    it('raises an error if the second parameter is invalid');
    it('raises an error if the third parameter is invalid');
    it('invokes the callback with an error if the timestamp is too old');
    it('invokes the callback with an error if the nonce has already been used');
    it('invokes the callback with an error when an unexpeted error appears');
    it('invokes the callback with success parameters if the nonce is new');
  });

  describe('setUsed method', function() {
    it('raises an error if the first parameter is invalid');
    it('raises an error if the second parameter is invalid');
    it('raises an error if the third parameter is invalid');

  });
})