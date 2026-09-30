<template>
  <div class="fleet-card nx-panel" @click="$emit('select', fleet.company)">
    <div class="fc-head">
      <span class="fc-name">{{ fleet.company }}</span>
      <el-badge :value="fleet.memberCount" type="primary" class="fc-badge" />
    </div>

    <div v-if="typeBars.length" class="type-bar" :title="typeBars.map(t => `${t.name} ${t.count}`).join(' / ')">
      <span
        v-for="(t, i) in typeBars"
        :key="t.name"
        class="seg"
        :style="{ width: t.pct + '%', background: palette[i % palette.length] }"
      />
    </div>
    <div class="type-legend">
      <span v-for="(t, i) in typeBars.slice(0, 3)" :key="t.name" class="lg-item">
        <i :style="{ background: palette[i % palette.length] }" />{{ t.name }}
      </span>
    </div>

    <div class="fc-metrics">
      <div class="m"><em>平均航速</em><b>{{ fmt(fleet.avgSpeed) }} kn</b></div>
      <div class="m"><em>平均油量</em><b>{{ fmt(fleet.avgFuel, 0) }}%</b></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Fleet } from '@/types/fleet'

const props = defineProps<{ fleet: Fleet }>()
defineEmits<{ (e: 'select', company: string): void }>()

const palette = ['#38bdf8', '#a78bfa', '#34d399', '#fbbf24', '#f472b6', '#22d3ee']

const typeBars = computed(() => {
  const counts = new Map<string, number>()
  for (const s of props.fleet.ships) {
    const key = s.shipType?.trim() || '未知船型'
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  const total = props.fleet.memberCount || 1
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count, pct: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count)
})

const fmt = (n: number | null, d = 1) => (n == null ? '--' : n.toFixed(d))
</script>

<style scoped>
.fleet-card {
  border-radius: 14px;
  padding: 16px 18px;
  cursor: pointer;
  transition: all .2s ease;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.fleet-card:hover { transform: translateY(-3px); box-shadow: 0 10px 26px rgba(37, 99, 235, .3); border-color: rgba(125, 211, 252, .4); }
.fc-head { display: flex; justify-content: space-between; align-items: center; }
.fc-name { font-size: 15px; font-weight: 800; color: #f1f5f9; letter-spacing: .3px; }
.type-bar { display: flex; height: 8px; border-radius: 6px; overflow: hidden; background: rgba(148, 184, 232, .1); }
.seg { height: 100%; }
.type-legend { display: flex; gap: 12px; flex-wrap: wrap; }
.lg-item { display: inline-flex; align-items: center; gap: 5px; color: #64748b; font-size: 11.5px; }
.lg-item i { width: 8px; height: 8px; border-radius: 2px; display: inline-block; }
.fc-metrics { display: flex; gap: 26px; }
.m { display: flex; flex-direction: column; gap: 3px; }
.m em { font-style: normal; color: #64748b; font-size: 11.5px; }
.m b { color: #7dd3fc; font-family: 'JetBrains Mono', Consolas, monospace; font-size: 15px; }
</style>
