<template>
  <section class="glass-panel" :class="{ clickable }" @click="clickable ? $emit('click') : undefined">
    <header v-if="title || $slots.actions" class="gp-head">
      <span class="gp-title">
        <el-icon v-if="icon"><component :is="icon" /></el-icon>
        {{ title }}
      </span>
      <span class="gp-actions"><slot name="actions" /></span>
    </header>
    <div class="gp-body"><slot /></div>
  </section>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

withDefaults(defineProps<{
  title?: string
  icon?: Component
  clickable?: boolean
}>(), {
  clickable: false,
})

defineEmits<{ (e: 'click'): void }>()
</script>

<style scoped>
.glass-panel {
  background: var(--nx-panel);
  border: 1px solid var(--nx-panel-border);
  backdrop-filter: blur(15px);
  border-radius: 16px;
  padding: 18px 20px;
  color: var(--nx-text);
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
}
.glass-panel:hover {
  border-color: rgba(125, 211, 252, 0.35);
  box-shadow: 0 0 24px rgba(56, 189, 248, 0.10);
}
.glass-panel.clickable { cursor: pointer; }
.glass-panel.clickable:hover { transform: translateY(-2px); }
.gp-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; gap: 10px; }
.gp-title { display: inline-flex; align-items: center; gap: 8px; font-weight: 700; font-size: 14.5px; color: var(--nx-text); }
.gp-title .el-icon { color: #7dd3fc; }
.gp-actions { display: inline-flex; align-items: center; gap: 8px; }
</style>
