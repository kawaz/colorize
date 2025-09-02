export interface MultilineOptions {
  joinMultiline: boolean;
}

export class MultilineProcessor {
  private options: MultilineOptions;

  constructor(options: Partial<MultilineOptions> = {}) {
    this.options = {
      joinMultiline: true,
      ...options,
    };
  }

  process(input: string): string {
    if (!this.options.joinMultiline) {
      return input;
    }

    const lines = input.split("\n");
    const result: string[] = [];
    let currentBlock: string[] = [];
    let blockType: "json" | "continuation" | null = null;
    let openBraces = 0;
    let openSquares = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // 空行の処理
      if (trimmed === "") {
        this.flushBlock(currentBlock, result, blockType);
        currentBlock = [];
        blockType = null;
        result.push(line);
        continue;
      }

      // JSONオブジェクトの開始検出
      if (this.isJsonObjectStart(line)) {
        this.flushBlock(currentBlock, result, blockType);
        currentBlock = [line];
        blockType = "json";
        openBraces = this.countChar(line, "{") - this.countChar(line, "}");
        openSquares = this.countChar(line, "[") - this.countChar(line, "]");

        // 1行で完結している場合
        if (openBraces === 0 && openSquares === 0) {
          result.push(line);
          currentBlock = [];
          blockType = null;
        }
        continue;
      }

      // JSON配列の開始検出
      if (this.isJsonArrayStart(line)) {
        this.flushBlock(currentBlock, result, blockType);
        currentBlock = [line];
        blockType = "json";
        openBraces = this.countChar(line, "{") - this.countChar(line, "}");
        openSquares = this.countChar(line, "[") - this.countChar(line, "]");

        // 1行で完結している場合
        if (openBraces === 0 && openSquares === 0) {
          result.push(line);
          currentBlock = [];
          blockType = null;
        }
        continue;
      }

      // JSONブロック内の処理
      if (blockType === "json") {
        currentBlock.push(line);
        openBraces += this.countChar(line, "{") - this.countChar(line, "}");
        openSquares += this.countChar(line, "[") - this.countChar(line, "]");

        // JSONブロックの終了
        if (openBraces <= 0 && openSquares <= 0) {
          const joined = this.joinJsonBlock(currentBlock);
          result.push(joined);
          currentBlock = [];
          blockType = null;
        }
        continue;
      }

      // インデントによる継続行の検出
      if (this.isContinuationLine(line, i > 0 ? lines[i - 1] : "")) {
        if (blockType !== "continuation") {
          this.flushBlock(currentBlock, result, blockType);
          // 前の行を含める
          if (i > 0 && result.length > 0) {
            const lastItem = result.pop();
            if (lastItem !== undefined) {
              currentBlock = [lastItem];
            }
          }
          blockType = "continuation";
        }
        currentBlock.push(line);
        continue;
      }

      // 通常の行
      this.flushBlock(currentBlock, result, blockType);
      currentBlock = [];
      blockType = null;
      result.push(line);
    }

    // 最後のブロックをフラッシュ
    this.flushBlock(currentBlock, result, blockType);

    return result.join("\n");
  }

  private flushBlock(block: string[], result: string[], blockType: "json" | "continuation" | null) {
    if (block.length === 0) return;

    if (blockType === "json") {
      result.push(this.joinJsonBlock(block));
    } else if (blockType === "continuation") {
      result.push(this.joinContinuationBlock(block));
    } else {
      result.push(...block);
    }
  }

  private joinJsonBlock(lines: string[]): string {
    if (lines.length === 0) return "";
    if (lines.length === 1) return lines[0];

    // 最初の行のインデントを保持
    // const firstLine = lines[0];
    // const _indent = firstLine.match(/^\s*/)?.[0] || "";

    // 各行を処理
    const processed = lines.map((line, index) => {
      if (index === 0) return line;

      const trimmed = line.trim();
      if (trimmed === "") return "";

      // インデント後の内容にスペースを追加して結合
      if (index > 0) {
        return ` ${trimmed}`;
      }
      return trimmed;
    });

    // 空文字列を除去して結合
    return processed.filter((line) => line !== "").join("");
  }

  private joinContinuationBlock(lines: string[]): string {
    if (lines.length === 0) return "";
    if (lines.length === 1) return lines[0];

    // 最初の行と継続行を結合
    const firstLine = lines[0];
    const continuations = lines.slice(1).map((line) => line.trim());

    return `${firstLine} ${continuations.join(" ")}`;
  }

  private isJsonObjectStart(line: string): boolean {
    const trimmed = line.trim();
    // JSONオブジェクトの開始パターン
    return /^[{[]/.test(trimmed) || /:\s*[{[]/.test(trimmed) || /^\S+.*:\s*{/.test(trimmed);
  }

  private isJsonArrayStart(line: string): boolean {
    const trimmed = line.trim();
    // JSON配列の開始パターン
    return /^\[/.test(trimmed) || /:\s*\[/.test(trimmed);
  }

  private isContinuationLine(line: string, prevLine: string): boolean {
    // インデントされた行を継続行とみなす
    if (/^\s{2,}/.test(line) && prevLine.trim() !== "") {
      // ただし、新しいログエントリの開始でない場合
      return !this.isNewLogEntry(line);
    }
    return false;
  }

  private isNewLogEntry(line: string): boolean {
    // タイムスタンプで始まる行は新しいエントリ
    if (/^\s*\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(line)) {
      return true;
    }

    // ログレベルで始まる行
    if (/^\s*(DEBUG|INFO|WARN|WARNING|ERROR|FATAL|TRACE)/i.test(line)) {
      return true;
    }

    return false;
  }

  private countChar(str: string, char: string): number {
    let count = 0;
    let inString = false;
    let escapeNext = false;

    for (let i = 0; i < str.length; i++) {
      const c = str[i];

      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      if (c === "\\") {
        escapeNext = true;
        continue;
      }

      if (c === '"' || c === "'") {
        inString = !inString;
        continue;
      }

      if (!inString && c === char) {
        count++;
      }
    }

    return count;
  }
}

// デフォルトのエクスポート
export function processMultiline(input: string, options?: Partial<MultilineOptions>): string {
  const processor = new MultilineProcessor(options);
  return processor.process(input);
}
