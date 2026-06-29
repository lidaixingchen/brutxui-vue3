import { effectScope, nextTick, ref } from 'vue'
import { useAnimation } from './useAnimation'

describe('useAnimation', () => {
    let scope: ReturnType<typeof effectScope>

    beforeEach(() => {
        scope = effectScope(true)
    })

    afterEach(() => {
        scope.stop()
    })

    function createAnimation(animationClass: Parameters<typeof useAnimation>[0] = '') {
        return scope.run(() => useAnimation(animationClass))!
    }

    it('returns animationClass and prefersReduced', () => {
        const result = createAnimation('animate-shake')
        expect(result).toHaveProperty('animationClass')
        expect(result).toHaveProperty('prefersReduced')
    })

    it('returns the animation class when prefersReduced is false', () => {
        const { animationClass, prefersReduced } = createAnimation('animate-shake')
        prefersReduced.value = false
        expect(animationClass.value).toBe('animate-shake')
    })

    it('returns empty string when prefersReduced is true', () => {
        const { animationClass, prefersReduced } = createAnimation('animate-shake')
        prefersReduced.value = true
        expect(animationClass.value).toBe('')
    })

    it('defaults to empty string when no animation class provided', () => {
        const { animationClass, prefersReduced } = createAnimation()
        prefersReduced.value = false
        expect(animationClass.value).toBe('')
    })

    it('supports reactive animation class via getter', async () => {
        const dynamicClass = ref('animate-fade-in')
        const { animationClass, prefersReduced } = createAnimation(() => dynamicClass.value)
        prefersReduced.value = false
        expect(animationClass.value).toBe('animate-fade-in')
        dynamicClass.value = 'animate-shake'
        await nextTick()
        expect(animationClass.value).toBe('animate-shake')
    })

    it('reacts to prefersReduced changes', async () => {
        const { animationClass, prefersReduced } = createAnimation('animate-shake')
        prefersReduced.value = false
        expect(animationClass.value).toBe('animate-shake')
        prefersReduced.value = true
        await nextTick()
        expect(animationClass.value).toBe('')
    })
})
