#!/usr/bin/env bun

import chalk from "chalk";
import { LogLexer } from "./src/lexer";
import { processMultiline } from "./src/multiline";
import { logParser } from "./src/parser";
import { themeInfo } from "./src/theme";
import { deduplicateTimestamps } from "./src/timestamp-dedup";
import { createColorizeVisitor } from "./src/visitor";

// デフォルトで色出力を有効化（パイプ経由でも色を出力）
// main関数内でオプションに応じて上書きされる
if (!process.env.FORCE_COLOR) {
  process.env.FORCE_COLOR = "1";
}

interface Options {
  joinMultiline: boolean;
  deduplicateTimestamps: boolean;
  relativeTime: boolean;
  lineBuffered: boolean;
  forceColor: boolean;
  verbose: boolean;
  help: boolean;
  theme?: string;
}

function parseArgs(args: string[]): Options {
  const options: Options = {
    joinMultiline: false,
    deduplicateTimestamps: false,  // デフォルトでOFF
    relativeTime: false,
    lineBuffered: true, // デフォルトで有効
    forceColor: false,
    verbose: false,
    help: false,
  };

  // 環境変数からオプションを読み込み
  const envOptions = process.env.COLORIZE_OPTIONS;
  if (envOptions) {
    const envArgs = envOptions.trim().split(/\s+/);
    parseArgsInto(envArgs, options);
  }

  // コマンドライン引数を処理（環境変数より優先）
  parseArgsInto(args, options);

  return options;
}

function parseArgsInto(args: string[], options: Options): void {
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case "--join-multiline":
      case "-j":
        options.joinMultiline = true;
        break;
      case "--no-join-multiline":
        options.joinMultiline = false;
        break;
      case "--dedup-timestamps":
        options.deduplicateTimestamps = true;
        break;
      case "--no-dedup-timestamps":
        options.deduplicateTimestamps = false;
        break;
      case "--relative-time":
      case "-r":
        options.relativeTime = true;
        break;
      case "--no-relative-time":
        options.relativeTime = false;
        break;
      case "--line-buffered":
        options.lineBuffered = true;
        break;
      case "--no-line-buffered":
        options.lineBuffered = false;
        break;
      case "--force-color":
      case "-c":
        options.forceColor = true;
        break;
      case "--no-force-color":
        options.forceColor = false;
        break;
      case "--theme":
      case "-t":
        if (i + 1 < args.length && !args[i + 1].startsWith("-")) {
          options.theme = args[++i];
        } else {
          // テーマ未指定の場合は利用可能なテーマを表示
          console.log(chalk.bold("Available themes:"));
          const maxNameLength = Math.max(...Object.keys(themeInfo).map((name) => name.length));
          for (const [name, description] of Object.entries(themeInfo)) {
            const paddedName = name.padEnd(maxNameLength);
            console.log(`  • ${paddedName}  - ${description}`);
          }
          console.log("\nUsage: colorize -t <theme-name>");
          process.exit(0);
        }
        break;
      case "--verbose":
      case "-v":
        options.verbose = true;
        break;
      case "--no-verbose":
        options.verbose = false;
        break;
      case "--help":
      case "-h":
        options.help = true;
        break;
    }
  }
}

function showHelp() {
  console.log(`
${chalk.bold("colorize")} - Log colorization tool using Chevrotain parser

${chalk.bold("Usage:")}
  cat logfile.txt | colorize [options]
  colorize < logfile.txt [options]
  tail -f app.log | colorize [options]

${chalk.bold("Options:")}
  -j, --join-multiline       Join multiline log entries (disables line buffering)
  --dedup-timestamps         Remove duplicate timestamps (e.g., kubectl --timestamps)
  -r, --relative-time        Show relative time next to timestamps (e.g., 2.5h)
  --line-buffered            Enable line buffering for real-time output (default: ON)
  -c, --force-color          Force color output even when piped or redirected
  -t, --theme <name>         Color theme (use -t without name to list themes)
  -v, --verbose              Show debug information
  -h, --help                 Show this help message

${chalk.bold("Examples:")}
  ${chalk.gray("# Basic usage")}
  cat docs/sample-log-antenna-server.txt | colorize

  ${chalk.gray("# Keep multiline structure")}
  cat docs/sample-log-antenna-gatherer.txt | colorize -n

  ${chalk.gray("# Real-time log monitoring")}
  tail -f /var/log/app.log | colorize

${chalk.bold("Environment Variables:")}
  COLORIZE_OPTIONS   Set default options (e.g., export COLORIZE_OPTIONS="-r -t github")
                     Command-line arguments override environment settings
`);
}

function processLine(line: string, options: Options, visitor: ReturnType<typeof createColorizeVisitor>): string {
  try {
    // 字句解析
    const lexResult = LogLexer.tokenize(line);

    if (options.verbose && lexResult.errors.length > 0) {
      console.error(chalk.red("Lexer errors:"), lexResult.errors);
    }

    // 構文解析
    logParser.input = lexResult.tokens;
    const cst = logParser.logContent();

    if (options.verbose && logParser.errors.length > 0) {
      console.error(chalk.red("Parser errors:"), logParser.errors);
    }

    // 色付け
    return visitor.visit(cst);
  } catch (error) {
    if (options.verbose) {
      console.error(chalk.red("Processing error:"), error);
    }
    // エラーが発生した場合は元の行を返す
    return line;
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  // 色出力の強制設定
  if (options.forceColor) {
    process.env.FORCE_COLOR = "3"; // 最高レベルの色サポート
    chalk.level = 3; // chalkにも明示的に設定
  }

  // Visitorインスタンスを作成（相対時間オプションとテーマを渡す）
  const visitor = createColorizeVisitor({ 
    showRelativeTime: options.relativeTime,
    theme: options.theme 
  });

  try {
    // ラインバッファリングモードの自動判定
    // マルチライン処理が有効な場合はバッチモードを強制
    const useLineBuffering = options.lineBuffered && !options.joinMultiline;

    if (useLineBuffering) {
      // Bunの標準入力を行単位で読み込む
      for await (const line of console) {
        let processedLine = line;

        // タイムスタンプ重複削除
        if (options.deduplicateTimestamps) {
          processedLine = deduplicateTimestamps(processedLine, { enabled: true });
        }

        // 色付け処理
        if (processedLine.trim() === "") {
          console.log(processedLine);
        } else {
          console.log(processLine(processedLine, options, visitor));
        }
      }
    } else {
      // 通常モード（一括読み込み）
      const input = await Bun.stdin.text();

      if (!input) {
        if (options.verbose) {
          console.error(chalk.yellow("No input received"));
        }
        process.exit(0);
      }

      // タイムスタンプ重複削除
      let processed = input;
      if (options.deduplicateTimestamps) {
        processed = deduplicateTimestamps(processed, { enabled: true });
      }

      // マルチライン処理
      processed = processMultiline(processed, {
        joinMultiline: options.joinMultiline,
      });

      // 行ごとに処理
      const lines = processed.split("\n");
      const colorizedLines: string[] = [];

      for (const line of lines) {
        if (line.trim() === "") {
          // 空行はそのまま
          colorizedLines.push(line);
        } else {
          colorizedLines.push(processLine(line, options, visitor));
        }
      }

      // 出力
      console.log(colorizedLines.join("\n"));
    }
  } catch (error) {
    console.error(chalk.red("Error:"), error);
    process.exit(1);
  }
}

// エラーハンドリング
process.on("uncaughtException", (err) => {
  console.error(chalk.red("Uncaught exception:"), err.message);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error(chalk.red("Unhandled rejection at:"), promise, chalk.red("reason:"), reason);
  process.exit(1);
});

// メイン処理実行
main().catch((err) => {
  console.error(chalk.red("Fatal error:"), err);
  process.exit(1);
});
