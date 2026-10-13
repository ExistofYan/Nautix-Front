<template>
  <el-config-provider :locale="epLocale">
    <MainLayout v-if="!isAuthPage" />
    <template v-else>
      <router-view />
      <!-- 登录/注册页右上角的语言切换（亮色毛玻璃，适配航海主题背景） -->
      <button class="auth-lang-switch" data-no-i18n :title="langStore.t('header.langTip')" @click="langStore.toggle()">
        <span :class="{ active: langStore.lang === 'zh' }">中</span>
        <span class="divider">/</span>
        <span :class="{ active: langStore.lang === 'en' }">EN</span>
      </button>
    </template>
  </el-config-provider>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'
import MainLayout from '@/layouts/MainLayout.vue'
import { useLang } from '@/stores/lang'
import { startDomTranslator, setDomTranslatorLang } from '@/i18n/domTranslator'

const route = useRoute()
const langStore = useLang()
const isAuthPage = computed(() => {
  return route.path === '/login' || route.path === '/register'
})
// Element Plus built-in components (pagination, date picker, etc.) follow the app language
const epLocale = computed(() => (langStore.lang === 'zh' ? zhCn : en))

// 运行时把界面上硬编码的中文标签/按钮/表头等翻译为英文（英文模式下）。
// 只精确命中词典的展示文案，数据库里的船名/港口名等中文原样保留。
onMounted(() => {
  startDomTranslator(langStore.lang)
})
watch(() => langStore.lang, (l) => setDomTranslatorLang(l))
</script>

<style scoped>
.auth-lang-switch {
  position: fixed;
  top: 22px;
  right: 26px;
  z-index: 200;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 7px 16px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.55);
  background: rgba(255, 255, 255, 0.35);
  backdrop-filter: blur(12px);
  color: #546e7a;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.18s ease;
  user-select: none;
}
.auth-lang-switch:hover {
  background: rgba(255, 255, 255, 0.55);
  box-shadow: 0 4px 18px rgba(30, 136, 229, 0.25);
}
.auth-lang-switch span {
  transition: color 0.18s ease;
}
.auth-lang-switch span.active {
  color: #1565c0;
}
.auth-lang-switch .divider {
  color: rgba(84, 110, 122, 0.4);
  margin: 0 1px;
}
</style>
