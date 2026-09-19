import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { h, nextTick } from 'vue'
import UploadTrigger from './UploadTrigger.vue'

function createFile(name: string, type: string): File {
    return new File(['content'], name, { type })
}

interface DragEventOptions {
    files?: File[]
    relatedTarget?: EventTarget | null
}

function createDragEvent(
    type: 'dragenter' | 'dragleave' | 'dragover' | 'drop',
    options: DragEventOptions = {},
): DragEvent {
    const event = new Event(type, { bubbles: true, cancelable: true }) as DragEvent
    if (type === 'drop') {
        Object.defineProperty(event, 'dataTransfer', {
            configurable: true,
            value: { files: options.files ?? [] },
        })
    }
    if (options.relatedTarget !== undefined) {
        Object.defineProperty(event, 'relatedTarget', {
            configurable: true,
            value: options.relatedTarget,
        })
    }
    return event
}

describe('UploadTrigger', () => {
    it('emits a copied File array for browse selection', async () => {
        const wrapper = mount(UploadTrigger)
        const input = wrapper.find('input[type="file"]')
        const file = createFile('a.txt', 'text/plain')

        // target.files 是实时 FileList，选择后立即重置 input，消费方持有的应是拷贝后的数组
        Object.defineProperty(input.element, 'files', {
            value: [file],
            configurable: true,
        })

        await input.trigger('change')

        const emitted = wrapper.emitted('select')
        expect(emitted).toBeTruthy()
        const [files, source] = emitted![0] as [File[], 'browse' | 'drop']
        expect(source).toBe('browse')
        expect(Array.isArray(files)).toBe(true)
        expect(files).toHaveLength(1)
        expect(files[0].name).toBe('a.txt')
    })

    it('emits a copied File array for drop selection', async () => {
        const wrapper = mount(UploadTrigger)
        const file = createFile('a.txt', 'text/plain')

        await wrapper.trigger('drop', {
            dataTransfer: { files: [file] },
        })

        const emitted = wrapper.emitted('select')
        expect(emitted).toBeTruthy()
        const [files, source] = emitted![0] as [File[], 'browse' | 'drop']
        expect(source).toBe('drop')
        expect(Array.isArray(files)).toBe(true)
        expect(files).toHaveLength(1)
        expect(files[0].name).toBe('a.txt')
    })

    it('does not emit select when drag is disabled', async () => {
        const wrapper = mount(UploadTrigger, { props: { drag: false } })
        const file = createFile('a.txt', 'text/plain')

        await wrapper.trigger('drop', {
            dataTransfer: { files: [file] },
        })

        expect(wrapper.emitted('select')).toBeFalsy()
    })

    it('does not emit select when disabled is true', async () => {
        const wrapper = mount(UploadTrigger, { props: { disabled: true } })
        const file = createFile('a.txt', 'text/plain')

        await wrapper.trigger('drop', {
            dataTransfer: { files: [file] },
        })

        expect(wrapper.emitted('select')).toBeFalsy()
    })

    it('slices to only first file on drop when multiple is false', async () => {
        const wrapper = mount(UploadTrigger, { props: { multiple: false } })
        const file1 = createFile('a.txt', 'text/plain')
        const file2 = createFile('b.txt', 'text/plain')

        await wrapper.trigger('drop', {
            dataTransfer: { files: [file1, file2] },
        })

        const emitted = wrapper.emitted('select')
        expect(emitted).toBeTruthy()
        const [files] = emitted![0] as [File[], 'browse' | 'drop']
        expect(files).toHaveLength(1)
        expect(files[0].name).toBe('a.txt')
    })

    it('slices browse selections when multiple is false', async () => {
        const wrapper = mount(UploadTrigger, { props: { multiple: false } })
        const input = wrapper.find('input[type="file"]')
        const files = [
            createFile('a.txt', 'text/plain'),
            createFile('b.txt', 'text/plain'),
        ]

        Object.defineProperty(input.element, 'files', {
            configurable: true,
            value: files,
        })
        await input.trigger('change')

        const emitted = wrapper.emitted('select')
        expect(emitted).toBeTruthy()
        const [selectedFiles, source] = emitted![0] as [File[], 'browse' | 'drop']
        expect(source).toBe('browse')
        expect(selectedFiles).toEqual([files[0]])
    })

    it('resets drag highlight through enter, internal leave, over and external leave', async () => {
        const wrapper = mount(UploadTrigger)
        const trigger = wrapper.get('[role="button"]')
        const dropzone = wrapper.find('div.flex.flex-col')
        const innerElement = wrapper.find('p').element

        const dragEnter = createDragEvent('dragenter')
        trigger.element.dispatchEvent(dragEnter)
        await nextTick()
        expect(dragEnter.defaultPrevented).toBe(true)
        expect(dropzone.classes()).toContain('border-brutal-primary')

        const internalLeave = createDragEvent('dragleave', { relatedTarget: innerElement })
        trigger.element.dispatchEvent(internalLeave)
        await nextTick()
        expect(dropzone.classes()).toContain('border-brutal-primary')

        const dragOver = createDragEvent('dragover')
        trigger.element.dispatchEvent(dragOver)
        expect(dragOver.defaultPrevented).toBe(true)
        expect(dropzone.classes()).toContain('border-brutal-primary')

        const externalLeave = createDragEvent('dragleave', { relatedTarget: document.body })
        trigger.element.dispatchEvent(externalLeave)
        await nextTick()
        expect(externalLeave.defaultPrevented).toBe(true)
        expect(dropzone.classes()).not.toContain('border-brutal-primary')
    })

    it('clears drag highlight when drag or disabled changes while active', async () => {
        const wrapper = mount(UploadTrigger)
        const trigger = wrapper.get('[role="button"]')
        const dropzone = wrapper.find('div.flex.flex-col')

        trigger.element.dispatchEvent(createDragEvent('dragenter'))
        await nextTick()
        expect(dropzone.classes()).toContain('border-brutal-primary')

        await wrapper.setProps({ drag: false })
        expect(dropzone.classes()).not.toContain('border-brutal-primary')

        const disabledDragLeave = createDragEvent('dragleave')
        trigger.element.dispatchEvent(disabledDragLeave)
        expect(disabledDragLeave.defaultPrevented).toBe(false)

        await wrapper.setProps({ drag: true })
        trigger.element.dispatchEvent(createDragEvent('dragenter'))
        await nextTick()
        expect(dropzone.classes()).toContain('border-brutal-primary')

        await wrapper.setProps({ disabled: true })
        expect(dropzone.classes()).not.toContain('border-brutal-primary')

        const dragOver = createDragEvent('dragover')
        trigger.element.dispatchEvent(dragOver)
        expect(dragOver.defaultPrevented).toBe(false)
    })

    it('exposes isDragging to custom trigger slots', async () => {
        const wrapper = mount(UploadTrigger, {
            slots: {
                default: ({ isDragging }: { isDragging: boolean }) => h(
                    'span',
                    { class: 'drag-state' },
                    isDragging ? 'dragging' : 'idle',
                ),
            },
        })
        const trigger = wrapper.get('[role="button"]')

        expect(wrapper.get('.drag-state').text()).toBe('idle')
        trigger.element.dispatchEvent(createDragEvent('dragenter'))
        await nextTick()
        expect(wrapper.get('.drag-state').text()).toBe('dragging')

        trigger.element.dispatchEvent(createDragEvent('drop'))
        await nextTick()
        expect(wrapper.get('.drag-state').text()).toBe('idle')
    })

    it('does not prevent drag events or open input while disabled', async () => {
        const wrapper = mount(UploadTrigger, { props: { disabled: true } })
        const trigger = wrapper.get('[role="button"]')
        const input = wrapper.find('input[type="file"]')
        const clickSpy = vi.spyOn(input.element as HTMLInputElement, 'click')

        expect(trigger.attributes('tabindex')).toBe('-1')
        expect(trigger.attributes('aria-disabled')).toBe('true')

        const dragEnter = createDragEvent('dragenter')
        trigger.element.dispatchEvent(dragEnter)
        const dragOver = createDragEvent('dragover')
        trigger.element.dispatchEvent(dragOver)
        expect(dragEnter.defaultPrevented).toBe(false)
        expect(dragOver.defaultPrevented).toBe(false)

        await trigger.trigger('click')
        expect(clickSpy).not.toHaveBeenCalled()
    })

    it('ignores empty input and drop files', async () => {
        const wrapper = mount(UploadTrigger)
        const input = wrapper.find('input[type="file"]')
        Object.defineProperty(input.element, 'files', {
            configurable: true,
            value: [],
        })

        await input.trigger('change')
        await wrapper.trigger('drop', { dataTransfer: { files: [] } })
        await wrapper.trigger('drop')

        expect(wrapper.emitted('select')).toBeFalsy()
    })

    it('supports keyboard navigation and ARIA attributes', async () => {
        const wrapper = mount(UploadTrigger)
        const container = wrapper.find('[role="button"]')
        expect(container.exists()).toBe(true)
        expect(container.attributes('tabindex')).toBe('0')
        expect(container.attributes('aria-disabled')).toBe('false')

        const input = wrapper.find('input[type="file"]')
        const clickSpy = vi.spyOn(input.element as HTMLInputElement, 'click')

        await container.trigger('keydown.enter')
        expect(clickSpy).toHaveBeenCalledTimes(1)

        await container.trigger('keydown.space')
        expect(clickSpy).toHaveBeenCalledTimes(2)
    })
})
