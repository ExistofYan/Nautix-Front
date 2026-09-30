<template>
  <el-drawer :model-value="!!port" title="港口详情" size="420px" @close="$emit('close')">
    <template v-if="port">
      <div class="hero">
        <span class="anchor"><el-icon :size="26"><Anchor /></el-icon></span>
        <div>
          <h3>{{ port.portName || '未命名港口' }}</h3>
          <p>{{ port.country || '—' }}{{ port.countryCode ? ` · ${port.countryCode}` : '' }}</p>
        </div>
      </div>

      <el-descriptions :column="1" border size="small" class="desc">
        <el-descriptions-item label="WPI 编号">{{ port.wpiId || '—' }}</el-descriptions-item>
        <el-descriptions-item label="UN/LOCODE">{{ port.portCode || '—' }}</el-descriptions-item>
        <el-descriptions-item label="港口类型">
          <el-tag size="small" effect="plain" round>{{ port.portType || '—' }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="纬度">{{ coord(port.latitude) }}</el-descriptions-item>
        <el-descriptions-item label="经度">{{ coord(port.longitude) }}</el-descriptions-item>
        <el-descriptions-item label="可停靠船长上限">{{ num(port.maxShipLength, 0) }} m</el-descriptions-item>
        <el-descriptions-item label="最大吃水">{{ num(port.maxDraft, 1) }} m</el-descriptions-item>
      </el-descriptions>

      <div class="section-title">挂靠本港的航线（起/终）</div>
      <div v-if="!routes.length" class="empty-mini">暂无关联航线数据</div>
      <div v-for="r in routes" :key="r.id" class="route-row">
        <el-icon color="#38bdf8"><Guide /></el-icon>
        <span class="r-name">{{ r.routeName || `航线 #${r.id}` }}</span>
        <span class="r-dist">{{ num(r.distanceNm, 0) }} nm</span>
        <el-tag size="small" :type="r.startPortId === port.id ? 'success' : 'warning'" effect="plain">
          {{ r.startPortId === port.id ? '起点' : '终点' }}
        </el-tag>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Port, Route } from '@/api/types'
import { getRoutePage } from '@/api/route'

const props = defineProps<{ port: Port | null }>()
defineEmits<{ (e: 'close'): void }>()

const routes = ref<Route[]>([])

watch(
  () => props.port?.id,
  async (id) => {
    routes.value = []
    if (id == null) return
    try {
      const res = await getRoutePage({ page: 1, count: 100 })
      routes.value = (res.records ?? []).filter(r => r.startPortId === id || r.endPortId === id)
    } catch { /* empty */ }
  },
  { immediate: true },
)

function coord(v?: number) { return v == null || Number.isNaN(v) ? '—' : v.toFixed(4) }
function num(v?: number, d = 1) { return v == null || Number.isNaN(v) ? '—' : v.toFixed(d) }
</script>

<style scoped>
.hero { display: flex; align-items: center; gap: 14px; margin-bottom: 18px; }
.anchor { width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; color: #e0f2fe; background: linear-gradient(135deg, #0ea5e9, #7c3aed); }
.hero h3 { margin: 0; color: var(--nx-text); font-size: 17px; }
.hero p { margin: 2px 0 0; color: #64748b; font-size: 12px; }
.desc { margin-bottom: 18px; }
.section-title { color: var(--nx-text); font-weight: 700; font-size: 13.5px; margin-bottom: 10px; }
.route-row { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 8px; background: rgba(9, 17, 35, 0.5); margin-bottom: 6px; font-size: 12.5px; }
.r-name { flex: 1; color: var(--nx-text-dim); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.r-dist { color: #7dd3fc; font-family: Consolas, monospace; }
.empty-mini { font-size: 12px; color: #64748b; padding: 8px 0; }
</style>
