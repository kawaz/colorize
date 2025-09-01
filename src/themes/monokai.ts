import chalk from 'chalk';
import { Theme } from './types';

// Monokai テーマ
export const monokaiTheme: Theme = {
  name: 'monokai',
  colors: {
    timestamp: chalk.hex('#75715e'),  // コメント色
    timestampSecondary: chalk.hex('#a6e22e'),  // 緑
    relativeTime: chalk.dim.hex('#66d9ef'),  // 薄いシアン

    ipv4: chalk.hex('#ae81ff'),  // 紫
    ipv6: chalk.hex('#ae81ff'),  // 紫

    url: chalk.hex('#66d9ef').underline,  // シアン

    httpMethod: chalk.hex('#f92672').bold,  // ピンク
    httpStatus2xx: chalk.hex('#a6e22e'),  // 緑
    httpStatus3xx: chalk.hex('#e6db74'),  // 黄色
    httpStatus4xx: chalk.hex('#fd971f'),  // オレンジ
    httpStatus5xx: chalk.hex('#f92672').bold,  // ピンク
    httpStatusDefault: chalk.hex('#f8f8f2'),  // 白

    logLevel: {
      debug: chalk.hex('#75715e'),  // コメント色
      info: chalk.hex('#66d9ef'),  // シアン
      warn: chalk.hex('#e6db74'),  // 黄色
      error: chalk.hex('#f92672'),  // ピンク
      fatal: chalk.hex('#f92672').bold.underline,
    },

    string: chalk.hex('#e6db74'),  // 黄色
    stringError: chalk.hex('#f92672'),
    escapeSequence: chalk.hex('#fd971f'),  // オレンジ
    number: chalk.hex('#ae81ff'),  // 紫
    boolean: chalk.hex('#ae81ff'),  // 紫
    null: chalk.hex('#ae81ff'),  // 紫
    undefined: chalk.hex('#ae81ff'),  // 紫
    nan: chalk.hex('#f92672'),
    infinity: chalk.hex('#ae81ff'),

    keyValueKey: chalk.hex('#66d9ef'),  // シアン
    keyValueEquals: chalk.hex('#75715e'),
    identifier: chalk.hex('#f8f8f2'),  // 白

    sourceFile: chalk.hex('#a6e22e'),  // 緑
    sourceLineNumber: chalk.hex('#e6db74'),  // 黄色
    sourceColumnNumber: chalk.hex('#75715e'),

    symbol: chalk.hex('#f8f8f2'),
    ellipsis: chalk.hex('#f8f8f2'),

    text: chalk.hex('#f8f8f2'),  // 白
    objectArrayPattern: chalk.hex('#75715e'),
  },
};