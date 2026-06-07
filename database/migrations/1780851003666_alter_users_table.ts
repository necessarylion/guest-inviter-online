import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Federated (Google/Firebase) users have no local password.
      table.string('password').nullable().alter()
      // Firebase Auth UID, used to link a user to their Firebase identity.
      table.string('firebase_uid').nullable().unique()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('firebase_uid')
      table.string('password').notNullable().alter()
    })
  }
}
