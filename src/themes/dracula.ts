import chalk from 'chalk';
import { Theme } from './types';

// Dracula テーマ
export const draculaTheme: Theme = {
  name: 'dracula',
  colors: {
    timestamp: chalk.hex('#6272a4'),  // コメント色
    timestampSecondary: chalk.hex('#50fa7b'),  // 緑
    relativeTime: chalk.dim.hex('#66d9ef'),  // 薄いシアン

    ipv4: chalk.hex('#bd93f9'),  // 紫
    ipv6: chalk.hex('#bd93f9'),  // 紫

    url: chalk.hex('#8be9fd').underline,  // シアン

    httpMethod: chalk.hex('#ff79c6').bold,  // ピンク
    httpStatus2xx: chalk.hex('#50fa7b'),  // 緑
    httpStatus3xx: chalk.hex('#f1fa8c'),  // 黄色
    httpStatus4xx: chalk.hex('#ffb86c'),  // オレンジ
    httpStatus5xx: chalk.hex('#ff5555').bold,  // 赤
    httpStatusDefault: chalk.hex('#f8f8f2'),  // 白

    logLevel: {
      debug: chalk.hex('#6272a4'),  // コメント色
      info: chalk.hex('#8be9fd'),  // シアン
      warn: chalk.hex('#f1fa8c'),  // 黄色
      error: chalk.hex('#ff5555'),  // 赤
      fatal: chalk.hex('#ff5555').bold.underline,
    },

    string: chalk.hex('#f1fa8c'),  // 黄色
    stringError: chalk.hex('#ff5555'),
    escapeSequence: chalk.hex('#ffb86c'),  // オレンジ
    number: chalk.hex('#bd93f9'),  // 紫
    boolean: chalk.hex('#bd93f9'),  // 紫
    null: chalk.hex('#ff79c6'),  // ピンク
    undefined: chalk.hex('#ff79c6'),  // ピンク
    nan: chalk.hex('#ff5555'),
    infinity: chalk.hex('#bd93f9'),

    keyValueKey: chalk.hex('#8be9fd'),  // シアン
    keyValueEquals: chalk.hex('#6272a4'),
    identifier: chalk.hex('#f8f8f2'),  // 白

    sourceFile: chalk.hex('#50fa7b'),  // 緑
    sourceLineNumber: chalk.hex('#f1fa8c'),  // 黄色
    sourceColumnNumber: chalk.hex('#6272a4'),

    symbol: chalk.hex('#f8f8f2'),
    ellipsis: chalk.hex('#f8f8f2'),

    text: chalk.hex('#f8f8f2'),  // 白
    objectArrayPattern: chalk.hex('#6272a4'),
  },
};