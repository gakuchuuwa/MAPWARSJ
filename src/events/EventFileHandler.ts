
export class EventFileHandler {
    private fileHandle: any = null;

    public async linkFile(): Promise<string | null> {
        try {
            // @ts-ignore - File System Access API
            const [fileHandle] = await window.showOpenFilePicker({
                types: [{
                    description: 'TypeScript Files',
                    accept: { 'text/typescript': ['.ts'] }
                }],
                multiple: false
            });

            this.fileHandle = fileHandle;
            return fileHandle.name;
        } catch (err) {
            console.error('File selection cancelled or failed', err);
            return null;
        }
    }

    public isFileLinked(): boolean {
        return !!this.fileHandle;
    }

    public async saveToFile(event: any): Promise<boolean> {
        if (!this.fileHandle) {
            throw new Error('No file linked');
        }

        try {
            // 1. Read file content
            const file = await this.fileHandle.getFile();
            const text = await file.text();

            // 2. Find insertion point (end of array)
            const lastBracketIndex = text.lastIndexOf('];');

            if (lastBracketIndex === -1) {
                console.error('无法解析文件结构：找不到 HISTORICAL_EVENTS 数组的结尾 "];"');
                return false;
            }

            // 3. Prepare new content
            const json = JSON.stringify(event, null, 4);
            const newEntry = `,\n    ${json.replace(/\n/g, '\n    ')}`; // Indent

            // 4. Construct new file content
            const newContent = text.slice(0, lastBracketIndex) + newEntry + '\n' + text.slice(lastBracketIndex);

            // 5. Write back to file
            const writable = await this.fileHandle.createWritable();
            await writable.write(newContent);
            await writable.close();

            return true;
        } catch (err) {
            console.error('Failed to save file:', err);
            return false;
        }
    }

    public async updateFile(originalEvent: any, newEvent: any): Promise<boolean> {
        if (!this.fileHandle) {
            throw new Error('No file linked');
        }

        try {
            // 1. Read file content
            const file = await this.fileHandle.getFile();
            const text = await file.text();

            const originalDescription = originalEvent.description;
            const originalYear = originalEvent.year;
            const originalSeason = originalEvent.season;

            // 2. Find the event block to replace
            const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            // [ROBUST] Get the literal form of the description as it would appear in the file (with escapes)
            const literalDesc = JSON.stringify(originalDescription).slice(1, -1);
            const escapedDesc = escapeRegex(literalDesc);
            const rawEscapedDesc = escapeRegex(originalDescription);

            // [FIX] Create safe snippet for regex:
            // Take substring of ORIGINAL text first to avoid splitting escape sequences
            const snippetRaw = originalDescription.substring(0, 20);
            let snippetLiteral = JSON.stringify(snippetRaw);
            // Remove surrounding quotes
            snippetLiteral = snippetLiteral.substring(1, snippetLiteral.length - 1);
            const snippetEscaped = escapeRegex(snippetLiteral);

            const patterns = [
                // 1. Match escaped version (handles \n, \", etc.)
                new RegExp(`description["']?:\\s*['"]${escapedDesc}['"]`),
                // 2. Match raw version (if file has literal newlines)
                new RegExp(`description["']?:\\s*['"]${rawEscapedDesc}['"]`),
                // 3. Fallback: Match by year/season and snippet of description
                new RegExp(`"year":\\s*${originalYear}[\\s\\S]*?"season":\\s*${originalSeason}[\\s\\S]*?["']${snippetEscaped}`)
            ];

            let startIndex = -1;
            for (const pattern of patterns) {
                const match = text.match(pattern);
                if (match && match.index !== undefined) {
                    startIndex = match.index;
                    console.log(`[EventFileHandler] Found event using pattern: ${pattern}`);
                    break;
                }
            }

            if (startIndex === -1) {
                console.error('[EventFileHandler] 无法在文件中找到原始事件。搜索参数:', {
                    year: originalYear,
                    season: originalSeason,
                    descSnippet: originalDescription.substring(0, 30)
                });
                return false;
            }

            // Find the start of the object "{" before the description
            const objectStart = text.lastIndexOf('{', startIndex);

            // Find the end of the object "}"
            let braceCount = 0;
            let objectEnd = -1;
            for (let i = objectStart; i < text.length; i++) {
                if (text[i] === '{') braceCount++;
                if (text[i] === '}') braceCount--;
                if (braceCount === 0) {
                    objectEnd = i + 1;
                    break;
                }
            }

            if (objectEnd === -1) {
                console.error('解析文件结构失败：无法确定事件对象边界。');
                return false;
            }

            // 3. Prepare new content
            const json = JSON.stringify(newEvent, null, 4);
            const indentedJson = json.replace(/\n/g, '\n    ');

            // 4. Construct new file content
            const newContent = text.slice(0, objectStart) + indentedJson + text.slice(objectEnd);

            // 5. Write back to file
            const writable = await this.fileHandle.createWritable();
            await writable.write(newContent);
            await writable.close();

            return true;

        } catch (err) {
            console.error('Failed to update file:', err);
            return false;
        }
    }
}
