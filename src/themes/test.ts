import type { Theme } from "./types";

// テスト用テーマ（各トークンタイプを明確に識別可能にする）
// ANSIエスケープコードで一意に識別できるよう設計
export const testTheme: Theme = {
  name: "test",
  colors: {
    // Timestamps - 30番台（黒〜白）
    timestamp: (s: string) => `\x1b[30m[TIMESTAMP]${s}[/TIMESTAMP]\x1b[0m`,
    timestampSecondary: (s: string) => `\x1b[90m[TIMESTAMP2]${s}[/TIMESTAMP2]\x1b[0m`,
    relativeTime: (s: string) => `\x1b[30;2m[RELTIME]${s}[/RELTIME]\x1b[0m`,

    // IP Addresses - 34/35（青/マゼンタ）
    ipv4: (s: string) => `\x1b[34m[IPV4]${s}[/IPV4]\x1b[0m`,
    ipv6: (s: string) => `\x1b[35m[IPV6]${s}[/IPV6]\x1b[0m`,

    // URLs - 34番下線付き
    url: (s: string) => `\x1b[34;4m[URL]${s}[/URL]\x1b[0m`,

    // HTTP - 32〜31番（緑〜赤）
    httpMethod: (s: string) => `\x1b[32;1m[METHOD]${s}[/METHOD]\x1b[0m`,
    httpStatus2xx: (s: string) => `\x1b[32m[HTTP2XX]${s}[/HTTP2XX]\x1b[0m`,
    httpStatus3xx: (s: string) => `\x1b[33m[HTTP3XX]${s}[/HTTP3XX]\x1b[0m`,
    httpStatus4xx: (s: string) => `\x1b[31m[HTTP4XX]${s}[/HTTP4XX]\x1b[0m`,
    httpStatus5xx: (s: string) => `\x1b[31;1m[HTTP5XX]${s}[/HTTP5XX]\x1b[0m`,
    httpStatusDefault: (s: string) => `\x1b[37m[HTTPDEF]${s}[/HTTPDEF]\x1b[0m`,

    // Log Levels - 異なる背景色
    logLevel: {
      debug: (s: string) => `\x1b[90m[DEBUG]${s}[/DEBUG]\x1b[0m`,
      info: (s: string) => `\x1b[36m[INFO]${s}[/INFO]\x1b[0m`,
      warn: (s: string) => `\x1b[33m[WARN]${s}[/WARN]\x1b[0m`,
      error: (s: string) => `\x1b[31m[ERROR]${s}[/ERROR]\x1b[0m`,
      fatal: (s: string) => `\x1b[41;37m[FATAL]${s}[/FATAL]\x1b[0m`,
    },

    // Data types - 各種データ型
    string: (s: string) => `\x1b[32m[STR]${s}[/STR]\x1b[0m`,
    stringError: (s: string) => `\x1b[31m[STRERR]${s}[/STRERR]\x1b[0m`,
    escapeSequence: (s: string) => `\x1b[33m[ESC]${s}[/ESC]\x1b[0m`,
    number: (s: string) => `\x1b[33m[NUM]${s}[/NUM]\x1b[0m`,
    boolean: (s: string) => `\x1b[35m[BOOL]${s}[/BOOL]\x1b[0m`,
    null: (s: string) => `\x1b[90m[NULL]${s}[/NULL]\x1b[0m`,
    undefined: (s: string) => `\x1b[90m[UNDEF]${s}[/UNDEF]\x1b[0m`,
    nan: (s: string) => `\x1b[31m[NAN]${s}[/NAN]\x1b[0m`,
    infinity: (s: string) => `\x1b[33m[INF]${s}[/INF]\x1b[0m`,

    // Key-Value - 36番（シアン）
    keyValueKey: (s: string) => `\x1b[36m[KEY]${s}[/KEY]\x1b[0m`,
    keyValueEquals: (s: string) => `\x1b[90m[EQ]${s}[/EQ]\x1b[0m`,
    identifier: (s: string) => `\x1b[37m[ID]${s}[/ID]\x1b[0m`,

    // Source Info - 32/33/90番
    sourceFile: (s: string) => `\x1b[32m[FILE]${s}[/FILE]\x1b[0m`,
    sourceLineNumber: (s: string) => `\x1b[33m[LINE]${s}[/LINE]\x1b[0m`,
    sourceColumnNumber: (s: string) => `\x1b[90m[COL]${s}[/COL]\x1b[0m`,

    // Symbols - 37番（白）
    symbol: (s: string) => `\x1b[37m[SYM]${s}[/SYM]\x1b[0m`,
    ellipsis: (s: string) => `\x1b[90m[DOTS]${s}[/DOTS]\x1b[0m`,

    // Text - デフォルト
    text: (s: string) => `\x1b[37m[TXT]${s}[/TXT]\x1b[0m`,
    objectArrayPattern: (s: string) => `\x1b[90m[OBJ]${s}[/OBJ]\x1b[0m`,
  },
};
