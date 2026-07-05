import { onUnmounted, type Ref } from 'vue'
import { isClient } from '../lib/env'
import {
    AUDIO_TYPE_THROTTLE_MS,
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
} from '../lib/defaults'

export interface UseAudioEngineReturn {
    playSound: (type: 'type' | 'success' | 'fail') => void
    dispose: () => void
}

export function useAudioEngine(enabled: Ref<boolean>): UseAudioEngineReturn {
    let audioCtx: AudioContext | null = null
    let lastTypeSoundTime = 0

    const getCtx = () => {
        if (!audioCtx && isClient) {
            audioCtx = new AudioContext()
        }
        return audioCtx
    }

    const playSound = (type: 'type' | 'success' | 'fail') => {
        if (!enabled.value) return
        if (type === 'type') {
            const now = Date.now()
            if (now - lastTypeSoundTime < AUDIO_TYPE_THROTTLE_MS) return
            lastTypeSoundTime = now
        }
        
        const ctx = getCtx()
        if (!ctx) return
        
        if (ctx.state === 'suspended') {
            void ctx.resume()
        }

        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.onended = () => {
            osc.disconnect()
            gain.disconnect()
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
        }
    }

    const dispose = () => {
        audioCtx?.close()
        audioCtx = null
    }

    onUnmounted(() => {
        dispose()
    })

    return { playSound, dispose }
}
