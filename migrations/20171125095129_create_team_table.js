exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable('teams', function(table) {
      table.increments();
      table.timestamps(true, true);

      table.string('name').notNullable();
      table
        .integer('owner_id')
        .references('id')
        .inTable('users');
    })
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([knex.schema.dropTable('teams')]);
};
