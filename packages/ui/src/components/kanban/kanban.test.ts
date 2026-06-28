import { mount } from '@vue/test-utils'
import KanbanBoard from './KanbanBoard.vue'
import type { KanbanCard, KanbanColumn } from './KanbanBoard.vue'
import { zhCN } from '@/locales/zh-CN'

const card1: KanbanCard = {
    id: 'card-1',
    title: 'Design System',
    description: 'Create design tokens',
    tags: ['design', 'ui'],
}

const card2: KanbanCard = {
    id: 'card-2',
    title: 'API Integration',
    tags: ['backend'],
}

const card3: KanbanCard = {
    id: 'card-3',
    title: 'Bug Fix',
    description: 'Fix login redirect',
}

const columns: KanbanColumn[] = [
    {
        id: 'todo',
        title: 'To Do',
        cards: [card1, card2],
    },
    {
        id: 'in-progress',
        title: 'In Progress',
        color: '#4ECDC4',
        cards: [card3],
    },
    {
        id: 'done',
        title: 'Done',
        cards: [],
    },
]

describe('KanbanBoard', () => {
    it('renders columns and cards', () => {
        const wrapper = mount(KanbanBoard, {
            props: { modelValue: columns },
        })
        const columnEls = wrapper.findAll('[class*="flex-col"]')
        expect(columnEls.length).toBeGreaterThanOrEqual(3)
        expect(wrapper.text()).toContain('Design System')
        expect(wrapper.text()).toContain('API Integration')
        expect(wrapper.text()).toContain('Bug Fix')
    })

    it('shows column titles', () => {
        const wrapper = mount(KanbanBoard, {
            props: { modelValue: columns },
        })
        expect(wrapper.text()).toContain('To Do')
        expect(wrapper.text()).toContain('In Progress')
        expect(wrapper.text()).toContain('Done')
    })

    it('shows card count badge', () => {
        const wrapper = mount(KanbanBoard, {
            props: { modelValue: columns },
        })
        const badges = wrapper.findAll('span.text-xs.font-bold.border-3')
        const texts = badges.map((b) => b.text())
        expect(texts).toContain('2')
        expect(texts).toContain('1')
        expect(texts).toContain('0')
    })

    it('shows empty state for empty column', () => {
        const wrapper = mount(KanbanBoard, {
            props: { modelValue: columns },
        })
        expect(wrapper.text()).toContain(zhCN.kanban.dropCardsHere)
    })

    it('renders card tags', () => {
        const wrapper = mount(KanbanBoard, {
            props: { modelValue: columns },
        })
        expect(wrapper.text()).toContain('design')
        expect(wrapper.text()).toContain('ui')
        expect(wrapper.text()).toContain('backend')
    })

    it('applies custom class', () => {
        const wrapper = mount(KanbanBoard, {
            props: { modelValue: columns, class: 'my-board' },
        })
        expect(wrapper.classes()).toContain('my-board')
    })

    it('cards are draggable', () => {
        const wrapper = mount(KanbanBoard, {
            props: { modelValue: columns },
        })
        const cards = wrapper.findAll('[data-card-id]')
        expect(cards.length).toBe(3)
    })

    it('reorders card within same column on drop', async () => {
        const wrapper = mount(KanbanBoard, {
            props: { modelValue: columns },
        })

        const mockRect = (top: number, height: number): DOMRect =>
            ({
                top,
                bottom: top + height,
                left: 0,
                right: 100,
                width: 100,
                height,
                x: 0,
                y: top,
                toJSON: () => ({}),
            }) as DOMRect

        const card1Wrapper = wrapper.find('[data-card-id="card-1"]')
        const card2Wrapper = wrapper.find('[data-card-id="card-2"]')
        const card1El = card1Wrapper.element as HTMLElement
        const card2El = card2Wrapper.element as HTMLElement
        const todoColumnEl = card1El.parentElement!.parentElement as HTMLElement

        card1El.getBoundingClientRect = () => mockRect(0, 50)
        card2El.getBoundingClientRect = () => mockRect(50, 50)

        await card1Wrapper.trigger('dragstart')

        const dropEvent = new MouseEvent('drop', { bubbles: true, clientY: 100 })
        todoColumnEl.dispatchEvent(dropEvent)

        await wrapper.vm.$nextTick()

        const emitted = wrapper.emitted('update:modelValue')
        expect(emitted).toBeTruthy()
        const newColumns = emitted![0][0] as KanbanColumn[]
        const todoCards = newColumns.find((c) => c.id === 'todo')!.cards
        expect(todoCards.map((c) => c.id)).toEqual(['card-2', 'card-1'])
    })

    it('reorders card backward within same column on drop', async () => {
        const fourCardColumns: KanbanColumn[] = [
            {
                id: 'todo',
                title: 'To Do',
                cards: [
                    { id: 'card-a', title: 'A' },
                    { id: 'card-b', title: 'B' },
                    { id: 'card-c', title: 'C' },
                    { id: 'card-d', title: 'D' },
                ],
            },
        ]

        const wrapper = mount(KanbanBoard, {
            props: { modelValue: fourCardColumns },
        })

        const mockRect = (top: number, height: number): DOMRect =>
            ({
                top,
                bottom: top + height,
                left: 0,
                right: 100,
                width: 100,
                height,
                x: 0,
                y: top,
                toJSON: () => ({}),
            }) as DOMRect

        const cardAEl = wrapper.find('[data-card-id="card-a"]').element as HTMLElement
        const cardBEl = wrapper.find('[data-card-id="card-b"]').element as HTMLElement
        const cardCEl = wrapper.find('[data-card-id="card-c"]').element as HTMLElement
        const cardDEl = wrapper.find('[data-card-id="card-d"]').element as HTMLElement
        const todoColumnEl = cardAEl.parentElement!.parentElement as HTMLElement

        cardAEl.getBoundingClientRect = () => mockRect(0, 50)
        cardBEl.getBoundingClientRect = () => mockRect(50, 50)
        cardCEl.getBoundingClientRect = () => mockRect(100, 50)
        cardDEl.getBoundingClientRect = () => mockRect(150, 50)

        const cardCWrapper = wrapper.find('[data-card-id="card-c"]')
        await cardCWrapper.trigger('dragstart')

        const dropEvent = new MouseEvent('drop', { bubbles: true, clientY: 60 })
        todoColumnEl.dispatchEvent(dropEvent)

        await wrapper.vm.$nextTick()

        const emitted = wrapper.emitted('update:modelValue')
        expect(emitted).toBeTruthy()
        const newColumns = emitted![0][0] as KanbanColumn[]
        const todoCards = newColumns.find((c) => c.id === 'todo')!.cards
        expect(todoCards.map((c) => c.id)).toEqual(['card-a', 'card-c', 'card-b', 'card-d'])
    })

    it('moves card to different column on drop', async () => {
        const wrapper = mount(KanbanBoard, {
            props: { modelValue: columns },
        })

        const mockRect = (top: number, height: number): DOMRect =>
            ({
                top,
                bottom: top + height,
                left: 0,
                right: 100,
                width: 100,
                height,
                x: 0,
                y: top,
                toJSON: () => ({}),
            }) as DOMRect

        const card3Wrapper = wrapper.find('[data-card-id="card-3"]')
        const card1El = wrapper.find('[data-card-id="card-1"]').element as HTMLElement
        const card2El = wrapper.find('[data-card-id="card-2"]').element as HTMLElement
        const todoColumnEl = card1El.parentElement!.parentElement as HTMLElement

        card1El.getBoundingClientRect = () => mockRect(0, 50)
        card2El.getBoundingClientRect = () => mockRect(50, 50)

        await card3Wrapper.trigger('dragstart')

        const dropEvent = new MouseEvent('drop', { bubbles: true, clientY: 100 })
        todoColumnEl.dispatchEvent(dropEvent)

        await wrapper.vm.$nextTick()

        const emitted = wrapper.emitted('update:modelValue')
        expect(emitted).toBeTruthy()
        const newColumns = emitted![0][0] as KanbanColumn[]
        const todoCards = newColumns.find((c) => c.id === 'todo')!.cards
        expect(todoCards.map((c) => c.id)).toEqual(['card-1', 'card-2', 'card-3'])
        const inProgressCards = newColumns.find((c) => c.id === 'in-progress')!.cards
        expect(inProgressCards).toHaveLength(0)
    })
})
