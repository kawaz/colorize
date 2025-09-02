import chalk from "chalk";
import type { CstChildrenDictionary, CstNode, IToken } from "chevrotain";
import { logParser } from "./parser";
import { toRelativeTime } from "./relative-time";
import { getTheme } from "./theme";

// Visitorベースクラス生成
const BaseVisitor = logParser.getBaseCstVisitorConstructor();

// Type guard to safely check if element is a CstNode
function isCstNode(element: CstNode | IToken): element is CstNode {
  return "children" in element;
}

export class ColorizeVisitor extends BaseVisitor {
  private timestampCount = 0; // 現在の行内のタイムスタンプ数
  private showRelativeTime = false; // 相対時間を表示するかどうか

  private get theme() {
    // 毎回動的にテーマを取得（環境変数の変更を反映）
    return getTheme(process.env.COLORIZE_THEME);
  }

  constructor(options: { showRelativeTime?: boolean } = {}) {
    super();
    this.showRelativeTime = options.showRelativeTime || false;
    this.validateVisitor();
  }

  // メインエントリポイント
  logContent(ctx: CstChildrenDictionary): string {
    let result = "";

    if (ctx.logElement) {
      // 各行の処理前にタイムスタンプカウントをリセット
      this.timestampCount = 0;
      for (const element of ctx.logElement) {
        // Use type guard for safety
        if (isCstNode(element)) {
          result += this.visit(element);
        }
      }
    }

    if (ctx.Newline) {
      for (const _nl of ctx.Newline) {
        result += "\n";
        // 改行でタイムスタンプカウントをリセット
        this.timestampCount = 0;
      }
    }

    return result;
  }

  // Helper to safely visit first element
  private visitFirstElement(elements: (CstNode | IToken)[] | undefined): string {
    if (!elements || elements.length === 0) return "";
    const element = elements[0];
    // In Chevrotain's CST, SUBRULE results are always CstNodes
    return isCstNode(element) ? this.visit(element) : "";
  }

  // ログ要素
  logElement(ctx: CstChildrenDictionary): string {
    // 各要素タイプを処理
    if (ctx.timestamp) return this.visitFirstElement(ctx.timestamp);
    if (ctx.logLevel) return this.visitFirstElement(ctx.logLevel);
    if (ctx.sourceInfo) return this.visitFirstElement(ctx.sourceInfo);
    if (ctx.sourceInfoGrep) return this.visitFirstElement(ctx.sourceInfoGrep);
    if (ctx.objectArrayPattern) return this.visitFirstElement(ctx.objectArrayPattern);
    if (ctx.httpRequest) return this.visitFirstElement(ctx.httpRequest);
    if (ctx.httpLogEntry) return this.visitFirstElement(ctx.httpLogEntry);
    if (ctx.keyValuePair) return this.visitFirstElement(ctx.keyValuePair);
    if (ctx.quotedString) return this.visitFirstElement(ctx.quotedString);
    if (ctx.ipAddress) return this.visitFirstElement(ctx.ipAddress);
    if (ctx.url) return this.visitFirstElement(ctx.url);
    if (ctx.numberLiteral) return this.visitFirstElement(ctx.numberLiteral);
    if (ctx.booleanLiteral) return this.visitFirstElement(ctx.booleanLiteral);
    if (ctx.nullLiteral) return this.visitFirstElement(ctx.nullLiteral);
    if (ctx.undefinedLiteral) return this.visitFirstElement(ctx.undefinedLiteral);
    if (ctx.identifier) return this.visitFirstElement(ctx.identifier);
    if (ctx.text) return this.visitFirstElement(ctx.text);
    if (ctx.symbol) return this.visitFirstElement(ctx.symbol);
    if (ctx.ellipsis) return this.visitFirstElement(ctx.ellipsis);
    if (ctx.whitespace) return this.visitFirstElement(ctx.whitespace);

    return "";
  }

  // タイムスタンプ
  timestamp(ctx: CstChildrenDictionary): string {
    const token = ctx.Timestamp[0] as IToken; // Timestamp is a consumed token
    const tokenType = token.tokenType.name;
    let value = token.image;
    this.timestampCount++;

    // TimestampWithReltimeの場合、相対時間部分を除去
    if (tokenType === "TimestampWithReltime") {
      // 相対時間部分 "(xxx)" を削除
      const match = value.match(/^(.+?)(\([^)]+\))$/);
      if (match) {
        value = match[1]; // タイムスタンプ部分のみ取得
      }
    }

    // 基本の色付け（1回目は通常、2回目以降は別色）
    let result: string;
    if (this.timestampCount === 1) {
      result = this.theme.colors.timestamp(value);
    } else {
      result = this.theme.colors.timestampSecondary(value);
    }

    // 相対時間を追加（TimestampWithReltimeでない場合のみ）
    if (this.showRelativeTime && tokenType !== "TimestampWithReltime") {
      const relativeTime = toRelativeTime(value);
      if (relativeTime) {
        result += this.theme.colors.relativeTime(`(${relativeTime})`);
      }
    } else if (this.showRelativeTime && tokenType === "TimestampWithReltime") {
      // 既存の相対時間を再計算して新しい値で置き換え
      const relativeTime = toRelativeTime(value);
      if (relativeTime) {
        result += this.theme.colors.relativeTime(`(${relativeTime})`);
      }
    }

    return result;
  }

  // ログレベル
  logLevel(ctx: CstChildrenDictionary): string {
    const value = (ctx.LogLevel[0] as IToken).image; // LogLevel is a consumed token
    const upperValue = value.toUpperCase();

    switch (upperValue) {
      case "FATAL":
        return this.theme.colors.logLevel.fatal(value);
      case "ERROR":
        return this.theme.colors.logLevel.error(value);
      case "WARN":
      case "WARNING":
        return this.theme.colors.logLevel.warn(value);
      case "INFO":
        return this.theme.colors.logLevel.info(value);
      case "DEBUG":
      case "TRACE":
        return this.theme.colors.logLevel.debug(value);
      default:
        return this.theme.colors.text(value);
    }
  }

  // SourceInfoGrep (src/file.ts:123: or src/file.ts:123:45:)
  sourceInfoGrep(ctx: CstChildrenDictionary): string {
    const value = (ctx.SourceInfoGrep[0] as IToken).image;
    // Remove trailing colon for parsing
    const content = value.slice(0, -1);

    // Split by colon
    const parts = content.split(":");

    let result = "";

    if (parts.length >= 2) {
      const lastPart = parts[parts.length - 1];

      if (parts.length >= 3 && /^\d+$/.test(lastPart) && /^\d+$/.test(parts[parts.length - 2])) {
        // Has column number (last two parts are numbers)
        const file = parts.slice(0, -2).join(":");
        const line = parts[parts.length - 2];
        const column = lastPart;

        result += this.theme.colors.sourceFile(file);
        result += this.theme.colors.text(":");
        result += this.theme.colors.sourceLineNumber(line);
        result += this.theme.colors.text(":");
        result += this.theme.colors.sourceColumnNumber(column);
      } else if (/^\d+$/.test(lastPart)) {
        // Only line number (last part is a number)
        const file = parts.slice(0, -1).join(":");
        const line = lastPart;

        result += this.theme.colors.sourceFile(file);
        result += this.theme.colors.text(":");
        result += this.theme.colors.sourceLineNumber(line);
      } else {
        // No proper format, just color as file
        result += this.theme.colors.sourceFile(content);
      }
    } else {
      // No colon, just color as file
      result += this.theme.colors.sourceFile(content);
    }

    // Add the trailing colon
    result += this.theme.colors.symbol(":");
    return result;
  }

  // SourceInfo ([src/file.ts:123:45])
  sourceInfo(ctx: CstChildrenDictionary): string {
    const value = (ctx.SourceInfo[0] as IToken).image;
    // [src/file.ts:123:45] -> src/file.ts:123:45
    const content = value.slice(1, -1);

    // Split by colon from the end
    const parts = content.split(":");

    let result = this.theme.colors.text("[");

    if (parts.length >= 2) {
      // Last part is always line number (or column if 3+ parts)
      const lastPart = parts[parts.length - 1];

      if (parts.length >= 3 && /^\d+$/.test(lastPart) && /^\d+$/.test(parts[parts.length - 2])) {
        // Has column number (last two parts are numbers)
        const file = parts.slice(0, -2).join(":");
        const line = parts[parts.length - 2];
        const column = lastPart;

        result += this.theme.colors.sourceFile(file);
        result += this.theme.colors.text(":");
        result += this.theme.colors.sourceLineNumber(line);
        result += this.theme.colors.text(":");
        result += this.theme.colors.sourceColumnNumber(column);
      } else if (/^\d+$/.test(lastPart)) {
        // Only line number (last part is a number)
        const file = parts.slice(0, -1).join(":");
        const line = lastPart;

        result += this.theme.colors.sourceFile(file);
        result += this.theme.colors.text(":");
        result += this.theme.colors.sourceLineNumber(line);
      } else {
        // No proper format, just color as file
        result += this.theme.colors.sourceFile(content);
      }
    } else {
      // No colon, just color as file
      result += this.theme.colors.sourceFile(content);
    }

    result += this.theme.colors.text("]");
    return result;
  }

  // IPアドレス
  ipAddress(ctx: CstChildrenDictionary): string {
    if (ctx.IPAddress && ctx.IPAddress.length > 0) {
      const token = ctx.IPAddress[0];
      const tokenTypeName = token.tokenType.name;

      // IPv6系トークン
      if (tokenTypeName.startsWith("IPAddressV6")) {
        return this.theme.colors.ipv6(token.image);
      }
      // IPv4系トークン
      else if (tokenTypeName.startsWith("IPAddressV4")) {
        return this.theme.colors.ipv4(token.image);
      }
    }
    return "";
  }

  // URL
  url(ctx: CstChildrenDictionary): string {
    const value = (ctx.URL[0] as IToken).image;
    return this.theme.colors.url(value);
  }

  // HTTPリクエスト（GET /api/path のような形式）
  httpRequest(ctx: CstChildrenDictionary): string {
    const value = (ctx.HTTPRequest[0] as IToken).image;
    const [method, path] = value.split(" ", 2);
    return [this.theme.colors.httpMethod(method), this.theme.colors.url(path)].join(" ");
  }

  // HTTPログエントリ
  httpLogEntry(ctx: CstChildrenDictionary): string {
    let result = "";

    if (ctx.HTTPMethod) {
      result += this.theme.colors.httpMethod((ctx.HTTPMethod[0] as IToken).image);
    }

    if (ctx.path) {
      result += ` ${this.visit(ctx.path[0])}`;
    }

    if (ctx.HTTPStatus) {
      const status = (ctx.HTTPStatus[0] as IToken).image;
      const statusNum = parseInt(status, 10);
      let colorFn = this.theme.colors.httpStatusDefault;

      if (statusNum >= 200 && statusNum < 300) {
        colorFn = this.theme.colors.httpStatus2xx;
      } else if (statusNum >= 300 && statusNum < 400) {
        colorFn = this.theme.colors.httpStatus3xx;
      } else if (statusNum >= 400 && statusNum < 500) {
        colorFn = this.theme.colors.httpStatus4xx;
      } else if (statusNum >= 500) {
        colorFn = this.theme.colors.httpStatus5xx;
      }

      result += ` ${colorFn(status)}`;
    }

    return result;
  }

  // パス
  path(ctx: CstChildrenDictionary): string {
    let result = "";

    if (ctx.Text) {
      for (const text of ctx.Text) {
        result += text.image;
      }
    }

    if (ctx.Dash) {
      for (const dash of ctx.Dash) {
        result += dash.image;
      }
    }

    if (ctx.Identifier) {
      for (const id of ctx.Identifier) {
        result += id.image;
      }
    }

    if (ctx.Slash) {
      for (const slash of ctx.Slash) {
        result += slash.image;
      }
    }

    return chalk.cyan(result);
  }

  // キーバリューペア
  keyValuePair(ctx: CstChildrenDictionary): string {
    let result = "";

    if (ctx.kvKey) {
      result += this.visit(ctx.kvKey[0]);
    }

    if (ctx.Equals) {
      result += this.theme.colors.keyValueEquals("=");
    } else if (ctx.Colon) {
      result += this.theme.colors.text(":");
    }

    // オプションの空白
    if (ctx.Whitespace) {
      result += (ctx.Whitespace[0] as IToken).image;
    }

    if (ctx.kvValue?.[0]) {
      result += this.visit(ctx.kvValue[0]);
    }

    return result;
  }

  // キーバリューのキー
  kvKey(ctx: CstChildrenDictionary): string {
    // クォートされた文字列の場合
    if (ctx.StringLiteralDouble) {
      const value = (ctx.StringLiteralDouble[0] as IToken).image;
      const quote = value[0];
      const content = value.slice(1, -1);
      return (
        this.theme.colors.keyValueKey(quote) +
        this.theme.colors.keyValueKey(content) +
        this.theme.colors.keyValueKey(quote)
      );
    }
    if (ctx.StringLiteralSingle) {
      const value = (ctx.StringLiteralSingle[0] as IToken).image;
      const quote = value[0];
      const content = value.slice(1, -1);
      return (
        this.theme.colors.keyValueKey(quote) +
        this.theme.colors.keyValueKey(content) +
        this.theme.colors.keyValueKey(quote)
      );
    }
    // 通常の識別子またはテキスト
    const value = ctx.Identifier ? (ctx.Identifier[0] as IToken).image : (ctx.Text[0] as IToken).image;
    return this.theme.colors.keyValueKey(value);
  }

  // キーバリューの値
  kvValue(ctx: CstChildrenDictionary): string {
    // SUBRULEの場合
    if (ctx.quotedString) return this.visit(ctx.quotedString[0]);
    if (ctx.numberLiteral) return this.visit(ctx.numberLiteral[0]);
    if (ctx.booleanLiteral) return this.visit(ctx.booleanLiteral[0]);
    if (ctx.nullLiteral) return this.visit(ctx.nullLiteral[0]);
    if (ctx.timestamp) return this.visit(ctx.timestamp[0]);
    if (ctx.ipAddress) return this.visit(ctx.ipAddress[0]);
    if (ctx.url) return this.visit(ctx.url[0]);
    if (ctx.complexValue) return this.visit(ctx.complexValue[0]);
    if (ctx.kvSimpleValue) return this.visit(ctx.kvSimpleValue[0]);

    return "";
  }

  // シンプルな値（Text または Identifier）
  kvSimpleValue(ctx: CstChildrenDictionary): string {
    if (ctx.Text?.[0]) {
      return this.theme.colors.string((ctx.Text[0] as IToken).image);
    }
    if (ctx.Identifier?.[0]) {
      return this.theme.colors.string((ctx.Identifier[0] as IToken).image);
    }
    return "";
  }

  // 文字列
  quotedString(ctx: CstChildrenDictionary): string {
    const value = ctx.StringLiteralDouble
      ? (ctx.StringLiteralDouble[0] as IToken).image
      : (ctx.StringLiteralSingle[0] as IToken).image;

    // エスケープシーケンスのパターン
    const escapePattern = /\\(?:[bfnrtv'"\\/]|u[0-9a-fA-F]{4}|u\{[0-9a-fA-F]+\}|x[0-9a-fA-F]{2}|[0-7]{1,3})/g;

    // 内容に基づいて色を変更
    const content = value.slice(1, -1).toLowerCase();

    let colorFn = this.theme.colors.string;
    if (content.includes("error") || content.includes("fail") || content.includes("exception")) {
      colorFn = this.theme.colors.stringError || this.theme.colors.string;
    } else if (content.includes("warning") || content.includes("warn")) {
      colorFn = this.theme.colors.logLevel.warn;
    } else if (content.includes("success") || content.includes("complete") || content.includes("ok")) {
      colorFn = this.theme.colors.httpStatus2xx;
    }

    // クォートを分離
    const quote = value[0];
    const innerContent = value.slice(1, -1);

    // 相対時間を文字列の外側に追加するための変数
    let relativeTimeToAppend = "";

    // 相対時間を計算（タイムスタンプパターンにマッチする場合）
    if (this.showRelativeTime) {
      // ISO 8601形式のタイムスタンプパターン - 文字列全体がタイムスタンプの場合のみ
      const timestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
      if (timestampPattern.test(innerContent)) {
        const relativeTime = toRelativeTime(innerContent);
        if (relativeTime) {
          relativeTimeToAppend = this.theme.colors.relativeTime(`(${relativeTime})`);
        }
      }
    }

    // エスケープシーケンスを色付け（内容部分のみ）
    const _coloredContent = innerContent.replace(escapePattern, (match) => {
      return this.theme.colors.escapeSequence(match);
    });

    // 文字列全体にベースカラーを適用してから、エスケープシーケンスの色を上書き
    const _baseColoredContent = colorFn(innerContent);

    // エスケープシーケンスの色を保持しながら、残りの文字列に色を適用
    let result = "";
    let lastIndex = 0;
    escapePattern.lastIndex = 0; // Reset regex

    let match = escapePattern.exec(innerContent);
    while (match !== null) {
      // エスケープシーケンス前の通常文字列
      if (match.index > lastIndex) {
        result += colorFn(innerContent.slice(lastIndex, match.index));
      }
      // エスケープシーケンス
      result += this.theme.colors.escapeSequence(match[0]);
      lastIndex = match.index + match[0].length;

      // 次のマッチを取得
      match = escapePattern.exec(innerContent);
    }

    // 残りの文字列
    if (lastIndex < innerContent.length) {
      result += colorFn(innerContent.slice(lastIndex));
    }

    // クォートと組み合わせて返す（相対時間は外側に）
    return colorFn(quote) + result + colorFn(quote) + relativeTimeToAppend;
  }

  // 数値
  numberLiteral(ctx: CstChildrenDictionary): string {
    const value = (ctx.NumberLiteral[0] as IToken).image;
    return this.theme.colors.number(value);
  }

  // ブール値
  booleanLiteral(ctx: CstChildrenDictionary): string {
    const value = (ctx.BooleanLiteral[0] as IToken).image;
    return this.theme.colors.boolean(value);
  }

  // null値
  nullLiteral(_ctx: CstChildrenDictionary): string {
    return this.theme.colors.null("null");
  }

  // undefined値
  undefinedLiteral(_ctx: CstChildrenDictionary): string {
    return this.theme.colors.undefined("undefined");
  }

  // 識別子
  identifier(ctx: CstChildrenDictionary): string {
    const value = (ctx.Identifier[0] as IToken).image;
    return this.theme.colors.identifier(value);
  }

  // テキスト
  text(ctx: CstChildrenDictionary): string {
    const value = (ctx.Text[0] as IToken).image;
    return this.theme.colors.text(value);
  }

  // 記号
  symbol(ctx: CstChildrenDictionary): string {
    // すべての記号をテキストと同じ色に
    if (ctx.LParen) return this.theme.colors.text((ctx.LParen[0] as IToken).image);
    else if (ctx.RParen) return this.theme.colors.text((ctx.RParen[0] as IToken).image);
    else if (ctx.LSquare) return this.theme.colors.text((ctx.LSquare[0] as IToken).image);
    else if (ctx.RSquare) return this.theme.colors.text((ctx.RSquare[0] as IToken).image);
    else if (ctx.LCurly) return this.theme.colors.text((ctx.LCurly[0] as IToken).image);
    else if (ctx.RCurly) return this.theme.colors.text((ctx.RCurly[0] as IToken).image);
    else if (ctx.Dash) return this.theme.colors.text((ctx.Dash[0] as IToken).image);
    else if (ctx.Colon) return this.theme.colors.text((ctx.Colon[0] as IToken).image);
    else if (ctx.Comma) return this.theme.colors.text((ctx.Comma[0] as IToken).image);
    else if (ctx.Semicolon) return this.theme.colors.text((ctx.Semicolon[0] as IToken).image);
    else if (ctx.Equals) return this.theme.colors.text((ctx.Equals[0] as IToken).image);
    else if (ctx.Dot) return this.theme.colors.text((ctx.Dot[0] as IToken).image);
    else if (ctx.Slash) return this.theme.colors.text((ctx.Slash[0] as IToken).image);
    else if (ctx.Hash) return this.theme.colors.text((ctx.Hash[0] as IToken).image);
    else if (ctx.Pipe) return this.theme.colors.text((ctx.Pipe[0] as IToken).image);

    return this.theme.colors.text("");
  }

  // 空白
  whitespace(ctx: CstChildrenDictionary): string {
    return (ctx.Whitespace[0] as IToken).image;
  }

  // 複雑な値（コロンを含む値）
  complexValue(ctx: CstChildrenDictionary): string {
    // 複雑な値も文字列として扱う
    let result = "";
    if (ctx.Identifier?.[0]) {
      result += (ctx.Identifier[0] as IToken).image;
    }
    if (ctx.Colon?.[0]) {
      result += (ctx.Colon[0] as IToken).image;
    }
    if (ctx.Text?.[0]) {
      result += (ctx.Text[0] as IToken).image;
    } else if (ctx.Identifier?.[1]) {
      result += (ctx.Identifier[1] as IToken).image;
    }
    return this.theme.colors.string(result);
  }

  // 省略記号: ...
  ellipsis(ctx: CstChildrenDictionary): string {
    return this.theme.colors.text((ctx.Ellipsis[0] as IToken).image);
  }

  // [Object ...] パターン
  objectArrayPattern(ctx: CstChildrenDictionary): string {
    return this.theme.colors.objectArrayPattern((ctx.ObjectArrayPattern[0] as IToken).image);
  }
}

// デフォルトインスタンス（後方互換性のため）
export const colorizeVisitor = new ColorizeVisitor();

// インスタンス作成用のファクトリー関数
export function createColorizeVisitor(options: { showRelativeTime?: boolean } = {}): ColorizeVisitor {
  return new ColorizeVisitor(options);
}
