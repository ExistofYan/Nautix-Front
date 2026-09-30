<template>
  <div class="timeline-slider">
    <span class="time-label">{{ fmt(modelValue) }}</span>
    <el-slider
      :model-value="modelValue"
      :max="max"
      :show-tooltip="false"
      class="slider"
      @input="onInput"
      @change="onChange"
    />
    <span class="time-label total">{{ fmt(max) }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{ modelValue: number; max: number }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: number): void }>()

/** 帧序号 → mm:ss（按 1x 每帧约 0.9s 估算） */
function fmt(index: number): string {
  const totalSec = Math.round(Math.max(index, 0) * 0.9)
  const m = String(Math.floor(totalSec / 60)).padStart(2, '0')
  const s = String(totalSec % 60).padStart(2, '0')
  return `${m}:${s}`
}

function onInput(v: number | number[]) {
  if (typeof v === 'number') emit('update:modelValue', v)
}

function onChange(v: number | number[]) {
  if (typeof v === 'number') emit('update:modelValue', v)
}
</script>

<style scoped>
.timeline-slider {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
}
.slider {
  flex: 1;
}
.time-label {
  font-family: 'JetBrains Mono', Consolas, monospace;
  font-size: 12.5px;
  color: #7dd3fc;
  min-width: 44px;
  text-align: center;
}
.time-label.total {
  color: #64748b;
}
</style>
