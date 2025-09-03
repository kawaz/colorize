#!/usr/bin/env node

import * as fs from "node:fs";
import * as readline from "node:readline";
import { Command } from "commander";
import { version } from "../package.json";
import { DynamicLexer } from "./lexer-dynamic";
import { SimpleParser } from "./parser-simple";
// 新しいシステムのインポート
import { RuleEngine } from "./rule-engine";
// import { ConfigLoader } from "./config-loader";
import { config } from "./rules-simple";
import { ThemeResolver } from "./theme-resolver";
import { SimpleVisitor } from "./visitor-simple";

interface CliOptions {
  theme?: string;
  debug?: boolean;
  listThemes?: boolean;
}

class SimpleColorizeCli {
  private ruleEngine: RuleEngine | null = null;
  private dynamicLexer: DynamicLexer | null = null;
  private parser: SimpleParser | null = null;
  private visitor: SimpleVisitor | null = null;
  private themeResolver = new ThemeResolver();
  // private configLoader = new ConfigLoader();

  constructor(private options: CliOptions) {}

  /**
   * システムを初期化
   */
  initialize(): void {
    // ルールエンジンを初期化
    this.ruleEngine = new RuleEngine({ tokens: config.tokens });
    const tokenDefinitions = this.ruleEngine.buildTokenDefinitions();

    // レクサーを初期化
    this.dynamicLexer = new DynamicLexer(tokenDefinitions);

    // パーサーを初期化
    this.parser = new SimpleParser(this.dynamicLexer);

    // テーマを解決
    const themeConfig = this.options.theme
      ? { parentTheme: this.options.theme, theme: config.theme }
      : { parentTheme: "default", theme: config.theme };
    const resolvedTheme = this.themeResolver.resolveTheme(themeConfig);

    // ビジターを初期化
    this.visitor = new SimpleVisitor(this.parser, {
      theme: resolvedTheme,
    });
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

    for await (const line of rl) {
      if (this.options.debug) {
        // デバッグモード
        const parseResult = this.parser?.parseLine(line);
        console.log(
          JSON.stringify(
            {
              line,
              tokens: parseResult.tokens.map((t) => ({
                type: t.tokenType.name,
                value: t.image,
              })),
              errors: [
                ...parseResult.lexErrors.map((e) => `Lex: ${e.message}`),
                ...parseResult.parseErrors.map((e) => `Parse: ${e.message}`),
              ],
            },
            null,
            2,
          ),
        );
      } else {
        // 通常モード：色付けして出力
        const colorized = this.processLine(line);
        console.log(colorized);
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
      const parseResult = this.parser.parseLine(line);

      if (parseResult.lexErrors.length > 0 || parseResult.parseErrors.length > 0) {
        // エラーがある場合は元のテキストを返す
        return line;
      }

      // トークンを色付け
      return this.visitor.processTokens(parseResult.tokens);
    } catch (error) {
      // エラーが発生した場合は元のテキストを返す
      if (this.options.debug) {
        console.error("Error processing line:", error);
      }
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
    .option("-t, --theme <theme>", "color theme to use", "default")
    .option("-d, --debug", "enable debug output")
    .option("--list-themes", "list available themes")
    .argument("[file]", "file to process (default: stdin)")
    .action(async (file, options: CliOptions) => {
      const cli = new SimpleColorizeCli(options);

      // テーマ一覧表示
      if (options.listThemes) {
        cli.listThemes();
        process.exit(0);
      }

      // システムを初期化
      try {
        cli.initialize();
      } catch (error) {
        console.error("Failed to initialize:", error);
        process.exit(1);
      }

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

export { SimpleColorizeCli };
