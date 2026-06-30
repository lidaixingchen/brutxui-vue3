import { mount } from '@vue/test-utils'
import { en } from '@/locales/en'
import { LOCALE_INJECTION_KEY } from '@/composables/useLocale'
import KanbanBoard from './KanbanBoard.vue'
import type { KanbanColumn } from './KanbanBoard.vue'

const localeProvide = { global: { provide: { [LOCALE_INJECTION_KEY]: en } } }

const sampleColumns: KanbanColumn[] = [
    {
        id: 'todo',
        title: 'To Do',
        cards: [
            { id: 'c1', title: 'Task 1' },
            { id: 'c2', title: 'Task 2' },
        ],
    },
    {
        id: 'done',
        title: 'Done',
        cards: [{ id: 'c3', title: 'Task 3' }],
    },
]

function createDataTransfer(): DataTransfer {
    return new DataTransfer()
}

describe('KanbanBoard', () => {
    it('renders all columns and cards', () => {
        const wrapper = mount(KanbanBoard, {
            props: { modelValue: sampleColumns },
            ...localeProvide,
        })
        expect(wrapper.text()).toContain('To Do')
        expect(wrapper.text()).toContain('Done')
        expect(wrapper.text()).toContain('Task 1')
        expect(wrapper.text()).toContain('Task 3')
    })

    it('shows card counts in column headers', () => {
        const wrapper = mount(KanbanBoard, {
            props: { modelValue: sampleColumns },
            ...localeProvide,
        })
        const counts = wrapper.findAll('.shadow-brutal.text-xs.font-bold')
        expect(counts[0].text()).toBe('2')
        expect(counts[1].text()).toBe('1')
    })

    it('renders default add-card button when slot not filled', () => {
        const wrapper = mount(KanbanBoard, {
            props: { modelValue: sampleColumns },
            ...localeProvide,
        })
        const buttons = wrapper.findAll('button')
        const addButtons = buttons.filter(btn => btn.text().includes('Add card'))
        expect(addButtons.length).toBe(2)
    })

    it('emits add-card with columnId when default + button clicked', async () => {
        const wrapper = mount(KanbanBoard, {
            props: { modelValue: sampleColumns },
            ...localeProvide,
        })
        const buttons = wrapper.findAll('button')
        const firstAddBtn = buttons.find(btn => btn.text().includes('Add card'))
        await firstAddBtn!.trigger('click')

        const events = wrapper.emitted('add-card')
        expect(events).toBeTruthy()
        expect(events![0]).toEqual(['todo'])
    })

    it('renders custom add-card slot instead of default button', () => {
        const wrapper = mount(KanbanBoard, {
            props: { modelValue: sampleColumns },
            slots: {
                'add-todo': '<button class="custom-add">Custom Add</button>',
            },
            ...localeProvide,
        })
        const customBtn = wrapper.find('.custom-add')
        expect(customBtn.exists()).toBe(true)
        expect(customBtn.text()).toBe('Custom Add')

        const todoColumn = wrapper.findAll('[class*="min-w-[260px]"]')[0]
        const defaultBtnsInTodo = todoColumn.findAll('button').filter(b => b.text().includes('Add card'))
        expect(defaultBtnsInTodo.length).toBe(0)
    })

    it('emits column-move when dragging column header onto another column', async () => {
        const wrapper = mount(KanbanBoard, {
            props: { modelValue: sampleColumns },
            ...localeProvide,
        })
        const headers = wrapper.findAll('[data-slot="kanban-column-header"]')
        const todoHeader = headers[0]
        const doneHeader = headers[1]

        await todoHeader.trigger('dragstart', { dataTransfer: createDataTransfer() })
        await doneHeader.trigger('dragover', { dataTransfer: createDataTransfer() })
        await doneHeader.trigger('drop', { dataTransfer: createDataTransfer() })

        const moveEvents = wrapper.emitted('column-move')
        expect(moveEvents).toBeTruthy()
        const [columnId, fromIndex, toIndex] = moveEvents![0] as [string, number, number]
        expect(columnId).toBe('todo')
        expect(fromIndex).toBe(0)
        expect(toIndex).toBe(1)
    })

    it('emits update:modelValue with reordered columns on column-move', async () => {
        const wrapper = mount(KanbanBoard, {
            props: { modelValue: sampleColumns },
            ...localeProvide,
        })
        const headers = wrapper.findAll('[data-slot="kanban-column-header"]')
        const doneHeader = headers[1]
        const todoHeader = headers[0]

        await doneHeader.trigger('dragstart', { dataTransfer: createDataTransfer() })
        await todoHeader.trigger('dragover', { dataTransfer: createDataTransfer() })
        await todoHeader.trigger('drop', { dataTransfer: createDataTransfer() })

        const updateEvents = wrapper.emitted('update:modelValue')
        expect(updateEvents).toBeTruthy()
        const newCols = updateEvents![0][0] as KanbanColumn[]
        expect(newCols[0].id).toBe('done')
        expect(newCols[1].id).toBe('todo')
    })

    it('does not emit column-move when dropping on same column', async () => {
        const wrapper = mount(KanbanBoard, {
            props: { modelValue: sampleColumns },
            ...localeProvide,
        })
        const headers = wrapper.findAll('[data-slot="kanban-column-header"]')
        const todoHeader = headers[0]

        await todoHeader.trigger('dragstart', { dataTransfer: createDataTransfer() })
        await todoHeader.trigger('dragover', { dataTransfer: createDataTransfer() })
        await todoHeader.trigger('drop', { dataTransfer: createDataTransfer() })

        expect(wrapper.emitted('column-move')).toBeFalsy()
        expect(wrapper.emitted('update:modelValue')).toBeFalsy()
    })

    it('does not emit column-move when no column is being dragged', async () => {
        const wrapper = mount(KanbanBoard, {
            props: { modelValue: sampleColumns },
            ...localeProvide,
        })
        const headers = wrapper.findAll('[data-slot="kanban-column-header"]')
        await headers[1].trigger('dragover', { dataTransfer: createDataTransfer() })
        await headers[1].trigger('drop', { dataTransfer: createDataTransfer() })

        expect(wrapper.emitted('column-move')).toBeFalsy()
    })

    it('renders empty state when column has no cards', () => {
        const emptyColumns: KanbanColumn[] = [
            { id: 'empty', title: 'Empty', cards: [] },
        ]
        const wrapper = mount(KanbanBoard, {
            props: { modelValue: emptyColumns },
            ...localeProvide,
        })
        expect(wrapper.text()).toContain('Drop cards here')
    })

    it('emits card-click when card is clicked', async () => {
        const wrapper = mount(KanbanBoard, {
            props: { modelValue: sampleColumns },
            ...localeProvide,
        })
        const card = wrapper.find('[data-card-id="c1"]')
        await card.trigger('click')

        const events = wrapper.emitted('card-click')
        expect(events).toBeTruthy()
        const [card2, columnId] = events![0] as [{ id: string }, string]
        expect(card2.id).toBe('c1')
        expect(columnId).toBe('todo')
    })

    it('emits card-move and update:modelValue when card is dragged to another column', async () => {
        const wrapper = mount(KanbanBoard, {
            props: { modelValue: sampleColumns },
            attachTo: document.body,
            ...localeProvide,
        })

        const cards = wrapper.findAll('[data-card-id]')
        const sourceCard = cards[0]

        const dataTransfer = createDataTransfer()
        await sourceCard.trigger('dragstart', { dataTransfer })

        const columns = wrapper.findAll('[class*="min-w-[260px]"]')
        const targetColumn = columns[1]
        await targetColumn.trigger('dragover', { dataTransfer })
        await targetColumn.trigger('drop', { dataTransfer })

        const moveEvents = wrapper.emitted('card-move')
        expect(moveEvents).toBeTruthy()
        const [cardId, fromColumn, toColumn] = moveEvents![0] as [string, string, string]
        expect(cardId).toBe('c1')
        expect(fromColumn).toBe('todo')
        expect(toColumn).toBe('done')

        const updateEvents = wrapper.emitted('update:modelValue')
        expect(updateEvents).toBeTruthy()
    })
})
