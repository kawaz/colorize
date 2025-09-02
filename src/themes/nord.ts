import chalk from "chalk";
import type { Theme } from "./types";

// Nord テーマ
export const nordTheme: Theme = {
  name: "nord",
  colors: {
    timestamp: chalk.hex("#4c566a"), // nord3
    timestampSecondary: chalk.hex("#a3be8c"), // nord14 green
    relativeTime: chalk.dim.hex("#66d9ef"), // 薄いシアン

    ipv4: chalk.hex("#b48ead"), // nord15 purple
    ipv6: chalk.hex("#b48ead"), // nord15 purple

    url: chalk.hex("#88c0d0").underline, // nord8 cyan

    httpMethod: chalk.hex("#a3be8c").bold, // nord14 green
    httpStatus2xx: chalk.hex("#a3be8c"), // nord14 green
    httpStatus3xx: chalk.hex("#ebcb8b"), // nord13 yellow
    httpStatus4xx: chalk.hex("#d08770"), // nord12 orange
    httpStatus5xx: chalk.hex("#bf616a").bold, // nord11 red
    httpStatusDefault: chalk.hex("#d8dee9"), // nord4

    logLevel: {
      debug: chalk.hex("#4c566a"), // nord3
      info: chalk.hex("#81a1c1"), // nord9 blue
      warn: chalk.hex("#ebcb8b"), // nord13 yellow
      error: chalk.hex("#bf616a"), // nord11 red
      fatal: chalk.hex("#bf616a").bold.underline,
    },

    string: chalk.hex("#a3be8c"), // nord14 green
    stringError: chalk.hex("#bf616a"),
    escapeSequence: chalk.hex("#d08770"), // nord12 orange
    number: chalk.hex("#b48ead"), // nord15 purple
    boolean: chalk.hex("#81a1c1"), // nord9 blue
    null: chalk.hex("#d08770"), // nord12 orange
    undefined: chalk.hex("#d08770"), // nord12 orange
    nan: chalk.hex("#bf616a"),
    infinity: chalk.hex("#b48ead"),

    keyValueKey: chalk.hex("#81a1c1"), // nord9 blue
    keyValueEquals: chalk.hex("#4c566a"),
    identifier: chalk.hex("#d8dee9"), // nord4

    sourceFile: chalk.hex("#8fbcbb"), // nord7 teal
    sourceLineNumber: chalk.hex("#ebcb8b"), // nord13 yellow
    sourceColumnNumber: chalk.hex("#4c566a"),

    symbol: chalk.hex("#d8dee9"),
    ellipsis: chalk.hex("#d8dee9"),

    text: chalk.hex("#d8dee9"), // nord4
    objectArrayPattern: chalk.hex("#4c566a"),
  },
};
