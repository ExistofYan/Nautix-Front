<template>
  <div class="nx-page sys-home">
    <div class="nx-page-header">
      <div>
        <h2 class="nx-page-title"><el-icon><Setting /></el-icon> 系统监控中心</h2>
        <p class="nx-page-desc">网关健康、缓存、库量与模拟器产出 · 采样自网关 /public/ping 与业务只读端点</p>
      </div>
      <el-button round @click="tick"><el-icon><Refresh /></el-icon> 立即刷新</el-button>
    </div>

    <div class="grid">
      <ServerStatus />
      <DatabaseMonitor />
      <ApiLatencyChart />
      <QueueMonitor />
      <SimulatorMonitor />
      <CacheMonitor />
    </div>

    <div class="entries">
      <router-link to="/system/logs" class="entry nx-panel">
        <el-icon :size="20"><Document /></el-icon>
        <div><b>操作日志</b><span>审计追踪 · 自动跟随</span></div>
        <el-icon class="arrow"><ArrowRight /></el-icon>
      </router-link>
      <router-link to="/system/cache" class="entry nx-panel">
        <el-icon :size="20"><Coin /></el-icon>
        <div><b>缓存明细</b><span>localStorage 键值清单</span></div>
        <el-icon class="arrow"><ArrowRight /></el-icon>
      </router-link>
      <router-link to="/system/pipeline" class="entry nx-panel">
        <el-icon :size="20"><Share /></el-icon>
        <div><b>数据流水线</b><span>模拟器 → 队列 → 写入 → 库</span></div>
        <el-icon class="arrow"><ArrowRight /></el-icon>
      </router-link>
      <router-link to="/system/simulator" class="entry nx-panel">
        <el-icon :size="20"><Cpu /></el-icon>
        <div><b>模拟器监控</b><span>产出速率与船状态分布</span></div>
        <el-icon class="arrow"><ArrowRight /></el-icon>
      </router-link>
    </div>

    <div class="nx-panel logs-block">
      <div class="logs-title">操作日志流</div>
      <LogViewer />
    </div>
  </div>
</template>

<script setup lang="ts">
import ServerStatus from '@/components/system/ServerStatus.vue'
import DatabaseMonitor from '@/components/system/DatabaseMonitor.vue'
import CacheMonitor from '@/components/system/CacheMonitor.vue'
import ApiLatencyChart from '@/components/system/ApiLatencyChart.vue'
import SimulatorMonitor from '@/components/system/SimulatorMonitor.vue'
import QueueMonitor from '@/components/system/QueueMonitor.vue'
import LogViewer from '@/components/system/LogViewer.vue'
import { useSystemPolling } from '@/hooks/useSystem'

const { tick } = useSystemPolling(5000)
</script>

<style scoped>
.logs-block { padding: 14px 16px; }
.logs-title { font-size: 14px; color: var(--nx-text); margin-bottom: 10px; }
.sys-home { display: flex; flex-direction: column; gap: 18px; }
.grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
.entries { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
.entry { display: flex; align-items: center; gap: 12px; padding: 16px 18px; border-radius: 12px; color: var(--nx-text); text-decoration: none; transition: all 0.18s ease; }
.entry:hover { border-color: rgba(125, 211, 252, 0.45); transform: translateY(-2px); box-shadow: 0 8px 22px rgba(37, 99, 235, 0.25); }
.entry > div { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.entry b { font-size: 14px; }
.entry span { font-size: 11.5px; color: var(--nx-text-dim); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.entry .arrow { margin-left: auto; color: #475569; }
@media (max-width: 1100px) {
  .grid { grid-template-columns: 1fr; }
  .entries { grid-template-columns: repeat(2, 1fr); }
}
</style>
