<template>
  <div class="weather-card nx-panel">
    <div class="wc-head">
      <el-icon :size="26" class="wc-ico"><component :is="iconFor(region.weatherType)" /></el-icon>
      <div class="wc-names">
        <div class="wc-region">{{ region.regionName || '未命名区域' }}</div>
        <div class="wc-type">{{ typeLabel(region.weatherType) }}</div>
      </div>
      <div class="wc-temp">
        <span class="big">{{ fmt(region.airTemperature) }}°</span>
        <em>气温 / 海温 {{ fmt(region.seaTemperature) }}°</em>
      </div>
    </div>

    <div class="wc-grid">
      <div class="wc-cell">
        <el-icon><WindPower /></el-icon>
        <b>{{ fmt(region.windSpeed) }} m/s</b>
        <span>风速 · {{ dirLabel(region.windDirection) }}</span>
      </div>
      <div class="wc-cell">
        <el-icon><MagicStick /></el-icon>
        <b>{{ fmt(region.waveHeight) }} m</b>
        <span>浪高</span>
      </div>
      <div class="wc-cell">
        <el-icon><Stopwatch /></el-icon>
        <b>{{ fmt(region.pressure, 0) }} hPa</b>
        <span>气压</span>
      </div>
      <div class="wc-cell">
        <el-icon><Drizzling /></el-icon>
        <b>{{ fmt(region.humidity, 0) }}%</b>
        <span>湿度</span>
      </div>
    </div>

    <div class="wc-foot">
      <span>更新于 {{ (region.updateTime || '--').replace('T', ' ').slice(0, 19) }}</span>
      <el-tag v-if="alertLevel" :type="alertLevel" size="small" effect="dark" round>{{ alertText }}</el-tag>
    </div>
  </div>
</template>

<script setup lang="ts">
/** 单区域天气卡：图标按 weatherType、四指标网格、预警徽章 */
import { computed } from 'vue'
import type { WeatherRegion } from '@/api/types'

const props = defineProps<{ region: WeatherRegion }>()

const fmt = (n?: number | null, d = 1) => (n == null || Number.isNaN(n) ? '--' : n.toFixed(d))

function iconFor(t?: string): string {
  switch ((t ?? '').toUpperCase()) {
    case 'CLEAR': case 'SUNNY': return 'Sunny'
    case 'CLOUDY': case 'PARTLY_CLOUDY': return 'PartlyCloudy'
    case 'OVERCAST': return 'Overcast'
    case 'WIND': case 'STRONG_WIND': case 'GALE': return 'Windy'
    case 'RAIN': case 'LIGHT_RAIN': return 'LightRain'
    case 'MODERATE_RAIN': return 'ModerateRain'
    case 'HEAVY_RAIN': return 'HeavyRain'
    default: return 'Cloudy'
  }
}

const LABELS: Record<string, string> = {
  CLEAR: '晴', SUNNY: '晴', PARTLY_CLOUDY: '多云', CLOUDY: '阴', OVERCAST: '阴',
  LIGHT_RAIN: '小雨', MODERATE_RAIN: '中雨', HEAVY_RAIN: '大雨', RAIN_SHOWER: '阵雨',
  THUNDERSTORM: '雷暴', MIST: '薄雾', FOG: '雾', SEA_FOG: '海雾', SNOW: '雪',
  SAND_STORM: '沙尘暴', STRONG_WIND: '强风', GALE: '大风', HIGH_WAVE: '大浪', TYPHOON: '台风',
}

function typeLabel(t?: string): string {
  return t ? LABELS[t.toUpperCase()] ?? t : '未知'
}

const DIRS = ['北', '东北', '东', '东南', '南', '西南', '西', '西北']
function dirLabel(deg?: number): string {
  if (deg == null) return '--'
  return DIRS[Math.round(((deg % 360) + 360) % 360 / 45) % 8] + '风'
}

const alertLevel = computed<'danger' | 'warning' | ''>(() => {
  const t = (props.region.weatherType ?? '').toUpperCase()
  if (/TYPHOON|HURRICANE|STORM|THUNDER/.test(t)) return 'danger'
  if (/GALE|HEAVY|HIGH_WAVE|FOG/.test(t)) return 'warning'
  return ''
})

const alertText = computed(() => (alertLevel.value === 'danger' ? '恶劣海况' : '注意'))
</script>

<style scoped>
.weather-card { padding: 16px 18px; border-radius: 14px; min-width: 260px; }
.wc-head { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
.wc-ico { color: #7dd3fc; }
.wc-names { flex: 1; min-width: 0; }
.wc-region { font-size: 15px; font-weight: 700; color: #f1f5f9; }
.wc-type { font-size: 11.5px; color: #94a3b8; }
.wc-temp { text-align: right; }
.wc-temp .big { font-size: 26px; font-weight: 800; color: #e0f2fe; }
.wc-temp em { display: block; font-style: normal; font-size: 10.5px; color: #64748b; }
.wc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.wc-cell { background: rgba(13, 31, 49, 0.6); border: 1px solid rgba(56, 189, 248, 0.1); border-radius: 10px; padding: 10px 12px; display: flex; flex-direction: column; gap: 2px; }
.wc-cell .el-icon { color: #38bdf8; margin-bottom: 2px; }
.wc-cell b { font-size: 15px; color: #e2e8f0; font-variant-numeric: tabular-nums; }
.wc-cell span { font-size: 10.5px; color: #64748b; }
.wc-foot { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; font-size: 10.5px; color: #64748b; }
</style>
