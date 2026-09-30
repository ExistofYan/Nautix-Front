<template>
  <div class="query-input">
    <el-input
      v-model="text"
      :placeholder="placeholder"
      size="large"
      round
      clearable
      :loading="busy"
      @keyup.enter="submit"
    >
      <template #prefix><el-icon color="#7dd3fc"><MagicStick /></el-icon></template>
      <template #append>
        <el-button :disabled="!text.trim() || busy" @click="submit">提问</el-button>
      </template>
    </el-input>

    <div v-if="suggestions.length" class="chips">
      <button v-for="s in suggestions" :key="s" class="chip" @click="pick(s)">{{ s }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  placeholder?: string
  suggestions?: string[]
  busy?: boolean
  modelValue?: string
}>(), {
  placeholder: '向 Nautix AI 提问，例如：哪条航线的告警最多？',
  suggestions: () => [],
  busy: false,
  modelValue: '',
})

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void
  (e: 'query', v: string): void
}>()

const text = ref(props.modelValue)
watch(text, v => emit('update:modelValue', v))

function submit() {
  const q = text.value.trim()
  if (!q || props.busy) return
  emit('query', q)
}

function pick(s: string) {
  text.value = s
  emit('query', s)
}
</script>

<style scoped>
.query-input { display: flex; flex-direction: column; gap: 10px; }
.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.chip { border: 1px solid rgba(125, 211, 252, 0.3); background: rgba(13, 31, 49, 0.65); color: var(--nx-text-dim); font-size: 12px; padding: 5px 12px; border-radius: 999px; cursor: pointer; transition: all 0.15s ease; }
.chip:hover { color: #7dd3fc; border-color: rgba(125, 211, 252, 0.6); box-shadow: 0 0 10px rgba(56, 189, 248, 0.2); }
</style>
