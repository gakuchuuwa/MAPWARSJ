/**
 * UnifiedEditorManager - 统一编辑器管理器
 * 编辑器切换已集成到左侧图层控制面板中
 */

export interface IEditor {
    name: string;
    icon: string;
    show(): void;
    hide(): void;
    isVisible(): boolean;
}

export class UnifiedEditorManager {
    private editors: any[] = [];

    constructor() { }

    register(editor: any): void {
        this.editors.push(editor);
    }

    setGlobalVisibility(_visible: boolean): void { }
}
