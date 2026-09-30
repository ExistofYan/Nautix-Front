<template>
  <div class="gsc nx-panel">
    <div class="globe-wrap">
      <svg viewBox="0 0 120 120" class="globe">
        <defs>
          <radialGradient id="gsc-g" cx="35%" cy="30%" r="80%">
            <stop offset="0%" stop-color="rgba(56,189,248,.35)" />
            <stop offset="70%" stop-color="rgba(37,99,235,.12)" />
            <stop offset="100%" stop-color="transparent" />
          </radialGradient>
        </defs>
        <circle cx="60" cy="60" r="52" fill="url(#gsc-g)" stroke="rgba(125,211,252,.35)" stroke-width="1" />
        <ellipse cx="60" cy="60" rx="52" ry="18" fill="none" stroke="rgba(125,211,252,.22)" />
        <ellipse cx="60" cy="60" rx="52" ry="36" fill="none" stroke="rgba(125,211,252,.16)" />
        <ellipse cx="60" cy="60" rx="18" ry="52" fill="none" stroke="rgba(125,211,252,.22)" />
        <ellipse cx="60" cy="60" rx="36" ry="52" fill="none" stroke="rgba(125,211,252,.16)" />
        <line x1="8" y1="60" x2="112" y2="60" stroke="rgba(125,211,252,.28)" />
        <circle v-for="(d, i) in dots" :key="i" :cx="d.x" :cy="d.y" r="2.2" fill="#7dd3fc">
          <animate attributeName="opacity" values="1;.2;1" :dur="`${2 + (i % 3)}s`" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
    <div class="body">
      <div class="label">全球在航船舶</div>
      <div class="big"><span>{{ shown }}</span><em>艘</em></div>
      <div class="badges">
        <el-tag v-for="s in store.statusDist.slice(0, 4)" :key="s.status" size="small" effect="plain" round>
          {{ s.status }} × {{ s.count }}
        </el-tag>
        <span v-if="store.statusDist.length === 0" class="dim">暂无状态数据</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue'
import { useCommandStore } from '@/stores/command'

/** 地球意象统计卡：SVG 经纬球 + 船数 count-up + 航行状态徽章。 */
const store = useCommandStore()
const shown = ref(0)
let raf = 0

watch(
  () => store.runtime.length,
  (to) => {
    const from = shown.value
    if (from === to) return
    const t0 = performance.now()
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / 800)
      shown.value = Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3)))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    cancelAnimationFrame(raf)
    raf = requestAnimationFrame(step)
  },
  { immediate: true }
)

/** 装饰性闪烁点（固定伪随机分布，避免每次渲染跳动）。 */
const dots = Array.from({ length: 9 }, (_, i) => {
  const a = (i * 137.5 * Math.PI) / 180
  const r = 14 + (i % 4) * 10
  return { x: 60 + Math.cos(a) * r, y: 60 + Math.sin(a) * r * 0.8 }
})

onUnmounted(() => cancelAnimationFrame(raf))
</script>

<style scoped>
.gsc { display: flex; align-items: center; gap: 18px; padding: 18px; border-radius: 14px; }
.globe-wrap { width: 120px; height: 120px; flex: none; }
.globe { width: 100%; height: 100%; filter: drop-shadow(0 0 14px rgba(56,189,248,.25)); }
.body { min-width: 0; }
.label { font-size: 12.5px; color: var(--nx-text-dim); letter-spacing: 1px; margin-bottom: 6px; }
.big { display: flex; align-items: baseline; gap: 6px; }
.big span { font-size: 38px; font-weight: 800; color: #f1f5f9; font-variant-numeric: tabular-nums; line-height: 1; background: linear-gradient(120deg, #7dd3fc, #a78bfa); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
.big em { font-style: normal; font-size: 13px; color: #64748b; }
.badges { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.dim { color: #64748b; font-size: 12px; }
</style>
