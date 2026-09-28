import ts from 'typescript'

export type StaticValue = string | number | boolean | null | undefined | StaticValue[] | { [key: string]: StaticValue }

export type StaticEvaluation = { kind: 'resolved'; value: StaticValue } | { kind: 'expression' }

const MAX_STATIC_EVALUATION_DEPTH = 20

function unwrapExpression(node: ts.Expression): ts.Expression {
    let current = node
    while (ts.isParenthesizedExpression(current) || ts.isAsExpression(current) || ts.isTypeAssertionExpression(current) || ts.isSatisfiesExpression(current)) {
        current = current.expression
    }
    return current
}

function resolveSymbol(symbol: ts.Symbol, checker: ts.TypeChecker): ts.Symbol {
    return symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol
}

function evaluateSymbol(
    symbol: ts.Symbol,
    checker: ts.TypeChecker,
    visited: Set<ts.Symbol>,
    depth: number,
): StaticEvaluation {
    const resolvedSymbol = resolveSymbol(symbol, checker)
    if (visited.has(resolvedSymbol)) return { kind: 'expression' }

    const declaration = resolvedSymbol.valueDeclaration ?? resolvedSymbol.declarations?.[0]
    if (!declaration) return { kind: 'expression' }

    let initializer: ts.Expression | undefined
    if (ts.isVariableDeclaration(declaration)) {
        const declarationList = declaration.parent
        if (!ts.isVariableDeclarationList(declarationList) || !(declarationList.flags & ts.NodeFlags.Const)) {
            return { kind: 'expression' }
        }
        initializer = declaration.initializer
    } else if (ts.isPropertyAssignment(declaration)) {
        initializer = declaration.initializer
    } else if (ts.isEnumMember(declaration)) {
        initializer = declaration.initializer
    }

    if (!initializer) return { kind: 'expression' }
    visited.add(resolvedSymbol)
    const result = evaluateExpression(initializer, checker, visited, depth + 1)
    visited.delete(resolvedSymbol)
    return result
}

function evaluateExpression(
    expression: ts.Expression,
    checker: ts.TypeChecker,
    visited: Set<ts.Symbol>,
    depth: number,
): StaticEvaluation {
    if (depth > MAX_STATIC_EVALUATION_DEPTH) return { kind: 'expression' }
    const node = unwrapExpression(expression)

    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return { kind: 'resolved', value: node.text }
    if (ts.isNumericLiteral(node)) {
        const value = Number(node.text.replaceAll('_', ''))
        return Number.isFinite(value) ? { kind: 'resolved', value } : { kind: 'expression' }
    }
    if (node.kind === ts.SyntaxKind.TrueKeyword) return { kind: 'resolved', value: true }
    if (node.kind === ts.SyntaxKind.FalseKeyword) return { kind: 'resolved', value: false }
    if (node.kind === ts.SyntaxKind.NullKeyword) return { kind: 'resolved', value: null }
    if (ts.isIdentifier(node)) {
        if (node.text === 'undefined') return { kind: 'resolved', value: undefined }
        const symbol = checker.getSymbolAtLocation(node)
        return symbol ? evaluateSymbol(symbol, checker, visited, depth + 1) : { kind: 'expression' }
    }
    if (ts.isPrefixUnaryExpression(node) && (node.operator === ts.SyntaxKind.MinusToken || node.operator === ts.SyntaxKind.PlusToken)) {
        const operand = evaluateExpression(node.operand, checker, visited, depth + 1)
        if (operand.kind !== 'resolved' || typeof operand.value !== 'number') return { kind: 'expression' }
        return { kind: 'resolved', value: node.operator === ts.SyntaxKind.MinusToken ? -operand.value : operand.value }
    }
    if (ts.isArrayLiteralExpression(node)) {
        const values: StaticValue[] = []
        for (const element of node.elements) {
            if (ts.isOmittedExpression(element)) return { kind: 'expression' }
            if (ts.isSpreadElement(element)) {
                const spread = evaluateExpression(element.expression, checker, visited, depth + 1)
                if (spread.kind !== 'resolved' || !Array.isArray(spread.value)) return { kind: 'expression' }
                values.push(...spread.value)
                continue
            }
            const value = evaluateExpression(element, checker, visited, depth + 1)
            if (value.kind !== 'resolved') return { kind: 'expression' }
            values.push(value.value)
        }
        return { kind: 'resolved', value: values }
    }
    if (ts.isObjectLiteralExpression(node)) {
        const values: Record<string, StaticValue> = {}
        for (const property of node.properties) {
            if (ts.isSpreadAssignment(property)) {
                const spread = evaluateExpression(property.expression, checker, visited, depth + 1)
                if (spread.kind !== 'resolved' || spread.value === null || typeof spread.value !== 'object' || Array.isArray(spread.value)) {
                    return { kind: 'expression' }
                }
                Object.assign(values, spread.value)
                continue
            }
            if (ts.isPropertyAssignment(property)) {
                const key = propertyName(property.name)
                const value = evaluateExpression(property.initializer, checker, visited, depth + 1)
                if (key === undefined || value.kind !== 'resolved') return { kind: 'expression' }
                values[key] = value.value
                continue
            }
            if (ts.isShorthandPropertyAssignment(property)) {
                const value = evaluateExpression(property.name, checker, visited, depth + 1)
                if (value.kind !== 'resolved') return { kind: 'expression' }
                values[property.name.text] = value.value
                continue
            }
            return { kind: 'expression' }
        }
        return { kind: 'resolved', value: values }
    }
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
        const left = evaluateExpression(node.left, checker, visited, depth + 1)
        const right = evaluateExpression(node.right, checker, visited, depth + 1)
        if (left.kind !== 'resolved' || right.kind !== 'resolved') return { kind: 'expression' }
        if (typeof left.value === 'string' || typeof right.value === 'string') {
            if ((typeof left.value === 'string' || typeof left.value === 'number') && (typeof right.value === 'string' || typeof right.value === 'number')) {
                return { kind: 'resolved', value: String(left.value) + String(right.value) }
            }
        }
        if (typeof left.value === 'number' && typeof right.value === 'number') return { kind: 'resolved', value: left.value + right.value }
    }
    if (ts.isConditionalExpression(node)) {
        const condition = evaluateExpression(node.condition, checker, visited, depth + 1)
        if (condition.kind !== 'resolved' || typeof condition.value !== 'boolean') return { kind: 'expression' }
        return evaluateExpression(condition.value ? node.whenTrue : node.whenFalse, checker, visited, depth + 1)
    }
    if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) {
        const symbol = checker.getSymbolAtLocation(ts.isPropertyAccessExpression(node) ? node.name : node.argumentExpression ?? node)
        if (symbol) return evaluateSymbol(symbol, checker, visited, depth + 1)
    }
    if (ts.isTemplateExpression(node)) {
        let text = node.head.text
        for (const span of node.templateSpans) {
            const value = evaluateExpression(span.expression, checker, visited, depth + 1)
            if (value.kind !== 'resolved' || (typeof value.value !== 'string' && typeof value.value !== 'number' && typeof value.value !== 'boolean')) {
                return { kind: 'expression' }
            }
            text += String(value.value) + span.literal.text
        }
        return { kind: 'resolved', value: text }
    }
    return { kind: 'expression' }
}

function propertyName(name: ts.PropertyName): string | undefined {
    if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) return name.text
    return undefined
}

export function evaluateStaticExpression(expression: ts.Expression, checker: ts.TypeChecker): StaticEvaluation {
    return evaluateExpression(expression, checker, new Set(), 0)
}

export function isFactoryExpression(expression: ts.Expression): boolean {
    const node = unwrapExpression(expression)
    if (ts.isArrowFunction(node)) return !node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword)
    if (ts.isFunctionExpression(node)) return !node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword)
    return false
}

export function evaluateFactoryExpression(expression: ts.Expression, checker: ts.TypeChecker): StaticEvaluation {
    const node = unwrapExpression(expression)
    if (ts.isArrowFunction(node)) {
        return ts.isBlock(node.body)
            ? evaluateFactoryBody(node.body, checker)
            : evaluateStaticExpression(node.body, checker)
    }
    if (ts.isFunctionExpression(node)) return node.body ? evaluateFactoryBody(node.body, checker) : { kind: 'expression' }
    return { kind: 'expression' }
}

function evaluateFactoryBody(body: ts.Block, checker: ts.TypeChecker): StaticEvaluation {
    if (body.statements.length !== 1 || !ts.isReturnStatement(body.statements[0]) || !body.statements[0].expression) {
        return { kind: 'expression' }
    }
    return evaluateStaticExpression(body.statements[0].expression, checker)
}

export function serializeStaticValue(value: StaticValue): string {
    if (value === undefined) return 'undefined'
    if (value === null) return 'null'
    if (typeof value === 'string') return JSON.stringify(value)
    if (typeof value === 'number' || typeof value === 'boolean') return String(value)
    if (Array.isArray(value)) return `[${value.map(serializeStaticValue).join(', ')}]`
    return `{ ${Object.keys(value).sort().map(key => `${JSON.stringify(key)}: ${serializeStaticValue(value[key])}`).join(', ')} }`
}
