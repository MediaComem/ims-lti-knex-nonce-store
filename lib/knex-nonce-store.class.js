const NonceStore = require('ims-lti').Stores.NonceStore;

const isFreshTimestamp = require('./is-fresh-timestamp');
const isTimestamp = require('./is-timestamp');

/**
 * @class
 */
class KnexNonceStore extends NonceStore {

  /**
   * Creates a new `KnexNonceStore` object.
   * Use one when creating a `lti.Provider` object to use knex as your nonce store.
   *
   * @constructor
   * @param {Object} knex - A knex instance.
   * @param {string} [tableName='nonce_store'] - The name of the table that stores the nonces. Defaults to 'nonce_store'.
   * @param {number} [expireIn=300] - The number of seconds during which the nonce is valid. Defaults to 5 minutes (300 sec).
   * @returns {KnexNonceStore} A new `KnexNonceStore` object.
   *
   * @throws {TypeError} If any of the arguments does not match the requirements.
   */
  constructor(knex, tableName = 'nonce_store', expireIn = 5 * 60) {
    if (knex === null || typeof knex !== 'function') {
      throw new TypeError(`The knex argument must be a function ; ${typeof knex} given.`);
    }
    if (typeof tableName !== 'string') {
      throw new TypeError(`The tableName argument must be a string ; ${typeof tableName} given.`);
    }
    if (!Number.isInteger(expireIn) || expireIn < 0) {
      throw new TypeError(`The expireIn argument must be a positive integer ; ${expireIn} (${typeof expireIn}) given.`);
    }
    super();
    this.knex = knex;
    this.tableName = tableName;
    this.expireIn = expireIn;
  }

  /**
   * Checks that the given `nonce` has not already been used and that the call is not too old, by checking the given `timestamp`.
   * The `next` argument should be a function accepting two parameters : `err` and `isValid`.
   * If an error occurs, `next` will be called with `err` set to the error and `isValid` set to `false`.
   *
   * The `nonce` value is searched in the store's table ; if found, the `next` callback is called with an error.
   * If not found, the `setUsed` method is called instead.
   *
   * The timestamp is checked using the `isFreshTimestamp` function, and the `next` callback is called with an error if it's not fresh.
   *
   * If the `timestamp` is fresh and the `nonce` is indeed a new one, `next` will be called with `err` set to `null`, and `isValid` to `true`.
   *
   * @async
   * @method
   * @param {string} nonce - The nonce.
   * @param {string} timestamp - A timestramp.
   * @param {function} [next=() => {}] - A callback that will be called at the end of the method. Defaults to empty function.
   *
   * @throws {TypeError} If any of the arguments does not match the requirements.
   */
  async isNew(nonce, timestamp, next = () => { }) {
    if (typeof nonce !== 'string') {
      throw new TypeError(`The nonce argument must be a string ; ${typeof nonce} given.`);
    }
    if (!isTimestamp(timestamp)) {
      throw new TypeError(`The timestamp argument must be a valid timestramp ; ${timestamp} (${typeof timestamp}) given.`);
    }
    if (typeof next !== 'function') {
      throw new TypeError(`The next argument must be a function, accepting two parameters ; ${typeof next} given.`);
    } else if (next.length !== 2) {
      throw new TypeError(`The next callback must accept two parameters ; accepts ${next.length} parameters.`);
    }
    try {
      if (!isFreshTimestamp(timestamp)) {
        next(new Error('Expired timestamp', false));
      }
      // Check if nonce already used.
      const result = await this.knex.select().from(this.tableName).where('value', nonce);
      if (result.length !== 0) {
        next(new Error('Nonce already used'), false);
      };
      // Set the nonce as used.
      await this.setUsed(nonce, next);
      next(null, true);
    } catch (e) {
      next(e, false);
    }
  }

  /**
   * Sets a nonce as beeing used.
   * This will add the `nonce` value to the store table, for future reference.
   * After a delay, in seconds, equal to the store's `expireIn` property value,
   * the nonce record will be deleted from the store's table.
   *
   * If provided, the `next` argument must be a function accepting two parameters: `err` and `isValid`.
   * If an error occurs, it will be called with `err` set to the error and `isValid` set to `false`.
   * If all's well, it will be called with `err` set to `null` and `isValid` to `true`.
   *
   * @async
   * @method
   * @param {string} nonce - The nonce.
   * @param {string} [timestamp=null] - A timestamp. Defaults to null.
   * @param {function} [next=() => {}] - A callback that will be called at the end of the method. Defaults to empty function.
   *
   * @throws {TypeError} If any of the arguments does not match the requirements.
   */
  async setUsed(nonce, timestamp = null, next = () => { }) {
    if (typeof timestamp === 'function') {
      next = timestamp;
      timestamp = null;
    }
    if (typeof nonce !== 'string') {
      throw new TypeError(`The nonce argument must be a string ; ${typeof nonce} given.`);
    }
    if (timestamp && !isTimestamp(timestamp)) {
      throw new TypeError(`The timestamp argument must be a valid timestramp ; ${timestamp} (${typeof timestamp}) given.`);
    }
    if (typeof next !== 'function') {
      throw new TypeError(`The next argument must be a function, accepting two parameters ; ${typeof next} given.`);
    } else if (next.length !== 2) {
      throw new TypeError(`The next callback must accept two parameters ; accepts ${next.length} parameters.`);
    }
    try {
      const result = await this.knex.insert({ value: nonce }).into(this.tableName);
      // Prepares the deletion of the nonce from the store's table after the delay.
      setTimeout(async () => await this.knex(this.tableName).where('value', nonce).del(), this.expireIn * 1000);
      next(null, true);
    } catch (e) {
      next(e, false);
    }
  }
}

module.exports = KnexNonceStore;
