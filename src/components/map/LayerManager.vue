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
/**
 * 图层显隐控制面板。
 *
 * 注意：visible 是父级的 reactive 对象。这里**不再**通过
 * `v-model:visible` + `{ ...props.visible }` 整体替换 —— 父级把它存在
 * 从 hook 解构出来的 `const` 上，整体替换会触发
 * "Assignment to constant variable"，第一个开关点完就报错，
 * 之后所有图层都不再响应。改为原地写单个布尔字段。
 */
import type { LayerId } from '@/types/map'
import { LAYER_IDS, LAYER_LABELS } from '@/types/map'

const props = defineProps<{ visible: Record<LayerId, boolean> }>()

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
  props.visible[id] = !props.visible[id]
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
