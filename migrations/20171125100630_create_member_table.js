exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable('members', function(table) {
      table.comment('Join table to link users to teams');
      table.increments();
      table.timestamps(true, true);
      table.boolean('admin').default(false);
      table
        .integer('user_id')
        .references('id')
        .inTable('users');
      table
        .integer('team_id')
        .references('id')
        .inTable('teams');
    })
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([knex.schema.dropTable('members')]);
};
