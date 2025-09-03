#!/usr/bin/env node

import * as fs from "fs";
import * as readline from "readline";
import { Command } from "commander";
import { version } from "../package.json";

// 新しいシステムのインポート
import { RuleEngine } from "./rule-engine";
import { DynamicLexer } from "./lexer-dynamic";
import { GenericParser } from "./parser-generic";
import { GenericVisitor } from "./visitor-generic";
import { ConfigLoader } from "./config-loader";
import { ThemeResolver } from "./theme-resolver";
import { DebugOutputGenerator } from "./debug-output";

interface CliOptions {
  theme?: string;
  relativeTime?: boolean;
  timestampFirst?: boolean;
  timestampFormat?: string;
  multiline?: boolean;
  debug?: boolean;
  debugJson?: boolean;
  listThemes?: boolean;
}

class ColorizeCli {
  private ruleEngine: RuleEngine | null = null;
  private dynamicLexer: DynamicLexer | null = null;
  private parser: GenericParser | null = null;
  private visitor: GenericVisitor | null = null;
  private debugGenerator: DebugOutputGenerator | null = null;
  private themeResolver = new ThemeResolver();
  private configLoader = new ConfigLoader();

  constructor(private options: CliOptions) {}

  /**
   * システムを初期化
   */
  async initialize(): Promise<void> {
    // 設定を読み込み
    const config = await this.configLoader.loadConfig();

    // ルールエンジンを初期化
    this.ruleEngine = new RuleEngine({ tokens: config.tokens });
    const tokenDefinitions = this.ruleEngine.buildTokenDefinitions();

    // レクサーを初期化
    this.dynamicLexer = new DynamicLexer(tokenDefinitions);

    // パーサーを初期化
    this.parser = new GenericParser(this.dynamicLexer);

    // テーマを解決
    const themeConfig = this.options.theme 
      ? { parentTheme: this.options.theme, theme: config.themeConfig.theme }
      : config.themeConfig;
    const resolvedTheme = this.themeResolver.resolveTheme(themeConfig);

    // ビジターを初期化
    this.visitor = new GenericVisitor(this.parser, {
      theme: resolvedTheme,
      showRelativeTime: this.options.relativeTime,
    });

    // デバッグジェネレーターを初期化
    if (this.options.debug || this.options.debugJson) {
      this.debugGenerator = new DebugOutputGenerator(this.dynamicLexer, this.parser);
    }
  }

  /**
   * 入力を処理
   */
  async processInput(input: NodeJS.ReadStream | fs.ReadStream): Promise<void> {
    const rl = readline.createInterface({
      input,
      output: process.stdout,
      terminal: false,
    });

    const debugOutputs: any[] = [];

    for await (const line of rl) {
      if (this.options.debug || this.options.debugJson) {
        // デバッグモード
        const debugInfo = this.debugGenerator!.generateDebugOutput(line);
        debugOutputs.push(...debugInfo);
        
        if (!this.options.debugJson) {
          // 通常のデバッグ出力
          console.log(this.debugGenerator!.formatDebugOutput(debugInfo));
        }
      } else {
        // 通常モード：色付けして出力
        const colorized = this.processLine(line);
        console.log(colorized);
      }
    }

    // デバッグJSONモードの場合、最後にまとめて出力
    if (this.options.debugJson && debugOutputs.length > 0) {
      if (this.options.debugJson === true) {
        // 整形されたJSON
        console.log(this.debugGenerator!.formatDebugOutput(debugOutputs));
      } else {
        // JSONL形式
        console.log(this.debugGenerator!.formatDebugOutputAsJsonl(debugOutputs));
      }
    }
  }

  /**
   * 単一行を処理
   */
  private processLine(line: string): string {
    if (!this.parser || !this.visitor) {
      return line;
    }

    try {
      const parseResult = this.parser.parse(line);
      
      if (parseResult.parseErrors.length > 0) {
        // パースエラーがある場合は元のテキストを返す
        return line;
      }

      // CSTを訪問して色付け
      return this.visitor.visit(parseResult.cst);
    } catch (error) {
      // エラーが発生した場合は元のテキストを返す
      console.error("Error processing line:", error);
      return line;
    }
  }

  /**
   * 利用可能なテーマをリスト表示
   */
  listThemes(): void {
    const themes = this.themeResolver.getAvailableThemes();
    console.log("Available themes:");
    for (const theme of themes) {
      console.log(`  - ${theme}`);
    }
  }
}

/**
 * メイン関数
 */
async function main() {
  const program = new Command();

  program
    .name("colorize")
    .description("Colorize log output with rule-based tokenization")
    .version(version)
    .option("-t, --theme <theme>", "color theme to use")
    .option("-r, --relative-time", "show relative time for timestamps")
    .option("--timestamp-first", "deduplicate timestamps (keep first)")
    .option("--timestamp-format <format>", "timestamp format for deduplication")
    .option("-m, --multiline", "enable multiline mode")
    .option("-d, --debug", "enable debug output")
    .option("--debug-json [format]", "output debug info as JSON (format: json or jsonl)")
    .option("--list-themes", "list available themes")
    .argument("[file]", "file to process (default: stdin)")
    .action(async (file, options: CliOptions) => {
      const cli = new ColorizeCli(options);

      // テーマ一覧表示
      if (options.listThemes) {
        cli.listThemes();
        process.exit(0);
      }

      // システムを初期化
      await cli.initialize();

      // 入力ソースを決定
      const input = file ? fs.createReadStream(file) : process.stdin;

      // 入力を処理
      await cli.processInput(input);
    });

  await program.parseAsync(process.argv);
}

// エラーハンドリング
process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// メイン関数を実行
if (require.main === module) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}