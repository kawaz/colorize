import { CstParser, type IToken, type TokenType } from "chevrotain";
import type { DynamicLexer } from "./lexer-dynamic";
import type { ParseAlternative } from "./types";

export class Parser extends CstParser {
  private allTokens: TokenType[];

  constructor(private dynamicLexer: DynamicLexer) {
    const tokens = dynamicLexer.getAllTokens();
    super(tokens, {
      recoveryEnabled: true,
      nodeLocationTracking: "full",
      maxLookahead: 2,
      skipValidations: true, // バリデーションをスキップ
    });

    this.allTokens = tokens;
    // パーサーの自己解析を実行
    this.performSelfAnalysis();
  }

  // メインルール：行単位で処理
  public line = this.RULE("line", () => {
    this.MANY(() => {
      this.SUBRULE(this.token);
    });
  });

  // 単一トークン
  private token = this.RULE("token", () => {
    // 各トークンを順番に試す（カテゴリトークンは除外）
    const alternatives: ParseAlternative[] = [];

    for (let i = 0; i < this.allTokens.length; i++) {
      const token = this.allTokens[i];
      // カテゴリトークンとコンテキスト依存トークンをスキップ
      // PATTERNがない、または関数の場合はスキップ
      if ((token as TokenType).PATTERN && typeof (token as TokenType).PATTERN !== "function") {
        alternatives.push({
          ALT: () => this.CONSUME(token),
        });
      }
    }

    if (alternatives.length > 0) {
      this.OR(alternatives);
    }
  });

  /**
   * 行をパース
   */
  parseLine(text: string) {
    const lexResult = this.dynamicLexer.tokenize(text);
    this.input = lexResult.tokens;
    const cst = this.line();

    return {
      cst,
      tokens: lexResult.tokens,
      lexErrors: lexResult.errors,
      parseErrors: this.errors,
    };
  }
}
