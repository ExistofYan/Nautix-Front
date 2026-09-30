<template>
  <header class="bar">
    <div class="brand"><el-icon><Compass /></el-icon>&nbsp;NAUTIX</div>
    <nav class="links">
      <router-link v-for="l in links" :key="l.path" :to="l.path" class="link">{{ l.label }}</router-link>
    </nav>
    <span class="clock">{{ clockText }}</span>
  </header>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

/** 轻量无 store 版顶栏：纯展示条，供非指挥大屏场景使用。 */
withDefaults(defineProps<{
  links?: { path: string; label: string }[]
}>(), {
  links: () => [
    { path: '/command', label: '指挥中心' },
    { path: '/dashboard', label: '仪表盘' },
    { path: '/ship', label: '船舶' },
    { path: '/alert/records', label: '告警' },
  ],
})

const now = ref(Date.now())
let timer: number | undefined
onMounted(() => { timer = window.setInterval(() => { now.value = Date.now() }, 1000) })
onUnmounted(() => { if (timer !== undefined) clearInterval(timer) })

const fmt = new Intl.DateTimeFormat('zh-CN', {
  hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
})
const clockText = computed(() => fmt.format(new Date(now.value)))
</script>

<style scoped>
.bar { height: 56px; display: flex; align-items: center; justify-content: space-between; padding: 0 22px; background: rgba(8, 17, 34, 0.9); border-bottom: 1px solid rgba(56, 189, 248, 0.12); color: #e2e8f0; }
.brand { font-weight: 800; letter-spacing: 2px; color: #7dd3fc; display: inline-flex; align-items: center; }
.links { display: flex; gap: 18px; }
.link { color: #94a3b8; text-decoration: none; font-size: 13.5px; transition: color .15s ease; }
.link:hover, .link.router-link-active { color: #7dd3fc; }
.clock { font-family: 'JetBrains Mono', Consolas, monospace; font-size: 13px; color: #94a3b8; }
</style>
