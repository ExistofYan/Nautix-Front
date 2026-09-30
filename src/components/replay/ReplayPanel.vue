<template>
  <div class="replay-panel nx-panel">
    <div class="panel-title"><el-icon><Position /></el-icon> 当前帧</div>
    <dl v-if="frame" class="kv">
      <div class="row"><dt>经度</dt><dd>{{ frame.longitude.toFixed(5) }}°E</dd></div>
      <div class="row"><dt>纬度</dt><dd>{{ frame.latitude.toFixed(5) }}°N</dd></div>
      <div class="row"><dt>途经点</dt><dd>#{{ frame.pointOrder }}</dd></div>
      <div class="row"><dt>帧序</dt><dd>{{ index + 1 }} / {{ total }}</dd></div>
      <div class="row"><dt>倍速</dt><dd class="accent">{{ speed }}x</dd></div>
      <div class="row"><dt>状态</dt><dd :class="playing ? 'playing' : ''">{{ playing ? '播放中' : '已暂停' }}</dd></div>
    </dl>
    <el-empty v-else description="加载航线后查看" :image-size="48" />
  </div>
</template>

<script setup lang="ts">
import type { ReplayFrame, ReplaySpeed } from '@/types/replay'

defineProps<{
  frame: ReplayFrame | null
  index: number
  total: number
  speed: ReplaySpeed
  playing: boolean
}>()
</script>

<style scoped>
.replay-panel {
  border-radius: 14px;
  padding: 16px 18px;
}
.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  color: #a8bdd9;
  letter-spacing: 1px;
  margin-bottom: 12px;
}
.kv {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 9px;
}
.row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  border-bottom: 1px dashed rgba(56, 189, 248, 0.1);
  padding-bottom: 7px;
}
.row:last-child { border-bottom: none; padding-bottom: 0; }
dt { color: #64748b; font-size: 12px; }
dd {
  margin: 0;
  color: #e2e8f0;
  font-family: 'JetBrains Mono', Consolas, monospace;
  font-size: 13px;
}
.accent { color: #7dd3fc; }
.playing { color: #34d399; }
</style>
