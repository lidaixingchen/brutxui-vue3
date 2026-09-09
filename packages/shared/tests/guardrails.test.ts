import { describe, it, expect } from 'vitest'
import path from 'node:path'
import { getRepoRoot, toPosixPath, normalizeAbsPath } from '../../../scripts/shared/path.mjs'
import { normalizeRealPath, verifyCaseSync, existsExactCaseSync } from '../../../scripts/shared/fs-native.mjs'
import { maskInlineCodeSpans, traverseMarkdownLines } from '../../../scripts/shared/markdown-lexer.mjs'
import { parseWorkspaceGlobs, discoverWorkspacePackages } from '../../../scripts/shared/workspace.mjs'

describe('scripts/shared 基础工具链套件', () => {
  describe('path.mjs 跨平台路径工具', () => {
    it('getRepoRoot 能获取绝对路径且包含 package.json', () => {
      const root = getRepoRoot()
      expect(typeof root).toBe('string')
      expect(path.isAbsolute(root)).toBe(true)
    })

    it('toPosixPath 能统一路径分隔符为正斜杠（即便在非 Windows 环境也能清理反斜杠）', () => {
      expect(toPosixPath('packages\\ui\\src\\index.ts')).toBe('packages/ui/src/index.ts')
      expect(toPosixPath('packages/ui/src/index.ts')).toBe('packages/ui/src/index.ts')
      expect(toPosixPath('mixed/path\\to/file.md')).toBe('mixed/path/to/file.md')
    })

    it('normalizeAbsPath 能处理 file:/// URL、常规路径与带 fragment/query 的 URL', () => {
      const root = getRepoRoot()
      const absPkg = path.join(root, 'package.json')
      expect(normalizeAbsPath(absPkg)).toBe(absPkg)

      // 带 fragment/query 的 URL 剥离测试
      const fileUrl = 'file:///C:/project/foo.md#L10-L20?v=1'
      expect(normalizeAbsPath(fileUrl)).toBe(path.resolve('C:/project/foo.md'))
    })
  })

  describe('fs-native.mjs 原生大小写穿透与系统调用', () => {
    it('normalizeRealPath 能剥离 Windows \\\\?\\ 扩展前缀与 UNC 前缀', () => {
      expect(normalizeRealPath('\\\\?\\E:\\project\\brutxui\\package.json')).toBe('E:/project/brutxui/package.json')
      expect(normalizeRealPath('\\\\?\\UNC\\server\\share\\package.json')).toBe('//server/share/package.json')
      expect(normalizeRealPath('E:\\project\\brutxui\\package.json')).toBe('E:/project/brutxui/package.json')
    })

    it('verifyCaseSync 对真实存在的文件返回 exactCase = true', () => {
      const root = getRepoRoot()
      const pkgPath = path.join(root, 'package.json')
      const result = verifyCaseSync(pkgPath, root)
      expect(result.exists).toBe(true)
      expect(result.exactCase).toBe(true)
      expect(existsExactCaseSync(pkgPath, root)).toBe(true)
    })

    it('verifyCaseSync 能精准拦截 Windows 11 NTFS 大小写错位', () => {
      const root = getRepoRoot()
      // 故意修改物理大小写（Package.json 代替 package.json）
      const wrongCasePath = path.join(root, 'Package.json')
      const result = verifyCaseSync(wrongCasePath, root)

      if (process.platform === 'win32') {
        // 在 Windows 11 下，文件物理存在但大小写不吻合
        expect(result.exists).toBe(true)
        expect(result.exactCase).toBe(false)
        expect(existsExactCaseSync(wrongCasePath, root)).toBe(false)
      } else {
        // 在 Linux/macOS 下直接返回不存在
        expect(result.exactCase).toBe(false)
      }
    })

    it('verifyCaseSync 对不存在的文件返回 exists = false', () => {
      const root = getRepoRoot()
      const fakePath = path.join(root, 'non-existent-file-xyz.json')
      const result = verifyCaseSync(fakePath, root)
      expect(result.exists).toBe(false)
      expect(result.exactCase).toBe(false)
    })
  })

  describe('markdown-lexer.mjs 词法掩码与严格状态机', () => {
    it('maskInlineCodeSpans 遮蔽反引号代码块并保持字符偏移', () => {
      const line = '前缀 `## 伪标题` 后缀'
      const masked = maskInlineCodeSpans(line)
      expect(masked.length).toBe(line.length)
      expect(masked).not.toContain('## 伪标题')
      expect(masked.startsWith('前缀 ')).toBe(true)
      expect(masked.endsWith(' 后缀')).toBe(true)
    })

    it('traverseMarkdownLines 精确区分正文与围栏，且带语言标签的伪闭合行不中断围栏', () => {
      const markdown = [
        '# 正文标题',
        '````markdown',
        '```vue',
        '## 伪预览',
        '<ComponentPreview />',
        '```',
        '````',
        '## 真实章节',
      ].join('\n')

      const collected = []
      traverseMarkdownLines(markdown, (ctx) => {
        collected.push(ctx)
      })

      expect(collected[0].inFence).toBe(false)
      expect(collected[0].raw).toBe('# 正文标题')

      expect(collected[1].inFence).toBe(true)
      expect(collected[2].inFence).toBe(true)
      expect(collected[3].inFence).toBe(true)
      expect(collected[4].inFence).toBe(true)
      expect(collected[5].inFence).toBe(true)
      expect(collected[6].inFence).toBe(true)
      expect(collected[7].inFence).toBe(false)
      expect(collected[7].raw).toBe('## 真实章节')
    })

    it('traverseMarkdownLines 能支持波浪线 ~~~ 围栏配对', () => {
      const markdown = [
        '~~~bash',
        'npm install',
        '~~~',
        '## 下一步',
      ].join('\n')

      const collected = []
      traverseMarkdownLines(markdown, (ctx) => {
        collected.push(ctx)
      })

      expect(collected[0].inFence).toBe(true)
      expect(collected[1].inFence).toBe(true)
      expect(collected[2].inFence).toBe(true)
      expect(collected[3].inFence).toBe(false)
      expect(collected[3].raw).toBe('## 下一步')
    })

    it('traverseMarkdownLines 防御正文单行伪围栏（不泄漏开启多行围栏状态）', () => {
      const markdown = [
        '正文开始',
        '```npm run build``` 用于执行构建',
        '## 真实安装章节',
      ].join('\n')

      const collected = []
      traverseMarkdownLines(markdown, (ctx) => {
        collected.push(ctx)
      })

      expect(collected[0].inFence).toBe(false)
      // 单行伪代码块在本行消费，下一行必须保持正文状态
      expect(collected[2].inFence).toBe(false)
      expect(collected[2].raw).toBe('## 真实安装章节')
    })

    it('traverseMarkdownLines 正确识别 HTML 注释区间且单行注释不泄漏', () => {
      const markdown = [
        '正文',
        '<!-- 单行注释说明 --> 后续文本',
        '## 真实有效标题',
        '<!--',
        '## 多行注释中的标题',
        '-->',
        '正文结尾',
      ].join('\n')

      const collected = []
      traverseMarkdownLines(markdown, (ctx) => {
        collected.push(ctx)
      })

      expect(collected[0].inComment).toBe(false)
      expect(collected[1].inComment).toBe(true) // 单行注释所在行被正确识别
      expect(collected[2].inComment).toBe(false) // 关键验证：后续正文行绝不被单行注释泄漏污染
      expect(collected[3].inComment).toBe(true) // 多行注释开启
      expect(collected[4].inComment).toBe(true)
      expect(collected[5].inComment).toBe(true)
      expect(collected[6].inComment).toBe(false)
    })
  })

  describe('workspace.mjs 拓扑感知', () => {
    it('parseWorkspaceGlobs 能准确提取 packages 列表并剥离行内注释和排除规则', () => {
      const yaml = [
        'packages:',
        "  - 'apps/*' # 应用目录",
        "  - 'packages/*' # 组件库子包",
        "  - '!packages/legacy-*' # 排除旧包",
        'strictPeerDependencies: false',
        'overrides:',
        '  undici: ^7.29.0',
      ].join('\n')

      const globs = parseWorkspaceGlobs(yaml)
      expect(globs).toEqual(['apps/*', 'packages/*'])
    })

    it('discoverWorkspacePackages 能动态读取当前工作区子包', () => {
      const pkgs = discoverWorkspacePackages()
      const names = pkgs.map((p) => p.name)
      expect(names).toContain('brutx-ui-vue')
      expect(names).toContain('brutx-vue')
      expect(names).toContain('brutx-shared-vue')
      expect(names).toContain('brutx-registry-vue')
      expect(names).toContain('docs')
    })
  })
})
