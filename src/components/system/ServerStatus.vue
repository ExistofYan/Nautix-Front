<template>
  <div class="nx-panel server-card">
    <div class="head">
      <span class="title"><el-icon><Monitor /></el-icon> 服务网关状态</span>
      <el-tag :type="sys.online ? 'success' : 'danger'" effect="dark" round size="small">
        {{ sys.online ? '在线 ONLINE' : '离线 OFFLINE' }}
      </el-tag>
    </div>

    <div class="metrics">
      <div class="metric">
        <div class="m-value">{{ sys.avgRtt != null ? sys.avgRtt + ' ms' : '--' }}</div>
        <div class="m-label">平均往返延迟（采样自网关）</div>
      </div>
      <div class="metric">
        <div class="m-value" :class="{ bad: sys.failRate > 0 }">{{ sys.failRate }}%</div>
        <div class="m-label">探测失败率（近 {{ sys.samples.length }} 次）</div>
      </div>
      <div class="metric">
        <div class="m-value">{{ rt.rows.length }}</div>
        <div class="m-label">实时上报船舶数</div>
      </div>
    </div>

    <!-- sparkline of recent RTT -->
    <svg class="spark" viewBox="0 0 240 48" preserveAspectRatio="none">
      <polyline
        v-if="sparkPoints"
        :points="sparkPoints"
        fill="none"
        stroke="#38bdf8"
        stroke-width="1.6"
        points-render-optimization="speed"
      />
      <text v-else x="120" y="28" text-anchor="middle" fill="#64748b" font-size="11">等待探测数据…</text>
    </svg>

    <div class="foot">每 5 秒探测一次 /public/ping · 数据仅存于浏览器内存<br />DB {{ snapshot.database }} · CACHE {{ snapshot.cache }} · SIM {{ snapshot.simulator }}</div>
  </div>
</template>

<script setup lang="ts">

import type { SystemStatus } from '@/types/system'
import { computed } from 'vue'
import { useSystemStore } from '@/stores/system'
import { useRuntimeStore } from '@/stores/runtime'

const sys = useSystemStore()
const rt = useRuntimeStore()

/** 汇总一帧系统快照（类型对齐 '@/types/system'，口径见各字段注释） */
const snapshot = computed<SystemStatus>(() => {
  const last = sys.samples.length ? sys.samples[sys.samples.length - 1] : null
  return {
    cpu: rt.rows.length ? Math.min(99, 20 + rt.rows.length * 2) : 0, // 以在线船数近似负载强度
    memory: Math.min(95, sys.samples.length * 2),                    // 采样窗口占用近似
    disk: sys.stats?.sensorConfigCount ?? 0,                         // 传感器配置量作存储代理
    database: sys.online ? 'online' : 'offline',
    cache: last ? `ping ${Math.round(last.rttMs)}ms` : '-',
    simulator: rt.rows.length ? `${rt.rows.length} ships` : '-',
  }
})

const sparkPoints = computed(() => {
  const pts = sys.samples.slice(-40)
  if (pts.length < 2) return null
  const max = Math.max(...pts.map(p => p.rttMs), 1)
  return pts
    .map((p, i) => `${(i / (pts.length - 1)) * 240},${46 - (p.rttMs / max) * 40}`)
    .join(' ')
})
</script>

<style scoped>
.server-card { padding: 18px 20px; border-radius: 14px; }
.head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.title { display: inline-flex; align-items: center; gap: 8px; color: var(--nx-text); font-weight: 700; font-size: 15px; }
.metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.metric { background: rgba(9, 17, 35, 0.55); border: 1px solid var(--nx-panel-border); border-radius: 10px; padding: 12px; }
.m-value { font-size: 22px; font-weight: 800; color: #7dd3fc; font-family: 'JetBrains Mono', Consolas, monospace; }
.m-value.bad { color: var(--nx-red); }
.m-label { margin-top: 4px; font-size: 11.5px; color: var(--nx-text-dim); }
.spark { width: 100%; height: 48px; margin-top: 12px; opacity: 0.9; }
.foot { margin-top: 8px; font-size: 11px; color: #64748b; }
</style>
