import { beforeEach, afterEach, vi } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'

// useReducedMotion 已只读化：prefersReduced 无法在测试中直写，
// 改为 mock 其来源，通过 reducedMotionMock 驱动偏好值。
// 注意：必须动态 import useAnimation——静态 import 会在模块体执行前
// 触发 vi.mock 工厂（此时 reducedMotionMock 尚处于 TDZ）
let reducedMotionMock = ref(false)

vi.mock('./useReducedMotion', () => ({
    useReducedMotion: () => reducedMotionMock,
}))

describe('useAnimation', () => {
    let scope: ReturnType<typeof effectScope>
    let useAnimation: Awaited<ReturnType<typeof import('./useAnimation')>>['useAnimation']

    beforeEach(async () => {
        scope = effectScope(true)
        reducedMotionMock.value = false
        const mod = await import('./useAnimation')
        useAnimation = mod.useAnimation
    })

    afterEach(() => {
        scope.stop()
    })

    function createAnimation(animationClass: Parameters<typeof import('./useAnimation').useAnimation>[0] = '') {
        return scope.run(() => useAnimation(animationClass))!
    }

    it('returns animationClass and prefersReduced', () => {
        const result = createAnimation('animate-shake')
        expect(result).toHaveProperty('animationClass')
        expect(result).toHaveProperty('prefersReduced')
    })

    it('returns the animation class when prefersReduced is false', () => {
        const { animationClass } = createAnimation('animate-shake')
        expect(animationClass.value).toBe('animate-shake')
    })

    it('returns empty string when prefersReduced is true', () => {
        reducedMotionMock.value = true
        const { animationClass } = createAnimation('animate-shake')
        expect(animationClass.value).toBe('')
    })

    it('defaults to empty string when no animation class provided', () => {
        const { animationClass } = createAnimation()
        expect(animationClass.value).toBe('')
    })

    it('supports reactive animation class via getter', async () => {
        const dynamicClass = ref('animate-fade-in')
        const { animationClass } = createAnimation(() => dynamicClass.value)
        expect(animationClass.value).toBe('animate-fade-in')
        dynamicClass.value = 'animate-shake'
        await nextTick()
        expect(animationClass.value).toBe('animate-shake')
    })

    it('reacts to prefersReduced changes', async () => {
        const { animationClass } = createAnimation('animate-shake')
        expect(animationClass.value).toBe('animate-shake')

        reducedMotionMock.value = true
        await nextTick()
        expect(animationClass.value).toBe('')
    })
})
