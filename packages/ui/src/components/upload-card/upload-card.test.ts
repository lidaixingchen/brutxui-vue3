import { mount, VueWrapper } from '@vue/test-utils'
import { en } from '@/locales/en'
import { LOCALE_INJECTION_KEY } from '@/composables/useLocale'
import UploadCard from './UploadCard.vue'

const localeProvide = { global: { provide: { [LOCALE_INJECTION_KEY]: en } } }

function createFile(name: string, size: number, type = 'text/plain'): File {
    const buffer = new ArrayBuffer(size)
    return new File([buffer], name, { type })
}

function mountUploadCard(props = {}, options = {}): VueWrapper {
    return mount(UploadCard, {
        props,
        ...localeProvide,
        ...options,
    })
}

describe('UploadCard', () => {
    /* ───── Rendering ───── */

    describe('rendering', () => {
        it('renders with default props', () => {
            const wrapper = mountUploadCard()
            expect(wrapper.text()).toContain('Upload Files')
            expect(wrapper.text()).toContain('Drag and drop your files here')
        })

        it('shows custom title', () => {
            const wrapper = mountUploadCard({ title: 'Upload Documents' })
            expect(wrapper.text()).toContain('Upload Documents')
        })

        it('shows custom description', () => {
            const wrapper = mountUploadCard({ description: 'Select files to upload' })
            expect(wrapper.text()).toContain('Select files to upload')
        })

        it('renders the drop zone area', () => {
            const wrapper = mountUploadCard()
            const dropZone = wrapper.find('.border-dashed')
            expect(dropZone.exists()).toBe(true)
        })

        it('renders browse button', () => {
            const wrapper = mountUploadCard()
            expect(wrapper.text()).toContain('Browse Files')
        })

        it('renders drop text', () => {
            const wrapper = mountUploadCard()
            expect(wrapper.text()).toContain('Drop files here')
        })

        it('renders hidden file input with accept attribute', () => {
            const wrapper = mountUploadCard({ accept: '.pdf,.doc' })
            const input = wrapper.find('input[type="file"]')
            expect(input.exists()).toBe(true)
            expect(input.attributes('accept')).toBe('.pdf,.doc')
        })

        it('sets multiple attribute on file input', () => {
            const wrapper = mountUploadCard()
            const input = wrapper.find('input[type="file"]')
            expect(input.attributes('multiple')).toBeDefined()
        })

        it('renders actions slot', () => {
            const wrapper = mountUploadCard({}, {
                slots: { actions: '<div class="custom-action">Custom Action</div>' },
            })
            expect(wrapper.text()).toContain('Custom Action')
        })

        it('applies custom class', () => {
            const wrapper = mountUploadCard({ class: 'my-upload' })
            expect(wrapper.find('[class*="my-upload"]').exists()).toBe(true)
        })
    })

    /* ───── Uploading State ───── */

    describe('uploading state', () => {
        it('shows progress bar when uploading', () => {
            const wrapper = mountUploadCard({ uploading: true, progress: 50 })
            expect(wrapper.findComponent({ name: 'Progress' }).exists()).toBe(true)
        })

        it('shows spinner when uploading', () => {
            const wrapper = mountUploadCard({ uploading: true, progress: 50 })
            expect(wrapper.findComponent({ name: 'Spinner' }).exists()).toBe(true)
        })

        it('hides drop zone content when uploading', () => {
            const wrapper = mountUploadCard({ uploading: true, progress: 50 })
            expect(wrapper.text()).not.toContain('Browse Files')
            expect(wrapper.text()).not.toContain('Upload Files')
        })

        it('applies pointer-events-none class when uploading', () => {
            const wrapper = mountUploadCard({ uploading: true })
            const dropZone = wrapper.find('.border-dashed')
            expect(dropZone.classes()).toContain('pointer-events-none')
        })

        it('does not apply pointer-events-none when not uploading', () => {
            const wrapper = mountUploadCard({ uploading: false })
            const dropZone = wrapper.find('.border-dashed')
            expect(dropZone.classes()).not.toContain('pointer-events-none')
        })

        it('displays the correct progress value', () => {
            const wrapper = mountUploadCard({ uploading: true, progress: 75 })
            const progress = wrapper.findComponent({ name: 'Progress' })
            expect(progress.props('modelValue')).toBe(75)
        })
    })

    /* ───── File Input Change (Browse Upload) ───── */

    describe('file input change', () => {
        it('emits upload event when files are selected', async () => {
            const wrapper = mountUploadCard()
            const input = wrapper.find('input[type="file"]')
            const file = createFile('test.txt', 1024)

            Object.defineProperty(input.element, 'files', {
                value: [file],
                writable: false,
            })
            await input.trigger('change')

            expect(wrapper.emitted('upload')).toHaveLength(1)
            expect(wrapper.emitted('upload')![0][0]).toEqual([file])
        })

        it('does not emit upload when no files selected', async () => {
            const wrapper = mountUploadCard()
            const input = wrapper.find('input[type="file"]')

            Object.defineProperty(input.element, 'files', {
                value: [],
                writable: false,
            })
            await input.trigger('change')

            expect(wrapper.emitted('upload')).toBeUndefined()
        })

        it('filters out files exceeding maxSize', async () => {
            const wrapper = mountUploadCard({ maxSize: 2048 })
            const input = wrapper.find('input[type="file"]')
            const smallFile = createFile('small.txt', 1024)
            const largeFile = createFile('large.txt', 4096)

            Object.defineProperty(input.element, 'files', {
                value: [smallFile, largeFile],
                writable: false,
            })
            await input.trigger('change')

            expect(wrapper.emitted('upload')).toHaveLength(1)
            expect(wrapper.emitted('upload')![0][0]).toEqual([smallFile])
        })

        it('does not emit upload when all files exceed maxSize', async () => {
            const wrapper = mountUploadCard({ maxSize: 512 })
            const input = wrapper.find('input[type="file"]')
            const largeFile = createFile('large.txt', 1024)

            Object.defineProperty(input.element, 'files', {
                value: [largeFile],
                writable: false,
            })
            await input.trigger('change')

            expect(wrapper.emitted('upload')).toBeUndefined()
        })

        it('allows all files when maxSize is not set', async () => {
            const wrapper = mountUploadCard()
            const input = wrapper.find('input[type="file"]')
            const file1 = createFile('a.txt', 1024)
            const file2 = createFile('b.txt', 99999)

            Object.defineProperty(input.element, 'files', {
                value: [file1, file2],
                writable: false,
            })
            await input.trigger('change')

            expect(wrapper.emitted('upload')).toHaveLength(1)
            expect(wrapper.emitted('upload')![0][0]).toEqual([file1, file2])
        })

        it('resets input value after file selection', async () => {
            const wrapper = mountUploadCard()
            const input = wrapper.find('input[type="file"]')
            const file = createFile('test.txt', 1024)

            Object.defineProperty(input.element, 'files', {
                value: [file],
                writable: false,
            })
            await input.trigger('change')

            expect((input.element as HTMLInputElement).value).toBe('')
        })
    })

    /* ───── Drag and Drop ───── */

    describe('drag and drop', () => {
        it('sets isDragging on dragenter', async () => {
            const wrapper = mountUploadCard()
            const dropZone = wrapper.find('.border-dashed')

            const enterEvent = new DragEvent('dragenter', {
                bubbles: true,
                cancelable: true,
            })
            dropZone.element.dispatchEvent(enterEvent)
            await wrapper.vm.$nextTick()

            expect(dropZone.classes()).toContain('bg-brutal-muted')
            expect(dropZone.classes()).toContain('shadow-brutal')
        })

        it('prevents default on dragover', async () => {
            const wrapper = mountUploadCard()
            const dropZone = wrapper.find('.border-dashed')

            const event = new DragEvent('dragover', { cancelable: true })
            const preventSpy = vi.spyOn(event, 'preventDefault')
            dropZone.element.dispatchEvent(event)

            expect(preventSpy).toHaveBeenCalled()
        })

        it('resets isDragging on dragleave when leaving the element', async () => {
            const wrapper = mountUploadCard()
            const dropZone = wrapper.find('.border-dashed')

            // First enter
            const enterEvent = new DragEvent('dragenter', {
                bubbles: true,
                cancelable: true,
            })
            dropZone.element.dispatchEvent(enterEvent)
            await wrapper.vm.$nextTick()
            expect(dropZone.classes()).toContain('bg-brutal-muted')

            // Simulate dragleave with relatedTarget outside the element
            const leaveEvent = new DragEvent('dragleave', {
                bubbles: true,
                cancelable: true,
                relatedTarget: document.body,
            })
            dropZone.element.dispatchEvent(leaveEvent)
            await wrapper.vm.$nextTick()

            expect(dropZone.classes()).toContain('bg-brutal-bg')
            expect(dropZone.classes()).not.toContain('bg-brutal-muted')
        })

        it('resets isDragging on dragleave with null relatedTarget', async () => {
            const wrapper = mountUploadCard()
            const dropZone = wrapper.find('.border-dashed')

            // Enter
            const enterEvent = new DragEvent('dragenter', {
                bubbles: true,
                cancelable: true,
            })
            dropZone.element.dispatchEvent(enterEvent)
            await wrapper.vm.$nextTick()
            expect(dropZone.classes()).toContain('bg-brutal-muted')

            // Leave with no relatedTarget (defaults to null).
            // handler: related instanceof Node is false -> falls through to isDragging = false
            const leaveEvent = new DragEvent('dragleave', {
                bubbles: true,
                cancelable: true,
            })
            dropZone.element.dispatchEvent(leaveEvent)
            await wrapper.vm.$nextTick()

            expect(dropZone.classes()).not.toContain('bg-brutal-muted')
        })

        it('emits drop event with files on drop', async () => {
            const wrapper = mountUploadCard()
            const dropZone = wrapper.find('.border-dashed')
            const file = createFile('dropped.txt', 1024)

            const dataTransfer = { files: [file] }
            const dropEvent = new DragEvent('drop', {
                bubbles: true,
                cancelable: true,
            })
            Object.defineProperty(dropEvent, 'dataTransfer', {
                value: dataTransfer,
                writable: false,
            })
            dropZone.element.dispatchEvent(dropEvent)
            await wrapper.vm.$nextTick()

            expect(wrapper.emitted('drop')).toHaveLength(1)
            expect(wrapper.emitted('drop')![0][0]).toEqual([file])
        })

        it('resets isDragging after drop', async () => {
            const wrapper = mountUploadCard()
            const dropZone = wrapper.find('.border-dashed')
            const file = createFile('dropped.txt', 1024)

            const enterEvent = new DragEvent('dragenter', {
                bubbles: true,
                cancelable: true,
            })
            dropZone.element.dispatchEvent(enterEvent)
            await wrapper.vm.$nextTick()
            expect(dropZone.classes()).toContain('bg-brutal-muted')

            const dataTransfer = { files: [file] }
            const dropEvent = new DragEvent('drop', {
                bubbles: true,
                cancelable: true,
            })
            Object.defineProperty(dropEvent, 'dataTransfer', {
                value: dataTransfer,
                writable: false,
            })
            dropZone.element.dispatchEvent(dropEvent)
            await wrapper.vm.$nextTick()

            expect(dropZone.classes()).toContain('bg-brutal-bg')
            expect(dropZone.classes()).not.toContain('bg-brutal-muted')
        })

        it('filters dropped files by maxSize', async () => {
            const wrapper = mountUploadCard({ maxSize: 2048 })
            const dropZone = wrapper.find('.border-dashed')
            const smallFile = createFile('small.txt', 1024)
            const largeFile = createFile('large.txt', 4096)

            const dataTransfer = { files: [smallFile, largeFile] }
            const dropEvent = new DragEvent('drop', {
                bubbles: true,
                cancelable: true,
            })
            Object.defineProperty(dropEvent, 'dataTransfer', {
                value: dataTransfer,
                writable: false,
            })
            dropZone.element.dispatchEvent(dropEvent)
            await wrapper.vm.$nextTick()

            expect(wrapper.emitted('drop')).toHaveLength(1)
            expect(wrapper.emitted('drop')![0][0]).toEqual([smallFile])
        })

        it('does not emit drop when all dropped files exceed maxSize', async () => {
            const wrapper = mountUploadCard({ maxSize: 512 })
            const dropZone = wrapper.find('.border-dashed')
            const largeFile = createFile('large.txt', 1024)

            const dataTransfer = { files: [largeFile] }
            const dropEvent = new DragEvent('drop', {
                bubbles: true,
                cancelable: true,
            })
            Object.defineProperty(dropEvent, 'dataTransfer', {
                value: dataTransfer,
                writable: false,
            })
            dropZone.element.dispatchEvent(dropEvent)
            await wrapper.vm.$nextTick()

            expect(wrapper.emitted('drop')).toBeUndefined()
        })

        it('handles drop with undefined dataTransfer gracefully', async () => {
            const wrapper = mountUploadCard()
            const dropZone = wrapper.find('.border-dashed')

            const dropEvent = new DragEvent('drop', {
                bubbles: true,
                cancelable: true,
            })
            // dataTransfer is null by default in jsdom
            dropZone.element.dispatchEvent(dropEvent)
            await wrapper.vm.$nextTick()

            expect(wrapper.emitted('drop')).toBeUndefined()
        })

        it('prevents default on drop', async () => {
            const wrapper = mountUploadCard()
            const dropZone = wrapper.find('.border-dashed')
            const file = createFile('test.txt', 100)

            const dropEvent = new DragEvent('drop', {
                bubbles: true,
                cancelable: true,
            })
            Object.defineProperty(dropEvent, 'dataTransfer', {
                value: { files: [file] },
                writable: false,
            })
            const preventSpy = vi.spyOn(dropEvent, 'preventDefault')
            dropZone.element.dispatchEvent(dropEvent)

            expect(preventSpy).toHaveBeenCalled()
        })
    })

    /* ───── Keyboard Navigation ───── */

    describe('keyboard navigation', () => {
        it('triggers browse on Enter key', async () => {
            const wrapper = mountUploadCard()
            const dropZone = wrapper.find('.border-dashed')
            const input = wrapper.find('input[type="file"]').element as HTMLInputElement

            const clickSpy = vi.spyOn(input, 'click').mockImplementation(() => {})
            await dropZone.trigger('keydown.enter')

            expect(clickSpy).toHaveBeenCalled()
        })

        it('triggers browse on Space key', async () => {
            const wrapper = mountUploadCard()
            const dropZone = wrapper.find('.border-dashed')
            const input = wrapper.find('input[type="file"]').element as HTMLInputElement

            const clickSpy = vi.spyOn(input, 'click').mockImplementation(() => {})
            await dropZone.trigger('keydown.space')

            expect(clickSpy).toHaveBeenCalled()
        })

        it('has correct role and tabindex for accessibility', () => {
            const wrapper = mountUploadCard()
            const dropZone = wrapper.find('.border-dashed')

            expect(dropZone.attributes('role')).toBe('button')
            expect(dropZone.attributes('tabindex')).toBe('0')
        })
    })

    /* ───── Click to Browse ───── */

    describe('click to browse', () => {
        it('opens file input when drop zone is clicked', async () => {
            const wrapper = mountUploadCard()
            const dropZone = wrapper.find('.border-dashed')
            const input = wrapper.find('input[type="file"]').element as HTMLInputElement

            const clickSpy = vi.spyOn(input, 'click').mockImplementation(() => {})
            await dropZone.trigger('click')

            expect(clickSpy).toHaveBeenCalled()
        })

        it('opens file input when browse button is clicked', async () => {
            const wrapper = mountUploadCard()
            const browseButton = wrapper.find('button')
            const input = wrapper.find('input[type="file"]').element as HTMLInputElement

            const clickSpy = vi.spyOn(input, 'click').mockImplementation(() => {})
            await browseButton.trigger('click')

            expect(clickSpy).toHaveBeenCalled()
        })
    })

    /* ───── Edge Cases ───── */

    describe('edge cases', () => {
        it('filters files exactly at maxSize boundary', async () => {
            const wrapper = mountUploadCard({ maxSize: 1024 })
            const input = wrapper.find('input[type="file"]')
            const exactFile = createFile('exact.txt', 1024)
            const overFile = createFile('over.txt', 1025)

            Object.defineProperty(input.element, 'files', {
                value: [exactFile, overFile],
                writable: false,
            })
            await input.trigger('change')

            expect(wrapper.emitted('upload')).toHaveLength(1)
            expect(wrapper.emitted('upload')![0][0]).toEqual([exactFile])
        })

        it('accepts maxSize of 0 (edge case)', async () => {
            const wrapper = mountUploadCard({ maxSize: 0 })
            const input = wrapper.find('input[type="file"]')
            const emptyFile = createFile('empty.txt', 0)
            const nonEmptyFile = createFile('non-empty.txt', 1)

            Object.defineProperty(input.element, 'files', {
                value: [emptyFile, nonEmptyFile],
                writable: false,
            })
            await input.trigger('change')

            expect(wrapper.emitted('upload')).toHaveLength(1)
            expect(wrapper.emitted('upload')![0][0]).toEqual([emptyFile])
        })

        it('handles multiple file selection at once', async () => {
            const wrapper = mountUploadCard()
            const input = wrapper.find('input[type="file"]')
            const files = [
                createFile('a.txt', 100),
                createFile('b.txt', 200),
                createFile('c.txt', 300),
            ]

            Object.defineProperty(input.element, 'files', {
                value: files,
                writable: false,
            })
            await input.trigger('change')

            expect(wrapper.emitted('upload')).toHaveLength(1)
            expect(wrapper.emitted('upload')![0][0]).toHaveLength(3)
        })

        it('defaults title to locale key when not provided', () => {
            const wrapper = mountUploadCard()
            expect(wrapper.find('h3').text()).toBe('Upload Files')
        })

        it('defaults description to locale key when not provided', () => {
            const wrapper = mountUploadCard()
            expect(wrapper.find('p').text()).toContain('Drag and drop your files here')
        })
    })
})
