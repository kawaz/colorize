import type { IToken } from "chevrotain";

/**
 * 名前付きキャプチャグループを使ってサブトークンを抽出
 */
export interface SubTokenInfo {
  name: string;
  value: string;
  start: number;
  end: number;
}

/**
 * トークンから名前付きキャプチャグループを抽出
 */
export function extractNamedGroups(token: IToken, pattern: RegExp): Map<string, string> {
  const groups = new Map<string, string>();

  // パターンを再実行して名前付きグループを取得
  const match = pattern.exec(token.image);
  if (match && match.groups) {
    for (const [name, value] of Object.entries(match.groups)) {
      if (value !== undefined) {
        groups.set(name, value);
      }
    }
  }

  return groups;
}

/**
 * 名前付きキャプチャグループの名前を抽出
 */
export function getNamedGroupNames(pattern: RegExp): string[] {
  const names: string[] = [];
  const source = pattern.source;
  const namedGroupPattern = /\(\?<([a-zA-Z][a-zA-Z0-9_]*)>/g;

  let match: RegExpExecArray | null;
  while ((match = namedGroupPattern.exec(source)) !== null) {
    names.push(match[1]);
  }

  return names;
}

/**
 * サブトークンに基づいてテキストを色付け
 */
export function colorizeWithSubTokens(
  text: string,
  subTokens: Map<string, string>,
  getTheme: (key: string) => unknown,
  applyTheme: (text: string, theme: unknown) => string,
  parentTokenType: string,
): string {
  // サブトークンがない場合はそのまま返す
  if (subTokens.size === 0) {
    return text;
  }

  // 各サブトークンの位置を特定
  const replacements: Array<{ start: number; end: number; name: string; value: string }> = [];

  for (const [name, value] of subTokens) {
    const index = text.indexOf(value);
    if (index !== -1) {
      replacements.push({
        start: index,
        end: index + value.length,
        name,
        value,
      });
    }
  }

  // 位置順にソート
  replacements.sort((a, b) => a.start - b.start);

  // テキストを再構築
  let result = "";
  let lastEnd = 0;

  for (const replacement of replacements) {
    // 前の部分を追加
    if (lastEnd < replacement.start) {
      result += text.substring(lastEnd, replacement.start);
    }

    // サブトークンのテーマを適用
    const subTokenThemeKey = `${parentTokenType}_${replacement.name}`;
    const theme = getTheme(subTokenThemeKey) || getTheme(replacement.name);

    if (theme) {
      result += applyTheme(replacement.value, theme);
    } else {
      result += replacement.value;
    }

    lastEnd = replacement.end;
  }

  // 残りの部分を追加
  if (lastEnd < text.length) {
    result += text.substring(lastEnd);
  }

  return result;
}
