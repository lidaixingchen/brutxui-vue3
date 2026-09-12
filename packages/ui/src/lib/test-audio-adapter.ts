import type { AudioAdapter, AudioAdapterState, AudioPlaybackHandle, SoundType } from './audio-adapter'

export class TestAudioAdapter implements AudioAdapter {
    private currentState: AudioAdapterState
    readonly generation: number
    readonly sampleRate: number
    readonly stateListeners = new Set<(state: AudioAdapterState) => void>()

    playedSounds: Array<{
        type: SoundType
        handle: AudioPlaybackHandle
        canceled: boolean
        ended: boolean
    }> = []

    activeHandles = new Set<AudioPlaybackHandle>()
    canceledHandles = new Set<AudioPlaybackHandle>()

    resumeBehavior: 'resolve' | 'reject' | 'manual' = 'resolve'
    closeBehavior: 'resolve' | 'reject' | 'manual' = 'resolve'

    resumeCallCount = 0
    closeCallCount = 0

    private pendingResumeResolvers: Array<{ resolve: () => void; reject: (err: Error) => void }> = []
    private pendingCloseResolvers: Array<{ resolve: () => void; reject: (err: Error) => void }> = []

    constructor(generation = 1, initialState: AudioAdapterState = 'running', sampleRate = 44100) {
        this.generation = generation
        this.currentState = initialState
        this.sampleRate = sampleRate
    }

    get state(): AudioAdapterState {
        return this.currentState
    }

    setState(newState: AudioAdapterState): void {
        if (this.currentState === newState) return
        this.currentState = newState
        for (const listener of this.stateListeners) {
            listener(newState)
        }
    }

    onStateChange(listener: (state: AudioAdapterState) => void): () => void {
        this.stateListeners.add(listener)
        return () => {
            this.stateListeners.delete(listener)
        }
    }

    async resume(): Promise<void> {
        this.resumeCallCount++
        if (this.resumeBehavior === 'resolve') {
            this.setState('running')
            return
        }
        if (this.resumeBehavior === 'reject') {
            throw new Error('TestAudioAdapter: resume rejected')
        }
        return new Promise<void>((resolve, reject) => {
            this.pendingResumeResolvers.push({ resolve, reject })
        })
    }

    triggerResume(success = true): void {
        const resolvers = [...this.pendingResumeResolvers]
        this.pendingResumeResolvers = []
        if (success) {
            this.setState('running')
            for (const r of resolvers) r.resolve()
        } else {
            for (const r of resolvers) r.reject(new Error('TestAudioAdapter: manual resume failed'))
        }
    }

    async close(): Promise<void> {
        this.closeCallCount++
        if (this.closeBehavior === 'resolve') {
            this.setState('closed')
            return
        }
        if (this.closeBehavior === 'reject') {
            throw new Error('TestAudioAdapter: close rejected')
        }
        return new Promise<void>((resolve, reject) => {
            this.pendingCloseResolvers.push({ resolve, reject })
        })
    }

    triggerClose(success = true): void {
        const resolvers = [...this.pendingCloseResolvers]
        this.pendingCloseResolvers = []
        if (success) {
            this.setState('closed')
            for (const r of resolvers) r.resolve()
        } else {
            for (const r of resolvers) r.reject(new Error('TestAudioAdapter: manual close failed'))
        }
    }

    play(type: SoundType): AudioPlaybackHandle | null {
        if (this.currentState === 'closed') return null

        let canceled = false
        let isEnded = false
        const endedCallbacks = new Set<() => void>()

        const record = {
            type,
            get canceled() {
                return canceled
            },
            get ended() {
                return isEnded
            },
            set ended(val: boolean) {
                isEnded = val
            },
            handle: null as unknown as AudioPlaybackHandle,
        }

        const handle: AudioPlaybackHandle = {
            cancel: () => {
                if (canceled || isEnded) return
                canceled = true
                this.activeHandles.delete(handle)
                this.canceledHandles.add(handle)
            },
            onEnded: (callback: () => void) => {
                if (isEnded) {
                    callback()
                    return () => {}
                }
                endedCallbacks.add(callback)
                return () => {
                    endedCallbacks.delete(callback)
                }
            },
        }
        ;(handle as unknown as { _callbacks: Set<() => void> })._callbacks = endedCallbacks

        record.handle = handle
        this.playedSounds.push(record)
        this.activeHandles.add(handle)

        return handle
    }

    simulateEnded(handle: AudioPlaybackHandle): void {
        const rec = this.playedSounds.find((p) => p.handle === handle)
        if (!rec || rec.canceled || rec.ended) return
        rec.ended = true
        this.activeHandles.delete(handle)
        // Trigger onEnded callbacks
        const cbs = (handle as unknown as { _callbacks?: Set<() => void> })._callbacks
        if (cbs) {
            for (const cb of cbs) cb()
        }
    }
}
