<template>
  <div class="port-card nx-panel" @click="$emit('select', port)">
    <div class="p-head">
      <span class="anchor"><el-icon><Anchor /></el-icon></span>
      <div class="p-names">
        <b>{{ port.portName || '未命名港口' }}</b>
        <em>{{ port.country || '—' }}{{ port.countryCode ? ` (${port.countryCode})` : '' }}</em>
      </div>
      <el-tag v-if="port.portType" size="small" effect="plain" round>{{ port.portType }}</el-tag>
    </div>

    <div class="p-metrics">
      <div class="pm"><i>UN/LOCODE</i><b>{{ port.portCode || port.wpiId || '—' }}</b></div>
      <div class="pm"><i>船籍限长</i><b>{{ num(port.maxShipLength, 0) }} m</b></div>
      <div class="pm"><i>最大吃水</i><b>{{ num(port.maxDraft, 1) }} m</b></div>
      <div class="pm"><i>坐标</i><b class="mono">{{ coord(port.latitude) }}, {{ coord(port.longitude) }}</b></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Port } from '@/api/types'

defineProps<{ port: Port }>()
defineEmits<{ (e: 'select', port: Port): void }>()

function num(v?: number, d = 1) { return v == null || Number.isNaN(v) ? '—' : v.toFixed(d) }
function coord(v?: number) { return v == null || Number.isNaN(v) ? '—' : v.toFixed(2) }
</script>

<style scoped>
.port-card { padding: 14px 16px; border-radius: 12px; cursor: pointer; transition: all 0.18s ease; }
.port-card:hover { border-color: rgba(125, 211, 252, 0.45); transform: translateY(-2px); box-shadow: 0 8px 20px rgba(37, 99, 235, 0.22); }
.p-head { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.anchor { width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #e0f2fe; background: linear-gradient(135deg, #0ea5e9, #7c3aed); flex: none; }
.p-names { display: flex; flex-direction: column; min-width: 0; flex: 1; }
.p-names b { color: var(--nx-text); font-size: 14.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.p-names em { color: #64748b; font-style: normal; font-size: 11.5px; }
.p-metrics { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 14px; }
.pm { display: flex; flex-direction: column; }
.pm i { font-style: normal; font-size: 10.5px; color: #64748b; letter-spacing: 0.4px; }
.pm b { color: var(--nx-text-dim); font-size: 12.5px; font-weight: 600; }
.mono { font-family: Consolas, monospace; }
</style>
