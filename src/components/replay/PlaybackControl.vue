<template>
  <div class="playback-control">
    <el-button-group>
      <el-button :icon="DArrowLeft" title="上一帧 (←)" @click="$emit('prev')" />
      <el-button :type="playing ? 'warning' : 'primary'" :icon="playing ? VideoPause : VideoPlay" @click="$emit('toggle')">
        {{ playing ? '暂停' : '播放' }}
      </el-button>
      <el-button :icon="DArrowRight" title="下一帧 (→)" @click="$emit('next')" />
    </el-button-group>

    <el-select :model-value="speed" class="speed-select" @change="$emit('speed', $event as ReplaySpeed)">
      <el-option v-for="s in speeds" :key="s" :label="`${s}x`" :value="s" />
    </el-select>

    <el-switch
      :model-value="loop"
      inline-prompt
      active-text="循环"
      inactive-text="单次"
      @change="$emit('loop', $event as boolean)"
    />
  </div>
</template>

<script setup lang="ts">
import { DArrowLeft, DArrowRight, VideoPause, VideoPlay } from '@element-plus/icons-vue'
import type { ReplaySpeed } from '@/types/replay'

defineProps<{ playing: boolean; speed: ReplaySpeed; loop: boolean }>()
defineEmits<{
  (e: 'toggle'): void
  (e: 'prev'): void
  (e: 'next'): void
  (e: 'speed', s: ReplaySpeed): void
  (e: 'loop', v: boolean): void
}>()

const speeds: ReplaySpeed[] = [0.5, 1, 2, 4]
</script>

<style scoped>
.playback-control {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.speed-select {
  width: 92px;
}
</style>
