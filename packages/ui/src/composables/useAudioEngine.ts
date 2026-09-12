import { watch, toValue, getCurrentScope, onScopeDispose, type MaybeRefOrGetter } from 'vue'
import { AUDIO_TYPE_THROTTLE_MS } from '../lib/defaults'
import { getSharedAudioRuntime, type AudioLease } from '../lib/shared-audio-runtime'
import type { SoundType } from '../lib/audio-adapter'

export type { SoundType }

export interface UseAudioEngineReturn {
    playSound: (type: SoundType) => void
    dispose: () => void
}

export function useAudioEngine(enabled: MaybeRefOrGetter<boolean | undefined>): UseAudioEngineReturn {
    let lease: AudioLease | null = null
    let isDisposed = false
    let lastTypeSoundTime = 0

    const runtime = getSharedAudioRuntime()

    function getOrCreateLease(): AudioLease | null {
        if (isDisposed) return null
        if (!lease) {
            lease = runtime.acquireLease()
        }
        return lease
    }

    function releaseLease(): void {
        if (lease) {
            lease.release()
            lease = null
        }
    }

    watch(
        () => toValue(enabled) === true,
        (isEnabled) => {
            if (!isEnabled) {
                releaseLease()
            }
        },
    )

    const playSound = (type: SoundType) => {
        if (isDisposed || toValue(enabled) !== true) return

        if (type === 'type') {
            const now = Date.now()
            if (now - lastTypeSoundTime < AUDIO_TYPE_THROTTLE_MS) return
            lastTypeSoundTime = now
        }

        const activeLease = getOrCreateLease()
        if (!activeLease) return

        activeLease.playSound(type)
    }

    const dispose = () => {
        if (isDisposed) return
        isDisposed = true
        releaseLease()
    }

    if (getCurrentScope()) {
        onScopeDispose(() => {
            dispose()
        })
    }

    return { playSound, dispose }
}
