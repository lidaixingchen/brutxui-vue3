export const COST_PROFILE_VERSION = 'button-cost-v1'

export const CONSUMER_TOOLCHAIN_PACKAGES = {
    '@tailwindcss/vite': '4.3.0',
    '@vitejs/plugin-vue': '6.0.7',
    vite: '8.0.16',
    vue: '3.5.35',
} as const

export const CONSUMER_UI_PEER_PACKAGES = {
    '@lucide/vue': '1.17.0',
    '@tanstack/vue-virtual': '3.13.30',
    'embla-carousel-vue': '8.6.0',
    prismjs: '1.30.0',
    'reka-ui': '2.9.9',
    tailwindcss: '4.3.0',
    'v-calendar': '3.1.2',
    'vee-validate': '4.15.1',
    vue: '3.5.35',
} as const

export const CONSUMER_OPTIONAL_PEER_PACKAGES = [
    '@lucide/vue',
    '@tanstack/vue-virtual',
    'embla-carousel-vue',
    'prismjs',
    'v-calendar',
    'vee-validate',
] as const

export const COST_SCENARIOS = [
    { id: 'empty', component: null, importPath: null, dynamic: false },
    { id: 'button-root', component: 'Button', importPath: 'brutx-ui-vue', dynamic: false },
    { id: 'button-subpath', component: 'Button', importPath: 'brutx-ui-vue/button', dynamic: false },
    { id: 'button-root-dynamic', component: 'Button', importPath: 'brutx-ui-vue', dynamic: true },
] as const

export type CostScenario = (typeof COST_SCENARIOS)[number]

export function selectCostScenarios(scenarioIds: string[], assertResources: boolean): CostScenario[] {
    const unknownScenarios = scenarioIds.filter(id => !COST_SCENARIOS.some(scenario => scenario.id === id))
    if (unknownScenarios.length > 0) throw new Error(`未知成本场景：${unknownScenarios.join(', ')}`)

    const scenarios = scenarioIds.length > 0
        ? COST_SCENARIOS.filter(scenario => scenarioIds.includes(scenario.id))
        : [...COST_SCENARIOS]
    const requiredScenarioIds = assertResources ? ['empty', 'button-root'] : ['empty']
    const missingScenarios = requiredScenarioIds.filter(id => !scenarios.some(scenario => scenario.id === id))
    if (missingScenarios.length > 0) {
        throw new Error(`当前成本配置缺少必需场景：${missingScenarios.join(', ')}`)
    }
    return [...scenarios]
}

export const BROWSER_PROFILES = [
    {
        id: 'button-effect-none',
        effect: 'none',
        trigger: 'none',
        reducedMotion: 'no-preference',
        lifecycle: 'standard',
        expected: {
            afterSettle: { activeIntervals: 0, activeTimeouts: 0, activeChangeListeners: 0, textReads: 0, dataTextWrites: 0 },
            afterUnmount: { activeIntervals: 0, activeTimeouts: 0, activeChangeListeners: 0, textReads: 0, dataTextWrites: 0 },
        },
    },
    {
        id: 'button-effect-none-autoplay',
        effect: 'none',
        trigger: 'autoplay',
        reducedMotion: 'no-preference',
        lifecycle: 'standard',
        expected: {
            afterSettle: { activeIntervals: 0, activeTimeouts: 0, activeChangeListeners: 0, textReads: 0, dataTextWrites: 0 },
            afterUnmount: { activeIntervals: 0, activeTimeouts: 0, activeChangeListeners: 0, textReads: 0, dataTextWrites: 0 },
        },
    },
    {
        id: 'button-effect-glitch-autoplay',
        effect: 'glitch',
        trigger: 'autoplay',
        reducedMotion: 'no-preference',
        lifecycle: 'standard',
        expected: {
            afterSettle: { activeIntervals: 1, activeTimeouts: 0, activeChangeListeners: 1 },
            afterUnmount: { activeIntervals: 0, activeTimeouts: 0, activeChangeListeners: 0 },
        },
    },
    {
        id: 'button-effect-glitch-reduced-motion',
        effect: 'glitch',
        trigger: 'autoplay',
        reducedMotion: 'reduce',
        lifecycle: 'standard',
        expected: {
            afterSettle: { activeIntervals: 0, activeTimeouts: 0, activeChangeListeners: 1 },
            afterUnmount: { activeIntervals: 0, activeTimeouts: 0, activeChangeListeners: 0 },
        },
    },
    {
        id: 'button-effect-glitch-keep-alive',
        effect: 'glitch',
        trigger: 'autoplay',
        reducedMotion: 'no-preference',
        lifecycle: 'keep-alive',
        expected: {
            afterSettle: { activeIntervals: 1, activeTimeouts: 0, activeChangeListeners: 1 },
            afterDeactivate: { activeIntervals: 0, activeTimeouts: 0, activeChangeListeners: 0 },
            afterActivate: { activeIntervals: 1, activeTimeouts: 0, activeChangeListeners: 1 },
            afterUnmount: { activeIntervals: 0, activeTimeouts: 0, activeChangeListeners: 0 },
        },
    },
] as const

export const MEASUREMENT_PROFILE = {
    warmupIterations: 2,
    measuredIterations: 9,
    animationFrameCount: 2,
    autoplayIntervalMs: 50,
    autoplaySettleMs: 90,
    serverPort: 0,
    compressionLevel: 9,
    noisePolicy: '丢弃预热样本，保留全部测量样本并报告 p50/p95',
} as const

export const LOCKED_PACKAGE_NAMES = [
    ...Object.keys(CONSUMER_TOOLCHAIN_PACKAGES),
    ...Object.keys(CONSUMER_UI_PEER_PACKAGES),
] as const
