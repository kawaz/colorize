import chalk from "chalk";
import type { Theme } from "./types";

// GitHub Dark テーマ
export const githubDarkTheme: Theme = {
  name: "github-dark",
  colors: {
    timestamp: chalk.hex("#8b949e"), // gray
    timestampSecondary: chalk.hex("#7ee83f"), // green
    relativeTime: chalk.dim.hex("#6e7681"), // darker gray

    ipv4: chalk.hex("#79c0ff"), // blue
    ipv6: chalk.hex("#79c0ff"), // blue

    url: chalk.hex("#58a6ff").underline, // link blue

    httpMethod: chalk.hex("#d2a8ff").bold, // purple
    httpStatus2xx: chalk.hex("#7ee83f"), // green
    httpStatus3xx: chalk.hex("#58a6ff"), // blue
    httpStatus4xx: chalk.hex("#ffa657"), // orange
    httpStatus5xx: chalk.hex("#ff7b72").bold, // red
    httpStatusDefault: chalk.hex("#c9d1d9"), // light gray

    logLevel: {
      debug: chalk.hex("#8b949e"), // gray
      info: chalk.hex("#58a6ff"), // blue
      warn: chalk.hex("#ffa657"), // orange
      error: chalk.hex("#ff7b72"), // red
      fatal: chalk.hex("#ff7b72").bold.underline,
    },

    string: chalk.hex("#a5d6ff"), // light blue
    stringError: chalk.hex("#ff7b72"),
    escapeSequence: chalk.hex("#ffa657"), // orange
    number: chalk.hex("#79c0ff"), // blue
    boolean: chalk.hex("#79c0ff"), // blue
    null: chalk.hex("#d2a8ff"), // purple
    undefined: chalk.hex("#d2a8ff"), // purple
    nan: chalk.hex("#ff7b72"),
    infinity: chalk.hex("#79c0ff"),

    keyValueKey: chalk.hex("#7ee83f"), // green
    keyValueEquals: chalk.hex("#8b949e"),
    identifier: chalk.hex("#c9d1d9"), // light gray

    sourceFile: chalk.hex("#d2a8ff"), // purple
    sourceLineNumber: chalk.hex("#79c0ff"), // blue
    sourceColumnNumber: chalk.hex("#8b949e"),

    symbol: chalk.hex("#c9d1d9"),
    ellipsis: chalk.hex("#c9d1d9"),

    text: chalk.hex("#c9d1d9"), // light gray
    objectArrayPattern: chalk.hex("#8b949e"),
  },
};
