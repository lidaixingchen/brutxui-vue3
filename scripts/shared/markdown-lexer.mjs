/**
 * 遮蔽行内代码片段，保留原有字符长度与物理偏移
 * @param {string} line
 * @returns {string}
 */
export function maskInlineCodeSpans(line) {
  return line.replace(/(`+)([\s\S]*?)\1/g, (match) => ' '.repeat(match.length))
}

/**
 * 遍历 Markdown 源码，精确区分代码围栏、HTML 注释与正文行
 * @param {string} content
 * @param {(context: { line: number, raw: string, masked: string, inFence: boolean, inComment: boolean }) => void} callback
 */
export function traverseMarkdownLines(content, callback) {
  const lines = content.split('\n')
  let activeFence = null
  let inHtmlComment = false

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]
    const trimmed = raw.trim()

    // 1. 处理 HTML 注释区间
    if (!activeFence) {
      if (inHtmlComment) {
        if (trimmed.includes('-->')) {
          inHtmlComment = false
        }
        callback({ line: i + 1, raw, masked: ' '.repeat(raw.length), inFence: false, inComment: true })
        continue
      }

      if (trimmed.startsWith('<!--')) {
        // 若在同一行内闭合（即便后面跟有文本），仅标记当前行为注释，不开启跨行注释状态
        if (!trimmed.includes('-->')) {
          inHtmlComment = true
        }
        callback({ line: i + 1, raw, masked: ' '.repeat(raw.length), inFence: false, inComment: true })
        continue
      }
    }

    // 2. 匹配代码围栏
    // 闭合围栏判定：CommonMark 规定闭合标记后除空白外严禁包含任何 info string
    if (activeFence) {
      const closeMatch = trimmed.match(/^(`{3,}|~{3,})\s*$/)
      if (closeMatch && closeMatch[1][0] === activeFence.markerChar && closeMatch[1].length >= activeFence.markerLen) {
        activeFence = null
        callback({ line: i + 1, raw, masked: ' '.repeat(raw.length), inFence: true, inComment: false })
        continue
      }
      callback({ line: i + 1, raw, masked: ' '.repeat(raw.length), inFence: true, inComment: false })
      continue
    }

    // 起始围栏判定：至少 3 个反引号或波浪线
    const openMatch = trimmed.match(/^(`{3,}|~{3,})/)
    if (openMatch) {
      const markerChar = openMatch[1][0]
      const markerLen = openMatch[1].length

      // 防御单行伪围栏：若整行在后续包含了同等闭合符号（如 ```code``` 且非另起一行闭合），不开启跨行围栏
      const remainder = trimmed.slice(markerLen)
      const sameLineClose = remainder.includes(openMatch[1])

      if (!sameLineClose) {
        // 真实多行围栏开启（反引号围栏的 info string 按照 CommonMark 规范严禁包含反引号）
        if (markerChar !== '`' || !remainder.includes('`')) {
          activeFence = { markerChar, markerLen }
          callback({ line: i + 1, raw, masked: ' '.repeat(raw.length), inFence: true, inComment: false })
          continue
        }
      }
    }

    // 3. 正文行执行行内代码掩码遮蔽
    const masked = maskInlineCodeSpans(raw)
    callback({ line: i + 1, raw, masked, inFence: false, inComment: false })
  }
}
