import { createToken, Lexer, type TokenType } from "chevrotain";
import type { TokenDefinition } from "./rule-engine";
import type { TokenConfig, TokenWithSubTokens } from "./types";

export class DynamicLexer {
  private tokens = new Map<string, TokenType>();
  private tokenList: TokenType[] = [];
  private lexer: Lexer | null = null;
  private categoryMap = new Map<string, TokenType>();

  constructor(private definitions: TokenDefinition[]) {
    this.buildTokens();
    this.setupCategories();
    this.createLexer();
  }

  /**
   * トークン定義からChevrotainトークンを生成
   */
  private buildTokens(): void {
    // まずカテゴリトークン（パターンなしのトークン）を作成
    for (const def of this.definitions) {
      if (!def.pattern && !def.isContextual) {
        const token = createToken({
          name: def.name,
          pattern: Lexer.NA,
        });
        this.tokens.set(def.name, token);
        this.categoryMap.set(def.name, token);
        // カテゴリトークンもトークンリストに追加（順序のため）
        this.tokenList.push(token);
      }
    }

    // 次に実際のトークンを作成
    for (const def of this.definitions) {
      if (def.pattern) {
        const categories: TokenType[] = [];

        // カテゴリを設定
        if (def.categories) {
          for (const catName of def.categories) {
            const category = this.categoryMap.get(catName);
            if (category) {
              categories.push(category);
            }
          }
        }

        const tokenConfig: TokenConfig = {
          name: def.name,
          pattern: def.pattern,
        };

        if (categories.length > 0) {
          tokenConfig.categories = categories;
        }

        const token = createToken(tokenConfig);

        this.tokens.set(def.name, token);
        this.tokenList.push(token);

        // サブトークン情報をメタデータとして保存
        if (def.subTokens) {
          (token as TokenWithSubTokens).subTokens = def.subTokens;
        }
      } else if (def.isContextual) {
        // コンテキスト依存トークン（パターンなし）
        const token = createToken({
          name: def.name,
          pattern: Lexer.NA,
        });
        this.tokens.set(def.name, token);
        // コンテキスト依存トークンもリストに追加
        this.tokenList.push(token);
      }
    }

    // 重複を削除（カテゴリトークンが重複して追加される可能性があるため）
    const uniqueTokens = new Map<string, TokenType>();
    for (const token of this.tokenList) {
      if (!uniqueTokens.has(token.name)) {
        uniqueTokens.set(token.name, token);
      }
    }
    this.tokenList = Array.from(uniqueTokens.values());

    // 優先順位に従ってソート
    this.tokenList.sort((a, b) => {
      const defA = this.definitions.find((d) => d.name === a.name);
      const defB = this.definitions.find((d) => d.name === b.name);
      return (defA?.priority ?? 0) - (defB?.priority ?? 0);
    });
  }

  /**
   * カテゴリの設定
   */
  private setupCategories(): void {
    // 特殊なトークンを追加（すでに定義されていない場合のみ）
    if (!this.tokens.has("Whitespace") && !this.tokens.has("ws")) {
      const whitespace = createToken({
        name: "Whitespace",
        pattern: /[ \t]+/,
      });
      this.tokenList.unshift(whitespace);
      this.tokens.set("Whitespace", whitespace);
    }

    // newline は rules.ts で定義されているのでスキップ

    // フォールバックトークン（最後に追加）
    if (!this.tokens.has("Text")) {
      const text = createToken({
        name: "Text",
        pattern: /[^\s]+/,
      });
      this.tokenList.push(text);
      this.tokens.set("Text", text);
    }
  }

  /**
   * Lexerインスタンスを作成
   */
  private createLexer(): void {
    this.lexer = new Lexer(this.tokenList, {
      ensureOptimizations: false,
      skipValidations: false,
      recoveryEnabled: true,
    });
  }

  /**
   * テキストをトークナイズ
   */
  tokenize(text: string) {
    if (!this.lexer) {
      throw new Error("Lexer not initialized");
    }
    return this.lexer.tokenize(text);
  }

  /**
   * トークンを取得
   */
  getToken(name: string): TokenType | undefined {
    return this.tokens.get(name);
  }

  /**
   * 全トークンを取得
   */
  getAllTokens(): TokenType[] {
    return [...this.tokenList];
  }

  /**
   * トークンマップを取得
   */
  getTokenMap(): Map<string, TokenType> {
    return new Map(this.tokens);
  }
}
