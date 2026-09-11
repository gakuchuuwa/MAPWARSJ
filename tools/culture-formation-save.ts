import ts from 'typescript';

function findInitializer(text: string, name: string): ts.Expression {
    const source = ts.createSourceFile('CultureFormations.ts', text, ts.ScriptTarget.Latest, true);
    for (const statement of source.statements) {
        if (!ts.isVariableStatement(statement)) continue;
        for (const declaration of statement.declarationList.declarations) {
            if (ts.isIdentifier(declaration.name) && declaration.name.text === name && declaration.initializer) {
                return declaration.initializer;
            }
        }
    }
    throw new Error(`找不到军团数据：${name}`);
}

function property(text: string, table: string, culture: string): ts.PropertyAssignment {
    const object = findInitializer(text, table);
    if (!ts.isObjectLiteralExpression(object)) throw new Error(`${table} 不是数据表`);
    const entry = object.properties.find(p => ts.isPropertyAssignment(p)
        && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)) && p.name.text === culture);
    if (!entry || !ts.isPropertyAssignment(entry)) throw new Error(`找不到文化：${culture}`);
    return entry;
}

function replace(text: string, node: ts.Node, value: string): string {
    return text.slice(0, node.getStart()) + value + text.slice(node.end);
}

export function replaceCultureValue(text: string, table: string, culture: string, value: string): string {
    return replace(text, property(text, table, culture).initializer, JSON.stringify(value));
}

export function replaceCultureSlots(text: string, culture: string, slots: any[]): string {
    const entry = property(text, 'CULTURE_TIERS_MAP', culture);
    if (!ts.isIdentifier(entry.initializer)) throw new Error(`文化 ${culture} 的编成引用无法识别`);
    const reference = entry.initializer.text;
    const table = findInitializer(text, 'CULTURE_TIERS_MAP') as ts.ObjectLiteralExpression;
    const shared = table.properties.filter(p => ts.isPropertyAssignment(p)
        && ts.isIdentifier(p.initializer) && p.initializer.text === reference).length > 1;
    const value = `[{ minTroops: 0, maxTroops: Infinity, gridSize: 3, slots: ${JSON.stringify(slots, null, 4)} }]`;
    if (shared) {
        // 共享底稿的不同军团在编辑时独立，避免连带改动其他军团。
        let name = `${culture}_EDITOR_TIERS`;
        let suffix = 2;
        while (new RegExp(`\\b${name}\\b`).test(text)) name = `${culture}_EDITOR_TIERS_${suffix++}`;
        text = replace(text, entry.initializer, name);
        const start = text.indexOf('export const CULTURE_TIERS_MAP');
        return text.slice(0, start) + `export const ${name}: CompositionTier[] = ${value};\n\n` + text.slice(start);
    }
    return replace(text, findInitializer(text, reference), value);
}
