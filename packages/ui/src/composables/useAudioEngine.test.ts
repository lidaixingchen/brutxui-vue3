import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import { useAudioEngine } from './useAudioEngine'

// Mock AudioContext
const mockOscillator = {
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    frequency: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
    },
    onended: null as (() => void) | null,
}

const mockGain = {
    connect: vi.fn(),
    disconnect: vi.fn(),
    gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
    },
}

const mockAudioContext = {
    createOscillator: vi.fn(() => mockOscillator),
    createGain: vi.fn(() => mockGain),
    destination: {},
    currentTime: 0,
    state: 'running',
    resume: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
}

describe('useAudioEngine', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.stubGlobal('AudioContext', vi.fn(() => mockAudioContext))
        vi.stubGlobal('isClient', true)
    })

    afterEach(() => {
        vi.useRealTimers()
        vi.restoreAllMocks()
    })

    it('playSound does nothing when disabled', () => {
        const enabled = ref(false)
        const { playSound } = useAudioEngine(enabled)

        playSound('type')
        expect(mockAudioContext.createOscillator).not.toHaveBeenCalled()
    })

    it('playSound creates oscillator for type sound', () => {
        const enabled = ref(true)
        const { playSound } = useAudioEngine(enabled)

        playSound('type')
        expect(mockAudioContext.createOscillator).toHaveBeenCalled()
        expect(mockAudioContext.createGain).toHaveBeenCalled()
        expect(mockOscillator.start).toHaveBeenCalled()
        expect(mockOscillator.stop).toHaveBeenCalled()
    })

    it('playSound throttles type sounds', () => {
        const enabled = ref(true)
        const { playSound } = useAudioEngine(enabled)

        playSound('type')
        playSound('type') // Should be throttled

        expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(1)
    })

    it('playSound creates oscillator for success sound', () => {
        const enabled = ref(true)
        const { playSound } = useAudioEngine(enabled)

        playSound('success')
        expect(mockAudioContext.createOscillator).toHaveBeenCalled()
        expect(mockOscillator.type).toBe('sine')
    })

    it('playSound creates oscillator for fail sound', () => {
        const enabled = ref(true)
        const { playSound } = useAudioEngine(enabled)

        playSound('fail')
        expect(mockAudioContext.createOscillator).toHaveBeenCalled()
        expect(mockOscillator.type).toBe('square')
    })

    it('dispose closes audio context', () => {
        const enabled = ref(true)
        const { dispose } = useAudioEngine(enabled)

        dispose()
        expect(mockAudioContext.close).toHaveBeenCalled()
    })

    it('resumes suspended audio context', () => {
        mockAudioContext.state = 'suspended'
        const enabled = ref(true)
        const { playSound } = useAudioEngine(enabled)

        playSound('type')
        expect(mockAudioContext.resume).toHaveBeenCalled()
    })
})
