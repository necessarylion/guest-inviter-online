<script setup lang="ts">
import { DateTime } from 'luxon'
import { Head, useForm } from '@inertiajs/vue3'
import EventFields from '~/components/event_fields.vue'

type EventData = {
  id: number
  title: string
  description: string | null
  location: string | null
  venueAddress: string | null
  coverImageUrl: string | null
  startsAt: string | null
  endsAt: string | null
  timezone: string
  status: string
  allowPublicRsvp: boolean
}

const props = defineProps<{ event: EventData }>()

function toLocalInput(iso: string | null, zone: string) {
  return iso ? DateTime.fromISO(iso).setZone(zone).toFormat("yyyy-MM-dd'T'HH:mm") : ''
}

const form = useForm({
  title: props.event.title,
  description: props.event.description ?? '',
  location: props.event.location ?? '',
  venueAddress: props.event.venueAddress ?? '',
  coverImageUrl: props.event.coverImageUrl ?? '',
  startsAt: toLocalInput(props.event.startsAt, props.event.timezone),
  endsAt: toLocalInput(props.event.endsAt, props.event.timezone),
  timezone: props.event.timezone,
  status: props.event.status,
  allowPublicRsvp: props.event.allowPublicRsvp,
})

function submit() {
  form
    .transform((data) => ({
      ...data,
      description: data.description || null,
      location: data.location || null,
      venueAddress: data.venueAddress || null,
      coverImageUrl: data.coverImageUrl || null,
      endsAt: data.endsAt || null,
    }))
    .put(`/events/${props.event.id}`)
}
</script>

<template>
  <Head title="Edit event" />

  <div class="page" style="max-width: 760px">
    <div class="page-header">
      <div>
        <h1>Edit event</h1>
      </div>
    </div>

    <form @submit.prevent="submit">
      <EventFields :form="form" />
      <div class="row">
        <button type="submit" class="btn" :disabled="form.processing">Save changes</button>
      </div>
    </form>
  </div>
</template>
