<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import CopyToClipboard from '../copy-to-clipboard/CopyToClipboard.vue'
import Button from '../button/Button.vue'
import { cn } from '../../lib/utils'
import { useLocale } from '@/composables/useLocale'
import { codeBlockRootVariants, codeBlockHeaderVariants, codeBlockLanguageVariants, codeBlockBodyVariants, codeBlockLineNumbersVariants, codeBlockCopyButtonVariants } from './code-block-variants'
import { Prism, resolveLanguage, loadLanguage, isLanguageLoaded, getGrammar } from './prism-languages'

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

const resolvedLanguage = computed(() => props.language ?? t('codeBlock.defaultLanguage'))
const resolvedFilename = computed(() => props.filename ?? t('codeBlock.defaultFilename'))

const rootClasses = computed(() =>
    cn(codeBlockRootVariants(), props.class)
)

const lines = computed(() => props.code.split('\n'))

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
    [() => props.code, resolvedPrismLang],
    async ([code, lang]) => {
        const version = ++highlightVersion

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

            <pre v-if="$slots.default" class="flex-1 min-w-0 m-0" :style="clipStyle"><code class="block whitespace-pre font-bold"><slot /></code></pre>
            <!-- eslint-disable-next-line vue/no-v-html -- 安全假设：prismjs highlight() 已对用户输入进行 HTML 转义 -->
            <pre v-else class="flex-1 min-w-0 m-0" :style="clipStyle"><code class="block whitespace-pre font-bold" :class="`language-${resolvedPrismLang}`" v-html="highlightedHtml" /></pre>
        </div>

        <div v-if="showToggleButton" class="flex justify-center border-t-3 border-brutal bg-brutal-muted py-2">
            <Button variant="outline" size="sm" @click="toggleExpand">
                {{ expanded ? t('codeBlock.collapse') : t('codeBlock.expand') }}
            </Button>
        </div>
    </div>
</template>
