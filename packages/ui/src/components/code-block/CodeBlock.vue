<script setup lang="ts">
import { computed, onBeforeUpdate, ref, watch, useSlots } from 'vue'
import CopyToClipboard from '../copy-to-clipboard/CopyToClipboard.vue'
import Button from '../button/Button.vue'
import { cn } from '@/lib/utils'
import { useLocale } from '@/composables/useLocale'
import { codeBlockRootVariants, codeBlockHeaderVariants, codeBlockLanguageVariants, codeBlockBodyVariants, codeBlockLineNumbersVariants, codeBlockCopyButtonVariants } from './code-block-variants'
import { Prism, resolveLanguage, loadLanguage, isLanguageLoaded, getGrammar } from './prism-languages'

const slots = useSlots()
// useSlots() 返回随更新原地变化但非响应式的对象：用 ref 在渲染前同步，作为 watch 依赖，
// 保证插槽状态变化时触发重新高亮（slot 移除后需补算 highlightedHtml，避免 v-html 分支显示空内容）
const hasDefaultSlot = ref(Boolean(slots.default))
onBeforeUpdate(() => {
    hasDefaultSlot.value = Boolean(slots.default)
})
interface CodeBlockProps {
    code: string
    language?: string
    filename?: string
    showLineNumbers?: boolean
    maxLines?: number
    class?: string
}

const props = withDefaults(defineProps<CodeBlockProps>(), {
    language: undefined,
    filename: undefined,
    showLineNumbers: false,
    maxLines: undefined,
    class: undefined,
})

const { t } = useLocale()

// 语言与文件名的默认值属技术哨兵而非界面文案，不放入语言包（翻译者改写会破坏高亮回退逻辑）
const resolvedLanguage = computed(() => props.language ?? 'plaintext')
const resolvedFilename = computed(() => props.filename ?? '')

const rootClasses = computed(() =>
    cn(codeBlockRootVariants(), props.class)
)

// 行号以「渲染出的实际行数」为准：丢弃 split 产生的末尾空片段（'a\nb\n' → ['a','b']），
// 避免末尾换行多出一个无内容的行号；空串（['']）同样被丢弃，退化为无行号
const lines = computed(() => {
    const arr = props.code.split('\n')
    if (arr.length > 0 && arr[arr.length - 1] === '') arr.pop()
    return arr
})

const LINE_HEIGHT_REM = 1.25

const expanded = ref(false)

const showToggleButton = computed(() =>
    props.maxLines !== undefined &&
    lines.value.length > props.maxLines
)

const needsClipping = computed(() =>
    showToggleButton.value && !expanded.value
)

const clipStyle = computed<Record<string, string> | undefined>(() => {
    if (!needsClipping.value || props.maxLines === undefined) return undefined
    return {
        maxHeight: `${props.maxLines * LINE_HEIGHT_REM}rem`,
        overflow: 'hidden',
    }
})

const toggleExpand = () => {
    expanded.value = !expanded.value
}

const highlightedHtml = ref('')

const resolvedPrismLang = computed(() => resolveLanguage(resolvedLanguage.value))

let highlightVersion = 0

watch(
    [() => props.code, resolvedPrismLang, hasDefaultSlot],
    async ([code, lang]) => {
        // 存在默认插槽时不渲染 highlightedHtml（模板走 <slot /> 分支），
        // 跳过无谓的语言加载与 Prism.highlight 计算；hasDefaultSlot 作为 watch 源，
        // 插槽移除时经 onBeforeUpdate 同步触发补算
        if (hasDefaultSlot.value) return

        const version = ++highlightVersion

        try {
            if (lang === 'plaintext') {
                highlightedHtml.value = escapeHtml(code)
                return
            }

            if (!isLanguageLoaded(lang)) {
                const loaded = await loadLanguage(lang)
                if (version !== highlightVersion) return
                if (loaded === 'plaintext') {
                    highlightedHtml.value = escapeHtml(code)
                    return
                }
            }

            const grammar = getGrammar(lang)
            if (grammar) {
                highlightedHtml.value = Prism.highlight(code, grammar, lang)
            } else {
                highlightedHtml.value = escapeHtml(code)
            }
        } catch (e) {
            if (version !== highlightVersion) return
            console.error('[CodeBlock] syntax highlighting failed', e)
            highlightedHtml.value = escapeHtml(code)
        }
    },
    { immediate: true }
)

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
}
</script>

<template>
    <div :class="rootClasses">
        <div :class="codeBlockHeaderVariants()">
            <div class="flex items-center gap-2">
                <span :class="codeBlockLanguageVariants()">
                    {{ resolvedLanguage }}
                </span>
                <span v-if="resolvedFilename" class="text-brutal-fg/80 font-black">
                    {{ resolvedFilename }}
                </span>
            </div>
            <CopyToClipboard
                :text="code"
                :class="codeBlockCopyButtonVariants()"
            >
                <template #default="{ copied }">
                    <span>{{ copied ? t('codeBlock.copied') : t('codeBlock.copy') }}</span>
                </template>
            </CopyToClipboard>
        </div>

        <div :class="codeBlockBodyVariants()">
            <div
                v-if="showLineNumbers"
                :class="codeBlockLineNumbersVariants()"
                :style="clipStyle"
            >
                <span v-for="(_, i) in lines" :key="i">{{ i + 1 }}</span>
            </div>

            <!-- 使用默认插槽时，复制按钮文本与行号仍基于 code prop（契约见 docs/components/code-block.md）：
                 若插槽内容与 code 不一致，行号与复制内容会与展示不符 -->
            <pre v-if="slots.default" class="flex-1 min-w-0 m-0" :style="clipStyle"><code class="block whitespace-pre font-bold"><slot /></code></pre>
            <!-- 安全假设依赖已修复 XSS 漏洞的 Prism >= 1.27（lockfile 锁定 1.30.0，CVE-2021-32786/23647 均已修复），升级或替换库前需复核 -->
            <!-- eslint-disable-next-line vue/no-v-html -- prismjs highlight() 已对用户输入进行 HTML 转义 -->
            <pre v-else class="flex-1 min-w-0 m-0" :style="clipStyle"><code class="block whitespace-pre font-bold" :class="`language-${resolvedPrismLang}`" v-html="highlightedHtml" /></pre>
        </div>

        <div v-if="showToggleButton" class="flex justify-center border-t-3 border-brutal bg-brutal-muted py-2">
            <Button variant="outline" size="sm" :aria-expanded="expanded" @click="toggleExpand">
                {{ expanded ? t('codeBlock.collapse') : t('codeBlock.expand') }}
            </Button>
        </div>
    </div>
</template>
