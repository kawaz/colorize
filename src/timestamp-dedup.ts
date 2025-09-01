export interface TimestampDedupOptions {
  enabled: boolean;
  maxGapMs?: number; // タイムスタンプ間の最大許容差（ミリ秒）
}

export class TimestampDeduplicator {
  private options: TimestampDedupOptions;
  private timestampPattern = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?/g;

  constructor(options: Partial<TimestampDedupOptions> = {}) {
    this.options = {
      enabled: true,
      maxGapMs: 1000, // デフォルト: 1秒以内の差なら重複とみなす
      ...options,
    };
  }

  process(line: string): string {
    if (!this.options.enabled) {
      return line;
    }

    // 行内のタイムスタンプをすべて検出
    const matches: Array<{ value: string; index: number; date: Date | null }> = [];
    let match;

    this.timestampPattern.lastIndex = 0; // Reset regex state
    while ((match = this.timestampPattern.exec(line)) !== null) {
      const timestamp = match[0];
      const date = this.parseTimestamp(timestamp);
      matches.push({
        value: timestamp,
        index: match.index,
        date,
      });
    }

    // タイムスタンプが2個以上ない場合はそのまま返す
    if (matches.length < 2) {
      return line;
    }

    // 重複を検出して削除
    return this.removeDuplicates(line, matches);
  }

  private parseTimestamp(timestamp: string): Date | null {
    try {
      // ISO 8601形式のタイムスタンプをパース
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return null;
      }
      return date;
    } catch {
      return null;
    }
  }

  private removeDuplicates(line: string, matches: Array<{ value: string; index: number; date: Date | null }>): string {
    // 削除対象のインデックスを記録
    const toRemove = new Set<number>();

    for (let i = 0; i < matches.length - 1; i++) {
      const current = matches[i];
      const next = matches[i + 1];

      // データ内のタイムスタンプかチェック
      if (this.isDataTimestamp(line, next.index)) {
        continue; // データ内のタイムスタンプは削除しない
      }

      // 両方のタイムスタンプが有効な日付の場合
      if (current.date && next.date) {
        const gap = Math.abs(next.date.getTime() - current.date.getTime());
        
        // 時間差が閾値以内で、かつ連続している場合
        if (gap <= this.options.maxGapMs!) {
          // 2つのタイムスタンプが近接している（空白のみで区切られている）場合
          const between = line.substring(current.index + current.value.length, next.index);
          if (/^\s*$/.test(between)) {
            // 2個目を削除対象にする
            toRemove.add(i + 1);
          }
        }
      } else if (current.value === next.value) {
        // 同じ文字列の場合も重複とみなす
        const between = line.substring(current.index + current.value.length, next.index);
        if (/^\s*$/.test(between)) {
          toRemove.add(i + 1);
        }
      }
    }

    // 削除対象がない場合はそのまま返す
    if (toRemove.size === 0) {
      return line;
    }

    // 後ろから削除していく（インデックスがずれないように）
    let result = line;
    const sortedIndices = Array.from(toRemove).sort((a, b) => b - a);
    
    for (const idx of sortedIndices) {
      const match = matches[idx];
      const startIdx = match.index;
      const endIdx = match.index + match.value.length;
      
      // タイムスタンプの後の空白も一緒に削除
      let deleteEnd = endIdx;
      while (deleteEnd < result.length && /\s/.test(result[deleteEnd])) {
        deleteEnd++;
      }
      
      result = result.substring(0, startIdx) + result.substring(deleteEnd);
    }

    return result;
  }

  private isDataTimestamp(line: string, timestampIndex: number): boolean {
    // タイムスタンプの前後の文字を確認
    const beforeIndex = timestampIndex - 1;
    const afterIndex = timestampIndex + this.timestampPattern.source.length;

    // タイムスタンプの前の文字をチェック
    if (beforeIndex >= 0) {
      const charBefore = line[beforeIndex];
      
      // JSONのキー値、配列、オブジェクト内のタイムスタンプ
      if (charBefore === '"' || charBefore === ':' || charBefore === ',' || charBefore === '[' || charBefore === '{') {
        return true;
      }
      
      // キー=値 形式のデータ
      if (charBefore === '=') {
        return true;
      }

      // 前の文字列を確認（例: "t:", "timestamp:", "time=" など）
      const contextBefore = line.substring(Math.max(0, timestampIndex - 20), timestampIndex);
      if (/[a-zA-Z_][a-zA-Z0-9_]*\s*[:=]\s*$/.test(contextBefore)) {
        return true; // キー名の後のタイムスタンプ
      }
      
      // JSONライクな構造内
      if (/[{,]\s*"?[a-zA-Z_][a-zA-Z0-9_]*"?\s*:\s*"?$/.test(contextBefore)) {
        return true;
      }
    }

    // タイムスタンプの後の文字をチェック
    const searchEnd = Math.min(line.length, timestampIndex + 100);
    const afterContext = line.substring(timestampIndex, searchEnd);
    
    // タイムスタンプの直後に引用符がある場合
    if (afterContext.match(/^\d{4}-\d{2}-\d{2}T[\d:.]+Z?"/) ) {
      return true;
    }

    // タイムスタンプが行の先頭付近（最初の要素）にない場合で、
    // 前に他のログ要素がある場合はデータの可能性が高い
    if (timestampIndex > 50) {
      // 行の先頭50文字より後ろのタイムスタンプは基本的にデータとみなす
      // ただし、kubectl形式の重複パターンは除外
      const prefix = line.substring(0, timestampIndex);
      if (!/^\d{4}-\d{2}-\d{2}T[\d:.]+Z?\s+$/.test(prefix)) {
        return true;
      }
    }

    return false;
  }

  processLines(input: string): string {
    const lines = input.split('\n');
    const processedLines = lines.map(line => this.process(line));
    return processedLines.join('\n');
  }
}

// デフォルトのエクスポート
export function deduplicateTimestamps(input: string, options?: Partial<TimestampDedupOptions>): string {
  const deduplicator = new TimestampDeduplicator(options);
  return deduplicator.processLines(input);
}