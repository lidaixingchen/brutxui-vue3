# 长期建议调研报告

> **调研日期**：2026-06-30
> **关联报告**：[UI_TECH_DEBT_AUDIT_2026.md](./UI_TECH_DEBT_AUDIT_2026.md)
> **调研范围**：剩余 3 条未实施的长期建议

---

## 一、ESLint `consistent-type-assertions` 规则

### 1.1 当前状态

- **ESLint 配置**：Flat Config（ESLint 9+），使用 `typescript-eslint` + `eslint-plugin-vue`
- **已有严格规则**：`no-explicit-any: error`、`strict: true`
- **未配置** `@typescript-eslint/consistent-type-assertions`

### 1.2 项目类型断言统计

| 类别 | 数量 | 说明 |
|------|------|------|
| `as Type` 断言（源代码） | ~20 处 | DOM 元素查询、类型窄化 |
| `as Type` 断言（测试） | ~120 处 | DOM 查询、事件数据、symbol 键 |
| `as const` 断言 | ~30+ 处 | 安全，不受规则影响 |
| `as unknown as` 双重断言 | **0 处** | 已在技术债修复中消除 |
| `as any` | 2 处 | 测试文件，已被 `no-explicit-any` 覆盖 |

### 1.3 推荐配置

```js
// packages/ui/eslint.config.js
'@typescript-eslint/consistent-type-assertions': ['error', {
    assertionStyle: 'as',                    // 统一使用 as 语法（.vue 文件不兼容 angle-bracket）
    objectLiteralTypeAssertions: 'allow',    // 允许对象字面量断言（降低迁移成本）
}]
```

> **说明**：当 `assertionStyle: 'as'` 时，`allowAssertions` 和 `allowArgumentAssertions` 等选项仅在 `assertionStyle: 'angle-bracket'` 或 `'never'` 时有效。使用 `objectLiteralTypeAssertions: 'allow'` 可以避免对对象字面量断言的限制。

### 1.4 实施路径

| 阶段 | 配置 | 迁移成本 |
|------|------|----------|
| 阶段一（推荐先执行） | `allowAssertions: true` | **零成本** — 项目已统一使用 `as` 语法 |
| 阶段二（团队适应后） | `allowAssertions: false` | 源代码 ~15-20 处需改为类型守卫 |
| 阶段三（可选） | 测试文件单独放宽为 `allowAssertions: true` | 测试文件 ~120 处无需改动 |

### 1.5 建议

直接启用阶段一（`allowAssertions: true`），零报错即可合入。后续视团队情况逐步收紧。

---

## 二、CI 可访问性自动化测试（axe-core）

### 2.1 当前状态

- **CI**：GitHub Actions，`pnpm test` 已在流水线中运行
- **测试框架**：Vitest 4.x + happy-dom
- **现有可访问性测试**：`accessibility.test.ts`（637 行），覆盖 17 个组件，全部为**手动 ARIA 断言**
- **axe-core 依赖**：**未安装**

### 2.2 方案对比

| 维度 | **vitest-axe** | **@axe-core/playwright** | **jest-axe** |
|------|----------------|--------------------------|--------------|
| 适配性 | ✅ 原生匹配 Vitest + happy-dom | 需另起 Playwright 套件 | 需适配层 |
| 执行速度 | 快（毫秒级） | 慢（需启动浏览器） | 快 |
| CI 集成 | ✅ 零成本，现有 `pnpm test` 自动覆盖 | 需新增 CI 步骤 | 需额外配置 |
| 依赖 | 1 个（内置 axe-core） | 2 个 | 1 个 |

### 2.3 推荐方案

**vitest-axe（主） + @axe-core/playwright（辅，可选）**

理由：
1. 技术栈完全匹配，零 CI 改动成本
2. happy-dom 下执行速度快，不影响现有测试套件
3. 可在现有 `*.test.ts` 文件中直接追加 axe 扫描
4. Playwright 作为 E2E 补充（未来需要真实浏览器渲染时引入）

### 2.4 实施步骤

**步骤 1：安装依赖**

```bash
pnpm --filter brutx-ui-vue add -D vitest-axe
```

> **说明**：`vitest-axe` 已内置 `axe-core` 依赖，无需单独安装。

**步骤 2：全局配置**（`vitest.setup.ts`）

```typescript
import 'vitest-axe/extend-expect'  // 自动扩展 expect 类型，添加 toHaveNoViolations()
import { configureAxe } from 'vitest-axe'

// 导出配置好的 axe 实例供测试使用
export const axe = configureAxe({
    rules: [
        { id: 'color-contrast', enabled: false },  // happy-dom 不支持真实计算样式
        { id: 'link-name', enabled: false },         // happy-dom 下链接检测不准确
    ],
})
```

**步骤 3：类型声明**

在 `tsconfig.json` 中添加 setup 文件：

```json
{
    "include": [
        "src/**/*.ts",
        "src/**/*.d.ts",
        "src/**/*.vue",
        "./vitest.setup.ts"  // 添加这一行
    ]
}
```

**步骤 4：为组件添加 axe 测试**（示例）

```typescript
// 从 vitest.setup.ts 导入配置好的 axe 实例
import { axe } from '../vitest.setup'
import { mount } from '@vue/test-utils'
import Button from './Button.vue'

describe('Button a11y', () => {
    it('should have no axe violations', async () => {
        const wrapper = mount(Button, { attachTo: document.body })
        expect(await axe(wrapper.element)).toHaveNoViolations()
    })
})
```

> **替代方案**：也可以直接从 `vitest-axe` 导入 `axe`，在测试中单独配置：
>
> ```typescript
> import { axe } from 'vitest-axe'
>
> it('should have no axe violations', async () => {
>     const results = await axe(wrapper.element, {
>         rules: [{ id: 'region', enabled: false }]
>     })
>     expect(results).toHaveNoViolations()
> })
> ```

### 2.5 覆盖策略

| 阶段 | 组件范围 | 数量 |
|------|----------|------|
| 第一阶段 | 核心交互组件（Button、Input、Dialog、Select 等） | ~15 个 |
| 第二阶段 | 数据展示组件（Table、Toast、Pagination 等） | ~20 个 |
| 第三阶段 | 布局与页面组件（Avatar、Card、Skeleton 等） | ~56 个 |

### 2.6 注意事项

- **happy-dom 限制**：`color-contrast`、`scrollable-region-focusable`、`focus-order-semantics` 等规则需真实浏览器，建议禁用或后续用 Playwright 覆盖
- **reka-ui 依赖**：项目大量使用 reka-ui 作为 headless UI 基础，axe 检查主要是验证包装层没有引入回归
- **CI 无需修改**：`pnpm test` 自动运行所有 `*.test.ts`，新增 axe 测试自然纳入

---

## 三、ESLint 导入路径规范

### 3.1 当前状态

**源文件**：470 个，共 2435 条导入语句。

| 导入风格 | 数量 | 占比 | 问题 |
|----------|------|------|------|
| `./` 同目录 | 895 | 36.8% | ✅ 正常 |
| `../` 单层父目录 | 264 | 10.8% | ✅ 正常 |
| `../../` 多层相对路径 | **318** | **13.1%** | ❌ 问题所在（215 个文件） |
| `@/` 别名 | **227** | **9.3%** | ✅ 正确风格 |

**问题核心**：`../../` 与 `@/` 两种风格混用，同一文件中同时出现两种写法。

**验证命令**：

```bash
# 统计 ../../ 导入数量
grep -r "from '\.\./\.\." packages/ui/src --include="*.ts" --include="*.vue" | wc -l

# 统计涉及的文件数量
grep -rl "from '\.\./\.\." packages/ui/src --include="*.ts" --include="*.vue" | wc -l
```

### 3.2 推荐规范

> 当导入路径包含 `../../`（两层及以上 `..`）时，必须替换为 `@/` 别名。
> `./` 和 `../`（单层）保持不变。

理由：
- `tsconfig.json` 和 `vite.config.ts` 均已配置 `@` 别名（指向 `./src`），基础设施就绪
- `@/` 路径语义清晰，不受文件移动影响
- `./` 和 `../` 简洁且符合直觉，无需改造

### 3.3 ESLint 规则配置

**方案 A：eslint-plugin-import-x**（推荐）

```bash
pnpm add -D eslint-plugin-import-x
```

```js
// packages/ui/eslint.config.js
import importX from 'eslint-plugin-import-x'

{
    plugins: { 'import-x': importX },
    rules: {
        'import-x/no-relative-parent-imports': ['error', { max: 1 }],
    },
}
```

**方案 B：ESLint 内置规则**（轻量替代，无需新依赖）

```js
{
    rules: {
        'no-restricted-imports': ['error', {
            patterns: [{
                group: ['../../*'],  // 匹配所有 2 层及以上的相对路径
                message: '请使用 @/ 别名代替多层相对路径导入',
            }],
        }],
    },
}
```

> **说明**：`../../*` 模式会匹配 `../../`、`../../../`、`../../../../` 等所有 2 层及以上的相对路径导入。

### 3.4 自动修复

| 方面 | 评估 |
|------|------|
| ESLint `--fix` | ❌ 不支持（规则仅报错，不自动修复） |
| 批量修复 | ✅ 可行 — 编写脚本根据文件位置计算 `@/` 路径并替换 |
| 修复风险 | 低 — 有 TypeScript 编译和 ESLint 验证兜底 |

### 3.5 实施步骤

| 步骤 | 内容 | 预估时间 |
|------|------|----------|
| 1 | 安装依赖、配置 ESLint 规则 | 5 分钟 |
| 2 | 批量替换 `../../` 为 `@/`（318 处） | 30 分钟 |
| 3 | 运行 `pnpm typecheck && pnpm lint && pnpm test` 验证 | 5 分钟 |
| 4 | 提交并确认 CI lint 步骤拦截新违规 | - |

### 3.6 注意事项

- 修复过程中可能发现循环导入问题，需逐一处理
- barrel export 文件（如原 `index.ts`）可能需要特殊处理
- 建议单次提交：`fix(ui): 统一导入路径风格为 @/ 别名`

---

## 四、总结与优先级

| # | 建议 | 实施成本 | 推荐优先级 |
|---|------|----------|------------|
| 1 | ESLint `consistent-type-assertions` | 零成本（阶段一） | ⭐ 立即执行 |
| 2 | axe-core 可访问性测试 | 低（依赖安装 + 测试编写） | ⭐ 本迭代内 |
| 3 | 导入路径规范 | 中（318 处批量替换） | 下个迭代 |

**建议执行顺序**：1 → 2 → 3（按成本从低到高）

---

**报告生成时间**：2026-06-30
