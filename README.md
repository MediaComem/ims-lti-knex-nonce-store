# Knex Nonce Store

The [`ims-lti` package][imslti] lets you use your own nonce store for storing OAuth nonce/timestamp, but only implements two stores : one in-memory, another using Redis (see [here][noncestore]).

This package implements a new nonce store that uses a [Knex][knex] instance to do the work.

[imslti]: https://github.com/omsmith/ims-lti
[noncestore]: https://github.com/omsmith/ims-lti#nonce-stores
[knex]: https://knexjs.org/
