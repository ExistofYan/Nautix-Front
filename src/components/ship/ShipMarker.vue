<template>
  <div class="ship-dom-marker" :style="{ left: x + 'px', top: y + 'px' }" @mouseenter="show = true" @mouseleave="show = false">
    <div class="sm-dot" :class="{ anchor: status === 'anchored' }">
      <el-icon :size="14"><Ship /></el-icon>
    </div>
    <transition name="pop">
      <div v-if="show && hoverable" class="sm-card nx-panel">
        <div class="sm-name">{{ name }}</div>
        <div class="sm-row"><em>航速</em><b>{{ fmt(speed) }} kn</b></div>
        <div class="sm-row"><em>航向</em><b>{{ fmt(heading, 0) }}°</b></div>
        <div class="sm-row"><em>位置</em><b>{{ lat?.toFixed(3) ?? '--' }}, {{ lon?.toFixed(3) ?? '--' }}</b></div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
/** DOM 卡片式船标记：hover 浮出信息小卡（用于 HTML 覆盖层场景） */
import { ref } from 'vue'

withDefaults(defineProps<{
  x?: number
  y?: number
  name?: string
  speed?: number | null
  heading?: number | null
  lat?: number | null
  lon?: number | null
  status?: string
  hoverable?: boolean
}>(), {
  x: 0,
  y: 0,
  name: '船舶',
  status: '',
  hoverable: true,
})

const show = ref(false)
const fmt = (n?: number | null, d = 1) => (n == null || Number.isNaN(n) ? '--' : n.toFixed(d))
</script>

<style scoped>
.ship-dom-marker { position: absolute; transform: translate(-50%, -50%); z-index: 5; }
.sm-dot {
  width: 26px; height: 26px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #06202e; background: linear-gradient(135deg, #38bdf8, #34d399);
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.7);
  cursor: pointer; transition: transform 0.15s ease;
}
.sm-dot:hover { transform: scale(1.15); }
.sm-dot.anchor { background: linear-gradient(135deg, #fbbf24, #f59e0b); box-shadow: 0 0 10px rgba(251, 191, 36, 0.7); }
.sm-card {
  position: absolute; left: 30px; top: -8px;
  min-width: 150px; padding: 10px 12px; border-radius: 10px;
  pointer-events: none;
}
.sm-name { font-size: 12.5px; font-weight: 700; color: #e0f2fe; margin-bottom: 6px; }
.sm-row { display: flex; justify-content: space-between; gap: 12px; font-size: 11px; padding: 1px 0; }
.sm-row em { font-style: normal; color: #64748b; }
.sm-row b { color: #cbd5e1; font-variant-numeric: tabular-nums; }
.pop-enter-active, .pop-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.pop-enter-from, .pop-leave-to { opacity: 0; transform: translateX(-6px); }
</style>
