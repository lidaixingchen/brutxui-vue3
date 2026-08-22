import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useBrutalHaptics } from './useBrutalHaptics'

const mocks = vi.hoisted(() => ({
    playSound: vi.fn(),
    dispose: vi.fn(),
    useAudioEngine: vi.fn(),
}))

vi.mock('./useAudioEngine', () => ({
    useAudioEngine: mocks.useAudioEngine,
}))

describe('useBrutalHaptics', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mocks.useAudioEngine.mockReturnValue({ playSound: mocks.playSound, dispose: mocks.dispose })
    })

    it('默认静音：不开启 sound 时任何触觉方法都不触发播放', () => {
        const haptics = useBrutalHaptics()
        haptics.click()
        haptics.snap()
        haptics.beep()
        expect(mocks.playSound).not.toHaveBeenCalled()
    })

    it('显式传入非 true 的 sound 值时保持静音', () => {
        const haptics = useBrutalHaptics({ sound: false })
        haptics.beep()
        expect(mocks.playSound).not.toHaveBeenCalled()
    })

    it('sound: true 时 click/snap/beep 分别委托对应配方', () => {
        const haptics = useBrutalHaptics({ sound: true })
        haptics.click()
        haptics.snap()
        haptics.beep()
        expect(mocks.playSound).toHaveBeenNthCalledWith(1, 'click')
        expect(mocks.playSound).toHaveBeenNthCalledWith(2, 'snap')
        expect(mocks.playSound).toHaveBeenNthCalledWith(3, 'beep')
    })

    it('向引擎传递由 sound 派生的启用状态且引擎仅初始化一次', () => {
        useBrutalHaptics({ sound: true })
        expect(mocks.useAudioEngine).toHaveBeenCalledTimes(1)
    })
})
