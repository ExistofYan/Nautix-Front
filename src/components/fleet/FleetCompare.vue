<template>
  <div class="fleet-compare nx-panel">
    <div class="head">
      <span class="title"><el-icon><DataAnalysis /></el-icon> 船队横向对比</span>
      <el-checkbox-group v-model="picked" :max="4">
        <el-checkbox v-for="f in fleets" :key="f.company" :value="f.company" border size="small">
          {{ f.company }}
        </el-checkbox>
      </el-checkbox-group>
    </div>

    <div v-show="picked.length >= 2" ref="el" class="radar" />
    <el-empty v-if="picked.length < 2" description="勾选 2-4 家船队开始对比" :image-size="70" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useChart, chartTheme } from '@/hooks/useChart'
import type { Fleet } from '@/types/fleet'

const props = defineProps<{ fleets: Fleet[] }>()

const el = ref<HTMLElement>()
const picked = ref<string[]>([])
const { setOption } = useChart(el)

/** 各维归一化到 0-100 */
function render() {
  const chosen = props.fleets.filter(f => picked.value.includes(f.company))
  if (chosen.length < 2) return
  const maxCount = Math.max(...props.fleets.map(f => f.memberCount), 1)
  const dims: { name: string; get: (f: Fleet) => number | null }[] = [
    { name: '船数', get: f => f.memberCount / maxCount * 100 },
    { name: '平均航速', get: f => f.avgSpeed != null ? Math.min(f.avgSpeed / 25 * 100, 100) : null },
    { name: '年轻度', get: f => f.avgShipAge != null ? Math.max(0, 100 - f.avgShipAge * 3) : null },
    { name: '主机负荷', get: f => f.avgEngineLoad != null ? Math.min(f.avgEngineLoad, 100) : null },
    { name: '平均油量', get: f => f.avgFuel != null ? Math.min(f.avgFuel, 100) : null },
  ]
  setOption({
    backgroundColor: 'transparent',
    textStyle: { color: chartTheme.textStyle.color },
    tooltip: {},
    legend: { bottom: 0, textStyle: { color: '#94a3b8', fontSize: 11 }, data: chosen.map(f => f.company) },
    radar: {
      indicator: dims.map(d => ({ name: d.name, max: 100 })),
      axisName: { color: '#a8bdd9', fontSize: 11 },
      splitLine: { lineStyle: { color: chartTheme.splitLine } },
      splitArea: { areaStyle: { color: ['rgba(56,189,248,0.03)', 'transparent'] } },
      axisLine: { lineStyle: { color: chartTheme.axisLine } },
    },
    series: [{
      type: 'radar',
      symbolSize: 4,
      data: chosen.map((f, i) => ({
        name: f.company,
        value: dims.map(d => {
          const v = d.get(f)
          return v == null ? 0 : Number(v.toFixed(1))
        }),
        lineStyle: { color: chartTheme.palette[i % chartTheme.palette.length] },
        itemStyle: { color: chartTheme.palette[i % chartTheme.palette.length] },
        areaStyle: { opacity: 0.12 },
      })),
    }],
  })
}

watch(picked, render)
watch(() => props.fleets, () => {
  if (picked.value.length === 0 && props.fleets.length >= 2) {
    picked.value = props.fleets.slice(0, 3).map(f => f.company)
    render()
  }
}, { immediate: true })
</script>

<style scoped>
.fleet-compare { border-radius: 14px; padding: 16px 18px; display: flex; flex-direction: column; gap: 12px; }
.head { display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap; }
.title { font-size: 13px; font-weight: 700; color: #a8bdd9; letter-spacing: 1px; display: inline-flex; align-items: center; gap: 8px; }
.radar { height: 380px; width: 100%; }
</style>
