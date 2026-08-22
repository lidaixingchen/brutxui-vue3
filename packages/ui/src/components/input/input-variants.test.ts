import { describe, expect, it } from 'vitest'
import { cn } from '@/lib/utils'
import { inputContainerVariants } from './input-variants'

/** 模拟组件真实消费路径：cva 输出经 cn()（twMerge）合并后断言 */
function renderClasses(props: Parameters<typeof inputContainerVariants>[0]): string[] {
    return cn(inputContainerVariants(props)).split(/\s+/)
}

describe('inputContainerVariants inset 冲压凹槽变体', () => {
    it('应用内嵌凹槽阴影且不含基座外凸投影', () => {
        const classTokens = renderClasses({ variant: 'inset' })
        expect(classTokens).toContain('shadow-brutal-inset')
        expect(classTokens).not.toContain('shadow-brutal')
    })

    it('不含悬浮上浮、按压位移与聚焦上浮反馈（凹槽是静态冲压形态）', () => {
        const classTokens = renderClasses({ variant: 'inset' })
        expect(classTokens).not.toContain('hover:-translate-y-0.5')
        expect(classTokens).not.toContain('hover:shadow-brutal-lg')
        expect(classTokens).not.toContain('active:translate-x-[var(--brutal-shadow-offset-x,4px)]')
        expect(classTokens).not.toContain('active:shadow-none')
        expect(classTokens).not.toContain('focus-within:shadow-brutal-lg')
        expect(classTokens).not.toContain('focus-within:-translate-y-0.5')
    })

    it('聚焦态显式保持凹槽阴影（focus-within 同值声明）', () => {
        const classTokens = renderClasses({ variant: 'inset' })
        expect(classTokens).toContain('focus-within:shadow-brutal-inset')
    })

    it('R7 焦点环保留：聚焦指示环类完整存在', () => {
        const classTokens = renderClasses({ variant: 'inset' })
        expect(classTokens).toContain('focus-within:ring-2')
        expect(classTokens).toContain('focus-within:ring-brutal-ring')
        expect(classTokens).toContain('focus-within:outline-hidden')
    })

    it('default 变体保留外凸投影与完整交互反馈', () => {
        const classTokens = renderClasses({ variant: 'default' })
        expect(classTokens).toContain('shadow-brutal')
        expect(classTokens).toContain('hover:-translate-y-0.5')
        expect(classTokens).toContain('active:translate-x-[var(--brutal-shadow-offset-x,4px)]')
        expect(classTokens).toContain('active:shadow-none')
        expect(classTokens).toContain('focus-within:shadow-brutal-lg')
        expect(classTokens).not.toContain('shadow-brutal-inset')
    })

    it('error/success 校验变体的聚焦阴影不被 elevatedFeedback 覆盖（同组后者胜）', () => {
        expect(renderClasses({ variant: 'error' })).toContain('focus-within:shadow-brutal-primary')
        expect(renderClasses({ variant: 'success' })).toContain('focus-within:shadow-brutal-secondary')
    })
})
