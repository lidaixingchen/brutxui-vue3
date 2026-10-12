import ts from 'typescript'

export function projectPublicIndexExports(source: string): string[] {
    const sourceFile = ts.createSourceFile('component-index.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
    const exports: string[] = []

    function appendBindingNames(name: ts.BindingName, kind: string): void {
        if (ts.isIdentifier(name)) {
            exports.push(`${kind}:${name.text}`)
            return
        }

        for (const element of name.elements) {
            if (ts.isBindingElement(element)) {
                appendBindingNames(element.name, kind)
            }
        }
    }

    for (const statement of sourceFile.statements) {
        if (ts.isExportDeclaration(statement)) {
            if (!statement.exportClause) {
                if (statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier)) {
                    const kind = statement.isTypeOnly ? 'type' : 'value'
                    exports.push(`${kind}:*:${statement.moduleSpecifier.text}`)
                }
                continue
            }

            if (ts.isNamedExports(statement.exportClause)) {
                for (const element of statement.exportClause.elements) {
                    const kind = statement.isTypeOnly || element.isTypeOnly ? 'type' : 'value'
                    exports.push(`${kind}:${element.name.text}`)
                }
            } else {
                exports.push(`namespace:${statement.exportClause.name.text}`)
            }
            continue
        }

        if (ts.isExportAssignment(statement)) {
            exports.push(`${statement.isExportEquals ? 'commonjs' : 'value'}:default`)
            continue
        }

        const modifiers = ts.canHaveModifiers(statement) ? ts.getModifiers(statement) ?? [] : []
        if (!modifiers.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
            continue
        }

        const isDefault = modifiers.some(modifier => modifier.kind === ts.SyntaxKind.DefaultKeyword)
        if (isDefault) {
            const kind = ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement) ? 'type' : 'value'
            exports.push(`${kind}:default`)
            continue
        }

        if (ts.isVariableStatement(statement)) {
            for (const declaration of statement.declarationList.declarations) {
                appendBindingNames(declaration.name, 'value')
            }
        } else if (ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement)) {
            exports.push(`type:${statement.name.text}`)
        } else if (ts.isClassDeclaration(statement)) {
            exports.push(`type:${statement.name?.text ?? 'default'}`)
            exports.push(`value:${statement.name?.text ?? 'default'}`)
        } else if (ts.isFunctionDeclaration(statement) || ts.isEnumDeclaration(statement) || ts.isModuleDeclaration(statement)) {
            if (statement.name) {
                exports.push(`value:${statement.name.text}`)
            }
        }
    }

    return exports.sort()
}
