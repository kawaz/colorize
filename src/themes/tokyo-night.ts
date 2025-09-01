import chalk from 'chalk';
import { Theme } from './types';

// Tokyo Night テーマ
export const tokyoNightTheme: Theme = {
  name: 'tokyo-night',
  colors: {
    timestamp: chalk.hex('#565f89'),  // comment
    timestampSecondary: chalk.hex('#9ece6a'),  // green
    relativeTime: chalk.dim.hex('#66d9ef'),  // 薄いシアン

    ipv4: chalk.hex('#bb9af7'),  // purple
    ipv6: chalk.hex('#bb9af7'),  // purple

    url: chalk.hex('#7dcfff').underline,  // cyan

    httpMethod: chalk.hex('#9ece6a').bold,  // green
    httpStatus2xx: chalk.hex('#9ece6a'),  // green
    httpStatus3xx: chalk.hex('#e0af68'),  // yellow
    httpStatus4xx: chalk.hex('#ff9e64'),  // orange
    httpStatus5xx: chalk.hex('#f7768e').bold,  // red
    httpStatusDefault: chalk.hex('#c0caf5'),  // foreground

    logLevel: {
      debug: chalk.hex('#565f89'),  // comment
      info: chalk.hex('#7aa2f7'),  // blue
      warn: chalk.hex('#e0af68'),  // yellow
      error: chalk.hex('#f7768e'),  // red
      fatal: chalk.hex('#f7768e').bold.underline,
    },

    string: chalk.hex('#9ece6a'),  // green
    stringError: chalk.hex('#f7768e'),
    escapeSequence: chalk.hex('#ff9e64'),  // orange
    number: chalk.hex('#ff9e64'),  // orange
    boolean: chalk.hex('#ff9e64'),  // orange
    null: chalk.hex('#bb9af7'),  // purple
    undefined: chalk.hex('#bb9af7'),  // purple
    nan: chalk.hex('#f7768e'),
    infinity: chalk.hex('#ff9e64'),

    keyValueKey: chalk.hex('#7aa2f7'),  // blue
    keyValueEquals: chalk.hex('#565f89'),
    identifier: chalk.hex('#c0caf5'),  // foreground

    sourceFile: chalk.hex('#73daca'),  // light green
    sourceLineNumber: chalk.hex('#e0af68'),  // yellow
    sourceColumnNumber: chalk.hex('#565f89'),

    symbol: chalk.hex('#c0caf5'),
    ellipsis: chalk.hex('#c0caf5'),

    text: chalk.hex('#c0caf5'),  // foreground
    objectArrayPattern: chalk.hex('#565f89'),
  },
};