<template>
  <header class="cmd-bar">
    <div class="bar-left">
      <span class="mark"><el-icon :size="20"><Compass /></el-icon></span>
      <div class="titles">
        <span class="title">{{ title }}</span>
        <span class="sub">{{ subtitle }}</span>
      </div>
    </div>

    <div class="bar-right">
      <el-tag :type="online ? 'success' : 'danger'" effect="dark" round size="small">
        <span class="dot" :class="online ? 'ok' : 'bad'"></span>
        {{ online ? '数据链路正常' : '数据链路中断' }}
      </el-tag>
      <span class="clock">{{ clock }}</span>
      <el-button round size="small" @click="backToNormal">
        <el-icon><Back /></el-icon>&nbsp;返回常规模式
      </el-button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCommandStore } from '@/stores/command'

defineProps<{ title?: string; subtitle?: string }>()

const router = useRouter()
const store = useCommandStore()

const now = ref(Date.now())
let timer: number | undefined

onMounted(() => {
  timer = window.setInterval(() => { now.value = Date.now() }, 1000)
})
onUnmounted(() => {
  if (timer !== undefined) clearInterval(timer)
})

/** 最近一次刷新在 30s 内视为链路正常。 */
const online = computed(
  () => store.lastRefresh != null && now.value - store.lastRefresh < 30000
)

const clock = computed(() =>
  new Date(now.value).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  })
)

function backToNormal() {
  void router.push('/dashboard').catch(() => { /* 路由未注册时静默忽略 */ })
}
</script>

<style scoped>
.cmd-bar {
  height: 64px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 22px;
  background: rgba(8, 17, 34, 0.85);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid rgba(56, 189, 248, 0.14);
}
.bar-left { display: flex; align-items: center; gap: 12px; min-width: 0; }
.mark {
  width: 38px; height: 38px; border-radius: 11px; flex: none;
  display: flex; align-items: center; justify-content: center; color: #e0f2fe;
  background: linear-gradient(135deg, #0ea5e9, #2563eb 60%, #7c3aed);
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
}
.titles { display: flex; flex-direction: column; min-width: 0; }
.title { font-size: 16px; font-weight: 800; letter-spacing: 1px; color: #f1f5f9; white-space: nowrap; }
.sub { font-size: 10.5px; letter-spacing: 2.5px; color: #64748b; white-space: nowrap; }
.bar-right { display: flex; align-items: center; gap: 14px; }
.dot { width: 7px; height: 7px; border-radius: 50%; display: inline-block; margin-right: 6px; vertical-align: middle; }
.ok { background: #34d399; box-shadow: 0 0 8px rgba(52, 211, 153, 0.9); }
.bad { background: #fb7185; box-shadow: 0 0 8px rgba(251, 113, 133, 0.9); }
.clock { font-family: 'JetBrains Mono', Consolas, monospace; font-size: 13px; color: #94a3b8; }
</style>
