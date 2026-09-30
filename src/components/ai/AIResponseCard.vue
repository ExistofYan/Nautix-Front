<template>
  <div class="ai-response" :class="{ mine }">
    <div class="avatar"><el-icon><component :is="mine ? User : MagicStick" /></el-icon></div>
    <div class="bubble">
      <p class="text">{{ text }}</p>
      <div v-if="insights.length" class="tags">
        <span v-for="t in insights" :key="t" class="tag"><el-icon size="11"><View /></el-icon>{{ t }}</span>
      </div>
      <time>{{ timeText }}</time>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { User, MagicStick, View } from '@element-plus/icons-vue'

const props = withDefaults(defineProps<{
  text: string
  mine?: boolean
  at?: number | string
  insights?: string[]
}>(), {
  mine: false,
  insights: () => [],
})

const timeText = computed(() => {
  if (props.at == null) return ''
  const d = new Date(props.at)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString('zh-CN', { hour12: false })
})
</script>

<style scoped>
.ai-response { display: flex; gap: 10px; margin-bottom: 14px; }
.ai-response.mine { flex-direction: row-reverse; }
.avatar { flex: none; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #e0f2fe; background: linear-gradient(135deg, #0ea5e9, #7c3aed); font-size: 15px; }
.mine .avatar { background: linear-gradient(135deg, #334155, #475569); }
.bubble { max-width: 78%; background: rgba(13, 31, 49, 0.85); border: 1px solid var(--nx-panel-border); border-radius: 12px; padding: 10px 13px; }
.mine .bubble { background: rgba(37, 99, 235, 0.22); border-color: rgba(125, 211, 252, 0.3); }
.text { margin: 0; white-space: pre-wrap; word-break: break-word; color: var(--nx-text); font-size: 13px; line-height: 1.65; }
.tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.tag { display: inline-flex; align-items: center; gap: 4px; font-size: 10.5px; color: #a78bfa; background: rgba(124, 58, 237, 0.14); border: 1px solid rgba(167, 139, 250, 0.3); padding: 2px 8px; border-radius: 999px; }
time { display: block; margin-top: 6px; font-size: 10px; color: #64748b; }
</style>
