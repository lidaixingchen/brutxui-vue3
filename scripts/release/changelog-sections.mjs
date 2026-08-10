/**
 * CHANGELOG 段落固定顺序（单一数据源）。
 *
 * 原则：按影响面降序——破坏性变更影响所有升级者，放最前；新功能其次；
 * 代码重构、缺陷修复、文档、测试居中；其余类型（性能/构建/CI/样式/回退/杂项）兜底。
 * 顺序不再依赖提交在 git log 中出现的先后，保证每次生成稳定一致。
 */
export const BREAKING_SECTION_LABEL = '⚠️ Breaking Changes';

export const SECTION_ORDER = [
    BREAKING_SECTION_LABEL,
    '✨ Features',
    '♻️ Code Refactoring',
    '🐛 Bug Fixes',
    '📝 Documentation',
    '✅ Tests',
    '⚡ Performance',
    '📦 Build',
    '🔧 CI',
    '🎨 Styles',
    '⏪ Reverts',
    '🧹 Chores',
];
