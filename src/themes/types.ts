// テーマの型定義
export interface Theme {
  name: string;
  colors: {
    // タイムスタンプ
    timestamp: (text: string) => string;
    timestampSecondary: (text: string) => string;  // 2回目以降のタイムスタンプ
    relativeTime: (text: string) => string;  // 相対時間表記

    // IPアドレス
    ipv4: (text: string) => string;
    ipv6: (text: string) => string;

    // URL
    url: (text: string) => string;

    // HTTPメソッド・ステータス
    httpMethod: (text: string) => string;
    httpStatus2xx: (text: string) => string;
    httpStatus3xx: (text: string) => string;
    httpStatus4xx: (text: string) => string;
    httpStatus5xx: (text: string) => string;
    httpStatusDefault: (text: string) => string;

    // ログレベル
    logLevel: {
      debug: (text: string) => string;
      info: (text: string) => string;
      warn: (text: string) => string;
      error: (text: string) => string;
      fatal: (text: string) => string;
    };

    // リテラル
    string: (text: string) => string;
    stringError?: (text: string) => string;
    escapeSequence: (text: string) => string;
    number: (text: string) => string;
    boolean: (text: string) => string;
    null: (text: string) => string;
    undefined: (text: string) => string;
    nan: (text: string) => string;
    infinity: (text: string) => string;

    // 構造
    keyValueKey: (text: string) => string;
    keyValueEquals: (text: string) => string;
    identifier: (text: string) => string;

    // SourceInfo
    sourceFile: (text: string) => string;
    sourceLineNumber: (text: string) => string;
    sourceColumnNumber: (text: string) => string;

    // 記号
    symbol: (text: string) => string;
    ellipsis: (text: string) => string;

    // その他テキスト
    text: (text: string) => string;

    // [Object ...] のようなパターン
    objectArrayPattern: (text: string) => string;
  };
}