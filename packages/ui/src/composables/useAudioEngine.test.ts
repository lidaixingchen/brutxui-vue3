import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import { useAudioEngine } from './useAudioEngine'

// Mock AudioContext
const mockOscillator = {
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    type: 'triangle' as OscillatorType,
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

// Mock env module-level exports
vi.mock('../lib/env', () => ({
    isClient: true,
    getAudioContextCtor: () => globalThis.AudioContext ?? null,
}))

describe('useAudioEngine', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(1000)
        mockAudioContext.state = 'running'
        // Use a class-based mock so `new AudioContext()` works as a constructor
        vi.stubGlobal('AudioContext', class {
            createOscillator = mockAudioContext.createOscillator
            createGain = mockAudioContext.createGain
            destination = mockAudioContext.destination
            currentTime = mockAudioContext.currentTime
            get state() { return mockAudioContext.state }
            resume = mockAudioContext.resume
            close = mockAudioContext.close
        })
    })

    afterEach(() => {
        vi.useRealTimers()
        vi.clearAllMocks()
        vi.unstubAllGlobals()
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
        const { playSound, dispose } = useAudioEngine(enabled)

        // Create the AudioContext first by playing a sound
        playSound('type')
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

    it('does not throw when AudioContext construction fails', () => {
        vi.stubGlobal('AudioContext', class {
            constructor() {
                throw new Error('blocked')
            }
        })

        const enabled = ref(true)
        const { playSound } = useAudioEngine(enabled)

        expect(() => playSound('type')).not.toThrow()
        expect(mockAudioContext.createOscillator).not.toHaveBeenCalled()
    })
})
