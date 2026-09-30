<template>
  <div class="mini-panel">
    <span v-if="label" class="mp-label">{{ label }}</span>
    <span class="mp-value" :style="{ color: toneColor }">{{ valueText }}</span>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  label?: string
  value?: number | string | null
  unit?: string
  tone?: 'cyan' | 'violet' | 'green' | 'amber' | 'red'
}>(), {
  tone: 'cyan',
})

const TONES: Record<string, string> = {
  cyan: '#7dd3fc', violet: '#a78bfa', green: '#34d399', amber: '#fbbf24', red: '#fb7185',
}
const toneColor = computed(() => TONES[props.tone] ?? TONES.cyan)
const valueText = computed(() => {
  if (props.value == null || props.value === '') return '--'
  return `${props.value}${props.unit ? ' ' + props.unit : ''}`
})
</script>

<style scoped>
.mini-panel {
  display: inline-flex; align-items: baseline; gap: 8px;
  padding: 8px 12px;
  background: rgba(9, 17, 35, 0.6);
  border: 1px solid var(--nx-panel-border);
  border-radius: 10px;
}
.mp-label { font-size: 11px; color: var(--nx-text-dim); }
.mp-value { font-size: 16px; font-weight: 800; font-family: 'JetBrains Mono', Consolas, monospace; }
</style>
