import path from 'node:path'
import ts from 'typescript'
type ApiType = import('../../../../apps/docs/.vitepress/api-types.js').ApiType

const MAX_TYPE_WALK_DEPTH = 18
const MAX_TYPE_REFERENCES = 96
const MAX_REFERENCE_TEXT_LENGTH = 16_384
const TYPESCRIPT_LIBRARY_DIRECTORY = path.dirname(ts.getDefaultLibFilePath({}))
const BUILT_IN_TYPE_ALIASES = new Set([
    'Array', 'ReadonlyArray', 'Record', 'Partial', 'Required', 'Pick', 'Omit', 'Exclude', 'Extract',
    'NonNullable', 'Parameters', 'ConstructorParameters', 'ReturnType', 'InstanceType', 'ThisType',
    'Awaited', 'Uppercase', 'Lowercase', 'Capitalize', 'Uncapitalize',
])
const REACTIVE_REFERENCE_TYPES = new Set(['Ref', 'ShallowRef', 'ComputedRef', 'WritableComputedRef'])

function unalias(symbol: ts.Symbol, checker: ts.TypeChecker): ts.Symbol {
    return symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol
}

function isBuiltInTypeAlias(symbol: ts.Symbol): boolean {
    return BUILT_IN_TYPE_ALIASES.has(symbol.getName())
        && Boolean(symbol.declarations?.some(declaration => path.dirname(declaration.getSourceFile().fileName) === TYPESCRIPT_LIBRARY_DIRECTORY))
}

function typeSymbols(type: ts.Type, checker: ts.TypeChecker): ts.Symbol[] {
    const output: ts.Symbol[] = []
    const seenSymbols = new Set<ts.Symbol>()
    const seenTypes = new Set<ts.Type>()

    const visit = (current: ts.Type, depth: number): void => {
        if (depth > MAX_TYPE_WALK_DEPTH || seenTypes.has(current)) return
        seenTypes.add(current)

        const symbol = current.aliasSymbol ?? current.getSymbol()
        if (symbol) {
            const resolved = unalias(symbol, checker)
            if (!seenSymbols.has(resolved)) {
                seenSymbols.add(resolved)
                output.push(resolved)
            }
        }

        if (current.isUnionOrIntersection()) {
            current.types.forEach(member => visit(member, depth + 1))
            return
        }

        if (current.objectFlags & ts.ObjectFlags.Reference) {
            for (const argument of checker.getTypeArguments(current as ts.TypeReference)) visit(argument, depth + 1)
        }

        if (current.aliasSymbol) {
            const declaration = current.aliasSymbol.declarations?.find(ts.isTypeAliasDeclaration)
            if (declaration) visit(checker.getDeclaredTypeOfSymbol(current.aliasSymbol), depth + 1)
        }
    }

    visit(type, 0)
    return output
}

function declarationPath(symbol: ts.Symbol, root: string): string | undefined {
    const files = symbol.declarations
        ?.map(declaration => declaration.getSourceFile().fileName)
        .filter(file => {
            const relative = path.relative(path.resolve(root), path.resolve(file))
            return relative !== '..'
                && !relative.startsWith(`..${path.sep}`)
                && !path.isAbsolute(relative)
                && !relative.split(/[\\/]/u).includes('node_modules')
        })
        .sort()
    const file = files?.[0]
    return file ? path.relative(root, file).split(path.sep).join('/') : undefined
}

function referenceId(symbol: ts.Symbol, source: string): string {
    return `type-${encodeURIComponent(`${source}#${symbol.getName()}`)}`
}

function definitionText(symbol: ts.Symbol, root: string, source: string): string | undefined {
    const declarations = (symbol.declarations ?? [])
        .filter(declaration => ts.isTypeAliasDeclaration(declaration)
            || ts.isInterfaceDeclaration(declaration)
            || ts.isClassDeclaration(declaration)
            || ts.isEnumDeclaration(declaration))
        .filter(declaration => {
            const relative = path.relative(path.resolve(root), path.resolve(declaration.getSourceFile().fileName))
            return relative !== '..'
                && !relative.startsWith(`..${path.sep}`)
                && !path.isAbsolute(relative)
                && !relative.split(/[\\/]/u).includes('node_modules')
        })
        .sort((left, right) => {
            const leftFile = path.relative(root, left.getSourceFile().fileName)
            const rightFile = path.relative(root, right.getSourceFile().fileName)
            return `${leftFile}:${left.pos}`.localeCompare(`${rightFile}:${right.pos}`, 'en')
        })
    if (declarations.length === 0) return undefined
    const text = declarations.map(declaration => declaration.getText(declaration.getSourceFile()).trim()).join('\n\n')
    if (text.length > MAX_REFERENCE_TEXT_LENGTH) {
        throw new Error(`API_TYPE_REFERENCE_TOO_LARGE ${source}#${symbol.getName()}: ${text.length} 字符`)
    }
    return text
}

function addReference(references: Map<string, ApiType['references'][number]>, symbol: ts.Symbol, checker: ts.TypeChecker, root: string): void {
    const resolved = unalias(symbol, checker)
    if (resolved.flags & ts.SymbolFlags.TypeParameter) return
    if (isBuiltInTypeAlias(resolved)) return
    const source = declarationPath(resolved, root)
    if (!source || source.startsWith('../')) return
    const name = resolved.getName()
    const id = referenceId(resolved, source)
    const text = definitionText(resolved, root, source)
    if (!text) return
    references.set(id, { name, text, id })
    if (references.size > MAX_TYPE_REFERENCES) {
        throw new Error(`API_TYPE_REFERENCE_LIMIT ${source}: 超过 ${MAX_TYPE_REFERENCES} 个类型定义`)
    }
}

function collectReferences(typeText: string, type: ts.Type | undefined, checker: ts.TypeChecker, root: string, context?: ts.Node): ApiType['references'] {
    const references = new Map<string, ApiType['references'][number]>()
    if (type) {
        for (const symbol of typeSymbols(type, checker)) addReference(references, symbol, checker, root)
    }

    if (context) {
        const sourceFile = ts.createSourceFile('api-type-reference.ts', `type __ApiType = ${typeText};`, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
        const declaration = sourceFile.statements.find(ts.isTypeAliasDeclaration)
        if (declaration) {
            const scopeSymbols = checker.getSymbolsInScope(context, ts.SymbolFlags.Type | ts.SymbolFlags.Alias)
            const byName = new Map(scopeSymbols.map(symbol => [symbol.getName(), symbol]))
            const visit = (node: ts.Node): void => {
                if (ts.isTypeReferenceNode(node)) {
                    const name = node.typeName.getText(sourceFile)
                    const symbol = byName.get(name)
                    if (symbol) addReference(references, unalias(symbol, checker), checker, root)
                }
                ts.forEachChild(node, visit)
            }
            visit(declaration.type)
        }
    }
    return [...references.values()].sort((left, right) => left.id.localeCompare(right.id, 'en'))
}

function collectLiterals(type: ts.Type, checker: ts.TypeChecker): string[] {
    const values = new Set<string>()
    const seen = new Set<ts.Type>()

    const visit = (current: ts.Type, depth: number): void => {
        if (depth > MAX_TYPE_WALK_DEPTH || seen.has(current)) return
        seen.add(current)

        if (current.flags & ts.TypeFlags.StringLiteral) {
            values.add(JSON.stringify((current as ts.StringLiteralType).value))
            return
        }
        if (current.flags & ts.TypeFlags.NumberLiteral) {
            values.add(String((current as ts.NumberLiteralType).value))
            return
        }
        if (current.flags & ts.TypeFlags.BooleanLiteral) {
            values.add((current as ts.IntrinsicType).intrinsicName)
            return
        }
        if (current.flags & ts.TypeFlags.Null) {
            values.add('null')
            return
        }
        if (current.flags & ts.TypeFlags.Boolean) {
            values.add('false')
            values.add('true')
            return
        }
        if (current.isUnionOrIntersection()) {
            current.types.forEach(member => visit(member, depth + 1))
            return
        }
        if (current.flags & ts.TypeFlags.EnumLike) {
            for (const member of checker.getPropertiesOfType(current)) {
                const value = checker.getConstantValue(member as ts.EnumMember)
                if (typeof value === 'string') values.add(JSON.stringify(value))
                else if (typeof value === 'number') values.add(String(value))
            }
        }
        if (current.aliasSymbol) {
            const declaration = current.aliasSymbol.declarations?.find(ts.isTypeAliasDeclaration)
            if (declaration) visit(checker.getDeclaredTypeOfSymbol(current.aliasSymbol), depth + 1)
        }
        if (current.objectFlags & ts.ObjectFlags.Reference) {
            for (const argument of checker.getTypeArguments(current as ts.TypeReference)) visit(argument, depth + 1)
        }
    }

    visit(type, 0)
    return [...values].sort((left, right) => left.localeCompare(right, 'en'))
}

export function typeIncludesNull(type: ts.Type | undefined, checker: ts.TypeChecker): boolean {
    if (!type) return false
    const seen = new Set<ts.Type>()
    const visit = (current: ts.Type, depth: number): boolean => {
        if (depth > MAX_TYPE_WALK_DEPTH || seen.has(current)) return false
        seen.add(current)
        if (current.flags & ts.TypeFlags.Null) return true
        if (current.isUnionOrIntersection() && current.types.some(member => visit(member, depth + 1))) return true
        if (current.aliasSymbol) {
            const declaration = current.aliasSymbol.declarations?.find(ts.isTypeAliasDeclaration)
            if (declaration && visit(checker.getDeclaredTypeOfSymbol(current.aliasSymbol), depth + 1)) return true
        }
        return false
    }
    return visit(type, 0)
}

export function createApiType(text: string, type: ts.Type | undefined, checker: ts.TypeChecker, root: string, context?: ts.Node): ApiType {
    const displayText = type ? primitiveTypeDisplayText(text, type, checker, context) : undefined
    return {
        text,
        ...(displayText && displayText !== text ? { displayText } : {}),
        literals: type ? collectLiterals(type, checker) : [],
        references: collectReferences(text, type, checker, root, context),
    }
}

export function typeToDisplayText(type: ts.Type, checker: ts.TypeChecker): string {
    return checker.typeToString(type, undefined, ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope)
}

function isPrimitiveDisplayTypeNode(node: ts.TypeNode, context: ts.Node | undefined, checker: ts.TypeChecker): boolean {
    if (ts.isUnionTypeNode(node)) return node.types.every(member => isPrimitiveDisplayTypeNode(member, context, checker))
    if (ts.isParenthesizedTypeNode(node)) return isPrimitiveDisplayTypeNode(node.type, context, checker)

    if (ts.isLiteralTypeNode(node)) {
        return ts.isStringLiteral(node.literal)
            || ts.isNoSubstitutionTemplateLiteral(node.literal)
            || ts.isNumericLiteral(node.literal)
            || node.literal.kind === ts.SyntaxKind.NullKeyword
            || node.literal.kind === ts.SyntaxKind.TrueKeyword
            || node.literal.kind === ts.SyntaxKind.FalseKeyword
            || ts.isPrefixUnaryExpression(node.literal) && ts.isNumericLiteral(node.literal.operand)
    }

    switch (node.kind) {
        case ts.SyntaxKind.StringKeyword:
        case ts.SyntaxKind.NumberKeyword:
        case ts.SyntaxKind.BooleanKeyword:
        case ts.SyntaxKind.BigIntKeyword:
        case ts.SyntaxKind.SymbolKeyword:
        case ts.SyntaxKind.UndefinedKeyword:
        case ts.SyntaxKind.VoidKeyword:
        case ts.SyntaxKind.NeverKeyword:
            return true
    }

    if (!ts.isTypeReferenceNode(node) || !ts.isIdentifier(node.typeName)) return false
    if (node.typeName.text === 'undefined') return true
    if (node.typeName.text !== 'NonNullable' || !BUILT_IN_TYPE_ALIASES.has(node.typeName.text) || node.typeArguments?.length !== 1 || !context) return false

    const nonNullable = checker.getSymbolsInScope(context, ts.SymbolFlags.Type | ts.SymbolFlags.Alias)
        .find(symbol => symbol.getName() === node.typeName.text)
    return nonNullable !== undefined
        && isBuiltInTypeAlias(unalias(nonNullable, checker))
        && isPrimitiveDisplayTypeNode(node.typeArguments[0], context, checker)
}

function isPrimitiveDisplayType(type: ts.Type): boolean {
    return Boolean(type.flags & (
        ts.TypeFlags.StringLike
        | ts.TypeFlags.NumberLike
        | ts.TypeFlags.BooleanLike
        | ts.TypeFlags.BigIntLike
        | ts.TypeFlags.ESSymbolLike
        | ts.TypeFlags.Null
        | ts.TypeFlags.Undefined
        | ts.TypeFlags.Void
        | ts.TypeFlags.Never
    ))
}

function containsNonNullableTypeNode(node: ts.Node): boolean {
    if (ts.isTypeReferenceNode(node) && ts.isIdentifier(node.typeName) && node.typeName.text === 'NonNullable') return true
    return ts.forEachChild(node, containsNonNullableTypeNode) ?? false
}

function primitiveTypeDisplayText(text: string, type: ts.Type, checker: ts.TypeChecker, context?: ts.Node): string | undefined {
    const sourceFile = ts.createSourceFile('api-type-display.ts', `type __ApiType = ${text};`, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
    const declaration = sourceFile.statements.find(ts.isTypeAliasDeclaration)
    if (!declaration
        || sourceFile.parseDiagnostics.length > 0
        || !containsNonNullableTypeNode(declaration.type)
        || !isPrimitiveDisplayTypeNode(declaration.type, context, checker)) return undefined

    const semanticType = type.aliasSymbol?.getName() === 'NonNullable' && isBuiltInTypeAlias(type.aliasSymbol)
        ? checker.getNonNullableType(type)
        : type
    const members = semanticType.isUnion() ? semanticType.types : [semanticType]
    if (members.length === 0 || !members.every(isPrimitiveDisplayType)) return undefined

    const formatted = members.map(member => ({
        type: member,
        text: typeToDisplayText(member, checker),
    }))
    formatted.sort((left, right) => {
        const leftUndefined = Boolean(left.type.flags & ts.TypeFlags.Undefined)
        const rightUndefined = Boolean(right.type.flags & ts.TypeFlags.Undefined)
        if (leftUndefined !== rightUndefined) return leftUndefined ? 1 : -1
        return left.text.localeCompare(right.text, 'en')
    })
    return formatted.map(member => member.text).join(' | ')
}

function hasVueRefSymbol(type: ts.Type, checker: ts.TypeChecker): boolean {
    return checker.getPropertiesOfType(type).some(property => property.declarations?.some(declaration => {
        if (!ts.isPropertySignature(declaration) || !ts.isComputedPropertyName(declaration.name)) return false
        const symbolName = declaration.name.expression
        if (!ts.isIdentifier(symbolName) || symbolName.text !== 'RefSymbol') return false
        const pathParts = declaration.getSourceFile().fileName.split(/[\\/]/u)
        return pathParts.some((part, index) => part === '@vue' && pathParts[index + 1] === 'reactivity')
    }) ?? false)
}

export function isVueRefType(type: ts.Type, checker: ts.TypeChecker): boolean {
    if (type.isUnion()) {
        const nonNullableTypes = type.types.filter(member => !(member.flags & (ts.TypeFlags.Null | ts.TypeFlags.Undefined)))
        return nonNullableTypes.length > 0 && nonNullableTypes.every(member => isVueRefType(member, checker))
    }

    const name = type.aliasSymbol?.getName() ?? type.getSymbol()?.getName()
    if (name && REACTIVE_REFERENCE_TYPES.has(name)) return true
    if (type.flags & ts.TypeFlags.TypeParameter) {
        const constraint = checker.getBaseConstraintOfType(type)
        if (constraint) return isVueRefType(constraint, checker)
    }
    return hasVueRefSymbol(type, checker)
}

export function isReadonlyApiType(type: ts.Type, symbol: ts.Symbol | undefined, checker: ts.TypeChecker): boolean {
    if (symbol?.declarations?.some(declaration => ts.canHaveModifiers(declaration)
        && ts.getModifiers(declaration)?.some(modifier => modifier.kind === ts.SyntaxKind.ReadonlyKeyword))) return true

    const name = type.aliasSymbol?.getName() ?? type.getSymbol()?.getName()
    return name === 'Readonly'
        || name === 'ShallowReadonly'
        || name === 'ComputedRef'
        || checker.typeToString(type, undefined, ts.TypeFormatFlags.NoTruncation).startsWith('Readonly<')
}
