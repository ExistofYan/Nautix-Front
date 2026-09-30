<template>
  <div class="cmd-layout">
    <CommandBar title="海上交通指挥中心" subtitle="MARITIME COMMAND CENTER" />
    <main class="cmd-body">
      <slot />
    </main>
    <BottomDock />
  </div>
</template>

<script setup lang="ts">
import CommandBar from '@/layouts/CommandBar.vue'
import BottomDock from '@/layouts/BottomDock.vue'
</script>

<style scoped>
.cmd-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(900px 420px at 15% -5%, rgba(56, 189, 248, 0.10), transparent 60%),
    radial-gradient(800px 480px at 90% 110%, rgba(124, 58, 237, 0.10), transparent 55%),
    linear-gradient(180deg, #050b18 0%, #081226 55%, #060d1f 100%);
}
.cmd-body {
  flex: 1;
  min-height: 0;
  padding: 20px 24px 96px;
  overflow-y: auto;
}
</style>
