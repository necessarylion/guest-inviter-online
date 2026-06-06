<script setup lang="ts">
import { ref } from 'vue'
import { Head } from '@inertiajs/vue3'
import { Link } from '@adonisjs/inertia/vue'
import { QrcodeStream } from 'vue-qrcode-reader'

interface ScanResult {
  status: 'ok' | 'already' | 'invalid' | 'error' | 'camera-error'
  guest?: { name: string; rsvpStatus: string }
  message?: string
}

const props = defineProps<{ event: { id: number; title: string } }>()

const result = ref<ScanResult | null>(null)
const busy = ref(false)
let lastCode = ''
let cooldownUntil = 0

function xsrfToken() {
  const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : ''
}

async function onDetect(codes: { rawValue: string }[]) {
  const code = codes[0]?.rawValue
  if (!code || busy.value) return
  if (code === lastCode && Date.now() < cooldownUntil) return

  lastCode = code
  cooldownUntil = Date.now() + 3000
  busy.value = true

  try {
    const response = await fetch(`/events/${props.event.id}/check-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-XSRF-TOKEN': xsrfToken(),
      },
      credentials: 'same-origin',
      body: JSON.stringify({ code }),
    })
    result.value = await response.json()
  } catch {
    result.value = { status: 'error' }
  } finally {
    busy.value = false
  }
}

function onError(error: Error) {
  result.value = { status: 'camera-error', message: error.message }
}

const banner: Record<ScanResult['status'], { cls: string; title: string }> = {
  'ok': { cls: 'res-ok', title: '✓ Checked in' },
  'already': { cls: 'res-warn', title: '! Already checked in' },
  'invalid': { cls: 'res-bad', title: '✗ Invalid code' },
  'error': { cls: 'res-bad', title: '✗ Something went wrong' },
  'camera-error': { cls: 'res-bad', title: '✗ Camera error' },
}
</script>

<template>
  <Head :title="`Scan · ${event.title}`" />

  <div class="page" style="max-width: 560px; margin: 0 auto">
    <div class="page-header">
      <div>
        <h1>Check-in scanner</h1>
        <p>{{ event.title }}</p>
      </div>
      <Link :href="`/events/${event.id}`" class="btn btn-secondary">Done</Link>
    </div>

    <div class="scanner">
      <QrcodeStream @detect="onDetect" @error="onError" />
    </div>

    <div v-if="result" class="result" :class="banner[result.status].cls">
      <strong>{{ banner[result.status].title }}</strong>
      <div v-if="result.guest" style="margin-top: 4px; font-size: 18px">
        {{ result.guest.name }}
        <span class="badge" style="margin-left: 8px">RSVP: {{ result.guest.rsvpStatus }}</span>
      </div>
      <div v-if="result.message" class="muted" style="margin-top: 4px">{{ result.message }}</div>
    </div>

    <p class="muted" style="margin-top: 16px; text-align: center">
      Point the camera at a guest's invitation QR code.
    </p>
  </div>
</template>

<style scoped>
.scanner {
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--gray-3);
  aspect-ratio: 1;
  background: #000;
}
.result {
  margin-top: 20px;
  padding: 18px 20px;
  border-radius: 12px;
  border: 1px solid;
}
.res-ok {
  background: #00a63e1a;
  border-color: #00a63e;
  color: #00a63e;
}
.res-warn {
  background: #f59e0b1a;
  border-color: #f59e0b;
  color: #b45309;
}
.res-bad {
  background: #fb2c361a;
  border-color: #fb2c36;
  color: #e7000b;
}
</style>
