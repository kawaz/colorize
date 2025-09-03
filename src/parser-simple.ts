import { CstParser, IToken } from "chevrotain";
import type { DynamicLexer } from "./lexer-dynamic";

export class SimpleParser extends CstParser {
  private allTokens: IToken[];
  
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
    const alternatives: any[] = [];
    
    for (let i = 0; i < this.allTokens.length; i++) {
      const token = this.allTokens[i];
      // カテゴリトークンとコンテキスト依存トークンをスキップ
      // PATTERNがない、または関数の場合はスキップ
      if (token.PATTERN && typeof token.PATTERN !== 'function') {
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