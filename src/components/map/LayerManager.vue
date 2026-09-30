<template>
  <div class="layer-manager nx-panel">
    <div class="lm-title">图层 Layers</div>
    <label v-for="id in LAYER_IDS" :key="id" class="lm-row">
      <el-checkbox
        :model-value="visible[id]"
        size="small"
        @change="toggle(id)"
      />
      <span class="sw" :style="{ background: SWATCH[id] }"></span>
      <span class="lb">{{ LAYER_LABELS[id] }}</span>
    </label>
  </div>
</template>

<script setup lang="ts">
/** 图层显隐控制面板：v-model:visible 绑定 Record<LayerId, boolean>，纯 UI */
import type { LayerId } from '@/types/map'
import { LAYER_IDS, LAYER_LABELS } from '@/types/map'

const props = defineProps<{ visible: Record<LayerId, boolean> }>()

const emit = defineEmits<{
  (e: 'update:visible', next: Record<LayerId, boolean>): void
}>()

const SWATCH: Record<LayerId, string> = {
  ocean: '#0b1f3d',
  route: '#38bdf8',
  port: '#fbbf24',
  ship: '#34d399',
  traffic: '#22d3ee',
  alert: '#fb7185',
  weather: '#a78bfa',
  heatmap: '#f472b6',
}

function toggle(id: LayerId) {
  emit('update:visible', { ...props.visible, [id]: !props.visible[id] })
}
</script>

<style scoped>
.layer-manager {
  width: 168px;
  padding: 12px 14px;
  border-radius: 12px;
}
.lm-title {
  font-size: 12px;
  font-weight: 700;
  color: #7dd3fc;
  letter-spacing: 1px;
  margin-bottom: 8px;
}
.lm-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 3px 0;
  cursor: pointer;
  font-size: 12.5px;
  color: #cbd5e1;
}
.sw {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  border: 1px solid rgba(148, 184, 232, 0.3);
}
.lb {
  white-space: nowrap;
}
</style>
