exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable('direct_messages', function(table) {
      table.increments();
      table.timestamps(true, true);
      table.text('text').notNullable();
      table
        .integer('team_id')
        .references('id')
        .inTable('teams');
      table
        .integer('receiver_id')
        .references('id')
        .inTable('users');
      table
        .integer('sender_id')
        .references('id')
        .inTable('users');
    })
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([knex.schema.dropTable('direct_messages')]);
};
