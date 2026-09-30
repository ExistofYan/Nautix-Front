<template>
  <g class="ship-marker-svg">
    <g :transform="`translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${heading})`">
      <path
        d="M0,-8 C4,-4 4,4 0,8 C-4,4 -4,-4 0,-8 Z"
        :fill="color"
        stroke="#0a1428"
        stroke-width="0.8"
      />
      <line x1="0" y1="-8" x2="0" y2="-13" :stroke="color" stroke-width="1.2" />
    </g>
  </g>
</template>

<script setup lang="ts">
/** 单个船舶 SVG 符号：船形 path + 艏向线，rotate=heading */
withDefaults(defineProps<{
  x: number
  y: number
  heading?: number
  color?: string
}>(), {
  heading: 0,
  color: '#34d399',
})
</script>

<style scoped>
.ship-marker-svg {
  cursor: pointer;
}
</style>
