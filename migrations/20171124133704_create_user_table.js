exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable('users', function(table) {
      table.increments();
      table.timestamps(true, true);
      table
        .string('username')
        .unique()
        .notNullable();
      table
        .string('email', 355)
        .unique()
        .notNullable();
      table.string('password').notNullable();
    })
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([knex.schema.dropTable('users')]);
};
