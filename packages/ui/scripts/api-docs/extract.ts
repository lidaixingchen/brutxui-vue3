import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import { createChecker, type Declaration, type PropertyMeta } from 'vue-component-meta'
type ApiComponent = import('../../../../apps/docs/.vitepress/api-types.js').ApiComponent
type ApiDefault = import('../../../../apps/docs/.vitepress/api-types.js').ApiDefault
type ApiKind = import('../../../../apps/docs/.vitepress/api-types.js').ApiKind
type ApiMember = import('../../../../apps/docs/.vitepress/api-types.js').ApiMember
type ApiSource = import('../../../../apps/docs/.vitepress/api-types.js').ApiSource
// eslint-disable-next-line no-restricted-imports
import { apiMemberId } from '../../../../apps/docs/.vitepress/api-types.js'
import type { CatalogMember } from './catalog.js'
import { evaluateFactoryExpression, evaluateStaticExpression, isFactoryExpression, serializeStaticValue } from './default-static-evaluator.js'
import { createApiType, isReadonlyApiType, isVueRefType, typeIncludesNull, typeToDisplayText } from './type-shape.js'

const IGNORED_PROP_NAMES = new Set(['key', 'ref', 'ref_for', 'ref_key', 'style'])
export interface DefaultExpression {
    initializer: ts.Expression
}

function absolutePath(root: string, file: string): string {
    return path.resolve(root, file)
}

function relativePath(root: string, file: string): string {
    return path.relative(root, file).split(path.sep).join('/')
}

function propertyName(name: ts.PropertyName | ts.BindingName): string | undefined {
    if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) return name.text
    return undefined
}

function objectPropertyName(property: ts.ObjectLiteralElementLike): string | undefined {
    if (ts.isPropertyAssignment(property) || ts.isShorthandPropertyAssignment(property)
        || ts.isMethodDeclaration(property) || ts.isGetAccessorDeclaration(property) || ts.isSetAccessorDeclaration(property)) {
        return propertyName(property.name)
    }
    return undefined
}

export function collectDefaultExpressions(sourceFile: ts.SourceFile): Map<string, DefaultExpression> {
    const result = new Map<string, DefaultExpression>()
    const addDirectDefaults = (object: ts.ObjectLiteralExpression | undefined): void => {
        if (!object) return
        for (const property of object.properties) {
            if (ts.isPropertyAssignment(property)) {
                const name = propertyName(property.name)
                if (name) result.set(name, { initializer: property.initializer })
            } else if (ts.isShorthandPropertyAssignment(property)) {
                result.set(property.name.text, { initializer: property.objectAssignmentInitializer ?? property.name })
            }
        }
    }
    const addRuntimePropDefaults = (object: ts.ObjectLiteralExpression | undefined): void => {
        if (!object) return
        for (const property of object.properties) {
            if (!ts.isPropertyAssignment(property) || !ts.isObjectLiteralExpression(property.initializer)) continue
            const name = propertyName(property.name)
            if (!name) continue
            const defaultOption = property.initializer.properties.find(option => objectPropertyName(option) === 'default')
            if (defaultOption && ts.isPropertyAssignment(defaultOption)) {
                result.set(name, { initializer: defaultOption.initializer })
            } else if (defaultOption && ts.isShorthandPropertyAssignment(defaultOption)) {
                result.set(name, { initializer: defaultOption.name })
            }
        }
    }

    const visit = (node: ts.Node): void => {
        if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
            if (node.expression.text === 'withDefaults') addDirectDefaults(node.arguments[1] && ts.isObjectLiteralExpression(node.arguments[1]) ? node.arguments[1] : undefined)
            if (node.expression.text === 'defineProps' && node.arguments[0] && ts.isObjectLiteralExpression(node.arguments[0])) {
                addRuntimePropDefaults(node.arguments[0])
            }
            if (node.expression.text === 'defineModel') {
                const firstArgument = node.arguments[0]
                const modelName = firstArgument && ts.isStringLiteralLike(firstArgument) ? firstArgument.text : 'modelValue'
                const options = firstArgument && ts.isObjectLiteralExpression(firstArgument)
                    ? firstArgument
                    : node.arguments.find((argument, index): argument is ts.ObjectLiteralExpression => index > 0 && ts.isObjectLiteralExpression(argument))
                if (options) {
                    const defaultProperty = options.properties.find(property => objectPropertyName(property) === 'default')
                    if (defaultProperty && ts.isPropertyAssignment(defaultProperty)) result.set(modelName, { initializer: defaultProperty.initializer })
                    else if (defaultProperty && ts.isShorthandPropertyAssignment(defaultProperty)) result.set(modelName, { initializer: defaultProperty.name })
                }
            }
        }

        if (ts.isVariableDeclaration(node) && ts.isObjectBindingPattern(node.name) && node.initializer
            && ts.isCallExpression(node.initializer) && ts.isIdentifier(node.initializer.expression)
            && node.initializer.expression.text === 'defineProps') {
            for (const element of node.name.elements) {
                const name = propertyName(element.propertyName ?? element.name)
                if (name && element.initializer) result.set(name, { initializer: element.initializer })
            }
        }
        ts.forEachChild(node, visit)
    }

    visit(sourceFile)
    return result
}

function sourceFromDeclarations(root: string, componentSource: string, declarations: Declaration[]): ApiSource {
    const candidate = declarations.find(declaration => {
        const file = path.resolve(declaration.file)
        const relative = relativePath(root, file)
        return !relative.startsWith('../') && !relative.includes('/node_modules/')
    })
    if (!candidate) return { file: componentSource }

    const file = path.resolve(candidate.file)
    const source = relativePath(root, file)
    try {
        const start = candidate.range[0]
        const contents = fs.readFileSync(file, 'utf8')
        if (start >= 0 && start <= contents.length) {
            const line = contents.slice(0, start).split(/\r?\n/u).length
            return { file: source, line }
        }
    } catch {
        return { file: source }
    }
    return { file: source }
}

function isDirectStaticValue(initializer: ts.Expression): boolean {
    let node = initializer
    while (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isTypeAssertionExpression(node) || ts.isSatisfiesExpression(node)) {
        node = node.expression
    }
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isNumericLiteral(node)
        || node.kind === ts.SyntaxKind.TrueKeyword || node.kind === ts.SyntaxKind.FalseKeyword
        || node.kind === ts.SyntaxKind.NullKeyword || (ts.isIdentifier(node) && node.text === 'undefined')) return true
    if (ts.isPrefixUnaryExpression(node)) return isDirectStaticValue(node.operand)
    if (ts.isArrayLiteralExpression(node)) {
        return node.elements.every(element => !ts.isSpreadElement(element) && !ts.isOmittedExpression(element) && isDirectStaticValue(element))
    }
    if (ts.isObjectLiteralExpression(node)) {
        return node.properties.every(property => ts.isPropertyAssignment(property)
            && isDirectStaticValue(property.initializer))
    }
    return false
}

function apiDefault(
    componentSource: string,
    expression: DefaultExpression | undefined,
    metaDefault: string | undefined,
    checker: ts.TypeChecker,
): ApiDefault {
    if (!expression && metaDefault === undefined) return { declaration: { kind: 'absent' } }
    let initializer = expression?.initializer
    if (!initializer && metaDefault !== undefined) {
        const fallbackSource = ts.createSourceFile('api-default-fallback.ts', `const __api_default__ = ${metaDefault};`, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
        const fallbackDeclaration = fallbackSource.statements.find(ts.isVariableStatement)?.declarationList.declarations[0]
        initializer = fallbackDeclaration?.initializer
    }
    if (!initializer) {
        const text = metaDefault ?? ''
        return {
            declaration: { kind: 'expression', text, source: { file: componentSource } },
            resolution: { kind: 'expression', text },
        }
    }

    const nodeSourceFile = initializer.getSourceFile()
    const text = initializer.getText(nodeSourceFile).trim()
    const source = { file: componentSource }
    const factory = isFactoryExpression(initializer)
    const evaluation = factory
        ? evaluateFactoryExpression(initializer, checker)
        : evaluateStaticExpression(initializer, checker)
    const declarationKind = factory ? 'factory' : isDirectStaticValue(initializer) ? 'value' : 'expression'
    return {
        declaration: { kind: declarationKind, text, source },
        resolution: evaluation.kind === 'resolved'
            ? { kind: 'resolved', text: serializeStaticValue(evaluation.value) }
            : { kind: 'expression', text },
    }
}

function createMember(
    componentId: string,
    componentSource: string,
    root: string,
    checker: ts.TypeChecker,
    kind: ApiKind,
    name: string,
    rawType: string,
    type: ts.Type | undefined,
    description: string,
    source: ApiSource,
    fields: Pick<ApiMember, 'required' | 'nullable' | 'readonly' | 'default'> = {},
    referenceScope?: ts.Node,
): ApiMember {
    return {
        id: apiMemberId(componentId, kind, name),
        name,
        kind,
        type: createApiType(rawType, type, checker, root, referenceScope),
        description,
        notes: [],
        source,
        origin: 'declared',
        ...fields,
    }
}

function ignoredProp(root: string, property: PropertyMeta): boolean {
    if (property.name.startsWith('onVue:')) return true
    if (!property.global) return false
    const hasLocalDeclaration = property.getDeclarations().some(declaration => {
        const relative = relativePath(root, path.resolve(declaration.file))
        return relative.startsWith('packages/ui/src/') || relative.startsWith('packages/shared/src/')
    })
    return !hasLocalDeclaration || IGNORED_PROP_NAMES.has(property.name)
}

function extractExposedFromProgram(
    componentId: string,
    componentSource: string,
    root: string,
    sourceFile: ts.SourceFile,
    checker: ts.TypeChecker,
): ApiMember[] {
    const members: ApiMember[] = []
    const visit = (node: ts.Node): void => {
        if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'defineExpose') {
            const argument = node.arguments[0]
            if (!argument) throw new Error(`API_EXPOSE_EXTRACTION_FAILED ${componentSource}: defineExpose 缺少对象参数`)
            const exposedType = checker.getTypeAtLocation(argument)
            const properties = checker.getPropertiesOfType(exposedType)
            if (properties.length === 0) {
                const declaration = checker.getSymbolAtLocation(argument)?.valueDeclaration
                const initializer = declaration && ts.isVariableDeclaration(declaration) ? declaration.initializer : undefined
                if (ts.isObjectLiteralExpression(initializer) && initializer.properties.length === 0) return
                if (ts.isObjectLiteralExpression(argument) && argument.properties.length === 0) return
                throw new Error(`API_EXPOSE_EXTRACTION_FAILED ${componentSource}: 无法解析 defineExpose 成员`)
            }

            const addProperty = (symbol: ts.Symbol, name: string, type: ts.Type, rawType: string): void => {
                const description = ts.displayPartsToString(symbol.getDocumentationComment(checker))
                members.push(createMember(
                    componentId,
                    componentSource,
                    root,
                    checker,
                    'exposes',
                    name,
                    rawType,
                    type,
                    description,
                    { file: componentSource },
                    { nullable: typeIncludesNull(type, checker), readonly: isReadonlyApiType(type, symbol, checker) },
                    sourceFile,
                ))
            }

            for (const property of properties) {
                const propertyType = checker.getTypeOfSymbolAtLocation(property, argument)
                const name = property.getName()
                addProperty(property, name, propertyType, typeToDisplayText(propertyType, checker))

                if (propertyType.getCallSignatures().length > 0 || propertyType.getConstructSignatures().length > 0) continue
                if (isVueRefType(propertyType, checker)) continue
                if (propertyType.flags & (ts.TypeFlags.StringLike | ts.TypeFlags.NumberLike | ts.TypeFlags.BooleanLike | ts.TypeFlags.Null | ts.TypeFlags.Undefined)) continue
                const children = checker.getPropertiesOfType(propertyType)
                if (children.length === 0) continue
                for (const child of children) {
                    if (child.getName().startsWith('__@')) continue
                    const childType = checker.getTypeOfSymbolAtLocation(child, argument)
                    const childName = `${name}.${child.getName()}`
                    addProperty(child, childName, childType, typeToDisplayText(childType, checker))
                }
            }
        }
        ts.forEachChild(node, visit)
    }
    visit(sourceFile)
    return members
}

function fromPropertyMeta(root: string, componentSource: string, componentId: string, checker: ts.TypeChecker, defaults: Map<string, DefaultExpression>, sourceFile: ts.SourceFile, property: PropertyMeta): ApiMember {
    const type = property.getTypeObject()
    return createMember(
        componentId,
        componentSource,
        root,
        checker,
        'props',
        property.name,
        property.type,
        type,
        property.description,
        sourceFromDeclarations(root, componentSource, property.getDeclarations()),
        {
            required: property.required,
            nullable: typeIncludesNull(type, checker),
            default: apiDefault(componentSource, defaults.get(property.name), property.default, checker),
        },
        sourceFile,
    )
}

export function createApiExtractor(root: string): { extract(member: CatalogMember): ApiComponent; dispose(): void } {
    const absoluteRoot = path.resolve(root)
    const tsconfigPath = absolutePath(absoluteRoot, 'packages/ui/tsconfig.json')
    const componentChecker = createChecker(tsconfigPath, { schema: true })
    let disposed = false

    return {
        extract(member) {
            if (disposed) throw new Error('API_EXTRACTOR_DISPOSED: 提取器已释放')
            const componentPath = absolutePath(absoluteRoot, member.source)
            const meta = componentChecker.getComponentMeta(componentPath, member.sourceName)
            const program = componentChecker.getProgram()
            const sourceFile = program?.getSourceFile(componentPath)
            if (!program || !sourceFile) throw new Error(`API_SOURCE_NOT_IN_PROJECT ${member.source}`)
            const checker = program.getTypeChecker()
            const defaults = collectDefaultExpressions(sourceFile)
            const members: ApiMember[] = []

            for (const property of meta.props) {
                if (ignoredProp(absoluteRoot, property)) continue
                members.push(fromPropertyMeta(absoluteRoot, member.source, member.id, checker, defaults, sourceFile, property))
            }
            for (const event of meta.events) {
                if (event.name.startsWith('vue:') || event.name.startsWith('hook:')) continue
                const type = event.getTypeObject()
                members.push(createMember(
                    member.id,
                    member.source,
                    absoluteRoot,
                    checker,
                    'events',
                    event.name,
                    event.type,
                    type,
                    event.description,
                    sourceFromDeclarations(absoluteRoot, member.source, event.getDeclarations()),
                    { nullable: typeIncludesNull(type, checker) },
                    sourceFile,
                ))
            }
            for (const slot of meta.slots) {
                const type = slot.getTypeObject()
                members.push(createMember(
                    member.id,
                    member.source,
                    absoluteRoot,
                    checker,
                    'slots',
                    slot.name,
                    slot.type,
                    type,
                    slot.description,
                    sourceFromDeclarations(absoluteRoot, member.source, slot.getDeclarations()),
                    { nullable: typeIncludesNull(type, checker) },
                    sourceFile,
                ))
            }

            const exposeByName = new Map<string, ApiMember>()
            for (const exposure of meta.exposed) {
                const type = exposure.getTypeObject()
                const item = createMember(
                    member.id,
                    member.source,
                    absoluteRoot,
                    checker,
                    'exposes',
                    exposure.name,
                    exposure.type,
                    type,
                    exposure.description,
                    sourceFromDeclarations(absoluteRoot, member.source, exposure.getDeclarations()),
                    { nullable: typeIncludesNull(type, checker), readonly: type ? isReadonlyApiType(type, type.getSymbol(), checker) : undefined },
                    sourceFile,
                )
                exposeByName.set(item.name, item)
            }
            for (const exposure of extractExposedFromProgram(member.id, member.source, absoluteRoot, sourceFile, checker)) {
                if (!exposeByName.has(exposure.name)) exposeByName.set(exposure.name, exposure)
            }
            members.push(...exposeByName.values())

            return {
                id: member.id,
                name: member.name,
                source: { file: member.source },
                members,
            }
        },
        dispose() {
            if (disposed) return
            disposed = true
            componentChecker.clearCache()
        },
    }
}
