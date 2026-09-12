import { describe, it, expect, beforeEach } from 'vitest'
import { SharedAudioRuntime, resetSharedAudioRuntime } from './shared-audio-runtime'
import { TestAudioAdapter } from './test-audio-adapter'

describe('SharedAudioRuntime', () => {
    let runtime: SharedAudioRuntime
    let mockAdapter: TestAudioAdapter
    let currentMockTime = 1000

    beforeEach(() => {
        resetSharedAudioRuntime()
        runtime = new SharedAudioRuntime()
        currentMockTime = 1000
        runtime.now = () => currentMockTime

        runtime.adapterFactory = (gen) => {
            mockAdapter = new TestAudioAdapter(gen, 'running')
            return mockAdapter
        }
    })

    it('lazily initializes adapter on first play and shares across multiple leases', () => {
        expect(runtime.currentAdapter).toBeNull()

        const lease1 = runtime.acquireLease('lease_1')
        const lease2 = runtime.acquireLease('lease_2')

        expect(runtime.activeLeaseCount).toBe(2)
        expect(runtime.currentAdapter).toBeNull() // Not created until first play

        lease1.playSound('click')
        expect(runtime.currentAdapter).not.toBeNull()
        expect(mockAdapter.playedSounds).toHaveLength(1)
        expect(mockAdapter.playedSounds[0]?.type).toBe('click')

        lease2.playSound('beep')
        expect(mockAdapter.playedSounds).toHaveLength(2)
        expect(mockAdapter.playedSounds[1]?.type).toBe('beep')
        // Same adapter and generation
        expect(mockAdapter.generation).toBe(1)
    })

    it('cancels active playback handles when a lease is released without affecting other leases', () => {
        const lease1 = runtime.acquireLease('lease_1')
        const lease2 = runtime.acquireLease('lease_2')

        lease1.playSound('click')
        lease2.playSound('beep')

        expect(mockAdapter.activeHandles.size).toBe(2)

        // Release lease 1
        lease1.release()
        expect(lease1.isActive).toBe(false)
        expect(runtime.activeLeaseCount).toBe(1)

        // Handle for lease 1 is canceled, handle for lease 2 remains active
        expect(mockAdapter.canceledHandles.size).toBe(1)
        expect(mockAdapter.activeHandles.size).toBe(1)

        // Lease 2 can still play
        lease2.playSound('snap')
        expect(mockAdapter.playedSounds).toHaveLength(3)
        expect(mockAdapter.activeHandles.size).toBe(2)
    })

    it('closes adapter when the last lease is released and increments generation on next acquisition', async () => {
        const lease1 = runtime.acquireLease('lease_1')
        lease1.playSound('click')

        const firstAdapter = mockAdapter
        expect(firstAdapter.state).toBe('running')

        lease1.release()
        expect(runtime.activeLeaseCount).toBe(0)
        expect(firstAdapter.closeCallCount).toBe(1)
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
        expect(firstAdapter.state).toBe('closed')

        // Acquire new lease and play -> creates new generation adapter
        const lease2 = runtime.acquireLease('lease_2')
        lease2.playSound('success')

        expect(runtime.currentAdapter).not.toBe(firstAdapter)
        expect(runtime.generation).toBe(2)
        expect(mockAdapter.generation).toBe(2)
        expect(mockAdapter.playedSounds).toHaveLength(1)
    })

    it('coalesces resume operations and enforces pending request TTL', async () => {
        runtime.adapterFactory = (gen) => {
            mockAdapter = new TestAudioAdapter(gen, 'suspended')
            mockAdapter.resumeBehavior = 'manual'
            return mockAdapter
        }

        const lease1 = runtime.acquireLease('lease_1')
        const lease2 = runtime.acquireLease('lease_2')

        // Play sounds while suspended
        lease1.playSound('type')
        lease2.playSound('beep')

        // Both requests pending, resume invoked once (coalesced)
        expect(mockAdapter.resumeCallCount).toBe(1)
        expect(runtime.pendingRequestCount).toBe(2)
        expect(mockAdapter.playedSounds).toHaveLength(0)

        // Advance time by 200ms (within 300ms TTL)
        currentMockTime += 200

        // Lease 1 requests a new sound, replacing previous pending request (latest-only)
        lease1.playSound('click')
        expect(runtime.pendingRequestCount).toBe(2)

        // Advance time by another 150ms (now total 350ms for lease2's beep, but only 150ms for lease1's click)
        currentMockTime += 150

        // Resume succeeds
        mockAdapter.triggerResume(true)
        await Promise.resolve()

        // Lease 2's request (age 350ms > 300ms) expired and discarded!
        // Lease 1's request (age 150ms <= 300ms) executed with latest sound 'click'!
        expect(mockAdapter.playedSounds).toHaveLength(1)
        expect(mockAdapter.playedSounds[0]?.type).toBe('click')
        expect(runtime.pendingRequestCount).toBe(0)
    })

    it('discards pending requests when lease is released before resume completes', async () => {
        runtime.adapterFactory = (gen) => {
            mockAdapter = new TestAudioAdapter(gen, 'suspended')
            mockAdapter.resumeBehavior = 'manual'
            return mockAdapter
        }

        const lease = runtime.acquireLease('lease_1')
        lease.playSound('click')

        expect(runtime.pendingRequestCount).toBe(1)

        // Release lease while waiting for resume
        lease.release()
        expect(runtime.pendingRequestCount).toBe(0)

        mockAdapter.triggerResume(true)
        await Promise.resolve()

        expect(mockAdapter.playedSounds).toHaveLength(0)
    })

    it('enqueues playSound during closing and flushes with TTL check after close completes', async () => {
        const lease1 = runtime.acquireLease('lease_1')
        lease1.playSound('click')

        const firstAdapter = mockAdapter
        firstAdapter.closeBehavior = 'manual'

        // Release lease 1 to trigger closing
        lease1.release()
        expect(firstAdapter.closeCallCount).toBe(1)

        // Acquire new lease and play sound while first adapter is still closing
        const lease2 = runtime.acquireLease('lease_2')
        lease2.playSound('type')
        lease2.playSound('beep') // Should overwrite 'type' (latest-only)

        expect(runtime.pendingRequestCount).toBe(1)

        // Advance time by 100ms (well within 300ms TTL)
        currentMockTime += 100

        // Complete the close
        firstAdapter.triggerClose(true)
        await new Promise((r) => setTimeout(r, 0))

        // Should have created new adapter and played 'beep'
        expect(runtime.generation).toBe(2)
        expect(mockAdapter.playedSounds).toHaveLength(1)
        expect(mockAdapter.playedSounds[0]?.type).toBe('beep')
        expect(runtime.pendingRequestCount).toBe(0)
    })

    it('expires pending requests queued during long close operations exceeding TTL', async () => {
        const lease1 = runtime.acquireLease('lease_1')
        lease1.playSound('click')

        const firstAdapter = mockAdapter
        firstAdapter.closeBehavior = 'manual'

        lease1.release()

        const lease2 = runtime.acquireLease('lease_2')
        lease2.playSound('beep')

        // Advance time past 300ms TTL
        currentMockTime += 350

        // Complete close
        firstAdapter.triggerClose(true)
        await new Promise((r) => setTimeout(r, 0))

        // Should have created new adapter but discarded expired sound
        expect(runtime.generation).toBe(2)
        expect(mockAdapter.playedSounds).toHaveLength(0)
        expect(runtime.pendingRequestCount).toBe(0)
    })
})
