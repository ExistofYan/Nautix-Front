<template>
  <FullScreenLayout>
    <div class="earth">
      <CesiumViewer @ship-selected="onShipSelected" />

      <div class="brand">
        <h1>Digital Earth</h1>
        <p>海洋数字孪生 · OCEAN DIGITAL TWIN</p>
      </div>

      <div v-if="selected" class="ship-pop nx-panel">
        <div class="sp-head">
          <el-icon color="#7dd3fc"><Ship /></el-icon>
          <b>{{ selected.shipName || `船 #${selected.id}` }}</b>
          <button class="sp-close" @click="selected = null"><el-icon><Close /></el-icon></button>
        </div>
        <div class="sp-grid">
          <div><i>IMO</i><b>{{ selected.imo || '—' }}</b></div>
          <div><i>船型</i><b>{{ selected.shipType || '—' }}</b></div>
          <div><i>船籍港</i><b>{{ selected.registryPort || '—' }}</b></div>
          <div><i>运营公司</i><b>{{ selected.operatingCompany || '—' }}</b></div>
        </div>
        <router-link class="sp-link" :to="`/ship?id=${selected.id}`">查看完整档案 →</router-link>
      </div>

      <div class="hint">点击海图上的船舶标记查看详情 · 数据来自 /shipInfo + /runtime</div>
    </div>
  </FullScreenLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import FullScreenLayout from '@/layouts/FullScreenLayout.vue'
import CesiumViewer from '@/components/map/CesiumViewer.vue'
import type { ShipInfo } from '@/api/types'

const selected = ref<ShipInfo | null>(null)

function onShipSelected(ship: ShipInfo | null) {
  selected.value = ship
}
</script>

<style scoped>
.earth { position: relative; width: 100%; height: 100%; overflow: hidden; background: radial-gradient(circle at 50% 40%, #0c2038, #060d1f 75%); }
.brand { position: absolute; top: 26px; left: 34px; z-index: 10; pointer-events: none; }
.brand h1 { margin: 0; font-size: 30px; font-weight: 800; letter-spacing: 2px; color: #e0f2fe; text-shadow: 0 0 18px rgba(56, 189, 248, 0.7); }
.brand p { margin: 4px 0 0; font-size: 12px; letter-spacing: 3px; color: #7dd3fc; opacity: 0.85; }
.ship-pop { position: absolute; top: 24px; right: 24px; z-index: 20; width: 280px; padding: 14px 16px; border-radius: 14px; }
.sp-head { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.sp-head b { color: var(--nx-text); font-size: 14.5px; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sp-close { border: none; background: transparent; color: #64748b; cursor: pointer; display: inline-flex; }
.sp-close:hover { color: #fb7185; }
.sp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.sp-grid > div { display: flex; flex-direction: column; background: rgba(9, 17, 35, 0.55); border-radius: 8px; padding: 8px 10px; }
.sp-grid i { font-style: normal; font-size: 10.5px; color: #64748b; }
.sp-grid b { font-size: 12.5px; color: var(--nx-text-dim); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sp-link { display: block; margin-top: 10px; text-align: center; font-size: 12px; color: #7dd3fc; text-decoration: none; border: 1px dashed rgba(125, 211, 252, 0.35); border-radius: 8px; padding: 6px; transition: all 0.15s ease; }
.sp-link:hover { background: rgba(56, 189, 248, 0.1); }
.hint { position: absolute; bottom: 18px; left: 50%; transform: translateX(-50%); z-index: 10; font-size: 11px; color: #64748b; background: rgba(6, 13, 31, 0.6); padding: 5px 14px; border-radius: 999px; border: 1px solid rgba(56, 189, 248, 0.12); pointer-events: none; }
</style>
