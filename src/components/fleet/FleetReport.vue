<template>
  <div v-if="fleet" class="fleet-report">
    <section class="sec nx-panel">
      <h3>{{ fleet.company }} · 船队概览</h3>
      <div class="kv-row">
        <div class="kv"><em>成员数</em><b>{{ fleet.memberCount }}</b></div>
        <div class="kv"><em>平均航速</em><b>{{ fmt(fleet.avgSpeed) }} kn</b></div>
        <div class="kv"><em>平均油量</em><b>{{ fmt(fleet.avgFuel, 0) }}%</b></div>
        <div class="kv"><em>平均主机负荷</em><b>{{ fmt(fleet.avgEngineLoad, 0) }}%</b></div>
        <div class="kv"><em>平均船龄</em><b>{{ fmt(fleet.avgShipAge, 1) }} 年</b></div>
      </div>
    </section>

    <section class="sec sec-grid">
      <div class="nx-panel">
        <h4>状态分布</h4>
        <div v-show="hasStatus" ref="pieEl" class="pie" />
        <el-empty v-if="!hasStatus" description="暂无在线状态数据" :image-size="56" />
      </div>
      <div class="nx-panel">
        <h4>成员清单</h4>
        <el-table :data="rows" size="small" max-height="300">
          <el-table-column prop="name" label="船名" min-width="130" show-overflow-tooltip />
          <el-table-column prop="type" label="船型" width="110" />
          <el-table-column prop="imo" label="IMO" width="120" />
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag size="small" :type="row.rt ? 'success' : 'info'" effect="plain">{{ row.rt?.sailingStatus ?? '离线' }}</el-tag>
            </template>
          </el-table-column>
          <template #empty><el-empty description="无成员" :image-size="50" /></template>
        </el-table>
      </div>
    </section>
  </div>
  <el-empty v-else description="请选择船队生成报告" :image-size="90" />
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useChart, chartTheme } from '@/hooks/useChart'
import type { Fleet } from '@/types/fleet'

const props = defineProps<{ fleet: Fleet | null }>()

const pieEl = ref<HTMLElement>()
const { setOption } = useChart(pieEl)

const rows = computed(() =>
  (props.fleet?.ships ?? []).map(s => ({
    name: s.shipName ?? `船 #${s.id}`,
    type: s.shipType ?? '--',
    imo: s.imo ?? '--',
    rt: s.id != null && props.fleet ? props.fleet.runtimeById[s.id] ?? null : null,
  }))
)

const statusDist = computed(() => {
  const counts = new Map<string, number>()
  for (const r of rows.value) {
    const key = r.rt?.sailingStatus ?? '离线'
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return [...counts.entries()].map(([name, value]) => ({ name, value }))
})

const hasStatus = computed(() => rows.value.length > 0)

async function renderPie() {
  if (!hasStatus.value) return
  await nextTick()
  setOption({
    backgroundColor: 'transparent',
    textStyle: { color: chartTheme.textStyle.color },
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, textStyle: { color: '#94a3b8', fontSize: 11 } },
    series: [{
      type: 'pie',
      radius: ['42%', '68%'],
      center: ['50%', '44%'],
      itemStyle: { borderColor: '#0a1428', borderWidth: 2 },
      label: { color: '#a8bdd9', fontSize: 11 },
      data: statusDist.value.map((d, i) => ({ ...d, itemStyle: { color: chartTheme.palette[i % chartTheme.palette.length] } })),
    }],
  })
}

watch(() => props.fleet, renderPie, { immediate: true })

const fmt = (n: number | null, d = 1) => (n == null ? '--' : n.toFixed(d))
</script>

<style scoped>
.fleet-report { display: flex; flex-direction: column; gap: 16px; }
.sec { border-radius: 14px; padding: 16px 20px; }
.sec h3 { margin: 0 0 14px; font-size: 17px; color: #f1f5f9; letter-spacing: .5px; }
.sec h4 { margin: 0 0 10px; font-size: 13px; color: #a8bdd9; letter-spacing: 1px; }
.kv-row { display: flex; gap: 34px; flex-wrap: wrap; }
.kv { display: flex; flex-direction: column; gap: 5px; }
.kv em { font-style: normal; color: #64748b; font-size: 12px; }
.kv b { color: #7dd3fc; font-family: 'JetBrains Mono', Consolas, monospace; font-size: 20px; }
.sec-grid { display: grid; grid-template-columns: 1fr 1.4fr; gap: 16px; background: transparent; padding: 0; }
.sec-grid > div { border-radius: 14px; padding: 16px 20px; }
.pie { height: 300px; width: 100%; }
@media (max-width: 1000px) { .sec-grid { grid-template-columns: 1fr; } }
</style>
