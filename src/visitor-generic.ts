import chalk from "chalk";
import type { CstChildrenDictionary, CstNode, IToken } from "chevrotain";
import type { GenericParser } from "./parser-generic";
import type { ResolvedTheme } from "./theme-resolver";

export interface VisitorOptions {
  theme: ResolvedTheme;
  showRelativeTime?: boolean;
}

export class GenericVisitor {
  private theme: ResolvedTheme;
  private showRelativeTime: boolean;
  private contextStack: string[] = [];

  constructor(
    private parser: GenericParser,
    options: VisitorOptions,
  ) {
    this.theme = options.theme;
    this.showRelativeTime = options.showRelativeTime || false;

    // Visitorメソッドを動的に生成
    this.setupVisitorMethods();
  }

  /**
   * Visitorメソッドを動的にセットアップ
   */
  private setupVisitorMethods(): void {
    const BaseVisitor = this.parser.getBaseCstVisitorConstructor();
    Object.setPrototypeOf(this, BaseVisitor.prototype);

    // logContentメソッドを定義
    (this as any).logContent = (ctx: CstChildrenDictionary): string => {
      let result = "";

      if (ctx.logElement) {
        for (const element of ctx.logElement) {
          if (this.isCstNode(element)) {
            result += (this as any).visit(element);
          }
        }
      }

      if (ctx.Newline) {
        for (const _nl of ctx.Newline) {
          result += "\n";
        }
      }

      return result;
    };

    // logElementメソッドを定義
    (this as any).logElement = (ctx: CstChildrenDictionary): string => {
      // 全てのトークンを処理
      for (const [_tokenName, tokens] of Object.entries(ctx)) {
        if (tokens && tokens.length > 0) {
          const token = tokens[0] as IToken;
          return this.processToken(token);
        }
      }
      return "";
    };

    // validateVisitorメソッドを呼び出し
    if (typeof (this as any).validateVisitor === "function") {
      (this as any).validateVisitor();
    }
  }

  /**
   * CstNodeかどうかを判定
   */
  private isCstNode(element: CstNode | IToken): element is CstNode {
    return "children" in element;
  }

  /**
   * トークンを処理
   */
  private processToken(token: IToken): string {
    const tokenType = token.tokenType.name;
    const value = token.image;

    // サブトークンがある場合は処理
    const subTokens = (token.tokenType as any).subTokens as Map<string, RegExp> | undefined;
    if (subTokens && subTokens.size > 0) {
      return this.processTokenWithSubTokens(token, subTokens);
    }

    // 通常のトークン処理
    return this.applyTheme(tokenType, value);
  }

  /**
   * サブトークンを含むトークンを処理
   */
  private processTokenWithSubTokens(token: IToken, subTokens: Map<string, RegExp>): string {
    const tokenType = token.tokenType.name;
    const value = token.image;

    // コンテキストをプッシュ
    this.contextStack.push(tokenType);

    try {
      // 名前付きキャプチャグループを抽出
      let result = value;
      for (const [subTokenName, subPattern] of subTokens) {
        const regex = new RegExp(`(?<${subTokenName}>${subPattern.source})`);
        const match = regex.exec(value);

        if (match?.groups?.[subTokenName]) {
          const subValue = match.groups[subTokenName];
          const colored = this.applyTheme(subTokenName, subValue, tokenType);
          result = result.replace(subValue, colored);
        }
      }

      return result;
    } finally {
      this.contextStack.pop();
    }
  }

  /**
   * テーマを適用
   */
  private applyTheme(tokenType: string, value: string, context?: string): string {
    // コンテキスト付きのキーを優先
    const contextKey = context ? `${context}_${tokenType}` : null;

    // テーマから色を取得
    let themeValue = contextKey ? this.theme.getTheme(contextKey) : null;
    if (!themeValue) {
      themeValue = this.theme.getTheme(tokenType);
    }

    if (!themeValue) {
      return value;
    }

    // 関数の場合は実行
    if (typeof themeValue === "function") {
      return themeValue({ value, tokenType, context });
    }

    // 文字列の場合は簡略記法を展開して適用
    if (typeof themeValue === "string") {
      return this.applyShorthandTheme(value, themeValue);
    }

    // オブジェクトの場合はスタイルを適用
    if (typeof themeValue === "object") {
      return this.applyStyleObject(value, themeValue);
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
        result = (chalk as any)[trimmed](result);
      }
      // HEX色
      else if (trimmed.startsWith("#")) {
        result = chalk.hex(trimmed)(result);
      }
      // RGB/HSL等（将来的な拡張用）
      else if (trimmed.includes("(") && trimmed.includes(")")) {
      }
    }

    return result;
  }

  /**
   * スタイルオブジェクトを適用
   */
  private applyStyleObject(value: string, style: any): string {
    let result = value;

    if (style.color) {
      if (style.color in chalk) {
        result = (chalk as any)[style.color](result);
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

    if (style.bgColor) {
      const bgMethod = `bg${style.bgColor.charAt(0).toUpperCase()}${style.bgColor.slice(1)}`;
      if (bgMethod in chalk) {
        result = (chalk as any)[bgMethod](result);
      }
    }

    return result;
  }

  /**
   * CSTを訪問して色付けされた文字列を返す
   */
  visit(cst: CstNode): string {
    if (typeof (this as any).visit === "function") {
      return (this as any).visit(cst);
    }
    return "";
  }
}
