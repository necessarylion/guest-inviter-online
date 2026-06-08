<script setup lang="ts">
type Placement = 'top' | 'bottom' | 'left' | 'right'

withDefaults(
  defineProps<{
    /** Tooltip text. When empty, only the trigger renders. */
    label?: string
    placement?: Placement
    /** Stretch the wrapper (and trigger) to full width. */
    block?: boolean
  }>(),
  {
    label: '',
    placement: 'top',
    block: false,
  }
)
</script>

<template>
  <span class="tooltip-wrap" :class="{ 'tooltip-block': block }">
    <slot />
    <span v-if="label" class="tooltip" :class="`tooltip-${placement}`" role="tooltip">
      {{ label }}
    </span>
  </span>
</template>

<style scoped>
.tooltip-wrap {
  position: relative;
  display: inline-flex;
}

.tooltip-block {
  display: flex;
  width: 100%;
}
.tooltip-block > :slotted(*) {
  width: 100%;
}

.tooltip {
  position: absolute;
  z-index: 50;
  white-space: nowrap;
  border-radius: 0.5rem;
  background: var(--ink);
  padding: 0.3rem 0.55rem;
  font-size: 0.72rem;
  font-weight: 600;
  line-height: 1;
  color: var(--bg);
  box-shadow: var(--shadow-card);
  opacity: 0;
  pointer-events: none;
  transition:
    opacity 0.14s ease,
    transform 0.14s ease;
}

/* show on hover or keyboard focus of anything inside the wrapper */
.tooltip-wrap:hover .tooltip,
.tooltip-wrap:focus-within .tooltip {
  opacity: 1;
}

/* placements: rest at a small offset, slide into place when shown */
.tooltip-top {
  bottom: calc(100% + 0.4rem);
  left: 50%;
  transform: translate(-50%, 0.2rem);
}
.tooltip-bottom {
  top: calc(100% + 0.4rem);
  left: 50%;
  transform: translate(-50%, -0.2rem);
}
.tooltip-left {
  right: calc(100% + 0.4rem);
  top: 50%;
  transform: translate(0.2rem, -50%);
}
.tooltip-right {
  left: calc(100% + 0.4rem);
  top: 50%;
  transform: translate(-0.2rem, -50%);
}

.tooltip-wrap:hover .tooltip-top,
.tooltip-wrap:focus-within .tooltip-top,
.tooltip-wrap:hover .tooltip-bottom,
.tooltip-wrap:focus-within .tooltip-bottom {
  transform: translate(-50%, 0);
}
.tooltip-wrap:hover .tooltip-left,
.tooltip-wrap:focus-within .tooltip-left,
.tooltip-wrap:hover .tooltip-right,
.tooltip-wrap:focus-within .tooltip-right {
  transform: translate(0, -50%);
}
</style>
