# 安全

- CLI：`resolveAliasPath` 内置 `isSafePath` 验证，所有路径解析自动受保护；`resolveComponentFilePath` 也有独立验证；磁盘根目录边界已处理
- CLI：`readConfig` 包含运行时类型验证，防止恶意 `components.json` 注入
- CSS：`styles.css` 中无重复令牌
- 禁止硬编码密钥
