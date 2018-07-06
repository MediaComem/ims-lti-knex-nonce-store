# Knex Nonce Store

This package is to be used with the [`ims-lti` package][imslti] that helps implementing some parts of the LTI spec for a web application, notably the part where you have to validate a request as being a correct LTI request.

To achieve that, the `ims-lti` uses a store to save OAuth nonce/timestramp received. It also implements two stores : one in-memory, another using Redis (see [here][noncestore]), and allows you to add you own nonce store.

**This `knex-nonce-store` package implements a new nonce store that uses [Knex][knex] to do the work.**

## Prerequisites

This package expect that the following packages are installed on your project.

### `ims-lti`

Being a complement to the `ims-lti` package, you should install this package prior to installing `knex-nonce-store` (see [the doc of `ims-lti`][imslti-install] to do that).

### `knex` and database package

Before using the `knex-nonce-store`, you need to install `knex` as long as the package for the database you will use with it.

To do that, please see the [knex documentation][knex-install].

## Setup

To manage and store the OAuth nonce/timestamp with `knex-nonce-store` you need to create a new table in your database.

By default, this table should be called `nonce_store`, but you can give the library the name you want when instanciating it (see [API](##API)).

The table should be composed of at least two columns :

* `value` - Will store the nonce's value. Should accept the longest strings allowed by your DBMS. It's suggested to make this column the primary key of your table.
* `timestramp` - Will store the timestamp's value. Should accept long enough string to store a timestamp.

## Usage

To use this nonce store, you need to instanciate it and pass the instance to the constructor of `Provider` when setting up a Tool Provider with the `ims-lti` package (see [the corresponding doc of `ims-lti`][imslti-setup]).

```javascript
const { Provider } = require('ims-lti');
const knex = require('knex');
const { KnexNonceStore } = require('@mediacomem/knex-nonce-store');

const knexDB = knex({
  // You need to initialize the knex library. See the Knex documentation.
});

// Pass your knex instance to the constructor of KnexNonceStore
const store = new KnexNonceStore(knexDB);

// Pass your store instance to the constructor of Provider
const provider = new Provider(<consumer_key>, <consumer_secret>, store);
```
## API

### `KnexNonceStore` class

The main API of the `knex-nonce-store` is the `KnexNonceStore` class ([documentation](./lib/knex-nonce-store.class.js)).

It's constructor can accept four paramaters :

* `knex` _{ Object }_ - A initialized knex instance. This is mandatory.
* `tableName` _{ String }_ - The name of the table where the nonces/timestamps will be stored. **Optional and defaults to `nonce_store`.**
* `expireIn` _{ Number }_ - The nonce are stored so that they cannot be reused by another request before a certain amount of time. This parameter allows you to define this duration (in number of seconds). **Optional and defaults to 5 minutes (300 seconds).**
* `lifetime` _{ Number }_ - The request are timed using a timestamp. This timestamp should not be too old when validated by the `ims-lti` `Provider`. This parameter allows you to define the number of seconds during which the timestamp is "fresh". **Optional and defaults to 5 minutes (300 seconds).**

### Utiliy functions

You can also import two utility functions, that are used internally by the `KnexNonceStore` class.

* `isTimestamp()` ([documentation](./lib/is-timestamp.js)) - A function that takes a single parameter and tells you (with a boolean) wether or not its value could be considered a timestamp.
* `isFreshTimestamp()` ([documentation](./lib/is-fresh-timestamp.js)) - A function that checks if a timestamp is "fresh" _(as in "not too old")_. It takes two parameters and returns a boolean :
  * `timestamp` - The timestamp to test.
  * `lifetime` - The number of seconds during which the timestamp is fresh. **Optional and defaults to 5 minutes (300 seconds).**

[imslti]: https://github.com/omsmith/ims-lti
[imslti-install]: https://github.com/omsmith/ims-lti#install
[imslti-setup]: https://github.com/omsmith/ims-lti#setting-up-a-tool-provider-tp
[noncestore]: https://github.com/omsmith/ims-lti#nonce-stores
[knex]: https://knexjs.org/
[knex-install]: https://knexjs.org/#Installation
[knex-config]: https://knexjs.org/#Installation-client
