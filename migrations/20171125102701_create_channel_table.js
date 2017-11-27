exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable('channels', function(table) {
      table.increments();
      table.timestamps(true, true);
      table.string('name').notNullable();
      table.boolean('public').default(true);
      table
        .integer('team_id')
        .references('id')
        .inTable('teams');
    })
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([knex.schema.dropTable('channels')]);
};
