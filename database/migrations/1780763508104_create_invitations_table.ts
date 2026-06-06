import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'invitations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table
        .integer('guest_id')
        .unsigned()
        .references('id')
        .inTable('guests')
        .onDelete('CASCADE')
        .notNullable()
      table
        .integer('event_id')
        .unsigned()
        .references('id')
        .inTable('events')
        .onDelete('CASCADE')
        .notNullable()

      table.string('token').notNullable().unique()
      table.string('method').notNullable().defaultTo('link')
      table.string('status').notNullable().defaultTo('pending')
      table.timestamp('sent_at').nullable()
      table.timestamp('viewed_at').nullable()
      table.timestamp('scanned_at').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
