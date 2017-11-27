exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable('messages', function(table) {
      table.increments();
      table.timestamps(true, true);
      table.text('text').notNullable();
      table
        .integer('user_id')
        .references('id')
        .inTable('users');
      table
        .integer('channel_id')
        .references('id')
        .inTable('channels');
    })
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([knex.schema.dropTable('messages')]);
};
