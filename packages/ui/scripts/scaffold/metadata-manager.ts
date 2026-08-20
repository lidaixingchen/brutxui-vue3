import ts from 'typescript';

export interface NewComponentMetaInput {
    kebabName: string;
    titleZh: string;
    category?: string;
    dependencies?: string[];
    description?: string;
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
        let insertIndex = -1;
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

            if (keyName > kebabName && insertIndex === -1) {
                insertIndex = i;
                insertAnchorPos = prop.getFullStart();
                break;
            }
        }

        // 生成新条目的代码字符串
        const formattedKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(kebabName)
            ? kebabName
            : `'${kebabName}'`;

        const depsFormatted = dependencies.map(d => `'${d}'`).join(', ');

        const formattedEntry = [
            `    ${formattedKey}: {`,
            `        titleZh: '${titleZh}',`,
            `        category: '${category}',`,
            `        dependencies: [${depsFormatted}],`,
            `        description: '${description}',`,
            `    },`,
        ].join('\n');

        // 如果找到了字母序大于新 key 的节点，在其起始位置（包含前导换行/缩进）前插入
        if (insertAnchorPos !== -1) {
            const before = sourceText.slice(0, insertAnchorPos);
            const after = sourceText.slice(insertAnchorPos);
            return `${before}\n${formattedEntry}${after}`;
        }

        // 如果没有找到（即新 key 字母序在最后），则在最后一个属性之后插入
        if (properties.length > 0) {
            const lastProp = properties[properties.length - 1];
            const endPos = lastProp.getEnd();
            const before = sourceText.slice(0, endPos);
            const after = sourceText.slice(endPos);
            return `${before}\n${formattedEntry}${after}`;
        }

        // 如果对象原本为空
        const openBracePos = componentsObjectLiteral.getStart(sourceFile) + 1;
        const before = sourceText.slice(0, openBracePos);
        const after = sourceText.slice(openBracePos);
        return `${before}\n${formattedEntry}\n${after}`;
    }
}
