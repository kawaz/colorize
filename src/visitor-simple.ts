import chalk from "chalk";
import type { IToken } from "chevrotain";
import type { SimpleParser } from "./parser-simple";
import type { ResolvedTheme } from "./theme-resolver";
import { colorizeWithSubTokens, extractNamedGroups } from "./tokenizer-utils";
import type { StyleObject, TokenContext, TokenWithSubTokens } from "./types";

export interface SimpleVisitorOptions {
  theme: ResolvedTheme;
  showRelativeTime?: boolean;
}

export class SimpleVisitor {
  constructor(
    _parser: SimpleParser,
    private options: SimpleVisitorOptions,
  ) {}

  /**
   * トークンリストを処理して色付け
   */
  processTokens(tokens: IToken[]): string {
    let result = "";

    for (const token of tokens) {
      result += this.processToken(token);
    }

    return result;
  }

  /**
   * 単一トークンを処理
   */
  private processToken(token: IToken): string {
    const tokenType = token.tokenType.name;
    const value = token.image;

    // 名前付きキャプチャグループを抽出
    const tokenWithSubTokens = token.tokenType as TokenWithSubTokens;
    if (tokenWithSubTokens.PATTERN && tokenWithSubTokens.PATTERN instanceof RegExp) {
      const subTokens = extractNamedGroups(token, tokenWithSubTokens.PATTERN);
      if (subTokens.size > 0) {
        // サブトークンを含むテキストを色付け
        return colorizeWithSubTokens(
          value,
          subTokens,
          (key) => this.options.theme.getTheme(key),
          (text, theme) => this.applyTheme(text, theme),
          tokenType
        );
      }
    }

    // テーマから色を取得
    const themeValue = this.options.theme.getTheme(tokenType);

    if (!themeValue) {
      return value;
    }

    return this.applyTheme(value, themeValue);
  }

  /**
   * テーマを適用
   */
  private applyTheme(value: string, themeValue: unknown): string {
    // 文字列の場合は簡略記法を展開して適用
    if (typeof themeValue === "string") {
      return this.applyShorthandTheme(value, themeValue);
    }

    // オブジェクトの場合はスタイルを適用
    if (typeof themeValue === "object" && themeValue !== null) {
      return this.applyStyleObject(value, themeValue as StyleObject);
    }

    // 関数の場合は実行して、その結果を色指定として適用
    if (typeof themeValue === "function") {
      const context: TokenContext = { value, tokenType: "" };
      const result = (themeValue as (ctx: TokenContext) => string)(context);
      // 関数の戻り値が色指定文字列の場合、それを適用
      if (typeof result === "string") {
        return this.applyShorthandTheme(value, result);
      }
      return result;
    }

    return value;
  }

  /**
   * 簡略記法のテーマを適用
   */
  private applyShorthandTheme(value: string, theme: string): string {
    const parts = theme.split("|");
    let result = value;

    for (const part of parts) {
      const trimmed = part.trim();

      // 色名
      if (trimmed in chalk) {
        result = (chalk as Record<string, (text: string) => string>)[trimmed](result);
      }
      // HEX色
      else if (trimmed.startsWith("#")) {
        result = chalk.hex(trimmed)(result);
      }
    }

    return result;
  }

  /**
   * スタイルオブジェクトを適用
   */
  private applyStyleObject(value: string, style: StyleObject): string {
    let result = value;

    if (style.color) {
      if (style.color in chalk) {
        result = (chalk as Record<string, (text: string) => string>)[style.color](result);
      } else if (style.color.startsWith("#")) {
        result = chalk.hex(style.color)(result);
      }
    }

    if (style.fontWeight === "bold") {
      result = chalk.bold(result);
    }

    if (style.fontStyle === "italic") {
      result = chalk.italic(result);
    }

    if (style.textDecoration === "underline") {
      result = chalk.underline(result);
    }

    return result;
  }
}
