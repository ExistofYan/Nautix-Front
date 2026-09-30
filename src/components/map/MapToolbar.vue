<template>
  <div class="map-toolbar nx-panel">
    <el-button-group>
      <el-button size="small" @click="$emit('zoom', 1.6)">
        <el-icon><ZoomIn /></el-icon>
      </el-button>
      <el-button size="small" @click="$emit('zoom', 1 / 1.6)">
        <el-icon><ZoomOut /></el-icon>
      </el-button>
      <el-button size="small" @click="$emit('fit')">
        <el-icon><Aim /></el-icon>
      </el-button>
      <el-button size="small" @click="$emit('refresh')" :loading="loading">
        <el-icon><Refresh /></el-icon>
      </el-button>
    </el-button-group>
    <el-popover placement="left" :width="190" trigger="click">
      <template #reference>
        <el-button size="small" class="layers-btn">
          <el-icon><Operation /></el-icon>
          <span>图层</span>
        </el-button>
      </template>
      <slot />
    </el-popover>
  </div>
</template>

<script setup lang="ts">
/** 海图工具条：缩放/回全球/刷新 + 图层面板弹层（内容走 default slot） */
defineProps<{ loading?: boolean }>()

defineEmits<{
  (e: 'zoom', factor: number): void
  (e: 'fit'): void
  (e: 'refresh'): void
}>()
</script>

<style scoped>
.map-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 12px;
}
.layers-btn {
  margin-left: 4px;
}
</style>
