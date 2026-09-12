import { AUDIO_PENDING_REQUEST_TTL_MS } from './defaults'
import {
    createWebAudioAdapter,
    type AudioAdapter,
    type AudioPlaybackHandle,
    type SoundType,
} from './audio-adapter'

export interface AudioLease {
    readonly id: string
    readonly isActive: boolean
    playSound: (type: SoundType) => void
    cancelPending: () => void
    release: () => void
}

interface PendingAudioRequest {
    readonly leaseId: string
    readonly type: SoundType
    readonly timestamp: number
    readonly generation: number
}

export type AudioAdapterFactory = (generation: number) => AudioAdapter | null

export class SharedAudioRuntime {
    private leases = new Map<string, AudioLease>()
    private activeHandles = new Map<string, Set<AudioPlaybackHandle>>()
    private pendingRequests = new Map<string, PendingAudioRequest>()
    private adapter: AudioAdapter | null = null
    private currentGeneration = 0
    private closingPromise: Promise<void> | null = null
    private resumingPromise: Promise<void> | null = null
    private unsubscribeStateChange: (() => void) | null = null
    private nextLeaseId = 0

    adapterFactory: AudioAdapterFactory = (gen) => createWebAudioAdapter(gen)
    now: () => number = () => Date.now()

    get activeLeaseCount(): number {
        return this.leases.size
    }

    get currentAdapter(): AudioAdapter | null {
        return this.adapter
    }

    get generation(): number {
        return this.currentGeneration
    }

    get pendingRequestCount(): number {
        return this.pendingRequests.size
    }

    acquireLease(customId?: string): AudioLease {
        const id = customId ?? `lease_${++this.nextLeaseId}`
        let active = true

        const lease: AudioLease = {
            get id() {
                return id
            },
            get isActive() {
                return active
            },
            playSound: (type: SoundType) => {
                if (!active) return
                void this.handlePlaySound(id, type)
            },
            cancelPending: () => {
                this.pendingRequests.delete(id)
            },
            release: () => {
                if (!active) return
                active = false
                this.handleReleaseLease(id)
            },
        }

        this.leases.set(id, lease)
        this.activeHandles.set(id, new Set())
        return lease
    }

    private getOrCreateAdapterSync(): AudioAdapter | null {
        if (this.closingPromise) {
            return null
        }

        if (!this.adapter || this.adapter.state === 'closed') {
            if (this.unsubscribeStateChange) {
                this.unsubscribeStateChange()
                this.unsubscribeStateChange = null
            }
            this.currentGeneration++
            const newAdapter = this.adapterFactory(this.currentGeneration)
            if (!newAdapter) return null
            this.adapter = newAdapter

            this.unsubscribeStateChange = this.adapter.onStateChange((state) => {
                if (state === 'running') {
                    this.flushPendingRequests()
                }
            })
        }

        return this.adapter
    }

    private handlePlaySound(leaseId: string, type: SoundType): void {
        const lease = this.leases.get(leaseId)
        if (!lease || !lease.isActive) return

        if (this.closingPromise) {
            const req: PendingAudioRequest = {
                leaseId,
                type,
                timestamp: this.now(),
                generation: 0,
            }
            this.pendingRequests.set(leaseId, req)
            return
        }

        const adapter = this.getOrCreateAdapterSync()
        if (!adapter) return

        if (adapter.state === 'running') {
            this.dispatchSound(leaseId, adapter, type)
            return
        }

        // State is suspended or interrupted: record pending request (latest only per lease)
        const req: PendingAudioRequest = {
            leaseId,
            type,
            timestamp: this.now(),
            generation: adapter.generation,
        }
        this.pendingRequests.set(leaseId, req)

        if (!this.resumingPromise) {
            this.resumingPromise = adapter
                .resume()
                .catch((err) => {
                    console.warn('[SharedAudioRuntime] audio adapter resume failed', err)
                })
                .finally(() => {
                    this.resumingPromise = null
                    this.flushPendingRequests()
                })
        }
    }

    private dispatchSound(leaseId: string, adapter: AudioAdapter, type: SoundType): void {
        const handle = adapter.play(type)
        if (!handle) return

        const leaseHandles = this.activeHandles.get(leaseId)
        if (leaseHandles) {
            leaseHandles.add(handle)
            handle.onEnded(() => {
                leaseHandles.delete(handle)
            })
        }
    }

    private flushPendingRequests(): void {
        if (!this.adapter || this.adapter.state !== 'running') return

        const adapter = this.adapter
        const currentTime = this.now()
        const entries = Array.from(this.pendingRequests.entries())

        for (const [leaseId, req] of entries) {
            this.pendingRequests.delete(leaseId)

            const lease = this.leases.get(leaseId)
            if (!lease || !lease.isActive) continue
            if (req.generation !== adapter.generation) continue

            const age = currentTime - req.timestamp
            if (age > AUDIO_PENDING_REQUEST_TTL_MS) {
                // Request expired
                continue
            }

            this.dispatchSound(leaseId, adapter, req.type)
        }
    }

    private handleReleaseLease(leaseId: string): void {
        this.leases.delete(leaseId)
        this.pendingRequests.delete(leaseId)

        const handles = this.activeHandles.get(leaseId)
        if (handles) {
            for (const h of Array.from(handles)) {
                h.cancel()
            }
            this.activeHandles.delete(leaseId)
        }

        if (this.leases.size === 0 && this.adapter) {
            const oldAdapter = this.adapter
            this.adapter = null
            this.resumingPromise = null
            if (this.unsubscribeStateChange) {
                this.unsubscribeStateChange()
                this.unsubscribeStateChange = null
            }
            this.closingPromise = oldAdapter
                .close()
                .catch((err) => {
                    console.warn('[SharedAudioRuntime] error closing adapter', err)
                })
                .finally(() => {
                    this.closingPromise = null
                    if (this.leases.size > 0 && this.pendingRequests.size > 0) {
                        const newAdapter = this.getOrCreateAdapterSync()
                        if (newAdapter) {
                            for (const [id, req] of this.pendingRequests) {
                                if (req.generation === 0) {
                                    this.pendingRequests.set(id, { ...req, generation: newAdapter.generation })
                                }
                            }
                            if (newAdapter.state === 'running') {
                                this.flushPendingRequests()
                            } else if (!this.resumingPromise) {
                                this.resumingPromise = newAdapter
                                    .resume()
                                    .catch((err) => {
                                        console.warn('[SharedAudioRuntime] audio adapter resume failed', err)
                                    })
                                    .finally(() => {
                                        this.resumingPromise = null
                                        this.flushPendingRequests()
                                    })
                            }
                        }
                    }
                })
        }
    }

    disposeAll(): void {
        const leaseIds = Array.from(this.leases.keys())
        for (const id of leaseIds) {
            const lease = this.leases.get(id)
            lease?.release()
        }
    }
}

let sharedRuntimeInstance: SharedAudioRuntime | null = null

export function getSharedAudioRuntime(): SharedAudioRuntime {
    if (!sharedRuntimeInstance) {
        sharedRuntimeInstance = new SharedAudioRuntime()
    }
    return sharedRuntimeInstance
}

export function resetSharedAudioRuntime(): void {
    if (sharedRuntimeInstance) {
        sharedRuntimeInstance.disposeAll()
        sharedRuntimeInstance = null
    }
}
