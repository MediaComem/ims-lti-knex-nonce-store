const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinonChai = require('sinon-chai');
const knex = require('knex');
const { match, spy } = require('sinon');

const KnexNonceStore = require('../lib/knex-nonce-store.class');
const { TimestampError, NonceError } = require('../lib/errors');
const config = require('../config/test.env');

chai.use(chaiAsPromised);
chai.use(sinonChai);
const expect = chai.expect;

describe('KnexNonceStore', function() {

  let db = function() { },
    tableName = 'custom_table_name',
    knexNonceStore;

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

  it('raises an error if the second constructor parameter is invalid', function() {
    const invalidValues = [
      { value: 0, type: 'number' },
      { value: [], type: 'object' },
      { value: {}, type: 'object' },
      { value: () => { }, type: 'function' }
    ];
    invalidValues.forEach(item => {
      expect(() => new KnexNonceStore(db, item.value)).to.throw(TypeError, `The tableName argument must be a string ; ${item.type} given.`);
    });
  });

  it('raises an error if the third constructor parameter is invalid', function() {
    const invalidValues = [
      { value: function() { }, type: 'function' },
      { value: [], type: 'object' },
      { value: {}, type: 'object' },
      { value: 'value', type: 'string' },
      { value: -150, type: 'number' },
    ];
    invalidValues.forEach(item => {
      expect(() => new KnexNonceStore(db, tableName, item.value), String(item.value)).to.throw(TypeError, `The expireIn argument must be a positive number ; '${item.value}' (${item.type}) given.`);
    });
  });

  it('raises an error if the fourth constructor parameter is invalid', function() {
    const invalidValues = [
      { value: function() { }, type: 'function' },
      { value: [], type: 'object' },
      { value: {}, type: 'object' },
      { value: 'value', type: 'string' },
      { value: -150, type: 'number' },
    ];
    invalidValues.forEach(item => {
      expect(() => new KnexNonceStore(db, tableName, 300, item.value), String(item.value)).to.throw(TypeError, `The lifetime argument must be a positive number ; '${item.value}' (${item.type}) given.`);
    });
  });

  it('creates an object with correct methods and default properties', function() {
    const expectedKeys = ['isNew', 'setUsed', 'tableName', 'knex', 'expireIn', 'lifetime'];
    const knexNonceStore = new KnexNonceStore(db);
    expect(knexNonceStore).to.be.an.instanceOf(KnexNonceStore).that.have.all.keys(expectedKeys);
    expect(knexNonceStore.knex).to.eql(db);
    expect(knexNonceStore.expireIn).to.equals(300);
    expect(knexNonceStore.lifetime).to.equals(300);
    expect(knexNonceStore.tableName).to.equals('nonce_store');
    expect(knexNonceStore.isNew).to.be.a('function');
    expect(knexNonceStore.setUsed).to.be.a('function');
  });

  it('creates an object with correct methods and custom properties', function() {
    const knexNonceStore = new KnexNonceStore(db, tableName, 15 * 60, 2 * 60);
    expect(knexNonceStore.expireIn).to.equals(900);
    expect(knexNonceStore.lifetime).to.equals(120);
    expect(knexNonceStore.tableName).to.equals('custom_table_name');
  });

  describe('methods:', function() {

    before(async function() {
      db = knex(config.db);
      await db.migrate.latest();
    });

    after(async function() {
      await db.migrate.rollback();
    });

    beforeEach(async function() {
      knexNonceStore = new KnexNonceStore(db);
      await db(knexNonceStore.tableName).del();
    });

    describe('isNew()', function() {

      it('raises an error if the first parameter is invalid', function() {
        const invalidValues = [
          { value: undefined, type: 'undefined' },
          { value: null, type: 'object' },
          { value: [], type: 'object' },
          { value: {}, type: 'object' },
          { value: 42, type: 'number' },
          { value: () => { }, type: 'function' }
        ];
        invalidValues.forEach(async item => {
          await expect(knexNonceStore.isNew(item.value)).to.eventually.be.rejectedWith(TypeError, `The nonce argument must be a string ; ${item.type} given.`);
        });
      });

      it('raises an error if the second parameter is invalid', async function() {
        const nonce = 'wef5oihwef5wef8ur8g';
        await expect(knexNonceStore.isNew(nonce, 'not_a_timestamp')).to.eventually.be.rejectedWith(TypeError, "The timestamp argument must be a valid timestramp ; 'not_a_timestamp' (string) given.");
      });

      it('raises an error if the third parameter is invalid', async function() {
        const nonce = 'wef5oihwef5wef8ur8g';
        const timestamp = Math.round(Date.now() / 1000);
        const invalidValues = [
          { value: null, type: 'object' },
          { value: 7, type: 'number' },
          { value: 'not_a_function', type: 'string' },
          { value: true, type: 'boolean' }
        ];
        invalidValues.forEach(async item => {
          await expect(knexNonceStore.isNew(nonce, timestamp, item.value)).to.eventually.be.rejectedWith(TypeError, `The next argument must be a function, accepting two parameters ; ${item.type} given.`)
        })
        await expect(knexNonceStore.isNew(nonce, timestamp, () => { })).to.eventually.be.rejectedWith(TypeError, 'The next callback must accept two parameters ; currently accepts 0 parameters.');
      });

      describe('with valid arguments', function() {

        let newNonce, timestamp, nonce, usedTimestamp, oldTimestamp, nextSpy;

        before(function() {
          timestamp = Math.round(Date.now() / 1000);
          nonce = '72eb4648a1ea65ae644dc415bf7318cf';
          oldTimestamp = '1430626551';
          nextSpy = spy(function(err, valid) { });
        });

        beforeEach(() => nextSpy.resetHistory());

        it('invokes the callback with the correct error if the timestamp is too old', async function() {
          const expectError = match.instanceOf(TimestampError).and(match.has('message', "Timestamp '1430626551' is too old."));
          await knexNonceStore.isNew(nonce, oldTimestamp, nextSpy);
          expect(nextSpy).to.have.been.calledOnceWith(expectError, false);
        });

        it('invokes the callback with the correct error if the nonce has already been used', async function() {
          await db.insert({ value: nonce, timestamp: timestamp }).into(knexNonceStore.tableName);

          const expectError = match.instanceOf(NonceError).and(match.has('message', "Nonce '72eb4648a1ea65ae644dc415bf7318cf' already used."));
          await knexNonceStore.isNew(nonce, timestamp, nextSpy);
          expect(nextSpy).to.have.been.calledOnceWith(expectError, false);
        });

        it('invokes the callback with the correct error when an unexpected error appears', async function() {
          knexNonceStore = new KnexNonceStore(db, 'table_not_exist');

          await knexNonceStore.isNew(nonce, timestamp, nextSpy);
          expect(nextSpy).to.have.been.calledOnceWith(match.instanceOf(Error), false);
        });

        it('invokes the callback with success parameters if the nonce is new', async function() {
          await knexNonceStore.isNew(nonce, timestamp, nextSpy);
          expect(nextSpy).to.have.been.calledOnceWith(null, true);
        });
      });
    });

    describe('setUsed()', function() {

      it('raises an error if the first parameter is invalid', function() {
        const invalidValues = [
          { value: undefined, type: 'undefined' },
          { value: null, type: 'object' },
          { value: [], type: 'object' },
          { value: {}, type: 'object' },
          { value: 42, type: 'number' },
          { value: () => { }, type: 'function' }
        ];
        invalidValues.forEach(async item => {
          await expect(knexNonceStore.setUsed(item.value)).to.eventually.be.rejectedWith(TypeError, `The nonce argument must be a string ; ${item.type} given.`);
        });
      });

      it('raises an error if the second parameter is invalid', async function() {
        const nonce = 'wef5oihwef5wef8ur8g';
        await expect(knexNonceStore.setUsed(nonce, 'not_a_timestamp')).to.eventually.be.rejectedWith(TypeError, "The timestamp argument must be a valid timestramp ; 'not_a_timestamp' (string) given.");
      });

      it('raises an error if the third parameter is invalid', async function() {
        const nonce = 'wef5oihwef5wef8ur8g';
        const timestamp = Math.round(Date.now() / 1000);
        const invalidValues = [
          { value: null, type: 'object' },
          { value: 7, type: 'number' },
          { value: 'not_a_function', type: 'string' },
          { value: true, type: 'boolean' }
        ];
        invalidValues.forEach(async item => {
          await expect(knexNonceStore.setUsed(nonce, timestamp, item.value)).to.eventually.be.rejectedWith(TypeError, `The next argument must be a function, accepting two parameters ; ${item.type} given.`)
        })
        await expect(knexNonceStore.setUsed(nonce, timestamp, () => { })).to.eventually.be.rejectedWith(TypeError, 'The next callback must accept two parameters ; currently accepts 0 parameters.');
      });

      describe('with valid arguments', function() {

        let newNonce, timestamp, nonce, usedTimestamp, oldTimestamp, nextSpy;

        before(function() {
          timestamp = Math.round(Date.now() / 1000);
          nonce = '72eb4648a1ea65ae644dc415bf7318cf';
          oldTimestamp = '1430626551';
          nextSpy = spy(function(err, valid) { });
        });

        beforeEach(() => nextSpy.resetHistory());

        it('invokes the callback with the correct error when an unexpected error appears', async function() {
          knexNonceStore = new KnexNonceStore(db, 'table_not_exist');

          await knexNonceStore.setUsed(nonce, timestamp, nextSpy);
          expect(nextSpy).to.have.been.calledOnceWith(match.instanceOf(Error), false);
        });


        it('invokes the callback with success parameters when the nonce is stored', async function() {
          await knexNonceStore.setUsed(nonce, timestamp, nextSpy);
          expect(nextSpy).to.have.been.calledOnceWith(null, true);

          const result = await db.select().from(knexNonceStore.tableName).where({ value: nonce, timestamp: timestamp });
          expect(result.length).to.equal(1);

          const record = result[0];
          expect(record.value).to.equal(nonce);
          expect(record.timestamp).to.equal(String(timestamp));
        });

        it('deletes the stored nonce after the expiration time is up', async function() {
          // Creating a nonce store with a nonce expiration time of 1 second.
          knexNonceStore = new KnexNonceStore(db, undefined, 0.01);
          const resultBefore = await db.select().from(knexNonceStore.tableName);
          expect(resultBefore.length).to.equal(0);

          await knexNonceStore.setUsed(nonce, timestamp, nextSpy);
          const resultAfter = await db.select().from(knexNonceStore.tableName);
          expect(resultAfter.length).to.equal(1);
          // Waiting for the expiration time
          await new Promise(resolve => setTimeout(resolve, knexNonceStore.expireIn * 1000));
          const result = await db.select().from(knexNonceStore.tableName).where('value', nonce);
          expect(result.length).to.equal(0);
        });
      });
    });
  });
});
