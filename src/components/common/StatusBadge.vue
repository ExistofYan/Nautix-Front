<template>
  <el-tag :type="tagType" size="small" effect="dark" round class="status-badge">
    <span class="dot" :class="'dot-' + tagType"></span>{{ label }}
  </el-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    /** 状态原文：normal/sailing/航行、warning/警告、danger/critical/危险、offline/停泊 等 */
    status?: string | null
    /** 可选覆盖文案 */
    label?: string
  }>(),
  { status: '', label: '' },
)

type TagType = 'success' | 'warning' | 'danger' | 'info'

const RULES: Array<[RegExp, TagType]> = [
  [/^(normal|ok|online|sailing|running|active|良好|正常|在线|航行)/i, 'success'],
  [/^(warn|caution|idle|standby|注意|警告|待机)/i, 'warning'],
  [/^(danger|critical|error|fault|alarm|危险|告警|故障|异常)/i, 'danger'],
  [/^(offline|moored|stopped|maintenance|停|离线|维护|停泊)/i, 'info'],
]

const tagType = computed<TagType>(() => {
  const s = (props.status || '').trim()
  for (const [re, t] of RULES) if (re.test(s)) return t
  return 'info'
})

const label = computed(() => props.label || props.status || '未知')
</script>

<style scoped>
.status-badge .dot {
  display: inline-block; width: 6px; height: 6px; border-radius: 50%;
  margin-right: 6px; vertical-align: middle; background: currentColor;
}
</style>
