<template>
  <transition name="popup">
    <div v-if="ship" class="ship-popup nx-panel" :style="{ left: x + 'px', top: y + 'px' }">
      <div class="sp-head">
        <span class="sp-name">{{ ship.shipName || `船舶 #${ship.id}` }}</span>
        <el-button size="small" text circle @click="$emit('close')">
          <el-icon><Close /></el-icon>
        </el-button>
      </div>
      <div class="sp-body">
        <div class="sp-row"><em>类型</em><b>{{ ship.shipType || '--' }}</b></div>
        <div class="sp-row"><em>状态</em><b>{{ statusText }}</b></div>
        <div class="sp-row"><em>航速</em><b>{{ fmt(runtime?.speed) }} kn</b></div>
        <div class="sp-row"><em>航向</em><b>{{ fmt(runtime?.heading, 0) }}°</b></div>
        <div class="sp-row"><em>位置</em><b>{{ (runtime?.latitude ?? 0).toFixed(4) }}, {{ (runtime?.longitude ?? 0).toFixed(4) }}</b></div>
        <div class="sp-row"><em>燃油</em><b>{{ fmt(runtime?.fuelPercent, 0) }}%</b></div>
      </div>
      <div class="sp-foot">
        <el-button size="small" type="primary" round plain @click="$emit('detail', ship)">
          <el-icon><Document /></el-icon>查看档案
        </el-button>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
/** 船点点击浮层卡：船名/类型/航速/航向/位置/状态 + 跳转详情 */
import { computed, onMounted, ref } from 'vue'
import type { ShipInfo, ShipRuntimeStatus } from '@/api/types'
import { getRuntimeByShip } from '@/api/ship'

const props = defineProps<{
  ship?: ShipInfo | null
  x?: number
  y?: number
}>()

defineEmits<{
  (e: 'close'): void
  (e: 'detail', ship: ShipInfo): void
}>()

const runtime = ref<ShipRuntimeStatus | null>(null)

const fmt = (n?: number | null, d = 1) => (n == null || Number.isNaN(n) ? '--' : n.toFixed(d))

const statusText = computed(() => {
  const s = (runtime.value?.sailingStatus ?? '').toUpperCase()
  if (/SEA|NAVIG|航行/.test(s)) return '在航'
  if (/ANCHOR|锚/.test(s)) return '锚泊'
  if (/BERTH|MOORED|靠泊|系泊/.test(s)) return '靠泊'
  return runtime.value?.sailingStatus ?? '未知'
})

onMounted(async () => {
  if (props.ship?.id == null) return
  try {
    const rt = await getRuntimeByShip(props.ship.id)
    runtime.value = rt && typeof rt === 'object' ? rt : null
  } catch { runtime.value = null }
})
</script>

<style scoped>
.ship-popup {
  position: absolute;
  z-index: 20;
  width: 230px;
  padding: 12px 14px;
  border-radius: 12px;
  transform: translate(-50%, calc(-100% - 16px));
}
.sp-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.sp-name { font-size: 13.5px; font-weight: 800; color: #e0f2fe; }
.sp-row { display: flex; justify-content: space-between; gap: 10px; font-size: 11.5px; padding: 2px 0; }
.sp-row em { font-style: normal; color: #64748b; }
.sp-row b { color: #cbd5e1; font-variant-numeric: tabular-nums; max-width: 130px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sp-foot { margin-top: 10px; text-align: right; }
.popup-enter-active, .popup-leave-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.popup-enter-from, .popup-leave-to { opacity: 0; transform: translate(-50%, calc(-100% - 8px)); }
</style>
