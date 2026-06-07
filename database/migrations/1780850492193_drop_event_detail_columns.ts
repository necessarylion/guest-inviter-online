import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'events'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('venue_address')
      table.dropColumn('cover_image_url')
      table.dropColumn('timezone')
      table.dropColumn('status')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('venue_address').nullable()
      table.string('cover_image_url').nullable()
      table.string('timezone').notNullable().defaultTo('UTC')
      table.string('status').notNullable().defaultTo('draft')
    })
  }
}
