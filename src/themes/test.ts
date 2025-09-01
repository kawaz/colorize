import chalk from 'chalk';
import { Theme } from './types';

// テスト用テーマ（詳細な区別）
export const testTheme: Theme = {
  name: 'test',
  colors: {
    timestamp: chalk.gray,
    timestampSecondary: chalk.green,  // 文字列と同じ色
    relativeTime: chalk.dim.cyan,  // 相対時間は薄いシアン

    // IPv4とIPv6を明確に区別
    ipv4: chalk.magenta,
    ipv6: chalk.cyan,

    url: chalk.blue.underline,

    httpMethod: chalk.green.bold,
    httpStatus2xx: chalk.green,
    httpStatus3xx: chalk.yellow,
    httpStatus4xx: chalk.red,
    httpStatus5xx: chalk.red.bold,
    httpStatusDefault: chalk.white,

    logLevel: {
      debug: chalk.gray,
      info: chalk.blue,
      warn: chalk.yellow,
      error: chalk.red,
      fatal: chalk.red.bold.underline,
    },

    string: chalk.green,
    stringError: chalk.red,
    escapeSequence: chalk.yellow,
    number: chalk.cyan,
    boolean: chalk.yellow,
    null: chalk.magenta,
    undefined: chalk.magenta,
    nan: chalk.red,
    infinity: chalk.yellow,

    keyValueKey: chalk.cyan,
    keyValueEquals: chalk.gray,
    identifier: chalk.white,

    sourceFile: chalk.cyan,
    sourceLineNumber: chalk.yellow,
    sourceColumnNumber: chalk.gray,

    symbol: chalk.white,
    ellipsis: chalk.white,

    text: chalk.white,
    objectArrayPattern: chalk.gray,
  },
};