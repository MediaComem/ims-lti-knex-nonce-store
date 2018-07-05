
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('nonce_store').del()
  // Inserts seed entries
  return knex('nonce_store').insert([
    { value: '72eb4648a1ea65ae644dc415bf7318cf', timestamp: '1530626551' }
  ]);
};
