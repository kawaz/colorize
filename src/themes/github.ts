import chalk from 'chalk';
import { Theme } from './types';

// GitHub テーマ（GitHub のシンタックスハイライトに基づく）
export const githubTheme: Theme = {
  name: 'github',
  colors: {
    timestamp: chalk.hex('#6a737d'),  // gray
    timestampSecondary: chalk.hex('#22863a'),  // green
    relativeTime: chalk.dim.hex('#586069'),  // darker gray

    ipv4: chalk.hex('#005cc5'),  // blue
    ipv6: chalk.hex('#005cc5'),  // blue

    url: chalk.hex('#0366d6').underline,  // link blue

    httpMethod: chalk.hex('#6f42c1').bold,  // purple
    httpStatus2xx: chalk.hex('#22863a'),  // green
    httpStatus3xx: chalk.hex('#0366d6'),  // blue
    httpStatus4xx: chalk.hex('#e36209'),  // orange
    httpStatus5xx: chalk.hex('#d73a49').bold,  // red
    httpStatusDefault: chalk.hex('#24292e'),  // black

    logLevel: {
      debug: chalk.hex('#6a737d'),  // gray
      info: chalk.hex('#0366d6'),  // blue
      warn: chalk.hex('#e36209'),  // orange
      error: chalk.hex('#d73a49'),  // red
      fatal: chalk.hex('#d73a49').bold.underline,
    },

    string: chalk.hex('#032f62'),  // dark blue
    stringError: chalk.hex('#d73a49'),
    escapeSequence: chalk.hex('#e36209'),  // orange
    number: chalk.hex('#005cc5'),  // blue
    boolean: chalk.hex('#005cc5'),  // blue
    null: chalk.hex('#6f42c1'),  // purple
    undefined: chalk.hex('#6f42c1'),  // purple
    nan: chalk.hex('#d73a49'),
    infinity: chalk.hex('#005cc5'),

    keyValueKey: chalk.hex('#22863a'),  // green
    keyValueEquals: chalk.hex('#6a737d'),
    identifier: chalk.hex('#24292e'),  // black

    sourceFile: chalk.hex('#6f42c1'),  // purple
    sourceLineNumber: chalk.hex('#005cc5'),  // blue
    sourceColumnNumber: chalk.hex('#6a737d'),

    symbol: chalk.hex('#24292e'),
    ellipsis: chalk.hex('#24292e'),

    text: chalk.hex('#24292e'),  // black
    objectArrayPattern: chalk.hex('#6a737d'),
  },
};