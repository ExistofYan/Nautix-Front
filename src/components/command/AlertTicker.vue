<template>
  <div class="ticker" :class="{ idle: items.length === 0 }">
    <span class="tag"><el-icon><Bell /></el-icon>&nbsp;实时告警</span>
    <div v-if="items.length === 0" class="empty">当前无待处理告警 · ALL CLEAR</div>
    <div v-else class="viewport">
      <div class="track">
        <span v-for="(it, i) in doubled" :key="i" class="item" :class="'lv-' + it.levelKey">
          <i class="lvl-dot"></i>
          <b>{{ it.shipName }}</b>
          <em>{{ it.ruleName }}</em>
          <span class="val">{{ fmt(it.triggerValue) }}</span>
          <time>{{ shortTime(it.alertTime) }}</time>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCommandStore } from '@/stores/command'

/** 最新告警横向无缝滚动条（CSS marquee，列表复制两份实现首尾相接）。 */
const store = useCommandStore()
const items = computed(() => store.tickerItems)
const doubled = computed(() => [...items.value, ...items.value])

function fmt(v?: number | null) {
  return v == null || Number.isNaN(Number(v)) ? '--' : Number(v).toFixed(1)
}
function shortTime(t?: string) {
  if (!t) return ''
  const d = new Date(t)
  return Number.isFinite(d.getTime())
    ? d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
    : ''
}
</script>

<style scoped>
.ticker {
  display: flex; align-items: center; gap: 14px;
  padding: 10px 16px;
  border-radius: 12px;
  background: linear-gradient(90deg, rgba(251, 113, 133, 0.12), rgba(13, 26, 51, 0.72) 30%);
  border: 1px solid rgba(251, 113, 133, 0.22);
  overflow: hidden;
}
.ticker.idle { background: rgba(13, 26, 51, 0.72); border-color: rgba(52, 211, 153, 0.25); }
.tag { flex: none; display: inline-flex; align-items: center; font-size: 12.5px; font-weight: 700; color: #fb7185; letter-spacing: 1px; }
.idle .tag { color: #34d399; }
.empty { color: #a8bdd9; font-size: 13px; }
.viewport { flex: 1; min-width: 0; overflow: hidden; }
.track { display: inline-flex; gap: 34px; white-space: nowrap; animation: marquee 28s linear infinite; will-change: transform; }
.viewport:hover .track { animation-play-state: paused; }
@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
.item { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; color: #cbd5e1; }
.lvl-dot { width: 8px; height: 8px; border-radius: 50%; flex: none; }
.lv-critical .lvl-dot { background: #fb7185; box-shadow: 0 0 8px rgba(251, 113, 133, 0.9); }
.lv-warning .lvl-dot { background: #fbbf24; }
.lv-info .lvl-dot { background: #38bdf8; }
.item b { color: #f1f5f9; }
.item em { font-style: normal; color: #94a3b8; }
.val { font-family: Consolas, monospace; color: #fca5a5; }
.time { color: #64748b; font-size: 12px; }
</style>
