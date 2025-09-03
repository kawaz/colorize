# Colorize 実装ガイド

## 実装順序と詳細設計

### 1. プロジェクトセットアップ

#### package.json
```json
{
  "name": "@kawaz/colorize",
  "version": "0.1.0",
  "type": "module",
  "bin": {
    "colorize": "./colorize.ts"
  },
  "scripts": {
    "dev": "bun run colorize.ts",
    "test": "bun test",
    "build": "bun build colorize.ts --outdir=dist --target=bun"
  },
  "dependencies": {
    "chevrotain": "^11.0.0",
    "chalk": "^5.3.0"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "bun-types": "latest"
  }
}
```

#### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "types": ["bun-types"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### 2. Lexer実装詳細

#### トークン定義の優先順位
1. 固定パターン（キーワード、記号）
2. 複雑なパターン（タイムスタンプ、IP、URL）
3. 基本パターン（文字列、数値、識別子）
4. フォールバック（Unknown）

```typescript
// src/lexer.ts
import { createToken, Lexer } from 'chevrotain';

// トークン定義（順序重要）
export const Timestamp = createToken({
  name: 'Timestamp',
  pattern: /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z?/,
});

export const IPAddress = createToken({
  name: 'IPAddress',
  pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/,
});

export const QuotedString = createToken({
  name: 'QuotedString',
  pattern: /"([^"\\]|\\.)*"|'([^'\\]|\\.)*'/,
});

// Lexerインスタンス
export const LogLexer = new Lexer(allTokens, {
  ensureOptimizations: true,
  skipValidations: false,
});
```

### 3. Parser実装詳細

#### エラー回復戦略
```typescript
// src/parser.ts
import { CstParser } from 'chevrotain';

export class LogParser extends CstParser {
  constructor() {
    super(allTokens, {
      recoveryEnabled: true,
      nodeLocationTracking: 'full',
      maxLookahead: 3,
    });
    this.performSelfAnalysis();
  }

  // ルール定義
  public logEntry = this.RULE('logEntry', () => {
    this.OPTION(() => this.SUBRULE(this.timestamp));
    this.MANY(() => this.SUBRULE(this.logContent));
  });

  public jsonObject = this.RULE('jsonObject', () => {
    this.CONSUME(LCurly);
    this.MANY_SEP({
      SEP: Comma,
      DEF: () => this.SUBRULE(this.jsonProperty),
    });
    // エラー回復: 閉じ括弧がなくても継続
    this.OPTION(() => this.CONSUME(RCurly));
  });
}
```

### 4. Visitor実装詳細

```typescript
// src/visitor.ts
import chalk from 'chalk';
import { CstNode } from 'chevrotain';

export class ColorizeVisitor extends BaseVisitor {
  constructor() {
    super();
    this.validateVisitor();
  }

  logEntry(ctx: any): string {
    let result = '';
    
    if (ctx.timestamp) {
      result += chalk.blue(this.visit(ctx.timestamp));
    }
    
    if (ctx.logContent) {
      ctx.logContent.forEach((content: any) => {
        result += this.visit(content);
      });
    }
    
    return result;
  }

  jsonProperty(ctx: any): string {
    const key = chalk.yellow(this.visit(ctx.key));
    const value = this.visit(ctx.value);
    return `${key}: ${value}`;
  }

  // 値の色付け
  stringValue(ctx: any): string {
    const text = ctx.QuotedString[0].image;
    if (text.includes('error') || text.includes('Error')) {
      return chalk.red(text);
    }
    if (text.includes('warning') || text.includes('Warning')) {
      return chalk.yellow(text);
    }
    return chalk.green(text);
  }

  numberValue(ctx: any): string {
    return chalk.cyan(ctx.Number[0].image);
  }

  ipAddress(ctx: any): string {
    return chalk.magenta(ctx.IPAddress[0].image);
  }
}
```

### 5. メインCLI実装

```typescript
#!/usr/bin/env bun
// colorize.ts

import { LogLexer } from './src/lexer';
import { LogParser } from './src/parser';
import { ColorizeVisitor } from './src/visitor';
import { joinMultilineBlocks } from './src/multiline';

interface Options {
  joinMultiline: boolean;
  theme: 'default' | 'dark' | 'light';
}

async function main() {
  const options: Options = parseArgs(process.argv.slice(2));
  
  // 標準入力から読み取り
  const input = await Bun.stdin.text();
  
  // マルチライン処理
  const processedInput = options.joinMultiline 
    ? joinMultilineBlocks(input)
    : input;
  
  // 字句解析
  const lexResult = LogLexer.tokenize(processedInput);
  
  if (lexResult.errors.length > 0) {
    console.error('Lexer errors:', lexResult.errors);
    // エラーがあっても継続
  }
  
  // 構文解析
  const parser = new LogParser();
  parser.input = lexResult.tokens;
  const cst = parser.logEntry();
  
  if (parser.errors.length > 0) {
    console.error('Parser errors:', parser.errors);
    // エラーがあっても継続
  }
  
  // 色付け
  const visitor = new ColorizeVisitor();
  const colorized = visitor.visit(cst);
  
  // 出力
  console.log(colorized);
}

function parseArgs(args: string[]): Options {
  const options: Options = {
    joinMultiline: true,
    theme: 'default',
  };
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--no-join-multiline':
        options.joinMultiline = false;
        break;
      case '--theme':
        options.theme = args[++i] as any;
        break;
    }
  }
  
  return options;
}

// エラーハンドリング
process.on('uncaughtException', (err) => {
  console.error('Error:', err.message);
  process.exit(1);
});

main().catch(console.error);
```

### 6. マルチライン処理

```typescript
// src/multiline.ts
export function joinMultilineBlocks(input: string): string {
  const lines = input.split('\n');
  const result: string[] = [];
  let currentBlock: string[] = [];
  let inBlock = false;
  
  for (const line of lines) {
    // ブロック開始の検出（インデントや継続記号）
    if (isBlockStart(line)) {
      if (currentBlock.length > 0) {
        result.push(currentBlock.join(' '));
      }
      currentBlock = [line];
      inBlock = true;
    } else if (inBlock && isBlockContinuation(line)) {
      currentBlock.push(line.trim());
    } else {
      if (currentBlock.length > 0) {
        result.push(currentBlock.join(' '));
        currentBlock = [];
      }
      result.push(line);
      inBlock = false;
    }
  }
  
  if (currentBlock.length > 0) {
    result.push(currentBlock.join(' '));
  }
  
  return result.join('\n');
}

function isBlockStart(line: string): boolean {
  // JSONオブジェクトや配列の開始を検出
  return /^\s*[{\[]/.test(line) || /:\s*[{\[]$/.test(line);
}

function isBlockContinuation(line: string): boolean {
  // インデントされた行や継続行を検出
  return /^\s+/.test(line) || /^[}\]],?$/.test(line.trim());
}
```

## テスト戦略

```typescript
// tests/lexer.test.ts
import { describe, test, expect } from 'bun:test';
import { LogLexer } from '../src/lexer';

describe('Lexer', () => {
  test('should tokenize timestamp', () => {
    const result = LogLexer.tokenize('2025-09-01T02:15:28.159Z');
    expect(result.tokens).toHaveLength(1);
    expect(result.tokens[0].tokenType.name).toBe('Timestamp');
  });
  
  test('should tokenize IP address', () => {
    const result = LogLexer.tokenize('192.168.1.1');
    expect(result.tokens).toHaveLength(1);
    expect(result.tokens[0].tokenType.name).toBe('IPAddress');
  });
});
```

## 実行例

```bash
# 基本的な使用
cat docs/sample-log-antenna-server.txt | ./colorize.ts

# マルチライン連結なし
cat docs/sample-log-antenna-gatherer.txt | ./colorize.ts --no-join-multiline

# 他のツールと組み合わせ
tail -f /var/log/app.log | ./colorize.ts | less -R
```