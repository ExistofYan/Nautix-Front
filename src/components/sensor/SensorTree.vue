<template>
  <div class="sensor-tree nx-panel">
    <div class="st-head">
      <el-icon><Files /></el-icon>
      <span>船舶 / 传感器</span>
      <el-button size="small" text circle :loading="loading" @click="reload">
        <el-icon><Refresh /></el-icon>
      </el-button>
    </div>
    <el-input v-model="filterText" size="small" placeholder="搜索船名或传感器" clearable class="st-filter">
      <template #prefix><el-icon><Search /></el-icon></template>
    </el-input>

    <el-scrollbar class="st-scroll">
      <el-skeleton v-if="loading && !tree.length" :rows="5" animated />
      <el-empty v-else-if="!tree.length" :image-size="60" description="暂无传感器配置" />
      <el-tree
        v-else
        ref="treeRef"
        :data="tree"
        node-key="key"
        :props="{ label: 'label', children: 'children' }"
        :filter-node-method="filterNode"
        highlight-current
        :expand-on-click-node="false"
        @node-click="onClick"
      >
        <template #default="{ data }">
          <span class="st-node">
            <el-icon v-if="!data.config"><Ship /></el-icon>
            <el-icon v-else><Odometer /></el-icon>
            <span class="st-label">{{ data.label }}</span>
            <el-tag v-if="data.config && data.config.status !== 1" size="small" type="info" effect="plain">停用</el-tag>
          </span>
        </template>
      </el-tree>
      <div v-if="tree.length >= SHIP_CAP" class="st-cap">
        数据量过大，仅展示前 {{ SHIP_CAP }} 艘船的传感器，请用上方搜索框定位
      </div>
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { ElTree } from 'element-plus'
import { useSensorStore } from '@/stores/sensor'
import { useShipStore } from '@/stores/shipStore'
import type { SensorConfig } from '@/api/types'
import type { SensorTreeNode } from '@/types/sensor'

const emit = defineEmits<{ (e: 'select', config: SensorConfig): void }>()

const sensorStore = useSensorStore()
const shipStore = useShipStore()

const treeRef = ref<InstanceType<typeof ElTree>>()
const filterText = ref('')
const loading = computed(() => sensorStore.loading || shipStore.loading)

/**
 * 渲染上限：sensor_config 有 16 万条、ship_info 有 1 万艘，
 * 若把全部船/传感器一次性建成树节点（尤其配合 default-expand-all），
 * 主线程会在渲染阶段直接冻结。这里限制船数量与每船传感器数量，
 * 超出部分提示用户用搜索框定位。
 */
const SHIP_CAP = 200
const CFG_CAP = 20

const tree = computed<SensorTreeNode[]>(() => {
  const byShip = new Map<number, SensorConfig[]>()
  for (const c of sensorStore.configs) {
    if (c.shipId == null) continue
    const arr = byShip.get(c.shipId) ?? []
    if (arr.length < CFG_CAP) arr.push(c)
    byShip.set(c.shipId, arr)
  }
  const nodes: SensorTreeNode[] = []
  for (const ship of shipStore.ships) {
    if (nodes.length >= SHIP_CAP) break
    if (ship.id == null) continue
    const configs = byShip.get(ship.id) ?? []
    if (!configs.length) continue
    nodes.push({
      key: `ship-${ship.id}`,
      label: ship.shipName || `船 #${ship.id}`,
      children: configs.map(c => ({
        key: `cfg-${c.id}`,
        label: sensorStore.nameOf(c.id),
        config: c,
      })),
    })
  }
  return nodes
})

function filterNode(value: string, data: Record<string, unknown>) {
  if (!value) return true
  return String((data as unknown as SensorTreeNode).label ?? '').toLowerCase().includes(value.toLowerCase())
}

watch(filterText, v => treeRef.value?.filter(v))

function onClick(node: SensorTreeNode) {
  if (node.config) emit('select', node.config)
}

async function reload() {
  await Promise.all([shipStore.loadShips(), sensorStore.load(true)])
}

onMounted(() => {
  void Promise.all([shipStore.loadShips(), sensorStore.load()])
})
</script>

<style scoped>
.sensor-tree { display: flex; flex-direction: column; height: 100%; min-height: 0; padding: 12px; }
.st-head {
  display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700;
  color: #b8d4f5; margin-bottom: 10px;
}
.st-head .el-button { margin-left: auto; }
.st-filter { margin-bottom: 8px; }
.st-scroll { flex: 1; min-height: 0; }
.st-cap { margin-top: 8px; font-size: 11px; line-height: 1.5; color: var(--nx-text-dim); }
.st-node { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; min-width: 0; }
.st-label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sensor-tree :deep(.el-tree) { background: transparent; --el-tree-node-hover-bg-color: rgba(56,189,248,.08); }
.sensor-tree :deep(.el-tree-node__content) { height: 32px; border-radius: 8px; }
.sensor-tree :deep(.el-tree-node.is-current > .el-tree-node__content) { background: linear-gradient(90deg, rgba(37,99,235,.35), rgba(56,189,248,.15)); }
</style>
