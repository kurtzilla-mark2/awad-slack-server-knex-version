exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable('channel_members', function(table) {
      table.comment('Join table to link users to channels');
      table.increments();
      table.timestamps(true, true);
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
  return Promise.all([knex.schema.dropTable('channel_members')]);
};
