<script setup lang="ts">
import { DateTime } from 'luxon'
import { Head } from '@inertiajs/vue3'
import { Link } from '@adonisjs/inertia/vue'

type EventRow = {
  id: number
  title: string
  status: string
  location: string | null
  startsAt: string | null
  guestsCount: number
  checkedInCount: number
}

defineProps<{ events: EventRow[]; totalEvents: number }>()

function formatDate(iso: string | null) {
  return iso ? DateTime.fromISO(iso).toFormat('dd LLL yyyy, t') : 'Date TBD'
}
</script>

<template>
  <Head title="Your events" />

  <div class="page">
    <div class="page-header">
      <div>
        <h1>Your events</h1>
        <p>{{ totalEvents }} event{{ totalEvents === 1 ? '' : 's' }} total</p>
      </div>
      <Link route="events.create" class="btn">Create event</Link>
    </div>

    <div v-if="events.length" class="grid grid-3">
      <Link
        v-for="event in events"
        :key="event.id"
        route="events.show"
        :params="{ id: event.id }"
        class="card"
      >
        <div class="row" style="justify-content: space-between">
          <h3>{{ event.title }}</h3>
          <span class="badge" :class="event.status === 'published' ? 'badge-success' : ''">
            {{ event.status }}
          </span>
        </div>
        <p class="muted" style="margin: 8px 0 16px">{{ formatDate(event.startsAt) }}</p>
        <p v-if="event.location" class="muted">📍 {{ event.location }}</p>
        <div class="row" style="margin-top: 16px; gap: 18px">
          <span
            ><strong>{{ event.guestsCount }}</strong> <span class="muted">guests</span></span
          >
          <span
            ><strong>{{ event.checkedInCount }}</strong> <span class="muted">checked in</span></span
          >
        </div>
      </Link>
    </div>

    <div v-else class="card" style="text-align: center; padding: 60px 20px">
      <h3>No events yet</h3>
      <p class="muted" style="margin: 8px 0 20px">
        Create your first event to start inviting guests.
      </p>
      <Link route="events.create" class="btn">Create event</Link>
    </div>
  </div>
</template>
