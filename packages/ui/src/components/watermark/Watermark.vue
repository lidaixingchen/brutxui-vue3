<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { createCanvasElement, getCanvas2DContext, getDevicePixelRatio, getMutationObserverCtor, isClient } from '@/lib/env'

interface WatermarkFont {
    color?: string
    fontSize?: number | string
    fontWeight?: 'normal' | 'light' | 'weight' | 'bold' | number
    fontStyle?: 'normal' | 'italic' | 'oblique'
    fontFamily?: string
}

interface WatermarkProps {
    width?: number
    height?: number
    rotate?: number
    zIndex?: number
    image?: string
    content?: string | string[]
    font?: WatermarkFont
    gap?: [number, number]
    offset?: [number, number]
}

const props = withDefaults(defineProps<WatermarkProps>(), {
    width: 120,
    height: 64,
    rotate: -22,
    zIndex: 9999,
    image: undefined,
    content: '',
    font: () => ({
        color: 'rgba(0, 0, 0, 0.15)',
        fontSize: 14,
        fontWeight: 'normal',
        fontStyle: 'normal',
        fontFamily: 'sans-serif'
    }),
    gap: () => [100, 100],
    offset: () => [0, 0]
})

const containerRef = ref<HTMLDivElement | null>(null)
const watermarkRef = ref<HTMLDivElement | null>(null)
const watermarkUrl = ref<string>('')
const watermarkKey = ref<number>(0)

let observer: MutationObserver | null = null
let isRecreating = false
let renderVersion = 0
let isUnmounted = false

const normalizedOffset = computed<[number, number]>(() => [
    props.offset?.[0] ?? 0,
    props.offset?.[1] ?? 0,
])

const normalizedGap = computed<[number, number]>(() => [
    props.gap?.[0] ?? 100,
    props.gap?.[1] ?? 100,
])

function getMarkSize(): [number, number] {
    return [props.width, props.height]
}

function getFontSizePx(size: number | string): number {
    if (typeof size === 'number') return size > 0 ? size : 14
    const str = String(size).trim()
    const pxMatch = /^(\d+(?:\.\d+)?|\.\d+)px$/i.exec(str)
    if (pxMatch) {
        const val = parseFloat(pxMatch[1])
        return val > 0 ? val : 14
    }
    const remMatch = /^(\d+(?:\.\d+)?|\.\d+)rem$/i.exec(str)
    if (remMatch) {
        const base = isClient ? (parseFloat(getComputedStyle(document.documentElement).fontSize) || 16) : 16
        const val = parseFloat(remMatch[1]) * base
        return val > 0 ? val : 14
    }
    const emMatch = /^(\d+(?:\.\d+)?|\.\d+)em$/i.exec(str)
    if (emMatch) {
        const val = parseFloat(emMatch[1]) * 16
        return val > 0 ? val : 14
    }
    const ptMatch = /^(\d+(?:\.\d+)?|\.\d+)pt$/i.exec(str)
    if (ptMatch) {
        const val = parseFloat(ptMatch[1]) * (4 / 3)
        return val > 0 ? val : 14
    }
    if (/^(\d+(?:\.\d+)?|\.\d+)$/.test(str)) {
        const val = parseFloat(str)
        return val > 0 ? val : 14
    }
    return 14
}

function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
}

function toBase64(str: string): string {
    const bytes = new TextEncoder().encode(str)
    const chars: string[] = []
    for (const byte of bytes) {
        chars.push(String.fromCharCode(byte))
    }
    return btoa(chars.join(''))
}

function drawSvgFallback() {
    const [markWidth, markHeight] = getMarkSize()
    const [gapX, gapY] = normalizedGap.value
    const canvasWidth = markWidth + gapX
    const canvasHeight = markHeight + gapY
    const { font } = props
    const color = font.color || 'rgba(0, 0, 0, 0.15)'
    const fontSize = font.fontSize || 14
    const fontSizePx = getFontSizePx(fontSize)
    const fontWeight = font.fontWeight || 'normal'
    const fontStyle = font.fontStyle || 'normal'
    const fontFamily = font.fontFamily || 'sans-serif'
    
    const contents = Array.isArray(props.content) ? props.content : [props.content]
    const lineHeight = fontSizePx + 4
    
    const textNodes = contents.map((text, index) => {
        const yOffset = (index - (contents.length - 1) / 2) * lineHeight
        return `<text x="50%" y="50%" dy="${escapeXml(String(yOffset))}" font-size="${escapeXml(String(fontSizePx))}" font-weight="${escapeXml(String(fontWeight))}" font-style="${escapeXml(String(fontStyle))}" font-family="${escapeXml(String(fontFamily))}" fill="${escapeXml(color)}" text-anchor="middle" dominant-baseline="middle">${escapeXml(text || '')}</text>`
    }).join('')
    
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${escapeXml(String(canvasWidth))}" height="${escapeXml(String(canvasHeight))}">
            <g transform="rotate(${escapeXml(String(props.rotate))} ${escapeXml(String(canvasWidth / 2))} ${escapeXml(String(canvasHeight / 2))})">
                ${textNodes}
            </g>
        </svg>
    `
    
    const base64 = toBase64(svg)
    
    watermarkUrl.value = `data:image/svg+xml;base64,${base64}`
    nextTick(() => initObserver())
}

function renderWatermark() {
    if (!isClient) return

    const currentVersion = ++renderVersion

    const contents = Array.isArray(props.content) ? props.content : [props.content]
    const hasTextContent = contents.some(text => text)
    if (!props.image && !hasTextContent) {
        watermarkUrl.value = ''
        return
    }

    const canvas = createCanvasElement()
    if (!canvas) {
        drawSvgFallback()
        return
    }
    const ctx = getCanvas2DContext(canvas)
    if (!ctx) {
        drawSvgFallback()
        return
    }

    const [markWidth, markHeight] = getMarkSize()
    const [gapX, gapY] = normalizedGap.value
    const canvasWidth = markWidth + gapX
    const canvasHeight = markHeight + gapY

    const ratio = getDevicePixelRatio()
    canvas.width = canvasWidth * ratio
    canvas.height = canvasHeight * ratio
    ctx.scale(ratio, ratio)

    ctx.translate(canvasWidth / 2, canvasHeight / 2)
    ctx.rotate((props.rotate * Math.PI) / 180)

    const isStale = () => isUnmounted || currentVersion !== renderVersion

    if (props.image) {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.referrerPolicy = 'no-referrer'
        img.src = props.image
        img.onload = () => {
            if (isStale()) return
            ctx.drawImage(img, -markWidth / 2, -markHeight / 2, markWidth, markHeight)
            if (isStale()) return
            let dataUrl: string
            try {
                dataUrl = canvas.toDataURL()
            } catch {
                drawSvgFallback()
                return
            }
            watermarkUrl.value = dataUrl
            nextTick(() => {
                if (isStale()) return
                initObserver()
            })
        }
        img.onerror = () => {
            if (isStale()) return
            drawTextWatermark(ctx, canvas)
        }
    } else {
        drawTextWatermark(ctx, canvas)
    }
}

function drawTextWatermark(
    ctx: CanvasRenderingContext2D, 
    canvas: HTMLCanvasElement
) {
    const { font } = props
    const color = font.color || 'rgba(0, 0, 0, 0.15)'
    const fontSize = font.fontSize || 14
    const fontSizePx = getFontSizePx(fontSize)
    const fontWeight = font.fontWeight || 'normal'
    const fontStyle = font.fontStyle || 'normal'
    const fontFamily = font.fontFamily || 'sans-serif'

    ctx.fillStyle = color
    ctx.font = `${fontStyle} normal ${fontWeight} ${fontSizePx}px ${fontFamily}`
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'

    const contents = Array.isArray(props.content) ? props.content : [props.content]
    const lineHeight = fontSizePx + 4

    contents.forEach((text, index) => {
        const yOffset = (index - (contents.length - 1) / 2) * lineHeight
        ctx.fillText(text || '', 0, yOffset)
    })

    let dataUrl: string
    try {
        dataUrl = canvas.toDataURL()
    } catch {
        drawSvgFallback()
        return
    }
    watermarkUrl.value = dataUrl
    nextTick(() => initObserver())
}

function recreateWatermark() {
    if (isRecreating) return
    isRecreating = true

    if (observer) {
        observer.disconnect()
        observer = null
    }

    // 水印/包裹层被移出容器时先归位：直接 bump :key 而旧节点已脱离 DOM 时，
    // Vue 的 keyed 补丁会拿不到有效锚点，挂载到 null 父节点报错
    const watermark = watermarkRef.value
    const container = containerRef.value
    if (watermark && container && !container.contains(watermark)) {
        const wrapper = watermark.parentElement
        container.appendChild(wrapper ?? watermark)
    }

    watermarkKey.value++

    renderWatermark()

    isRecreating = false
}

function initObserver() {
    if (!isClient || !containerRef.value || !watermarkRef.value) return
    if (observer) return

    const MutationObserverCtor = getMutationObserverCtor()
    if (!MutationObserverCtor) return

    observer = new MutationObserverCtor((mutations) => {
        for (const mutation of mutations) {
            const watermark = watermarkRef.value
            if (mutation.type === 'childList') {
                const removedNodes = Array.from(mutation.removedNodes)
                // 覆盖三种绕过场景：
                // 1) watermarkRef 自身被删除
                // 2) 直接删除包裹层（display: contents 的 wrapper），removedNodes 只含 wrapper
                // 3) 水印整体被移出容器（contains 判空兜底）
                if (
                    (watermark && containerRef.value && !containerRef.value.contains(watermark)) ||
                    (watermark && removedNodes.some((node) => node.contains(watermark)))
                ) {
                    recreateWatermark()
                    break
                }
            }
            if (
                mutation.type === 'attributes' &&
                (mutation.target === watermark || mutation.target === watermark?.parentElement) &&
                (mutation.attributeName === 'style' || mutation.attributeName === 'class')
            ) {
                // watermarkRef 自身或包裹层（wrapper）的 style/class 被篡改（如 display:none）也触发重建
                recreateWatermark()
                break
            }
        }
    })

    observer.observe(containerRef.value, {
        childList: true,
        attributes: true,
        subtree: true,
        attributeFilter: ['style', 'class']
    })
}

function destroyObserver() {
    if (observer) {
        observer.disconnect()
        observer = null
    }
}

onMounted(() => {
    renderWatermark()
})

onBeforeUnmount(() => {
    isUnmounted = true
    destroyObserver()
})

watch(
    () => [props.content, props.image, props.width, props.height, props.rotate, props.gap, props.font],
    () => {
        recreateWatermark()
    },
    { deep: true }
)
</script>

<template>
    <div ref="containerRef" class="relative overflow-hidden w-full h-full">
        <slot />
        <div :key="watermarkKey" style="display: contents">
            <div
                v-if="watermarkUrl"
                ref="watermarkRef"
                class="absolute pointer-events-none"
                :style="{
                    left: `${normalizedOffset[0]}px`,
                    top: `${normalizedOffset[1]}px`,
                    width: `calc(100% - ${normalizedOffset[0]}px)`,
                    height: `calc(100% - ${normalizedOffset[1]}px)`,
                    backgroundImage: `url(${watermarkUrl})`,
                    backgroundSize: `${width + normalizedGap[0]}px ${height + normalizedGap[1]}px`,
                    backgroundRepeat: 'repeat',
                    zIndex: zIndex
                }"
            />
        </div>
    </div>
</template>
