
exports.up = function(knex) {
  return knex.schema.createTable('nonce_store', t => {
    t.string('value').primary();
    t.string('timestamp');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('nonce_store');
};
