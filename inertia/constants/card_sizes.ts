/*
 * Paper/canvas sizes for the card designer's size dropdown.
 *
 * Single source of truth: the dropdown and the preset→dimension lookup both derive
 * from `SIZE_PRESETS`. To add, remove, or reorder a size, edit this list — `dims` is
 * [width, height] in millimetres. `custom` has no `dims`; its size comes from the
 * width/height inputs instead.
 */
export type SizePreset = { key: string; label: string; dims?: [number, number] }

export const SIZE_PRESETS: SizePreset[] = [
  // ===== Print =====
  { key: '5x7', label: 'Invitation Card (5 × 7 in)', dims: [127, 178] },
  { key: '5x7Horizontal', label: 'Invitation Card — Wide (7 × 5 in)', dims: [178, 127] },

  { key: 'a6', label: 'Postcard (A6)', dims: [105, 148] },
  { key: 'a6Horizontal', label: 'Postcard — Wide (A6)', dims: [148, 105] },

  { key: 'dl', label: 'Tall Card (DL)', dims: [99, 210] },
  { key: 'dlHorizontal', label: 'Tall Card — Wide (DL)', dims: [210, 99] },

  { key: '5x5', label: 'Square Card (5 × 5 in)', dims: [127, 127] },

  // ===== Instagram =====
  { key: 'instagramPost', label: 'Instagram Post (Square)', dims: [127, 127] },
  { key: 'instagramPortrait', label: 'Instagram Post (Tall)', dims: [127, 159] },
  { key: 'instagramStory', label: 'Instagram Story', dims: [108, 192] },

  // ===== Facebook =====
  { key: 'facebookPost', label: 'Facebook Post (Square)', dims: [127, 127] },
  { key: 'facebookCover', label: 'Facebook Cover Photo', dims: [210, 80] },
  { key: 'facebookStory', label: 'Facebook Story', dims: [108, 192] },

  // ===== TikTok =====
  { key: 'tiktokVideo', label: 'TikTok Video', dims: [108, 192] },

  // ===== Generic Digital =====
  { key: 'square', label: 'Square', dims: [127, 127] },
  { key: 'portrait', label: 'Portrait (Tall)', dims: [127, 159] },
  { key: 'story', label: 'Story / Reel', dims: [108, 192] },

  // ===== Common Digital Formats =====
  { key: 'landscape', label: 'Landscape (Wide)', dims: [192, 108] },
  { key: 'youtubeThumbnail', label: 'YouTube Thumbnail', dims: [192, 108] },

  // ===== Event & Flyer =====
  { key: 'flyer', label: 'Flyer (A5)', dims: [148, 210] },
  { key: 'flyerHorizontal', label: 'Flyer — Wide (A5)', dims: [210, 148] },

  { key: 'custom', label: 'Custom Size…' },
]

/** Preset key → [width, height] in mm, for sizes that have fixed dimensions. */
export const SIZE_DIMENSIONS: Record<string, [number, number]> = Object.fromEntries(
  SIZE_PRESETS.flatMap((p) => (p.dims ? [[p.key, p.dims]] : []))
)

/** The size selected by default when a template carries no size of its own. */
export const DEFAULT_SIZE_PRESET = '5x7'
