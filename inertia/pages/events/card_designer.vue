<script setup lang="ts">
import Konva from 'konva'
import QRCode from 'qrcode'
import { Head, router } from '@inertiajs/vue3'
import { Link } from '@adonisjs/inertia/vue'
import { onMounted, onBeforeUnmount, ref, watch, computed, nextTick } from 'vue'

type El = {
  id: string
  type: 'text' | 'rect' | 'image' | 'qr'
  x: number
  y: number
  width?: number
  height?: number
  fontSize?: number
  fill?: string
  align?: 'left' | 'center' | 'right'
  bold?: boolean
  text?: string
  src?: string
  size?: number
}
type Design = { background: string; elements: El[] }

const props = defineProps<{
  event: { id: number; title: string }
  template: { name: string; width: number; height: number; design: Design }
  sampleQrUrl: string
}>()

const name = ref(props.template.name)
const width = ref(props.template.width)
const height = ref(props.template.height)
const design = ref<Design>(JSON.parse(JSON.stringify(props.template.design)))
const selectedId = ref<string | null>(null)
const saving = ref(false)

const selected = computed(() => design.value.elements.find((e) => e.id === selectedId.value))

const container = ref<HTMLDivElement | null>(null)
let stage: Konva.Stage | null = null
let layer: Konva.Layer | null = null
let dragging = false
let qrDataUrl = ''
const imageCache: Record<string, HTMLImageElement> = {}

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

function getImage(src: string, onReady: () => void) {
  if (imageCache[src]) return imageCache[src]
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = onReady
  img.src = src
  imageCache[src] = img
  return img
}

function renderLayer() {
  if (!stage || !layer) return
  layer.destroyChildren()

  layer.add(
    new Konva.Rect({
      x: 0,
      y: 0,
      width: width.value,
      height: height.value,
      fill: design.value.background,
    })
  )

  for (const el of design.value.elements) {
    let node: Konva.Shape | null = null

    if (el.type === 'rect') {
      node = new Konva.Rect({
        x: el.x,
        y: el.y,
        width: el.width ?? 100,
        height: el.height ?? 100,
        fill: el.fill ?? '#000000',
      })
    } else if (el.type === 'text') {
      node = new Konva.Text({
        x: el.x,
        y: el.y,
        width: el.width ?? 200,
        text: el.text ?? '',
        fontSize: el.fontSize ?? 24,
        fill: el.fill ?? '#000000',
        align: el.align ?? 'left',
        fontStyle: el.bold ? 'bold' : 'normal',
        fontFamily: 'Helvetica, Arial, sans-serif',
      })
    } else if (el.type === 'qr') {
      node = new Konva.Image({
        x: el.x,
        y: el.y,
        width: el.size ?? 200,
        height: el.size ?? 200,
        image: qrDataUrl ? getImage(qrDataUrl, () => layer?.draw()) : undefined,
      })
    } else if (el.type === 'image') {
      node = new Konva.Image({
        x: el.x,
        y: el.y,
        width: el.width ?? 200,
        height: el.height ?? 200,
        image: el.src ? getImage(el.src, () => layer?.draw()) : undefined,
        stroke: el.src ? undefined : '#d1d5db',
        strokeWidth: el.src ? 0 : 1,
      })
    }

    if (!node) continue

    node.draggable(true)
    node.on('mousedown touchstart click', () => {
      selectedId.value = el.id
    })
    node.on('dragstart', () => {
      dragging = true
    })
    node.on('dragend', (e) => {
      el.x = Math.round(e.target.x())
      el.y = Math.round(e.target.y())
      dragging = false
    })

    if (el.id === selectedId.value) {
      // selection outline
      const box = node.getClientRect({ relativeTo: layer })
      layer.add(
        new Konva.Rect({
          x: box.x - 2,
          y: box.y - 2,
          width: box.width + 4,
          height: box.height + 4,
          stroke: '#2563eb',
          strokeWidth: 2,
          dash: [6, 4],
          listening: false,
        })
      )
    }

    layer.add(node)
  }

  layer.draw()
}

function fitStage() {
  if (!container.value) return
  const maxW = container.value.clientWidth
  const scale = Math.min(1, maxW / width.value)
  stage?.size({ width: width.value * scale, height: height.value * scale })
  stage?.scale({ x: scale, y: scale })
  stage?.draw()
}

onMounted(async () => {
  qrDataUrl = await QRCode.toDataURL(props.sampleQrUrl, { margin: 1, width: 320 })
  stage = new Konva.Stage({ container: container.value!, width: width.value, height: height.value })
  layer = new Konva.Layer()
  stage.add(layer)

  // Click on empty canvas clears selection
  stage.on('click tap', (e) => {
    if (e.target === stage) selectedId.value = null
  })

  fitStage()
  renderLayer()
  window.addEventListener('resize', fitStage)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', fitStage)
  stage?.destroy()
})

watch(
  [design, selectedId, width, height],
  () => {
    if (dragging) return
    nextTick(() => {
      fitStage()
      renderLayer()
    })
  },
  { deep: true }
)

function addText() {
  const el: El = {
    id: uid(),
    type: 'text',
    x: 80,
    y: 80,
    width: 300,
    fontSize: 28,
    fill: '#ffffff',
    align: 'left',
    bold: false,
    text: 'New text',
  }
  design.value.elements.push(el)
  selectedId.value = el.id
}
function addRect() {
  const el: El = { id: uid(), type: 'rect', x: 80, y: 80, width: 200, height: 120, fill: '#2563eb' }
  design.value.elements.push(el)
  selectedId.value = el.id
}
function addImage() {
  const src = window.prompt('Image URL (https://…)')
  if (!src) return
  const el: El = { id: uid(), type: 'image', x: 80, y: 80, width: 200, height: 200, src }
  design.value.elements.push(el)
  selectedId.value = el.id
}
function removeSelected() {
  const el = selected.value
  if (!el || el.type === 'qr') return
  design.value.elements = design.value.elements.filter((e) => e.id !== el.id)
  selectedId.value = null
}

function save() {
  saving.value = true
  router.put(
    `/events/${props.event.id}/card`,
    { name: name.value, width: width.value, height: height.value, design: design.value },
    { preserveScroll: true, preserveState: true, onFinish: () => (saving.value = false) }
  )
}
</script>

<template>
  <Head title="Card designer" />

  <div class="page">
    <div class="page-header">
      <div>
        <h1>Card designer</h1>
        <p>{{ event.title }} — the QR code is required and is replaced per guest when generated.</p>
      </div>
      <div class="row">
        <Link :href="`/events/${event.id}`" class="btn btn-secondary">Back to event</Link>
        <button class="btn" :disabled="saving" @click="save">Save design</button>
      </div>
    </div>

    <div class="designer">
      <!-- Toolbar -->
      <div class="panel">
        <h3>Add</h3>
        <div class="row" style="margin: 10px 0 20px">
          <button class="btn btn-secondary btn-sm" @click="addText">+ Text</button>
          <button class="btn btn-secondary btn-sm" @click="addRect">+ Box</button>
          <button class="btn btn-secondary btn-sm" @click="addImage">+ Image</button>
        </div>

        <h3>Card</h3>
        <div class="field" style="margin-top: 10px">
          <label>Name</label>
          <input v-model="name" type="text" />
        </div>
        <div class="form-grid" style="margin-top: 12px">
          <div class="field">
            <label>Width</label><input v-model.number="width" type="number" />
          </div>
          <div class="field">
            <label>Height</label><input v-model.number="height" type="number" />
          </div>
        </div>
        <div class="field" style="margin-top: 12px">
          <label>Background</label>
          <input v-model="design.background" type="color" style="height: 40px" />
        </div>

        <h3 style="margin-top: 20px">Layers</h3>
        <ul class="layers">
          <li
            v-for="el in design.elements"
            :key="el.id"
            :class="{ active: el.id === selectedId }"
            @click="selectedId = el.id"
          >
            <span>{{
              el.type === 'qr' ? '🔒 QR code' : el.type === 'text' ? `“${el.text}”` : el.type
            }}</span>
          </li>
        </ul>
      </div>

      <!-- Canvas -->
      <div class="canvas-wrap">
        <div ref="container" class="canvas" />
      </div>

      <!-- Properties -->
      <div class="panel">
        <h3>Properties</h3>
        <p v-if="!selected" class="muted" style="margin-top: 10px">Select an element to edit it.</p>

        <template v-else>
          <div class="form-grid" style="margin-top: 12px">
            <div class="field">
              <label>X</label><input v-model.number="selected.x" type="number" />
            </div>
            <div class="field">
              <label>Y</label><input v-model.number="selected.y" type="number" />
            </div>
          </div>

          <template v-if="selected.type === 'text'">
            <div class="field" style="margin-top: 12px">
              <label>Text</label>
              <textarea v-model="selected.text" />
            </div>
            <div class="form-grid" style="margin-top: 12px">
              <div class="field">
                <label>Font size</label><input v-model.number="selected.fontSize" type="number" />
              </div>
              <div class="field">
                <label>Width</label><input v-model.number="selected.width" type="number" />
              </div>
            </div>
            <div class="form-grid" style="margin-top: 12px">
              <div class="field">
                <label>Color</label
                ><input v-model="selected.fill" type="color" style="height: 40px" />
              </div>
              <div class="field">
                <label>Align</label>
                <select v-model="selected.align">
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>
            </div>
            <label class="row" style="margin-top: 12px; font-weight: 400">
              <input v-model="selected.bold" type="checkbox" style="width: auto; height: auto" />
              Bold
            </label>
          </template>

          <template v-else-if="selected.type === 'rect'">
            <div class="form-grid" style="margin-top: 12px">
              <div class="field">
                <label>Width</label><input v-model.number="selected.width" type="number" />
              </div>
              <div class="field">
                <label>Height</label><input v-model.number="selected.height" type="number" />
              </div>
            </div>
            <div class="field" style="margin-top: 12px">
              <label>Fill</label><input v-model="selected.fill" type="color" style="height: 40px" />
            </div>
          </template>

          <template v-else-if="selected.type === 'image'">
            <div class="field" style="margin-top: 12px">
              <label>Image URL</label><input v-model="selected.src" type="url" />
            </div>
            <div class="form-grid" style="margin-top: 12px">
              <div class="field">
                <label>Width</label><input v-model.number="selected.width" type="number" />
              </div>
              <div class="field">
                <label>Height</label><input v-model.number="selected.height" type="number" />
              </div>
            </div>
          </template>

          <template v-else-if="selected.type === 'qr'">
            <div class="field" style="margin-top: 12px">
              <label>Size</label><input v-model.number="selected.size" type="number" />
            </div>
            <p class="muted" style="margin-top: 10px">
              The QR content is set automatically for each guest.
            </p>
          </template>

          <button
            v-if="selected.type !== 'qr'"
            class="btn btn-danger btn-sm"
            style="margin-top: 18px"
            @click="removeSelected"
          >
            Delete element
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.designer {
  display: grid;
  grid-template-columns: 240px 1fr 260px;
  gap: 20px;
  align-items: start;
}
.panel {
  background: #fff;
  border: 1px solid var(--gray-3);
  border-radius: 12px;
  padding: 16px;
}
.panel h3 {
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--gray-7);
}
.canvas-wrap {
  background: var(--gray-2);
  border: 1px solid var(--gray-3);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  justify-content: center;
}
.canvas {
  width: 100%;
  max-width: 480px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}
.layers {
  list-style: none;
  margin-top: 8px;
  font-size: 13px;
}
.layers li {
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.layers li:hover {
  background: var(--gray-2);
}
.layers li.active {
  background: #2563eb1a;
  color: #2563eb;
}
@media (max-width: 1000px) {
  .designer {
    grid-template-columns: 1fr;
  }
}
</style>
