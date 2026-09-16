import * as ts from 'typescript';

export const UNIT_STAT_KEYS = ['hp', 'atk', 'meleeArmor', 'pierceArmor', 'rng', 'reload', 'spd', 'sz'] as const;
export type UnitStatValues = Record<typeof UNIT_STAT_KEYS[number], number>;

/** Patch only existing numeric literals, preserving all unrelated data and comments. */
export function replaceUnitStats(source: string, unitId: unknown, values: unknown, expected: unknown): string {
    if (typeof unitId !== 'string' || !/^[a-z0-9_]+$/.test(unitId)) throw new Error('兵种ID无效');
    const check = (input: unknown): UnitStatValues => {
        if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('属性格式无效');
        const data = input as UnitStatValues;
        if (Object.keys(data).length !== UNIT_STAT_KEYS.length || Object.keys(data).some(k => !UNIT_STAT_KEYS.includes(k as any))) throw new Error('属性字段不完整或包含未知字段');
        for (const key of UNIT_STAT_KEYS) {
            const n = data[key];
            if (typeof n !== 'number' || !Number.isFinite(n)) throw new Error(`${key} 必须为有限数字`);
            if ((key === 'hp' || key === 'sz') ? n <= 0 : !['meleeArmor', 'pierceArmor'].includes(key) && n < 0) throw new Error(`${key} 数值范围无效`);
        }
        return data;
    };
    const next = check(values), previous = check(expected);
    const file = ts.createSourceFile('WarTypes.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    let table: ts.ObjectLiteralExpression | undefined;
    for (const statement of file.statements) if (ts.isVariableStatement(statement)) {
        for (const decl of statement.declarationList.declarations) if (decl.name.getText(file) === 'WAR_TYPES' && decl.initializer && ts.isObjectLiteralExpression(decl.initializer)) table = decl.initializer;
    }
    if (!table) throw new Error('未找到兵种属性表');
    const entries = table.properties.filter(p => ts.isPropertyAssignment(p) && p.name && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)) && p.name.text === unitId);
    if (entries.length !== 1) throw new Error('兵种不存在或存在重复记录');
    const entry = entries[0] as ts.PropertyAssignment;
    if (!ts.isObjectLiteralExpression(entry.initializer)) throw new Error('兵种记录格式不支持');
    const edits: { start: number; end: number; text: string }[] = [];
    for (const key of UNIT_STAT_KEYS) {
        const props = entry.initializer.properties.filter(p => ts.isPropertyAssignment(p) && p.name.getText(file) === key) as ts.PropertyAssignment[];
        if (props.length !== 1) throw new Error(`缺少或重复字段 ${key}`);
        const node = props[0].initializer;
        const literal = node.getText(file);
        if (!/^-?\d+(?:\.\d+)?$/.test(literal)) throw new Error(`${key} 不是数值常量`);
        if (Number(literal) !== previous[key]) throw new Error('属性已被其他操作修改，请刷新后重新编辑');
        if (Number(literal) !== next[key]) edits.push({ start: node.getStart(file), end: node.end, text: String(next[key]) });
    }
    for (const edit of edits.sort((a,b) => b.start-a.start)) source = source.slice(0,edit.start)+edit.text+source.slice(edit.end);
    return source;
}
