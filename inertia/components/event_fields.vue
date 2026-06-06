<script setup lang="ts">
/*
 * This component renders fields bound to a shared Inertia `useForm` instance
 * passed in by the parent (create/edit pages), so it intentionally writes to the
 * form prop — the parent owns the form and reads the values back on submit.
 */
/* eslint-disable vue/no-mutating-props */
import type { InertiaForm } from '@inertiajs/vue3'

interface EventFormData {
  title: string
  description: string
  location: string
  venueAddress: string
  coverImageUrl: string
  startsAt: string
  endsAt: string
  timezone: string
  status: string
  allowPublicRsvp: boolean
}

defineProps<{ form: InertiaForm<EventFormData> }>()
</script>

<template>
  <div class="field">
    <label for="title">Event title</label>
    <input
      id="title"
      v-model="form.title"
      type="text"
      :data-invalid="form.errors.title ? 'true' : undefined"
    />
    <div v-if="form.errors.title">{{ form.errors.title }}</div>
  </div>

  <div class="field">
    <label for="description">Description</label>
    <textarea id="description" v-model="form.description" />
    <div v-if="form.errors.description">{{ form.errors.description }}</div>
  </div>

  <div class="form-grid">
    <div class="field">
      <label for="startsAt">Starts at</label>
      <input
        id="startsAt"
        v-model="form.startsAt"
        type="datetime-local"
        :data-invalid="form.errors.startsAt ? 'true' : undefined"
      />
      <div v-if="form.errors.startsAt">{{ form.errors.startsAt }}</div>
    </div>
    <div class="field">
      <label for="endsAt">Ends at <span class="muted">(optional)</span></label>
      <input id="endsAt" v-model="form.endsAt" type="datetime-local" />
      <div v-if="form.errors.endsAt">{{ form.errors.endsAt }}</div>
    </div>
  </div>

  <div class="form-grid">
    <div class="field">
      <label for="location">Location name <span class="muted">(optional)</span></label>
      <input id="location" v-model="form.location" type="text" />
    </div>
    <div class="field">
      <label for="timezone">Timezone</label>
      <input id="timezone" v-model="form.timezone" type="text" />
    </div>
  </div>

  <div class="field">
    <label for="venueAddress">Venue address <span class="muted">(optional)</span></label>
    <input id="venueAddress" v-model="form.venueAddress" type="text" />
  </div>

  <div class="field">
    <label for="coverImageUrl">Cover image URL <span class="muted">(optional)</span></label>
    <input
      id="coverImageUrl"
      v-model="form.coverImageUrl"
      type="url"
      :data-invalid="form.errors.coverImageUrl ? 'true' : undefined"
    />
    <div v-if="form.errors.coverImageUrl">{{ form.errors.coverImageUrl }}</div>
  </div>

  <div class="form-grid">
    <div class="field">
      <label for="status">Status</label>
      <select id="status" v-model="form.status">
        <option value="draft">Draft</option>
        <option value="published">Published</option>
      </select>
    </div>
    <div class="field">
      <label>Public RSVP</label>
      <label class="row" style="font-weight: 400">
        <input v-model="form.allowPublicRsvp" type="checkbox" style="width: auto; height: auto" />
        Allow guests to RSVP from the invite link
      </label>
    </div>
  </div>
</template>
