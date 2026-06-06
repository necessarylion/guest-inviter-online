import Event from '#models/event'
import { belongsTo } from '@adonisjs/lucid/orm'
import { CardTemplateSchema } from '#database/schema'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

/**
 * A single card design element. Coordinates are in card pixels (top-left origin),
 * matching the Konva editor canvas. The `qr` element's content is injected per
 * guest at render time — its payload is owned by the system, not the designer.
 */
export type CardElement =
  | {
      id: string
      type: 'text'
      x: number
      y: number
      width: number
      fontSize: number
      fill: string
      align: 'left' | 'center' | 'right'
      bold: boolean
      text: string
    }
  | { id: string; type: 'rect'; x: number; y: number; width: number; height: number; fill: string }
  | { id: string; type: 'image'; x: number; y: number; width: number; height: number; src: string }
  | { id: string; type: 'qr'; x: number; y: number; size: number }

export interface CardDesign {
  background: string
  elements: CardElement[]
}

export default class CardTemplate extends CardTemplateSchema {
  @belongsTo(() => Event)
  declare event: BelongsTo<typeof Event>

  get design(): CardDesign {
    return this.designJson as CardDesign
  }
}
