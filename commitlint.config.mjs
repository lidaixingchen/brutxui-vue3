/**
 * commitlint 提交信息门禁配置。
 *
 * 规则与 docs/guides/COMMIT_CONVENTION.md 保持一致：
 * - type-enum 与 generate-changelog.mjs 的 11 种 type 对齐
 * - 自定义 plugin 规则 description-max-length：描述（header 中 `: ` 之后）≤ 50 字符，
 *   按 code point 计数（中文=1）
 *
 * 仅依赖 @commitlint/cli。
 */
export default {
    plugins: [
        {
            rules: {
                'description-max-length': (parsed) => {
                    const subject = parsed.subject ?? ''
                    const length = [...subject].length
                    return [
                        length <= 50,
                        `description must not be longer than 50 characters (current: ${length})`,
                    ]
                },
            },
        },
    ],
    rules: {
        'type-enum': [
            2,
            'always',
            ['feat', 'fix', 'refactor', 'docs', 'style', 'test', 'chore', 'perf', 'ci', 'build', 'revert'],
        ],
        'type-case': [2, 'always', 'lower-case'],
        'type-empty': [2, 'never'],
        'scope-case': [2, 'always', 'lower-case'],
        'subject-empty': [2, 'never'],
        'header-max-length': [2, 'always', 100],
        'description-max-length': [2, 'always'],
    },
}
