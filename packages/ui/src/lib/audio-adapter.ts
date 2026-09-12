import {
    AUDIO_TYPE_BASE_FREQ,
    AUDIO_TYPE_FREQ_RANGE,
    AUDIO_TYPE_GAIN,
    AUDIO_TYPE_GAIN_END,
    AUDIO_TYPE_DURATION,
    AUDIO_SUCCESS_START_FREQ,
    AUDIO_SUCCESS_END_FREQ,
    AUDIO_SUCCESS_GAIN,
    AUDIO_SUCCESS_GAIN_END,
    AUDIO_SUCCESS_DURATION,
    AUDIO_FAIL_FREQ_1,
    AUDIO_FAIL_FREQ_2,
    AUDIO_FAIL_FREQ_SHIFT_TIME,
    AUDIO_FAIL_GAIN,
    AUDIO_FAIL_GAIN_END,
    AUDIO_FAIL_DURATION,
    AUDIO_CLICK_START_FREQ,
    AUDIO_CLICK_END_FREQ,
    AUDIO_CLICK_GAIN,
    AUDIO_CLICK_GAIN_END,
    AUDIO_CLICK_DURATION,
    AUDIO_SNAP_DURATION,
    AUDIO_SNAP_GAIN,
    AUDIO_SNAP_GAIN_END,
    AUDIO_BEEP_FREQ,
    AUDIO_BEEP_GAIN,
    AUDIO_BEEP_GAIN_END,
    AUDIO_BEEP_DURATION,
} from './defaults'
import { getAudioContextCtor } from './env'

export type SoundType = 'type' | 'success' | 'fail' | 'click' | 'snap' | 'beep'

export type AudioAdapterState = 'suspended' | 'running' | 'interrupted' | 'closed'

export interface AudioPlaybackHandle {
    cancel: () => void
    onEnded: (callback: () => void) => () => void
}

export interface AudioAdapter {
    readonly state: AudioAdapterState
    readonly generation: number
    readonly sampleRate: number
    onStateChange: (listener: (state: AudioAdapterState) => void) => () => void
    resume: () => Promise<void>
    close: () => Promise<void>
    play: (type: SoundType) => AudioPlaybackHandle | null
}

export class WebAudioAdapter implements AudioAdapter {
    private readonly ctx: AudioContext
    readonly generation: number
    private readonly stateListeners = new Set<(state: AudioAdapterState) => void>()
    private readonly noiseBufferCache = new Map<string, AudioBuffer>()
    private handleStateChange: (() => void) | null = null
    private isClosed = false

    constructor(ctx: AudioContext, generation: number) {
        this.ctx = ctx
        this.generation = generation

        this.handleStateChange = () => {
            const currentState = this.state
            for (const listener of this.stateListeners) {
                listener(currentState)
            }
        }
        if (typeof this.ctx.addEventListener === 'function') {
            this.ctx.addEventListener('statechange', this.handleStateChange)
        }
    }

    get state(): AudioAdapterState {
        if (this.isClosed) return 'closed'
        const rawState = this.ctx.state as string
        if (rawState === 'interrupted') return 'interrupted'
        if (rawState === 'running') return 'running'
        if (rawState === 'suspended') return 'suspended'
        return 'closed'
    }

    get sampleRate(): number {
        return this.ctx.sampleRate
    }

    onStateChange(listener: (state: AudioAdapterState) => void): () => void {
        this.stateListeners.add(listener)
        return () => {
            this.stateListeners.delete(listener)
        }
    }

    async resume(): Promise<void> {
        if (this.isClosed) return
        await this.ctx.resume()
    }

    async close(): Promise<void> {
        if (this.isClosed) return
        this.isClosed = true
        if (this.handleStateChange && typeof this.ctx.removeEventListener === 'function') {
            this.ctx.removeEventListener('statechange', this.handleStateChange)
            this.handleStateChange = null
        }
        this.noiseBufferCache.clear()
        this.stateListeners.clear()
        try {
            if (this.ctx.state !== 'closed') {
                await this.ctx.close()
            }
        } catch (err) {
            console.warn('[WebAudioAdapter] failed to close AudioContext', err)
            throw err
        }
    }

    private getOrCreateNoiseBuffer(durationSeconds: number): AudioBuffer {
        const key = `${this.ctx.sampleRate}:${durationSeconds}`
        const cached = this.noiseBufferCache.get(key)
        if (cached) return cached

        const sampleCount = Math.ceil(this.ctx.sampleRate * durationSeconds)
        const buffer = this.ctx.createBuffer(1, sampleCount, this.ctx.sampleRate)
        const channelData = buffer.getChannelData(0)
        for (let i = 0; i < sampleCount; i++) {
            channelData[i] = Math.random() * 2 - 1
        }
        this.noiseBufferCache.set(key, buffer)
        return buffer
    }

    play(type: SoundType): AudioPlaybackHandle | null {
        if (this.isClosed || this.state === 'closed') return null

        const ctx = this.ctx
        let sourceNode: AudioScheduledSourceNode | null = null
        let gainNode: GainNode | null = null
        let isDone = false
        const endedCallbacks = new Set<() => void>()

        const cleanup = () => {
            if (isDone) return
            isDone = true
            if (sourceNode) {
                try {
                    sourceNode.stop()
                } catch {
                    // Ignore stop error if already stopped
                }
                try {
                    sourceNode.disconnect()
                } catch {
                    // Ignore disconnect error
                }
                sourceNode.onended = null
            }
            if (gainNode) {
                try {
                    gainNode.disconnect()
                } catch {
                    // Ignore disconnect error
                }
            }
            for (const cb of endedCallbacks) {
                cb()
            }
            endedCallbacks.clear()
        }

        try {
            if (type === 'snap') {
                const source = ctx.createBufferSource()
                sourceNode = source
                const noiseGain = ctx.createGain()
                gainNode = noiseGain

                source.buffer = this.getOrCreateNoiseBuffer(AUDIO_SNAP_DURATION)
                source.connect(noiseGain)
                noiseGain.connect(ctx.destination)

                source.onended = () => {
                    cleanup()
                }

                noiseGain.gain.setValueAtTime(AUDIO_SNAP_GAIN, ctx.currentTime)
                noiseGain.gain.exponentialRampToValueAtTime(AUDIO_SNAP_GAIN_END, ctx.currentTime + AUDIO_SNAP_DURATION)
                source.start()
                source.stop(ctx.currentTime + AUDIO_SNAP_DURATION)
            } else {
                const osc = ctx.createOscillator()
                sourceNode = osc
                const gain = ctx.createGain()
                gainNode = gain

                osc.connect(gain)
                gain.connect(ctx.destination)

                osc.onended = () => {
                    cleanup()
                }

                if (type === 'type') {
                    osc.type = 'triangle'
                    osc.frequency.setValueAtTime(AUDIO_TYPE_BASE_FREQ + Math.random() * AUDIO_TYPE_FREQ_RANGE, ctx.currentTime)
                    gain.gain.setValueAtTime(AUDIO_TYPE_GAIN, ctx.currentTime)
                    gain.gain.exponentialRampToValueAtTime(AUDIO_TYPE_GAIN_END, ctx.currentTime + AUDIO_TYPE_DURATION)
                    osc.start()
                    osc.stop(ctx.currentTime + AUDIO_TYPE_DURATION)
                } else if (type === 'success') {
                    osc.type = 'sine'
                    osc.frequency.setValueAtTime(AUDIO_SUCCESS_START_FREQ, ctx.currentTime)
                    osc.frequency.exponentialRampToValueAtTime(AUDIO_SUCCESS_END_FREQ, ctx.currentTime + AUDIO_SUCCESS_DURATION)
                    gain.gain.setValueAtTime(AUDIO_SUCCESS_GAIN, ctx.currentTime)
                    gain.gain.exponentialRampToValueAtTime(AUDIO_SUCCESS_GAIN_END, ctx.currentTime + AUDIO_SUCCESS_DURATION)
                    osc.start()
                    osc.stop(ctx.currentTime + AUDIO_SUCCESS_DURATION)
                } else if (type === 'fail') {
                    osc.type = 'square'
                    osc.frequency.setValueAtTime(AUDIO_FAIL_FREQ_1, ctx.currentTime)
                    osc.frequency.setValueAtTime(AUDIO_FAIL_FREQ_2, ctx.currentTime + AUDIO_FAIL_FREQ_SHIFT_TIME)
                    gain.gain.setValueAtTime(AUDIO_FAIL_GAIN, ctx.currentTime)
                    gain.gain.exponentialRampToValueAtTime(AUDIO_FAIL_GAIN_END, ctx.currentTime + AUDIO_FAIL_DURATION)
                    osc.start()
                    osc.stop(ctx.currentTime + AUDIO_FAIL_DURATION)
                } else if (type === 'click') {
                    osc.type = 'square'
                    osc.frequency.setValueAtTime(AUDIO_CLICK_START_FREQ, ctx.currentTime)
                    osc.frequency.linearRampToValueAtTime(AUDIO_CLICK_END_FREQ, ctx.currentTime + AUDIO_CLICK_DURATION)
                    gain.gain.setValueAtTime(AUDIO_CLICK_GAIN, ctx.currentTime)
                    gain.gain.exponentialRampToValueAtTime(AUDIO_CLICK_GAIN_END, ctx.currentTime + AUDIO_CLICK_DURATION)
                    osc.start()
                    osc.stop(ctx.currentTime + AUDIO_CLICK_DURATION)
                } else if (type === 'beep') {
                    osc.type = 'sine'
                    osc.frequency.setValueAtTime(AUDIO_BEEP_FREQ, ctx.currentTime)
                    gain.gain.setValueAtTime(AUDIO_BEEP_GAIN, ctx.currentTime)
                    gain.gain.exponentialRampToValueAtTime(AUDIO_BEEP_GAIN_END, ctx.currentTime + AUDIO_BEEP_DURATION)
                    osc.start()
                    osc.stop(ctx.currentTime + AUDIO_BEEP_DURATION)
                }
            }

            return {
                cancel: () => {
                    cleanup()
                },
                onEnded: (callback: () => void) => {
                    if (isDone) {
                        callback()
                        return () => {}
                    }
                    endedCallbacks.add(callback)
                    return () => {
                        endedCallbacks.delete(callback)
                    }
                },
            }
        } catch (err) {
            console.warn('[WebAudioAdapter] sound playback failed', err)
            cleanup()
            return null
        }
    }
}

export function createWebAudioAdapter(generation: number, ctor?: typeof AudioContext): AudioAdapter | null {
    const AudioContextCtor = ctor ?? getAudioContextCtor()
    if (!AudioContextCtor) return null
    try {
        const ctx = new AudioContextCtor()
        return new WebAudioAdapter(ctx, generation)
    } catch {
        return null
    }
}
