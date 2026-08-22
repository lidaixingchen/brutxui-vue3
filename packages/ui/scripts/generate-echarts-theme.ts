/**
 * ECharts 主题 JSON 生成器：
 * 从 brutx-shared-vue 的 BASE_THEME.light 读取语义色五族（primary/secondary/accent/
 * statusSuccess/info）与基础令牌（bg/fg/borderColor），产出粗野主义图表主题 JSON。
 * 单一信源契约：主题色值不经手写，构建期直接取自 design-tokens；--check 模式比对
 * 磁盘产物与重新生成结果的一致性，漂移即报错。
 *
 * 用法：pnpm --filter brutx-ui-vue exec tsx scripts/generate-echarts-theme.ts [--check]
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { BASE_THEME } from 'brutx-shared-vue'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const OUTPUT_PATH = path.resolve(
    __dirname,
    '..',
    '..',
    '..',
    'apps',
    'docs',
    'public',
    'echarts',
    'brutxui-theme.json',
)

const light = BASE_THEME.light

/** 图表序列色板：映射语义色五族（零新增令牌，R6 单一信源） */
const seriesColors = [
    light.primary,
    light.secondary,
    light.accent,
    light.statusSuccess,
    light.info,
]

const theme = {
    name: 'brutxui',
    // 视觉法则一：网格背景为高对比细实线（禁柔和灰网格）
    grid: {
        left: 48,
        top: 32,
        right: 24,
        bottom: 40,
        borderColor: light.borderColor,
        show: true,
    },
    // 视觉法则二：Tooltip 实体卡片——硬边框 + 不透明底 + 硬投影（无模糊）
    tooltip: {
        backgroundColor: light.bg,
        borderColor: light.borderColor,
        borderWidth: 3,
        borderRadius: 0,
        padding: [8, 12],
        textStyle: {
            color: light.fg,
            fontFamily: 'monospace',
            fontWeight: 'bold',
        },
        extraCssText: 'box-shadow: 4px 4px 0 0 ' + light.borderColor + ';',
    },
    color: seriesColors,
    // 视觉法则三：柱体与折线强边框、数据点为同心圆
    categoryAxis: {
        axisLine: { lineStyle: { color: light.borderColor, width: 3 } },
        axisTick: { lineStyle: { color: light.borderColor } },
        axisLabel: { color: light.fg, fontFamily: 'monospace', fontWeight: 'bold' },
    },
    valueAxis: {
        splitLine: { lineStyle: { color: light.muted, width: 1 } },
        axisLine: { show: false },
        axisLabel: { color: light.fg, fontFamily: 'monospace' },
    },
    barChart: {
        itemStyle: {
            borderColor: light.borderColor,
            borderWidth: 2,
            borderRadius: 0,
        },
    },
    lineChart: {
        lineStyle: { width: 3 },
        itemStyle: {
            borderColor: light.borderColor,
            borderWidth: 2,
        },
        symbol: 'circle',
        symbolSize: 10,
    },
}

interface BrutxUiEchartsTheme {
    name: string
    [key: string]: unknown
}

function serialize(): string {
    return JSON.stringify(theme, null, 2) + '\n'
}

async function main(): Promise<void> {
    const isCheckMode = process.argv.slice(2).includes('--check')
    const generated = serialize()

    if (isCheckMode) {
        if (!existsSync(OUTPUT_PATH)) {
            console.error(`✗ 主题 JSON 不存在：${OUTPUT_PATH}`)
            process.exit(1)
        }
        const onDisk = readFileSync(OUTPUT_PATH, 'utf-8')
        const diskTheme = JSON.parse(onDisk) as BrutxUiEchartsTheme
        const generatedTheme = JSON.parse(generated) as BrutxUiEchartsTheme
        if (JSON.stringify(diskTheme) !== JSON.stringify(generatedTheme)) {
            console.error('✗ ECharts 主题 JSON 与 design-tokens 派生结果不一致，需重新生成。')
            process.exit(1)
        }
        console.log('✓ ECharts 主题 JSON 与 design-tokens 单一信源一致')
        return
    }

    mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true })
    writeFileSync(OUTPUT_PATH, generated, 'utf-8')
    console.log(`✓ ECharts 主题 JSON 已生成：${OUTPUT_PATH}`)
}

main().catch((err: unknown) => {
    console.error(err)
    process.exit(1)
})
