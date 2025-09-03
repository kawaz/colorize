import * as fs from "fs";
import * as path from "path";
import { homedir } from "os";
import type { TokenValue } from "./rule-engine";
import type { Theme, ThemeConfig } from "./theme-resolver";
import { config as defaultConfig } from "./rules";

export interface UserConfig {
  tokens?: Record<string, TokenValue>;
  parentTheme?: string;
  theme?: Theme;
}

export interface LoadedConfig {
  tokens: Record<string, TokenValue>;
  themeConfig: ThemeConfig;
}

export class ConfigLoader {
  private userConfigPaths = [
    path.join(homedir(), ".config", "colorize", "config.ts"),
    path.join(homedir(), ".config", "colorize", "config.js"),
    path.join(homedir(), ".colorizerc.ts"),
    path.join(homedir(), ".colorizerc.js"),
  ];

  /**
   * 設定を読み込み
   */
  async loadConfig(): Promise<LoadedConfig> {
    const userConfig = await this.loadUserConfig();
    return this.mergeConfigs(defaultConfig, userConfig);
  }

  /**
   * ユーザー設定を読み込み
   */
  private async loadUserConfig(): Promise<UserConfig | null> {
    for (const configPath of this.userConfigPaths) {
      if (fs.existsSync(configPath)) {
        try {
          // TypeScript/JavaScriptファイルを動的にインポート
          const module = await this.dynamicImport(configPath);
          
          if (module.default) {
            return module.default as UserConfig;
          } else if (module.config) {
            return module.config as UserConfig;
          }
          
          return module as UserConfig;
        } catch (error) {
          console.error(`Failed to load user config from ${configPath}:`, error);
        }
      }
    }
    
    return null;
  }

  /**
   * 動的インポート（TypeScriptサポート）
   */
  private async dynamicImport(filePath: string): Promise<any> {
    if (filePath.endsWith(".ts")) {
      // TypeScriptファイルの場合は、ts-nodeまたはesbuildで処理
      try {
        // esbuildを使用してトランスパイル
        const { build } = await import("esbuild");
        const result = await build({
          entryPoints: [filePath],
          bundle: true,
          platform: "node",
          format: "cjs",
          write: false,
          external: ["chalk", "chevrotain"],
        });
        
        if (result.outputFiles && result.outputFiles.length > 0) {
          const code = result.outputFiles[0].text;
          const module = { exports: {} };
          const func = new Function("module", "exports", "require", code);
          func(module, module.exports, require);
          return module.exports;
        }
      } catch (error) {
        // esbuildが利用できない場合は、通常のrequireを試みる
        console.warn("esbuild not available, trying direct require");
      }
    }
    
    // JavaScriptファイルまたはフォールバック
    return require(filePath);
  }

  /**
   * 設定をマージ
   */
  private mergeConfigs(defaultConfig: any, userConfig: UserConfig | null): LoadedConfig {
    // トークンをマージ
    const tokens = { ...defaultConfig.tokens };
    if (userConfig?.tokens) {
      Object.assign(tokens, userConfig.tokens);
    }

    // テーマ設定を構築
    const themeConfig: ThemeConfig = {
      parentTheme: userConfig?.parentTheme || "default",
      theme: { ...defaultConfig.theme },
    };

    if (userConfig?.theme) {
      Object.assign(themeConfig.theme, userConfig.theme);
    }

    return {
      tokens,
      themeConfig,
    };
  }

  /**
   * 設定を同期的に読み込み（簡易版）
   */
  loadConfigSync(): LoadedConfig {
    const userConfig = this.loadUserConfigSync();
    return this.mergeConfigs(defaultConfig, userConfig);
  }

  /**
   * ユーザー設定を同期的に読み込み
   */
  private loadUserConfigSync(): UserConfig | null {
    for (const configPath of this.userConfigPaths) {
      if (fs.existsSync(configPath)) {
        try {
          // JavaScriptファイルのみサポート
          if (configPath.endsWith(".js")) {
            const module = require(configPath);
            
            if (module.default) {
              return module.default as UserConfig;
            } else if (module.config) {
              return module.config as UserConfig;
            }
            
            return module as UserConfig;
          }
        } catch (error) {
          console.error(`Failed to load user config from ${configPath}:`, error);
        }
      }
    }
    
    return null;
  }
}