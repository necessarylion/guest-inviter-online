<script setup lang="ts">
import { DateTime } from 'luxon'
import { toast } from 'vue-sonner'
import { Head, router, useForm } from '@inertiajs/vue3'
import { Link } from '@adonisjs/inertia/vue'

type Invitation = {
  method: string
  status: string
  url: string
}
type GuestRow = {
  id: number
  name: string
  email: string | null
  phone: string | null
  rsvpStatus: string
  checkedInAt: string | null
  isCheckedIn: boolean
  inviteUrl: string | null
  invitations: Invitation[]
}
type EventData = {
  id: number
  title: string
  status: string
  location: string | null
  startsAt: string | null
  timezone: string
}
type Stats = {
  total: number
  confirmed: number
  declined: number
  checkedIn: number
}

const props = defineProps<{ event: EventData; guests: GuestRow[]; stats: Stats }>()

const guestForm = useForm({ name: '', email: '', phone: '' })

function addGuest() {
  guestForm.post(`/events/${props.event.id}/guests`, {
    preserveScroll: true,
    onSuccess: () => guestForm.reset(),
  })
}

function copyLink(url: string | null) {
  if (!url) return
  navigator.clipboard.writeText(url)
  toast.success('Invite link copied')
}

function sendEmail(guest: GuestRow) {
  router.post(`/events/${props.event.id}/guests/${guest.id}/email`, {}, { preserveScroll: true })
}

function emailAll() {
  router.post(`/events/${props.event.id}/invitations/email-all`, {}, { preserveScroll: true })
}

function removeGuest(guest: GuestRow) {
  if (!confirm(`Remove ${guest.name} from the guest list?`)) return
  router.delete(`/events/${props.event.id}/guests/${guest.id}`, { preserveScroll: true })
}

function deleteEvent() {
  if (!confirm('Delete this event and all its guests? This cannot be undone.')) return
  router.delete(`/events/${props.event.id}`)
}

function formatDate(iso: string | null) {
  return iso
    ? DateTime.fromISO(iso).setZone(props.event.timezone).toFormat('cccc, dd LLL yyyy • t')
    : 'Date TBD'
}

function rsvpClass(status: string) {
  return status === 'confirmed'
    ? 'badge-success'
    : status === 'declined'
      ? 'badge-danger'
      : 'badge-warn'
}
</script>

<template>
  <Head :title="event.title" />

  <div class="page">
    <div class="page-header">
      <div>
        <h1>{{ event.title }}</h1>
        <p>
          {{ formatDate(event.startsAt) }} <span v-if="event.location">· {{ event.location }}</span>
        </p>
      </div>
      <div class="row">
        <Link :href="`/events/${event.id}/scan`" class="btn btn-secondary">Scan check-in</Link>
        <Link :href="`/events/${event.id}/card`" class="btn btn-secondary">Card designer</Link>
        <Link :href="`/events/${event.id}/edit`" class="btn btn-secondary">Edit</Link>
        <button class="btn btn-danger" @click="deleteEvent">Delete</button>
      </div>
    </div>

    <div class="grid grid-4" style="margin-bottom: 28px">
      <div class="stat">
        <div class="num">{{ stats.total }}</div>
        <div class="label">Guests</div>
      </div>
      <div class="stat">
        <div class="num">{{ stats.confirmed }}</div>
        <div class="label">Confirmed</div>
      </div>
      <div class="stat">
        <div class="num">{{ stats.declined }}</div>
        <div class="label">Declined</div>
      </div>
      <div class="stat">
        <div class="num">{{ stats.checkedIn }}</div>
        <div class="label">Checked in</div>
      </div>
    </div>

    <div class="card" style="margin-bottom: 24px">
      <h3 style="margin-bottom: 16px">Add a guest</h3>
      <form @submit.prevent="addGuest">
        <div class="form-grid">
          <div class="field">
            <label for="g-name">Name</label>
            <input
              id="g-name"
              v-model="guestForm.name"
              type="text"
              :data-invalid="guestForm.errors.name ? 'true' : undefined"
            />
            <div v-if="guestForm.errors.name">{{ guestForm.errors.name }}</div>
          </div>
          <div class="field">
            <label for="g-email">Email <span class="muted">(optional)</span></label>
            <input
              id="g-email"
              v-model="guestForm.email"
              type="email"
              :data-invalid="guestForm.errors.email ? 'true' : undefined"
            />
            <div v-if="guestForm.errors.email">{{ guestForm.errors.email }}</div>
          </div>
        </div>
        <div class="form-grid" style="margin-top: 20px; align-items: end">
          <div class="field">
            <label for="g-phone">Phone <span class="muted">(optional)</span></label>
            <input id="g-phone" v-model="guestForm.phone" type="tel" />
          </div>
          <div class="row">
            <button type="submit" class="btn" :disabled="guestForm.processing">Add guest</button>
          </div>
        </div>
      </form>
    </div>

    <div class="page-header" style="margin-bottom: 14px">
      <h3>Guest list</h3>
      <button class="btn btn-secondary" @click="emailAll">Email all invitations</button>
    </div>

    <table v-if="guests.length" class="table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Contact</th>
          <th>RSVP</th>
          <th>Entry</th>
          <th style="text-align: right">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="guest in guests" :key="guest.id">
          <td>{{ guest.name }}</td>
          <td>
            <div>{{ guest.email || '—' }}</div>
            <div v-if="guest.phone" class="muted">{{ guest.phone }}</div>
          </td>
          <td>
            <span class="badge" :class="rsvpClass(guest.rsvpStatus)">{{ guest.rsvpStatus }}</span>
          </td>
          <td>
            <span v-if="guest.isCheckedIn" class="badge badge-success">Checked in</span>
            <span v-else class="badge">Not yet</span>
          </td>
          <td>
            <div class="row" style="justify-content: flex-end">
              <button class="btn btn-secondary btn-sm" @click="copyLink(guest.inviteUrl)">
                Copy link
              </button>
              <a
                class="btn btn-secondary btn-sm"
                :href="`/events/${event.id}/guests/${guest.id}/card.pdf`"
                target="_blank"
              >
                Card PDF
              </a>
              <button v-if="guest.email" class="btn btn-secondary btn-sm" @click="sendEmail(guest)">
                Email
              </button>
              <button class="btn btn-danger btn-sm" @click="removeGuest(guest)">Remove</button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-else class="card" style="text-align: center; padding: 40px">
      <p class="muted">No guests yet. Add your first guest above.</p>
    </div>
  </div>
</template>
