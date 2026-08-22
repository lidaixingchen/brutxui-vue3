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
} from '../lib/defaults'

/** 引擎音效配方类型：type/success/fail 为既有输入反馈，click/snap/beep 为机械触觉音效 */
export type SoundType = 'type' | 'success' | 'fail' | 'click' | 'snap' | 'beep'

export interface UseAudioEngineReturn {
    playSound: (type: SoundType) => void
    dispose: () => void
}

/** 生成指定时长与采样率的白噪声 AudioBuffer（snap 配方：模拟工控继电器吸合脉冲） */
function createNoiseBuffer(ctx: AudioContext, durationSeconds: number): AudioBuffer {
    const sampleCount = Math.ceil(ctx.sampleRate * durationSeconds)
    const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate)
    const channelData = buffer.getChannelData(0)
    for (let i = 0; i < sampleCount; i++) {
        channelData[i] = Math.random() * 2 - 1
    }
    return buffer
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

    const scheduleSound = (ctx: AudioContext, type: SoundType) => {
        try {
            if (type === 'snap') {
                // 白噪声脉冲走 BufferSource 通道：噪声无音高，Oscillator 不适用
                const source = ctx.createBufferSource()
                const noiseGain = ctx.createGain()
                source.buffer = createNoiseBuffer(ctx, AUDIO_SNAP_DURATION)
                source.connect(noiseGain)
                noiseGain.connect(ctx.destination)

                source.onended = () => {
                    source.disconnect()
                    noiseGain.disconnect()
                }

                noiseGain.gain.setValueAtTime(AUDIO_SNAP_GAIN, ctx.currentTime)
                noiseGain.gain.exponentialRampToValueAtTime(AUDIO_SNAP_GAIN_END, ctx.currentTime + AUDIO_SNAP_DURATION)
                source.start()
                source.stop(ctx.currentTime + AUDIO_SNAP_DURATION)
                return
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
            } else if (type === 'click') {
                // 机械键帽音：方波快速线性降频，模拟按键按下瞬间的清脆段落
                osc.type = 'square'
                osc.frequency.setValueAtTime(AUDIO_CLICK_START_FREQ, ctx.currentTime)
                osc.frequency.linearRampToValueAtTime(AUDIO_CLICK_END_FREQ, ctx.currentTime + AUDIO_CLICK_DURATION)
                gain.gain.setValueAtTime(AUDIO_CLICK_GAIN, ctx.currentTime)
                gain.gain.exponentialRampToValueAtTime(AUDIO_CLICK_GAIN_END, ctx.currentTime + AUDIO_CLICK_DURATION)
                osc.start()
                osc.stop(ctx.currentTime + AUDIO_CLICK_DURATION)
            } else if (type === 'beep') {
                // 8-bit 复古蜂鸣：恒频正弦短促提示音
                osc.type = 'sine'
                osc.frequency.setValueAtTime(AUDIO_BEEP_FREQ, ctx.currentTime)
                gain.gain.setValueAtTime(AUDIO_BEEP_GAIN, ctx.currentTime)
                gain.gain.exponentialRampToValueAtTime(AUDIO_BEEP_GAIN_END, ctx.currentTime + AUDIO_BEEP_DURATION)
                osc.start()
                osc.stop(ctx.currentTime + AUDIO_BEEP_DURATION)
            }
        } catch (err) {
            // 单次调度失败（如参数非法）不应永久禁用音效，记录日志便于排查
            console.warn('[useAudioEngine] sound scheduling failed', err)
        }
    }

    const playSound = (type: SoundType) => {
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
