const NonceStore = require('ims-lti').Stores.NonceStore;

const isFreshTimestamp = require('./is-fresh-timestamp');
const isTimestamp = require('./is-timestamp');
const { TimestampError, NonceError } = require('./errors');

/**
 * @class
 */
class KnexNonceStore extends NonceStore {

  /**
   * Creates a new `KnexNonceStore` object.
   * Use one when creating an `lti.Provider` object to use knex as your nonce store.
   *
   * By default, the KnexNonceStore will use a table named 'nonce_store' to manage your nonce.
   * You can change this name by passing a value to the `tableName` argument.
   *
   * Once validated and stored, a request nonce will not be valid for another request during a certain amount of time.
   * This duration defaults to 90 minutes (5400 sec). Pass a value to the `expireIn` argument to change this.
   *
   * A request will only be valid if it's timestamp is "fresh", that is it represents a timestamp not too far in the past.
   * This validity duration also defaults to 90 minutes (5400 sec), but you can pass a value to the `lifetime` argument to change it.
   * Any timestramp too old than `lifetime` second will be rejected.
   *
   * The 90 minutes time interval is [recommended by the LTI 1.1 spec]{@link https://www.imsglobal.org/specs/ltiv1p1p1/implementation-guide#toc-4}.
   *
   * @constructor
   * @param {Object} knex - A knex instance.
   * @param {string} [tableName='nonce_store'] - The name of the table that stores the nonces. Defaults to 'nonce_store'.
   * @param {number} [expireIn=5400] - The number of seconds during which the nonce won't be reusable. Defaults to 90 minutes (5400 sec).
   * @param {number} [lifetime=5400] - The delay (in seconds) during which a timestamp is valid. Defaults to 90 minutes (5400 sec).
   * @returns {KnexNonceStore} A new `KnexNonceStore` object.
   *
   * @throws {TypeError} If any of the arguments does not match the requirements.
   */
  constructor(knex, tableName = 'nonce_store', expireIn = 90 * 60, lifetime = 90 * 60) {
    if (knex === null || typeof knex !== 'function') {
      throw new TypeError(`The knex argument must be a function ; ${typeof knex} given.`);
    }
    if (typeof tableName !== 'string') {
      throw new TypeError(`The tableName argument must be a string ; ${typeof tableName} given.`);
    }
    if (!Number(expireIn) || expireIn < 0) {
      throw new TypeError(`The expireIn argument must be a positive number ; '${expireIn}' (${typeof expireIn}) given.`);
    }
    if (!Number(lifetime) || lifetime < 0) {
      throw new TypeError(`The lifetime argument must be a positive number ; '${lifetime}' (${typeof lifetime}) given.`);
    }
    super();
    this.knex = knex;
    this.tableName = tableName;
    this.expireIn = expireIn;
    this.lifetime = lifetime;
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
   * @param {function} [next=(err, isValid) => {}] - A callback that will be called at the end of the method. Defaults to empty function.
   *
   * @throws {TypeError} If any of the arguments does not match the requirements.
   */
  async isNew(nonce, timestamp, next = (err, isValid) => { }) {
    if (typeof nonce !== 'string') {
      throw new TypeError(`The nonce argument must be a string ; ${typeof nonce} given.`);
    }
    if (!isTimestamp(timestamp, this.lifetime)) {
      throw new TypeError(`The timestamp argument must be a valid timestramp ; '${timestamp}' (${typeof timestamp}) given.`);
    }
    if (typeof next !== 'function') {
      throw new TypeError(`The next argument must be a function, accepting two parameters ; ${typeof next} given.`);
    } else if (next.length !== 2) {
      throw new TypeError(`The next callback must accept two parameters ; currently accepts ${next.length} parameters.`);
    }
    try {
      if (!isFreshTimestamp(timestamp)) {
        return next(new TimestampError(`Timestamp '${timestamp}' is too old.`), false);
      }
      // Check if nonce already used.
      const result = await this.knex.select().from(this.tableName).where({ value: nonce });
      if (result.length !== 0) {
        return next(new NonceError(`Nonce '${nonce}' already used.`), false);
      };
      // Set the nonce as used.
      return await this.setUsed(nonce, timestamp, next);
    } catch (e) {
      return next(e, false);
    }
  }

  /**
   * Sets a nonce as beeing used.
   * This will add the `nonce` and `timestamp` values to the store table, for future reference.
   * After a delay, in seconds, equal to the store's `expireIn` property value,
   * the record will be deleted from the store's table.
   *
   * If provided, the `next` argument must be a function accepting two parameters: `err` and `isValid`.
   * If an error occurs, it will be called with `err` set to the error and `isValid` set to `false`.
   * If all's well, it will be called with `err` set to `null` and `isValid` to `true`.
   *
   * @async
   * @method
   * @param {string} nonce - The nonce.
   * @param {string} timestamp - A timestamp.
   * @param {function} [next=(err, isValid) => {}] - A callback that will be called at the end of the method. Defaults to empty function.
   *
   * @throws {TypeError} If any of the arguments does not match the requirements.
   */
  async setUsed(nonce, timestamp, next = (err, isValid) => { }) {
    if (typeof nonce !== 'string') {
      throw new TypeError(`The nonce argument must be a string ; ${typeof nonce} given.`);
    }
    if (!isTimestamp(timestamp)) {
      throw new TypeError(`The timestamp argument must be a valid timestramp ; '${timestamp}' (${typeof timestamp}) given.`);
    }
    if (typeof next !== 'function') {
      throw new TypeError(`The next argument must be a function, accepting two parameters ; ${typeof next} given.`);
    } else if (next.length !== 2) {
      throw new TypeError(`The next callback must accept two parameters ; currently accepts ${next.length} parameters.`);
    }
    const record = {
      value: nonce,
      timestamp: timestamp
    };
    try {
      const result = await this.knex.insert(record).into(this.tableName);
      // Prepares the deletion of the nonce from the store's table after the delay.
      setTimeout(async () => {
        await this.knex(this.tableName).where(record).del();
      }, this.expireIn * 1000);
      return next(null, true);
    } catch (e) {
      return next(e, false);
    }
  }
}

module.exports = KnexNonceStore;
