import { cva } from 'class-variance-authority'

// 根容器不设背景：头部（bg-brutal-muted）与正文（bg-brutal-bg）完整铺满容器内部，
// 根上的背景永不可见且易与正文变体漏改导致配色不一致，交由子层各自声明。
export const codeBlockRootVariants = cva(
    'border-3 border-brutal text-brutal-fg rounded-brutal shadow-brutal overflow-hidden'
)

export const codeBlockHeaderVariants = cva(
    'bg-brutal-muted border-b-3 border-brutal flex justify-between items-center px-4 py-2 text-xs font-black select-none'
)

export const codeBlockLanguageVariants = cva(
    'bg-brutal-accent text-brutal-fg border-3 border-brutal rounded-brutal px-1.5 py-0.5 text-[10px] uppercase font-black tracking-wider'
)

export const codeBlockBodyVariants = cva(
    'relative flex items-stretch p-4 overflow-x-auto text-sm font-mono bg-brutal-bg'
)

// 行号列位于 overflow-x-auto 的正文容器内：sticky left-0 使超宽代码横向滚动时行号仍贴左可见，
// 配同底色与 z-index 防止代码从下方透出；显式声明 font-mono，不依赖正文继承（独立使用也不丢对齐）。
export const codeBlockLineNumbersVariants = cva(
    'sticky left-0 z-10 bg-brutal-bg flex flex-col text-right font-mono text-brutal-fg/40 select-none pr-4 mr-4 border-r-3 border-brutal font-bold'
)

export const codeBlockCopyButtonVariants = cva(
    // 窄化 overlay 竞争类：bg/shadow/transition/hover 交还 CopyToClipboard variants 按状态接管，
    // 只保留尺寸/文字/边框，避免 twMerge 击穿 copied/failed 的 bg-brutal-success/destructive、
    // shadow-none 与 transition-none（见裁决报告 §C5）
    'h-7 px-3 text-xs border-3 border-brutal'
)
