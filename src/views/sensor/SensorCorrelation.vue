<template>
  <div class="nx-page">
    <div class="nx-page-header">
      <div>
        <h2 class="nx-page-title">传感器关联分析</h2>
        <p class="nx-page-desc">对 trend 窗口内的读数序列两两求 Pearson 相关，识别联动与冗余传感器</p>
      </div>
    </div>

    <CorrelationMatrix />

    <div class="nx-panel sc-note">
      <el-icon color="#38bdf8"><InfoFilled /></el-icon>
      <span>说明：矩阵仅取样本数最多的前 8 路传感器；r 为时间戳精确对齐后的 Pearson 系数，样本不足（&lt;3）显示为空白。强正相关（≥0.6）提示两路传感器测量同一物理过程的不同表计，可作为冗余校验依据。</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import CorrelationMatrix from '@/components/sensor/CorrelationMatrix.vue'
</script>

<style scoped>
.sc-note {
  display: flex; gap: 10px; align-items: flex-start; padding: 12px 16px; margin-top: 14px;
  font-size: 12.5px; color: var(--nx-text-dim); line-height: 1.6;
}
</style>
