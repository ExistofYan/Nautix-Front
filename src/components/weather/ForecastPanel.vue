<template>
  <div class="forecast-panel nx-panel">
    <div class="fp-head">
      <span class="fp-title"><el-icon><Sunrise /></el-icon> 全球海域天气带</span>
      <el-button size="small" text :loading="loading" @click="load">
        <el-icon><Refresh /></el-icon>刷新
      </el-button>
    </div>

    <el-skeleton v-if="loading && regions.length === 0" animated :rows="3" />
    <el-empty v-else-if="regions.length === 0" :image-size="60" description="暂无天气数据" />

    <el-scrollbar v-else>
      <div class="fp-track">
        <div
          v-for="r in regions"
          :key="r.id"
          class="fp-item"
          :class="{ active: r.id === current?.id }"
          @click="current = r"
        >
          <div class="fp-name">{{ r.regionName || `区域 ${r.id}` }}</div>
          <div class="fp-temp">{{ fmt(r.airTemperature) }}° / {{ fmt(r.seaTemperature) }}°</div>
          <div class="fp-wind">
            <el-icon :size="12"><WindPower /></el-icon>
            {{ fmt(r.windSpeed, 0) }} m/s · {{ fmt(r.waveHeight, 1) }}m 浪
          </div>
        </div>
      </div>
    </el-scrollbar>

    <transition name="fade">
      <div v-if="current" class="fp-detail">
        <WeatherCard :region="current" />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
/** 多区域横向滚动预报带：/weather 全量 → 迷你条带 + 选中展开 WeatherCard */
import { onMounted, ref } from 'vue'
import type { WeatherRegion } from '@/api/types'
import { getAllWeatherRegions } from '@/api/weather'
import WeatherCard from './WeatherCard.vue'

const regions = ref<WeatherRegion[]>([])
const current = ref<WeatherRegion | null>(null)
const loading = ref(false)

const fmt = (n?: number | null, d = 1) => (n == null || Number.isNaN(n) ? '--' : n.toFixed(d))

async function load() {
  loading.value = true
  try {
    const data = await getAllWeatherRegions()
    regions.value = Array.isArray(data) ? data : []
    if (!current.value && regions.value.length) current.value = regions.value[0]
  } catch {
    regions.value = []
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.forecast-panel { padding: 14px 16px; border-radius: 14px; }
.fp-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.fp-title { display: flex; align-items: center; gap: 6px; font-size: 13.5px; font-weight: 700; color: #e2e8f0; }
.fp-title .el-icon { color: #fbbf24; }
.fp-track { display: flex; gap: 10px; padding: 4px 2px 10px; white-space: nowrap; }
.fp-item {
  min-width: 148px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(13, 31, 49, 0.65);
  border: 1px solid rgba(56, 189, 248, 0.12);
  cursor: pointer;
  transition: all 0.18s ease;
}
.fp-item:hover { border-color: rgba(125, 211, 252, 0.5); transform: translateY(-2px); }
.fp-item.active { border-color: #38bdf8; box-shadow: 0 0 14px rgba(56, 189, 248, 0.25); }
.fp-name { font-size: 12.5px; font-weight: 700; color: #e0f2fe; margin-bottom: 4px; }
.fp-temp { font-size: 15px; font-weight: 800; color: #7dd3fc; font-variant-numeric: tabular-nums; }
.fp-wind { display: flex; align-items: center; gap: 4px; font-size: 10.5px; color: #64748b; margin-top: 3px; }
.fp-detail { margin-top: 6px; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
