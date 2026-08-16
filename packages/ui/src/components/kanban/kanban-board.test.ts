import { mount } from '@vue/test-utils'
import { en } from '@/locales/en'
import { LOCALE_INJECTION_KEY } from '@/composables/useLocale'
import KanbanBoard from './KanbanBoard.vue'
import type { KanbanColumn } from './types'

const localeProvide = { global: { provide: { [LOCALE_INJECTION_KEY]: en } } }

const columns: KanbanColumn[] = [
    {
        id: 'col1',
        title: 'To Do',
        cards: [
            { id: 'card1', title: 'Card 1' },
            { id: 'card2', title: 'Card 2' },
        ],
    },
    {
        id: 'col2',
        title: 'Done',
        cards: [],
    },
]

describe('KanbanBoard 键盘操作', () => {
    it('同列键盘移动（ArrowDown）补发 card-move', async () => {
        const wrapper = mount(KanbanBoard, {
            props: { modelValue: columns },
            ...localeProvide,
        })
        const card = wrapper.find('[data-card-id="card1"]')

        // Space 抓取卡片
        await card.trigger('keydown', { key: ' ' })
        // ArrowDown 同列下移
        await card.trigger('keydown', { key: 'ArrowDown' })

        const events = wrapper.emitted('card-move')
        expect(events).toHaveLength(1)
        expect(events![0]).toEqual(['card1', 'col1', 'col1'])
    })

    it('跨列键盘移动（ArrowRight）补发 card-move 且携带目标列', async () => {
        const wrapper = mount(KanbanBoard, {
            props: { modelValue: columns },
            ...localeProvide,
        })
        const card = wrapper.find('[data-card-id="card1"]')

        await card.trigger('keydown', { key: ' ' })
        await card.trigger('keydown', { key: 'ArrowRight' })

        const events = wrapper.emitted('card-move')
        expect(events).toHaveLength(1)
        expect(events![0]).toEqual(['card1', 'col1', 'col2'])
    })
})
