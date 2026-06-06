<script setup lang="ts">
import { DateTime } from 'luxon'
import { Head, router, useForm } from '@inertiajs/vue3'

type Setting = {
  provider: string
  fromEmail: string
  fromName: string | null
  isVerified: boolean
  lastTestedAt: string | null
}
type Config = {
  host: string
  port: number
  secure: boolean
  username: string
  region: string
  accessKeyId: string
  hasSecret: boolean
}

const props = defineProps<{ setting: Setting | null; config: Config | null }>()

const form = useForm({
  provider: props.setting?.provider ?? 'smtp',
  fromEmail: props.setting?.fromEmail ?? '',
  fromName: props.setting?.fromName ?? '',
  host: props.config?.host ?? '',
  port: props.config?.port ?? 587,
  secure: props.config?.secure ?? false,
  username: props.config?.username ?? '',
  password: '',
  apiKey: '',
  region: props.config?.region ?? '',
  accessKeyId: props.config?.accessKeyId ?? '',
  secretAccessKey: '',
})

const secretPlaceholder = props.config?.hasSecret ? '•••••••• (leave blank to keep)' : ''

function save() {
  form.put('/settings/email', { preserveScroll: true })
}

function sendTest() {
  router.post('/settings/email/test', {}, { preserveScroll: true })
}

function formatDate(iso: string | null) {
  return iso ? DateTime.fromISO(iso).toFormat('dd LLL yyyy, t') : null
}
</script>

<template>
  <Head title="Email settings" />

  <div class="page" style="max-width: 680px">
    <div class="page-header">
      <div>
        <h1>Email settings</h1>
        <p>
          Send invitations from your own email provider. Leave this blank to use the system default.
        </p>
      </div>
      <span
        v-if="setting"
        class="badge"
        :class="setting.isVerified ? 'badge-success' : 'badge-warn'"
      >
        {{ setting.isVerified ? 'Verified' : 'Not verified' }}
      </span>
    </div>

    <form @submit.prevent="save">
      <div class="field">
        <label for="provider">Provider</label>
        <select id="provider" v-model="form.provider">
          <option value="smtp">SMTP</option>
          <option value="resend">Resend</option>
          <option value="ses">Amazon SES</option>
        </select>
      </div>

      <div class="form-grid" style="margin-top: 20px">
        <div class="field">
          <label for="fromEmail">From email</label>
          <input
            id="fromEmail"
            v-model="form.fromEmail"
            type="email"
            :data-invalid="form.errors.fromEmail ? 'true' : undefined"
          />
          <div v-if="form.errors.fromEmail">{{ form.errors.fromEmail }}</div>
        </div>
        <div class="field">
          <label for="fromName">From name <span class="muted">(optional)</span></label>
          <input id="fromName" v-model="form.fromName" type="text" />
        </div>
      </div>

      <!-- SMTP -->
      <template v-if="form.provider === 'smtp'">
        <div class="form-grid" style="margin-top: 20px">
          <div class="field">
            <label for="host">SMTP host</label>
            <input
              id="host"
              v-model="form.host"
              type="text"
              :data-invalid="form.errors.host ? 'true' : undefined"
            />
            <div v-if="form.errors.host">{{ form.errors.host }}</div>
          </div>
          <div class="field">
            <label for="port">Port</label>
            <input
              id="port"
              v-model.number="form.port"
              type="number"
              :data-invalid="form.errors.port ? 'true' : undefined"
            />
            <div v-if="form.errors.port">{{ form.errors.port }}</div>
          </div>
        </div>
        <div class="form-grid" style="margin-top: 20px">
          <div class="field">
            <label for="username">Username <span class="muted">(optional)</span></label>
            <input id="username" v-model="form.username" type="text" autocomplete="off" />
          </div>
          <div class="field">
            <label for="password">Password</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              autocomplete="new-password"
              :placeholder="secretPlaceholder"
            />
          </div>
        </div>
        <label class="row" style="margin-top: 16px; font-weight: 400">
          <input v-model="form.secure" type="checkbox" style="width: auto; height: auto" />
          Use TLS/SSL (secure connection)
        </label>
      </template>

      <!-- Resend -->
      <template v-else-if="form.provider === 'resend'">
        <div class="field" style="margin-top: 20px">
          <label for="apiKey">Resend API key</label>
          <input
            id="apiKey"
            v-model="form.apiKey"
            type="password"
            autocomplete="off"
            :placeholder="secretPlaceholder"
            :data-invalid="form.errors.apiKey ? 'true' : undefined"
          />
          <div v-if="form.errors.apiKey">{{ form.errors.apiKey }}</div>
        </div>
      </template>

      <!-- SES -->
      <template v-else-if="form.provider === 'ses'">
        <div class="form-grid" style="margin-top: 20px">
          <div class="field">
            <label for="region">AWS region</label>
            <input
              id="region"
              v-model="form.region"
              type="text"
              placeholder="us-east-1"
              :data-invalid="form.errors.region ? 'true' : undefined"
            />
            <div v-if="form.errors.region">{{ form.errors.region }}</div>
          </div>
          <div class="field">
            <label for="accessKeyId">Access key ID</label>
            <input id="accessKeyId" v-model="form.accessKeyId" type="text" autocomplete="off" />
          </div>
        </div>
        <div class="field" style="margin-top: 20px">
          <label for="secretAccessKey">Secret access key</label>
          <input
            id="secretAccessKey"
            v-model="form.secretAccessKey"
            type="password"
            autocomplete="off"
            :placeholder="secretPlaceholder"
          />
        </div>
      </template>

      <div class="row" style="margin-top: 28px">
        <button type="submit" class="btn" :disabled="form.processing">Save settings</button>
        <button v-if="setting" type="button" class="btn btn-secondary" @click="sendTest">
          Send test email
        </button>
        <span v-if="setting?.lastTestedAt" class="muted">
          Last tested {{ formatDate(setting.lastTestedAt) }}
        </span>
      </div>
    </form>
  </div>
</template>
