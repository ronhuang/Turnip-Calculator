exports.up = function (knex) {
  return knex.schema.createTable("prices", function (table) {
    table.increments();
    table.string("user_id").notNullable();
    table.text("values").notNullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("prices");
};
