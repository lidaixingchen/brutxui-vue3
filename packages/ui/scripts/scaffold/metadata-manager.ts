import ts from 'typescript';

export interface NewComponentMetaInput {
    kebabName: string;
    titleZh: string;
    category?: string;
    dependencies?: string[];
    description?: string;
}

function escapeTsString(str: string): string {
    return str
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/\r/g, '')
        .replace(/\n/g, '\\n');
}

export class MetadataManager {
    /**
     * 将新组件元数据以 ASCII 字母序无损插入到 components.ts 的 COMPONENTS 对象字面量中。
     * 使用 TypeScript AST 定位插入锚点，通过行切片（Line-slice）保留所有既有注释、空行与格式。
     */
    public injectComponentMeta(sourceText: string, input: NewComponentMetaInput): string {
        const {
            kebabName,
            titleZh,
            category = 'utility',
            dependencies = ['reka-ui', '@lucide/vue'],
            description = `${kebabName} component description.`,
        } = input;

        const sourceFile = ts.createSourceFile(
            'components.ts',
            sourceText,
            ts.ScriptTarget.Latest,
            true,
            ts.ScriptKind.TS,
        );

        let componentsObjectLiteral: ts.ObjectLiteralExpression | undefined;

        // 定位 COMPONENTS 变量声明
        for (const statement of sourceFile.statements) {
            if (ts.isVariableStatement(statement)) {
                for (const decl of statement.declarationList.declarations) {
                    if (
                        ts.isIdentifier(decl.name) &&
                        decl.name.text === 'COMPONENTS' &&
                        decl.initializer &&
                        ts.isObjectLiteralExpression(decl.initializer)
                    ) {
                        componentsObjectLiteral = decl.initializer;
                        break;
                    }
                }
            }
        }

        if (!componentsObjectLiteral) {
            return sourceText;
        }

        const properties = componentsObjectLiteral.properties;
        let insertAnchorPos = -1;

        for (let i = 0; i < properties.length; i++) {
            const prop = properties[i];
            if (!ts.isPropertyAssignment(prop)) continue;

            let keyName = '';
            if (ts.isIdentifier(prop.name)) {
                keyName = prop.name.text;
            } else if (ts.isStringLiteral(prop.name)) {
                keyName = prop.name.text;
            }

            // 幂等防护：如果已存在同名 key，则直接返回
            if (keyName === kebabName) {
                return sourceText;
            }

            if (keyName > kebabName && insertAnchorPos === -1) {
                insertAnchorPos = prop.getFullStart();
                break;
            }
        }

        // 生成新条目的代码字符串（带转义安全保护）
        const escapedKey = escapeTsString(kebabName);
        const formattedKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(escapedKey)
            ? escapedKey
            : `'${escapedKey}'`;

        const depsFormatted = dependencies
            .map(d => `'${escapeTsString(d)}'`)
            .join(', ');

        const formattedEntry = [
            `    ${formattedKey}: {`,
            `        titleZh: '${escapeTsString(titleZh)}',`,
            `        category: '${escapeTsString(category)}',`,
            `        dependencies: [${depsFormatted}],`,
            `        description: '${escapeTsString(description)}',`,
            `    },`,
        ].join('\n');

        // 1. 若找到字母序大于新 key 的节点，在其起始位置（包含前导换行/缩进）前插入
        if (insertAnchorPos !== -1) {
            const before = sourceText.slice(0, insertAnchorPos);
            const after = sourceText.slice(insertAnchorPos);
            return `${before}\n${formattedEntry}${after}`;
        }

        // 2. 若新 key 字母序排在最后（或列表已有属性但未命中更大 key）：
        // 定位对象字面量的右闭合大括号，在其前导换行处插入，避免 lastProp.getEnd() 导致双逗号
        const closeBracePos = componentsObjectLiteral.getEnd() - 1;
        const lastNewlineBeforeClose = sourceText.lastIndexOf('\n', closeBracePos);

        if (lastNewlineBeforeClose !== -1 && lastNewlineBeforeClose >= componentsObjectLiteral.getStart()) {
            const before = sourceText.slice(0, lastNewlineBeforeClose);
            const after = sourceText.slice(lastNewlineBeforeClose);
            return `${before}\n${formattedEntry}${after}`;
        }

        // 3. 回退处理
        const before = sourceText.slice(0, closeBracePos);
        const after = sourceText.slice(closeBracePos);
        return `${before}\n${formattedEntry}\n${after}`;
    }
}
