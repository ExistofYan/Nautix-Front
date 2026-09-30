<template>
  <div class="dock">
    <button v-for="l in links" :key="l.path" class="dock-btn" type="button" @click="go(l.path)">
      <span class="ico">{{ l.emoji }}</span>{{ l.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

/** 轻量无 store 版底部快捷导航条。 */
const props = withDefaults(defineProps<{
  links?: { path: string; label: string; emoji: string }[]
}>(), {
  links: () => [
    { path: '/dashboard', label: '仪表盘', emoji: '📊' },
    { path: '/ship', label: '船舶', emoji: '🚢' },
    { path: '/sensor/realtime', label: '传感器', emoji: '🛰' },
    { path: '/alert/records', label: '告警', emoji: '⚠️' },
    { path: '/command', label: '指挥中心', emoji: '🖥' },
  ],
})

const router = useRouter()
function go(path: string) {
  void router.push(path).catch(() => { /* 路由未注册时忽略 */ })
}
void props
</script>

<style scoped>
.dock {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 14px;
  padding: 12px 22px;
  background: rgba(10, 25, 45, 0.78);
  backdrop-filter: blur(18px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 30px;
  z-index: 10;
}
.dock-btn {
  background: transparent;
  border: none;
  color: #cbd5e1;
  font-size: 14px;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 10px;
  transition: all .15s ease;
}
.dock-btn:hover { color: #7dd3fc; background: rgba(56, 189, 248, 0.1); }
.ico { margin-right: 6px; }
</style>
