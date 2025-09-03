// シンプルなルール定義（動作確認用）
import type { TokenContext } from "./types";

const tokens = {
  // タイムスタンプ
  timestamp: /\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?/,

  // ログレベル
  logLevel: /\b(?:DEBUG|INFO|WARN|WARNING|ERROR|FATAL|TRACE|debug|info|warn|warning|error|fatal|trace)\b/,

  // 文字列
  quotedString: [/"(?:[^\\"]|\\.)*"/, /'(?:[^\\']|\\.)*'/],

  // 数値
  number: /-?\d+(?:\.\d+)?/,

  // ブール値
  boolean: /\b(?:true|false)\b/,

  // null/undefined
  null: /\bnull\b/,
  undefined: /\bundefined\b/,

  // URL
  url: /https?:\/\/[^\s\]}"')]+/,

  // IPアドレス（シンプル版）
  ipv4: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/,
  ipv6: /\b[0-9a-fA-F:]+:[0-9a-fA-F:]+\b/,

  // HTTPメソッド
  httpMethod: /\b(?:GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\b/,

  // HTTPステータス
  httpStatus: /\b[1-5]\d{2}\b/,

  // ソースファイル情報
  sourceInfo: [
    /\[[^\]:]+:\d+(?::\d+)?\]/, // [src/file.ts:123]
    /\([^):]+:\d+(?::\d+)?\)/, // (app.js:456)
  ],

  // 識別子
  identifier: /[a-zA-Z_][a-zA-Z0-9_]*/,

  // 空白
  ws: /\s+/,
};

// 設定をエクスポート
export const config = {
  tokens,

  theme: {
    // タイムスタンプ
    timestamp: "cyan",

    // ログレベル
    logLevel: (ctx: TokenContext) => {
      const level = ctx.value.toUpperCase();
      switch (level) {
        case "ERROR":
        case "FATAL":
          return "red|bold";
        case "WARN":
        case "WARNING":
          return "yellow";
        case "INFO":
          return "green";
        case "DEBUG":
        case "TRACE":
          return "gray";
        default:
          return "white";
      }
    },

    // 文字列
    quotedString: "green",

    // 数値
    number: "yellow",

    // ブール値
    boolean: "yellow",

    // null/undefined
    null: "gray",
    undefined: "gray",

    // URL
    url: "blue|underline",

    // IPアドレス
    ipv4: "cyan",
    ipv6: "magenta",

    // HTTP
    httpMethod: "yellow|bold",
    httpStatus: (ctx: TokenContext) => {
      const status = parseInt(ctx.value, 10);
      if (status >= 200 && status < 300) return "green";
      if (status >= 300 && status < 400) return "cyan";
      if (status >= 400 && status < 500) return "yellow";
      if (status >= 500) return "red|bold";
      return "white";
    },

    // ソース情報
    sourceInfo: "cyan|underline",

    // 識別子
    identifier: "white",

    // 空白
    ws: "",

    // Textトークン（lexer-dynamicで自動追加される）
    Text: "white",
  },
};
