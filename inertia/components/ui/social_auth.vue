<script setup lang="ts">
/*
 * Social sign-in buttons (Google via Firebase). The button opens the Firebase
 * Google popup, then posts the resulting ID token to the `session.google` route
 * which verifies it and starts the session. Hidden unless the server shares a
 * Firebase web config (see inertia_middleware). The `dividerLabel` shows the
 * "or continue with email" separator beneath the buttons.
 */
import { ref } from 'vue'
import { router, usePage } from '@inertiajs/vue3'
import { toast } from 'vue-sonner'
import type { Data } from '@generated/data'
import { signInWithGoogle } from '~/lib/firebase'

withDefaults(defineProps<{ dividerLabel?: string }>(), {
  dividerLabel: 'or continue with email',
})

const page = usePage<Data.SharedProps>()
const loading = ref(false)

async function continueWithGoogle() {
  const config = page.props.firebase
  if (!config || loading.value) return

  loading.value = true
  try {
    const idToken = await signInWithGoogle(config)
    router.post('/auth/google', { idToken }, { onFinish: () => (loading.value = false) })
  } catch (error: any) {
    loading.value = false
    // The user closing the popup isn't an error worth surfacing.
    if (
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request'
    )
      return
    toast.error('Google sign-in failed. Please try again.')
  }
}
</script>

<template>
  <div v-if="page.props.firebase">
    <div class="grid gap-2.5">
      <button type="button" class="social-btn" :disabled="loading" @click="continueWithGoogle">
        <i :class="['pi', loading ? 'pi-spin pi-spinner' : 'pi-google text-[#ea4335]']" />
        Continue with Google
      </button>
    </div>

    <div class="my-5.5 flex items-center gap-3.5 text-[13px] text-muted">
      <span class="h-px flex-1 bg-line" />
      {{ dividerLabel }}
      <span class="h-px flex-1 bg-line" />
    </div>
  </div>
</template>

<style scoped>
.social-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 10px 14px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: var(--bg);
  color: var(--ink);
  cursor: pointer;
  transition: 0.18s;
}
.social-btn:hover {
  background: var(--bg-2);
  border-color: var(--slate-300);
}
.social-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
.social-btn i {
  font-size: 16px;
}
</style>
