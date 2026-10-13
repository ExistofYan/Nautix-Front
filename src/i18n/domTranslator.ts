import { translatePreserveSpace } from './uiText'

/**
 * 运行时中文→英文界面翻译。
 *
 * 设计：不改任何业务源码，在浏览器 DOM 层把「只用于展示」的中文替换成英文。
 * 之所以安全：
 *  - 只翻译精确命中词典 zh2en（或参数化模板）的文本，数据库里的船名 /
 *    港口名 / 规则名（如「远洋-00000号」「上海港」）不在词典中，原样保留中文；
 *  - 只处理文本节点与一组展示属性（placeholder / title / aria-label 等），
 *    不触碰任何 JS 逻辑里的字面量。
 *
 * 判定原则：DOM 里「含中文」即视为中文源文本（Vue 新写入或首次遇到），
 * 翻译后变成英文（不含中文），因此不会被二次翻译；切回中文时用记录的原文还原。
 */

const CJK = /[\u4e00-\u9fff]/

/** 需要翻译的元素展示属性 */
const TRANSLATE_ATTRS = ['placeholder', 'title', 'aria-label'] as const

/** 不进入这些子树（脚本、样式、代码块、以及明确标注不翻译的元素） */
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'CODE', 'PRE'])

/** 记录被改动节点的原始中文，用于切回中文时还原 */
const textOriginals = new WeakMap<Text, string>()
const attrOriginals = new WeakMap<Element, Map<string, string>>()

let current: 'zh' | 'en' = 'en'

function toEn(raw: string): string | null {
  return translatePreserveSpace(raw)
}

function walk(root: Node) {
  if (root.nodeType === 3) {
    const node = root as Text
    if (current === 'en') {
      // 含中文 = 源文本，记录并翻译；已是英文则跳过（不二次翻译）
      if (CJK.test(node.data)) {
        const en = toEn(node.data)
        if (en !== null && en !== node.data) {
          textOriginals.set(node, node.data)
          node.data = en
        }
      }
    } else {
      // 中文模式：节点仍含中文说明是 Vue 写入的源文本，不动；
      // 不含中文且有原文记录，说明是我们的译文，还原之
      const original = textOriginals.get(node)
      if (original !== undefined && !CJK.test(node.data)) {
        node.data = original
        textOriginals.delete(node)
      }
    }
    return
  }
  if (root.nodeType !== 1) return
  const el = root as Element
  if (SKIP_TAGS.has(el.tagName) || el.hasAttribute('data-no-i18n')) return

  for (const attr of TRANSLATE_ATTRS) {
    const val = el.getAttribute(attr)
    if (val == null) continue
    if (current === 'en') {
      if (CJK.test(val)) {
        const en = toEn(val)
        if (en !== null && en !== val) {
          let store = attrOriginals.get(el)
          if (!store) {
            store = new Map()
            attrOriginals.set(el, store)
          }
          store.set(attr, val)
          el.setAttribute(attr, en)
        }
      }
    } else {
      const store = attrOriginals.get(el)
      const original = store?.get(attr)
      if (original !== undefined && !CJK.test(val)) {
        el.setAttribute(attr, original)
        store!.delete(attr)
      }
    }
  }

  for (const child of Array.from(el.childNodes)) walk(child)
}

let observer: MutationObserver | null = null
let scheduled = false
let watchedRoot: Node = typeof document !== 'undefined' ? document.body : (null as unknown as Node)

function schedule() {
  if (scheduled) return
  scheduled = true
  requestAnimationFrame(() => {
    scheduled = false
    walk(watchedRoot)
  })
}

/** 启动翻译层并监听后续 DOM 变化 */
export function startDomTranslator(lang: 'zh' | 'en', root: Node = document.body) {
  current = lang
  watchedRoot = root
  walk(root)
  if (!observer) {
    observer = new MutationObserver(() => schedule())
    observer.observe(root, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...TRANSLATE_ATTRS],
    })
  }
}

/** 切换语言：还原旧译文并按新语言重扫 */
export function setDomTranslatorLang(lang: 'zh' | 'en') {
  if (lang === current) return
  current = lang
  walk(watchedRoot)
}
