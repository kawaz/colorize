# Chevrotain + Chalk によるログパーサーと色付けシステム実装ガイド

## 概要

このドキュメントでは、TypeScriptでChevrotainパーサージェネレータとChalk色付けライブラリを組み合わせて、高度なログパーサーと色付けシステムを実装する方法を解説します。

## 必要なパッケージ

```bash
npm install chevrotain chalk
npm install -D @types/node typescript
```

## 1. トークン定義とレクサー設定

### 基本的なトークン定義

```typescript
import { createToken, Lexer, CstParser } from 'chevrotain';
import chalk from 'chalk';

// トークン定義
const Timestamp = createToken({ 
  name: 'Timestamp', 
  pattern: /\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\]/ 
});

const LogLevel = createToken({ 
  name: 'LogLevel', 
  pattern: /\b(DEBUG|INFO|WARN|ERROR|FATAL)\b/ 
});

const StringLiteral = createToken({ 
  name: 'StringLiteral', 
  pattern: /"[^"]*"|'[^']*'/ 
});

const NumberLiteral = createToken({ 
  name: 'NumberLiteral', 
  pattern: /-?\d+(\.\d+)?/ 
});

const Keyword = createToken({ 
  name: 'Keyword', 
  pattern: /\b(if|else|while|for|return|true|false|null)\b/ 
});

const Identifier = createToken({ 
  name: 'Identifier', 
  pattern: /[a-zA-Z_]\w*/ 
});

// JSON用トークン
const JsonStart = createToken({ name: 'JsonStart', pattern: /{/ });
const JsonEnd = createToken({ name: 'JsonEnd', pattern: /}/ });
const ArrayStart = createToken({ name: 'ArrayStart', pattern: /\[/ });
const ArrayEnd = createToken({ name: 'ArrayEnd', pattern: /\]/ });
const Colon = createToken({ name: 'Colon', pattern: /:/ });
const Comma = createToken({ name: 'Comma', pattern: /,/ });

// スキップするトークン
const WhiteSpace = createToken({ 
  name: 'WhiteSpace', 
  pattern: /\s+/, 
  group: Lexer.SKIPPED 
});

const Comment = createToken({ 
  name: 'Comment', 
  pattern: /\/\/[^\n]*|\/\*[\s\S]*?\*\// 
});
```

## 2. 色付けルールシステム

### 宣言的な色付けDSL

```typescript
interface ColorRule {
  pattern: string | RegExp | ((token: any) => boolean);
  style: chalk.Chalk | ((value: string) => string);
  priority?: number;
}

class LogColorizer {
  private rules: Map<string, ColorRule[]> = new Map();

  constructor() {
    this.defineDefaultRules();
  }

  // デフォルトルールの定義
  private defineDefaultRules() {
    // タイムスタンプ
    this.addRule('Timestamp', {
      pattern: '*',
      style: chalk.gray
    });

    // ログレベルごとの色付け
    this.addRule('LogLevel', {
      pattern: (token) => token.image === 'FATAL',
      style: chalk.magenta.bold.bgRed
    });

    this.addRule('LogLevel', {
      pattern: 'ERROR',
      style: chalk.red.bold
    });

    this.addRule('LogLevel', {
      pattern: 'WARN',
      style: chalk.yellow.bold
    });

    this.addRule('LogLevel', {
      pattern: 'INFO',
      style: chalk.blue
    });

    this.addRule('LogLevel', {
      pattern: 'DEBUG',
      style: chalk.gray.dim
    });

    // 文字列リテラル
    this.addRule('StringLiteral', {
      pattern: (token) => {
        const value = token.image.slice(1, -1);
        return /error|fail|exception/i.test(value);
      },
      style: chalk.red,
      priority: 10
    });

    this.addRule('StringLiteral', {
      pattern: (token) => {
        const value = token.image.slice(1, -1);
        return /success|complete|ok/i.test(value);
      },
      style: chalk.green.bold,
      priority: 10
    });

    this.addRule('StringLiteral', {
      pattern: '*',
      style: chalk.green,
      priority: 0
    });

    // 数値リテラル
    this.addRule('NumberLiteral', {
      pattern: (token) => parseFloat(token.image) < 0,
      style: chalk.red
    });

    this.addRule('NumberLiteral', {
      pattern: (token) => parseFloat(token.image) >= 0,
      style: chalk.yellow
    });

    // キーワード
    this.addRule('Keyword', {
      pattern: '*',
      style: chalk.blue.bold
    });

    // JSON構造
    this.addRule('JsonStart', {
      pattern: '*',
      style: chalk.dim
    });

    this.addRule('JsonEnd', {
      pattern: '*',
      style: chalk.dim
    });

    // 識別子
    this.addRule('Identifier', {
      pattern: '*',
      style: chalk.white
    });

    // コメント
    this.addRule('Comment', {
      pattern: '*',
      style: chalk.gray.italic
    });
  }

  addRule(tokenType: string, rule: ColorRule) {
    if (!this.rules.has(tokenType)) {
      this.rules.set(tokenType, []);
    }
    this.rules.get(tokenType)!.push(rule);
    
    // 優先度でソート
    this.rules.get(tokenType)!.sort((a, b) => 
      (b.priority || 0) - (a.priority || 0)
    );
  }

  colorize(token: any): string {
    const rules = this.rules.get(token.tokenType.name) || [];
    
    for (const rule of rules) {
      if (this.matchesRule(token, rule)) {
        const style = typeof rule.style === 'function' 
          ? rule.style 
          : rule.style;
        return style(token.image);
      }
    }
    
    return token.image;
  }

  private matchesRule(token: any, rule: ColorRule): boolean {
    if (rule.pattern === '*') return true;
    if (typeof rule.pattern === 'function') return rule.pattern(token);
    if (rule.pattern instanceof RegExp) return rule.pattern.test(token.image);
    return token.image === rule.pattern;
  }
}
```

## 3. パーサー実装

### CSTパーサーの定義

```typescript
class LogCstParser extends CstParser {
  constructor(tokens: any[]) {
    super(tokens);
    this.performSelfAnalysis();
  }

  // ログエントリのルール
  public logEntry = this.RULE("logEntry", () => {
    this.OPTION(() => this.CONSUME(Timestamp));
    this.CONSUME(LogLevel);
    this.MANY(() => {
      this.OR([
        { ALT: () => this.SUBRULE(this.jsonValue) },
        { ALT: () => this.SUBRULE(this.plainText) },
        { ALT: () => this.CONSUME(Comment) }
      ]);
    });
  });

  // JSON値のパース
  public jsonValue = this.RULE("jsonValue", () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.jsonObject) },
      { ALT: () => this.SUBRULE(this.jsonArray) },
      { ALT: () => this.CONSUME(StringLiteral) },
      { ALT: () => this.CONSUME(NumberLiteral) },
      { ALT: () => this.CONSUME(Keyword) }
    ]);
  });

  // JSONオブジェクト
  public jsonObject = this.RULE("jsonObject", () => {
    this.CONSUME(JsonStart);
    this.MANY_SEP({
      SEP: Comma,
      DEF: () => {
        this.CONSUME(StringLiteral);
        this.CONSUME(Colon);
        this.SUBRULE(this.jsonValue);
      }
    });
    this.CONSUME(JsonEnd);
  });

  // JSON配列
  public jsonArray = this.RULE("jsonArray", () => {
    this.CONSUME(ArrayStart);
    this.MANY_SEP({
      SEP: Comma,
      DEF: () => this.SUBRULE(this.jsonValue)
    });
    this.CONSUME(ArrayEnd);
  });

  // プレーンテキスト
  public plainText = this.RULE("plainText", () => {
    this.AT_LEAST_ONE(() => {
      this.OR([
        { ALT: () => this.CONSUME(Identifier) },
        { ALT: () => this.CONSUME(StringLiteral) },
        { ALT: () => this.CONSUME(NumberLiteral) }
      ]);
    });
  });
}
```

## 4. 統合実装

### 完全なログパーサークラス

```typescript
class LogParser {
  private lexer: Lexer;
  private parser: LogCstParser;
  private colorizer: LogColorizer;

  constructor() {
    // すべてのトークンを配列にまとめる
    const allTokens = [
      WhiteSpace,  // SKIPPEDグループ
      Timestamp,
      LogLevel,
      Comment,
      
      // リテラル
      StringLiteral,
      NumberLiteral,
      Keyword,
      Identifier,
      
      // JSON構造
      JsonStart,
      JsonEnd,
      ArrayStart,
      ArrayEnd,
      Colon,
      Comma,
    ];

    this.lexer = new Lexer(allTokens);
    this.parser = new LogCstParser(allTokens);
    this.colorizer = new LogColorizer();
  }

  // カスタムルールを追加
  addColorRule(tokenType: string, rule: ColorRule) {
    this.colorizer.addRule(tokenType, rule);
  }

  // パースと色付けを実行
  parseAndColorize(input: string): string {
    const lexResult = this.lexer.tokenize(input);
    
    if (lexResult.errors.length > 0) {
      console.error(chalk.red('Lexing errors:'), lexResult.errors);
      return input;
    }

    // トークンごとに色付け
    let result = '';
    let lastOffset = 0;

    for (const token of lexResult.tokens) {
      // トークン間の空白を保持
      if (token.startOffset > lastOffset) {
        result += input.slice(lastOffset, token.startOffset);
      }
      
      // トークンを色付け
      result += this.colorizer.colorize(token);
      lastOffset = token.endOffset! + 1;
    }

    // 最後の部分を追加
    if (lastOffset < input.length) {
      result += input.slice(lastOffset);
    }

    return result;
  }

  // 構造化された出力（Visitorパターン使用時）
  parseStructured(input: string): any {
    const lexResult = this.lexer.tokenize(input);
    
    if (lexResult.errors.length > 0) {
      return { errors: lexResult.errors };
    }

    this.parser.input = lexResult.tokens;
    const cst = this.parser.logEntry();

    if (this.parser.errors.length > 0) {
      return { errors: this.parser.errors };
    }

    return cst;
  }
}
```

## 5. テーマシステム

### テーマ定義と管理

```typescript
interface Theme {
  name: string;
  tokens: Record<string, chalk.Chalk>;
  patterns?: Record<string, (value: string) => chalk.Chalk>;
}

class ThemeManager {
  private themes: Map<string, Theme> = new Map();
  private currentTheme: string = 'default';

  constructor() {
    this.registerDefaultThemes();
  }

  private registerDefaultThemes() {
    // デフォルトテーマ
    this.register({
      name: 'default',
      tokens: {
        Timestamp: chalk.gray,
        LogLevel: chalk.white,
        StringLiteral: chalk.green,
        NumberLiteral: chalk.yellow,
        Keyword: chalk.blue.bold,
        Identifier: chalk.white,
        Comment: chalk.gray.italic,
        JsonStart: chalk.dim,
        JsonEnd: chalk.dim,
      }
    });

    // Monokaiテーマ
    this.register({
      name: 'monokai',
      tokens: {
        Timestamp: chalk.hex('#75715E'),
        LogLevel: chalk.hex('#F92672'),
        StringLiteral: chalk.hex('#E6DB74'),
        NumberLiteral: chalk.hex('#AE81FF'),
        Keyword: chalk.hex('#F92672'),
        Identifier: chalk.hex('#A6E22E'),
        Comment: chalk.hex('#75715E'),
        JsonStart: chalk.hex('#F8F8F2'),
        JsonEnd: chalk.hex('#F8F8F2'),
      }
    });

    // GitHub Darkテーマ
    this.register({
      name: 'github-dark',
      tokens: {
        Timestamp: chalk.hex('#6A737D'),
        LogLevel: chalk.hex('#F97583'),
        StringLiteral: chalk.hex('#9ECBFF'),
        NumberLiteral: chalk.hex('#79B8FF'),
        Keyword: chalk.hex('#F97583'),
        Identifier: chalk.hex('#B392F0'),
        Comment: chalk.hex('#6A737D'),
        JsonStart: chalk.hex('#D1D5DA'),
        JsonEnd: chalk.hex('#D1D5DA'),
      }
    });
  }

  register(theme: Theme) {
    this.themes.set(theme.name, theme);
  }

  setTheme(name: string) {
    if (this.themes.has(name)) {
      this.currentTheme = name;
    } else {
      throw new Error(`Theme '${name}' not found`);
    }
  }

  getTheme(): Theme {
    return this.themes.get(this.currentTheme)!;
  }

  applyToColorizer(colorizer: LogColorizer): void {
    const theme = this.getTheme();
    
    // トークンごとの色を適用
    for (const [tokenType, style] of Object.entries(theme.tokens)) {
      colorizer.addRule(tokenType, {
        pattern: '*',
        style: style,
        priority: -1  // テーマの優先度は低く設定
      });
    }

    // パターンベースのルールを適用
    if (theme.patterns) {
      for (const [tokenType, patternFn] of Object.entries(theme.patterns)) {
        colorizer.addRule(tokenType, {
          pattern: (token) => true,
          style: (value) => patternFn(value)(value),
          priority: 0
        });
      }
    }
  }
}
```

## 6. 使用例

### 基本的な使用方法

```typescript
// パーサーの初期化
const parser = new LogParser();

// カスタムルールの追加
parser.addColorRule('StringLiteral', {
  pattern: /^"https?:\/\/[^"]*"$/,
  style: chalk.blue.underline,
  priority: 20
});

// ログの色付け
const logLines = [
  '[2024-01-15 10:30:45] INFO Server started on port 3000',
  '[2024-01-15 10:30:46] ERROR {"error": "Database connection failed", "code": 500}',
  '[2024-01-15 10:30:47] WARN Memory usage high: 85%',
  '[2024-01-15 10:30:48] DEBUG {"action": "user_login", "userId": 12345, "success": true}',
];

for (const line of logLines) {
  const colorized = parser.parseAndColorize(line);
  console.log(colorized);
}
```

### テーマの使用

```typescript
// テーママネージャーの初期化
const themeManager = new ThemeManager();
const parser = new LogParser();

// テーマの切り替え
themeManager.setTheme('monokai');
themeManager.applyToColorizer(parser['colorizer']);

// カスタムテーマの登録
themeManager.register({
  name: 'custom-dark',
  tokens: {
    Timestamp: chalk.hex('#444444'),
    LogLevel: chalk.hex('#00FF00'),
    StringLiteral: chalk.hex('#FFD700'),
    NumberLiteral: chalk.hex('#FF69B4'),
    // ... 他のトークン
  }
});
```

### ストリーミング対応

```typescript
import { createReadStream } from 'fs';
import { createInterface } from 'readline';

async function streamLogs(filepath: string) {
  const parser = new LogParser();
  const fileStream = createReadStream(filepath);
  const rl = createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    const colorized = parser.parseAndColorize(line);
    console.log(colorized);
  }
}

// 使用
streamLogs('./application.log');
```

## 7. 高度な機能

### エラーハイライト

```typescript
class ErrorHighlighter {
  private parser: LogParser;

  constructor(parser: LogParser) {
    this.parser = parser;
    this.setupErrorRules();
  }

  private setupErrorRules() {
    // スタックトレースのハイライト
    this.parser.addColorRule('Identifier', {
      pattern: /^at$/,
      style: chalk.red.dim,
      priority: 100
    });

    // ファイルパスのハイライト
    this.parser.addColorRule('StringLiteral', {
      pattern: (token) => {
        const value = token.image.slice(1, -1);
        return /\.(js|ts|jsx|tsx):(\d+):(\d+)/.test(value);
      },
      style: chalk.cyan.underline,
      priority: 50
    });

    // エラーコードのハイライト
    this.parser.addColorRule('Identifier', {
      pattern: /^[A-Z][A-Z0-9_]*$/,
      style: chalk.red.bold,
      priority: 30
    });
  }
}
```

### パフォーマンス最適化

```typescript
class CachedLogParser extends LogParser {
  private cache: Map<string, string> = new Map();
  private maxCacheSize: number = 1000;

  parseAndColorize(input: string): string {
    // キャッシュチェック
    if (this.cache.has(input)) {
      return this.cache.get(input)!;
    }

    // パースと色付け
    const result = super.parseAndColorize(input);

    // キャッシュに保存
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(input, result);

    return result;
  }
}
```

## まとめ

このシステムは以下の特徴を持ちます：

1. **宣言的なルール定義** - 色付けルールを簡潔に定義
2. **優先度システム** - 複数のルールが競合した場合の制御
3. **テーマサポート** - 異なる配色を簡単に切り替え
4. **拡張性** - カスタムルールやトークンの追加が容易
5. **パフォーマンス** - キャッシングやストリーミング対応

このアプローチにより、複雑なログフォーマットでも柔軟に対応でき、メンテナンスしやすいコードベースを維持できます。