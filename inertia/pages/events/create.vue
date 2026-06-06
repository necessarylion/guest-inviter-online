<script setup lang="ts">
import { Head, useForm } from '@inertiajs/vue3'
import EventFields from '~/components/event_fields.vue'

const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

const form = useForm({
  title: '',
  description: '',
  location: '',
  venueAddress: '',
  coverImageUrl: '',
  startsAt: '',
  endsAt: '',
  timezone,
  status: 'draft',
  allowPublicRsvp: true,
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
    .post('/events')
}
</script>

<template>
  <Head title="Create event" />

  <div class="page" style="max-width: 760px">
    <div class="page-header">
      <div>
        <h1>Create event</h1>
        <p>Set up your event, then add guests and send invitations.</p>
      </div>
    </div>

    <form @submit.prevent="submit">
      <EventFields :form="form" />
      <div class="row">
        <button type="submit" class="btn" :disabled="form.processing">Create event</button>
      </div>
    </form>
  </div>
</template>
