import ts from 'typescript';

export class BarrelManager {
    /**
     * 使用 TypeScript AST 辅助定位，通过行切片无损注入新的 export 语句。
     * 保留所有既有注释、空行与格式。
     */
    public injectExports(sourceText: string, newExports: string[]): string {
        if (newExports.length === 0) {
            return sourceText;
        }

        const sourceFile = ts.createSourceFile(
            'index.ts',
            sourceText,
            ts.ScriptTarget.Latest,
            true,
            ts.ScriptKind.TS,
        );

        // 收集已有的导出语句特征，避免重复
        const existingExports = new Set<string>();
        for (const statement of sourceFile.statements) {
            if (ts.isExportDeclaration(statement)) {
                existingExports.add(statement.getText(sourceFile).trim());
            }
        }

        const filteredExports = newExports.filter(exp => {
            const trimmed = exp.trim();
            return !sourceText.includes(trimmed) && !existingExports.has(trimmed);
        });

        if (filteredExports.length === 0) {
            return sourceText;
        }

        // 寻找最后一个导出语句的位置，或末尾插入
        let lastExportEndPos = -1;
        for (const statement of sourceFile.statements) {
            if (ts.isExportDeclaration(statement)) {
                lastExportEndPos = statement.end;
            }
        }

        const formattedNewExports = filteredExports.join('\n');

        if (lastExportEndPos === -1) {
            const trimmed = sourceText.trimEnd();
            return trimmed.length === 0
                ? `${formattedNewExports}\n`
                : `${trimmed}\n\n${formattedNewExports}\n`;
        }

        const before = sourceText.slice(0, lastExportEndPos);
        const after = sourceText.slice(lastExportEndPos);

        return `${before}\n\n${formattedNewExports}${after}`;
    }
}
