import { computed } from 'vue'
import { useAudioEngine } from './useAudioEngine'

export interface UseBrutalHapticsOptions {
    /** 显式开启音效；缺省或非 true 时保持完全静音（不实例化 AudioContext） */
    sound?: boolean
}

export interface UseBrutalHapticsReturn {
    /** 机械键帽音：方波快速降频短促衰减 */
    click: () => void
    /** 继电器吸合音：白噪声脉冲 */
    snap: () => void
    /** 8-bit 复古蜂鸣提示音：恒频正弦 */
    beep: () => void
}

/**
 * 机械触觉音效门面：以语义方法暴露引擎配方，供交互组件按 props opt-in 接入。
 * 全局默认静音——仅当 options.sound 为 true 时才向引擎传递启用状态，
 * 且各方法在门面层短路，未开启时不会触达引擎（不实例化 AudioContext）。
 */
export function useBrutalHaptics(options: UseBrutalHapticsOptions = {}): UseBrutalHapticsReturn {
    const enabled = computed(() => options.sound === true)
    const { playSound } = useAudioEngine(enabled)

    return {
        click: () => {
            if (enabled.value) playSound('click')
        },
        snap: () => {
            if (enabled.value) playSound('snap')
        },
        beep: () => {
            if (enabled.value) playSound('beep')
        },
    }
}
