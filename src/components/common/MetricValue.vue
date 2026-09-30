<template>
  <span class="metric-value">
    <span class="mv-num" :style="valueStyle">{{ text }}</span>
    <span v-if="unit && text !== '--'" class="mv-unit">{{ unit }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    value: number | string | null | undefined
    unit?: string
    precision?: number
    color?: string
  }>(),
  { precision: 1 },
)

const text = computed(() => {
  const v = props.value
  if (v == null || v === '') return '--'
  if (typeof v === 'string') return v
  if (!Number.isFinite(v)) return '--'
  return Number.isInteger(v) ? String(v) : v.toFixed(props.precision)
})

const valueStyle = computed(() => (props.color ? { color: props.color } : {}))
</script>

<style scoped>
.metric-value { display: inline-flex; align-items: baseline; gap: 4px; }
.mv-num {
  font-size: 20px; font-weight: 700; color: #7dd3fc;
  font-variant-numeric: tabular-nums; line-height: 1.1;
}
.mv-unit { font-size: 11px; color: var(--nx-text-dim); }
</style>
