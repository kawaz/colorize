import { CstParser, type IToken } from "chevrotain";
import type { DynamicLexer } from "./lexer-dynamic";

export class GenericParser extends CstParser {
  private tokenMap: Map<string, IToken>;

  constructor(private dynamicLexer: DynamicLexer) {
    const tokens = dynamicLexer.getAllTokens();
    super(tokens, {
      recoveryEnabled: true,
      nodeLocationTracking: "full",
      maxLookahead: 4,
    });

    this.tokenMap = dynamicLexer.getTokenMap();
    this.performSelfAnalysis();
  }

  // メインルール：ログ全体
  public logContent = this.RULE("logContent", () => {
    this.MANY(() => {
      this.OR([
        {
          ALT: () => {
            this.AT_LEAST_ONE(() => {
              this.SUBRULE(this.logElement);
            });
            const newline = this.tokenMap.get("newline") || this.tokenMap.get("Newline");
            if (newline) {
              this.OPTION(() => this.CONSUME(newline));
            }
          },
        },
        {
          ALT: () => {
            const newline = this.tokenMap.get("newline") || this.tokenMap.get("Newline");
            if (newline) {
              this.CONSUME(newline);
            }
          },
        }, // 空行
      ]);
    });
  });

  // ログ要素（1行内の各要素）
  private logElement = this.RULE("logElement", () => {
    // 動的にトークンを処理
    const alternatives: any[] = [];

    // 全トークンに対してORを構築
    for (const token of this.dynamicLexer.getAllTokens()) {
      // 特殊トークンはスキップ
      if (token.name === "Newline" || token.name === "newline") continue;

      alternatives.push({
        ALT: () => this.CONSUME(token),
      });
    }

    if (alternatives.length > 0) {
      this.OR(alternatives);
    }
  });

  /**
   * テキストをパース
   */
  parse(text: string) {
    const lexResult = this.dynamicLexer.tokenize(text);
    this.input = lexResult.tokens;
    const cst = this.logContent();

    return {
      cst,
      lexErrors: lexResult.errors,
      parseErrors: this.errors,
    };
  }
}
