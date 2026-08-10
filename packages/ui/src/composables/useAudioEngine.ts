import { onUnmounted, type Ref } from 'vue'
import { getAudioContextCtor } from '../lib/env'
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
    let audioUnavailable = false
    let lastTypeSoundTime = 0

    const getCtx = () => {
        if (!audioCtx && !audioUnavailable) {
            const AudioContextCtor = getAudioContextCtor()
            if (!AudioContextCtor) {
                audioUnavailable = true
                return null
            }

            try {
                audioCtx = new AudioContextCtor()
            } catch {
                audioUnavailable = true
                return null
            }
        }
        return audioCtx
    }

    const scheduleSound = (ctx: AudioContext, type: 'type' | 'success' | 'fail') => {
        try {
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
        } catch (err) {
            // 单次调度失败（如参数非法）不应永久禁用音效，记录日志便于排查
            console.warn('[useAudioEngine] sound scheduling failed', err)
        }
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

        // ctx.resume() 是异步的：若在 resume 完成前就基于当前（可能仍冻结的）currentTime
        // 调度节点，resume 被自动播放策略拒绝或延迟时节点永远不会播放，
        // 且 stop 事件未到达、onended 不触发，osc/gain 的 disconnect 清理永远不会执行。
        // 因此等待 resume 成功后再创建与调度节点。
        if (ctx.state === 'suspended') {
            void ctx.resume()
                .then(() => {
                    // resume 等待期间可能已 dispose（引用置空）或上下文被外部关闭：
                    // 跳过本次调度，避免在已关闭的上下文上创建节点
                    if (audioCtx !== ctx || ctx.state === 'closed') return
                    scheduleSound(ctx, type)
                })
                .catch((err: unknown) => {
                    console.warn('[useAudioEngine] audio context resume failed', err)
                })
        } else {
            scheduleSound(ctx, type)
        }
    }

    const dispose = () => {
        // 置为不可用，阻止 dispose 后外部仍持有 playSound 引用时重建 AudioContext
        audioUnavailable = true
        const ctx = audioCtx
        audioCtx = null
        if (ctx && ctx.state !== 'closed') {
            void ctx.close().catch(() => {})
        }
    }

    onUnmounted(() => {
        dispose()
    })

    return { playSound, dispose }
}
