import { CstParser } from "chevrotain";
import { AllTokens, Tokens } from "./lexer";

export class LogParser extends CstParser {
  constructor() {
    super(AllTokens, {
      recoveryEnabled: true,
      nodeLocationTracking: "full",
      maxLookahead: 4,
    });
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
            this.OPTION(() => this.CONSUME(Tokens.Newline));
          },
        },
        { ALT: () => this.CONSUME2(Tokens.Newline) }, // 空行
      ]);
    });
  });

  // ログ要素（1行内の各要素）
  private logElement = this.RULE("logElement", () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.timestamp) },
      { ALT: () => this.SUBRULE(this.logLevel) },
      { ALT: () => this.SUBRULE(this.sourceInfo) },
      { ALT: () => this.SUBRULE(this.sourceInfoGrep) },
      { ALT: () => this.SUBRULE(this.objectArrayPattern) },
      { ALT: () => this.SUBRULE(this.httpRequest) },
      { ALT: () => this.SUBRULE(this.httpLogEntry) },
      // keyValuePairを一番優先度高くするため、先読みを使う
      {
        ALT: () => this.SUBRULE(this.keyValuePair),
        GATE: () => {
          // 現在のトークンが文字列、識別子、またはTextで、次がコロンまたはイコールの場合
          const currentToken = this.LA(1);
          const nextToken = this.LA(2);

          // 識別子やTextの場合
          if (
            currentToken &&
            (currentToken.tokenType === Tokens.Identifier || currentToken.tokenType === Tokens.Text)
          ) {
            return nextToken && (nextToken.tokenType === Tokens.Colon || nextToken.tokenType === Tokens.Equals);
          }

          // 文字列の場合
          if (
            currentToken &&
            (currentToken.tokenType === Tokens.StringLiteralDouble ||
              currentToken.tokenType === Tokens.StringLiteralSingle)
          ) {
            return nextToken && (nextToken.tokenType === Tokens.Colon || nextToken.tokenType === Tokens.Equals);
          }

          return false;
        },
      },
      { ALT: () => this.SUBRULE(this.quotedString) },
      { ALT: () => this.SUBRULE(this.ipAddress) },
      { ALT: () => this.SUBRULE(this.url) },
      { ALT: () => this.SUBRULE(this.numberLiteral) },
      { ALT: () => this.SUBRULE(this.booleanLiteral) },
      { ALT: () => this.SUBRULE(this.nullLiteral) },
      { ALT: () => this.SUBRULE(this.undefinedLiteral) },
      { ALT: () => this.SUBRULE(this.identifier) },
      { ALT: () => this.SUBRULE(this.text) },
      { ALT: () => this.SUBRULE(this.symbol) },
      { ALT: () => this.SUBRULE(this.ellipsis) },
      { ALT: () => this.SUBRULE(this.whitespace) },
    ]);
  });

  // タイムスタンプ
  private timestamp = this.RULE("timestamp", () => {
    this.CONSUME(Tokens.Timestamp);
  });

  // ログレベル
  private logLevel = this.RULE("logLevel", () => {
    this.CONSUME(Tokens.LogLevel);
  });

  // SourceInfo
  private sourceInfo = this.RULE("sourceInfo", () => {
    this.CONSUME(Tokens.SourceInfo);
  });

  // SourceInfoGrep
  private sourceInfoGrep = this.RULE("sourceInfoGrep", () => {
    this.CONSUME(Tokens.SourceInfoGrep);
  });

  // IPアドレス
  private ipAddress = this.RULE("ipAddress", () => {
    this.OR([
      // カテゴリーマッチングのみを使用（具体的なトークンはLexerで処理される）
      { ALT: () => this.CONSUME(Tokens.IPAddress) },
    ]);
  });

  // URL
  private url = this.RULE("url", () => {
    this.CONSUME(Tokens.URL);
  });

  // HTTPリクエスト（GET /api/path のような形式）
  private httpRequest = this.RULE("httpRequest", () => {
    this.CONSUME(Tokens.HTTPRequest);
  });

  // HTTPログエントリ（例: GET /api/status 200）
  private httpLogEntry = this.RULE("httpLogEntry", () => {
    this.CONSUME(Tokens.HTTPMethod);
    this.OPTION(() => {
      this.SUBRULE(this.path);
      this.OPTION2(() => this.CONSUME(Tokens.HTTPStatus));
    });
  });

  // パス
  private path = this.RULE("path", () => {
    this.AT_LEAST_ONE(() => {
      this.OR([
        { ALT: () => this.CONSUME(Tokens.Text) },
        { ALT: () => this.CONSUME(Tokens.Dash) },
        { ALT: () => this.CONSUME2(Tokens.Identifier) },
        { ALT: () => this.CONSUME(Tokens.Slash) },
      ]);
    });
  });

  // キーバリューペア（key=value または key: value）
  private keyValuePair = this.RULE("keyValuePair", () => {
    this.SUBRULE(this.kvKey);
    this.OR([{ ALT: () => this.CONSUME(Tokens.Equals) }, { ALT: () => this.CONSUME(Tokens.Colon) }]);
    // オプションで空白をスキップ
    this.OPTION(() => this.CONSUME(Tokens.Whitespace));
    this.SUBRULE(this.kvValue);
  });

  // キーバリューのキー
  private kvKey = this.RULE("kvKey", () => {
    this.OR([
      { ALT: () => this.CONSUME(Tokens.StringLiteralDouble) },
      { ALT: () => this.CONSUME(Tokens.StringLiteralSingle) },
      { ALT: () => this.CONSUME(Tokens.Identifier) },
      { ALT: () => this.CONSUME(Tokens.Text) },
    ]);
  });

  // キーバリューの値
  private kvValue = this.RULE("kvValue", () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.quotedString) },
      { ALT: () => this.SUBRULE(this.numberLiteral) },
      { ALT: () => this.SUBRULE(this.booleanLiteral) },
      { ALT: () => this.SUBRULE(this.nullLiteral) },
      { ALT: () => this.SUBRULE(this.timestamp) },
      { ALT: () => this.SUBRULE(this.ipAddress) },
      { ALT: () => this.SUBRULE(this.url) },
      // 複雑な値（コロンを含む値をサポート）- GATEで先読み
      {
        ALT: () => this.SUBRULE(this.complexValue),
        GATE: () => {
          // Identifier の後にコロンが続く場合のみ
          const nextToken = this.LA(2);
          return nextToken && nextToken.tokenType === Tokens.Colon;
        },
      },
      // Text と Identifier を別のルールでラップ
      { ALT: () => this.SUBRULE(this.kvSimpleValue) },
    ]);
  });

  // シンプルな値（Text または Identifier）
  private kvSimpleValue = this.RULE("kvSimpleValue", () => {
    this.OR([{ ALT: () => this.CONSUME(Tokens.Text) }, { ALT: () => this.CONSUME(Tokens.Identifier) }]);
  });

  // 複雑な値（コロンを含む値）
  private complexValue = this.RULE("complexValue", () => {
    // identifier:text または identifier:identifier のパターン
    this.CONSUME(Tokens.Identifier);
    this.CONSUME(Tokens.Colon);
    this.OR([{ ALT: () => this.CONSUME(Tokens.Text) }, { ALT: () => this.CONSUME2(Tokens.Identifier) }]);
  });

  // 文字列
  private quotedString = this.RULE("quotedString", () => {
    this.OR([
      { ALT: () => this.CONSUME(Tokens.StringLiteralDouble) },
      { ALT: () => this.CONSUME(Tokens.StringLiteralSingle) },
    ]);
  });

  // 数値
  private numberLiteral = this.RULE("numberLiteral", () => {
    this.CONSUME(Tokens.NumberLiteral);
  });

  // ブール値
  private booleanLiteral = this.RULE("booleanLiteral", () => {
    this.CONSUME(Tokens.BooleanLiteral);
  });

  // null値
  private nullLiteral = this.RULE("nullLiteral", () => {
    this.CONSUME(Tokens.NullLiteral);
  });

  // undefined値
  private undefinedLiteral = this.RULE("undefinedLiteral", () => {
    this.CONSUME(Tokens.UndefinedLiteral);
  });

  // 識別子
  private identifier = this.RULE("identifier", () => {
    this.CONSUME(Tokens.Identifier);
  });

  // テキスト
  private text = this.RULE("text", () => {
    this.CONSUME(Tokens.Text);
  });

  // 記号（その他の単一記号）
  private symbol = this.RULE("symbol", () => {
    this.OR([
      { ALT: () => this.CONSUME(Tokens.LParen) },
      { ALT: () => this.CONSUME(Tokens.RParen) },
      { ALT: () => this.CONSUME(Tokens.LSquare) },
      { ALT: () => this.CONSUME(Tokens.RSquare) },
      { ALT: () => this.CONSUME(Tokens.LCurly) },
      { ALT: () => this.CONSUME(Tokens.RCurly) },
      { ALT: () => this.CONSUME(Tokens.Dash) },
      { ALT: () => this.CONSUME(Tokens.Colon) },
      { ALT: () => this.CONSUME(Tokens.Comma) },
      { ALT: () => this.CONSUME(Tokens.Semicolon) },
      { ALT: () => this.CONSUME(Tokens.Equals) },
      { ALT: () => this.CONSUME(Tokens.Dot) },
      { ALT: () => this.CONSUME(Tokens.Slash) },
      { ALT: () => this.CONSUME(Tokens.Hash) },
      { ALT: () => this.CONSUME(Tokens.Pipe) },
    ]);
  });

  // 空白
  private whitespace = this.RULE("whitespace", () => {
    this.CONSUME(Tokens.Whitespace);
  });

  // 省略記号: ...
  private ellipsis = this.RULE("ellipsis", () => {
    this.CONSUME(Tokens.Ellipsis);
  });

  // [Object ...] パターン
  private objectArrayPattern = this.RULE("objectArrayPattern", () => {
    this.CONSUME(Tokens.ObjectArrayPattern);
  });
}

// パーサーインスタンスのシングルトン
export const logParser = new LogParser();
