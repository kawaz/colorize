#!/usr/bin/env bun

import { DynamicLexer } from "../src/lexer-dynamic";
import { SimpleParser } from "../src/parser-simple";
import { RuleEngine } from "../src/rule-engine";
import { ThemeResolver } from "../src/theme-resolver";
import { SimpleVisitor } from "../src/visitor-simple";

async function runSimpleTest() {
  console.log("Starting simple test...\n");

  try {
    // 1. 最小限の設定
    console.log("1. Creating minimal configuration...");
    const minimalConfig = {
      tokens: {
        timestamp: /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
        number: /\d+/,
        word: /[a-zA-Z]+/,
        space: /\s+/,
      },
    };
    console.log("   ✓ Configuration created");

    // 2. ルールエンジンを初期化
    console.log("2. Initializing rule engine...");
    const ruleEngine = new RuleEngine(minimalConfig);
    const tokenDefinitions = ruleEngine.buildTokenDefinitions();
    console.log(`   ✓ Generated ${tokenDefinitions.length} token definitions`);

    // 3. レクサーを初期化
    console.log("3. Initializing dynamic lexer...");
    const dynamicLexer = new DynamicLexer(tokenDefinitions);
    console.log("   ✓ Lexer initialized");

    // 4. パーサーを初期化
    console.log("4. Initializing simple parser...");
    const parser = new SimpleParser(dynamicLexer);
    console.log("   ✓ Parser initialized");

    // 5. テーマを設定
    console.log("5. Setting up theme...");
    const themeResolver = new ThemeResolver();
    const resolvedTheme = themeResolver.resolveTheme({
      parentTheme: "none",
      theme: {
        timestamp: "cyan",
        number: "yellow",
        word: "green",
        space: "",
      },
    });
    console.log("   ✓ Theme resolved");

    // 6. ビジターを初期化
    console.log("6. Initializing simple visitor...");
    const visitor = new SimpleVisitor(parser, {
      theme: resolvedTheme,
    });
    console.log("   ✓ Visitor initialized");

    // 7. テスト入力を処理
    console.log("\n7. Processing test inputs...");
    const testInputs = [
      "2024-01-15T10:30:45 Hello World 123",
      "test 456 another test",
      "simple line with words and 789 numbers",
    ];

    for (const input of testInputs) {
      console.log(`\nInput:  "${input}"`);

      // パース
      const parseResult = parser.parseLine(input);
      console.log(`Tokens: ${parseResult.tokens.length}`);

      if (parseResult.lexErrors.length > 0) {
        console.log(`Lex errors: ${parseResult.lexErrors.length}`);
        for (const error of parseResult.lexErrors) {
          console.log(`  - ${error.message}`);
        }
      }

      if (parseResult.parseErrors.length > 0) {
        console.log(`Parse errors: ${parseResult.parseErrors.length}`);
        for (const error of parseResult.parseErrors) {
          console.log(`  - ${error.message}`);
        }
      }

      // トークンタイプを表示
      const tokenTypes = parseResult.tokens.map((t) => t.tokenType.name).join(", ");
      console.log(`Types:  ${tokenTypes}`);

      // 色付け
      const colorized = visitor.processTokens(parseResult.tokens);
      console.log(`Output: ${colorized}`);
    }

    console.log("\n✅ Simple test completed successfully!");
  } catch (error) {
    console.error("\n❌ Simple test failed:");
    console.error(error);
    process.exit(1);
  }
}

// テストを実行
runSimpleTest();
