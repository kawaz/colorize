import chalk from "chalk";
import type { Theme } from "./types";

// Solarized Dark テーマ
export const solarizedDarkTheme: Theme = {
  name: "solarized-dark",
  colors: {
    timestamp: chalk.hex("#586e75"), // base01
    timestampSecondary: chalk.hex("#859900"), // green
    relativeTime: chalk.dim.hex("#66d9ef"), // 薄いシアン

    ipv4: chalk.hex("#6c71c4"), // violet
    ipv6: chalk.hex("#6c71c4"), // violet

    url: chalk.hex("#2aa198").underline, // cyan

    httpMethod: chalk.hex("#859900").bold, // green
    httpStatus2xx: chalk.hex("#859900"), // green
    httpStatus3xx: chalk.hex("#b58900"), // yellow
    httpStatus4xx: chalk.hex("#cb4b16"), // orange
    httpStatus5xx: chalk.hex("#dc322f").bold, // red
    httpStatusDefault: chalk.hex("#839496"), // base0

    logLevel: {
      debug: chalk.hex("#586e75"), // base01
      info: chalk.hex("#268bd2"), // blue
      warn: chalk.hex("#b58900"), // yellow
      error: chalk.hex("#dc322f"), // red
      fatal: chalk.hex("#dc322f").bold.underline,
    },

    string: chalk.hex("#2aa198"), // cyan
    stringError: chalk.hex("#dc322f"),
    escapeSequence: chalk.hex("#cb4b16"), // orange
    number: chalk.hex("#d33682"), // magenta
    boolean: chalk.hex("#d33682"), // magenta
    null: chalk.hex("#b58900"), // yellow
    undefined: chalk.hex("#b58900"), // yellow
    nan: chalk.hex("#dc322f"),
    infinity: chalk.hex("#d33682"),

    keyValueKey: chalk.hex("#268bd2"), // blue
    keyValueEquals: chalk.hex("#586e75"),
    identifier: chalk.hex("#839496"), // base0

    sourceFile: chalk.hex("#859900"), // green
    sourceLineNumber: chalk.hex("#b58900"), // yellow
    sourceColumnNumber: chalk.hex("#586e75"),

    symbol: chalk.hex("#839496"),
    ellipsis: chalk.hex("#839496"),

    text: chalk.hex("#839496"), // base0
    objectArrayPattern: chalk.hex("#586e75"),
  },
};
