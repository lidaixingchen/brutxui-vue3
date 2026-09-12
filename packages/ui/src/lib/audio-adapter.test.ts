import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WebAudioAdapter } from './audio-adapter'

describe('WebAudioAdapter', () => {
    let mockCtx: any
    let mockOsc: any
    let mockGain: any
    let mockBufferSource: any

    beforeEach(() => {
        mockOsc = {
            type: 'sine',
            frequency: {
                setValueAtTime: vi.fn(),
                exponentialRampToValueAtTime: vi.fn(),
                linearRampToValueAtTime: vi.fn(),
            },
            connect: vi.fn(),
            disconnect: vi.fn(),
            start: vi.fn(),
            stop: vi.fn(),
            onended: null,
        }

        mockGain = {
            gain: {
                setValueAtTime: vi.fn(),
                exponentialRampToValueAtTime: vi.fn(),
            },
            connect: vi.fn(),
            disconnect: vi.fn(),
        }

        mockBufferSource = {
            buffer: null,
            connect: vi.fn(),
            disconnect: vi.fn(),
            start: vi.fn(),
            stop: vi.fn(),
            onended: null,
        }

        mockCtx = {
            state: 'running',
            sampleRate: 44100,
            currentTime: 0,
            destination: {},
            createOscillator: vi.fn(() => mockOsc),
            createGain: vi.fn(() => mockGain),
            createBufferSource: vi.fn(() => mockBufferSource),
            createBuffer: vi.fn((_channels, length, _rate) => ({
                getChannelData: vi.fn(() => new Float32Array(length)),
            })),
            resume: vi.fn().mockResolvedValue(undefined),
            close: vi.fn().mockResolvedValue(undefined),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        }
    })

    it('reuses cached AudioBuffer for consecutive snap sounds in the same generation', () => {
        const adapter = new WebAudioAdapter(mockCtx as AudioContext, 1)

        const handle1 = adapter.play('snap')
        expect(handle1).not.toBeNull()
        expect(mockCtx.createBuffer).toHaveBeenCalledTimes(1)
        expect(mockCtx.createBufferSource).toHaveBeenCalledTimes(1)

        // Second snap reuse
        const handle2 = adapter.play('snap')
        expect(handle2).not.toBeNull()
        expect(mockCtx.createBuffer).toHaveBeenCalledTimes(1) // NOT called again!
        expect(mockCtx.createBufferSource).toHaveBeenCalledTimes(2)
    })

    it('cancels playback via handle idempotently', () => {
        const adapter = new WebAudioAdapter(mockCtx as AudioContext, 1)
        const handle = adapter.play('click')
        expect(handle).not.toBeNull()

        handle?.cancel()
        expect(mockOsc.stop).toHaveBeenCalled()
        expect(mockOsc.disconnect).toHaveBeenCalled()
        expect(mockGain.disconnect).toHaveBeenCalled()

        // Calling cancel again is safe and idempotent
        handle?.cancel()
    })

    it('clears buffer cache and closes context on close', async () => {
        const adapter = new WebAudioAdapter(mockCtx as AudioContext, 1)
        adapter.play('snap')
        expect(mockCtx.createBuffer).toHaveBeenCalledTimes(1)

        await adapter.close()
        expect(mockCtx.close).toHaveBeenCalledTimes(1)
        expect(adapter.state).toBe('closed')
    })
})
