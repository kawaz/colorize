import type { ThemeValue } from "./types";

export { type ThemeValue };
export type Theme = Record<string, ThemeValue>;

export interface ThemeConfig {
  parentTheme?: string;
  theme: Theme;
}

export class ResolvedTheme {
  private resolvedTheme: Map<string, ThemeValue> = new Map();

  constructor(theme: Theme) {
    for (const [key, value] of Object.entries(theme)) {
      if (value !== undefined) {
        this.resolvedTheme.set(key, value);
      }
    }
  }

  getTheme(key: string): ThemeValue {
    return this.resolvedTheme.get(key);
  }

  hasTheme(key: string): boolean {
    return this.resolvedTheme.has(key);
  }

  getAllThemes(): Map<string, ThemeValue> {
    return new Map(this.resolvedTheme);
  }
}

export class ThemeResolver {
  private builtInThemes = new Map<string, Theme>();

  constructor() {
    this.registerBuiltInThemes();
  }

  /**
   * ビルトインテーマを登録
   */
  private registerBuiltInThemes(): void {
    // デフォルトテーマ
    this.builtInThemes.set("default", {
      // タイムスタンプ
      timestamp: "cyan",
      timestampSecondary: "blue",
      date: "cyan",
      time: "cyan",
      timezone: "cyan",
      relativeTime: "gray",

      // ログレベル
      "logLevel.fatal": "bgRed|white|bold",
      "logLevel.error": "red|bold",
      "logLevel.warn": "yellow",
      "logLevel.warning": "yellow",
      "logLevel.info": "green",
      "logLevel.debug": "gray",
      "logLevel.trace": "gray",

      // 文字列
      string: "green",
      stringError: "red",
      quotedString: "green",
      escapeSequence: "yellow",

      // 数値・リテラル
      number: "yellow",
      boolean: "yellow",
      null: "gray",
      undefined: "gray",

      // ネットワーク
      ipAddress: "cyan",
      ipAddressV4: "cyan",
      ipAddressV6: "magenta",
      url: "blue|underline",

      // HTTP
      httpMethod: "yellow|bold",
      httpStatus2xx: "green",
      httpStatus3xx: "cyan",
      httpStatus4xx: "yellow",
      httpStatus5xx: "red|bold",
      httpStatusDefault: "white",

      // ソース位置
      sourceFile: "cyan",
      sourceLineNumber: "yellow",
      sourceColumnNumber: "gray",
      sourceInfo_filename: "cyan|underline",

      // その他
      identifier: "white",
      keyword: "magenta",
      text: "white",
      symbol: "gray",
      keyValueKey: "cyan",
      keyValueEquals: "gray",
      objectArrayPattern: "gray",
    });

    // noneテーマ（色なし）
    this.builtInThemes.set("none", {});

    // monokaiテーマ
    this.builtInThemes.set("monokai", {
      timestamp: "#f92672",
      string: "#e6db74",
      number: "#ae81ff",
      boolean: "#ae81ff",
      null: "#ae81ff",
      undefined: "#ae81ff",
      keyword: "#f92672",
      identifier: "#f8f8f2",
      sourceFile: "#66d9ef",
      sourceLineNumber: "#a6e22e",
      url: "#66d9ef|underline",
    });
  }

  /**
   * テーマを解決
   */
  resolveTheme(config: ThemeConfig | Theme | string): ResolvedTheme {
    let baseTheme: Theme = {};
    let userTheme: Theme = {};

    if (typeof config === "string") {
      // テーマ名のみ指定
      baseTheme = this.getBuiltInTheme(config);
    } else if ("parentTheme" in config && "theme" in config) {
      // ThemeConfig
      if (config.parentTheme) {
        baseTheme = this.getBuiltInTheme(config.parentTheme);
      }
      userTheme = config.theme;
    } else {
      // Theme object
      userTheme = config as Theme;
      baseTheme = this.getBuiltInTheme("default");
    }

    // テーマをマージ
    const mergedTheme = this.mergeThemes(baseTheme, userTheme);
    return new ResolvedTheme(mergedTheme);
  }

  /**
   * ビルトインテーマを取得
   */
  private getBuiltInTheme(name: string): Theme {
    const theme = this.builtInThemes.get(name);
    if (!theme) {
      console.warn(`Theme '${name}' not found, using default theme`);
      return this.builtInThemes.get("default") || {};
    }
    return { ...theme };
  }

  /**
   * テーマをマージ
   */
  private mergeThemes(base: Theme, override: Theme): Theme {
    const merged = { ...base };

    for (const [key, value] of Object.entries(override)) {
      if (value === undefined) {
        // undefined で明示的に削除
        delete merged[key];
      } else {
        merged[key] = value;
      }
    }

    return merged;
  }

  /**
   * 利用可能なテーマ名のリストを取得
   */
  getAvailableThemes(): string[] {
    return Array.from(this.builtInThemes.keys());
  }
}
