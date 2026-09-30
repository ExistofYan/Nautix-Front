<template>
  <div
    ref="rootEl"
    class="floating-panel"
    :style="{ left: pos.x + 'px', top: pos.y + 'px', width: width }"
  >
    <div class="fp-head" @mousedown="startDrag">
      <span class="fp-title"><el-icon v-if="icon"><component :is="icon" /></el-icon>{{ title }}</span>
      <button class="fp-close" title="关闭" @click="visible = false"><el-icon><Close /></el-icon></button>
    </div>
    <div v-show="visible" class="fp-body">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onUnmounted } from 'vue'
import type { Component } from 'vue'

withDefaults(defineProps<{
  title?: string
  icon?: Component
  width?: string
  initialX?: number
  initialY?: number
}>(), {
  title: '悬浮面板',
  width: '320px',
  initialX: 40,
  initialY: 90,
})

const rootEl = ref<HTMLElement>()
const visible = ref(true)
const pos = reactive({ x: 40, y: 90 })

let dragging = false
let offX = 0, offY = 0

function startDrag(ev: MouseEvent) {
  dragging = true
  offX = ev.clientX - pos.x
  offY = ev.clientY - pos.y
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', stopDrag)
}
function onMove(ev: MouseEvent) {
  if (!dragging) return
  const maxX = window.innerWidth - (rootEl.value?.offsetWidth ?? 320)
  const maxY = window.innerHeight - 48
  pos.x = Math.min(Math.max(0, ev.clientX - offX), maxX)
  pos.y = Math.min(Math.max(0, ev.clientY - offY), maxY)
}
function stopDrag() {
  dragging = false
  window.removeEventListener('mousemove', onMove)
  window.removeEventListener('mouseup', stopDrag)
}
onUnmounted(stopDrag)
</script>

<style scoped>
.floating-panel {
  position: fixed;
  z-index: 1200;
  background: rgba(10, 25, 45, 0.78);
  backdrop-filter: blur(18px);
  border: 1px solid rgba(125, 211, 252, 0.22);
  border-radius: 16px;
  color: var(--nx-text);
  box-shadow: 0 14px 40px rgba(2, 8, 20, 0.55);
  overflow: hidden;
}
.fp-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px;
  cursor: move;
  user-select: none;
  background: linear-gradient(90deg, rgba(56, 189, 248, 0.12), transparent);
  border-bottom: 1px solid rgba(125, 211, 252, 0.14);
}
.fp-title { display: inline-flex; align-items: center; gap: 7px; font-size: 13px; font-weight: 700; }
.fp-close { border: none; background: transparent; color: #64748b; cursor: pointer; display: inline-flex; padding: 2px; border-radius: 6px; }
.fp-close:hover { color: #fb7185; background: rgba(251, 113, 133, 0.12); }
.fp-body { padding: 14px; max-height: 60vh; overflow-y: auto; }
</style>
