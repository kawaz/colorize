#!/usr/bin/env bun

import chalk from "chalk";
import { getBuildInfo } from "./build-info.macro" with { type: "macro" };
import { LogLexer } from "./lexer";
import { processMultiline } from "./multiline";
import { logParser } from "./parser";
import { themeInfo } from "./theme";
import { deduplicateTimestamps } from "./timestamp-dedup";
import { createColorizeVisitor } from "./visitor";

// ビルド時に情報を埋め込む
const BUILD_INFO = getBuildInfo();

// デフォルトで色出力を有効化（パイプ経由でも色を出力）
// main関数内でオプションに応じて上書きされる
if (!process.env.FORCE_COLOR) {
  process.env.FORCE_COLOR = "1";
}

export interface Options {
  joinMultiline: boolean;
  deduplicateTimestamps: boolean;
  relativeTime: boolean;
  lineBuffered: boolean;
  forceColor: boolean;
  help: boolean;
  version: boolean;
  theme?: string;
}

export function parseArgs(args: string[]): Options {
  const options: Options = {
    joinMultiline: false,
    deduplicateTimestamps: false,  // デフォルトでOFF
    relativeTime: false,
    lineBuffered: true, // デフォルトで有効
    forceColor: false,
    help: false,
    version: false,
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
      case "--no-theme":
        options.theme = undefined;
        break;
      case "--help":
      case "-h":
        options.help = true;
        break;
      case "--version":
      case "-V":
        options.version = true;
        break;
    }
  }
}

function showVersion() {
  // シンプルなバージョン表示（一般的なツールと同様）
  const dirtyFlag = BUILD_INFO.gitDirty ? '-dirty' : '';
  console.log(`${BUILD_INFO.name} version ${BUILD_INFO.version} (${BUILD_INFO.gitCommit}${dirtyFlag})`);
}

function showVersionVerbose() {
  // 詳細なバージョン情報
  const dirtyFlag = BUILD_INFO.gitDirty ? '-dirty' : '';
  // ISO文字列をDateに変換して再度ISOStringで出力（UTC時刻に正規化）
  const commitDate = BUILD_INFO.gitCommitDate !== 'unknown' 
    ? new Date(BUILD_INFO.gitCommitDate).toISOString() 
    : 'unknown';
  const buildDate = new Date(BUILD_INFO.buildDate).toISOString();
  
  console.log(`${chalk.bold(BUILD_INFO.name)}`);
  console.log(`  Version:     ${BUILD_INFO.version}`);
  console.log(`  Commit:      ${BUILD_INFO.gitCommit}${dirtyFlag} (${BUILD_INFO.gitBranch})`);
  console.log(`  Commit date: ${commitDate}`);
  console.log(`  Build date:  ${buildDate}`);
  console.log(`  Built with:  Bun v${BUILD_INFO.bunVersion}`);
}

function showHelp() {
  console.log(`
${chalk.bold(BUILD_INFO.name)} v${BUILD_INFO.version} - ${BUILD_INFO.description}

${chalk.bold("Usage:")}
  cat app.log | colorize [options]
  tail -f app.log | colorize -c | less -R

${chalk.bold("Options:")}
  -j, --join-multiline       Join multiline log entries (disables line buffering)
  --dedup-timestamps         Remove duplicate timestamps (e.g., kubectl --timestamps)
  -r, --relative-time        Show relative time next to timestamps (e.g., 2.5h)
  --line-buffered            Enable line buffering for real-time output (default: ON)
  -c, --force-color          Force color output even when piped or redirected
  -t, --theme <name>         Color theme (use -t without name to list themes)
  -h, --help                 Show this help message
  -V, --version              Show version information

${chalk.bold("Environment Variables:")}
  COLORIZE_OPTIONS   Set default options (e.g., export COLORIZE_OPTIONS="-r -t github")
                     Command-line arguments override environment settings
                     All options support --no- prefix to disable/unset
                     (e.g., --no-theme, --no-dedup-timestamps)
`);
}

function processLine(line: string, options: Options, visitor: ReturnType<typeof createColorizeVisitor>): string {
  try {
    // 字句解析
    const lexResult = LogLexer.tokenize(line);

    // Lexer errors are silently ignored

    // 構文解析
    logParser.input = lexResult.tokens;
    const cst = logParser.logContent();

    // Parser errors are silently ignored

    // 色付け
    return visitor.visit(cst);
  } catch (error) {
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

  if (options.version) {
    // --version --verbose または --version -v で詳細表示
    const verboseIndex = process.argv.indexOf('--verbose');
    const vIndex = process.argv.indexOf('-v');
    if (verboseIndex !== -1 || vIndex !== -1) {
      showVersionVerbose();
    } else {
      showVersion();
    }
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
