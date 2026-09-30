<template>
  <div class="layout-floating" :style="posStyle">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/** Layout-level anchored floating wrapper (non-draggable; the draggable one is components/layout/FloatingPanel). */
const props = withDefaults(defineProps<{
  corner?: 'tr' | 'tl' | 'br' | 'bl'
  offset?: number
}>(), {
  corner: 'tr',
  offset: 20,
})

const posStyle = computed(() => {
  const o = `${props.offset}px`
  return {
    top: props.corner.endsWith('l') || props.corner === 'tr' ? o : undefined,
    right: props.corner.startsWith('b') || props.corner === 'tr' ? o : undefined,
    bottom: props.corner.startsWith('b') ? o : undefined,
    left: props.corner.startsWith('t') && props.corner === 'tl' ? o : props.corner === 'bl' ? o : undefined,
  }
})
</script>

<style scoped>
.layout-floating {
  position: absolute;
  z-index: 30;
  padding: 16px;
  background: var(--nx-panel);
  backdrop-filter: blur(14px);
  border: 1px solid var(--nx-panel-border);
  border-radius: 14px;
  color: var(--nx-text);
  box-shadow: 0 10px 30px rgba(2, 8, 20, 0.5);
}
</style>
