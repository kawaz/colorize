#!/usr/bin/env bun

import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as readline from "node:readline";
import { Command } from "commander";
import { version } from "../package.json";
import { DynamicLexer } from "./lexer-dynamic";
import { Parser } from "./parser";
import { RuleEngine } from "./rule-engine";
import { config as basicConfig } from "./rules-basic";
import { config as complexConfig } from "./rules";
import { ThemeResolver } from "./theme-resolver";
import { Visitor } from "./visitor";
import { UserConfigLoader } from "./user-config-loader";

// デフォルトで色出力を有効化
if (!process.env.FORCE_COLOR) {
  process.env.FORCE_COLOR = "1";
}

interface CliOptions {
  theme?: string;
  debug?: boolean;
  listThemes?: boolean;
  joinMultiline?: boolean;
  deduplicateTimestamps?: boolean;
  relativeTime?: boolean;
  forceColor?: boolean;
  upgrade?: boolean;
  simple?: boolean; // シンプルルールを使用
  verbose?: boolean;
  noUserConfig?: boolean; // ユーザー設定を無視
  generateConfig?: boolean; // サンプル設定を生成
}

class RuleBasedColorizeCli {
  private ruleEngine: RuleEngine | null = null;
  private dynamicLexer: DynamicLexer | null = null;
  private parser: Parser | null = null;
  private visitor: Visitor | null = null;
  private themeResolver = new ThemeResolver();

  constructor(private options: CliOptions) {}

  /**
   * システムを初期化
   */
  async initialize(): Promise<void> {
    // ルール設定を選択
    let ruleConfig = this.options.simple ? basicConfig : complexConfig;

    // ユーザー設定を読み込み
    if (!this.options.noUserConfig) {
      const userConfigLoader = new UserConfigLoader();
      const userConfig = await userConfigLoader.loadUserConfig();
      
      if (userConfig) {
        ruleConfig = userConfigLoader.mergeConfigs(ruleConfig, userConfig);
        if (this.options.verbose) {
          console.error("User config loaded and merged");
        }
      }
    }

    // ルールエンジンを初期化
    this.ruleEngine = new RuleEngine(ruleConfig);
    const tokenDefinitions = this.ruleEngine.buildTokenDefinitions();

    if (this.options.verbose) {
      console.error(`トークン定義数: ${tokenDefinitions.length}`);
      console.error(`トークン: ${tokenDefinitions.slice(0, 5).map(d => d.name).join(", ")}...`);
    }

    // レクサーを初期化
    this.dynamicLexer = new DynamicLexer(tokenDefinitions);

    // パーサーを初期化
    this.parser = new Parser(this.dynamicLexer);

    // テーマを解決
    const themeConfig = this.options.theme
      ? { parentTheme: this.options.theme, theme: ruleConfig.theme }
      : { parentTheme: "default", theme: ruleConfig.theme };
    const resolvedTheme = this.themeResolver.resolveTheme(themeConfig);

    // ビジターを初期化
    this.visitor = new Visitor(this.parser, {
      theme: resolvedTheme,
      showRelativeTime: this.options.relativeTime,
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

    let previousLine = "";
    const timestampRegex = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/;

    for await (const line of rl) {
      let outputLine = line;

      // タイムスタンプ重複除去
      if (this.options.deduplicateTimestamps && previousLine) {
        const prevTimestamp = previousLine.match(timestampRegex)?.[0];
        const currTimestamp = line.match(timestampRegex)?.[0];
        
        if (prevTimestamp && currTimestamp && prevTimestamp === currTimestamp) {
          // 同じタイムスタンプの場合、現在行のタイムスタンプを空白で置き換え
          outputLine = line.replace(timestampRegex, " ".repeat(currTimestamp.length));
        }
      }

      if (this.options.debug) {
        // デバッグモード
        const parseResult = this.parser?.parseLine(outputLine);
        console.log(
          JSON.stringify(
            {
              line: outputLine,
              tokens: parseResult?.tokens.map((t) => ({
                type: t.tokenType.name,
                value: t.image,
              })),
              errors: [
                ...(parseResult?.lexErrors.map((e) => `Lex: ${e.message}`) || []),
                ...(parseResult?.parseErrors.map((e) => `Parse: ${e.message}`) || []),
              ],
            },
            null,
            2,
          ),
        );
      } else {
        // 通常モード：色付けして出力
        const colorized = this.processLine(outputLine);
        console.log(colorized);
      }

      previousLine = line;
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

  /**
   * アップグレード処理
   */
  async upgrade(): Promise<void> {
    console.log("Checking for updates...");
    
    try {
      // 最新バージョンを確認
      const result = execSync("npm view colorize version", { encoding: "utf-8" });
      const latestVersion = result.trim();
      
      if (latestVersion === version) {
        console.log(`Already using the latest version (${version})`);
        return;
      }

      console.log(`New version available: ${latestVersion} (current: ${version})`);
      console.log("Upgrading...");

      // アップグレード実行
      execSync("npm update -g colorize", { stdio: "inherit" });
      console.log("Successfully upgraded!");
    } catch (error) {
      console.error("Failed to upgrade:", error);
      process.exit(1);
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
    .option("-d, --debug", "enable debug output")
    .option("--list-themes", "list available themes")
    .option("-m, --join-multiline", "join multiline logs")
    .option("--deduplicate-timestamps", "remove duplicate timestamps")
    .option("-r, --relative-time", "show relative timestamps")
    .option("--force-color", "force color output")
    .option("--upgrade", "upgrade to the latest version")
    .option("--simple", "use simple rules instead of complex")
    .option("-v, --verbose", "verbose output")
    .option("--no-user-config", "ignore user configuration file")
    .option("--generate-config", "generate sample configuration file")
    .argument("[file]", "file to process (default: stdin)")
    .action(async (file, options: CliOptions) => {
      // force-colorオプション処理
      if (options.forceColor) {
        process.env.FORCE_COLOR = "1";
      }

      const cli = new RuleBasedColorizeCli(options);

      // サンプル設定生成
      if (options.generateConfig) {
        const loader = new UserConfigLoader();
        console.log(loader.generateSampleConfig());
        console.error("\nSave this to one of these locations:");
        loader.getConfigPaths().forEach(p => console.error(`  - ${p}`));
        process.exit(0);
      }

      // アップグレード処理
      if (options.upgrade) {
        await cli.upgrade();
        process.exit(0);
      }

      // テーマ一覧表示
      if (options.listThemes) {
        cli.listThemes();
        process.exit(0);
      }

      // システムを初期化
      try {
        await cli.initialize();
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

export { RuleBasedColorizeCli };