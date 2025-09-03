import * as fs from "node:fs";
import { homedir } from "node:os";
import * as path from "node:path";
import type { TokenValue } from "./rule-engine";
import type { Theme } from "./theme-resolver";

export interface UserConfig {
  tokens?: Record<string, TokenValue>;
  parentTheme?: string;
  theme?: Theme;
}

export class UserConfigLoader {
  private configPaths = [
    path.join(homedir(), ".config", "colorize", "config.ts"),
    path.join(homedir(), ".config", "colorize", "config.js"),
    path.join(homedir(), ".colorizerc.ts"),
    path.join(homedir(), ".colorizerc.js"),
    path.join(homedir(), ".colorizerc.json"),
  ];

  /**
   * ユーザー設定を読み込む
   */
  async loadUserConfig(): Promise<UserConfig | null> {
    for (const configPath of this.configPaths) {
      if (fs.existsSync(configPath)) {
        try {
          console.error(`Loading user config from ${configPath}`);

          if (configPath.endsWith(".json")) {
            // JSON設定ファイル
            const content = fs.readFileSync(configPath, "utf-8");
            return JSON.parse(content) as UserConfig;
          } else {
            // TypeScript/JavaScript設定ファイル
            const config = await this.importConfig(configPath);
            return config;
          }
        } catch (error) {
          console.error(`Failed to load config from ${configPath}:`, error);
        }
      }
    }

    return null;
  }

  /**
   * 設定ファイルを動的インポート
   */
  private async importConfig(filePath: string): Promise<UserConfig> {
    // TypeScriptファイルの場合、bunが直接実行できる
    if (filePath.endsWith(".ts")) {
      try {
        const module = await import(filePath);
        return module.default || module.config || module;
      } catch (error) {
        console.error(`Failed to import TypeScript config:`, error);
        throw error;
      }
    }

    // JavaScriptファイル
    const module = require(filePath);
    return module.default || module.config || module;
  }

  /**
   * 設定をマージ
   */
  mergeConfigs(
    baseConfig: { tokens: Record<string, TokenValue>; theme: Theme },
    userConfig: UserConfig | null,
  ): { tokens: Record<string, TokenValue>; theme: Theme; parentTheme?: string } {
    if (!userConfig) {
      return baseConfig;
    }

    // トークンをマージ
    const tokens = { ...baseConfig.tokens };
    if (userConfig.tokens) {
      Object.assign(tokens, userConfig.tokens);
    }

    // テーマをマージ
    const theme = { ...baseConfig.theme };
    if (userConfig.theme) {
      Object.assign(theme, userConfig.theme);
    }

    return {
      tokens,
      theme,
      parentTheme: userConfig.parentTheme,
    };
  }

  /**
   * サンプル設定ファイルを生成
   */
  generateSampleConfig(): string {
    return `import type { UserConfig } from "colorize";

// Colorize ユーザー設定
// このファイルは ~/.config/colorize/config.ts に配置してください

const config: UserConfig = {
  // ベースとなるビルトインテーマ ("default", "none", "monokai")
  parentTheme: "default",

  // カスタムトークン定義
  tokens: {
    // 独自のキーワードパターン
    myKeyword: /\\b(TODO|FIXME|NOTE|HACK)\\b/,
    
    // 名前付きキャプチャグループを使った複雑なパターン
    gitCommit: /(?<hash>[a-f0-9]{7,40})\\s+(?<message>.+)/,
    
    // 配列形式で複数パターン
    customError: [
      /\\bERR_[A-Z_]+\\b/,
      /\\bE[0-9]{4}\\b/,
    ],
  },

  // カスタムテーマ設定
  theme: {
    // 独自トークンの色
    myKeyword: "magenta|bold",
    
    // 名前付きグループの色
    gitCommit_hash: "yellow",
    gitCommit_message: "white",
    
    // 既存トークンの色を上書き
    string: "green",
    number: "#ff9900",
    
    // 関数による動的な色付け
    customError: (ctx) => {
      if (ctx.value.startsWith("ERR_")) {
        return "red|bold|underline";
      }
      return "red";
    },
    
    // スタイルオブジェクト形式
    timestamp: {
      color: "cyan",
      fontWeight: "bold",
    },
  },
};

export default config;
`;
  }

  /**
   * 設定ファイルパスを取得
   */
  getConfigPaths(): string[] {
    return this.configPaths;
  }
}
