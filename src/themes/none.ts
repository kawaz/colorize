import type { Theme } from "./types";

// 無色テーマ（色付けを無効化）
export const noneTheme: Theme = {
  name: "none",
  colors: {
    // すべて無色（元のテキストをそのまま返す）
    timestamp: (s: string) => s,
    timestampRelative: (s: string) => s,
    logLevel: {
      trace: (s: string) => s,
      debug: (s: string) => s,
      info: (s: string) => s,
      warn: (s: string) => s,
      error: (s: string) => s,
      fatal: (s: string) => s,
      default: (s: string) => s,
    },
    httpMethod: (s: string) => s,
    httpStatus1xx: (s: string) => s,
    httpStatus2xx: (s: string) => s,
    httpStatus3xx: (s: string) => s,
    httpStatus4xx: (s: string) => s,
    httpStatus5xx: (s: string) => s,
    httpStatusDefault: (s: string) => s,
    url: (s: string) => s,
    ipAddress: (s: string) => s,
    ipAddress6: (s: string) => s,
    sourceInfo: (s: string) => s,
    sourceLine: (s: string) => s,
    keyValueKey: (s: string) => s,
    string: (s: string) => s,
    jsonString: (s: string) => s,
    quoteMark: (s: string) => s,
    escapeSequence: (s: string) => s,
    number: (s: string) => s,
    boolean: (s: string) => s,
    null: (s: string) => s,
    undefined: (s: string) => s,
    identifier: (s: string) => s,
    text: (s: string) => s,
    objectArrayPattern: (s: string) => s,
  },
};
