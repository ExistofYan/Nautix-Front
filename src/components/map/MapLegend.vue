<template>
  <div class="map-legend nx-panel">
    <div class="lg-title">图例 Legend</div>
    <div v-for="item in items" :key="item.label" class="lg-row">
      <span class="lg-sym" :style="item.style">{{ item.glyph }}</span>
      <span class="lg-label">{{ item.label }}</span>
    </div>
    <div class="lg-note">点击船点查看船舶信息</div>
  </div>
</template>

<script setup lang="ts">
/** 海图图例：船/航线/港口/告警/天气色块说明 */
const items = [
  { glyph: '▲', label: '港口 Port', style: { color: '#fbbf24' } },
  { glyph: '⛴', label: '在航船舶 Underway', style: { color: '#34d399' } },
  { glyph: '⚓', label: '锚泊 Anchored', style: { color: '#fbbf24' } },
  { glyph: '◈', label: '航线 Route', style: { color: '#38bdf8' } },
  { glyph: '●', label: '告警脉冲 Alert', style: { color: '#fb7185' } },
  { glyph: '❋', label: '天气区域 Weather', style: { color: '#a78bfa' } },
]
</script>

<style scoped>
.map-legend {
  width: 158px;
  padding: 12px 14px;
  border-radius: 12px;
}
.lg-title {
  font-size: 12px;
  font-weight: 700;
  color: #7dd3fc;
  letter-spacing: 1px;
  margin-bottom: 8px;
}
.lg-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2.5px 0;
  font-size: 12px;
  color: #cbd5e1;
}
.lg-sym {
  width: 16px;
  text-align: center;
  font-size: 12px;
}
.lg-note {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed rgba(148, 184, 232, 0.2);
  font-size: 10.5px;
  color: #64748b;
}
</style>
