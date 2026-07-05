<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { isClient } from '@/lib/env'

interface WatermarkFont {
    color?: string
    fontSize?: number | string
    fontWeight?: 'normal' | 'light' | 'weight' | 'bold' | number
    fontStyle?: 'none' | 'normal' | 'italic' | 'oblique'
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
    content: 'BRUTXUI',
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

function getMarkSize() {
    return [props.width, props.height]
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
    const binString = String.fromCharCode(...bytes)
    return btoa(binString)
}

function drawSvgFallback() {
    const [markWidth, markHeight] = getMarkSize()
    const canvasWidth = markWidth + props.gap[0]
    const canvasHeight = markHeight + props.gap[1]
    const { font } = props
    const color = font.color || 'rgba(0, 0, 0, 0.15)'
    const fontSize = font.fontSize || 14
    const fontWeight = font.fontWeight || 'normal'
    const fontStyle = font.fontStyle || 'normal'
    const fontFamily = font.fontFamily || 'sans-serif'
    
    const contents = Array.isArray(props.content) ? props.content : [props.content]
    const lineHeight = typeof fontSize === 'number' ? fontSize + 4 : parseInt(String(fontSize)) + 4
    
    const textNodes = contents.map((text, index) => {
        const yOffset = (index - (contents.length - 1) / 2) * lineHeight
        return `<text x="50%" y="50%" dy="${yOffset}" font-size="${fontSize}" font-weight="${fontWeight}" font-style="${fontStyle}" font-family="${fontFamily}" fill="${color}" text-anchor="middle" dominant-baseline="middle">${escapeXml(text)}</text>`
    }).join('')
    
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${canvasHeight}">
            <g transform="rotate(${props.rotate} ${canvasWidth / 2} ${canvasHeight / 2})">
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

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) {
        drawSvgFallback()
        return
    }

    const [markWidth, markHeight] = getMarkSize()
    const canvasWidth = markWidth + props.gap[0]
    const canvasHeight = markHeight + props.gap[1]

    const ratio = window.devicePixelRatio || 1
    canvas.width = canvasWidth * ratio
    canvas.height = canvasHeight * ratio
    ctx.scale(ratio, ratio)

    ctx.translate(canvasWidth / 2, canvasHeight / 2)
    ctx.rotate((props.rotate * Math.PI) / 180)

    if (props.image) {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.referrerPolicy = 'no-referrer'
        img.src = props.image
        img.onload = () => {
            ctx.drawImage(img, -markWidth / 2, -markHeight / 2, markWidth, markHeight)
            watermarkUrl.value = canvas.toDataURL()
            nextTick(() => initObserver())
        }
        img.onerror = () => {
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
    const fontWeight = font.fontWeight || 'normal'
    const fontStyle = font.fontStyle || 'normal'
    const fontFamily = font.fontFamily || 'sans-serif'

    ctx.fillStyle = color
    ctx.font = `${fontStyle} normal ${fontWeight} ${typeof fontSize === 'number' ? `${fontSize}px` : fontSize} ${fontFamily}`
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'

    const contents = Array.isArray(props.content) ? props.content : [props.content]
    const lineHeight = typeof fontSize === 'number' ? fontSize + 4 : parseInt(String(fontSize)) + 4

    contents.forEach((text, index) => {
        const yOffset = (index - (contents.length - 1) / 2) * lineHeight
        ctx.fillText(text || '', 0, yOffset)
    })

    watermarkUrl.value = canvas.toDataURL()
    nextTick(() => initObserver())
}

function recreateWatermark() {
    if (isRecreating) return
    isRecreating = true

    if (observer) {
        observer.disconnect()
        observer = null
    }

    watermarkKey.value++

    renderWatermark()

    isRecreating = false
}

function initObserver() {
    if (!isClient || !containerRef.value || !watermarkRef.value) return
    if (observer) return

    observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                const removedNodes = Array.from(mutation.removedNodes)
                if (removedNodes.includes(watermarkRef.value!)) {
                    recreateWatermark()
                    break
                }
            }
            if (
                mutation.type === 'attributes' && 
                mutation.target === watermarkRef.value && 
                (mutation.attributeName === 'style' || mutation.attributeName === 'class')
            ) {
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
                    left: `${offset[0]}px`,
                    top: `${offset[1]}px`,
                    width: `calc(100% - ${offset[0]}px)`,
                    height: `calc(100% - ${offset[1]}px)`,
                    backgroundImage: `url(${watermarkUrl})`,
                    backgroundSize: `${width + gap[0]}px ${height + gap[1]}px`,
                    backgroundRepeat: 'repeat',
                    zIndex: zIndex
                }"
            />
        </div>
    </div>
</template>
