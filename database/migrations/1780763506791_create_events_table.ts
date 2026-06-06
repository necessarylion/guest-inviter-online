import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'events'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table
        .integer('user_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .notNullable()

      table.string('title').notNullable()
      table.string('slug').notNullable().unique()
      table.text('description').nullable()
      table.string('location').nullable()
      table.string('venue_address').nullable()
      table.string('cover_image_url').nullable()
      table.timestamp('starts_at').notNullable()
      table.timestamp('ends_at').nullable()
      table.string('timezone').notNullable().defaultTo('UTC')
      table.string('status').notNullable().defaultTo('draft')
      table.boolean('allow_public_rsvp').notNullable().defaultTo(true)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
